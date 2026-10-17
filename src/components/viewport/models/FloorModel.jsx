"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * Concrete Industrial Floor (Piso de Setor com Demarcação de Faixa Amarela)
 * Replicates the concrete warehouse slab with safety walkways.
 */
export default function FloorModel({
  width = 12,
  depth = 12,
  thickness = 0.08,
  showDemarcation = true,
  wireframe = false,
}) {
  const materials = useMemo(
    () => ({
      concrete: new THREE.MeshStandardMaterial({
        color: "#b0b4b8",
        roughness: 0.85,
        metalness: 0.05,
        wireframe,
      }),
      darkBorder: new THREE.MeshStandardMaterial({
        color: "#3f3f46",
        roughness: 0.9,
        wireframe,
      }),
    }),
    [wireframe]
  );

  const safeW = Math.max(0.5, Number(width) || 10);
  const safeD = Math.max(0.5, Number(depth) || 10);
  const fixedThickness = 0.08; // Altura sempre fixa

  const halfW = safeW / 2;
  const halfD = safeD / 2;
  const lineWidth = 0.12;

  return (
    <group position={[0, -fixedThickness / 2, 0]}>
      {/* Main Concrete Slab */}
      <mesh material={materials.concrete} receiveShadow>
        <boxGeometry args={[safeW, fixedThickness, safeD]} />
      </mesh>
    </group>
  );
}
