import {
  MERCHANT_COOLDOWN_SEC,
  MERCHANT_IDS,
  MERCHANT_VISIT_DURATION_SEC,
  type MerchantId,
  type MerchantOffer,
} from '../config/merchants';
import { FLOWERS, getFlower, type FlowerId } from '../config/flowers';
import { SECRET_RECIPES_LIST } from '../config/recipes';

export type { MerchantId, MerchantOffer };

export interface MerchantVisit {
  merchantId: MerchantId;
  arrivedAt: number;
  leavesAt: number;
  offers: MerchantOffer[];
}

export interface MerchantStateSyncResult {
  currentVisit: MerchantVisit | null;
  nextMerchantAt: number;
  status: 'visiting' | 'departed' | 'arrived' | 'idle';
}

export interface BuyOfferValidation {
  canBuy: boolean;
  reason?: string;
}

/**
 * Generates limited-stock offers for a visiting merchant.
 * - Raccoon sells discounted rare/tier 2-3 seed packs.
 * - Owl sells locked Secret Recipe scrolls (or rare orchid bundle if all recipes are unlocked).
 */
export function generateMerchantOffers(
  merchantId: MerchantId,
  unlockedRecipes: string[] = [],
  rng: () => number = Math.random
): MerchantOffer[] {
  if (merchantId === 'raccoon') {
    // Rare seeds to choose from: lavender (tier 1), sunflower (tier 2), rose (tier 2), orchid (tier 3)
    const seedCandidates: Array<{ id: FlowerId; qty: number; stock: number; discount: number }> = [
      { id: 'sunflower', qty: 3, stock: 3, discount: 0.85 },
      { id: 'rose', qty: 2, stock: 2, discount: 0.85 },
      { id: 'orchid', qty: 1, stock: 2, discount: 0.85 },
      { id: 'lavender', qty: 4, stock: 3, discount: 0.8 },
    ];

    // Shuffle and pick 2-3 distinct seed offers
    const shuffled = [...seedCandidates].sort(() => rng() - 0.5);
    const offerCount = rng() < 0.5 ? 2 : 3;
    const selected = shuffled.slice(0, offerCount);

    return selected.map((item, idx) => {
      const flower = getFlower(item.id);
      const normalCost = flower.seedPrice * item.qty;
      const price = Math.round(normalCost * item.discount);

      return {
        id: `offer_raccoon_${item.id}_${idx}_${Date.now()}`,
        type: 'seed',
        flowerId: item.id,
        title: `${flower.name} Seed Pack (${item.qty}x)`,
        description: `Freshly gathered ${flower.name} seeds from distant alpine valleys. 15% traveler discount!`,
        price,
        stock: item.stock,
        maxStock: item.stock,
        quantityPerPurchase: item.qty,
      };
    });
  }

  // Owl: Wise Herbalist
  const lockedRecipes = SECRET_RECIPES_LIST.filter(
    (recipe) => !unlockedRecipes.includes(recipe.key)
  );

  if (lockedRecipes.length > 0) {
    // Pick 1-2 locked recipes to offer as scrolls
    const shuffled = [...lockedRecipes].sort(() => rng() - 0.5);
    const count = Math.min(lockedRecipes.length, rng() < 0.6 ? 1 : 2);
    const picked = shuffled.slice(0, count);

    return picked.map((recipe, idx) => {
      const price = Math.round(140 * recipe.priceMultiplier);

      return {
        id: `offer_owl_scroll_${recipe.id}_${idx}_${Date.now()}`,
        type: 'recipe_scroll',
        recipeKey: recipe.key,
        title: `${recipe.name} Recipe Scroll`,
        description: `Parchment scroll detailing the sacred flower combination for "${recipe.name}" (${recipe.priceMultiplier}x bouquet value).`,
        price,
        stock: 1,
        maxStock: 1,
        quantityPerPurchase: 1,
      };
    });
  }

  // Fallback if the player has discovered all 6 secret recipes:
  // Owl offers rare Moon Orchid bundle with scholar blessing!
  const orchid = FLOWERS.orchid;
  return [
    {
      id: `offer_owl_master_${Date.now()}`,
      type: 'seed',
      flowerId: 'orchid',
      title: 'Grandmaster Orchid Spores (2x)',
      description: 'The Wise Owl acknowledges your mastery of all secret recipes! A gift of mystical Moon Orchid spores.',
      price: Math.round(orchid.seedPrice * 2 * 0.75), // 25% master discount
      stock: 2,
      maxStock: 2,
      quantityPerPurchase: 2,
    },
  ];
}

/**
 * Pure lazy-timer function to synchronize the traveling merchant visit cycle:
 * - Checks if the current visit has expired and should depart.
 * - Checks if the cooldown has elapsed and a new merchant should arrive.
 */
export function getMerchantState({
  currentVisit,
  nextMerchantAt,
  unlockedRecipes = [],
  now = Date.now(),
  rng = Math.random,
}: {
  currentVisit: MerchantVisit | null;
  nextMerchantAt: number;
  unlockedRecipes?: string[];
  now?: number;
  rng?: () => number;
}): MerchantStateSyncResult {
  // Case 1: Merchant is currently visiting
  if (currentVisit) {
    if (now >= currentVisit.leavesAt) {
      // Visit expired -> merchant departs
      return {
        currentVisit: null,
        nextMerchantAt: now + MERCHANT_COOLDOWN_SEC * 1000,
        status: 'departed',
      };
    }
    // Still in town!
    return {
      currentVisit,
      nextMerchantAt,
      status: 'visiting',
    };
  }

  // Case 2: No merchant currently in town
  if (now >= nextMerchantAt) {
    // Arrival! Choose merchant
    const merchantId: MerchantId =
      MERCHANT_IDS[Math.floor(rng() * MERCHANT_IDS.length)];

    const offers = generateMerchantOffers(merchantId, unlockedRecipes, rng);
    const leavesAt = now + MERCHANT_VISIT_DURATION_SEC * 1000;

    const newVisit: MerchantVisit = {
      merchantId,
      arrivedAt: now,
      leavesAt,
      offers,
    };

    return {
      currentVisit: newVisit,
      nextMerchantAt: leavesAt + MERCHANT_COOLDOWN_SEC * 1000,
      status: 'arrived',
    };
  }

  // Still on cooldown
  return {
    currentVisit: null,
    nextMerchantAt,
    status: 'idle',
  };
}

/**
 * Validates whether the player can purchase a merchant offer.
 */
export function canBuyMerchantOffer(
  offer: MerchantOffer,
  coins: number
): BuyOfferValidation {
  if (offer.stock <= 0) {
    return { canBuy: false, reason: 'This item is sold out!' };
  }

  if (coins < offer.price) {
    return {
      canBuy: false,
      reason: `Need ${offer.price} coins (have ${coins}).`,
    };
  }

  return { canBuy: true };
}
