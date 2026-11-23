import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  Coins,
  Flower2,
  Gift,
  Lock,
  ShoppingBag,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { getFlower, type FlowerId } from '../../game/config/flowers';
import { getNpc } from '../../game/config/npcs';
import { SECRET_RECIPES_LIST } from '../../game/config/recipes';
import {
  calculateBouquetPrice,
  isValidBouquetCount,
} from '../../game/engine/crafting';
import {
  calculateOrderReward,
  getOrderChecklist,
  validateOrderFulfillment,
} from '../../game/engine/orders';
import { useGameStore } from '../../game/store/useGameStore';
import { haptic, shareGiftLink } from '../../telegram/tma';

interface ShopSheetProps {
  isOpen: boolean;
  initialTab?: 'orders' | 'bench' | 'recipes';
  initialOrderId?: string | null;
  onClose: () => void;
}

const RECIPE_HINTS: Record<string, string> = {
  'daisy+daisy+tulip': 'A fresh spring mix with 2 common white daisies and a pink tulip.',
  'daisy+lavender+tulip': 'Soothing pastoral blend of 3 starter meadow flowers.',
  'lavender+rose+rose': 'A romantic trio pairing relaxing lavender with 2 crimson roses.',
  'daisy+lavender+sunflower+tulip': '4 twilight flowers crowned by a summer sunflower.',
  'rose+sunflower+sunflower+tulip': 'A royal arrangement of 2 radiant sunflowers, rose, and tulip.',
  'daisy+lavender+orchid+rose+sunflower':
    'The legendary 5-blossom symphony crowned by the Moon Orchid.',
};

export const ShopSheet: React.FC<ShopSheetProps> = ({
  isOpen,
  initialTab = 'orders',
  initialOrderId = null,
  onClose,
}) => {
  const activeOrders = useGameStore((s) => s.activeOrders);
  const harvestedFlowers = useGameStore((s) => s.harvestedFlowers);
  const unlockedRecipes = useGameStore((s) => s.unlockedRecipes);
  const fulfillOrder = useGameStore((s) => s.fulfillOrder);
  const sellFreeBouquet = useGameStore((s) => s.sellFreeBouquet);
  const wrapBouquetGift = useGameStore((s) => s.wrapBouquetGift);

  const [activeTab, setActiveTab] = useState<'orders' | 'bench' | 'recipes'>(initialTab);
  const [targetedOrderId, setTargetedOrderId] = useState<string | null>(initialOrderId);
  const [selectedHarvestIds, setSelectedHarvestIds] = useState<string[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  if (!isOpen) return null;

  const targetedOrder = targetedOrderId
    ? activeOrders.find((o) => o.id === targetedOrderId) ?? null
    : null;

  const handleSwitchTab = (tab: 'orders' | 'bench' | 'recipes') => {
    setActiveTab(tab);
    setFeedbackMsg(null);
  };

  const handleStartCraftForOrder = (orderId: string) => {
    setTargetedOrderId(orderId);
    setActiveTab('bench');
    setSelectedHarvestIds([]);
    setFeedbackMsg(null);
    haptic('light');
  };

  const handleToggleFlowerSelect = (id: string) => {
    setFeedbackMsg(null);
    if (selectedHarvestIds.includes(id)) {
      setSelectedHarvestIds((prev) => prev.filter((item) => item !== id));
      haptic('light');
    } else {
      if (selectedHarvestIds.length >= 5) {
        haptic('warning');
        return;
      }
      setSelectedHarvestIds((prev) => [...prev, id]);
      haptic('light');
    }
  };

  const handleClearSelection = () => {
    setSelectedHarvestIds([]);
    setFeedbackMsg(null);
  };

  // Resolve selected flowers objects from inventory
  const selectedFlowers = selectedHarvestIds
    .map((id) => harvestedFlowers.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));

  const flowerInputs = selectedFlowers.map((f) => ({
    id: f.flowerId,
    quality: f.quality,
  }));

  // Compute live bouquet craft result if valid count (3..5)
  const canCraft = isValidBouquetCount(selectedFlowers.length);
  const bouquetPreview = canCraft
    ? calculateBouquetPrice(flowerInputs)
    : null;

  // Compute order checklist & validation if an order is targeted
  const orderChecklist = targetedOrder
    ? getOrderChecklist(targetedOrder, flowerInputs)
    : null;

  const orderReward =
    targetedOrder && bouquetPreview && orderChecklist?.canDeliver
      ? calculateOrderReward(targetedOrder, bouquetPreview)
      : null;

  const handleFulfillActiveOrder = (orderToFulfill = targetedOrder) => {
    if (!orderToFulfill) return;
    const customer = getNpc(orderToFulfill.npcId);
    const result = fulfillOrder(orderToFulfill.id, selectedHarvestIds);
    if (result.success && result.reward) {
      setFeedbackMsg({
        text: `🎉 Delivered to ${customer.displayName}! +${result.reward.coins} Coins & +${result.reward.reputation} Rep!`,
        type: 'success',
      });
      setSelectedHarvestIds([]);
      setTargetedOrderId(null);
    } else {
      setFeedbackMsg({
        text: result.reason ?? 'Could not fulfill order.',
        type: 'error',
      });
    }
  };

  // Optional QoL: Check if current flowers satisfy any waiting NPC order in freeform mode
  let matchingWaitingOrder: (typeof activeOrders)[number] | null = null;
  if (!targetedOrder && canCraft) {
    const inputs = selectedFlowers.map((f) => ({ id: f.flowerId, quality: f.quality }));
    for (const order of activeOrders) {
      if (validateOrderFulfillment(order, inputs).valid) {
        matchingWaitingOrder = order;
        break;
      }
    }
  }

  const handleSellFreeBouquet = () => {
    const result = sellFreeBouquet(selectedHarvestIds);
    if (result) {
      setFeedbackMsg({
        text: `🌸 Sold "${result.bouquetName}" for +${result.finalPrice} Coins!`,
        type: 'success',
      });
      setSelectedHarvestIds([]);
    }
  };

  const handleWrapGift = () => {
    const result = wrapBouquetGift(selectedHarvestIds);
    if (result.success && result.giftParam && result.bouquet) {
      void shareGiftLink(
        'PandaFloristBot',
        result.giftParam,
        `🌸 I wrapped a special "${result.bouquet.bouquetName}" bouquet for you in Panda Florist! Tap to unwrap:`
      );
      setFeedbackMsg({
        text: `🎁 Wrapped "${result.bouquet.bouquetName}"! Link copied/opened.`,
        type: 'success',
      });
      setSelectedHarvestIds([]);
    } else {
      setFeedbackMsg({
        text: result.reason ?? 'Failed to wrap gift.',
        type: 'error',
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col justify-end pointer-events-auto animate-fade-in"
    >
      {/* Semi-transparent backdrop to dismiss */}
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Warm Cream Bottom Sheet */}
      <div className="relative z-10 bg-[#FBF7F0] border-t border-[#2D241E]/15 rounded-t-[28px] shadow-2xl p-5 max-w-md mx-auto w-full max-h-[88vh] overflow-y-auto animate-slide-up text-[#2D241E]">
        {/* Top Drag Handle */}
        <div className="w-10 h-1 bg-[#2D241E]/20 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2D241E]/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎋</span>
            <div>
              <h3 className="font-bold text-base text-[#2D241E] leading-tight">
                Panda's Flower Stall
              </h3>
              <p className="text-xs text-[#2D241E]/65">
                Animal customers, bouquet bench & secret recipes
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

        {/* 3 Tabs Switcher */}
        <div className="grid grid-cols-3 gap-1.5 mt-3.5 p-1 bg-white/70 border border-[#2D241E]/10 rounded-2xl">
          <button
            type="button"
            onClick={() => handleSwitchTab('orders')}
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-[#2D241E]/70 hover:bg-[#2D241E]/5'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders ({activeOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('bench')}
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'bench'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[#2D241E]/70 hover:bg-[#2D241E]/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bench</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('recipes')}
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'recipes'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-[#2D241E]/70 hover:bg-[#2D241E]/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Recipes ({unlockedRecipes.length}/6)</span>
          </button>
        </div>

        {/* Feedback Message Banner */}
        {feedbackMsg && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border animate-fade-in ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: ORDERS */}
        {/* ========================================================= */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-3 mt-4">
            <p className="text-xs text-[#2D241E]/65">
              Friendly diorama animals waiting for hand-crafted bouquets:
            </p>

            {activeOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#2D241E]/60">
                No active orders right now. Check back soon!
              </div>
            ) : (
              activeOrders.map((order) => {
                const npc = getNpc(order.npcId);
                const isTargeted = targetedOrderId === order.id;

                return (
                  <div
                    key={order.id}
                    className={`p-3.5 bg-white/80 border rounded-2xl flex flex-col gap-2.5 shadow-sm transition-all ${
                      isTargeted
                        ? 'border-amber-500 ring-2 ring-amber-400/30'
                        : 'border-[#2D241E]/10 hover:border-amber-500/40'
                    }`}
                  >
                    {/* Animal header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {order.npcId === 'rabbit' && '🐰'}
                          {order.npcId === 'bear' && '🐻'}
                          {order.npcId === 'fox' && '🦊'}
                          {order.npcId === 'capybara' && '🥔'}
                          {order.npcId === 'hedgehog' && '🦔'}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-[#2D241E]">
                            {npc.displayName}
                          </h4>
                          <span className="text-[10px] text-[#2D241E]/55 uppercase tracking-wider font-semibold">
                            {npc.species}
                          </span>
                        </div>
                      </div>

                      {/* Reward pill */}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                        <span>+{order.rewardCoinsMultiplier}x</span>
                        <span>•</span>
                        <Star className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                        <span>+{order.rewardReputation}</span>
                      </div>
                    </div>

                    {/* Animal Dialogue Quote */}
                    <p className="text-xs italic text-[#2D241E]/75 bg-[#FBF7F0] p-2 rounded-xl border border-[#2D241E]/5">
                      "{order.dialogue}"
                    </p>

                    {/* Order Requirements */}
                    <div className="flex items-center justify-between text-xs font-medium pt-1 border-t border-[#2D241E]/5">
                      <div className="flex items-center gap-1.5 text-xs text-[#2D241E]/80">
                        {order.type === 'recipe' ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[11px]">
                            📜 Recipe: {order.recipeName}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-semibold text-[11px]">
                            🌸 {order.flowerCount} flowers (≥{order.requiredTagCount} "{order.requiredTag}")
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartCraftForOrder(order.id)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Craft for {npc.displayName.split(' ')[0]}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: BOUQUET CRAFTING BENCH */}
        {/* ========================================================= */}
        {activeTab === 'bench' && (
          <div className="flex flex-col gap-3 mt-4">
            {/* Targeted Order Header Banner (if an order is selected) */}
            {targetedOrder ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {targetedOrder.npcId === 'rabbit' && '🐰'}
                    {targetedOrder.npcId === 'bear' && '🐻'}
                    {targetedOrder.npcId === 'fox' && '🦊'}
                    {targetedOrder.npcId === 'capybara' && '🥔'}
                    {targetedOrder.npcId === 'hedgehog' && '🦔'}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-[#2D241E]">
                      Crafting for {getNpc(targetedOrder.npcId).displayName}
                    </h4>
                    <span className="text-[11px] text-amber-900 font-medium block">
                      {targetedOrder.type === 'recipe'
                        ? `Needs "${targetedOrder.recipeName}"`
                        : `${targetedOrder.flowerCount} flowers (≥${targetedOrder.requiredTagCount} "${targetedOrder.requiredTag}")`}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTargetedOrderId(null)}
                  className="text-[11px] text-[#2D241E]/60 hover:text-[#2D241E] p-1 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                  title="Deselect customer to craft free bouquet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-2.5 bg-white/70 border border-[#2D241E]/10 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-[#2D241E]/70">
                  Crafting Freeform Bouquet for instant sale
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-amber-800 font-bold hover:underline cursor-pointer"
                >
                  Pick Customer Order →
                </button>
              </div>
            )}

            {/* Live Requirements Checklist Card when an Order is Targeted */}
            {targetedOrder && orderChecklist && (
              <div className="p-3 bg-white/90 border border-amber-200/80 rounded-2xl flex flex-col gap-2 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-[#2D241E]">
                  <span className="flex items-center gap-1.5">
                    <span>📋</span>
                    <span>Order Requirements</span>
                  </span>
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                      orderChecklist.canDeliver
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {orderChecklist.canDeliver ? 'Ready to Deliver 🎉' : 'In Progress ⏳'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Requirement 1: Flower Count */}
                  <div
                    className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                      orderChecklist.flowerCountOk
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold'
                        : 'bg-[#2D241E]/5 border-[#2D241E]/10 text-[#2D241E]/80'
                    }`}
                  >
                    <span className="truncate">🌸 Flowers</span>
                    <span className="font-bold shrink-0 ml-1">
                      {orderChecklist.currentFlowerCount} / {orderChecklist.requiredFlowerCount}
                      {orderChecklist.flowerCountOk ? ' ✅' : ' ⏳'}
                    </span>
                  </div>

                  {/* Requirement 2: Tag Constraint or Secret Recipe */}
                  {targetedOrder.type === 'tag_constraint' ? (
                    <div
                      className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                        orderChecklist.tagRequirementOk
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-[#2D241E]/5 border-[#2D241E]/10 text-[#2D241E]/80'
                      }`}
                    >
                      <span className="truncate" title={`"${orderChecklist.tag}" flowers`}>
                        🏷️ &quot;{orderChecklist.tag}&quot;
                      </span>
                      <span className="font-bold shrink-0 ml-1">
                        {orderChecklist.currentTagCount} / {orderChecklist.requiredTagCount}
                        {orderChecklist.tagRequirementOk ? ' ✅' : ' ⏳'}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                        orderChecklist.recipeRequirementOk
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-[#2D241E]/5 border-[#2D241E]/10 text-[#2D241E]/80'
                      }`}
                    >
                      <span className="truncate" title={orderChecklist.requiredRecipeName}>
                        📜 Recipe
                      </span>
                      <span className="font-bold shrink-0 ml-1">
                        {orderChecklist.recipeRequirementOk ? 'Match ✅' : 'Recipe ⏳'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Helpful blossom hint for tag constraint */}
                {targetedOrder.type === 'tag_constraint' &&
                  !orderChecklist.tagRequirementOk &&
                  orderChecklist.matchingFlowerNames.length > 0 && (
                    <p className="text-[11px] text-[#2D241E]/70 bg-amber-50/60 p-2 rounded-xl border border-amber-200/50 leading-relaxed">
                      💡 Tip: <strong>&quot;{orderChecklist.tag}&quot;</strong> blossom found on{' '}
                      <span className="font-semibold text-amber-950">
                        {orderChecklist.matchingFlowerNames.join(', ')}
                      </span>.
                    </p>
                  )}
              </div>
            )}

            {/* Selected Flowers Tray (3 to 5 Slots) */}
            <div className="p-3 bg-white/80 border border-[#2D241E]/10 rounded-2xl flex flex-col gap-2 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-[#2D241E]">
                <span className="flex items-center gap-1.5">
                  <Flower2 className="w-4 h-4 text-emerald-600" />
                  <span>Bouquet Arrangement</span>
                </span>
                <span
                  className={
                    selectedFlowers.length >= 3
                      ? 'text-emerald-700 font-extrabold'
                      : 'text-amber-700'
                  }
                >
                  {selectedFlowers.length} / 5 flowers
                </span>
              </div>

              {/* 5 Slots */}
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map((slotIdx) => {
                  const flower = selectedFlowers[slotIdx];
                  const def = flower ? getFlower(flower.flowerId) : null;

                  return (
                    <div
                      key={`tray-slot-${slotIdx}`}
                      className={`h-16 rounded-xl border flex flex-col items-center justify-center p-1 text-center transition-all ${
                        flower
                          ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                          : slotIdx < 3
                          ? 'bg-[#2D241E]/5 border-dashed border-[#2D241E]/20 text-[#2D241E]/40'
                          : 'bg-[#2D241E]/3 border-dashed border-[#2D241E]/15 text-[#2D241E]/30'
                      }`}
                    >
                      {flower && def ? (
                        <>
                          <span className="text-base">🌸</span>
                          <span className="text-[10px] font-bold text-[#2D241E] truncate max-w-full">
                            {def.name}
                          </span>
                          <span
                            className={`text-[8px] font-extrabold uppercase px-1 rounded ${
                              flower.quality === 'shiny'
                                ? 'bg-amber-200 text-amber-900'
                                : flower.quality === 'rare'
                                ? 'bg-purple-200 text-purple-900'
                                : 'text-[#2D241E]/60'
                            }`}
                          >
                            {flower.quality}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] font-medium">
                          {slotIdx < 3 ? 'Req' : 'Opt'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Live Preview / Validation Banner */}
              {bouquetPreview && (
                <div className="mt-1 p-2.5 bg-gradient-to-r from-amber-50 to-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2D241E]">
                      {bouquetPreview.isSecretRecipe
                        ? `✨ ${bouquetPreview.bouquetName}`
                        : bouquetPreview.bouquetName}
                    </span>
                    <span className="font-extrabold text-amber-900">
                      {orderReward
                        ? `~${orderReward.coins} Coins (+${orderReward.reputation} Rep)`
                        : `~${bouquetPreview.finalPrice} Coins`}
                    </span>
                  </div>

                  {/* Order fulfillment status */}
                  {targetedOrder && (
                    <div className="text-[11px] font-semibold mt-0.5">
                      {orderChecklist?.canDeliver ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Fulfills customer order!
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />{' '}
                          {orderChecklist?.reason}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Optional QoL: Delivery shortcut if freeform flowers match a waiting NPC order */}
              {matchingWaitingOrder && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-2 text-xs animate-fade-in shadow-sm">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold truncate">
                    <span className="text-sm shrink-0">⭐</span>
                    <span className="truncate">
                      Matches {getNpc(matchingWaitingOrder.npcId).displayName}&apos;s order!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFulfillActiveOrder(matchingWaitingOrder)}
                    className="shrink-0 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg shadow-sm text-[11px] cursor-pointer active:scale-95 transition-all"
                  >
                    Deliver (+Bonus)
                  </button>
                </div>
              )}

              {/* Action Buttons Section */}
              <div className="flex flex-col gap-2 pt-1">
                {/* Disabled reason notice when order cannot be delivered */}
                {targetedOrder && orderChecklist && !orderChecklist.canDeliver && (
                  <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-medium text-[11px] leading-tight">
                      <strong>Deliver disabled:</strong> {orderChecklist.reason}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={selectedHarvestIds.length === 0}
                    onClick={handleClearSelection}
                    className="px-3 py-2 text-xs font-bold text-[#2D241E]/60 hover:text-[#2D241E] disabled:opacity-30 cursor-pointer"
                  >
                    Clear
                  </button>

                  {targetedOrder ? (
                    <button
                      type="button"
                      disabled={!orderChecklist?.canDeliver}
                      onClick={() => handleFulfillActiveOrder(targetedOrder)}
                      className="flex-1 py-2.5 px-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        Deliver to {getNpc(targetedOrder.npcId).displayName.split(' ')[0]} (+{orderReward?.coins ?? bouquetPreview?.finalPrice ?? 0} Coins)
                      </span>
                    </button>
                  ) : (
                    <div className="flex-1 flex gap-2">
                    <button
                      type="button"
                      disabled={!canCraft}
                      onClick={handleSellFreeBouquet}
                      className="flex-1 py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Sell (~{bouquetPreview?.finalPrice ?? 0}c)</span>
                    </button>
                    <button
                      type="button"
                      disabled={!canCraft}
                      onClick={handleWrapGift}
                      className="flex-1 py-2.5 px-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title="Wrap bouquet as a Telegram gift link for a friend"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Wrap Gift 🎁</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inventory Basket Picker Grid */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#2D241E]/75 tracking-wider uppercase">
                Harvested Basket ({harvestedFlowers.length} Available):
              </span>

              {harvestedFlowers.length === 0 ? (
                <div className="py-6 px-4 bg-white/50 border border-dashed border-[#2D241E]/15 rounded-2xl text-center text-xs text-[#2D241E]/60 flex flex-col items-center gap-1">
                  <span>🧺 Your flower basket is empty!</span>
                  <span>Harvest mature blossoms from your tabletop garden beds.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[35vh] overflow-y-auto pr-1">
                  {harvestedFlowers.map((flower) => {
                    const def = getFlower(flower.flowerId);
                    const isSelected = selectedHarvestIds.includes(flower.id);

                    return (
                      <button
                        key={flower.id}
                        type="button"
                        onClick={() => handleToggleFlowerSelect(flower.id)}
                        className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer shadow-sm ${
                          isSelected
                            ? 'bg-amber-100/90 border-amber-600 ring-2 ring-amber-500/40 scale-[0.98]'
                            : 'bg-white/80 border-[#2D241E]/10 hover:border-emerald-600/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#2D241E]">
                            {def.name}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                              flower.quality === 'shiny'
                                ? 'bg-amber-200 text-amber-900'
                                : flower.quality === 'rare'
                                ? 'bg-purple-200 text-purple-900'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {flower.quality}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#2D241E]/65">
                          <span className="truncate max-w-[90px]">
                            {def.tags.slice(0, 2).join(', ')}
                          </span>
                          <span className="font-semibold text-amber-800">
                            ~{def.baseSellPrice}c
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: RECIPE BOOK */}
        {/* ========================================================= */}
        {activeTab === 'recipes' && (
          <div className="flex flex-col gap-3 mt-4">
            <p className="text-xs text-[#2D241E]/65">
              Secret bouquet recipes discovered through experimental florist crafting:
            </p>

            <div className="flex flex-col gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {SECRET_RECIPES_LIST.map((recipe) => {
                const isUnlocked = unlockedRecipes.includes(recipe.key);

                return (
                  <div
                    key={recipe.id}
                    className={`p-3.5 rounded-2xl border flex flex-col gap-2 shadow-sm transition-all ${
                      isUnlocked
                        ? 'bg-white/85 border-purple-200 hover:border-purple-300'
                        : 'bg-stone-100/70 border-stone-200 opacity-80'
                    }`}
                  >
                    {/* Recipe Title & Multiplier Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isUnlocked ? (
                          <span className="text-lg">📜</span>
                        ) : (
                          <Lock className="w-4 h-4 text-stone-500" />
                        )}
                        <h4 className="font-bold text-sm text-[#2D241E]">
                          {isUnlocked ? recipe.name : '??? Secret Recipe'}
                        </h4>
                      </div>

                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                        {recipe.priceMultiplier}x Value
                      </span>
                    </div>

                    {/* Flower Ingredients */}
                    <div className="flex flex-wrap gap-1 text-xs">
                      {isUnlocked ? (
                        Object.entries(
                          recipe.flowers.reduce<Record<string, number>>((acc, flId) => {
                            acc[flId] = (acc[flId] ?? 0) + 1;
                            return acc;
                          }, {})
                        ).map(([flId, count]) => (
                          <span
                            key={`recipe-fl-${recipe.id}-${flId}`}
                            className="px-2 py-0.5 rounded-lg bg-[#FBF7F0] border border-[#2D241E]/10 font-medium text-[11px] text-[#2D241E]"
                          >
                            🌸 {count > 1 ? `${count}x ` : ''}
                            {getFlower(flId as FlowerId).name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-[#2D241E]/60 italic">
                          {RECIPE_HINTS[recipe.key] ??
                            `Requires ${recipe.flowers.length} mysterious blossoms...`}
                        </span>
                      )}
                    </div>

                    {/* Description if unlocked */}
                    {isUnlocked && (
                      <p className="text-[11px] text-[#2D241E]/70 italic mt-0.5">
                        "{recipe.description}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
