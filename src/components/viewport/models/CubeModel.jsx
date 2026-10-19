"use client";

import React, { useMemo, useEffect } from "react";
import * as THREE from "three";

/**
 * CubeModel (Cubo Paramétrico)
 * Componente 3D para renderização de cubo com dimensões e cor customizáveis.
 *
 * Props:
 * - width: Largura / Eixo X [m] (ex: 1.0)
 * - height: Altura / Eixo Y [m] (ex: 1.0)
 * - depth: Comprimento / Eixo Z [m] (ex: 1.0)
 * - color: Cor do cubo (hex, ex: "#3b82f6")
 */
export default function CubeModel({
  width = 1.0,
  height = 1.0,
  depth = 1.0,
  color = "#3b82f6",
}) {
  const safeWidth = Math.max(0.01, Number(width) || 1.0);
  const safeHeight = Math.max(0.01, Number(height) || 1.0);
  const safeDepth = Math.max(0.01, Number(depth) || 1.0);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: color || "#3b82f6",
        roughness: 0.45,
        metalness: 0.15,
      }),
    [color]
  );

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <group position={[0, safeHeight / 2, 0]}>
      <mesh material={material}>
        <boxGeometry args={[safeWidth, safeHeight, safeDepth]} />
      </mesh>
    </group>
  );
}
