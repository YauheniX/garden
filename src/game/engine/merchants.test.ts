import { describe, expect, it } from 'vitest';
import type { MerchantOffer } from '../config/merchants';
import { SECRET_RECIPES_LIST } from '../config/recipes';
import {
  canBuyMerchantOffer,
  generateMerchantOffers,
  getMerchantState,
  type MerchantVisit,
} from './merchants';

describe('merchants engine', () => {
  describe('generateMerchantOffers', () => {
    it('generates seed offers for Wandering Raccoon with valid stock and discount', () => {
      const offers = generateMerchantOffers('raccoon', []);
      expect(offers.length).toBeGreaterThanOrEqual(2);
      expect(offers.length).toBeLessThanOrEqual(3);

      for (const offer of offers) {
        expect(offer.type).toBe('seed');
        expect(offer.flowerId).toBeDefined();
        expect(offer.stock).toBeGreaterThan(0);
        expect(offer.price).toBeGreaterThan(0);
        expect(offer.quantityPerPurchase).toBeGreaterThanOrEqual(1);
      }
    });

    it('generates recipe scroll offers for Wise Owl selecting only locked recipes', () => {
      // 2 unlocked recipes
      const unlocked = ['daisy+daisy+tulip', 'daisy+lavender+tulip'];
      const offers = generateMerchantOffers('owl', unlocked);

      expect(offers.length).toBeGreaterThanOrEqual(1);
      for (const offer of offers) {
        expect(offer.type).toBe('recipe_scroll');
        expect(offer.recipeKey).toBeDefined();
        // Crucial test: none of the offered scrolls should be in the unlocked list!
        expect(unlocked).not.toContain(offer.recipeKey);
        expect(offer.stock).toBe(1);
      }
    });

    it('falls back to rare orchid seed bundle if all 6 secret recipes are already unlocked', () => {
      const allUnlocked = SECRET_RECIPES_LIST.map((r) => r.key);
      const offers = generateMerchantOffers('owl', allUnlocked);

      expect(offers.length).toBe(1);
      expect(offers[0].type).toBe('seed');
      expect(offers[0].flowerId).toBe('orchid');
      expect(offers[0].title).toContain('Orchid');
    });
  });

  describe('getMerchantState', () => {
    it('departs when current visit has expired', () => {
      const pastTime = 100000;
      const currentVisit: MerchantVisit = {
        merchantId: 'raccoon',
        arrivedAt: pastTime - 10000,
        leavesAt: pastTime - 10,
        offers: [],
      };

      const result = getMerchantState({
        currentVisit,
        nextMerchantAt: pastTime + 50000,
        now: pastTime,
      });

      expect(result.status).toBe('departed');
      expect(result.currentVisit).toBeNull();
      expect(result.nextMerchantAt).toBeGreaterThan(pastTime);
    });

    it('remains visiting while current visit has not expired', () => {
      const now = 100000;
      const currentVisit: MerchantVisit = {
        merchantId: 'owl',
        arrivedAt: now - 5000,
        leavesAt: now + 5000,
        offers: [],
      };

      const result = getMerchantState({
        currentVisit,
        nextMerchantAt: now + 50000,
        now,
      });

      expect(result.status).toBe('visiting');
      expect(result.currentVisit).toBe(currentVisit);
    });

    it('triggers arrival when cooldown elapsed and no merchant in town', () => {
      const now = 200000;
      const result = getMerchantState({
        currentVisit: null,
        nextMerchantAt: now - 100, // cooldown finished
        now,
      });

      expect(result.status).toBe('arrived');
      expect(result.currentVisit).not.toBeNull();
      expect(result.currentVisit?.merchantId).toBeDefined();
      expect(result.currentVisit?.offers.length).toBeGreaterThan(0);
      expect(result.currentVisit?.leavesAt).toBeGreaterThan(now);
      expect(result.nextMerchantAt).toBeGreaterThan(result.currentVisit!.leavesAt);
    });

    it('remains idle when waiting for cooldown to elapse', () => {
      const now = 200000;
      const result = getMerchantState({
        currentVisit: null,
        nextMerchantAt: now + 50000, // not yet
        now,
      });

      expect(result.status).toBe('idle');
      expect(result.currentVisit).toBeNull();
    });
  });

  describe('canBuyMerchantOffer', () => {
    const sampleOffer: MerchantOffer = {
      id: 'test_offer',
      type: 'seed',
      flowerId: 'rose',
      title: 'Rose Seeds',
      description: 'Velvet roses',
      price: 150,
      stock: 2,
      maxStock: 2,
      quantityPerPurchase: 2,
    };

    it('allows purchase when stock and coins are sufficient', () => {
      const validation = canBuyMerchantOffer(sampleOffer, 200);
      expect(validation.canBuy).toBe(true);
    });

    it('rejects purchase when item is sold out', () => {
      const soldOutOffer: MerchantOffer = { ...sampleOffer, stock: 0 };
      const validation = canBuyMerchantOffer(soldOutOffer, 500);
      expect(validation.canBuy).toBe(false);
      expect(validation.reason).toContain('sold out');
    });

    it('rejects purchase when player does not have enough coins', () => {
      const validation = canBuyMerchantOffer(sampleOffer, 100);
      expect(validation.canBuy).toBe(false);
      expect(validation.reason).toContain('Need 150 coins');
    });
  });
});
