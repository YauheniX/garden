import {
  BOUQUET_MAX_FLOWERS,
  BOUQUET_MIN_FLOWERS,
  CUSTOM_BOUQUET_MULTIPLIER,
  DIVERSITY_BONUS_MULTIPLIERS,
  QUALITY_PRICE_MULTIPLIERS,
  type FlowerQuality,
} from '../config/balance';
import { getFlower, type FlowerId } from '../config/flowers';
import {
  RECIPE_KEY_SEPARATOR,
  SECRET_RECIPES,
  type BouquetRecipe,
} from '../config/recipes';

export interface CraftedFlowerInput {
  id: FlowerId;
  quality?: FlowerQuality;
}

export type FlowerInput = FlowerId | CraftedFlowerInput;

export interface BouquetCraftResult {
  recipeKey: string;
  recipe: BouquetRecipe | null;
  isSecretRecipe: boolean;
  bouquetName: string;
  description: string;
  flowers: Array<{
    id: FlowerId;
    name: string;
    quality: FlowerQuality;
    basePrice: number;
    qualityMultiplier: number;
    finalPrice: number;
  }>;
  baseSum: number;
  qualityAdjustedSum: number;
  uniqueSpeciesCount: number;
  diversityMultiplier: number;
  recipeMultiplier: number;
  finalPrice: number;
}

/**
 * Validates that flower count satisfies bouquet crafting limits (3..5).
 */
export function validateFlowerCount(count: number): void {
  if (count < BOUQUET_MIN_FLOWERS || count > BOUQUET_MAX_FLOWERS) {
    throw new Error(
      `Bouquet must contain between ${BOUQUET_MIN_FLOWERS} and ${BOUQUET_MAX_FLOWERS} flowers, received ${count}.`
    );
  }
}

/**
 * Checks if count is within acceptable bouquet limits (3..5).
 */
export function isValidBouquetCount(count: number): boolean {
  return count >= BOUQUET_MIN_FLOWERS && count <= BOUQUET_MAX_FLOWERS;
}

/**
 * Builds a deterministic, order-independent canonical recipe key
 * from an array of flower IDs (e.g. ['tulip', 'daisy', 'daisy'] -> 'daisy+daisy+tulip').
 */
export function buildRecipeKey(flowerIds: FlowerId[]): string {
  validateFlowerCount(flowerIds.length);
  return [...flowerIds].sort().join(RECIPE_KEY_SEPARATOR);
}

/**
 * Matches an array of flower IDs against secret bouquet recipes.
 * Order-independent. Returns BouquetRecipe or null.
 */
export function matchRecipe(flowerIds: FlowerId[]): BouquetRecipe | null {
  const key = buildRecipeKey(flowerIds);
  return SECRET_RECIPES[key] ?? null;
}

/**
 * Calculates diversity multiplier based on unique species count (1 to 5).
 */
export function calculateDiversityMultiplier(flowerIds: FlowerId[]): number {
  const uniqueCount = new Set(flowerIds).size;
  return DIVERSITY_BONUS_MULTIPLIERS[uniqueCount] ?? 1.0;
}

/**
 * Normalizes input flower array to a consistent CraftedFlowerInput structure.
 */
function normalizeFlowerInputs(
  inputs: FlowerInput[]
): Array<{ id: FlowerId; quality: FlowerQuality }> {
  validateFlowerCount(inputs.length);
  return inputs.map((input) => {
    if (typeof input === 'string') {
      return { id: input, quality: 'normal' };
    }
    return {
      id: input.id,
      quality: input.quality ?? 'normal',
    };
  });
}

/**
 * Calculates complete bouquet crafting result, including recipe matching,
 * diversity bonus, flower quality multipliers, and final sale price.
 */
export function calculateBouquetPrice(
  inputFlowers: FlowerInput[]
): BouquetCraftResult {
  const normalized = normalizeFlowerInputs(inputFlowers);
  const flowerIds = normalized.map((f) => f.id);
  const recipeKey = buildRecipeKey(flowerIds);
  const matchedRecipe = matchRecipe(flowerIds);

  let baseSum = 0;
  let qualityAdjustedSum = 0;

  const flowerBreakdowns = normalized.map(({ id, quality }) => {
    const flowerDef = getFlower(id);
    const basePrice = flowerDef.baseSellPrice;
    const qualityMultiplier = QUALITY_PRICE_MULTIPLIERS[quality];
    const flowerFinalPrice = basePrice * qualityMultiplier;

    baseSum += basePrice;
    qualityAdjustedSum += flowerFinalPrice;

    return {
      id,
      name: flowerDef.name,
      quality,
      basePrice,
      qualityMultiplier,
      finalPrice: flowerFinalPrice,
    };
  });

  const uniqueSpeciesCount = new Set(flowerIds).size;
  const diversityMultiplier = calculateDiversityMultiplier(flowerIds);

  const recipeMultiplier = matchedRecipe
    ? matchedRecipe.priceMultiplier
    : CUSTOM_BOUQUET_MULTIPLIER;

  const isSecretRecipe = matchedRecipe !== null;
  const bouquetName = matchedRecipe ? matchedRecipe.name : 'Custom Bouquet';
  const description = matchedRecipe
    ? matchedRecipe.description
    : 'A charming hand-crafted arrangement combining fresh diorama blossoms.';

  const finalPrice = Math.round(
    qualityAdjustedSum * diversityMultiplier * recipeMultiplier
  );

  return {
    recipeKey,
    recipe: matchedRecipe,
    isSecretRecipe,
    bouquetName,
    description,
    flowers: flowerBreakdowns,
    baseSum,
    qualityAdjustedSum,
    uniqueSpeciesCount,
    diversityMultiplier,
    recipeMultiplier,
    finalPrice,
  };
}

/**
 * Quick helper to get only the final price number for a bouquet.
 */
export function getBouquetPrice(inputFlowers: FlowerInput[]): number {
  return calculateBouquetPrice(inputFlowers).finalPrice;
}
