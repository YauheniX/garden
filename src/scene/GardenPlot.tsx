import { useFrame } from '@react-three/fiber';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { getFlower, type FlowerId } from '../game/config/flowers';
import { getPlotGrowthState } from '../game/engine/growth';
import { useGameStore, type GardenPlotState } from '../game/store/useGameStore';
import { haptic } from '../telegram/tma';

interface GardenPlotProps {
  plot: GardenPlotState;
  index: number;
  isSelected: boolean;
  onSelect: (plotId: string) => void;
}

export const GardenPlot: React.FC<GardenPlotProps> = ({
  plot,
  index,
  isSelected,
  onSelect,
}) => {
  const weather = useGameStore((s) => s.weather);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [hovered, setHovered] = useState(false);
  const stemRef = useRef<THREE.Group>(null);

  // Lightweight 1s interval to update growth stage visual without mutating store
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute 3D grid position for 3x3 layout
  const col = (index % 3) - 1; // -1, 0, 1
  const row = Math.floor(index / 3) - 1; // -1, 0, 1
  const spacing = 1.48;
  const x = col * spacing;
  const z = row * spacing - 0.2; // center on diorama

  // Determine current growth stage
  const flowerDef = plot.flowerId ? getFlower(plot.flowerId) : null;
  const growth =
    flowerDef && plot.plantedAt
      ? getPlotGrowthState({
          plantedAt: plot.plantedAt,
          baseGrowthSec: flowerDef.baseGrowthSec,
          isWatered: Boolean(plot.wateredAt),
          wateredAt: plot.wateredAt,
          weather,
          now: currentTime,
        })
      : null;

  const stage = growth?.stage ?? 'seed';
  const isBloomed = stage === 'bloom';
  const isWatered = Boolean(plot.wateredAt) || weather === 'rainy';

  // Gentle wind sway for growing flower
  useFrame(({ clock }) => {
    if (stemRef.current) {
      const t = clock.elapsedTime;
      stemRef.current.rotation.z = Math.sin(t * 2 + index * 0.7) * 0.04;
      stemRef.current.rotation.x = Math.cos(t * 1.5 + index * 0.5) * 0.03;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    haptic('light');
    onSelect(plot.id);
  };

  return (
    <group
      position={[x, 0.18, z]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 1. Wooden raised planter box */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.28, 0.16, 1.28]} />
        <meshStandardMaterial
          color={isSelected ? '#AA6E3B' : '#8A562E'}
          roughness={0.7}
          flatShading
        />
      </mesh>

      {/* 2. Soil Bed */}
      <mesh position={[0, 0.155, 0]} receiveShadow>
        <boxGeometry args={[1.12, 0.03, 1.12]} />
        <meshStandardMaterial
          color={
            !plot.unlocked
              ? '#382A20' // Dark dusty locked soil
              : isWatered
              ? '#2A180E' // Moist dark watered soil
              : '#5A3822' // Normal rich dry soil
          }
          roughness={isWatered ? 0.45 : 0.9}
          flatShading
        />
      </mesh>

      {/* 3. Locked Plot State: Wooden Cross Planks + Brass Padlock */}
      {!plot.unlocked && (
        <group position={[0, 0.18, 0]}>
          {/* Diagonal plank 1 */}
          <mesh rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.15, 0.04, 0.14]} />
            <meshStandardMaterial color="#4A2E19" roughness={0.8} flatShading />
          </mesh>
          {/* Diagonal plank 2 */}
          <mesh rotation={[0, -Math.PI / 4, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.15, 0.04, 0.14]} />
            <meshStandardMaterial color="#4A2E19" roughness={0.8} flatShading />
          </mesh>
          {/* Padlock Body */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <boxGeometry args={[0.2, 0.16, 0.08]} />
            <meshStandardMaterial
              color="#D4AF37"
              metalness={0.5}
              roughness={0.4}
              flatShading
            />
          </mesh>
          {/* Padlock Shackle */}
          <mesh position={[0, 0.18, 0]} castShadow>
            <torusGeometry args={[0.07, 0.02, 6, 8, Math.PI]} />
            <meshStandardMaterial
              color="#B38F27"
              metalness={0.6}
              roughness={0.4}
              flatShading
            />
          </mesh>
        </group>
      )}

      {/* 4. Fertilized Sparkles */}
      {plot.unlocked && plot.fertilized && (
        <group position={[0, 0.35, 0]}>
          {[-0.32, 0.32].map((sx) =>
            [-0.32, 0.32].map((sz) => (
              <mesh key={`sparkle-${sx}-${sz}`} position={[sx, Math.sin(index + sx + sz) * 0.05, sz]}>
                <octahedronGeometry args={[0.04, 0]} />
                <meshBasicMaterial color="#FBBF24" wireframe={false} />
              </mesh>
            ))
          )}
        </group>
      )}

      {/* 5. Flower mesh reflecting current growth stage */}
      {plot.unlocked && plot.flowerId && (
        <group ref={stemRef} position={[0, 0.16, 0]}>
          <FlowerVisual flowerId={plot.flowerId} stage={stage} isBloomed={isBloomed} />
        </group>
      )}

      {/* 6. Selection / Hover Ring */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.66, 0.74, 16]} />
          <meshBasicMaterial
            color={isSelected ? '#FACC15' : '#E2E8F0'}
            transparent
            opacity={isSelected ? 0.9 : 0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

interface FlowerVisualProps {
  flowerId: FlowerId;
  stage: 'seed' | 'sprout' | 'bud' | 'bloom';
  isBloomed: boolean;
}

const FlowerVisual: React.FC<FlowerVisualProps> = ({ flowerId, stage, isBloomed }) => {
  // Stage 1: Seed
  if (stage === 'seed') {
    return (
      <group position={[0, 0.02, 0]}>
        {/* Tiny soil mound */}
        <mesh castShadow receiveShadow>
          <coneGeometry args={[0.12, 0.06, 6]} />
          <meshStandardMaterial color="#4A2E1B" roughness={0.9} flatShading />
        </mesh>
        {/* Tiny green tip */}
        <mesh position={[0, 0.05, 0]}>
          <coneGeometry args={[0.03, 0.08, 5]} />
          <meshStandardMaterial color="#7CB342" roughness={0.7} flatShading />
        </mesh>
      </group>
    );
  }

  // Stage 2: Sprout
  if (stage === 'sprout') {
    return (
      <group position={[0, 0.02, 0]}>
        {/* Little stem */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.03, 0.2, 5]} />
          <meshStandardMaterial color="#558B2F" roughness={0.7} flatShading />
        </mesh>
        {/* Two cute angled leaves */}
        <mesh position={[-0.08, 0.16, 0]} rotation={[0, 0, -0.6]} castShadow>
          <boxGeometry args={[0.12, 0.02, 0.08]} />
          <meshStandardMaterial color="#7CB342" roughness={0.7} flatShading />
        </mesh>
        <mesh position={[0.08, 0.16, 0]} rotation={[0, 0, 0.6]} castShadow>
          <boxGeometry args={[0.12, 0.02, 0.08]} />
          <meshStandardMaterial color="#7CB342" roughness={0.7} flatShading />
        </mesh>
      </group>
    );
  }

  // Stage 3: Bud
  if (stage === 'bud') {
    return (
      <group position={[0, 0.02, 0]}>
        {/* Medium stem */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.035, 0.38, 6]} />
          <meshStandardMaterial color="#4E7E2C" roughness={0.7} flatShading />
        </mesh>
        {/* Leaf */}
        <mesh position={[-0.09, 0.18, 0]} rotation={[0, 0, -0.5]} castShadow>
          <boxGeometry args={[0.14, 0.02, 0.09]} />
          <meshStandardMaterial color="#689F38" roughness={0.7} flatShading />
        </mesh>
        {/* Swollen colorful closed bud */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <sphereGeometry args={[0.11, 7, 6]} />
          <meshStandardMaterial
            color={getFlowerPrimaryColor(flowerId)}
            roughness={0.6}
            flatShading
          />
        </mesh>
      </group>
    );
  }

  // Stage 4: Bloom (Full 3D Low-Poly Flower Blossom)
  return (
    <group position={[0, 0.02, 0]}>
      {/* Tall Stem */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.04, 0.54, 6]} />
        <meshStandardMaterial color="#4A752B" roughness={0.7} flatShading />
      </mesh>

      {/* Stem Leaves */}
      <mesh position={[-0.12, 0.24, 0]} rotation={[0, 0, -0.45]} castShadow>
        <boxGeometry args={[0.18, 0.025, 0.1]} />
        <meshStandardMaterial color="#689F38" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0.12, 0.32, 0]} rotation={[0, 0, 0.45]} castShadow>
        <boxGeometry args={[0.18, 0.025, 0.1]} />
        <meshStandardMaterial color="#689F38" roughness={0.7} flatShading />
      </mesh>

      {/* Specific Floral Bloom Meshes */}
      <group position={[0, 0.58, 0]}>
        {flowerId === 'daisy' && (
          <group>
            {/* Golden Core */}
            <mesh castShadow>
              <cylinderGeometry args={[0.12, 0.12, 0.06, 8]} />
              <meshStandardMaterial color="#FACC15" roughness={0.5} flatShading />
            </mesh>
            {/* White Petal Ring */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((p) => {
              const angle = (p * Math.PI) / 4;
              return (
                <mesh
                  key={p}
                  position={[Math.cos(angle) * 0.2, 0, Math.sin(angle) * 0.2]}
                  rotation={[0, -angle, 0]}
                  castShadow
                >
                  <boxGeometry args={[0.16, 0.03, 0.09]} />
                  <meshStandardMaterial color="#FFFFFF" roughness={0.6} flatShading />
                </mesh>
              );
            })}
          </group>
        )}

        {flowerId === 'tulip' && (
          <group>
            {/* Cup Petals */}
            <mesh castShadow>
              <cylinderGeometry args={[0.2, 0.12, 0.32, 7]} />
              <meshStandardMaterial color="#F472B6" roughness={0.6} flatShading />
            </mesh>
            {/* Inner Gold Stamen */}
            <mesh position={[0, 0.14, 0]}>
              <coneGeometry args={[0.06, 0.12, 5]} />
              <meshBasicMaterial color="#FDE047" />
            </mesh>
          </group>
        )}

        {flowerId === 'lavender' && (
          <group position={[0, 0.08, 0]}>
            {/* Purple Segmented Floral Spike */}
            {[0, 0.1, 0.2, 0.28].map((yOff, segIdx) => (
              <mesh key={`lavender-seg-${yOff}`} position={[0, yOff, 0]} castShadow>
                <dodecahedronGeometry args={[0.13 - segIdx * 0.02, 0]} />
                <meshStandardMaterial color="#A855F7" roughness={0.6} flatShading />
              </mesh>
            ))}
          </group>
        )}

        {flowerId === 'sunflower' && (
          <group rotation={[0.2, 0, 0]}>
            {/* Dark Seed Center */}
            <mesh castShadow>
              <cylinderGeometry args={[0.2, 0.2, 0.07, 10]} />
              <meshStandardMaterial color="#5C3B1E" roughness={0.8} flatShading />
            </mesh>
            {/* Radiant Golden Outer Fringe */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => {
              const angle = (p * Math.PI) / 5;
              return (
                <mesh
                  key={p}
                  position={[Math.cos(angle) * 0.28, 0, Math.sin(angle) * 0.28]}
                  rotation={[0, -angle, -Math.PI / 2]}
                  castShadow
                >
                  <coneGeometry args={[0.09, 0.22, 5]} />
                  <meshStandardMaterial color="#FBBF24" roughness={0.5} flatShading />
                </mesh>
              );
            })}
          </group>
        )}

        {flowerId === 'rose' && (
          <group>
            {/* Multi-layered crimson petals */}
            <mesh castShadow>
              <dodecahedronGeometry args={[0.22, 0]} />
              <meshStandardMaterial color="#E11D48" roughness={0.6} flatShading />
            </mesh>
            <mesh position={[0, 0.1, 0]} castShadow>
              <octahedronGeometry args={[0.13, 0]} />
              <meshStandardMaterial color="#BE123C" roughness={0.6} flatShading />
            </mesh>
          </group>
        )}

        {flowerId === 'orchid' && (
          <group>
            {/* Exotic Mystical Orchid Blossom */}
            <mesh position={[-0.14, 0.06, 0]} rotation={[0, 0, -0.4]} castShadow>
              <boxGeometry args={[0.22, 0.04, 0.16]} />
              <meshStandardMaterial color="#7C3AED" roughness={0.5} flatShading />
            </mesh>
            <mesh position={[0.14, 0.06, 0]} rotation={[0, 0, 0.4]} castShadow>
              <boxGeometry args={[0.22, 0.04, 0.16]} />
              <meshStandardMaterial color="#7C3AED" roughness={0.5} flatShading />
            </mesh>
            {/* Center lip petal */}
            <mesh position={[0, -0.06, 0.1]} rotation={[0.4, 0, 0]} castShadow>
              <boxGeometry args={[0.14, 0.04, 0.18]} />
              <meshStandardMaterial color="#C084FC" roughness={0.4} flatShading />
            </mesh>
            {/* Glowing bead */}
            <mesh position={[0, 0.04, 0.06]}>
              <sphereGeometry args={[0.06, 6, 6]} />
              <meshBasicMaterial color="#F472B6" />
            </mesh>
          </group>
        )}

        {/* Harvest readiness bloom sparkle */}
        {isBloomed && (
          <pointLight color="#FFF8DC" intensity={0.6} distance={1.2} />
        )}
      </group>
    </group>
  );
};

function getFlowerPrimaryColor(flowerId: FlowerId): string {
  switch (flowerId) {
    case 'daisy':
      return '#FEF08A';
    case 'tulip':
      return '#F472B6';
    case 'lavender':
      return '#C084FC';
    case 'sunflower':
      return '#F59E0B';
    case 'rose':
      return '#E11D48';
    case 'orchid':
      return '#8B5CF6';
  }
}
