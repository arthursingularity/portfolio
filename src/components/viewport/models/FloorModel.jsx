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
      yellowLine: new THREE.MeshStandardMaterial({
        color: "#eab308",
        roughness: 0.4,
        metalness: 0.1,
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

      {/* Safety Yellow Demarcation Lines along edges */}
      {showDemarcation && (
        <group position={[0, fixedThickness / 2 + 0.001, 0]}>
          {/* North Line */}
          <mesh
            position={[0, 0, -halfD + lineWidth / 2 + 0.2]}
            material={materials.yellowLine}
            receiveShadow
          >
            <boxGeometry args={[Math.max(0.1, safeW - 0.4), 0.002, lineWidth]} />
          </mesh>
          {/* South Line */}
          <mesh
            position={[0, 0, halfD - lineWidth / 2 - 0.2]}
            material={materials.yellowLine}
            receiveShadow
          >
            <boxGeometry args={[Math.max(0.1, safeW - 0.4), 0.002, lineWidth]} />
          </mesh>
          {/* East Line */}
          <mesh
            position={[halfW - lineWidth / 2 - 0.2, 0, 0]}
            material={materials.yellowLine}
            receiveShadow
          >
            <boxGeometry args={[lineWidth, 0.002, Math.max(0.1, safeD - 0.4)]} />
          </mesh>
          {/* West Line */}
          <mesh
            position={[-halfW + lineWidth / 2 + 0.2, 0, 0]}
            material={materials.yellowLine}
            receiveShadow
          >
            <boxGeometry args={[lineWidth, 0.002, Math.max(0.1, safeD - 0.4)]} />
          </mesh>
        </group>
      )}
    </group>
  );
}
