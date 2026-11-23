import type { FlowerId } from './flowers';

export const RECIPE_KEY_SEPARATOR = '+';

export interface BouquetRecipe {
  id: string;
  key: string;
  name: string;
  description: string;
  flowers: FlowerId[];
  priceMultiplier: number;
}

/**
 * 6 secret bouquet recipes discovered through experimental crafting.
 * Keys are canonical sorted flower IDs joined with '+'.
 */
export const SECRET_RECIPES: Record<string, BouquetRecipe> = {
  'daisy+daisy+tulip': {
    id: 'spring_awakening',
    key: 'daisy+daisy+tulip',
    name: 'Spring Awakening',
    description:
      'A cheerful arrangement of morning daisies and vibrant tulips celebrating the first sunny days of spring.',
    flowers: ['daisy', 'daisy', 'tulip'],
    priceMultiplier: 1.8,
  },
  'daisy+lavender+tulip': {
    id: 'pastoral_breeze',
    key: 'daisy+lavender+tulip',
    name: 'Pastoral Breeze',
    description:
      'A soothing countryside mix blending wild daisies, sweet tulips, and fragrant lavender on a wooden porch.',
    flowers: ['daisy', 'lavender', 'tulip'],
    priceMultiplier: 2.0,
  },
  'lavender+rose+rose': {
    id: 'pandas_romance',
    key: 'lavender+rose+rose',
    name: "Panda's Romance",
    description:
      'Velvety crimson roses cushioned with calming purple lavender, crafted with heartfelt tenderness.',
    flowers: ['lavender', 'rose', 'rose'],
    priceMultiplier: 2.4,
  },
  'daisy+lavender+sunflower+tulip': {
    id: 'golden_dusk',
    key: 'daisy+lavender+sunflower+tulip',
    name: 'Golden Dusk',
    description:
      'A radiant twilight bouquet that captures the lingering warmth of the golden hour in full garden bloom.',
    flowers: ['daisy', 'lavender', 'sunflower', 'tulip'],
    priceMultiplier: 2.6,
  },
  'rose+sunflower+sunflower+tulip': {
    id: 'imperial_sunburst',
    key: 'rose+sunflower+sunflower+tulip',
    name: 'Imperial Sunburst',
    description:
      'A bold and majestic centerpiece bursting with royal sunflowers and rich red roses fit for a diorama palace.',
    flowers: ['rose', 'sunflower', 'sunflower', 'tulip'],
    priceMultiplier: 3.0,
  },
  'daisy+lavender+orchid+rose+sunflower': {
    id: 'moonlit_serenade',
    key: 'daisy+lavender+orchid+rose+sunflower',
    name: 'Moonlit Serenade',
    description:
      'The pinnacle of florist craftsmanship — a harmonious five-blossom symphony crowned by the mystical moon orchid.',
    flowers: ['daisy', 'lavender', 'orchid', 'rose', 'sunflower'],
    priceMultiplier: 3.8,
  },
};

export const SECRET_RECIPES_LIST: BouquetRecipe[] = Object.values(SECRET_RECIPES);
