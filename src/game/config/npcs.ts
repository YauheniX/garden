export type AnimalNpcId = 'rabbit' | 'bear' | 'fox' | 'capybara' | 'hedgehog';

export interface AnimalNpcPalette {
  primary: string;
  secondary: string;
  accent: string;
  belly: string;
}

export interface AnimalNpcDefinition {
  id: AnimalNpcId;
  displayName: string;
  species: string;
  quote: string;
  preferredTags: string[];
  coinMultiplier: number;
  reputationReward: number;
  palette: AnimalNpcPalette;
  description: string;
}

export const NPCS: Record<AnimalNpcId, AnimalNpcDefinition> = {
  rabbit: {
    id: 'rabbit',
    displayName: 'Rosie the Rabbit',
    species: 'Meadow Bunny',
    quote: 'Hop, hop! I need a lovely, sweet bouquet to brighten my underground burrow!',
    preferredTags: ['sweet', 'spring', 'white', 'pink', 'pastoral'],
    coinMultiplier: 1.25,
    reputationReward: 3,
    palette: {
      primary: '#F3E5D8',
      secondary: '#E8A598',
      accent: '#2B2B2B',
      belly: '#FAF4EE',
    },
    description: 'A cheerful hopper who adores fragrant spring blooms with pastel colors.',
  },
  bear: {
    id: 'bear',
    displayName: 'Barnaby the Bear',
    species: 'Honey Grizzly',
    quote: 'Grrr... flowers that smell sweet as honey make my winter cave cozy.',
    preferredTags: ['yellow', 'radiant', 'summer', 'tall', 'rustic'],
    coinMultiplier: 1.4,
    reputationReward: 4,
    palette: {
      primary: '#7A4E2D',
      secondary: '#C68B59',
      accent: '#1F140D',
      belly: '#DDB386',
    },
    description: 'A gentle giant who loves sunny yellow blossoms and rustic meadow scents.',
  },
  fox: {
    id: 'fox',
    displayName: 'Felix the Fox',
    species: 'Crimson Fox',
    quote: 'A sly gentleman always brings the most elegant and passionate bouquet in town.',
    preferredTags: ['romantic', 'red', 'elegant', 'fragrant', 'rare'],
    coinMultiplier: 1.5,
    reputationReward: 5,
    palette: {
      primary: '#D95C26',
      secondary: '#FAF4EE',
      accent: '#1E1E1E',
      belly: '#F7EED8',
    },
    description: 'A dashing connoisseur with refined taste for velvety crimson roses.',
  },
  capybara: {
    id: 'capybara',
    displayName: 'Clement the Capybara',
    species: 'Zen Capybara',
    quote: 'No worries at all... just peaceful, calming herbs and soothing purple tones.',
    preferredTags: ['calming', 'purple', 'aromatic', 'herb', 'cottage'],
    coinMultiplier: 1.35,
    reputationReward: 4,
    palette: {
      primary: '#9C6E4A',
      secondary: '#6D482F',
      accent: '#2A1C12',
      belly: '#BA8D68',
    },
    description: 'The master of tranquility who loves relaxing lavender bouquets by the hot spring.',
  },
  hedgehog: {
    id: 'hedgehog',
    displayName: 'Hattie the Hedgehog',
    species: 'Pincushion Hedgehog',
    quote: 'Eee! Carefully wrapped flowers only, please! Nothing that pokes my snood!',
    preferredTags: ['cheerful', 'cup', 'starter', 'rustic', 'pastoral'],
    coinMultiplier: 1.3,
    reputationReward: 3,
    palette: {
      primary: '#5C4435',
      secondary: '#DFC6AF',
      accent: '#1B140F',
      belly: '#EADBCE',
    },
    description: 'A tiny baker with prickly quills and a warm heart for friendly daisies and tulips.',
  },
};

export const NPC_IDS: AnimalNpcId[] = [
  'rabbit',
  'bear',
  'fox',
  'capybara',
  'hedgehog',
];

export const NPC_LIST: AnimalNpcDefinition[] = NPC_IDS.map((id) => NPCS[id]);

export function getNpc(id: AnimalNpcId): AnimalNpcDefinition {
  const npc = NPCS[id];
  if (!npc) {
    throw new Error(`Unknown NPC ID: ${id}`);
  }
  return npc;
}
