import { Droplets, Sparkles, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  WELL_COOLDOWN_SEC,
  WELL_MINIGAME_REWARD,
} from '../../game/config/balance';
import { useGameStore } from '../../game/store/useGameStore';
import { haptic } from '../../telegram/tma';

interface BambooWellGameProps {
  onClose: () => void;
}

const TOTAL_HITS_NEEDED = 3;

export const BambooWellGame: React.FC<BambooWellGameProps> = ({ onClose }) => {
  const claimReward = useGameStore((s) => s.claimMinigameReward);

  const [hits, setHits] = useState(0);
  const [won, setWon] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Position: 0 to 100%
  const [markerPos, setMarkerPos] = useState(15);
  const directionRef = useRef(1); // 1 = right, -1 = left

  // Dynamic difficulty per stage: zone narrows and marker speeds up
  const stageConfig = [
    { start: 35, end: 65, speed: 70 }, // Hit 0: 30% wide zone
    { start: 40, end: 62, speed: 85 }, // Hit 1: 22% wide zone
    { start: 44, end: 60, speed: 100 }, // Hit 2: 16% wide zone
  ];
  const currentConfig = stageConfig[Math.min(hits, stageConfig.length - 1)];

  // Game animation loop
  useEffect(() => {
    if (won) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setMarkerPos((pos) => {
        let next = pos + directionRef.current * currentConfig.speed * dt;
        if (next >= 98) {
          next = 98;
          directionRef.current = -1;
        } else if (next <= 2) {
          next = 2;
          directionRef.current = 1;
        }
        return next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [won, currentConfig.speed]);

  const handlePour = () => {
    if (won) return;

    const isHit =
      markerPos >= currentConfig.start && markerPos <= currentConfig.end;

    if (isHit) {
      const nextHits = hits + 1;
      setHits(nextHits);

      if (nextHits >= TOTAL_HITS_NEEDED) {
        setWon(true);
        haptic('success');
        setFeedback('✨ Pure Bamboo Spring Water Gathered!');
        claimReward('well', WELL_MINIGAME_REWARD, WELL_COOLDOWN_SEC);
        setTimeout(() => {
          onClose();
        }, 1600);
      } else {
        haptic('light');
        setFeedback(`💧 Perfect Pour! (${nextHits}/${TOTAL_HITS_NEEDED})`);
        setTimeout(() => setFeedback(null), 800);
      }
    } else {
      haptic('error');
      setFeedback('💦 Spilled! Keep steady and try again.');
      setTimeout(() => setFeedback(null), 800);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto"
    >
      <div className="relative w-full max-w-sm bg-[#FBF7F0] border border-[#2D241E]/15 rounded-[28px] shadow-2xl p-6 flex flex-col gap-5 text-[#2D241E]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎋</span>
            <div>
              <h3 className="font-bold text-base text-[#2D241E] leading-tight">
                Bamboo Spring Well
              </h3>
              <p className="text-xs text-[#2D241E]/65">
                Timing Minigame • Gather +{WELL_MINIGAME_REWARD} Water
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

        {/* Instructions & Progress Indicator */}
        <div className="text-center flex flex-col gap-2">
          <p className="text-xs font-medium text-[#2D241E]/75">
            Tap <strong className="text-sky-800">Pour!</strong> when the marker slides
            inside the <strong className="text-emerald-700">green sweet spot</strong>.
          </p>

          {/* 3 Hit Dots */}
          <div className="flex justify-center items-center gap-2 mt-1">
            {[0, 1, 2].map((i) => (
              <div
                key={`hit-dot-${i}`}
                className={`w-3 h-3 rounded-full border transition-all ${
                  i < hits
                    ? 'bg-sky-500 border-sky-600 scale-110 shadow-sm'
                    : 'bg-[#2D241E]/10 border-[#2D241E]/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bamboo Chute & Timing Bar */}
        <div className="relative w-full h-14 bg-[#EADCC8] border-2 border-[#936639] rounded-2xl overflow-hidden shadow-inner flex items-center px-1">
          {/* Subtle Bamboo Segments Texture */}
          <div className="absolute inset-0 flex justify-between pointer-events-none opacity-30">
            <div className="w-1.5 h-full bg-[#784E25]" />
            <div className="w-1.5 h-full bg-[#784E25]" />
            <div className="w-1.5 h-full bg-[#784E25]" />
          </div>

          {/* Green Sweet Spot Zone */}
          <div
            className="absolute top-1 bottom-1 bg-gradient-to-r from-emerald-400 to-green-500/90 rounded-xl border border-emerald-600 shadow-md transition-all duration-300 flex items-center justify-center"
            style={{
              left: `${currentConfig.start}%`,
              width: `${currentConfig.end - currentConfig.start}%`,
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white/90 animate-pulse" />
          </div>

          {/* Moving Marker */}
          <div
            className="absolute top-0 bottom-0 w-4 -ml-2 flex flex-col items-center justify-between pointer-events-none transition-transform"
            style={{ left: `${markerPos}%` }}
          >
            <div className="w-3 h-2 bg-amber-700 rounded-b-sm shadow" />
            <div className="w-1.5 h-full bg-amber-600 shadow-sm" />
            <div className="w-3 h-2 bg-amber-700 rounded-t-sm shadow" />
          </div>
        </div>

        {/* Feedback text */}
        <div className="h-6 flex items-center justify-center text-xs font-bold text-center">
          {feedback && (
            <span
              className={
                feedback.includes('Spilled')
                  ? 'text-rose-600 animate-shake'
                  : 'text-sky-800'
              }
            >
              {feedback}
            </span>
          )}
        </div>

        {/* Big Tap Button */}
        <button
          type="button"
          disabled={won}
          onClick={handlePour}
          className="w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white shadow-lg shadow-sky-600/30 active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
        >
          <Droplets className="w-5 h-5 text-white animate-bounce" />
          {won ? 'Well Filled! ✨' : 'Pour!'}
        </button>
      </div>
    </div>
  );
};
