import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { haptic } from '../telegram/tma';

interface BambooShopProps {
  onSelectShop?: () => void;
}

export const BambooShop: React.FC<BambooShopProps> = ({ onSelectShop }) => {
  const pandaRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Gentle idle bobbing for the Panda Florist
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (pandaRef.current) {
      pandaRef.current.position.y = 0.52 + Math.sin(t * 2.2) * 0.025;
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.6) * 0.04;
      headRef.current.rotation.y = Math.cos(t * 1.1) * 0.05;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    haptic('medium');
    onSelectShop?.();
  };

  // Roof bamboo logs data (13 cylindrical bamboo poles across the roof)
  const roofBambooLogs = useMemo(() => {
    const logs = [];
    const count = 13;
    const startZ = -1.0;
    const endZ = 1.0;
    const step = (endZ - startZ) / (count - 1);
    for (let i = 0; i < count; i++) {
      logs.push(startZ + i * step);
    }
    return logs;
  }, []);

  return (
    <group
      position={[0, 0.18, -3.8]}
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
      {/* 1. Wooden stall deck/platform */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[3.4, 0.1, 2.0]} />
        <meshStandardMaterial
          color="#85532F"
          roughness={0.75}
          flatShading
        />
      </mesh>

      {/* 2. Wooden Counter */}
      <mesh position={[0, 0.44, 0.45]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.72, 0.55]} />
        <meshStandardMaterial
          color="#9E683E"
          roughness={0.7}
          flatShading
        />
      </mesh>

      {/* Countertop Plank */}
      <mesh position={[0, 0.81, 0.45]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.06, 0.68]} />
        <meshStandardMaterial
          color="#B87B4C"
          roughness={0.65}
          flatShading
        />
      </mesh>

      {/* 3. Bamboo Support Posts (Front taller than back for natural backward roof tilt) */}
      {[
        [-1.35, 1.15, 0.65, 2.2],
        [1.35, 1.15, 0.65, 2.2],
        [-1.35, 1.02, -0.65, 1.95],
        [1.35, 1.02, -0.65, 1.95],
      ].map(([x, y, z, h]) => (
        <mesh key={`bamboo-post-${x}-${z}`} position={[x, y, z]} castShadow receiveShadow>
          <cylinderGeometry args={[0.065, 0.075, h, 6]} />
          <meshStandardMaterial
            color="#7E9F4A"
            roughness={0.6}
            flatShading
          />
        </mesh>
      ))}

      {/* 4. Raised, Tilted Bamboo Slatted Roof (Cylindrical bamboo logs) */}
      <group position={[0, 2.28, 0.05]} rotation={[-0.18, 0, 0]}>
        {/* Support crossbeams beneath bamboo logs */}
        <mesh position={[-1.3, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 2.2, 6]} />
          <meshStandardMaterial color="#688C3A" roughness={0.7} flatShading />
        </mesh>
        <mesh position={[1.3, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 2.2, 6]} />
          <meshStandardMaterial color="#688C3A" roughness={0.7} flatShading />
        </mesh>
        <mesh position={[0, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 2.2, 6]} />
          <meshStandardMaterial color="#688C3A" roughness={0.7} flatShading />
        </mesh>

        {/* Row of individual low-poly bamboo cylinders */}
        {roofBambooLogs.map((zOffset) => (
          <mesh
            key={`roof-bamboo-${zOffset}`}
            position={[0, 0.02, zOffset]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[0.068, 0.068, 3.4, 7]} />
            <meshStandardMaterial
              color="#C8A058"
              roughness={0.68}
              flatShading
            />
          </mesh>
        ))}

        {/* Ridge cap pole */}
        <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.085, 0.085, 3.45, 7]} />
          <meshStandardMaterial color="#9E7333" roughness={0.75} flatShading />
        </mesh>
      </group>

      {/* 5. Mounted Shop Signboard on Bamboo Roof Eaves (Cleanly above the Panda's head) */}
      <group position={[0, 2.44, 0.96]} rotation={[-0.18, 0, 0]}>
        {/* Wooden roof-mount brackets */}
        <mesh position={[-0.45, -0.05, -0.02]} castShadow>
          <boxGeometry args={[0.06, 0.2, 0.08]} />
          <meshStandardMaterial color="#684422" roughness={0.75} flatShading />
        </mesh>
        <mesh position={[0.45, -0.05, -0.02]} castShadow>
          <boxGeometry args={[0.06, 0.2, 0.08]} />
          <meshStandardMaterial color="#684422" roughness={0.75} flatShading />
        </mesh>

        {/* Board base */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.38, 0.42, 0.08]} />
          <meshStandardMaterial
            color="#F7EED8"
            roughness={0.6}
            flatShading
          />
        </mesh>
        {/* Dark chalkboard inset */}
        <mesh position={[0, 0, 0.042]}>
          <boxGeometry args={[1.26, 0.32, 0.01]} />
          <meshStandardMaterial color="#2A302D" roughness={0.8} flatShading />
        </mesh>
        {/* Chalk flower emblem */}
        <mesh position={[0, 0, 0.05]}>
          <circleGeometry args={[0.085, 8]} />
          <meshBasicMaterial color="#FBBF24" />
        </mesh>
        <mesh position={[0, 0, 0.052]}>
          <circleGeometry args={[0.038, 6]} />
          <meshBasicMaterial color="#EF4444" />
        </mesh>
      </group>

      {/* 6. Cute Low-Poly Panda Florist Character */}
      <group ref={pandaRef} position={[0, 0.52, 0]}>
        {/* Panda Body (Soft Off-White) */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.38, 0.65, 8]} />
          <meshStandardMaterial color="#FBFBF8" roughness={0.72} flatShading />
        </mesh>

        {/* Terracotta Florist Apron (#B85D38) */}
        <mesh position={[0, 0.34, 0.13]} castShadow>
          <boxGeometry args={[0.44, 0.48, 0.2]} />
          <meshStandardMaterial color="#B85D38" roughness={0.7} flatShading />
        </mesh>
        {/* Apron Straps over shoulders */}
        <mesh position={[-0.14, 0.56, 0.08]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.06, 0.22, 0.03]} />
          <meshStandardMaterial color="#8F4324" roughness={0.7} flatShading />
        </mesh>
        <mesh position={[0.14, 0.56, 0.08]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.06, 0.22, 0.03]} />
          <meshStandardMaterial color="#8F4324" roughness={0.7} flatShading />
        </mesh>

        {/* Black Arms reaching to counter */}
        <mesh position={[-0.34, 0.38, 0.22]} rotation={[0.65, 0, -0.3]} castShadow>
          <capsuleGeometry args={[0.095, 0.28, 4, 8]} />
          <meshStandardMaterial color="#242424" roughness={0.7} flatShading />
        </mesh>
        <mesh position={[0.34, 0.38, 0.22]} rotation={[0.65, 0, 0.3]} castShadow>
          <capsuleGeometry args={[0.095, 0.28, 4, 8]} />
          <meshStandardMaterial color="#242424" roughness={0.7} flatShading />
        </mesh>

        {/* Paws resting comfortably on the counter */}
        <mesh position={[-0.32, 0.36, 0.42]} castShadow>
          <sphereGeometry args={[0.09, 6, 6]} />
          <meshStandardMaterial color="#1E1E1E" roughness={0.7} flatShading />
        </mesh>
        <mesh position={[0.32, 0.36, 0.42]} castShadow>
          <sphereGeometry args={[0.09, 6, 6]} />
          <meshStandardMaterial color="#1E1E1E" roughness={0.7} flatShading />
        </mesh>

        {/* Panda Head */}
        <group ref={headRef} position={[0, 0.84, 0.02]}>
          {/* Head Sphere */}
          <mesh castShadow>
            <sphereGeometry args={[0.33, 9, 8]} />
            <meshStandardMaterial color="#FBFBF8" roughness={0.72} flatShading />
          </mesh>

          {/* Black Ears */}
          <mesh position={[-0.25, 0.27, -0.04]} castShadow>
            <sphereGeometry args={[0.115, 7, 6]} />
            <meshStandardMaterial color="#222222" roughness={0.7} flatShading />
          </mesh>
          <mesh position={[0.25, 0.27, -0.04]} castShadow>
            <sphereGeometry args={[0.115, 7, 6]} />
            <meshStandardMaterial color="#222222" roughness={0.7} flatShading />
          </mesh>

          {/* Eye Patches (Black) */}
          <mesh position={[-0.12, 0.04, 0.28]} rotation={[0.1, -0.2, -0.2]}>
            <boxGeometry args={[0.12, 0.09, 0.04]} />
            <meshBasicMaterial color="#1A1A1A" />
          </mesh>
          <mesh position={[0.12, 0.04, 0.28]} rotation={[0.1, 0.2, 0.2]}>
            <boxGeometry args={[0.12, 0.09, 0.04]} />
            <meshBasicMaterial color="#1A1A1A" />
          </mesh>

          {/* White Eye Highlights for lively cute gaze */}
          <mesh position={[-0.11, 0.06, 0.31]}>
            <sphereGeometry args={[0.024, 5, 5]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.11, 0.06, 0.31]}>
            <sphereGeometry args={[0.024, 5, 5]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>

          {/* Snout and Nose */}
          <mesh position={[0, -0.06, 0.31]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color="#F0ECE1" roughness={0.7} flatShading />
          </mesh>
          <mesh position={[0, -0.04, 0.37]}>
            <sphereGeometry args={[0.04, 5, 5]} />
            <meshBasicMaterial color="#1F1F1F" />
          </mesh>

          {/* Cute Conical Woven Bamboo Hat tilted slightly backward */}
          <mesh position={[0, 0.32, -0.04]} rotation={[-0.14, 0, 0]} castShadow>
            <coneGeometry args={[0.48, 0.22, 9]} />
            <meshStandardMaterial color="#D5B06E" roughness={0.75} flatShading />
          </mesh>
        </group>
      </group>

      {/* 7. Cozy Counter & Stall Props */}
      {/* Terracotta Pot 1 (Left on counter with pink bud) */}
      <group position={[-0.85, 0.94, 0.45]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.16, 7]} />
          <meshStandardMaterial color="#B55A30" roughness={0.8} flatShading />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <dodecahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#F472B6" roughness={0.6} flatShading />
        </mesh>
      </group>

      {/* Terracotta Pot 2 (Right on counter with yellow bloom) */}
      <group position={[0.85, 0.94, 0.45]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.16, 7]} />
          <meshStandardMaterial color="#B55A30" roughness={0.8} flatShading />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <dodecahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#FACC15" roughness={0.6} flatShading />
        </mesh>
      </group>

      {/* Vintage Sage Green Watering Can on Counter Edge */}
      <group position={[1.1, 0.92, 0.45]} rotation={[0, -0.4, 0]}>
        {/* Can Body */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.08, 0.09, 0.14, 7]} />
          <meshStandardMaterial color="#558564" roughness={0.65} flatShading />
        </mesh>
        {/* Angled Spout */}
        <mesh position={[0.1, 0.04, 0]} rotation={[0, 0, -0.6]} castShadow>
          <cylinderGeometry args={[0.02, 0.03, 0.16, 5]} />
          <meshStandardMaterial color="#558564" roughness={0.65} flatShading />
        </mesh>
        {/* Curved Handle */}
        <mesh position={[-0.09, 0.03, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.02, 0.12, 0.04]} />
          <meshStandardMaterial color="#446E51" roughness={0.65} flatShading />
        </mesh>
      </group>

      {/* Burlap Seed Sacks next to the counter base */}
      <group position={[-1.35, 0.2, 0.75]} rotation={[0, 0.3, 0]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.16, 0.22, 0.32, 6]} />
          <meshStandardMaterial color="#C5A475" roughness={0.85} flatShading />
        </mesh>
        {/* Tied rope collar */}
        <mesh position={[0, 0.12, 0]}>
          <torusGeometry args={[0.14, 0.02, 5, 8]} />
          <meshStandardMaterial color="#886840" roughness={0.9} flatShading />
        </mesh>
      </group>

      <group position={[-1.25, 0.16, 1.05]} rotation={[0, -0.4, 0]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.13, 0.18, 0.24, 6]} />
          <meshStandardMaterial color="#BCA177" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <torusGeometry args={[0.12, 0.02, 5, 8]} />
          <meshStandardMaterial color="#886840" roughness={0.9} flatShading />
        </mesh>
      </group>

      {/* Hover / Selected subtle glow ring */}
      {hovered && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 1.95, 24]} />
          <meshBasicMaterial color="#FACC15" side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};
