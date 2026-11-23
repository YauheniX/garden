import { useFrame } from '@react-three/fiber';
import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { getNpc } from '../game/config/npcs';
import type { NpcOrder } from '../game/engine/orders';
import { haptic } from '../telegram/tma';

interface AnimalNPCProps {
  order: NpcOrder;
  index: number;
  onSelectNpc: (orderId: string) => void;
}

export const AnimalNPC: React.FC<AnimalNPCProps> = ({
  order,
  index,
  onSelectNpc,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const npcDef = getNpc(order.npcId);
  const { palette } = npcDef;

  // Position queued customers in front of the bamboo stall
  const slotPositions: [number, number, number][] = [
    [-1.05, 0.2, -2.65],
    [0.0, 0.2, -2.45],
    [1.05, 0.2, -2.65],
  ];
  const slotRotations: number[] = [0.22, 0, -0.22];

  const pos = slotPositions[index] ?? [0, 0.2, -2.5];
  const rotY = slotRotations[index] ?? 0;

  // Subtle idle breathing & head tilting with phase offset per slot
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + index * 1.35;
    if (groupRef.current) {
      groupRef.current.position.y = pos[1] + Math.sin(t * 2.4) * 0.025;
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.8) * 0.04;
      headRef.current.rotation.y = Math.cos(t * 1.2) * 0.05;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    haptic('light');
    onSelectNpc(order.id);
  };

  return (
    <group
      ref={groupRef}
      position={[pos[0], pos[1], pos[2]]}
      rotation={[0, rotY, 0]}
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
      {/* Visual species geometry */}
      {order.npcId === 'rabbit' && (
        <group>
          {/* Rabbit Body */}
          <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.42, 8]} />
            <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
          </mesh>
          {/* White Belly */}
          <mesh position={[0, 0.22, 0.1]} castShadow>
            <boxGeometry args={[0.2, 0.26, 0.1]} />
            <meshStandardMaterial color={palette.belly} roughness={0.7} flatShading />
          </mesh>
          {/* Rabbit Head */}
          <group ref={headRef} position={[0, 0.52, 0.02]}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.19, 8, 7]} />
              <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
            </mesh>
            {/* Long Ears */}
            <mesh position={[-0.09, 0.28, -0.02]} rotation={[0.08, 0, -0.1]} castShadow>
              <capsuleGeometry args={[0.045, 0.26, 4, 7]} />
              <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
            </mesh>
            <mesh position={[-0.09, 0.28, 0.01]} rotation={[0.08, 0, -0.1]}>
              <capsuleGeometry args={[0.028, 0.2, 3, 6]} />
              <meshStandardMaterial color={palette.secondary} roughness={0.7} flatShading />
            </mesh>
            <mesh position={[0.09, 0.28, -0.02]} rotation={[0.08, 0, 0.1]} castShadow>
              <capsuleGeometry args={[0.045, 0.26, 4, 7]} />
              <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
            </mesh>
            <mesh position={[0.09, 0.28, 0.01]} rotation={[0.08, 0, 0.1]}>
              <capsuleGeometry args={[0.028, 0.2, 3, 6]} />
              <meshStandardMaterial color={palette.secondary} roughness={0.7} flatShading />
            </mesh>
            {/* Pink Nose */}
            <mesh position={[0, -0.03, 0.18]}>
              <sphereGeometry args={[0.035, 6, 6]} />
              <meshBasicMaterial color={palette.secondary} />
            </mesh>
          </group>
        </group>
      )}

      {order.npcId === 'bear' && (
        <group>
          {/* Bear Body */}
          <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.26, 0.3, 0.52, 8]} />
            <meshStandardMaterial color={palette.primary} roughness={0.75} flatShading />
          </mesh>
          {/* Belly */}
          <mesh position={[0, 0.28, 0.14]} castShadow>
            <boxGeometry args={[0.3, 0.34, 0.12]} />
            <meshStandardMaterial color={palette.belly} roughness={0.75} flatShading />
          </mesh>
          {/* Bear Head */}
          <group ref={headRef} position={[0, 0.65, 0.02]}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.24, 8, 8]} />
              <meshStandardMaterial color={palette.primary} roughness={0.75} flatShading />
            </mesh>
            {/* Round Ears */}
            <mesh position={[-0.18, 0.18, -0.02]} castShadow>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshStandardMaterial color={palette.secondary} roughness={0.7} flatShading />
            </mesh>
            <mesh position={[0.18, 0.18, -0.02]} castShadow>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshStandardMaterial color={palette.secondary} roughness={0.7} flatShading />
            </mesh>
            {/* Snout */}
            <mesh position={[0, -0.05, 0.2]} castShadow>
              <boxGeometry args={[0.16, 0.12, 0.14]} />
              <meshStandardMaterial color={palette.belly} roughness={0.7} flatShading />
            </mesh>
            <mesh position={[0, -0.01, 0.27]}>
              <sphereGeometry args={[0.04, 5, 5]} />
              <meshBasicMaterial color={palette.accent} />
            </mesh>
          </group>
        </group>
      )}

      {order.npcId === 'fox' && (
        <group>
          {/* Fox Body */}
          <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.44, 8]} />
            <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
          </mesh>
          {/* White Chest */}
          <mesh position={[0, 0.24, 0.1]} castShadow>
            <boxGeometry args={[0.2, 0.3, 0.1]} />
            <meshStandardMaterial color={palette.belly} roughness={0.7} flatShading />
          </mesh>
          {/* Bushy Tail */}
          <mesh position={[0, 0.22, -0.22]} rotation={[-0.5, 0, 0]} castShadow>
            <coneGeometry args={[0.13, 0.42, 7]} />
            <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
          </mesh>
          {/* Tail White Tip */}
          <mesh position={[0, 0.36, -0.3]} rotation={[-0.5, 0, 0]} castShadow>
            <coneGeometry args={[0.07, 0.16, 6]} />
            <meshStandardMaterial color={palette.belly} roughness={0.7} flatShading />
          </mesh>
          {/* Fox Head */}
          <group ref={headRef} position={[0, 0.54, 0.04]}>
            <mesh castShadow receiveShadow>
              <dodecahedronGeometry args={[0.18, 0]} />
              <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
            </mesh>
            {/* Pointed Ears */}
            <mesh position={[-0.12, 0.2, 0]} rotation={[0, 0, -0.2]} castShadow>
              <coneGeometry args={[0.07, 0.2, 5]} />
              <meshStandardMaterial color={palette.accent} roughness={0.7} flatShading />
            </mesh>
            <mesh position={[0.12, 0.2, 0]} rotation={[0, 0, 0.2]} castShadow>
              <coneGeometry args={[0.07, 0.2, 5]} />
              <meshStandardMaterial color={palette.accent} roughness={0.7} flatShading />
            </mesh>
            {/* Snout */}
            <mesh position={[0, -0.04, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <coneGeometry args={[0.09, 0.2, 5]} />
              <meshStandardMaterial color={palette.belly} roughness={0.7} flatShading />
            </mesh>
            <mesh position={[0, -0.04, 0.28]}>
              <sphereGeometry args={[0.035, 5, 5]} />
              <meshBasicMaterial color={palette.accent} />
            </mesh>
          </group>
        </group>
      )}

      {order.npcId === 'capybara' && (
        <group>
          {/* Capybara Body */}
          <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.36, 0.52]} />
            <meshStandardMaterial color={palette.primary} roughness={0.8} flatShading />
          </mesh>
          {/* Head */}
          <group ref={headRef} position={[0, 0.46, 0.18]}>
            {/* Boxy Capybara Head */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.26, 0.24, 0.34]} />
              <meshStandardMaterial color={palette.primary} roughness={0.8} flatShading />
            </mesh>
            {/* Small Round Ears */}
            <mesh position={[-0.14, 0.1, -0.06]} castShadow>
              <sphereGeometry args={[0.045, 6, 5]} />
              <meshStandardMaterial color={palette.secondary} roughness={0.7} flatShading />
            </mesh>
            <mesh position={[0.14, 0.1, -0.06]} castShadow>
              <sphereGeometry args={[0.045, 6, 5]} />
              <meshStandardMaterial color={palette.secondary} roughness={0.7} flatShading />
            </mesh>
            {/* Cute Orange/Tangerine on head */}
            <mesh position={[0, 0.17, 0]}>
              <sphereGeometry args={[0.055, 6, 6]} />
              <meshStandardMaterial color="#F97316" roughness={0.6} flatShading />
            </mesh>
            <mesh position={[0, 0.23, 0]}>
              <coneGeometry args={[0.02, 0.04, 4]} />
              <meshStandardMaterial color="#65A30D" flatShading />
            </mesh>
          </group>
        </group>
      )}

      {order.npcId === 'hedgehog' && (
        <group>
          {/* Hedgehog Tummy */}
          <mesh position={[0, 0.18, 0.04]} castShadow receiveShadow>
            <sphereGeometry args={[0.2, 7, 7]} />
            <meshStandardMaterial color={palette.secondary} roughness={0.75} flatShading />
          </mesh>
          {/* Spiky Quill Shell on Back */}
          <mesh position={[0, 0.22, -0.08]} castShadow>
            <dodecahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial color={palette.primary} roughness={0.85} flatShading />
          </mesh>
          {/* Snout and Head */}
          <group ref={headRef} position={[0, 0.24, 0.16]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <coneGeometry args={[0.1, 0.18, 6]} />
              <meshStandardMaterial color={palette.secondary} roughness={0.7} flatShading />
            </mesh>
            {/* Black Nose */}
            <mesh position={[0, 0, 0.1]}>
              <sphereGeometry args={[0.03, 5, 5]} />
              <meshBasicMaterial color={palette.accent} />
            </mesh>
          </group>
        </group>
      )}

      {/* Floating Order Bubble Icon above head */}
      <group position={[0, 0.95, 0]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.88} />
        </mesh>
        <mesh position={[0, -0.1, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.05, 0.08, 4]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.88} />
        </mesh>
        {/* Inside icon hint: Star or Flower */}
        <mesh position={[0, 0, 0.06]}>
          <dodecahedronGeometry args={[0.055, 0]} />
          <meshStandardMaterial
            color={order.type === 'recipe' ? '#A855F7' : '#F59E0B'}
            roughness={0.4}
            flatShading
          />
        </mesh>
      </group>

      {/* Subtle selection ring on hover */}
      {hovered && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.4, 18]} />
          <meshBasicMaterial color="#FACC15" side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
};
