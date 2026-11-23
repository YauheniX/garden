import React, { useState } from 'react';
import { GardenScene } from './scene/GardenScene';
import { TopHud } from './ui/hud/TopHud';
import { BambooWellGame } from './ui/minigames/BambooWellGame';
import { MoleCompostGame } from './ui/minigames/MoleCompostGame';
import { PlotSheet } from './ui/sheets/PlotSheet';
import { ResourcesSheet } from './ui/sheets/ResourcesSheet';

export const App: React.FC = () => {
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [shopToast, setShopToast] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [resourcesTab, setResourcesTab] = useState<'water' | 'fertilizer'>('water');
  const [activeMinigame, setActiveMinigame] = useState<'well' | 'compost' | null>(null);

  const handleSelectShop = () => {
    setShopToast(true);
    setTimeout(() => setShopToast(false), 2400);
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
      />

      {/* 3. Warm Cream Bottom Sheet for Plots */}
      <PlotSheet
        plotId={selectedPlotId}
        onClose={() => setSelectedPlotId(null)}
        onOpenResources={handleOpenResources}
      />

      {/* 4. Warm Cream Bottom Sheet for Water & Fertilizer Economy */}
      <ResourcesSheet
        isOpen={resourcesOpen}
        activeTab={resourcesTab}
        onTabChange={setResourcesTab}
        onClose={() => setResourcesOpen(false)}
        onPlayWell={() => setActiveMinigame('well')}
        onPlayCompost={() => setActiveMinigame('compost')}
      />

      {/* 5. Resource Minigames */}
      {activeMinigame === 'well' && (
        <BambooWellGame onClose={() => setActiveMinigame(null)} />
      )}
      {activeMinigame === 'compost' && (
        <MoleCompostGame onClose={() => setActiveMinigame(null)} />
      )}

      {/* Shop Notification Toast (Ready for Step 5 NPC / Merchant loop) */}
      {shopToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 backdrop-blur-md bg-[#2D241E]/90 text-[#FBF7F0] px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-white/10 animate-fade-in flex items-center gap-2">
          <span>🌸</span>
          <span>Panda Florist Stall: Bouquet orders coming in Step 5!</span>
        </div>
      )}
    </main>
  );
};

export default App;
