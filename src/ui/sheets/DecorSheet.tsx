import {
  Check,
  Coins,
  Paintbrush,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { DECOR_LIST, type DecorId } from '../../game/config/decor';
import { useGameStore } from '../../game/store/useGameStore';

interface DecorSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DecorSheet: React.FC<DecorSheetProps> = ({ isOpen, onClose }) => {
  const coins = useGameStore((s) => s.coins);
  const unlockedDecor = useGameStore((s) => s.unlockedDecor);
  const purchaseDecor = useGameStore((s) => s.purchaseDecor);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = (decorId: DecorId) => {
    const success = purchaseDecor(decorId);
    if (success) {
      setFeedbackMsg('✨ Decoration placed in your tabletop garden!');
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

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
            <span className="text-2xl">🏮</span>
            <div>
              <h3 className="font-bold text-base text-[#2D241E] leading-tight">
                Garden Decor Shop
              </h3>
              <p className="text-xs text-[#2D241E]/65">
                Beautify your tabletop diorama & gain passive garden buffs
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

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="mt-3 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Decor Catalog List */}
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2D241E]/75 uppercase tracking-wider">
              Available Ornaments ({unlockedDecor.length}/{DECOR_LIST.length} Built):
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-900">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>{coins} Coins</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[52vh] overflow-y-auto pr-1">
            {DECOR_LIST.map((decor) => {
              const isOwned = unlockedDecor.includes(decor.id);
              const canAfford = coins >= decor.coinCost;

              return (
                <div
                  key={decor.id}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 shadow-sm transition-all ${
                    isOwned
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-white/85 border-[#2D241E]/10 hover:border-emerald-600/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="text-2xl p-2 bg-[#FBF7F0] border border-[#2D241E]/10 rounded-xl shrink-0">
                        {decor.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-[#2D241E]">
                            {decor.displayName}
                          </h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-rose-500 text-rose-500" />
                            +{decor.reputationBonus} Rep
                          </span>
                        </div>
                        <p className="text-[11px] text-[#2D241E]/70 mt-0.5 leading-relaxed">
                          {decor.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Passive Buff Pill */}
                  <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{decor.passiveEffect}</span>
                  </div>

                  {/* Price & Buy Action */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#2D241E]/5">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-900">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      <span>{decor.coinCost} Coins</span>
                    </div>

                    {isOwned ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-xl flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Placed
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => handlePurchase(decor.id)}
                        className="py-1.5 px-4 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Paintbrush className="w-3.5 h-3.5" />
                        <span>Build ({decor.coinCost}c)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
