import {
  AlertTriangle,
  CloudFog,
  CloudRain,
  Coins,
  Droplets,
  RotateCcw,
  Sparkles,
  Star,
  Sun,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import type { WeatherType } from '../../game/config/balance';
import { useGameStore } from '../../game/store/useGameStore';
import { getTelegramUser, haptic } from '../../telegram/tma';

interface TopHudProps {
  onOpenResources?: (tab: 'water' | 'fertilizer') => void;
  onOpenMerchant?: () => void;
  onOpenLeaderboard?: () => void;
}

export const TopHud: React.FC<TopHudProps> = ({
  onOpenResources,
  onOpenMerchant,
  onOpenLeaderboard,
}) => {
  const coins = useGameStore((s) => s.coins);
  const water = useGameStore((s) => s.water);
  const fertilizer = useGameStore((s) => s.fertilizer);
  const reputation = useGameStore((s) => s.reputation);
  const weather = useGameStore((s) => s.weather);
  const merchantVisit = useGameStore((s) => s.merchantVisit);
  const setWeather = useGameStore((s) => s.setWeather);
  const resetGame = useGameStore((s) => s.resetGame);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const tgUser = getTelegramUser();

  const handleCycleWeather = () => {
    const next: Record<WeatherType, WeatherType> = {
      sunny: 'rainy',
      rainy: 'foggy',
      foggy: 'sunny',
    };
    const nextWeather = next[weather];
    setWeather(nextWeather);
    haptic('light');
  };

  const handleOpenSettings = () => {
    haptic('light');
    setIsSettingsOpen(true);
    setIsConfirmingReset(false);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    setIsConfirmingReset(false);
  };

  const handleConfirmReset = () => {
    haptic('heavy');
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('panda-florist-save-v1');
      } catch {
        // ignore
      }
    }
    resetGame();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none p-3 max-w-lg mx-auto flex flex-col gap-2">
      {/* Top Meta Bar: Player Greeting & Clickable Weather Switcher */}
      <div className="flex items-center justify-between gap-2 text-xs font-medium">
        {/* User Pill (Clickable -> Opens Settings & Reset Modal) */}
        <button
          type="button"
          onClick={handleOpenSettings}
          className="pointer-events-auto cursor-pointer backdrop-blur-md bg-[#FBF7F0]/85 hover:bg-white active:scale-95 transition-all border border-[#2D241E]/10 rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5 text-[#2D241E]"
          title="Florist Profile & Settings"
        >
          <span className="text-sm">🐼</span>
          <span className="font-semibold truncate max-w-[120px]">
            {tgUser.firstName}
          </span>
          {tgUser.isTelegram && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        {/* Traveling Merchant Badge (Visible when a merchant is in town) */}
        {merchantVisit && (
          <button
            type="button"
            onClick={() => {
              haptic('light');
              onOpenMerchant?.();
            }}
            className="pointer-events-auto cursor-pointer backdrop-blur-md bg-amber-100/90 hover:bg-amber-200/90 active:scale-95 transition-all border border-amber-300 rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5 text-amber-900 animate-pulse font-bold"
            title="A Traveling Merchant is in town! Tap to inspect caravan wares"
          >
            <span className="text-sm">
              {merchantVisit.merchantId === 'raccoon' ? '🦝' : '🦉'}
            </span>
            <span className="truncate max-w-[80px]">
              {merchantVisit.merchantId === 'raccoon' ? 'Raccoon' : 'Owl'}
            </span>
          </button>
        )}

        {/* Clickable Weather Toggle Badge */}
        <button
          type="button"
          onClick={handleCycleWeather}
          className="pointer-events-auto cursor-pointer backdrop-blur-md bg-[#FBF7F0]/85 active:scale-95 transition-transform border border-[#2D241E]/10 rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5 text-[#2D241E] hover:bg-white"
          title="Click to toggle weather for testing"
        >
          {weather === 'sunny' && (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              <span className="capitalize font-semibold text-amber-900">
                Sunny (+15% ☀️)
              </span>
            </>
          )}
          {weather === 'rainy' && (
            <>
              <CloudRain className="w-3.5 h-3.5 text-blue-500 animate-bounce" />
              <span className="capitalize font-semibold text-blue-900">
                Rainy (Free 💧)
              </span>
            </>
          )}
          {weather === 'foggy' && (
            <>
              <CloudFog className="w-3.5 h-3.5 text-emerald-600" />
              <span className="capitalize font-semibold text-emerald-900">
                Foggy (+Shiny ✨)
              </span>
            </>
          )}
        </button>
      </div>

      {/* Primary Frosted-Glass Resource Bar */}
      <div className="pointer-events-auto backdrop-blur-md bg-[#FBF7F0]/90 border border-[#2D241E]/10 rounded-2xl px-4 py-2.5 shadow-md flex items-center justify-between text-sm text-[#2D241E]">
        {/* Coins */}
        <div className="flex items-center gap-1.5" title="Coins">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="font-bold tracking-tight">{coins}</span>
        </div>

        <div className="w-[1px] h-4 bg-[#2D241E]/15" />

        {/* Water */}
        <button
          type="button"
          onClick={() => onOpenResources?.('water')}
          className="flex items-center gap-1.5 cursor-pointer hover:bg-[#2D241E]/5 px-2 py-1 -my-1 rounded-xl transition-all active:scale-95"
          title="Water droplets — tap to replenish"
        >
          <Droplets className="w-4 h-4 text-sky-500" />
          <span className="font-bold tracking-tight">{water}</span>
        </button>

        <div className="w-[1px] h-4 bg-[#2D241E]/15" />

        {/* Fertilizer */}
        <button
          type="button"
          onClick={() => onOpenResources?.('fertilizer')}
          className="flex items-center gap-1.5 cursor-pointer hover:bg-[#2D241E]/5 px-2 py-1 -my-1 rounded-xl transition-all active:scale-95"
          title="Fertilizer — tap to replenish"
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="font-bold tracking-tight">{fertilizer}</span>
        </button>

        <div className="w-[1px] h-4 bg-[#2D241E]/15" />

        {/* Reputation (Clickable -> Opens Hall of Fame Leaderboard) */}
        <button
          type="button"
          onClick={() => {
            haptic('light');
            onOpenLeaderboard?.();
          }}
          className="flex items-center gap-1.5 cursor-pointer hover:bg-[#2D241E]/5 px-2 py-1 -my-1 rounded-xl transition-all active:scale-95"
          title="Florist Reputation — tap to view Hall of Fame Leaderboard"
        >
          <Star className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span className="font-bold tracking-tight">{reputation}</span>
        </button>
      </div>

      {/* Settings / Reset Confirmation Modal (z-50) */}
      {isSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in pointer-events-auto"
        >
          {/* Backdrop dismissal */}
          <div
            className="fixed inset-0"
            onClick={handleCloseSettings}
          />

          <div className="relative z-10 w-full max-w-sm bg-[#FBF7F0] border border-[#2D241E]/15 rounded-3xl p-5 shadow-2xl text-[#2D241E] animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2D241E]/10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐼</span>
                <div>
                  <h3 className="font-bold text-sm text-[#2D241E]">
                    Florist Profile & Settings
                  </h3>
                  <p className="text-[11px] text-[#2D241E]/60">
                    {tgUser.firstName} {tgUser.username ? `(@${tgUser.username})` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseSettings}
                className="w-7 h-7 rounded-full bg-[#2D241E]/5 hover:bg-[#2D241E]/10 flex items-center justify-center text-[#2D241E]/70 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile quick stats */}
            <div className="grid grid-cols-2 gap-2 my-4 text-xs">
              <div className="p-2.5 bg-white/80 rounded-xl border border-[#2D241E]/10 flex flex-col">
                <span className="text-[10px] text-[#2D241E]/60 uppercase font-semibold">Coins</span>
                <span className="font-extrabold text-amber-800 text-sm">🪙 {coins}</span>
              </div>
              <div className="p-2.5 bg-white/80 rounded-xl border border-[#2D241E]/10 flex flex-col">
                <span className="text-[10px] text-[#2D241E]/60 uppercase font-semibold">Reputation</span>
                <span className="font-extrabold text-rose-700 text-sm">⭐ {reputation}</span>
              </div>
            </div>

            {/* Reset Progress Section */}
            {!isConfirmingReset ? (
              <div className="pt-2 border-t border-[#2D241E]/10">
                <button
                  type="button"
                  onClick={() => {
                    haptic('warning');
                    setIsConfirmingReset(true);
                  }}
                  className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Garden Progress</span>
                </button>
                <p className="text-[10px] text-center text-[#2D241E]/50 mt-1.5">
                  Clear saved plots, coins, and orders back to starter defaults
                </p>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#2D241E]/10 flex flex-col gap-2.5 bg-rose-50/70 p-3 rounded-2xl border border-rose-200">
                <div className="flex items-start gap-2 text-rose-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-tight">
                    Are you sure? This will delete all saved progress and reset your garden to the beginning.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingReset(false)}
                    className="py-2 px-3 bg-white border border-[#2D241E]/15 rounded-xl text-xs font-semibold hover:bg-gray-50 text-[#2D241E] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Yes, Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
