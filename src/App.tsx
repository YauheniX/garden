import React, { useState } from 'react';
import { useGameStore } from './game/store/useGameStore';
import { GardenScene } from './scene/GardenScene';
import { TopHud } from './ui/hud/TopHud';
import { BambooWellGame } from './ui/minigames/BambooWellGame';
import { MoleCompostGame } from './ui/minigames/MoleCompostGame';
import { PlotSheet } from './ui/sheets/PlotSheet';
import { ResourcesSheet } from './ui/sheets/ResourcesSheet';
import { ShopSheet } from './ui/sheets/ShopSheet';

export const App: React.FC = () => {
  const activeOrders = useGameStore((s) => s.activeOrders);

  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState<'orders' | 'bench' | 'recipes'>('orders');
  const [shopOrderId, setShopOrderId] = useState<string | null>(null);

  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [resourcesTab, setResourcesTab] = useState<'water' | 'fertilizer'>('water');
  const [activeMinigame, setActiveMinigame] = useState<'well' | 'compost' | null>(null);

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
      <TopHud onOpenResources={handleOpenResources} />

      {/* 2. 3D Low-Poly Tabletop Diorama Scene */}
      <GardenScene
        selectedPlotId={selectedPlotId}
        onSelectPlot={setSelectedPlotId}
        onSelectShop={handleSelectShop}
        onSelectOrder={handleSelectOrder}
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

      {/* 5. Warm Cream Bottom Sheet for Water & Fertilizer Economy */}
      <ResourcesSheet
        isOpen={resourcesOpen}
        activeTab={resourcesTab}
        onTabChange={setResourcesTab}
        onClose={() => setResourcesOpen(false)}
        onPlayWell={() => setActiveMinigame('well')}
        onPlayCompost={() => setActiveMinigame('compost')}
      />

      {/* 6. Resource Minigames */}
      {activeMinigame === 'well' && (
        <BambooWellGame onClose={() => setActiveMinigame(null)} />
      )}
      {activeMinigame === 'compost' && (
        <MoleCompostGame onClose={() => setActiveMinigame(null)} />
      )}

      {/* 7. Floating Action Pill for Quick Access to Shop & Orders */}
      <div className="fixed bottom-4 right-4 z-20 pointer-events-auto">
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
          <span>Florist Stall</span>
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
