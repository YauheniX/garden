import { describe, expect, it } from 'vitest';
import {
  WATER_SPEED_MULTIPLIER,
  WEATHER_CONFIG,
} from '../config/balance';
import {
  calculateGrowthProgress,
  calculateGrowthSpeedMultiplier,
  calculateGrowthStage,
  calculateRemainingSeconds,
  getPlotGrowthState,
  rollHarvestQuality,
} from './growth';

describe('growth engine', () => {
  const BASE_GROWTH_SEC = 60; // 60 seconds

  describe('calculateGrowthSpeedMultiplier', () => {
    it('applies sunny weather base speed', () => {
      const speed = calculateGrowthSpeedMultiplier({
        isWatered: false,
        weather: 'sunny',
      });
      expect(speed).toBeCloseTo(WEATHER_CONFIG.sunny.growthSpeedMultiplier);
    });

    it('applies water speed boost (+35%) when watered', () => {
      const speed = calculateGrowthSpeedMultiplier({
        isWatered: true,
        weather: 'sunny',
      });
      const expected =
        WEATHER_CONFIG.sunny.growthSpeedMultiplier * WATER_SPEED_MULTIPLIER;
      expect(speed).toBeCloseTo(expected);
    });

    it('auto-waters during rainy weather even if isWatered is false', () => {
      const unwateredRainSpeed = calculateGrowthSpeedMultiplier({
        isWatered: false,
        weather: 'rainy',
      });
      const wateredRainSpeed = calculateGrowthSpeedMultiplier({
        isWatered: true,
        weather: 'rainy',
      });

      const expected =
        WEATHER_CONFIG.rainy.growthSpeedMultiplier * WATER_SPEED_MULTIPLIER;
      expect(unwateredRainSpeed).toBeCloseTo(expected);
      expect(wateredRainSpeed).toBeCloseTo(expected);
      expect(unwateredRainSpeed).toBe(wateredRainSpeed);
    });

    it('slows growth in foggy weather', () => {
      const speed = calculateGrowthSpeedMultiplier({
        isWatered: false,
        weather: 'foggy',
      });
      expect(speed).toBeCloseTo(WEATHER_CONFIG.foggy.growthSpeedMultiplier);
    });
  });

  describe('calculateGrowthProgress and offline growth', () => {
    const plantedAt = 100_000;

    it('returns 0 progress at planted time', () => {
      const progress = calculateGrowthProgress({
        plantedAt,
        baseGrowthSec: BASE_GROWTH_SEC,
        isWatered: false,
        now: plantedAt,
      });
      expect(progress).toBe(0);
    });

    it('calculates progress accurately during growth', () => {
      // 30 seconds elapsed out of 60 seconds with sunny base speed 1.15
      const now = plantedAt + 30 * 1000;
      const progress = calculateGrowthProgress({
        plantedAt,
        baseGrowthSec: BASE_GROWTH_SEC,
        isWatered: false,
        weather: 'sunny',
        now,
      });

      const expected = (30 * WEATHER_CONFIG.sunny.growthSpeedMultiplier) / 60;
      expect(progress).toBeCloseTo(expected);
    });

    it('handles offline growth when player is away for hours', () => {
      // 2 hours (7200 seconds) offline on a 60-second crop
      const now = plantedAt + 7200 * 1000;
      const progress = calculateGrowthProgress({
        plantedAt,
        baseGrowthSec: BASE_GROWTH_SEC,
        isWatered: false,
        now,
      });
      expect(progress).toBe(1.0);

      const state = getPlotGrowthState({
        plantedAt,
        baseGrowthSec: BASE_GROWTH_SEC,
        isWatered: false,
        now,
      });
      expect(state.progress).toBe(1.0);
      expect(state.stage).toBe('bloom');
      expect(state.remainingSeconds).toBe(0);
      expect(state.isReady).toBe(true);
    });

    it('caps progress at 1.0 and does not exceed it', () => {
      const now = plantedAt + 1_000_000;
      const progress = calculateGrowthProgress({
        plantedAt,
        baseGrowthSec: BASE_GROWTH_SEC,
        now,
      });
      expect(progress).toBe(1.0);
    });
  });

  describe('rain auto-water behavior', () => {
    const plantedAt = 10_000;
    const now = plantedAt + 20 * 1000; // 20 seconds later

    it('gives unwatered crops in rain the exact same progress as watered crops in rain', () => {
      const unwateredProgress = calculateGrowthProgress({
        plantedAt,
        baseGrowthSec: BASE_GROWTH_SEC,
        isWatered: false,
        weather: 'rainy',
        now,
      });

      const wateredProgress = calculateGrowthProgress({
        plantedAt,
        baseGrowthSec: BASE_GROWTH_SEC,
        isWatered: true,
        weather: 'rainy',
        now,
      });

      expect(unwateredProgress).toBe(wateredProgress);
      expect(unwateredProgress).toBeGreaterThan(0);
    });

    it('rain auto-water grows 35% faster than dry weather at base speed', () => {
      const drySpeed1Progress = calculateGrowthProgress({
        plantedAt,
        baseGrowthSec: BASE_GROWTH_SEC,
        isWatered: false,
        weather: 'rainy', // rainy has base speed 1.0, but auto-waters to 1.35
        now,
      });

      // Equivalent 20s at 1.0 speed without water
      const raw20sProgress = (20 * 1.0) / 60;
      expect(drySpeed1Progress).toBeCloseTo(raw20sProgress * 1.35);
    });
  });

  describe('growth stages', () => {
    it('maps progress to seed stage (0% - 24.9%)', () => {
      expect(calculateGrowthStage(0)).toBe('seed');
      expect(calculateGrowthStage(0.1)).toBe('seed');
      expect(calculateGrowthStage(0.249)).toBe('seed');
    });

    it('maps progress to sprout stage (25% - 59.9%)', () => {
      expect(calculateGrowthStage(0.25)).toBe('sprout');
      expect(calculateGrowthStage(0.4)).toBe('sprout');
      expect(calculateGrowthStage(0.599)).toBe('sprout');
    });

    it('maps progress to bud stage (60% - 99.9%)', () => {
      expect(calculateGrowthStage(0.6)).toBe('bud');
      expect(calculateGrowthStage(0.85)).toBe('bud');
      expect(calculateGrowthStage(0.999)).toBe('bud');
    });

    it('maps progress to bloom stage (100%+)', () => {
      expect(calculateGrowthStage(1.0)).toBe('bloom');
      expect(calculateGrowthStage(1.5)).toBe('bloom');
    });
  });

  describe('calculateRemainingSeconds', () => {
    const plantedAt = 0;

    it('returns full baseGrowthSec / speed at t = 0', () => {
      const remaining = calculateRemainingSeconds({
        plantedAt,
        baseGrowthSec: 100,
        isWatered: false,
        weather: 'rainy', // speed = 1.0 * 1.35 = 1.35
        now: 0,
      });
      expect(remaining).toBe(Math.ceil(100 / 1.35));
    });

    it('returns 0 remaining seconds when fully bloomed', () => {
      const remaining = calculateRemainingSeconds({
        plantedAt,
        baseGrowthSec: 30,
        isWatered: true,
        now: 60 * 1000,
      });
      expect(remaining).toBe(0);
    });
  });

  describe('rollHarvestQuality', () => {
    it('rolls normal quality when roll falls within normal range', () => {
      const quality = rollHarvestQuality({
        isFertilized: false,
        randomRoll: 0.1,
      });
      expect(quality).toBe('normal');
    });

    it('rolls rare quality when roll exceeds normal range', () => {
      const quality = rollHarvestQuality({
        isFertilized: false,
        randomRoll: 0.9,
      });
      expect(quality).toBe('rare');
    });

    it('rolls shiny quality on high roll', () => {
      const quality = rollHarvestQuality({
        isFertilized: false,
        randomRoll: 0.995,
      });
      expect(quality).toBe('shiny');
    });

    it('fertilizer increases rare and shiny chances', () => {
      // With fertilizer, normal chance is ~40%, so a roll of 0.45 yields rare
      const qualityUnfertilized = rollHarvestQuality({
        isFertilized: false,
        randomRoll: 0.45,
      });
      const qualityFertilized = rollHarvestQuality({
        isFertilized: true,
        randomRoll: 0.45,
      });

      expect(qualityUnfertilized).toBe('normal');
      expect(qualityFertilized).toBe('rare');
    });

    it('foggy weather provides extra boost to shiny quality', () => {
      const shinyRoll = 0.88;
      const normalWeatherQuality = rollHarvestQuality({
        isFertilized: true,
        weather: 'sunny',
        randomRoll: shinyRoll,
      });
      const foggyWeatherQuality = rollHarvestQuality({
        isFertilized: true,
        weather: 'foggy',
        randomRoll: shinyRoll,
      });

      // Foggy weather elevates the shiny threshold earlier
      expect(foggyWeatherQuality).toBe('shiny');
      expect(['rare', 'shiny']).toContain(normalWeatherQuality);
    });
  });
});
