export type DecorId =
  | 'lantern'
  | 'beehive'
  | 'gnome'
  | 'fountain'
  | 'flower_arch'
  | 'windmill';

export interface DecorDefinition {
  id: DecorId;
  displayName: string;
  icon: string;
  coinCost: number;
  reputationBonus: number;
  description: string;
  passiveEffect: string;
  anchorPosition: [number, number, number];
  rotation: [number, number, number];
}

export const DECORATIONS: Record<DecorId, DecorDefinition> = {
  lantern: {
    id: 'lantern',
    displayName: 'Bamboo Lantern',
    icon: '🏮',
    coinCost: 120,
    reputationBonus: 10,
    description: 'A handcrafted rustic bamboo lantern that casts a gentle, cozy golden luminescence across your evening garden.',
    passiveEffect: '+5% Garden growth speed from warm night light',
    anchorPosition: [-2.5, 0.18, -1.8],
    rotation: [0, 0.4, 0],
  },
  beehive: {
    id: 'beehive',
    displayName: 'Honey Beehive',
    icon: '🐝',
    coinCost: 200,
    reputationBonus: 20,
    description: 'A cozy wooden hive box inhabited by friendly pollinating bumblebees that eagerly buzz among your blooms.',
    passiveEffect: '+15% Shiny bloom chance from active bee pollination',
    anchorPosition: [-2.6, 0.18, 0.6],
    rotation: [0, 0.2, 0],
  },
  gnome: {
    id: 'gnome',
    displayName: 'Mushroom Gnome',
    icon: '🍄',
    coinCost: 150,
    reputationBonus: 15,
    description: 'A whimsical ceramic garden gnome with a pointed crimson mushroom hat, steadfastly guarding your plots from pests.',
    passiveEffect: '+1 Bonus Fertilizer from Mole Compost minigame',
    anchorPosition: [-2.4, 0.18, 2.2],
    rotation: [0, 0.6, 0],
  },
  fountain: {
    id: 'fountain',
    displayName: 'Zen Stone Fountain',
    icon: '⛲',
    coinCost: 350,
    reputationBonus: 35,
    description: 'A calming tiered river-stone fountain where sweet spring water trickles into a smooth pebbled basin.',
    passiveEffect: '+2 Bonus Water droplets from Bamboo Well minigame',
    anchorPosition: [2.5, 0.18, 0.6],
    rotation: [0, -0.3, 0],
  },
  flower_arch: {
    id: 'flower_arch',
    displayName: 'Rose Floral Arch',
    icon: '🌸',
    coinCost: 500,
    reputationBonus: 50,
    description: 'A majestic timber trellis arch intertwined with climbing crimson roses and pastel blossoms framing the garden entrance.',
    passiveEffect: '+10% Extra coin payout on all bouquet sales',
    anchorPosition: [0, 0.18, 2.7],
    rotation: [0, 0, 0],
  },
  windmill: {
    id: 'windmill',
    displayName: 'Miniature Windmill',
    icon: '🌾',
    coinCost: 650,
    reputationBonus: 70,
    description: 'A delightful timber windmill with rotating low-poly canvas sails that spin gently in the tabletop garden breeze.',
    passiveEffect: '+1 Free starter seed every morning breeze',
    anchorPosition: [2.5, 0.18, 2.3],
    rotation: [0, -0.6, 0],
  },
};

export const DECOR_IDS: DecorId[] = [
  'lantern',
  'beehive',
  'gnome',
  'fountain',
  'flower_arch',
  'windmill',
];

export const DECOR_LIST: DecorDefinition[] = DECOR_IDS.map((id) => DECORATIONS[id]);

export function getDecor(id: DecorId): DecorDefinition {
  const decor = DECORATIONS[id];
  if (!decor) {
    throw new Error(`Unknown decor ID: ${id}`);
  }
  return decor;
}
