import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

export const TabletopDiorama: React.FC = () => {
  const firefliesRef = useRef<THREE.Group>(null);

  // 1. Instanced Deciduous Tree Canopies
  const deciduousData = useMemo(() => {
    const instances: THREE.Matrix4[] = [];
    const treePositions = [
      [-4.0, 2.0, -3.9],
      [4.0, 2.0, -3.9],
      [-4.6, 1.8, 2.2],
      [4.6, 1.8, 2.2],
      [-4.4, 1.7, -0.2],
      [4.4, 1.7, -0.2],
    ];

    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const rot = new THREE.Euler();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    treePositions.forEach(([x, y, z], idx) => {
      pos.set(x, y, z);
      rot.set(0, idx * 0.85, 0);
      quat.setFromEuler(rot);
      const s = 1.1 + (idx % 3) * 0.15;
      scale.set(s, s * 1.05, s);
      matrix.compose(pos, quat, scale);
      instances.push(matrix.clone());
    });

    return instances;
  }, []);

  // 2. Dense Pine Trees (Tiered Cones along rear perimeter)
  const pineData = useMemo(() => {
    return [
      { id: 'pine-1', x: -3.6, z: -4.4, scale: 1.1 },
      { id: 'pine-2', x: -2.6, z: -4.7, scale: 0.95 },
      { id: 'pine-3', x: -1.7, z: -4.9, scale: 1.05 },
      { id: 'pine-4', x: 1.7, z: -4.9, scale: 1.05 },
      { id: 'pine-5', x: 2.6, z: -4.7, scale: 0.95 },
      { id: 'pine-6', x: 3.6, z: -4.4, scale: 1.1 },
    ];
  }, []);

  // 3. Dedicated Sandstone Stepping Stones (Running along right walkway to stall, never clipping plots)
  const stoneData = useMemo(() => {
    return [
      // Entrance & southern walkway
      { id: 'st-1', x: 1.95, z: 3.3, r: 0.28, rot: 0.1 },
      { id: 'st-2', x: 1.92, z: 2.7, r: 0.26, rot: 0.3 },
      { id: 'st-3', x: 1.90, z: 2.1, r: 0.27, rot: -0.2 },
      { id: 'st-4', x: 1.88, z: 1.5, r: 0.25, rot: 0.4 },
      { id: 'st-5', x: 1.85, z: 0.9, r: 0.28, rot: -0.15 },
      { id: 'st-6', x: 1.82, z: 0.3, r: 0.26, rot: 0.25 },
      { id: 'st-7', x: 1.80, z: -0.3, r: 0.27, rot: -0.3 },
      { id: 'st-8', x: 1.78, z: -0.9, r: 0.25, rot: 0.1 },
      { id: 'st-9', x: 1.75, z: -1.4, r: 0.28, rot: 0.35 },
      // Curved bend around top-right plot
      { id: 'st-10', x: 1.55, z: -1.85, r: 0.26, rot: -0.2 },
      { id: 'st-11', x: 1.25, z: -2.2, r: 0.28, rot: 0.4 },
      // Front stall counter apron
      { id: 'st-12', x: 0.85, z: -2.42, r: 0.27, rot: -0.1 },
      { id: 'st-13', x: 0.40, z: -2.46, r: 0.29, rot: 0.2 },
      { id: 'st-14', x: -0.05, z: -2.48, r: 0.28, rot: -0.25 },
      { id: 'st-15', x: -0.55, z: -2.52, r: 0.27, rot: 0.15 },
      { id: 'st-16', x: -1.05, z: -2.58, r: 0.26, rot: -0.3 },
    ];
  }, []);

  // 4. Rustic Fence Posts & Rails along outer flanks
  const fencePosts = useMemo(() => {
    return [
      // Left fence line
      { id: 'fp-l1', x: -3.3, y: 0.38, z: -1.5 },
      { id: 'fp-l2', x: -3.3, y: 0.38, z: -0.5 },
      { id: 'fp-l3', x: -3.3, y: 0.38, z: 0.5 },
      { id: 'fp-l4', x: -3.3, y: 0.38, z: 1.5 },
      // Right fence line (outside the walkway)
      { id: 'fp-r1', x: 3.2, y: 0.38, z: -1.5 },
      { id: 'fp-r2', x: 3.2, y: 0.38, z: -0.5 },
      { id: 'fp-r3', x: 3.2, y: 0.38, z: 0.5 },
      { id: 'fp-r4', x: 3.2, y: 0.38, z: 1.5 },
    ];
  }, []);

  // 5. Decorative Rocks along path and perimeter
  const rockData = useMemo(() => {
    return [
      { id: 'rk-1', x: -2.9, z: -2.8, s: 0.24, color: '#8F897F' },
      { id: 'rk-2', x: -3.2, z: -2.6, s: 0.17, color: '#A39D93' },
      { id: 'rk-3', x: 2.9, z: -2.8, s: 0.23, color: '#8F897F' },
      { id: 'rk-4', x: 3.1, z: -2.5, s: 0.16, color: '#A39D93' },
      { id: 'rk-5', x: -2.8, z: 1.8, s: 0.21, color: '#837D74' },
      { id: 'rk-6', x: 2.6, z: 1.8, s: 0.22, color: '#837D74' },
      { id: 'rk-7', x: -1.8, z: 3.2, s: 0.26, color: '#979187' },
      { id: 'rk-8', x: 2.5, z: 3.3, s: 0.25, color: '#979187' },
    ];
  }, []);

  // 6. Firefly / Pollen Specks
  const fireflyData = useMemo(() => {
    return [
      { id: 'ff-1', x: -1.6, y: 0.65, z: -1.0 },
      { id: 'ff-2', x: 1.8, y: 0.85, z: -0.8 },
      { id: 'ff-3', x: -1.2, y: 0.7, z: 0.9 },
      { id: 'ff-4', x: 1.4, y: 0.6, z: 1.2 },
      { id: 'ff-5', x: -0.8, y: 0.95, z: 2.0 },
      { id: 'ff-6', x: 0.9, y: 0.8, z: -2.2 },
      { id: 'ff-7', x: -2.1, y: 0.75, z: 0.1 },
      { id: 'ff-8', x: 2.3, y: 0.9, z: 0.3 },
    ];
  }, []);

  // Gentle firefly floating sway
  useFrame(({ clock }) => {
    if (firefliesRef.current) {
      const t = clock.elapsedTime;
      firefliesRef.current.children.forEach((child, i) => {
        child.position.y = fireflyData[i].y + Math.sin(t * 1.8 + i * 1.2) * 0.08;
        child.position.x = fireflyData[i].x + Math.cos(t * 1.3 + i * 0.9) * 0.06;
      });
    }
  });

  return (
    <group name="tabletop-diorama">
      {/* 1. Warm Wooden Desk Base with Beveled Rim */}
      <mesh position={[0, -0.65, 0]} receiveShadow>
        <boxGeometry args={[16, 0.7, 14]} />
        <meshStandardMaterial
          color="#6E3F1F"
          roughness={0.78}
          flatShading
        />
      </mesh>

      {/* Desk Surface Top Plank (warm walnut with bevel step) */}
      <mesh position={[0, -0.28, 0]} receiveShadow>
        <boxGeometry args={[16.3, 0.1, 14.3]} />
        <meshStandardMaterial
          color="#8B532C"
          roughness={0.68}
          flatShading
        />
      </mesh>

      {/* Desk Inset Bevel Trim */}
      <mesh position={[0, -0.22, 0]} receiveShadow>
        <boxGeometry args={[15.7, 0.04, 13.7]} />
        <meshStandardMaterial
          color="#9E6135"
          roughness={0.65}
          flatShading
        />
      </mesh>

      {/* 2. Terraced Grassy Diorama Island */}
      {/* Lower Dark Loam Earth Terrace */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <cylinderGeometry args={[4.95, 5.3, 0.44, 20]} />
        <meshStandardMaterial
          color="#483424"
          roughness={0.88}
          flatShading
        />
      </mesh>

      {/* Mid Clay Step */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[4.88, 4.96, 0.12, 20]} />
        <meshStandardMaterial
          color="#5C422E"
          roughness={0.85}
          flatShading
        />
      </mesh>

      {/* Upper Lush Grass Mound */}
      <mesh position={[0, 0.18, 0]} receiveShadow>
        <cylinderGeometry args={[4.8, 4.88, 0.08, 20]} />
        <meshStandardMaterial
          color="#679A3E"
          roughness={0.8}
          flatShading
        />
      </mesh>

      {/* 3. Continuous Low-Poly Dirt Walkway Bed */}
      {/* Straight southern section along right edge of plots */}
      <mesh position={[1.86, 0.205, 1.3]} rotation={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[0.72, 0.015, 4.0]} />
        <meshStandardMaterial color="#886847" roughness={0.92} flatShading />
      </mesh>
      {/* Angled curved bend around top-right plot */}
      <mesh position={[1.42, 0.205, -1.82]} rotation={[0, -0.62, 0]} receiveShadow>
        <boxGeometry args={[0.72, 0.015, 1.4]} />
        <meshStandardMaterial color="#886847" roughness={0.92} flatShading />
      </mesh>
      {/* Apron in front of the stall counter */}
      <mesh position={[-0.1, 0.205, -2.52]} rotation={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[2.5, 0.015, 0.72]} />
        <meshStandardMaterial color="#886847" roughness={0.92} flatShading />
      </mesh>

      {/* 4. Sandstone Stepping Stones along the Walkway */}
      {stoneData.map((st, i) => (
        <mesh
          key={st.id}
          position={[st.x, 0.225, st.z]}
          rotation={[-Math.PI / 2, 0, st.rot]}
          receiveShadow
        >
          <cylinderGeometry args={[st.r, st.r * 1.08, 0.035, 7]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#B5AEA2' : '#9E978C'}
            roughness={0.9}
            flatShading
          />
        </mesh>
      ))}

      {/* 5. Rustic Low Wooden Fence along Flanks */}
      {fencePosts.map((fp) => (
        <mesh key={fp.id} position={[fp.x, fp.y, fp.z]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.42, 6]} />
          <meshStandardMaterial color="#6B4426" roughness={0.8} flatShading />
        </mesh>
      ))}

      {/* Left Fence Horizontal Rails */}
      <mesh position={[-3.3, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 0.05, 3.1]} />
        <meshStandardMaterial color="#7D512E" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[-3.3, 0.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 0.05, 3.1]} />
        <meshStandardMaterial color="#7D512E" roughness={0.8} flatShading />
      </mesh>

      {/* Right Fence Horizontal Rails (Flanking outside the walkway) */}
      <mesh position={[3.2, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 0.05, 3.1]} />
        <meshStandardMaterial color="#7D512E" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[3.2, 0.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 0.05, 3.1]} />
        <meshStandardMaterial color="#7D512E" roughness={0.8} flatShading />
      </mesh>

      {/* 6. Decorative Rocks along path and perimeter */}
      {rockData.map((rk) => (
        <mesh
          key={rk.id}
          position={[rk.x, 0.22 + rk.s * 0.5, rk.z]}
          rotation={[0.3, rk.x * 2, 0.2]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[rk.s, 0]} />
          <meshStandardMaterial color={rk.color} roughness={0.85} flatShading />
        </mesh>
      ))}

      {/* 7. Instanced Deciduous Tree Canopies */}
      <instancedMesh
        args={[undefined, undefined, deciduousData.length]}
        castShadow
        receiveShadow
        onUpdate={(self) => {
          deciduousData.forEach((mat, idx) => self.setMatrixAt(idx, mat));
          self.instanceMatrix.needsUpdate = true;
        }}
      >
        <dodecahedronGeometry args={[0.92, 0]} />
        <meshStandardMaterial
          color="#4B7733"
          roughness={0.7}
          flatShading
        />
      </instancedMesh>

      {/* Deciduous Tree Trunks */}
      {[
        { id: 'trunk-1', pos: [-4.0, 0.75, -3.9] as [number, number, number] },
        { id: 'trunk-2', pos: [4.0, 0.75, -3.9] as [number, number, number] },
        { id: 'trunk-3', pos: [-4.6, 0.7, 2.2] as [number, number, number] },
        { id: 'trunk-4', pos: [4.6, 0.7, 2.2] as [number, number, number] },
        { id: 'trunk-5', pos: [-4.4, 0.7, -0.2] as [number, number, number] },
        { id: 'trunk-6', pos: [4.4, 0.7, -0.2] as [number, number, number] },
      ].map((t) => (
        <mesh key={t.id} position={t.pos} castShadow receiveShadow>
          <cylinderGeometry args={[0.15, 0.22, 1.4, 6]} />
          <meshStandardMaterial color="#54361E" roughness={0.9} flatShading />
        </mesh>
      ))}

      {/* 8. Dense Tiered Low-Poly Pine Trees along rear perimeter */}
      {pineData.map((p) => (
        <group key={p.id} position={[p.x, 0.2, p.z]} scale={p.scale}>
          {/* Trunk */}
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.12, 0.16, 1.0, 6]} />
            <meshStandardMaterial color="#4A2F1B" roughness={0.9} flatShading />
          </mesh>
          {/* Bottom Cone */}
          <mesh position={[0, 1.15, 0]} castShadow>
            <coneGeometry args={[0.75, 0.9, 6]} />
            <meshStandardMaterial color="#295123" roughness={0.75} flatShading />
          </mesh>
          {/* Middle Cone */}
          <mesh position={[0, 1.7, 0]} castShadow>
            <coneGeometry args={[0.58, 0.8, 6]} />
            <meshStandardMaterial color="#34622C" roughness={0.75} flatShading />
          </mesh>
          {/* Top Cone */}
          <mesh position={[0, 2.2, 0]} castShadow>
            <coneGeometry args={[0.4, 0.65, 6]} />
            <meshStandardMaterial color="#3D7033" roughness={0.75} flatShading />
          </mesh>
        </group>
      ))}

      {/* 9. Floating Glowing Fireflies / Golden Pollen Specks */}
      <group ref={firefliesRef} name="fireflies">
        {fireflyData.map((f) => (
          <mesh key={f.id} position={[f.x, f.y, f.z]}>
            <sphereGeometry args={[0.035, 6, 6]} />
            <meshBasicMaterial color="#FEF08A" />
          </mesh>
        ))}
      </group>

      {/* 10. Cozy Tabletop Prop: Small Candle with Flicker Light */}
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

      {/* 11. Cozy Tabletop Prop: Stack of Vintage Florist Books */}
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
