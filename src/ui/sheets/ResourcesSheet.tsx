import {
  Coins,
  Droplets,
  Gamepad2,
  Hourglass,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  COMPOST_MINIGAME_REWARD,
  FERTILIZER_BUY_AMOUNT,
  FERTILIZER_BUY_PRICE,
  WATER_BUY_AMOUNT,
  WATER_BUY_PRICE,
  WELL_MINIGAME_REWARD,
} from '../../game/config/balance';
import { useGameStore } from '../../game/store/useGameStore';

interface ResourcesSheetProps {
  isOpen: boolean;
  activeTab?: 'water' | 'fertilizer';
  onTabChange?: (tab: 'water' | 'fertilizer') => void;
  onClose: () => void;
  onPlayWell: () => void;
  onPlayCompost: () => void;
}

function formatCountdown(sec: number): string {
  if (sec <= 0) return 'Ready';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0) {
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  }
  return `${s}s`;
}

export const ResourcesSheet: React.FC<ResourcesSheetProps> = ({
  isOpen,
  activeTab = 'water',
  onTabChange,
  onClose,
  onPlayWell,
  onPlayCompost,
}) => {
  const coins = useGameStore((s) => s.coins);
  const water = useGameStore((s) => s.water);
  const fertilizer = useGameStore((s) => s.fertilizer);
  const minigameCooldowns = useGameStore((s) => s.minigameCooldowns);
  const buyWater = useGameStore((s) => s.buyWater);
  const buyFertilizer = useGameStore((s) => s.buyFertilizer);

  const [internalTab, setInternalTab] = useState<'water' | 'fertilizer'>('water');
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const currentTab = onTabChange ? activeTab : internalTab;

  const handleSelectTab = (tab: 'water' | 'fertilizer') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  // Live timer for minigame cooldowns
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const wellCooldownLeft = Math.max(
    0,
    Math.ceil((minigameCooldowns.wellReadyAt - currentTime) / 1000)
  );
  const compostCooldownLeft = Math.max(
    0,
    Math.ceil((minigameCooldowns.compostReadyAt - currentTime) / 1000)
  );

  const canAffordWater = coins >= WATER_BUY_PRICE;
  const canAffordFertilizer = coins >= FERTILIZER_BUY_PRICE;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-x-0 bottom-0 z-30 flex flex-col justify-end pointer-events-auto animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Warm Cream Sheet Container */}
      <div className="relative z-10 bg-[#FBF7F0] border-t border-[#2D241E]/15 rounded-t-[28px] shadow-2xl p-5 max-w-md mx-auto w-full max-h-[85vh] overflow-y-auto animate-slide-up text-[#2D241E]">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-[#2D241E]/20 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2D241E]/10">
          <div>
            <h3 className="font-bold text-base text-[#2D241E] leading-tight">
              Florist Supply Barn
            </h3>
            <p className="text-xs text-[#2D241E]/65">
              Replenish your garden water and soil fertilizer
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2D241E]/5 hover:bg-[#2D241E]/10 flex items-center justify-center transition-colors text-[#2D241E]/70 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-white/70 border border-[#2D241E]/10 rounded-2xl">
          <button
            type="button"
            onClick={() => handleSelectTab('water')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'water'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-[#2D241E]/70 hover:bg-[#2D241E]/5'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Water ({water})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('fertilizer')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'fertilizer'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[#2D241E]/70 hover:bg-[#2D241E]/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fertilizer ({fertilizer})</span>
          </button>
        </div>

        {/* TAB 1: WATER */}
        {currentTab === 'water' && (
          <div className="flex flex-col gap-3 mt-4">
            {/* Option A: Free Minigame */}
            <div className="p-4 bg-white/80 border border-[#2D241E]/10 rounded-2xl flex flex-col gap-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎋</span>
                  <div>
                    <h4 className="font-bold text-sm text-[#2D241E]">
                      Bamboo Spring Well
                    </h4>
                    <span className="text-[11px] text-sky-800 font-semibold">
                      Free Minigame • +{WELL_MINIGAME_REWARD} Water
                    </span>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">
                  Free
                </span>
              </div>

              <p className="text-xs text-[#2D241E]/70">
                Time your pours into the bamboo flume to draw sweet natural spring water.
              </p>

              <button
                type="button"
                disabled={wellCooldownLeft > 0}
                onClick={() => {
                  onClose();
                  onPlayWell();
                }}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white shadow-sm active:scale-98 disabled:opacity-45 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {wellCooldownLeft > 0 ? (
                  <>
                    <Hourglass className="w-3.5 h-3.5 animate-spin-slow" />
                    <span>Cooling down ({formatCountdown(wellCooldownLeft)})</span>
                  </>
                ) : (
                  <>
                    <Gamepad2 className="w-4 h-4" />
                    <span>Draw Spring Water (Play)</span>
                  </>
                )}
              </button>
            </div>

            {/* Option B: Buy with Coins */}
            <div className="p-4 bg-white/80 border border-[#2D241E]/10 rounded-2xl flex flex-col gap-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💧</span>
                  <div>
                    <h4 className="font-bold text-sm text-[#2D241E]">
                      Water Jug Bucket
                    </h4>
                    <span className="text-[11px] text-amber-900 font-semibold">
                      +{WATER_BUY_AMOUNT} Water Droplets
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span>{WATER_BUY_PRICE} Coins</span>
                </div>
              </div>

              <p className="text-xs text-[#2D241E]/70">
                Instant delivery directly from the village merchant.
              </p>

              <button
                type="button"
                disabled={!canAffordWater}
                onClick={() => buyWater(WATER_BUY_AMOUNT)}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-sm active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5" />
                {canAffordWater
                  ? `Buy ${WATER_BUY_AMOUNT} Water (${WATER_BUY_PRICE} Coins)`
                  : `Need ${WATER_BUY_PRICE} Coins (Have ${coins})`}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: FERTILIZER */}
        {currentTab === 'fertilizer' && (
          <div className="flex flex-col gap-3 mt-4">
            {/* Option A: Free Minigame */}
            <div className="p-4 bg-white/80 border border-[#2D241E]/10 rounded-2xl flex flex-col gap-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌱</span>
                  <div>
                    <h4 className="font-bold text-sm text-[#2D241E]">
                      Mole's Compost Pile
                    </h4>
                    <span className="text-[11px] text-emerald-800 font-semibold">
                      Free Minigame • +{COMPOST_MINIGAME_REWARD} Fertilizer
                    </span>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Free
                </span>
              </div>

              <p className="text-xs text-[#2D241E]/70">
                Quick 10-second scrap sorting. Pick 5 leaves & petals to craft organic humus.
              </p>

              <button
                type="button"
                disabled={compostCooldownLeft > 0}
                onClick={() => {
                  onClose();
                  onPlayCompost();
                }}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-sm active:scale-98 disabled:opacity-45 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {compostCooldownLeft > 0 ? (
                  <>
                    <Hourglass className="w-3.5 h-3.5 animate-spin-slow" />
                    <span>Cooling down ({formatCountdown(compostCooldownLeft)})</span>
                  </>
                ) : (
                  <>
                    <Gamepad2 className="w-4 h-4" />
                    <span>Sort Compost (Play)</span>
                  </>
                )}
              </button>
            </div>

            {/* Option B: Buy with Coins */}
            <div className="p-4 bg-white/80 border border-[#2D241E]/10 rounded-2xl flex flex-col gap-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <div>
                    <h4 className="font-bold text-sm text-[#2D241E]">
                      Bag of Enriched Humus
                    </h4>
                    <span className="text-[11px] text-amber-900 font-semibold">
                      +{FERTILIZER_BUY_AMOUNT} Organic Fertilizer
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span>{FERTILIZER_BUY_PRICE} Coins</span>
                </div>
              </div>

              <p className="text-xs text-[#2D241E]/70">
                High-potency organic mulch that significantly boosts rare & shiny blooms.
              </p>

              <button
                type="button"
                disabled={!canAffordFertilizer}
                onClick={() => buyFertilizer(FERTILIZER_BUY_AMOUNT)}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-sm active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5" />
                {canAffordFertilizer
                  ? `Buy ${FERTILIZER_BUY_AMOUNT} Fertilizer (${FERTILIZER_BUY_PRICE} Coins)`
                  : `Need ${FERTILIZER_BUY_PRICE} Coins (Have ${coins})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
