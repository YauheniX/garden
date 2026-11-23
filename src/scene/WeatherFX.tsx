import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../game/store/useGameStore';

function createPollenParticles(count: number) {
  return Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 8,
    y: 0.5 + Math.random() * 3.5,
    z: (Math.random() - 0.5) * 8,
    speed: 0.3 + Math.random() * 0.4,
    offset: Math.random() * Math.PI * 2,
  }));
}

function createRainDrops(count: number) {
  return Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 10,
    y: 0.5 + Math.random() * 6.5,
    z: (Math.random() - 0.5) * 10,
    speed: 10 + Math.random() * 5,
  }));
}

export const WeatherFX: React.FC = () => {
  const weather = useGameStore((s) => s.weather);

  const fogConfig = useMemo(() => {
    switch (weather) {
      case 'foggy':
        return { color: '#D2DBD4', density: 0.045 };
      case 'rainy':
        return { color: '#BDCFDA', density: 0.025 };
      case 'sunny':
      default:
        return { color: '#F6EFE6', density: 0.015 };
    }
  }, [weather]);

  return (
    <group name="weather-fx">
      {/* Declarative R3F fog attachment */}
      <fogExp2 attach="fog" args={[fogConfig.color, fogConfig.density]} />

      {weather === 'sunny' && <SunnyEffects />}
      {weather === 'rainy' && <RainEffects />}
      {weather === 'foggy' && <FogEffects />}
    </group>
  );
};

// Warm sunlight & drifting golden pollen
const SunnyEffects: React.FC = () => {
  const pollenCount = 35;
  const pollenRef = useRef<THREE.InstancedMesh>(null);

  const [particles] = useState(() => createPollenParticles(pollenCount));

  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(0.04, 0.04, 0.04), []);

  useFrame(({ clock }) => {
    if (!pollenRef.current) return;
    const t = clock.elapsedTime;

    particles.forEach((p, i) => {
      tempPos.set(
        p.x + Math.sin(t * p.speed + p.offset) * 0.4,
        p.y + Math.cos(t * p.speed * 0.7 + p.offset) * 0.25,
        p.z + Math.cos(t * p.speed + p.offset) * 0.4
      );
      tempMatrix.compose(tempPos, tempQuat, tempScale);
      pollenRef.current?.setMatrixAt(i, tempMatrix);
    });

    pollenRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={pollenRef}
      args={[undefined, undefined, pollenCount]}
    >
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#FDE047" transparent opacity={0.65} />
    </instancedMesh>
  );
};

// Animated falling rain streaks
const RainEffects: React.FC = () => {
  const rainCount = 120;
  const rainRef = useRef<THREE.InstancedMesh>(null);

  const [drops] = useState(() => createRainDrops(rainCount));

  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempRot = useMemo(() => new THREE.Euler(0.08, 0, 0), []);
  const tempQuat = useMemo(() => new THREE.Quaternion().setFromEuler(tempRot), [tempRot]);
  const tempScale = useMemo(() => new THREE.Vector3(0.02, 0.28, 0.02), []);

  useFrame((_, delta) => {
    if (!rainRef.current) return;

    drops.forEach((drop, i) => {
      drop.y -= drop.speed * delta;
      if (drop.y < 0.15) {
        drop.y = 7 + Math.random() * 2;
      }

      tempPos.set(drop.x, drop.y, drop.z);
      tempMatrix.compose(tempPos, tempQuat, tempScale);
      rainRef.current?.setMatrixAt(i, tempMatrix);
    });

    rainRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={rainRef} args={[undefined, undefined, rainCount]}>
      <cylinderGeometry args={[1, 1, 1, 4]} />
      <meshBasicMaterial color="#93C5FD" transparent opacity={0.6} />
    </instancedMesh>
  );
};

// Low-poly floating mist disks near ground
const FogEffects: React.FC = () => {
  const fogPuffs = useMemo(() => {
    return [
      { id: 'puff-1', x: -2.5, y: 0.45, z: -1.5, scale: 2.2, speed: 0.2 },
      { id: 'puff-2', x: 2.2, y: 0.5, z: 1.8, scale: 2.6, speed: -0.18 },
      { id: 'puff-3', x: -1.2, y: 0.4, z: 2.4, scale: 2.0, speed: 0.15 },
      { id: 'puff-4', x: 1.8, y: 0.55, z: -2.8, scale: 2.4, speed: -0.22 },
      { id: 'puff-5', x: 0, y: 0.42, z: 0.5, scale: 3.0, speed: 0.12 },
    ];
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const puff = fogPuffs[i];
      child.rotation.y = t * puff.speed;
      child.position.y = puff.y + Math.sin(t * 0.8 + i) * 0.08;
    });
  });

  return (
    <group ref={groupRef}>
      {fogPuffs.map((puff) => (
        <mesh key={puff.id} position={[puff.x, puff.y, puff.z]}>
          <cylinderGeometry args={[puff.scale, puff.scale * 1.2, 0.15, 7]} />
          <meshBasicMaterial color="#E5E7EB" transparent opacity={0.28} />
        </mesh>
      ))}
    </group>
  );
};
