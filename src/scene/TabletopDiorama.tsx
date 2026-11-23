import * as THREE from 'three';
import React, { useMemo } from 'react';

export const TabletopDiorama: React.FC = () => {
  // Generate random stable positions for bamboo stalks around the edge
  const bambooData = useMemo(() => {
    const instances: THREE.Matrix4[] = [];
    const positions = [
      // Left side bamboo cluster
      [-4.0, 1.5, -2.5],
      [-4.3, 1.6, -1.8],
      [-4.1, 1.4, -0.8],
      [-4.4, 1.7, 0.5],
      [-4.2, 1.5, 1.8],
      // Right side bamboo cluster
      [4.0, 1.5, -2.2],
      [4.3, 1.6, -1.2],
      [4.1, 1.4, -0.2],
      [4.4, 1.7, 1.0],
      [4.2, 1.5, 2.0],
      // Back clusters
      [-2.8, 1.8, -4.6],
      [-1.8, 1.9, -4.8],
      [1.8, 1.9, -4.8],
      [2.8, 1.8, -4.6],
    ];

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    positions.forEach(([x, y, z], idx) => {
      position.set(x, y, z);
      rotation.set(
        Math.sin(idx * 2) * 0.05,
        (idx * 0.4) % Math.PI,
        Math.cos(idx * 3) * 0.05
      );
      quaternion.setFromEuler(rotation);
      const heightVar = 0.85 + ((idx * 37) % 30) / 100;
      scale.set(1, heightVar, 1);
      matrix.compose(position, quaternion, scale);
      instances.push(matrix.clone());
    });

    return instances;
  }, []);

  // Low-poly tree canopies (InstancedMesh)
  const treeData = useMemo(() => {
    const instances: THREE.Matrix4[] = [];
    const treePositions = [
      [-3.8, 1.8, -3.8],
      [3.8, 1.8, -3.8],
      [-4.5, 1.6, 2.8],
      [4.5, 1.6, 2.8],
    ];

    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const rot = new THREE.Euler();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    treePositions.forEach(([x, y, z], idx) => {
      pos.set(x, y, z);
      rot.set(0, idx * 0.7, 0);
      quat.setFromEuler(rot);
      scale.set(1.2, 1.3, 1.2);
      matrix.compose(pos, quat, scale);
      instances.push(matrix.clone());
    });

    return instances;
  }, []);

  return (
    <group name="tabletop-diorama">
      {/* 1. Large wooden desk base */}
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <boxGeometry args={[16, 0.6, 14]} />
        <meshStandardMaterial
          color="#7C4B27"
          roughness={0.75}
          flatShading
        />
      </mesh>

      {/* Desk surface top plank */}
      <mesh position={[0, -0.28, 0]} receiveShadow>
        <boxGeometry args={[16.2, 0.08, 14.2]} />
        <meshStandardMaterial
          color="#935E35"
          roughness={0.7}
          flatShading
        />
      </mesh>

      {/* 2. Terraced Grassy Diorama Island */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[4.8, 5.2, 0.45, 16]} />
        <meshStandardMaterial
          color="#523B2A"
          roughness={0.85}
          flatShading
        />
      </mesh>

      {/* Green grass top mound */}
      <mesh position={[0, 0.16, 0]} receiveShadow>
        <cylinderGeometry args={[4.75, 4.85, 0.06, 16]} />
        <meshStandardMaterial
          color="#6C9A44"
          roughness={0.8}
          flatShading
        />
      </mesh>

      {/* Cozy Tabletop Stepping Stones */}
      {[-0.6, 0, 0.6].map((offset, i) => (
        <mesh
          key={`stone-${offset}`}
          position={[offset * 0.7, 0.2, -2.4 - i * 0.4]}
          rotation={[-Math.PI / 2, 0, i * 0.4]}
          receiveShadow
        >
          <cylinderGeometry args={[0.26, 0.28, 0.04, 7]} />
          <meshStandardMaterial
            color="#A8A39A"
            roughness={0.9}
            flatShading
          />
        </mesh>
      ))}

      {/* 3. Instanced Bamboo Stalks */}
      <instancedMesh
        args={[undefined, undefined, bambooData.length]}
        castShadow
        receiveShadow
        onUpdate={(self) => {
          bambooData.forEach((mat, idx) => self.setMatrixAt(idx, mat));
          self.instanceMatrix.needsUpdate = true;
        }}
      >
        <cylinderGeometry args={[0.07, 0.09, 3.2, 6]} />
        <meshStandardMaterial
          color="#7FA84A"
          roughness={0.65}
          flatShading
        />
      </instancedMesh>

      {/* 4. Instanced Tree Canopies */}
      <instancedMesh
        args={[undefined, undefined, treeData.length]}
        castShadow
        receiveShadow
        onUpdate={(self) => {
          treeData.forEach((mat, idx) => self.setMatrixAt(idx, mat));
          self.instanceMatrix.needsUpdate = true;
        }}
      >
        <dodecahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
          color="#4F7939"
          roughness={0.7}
          flatShading
        />
      </instancedMesh>

      {/* Tree Trunks */}
      {[
        [-3.8, 0.7, -3.8],
        [3.8, 0.7, -3.8],
        [-4.5, 0.7, 2.8],
        [4.5, 0.7, 2.8],
      ].map(([x, y, z]) => (
        <mesh key={`tree-trunk-${x}-${z}`} position={[x, y, z]} castShadow receiveShadow>
          <cylinderGeometry args={[0.16, 0.22, 1.4, 6]} />
          <meshStandardMaterial
            color="#5C3B24"
            roughness={0.9}
            flatShading
          />
        </mesh>
      ))}

      {/* 5. Cozy Tabletop Prop: Small Candle with Flicker Light */}
      <group position={[3.6, 0.22, 2.8]}>
        {/* Brass Candle Plate */}
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <cylinderGeometry args={[0.34, 0.38, 0.04, 10]} />
          <meshStandardMaterial
            color="#C49A45"
            metalness={0.4}
            roughness={0.5}
            flatShading
          />
        </mesh>
        {/* Cream Wax Pillar */}
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.16, 0.17, 0.34, 8]} />
          <meshStandardMaterial
            color="#F7F1DE"
            roughness={0.6}
            flatShading
          />
        </mesh>
        {/* Flame */}
        <mesh position={[0, 0.44, 0]}>
          <coneGeometry args={[0.06, 0.14, 6]} />
          <meshBasicMaterial color="#FF9A26" />
        </mesh>
        {/* Cozy Warm Flame Glow */}
        <pointLight
          position={[0, 0.5, 0]}
          color="#FFA238"
          intensity={0.9}
          distance={2.5}
          decay={2}
        />
      </group>

      {/* 6. Cozy Tabletop Prop: Stack of Vintage Florist Books */}
      <group position={[-3.6, 0.22, 2.6]}>
        {/* Book 1 (bottom - dark leather red) */}
        <mesh position={[0, 0.06, 0]} rotation={[0, 0.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.12, 1.2]} />
          <meshStandardMaterial color="#802D20" roughness={0.7} flatShading />
        </mesh>
        {/* Book 2 (middle - deep forest blue) */}
        <mesh position={[0.02, 0.18, -0.02]} rotation={[0, -0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.82, 0.11, 1.1]} />
          <meshStandardMaterial color="#2E4A62" roughness={0.7} flatShading />
        </mesh>
        {/* Book 3 (top - golden herbalist journal) */}
        <mesh position={[-0.01, 0.28, 0.01]} rotation={[0, 0.16, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.74, 0.09, 0.98]} />
          <meshStandardMaterial color="#3D6346" roughness={0.7} flatShading />
        </mesh>
      </group>
    </group>
  );
};
