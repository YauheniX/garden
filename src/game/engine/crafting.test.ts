import { describe, expect, it } from 'vitest';
import {
  CUSTOM_BOUQUET_MULTIPLIER,
  DIVERSITY_BONUS_MULTIPLIERS,
  QUALITY_PRICE_MULTIPLIERS,
} from '../config/balance';
import { FLOWERS, type FlowerId } from '../config/flowers';
import { SECRET_RECIPES } from '../config/recipes';
import {
  buildRecipeKey,
  calculateBouquetPrice,
  calculateDiversityMultiplier,
  getBouquetPrice,
  isValidBouquetCount,
  matchRecipe,
  validateFlowerCount,
} from './crafting';

describe('crafting engine', () => {
  describe('flower count validation', () => {
    it('accepts valid bouquet sizes (3 to 5 flowers)', () => {
      expect(isValidBouquetCount(3)).toBe(true);
      expect(isValidBouquetCount(4)).toBe(true);
      expect(isValidBouquetCount(5)).toBe(true);

      expect(() => validateFlowerCount(3)).not.toThrow();
      expect(() => validateFlowerCount(4)).not.toThrow();
      expect(() => validateFlowerCount(5)).not.toThrow();
    });

    it('rejects invalid flower counts (< 3 or > 5)', () => {
      expect(isValidBouquetCount(0)).toBe(false);
      expect(isValidBouquetCount(1)).toBe(false);
      expect(isValidBouquetCount(2)).toBe(false);
      expect(isValidBouquetCount(6)).toBe(false);
      expect(isValidBouquetCount(10)).toBe(false);

      expect(() => validateFlowerCount(0)).toThrow(/between 3 and 5/);
      expect(() => validateFlowerCount(2)).toThrow(/between 3 and 5/);
      expect(() => validateFlowerCount(6)).toThrow(/between 3 and 5/);
    });

    it('throws when calculateBouquetPrice receives fewer than 3 flowers', () => {
      expect(() =>
        calculateBouquetPrice(['daisy', 'tulip'] as FlowerId[])
      ).toThrow(/between 3 and 5/);
    });

    it('throws when calculateBouquetPrice receives more than 5 flowers', () => {
      const sixFlowers: FlowerId[] = [
        'daisy',
        'daisy',
        'tulip',
        'lavender',
        'sunflower',
        'rose',
      ];
      expect(() => calculateBouquetPrice(sixFlowers)).toThrow(/between 3 and 5/);
    });
  });

  describe('recipe key and order-independence', () => {
    it('generates canonical alphabetically sorted key with + delimiter', () => {
      const key = buildRecipeKey(['tulip', 'daisy', 'lavender']);
      expect(key).toBe('daisy+lavender+tulip');
    });

    it('handles duplicates in canonical sorted order', () => {
      const key = buildRecipeKey(['tulip', 'daisy', 'daisy']);
      expect(key).toBe('daisy+daisy+tulip');
    });

    it('is completely order-independent', () => {
      const p1 = buildRecipeKey(['orchid', 'daisy', 'sunflower']);
      const p2 = buildRecipeKey(['daisy', 'orchid', 'sunflower']);
      const p3 = buildRecipeKey(['sunflower', 'daisy', 'orchid']);

      expect(p1).toBe(p2);
      expect(p2).toBe(p3);
      expect(p1).toBe('daisy+orchid+sunflower');
    });
  });

  describe('secret recipe matching', () => {
    it('matches Spring Awakening regardless of insertion order', () => {
      const recipe = matchRecipe(['tulip', 'daisy', 'daisy']);
      expect(recipe).not.toBeNull();
      expect(recipe?.id).toBe('spring_awakening');
      expect(recipe?.name).toBe('Spring Awakening');
      expect(recipe?.priceMultiplier).toBe(1.8);
    });

    it('matches Pastoral Breeze (daisy + lavender + tulip)', () => {
      const recipe = matchRecipe(['lavender', 'tulip', 'daisy']);
      expect(recipe?.id).toBe('pastoral_breeze');
      expect(recipe?.priceMultiplier).toBe(2.0);
    });

    it("matches Panda's Romance (lavender + 2 roses)", () => {
      const recipe = matchRecipe(['rose', 'lavender', 'rose']);
      expect(recipe?.id).toBe('pandas_romance');
      expect(recipe?.priceMultiplier).toBe(2.4);
    });

    it('matches Golden Dusk (4 flowers)', () => {
      const recipe = matchRecipe([
        'tulip',
        'sunflower',
        'lavender',
        'daisy',
      ]);
      expect(recipe?.id).toBe('golden_dusk');
      expect(recipe?.priceMultiplier).toBe(2.6);
    });

    it('matches Imperial Sunburst (4 flowers with duplicate sunflower)', () => {
      const recipe = matchRecipe([
        'sunflower',
        'rose',
        'tulip',
        'sunflower',
      ]);
      expect(recipe?.id).toBe('imperial_sunburst');
      expect(recipe?.priceMultiplier).toBe(3.0);
    });

    it('matches Moonlit Serenade (5 flowers including orchid)', () => {
      const recipe = matchRecipe([
        'orchid',
        'rose',
        'sunflower',
        'lavender',
        'daisy',
      ]);
      expect(recipe?.id).toBe('moonlit_serenade');
      expect(recipe?.priceMultiplier).toBe(3.8);
    });

    it('returns null for non-secret flower combinations', () => {
      const recipe = matchRecipe(['daisy', 'daisy', 'daisy']);
      expect(recipe).toBeNull();
    });
  });

  describe('diversity bonus calculation', () => {
    it('calculates 1.0x for 1 unique species (monoculture)', () => {
      const mult = calculateDiversityMultiplier(['daisy', 'daisy', 'daisy']);
      expect(mult).toBe(DIVERSITY_BONUS_MULTIPLIERS[1]);
      expect(mult).toBe(1.0);
    });

    it('calculates 1.05x for 2 unique species', () => {
      const mult = calculateDiversityMultiplier(['daisy', 'daisy', 'tulip']);
      expect(mult).toBe(DIVERSITY_BONUS_MULTIPLIERS[2]);
      expect(mult).toBe(1.05);
    });

    it('calculates 1.15x for 3 unique species', () => {
      const mult = calculateDiversityMultiplier(['daisy', 'tulip', 'lavender']);
      expect(mult).toBe(DIVERSITY_BONUS_MULTIPLIERS[3]);
      expect(mult).toBe(1.15);
    });

    it('calculates 1.25x for 4 unique species', () => {
      const mult = calculateDiversityMultiplier([
        'daisy',
        'tulip',
        'lavender',
        'sunflower',
      ]);
      expect(mult).toBe(DIVERSITY_BONUS_MULTIPLIERS[4]);
      expect(mult).toBe(1.25);
    });

    it('calculates 1.40x for 5 unique species', () => {
      const mult = calculateDiversityMultiplier([
        'daisy',
        'tulip',
        'lavender',
        'sunflower',
        'rose',
      ]);
      expect(mult).toBe(DIVERSITY_BONUS_MULTIPLIERS[5]);
      expect(mult).toBe(1.4);
    });
  });

  describe('custom bouquet pricing', () => {
    it('prices custom 3-daisy monoculture bouquet correctly', () => {
      const result = calculateBouquetPrice(['daisy', 'daisy', 'daisy']);

      expect(result.isSecretRecipe).toBe(false);
      expect(result.bouquetName).toBe('Custom Bouquet');
      expect(result.uniqueSpeciesCount).toBe(1);
      expect(result.diversityMultiplier).toBe(1.0);
      expect(result.recipeMultiplier).toBe(CUSTOM_BOUQUET_MULTIPLIER);

      const expectedBase = FLOWERS.daisy.baseSellPrice * 3; // 10 * 3 = 30
      expect(result.baseSum).toBe(expectedBase);
      expect(result.qualityAdjustedSum).toBe(expectedBase);

      const expectedFinal = Math.round(
        expectedBase * 1.0 * CUSTOM_BOUQUET_MULTIPLIER
      );
      expect(result.finalPrice).toBe(expectedFinal);
    });

    it('prices custom 3-species bouquet including diversity bonus', () => {
      // orchid (500) + rose (220) + sunflower (110) = 830 base
      // Not a secret recipe -> Custom Bouquet multiplier 1.1
      // 3 species -> diversity multiplier 1.15
      const flowers: FlowerId[] = ['orchid', 'rose', 'sunflower'];
      const result = calculateBouquetPrice(flowers);

      expect(result.isSecretRecipe).toBe(false);
      expect(result.baseSum).toBe(830);
      expect(result.diversityMultiplier).toBe(1.15);
      expect(result.recipeMultiplier).toBe(1.1);

      const expectedPrice = Math.round(830 * 1.15 * 1.1);
      expect(result.finalPrice).toBe(expectedPrice);
    });
  });

  describe('secret recipe bouquet pricing', () => {
    it('applies secret recipe multiplier to Spring Awakening', () => {
      const result = calculateBouquetPrice(['daisy', 'daisy', 'tulip']);
      const springAwakening = SECRET_RECIPES['daisy+daisy+tulip'];

      expect(result.isSecretRecipe).toBe(true);
      expect(result.bouquetName).toBe('Spring Awakening');
      expect(result.recipeMultiplier).toBe(springAwakening.priceMultiplier);

      // base: daisy (10) + daisy (10) + tulip (24) = 44
      // 2 species -> diversity 1.05
      // secret multiplier -> 1.8
      const expected = Math.round(44 * 1.05 * 1.8);
      expect(result.finalPrice).toBe(expected);
      expect(getBouquetPrice(['daisy', 'daisy', 'tulip'])).toBe(expected);
    });
  });

  describe('flower quality multiplier in bouquets', () => {
    it('boosts bouquet price when rare or shiny flowers are used', () => {
      const normalResult = calculateBouquetPrice([
        { id: 'daisy', quality: 'normal' },
        { id: 'daisy', quality: 'normal' },
        { id: 'tulip', quality: 'normal' },
      ]);

      const shinyResult = calculateBouquetPrice([
        { id: 'daisy', quality: 'shiny' }, // 10 * 2.5 = 25
        { id: 'daisy', quality: 'normal' }, // 10 * 1.0 = 10
        { id: 'tulip', quality: 'rare' },   // 24 * 1.5 = 36
      ]);

      expect(shinyResult.baseSum).toBe(normalResult.baseSum);
      expect(shinyResult.qualityAdjustedSum).toBeGreaterThan(
        normalResult.qualityAdjustedSum
      );
      expect(shinyResult.finalPrice).toBeGreaterThan(normalResult.finalPrice);

      // qualityAdjustedSum: 25 + 10 + 36 = 71
      // diversity: 2 unique -> 1.05
      // recipe: 1.8
      const expectedShinyPrice = Math.round(71 * 1.05 * 1.8);
      expect(shinyResult.finalPrice).toBe(expectedShinyPrice);
    });

    it('verifies quality price constants', () => {
      expect(QUALITY_PRICE_MULTIPLIERS.normal).toBe(1.0);
      expect(QUALITY_PRICE_MULTIPLIERS.rare).toBe(1.5);
      expect(QUALITY_PRICE_MULTIPLIERS.shiny).toBe(2.5);
    });
  });
});
