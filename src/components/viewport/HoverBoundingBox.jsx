"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * 3D Hover Bounding Box Outline (Borda Azul no Hover)
 * Wraps around the object with a crisp electric-blue wireframe boundary box
 * and a subtle translucent blue highlight.
 */
export default function HoverBoundingBox({ target, itemProps, color = "#38bdf8" }) {
  const boxData = useMemo(() => {
    if (!target) return null;

    target.updateMatrixWorld(true);
    const inverseTarget = target.matrixWorld.clone().invert();
    const localBox = new THREE.Box3();

    target.traverse((child) => {
      // Only measure actual model meshes (ignore editor helpers)
      if (
        child.isMesh &&
        child.geometry &&
        !child.name?.startsWith("__helper") &&
        !child.userData?.isHelper
      ) {
        if (!child.geometry.boundingBox) {
          child.geometry.computeBoundingBox();
        }
        if (child.geometry.boundingBox) {
          const geomBox = child.geometry.boundingBox.clone();
          // Transform geometry box from child local space directly into target local space
          const childToTarget = child.matrixWorld.clone().premultiply(inverseTarget);
          geomBox.applyMatrix4(childToTarget);
          localBox.union(geomBox);
        }
      }
    });

    if (localBox.isEmpty()) return null;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    localBox.getSize(size);
    localBox.getCenter(center);

    const padding = 0.04;
    const sx = Math.max(0.1, size.x + padding);
    const sy = Math.max(0.04, size.y + padding);
    const sz = Math.max(0.1, size.z + padding);

    const boxGeom = new THREE.BoxGeometry(sx, sy, sz);
    const edgesGeom = new THREE.EdgesGeometry(boxGeom);

    return {
      center: [center.x, center.y, center.z],
      edgesGeom,
      boxGeom,
    };
  }, [target, itemProps]);

  if (!boxData) return null;

  return (
    <group
      name="__helper_hover_box"
      userData={{ isHelper: true }}
      position={boxData.center}
    >
      {/* 12-edge clean wireframe outline */}
      <lineSegments geometry={boxData.edgesGeom}>
        <lineBasicMaterial
          color={color}
          linewidth={2}
          transparent
          opacity={0.95}
          depthTest={false}
        />
      </lineSegments>

      {/* Subtle translucent fill */}
      <mesh geometry={boxData.boxGeom}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.07}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
