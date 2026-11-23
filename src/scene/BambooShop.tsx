import { useFrame } from '@react-three/fiber';
import React, { useRef, useState } from 'react';
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
      pandaRef.current.position.y = 0.52 + Math.sin(t * 2.2) * 0.035;
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.6) * 0.05;
      headRef.current.rotation.y = Math.cos(t * 1.1) * 0.06;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    haptic('medium');
    onSelectShop?.();
  };

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
        <boxGeometry args={[3.2, 0.1, 1.8]} />
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

      {/* Countertop Trim */}
      <mesh position={[0, 0.81, 0.45]} castShadow receiveShadow>
        <boxGeometry args={[2.65, 0.06, 0.68]} />
        <meshStandardMaterial
          color="#B87B4C"
          roughness={0.65}
          flatShading
        />
      </mesh>

      {/* Display flower pots on the counter */}
      <group position={[-0.8, 0.94, 0.45]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.16, 7]} />
          <meshStandardMaterial color="#B55A30" roughness={0.8} flatShading />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <dodecahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#F472B6" roughness={0.6} flatShading />
        </mesh>
      </group>

      <group position={[0.8, 0.94, 0.45]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.16, 7]} />
          <meshStandardMaterial color="#B55A30" roughness={0.8} flatShading />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <dodecahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#FACC15" roughness={0.6} flatShading />
        </mesh>
      </group>

      {/* 3. Four Bamboo Support Posts */}
      {[
        [-1.3, 1.05, 0.65],
        [1.3, 1.05, 0.65],
        [-1.3, 1.05, -0.65],
        [1.3, 1.05, -0.65],
      ].map(([x, y, z]) => (
        <mesh key={`bamboo-post-${x}-${z}`} position={[x, y, z]} castShadow receiveShadow>
          <cylinderGeometry args={[0.06, 0.07, 1.9, 6]} />
          <meshStandardMaterial
            color="#84A74F"
            roughness={0.6}
            flatShading
          />
        </mesh>
      ))}

      {/* 4. Bamboo Slatted Roof */}
      <group position={[0, 2.05, 0]} rotation={[0.08, 0, 0]}>
        {/* Main roof slab */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.16, 2.1]} />
          <meshStandardMaterial
            color="#C69E58"
            roughness={0.7}
            flatShading
          />
        </mesh>

        {/* Roof ridge cap */}
        <mesh position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 3.25, 6]} />
          <meshStandardMaterial
            color="#997034"
            roughness={0.75}
            flatShading
          />
        </mesh>
      </group>

      {/* 5. Paw-print Shop Signboard */}
      <group position={[0, 1.62, 0.68]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.3, 0.42, 0.06]} />
          <meshStandardMaterial
            color="#F7EED8"
            roughness={0.6}
            flatShading
          />
        </mesh>
        {/* Paw Pad Center */}
        <mesh position={[0, -0.03, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.02, 8]} />
          <meshBasicMaterial color="#5C3D28" />
        </mesh>
        {/* Paw Toes */}
        {[-0.09, -0.03, 0.03, 0.09].map((xOffset) => (
          <mesh
            key={`toe-${xOffset}`}
            position={[xOffset, 0.08 + (Math.abs(xOffset) < 0.05 ? 0.02 : 0), 0.035]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.032, 0.032, 0.02, 6]} />
            <meshBasicMaterial color="#5C3D28" />
          </mesh>
        ))}
      </group>

      {/* 6. Cute Low-Poly Panda Florist Character */}
      <group ref={pandaRef} position={[0, 0.52, 0]}>
        {/* Panda Body (White) */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.38, 0.65, 8]} />
          <meshStandardMaterial color="#F7F7F2" roughness={0.7} flatShading />
        </mesh>

        {/* Green Florist Apron */}
        <mesh position={[0, 0.34, 0.12]} castShadow>
          <boxGeometry args={[0.42, 0.48, 0.22]} />
          <meshStandardMaterial color="#4C783E" roughness={0.7} flatShading />
        </mesh>

        {/* Arms (Black) */}
        <mesh position={[-0.36, 0.42, 0.15]} rotation={[0.4, 0, -0.4]} castShadow>
          <capsuleGeometry args={[0.1, 0.28, 4, 8]} />
          <meshStandardMaterial color="#2B2B2B" roughness={0.7} flatShading />
        </mesh>
        <mesh position={[0.36, 0.42, 0.15]} rotation={[0.4, 0, 0.4]} castShadow>
          <capsuleGeometry args={[0.1, 0.28, 4, 8]} />
          <meshStandardMaterial color="#2B2B2B" roughness={0.7} flatShading />
        </mesh>

        {/* Panda Head */}
        <group ref={headRef} position={[0, 0.82, 0.02]}>
          {/* Head Sphere */}
          <mesh castShadow>
            <sphereGeometry args={[0.32, 9, 8]} />
            <meshStandardMaterial color="#F7F7F2" roughness={0.7} flatShading />
          </mesh>

          {/* Black Ears */}
          <mesh position={[-0.24, 0.26, -0.04]} castShadow>
            <sphereGeometry args={[0.11, 7, 6]} />
            <meshStandardMaterial color="#222222" roughness={0.7} flatShading />
          </mesh>
          <mesh position={[0.24, 0.26, -0.04]} castShadow>
            <sphereGeometry args={[0.11, 7, 6]} />
            <meshStandardMaterial color="#222222" roughness={0.7} flatShading />
          </mesh>

          {/* Eye Patches (Black) */}
          <mesh position={[-0.12, 0.03, 0.28]} rotation={[0.1, -0.2, -0.2]}>
            <boxGeometry args={[0.11, 0.08, 0.04]} />
            <meshBasicMaterial color="#1E1E1E" />
          </mesh>
          <mesh position={[0.12, 0.03, 0.28]} rotation={[0.1, 0.2, 0.2]}>
            <boxGeometry args={[0.11, 0.08, 0.04]} />
            <meshBasicMaterial color="#1E1E1E" />
          </mesh>

          {/* Cute Snout and Nose */}
          <mesh position={[0, -0.06, 0.32]}>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshBasicMaterial color="#222222" />
          </mesh>

          {/* Cute Bamboo Conical Hat */}
          <mesh position={[0, 0.3, 0]} rotation={[-0.05, 0, 0]} castShadow>
            <coneGeometry args={[0.48, 0.22, 9]} />
            <meshStandardMaterial color="#D5B06E" roughness={0.75} flatShading />
          </mesh>
        </group>
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
