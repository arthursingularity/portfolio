"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * WallModel (Parede Arquitetônica / Industrial)
 * Componente 3D para paredes com dimensões e acabamento customizáveis.
 *
 * Props:
 * - width: Largura / Espessura [m] (ex: 0.20m = 20cm)
 * - height: Altura [m] (ex: 2.80m)
 * - depth: Comprimento / Extensão [m] (ex: 4.00m)
 * - color: Cor da parede (hex)
 */
export default function WallModel({
  width = 0.2,
  height = 2.8,
  depth = 4.0,
  color = "#d1d5db",
}) {
  const safeWidth = Math.max(0.01, Number(width) || 0.2);
  const safeHeight = Math.max(0.01, Number(height) || 2.8);
  const safeDepth = Math.max(0.01, Number(depth) || 4.0);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: color || "#d1d5db",
        roughness: 0.88,
        metalness: 0.04,
      }),
    [color]
  );

  return (
    <group position={[0, safeHeight / 2, 0]}>
      <mesh material={material}>
        <boxGeometry args={[safeWidth, safeHeight, safeDepth]} />
      </mesh>
    </group>
  );
}
