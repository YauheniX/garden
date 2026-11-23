import {
  Clock,
  Droplets,
  Flower2,
  Lock,
  Sparkles,
  Sprout,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { PLOT_UNLOCK_COST } from '../../game/config/balance';
import { FLOWER_LIST, getFlower, type FlowerId } from '../../game/config/flowers';
import { getPlotGrowthState } from '../../game/engine/growth';
import { useGameStore } from '../../game/store/useGameStore';

interface PlotSheetProps {
  plotId: string | null;
  onClose: () => void;
  onOpenResources?: (tab: 'water' | 'fertilizer') => void;
}

export const PlotSheet: React.FC<PlotSheetProps> = ({
  plotId,
  onClose,
  onOpenResources,
}) => {
  const plots = useGameStore((s) => s.plots);
  const coins = useGameStore((s) => s.coins);
  const water = useGameStore((s) => s.water);
  const fertilizer = useGameStore((s) => s.fertilizer);
  const seeds = useGameStore((s) => s.seeds);
  const weather = useGameStore((s) => s.weather);

  const plantSeed = useGameStore((s) => s.plantSeed);
  const waterPlot = useGameStore((s) => s.waterPlot);
  const fertilizePlot = useGameStore((s) => s.fertilizePlot);
  const harvestPlot = useGameStore((s) => s.harvestPlot);
  const unlockPlot = useGameStore((s) => s.unlockPlot);
  const buySeed = useGameStore((s) => s.buySeed);

  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Live timer for growth progress updates while sheet is open
  useEffect(() => {
    if (!plotId) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [plotId]);

  if (!plotId) return null;

  const plotIndex = plots.findIndex((p) => p.id === plotId);
  const plot = plots[plotIndex];
  if (!plot) return null;

  const isRainy = weather === 'rainy';
  const flowerDef = plot.flowerId ? getFlower(plot.flowerId) : null;
  const growth =
    flowerDef && plot.plantedAt
      ? getPlotGrowthState({
          plantedAt: plot.plantedAt,
          baseGrowthSec: flowerDef.baseGrowthSec,
          isWatered: Boolean(plot.wateredAt),
          wateredAt: plot.wateredAt,
          weather,
          now: currentTime,
        })
      : null;

  const isBloomed = growth?.stage === 'bloom';
  const progressPercent = Math.min(100, Math.round((growth?.progress ?? 0) * 100));

  const handlePlant = (flowerId: FlowerId) => {
    const success = plantSeed(plot.id, flowerId);
    if (!success) {
      // If no seeds, try quick purchase & plant
      if ((seeds[flowerId] ?? 0) <= 0 && coins >= getFlower(flowerId).seedPrice) {
        buySeed(flowerId, 1);
        plantSeed(plot.id, flowerId);
      }
    }
  };

  const handleHarvest = () => {
    harvestPlot(plot.id);
  };

  const handleWaterClick = () => {
    if (plot.wateredAt) return;
    if (!isRainy && water < 1) {
      onOpenResources?.('water');
      return;
    }
    waterPlot(plot.id);
  };

  const handleFertilizeClick = () => {
    if (plot.fertilized) return;
    if (fertilizer < 1) {
      onOpenResources?.('fertilizer');
      return;
    }
    fertilizePlot(plot.id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-x-0 bottom-0 z-30 flex flex-col justify-end pointer-events-auto"
    >
      {/* Semi-transparent backdrop to dismiss */}
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Warm Cream Bottom Sheet */}
      <div className="relative z-10 bg-[#FBF7F0] border-t border-[#2D241E]/15 rounded-t-[28px] shadow-2xl p-5 max-w-md mx-auto w-full max-h-[82vh] overflow-y-auto animate-slide-up text-[#2D241E]">
        {/* Top Drag Handle */}
        <div className="w-10 h-1 bg-[#2D241E]/20 rounded-full mx-auto mb-3" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2D241E]/10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪴</span>
            <div>
              <h3 className="font-bold text-base text-[#2D241E] leading-tight">
                Garden Plot #{plotIndex + 1}
              </h3>
              <p className="text-xs text-[#2D241E]/65">
                {!plot.unlocked
                  ? 'Locked Expansion'
                  : plot.flowerId
                  ? `Growing: ${flowerDef?.name}`
                  : 'Ready for planting'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2D241E]/5 hover:bg-[#2D241E]/10 flex items-center justify-center transition-colors text-[#2D241E]/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CASE 1: LOCKED PLOT */}
        {!plot.unlocked && (
          <div className="py-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-amber-100/80 flex items-center justify-center border border-amber-200">
              <Lock className="w-7 h-7 text-amber-700" />
            </div>
            <div>
              <h4 className="font-bold text-base text-[#2D241E]">
                Plot is Locked
              </h4>
              <p className="text-xs text-[#2D241E]/70 max-w-xs mt-1">
                Expand your tabletop florist garden to grow more rare seeds and
                craft glorious high-tier bouquets.
              </p>
            </div>
            <button
              type="button"
              disabled={coins < PLOT_UNLOCK_COST}
              onClick={() => unlockPlot(plot.id)}
              className="mt-2 w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {coins >= PLOT_UNLOCK_COST
                ? `Unlock Plot (${PLOT_UNLOCK_COST} Coins)`
                : `Need ${PLOT_UNLOCK_COST} Coins (Have ${coins})`}
            </button>
          </div>
        )}

        {/* CASE 2: EMPTY PLOT — SEED SELECTION GRID */}
        {plot.unlocked && !plot.flowerId && (
          <div className="py-3 flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-[#2D241E]/75 tracking-wider uppercase">
              Select Seed to Plant:
            </p>
            <div className="grid grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {FLOWER_LIST.map((flower) => {
                const available = seeds[flower.id] ?? 0;
                const canAfford = coins >= flower.seedPrice;

                return (
                  <div
                    key={flower.id}
                    className="p-3 bg-white/70 border border-[#2D241E]/10 rounded-2xl flex flex-col justify-between gap-2 shadow-sm hover:border-emerald-600/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="font-bold text-sm text-[#2D241E]">
                          {flower.name}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${
                            flower.rarity === 'rare'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {flower.rarity}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#2D241E]/65 mt-1">
                        <Clock className="w-3 h-3 text-[#2D241E]/50" />
                        <span>{flower.baseGrowthSec}s</span>
                        <span>•</span>
                        <span>{flower.baseSellPrice}c base</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#2D241E]/5">
                      <span className="text-xs font-bold text-[#2D241E]/80">
                        x{available} in stock
                      </span>
                      {available > 0 ? (
                        <button
                          type="button"
                          onClick={() => handlePlant(flower.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-transform"
                        >
                          Plant
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => handlePlant(flower.id)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-[11px] font-bold rounded-lg shadow-sm active:scale-95 transition-transform"
                          title={`Buy 1 seed for ${flower.seedPrice} coins and plant`}
                        >
                          Buy ({flower.seedPrice}c)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CASE 3: GROWING / BLOOMED PLOT */}
        {plot.unlocked && plot.flowerId && flowerDef && (
          <div className="py-3 flex flex-col gap-4">
            {/* Flower Overview Card */}
            <div className="p-3.5 bg-white/70 border border-[#2D241E]/10 rounded-2xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-[#2D241E]">
                    {flowerDef.name}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isBloomed
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {growth?.stage}
                  </span>
                </div>
                <p className="text-xs text-[#2D241E]/65 mt-0.5">
                  {isBloomed
                    ? '✨ Blossom is mature and ready to harvest!'
                    : `Growing: ${growth?.remainingSeconds ?? 0}s remaining`}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#2D241E]/55 block">Value</span>
                <span className="text-sm font-bold text-amber-800">
                  ~{flowerDef.baseSellPrice} coins
                </span>
              </div>
            </div>

            {/* Growth Progress Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-bold text-[#2D241E]/75">
                <span className="flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                  Growth Progress
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-[#2D241E]/10 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isBloomed
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                      : 'bg-gradient-to-r from-emerald-500 to-green-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Plot Modifiers Status Badges */}
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`px-2.5 py-1 rounded-xl font-medium border flex items-center gap-1 ${
                  plot.wateredAt || isRainy
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : 'bg-stone-50 text-stone-500 border-stone-200'
                }`}
              >
                <Droplets className="w-3.5 h-3.5" />
                {isRainy
                  ? 'Rain Watered (+35%)'
                  : plot.wateredAt
                  ? 'Watered (+35%)'
                  : 'Dry (Normal Speed)'}
              </span>

              <span
                className={`px-2.5 py-1 rounded-xl font-medium border flex items-center gap-1 ${
                  plot.fertilized
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-stone-50 text-stone-500 border-stone-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {plot.fertilized ? 'Fertilized (+Rare)' : 'Unfertilized'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              {!isBloomed ? (
                <div className="grid grid-cols-2 gap-2">
                  {/* Water Button */}
                  <button
                    type="button"
                    disabled={Boolean(plot.wateredAt)}
                    onClick={handleWaterClick}
                    className="py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    {plot.wateredAt
                      ? 'Watered ✨'
                      : isRainy
                      ? 'Water (Free Rain)'
                      : water < 1
                      ? 'Get Water (💧 0)'
                      : `Water (💧 ${water})`}
                  </button>

                  {/* Fertilize Button */}
                  <button
                    type="button"
                    disabled={plot.fertilized}
                    onClick={handleFertilizeClick}
                    className="py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {plot.fertilized
                      ? 'Fertilized 🌟'
                      : fertilizer < 1
                      ? 'Get Fertilizer (🌱 0)'
                      : `Fertilize (🌱 ${fertilizer})`}
                  </button>
                </div>
              ) : (
                /* Harvest Button (Prominent & Golden when Bloomed) */
                <button
                  type="button"
                  onClick={handleHarvest}
                  className="py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-[#2D241E] shadow-lg shadow-amber-300/40 active:scale-98 transition-all animate-pulse"
                >
                  <Flower2 className="w-5 h-5 text-[#2D241E]" />
                  Harvest Flower Blossom
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
