import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  FERTILIZER_UNIT_PRICE,
  PLOT_UNLOCK_COST,
  STARTING_RESOURCES,
  WATER_UNIT_PRICE,
  type FlowerQuality,
  type WeatherType,
} from '../config/balance';
import { FLOWERS, getFlower, type FlowerId } from '../config/flowers';
import {
  calculateBouquetPrice,
  isValidBouquetCount,
  type BouquetCraftResult,
} from '../engine/crafting';
import { getPlotGrowthState, rollHarvestQuality } from '../engine/growth';
import { haptic } from '../../telegram/tma';

export interface GardenPlotState {
  id: string;
  unlocked: boolean;
  flowerId: FlowerId | null;
  plantedAt: number | null;
  wateredAt: number | null;
  fertilized: boolean;
}

export interface HarvestedFlower {
  id: string;
  flowerId: FlowerId;
  quality: FlowerQuality;
  harvestedAt: number;
}

export interface MinigameCooldowns {
  wellReadyAt: number;
  compostReadyAt: number;
}

export interface GameState {
  coins: number;
  water: number;
  fertilizer: number;
  reputation: number;
  weather: WeatherType;
  weatherUpdatedAt: number;
  plots: GardenPlotState[];
  seeds: Record<FlowerId, number>;
  harvestedFlowers: HarvestedFlower[];
  unlockedRecipes: string[];
  minigameCooldowns: MinigameCooldowns;
}

export interface GameActions {
  plantSeed: (plotId: string, flowerId: FlowerId) => boolean;
  waterPlot: (plotId: string) => boolean;
  fertilizePlot: (plotId: string) => boolean;
  harvestPlot: (plotId: string, now?: number) => HarvestedFlower | null;
  craftBouquet: (harvestedIds: string[]) => BouquetCraftResult | null;
  buySeed: (flowerId: FlowerId, qty?: number) => boolean;
  buyWater: (qty?: number) => boolean;
  buyFertilizer: (qty?: number) => boolean;
  unlockPlot: (plotId: string) => boolean;
  claimMinigameReward: (
    type: 'well' | 'compost',
    amount: number,
    cooldownSec: number
  ) => boolean;
  setWeather: (weather: WeatherType) => void;
  resetGame: () => void;
}

export type GameStore = GameState & GameActions;

export function createDefaultPlots(): GardenPlotState[] {
  return Array.from({ length: 9 }, (_, index) => ({
    id: `plot_${index}`,
    unlocked: index < 6, // first 6 unlocked, 3 locked
    flowerId: null,
    plantedAt: null,
    wateredAt: null,
    fertilized: false,
  }));
}

export function createInitialState(): GameState {
  const seedsRecord: Record<FlowerId, number> = {
    daisy: STARTING_RESOURCES.seeds.daisy ?? 4,
    tulip: STARTING_RESOURCES.seeds.tulip ?? 2,
    lavender: STARTING_RESOURCES.seeds.lavender ?? 0,
    sunflower: STARTING_RESOURCES.seeds.sunflower ?? 0,
    rose: STARTING_RESOURCES.seeds.rose ?? 0,
    orchid: STARTING_RESOURCES.seeds.orchid ?? 0,
  };

  return {
    coins: STARTING_RESOURCES.coins,
    water: STARTING_RESOURCES.water,
    fertilizer: STARTING_RESOURCES.fertilizer,
    reputation: STARTING_RESOURCES.reputation,
    weather: 'sunny',
    weatherUpdatedAt: Date.now(),
    plots: createDefaultPlots(),
    seeds: seedsRecord,
    harvestedFlowers: [],
    unlockedRecipes: [],
    minigameCooldowns: {
      wellReadyAt: 0,
      compostReadyAt: 0,
    },
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      plantSeed: (plotId, flowerId) => {
        const state = get();
        const plot = state.plots.find((p) => p.id === plotId);

        if (!plot || !plot.unlocked || plot.flowerId !== null) {
          return false;
        }

        const availableSeeds = state.seeds[flowerId] ?? 0;
        if (availableSeeds <= 0) {
          return false;
        }

        set({
          seeds: {
            ...state.seeds,
            [flowerId]: availableSeeds - 1,
          },
          plots: state.plots.map((p) =>
            p.id === plotId
              ? {
                  ...p,
                  flowerId,
                  plantedAt: Date.now(),
                  wateredAt: null,
                  fertilized: false,
                }
              : p
          ),
        });

        haptic('medium');
        return true;
      },

      waterPlot: (plotId) => {
        const state = get();
        const plot = state.plots.find((p) => p.id === plotId);

        if (!plot || !plot.unlocked || plot.flowerId === null) {
          return false;
        }

        const isRainy = state.weather === 'rainy';

        // Rainy weather waters crops for free, otherwise requires 1 water
        if (!isRainy && state.water < 1) {
          return false;
        }

        set({
          water: isRainy ? state.water : state.water - 1,
          plots: state.plots.map((p) =>
            p.id === plotId ? { ...p, wateredAt: Date.now() } : p
          ),
        });

        haptic('light');
        return true;
      },

      fertilizePlot: (plotId) => {
        const state = get();
        const plot = state.plots.find((p) => p.id === plotId);

        if (
          !plot ||
          !plot.unlocked ||
          plot.flowerId === null ||
          plot.fertilized ||
          state.fertilizer < 1
        ) {
          return false;
        }

        set({
          fertilizer: state.fertilizer - 1,
          plots: state.plots.map((p) =>
            p.id === plotId ? { ...p, fertilized: true } : p
          ),
        });

        haptic('light');
        return true;
      },

      harvestPlot: (plotId, now) => {
        const state = get();
        const plot = state.plots.find((p) => p.id === plotId);

        if (
          !plot ||
          !plot.unlocked ||
          plot.flowerId === null ||
          plot.plantedAt === null
        ) {
          return null;
        }

        const flowerDef = getFlower(plot.flowerId);
        const currentTime = now ?? Date.now();

        const growth = getPlotGrowthState({
          plantedAt: plot.plantedAt,
          baseGrowthSec: flowerDef.baseGrowthSec,
          isWatered: Boolean(plot.wateredAt),
          wateredAt: plot.wateredAt,
          weather: state.weather,
          now: currentTime,
        });

        if (growth.stage !== 'bloom') {
          return null;
        }

        const quality = rollHarvestQuality({
          isFertilized: plot.fertilized,
          weather: state.weather,
        });

        const harvestedFlower: HarvestedFlower = {
          id: `hf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          flowerId: plot.flowerId,
          quality,
          harvestedAt: currentTime,
        };

        set({
          harvestedFlowers: [...state.harvestedFlowers, harvestedFlower],
          reputation: state.reputation + 1,
          plots: state.plots.map((p) =>
            p.id === plotId
              ? {
                  ...p,
                  flowerId: null,
                  plantedAt: null,
                  wateredAt: null,
                  fertilized: false,
                }
              : p
          ),
        });

        haptic('success');
        return harvestedFlower;
      },

      craftBouquet: (harvestedIds) => {
        const state = get();

        if (!isValidBouquetCount(harvestedIds.length)) {
          return null;
        }

        // Check if all requested harvested IDs exist in inventory
        const selectedFlowers: HarvestedFlower[] = [];
        const remainingInventory = [...state.harvestedFlowers];

        for (const id of harvestedIds) {
          const index = remainingInventory.findIndex((f) => f.id === id);
          if (index === -1) {
            return null; // Missing item from inventory
          }
          selectedFlowers.push(remainingInventory[index]);
          remainingInventory.splice(index, 1);
        }

        // Format for pure crafting engine
        const craftInputs = selectedFlowers.map((f) => ({
          id: f.flowerId,
          quality: f.quality,
        }));

        const result = calculateBouquetPrice(craftInputs);

        const newUnlockedRecipes =
          result.isSecretRecipe &&
          !state.unlockedRecipes.includes(result.recipeKey)
            ? [...state.unlockedRecipes, result.recipeKey]
            : state.unlockedRecipes;

        const reputationGain = result.isSecretRecipe ? 15 : 5;

        set({
          harvestedFlowers: remainingInventory,
          coins: state.coins + result.finalPrice,
          reputation: state.reputation + reputationGain,
          unlockedRecipes: newUnlockedRecipes,
        });

        haptic(result.isSecretRecipe ? 'heavy' : 'success');
        return result;
      },

      buySeed: (flowerId, qty = 1) => {
        if (qty <= 0) return false;
        const state = get();
        const flower = FLOWERS[flowerId];
        if (!flower) return false;

        const totalCost = flower.seedPrice * qty;
        if (state.coins < totalCost) return false;

        set({
          coins: state.coins - totalCost,
          seeds: {
            ...state.seeds,
            [flowerId]: (state.seeds[flowerId] ?? 0) + qty,
          },
        });

        haptic('light');
        return true;
      },

      buyWater: (qty = 5) => {
        if (qty <= 0) return false;
        const state = get();
        const totalCost = WATER_UNIT_PRICE * qty;
        if (state.coins < totalCost) return false;

        set({
          coins: state.coins - totalCost,
          water: state.water + qty,
        });

        haptic('light');
        return true;
      },

      buyFertilizer: (qty = 1) => {
        if (qty <= 0) return false;
        const state = get();
        const totalCost = FERTILIZER_UNIT_PRICE * qty;
        if (state.coins < totalCost) return false;

        set({
          coins: state.coins - totalCost,
          fertilizer: state.fertilizer + qty,
        });

        haptic('light');
        return true;
      },

      unlockPlot: (plotId) => {
        const state = get();
        const plot = state.plots.find((p) => p.id === plotId);

        if (!plot || plot.unlocked) return false;
        if (state.coins < PLOT_UNLOCK_COST) return false;

        set({
          coins: state.coins - PLOT_UNLOCK_COST,
          plots: state.plots.map((p) =>
            p.id === plotId ? { ...p, unlocked: true } : p
          ),
        });

        haptic('success');
        return true;
      },

      claimMinigameReward: (type, amount, cooldownSec) => {
        const state = get();
        const now = Date.now();
        const cooldownKey =
          type === 'well' ? 'wellReadyAt' : 'compostReadyAt';

        if (now < state.minigameCooldowns[cooldownKey]) {
          return false;
        }

        const nextReadyAt = now + cooldownSec * 1000;

        set({
          water: type === 'well' ? state.water + amount : state.water,
          fertilizer:
            type === 'compost' ? state.fertilizer + amount : state.fertilizer,
          minigameCooldowns: {
            ...state.minigameCooldowns,
            [cooldownKey]: nextReadyAt,
          },
        });

        haptic('success');
        return true;
      },

      setWeather: (weather) => {
        set({
          weather,
          weatherUpdatedAt: Date.now(),
        });
      },

      resetGame: () => {
        set(createInitialState());
      },
    }),
    {
      name: 'panda-florist-save-v1',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage;
        }
        const memoryStore = new Map<string, string>();
        return {
          getItem: (key: string) => memoryStore.get(key) ?? null,
          setItem: (key: string, value: string) => {
            memoryStore.set(key, value);
          },
          removeItem: (key: string) => {
            memoryStore.delete(key);
          },
        };
      }),
    }
  )
);
