"use client";

import React, { useMemo, useEffect } from "react";
import * as THREE from "three";

/**
 * BarModel (Barra / Tubo Metálico Quadrado - Metalon)
 * Perfil metálico estrutural oco com dimensões e acabamento customizáveis.
 *
 * Props:
 * - width: Largura do perfil metálico [m] (ex: 0.05m = 50mm)
 * - height: Altura do perfil metálico [m] (ex: 0.05m = 50mm)
 * - depth: Comprimento da barra [m] (ex: 2.00m)
 * - color: Cor do acabamento metálico (hex)
 */
export default function BarModel({
  width = 0.05,
  height = 0.05,
  depth = 2.0,
  color = "#383d42",
}) {
  const safeWidth = Math.max(0.005, Number(width) || 0.05);
  const safeHeight = Math.max(0.005, Number(height) || 0.05);
  const safeDepth = Math.max(0.01, Number(depth) || 2.0);

  const geometry = useMemo(() => {
    const hw = safeWidth / 2;
    const hh = safeHeight / 2;
    const minDim = Math.min(safeWidth, safeHeight);
    // Espessura da chapa do tubo proporcional à bitola
    const wallThick = Math.min(minDim * 0.45, Math.max(0.0015, minDim * 0.08));
    const innerHw = Math.max(0.0005, hw - wallThick);
    const innerHh = Math.max(0.0005, hh - wallThick);

    const shape = new THREE.Shape();
    // Contorno externo
    shape.moveTo(-hw, -hh);
    shape.lineTo(hw, -hh);
    shape.lineTo(hw, hh);
    shape.lineTo(-hw, hh);
    shape.closePath();

    // Orifício oco interno (perfil metalon)
    const hole = new THREE.Path();
    hole.moveTo(-innerHw, -innerHh);
    hole.lineTo(-innerHw, innerHh);
    hole.lineTo(innerHw, innerHh);
    hole.lineTo(innerHw, -innerHh);
    hole.closePath();
    shape.holes.push(hole);

    const extrudeSettings = {
      steps: 1,
      depth: safeDepth,
      bevelEnabled: false,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Centraliza o comprimento em Z para rotações e posicionamento simétricos
    geo.translate(0, 0, -safeDepth / 2);
    return geo;
  }, [safeWidth, safeHeight, safeDepth]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: color || "#383d42",
        roughness: 0.36,
        metalness: 0.85,
        side: THREE.DoubleSide,
      }),
    [color]
  );

  return (
    <group position={[0, safeHeight / 2, 0]}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}
