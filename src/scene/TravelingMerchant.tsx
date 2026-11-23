import { useFrame } from '@react-three/fiber';
import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { getMerchant } from '../game/config/merchants';
import type { MerchantVisit } from '../game/engine/merchants';
import { haptic } from '../telegram/tma';

interface TravelingMerchantProps {
  visit: MerchantVisit;
  onSelectMerchant: () => void;
}

export const TravelingMerchant: React.FC<TravelingMerchantProps> = ({
  visit,
  onSelectMerchant,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const markerRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const merchantDef = getMerchant(visit.merchantId);
  const { palette } = merchantDef;

  // Position: to the right of the bamboo stall
  const pos: [number, number, number] = [2.2, 0.18, -3.0];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.y = pos[1] + Math.sin(t * 2.2) * 0.02;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 1.5) * 0.08;
      headRef.current.rotation.z = Math.cos(t * 1.2) * 0.04;
    }
    if (markerRef.current) {
      markerRef.current.position.y = 1.15 + Math.sin(t * 3.5) * 0.05;
      markerRef.current.rotation.y = t * 1.5;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    haptic('medium');
    onSelectMerchant();
  };

  return (
    <group
      ref={groupRef}
      position={pos}
      rotation={[0, -0.45, 0]}
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
      {/* 1. Wandering Raccoon */}
      {visit.merchantId === 'raccoon' && (
        <group>
          {/* Raccoon Body */}
          <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.22, 0.26, 0.48, 8]} />
            <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
          </mesh>

          {/* White Chest Patch */}
          <mesh position={[0, 0.28, 0.14]} castShadow>
            <boxGeometry args={[0.22, 0.32, 0.1]} />
            <meshStandardMaterial color={palette.accent} roughness={0.7} flatShading />
          </mesh>

          {/* Leather Traveler Knapsack on Back */}
          <mesh position={[0, 0.3, -0.18]} castShadow>
            <boxGeometry args={[0.28, 0.3, 0.18]} />
            <meshStandardMaterial color={palette.detail} roughness={0.8} flatShading />
          </mesh>
          {/* Bedroll on top of backpack */}
          <mesh position={[0, 0.48, -0.18]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.32, 7]} />
            <meshStandardMaterial color="#A47551" roughness={0.8} flatShading />
          </mesh>

          {/* Striped Tail */}
          <group position={[0, 0.16, -0.22]} rotation={[-0.4, 0, 0]}>
            <mesh position={[0, 0.1, -0.08]} castShadow>
              <cylinderGeometry args={[0.09, 0.12, 0.28, 7]} />
              <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
            </mesh>
            <mesh position={[0, 0.26, -0.16]} castShadow>
              <cylinderGeometry args={[0.07, 0.09, 0.18, 7]} />
              <meshStandardMaterial color={palette.secondary} roughness={0.7} flatShading />
            </mesh>
          </group>

          {/* Raccoon Head */}
          <group ref={headRef} position={[0, 0.6, 0.04]}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.22, 8, 8]} />
              <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
            </mesh>

            {/* Bandit Mask (Black band across eyes) */}
            <mesh position={[0, 0.02, 0.16]}>
              <boxGeometry args={[0.34, 0.11, 0.08]} />
              <meshBasicMaterial color={palette.secondary} />
            </mesh>

            {/* White Muzzle */}
            <mesh position={[0, -0.06, 0.18]} castShadow>
              <coneGeometry args={[0.1, 0.16, 5]} />
              <meshStandardMaterial color={palette.accent} roughness={0.7} flatShading />
            </mesh>
            {/* Black Nose */}
            <mesh position={[0, -0.06, 0.25]}>
              <sphereGeometry args={[0.035, 5, 5]} />
              <meshBasicMaterial color="#111111" />
            </mesh>

            {/* Ears with white trims */}
            <mesh position={[-0.14, 0.2, 0]} castShadow>
              <coneGeometry args={[0.07, 0.16, 5]} />
              <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
            </mesh>
            <mesh position={[0.14, 0.2, 0]} castShadow>
              <coneGeometry args={[0.07, 0.16, 5]} />
              <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
            </mesh>
          </group>
        </group>
      )}

      {/* 2. Wise Owl */}
      {visit.merchantId === 'owl' && (
        <group>
          {/* Perch Post */}
          <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.16, 0.2, 0.64, 7]} />
            <meshStandardMaterial color="#5C3D28" roughness={0.85} flatShading />
          </mesh>

          {/* Owl Body */}
          <mesh position={[0, 0.76, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.22, 0.26, 0.44, 8]} />
            <meshStandardMaterial color={palette.primary} roughness={0.75} flatShading />
          </mesh>

          {/* Cream Breast Feathers */}
          <mesh position={[0, 0.74, 0.12]} castShadow>
            <boxGeometry args={[0.24, 0.32, 0.1]} />
            <meshStandardMaterial color={palette.secondary} roughness={0.75} flatShading />
          </mesh>

          {/* Folded Wings */}
          <mesh position={[-0.22, 0.74, 0]} rotation={[0, 0, 0.2]} castShadow>
            <boxGeometry args={[0.08, 0.32, 0.22]} />
            <meshStandardMaterial color={palette.primary} roughness={0.8} flatShading />
          </mesh>
          <mesh position={[0.22, 0.74, 0]} rotation={[0, 0, -0.2]} castShadow>
            <boxGeometry args={[0.08, 0.32, 0.22]} />
            <meshStandardMaterial color={palette.primary} roughness={0.8} flatShading />
          </mesh>

          {/* Rolled Parchment Scroll Under Wing */}
          <mesh position={[0.24, 0.7, 0.08]} rotation={[0.4, 0.3, -0.2]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.28, 6]} />
            <meshStandardMaterial color={palette.detail} roughness={0.6} flatShading />
          </mesh>

          {/* Owl Head */}
          <group ref={headRef} position={[0, 1.05, 0]}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.23, 8, 8]} />
              <meshStandardMaterial color={palette.primary} roughness={0.75} flatShading />
            </mesh>

            {/* Feather Horn Tufts */}
            <mesh position={[-0.12, 0.2, 0]} rotation={[0, 0, -0.3]} castShadow>
              <coneGeometry args={[0.06, 0.18, 5]} />
              <meshStandardMaterial color={palette.primary} roughness={0.75} flatShading />
            </mesh>
            <mesh position={[0.12, 0.2, 0]} rotation={[0, 0, 0.3]} castShadow>
              <coneGeometry args={[0.06, 0.18, 5]} />
              <meshStandardMaterial color={palette.primary} roughness={0.75} flatShading />
            </mesh>

            {/* Big Amber Scholar Eyes */}
            <mesh position={[-0.09, 0.03, 0.18]}>
              <sphereGeometry args={[0.06, 6, 6]} />
              <meshBasicMaterial color={palette.accent} />
            </mesh>
            <mesh position={[0.09, 0.03, 0.18]}>
              <sphereGeometry args={[0.06, 6, 6]} />
              <meshBasicMaterial color={palette.accent} />
            </mesh>
            {/* Black Eye Pupils */}
            <mesh position={[-0.09, 0.03, 0.23]}>
              <sphereGeometry args={[0.025, 5, 5]} />
              <meshBasicMaterial color="#111111" />
            </mesh>
            <mesh position={[0.09, 0.03, 0.23]}>
              <sphereGeometry args={[0.025, 5, 5]} />
              <meshBasicMaterial color="#111111" />
            </mesh>

            {/* Golden Beak */}
            <mesh position={[0, -0.05, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.045, 0.12, 5]} />
              <meshStandardMaterial color="#F59E0B" roughness={0.5} flatShading />
            </mesh>
          </group>
        </group>
      )}

      {/* Floating Exclamation/Sparkle Marker above head */}
      <group ref={markerRef} position={[0, 1.15, 0]}>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.04, 0.025, 0.18, 5]} />
          <meshBasicMaterial color="#F59E0B" />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshBasicMaterial color="#F59E0B" />
        </mesh>
      </group>

      {/* Subtle selection ring on ground */}
      {hovered && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.52, 20]} />
          <meshBasicMaterial color="#F59E0B" side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
};
