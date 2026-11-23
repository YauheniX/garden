export type FlowerId =
  | 'daisy'
  | 'tulip'
  | 'lavender'
  | 'sunflower'
  | 'rose'
  | 'orchid';

export type FlowerRarity = 'starter' | 'rare';

export interface FlowerDefinition {
  id: FlowerId;
  name: string;
  tags: string[];
  baseGrowthSec: number;
  seedPrice: number;
  baseSellPrice: number;
  rarity: FlowerRarity;
  tier: number;
  description: string;
}

export const FLOWERS: Record<FlowerId, FlowerDefinition> = {
  daisy: {
    id: 'daisy',
    name: 'Daisy',
    tags: ['white', 'yellow', 'starter', 'rustic', 'cheerful', 'pastoral'],
    baseGrowthSec: 15,
    seedPrice: 5,
    baseSellPrice: 10,
    rarity: 'starter',
    tier: 1,
    description: 'A modest white-and-yellow meadow flower that blooms quickly and warms every heart.',
  },
  tulip: {
    id: 'tulip',
    name: 'Tulip',
    tags: ['pink', 'spring', 'starter', 'sweet', 'classic', 'cup'],
    baseGrowthSec: 30,
    seedPrice: 12,
    baseSellPrice: 24,
    rarity: 'starter',
    tier: 1,
    description: 'A graceful spring blossom with soft cup petals, a favorite for friendly greetings.',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender',
    tags: ['purple', 'calming', 'starter', 'aromatic', 'cottage', 'herb'],
    baseGrowthSec: 60,
    seedPrice: 25,
    baseSellPrice: 52,
    rarity: 'starter',
    tier: 1,
    description: 'Fragrant purple spikes that emit a relaxing herbal scent cherished by sleepy pandas.',
  },
  sunflower: {
    id: 'sunflower',
    name: 'Sunflower',
    tags: ['yellow', 'radiant', 'rare', 'summer', 'tall', 'sunny'],
    baseGrowthSec: 120,
    seedPrice: 50,
    baseSellPrice: 110,
    rarity: 'rare',
    tier: 2,
    description: 'A towering golden bloom that tracks the sun, radiating warmth and pure joy.',
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    tags: ['red', 'romantic', 'rare', 'fragrant', 'classic', 'elegant'],
    baseGrowthSec: 240,
    seedPrice: 95,
    baseSellPrice: 220,
    rarity: 'rare',
    tier: 2,
    description: 'Velvety crimson petals with an enchanting perfume, symbolizing deep floral devotion.',
  },
  orchid: {
    id: 'orchid',
    name: 'Moon Orchid',
    tags: ['violet', 'mystical', 'rare', 'exotic', 'luxurious', 'nocturnal'],
    baseGrowthSec: 480,
    seedPrice: 200,
    baseSellPrice: 500,
    rarity: 'rare',
    tier: 3,
    description: 'A breathtaking and mystical orchid said to absorb moonbeams on dewy nights.',
  },
};

export const FLOWER_IDS: FlowerId[] = [
  'daisy',
  'tulip',
  'lavender',
  'sunflower',
  'rose',
  'orchid',
];

export const FLOWER_LIST: FlowerDefinition[] = FLOWER_IDS.map(
  (id) => FLOWERS[id]
);

export function isFlowerId(id: string): id is FlowerId {
  return id in FLOWERS;
}

export function getFlower(id: FlowerId): FlowerDefinition {
  const flower = FLOWERS[id];
  if (!flower) {
    throw new Error(`Unknown flower ID: ${id}`);
  }
  return flower;
}
