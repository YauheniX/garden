import type { FlowerId } from './flowers';

export type FlowerQuality = 'normal' | 'rare' | 'shiny';

export const QUALITY_PRICE_MULTIPLIERS: Record<FlowerQuality, number> = {
  normal: 1.0,
  rare: 1.5,
  shiny: 2.5,
};

export interface QualityChances {
  normal: number;
  rare: number;
  shiny: number;
}

export const BASE_QUALITY_CHANCES: QualityChances = {
  normal: 0.85,
  rare: 0.12,
  shiny: 0.03,
};

export const FERTILIZED_QUALITY_CHANCES: QualityChances = {
  normal: 0.40,
  rare: 0.45,
  shiny: 0.15,
};

/**
 * Water boost gives +35% growth speed.
 */
export const WATER_GROWTH_SPEED_BOOST = 0.35;
export const WATER_SPEED_MULTIPLIER = 1 + WATER_GROWTH_SPEED_BOOST; // 1.35x

export type WeatherType = 'sunny' | 'rainy' | 'foggy';

export interface WeatherModifier {
  type: WeatherType;
  name: string;
  growthSpeedMultiplier: number;
  autoWaters: boolean;
  qualityBoost: {
    rareBonus: number;
    shinyBonus: number;
  };
  description: string;
}

export const WEATHER_CONFIG: Record<WeatherType, WeatherModifier> = {
  sunny: {
    type: 'sunny',
    name: 'Sunny',
    growthSpeedMultiplier: 1.15,
    autoWaters: false,
    qualityBoost: {
      rareBonus: 0.02,
      shinyBonus: 0.03,
    },
    description: 'Basking in bright warm sunshine. Crops grow 15% faster!',
  },
  rainy: {
    type: 'rainy',
    name: 'Rainy',
    growthSpeedMultiplier: 1.0,
    autoWaters: true, // Rain auto-waters plots (+35% water speed boost)
    qualityBoost: {
      rareBonus: 0.06,
      shinyBonus: 0.01,
    },
    description: 'Refreshing rain hydrates garden plots automatically!',
  },
  foggy: {
    type: 'foggy',
    name: 'Foggy',
    growthSpeedMultiplier: 0.9,
    autoWaters: false,
    qualityBoost: {
      rareBonus: 0.03,
      shinyBonus: 0.07, // Misty dew favors mystical shiny blossoms
    },
    description: 'Cool mist rolls across the diorama. Growth is slightly slower, but shiny blooms thrive.',
  },
};

export type GrowthStage = 'seed' | 'sprout' | 'bud' | 'bloom';

export const GROWTH_STAGE_THRESHOLDS = {
  seed: 0,
  sprout: 0.25,
  bud: 0.6,
  bloom: 1.0,
} as const;

export const BOUQUET_MIN_FLOWERS = 3;
export const BOUQUET_MAX_FLOWERS = 5;

/**
 * Diversity bonus based on unique flower species in a bouquet.
 */
export const DIVERSITY_BONUS_MULTIPLIERS: Record<number, number> = {
  1: 1.0,  // Monoculture
  2: 1.05, // 2 species (+5%)
  3: 1.15, // 3 species (+15%)
  4: 1.25, // 4 species (+25%)
  5: 1.40, // 5 species (+40%)
};

export const CUSTOM_BOUQUET_MULTIPLIER = 1.1;

export interface StartingResources {
  coins: number;
  water: number;
  fertilizer: number;
  unlockedPlots: number;
  maxPlots: number;
  seeds: Partial<Record<FlowerId, number>>;
}

export const STARTING_RESOURCES: StartingResources = {
  coins: 60,
  water: 12,
  fertilizer: 3,
  unlockedPlots: 2,
  maxPlots: 6,
  seeds: {
    daisy: 4,
    tulip: 2,
  },
};
