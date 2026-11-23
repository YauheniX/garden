import React, { useEffect, useState } from 'react';
import { useGameStore } from './game/store/useGameStore';
import { GardenScene } from './scene/GardenScene';
import { decodeGift, type DecodedGift } from './telegram/gifts';
import { getStartParam } from './telegram/tma';
import { TopHud } from './ui/hud/TopHud';
import { BambooWellGame } from './ui/minigames/BambooWellGame';
import { MoleCompostGame } from './ui/minigames/MoleCompostGame';
import { DecorSheet } from './ui/sheets/DecorSheet';
import { GiftModal } from './ui/sheets/GiftModal';
import { LeaderboardSheet } from './ui/sheets/LeaderboardSheet';
import { MerchantSheet } from './ui/sheets/MerchantSheet';
import { PlotSheet } from './ui/sheets/PlotSheet';
import { ResourcesSheet } from './ui/sheets/ResourcesSheet';
import { ShopSheet } from './ui/sheets/ShopSheet';

export const App: React.FC = () => {
  const activeOrders = useGameStore((s) => s.activeOrders);
  const syncMerchant = useGameStore((s) => s.syncMerchant);

  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState<'orders' | 'bench' | 'recipes'>('orders');
  const [shopOrderId, setShopOrderId] = useState<string | null>(null);

  const [merchantOpen, setMerchantOpen] = useState(false);
  const [decorOpen, setDecorOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [pendingGift, setPendingGift] = useState<DecodedGift | null>(() => {
    const startParam = getStartParam();
    if (startParam && startParam.startsWith('g_')) {
      const received = useGameStore.getState().receivedGifts;
      if (!received.includes(startParam)) {
        const decoded = decodeGift(startParam);
        if (decoded.isValid) {
          return decoded;
        }
      }
    }
    return null;
  });

  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [resourcesTab, setResourcesTab] = useState<'water' | 'fertilizer'>('water');
  const [activeMinigame, setActiveMinigame] = useState<'well' | 'compost' | null>(null);

  // Periodic merchant arrival/departure check
  useEffect(() => {
    syncMerchant();
    const interval = setInterval(() => {
      syncMerchant();
    }, 10000);
    return () => clearInterval(interval);
  }, [syncMerchant]);

  const handleSelectShop = () => {
    setShopOrderId(null);
    setShopTab('orders');
    setShopOpen(true);
  };

  const handleSelectOrder = (orderId: string) => {
    setShopOrderId(orderId);
    setShopTab('bench');
    setShopOpen(true);
  };

  const handleOpenResources = (tab: 'water' | 'fertilizer') => {
    setResourcesTab(tab);
    setResourcesOpen(true);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#F5EFE6] select-none">
      {/* 1. Frosted-glass Top HUD */}
      <TopHud
        onOpenResources={handleOpenResources}
        onOpenMerchant={() => setMerchantOpen(true)}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
      />

      {/* 2. 3D Low-Poly Tabletop Diorama Scene */}
      <GardenScene
        selectedPlotId={selectedPlotId}
        onSelectPlot={setSelectedPlotId}
        onSelectShop={handleSelectShop}
        onSelectOrder={handleSelectOrder}
        onSelectMerchant={() => setMerchantOpen(true)}
        onOpenDecor={() => setDecorOpen(true)}
      />

      {/* 3. Warm Cream Bottom Sheet for Plots */}
      <PlotSheet
        plotId={selectedPlotId}
        onClose={() => setSelectedPlotId(null)}
        onOpenResources={handleOpenResources}
      />

      {/* 4. Warm Cream Bottom Sheet for Flower Stall (Orders, Bench, Recipe Book) */}
      <ShopSheet
        isOpen={shopOpen}
        initialTab={shopTab}
        initialOrderId={shopOrderId}
        onClose={() => {
          setShopOpen(false);
          setShopOrderId(null);
        }}
      />

      {/* 5. Warm Cream Bottom Sheet for Traveling Merchant (Wandering Raccoon / Wise Owl) */}
      <MerchantSheet
        isOpen={merchantOpen}
        onClose={() => setMerchantOpen(false)}
      />

      {/* 6. Warm Cream Bottom Sheet for Garden Decor */}
      <DecorSheet
        isOpen={decorOpen}
        onClose={() => setDecorOpen(false)}
      />

      {/* 7. Warm Cream Bottom Sheet for Hall of Fame Leaderboard */}
      <LeaderboardSheet
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
      />

      {/* 8. Incoming Friend Gift Received Modal Overlay */}
      {pendingGift && (
        <GiftModal
          gift={pendingGift}
          onClose={() => setPendingGift(null)}
        />
      )}

      {/* 9. Warm Cream Bottom Sheet for Water & Fertilizer Economy */}
      <ResourcesSheet
        isOpen={resourcesOpen}
        activeTab={resourcesTab}
        onTabChange={setResourcesTab}
        onClose={() => setResourcesOpen(false)}
        onPlayWell={() => setActiveMinigame('well')}
        onPlayCompost={() => setActiveMinigame('compost')}
      />

      {/* 10. Resource Minigames */}
      {activeMinigame === 'well' && (
        <BambooWellGame onClose={() => setActiveMinigame(null)} />
      )}
      {activeMinigame === 'compost' && (
        <MoleCompostGame onClose={() => setActiveMinigame(null)} />
      )}

      {/* 11. Floating Action Pill Dock for Quick Access */}
      <div className="fixed bottom-4 right-4 z-20 pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLeaderboardOpen(true)}
          className="backdrop-blur-md bg-[#FBF7F0]/95 hover:bg-white text-[#2D241E] border border-[#2D241E]/15 rounded-full px-3.5 py-2.5 shadow-lg flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          title="Hall of Fame Leaderboard"
        >
          <span className="text-base">🏆</span>
          <span className="hidden sm:inline">Ranks</span>
        </button>

        <button
          type="button"
          onClick={() => setDecorOpen(true)}
          className="backdrop-blur-md bg-[#FBF7F0]/95 hover:bg-white text-[#2D241E] border border-[#2D241E]/15 rounded-full px-3.5 py-2.5 shadow-lg flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          title="Garden Decor Shop"
        >
          <span className="text-base">🏮</span>
          <span className="hidden sm:inline">Decor</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShopOrderId(null);
            setShopTab('orders');
            setShopOpen(true);
          }}
          className="backdrop-blur-md bg-[#FBF7F0]/95 hover:bg-white text-[#2D241E] border border-[#2D241E]/15 rounded-full px-4 py-2.5 shadow-lg flex items-center gap-2 text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          <span className="text-base">🌸</span>
          <span>Stall</span>
          {activeOrders.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-extrabold animate-pulse">
              {activeOrders.length}
            </span>
          )}
        </button>
      </div>
    </main>
  );
};

export default App;
