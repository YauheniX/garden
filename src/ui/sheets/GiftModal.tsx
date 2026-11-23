import {
  Coins,
  Gift,
  PackageCheck,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { getFlower } from '../../game/config/flowers';
import { useGameStore } from '../../game/store/useGameStore';
import type { DecodedGift } from '../../telegram/gifts';

interface GiftModalProps {
  gift: DecodedGift;
  onClose: () => void;
}

export const GiftModal: React.FC<GiftModalProps> = ({ gift, onClose }) => {
  const claimTelegramGift = useGameStore((s) => s.claimTelegramGift);
  const [claimed, setClaimed] = useState(false);
  const [opening, setOpening] = useState(false);

  const handleClaim = () => {
    setOpening(true);
    setTimeout(() => {
      const result = claimTelegramGift(gift.rawParam);
      if (result.success) {
        setClaimed(true);
        setOpening(false);
      }
    }, 600);
  };

  const bonusSeedDef = getFlower(gift.bonusSeeds.flowerId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in pointer-events-auto"
    >
      <div className="relative w-full max-w-sm bg-[#FBF7F0] border border-[#2D241E]/15 rounded-[28px] shadow-2xl p-6 flex flex-col gap-4 text-[#2D241E] text-center">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#2D241E]/5 hover:bg-[#2D241E]/10 flex items-center justify-center transition-colors text-[#2D241E]/70 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Gift Box Icon with opening animation */}
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-amber-400 p-0.5 shadow-lg flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-[#FBF7F0] flex items-center justify-center">
            <span
              className={`text-4xl transition-transform duration-500 ${
                opening ? 'scale-125 rotate-12 animate-bounce' : 'animate-pulse'
              }`}
            >
              {claimed ? '🌸' : '🎁'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="font-extrabold text-lg text-[#2D241E]">
            {claimed ? 'Bouquet Claimed!' : 'A Gift From a Friend!'}
          </h3>
          <p className="text-xs text-[#2D241E]/70 mt-1">
            {claimed
              ? 'The flowers and bonus seeds have been placed in your inventory.'
              : 'Someone sent you a hand-crafted floral bouquet via Telegram deep link!'}
          </p>
        </div>

        {/* Bouquet Preview Card */}
        <div className="p-3.5 bg-white/80 border border-[#2D241E]/10 rounded-2xl flex flex-col gap-2 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[#2D241E]">
              {gift.isSecretRecipe ? `✨ ${gift.bouquetName}` : gift.bouquetName}
            </span>
            <span className="text-xs font-bold text-amber-800">
              ~{gift.estimatedValue} coins
            </span>
          </div>

          {/* Flower ingredients pills */}
          <div className="flex flex-wrap gap-1 mt-1">
            {gift.flowers
              .reduce<
                Array<{
                  id: (typeof gift.flowers)[0]['id'];
                  quality: (typeof gift.flowers)[0]['quality'];
                  count: number;
                }>
              >((acc, fl) => {
                const existing = acc.find(
                  (item) => item.id === fl.id && item.quality === fl.quality
                );
                if (existing) {
                  existing.count++;
                } else {
                  acc.push({ id: fl.id, quality: fl.quality, count: 1 });
                }
                return acc;
              }, [])
              .map((fl) => {
                const def = getFlower(fl.id);
                return (
                  <span
                    key={`gift-fl-${fl.id}-${fl.quality}`}
                    className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-semibold text-[#2D241E] flex items-center gap-1"
                  >
                    <span>
                      🌸 {fl.count > 1 ? `${fl.count}x ` : ''}
                      {def.name}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-bold ${
                        fl.quality === 'shiny'
                          ? 'text-amber-700'
                          : fl.quality === 'rare'
                          ? 'text-purple-700'
                          : 'text-stone-500'
                      }`}
                    >
                      ({fl.quality})
                    </span>
                  </span>
                );
              })}
          </div>

          {/* Bonus extras */}
          <div className="pt-2 border-t border-[#2D241E]/10 flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>+{gift.bonusSeeds.count} {bonusSeedDef.name} Seeds</span>
            </span>
            <span className="flex items-center gap-1 text-amber-800 font-bold">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>+{gift.bonusCoins} Coins</span>
            </span>
          </div>
        </div>

        {/* Claim / Dismiss Action */}
        {!claimed ? (
          <button
            type="button"
            disabled={opening}
            onClick={handleClaim}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-lg shadow-rose-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Gift className="w-4 h-4 text-white animate-bounce" />
            <span>{opening ? 'Unwrapping...' : 'Unwrap & Claim Gift'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Open Florist Shop</span>
          </button>
        )}
      </div>
    </div>
  );
};
