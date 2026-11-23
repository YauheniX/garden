import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useMemo } from 'react';
import { useGameStore } from '../game/store/useGameStore';
import { AnimalNPC } from './AnimalNPC';
import { BambooShop } from './BambooShop';
import { GardenPlot } from './GardenPlot';
import { TabletopDiorama } from './TabletopDiorama';
import { WeatherFX } from './WeatherFX';

interface GardenSceneProps {
  selectedPlotId: string | null;
  onSelectPlot: (plotId: string | null) => void;
  onSelectShop: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export const GardenScene: React.FC<GardenSceneProps> = ({
  selectedPlotId,
  onSelectPlot,
  onSelectShop,
  onSelectOrder,
}) => {
  const plots = useGameStore((s) => s.plots);
  const activeOrders = useGameStore((s) => s.activeOrders);
  const weather = useGameStore((s) => s.weather);

  const bgColor = useMemo(() => {
    switch (weather) {
      case 'sunny':
        return '#F5EFE6';
      case 'rainy':
        return '#DCE5EB';
      case 'foggy':
        return '#E2E6E3';
    }
  }, [weather]);

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 7.5, 7.2], fov: 42 }}
        onPointerMissed={() => onSelectPlot(null)}
      >
        <color attach="background" args={[bgColor]} />

        {/* Ambient & Hemisphere lighting for soft low-poly ambient light */}
        <ambientLight intensity={0.55} />
        <hemisphereLight args={['#FFF5EB', '#7A6B5D', 0.85]} />

        {/* Warm sunlight casting crisp 1024x1024 soft directional shadows */}
        <directionalLight
          position={[6, 12, 5]}
          intensity={weather === 'rainy' ? 1.0 : weather === 'foggy' ? 1.2 : 1.6}
          color={weather === 'rainy' ? '#E0EEF8' : '#FFF6E5'}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={1}
          shadow-camera-far={26}
          shadow-camera-left={-7}
          shadow-camera-right={7}
          shadow-camera-top={7}
          shadow-camera-bottom={-7}
          shadow-bias={-0.0008}
        />

        {/* Orbit Controls with smooth damping & constrained polar viewing angles */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI / 2.25}
          minPolarAngle={Math.PI / 6}
          minDistance={4.2}
          maxDistance={14}
          target={[0, 0.4, -0.6]}
        />

        {/* 1. Low-poly wooden tabletop and surrounding scenery */}
        <TabletopDiorama />

        {/* 2. Low-poly Flower Stall & Cute Panda Florist */}
        <BambooShop onSelectShop={onSelectShop} />

        {/* 2b. Queued Animal NPC Customers */}
        <group name="animal-customers">
          {(activeOrders ?? []).slice(0, 3).map((order, idx) => (
            <AnimalNPC
              key={order.id}
              order={order}
              index={idx}
              onSelectNpc={(orderId) => {
                if (onSelectOrder) {
                  onSelectOrder(orderId);
                } else {
                  onSelectShop();
                }
              }}
            />
          ))}
        </group>

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

        {/* 4. Weather 3D FX (Sun particles, falling raindrops, ground mist) */}
        <WeatherFX />
      </Canvas>
    </div>
  );
};
