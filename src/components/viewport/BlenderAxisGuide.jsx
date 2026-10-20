"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * BlenderAxisGuide
 * Linha guia 3D infinita estilo Blender passando pelo pivô do objeto ativo.
 * - Eixo X: Vermelho (#ef4444) along [1, 0, 0]
 * - Eixo Y: Verde (#22c55e) along [0, 0, 1] (Blender Y = Profundidade horizontal no Three.js)
 * - Eixo Z: Azul (#3b82f6) along [0, 1, 0] (Blender Z = Altura vertical no Three.js)
 */
export default function BlenderAxisGuide({
  pivot = [0, 0, 0],
  axis = null, // 'x' | 'y' | 'z' | null
  axisVector = null, // THREE.Vector3 opcional para eixos locais
  axisSpace = "global", // 'global' | 'local'
  length = 2000,
}) {
  const lineData = useMemo(() => {
    if (!axis) return null;

    const px = pivot[0] ?? pivot.x ?? 0;
    const py = pivot[1] ?? pivot.y ?? 0;
    const pz = pivot[2] ?? pivot.z ?? 0;
    const p = new THREE.Vector3(px, py, pz);

    const half = length / 2;
    let start = new THREE.Vector3();
    let end = new THREE.Vector3();
    let color = "#ef4444";

    if (axis === "x") {
      // Eixo X: Vermelho
      color = "#ef4444";
    } else if (axis === "y") {
      // Eixo Y no Blender = Eixo Z no Three.js (Profundidade): Verde
      color = "#22c55e";
    } else if (axis === "z") {
      // Eixo Z no Blender = Eixo Y no Three.js (Altura vertical): Azul
      color = "#3b82f6";
    } else {
      return null;
    }

    if (axisVector && axisVector.isVector3) {
      const dir = axisVector.clone().normalize();
      start.copy(p).addScaledVector(dir, -half);
      end.copy(p).addScaledVector(dir, half);
    } else {
      if (axis === "x") {
        start.set(px - half, py, pz);
        end.set(px + half, py, pz);
      } else if (axis === "y") {
        start.set(px, py, pz - half);
        end.set(px, py, pz + half);
      } else if (axis === "z") {
        start.set(px, py - half, pz);
        end.set(px, py + half, pz);
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: 2,
      depthTest: false,
      transparent: true,
      opacity: axisSpace === "local" ? 0.95 : 0.85,
    });

    return { geometry, material, color, pivot: [px, py, pz] };
  }, [axis, axisVector, axisSpace, pivot, length]);

  if (!lineData) return null;

  return (
    <group renderOrder={999}>
      <primitive object={new THREE.Line(lineData.geometry, lineData.material)} />
      {/* Ponto central indicador do pivô */}
      <mesh position={lineData.pivot}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial
          color={lineData.color}
          depthTest={false}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}
