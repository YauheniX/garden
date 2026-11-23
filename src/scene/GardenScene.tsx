import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { NpcOrder } from '../game/engine/orders';
import { useGameStore } from '../game/store/useGameStore';
import { AnimalNPC } from './AnimalNPC';
import { BambooShop } from './BambooShop';
import { GardenDecor } from './GardenDecor';
import { GardenPlot } from './GardenPlot';
import { TabletopDiorama } from './TabletopDiorama';
import { TravelingMerchant } from './TravelingMerchant';
import { WeatherFX } from './WeatherFX';

interface GardenSceneProps {
  selectedPlotId: string | null;
  onSelectPlot: (plotId: string | null) => void;
  onSelectShop: () => void;
  onSelectOrder?: (orderId: string) => void;
  onSelectMerchant?: () => void;
  onOpenDecor?: () => void;
}

export const GardenScene: React.FC<GardenSceneProps> = ({
  selectedPlotId,
  onSelectPlot,
  onSelectShop,
  onSelectOrder,
  onSelectMerchant,
  onOpenDecor,
}) => {
  const plots = useGameStore((s) => s.plots);
  const activeOrders = useGameStore((s) => s.activeOrders);
  const merchantVisit = useGameStore((s) => s.merchantVisit);
  const weather = useGameStore((s) => s.weather);

  // Maintain local queue state to support walk-in and leaving walk-out animations
  interface QueuedCustomer {
    order: NpcOrder;
    slotIndex: number;
    isLeaving: boolean;
    spawnTime: number;
  }

  const [prevOrders, setPrevOrders] = useState(activeOrders);
  const [customerQueue, setCustomerQueue] = useState<QueuedCustomer[]>(() => {
    const initial = (activeOrders ?? []).slice(0, 3);
    return initial.map((order, slotIndex) => ({
      order,
      slotIndex,
      isLeaving: false,
      spawnTime: 0, // Initial load: already waiting at counter
    }));
  });

  // Track customer order arrivals and completions during render (official React pattern)
  if (activeOrders !== prevOrders) {
    setPrevOrders(activeOrders);
    const top3 = (activeOrders ?? []).slice(0, 3);
    const activeMap = new Map(top3.map((o, idx) => [o.id, { order: o, idx }]));
    const next: QueuedCustomer[] = [];

    // 1. Process existing customers in queue
    for (const item of customerQueue) {
      if (activeMap.has(item.order.id)) {
        // Still active: update slotIndex if line advanced
        const { idx } = activeMap.get(item.order.id)!;
        next.push({ ...item, slotIndex: idx, isLeaving: false });
        activeMap.delete(item.order.id);
      } else if (!item.isLeaving) {
        // Newly fulfilled / removed: transition to leaving
        next.push({ ...item, isLeaving: true });
      } else {
        // Already leaving: keep until exit complete
        next.push(item);
      }
    }

    // 2. Add newly arrived orders (walking in from entrance)
    for (const [, { order, idx }] of activeMap) {
      next.push({
        order,
        slotIndex: idx,
        isLeaving: false,
        spawnTime: 1, // Newly arrived order
      });
    }

    setCustomerQueue(next);
  }

  const handleExitComplete = useCallback((orderId: string) => {
    setCustomerQueue((prev) => prev.filter((item) => item.order.id !== orderId));
  }, []);

  // Safety cleanup in case an exit event was missed
  useEffect(() => {
    const hasLeaving = customerQueue.some((c) => c.isLeaving);
    if (!hasLeaving) return;
    const timer = setTimeout(() => {
      setCustomerQueue((prev) => prev.filter((item) => !item.isLeaving));
    }, 4000);
    return () => clearTimeout(timer);
  }, [customerQueue]);

  const bgColor = useMemo(() => {
    switch (weather) {
      case 'sunny':
        return '#F5E6D3';
      case 'rainy':
        return '#DCE5EB';
      case 'foggy':
        return '#E2E6E3';
    }
  }, [weather]);

  const hemiSky = useMemo(() => {
    switch (weather) {
      case 'sunny':
        return '#FFF8E7';
      case 'rainy':
        return '#D0E4F0';
      case 'foggy':
        return '#E8ECE8';
    }
  }, [weather]);

  const hemiGround = useMemo(() => {
    switch (weather) {
      case 'sunny':
        return '#6B8E4E';
      case 'rainy':
        return '#4A6242';
      case 'foggy':
        return '#5A7252';
    }
  }, [weather]);

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 6.2, 7.8], fov: 42 }}
        onPointerMissed={() => onSelectPlot(null)}
      >
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={[bgColor, 16, 36]} />

        {/* Ambient & Warm-Cool Hemisphere lighting for soft low-poly shadows */}
        <ambientLight intensity={0.5} />
        <hemisphereLight args={[hemiSky, hemiGround, 0.85]} />

        {/* Warm golden-hour sunlight casting soft directional shadows */}
        <directionalLight
          position={[7, 13, 6]}
          intensity={weather === 'rainy' ? 1.1 : weather === 'foggy' ? 1.3 : 1.8}
          color={weather === 'rainy' ? '#E0EEF8' : '#FFF2D6'}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={1}
          shadow-camera-far={28}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-bias={-0.0005}
          shadow-radius={3}
        />

        {/* Orbit Controls with smooth damping & constrained polar viewing angles */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 4}
          minDistance={4.2}
          maxDistance={14}
          target={[0, 0.3, -0.4]}
        />

        {/* 1. Low-poly wooden tabletop and surrounding scenery */}
        <TabletopDiorama />

        {/* 2. Low-poly Flower Stall & Cute Panda Florist */}
        <BambooShop onSelectShop={onSelectShop} />

        {/* 2b. Queued Animal NPC Customers (with walk-in and walk-out animations) */}
        <group name="animal-customers">
          {customerQueue.map((item) => (
            <AnimalNPC
              key={item.order.id}
              order={item.order}
              index={item.slotIndex}
              isLeaving={item.isLeaving}
              spawnTime={item.spawnTime}
              onSelectNpc={(orderId) => {
                if (onSelectOrder) {
                  onSelectOrder(orderId);
                } else {
                  onSelectShop();
                }
              }}
              onExitComplete={handleExitComplete}
            />
          ))}
        </group>

        {/* 2c. Traveling Merchant (Wandering Raccoon or Wise Owl) */}
        {merchantVisit && (
          <TravelingMerchant
            visit={merchantVisit}
            onSelectMerchant={onSelectMerchant ?? onSelectShop}
          />
        )}

        {/* 3. The 9 Raised Garden Plots */}
        <group name="plots-grid">
          {plots.map((plot, idx) => (
            <GardenPlot
              key={plot.id}
              plot={plot}
              index={idx}
              isSelected={selectedPlotId === plot.id}
              onSelect={onSelectPlot}
            />
          ))}
        </group>

        {/* 3b. Interactive 3D Garden Decorations */}
        <GardenDecor onOpenDecorSheet={onOpenDecor} />

        {/* 4. Weather 3D FX (Sun particles, falling raindrops, ground mist) */}
        <WeatherFX />
      </Canvas>
    </div>
  );
};
