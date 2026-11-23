import type { FlowerQuality } from '../game/config/balance';
import { isFlowerId, type FlowerId } from '../game/config/flowers';
import { calculateBouquetPrice } from '../game/engine/crafting';

const FLOWER_CODE_MAP: Record<FlowerId, string> = {
  daisy: 'd',
  tulip: 't',
  lavender: 'l',
  sunflower: 's',
  rose: 'r',
  orchid: 'o',
};

const CODE_TO_FLOWER_MAP: Record<string, FlowerId> = {
  d: 'daisy',
  t: 'tulip',
  l: 'lavender',
  s: 'sunflower',
  r: 'rose',
  o: 'orchid',
};

const QUALITY_CODE_MAP: Record<FlowerQuality, string> = {
  normal: 'n',
  rare: 'r',
  shiny: 's',
};

const CODE_TO_QUALITY_MAP: Record<string, FlowerQuality> = {
  n: 'normal',
  r: 'rare',
  s: 'shiny',
};

export interface GiftFlowerItem {
  id: FlowerId;
  quality: FlowerQuality;
}

export interface DecodedGift {
  isValid: boolean;
  giftId: string;
  bouquetName: string;
  isSecretRecipe: boolean;
  flowers: GiftFlowerItem[];
  estimatedValue: number;
  bonusSeeds: { flowerId: FlowerId; count: number };
  bonusCoins: number;
  rawParam: string;
}

/**
 * Encodes 3–5 flowers and their qualities into a compact, URL-safe Telegram startapp payload.
 * Format: `g_<flowerCode><qualityCode>...` (e.g. `g_dntrrr` for daisy normal, tulip rare, rose rare).
 * Fits safely within Telegram's strict 64-character start_param length.
 */
export function encodeGift(flowers: GiftFlowerItem[]): string {
  if (flowers.length < 3 || flowers.length > 5) {
    throw new Error(
      `Gifts must contain between 3 and 5 flowers, received ${flowers.length}.`
    );
  }

  const encodedTokens = flowers
    .map((f) => {
      const fCode = FLOWER_CODE_MAP[f.id];
      const qCode = QUALITY_CODE_MAP[f.quality] ?? 'n';
      if (!fCode) {
        throw new Error(`Cannot encode unknown flower ID: ${f.id}`);
      }
      return `${fCode}${qCode}`;
    })
    .join('');

  return `g_${encodedTokens}`;
}

/**
 * Decodes a Telegram Mini App startParam into structured bouquet and bonus gift data.
 * Returns `isValid: false` if param does not match gift format or contains invalid flowers.
 */
export function decodeGift(startParam?: string | null): DecodedGift {
  if (!startParam || !startParam.startsWith('g_')) {
    return {
      isValid: false,
      giftId: '',
      bouquetName: '',
      isSecretRecipe: false,
      flowers: [],
      estimatedValue: 0,
      bonusSeeds: { flowerId: 'daisy', count: 0 },
      bonusCoins: 0,
      rawParam: startParam ?? '',
    };
  }

  const payload = startParam.slice(2);
  // Payload must consist of 2-character pairs for 3 to 5 flowers (length 6, 8, or 10)
  if (payload.length < 6 || payload.length > 10 || payload.length % 2 !== 0) {
    return {
      isValid: false,
      giftId: startParam,
      bouquetName: '',
      isSecretRecipe: false,
      flowers: [],
      estimatedValue: 0,
      bonusSeeds: { flowerId: 'daisy', count: 0 },
      bonusCoins: 0,
      rawParam: startParam,
    };
  }

  const parsedFlowers: GiftFlowerItem[] = [];

  for (let i = 0; i < payload.length; i += 2) {
    const fChar = payload[i];
    const qChar = payload[i + 1];

    const flowerId = CODE_TO_FLOWER_MAP[fChar];
    const quality = CODE_TO_QUALITY_MAP[qChar];

    if (!flowerId || !quality || !isFlowerId(flowerId)) {
      return {
        isValid: false,
        giftId: startParam,
        bouquetName: '',
        isSecretRecipe: false,
        flowers: [],
        estimatedValue: 0,
        bonusSeeds: { flowerId: 'daisy', count: 0 },
        bonusCoins: 0,
        rawParam: startParam,
      };
    }

    parsedFlowers.push({ id: flowerId, quality });
  }

  // Calculate bouquet properties
  const bouquet = calculateBouquetPrice(parsedFlowers);

  // Bonus seed calculation: higher tier bouquets give sunflower or orchid seeds!
  const hasRare = parsedFlowers.some(
    (f) => f.id === 'sunflower' || f.id === 'rose' || f.id === 'orchid'
  );
  const bonusSeeds = hasRare
    ? { flowerId: 'sunflower' as FlowerId, count: 2 }
    : { flowerId: 'tulip' as FlowerId, count: 2 };

  const bonusCoins = bouquet.isSecretRecipe ? 60 : 35;

  return {
    isValid: true,
    giftId: startParam,
    bouquetName: bouquet.bouquetName,
    isSecretRecipe: bouquet.isSecretRecipe,
    flowers: parsedFlowers,
    estimatedValue: bouquet.finalPrice,
    bonusSeeds,
    bonusCoins,
    rawParam: startParam,
  };
}
