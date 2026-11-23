import type { FlowerQuality } from '../config/balance';
import {
  FLOWERS,
  FLOWER_IDS,
  STARTER_FLOWER_IDS,
  getFlower,
  type FlowerId,
} from '../config/flowers';
import { NPC_LIST, type AnimalNpcId } from '../config/npcs';
import { SECRET_RECIPES } from '../config/recipes';
import {
  buildRecipeKey,
  isValidBouquetCount,
  type BouquetCraftResult,
} from './crafting';

export type FlowerOrderItemInput =
  | FlowerId
  | { id?: string; flowerId?: FlowerId; quality?: FlowerQuality };

/**
 * Safely resolves a FlowerId from either a string, a { flowerId },
 * or a { id } object (e.g. HarvestedFlower inventory item).
 */
export function getOrderFlowerId(f: FlowerOrderItemInput): FlowerId {
  if (typeof f === 'string') return f;
  if (typeof f === 'object' && f !== null) {
    if (f.flowerId) return f.flowerId;
    if (f.id && f.id in FLOWERS) return f.id as FlowerId;
  }
  return 'daisy';
}

export type OrderType = 'tag_constraint' | 'recipe';

export interface NpcOrder {
  id: string;
  npcId: AnimalNpcId;
  type: OrderType;
  flowerCount: number;
  requiredTag?: string;
  requiredTagCount?: number;
  requiredRecipeKey?: string;
  recipeName?: string;
  rewardCoinsMultiplier: number;
  rewardReputation: number;
  dialogue: string;
  createdAt: number;
}

export interface OrderValidationResult {
  valid: boolean;
  reason?: string;
}

export interface OrderRewardResult {
  coins: number;
  reputation: number;
}

export interface OrderChecklist {
  canDeliver: boolean;
  flowerCountOk: boolean;
  currentFlowerCount: number;
  requiredFlowerCount: number;
  tagRequirementOk: boolean;
  currentTagCount: number;
  requiredTagCount: number;
  tag?: string;
  matchingFlowerNames: string[];
  recipeRequirementOk: boolean;
  requiredRecipeName?: string;
  reason?: string;
}

/**
 * Returns the set of all flower tags currently available to the player based
 * on starter flowers and any flowers included in unlocked secret recipes.
 */
export function getAvailableFlowerTags(unlockedRecipes: string[] = []): Set<string> {
  const flowerIds = new Set<FlowerId>(STARTER_FLOWER_IDS);
  for (const recipeKey of unlockedRecipes) {
    const recipe = SECRET_RECIPES[recipeKey];
    if (recipe) {
      for (const flowerId of recipe.flowers) {
        flowerIds.add(flowerId);
      }
    }
  }

  const tags = new Set<string>();
  for (const flowerId of flowerIds) {
    const flower = getFlower(flowerId);
    if (flower) {
      for (const tag of flower.tags) {
        tags.add(tag);
      }
    }
  }
  return tags;
}

/**
 * Generates an NPC customer order with either tag-based constraints
 * or a specific secret recipe requested from unlocked recipes.
 * Only picks tags that exist on starter or currently available flowers.
 * Prevents duplicate recipe requests by excluding any recipe key already
 * occupied by waiting orders in the queue.
 */
export function generateOrder(
  unlockedRecipes: string[] = [],
  rng: () => number = Math.random,
  existingOrdersOrRecipeKeys: Array<NpcOrder | string> = []
): NpcOrder {
  const npcIndex = Math.floor(rng() * NPC_LIST.length);
  const npc = NPC_LIST[npcIndex];

  // Extract any recipe keys currently requested by existing active orders
  const occupiedRecipeKeys = new Set<string>();
  for (const item of existingOrdersOrRecipeKeys) {
    if (typeof item === 'string') {
      occupiedRecipeKeys.add(item);
    } else if (item && typeof item === 'object' && item.requiredRecipeKey) {
      occupiedRecipeKeys.add(item.requiredRecipeKey);
    }
  }

  // 40% chance to request an unlocked secret recipe if the player knows at least one
  // Only select from unlocked recipes that are NOT already requested by another active order!
  const validUnlocked = unlockedRecipes.filter(
    (key) => Boolean(SECRET_RECIPES[key]) && !occupiedRecipeKeys.has(key)
  );
  const wantsRecipe = validUnlocked.length > 0 && rng() < 0.4;

  const id = `order_${Date.now()}_${Math.floor(rng() * 10000)}`;
  const createdAt = Date.now();

  if (wantsRecipe) {
    const recipeKey = validUnlocked[Math.floor(rng() * validUnlocked.length)];
    const recipe = SECRET_RECIPES[recipeKey];

    return {
      id,
      npcId: npc.id,
      type: 'recipe',
      flowerCount: recipe.flowers.length,
      requiredRecipeKey: recipe.key,
      recipeName: recipe.name,
      rewardCoinsMultiplier: Math.round(npc.coinMultiplier * 1.15 * 100) / 100,
      rewardReputation: npc.reputationReward + 2,
      dialogue: `I've heard wonderful whispers of your "${recipe.name}" bouquet! Could you craft one for me?`,
      createdAt,
    };
  }

  // Tag-based constraint order: filter tags to ensure they exist on available flowers
  const availableTags = getAvailableFlowerTags(unlockedRecipes);
  let tagPool = npc.preferredTags.filter((tag) => availableTags.has(tag));
  if (tagPool.length === 0) {
    tagPool = Array.from(availableTags);
  }
  const pickedTag = tagPool[Math.floor(rng() * tagPool.length)];

  // For starter tier / new players (no secret recipes unlocked yet),
  // customer orders strictly request 3 flowers (the minimum bouquet size).
  // Once the player has unlocked recipes, larger 4-5 flower bouquets can be requested.
  const isStarterTier = unlockedRecipes.length === 0;
  let flowerCount = 3;
  if (!isStarterTier) {
    const countRoll = rng();
    flowerCount = countRoll < 0.6 ? 3 : countRoll < 0.85 ? 4 : 5;
  }

  // Required count of flowers containing the tag (e.g. 2 for 3 flowers, 2-3 for 4-5 flowers)
  const requiredTagCount =
    flowerCount === 3 ? 2 : Math.min(flowerCount - 1, Math.max(2, Math.floor(flowerCount * 0.6)));

  return {
    id,
    npcId: npc.id,
    type: 'tag_constraint',
    flowerCount,
    requiredTag: pickedTag,
    requiredTagCount,
    rewardCoinsMultiplier: npc.coinMultiplier,
    rewardReputation: npc.reputationReward,
    dialogue: `Could you prepare a bouquet of ${flowerCount} flowers with at least ${requiredTagCount} "${pickedTag}" blossoms?`,
    createdAt,
  };
}

/**
 * Computes a detailed checklist breakdown for an order given the player's selected flowers.
 */
export function getOrderChecklist(
  order: NpcOrder,
  selectedFlowers: Array<FlowerOrderItemInput>
): OrderChecklist {
  const currentFlowerCount = selectedFlowers.length;
  const requiredFlowerCount = order.flowerCount;
  const flowerCountOk = currentFlowerCount === requiredFlowerCount;

  if (order.type === 'recipe') {
    const requiredRecipeName = order.recipeName ?? order.requiredRecipeKey ?? 'Unknown Recipe';
    const flowerIds = selectedFlowers.map(getOrderFlowerId);
    const currentRecipeKey = isValidBouquetCount(flowerIds.length)
      ? buildRecipeKey(flowerIds)
      : null;
    const recipeRequirementOk =
      Boolean(order.requiredRecipeKey) && currentRecipeKey === order.requiredRecipeKey;

    let reason: string | undefined;
    if (!flowerCountOk) {
      if (currentFlowerCount < requiredFlowerCount) {
        const diff = requiredFlowerCount - currentFlowerCount;
        reason = `Select ${diff} more flower${diff === 1 ? '' : 's'} to match "${requiredRecipeName}" (${currentFlowerCount}/${requiredFlowerCount}).`;
      } else {
        reason = `Too many flowers for this recipe (selected ${currentFlowerCount}, requires exactly ${requiredFlowerCount}).`;
      }
    } else if (!recipeRequirementOk) {
      reason = `Selected flowers do not match recipe "${requiredRecipeName}".`;
    }

    return {
      canDeliver: flowerCountOk && recipeRequirementOk,
      flowerCountOk,
      currentFlowerCount,
      requiredFlowerCount,
      tagRequirementOk: true,
      currentTagCount: 0,
      requiredTagCount: 0,
      recipeRequirementOk,
      requiredRecipeName,
      matchingFlowerNames: [],
      reason,
    };
  }

  // Tag constraint order
  const tag = order.requiredTag ?? '';
  const requiredTagCount = order.requiredTagCount ?? 0;

  // Find all game flowers that carry this tag (for player hints)
  const matchingFlowerNames: string[] = [];
  for (const flowerId of FLOWER_IDS) {
    const flower = getFlower(flowerId);
    if (flower.tags.includes(tag)) {
      matchingFlowerNames.push(flower.name);
    }
  }

  let currentTagCount = 0;
  for (const f of selectedFlowers) {
    const flowerId = getOrderFlowerId(f);
    const flowerDef = getFlower(flowerId);
    if (flowerDef.tags.includes(tag)) {
      currentTagCount++;
    }
  }

  const tagRequirementOk = currentTagCount >= requiredTagCount;
  const canDeliver = flowerCountOk && tagRequirementOk;

  let reason: string | undefined;
  if (!flowerCountOk) {
    if (currentFlowerCount < requiredFlowerCount) {
      const diff = requiredFlowerCount - currentFlowerCount;
      reason = `Select ${diff} more flower${diff === 1 ? '' : 's'} for this order (${currentFlowerCount}/${requiredFlowerCount}).`;
    } else {
      reason = `Too many flowers (selected ${currentFlowerCount}, requires exactly ${requiredFlowerCount}).`;
    }
  } else if (!tagRequirementOk) {
    const diff = requiredTagCount - currentTagCount;
    const hint = matchingFlowerNames.length > 0 ? ` (found on: ${matchingFlowerNames.join(', ')})` : '';
    reason = `Needs ${diff} more "${tag}" blossom${diff === 1 ? '' : 's'}${hint}.`;
  }

  return {
    canDeliver,
    flowerCountOk,
    currentFlowerCount,
    requiredFlowerCount,
    tagRequirementOk,
    currentTagCount,
    requiredTagCount,
    tag,
    matchingFlowerNames,
    recipeRequirementOk: true,
    reason,
  };
}

/**
 * Validates whether the selected flowers satisfy an NPC customer's order.
 */
export function validateOrderFulfillment(
  order: NpcOrder,
  selectedFlowers: Array<FlowerOrderItemInput>
): OrderValidationResult {
  if (selectedFlowers.length < 3 || selectedFlowers.length > 5) {
    return {
      valid: false,
      reason: `Bouquet must contain between 3 and 5 flowers (provided ${selectedFlowers.length}).`,
    };
  }

  const checklist = getOrderChecklist(order, selectedFlowers);
  if (checklist.canDeliver) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: checklist.reason ?? 'Order requirements not met.',
  };
}

/**
 * Computes final coin payout and reputation earned from fulfilling an NPC order.
 */
export function calculateOrderReward(
  order: NpcOrder,
  bouquetResult: BouquetCraftResult
): OrderRewardResult {
  // Bonus coins = base bouquet price * order bonus multiplier
  const coins = Math.round(bouquetResult.finalPrice * order.rewardCoinsMultiplier);

  // Reputation = base order rep + bonus for secret recipes + bonus for shiny blossoms
  const shinyCount = bouquetResult.flowers.filter((f) => f.quality === 'shiny').length;
  const rareCount = bouquetResult.flowers.filter((f) => f.quality === 'rare').length;

  const reputation =
    order.rewardReputation +
    (bouquetResult.isSecretRecipe ? 2 : 0) +
    shinyCount * 2 +
    rareCount;

  return {
    coins,
    reputation: Math.max(1, reputation),
  };
}
