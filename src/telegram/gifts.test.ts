import { describe, expect, it } from 'vitest';
import { decodeGift, encodeGift, type GiftFlowerItem } from './gifts';

describe('Telegram gift encoding and decoding', () => {
  it('encodes and decodes a 3-flower custom bouquet correctly', () => {
    const inputFlowers: GiftFlowerItem[] = [
      { id: 'daisy', quality: 'normal' },
      { id: 'tulip', quality: 'rare' },
      { id: 'rose', quality: 'shiny' },
    ];

    const encoded = encodeGift(inputFlowers);
    expect(encoded).toBe('g_dntrrs');

    const decoded = decodeGift(encoded);
    expect(decoded.isValid).toBe(true);
    expect(decoded.flowers).toEqual(inputFlowers);
    expect(decoded.bouquetName).toBe('Custom Bouquet');
    expect(decoded.estimatedValue).toBeGreaterThan(0);
    expect(decoded.bonusSeeds.count).toBeGreaterThan(0);
    expect(decoded.bonusCoins).toBeGreaterThan(0);
  });

  it('encodes and decodes a 3-flower secret recipe bouquet (Spring Awakening)', () => {
    const inputFlowers: GiftFlowerItem[] = [
      { id: 'daisy', quality: 'normal' },
      { id: 'daisy', quality: 'normal' },
      { id: 'tulip', quality: 'shiny' },
    ];

    const encoded = encodeGift(inputFlowers);
    expect(encoded).toBe('g_dndnts');

    const decoded = decodeGift(encoded);
    expect(decoded.isValid).toBe(true);
    expect(decoded.isSecretRecipe).toBe(true);
    expect(decoded.bouquetName).toBe('Spring Awakening');
  });

  it('rejects encoding with fewer than 3 flowers or more than 5 flowers', () => {
    expect(() =>
      encodeGift([
        { id: 'daisy', quality: 'normal' },
        { id: 'tulip', quality: 'normal' },
      ])
    ).toThrow();

    expect(() =>
      encodeGift([
        { id: 'daisy', quality: 'normal' },
        { id: 'daisy', quality: 'normal' },
        { id: 'daisy', quality: 'normal' },
        { id: 'daisy', quality: 'normal' },
        { id: 'daisy', quality: 'normal' },
        { id: 'daisy', quality: 'normal' },
      ])
    ).toThrow();
  });

  it('returns isValid: false for malformed or unknown startParams', () => {
    expect(decodeGift(null).isValid).toBe(false);
    expect(decodeGift('').isValid).toBe(false);
    expect(decodeGift('ref_12345').isValid).toBe(false);
    expect(decodeGift('g_d').isValid).toBe(false); // too short
    expect(decodeGift('g_zzzzzz').isValid).toBe(false); // unknown flower codes
  });
});
