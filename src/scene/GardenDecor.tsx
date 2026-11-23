import { useFrame } from '@react-three/fiber';
import React, { useRef } from 'react';
import * as THREE from 'three';
import { DECORATIONS } from '../game/config/decor';
import { useGameStore } from '../game/store/useGameStore';

interface GardenDecorProps {
  onOpenDecorSheet?: () => void;
}

export const GardenDecor: React.FC<GardenDecorProps> = ({ onOpenDecorSheet }) => {
  const unlockedDecor = useGameStore((s) => s.unlockedDecor);

  // Animation refs for dynamic decor
  const beesGroupRef = useRef<THREE.Group>(null);
  const windmillSailsRef = useRef<THREE.Group>(null);
  const fountainWaterRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // Beehive orbiting bees
    if (beesGroupRef.current) {
      beesGroupRef.current.rotation.y = t * 2.2;
    }

    // Windmill sails rotating in the breeze
    if (windmillSailsRef.current) {
      windmillSailsRef.current.rotation.z = -t * 1.6;
    }

    // Fountain water gentle pulse
    if (fountainWaterRef.current) {
      fountainWaterRef.current.scale.setScalar(1 + Math.sin(t * 3.5) * 0.035);
    }
  });

  return (
    <group name="garden-decorations">
      {/* 1. Bamboo Lantern */}
      {unlockedDecor.includes('lantern') && (
        <group
          position={DECORATIONS.lantern.anchorPosition}
          rotation={DECORATIONS.lantern.rotation}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDecorSheet?.();
          }}
        >
          {/* Wooden post */}
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.9, 6]} />
            <meshStandardMaterial color="#85532F" roughness={0.7} flatShading />
          </mesh>
          {/* Top crossbeam */}
          <mesh position={[0.12, 0.88, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.32, 5]} />
            <meshStandardMaterial color="#85532F" roughness={0.7} flatShading />
          </mesh>
          {/* Hanging lantern frame */}
          <group position={[0.22, 0.72, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.18, 0.24, 0.18]} />
              <meshStandardMaterial
                color="#FCD34D"
                emissive="#F59E0B"
                emissiveIntensity={0.6}
                roughness={0.4}
                flatShading
              />
            </mesh>
            {/* Bamboo roof cap */}
            <mesh position={[0, 0.14, 0]} castShadow>
              <coneGeometry args={[0.16, 0.1, 4]} />
              <meshStandardMaterial color="#6B4423" roughness={0.8} flatShading />
            </mesh>
            {/* Warm point light */}
            <pointLight color="#FEF08A" intensity={1.8} distance={3.5} decay={2} />
          </group>
        </group>
      )}

      {/* 2. Honey Beehive */}
      {unlockedDecor.includes('beehive') && (
        <group
          position={DECORATIONS.beehive.anchorPosition}
          rotation={DECORATIONS.beehive.rotation}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDecorSheet?.();
          }}
        >
          {/* Wooden stilts / stand */}
          <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.34, 0.36, 0.34]} />
            <meshStandardMaterial color="#784E25" roughness={0.8} flatShading />
          </mesh>
          {/* Hive tiers */}
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.42, 0.22, 0.42]} />
            <meshStandardMaterial color="#E0A96D" roughness={0.7} flatShading />
          </mesh>
          <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.2, 0.4]} />
            <meshStandardMaterial color="#D69752" roughness={0.7} flatShading />
          </mesh>
          {/* Roof lid */}
          <mesh position={[0, 0.78, 0]} castShadow>
            <boxGeometry args={[0.46, 0.08, 0.46]} />
            <meshStandardMaterial color="#663E1C" roughness={0.8} flatShading />
          </mesh>
          {/* Orbiting Bees */}
          <group ref={beesGroupRef} position={[0, 0.75, 0]}>
            {/* Bee 1 */}
            <mesh position={[0.4, 0.1, 0]}>
              <boxGeometry args={[0.06, 0.05, 0.08]} />
              <meshStandardMaterial color="#FBBF24" roughness={0.5} flatShading />
            </mesh>
            {/* Bee 2 */}
            <mesh position={[-0.35, -0.08, 0.25]}>
              <boxGeometry args={[0.05, 0.04, 0.07]} />
              <meshStandardMaterial color="#FBBF24" roughness={0.5} flatShading />
            </mesh>
            {/* Bee 3 */}
            <mesh position={[0.1, 0.15, -0.38]}>
              <boxGeometry args={[0.06, 0.05, 0.08]} />
              <meshStandardMaterial color="#FBBF24" roughness={0.5} flatShading />
            </mesh>
          </group>
        </group>
      )}

      {/* 3. Mushroom Gnome */}
      {unlockedDecor.includes('gnome') && (
        <group
          position={DECORATIONS.gnome.anchorPosition}
          rotation={DECORATIONS.gnome.rotation}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDecorSheet?.();
          }}
        >
          {/* Ceramic stone base */}
          <mesh position={[0, 0.06, 0]} receiveShadow>
            <cylinderGeometry args={[0.22, 0.25, 0.12, 7]} />
            <meshStandardMaterial color="#9CA3AF" roughness={0.85} flatShading />
          </mesh>
          {/* Gnome Blue Coat */}
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.18, 0.24, 7]} />
            <meshStandardMaterial color="#2563EB" roughness={0.65} flatShading />
          </mesh>
          {/* Gnome Head & Big White Beard */}
          <mesh position={[0, 0.38, 0.04]} castShadow>
            <sphereGeometry args={[0.12, 7, 7]} />
            <meshStandardMaterial color="#FEE2E2" roughness={0.6} flatShading />
          </mesh>
          <mesh position={[0, 0.32, 0.11]} castShadow>
            <coneGeometry args={[0.12, 0.18, 5]} />
            <meshStandardMaterial color="#F9FAFB" roughness={0.7} flatShading />
          </mesh>
          {/* Pointed Red Mushroom Hat with White Spots */}
          <mesh position={[0, 0.54, 0]} rotation={[0.1, 0, 0.1]} castShadow>
            <coneGeometry args={[0.16, 0.32, 6]} />
            <meshStandardMaterial color="#DC2626" roughness={0.6} flatShading />
          </mesh>
        </group>
      )}

      {/* 4. Zen Stone Fountain */}
      {unlockedDecor.includes('fountain') && (
        <group
          position={DECORATIONS.fountain.anchorPosition}
          rotation={DECORATIONS.fountain.rotation}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDecorSheet?.();
          }}
        >
          {/* Bottom Stone Basin */}
          <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.55, 0.6, 0.28, 8]} />
            <meshStandardMaterial color="#78716C" roughness={0.85} flatShading />
          </mesh>
          {/* Lower Water Pool */}
          <mesh ref={fountainWaterRef} position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.48, 0.48, 0.04, 8]} />
            <meshStandardMaterial
              color="#38BDF8"
              roughness={0.2}
              transparent
              opacity={0.85}
              flatShading
            />
          </mesh>
          {/* Center Stone Pedestal */}
          <mesh position={[0, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.32, 6]} />
            <meshStandardMaterial color="#57534E" roughness={0.85} flatShading />
          </mesh>
          {/* Top Basin */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.25, 0.14, 7]} />
            <meshStandardMaterial color="#78716C" roughness={0.85} flatShading />
          </mesh>
          {/* Trickling Spring Spout */}
          <mesh position={[0, 0.72, 0]} castShadow>
            <dodecahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color="#0284C7" roughness={0.2} flatShading />
          </mesh>
        </group>
      )}

      {/* 5. Rose Floral Arch */}
      {unlockedDecor.includes('flower_arch') && (
        <group
          position={DECORATIONS.flower_arch.anchorPosition}
          rotation={DECORATIONS.flower_arch.rotation}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDecorSheet?.();
          }}
        >
          {/* Left Arch Pillar */}
          <mesh position={[-0.8, 0.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.1, 1.8, 0.1]} />
            <meshStandardMaterial color="#5C3D28" roughness={0.8} flatShading />
          </mesh>
          {/* Right Arch Pillar */}
          <mesh position={[0.8, 0.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.1, 1.8, 0.1]} />
            <meshStandardMaterial color="#5C3D28" roughness={0.8} flatShading />
          </mesh>
          {/* Top Arch Trellis Beam */}
          <mesh position={[0, 1.85, 0]} castShadow>
            <boxGeometry args={[1.75, 0.1, 0.16]} />
            <meshStandardMaterial color="#5C3D28" roughness={0.8} flatShading />
          </mesh>
          {/* Climbing Ivy & Flowers on Pillars */}
          {[-0.8, 0.8].map((xPillar) => (
            <group key={`arch-foliage-${xPillar}`} position={[xPillar, 0.85, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.16, 1.2, 0.16]} />
                <meshStandardMaterial color="#4D7C0F" roughness={0.7} flatShading />
              </mesh>
              {/* Pink & Red Flower Blooms */}
              <mesh position={[0, 0.4, 0.1]}>
                <dodecahedronGeometry args={[0.07, 0]} />
                <meshStandardMaterial color="#E11D48" roughness={0.6} flatShading />
              </mesh>
              <mesh position={[0, -0.2, 0.1]}>
                <dodecahedronGeometry args={[0.07, 0]} />
                <meshStandardMaterial color="#F472B6" roughness={0.6} flatShading />
              </mesh>
            </group>
          ))}
          {/* Arch Canopy Flowers */}
          <mesh position={[0, 1.95, 0]} castShadow>
            <boxGeometry args={[1.4, 0.16, 0.22]} />
            <meshStandardMaterial color="#4D7C0F" roughness={0.7} flatShading />
          </mesh>
        </group>
      )}

      {/* 6. Miniature Windmill */}
      {unlockedDecor.includes('windmill') && (
        <group
          position={DECORATIONS.windmill.anchorPosition}
          rotation={DECORATIONS.windmill.rotation}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDecorSheet?.();
          }}
        >
          {/* Tapered Stone Tower Base */}
          <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.26, 0.38, 1.3, 7]} />
            <meshStandardMaterial color="#A8A29E" roughness={0.85} flatShading />
          </mesh>
          {/* Timber Cap */}
          <mesh position={[0, 1.38, 0]} castShadow>
            <coneGeometry args={[0.3, 0.32, 6]} />
            <meshStandardMaterial color="#784E25" roughness={0.75} flatShading />
          </mesh>
          {/* Central Hub & Rotating Sails */}
          <group ref={windmillSailsRef} position={[0, 1.25, 0.28]}>
            {/* Center axle peg */}
            <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.08, 6]} />
              <meshStandardMaterial color="#442813" roughness={0.7} flatShading />
            </mesh>
            {/* 4 Canvas Sail Blades */}
            {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle) => (
              <group key={`windmill-sail-${angle}`} rotation={[0, 0, angle]}>
                {/* Wood spar */}
                <mesh position={[0, 0.35, 0]}>
                  <boxGeometry args={[0.04, 0.7, 0.02]} />
                  <meshStandardMaterial color="#6B4423" roughness={0.7} flatShading />
                </mesh>
                {/* Canvas sail cloth */}
                <mesh position={[0.08, 0.42, 0.01]} castShadow>
                  <boxGeometry args={[0.14, 0.5, 0.01]} />
                  <meshStandardMaterial color="#F7F3E9" roughness={0.6} flatShading />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      )}
    </group>
  );
};
