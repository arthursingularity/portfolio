"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * Standard Wooden Warehouse Pallet (PBR / EUR Standard)
 * Dimensions: 1.2m x 1.0m x 0.14m
 */
export default function PalletModel({
  width = 1.2,
  depth = 1.0,
  height = 0.14,
  wireframe = false,
}) {
  const woodMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c49a67",
        roughness: 0.8,
        metalness: 0.05,
        wireframe,
      }),
    [wireframe]
  );

  const boardThickness = 0.022;
  const blockHeight = height - boardThickness * 2;
  const numTopSlats = 5;
  const slatWidth = (depth - 0.04 * (numTopSlats - 1)) / numTopSlats;

  return (
    <group position={[0, height / 2, 0]}>
      {/* Top Deck Slats */}
      {Array.from({ length: numTopSlats }).map((_, i) => {
        const z = -depth / 2 + slatWidth / 2 + i * (slatWidth + 0.04);
        return (
          <mesh
            key={`top-slat-${i}`}
            position={[0, height / 2 - boardThickness / 2, z]}
            material={woodMaterial}
          >
            <boxGeometry args={[width, boardThickness, slatWidth]} />
          </mesh>
        );
      })}

      {/* 3 Spacer Stringer Boards / Blocks */}
      {[-width / 2 + 0.06, 0, width / 2 - 0.06].map((x, i) => (
        <group key={`stringer-${i}`}>
          <mesh
            position={[x, 0, 0]}
            material={woodMaterial}
          >
            <boxGeometry args={[0.09, blockHeight, depth]} />
          </mesh>
        </group>
      ))}

      {/* Bottom Deck Boards */}
      {[-depth / 2 + 0.08, 0, depth / 2 - 0.08].map((z, i) => (
        <mesh
          key={`bottom-slat-${i}`}
          position={[0, -height / 2 + boardThickness / 2, z]}
          material={woodMaterial}
        >
          <boxGeometry args={[width, boardThickness, 0.12]} />
        </mesh>
      ))}
    </group>
  );
}
