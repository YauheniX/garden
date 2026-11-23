import type { FlowerId } from './flowers';

export type MerchantId = 'raccoon' | 'owl';

export type MerchantOfferType = 'seed' | 'recipe_scroll';

export interface MerchantOffer {
  id: string;
  type: MerchantOfferType;
  flowerId?: FlowerId;
  recipeKey?: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  maxStock: number;
  quantityPerPurchase: number;
}

export interface MerchantPalette {
  primary: string;
  secondary: string;
  accent: string;
  detail: string;
}

export interface MerchantDefinition {
  id: MerchantId;
  displayName: string;
  title: string;
  quote: string;
  description: string;
  palette: MerchantPalette;
}

/**
 * Visit timing constants:
 * - A visit lasts 15 minutes (900 seconds)
 * - The cooldown between departures and the next merchant arrival is 30 minutes (1800 seconds)
 */
export const MERCHANT_VISIT_DURATION_SEC = 900; // 15 minutes
export const MERCHANT_COOLDOWN_SEC = 1800; // 30 minutes

export const MERCHANTS: Record<MerchantId, MerchantDefinition> = {
  raccoon: {
    id: 'raccoon',
    displayName: 'Rascal the Raccoon',
    title: 'Wandering Botanist',
    quote: 'Psst! Looking for rare seeds from distant mountains? My backpack is full of wondrous flora!',
    description: 'A friendly wanderer with striped fur and a knapsack packed with rare and high-tier flower seeds.',
    palette: {
      primary: '#6B6E70',
      secondary: '#222629',
      accent: '#FAF4EE',
      detail: '#8B5A2B', // Leather pack
    },
  },
  owl: {
    id: 'owl',
    displayName: 'Professor Hoot',
    title: 'Wise Herbalist',
    quote: 'Hoo-hoo! The ancient scrolls hold secrets of legendary floral harmonies. Care to study one?',
    description: 'A venerable scholar perched on a rustic wooden post, carrying forgotten parchment scrolls of secret bouquet arrangements.',
    palette: {
      primary: '#5B4033',
      secondary: '#D4B996',
      accent: '#F59E0B', // Glowing amber eyes
      detail: '#F5EBE1', // Scroll parchment
    },
  },
};

export const MERCHANT_IDS: MerchantId[] = ['raccoon', 'owl'];

export function getMerchant(id: MerchantId): MerchantDefinition {
  const merchant = MERCHANTS[id];
  if (!merchant) {
    throw new Error(`Unknown merchant ID: ${id}`);
  }
  return merchant;
}
