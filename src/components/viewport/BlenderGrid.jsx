"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { Grid } from "@react-three/drei";

/**
 * 3D Cursor at Origin (Blender Style)
 * Red/white dashed ring with crosshair lines.
 */
function BlenderCursor() {
  const crosshairGeo = useMemo(() => {
    const pts = [
      // X crosshair
      new THREE.Vector3(-0.35, 0, 0),
      new THREE.Vector3(0.35, 0, 0),
      // Z crosshair
      new THREE.Vector3(0, 0, -0.35),
      new THREE.Vector3(0, 0, 0.35),
      // Y crosshair (vertical)
      new THREE.Vector3(0, -0.35, 0),
      new THREE.Vector3(0, 0.35, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  return (
    <group position={[0, 0.001, 0]}>
      {/* Outer dashed ring (Blender Red & White) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.25, 48]} />
        <meshBasicMaterial
          color="#ea3838"
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.27, 48]} />
        <meshBasicMaterial
          color="#ffffff"
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Crosshair Lines */}
      <lineSegments geometry={crosshairGeo}>
        <lineBasicMaterial
          color="#18181b"
          depthWrite={false}
          transparent
          opacity={0.8}
        />
      </lineSegments>

      {/* Center dot */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.03, 16]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * Blender Ground Grid
 * Exact colors matching Blender's 3D Viewport Theme:
 * - Neutral gray floor
 * - Visible, high-contrast sub-grid & major grid
 * - Vibrant Red (X) and Green (Y/Z depth) axis lines
 * - Iconic 3D Cursor at (0, 0, 0)
 */
export default function BlenderGrid({
  gridSize = 120,
  cellSize = 1,
  sectionSize = 5,
  fadeDistance = 120,
}) {
  const axisRange = 300;

  // X Axis (Red) and Z Axis (Green) ground reference lines
  const { xGeometry, zGeometry } = useMemo(() => {
    const xPts = [
      new THREE.Vector3(-axisRange, 0, 0),
      new THREE.Vector3(axisRange, 0, 0),
    ];
    const zPts = [
      new THREE.Vector3(0, 0, -axisRange),
      new THREE.Vector3(0, 0, axisRange),
    ];

    const xGeo = new THREE.BufferGeometry().setFromPoints(xPts);
    const zGeo = new THREE.BufferGeometry().setFromPoints(zPts);

    return { xGeometry: xGeo, zGeometry: zGeo };
  }, [axisRange]);

  return (
    <group position={[0, 0, 0]}>
      {/* Dynamic Infinite Floor Grid - Blender Theme Colors */}
      <Grid
        position={[0, -0.0005, 0]}
        args={[gridSize, gridSize]}
        cellSize={cellSize}
        cellThickness={1.0}
        cellColor="#4e4e53"
        sectionSize={sectionSize}
        sectionThickness={1.5}
        sectionColor="#686870"
        fadeDistance={fadeDistance}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Blender Primary Ground Axis Lines */}
      {/* X Axis - Vibrant Red */}
      <line geometry={xGeometry} position={[0, 0.0003, 0]}>
        <lineBasicMaterial
          color="#e03535"
          linewidth={2}
          depthWrite={false}
        />
      </line>

      {/* Z Axis - Vibrant Green (Blender Depth Axis) */}
      <line geometry={zGeometry} position={[0, 0.0003, 0]}>
        <lineBasicMaterial
          color="#52b536"
          linewidth={2}
          depthWrite={false}
        />
      </line>

      {/* Blender 3D Cursor at Center */}
      <BlenderCursor />
    </group>
  );
}
