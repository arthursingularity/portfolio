"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * Electric Forklift / Pallet Stacker (Paleteira Elétrica Amarela)
 * Exactly reproduces the yellow forklift seen in the warehouse image.
 */
export default function ForkliftModel({ wireframe = false }) {
  const materials = useMemo(
    () => ({
      yellow: new THREE.MeshStandardMaterial({
        color: "#f59e0b",
        roughness: 0.35,
        metalness: 0.2,
        wireframe,
      }),
      darkGray: new THREE.MeshStandardMaterial({
        color: "#27272a",
        roughness: 0.5,
        metalness: 0.3,
        wireframe,
      }),
      steelFork: new THREE.MeshStandardMaterial({
        color: "#71717a",
        roughness: 0.4,
        metalness: 0.6,
        wireframe,
      }),
    }),
    [wireframe]
  );

  return (
    <group position={[0, 0, 0]}>
      {/* Base Chassis / Wheels */}
      <mesh position={[0, 0.25, 0]} material={materials.darkGray} castShadow>
        <boxGeometry args={[0.9, 0.4, 0.9]} />
      </mesh>

      {/* Yellow Main Body Cover */}
      <mesh position={[0, 0.7, 0]} material={materials.yellow} castShadow>
        <boxGeometry args={[0.85, 0.6, 0.85]} />
      </mesh>

      {/* Control Console / Steering Arm */}
      <mesh position={[0, 1.05, 0.2]} material={materials.darkGray} castShadow>
        <boxGeometry args={[0.35, 0.2, 0.25]} />
      </mesh>

      {/* Vertical Mast (Colunas do Mastro) */}
      {[-0.28, 0.28].map((x, i) => (
        <mesh
          key={`mast-${i}`}
          position={[x, 1.3, -0.42]}
          material={materials.darkGray}
          castShadow
        >
          <boxGeometry args={[0.07, 1.8, 0.08]} />
        </mesh>
      ))}

      {/* Top Crossbar of Mast */}
      <mesh
        position={[0, 2.15, -0.42]}
        material={materials.darkGray}
        castShadow
      >
        <boxGeometry args={[0.65, 0.08, 0.08]} />
      </mesh>

      {/* Fork Carriage (Yellow) */}
      <mesh
        position={[0, 0.3, -0.46]}
        material={materials.yellow}
        castShadow
      >
        <boxGeometry args={[0.6, 0.35, 0.06]} />
      </mesh>

      {/* Metal Lifting Forks (Prongs extending forward) */}
      {[-0.18, 0.18].map((x, i) => (
        <group key={`fork-${i}`} position={[x, 0.06, -1.0]}>
          <mesh material={materials.steelFork} castShadow receiveShadow>
            <boxGeometry args={[0.12, 0.04, 1.1]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
