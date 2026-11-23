import {
  AlertCircle,
  Check,
  Clock,
  Coins,
  Package,
  Scroll,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getMerchant } from '../../game/config/merchants';
import { useGameStore } from '../../game/store/useGameStore';

interface MerchantSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Departing now';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

export const MerchantSheet: React.FC<MerchantSheetProps> = ({ isOpen, onClose }) => {
  const merchantVisit = useGameStore((s) => s.merchantVisit);
  const coins = useGameStore((s) => s.coins);
  const buyMerchantOffer = useGameStore((s) => s.buyMerchantOffer);
  const summonMerchant = useGameStore((s) => s.summonMerchant);
  const syncMerchant = useGameStore((s) => s.syncMerchant);

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Live timer for departure countdown
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      syncMerchant(now);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, syncMerchant]);

  if (!isOpen) return null;

  if (!merchantVisit) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col justify-end pointer-events-auto animate-fade-in"
      >
        <div
          className="fixed inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity"
          onClick={onClose}
        />
        <div className="relative z-10 bg-[#FBF7F0] border-t border-[#2D241E]/15 rounded-t-[28px] shadow-2xl p-6 max-w-md mx-auto w-full text-center text-[#2D241E]">
          <div className="w-10 h-1 bg-[#2D241E]/20 rounded-full mx-auto mb-4" />
          <h3 className="font-bold text-base">No Merchant Currently in Town</h3>
          <p className="text-xs text-[#2D241E]/70 mt-1">
            Wandering merchants arrive periodically with rare seeds and ancient scrolls.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => summonMerchant('raccoon')}
              className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer active:scale-95 transition-all"
            >
              Summon Raccoon
            </button>
            <button
              type="button"
              onClick={() => summonMerchant('owl')}
              className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer active:scale-95 transition-all"
            >
              Summon Owl
            </button>
          </div>
        </div>
      </div>
    );
  }

  const merchantDef = getMerchant(merchantVisit.merchantId);
  const secondsLeft = Math.max(
    0,
    Math.ceil((merchantVisit.leavesAt - currentTime) / 1000)
  );

  const handleBuy = (offerId: string) => {
    const result = buyMerchantOffer(offerId);
    if (result.success) {
      setFeedback({
        text: '✨ Purchased successfully! Added to your florist inventory.',
        type: 'success',
      });
    } else {
      setFeedback({
        text: result.reason ?? 'Cannot complete purchase.',
        type: 'error',
      });
    }
  };

  const handleSwitchMerchant = () => {
    summonMerchant(merchantVisit.merchantId === 'raccoon' ? 'owl' : 'raccoon');
    setFeedback(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col justify-end pointer-events-auto animate-fade-in"
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
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">
              {merchantVisit.merchantId === 'raccoon' ? '🦝' : '🦉'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#2D241E] leading-tight">
                  {merchantDef.displayName}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold uppercase tracking-wider">
                  {merchantDef.title}
                </span>
              </div>
              <p className="text-xs text-[#2D241E]/65 mt-0.5">
                Limited-time traveling caravan
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

        {/* Departure Countdown Banner */}
        <div className="mt-3.5 p-2.5 bg-white/70 border border-[#2D241E]/10 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 animate-spin-slow" />
            <span>Departs in:</span>
            <span className="font-bold text-sm text-[#2D241E]">
              {formatTimeRemaining(secondsLeft)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSwitchMerchant}
            className="text-[11px] text-amber-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
            title="Toggle between Raccoon and Owl"
          >
            <Sparkles className="w-3 h-3" />
            <span>Next Visitor ↻</span>
          </button>
        </div>

        {/* Merchant Dialogue Quote */}
        <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs italic text-[#2D241E]/80">
          "{merchantDef.quote}"
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Limited Caravan Wares */}
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2D241E]/75 uppercase tracking-wider">
              Exclusive Wares:
            </span>
            <span className="text-xs font-semibold text-amber-900 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>{coins} Coins Available</span>
            </span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[48vh] overflow-y-auto pr-1">
            {merchantVisit.offers.map((offer) => {
              const isSoldOut = offer.stock <= 0;
              const canAfford = coins >= offer.price;

              return (
                <div
                  key={offer.id}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 shadow-sm transition-all ${
                    isSoldOut
                      ? 'bg-stone-100/60 border-stone-200 opacity-60'
                      : 'bg-white/85 border-[#2D241E]/10 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-lg">
                        {offer.type === 'seed' ? (
                          <Package className="w-5 h-5 text-amber-700" />
                        ) : (
                          <Scroll className="w-5 h-5 text-purple-700" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#2D241E] leading-snug">
                          {offer.title}
                        </h4>
                        <p className="text-[11px] text-[#2D241E]/70 mt-0.5 leading-relaxed">
                          {offer.description}
                        </p>
                      </div>
                    </div>

                    {/* Stock counter */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isSoldOut
                          ? 'bg-stone-200 text-stone-600'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isSoldOut ? 'Sold Out' : `${offer.stock} left`}
                    </span>
                  </div>

                  {/* Price and Buy Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#2D241E]/5">
                    <div className="flex items-center gap-1 text-sm font-bold text-amber-900">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span>{offer.price} Coins</span>
                    </div>

                    <button
                      type="button"
                      disabled={isSoldOut || !canAfford}
                      onClick={() => handleBuy(offer.id)}
                      className="py-1.5 px-4 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      {isSoldOut
                        ? 'Sold Out'
                        : canAfford
                        ? 'Buy'
                        : `Need ${offer.price}c`}
                    </button>
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
