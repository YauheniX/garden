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

  // Compute 3D grid position for 3x3 layout with clear walkway on the right
  const col = (index % 3) - 1; // -1, 0, 1
  const row = Math.floor(index / 3) - 1; // -1, 0, 1
  const spacing = 1.38;
  const x = col * spacing - 0.45;
  const z = row * spacing + 0.2;

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
      stemRef.current.rotation.z = Math.sin(t * 2 + index * 0.7) * 0.035;
      stemRef.current.rotation.x = Math.cos(t * 1.5 + index * 0.5) * 0.025;
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
      {/* 1. Wooden raised planter box with corner posts */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.24, 0.16, 1.24]} />
        <meshStandardMaterial
          color={isSelected ? '#AA6E3B' : '#8A562E'}
          roughness={0.7}
          flatShading
        />
      </mesh>

      {/* 4 Corner Posts on raised planter */}
      {[
        [-0.56, -0.56],
        [0.56, -0.56],
        [-0.56, 0.56],
        [0.56, 0.56],
      ].map(([cx, cz]) => (
        <mesh key={`corner-${cx}-${cz}`} position={[cx, 0.1, cz]} castShadow receiveShadow>
          <cylinderGeometry args={[0.045, 0.05, 0.22, 6]} />
          <meshStandardMaterial color="#6B4121" roughness={0.75} flatShading />
        </mesh>
      ))}

      {/* 2. Mounded Low-Poly Soil Bed */}
      {/* Soil base */}
      <mesh position={[0, 0.155, 0]} receiveShadow>
        <boxGeometry args={[1.10, 0.03, 1.10]} />
        <meshStandardMaterial
          color={
            !plot.unlocked
              ? '#4E3827' // Locked soil
              : isWatered
              ? '#593E28' // Rich dark brown watered soil
              : '#A67C52' // Warm brown dry soil
          }
          roughness={isWatered ? 0.5 : 0.88}
          flatShading
        />
      </mesh>

      {/* Raised center soil mound */}
      <mesh position={[0, 0.18, 0]} receiveShadow>
        <cylinderGeometry args={[0.42, 0.50, 0.04, 7]} />
        <meshStandardMaterial
          color={
            !plot.unlocked
              ? '#483323'
              : isWatered
              ? '#4F3622'
              : '#9E744A'
          }
          roughness={isWatered ? 0.5 : 0.9}
          flatShading
        />
      </mesh>

      {/* 3. Locked Plot State: Cute Low Picket / Rope Barrier + Golden Padlock */}
      {!plot.unlocked && (
        <group position={[0, 0.18, 0]}>
          {/* 4 Rope Barrier Posts */}
          {[
            [-0.43, -0.43],
            [0.43, -0.43],
            [-0.43, 0.43],
            [0.43, 0.43],
          ].map(([px, pz]) => (
            <mesh key={`rope-post-${px}-${pz}`} position={[px, 0.12, pz]} castShadow receiveShadow>
              <cylinderGeometry args={[0.035, 0.04, 0.24, 6]} />
              <meshStandardMaterial color="#6B4121" roughness={0.8} flatShading />
            </mesh>
          ))}

          {/* Perimeter Rope Barrier Rails */}
          <mesh position={[0, 0.2, -0.43]} castShadow>
            <boxGeometry args={[0.86, 0.025, 0.025]} />
            <meshStandardMaterial color="#C29F68" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0, 0.2, 0.43]} castShadow>
            <boxGeometry args={[0.86, 0.025, 0.025]} />
            <meshStandardMaterial color="#C29F68" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[-0.43, 0.2, 0]} castShadow>
            <boxGeometry args={[0.025, 0.025, 0.86]} />
            <meshStandardMaterial color="#C29F68" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0.43, 0.2, 0]} castShadow>
            <boxGeometry args={[0.025, 0.025, 0.86]} />
            <meshStandardMaterial color="#C29F68" roughness={0.9} flatShading />
          </mesh>

          {/* Center Wooden Cross Peg */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.16, 6]} />
            <meshStandardMaterial color="#5C3B24" roughness={0.8} flatShading />
          </mesh>

          {/* Golden Padlock Body */}
          <mesh position={[0, 0.18, 0]} castShadow>
            <boxGeometry args={[0.2, 0.16, 0.08]} />
            <meshStandardMaterial
              color="#EAB308"
              metalness={0.45}
              roughness={0.4}
              flatShading
            />
          </mesh>
          {/* Golden Padlock Shackle */}
          <mesh position={[0, 0.28, 0]} castShadow>
            <torusGeometry args={[0.07, 0.022, 6, 8, Math.PI]} />
            <meshStandardMaterial
              color="#CA8A04"
              metalness={0.5}
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
                <meshBasicMaterial color="#FBBF24" />
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
        <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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
  // Stage 1: Seed / Tiny Emergent Shoots
  if (stage === 'seed') {
    return (
      <group position={[0, 0.02, 0]}>
        {/* Soil mounds */}
        <mesh castShadow receiveShadow>
          <coneGeometry args={[0.14, 0.07, 6]} />
          <meshStandardMaterial color="#4A2E1B" roughness={0.9} flatShading />
        </mesh>
        {/* 3 Tiny green emergent shoots */}
        <mesh position={[0, 0.06, 0]}>
          <coneGeometry args={[0.03, 0.08, 5]} />
          <meshStandardMaterial color="#7CB342" roughness={0.7} flatShading />
        </mesh>
        <mesh position={[-0.08, 0.04, 0.05]} rotation={[0, 0, -0.2]}>
          <coneGeometry args={[0.025, 0.06, 5]} />
          <meshStandardMaterial color="#8BC34A" roughness={0.7} flatShading />
        </mesh>
        <mesh position={[0.07, 0.04, -0.05]} rotation={[0, 0, 0.2]}>
          <coneGeometry args={[0.025, 0.06, 5]} />
          <meshStandardMaterial color="#8BC34A" roughness={0.7} flatShading />
        </mesh>
      </group>
    );
  }

  // Stage 2: Sprout (Multiple young stems & leaves)
  if (stage === 'sprout') {
    return (
      <group position={[0, 0.02, 0]}>
        {/* Main stem */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.03, 0.24, 5]} />
          <meshStandardMaterial color="#558B2F" roughness={0.7} flatShading />
        </mesh>
        {/* Companion sprout */}
        <mesh position={[-0.1, 0.08, 0.06]} rotation={[0.1, 0, -0.25]} castShadow>
          <cylinderGeometry args={[0.02, 0.025, 0.16, 5]} />
          <meshStandardMaterial color="#689F38" roughness={0.7} flatShading />
        </mesh>
        {/* Four cute angled leaves */}
        <mesh position={[-0.08, 0.18, 0]} rotation={[0, 0, -0.6]} castShadow>
          <boxGeometry args={[0.13, 0.02, 0.08]} />
          <meshStandardMaterial color="#7CB342" roughness={0.7} flatShading />
        </mesh>
        <mesh position={[0.08, 0.18, 0]} rotation={[0, 0, 0.6]} castShadow>
          <boxGeometry args={[0.13, 0.02, 0.08]} />
          <meshStandardMaterial color="#7CB342" roughness={0.7} flatShading />
        </mesh>
        <mesh position={[0, 0.15, 0.08]} rotation={[0.6, 0, 0]} castShadow>
          <boxGeometry args={[0.07, 0.02, 0.11]} />
          <meshStandardMaterial color="#7CB342" roughness={0.7} flatShading />
        </mesh>
      </group>
    );
  }

  // Stage 3: Bud (Main swollen bud + companion bud)
  if (stage === 'bud') {
    const budColor = getFlowerPrimaryColor(flowerId);
    return (
      <group position={[0, 0.02, 0]}>
        {/* Center stem */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.032, 0.038, 0.42, 6]} />
          <meshStandardMaterial color="#4E7E2C" roughness={0.7} flatShading />
        </mesh>
        {/* Secondary stem */}
        <mesh position={[-0.14, 0.15, 0.08]} rotation={[0.1, 0, -0.3]} castShadow>
          <cylinderGeometry args={[0.024, 0.03, 0.3, 5]} />
          <meshStandardMaterial color="#558B2F" roughness={0.7} flatShading />
        </mesh>

        {/* Leaves */}
        <mesh position={[-0.1, 0.19, 0]} rotation={[0, 0, -0.5]} castShadow>
          <boxGeometry args={[0.15, 0.02, 0.09]} />
          <meshStandardMaterial color="#689F38" roughness={0.7} flatShading />
        </mesh>
        <mesh position={[0.12, 0.24, -0.05]} rotation={[0, 0, 0.45]} castShadow>
          <boxGeometry args={[0.15, 0.02, 0.09]} />
          <meshStandardMaterial color="#689F38" roughness={0.7} flatShading />
        </mesh>

        {/* Main Swollen Bud */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <sphereGeometry args={[0.12, 7, 6]} />
          <meshStandardMaterial color={budColor} roughness={0.6} flatShading />
        </mesh>
        {/* Secondary smaller bud */}
        <mesh position={[-0.18, 0.32, 0.1]} castShadow>
          <sphereGeometry args={[0.08, 6, 5]} />
          <meshStandardMaterial color={budColor} roughness={0.6} flatShading />
        </mesh>
      </group>
    );
  }

  // Stage 4: Bloom (Fuller Multi-Blossom Cluster with Companion Blooms & Foliage)
  return (
    <group position={[0, 0.02, 0]}>
      {/* 1. Main Center Stem */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.042, 0.54, 6]} />
        <meshStandardMaterial color="#4A752B" roughness={0.7} flatShading />
      </mesh>

      {/* 2. Side Companion Stems for lush fuller garden look */}
      <mesh position={[-0.18, 0.2, 0.12]} rotation={[0.15, 0, -0.3]} castShadow>
        <cylinderGeometry args={[0.028, 0.034, 0.4, 5]} />
        <meshStandardMaterial color="#4E7C2E" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0.17, 0.18, -0.1]} rotation={[-0.12, 0, 0.28]} castShadow>
        <cylinderGeometry args={[0.026, 0.032, 0.36, 5]} />
        <meshStandardMaterial color="#4E7C2E" roughness={0.7} flatShading />
      </mesh>

      {/* 3. Lush Green Foliage Leaves */}
      <mesh position={[-0.14, 0.22, 0]} rotation={[0, 0, -0.45]} castShadow>
        <boxGeometry args={[0.2, 0.025, 0.11]} />
        <meshStandardMaterial color="#639934" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0.14, 0.28, 0]} rotation={[0, 0, 0.45]} castShadow>
        <boxGeometry args={[0.2, 0.025, 0.11]} />
        <meshStandardMaterial color="#639934" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 0.16, 0.16]} rotation={[0.5, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 0.025, 0.18]} />
        <meshStandardMaterial color="#689F38" roughness={0.7} flatShading />
      </mesh>

      {/* 4. Flower-Specific Floral Blossom Meshes (Main + Companion Blooms) */}
      {flowerId === 'daisy' && (
        <group>
          {/* Main Blossom */}
          <group position={[0, 0.58, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.12, 0.12, 0.06, 8]} />
              <meshStandardMaterial color="#FACC15" roughness={0.5} flatShading />
            </mesh>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((p) => {
              const angle = (p * Math.PI) / 4;
              return (
                <mesh
                  key={`main-petal-${p}`}
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

          {/* Left Companion Blossom */}
          <group position={[-0.24, 0.42, 0.14]} scale={0.68}>
            <mesh castShadow>
              <cylinderGeometry args={[0.11, 0.11, 0.05, 7]} />
              <meshStandardMaterial color="#FACC15" roughness={0.5} flatShading />
            </mesh>
            {[0, 1, 2, 3, 4, 5].map((p) => {
              const angle = (p * Math.PI) / 3;
              return (
                <mesh
                  key={`left-petal-${p}`}
                  position={[Math.cos(angle) * 0.18, 0, Math.sin(angle) * 0.18]}
                  rotation={[0, -angle, 0]}
                  castShadow
                >
                  <boxGeometry args={[0.14, 0.025, 0.08]} />
                  <meshStandardMaterial color="#FFFFFF" roughness={0.6} flatShading />
                </mesh>
              );
            })}
          </group>

          {/* Right Companion Bud */}
          <group position={[0.22, 0.38, -0.12]} scale={0.55}>
            <mesh castShadow>
              <sphereGeometry args={[0.1, 6, 6]} />
              <meshStandardMaterial color="#FEF08A" roughness={0.6} flatShading />
            </mesh>
          </group>
        </group>
      )}

      {flowerId === 'tulip' && (
        <group>
          {/* Main Tulip Cup */}
          <group position={[0, 0.58, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.2, 0.12, 0.32, 7]} />
              <meshStandardMaterial color="#F472B6" roughness={0.6} flatShading />
            </mesh>
            <mesh position={[0, 0.14, 0]}>
              <coneGeometry args={[0.06, 0.12, 5]} />
              <meshBasicMaterial color="#FDE047" />
            </mesh>
          </group>

          {/* Left Companion Tulip Cup */}
          <group position={[-0.24, 0.42, 0.14]} scale={0.72} rotation={[0.1, 0, -0.2]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.18, 0.11, 0.28, 6]} />
              <meshStandardMaterial color="#F472B6" roughness={0.6} flatShading />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <coneGeometry args={[0.05, 0.1, 5]} />
              <meshBasicMaterial color="#FDE047" />
            </mesh>
          </group>

          {/* Right Companion Tulip Bud */}
          <group position={[0.22, 0.38, -0.12]} scale={0.6} rotation={[-0.1, 0, 0.2]}>
            <mesh castShadow>
              <sphereGeometry args={[0.14, 6, 6]} />
              <meshStandardMaterial color="#EC4899" roughness={0.6} flatShading />
            </mesh>
          </group>
        </group>
      )}

      {flowerId === 'lavender' && (
        <group>
          {/* Main Central Lavender Spike */}
          <group position={[0, 0.62, 0]}>
            {[0, 0.1, 0.2, 0.28].map((yOff, segIdx) => (
              <mesh key={`lavender-main-${yOff}`} position={[0, yOff, 0]} castShadow>
                <dodecahedronGeometry args={[0.13 - segIdx * 0.02, 0]} />
                <meshStandardMaterial color="#A855F7" roughness={0.6} flatShading />
              </mesh>
            ))}
          </group>

          {/* Left Lavender Spike */}
          <group position={[-0.24, 0.46, 0.14]} scale={0.8} rotation={[0.1, 0, -0.2]}>
            {[0, 0.09, 0.18].map((yOff, segIdx) => (
              <mesh key={`lavender-left-${yOff}`} position={[0, yOff, 0]} castShadow>
                <dodecahedronGeometry args={[0.12 - segIdx * 0.02, 0]} />
                <meshStandardMaterial color="#9333EA" roughness={0.6} flatShading />
              </mesh>
            ))}
          </group>

          {/* Right Lavender Spike */}
          <group position={[0.22, 0.42, -0.12]} scale={0.75} rotation={[-0.1, 0, 0.2]}>
            {[0, 0.09, 0.18].map((yOff, segIdx) => (
              <mesh key={`lavender-right-${yOff}`} position={[0, yOff, 0]} castShadow>
                <dodecahedronGeometry args={[0.12 - segIdx * 0.02, 0]} />
                <meshStandardMaterial color="#A855F7" roughness={0.6} flatShading />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {flowerId === 'sunflower' && (
        <group>
          {/* Main Giant Center Sunflower */}
          <group position={[0, 0.58, 0]} rotation={[0.2, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.2, 0.2, 0.07, 10]} />
              <meshStandardMaterial color="#5C3B1E" roughness={0.8} flatShading />
            </mesh>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => {
              const angle = (p * Math.PI) / 5;
              return (
                <mesh
                  key={`sun-petal-${p}`}
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

          {/* Left Companion Young Sunflower */}
          <group position={[-0.24, 0.42, 0.14]} scale={0.65} rotation={[0.25, -0.2, -0.2]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.15, 0.15, 0.06, 8]} />
              <meshStandardMaterial color="#5C3B1E" roughness={0.8} flatShading />
            </mesh>
            {[0, 1, 2, 3, 4, 5, 6].map((p) => {
              const angle = (p * Math.PI) / 3.5;
              return (
                <mesh
                  key={`sun-left-petal-${p}`}
                  position={[Math.cos(angle) * 0.22, 0, Math.sin(angle) * 0.22]}
                  rotation={[0, -angle, -Math.PI / 2]}
                  castShadow
                >
                  <coneGeometry args={[0.07, 0.18, 5]} />
                  <meshStandardMaterial color="#F59E0B" roughness={0.5} flatShading />
                </mesh>
              );
            })}
          </group>
        </group>
      )}

      {flowerId === 'rose' && (
        <group>
          {/* Main Crimson Rose */}
          <group position={[0, 0.58, 0]}>
            <mesh castShadow>
              <dodecahedronGeometry args={[0.22, 0]} />
              <meshStandardMaterial color="#E11D48" roughness={0.6} flatShading />
            </mesh>
            <mesh position={[0, 0.1, 0]} castShadow>
              <octahedronGeometry args={[0.13, 0]} />
              <meshStandardMaterial color="#BE123C" roughness={0.6} flatShading />
            </mesh>
          </group>

          {/* Left Companion Rose Bloom */}
          <group position={[-0.24, 0.42, 0.14]} scale={0.7} rotation={[0.1, 0, -0.2]}>
            <mesh castShadow>
              <dodecahedronGeometry args={[0.18, 0]} />
              <meshStandardMaterial color="#E11D48" roughness={0.6} flatShading />
            </mesh>
            <mesh position={[0, 0.08, 0]} castShadow>
              <octahedronGeometry args={[0.1, 0]} />
              <meshStandardMaterial color="#9F1239" roughness={0.6} flatShading />
            </mesh>
          </group>

          {/* Right Companion Rosebud */}
          <group position={[0.22, 0.38, -0.12]} scale={0.6} rotation={[-0.1, 0, 0.2]}>
            <mesh castShadow>
              <octahedronGeometry args={[0.14, 0]} />
              <meshStandardMaterial color="#BE123C" roughness={0.6} flatShading />
            </mesh>
          </group>
        </group>
      )}

      {flowerId === 'orchid' && (
        <group>
          {/* Main Exotic Purple Orchid */}
          <group position={[0, 0.58, 0]}>
            <mesh position={[-0.14, 0.06, 0]} rotation={[0, 0, -0.4]} castShadow>
              <boxGeometry args={[0.22, 0.04, 0.16]} />
              <meshStandardMaterial color="#7C3AED" roughness={0.5} flatShading />
            </mesh>
            <mesh position={[0.14, 0.06, 0]} rotation={[0, 0, 0.4]} castShadow>
              <boxGeometry args={[0.22, 0.04, 0.16]} />
              <meshStandardMaterial color="#7C3AED" roughness={0.5} flatShading />
            </mesh>
            <mesh position={[0, -0.06, 0.1]} rotation={[0.4, 0, 0]} castShadow>
              <boxGeometry args={[0.14, 0.04, 0.18]} />
              <meshStandardMaterial color="#C084FC" roughness={0.4} flatShading />
            </mesh>
            <mesh position={[0, 0.04, 0.06]}>
              <sphereGeometry args={[0.06, 6, 6]} />
              <meshBasicMaterial color="#F472B6" />
            </mesh>
          </group>

          {/* Left Arching Companion Orchid Bloom */}
          <group position={[-0.24, 0.42, 0.14]} scale={0.72} rotation={[0.15, 0, -0.3]}>
            <mesh position={[-0.12, 0.05, 0]} rotation={[0, 0, -0.4]} castShadow>
              <boxGeometry args={[0.18, 0.035, 0.13]} />
              <meshStandardMaterial color="#6D28D9" roughness={0.5} flatShading />
            </mesh>
            <mesh position={[0.12, 0.05, 0]} rotation={[0, 0, 0.4]} castShadow>
              <boxGeometry args={[0.18, 0.035, 0.13]} />
              <meshStandardMaterial color="#6D28D9" roughness={0.5} flatShading />
            </mesh>
            <mesh position={[0, -0.05, 0.08]} rotation={[0.4, 0, 0]} castShadow>
              <boxGeometry args={[0.12, 0.035, 0.15]} />
              <meshStandardMaterial color="#A855F7" roughness={0.4} flatShading />
            </mesh>
          </group>
        </group>
      )}

      {/* Harvest readiness bloom sparkle */}
      {isBloomed && (
        <pointLight color="#FFF8DC" intensity={0.6} distance={1.2} />
      )}
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
