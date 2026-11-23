import {
  Star,
  Trophy,
  X,
} from 'lucide-react';
import React from 'react';
import { getLeaderboard, useGameStore } from '../../game/store/useGameStore';
import { getTelegramUser } from '../../telegram/tma';

interface LeaderboardSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardSheet: React.FC<LeaderboardSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const reputation = useGameStore((s) => s.reputation);
  const tgUser = getTelegramUser();

  if (!isOpen) return null;

  const leaderboard = getLeaderboard(reputation, tgUser.firstName);
  const playerRank = leaderboard.findIndex((entry) => entry.isPlayer) + 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-x-0 bottom-0 z-30 flex flex-col justify-end pointer-events-auto animate-fade-in"
    >
      {/* Semi-transparent backdrop */}
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Warm Cream Bottom Sheet */}
      <div className="relative z-10 bg-[#FBF7F0] border-t border-[#2D241E]/15 rounded-t-[28px] shadow-2xl p-5 max-w-md mx-auto w-full max-h-[88vh] overflow-y-auto animate-slide-up text-[#2D241E]">
        {/* Top Drag Handle */}
        <div className="w-10 h-1 bg-[#2D241E]/20 rounded-full mx-auto mb-3" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2D241E]/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <div>
              <h3 className="font-bold text-base text-[#2D241E] leading-tight">
                Florist Hall of Fame
              </h3>
              <p className="text-xs text-[#2D241E]/65">
                Top diorama florists ranked by garden reputation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2D241E]/5 hover:bg-[#2D241E]/10 flex items-center justify-center transition-colors text-[#2D241E]/70 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Player Standing Pill Banner */}
        <div className="mt-3.5 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-extrabold text-sm shadow">
              #{playerRank}
            </div>
            <div>
              <h4 className="font-bold text-xs text-[#2D241E]">
                Your Standing ({tgUser.firstName})
              </h4>
              <span className="text-[11px] text-amber-900 font-semibold block">
                {reputation} Total Reputation Points
              </span>
            </div>
          </div>
          <Trophy className="w-5 h-5 text-amber-600" />
        </div>

        {/* Top 10 List */}
        <div className="flex flex-col gap-2 mt-4 max-h-[50vh] overflow-y-auto pr-1">
          {leaderboard.map((entry, idx) => {
            const rank = idx + 1;

            return (
              <div
                key={entry.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                  entry.isPlayer
                    ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-400/40 shadow-sm'
                    : 'bg-white/85 border-[#2D241E]/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank indicator */}
                  <div className="w-7 text-center font-extrabold text-sm">
                    {rank === 1 && '🥇'}
                    {rank === 2 && '🥈'}
                    {rank === 3 && '🥉'}
                    {rank > 3 && (
                      <span className="text-xs text-[#2D241E]/60 font-bold">
                        #{rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar & Info */}
                  <span className="text-2xl">{entry.avatar}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-[#2D241E]">
                        {entry.name}
                      </h4>
                      {entry.isPlayer && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-600 text-white">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#2D241E]/60 font-medium block">
                      {entry.title}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl shrink-0">
                  <Star className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>{entry.reputation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
