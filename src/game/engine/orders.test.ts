import { describe, expect, it } from 'vitest';
import { SECRET_RECIPES } from '../config/recipes';
import { calculateBouquetPrice } from './crafting';
import {
  calculateOrderReward,
  generateOrder,
  validateOrderFulfillment,
  type NpcOrder,
} from './orders';

describe('orders engine', () => {
  describe('generateOrder', () => {
    it('generates a tag constraint order by default when no recipes unlocked', () => {
      const order = generateOrder([]);
      expect(order.id).toBeDefined();
      expect(['rabbit', 'bear', 'fox', 'capybara', 'hedgehog']).toContain(order.npcId);
      expect(order.type).toBe('tag_constraint');
      expect(order.flowerCount).toBeGreaterThanOrEqual(3);
      expect(order.flowerCount).toBeLessThanOrEqual(5);
      expect(order.requiredTag).toBeDefined();
      expect(order.requiredTagCount).toBeGreaterThanOrEqual(2);
      expect(order.rewardCoinsMultiplier).toBeGreaterThan(1.0);
      expect(order.rewardReputation).toBeGreaterThanOrEqual(3);
    });

    it('can generate a secret recipe order when unlocked recipes are available', () => {
      // Seed RNG to guarantee recipe selection:
      // index 0 for NPC, roll < 0.4 for wantsRecipe, index 0 for recipe
      let callCount = 0;
      const fakeRng = () => {
        callCount++;
        if (callCount === 1) return 0.1; // NPC index 0
        if (callCount === 2) return 0.2; // wantsRecipe < 0.4
        if (callCount === 3) return 0.05; // recipe index 0
        return 0.5;
      };

      const unlockedKey = 'daisy+daisy+tulip';
      const order = generateOrder([unlockedKey], fakeRng);

      expect(order.type).toBe('recipe');
      expect(order.requiredRecipeKey).toBe(unlockedKey);
      expect(order.recipeName).toBe(SECRET_RECIPES[unlockedKey].name);
      expect(order.flowerCount).toBe(3);
      expect(order.dialogue).toContain('Spring Awakening');
    });
  });

  describe('validateOrderFulfillment', () => {
    const sampleTagOrder: NpcOrder = {
      id: 'order_1',
      npcId: 'rabbit',
      type: 'tag_constraint',
      flowerCount: 3,
      requiredTag: 'sweet',
      requiredTagCount: 2,
      rewardCoinsMultiplier: 1.25,
      rewardReputation: 3,
      dialogue: 'I want sweet flowers!',
      createdAt: Date.now(),
    };

    it('validates a tag constraint order when requirements are satisfied', () => {
      // tulip has 'sweet', daisy has 'pastoral', 'starter' etc.
      // 2 tulips (both have 'sweet') + 1 daisy = 2 sweet flowers
      const flowers = [
        { id: 'tulip' as const, quality: 'normal' as const },
        { id: 'tulip' as const, quality: 'normal' as const },
        { id: 'daisy' as const, quality: 'normal' as const },
      ];

      const result = validateOrderFulfillment(sampleTagOrder, flowers);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('rejects a tag constraint order when tag count is insufficient', () => {
      // 1 tulip ('sweet') + 2 daisies (no 'sweet')
      const flowers = [
        { id: 'tulip' as const, quality: 'normal' as const },
        { id: 'daisy' as const, quality: 'normal' as const },
        { id: 'daisy' as const, quality: 'normal' as const },
      ];

      const result = validateOrderFulfillment(sampleTagOrder, flowers);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Needs at least 2 "sweet" flowers');
    });

    it('rejects an order when total flower count does not match requirement', () => {
      const flowers = [
        { id: 'tulip' as const },
        { id: 'tulip' as const },
        { id: 'tulip' as const },
        { id: 'tulip' as const },
      ];

      const result = validateOrderFulfillment(sampleTagOrder, flowers);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('requires exactly 3 flowers');
    });

    it('rejects orders with fewer than 3 flowers or more than 5 flowers', () => {
      const orderTwo = { ...sampleTagOrder, flowerCount: 2 };
      const resUnder = validateOrderFulfillment(orderTwo, [{ id: 'tulip' as const }, { id: 'tulip' as const }]);
      expect(resUnder.valid).toBe(false);

      const resOver = validateOrderFulfillment(sampleTagOrder, [
        { id: 'daisy' as const },
        { id: 'daisy' as const },
        { id: 'daisy' as const },
        { id: 'daisy' as const },
        { id: 'daisy' as const },
        { id: 'daisy' as const },
      ]);
      expect(resOver.valid).toBe(false);
    });

    it('validates a recipe order in an order-independent fashion', () => {
      const sampleRecipeOrder: NpcOrder = {
        id: 'order_rec',
        npcId: 'fox',
        type: 'recipe',
        flowerCount: 3,
        requiredRecipeKey: 'daisy+daisy+tulip',
        recipeName: 'Spring Awakening',
        rewardCoinsMultiplier: 1.5,
        rewardReputation: 5,
        dialogue: 'Give me Spring Awakening!',
        createdAt: Date.now(),
      };

      // Shuffled order: tulip, daisy, daisy
      const validFlowers = [
        { id: 'tulip' as const },
        { id: 'daisy' as const },
        { id: 'daisy' as const },
      ];
      expect(validateOrderFulfillment(sampleRecipeOrder, validFlowers).valid).toBe(true);

      // Wrong combination: daisy, daisy, lavender
      const invalidFlowers = [
        { id: 'lavender' as const },
        { id: 'daisy' as const },
        { id: 'daisy' as const },
      ];
      const invalidRes = validateOrderFulfillment(sampleRecipeOrder, invalidFlowers);
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.reason).toContain('Does not match');
    });
  });

  describe('calculateOrderReward', () => {
    it('calculates coin payout with bonus multiplier and awards reputation', () => {
      const order: NpcOrder = {
        id: 'order_test',
        npcId: 'capybara',
        type: 'tag_constraint',
        flowerCount: 3,
        rewardCoinsMultiplier: 1.35,
        rewardReputation: 4,
        dialogue: 'Cozy vibes...',
        createdAt: Date.now(),
      };

      const bouquet = calculateBouquetPrice([
        { id: 'lavender', quality: 'shiny' },
        { id: 'tulip', quality: 'rare' },
        { id: 'daisy', quality: 'normal' },
      ]);

      const reward = calculateOrderReward(order, bouquet);

      expect(reward.coins).toBe(Math.round(bouquet.finalPrice * 1.35));
      // Base rep 4 + 2 for secret recipe (Pastoral Breeze is daisy+lavender+tulip) + 2 for shiny + 1 for rare = 9
      expect(reward.reputation).toBe(4 + 2 + 2 + 1);
    });
  });
});
