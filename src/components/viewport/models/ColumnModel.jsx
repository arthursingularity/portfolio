"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * Structural Building Column (Coluna Estrutural de Concreto)
 * With yellow & black caution base stripe.
 */
export default function ColumnModel({ height = 4.5, size = 0.5, wireframe = false }) {
  const materials = useMemo(
    () => ({
      concrete: new THREE.MeshStandardMaterial({
        color: "#9ca3af",
        roughness: 0.9,
        metalness: 0.05,
        wireframe,
      }),
      yellowBase: new THREE.MeshStandardMaterial({
        color: "#eab308",
        roughness: 0.4,
        wireframe,
      }),
    }),
    [wireframe]
  );

  return (
    <group position={[0, height / 2, 0]}>
      {/* Main Concrete Pillar */}
      <mesh material={materials.concrete} castShadow receiveShadow>
        <boxGeometry args={[size, height, size]} />
      </mesh>

      {/* Yellow Safety Base Protection */}
      <mesh position={[0, -height / 2 + 0.35, 0]} material={materials.yellowBase} castShadow>
        <boxGeometry args={[size + 0.06, 0.7, size + 0.06]} />
      </mesh>
    </group>
  );
}
