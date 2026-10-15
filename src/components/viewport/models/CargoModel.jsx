"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import PalletModel from "./PalletModel";

/**
 * Cargo Loaded on Pallet (Caixas Vermelhas ou Cinzas)
 * Exactly reproduces the cargo stacks from the warehouse image.
 */
export default function CargoModel({
  cargoType = "red", // "red" | "gray"
  layers = 3,
  withPallet = true,
  wireframe = false,
}) {
  const materials = useMemo(
    () => ({
      redBox: new THREE.MeshStandardMaterial({
        color: "#c05645",
        roughness: 0.75,
        metalness: 0.05,
        wireframe,
      }),
      grayBox: new THREE.MeshStandardMaterial({
        color: "#424345",
        roughness: 0.8,
        metalness: 0.1,
        wireframe,
      }),
      tape: new THREE.MeshStandardMaterial({
        color: "#d97706",
        roughness: 0.5,
        wireframe,
      }),
    }),
    [wireframe]
  );

  const palletHeight = withPallet ? 0.14 : 0;

  // Box dimensions
  const isRed = cargoType === "red";
  const boxW = isRed ? 0.52 : 0.54;
  const boxD = isRed ? 0.44 : 0.46;
  const boxH = isRed ? 0.32 : 0.28;

  // 2x2 grid per layer
  const gridPositions = [
    [-boxW / 2 + 0.02, -boxD / 2 + 0.02],
    [boxW / 2 - 0.02, -boxD / 2 + 0.02],
    [-boxW / 2 + 0.02, boxD / 2 - 0.02],
    [boxW / 2 - 0.02, boxD / 2 - 0.02],
  ];

  return (
    <group>
      {/* Base Pallet */}
      {withPallet && <PalletModel />}

      {/* Stack of Boxes */}
      <group position={[0, palletHeight, 0]}>
        {Array.from({ length: layers }).map((_, layerIdx) => {
          const y = (layerIdx + 0.5) * boxH;
          return (
            <group key={`layer-${layerIdx}`}>
              {gridPositions.map(([x, z], boxIdx) => (
                <group key={`box-${layerIdx}-${boxIdx}`} position={[x, y, z]}>
                  <mesh
                    material={isRed ? materials.redBox : materials.grayBox}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[boxW - 0.015, boxH - 0.01, boxD - 0.015]} />
                  </mesh>
                </group>
              ))}
            </group>
          );
        })}
      </group>
    </group>
  );
}
