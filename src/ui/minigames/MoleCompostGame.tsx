import { AlertCircle, Sparkles, Timer, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  COMPOST_COOLDOWN_SEC,
  COMPOST_MINIGAME_REWARD,
} from '../../game/config/balance';
import { useGameStore } from '../../game/store/useGameStore';
import { haptic } from '../../telegram/tma';

interface MoleCompostGameProps {
  onClose: () => void;
}

interface CompostItem {
  id: string;
  isOrganic: boolean;
  icon: string;
  name: string;
}

const ORGANIC_ITEMS: Array<{ icon: string; name: string }> = [
  { icon: '🍃', name: 'Fresh Leaf' },
  { icon: '🌰', name: 'Forest Acorn' },
  { icon: '🌸', name: 'Flower Petal' },
  { icon: '🍄', name: 'Wild Mushroom' },
  { icon: '🍎', name: 'Fruit Core' },
];

const TRASH_ITEMS: Array<{ icon: string; name: string }> = [
  { icon: '🪨', name: 'Pebble' },
  { icon: '🥫', name: 'Tin Can' },
  { icon: '🔩', name: 'Rusty Bolt' },
  { icon: '🍾', name: 'Glass Bottle' },
];

function getRandomItem(cellIndex: number): CompostItem {
  const isOrganic = Math.random() < 0.6;
  const pool = isOrganic ? ORGANIC_ITEMS : TRASH_ITEMS;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  return {
    id: `item-${cellIndex}-${Date.now()}-${Math.random()}`,
    isOrganic,
    icon: picked.icon,
    name: picked.name,
  };
}

function createInitialGrid(): CompostItem[] {
  return Array.from({ length: 9 }, (_, idx) => getRandomItem(idx));
}

const TARGET_ORGANIC_COUNT = 5;
const START_TIME_SEC = 10.0;

export const MoleCompostGame: React.FC<MoleCompostGameProps> = ({ onClose }) => {
  const claimReward = useGameStore((s) => s.claimMinigameReward);

  const [grid, setGrid] = useState<CompostItem[]>(() => createInitialGrid());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(START_TIME_SEC);
  const [won, setWon] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isGameOver = timeLeft <= 0 && !won;

  // 10-second countdown timer
  useEffect(() => {
    if (won || isGameOver) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 0.1);
        return Math.round(next * 10) / 10;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [won, isGameOver]);

  const handleCellClick = (cellIndex: number) => {
    if (won || isGameOver) return;

    const item = grid[cellIndex];
    if (!item) return;

    if (item.isOrganic) {
      const nextScore = score + 1;
      setScore(nextScore);

      if (nextScore >= TARGET_ORGANIC_COUNT) {
        setWon(true);
        haptic('success');
        setFeedback('🌟 Rich Compost Crafted!');
        claimReward('compost', COMPOST_MINIGAME_REWARD, COMPOST_COOLDOWN_SEC);
        setTimeout(() => {
          onClose();
        }, 1600);
      } else {
        haptic('light');
        setFeedback(`🍃 Sorted ${item.name}! (${nextScore}/${TARGET_ORGANIC_COUNT})`);
        setTimeout(() => setFeedback(null), 700);
      }
    } else {
      haptic('error');
      setTimeLeft((t) => Math.max(0, Math.round((t - 1.0) * 10) / 10));
      setFeedback(`🪨 -1.0s! ${item.name} is not compostable.`);
      setTimeout(() => setFeedback(null), 900);
    }

    // Replace the tapped item in the grid
    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      newGrid[cellIndex] = getRandomItem(cellIndex);
      return newGrid;
    });
  };

  const handleRestart = () => {
    setGrid(createInitialGrid());
    setScore(0);
    setTimeLeft(START_TIME_SEC);
    setWon(false);
    setFeedback(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto"
    >
      <div className="relative w-full max-w-sm bg-[#FBF7F0] border border-[#2D241E]/15 rounded-[28px] shadow-2xl p-6 flex flex-col gap-4 text-[#2D241E]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <div>
              <h3 className="font-bold text-base text-[#2D241E] leading-tight">
                Mole's Compost Pile
              </h3>
              <p className="text-xs text-[#2D241E]/65">
                Speed Sorting • Gather +{COMPOST_MINIGAME_REWARD} Fertilizer
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

        {/* Status Tracker: Timer & Score */}
        <div className="flex items-center justify-between bg-white/70 border border-[#2D241E]/10 rounded-2xl px-3.5 py-2">
          {/* Timer */}
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Timer
              className={`w-4 h-4 ${
                timeLeft <= 3.0 ? 'text-rose-500 animate-pulse' : 'text-amber-600'
              }`}
            />
            <span
              className={
                timeLeft <= 3.0 ? 'text-rose-600 font-extrabold' : 'text-[#2D241E]'
              }
            >
              {timeLeft.toFixed(1)}s
            </span>
          </div>

          {/* Goal Dots */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-[#2D241E]/70">Sorted:</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={`score-dot-${i}`}
                  className={`w-2.5 h-2.5 rounded-full border transition-all ${
                    i < score
                      ? 'bg-emerald-500 border-emerald-600 scale-110'
                      : 'bg-[#2D241E]/10 border-[#2D241E]/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 3x3 Soil Burrows Grid */}
        <div className="grid grid-cols-3 gap-2.5 bg-[#4A3222] p-3 rounded-2xl border-2 border-[#69462F] shadow-inner">
          {grid.map((cell, idx) => (
            <button
              key={`cell-${cell.id}`}
              type="button"
              disabled={won || isGameOver}
              onClick={() => handleCellClick(idx)}
              className="h-16 bg-[#F5EFE6] border border-[#2D241E]/15 rounded-xl flex flex-col items-center justify-center gap-0.5 shadow active:scale-90 transition-transform cursor-pointer hover:bg-white disabled:cursor-not-allowed"
            >
              <span className="text-2xl select-none">{cell.icon}</span>
              <span className="text-[10px] font-semibold text-[#2D241E]/75 truncate max-w-[80%]">
                {cell.name}
              </span>
            </button>
          ))}
        </div>

        {/* Dynamic Feedback Message */}
        <div className="h-6 flex items-center justify-center text-xs font-bold text-center">
          {feedback ? (
            <span
              className={
                feedback.includes('-1.0s')
                  ? 'text-rose-600 animate-shake'
                  : 'text-emerald-700'
              }
            >
              {feedback}
            </span>
          ) : isGameOver ? (
            <span className="text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Time expired! Try again.
            </span>
          ) : (
            <span className="text-[#2D241E]/60 text-[11px]">
              Tap 5 organic items 🍃. Avoid stones & cans 🪨!
            </span>
          )}
        </div>

        {/* Result Action Button */}
        {isGameOver && (
          <button
            type="button"
            onClick={handleRestart}
            className="w-full py-3 rounded-2xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-md active:scale-95 transition-all cursor-pointer"
          >
            Try Again
          </button>
        )}

        {won && (
          <div className="py-2 flex items-center justify-center gap-2 text-emerald-800 font-bold text-sm animate-bounce">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Compost Ready! Adding to inventory...
          </div>
        )}
      </div>
    </div>
  );
};
