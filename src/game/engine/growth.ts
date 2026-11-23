import {
  BASE_QUALITY_CHANCES,
  FERTILIZED_QUALITY_CHANCES,
  GROWTH_STAGE_THRESHOLDS,
  WATER_SPEED_MULTIPLIER,
  WEATHER_CONFIG,
  type FlowerQuality,
  type GrowthStage,
  type WeatherType,
} from '../config/balance';

export interface GrowthParams {
  plantedAt: number;
  baseGrowthSec: number;
  isWatered?: boolean;
  wateredAt?: number | null;
  weather?: WeatherType;
  now?: number;
}

export interface HarvestQualityParams {
  isFertilized?: boolean;
  weather?: WeatherType;
  randomRoll?: number; // 0..1 deterministic roll for testing
}

export interface PlotGrowthState {
  progress: number;
  stage: GrowthStage;
  remainingSeconds: number;
  isReady: boolean;
  isWatered: boolean;
  currentSpeedMultiplier: number;
}

/**
 * Returns current growth speed multiplier factoring in weather and watering status.
 */
export function calculateGrowthSpeedMultiplier(params: {
  isWatered?: boolean;
  weather?: WeatherType;
}): number {
  const weatherConfig = params.weather
    ? WEATHER_CONFIG[params.weather]
    : WEATHER_CONFIG.sunny;

  const effectiveWatered =
    Boolean(params.isWatered) || weatherConfig.autoWaters;

  const waterMultiplier = effectiveWatered ? WATER_SPEED_MULTIPLIER : 1.0;
  return weatherConfig.growthSpeedMultiplier * waterMultiplier;
}

/**
 * Pure function to calculate growth progress (0..1) from timestamps and plot conditions.
 */
export function calculateGrowthProgress(params: GrowthParams): number {
  const { plantedAt, baseGrowthSec, isWatered, wateredAt, weather } = params;
  const now = params.now ?? Date.now();

  if (baseGrowthSec <= 0) {
    return 1.0;
  }

  const totalElapsedMs = Math.max(0, now - plantedAt);
  if (totalElapsedMs === 0) {
    return 0.0;
  }

  const weatherConfig = weather ? WEATHER_CONFIG[weather] : WEATHER_CONFIG.sunny;
  const totalRequiredWorkMs = baseGrowthSec * 1000;

  let accumulatedWorkMs: number;

  if (weatherConfig.autoWaters) {
    // Rain auto-waters for the entire duration
    const speed = weatherConfig.growthSpeedMultiplier * WATER_SPEED_MULTIPLIER;
    accumulatedWorkMs = totalElapsedMs * speed;
  } else if (
    wateredAt !== undefined &&
    wateredAt !== null &&
    wateredAt > plantedAt &&
    wateredAt < now
  ) {
    // Split period: unwatered before wateredAt, watered after wateredAt
    const unwateredMs = Math.min(totalElapsedMs, wateredAt - plantedAt);
    const wateredMs = Math.max(0, now - wateredAt);

    const speedUnwatered = weatherConfig.growthSpeedMultiplier * 1.0;
    const speedWatered =
      weatherConfig.growthSpeedMultiplier * WATER_SPEED_MULTIPLIER;

    accumulatedWorkMs =
      unwateredMs * speedUnwatered + wateredMs * speedWatered;
  } else {
    // Uniform status throughout
    const effectiveWatered = Boolean(isWatered);
    const waterMultiplier = effectiveWatered ? WATER_SPEED_MULTIPLIER : 1.0;
    const speed = weatherConfig.growthSpeedMultiplier * waterMultiplier;
    accumulatedWorkMs = totalElapsedMs * speed;
  }

  const progress = accumulatedWorkMs / totalRequiredWorkMs;
  return Math.min(1.0, Math.max(0.0, progress));
}

/**
 * Maps a progress value (0..1) to a growth stage.
 */
export function calculateGrowthStage(progress: number): GrowthStage {
  if (progress >= GROWTH_STAGE_THRESHOLDS.bloom) {
    return 'bloom';
  }
  if (progress >= GROWTH_STAGE_THRESHOLDS.bud) {
    return 'bud';
  }
  if (progress >= GROWTH_STAGE_THRESHOLDS.sprout) {
    return 'sprout';
  }
  return 'seed';
}

/**
 * Calculates remaining seconds until crop reaches bloom.
 */
export function calculateRemainingSeconds(params: GrowthParams): number {
  const progress = calculateGrowthProgress(params);
  if (progress >= 1.0) {
    return 0;
  }

  const currentSpeed = calculateGrowthSpeedMultiplier({
    isWatered: params.isWatered,
    weather: params.weather,
  });

  const remainingProgress = 1.0 - progress;
  const remainingEffectiveSec = (remainingProgress * params.baseGrowthSec) / currentSpeed;

  return Math.max(0, Math.ceil(remainingEffectiveSec));
}

/**
 * Convenience helper returning complete growth state snapshot for a plot.
 */
export function getPlotGrowthState(params: GrowthParams): PlotGrowthState {
  const weatherConfig = params.weather
    ? WEATHER_CONFIG[params.weather]
    : WEATHER_CONFIG.sunny;

  const effectiveWatered =
    Boolean(params.isWatered) || weatherConfig.autoWaters;

  const progress = calculateGrowthProgress(params);
  const stage = calculateGrowthStage(progress);
  const remainingSeconds = calculateRemainingSeconds(params);
  const currentSpeedMultiplier = calculateGrowthSpeedMultiplier({
    isWatered: params.isWatered,
    weather: params.weather,
  });

  return {
    progress,
    stage,
    remainingSeconds,
    isReady: progress >= 1.0,
    isWatered: effectiveWatered,
    currentSpeedMultiplier,
  };
}

/**
 * Rolls harvested flower quality ('normal' | 'rare' | 'shiny')
 * based on fertilizer usage and weather bonuses.
 */
export function rollHarvestQuality(
  params?: HarvestQualityParams
): FlowerQuality {
  const isFertilized = params?.isFertilized ?? false;
  const weather = params?.weather;

  const baseChances = isFertilized
    ? { ...FERTILIZED_QUALITY_CHANCES }
    : { ...BASE_QUALITY_CHANCES };

  if (weather) {
    const boost = WEATHER_CONFIG[weather].qualityBoost;
    baseChances.rare += boost.rareBonus;
    baseChances.shiny += boost.shinyBonus;
    baseChances.normal = Math.max(
      0.05,
      1.0 - (baseChances.rare + baseChances.shiny)
    );
  }

  // Normalize chances
  const total = baseChances.normal + baseChances.rare + baseChances.shiny;
  const normalRate = baseChances.normal / total;
  const rareRate = baseChances.rare / total;

  const roll = params?.randomRoll !== undefined
    ? Math.max(0, Math.min(0.999999, params.randomRoll))
    : Math.random();

  if (roll < normalRate) {
    return 'normal';
  }
  if (roll < normalRate + rareRate) {
    return 'rare';
  }
  return 'shiny';
}
