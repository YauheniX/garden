import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { getNpc } from '../game/config/npcs';
import type { NpcOrder } from '../game/engine/orders';
import { haptic } from '../telegram/tma';

interface AnimalNPCProps {
  order: NpcOrder;
  index: number;
  isLeaving?: boolean;
  spawnTime?: number;
  onSelectNpc: (orderId: string) => void;
  onExitComplete?: (orderId: string) => void;
}

// 1. Waypoint Walkway from Garden Entrance to Shop Apron
const WAYPOINTS_BASE: [number, number, number][] = [
  [1.95, 0.2, 3.4],  // 0: Entrance at diorama edge
  [1.88, 0.2, 1.8],  // 1: Straight along right walkway
  [1.80, 0.2, -0.2], // 2: Straight past plots
  [1.70, 0.2, -1.4], // 3: Approaching turn
  [1.25, 0.2, -2.1], // 4: Curving around top-right plot
];

const QUEUE_SLOTS: [number, number, number][] = [
  [-1.05, 0.2, -2.65], // Slot 0
  [0.0, 0.2, -2.48],   // Slot 1
  [1.05, 0.2, -2.65],  // Slot 2
];

const QUEUE_ROTATIONS = [0.38, 0.08, -0.38];

export const AnimalNPC: React.FC<AnimalNPCProps> = ({
  order,
  index,
  isLeaving = false,
  spawnTime = 0,
  onSelectNpc,
  onExitComplete,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const bubbleRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Animation progress: 0.0 (entrance) -> 1.0 (queue slot)
  // If spawnTime === 0, the game loaded with this order already present -> start at 1.0
  const progressRef = useRef(spawnTime === 0 ? 1.0 : 0.0);
  const exitTimerRef = useRef(0);
  const exitFinishedRef = useRef(false);

  const npcDef = getNpc(order.npcId);
  const { palette } = npcDef;

  // Build the complete waypoint route for this NPC's designated slot
  const route = useMemo(() => {
    const slot = QUEUE_SLOTS[index] ?? QUEUE_SLOTS[1];
    const points: THREE.Vector3[] = [
      ...WAYPOINTS_BASE.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      new THREE.Vector3(slot[0], slot[1], slot[2]),
    ];

    const cumDists: number[] = [0];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const d = points[i].distanceTo(points[i + 1]);
      total += d;
      cumDists.push(total);
    }

    return { points, cumDists, total };
  }, [index]);

  // Frame animation: walk along waypoints, face movement, bouncy hop, head tilt
  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    const { points, cumDists, total } = route;

    // --- State A: Leaving ---
    if (isLeaving) {
      exitTimerRef.current += delta;

      // Initial joyful jump celebration (first 0.35s)
      let jumpY = 0;
      if (exitTimerRef.current < 0.35) {
        jumpY = Math.sin((exitTimerRef.current / 0.35) * Math.PI) * 0.22;
      }

      // Walk backward along the path toward the entrance
      progressRef.current = Math.max(0.0, progressRef.current - delta * 0.45);

      if (progressRef.current <= 0.0) {
        if (!exitFinishedRef.current) {
          exitFinishedRef.current = true;
          onExitComplete?.(order.id);
        }
        return;
      }

      // Evaluate position along waypoints
      const p = progressRef.current;
      const targetDist = p * total;
      let pos = points[0];
      let dir = new THREE.Vector3(0, 0, 1);

      for (let i = 0; i < points.length - 1; i++) {
        if (targetDist <= cumDists[i + 1] || i === points.length - 2) {
          const segStart = cumDists[i];
          const segEnd = cumDists[i + 1];
          const segLen = Math.max(0.0001, segEnd - segStart);
          const tSeg = Math.max(0, Math.min(1, (targetDist - segStart) / segLen));
          pos = new THREE.Vector3().lerpVectors(points[i], points[i + 1], tSeg);
          // Direction toward exit (reverse)
          dir = new THREE.Vector3().subVectors(points[i], points[i + 1]).normalize();
          break;
        }
      }

      // Bouncy walking hop
      const hop = Math.abs(Math.sin(t * 11)) * 0.08;
      groupRef.current.position.set(pos.x, pos.y + hop + jumpY, pos.z);

      // Face direction of exit movement
      const targetRotY = Math.atan2(dir.x, dir.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotY,
        0.2
      );
      groupRef.current.rotation.z = Math.sin(t * 11) * 0.04;
      return;
    }

    // --- State B: Arriving / Walking In ---
    if (progressRef.current < 1.0) {
      progressRef.current = Math.min(1.0, progressRef.current + delta * 0.42);

      const p = progressRef.current;
      const targetDist = p * total;
      let pos = points[0];
      let dir = new THREE.Vector3(0, 0, -1);

      for (let i = 0; i < points.length - 1; i++) {
        if (targetDist <= cumDists[i + 1] || i === points.length - 2) {
          const segStart = cumDists[i];
          const segEnd = cumDists[i + 1];
          const segLen = Math.max(0.0001, segEnd - segStart);
          const tSeg = Math.max(0, Math.min(1, (targetDist - segStart) / segLen));
          pos = new THREE.Vector3().lerpVectors(points[i], points[i + 1], tSeg);
          dir = new THREE.Vector3().subVectors(points[i + 1], points[i]).normalize();
          break;
        }
      }

      // Bouncy walking hop
      const hop = Math.abs(Math.sin(t * 11)) * 0.08;
      groupRef.current.position.set(pos.x, pos.y + hop, pos.z);

      // Face direction of forward movement along walkway
      const targetRotY = Math.atan2(dir.x, dir.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotY,
        0.2
      );
      groupRef.current.rotation.z = Math.sin(t * 11) * 0.04;
      return;
    }

    // --- State C: Waiting at Stall Queue Slot ---
    const slotPos = QUEUE_SLOTS[index] ?? QUEUE_SLOTS[1];
    const restRotY = QUEUE_ROTATIONS[index] ?? 0;

    // Gentle idle breathing bob
    const idleY = Math.sin(t * 2.4 + index * 1.35) * 0.025;
    groupRef.current.position.set(slotPos[0], slotPos[1] + idleY, slotPos[2]);

    // Smoothly settle into resting counter rotation
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      restRotY,
      0.1
    );
    groupRef.current.rotation.z = 0;

    // Head idle tilting
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.8 + index) * 0.04;
      headRef.current.rotation.y = Math.cos(t * 1.2 + index) * 0.05;
    }

    // Speech bubble subtle floating bob and visibility
    if (bubbleRef.current) {
      const showBubble = !isLeaving && progressRef.current >= 0.85;
      bubbleRef.current.visible = showBubble;
      if (showBubble) {
        bubbleRef.current.position.y = 1.05 + Math.sin(t * 2.8 + index) * 0.035;
      }
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (isLeaving) return;
    haptic('light');
    onSelectNpc(order.id);
  };

  const initialSlot = QUEUE_SLOTS[index] ?? QUEUE_SLOTS[1];

  return (
    <group
      ref={groupRef}
      position={[initialSlot[0], initialSlot[1], initialSlot[2]]}
      onClick={handleClick}
      onPointerOver={(e) => {
        if (isLeaving) return;
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 1. Rabbit Silhouette */}
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
          {/* Fluffy Round Tail behind */}
          <mesh position={[0, 0.12, -0.2]} castShadow>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshStandardMaterial color={palette.belly} roughness={0.8} flatShading />
          </mesh>

          {/* Rabbit Head */}
          <group ref={headRef} position={[0, 0.52, 0.02]}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.19, 8, 7]} />
              <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
            </mesh>
            {/* Distinct Long Upright Ears */}
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
            {/* Cute Pink Nose */}
            <mesh position={[0, -0.03, 0.18]}>
              <sphereGeometry args={[0.035, 6, 6]} />
              <meshBasicMaterial color={palette.secondary} />
            </mesh>
          </group>
        </group>
      )}

      {/* 2. Bear Silhouette */}
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
          {/* Small Round Bear Tail behind */}
          <mesh position={[0, 0.16, -0.28]} castShadow>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshStandardMaterial color={palette.primary} roughness={0.8} flatShading />
          </mesh>

          {/* Bear Head */}
          <group ref={headRef} position={[0, 0.65, 0.02]}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.24, 8, 8]} />
              <meshStandardMaterial color={palette.primary} roughness={0.75} flatShading />
            </mesh>
            {/* Distinct Round Ears */}
            <mesh position={[-0.18, 0.18, -0.02]} castShadow>
              <sphereGeometry args={[0.085, 6, 6]} />
              <meshStandardMaterial color={palette.secondary} roughness={0.7} flatShading />
            </mesh>
            <mesh position={[0.18, 0.18, -0.02]} castShadow>
              <sphereGeometry args={[0.085, 6, 6]} />
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

      {/* 3. Fox Silhouette */}
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
          {/* Large Bushy Tail extending behind */}
          <mesh position={[0, 0.22, -0.22]} rotation={[-0.55, 0, 0]} castShadow>
            <coneGeometry args={[0.14, 0.44, 7]} />
            <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
          </mesh>
          {/* Tail White Tip */}
          <mesh position={[0, 0.38, -0.32]} rotation={[-0.55, 0, 0]} castShadow>
            <coneGeometry args={[0.075, 0.18, 6]} />
            <meshStandardMaterial color={palette.belly} roughness={0.7} flatShading />
          </mesh>

          {/* Fox Head */}
          <group ref={headRef} position={[0, 0.54, 0.04]}>
            <mesh castShadow receiveShadow>
              <dodecahedronGeometry args={[0.18, 0]} />
              <meshStandardMaterial color={palette.primary} roughness={0.7} flatShading />
            </mesh>
            {/* Pointed Fox Ears */}
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

      {/* 4. Capybara Silhouette */}
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
            {/* Cute Yuzu/Orange on head */}
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

      {/* 5. Hedgehog Silhouette */}
      {order.npcId === 'hedgehog' && (
        <group>
          {/* Hedgehog Tummy */}
          <mesh position={[0, 0.18, 0.04]} castShadow receiveShadow>
            <sphereGeometry args={[0.2, 7, 7]} />
            <meshStandardMaterial color={palette.secondary} roughness={0.75} flatShading />
          </mesh>
          {/* Spiky Quill Shell on Back */}
          <mesh position={[0, 0.22, -0.08]} castShadow>
            <dodecahedronGeometry args={[0.23, 0]} />
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

      {/* Floating Speech Bubble Indicator (Visibility managed in useFrame) */}
      <group ref={bubbleRef} position={[0, 1.05, 0]} visible={!isLeaving && spawnTime === 0}>
        {/* Soft rounded bubble body */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.13, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.92} />
        </mesh>
        {/* Speech tail pointer downward */}
        <mesh position={[0, -0.11, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.045, 0.08, 4]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.92} />
        </mesh>

        {/* Inside icon hint: Secret Recipe Scroll or Bouquet Bloom */}
        <mesh position={[0, 0, 0.06]}>
          {order.type === 'recipe' ? (
            <cylinderGeometry args={[0.04, 0.04, 0.1, 6]} />
          ) : (
            <dodecahedronGeometry args={[0.06, 0]} />
          )}
          <meshStandardMaterial
            color={order.type === 'recipe' ? '#9333EA' : '#F59E0B'}
            roughness={0.4}
            flatShading
          />
        </mesh>
      </group>

      {/* Cute Floating Heart Icon when leaving happily */}
      {isLeaving && (
        <group position={[0, 1.08, 0]}>
          <mesh position={[-0.035, 0.03, 0]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshBasicMaterial color="#EC4899" />
          </mesh>
          <mesh position={[0.035, 0.03, 0]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshBasicMaterial color="#EC4899" />
          </mesh>
          <mesh position={[0, -0.02, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.065, 0.08, 5]} />
            <meshBasicMaterial color="#EC4899" />
          </mesh>
        </group>
      )}

      {/* Subtle selection ring on hover */}
      {hovered && !isLeaving && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.42, 18]} />
          <meshBasicMaterial color="#FACC15" side={THREE.DoubleSide} transparent opacity={0.75} />
        </mesh>
      )}
    </group>
  );
};
