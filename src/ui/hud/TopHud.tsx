import {
  CloudFog,
  CloudRain,
  Coins,
  Droplets,
  Sparkles,
  Star,
  Sun,
} from 'lucide-react';
import React from 'react';
import type { WeatherType } from '../../game/config/balance';
import { useGameStore } from '../../game/store/useGameStore';
import { getTelegramUser, haptic } from '../../telegram/tma';

interface TopHudProps {
  onOpenResources?: (tab: 'water' | 'fertilizer') => void;
}

export const TopHud: React.FC<TopHudProps> = ({ onOpenResources }) => {
  const coins = useGameStore((s) => s.coins);
  const water = useGameStore((s) => s.water);
  const fertilizer = useGameStore((s) => s.fertilizer);
  const reputation = useGameStore((s) => s.reputation);
  const weather = useGameStore((s) => s.weather);
  const setWeather = useGameStore((s) => s.setWeather);

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

  return (
    <header className="fixed top-0 left-0 right-0 z-20 pointer-events-none p-3 max-w-lg mx-auto flex flex-col gap-2">
      {/* Top Meta Bar: Player Greeting & Clickable Weather Switcher */}
      <div className="flex items-center justify-between gap-2 text-xs font-medium">
        {/* User Pill */}
        <div className="pointer-events-auto backdrop-blur-md bg-[#FBF7F0]/85 border border-[#2D241E]/10 rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5 text-[#2D241E]">
          <span className="text-sm">🐼</span>
          <span className="font-semibold truncate max-w-[120px]">
            {tgUser.firstName}
          </span>
          {tgUser.isTelegram && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>

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

        {/* Reputation */}
        <div className="flex items-center gap-1.5" title="Florist Reputation">
          <Star className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span className="font-bold tracking-tight">{reputation}</span>
        </div>
      </div>
    </header>
  );
};
