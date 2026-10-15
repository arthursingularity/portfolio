"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * Industrial Warehouse Rack (Porta-Paletes)
 * Replicates the steel structure seen in the warehouse image:
 * - Blue vertical upright columns
 * - Orange horizontal load beams across multiple levels
 * - Yellow bottom corner safety protectors
 * - Side diagonal bracing
 */
export default function RackModel({
  levels = 3,
  width = 2.8,
  depth = 1.1,
  height = 3.8,
  wireframe = false,
}) {
  const materials = useMemo(
    () => ({
      blue: new THREE.MeshStandardMaterial({
        color: "#27488e",
        roughness: 0.4,
        metalness: 0.3,
        wireframe,
      }),
      orange: new THREE.MeshStandardMaterial({
        color: "#e65100",
        roughness: 0.35,
        metalness: 0.25,
        wireframe,
      }),
      yellow: new THREE.MeshStandardMaterial({
        color: "#fbc02d",
        roughness: 0.4,
        metalness: 0.2,
        wireframe,
      }),
      steelShelf: new THREE.MeshStandardMaterial({
        color: "#52525b",
        roughness: 0.6,
        metalness: 0.4,
        wireframe,
      }),
    }),
    [wireframe]
  );

  const colThickness = 0.08;
  const beamThickness = 0.08;
  const halfW = width / 2;
  const halfD = depth / 2;

  // Level heights (ground level, mid level, top level)
  const levelHeights = useMemo(() => {
    const list = [];
    const step = (height - 0.4) / levels;
    for (let i = 0; i < levels; i++) {
      list.push(0.3 + i * step);
    }
    return list;
  }, [levels, height]);

  return (
    <group>
      {/* 4 Upright Columns (Blue) */}
      {[
        [-halfW + colThickness / 2, -halfD + colThickness / 2],
        [halfW - colThickness / 2, -halfD + colThickness / 2],
        [-halfW + colThickness / 2, halfD - colThickness / 2],
        [halfW - colThickness / 2, halfD - colThickness / 2],
      ].map(([x, z], idx) => (
        <group key={`col-${idx}`}>
          <mesh
            position={[x, height / 2, z]}
            material={materials.blue}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[colThickness, height, colThickness]} />
          </mesh>

          {/* Yellow Safety Guard at Base */}
          <mesh
            position={[x, 0.2, z]}
            material={materials.yellow}
            castShadow
          >
            <cylinderGeometry args={[colThickness * 1.3, colThickness * 1.5, 0.4, 16]} />
          </mesh>
        </group>
      ))}

      {/* Side Bracings (Blue / Dark) */}
      {[-halfW + colThickness / 2, halfW - colThickness / 2].map((x, sideIdx) => (
        <group key={`side-bracing-${sideIdx}`}>
          {levelHeights.map((lh, hIdx) => (
            <mesh
              key={`side-tie-${hIdx}`}
              position={[x, lh, 0]}
              material={materials.blue}
              castShadow
            >
              <boxGeometry args={[colThickness * 0.8, colThickness * 0.8, depth - colThickness * 2]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Horizontal Load Beams (Orange) on each level */}
      {levelHeights.map((lh, lIdx) => (
        <group key={`level-${lIdx}`}>
          {/* Front Orange Beam */}
          <mesh
            position={[0, lh, halfD - colThickness / 2]}
            material={materials.orange}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width, beamThickness, beamThickness]} />
          </mesh>

          {/* Back Orange Beam */}
          <mesh
            position={[0, lh, -halfD + colThickness / 2]}
            material={materials.orange}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width, beamThickness, beamThickness]} />
          </mesh>

          {/* Wire Mesh / Support Cross Members */}
          {[-width * 0.25, 0, width * 0.25].map((supportX, sIdx) => (
            <mesh
              key={`support-${sIdx}`}
              position={[supportX, lh - 0.01, 0]}
              material={materials.steelShelf}
            >
              <boxGeometry args={[0.04, 0.03, depth - colThickness * 2]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
