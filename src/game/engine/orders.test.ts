import { describe, expect, it } from 'vitest';
import { getFlower } from '../config/flowers';
import { SECRET_RECIPES } from '../config/recipes';
import { calculateBouquetPrice } from './crafting';
import {
  calculateOrderReward,
  generateOrder,
  getAvailableFlowerTags,
  getOrderChecklist,
  validateOrderFulfillment,
  type NpcOrder,
} from './orders';

describe('orders engine', () => {
  describe('getAvailableFlowerTags', () => {
    it('returns tags from starter flowers when no recipes unlocked', () => {
      const tags = getAvailableFlowerTags([]);
      // Starter flowers: daisy, tulip, lavender
      expect(tags.has('yellow')).toBe(true);
      expect(tags.has('pink')).toBe(true);
      expect(tags.has('sweet')).toBe(true);
      expect(tags.has('purple')).toBe(true);
      expect(tags.has('calming')).toBe(true);
      // Rare tags should NOT be present
      expect(tags.has('mystical')).toBe(false);
      expect(tags.has('nocturnal')).toBe(false);
    });

    it('includes rare tags when recipes containing rare flowers are unlocked', () => {
      const tags = getAvailableFlowerTags(['lavender+rose+rose']);
      expect(tags.has('red')).toBe(true);
      expect(tags.has('romantic')).toBe(true);
      expect(tags.has('elegant')).toBe(true);
    });
  });

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

    it('strictly picks tags that exist on starter flowers across 50 iterations', () => {
      const starterTags = getAvailableFlowerTags([]);
      for (let i = 0; i < 50; i++) {
        const order = generateOrder([]);
        expect(order.type).toBe('tag_constraint');
        expect(order.requiredTag).toBeDefined();
        expect(starterTags.has(order.requiredTag!)).toBe(true);
      }
    });

    it('generates orders that can always be fulfilled using starter flowers', () => {
      const starterFlowerIds = ['daisy', 'tulip', 'lavender'] as const;

      for (let i = 0; i < 30; i++) {
        const order = generateOrder([]);
        // Find which starter flower has the required tag
        const matchingStarter = starterFlowerIds.find((id) =>
          getFlower(id).tags.includes(order.requiredTag!)
        );
        expect(matchingStarter).toBeDefined();

        // Create a bouquet fulfilling the required count with matching flowers, and pad the rest
        const flowers: Array<{ id: (typeof starterFlowerIds)[number] }> = [];
        for (let t = 0; t < (order.requiredTagCount ?? 2); t++) {
          flowers.push({ id: matchingStarter! });
        }
        while (flowers.length < order.flowerCount) {
          flowers.push({ id: 'daisy' });
        }

        const validation = validateOrderFulfillment(order, flowers);
        expect(validation.valid).toBe(true);
      }
    });

    it('can generate a secret recipe order when unlocked recipes are available', () => {
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

  describe('getOrderChecklist', () => {
    const sampleTagOrder: NpcOrder = {
      id: 'order_checklist_test',
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

    it('returns correct state when 0 flowers are selected', () => {
      const checklist = getOrderChecklist(sampleTagOrder, []);
      expect(checklist.canDeliver).toBe(false);
      expect(checklist.flowerCountOk).toBe(false);
      expect(checklist.currentFlowerCount).toBe(0);
      expect(checklist.requiredFlowerCount).toBe(3);
      expect(checklist.tagRequirementOk).toBe(false);
      expect(checklist.currentTagCount).toBe(0);
      expect(checklist.requiredTagCount).toBe(2);
      expect(checklist.reason).toContain('Select 3 more flowers');
      expect(checklist.matchingFlowerNames).toContain('Tulip');
    });

    it('reports insufficient tag count with hint when flower count is met but tags are missing', () => {
      // 3 daisies: none have 'sweet'
      const flowers = [{ id: 'daisy' as const }, { id: 'daisy' as const }, { id: 'daisy' as const }];
      const checklist = getOrderChecklist(sampleTagOrder, flowers);
      expect(checklist.canDeliver).toBe(false);
      expect(checklist.flowerCountOk).toBe(true);
      expect(checklist.tagRequirementOk).toBe(false);
      expect(checklist.currentTagCount).toBe(0);
      expect(checklist.reason).toContain('Needs 2 more "sweet" blossoms');
      expect(checklist.reason).toContain('Tulip');
    });

    it('reports canDeliver: true when all criteria are met', () => {
      // 2 tulips ('sweet') + 1 daisy
      const flowers = [{ id: 'tulip' as const }, { id: 'tulip' as const }, { id: 'daisy' as const }];
      const checklist = getOrderChecklist(sampleTagOrder, flowers);
      expect(checklist.canDeliver).toBe(true);
      expect(checklist.flowerCountOk).toBe(true);
      expect(checklist.tagRequirementOk).toBe(true);
      expect(checklist.currentTagCount).toBe(2);
      expect(checklist.reason).toBeUndefined();
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
      const flowers = [
        { id: 'tulip' as const, quality: 'normal' as const },
        { id: 'daisy' as const, quality: 'normal' as const },
        { id: 'daisy' as const, quality: 'normal' as const },
      ];

      const result = validateOrderFulfillment(sampleTagOrder, flowers);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Needs 1 more "sweet" blossom');
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
      expect(result.reason).toContain('Too many flowers');
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
      expect(invalidRes.reason).toContain('do not match recipe');
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
      expect(reward.reputation).toBe(4 + 2 + 2 + 1);
    });
  });
});
