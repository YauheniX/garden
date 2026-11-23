import type { FlowerQuality } from '../config/balance';
import { getFlower, type FlowerId } from '../config/flowers';
import { NPC_LIST, type AnimalNpcId } from '../config/npcs';
import { SECRET_RECIPES } from '../config/recipes';
import { buildRecipeKey, type BouquetCraftResult } from './crafting';

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

/**
 * Generates an NPC customer order with either tag-based constraints
 * or a specific secret recipe requested from unlocked recipes.
 */
export function generateOrder(
  unlockedRecipes: string[] = [],
  rng: () => number = Math.random
): NpcOrder {
  const npcIndex = Math.floor(rng() * NPC_LIST.length);
  const npc = NPC_LIST[npcIndex];

  // 40% chance to request an unlocked secret recipe if the player knows at least one
  const validUnlocked = unlockedRecipes.filter((key) => Boolean(SECRET_RECIPES[key]));
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

  // Tag-based constraint order
  const tagPool = npc.preferredTags;
  const pickedTag = tagPool[Math.floor(rng() * tagPool.length)];

  // Choose bouquet flower count: 3 (50%), 4 (30%), 5 (20%)
  const countRoll = rng();
  const flowerCount = countRoll < 0.5 ? 3 : countRoll < 0.8 ? 4 : 5;

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
 * Validates whether the selected flowers satisfy an NPC customer's order.
 */
export function validateOrderFulfillment(
  order: NpcOrder,
  selectedFlowers: Array<{ id: FlowerId; quality?: FlowerQuality }>
): OrderValidationResult {
  if (selectedFlowers.length < 3 || selectedFlowers.length > 5) {
    return {
      valid: false,
      reason: `Bouquet must contain between 3 and 5 flowers (provided ${selectedFlowers.length}).`,
    };
  }

  if (selectedFlowers.length !== order.flowerCount) {
    return {
      valid: false,
      reason: `This order requires exactly ${order.flowerCount} flowers (provided ${selectedFlowers.length}).`,
    };
  }

  if (order.type === 'recipe') {
    if (!order.requiredRecipeKey) {
      return { valid: false, reason: 'Invalid recipe order definition.' };
    }

    const recipeKey = buildRecipeKey(selectedFlowers.map((f) => f.id));
    if (recipeKey !== order.requiredRecipeKey) {
      return {
        valid: false,
        reason: `Does not match the requested recipe "${order.recipeName ?? order.requiredRecipeKey}".`,
      };
    }

    return { valid: true };
  }

  if (order.type === 'tag_constraint') {
    if (!order.requiredTag || !order.requiredTagCount) {
      return { valid: true };
    }

    let matchingCount = 0;
    for (const flower of selectedFlowers) {
      const def = getFlower(flower.id);
      if (def.tags.includes(order.requiredTag)) {
        matchingCount++;
      }
    }

    if (matchingCount < order.requiredTagCount) {
      return {
        valid: false,
        reason: `Needs at least ${order.requiredTagCount} "${order.requiredTag}" flowers (found ${matchingCount}).`,
      };
    }

    return { valid: true };
  }

  return { valid: false, reason: 'Unknown order type.' };
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
