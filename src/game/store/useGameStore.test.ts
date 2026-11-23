import { beforeEach, describe, expect, it } from 'vitest';
import { FLOWERS } from '../config/flowers';
import { useGameStore } from './useGameStore';

describe('useGameStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useGameStore.getState().resetGame();
  });

  describe('initial store state', () => {
    it('initializes 9 plots with first 6 unlocked and 3 locked', () => {
      const { plots } = useGameStore.getState();
      expect(plots).toHaveLength(9);

      for (let i = 0; i < 6; i++) {
        expect(plots[i].unlocked).toBe(true);
        expect(plots[i].flowerId).toBeNull();
      }

      for (let i = 6; i < 9; i++) {
        expect(plots[i].unlocked).toBe(false);
      }
    });

    it('initializes starting resources and starter seeds', () => {
      const state = useGameStore.getState();
      expect(state.coins).toBe(60);
      expect(state.water).toBe(12);
      expect(state.fertilizer).toBe(3);
      expect(state.reputation).toBe(0);
      expect(state.seeds.daisy).toBe(4);
      expect(state.seeds.tulip).toBe(2);
      expect(state.harvestedFlowers).toEqual([]);
      expect(state.unlockedRecipes).toEqual([]);
    });
  });

  describe('planting seeds', () => {
    it('plants a seed in an unlocked empty plot and deducts 1 seed', () => {
      const success = useGameStore.getState().plantSeed('plot_0', 'daisy');
      expect(success).toBe(true);

      const state = useGameStore.getState();
      expect(state.seeds.daisy).toBe(3);

      const plot = state.plots.find((p) => p.id === 'plot_0');
      expect(plot?.flowerId).toBe('daisy');
      expect(plot?.plantedAt).toBeTypeOf('number');
      expect(plot?.wateredAt).toBeNull();
      expect(plot?.fertilized).toBe(false);
    });

    it('refuses to plant in locked plots', () => {
      const success = useGameStore.getState().plantSeed('plot_6', 'daisy');
      expect(success).toBe(false);

      const state = useGameStore.getState();
      expect(state.seeds.daisy).toBe(4);
    });

    it('refuses to plant when out of seeds', () => {
      // orchid has 0 seeds initially
      const success = useGameStore.getState().plantSeed('plot_0', 'orchid');
      expect(success).toBe(false);
    });

    it('refuses to plant in an already occupied plot', () => {
      useGameStore.getState().plantSeed('plot_0', 'daisy');
      const secondPlant = useGameStore.getState().plantSeed('plot_0', 'tulip');
      expect(secondPlant).toBe(false);
      expect(useGameStore.getState().seeds.tulip).toBe(2);
    });
  });

  describe('watering plots', () => {
    it('deducts 1 water and records wateredAt timestamp in sunny weather', () => {
      useGameStore.getState().plantSeed('plot_0', 'daisy');
      const initialWater = useGameStore.getState().water;

      const success = useGameStore.getState().waterPlot('plot_0');
      expect(success).toBe(true);

      const state = useGameStore.getState();
      expect(state.water).toBe(initialWater - 1);
      const plot = state.plots.find((p) => p.id === 'plot_0');
      expect(plot?.wateredAt).toBeTypeOf('number');
    });

    it('does NOT deduct water when weather is rainy (rain auto-water free check)', () => {
      useGameStore.getState().setWeather('rainy');
      useGameStore.getState().plantSeed('plot_0', 'daisy');
      const initialWater = useGameStore.getState().water;

      const success = useGameStore.getState().waterPlot('plot_0');
      expect(success).toBe(true);

      const state = useGameStore.getState();
      expect(state.water).toBe(initialWater); // Water is free during rain!
      const plot = state.plots.find((p) => p.id === 'plot_0');
      expect(plot?.wateredAt).toBeTypeOf('number');
    });

    it('refuses to water an empty plot', () => {
      const initialWater = useGameStore.getState().water;
      const success = useGameStore.getState().waterPlot('plot_0');
      expect(success).toBe(false);
      expect(useGameStore.getState().water).toBe(initialWater);
    });
  });

  describe('fertilizing plots', () => {
    it('deducts 1 fertilizer and marks plot as fertilized', () => {
      useGameStore.getState().plantSeed('plot_0', 'daisy');
      const initialFertilizer = useGameStore.getState().fertilizer;

      const success = useGameStore.getState().fertilizePlot('plot_0');
      expect(success).toBe(true);

      const state = useGameStore.getState();
      expect(state.fertilizer).toBe(initialFertilizer - 1);
      const plot = state.plots.find((p) => p.id === 'plot_0');
      expect(plot?.fertilized).toBe(true);
    });

    it('refuses to fertilize twice on the same plot', () => {
      useGameStore.getState().plantSeed('plot_0', 'daisy');
      useGameStore.getState().fertilizePlot('plot_0');

      const secondFertilize = useGameStore.getState().fertilizePlot('plot_0');
      expect(secondFertilize).toBe(false);
    });
  });

  describe('harvesting plots', () => {
    it('returns null if crop has not bloomed yet', () => {
      useGameStore.getState().plantSeed('plot_0', 'daisy');

      // Harvest immediately at current time
      const harvested = useGameStore.getState().harvestPlot('plot_0');
      expect(harvested).toBeNull();

      const plot = useGameStore.getState().plots.find((p) => p.id === 'plot_0');
      expect(plot?.flowerId).toBe('daisy');
    });

    it('harvests crop when growth reaches bloom stage', () => {
      useGameStore.getState().plantSeed('plot_0', 'daisy');
      const plot = useGameStore.getState().plots.find((p) => p.id === 'plot_0')!;
      const plantedAt = plot.plantedAt!;

      // Simulate time past daisy growth duration (15s)
      const futureTime = plantedAt + (FLOWERS.daisy.baseGrowthSec + 5) * 1000;

      const harvested = useGameStore.getState().harvestPlot('plot_0', futureTime);
      expect(harvested).not.toBeNull();
      expect(harvested?.flowerId).toBe('daisy');
      expect(['normal', 'rare', 'shiny']).toContain(harvested?.quality);

      const state = useGameStore.getState();
      expect(state.harvestedFlowers).toHaveLength(1);
      expect(state.reputation).toBe(1);

      // Plot should now be cleared
      const clearedPlot = state.plots.find((p) => p.id === 'plot_0');
      expect(clearedPlot?.flowerId).toBeNull();
      expect(clearedPlot?.plantedAt).toBeNull();
    });
  });

  describe('crafting bouquets', () => {
    it('refuses to craft with fewer than 3 flowers', () => {
      const result = useGameStore.getState().craftBouquet(['id1', 'id2']);
      expect(result).toBeNull();
    });

    it('refuses to craft with more than 5 flowers', () => {
      const result = useGameStore
        .getState()
        .craftBouquet(['id1', 'id2', 'id3', 'id4', 'id5', 'id6']);
      expect(result).toBeNull();
    });

    it('crafts secret recipe bouquet from 3 harvested flowers and rewards coins + unlocks recipe', () => {
      // Manually inject 2 daisies and 1 tulip into inventory for Spring Awakening
      useGameStore.setState({
        harvestedFlowers: [
          {
            id: 'h1',
            flowerId: 'daisy',
            quality: 'normal',
            harvestedAt: Date.now(),
          },
          {
            id: 'h2',
            flowerId: 'daisy',
            quality: 'normal',
            harvestedAt: Date.now(),
          },
          {
            id: 'h3',
            flowerId: 'tulip',
            quality: 'normal',
            harvestedAt: Date.now(),
          },
        ],
      });

      const initialCoins = useGameStore.getState().coins;
      const craftResult = useGameStore
        .getState()
        .craftBouquet(['h1', 'h2', 'h3']);

      expect(craftResult).not.toBeNull();
      expect(craftResult?.isSecretRecipe).toBe(true);
      expect(craftResult?.bouquetName).toBe('Spring Awakening');

      const state = useGameStore.getState();
      expect(state.harvestedFlowers).toHaveLength(0);
      expect(state.coins).toBeGreaterThan(initialCoins);
      expect(state.unlockedRecipes).toContain('daisy+daisy+tulip');
      expect(state.reputation).toBeGreaterThan(0);
    });

    it('crafts custom bouquet from non-secret combinations', () => {
      useGameStore.setState({
        harvestedFlowers: [
          {
            id: 'h1',
            flowerId: 'daisy',
            quality: 'normal',
            harvestedAt: Date.now(),
          },
          {
            id: 'h2',
            flowerId: 'daisy',
            quality: 'normal',
            harvestedAt: Date.now(),
          },
          {
            id: 'h3',
            flowerId: 'daisy',
            quality: 'normal',
            harvestedAt: Date.now(),
          },
        ],
      });

      const craftResult = useGameStore
        .getState()
        .craftBouquet(['h1', 'h2', 'h3']);

      expect(craftResult).not.toBeNull();
      expect(craftResult?.isSecretRecipe).toBe(false);
      expect(craftResult?.bouquetName).toBe('Custom Bouquet');
      expect(useGameStore.getState().harvestedFlowers).toHaveLength(0);
    });
  });

  describe('economy & plot unlocking', () => {
    it('buys seeds when player has enough coins', () => {
      const initialCoins = useGameStore.getState().coins;
      const daisyCost = FLOWERS.daisy.seedPrice * 2;

      const success = useGameStore.getState().buySeed('daisy', 2);
      expect(success).toBe(true);

      const state = useGameStore.getState();
      expect(state.coins).toBe(initialCoins - daisyCost);
      expect(state.seeds.daisy).toBe(6);
    });

    it('unlocks a plot when player has enough coins', () => {
      useGameStore.setState({ coins: 200 });

      const success = useGameStore.getState().unlockPlot('plot_6');
      expect(success).toBe(true);

      const state = useGameStore.getState();
      expect(state.coins).toBe(100);
      const plot = state.plots.find((p) => p.id === 'plot_6');
      expect(plot?.unlocked).toBe(true);
    });
  });

  describe('minigame rewards and cooldowns', () => {
    it('claims well reward and enforces cooldown', () => {
      const initialWater = useGameStore.getState().water;

      const success = useGameStore
        .getState()
        .claimMinigameReward('well', 5, 30);
      expect(success).toBe(true);

      const state = useGameStore.getState();
      expect(state.water).toBe(initialWater + 5);
      expect(state.minigameCooldowns.wellReadyAt).toBeGreaterThan(Date.now());

      // Attempt immediate second claim should fail due to cooldown
      const secondClaim = useGameStore
        .getState()
        .claimMinigameReward('well', 5, 30);
      expect(secondClaim).toBe(false);
    });
  });

  describe('state reset', () => {
    it('resets game state back to clean initial state', () => {
      useGameStore.getState().plantSeed('plot_0', 'daisy');
      useGameStore.getState().buyWater(5);

      useGameStore.getState().resetGame();
      const state = useGameStore.getState();

      expect(state.coins).toBe(60);
      expect(state.water).toBe(12);
      expect(state.plots.find((p) => p.id === 'plot_0')?.flowerId).toBeNull();
    });
  });
});
