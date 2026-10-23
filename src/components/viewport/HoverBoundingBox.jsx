"use client";

import React, { useRef, useLayoutEffect, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/**
 * Checks if a 3D node is an editor helper, gizmo, or part of a helper group.
 * Ensures the bounding box calculation NEVER measures editor helpers or itself.
 */
function isHelperNode(node, root) {
  let curr = node;
  while (curr && curr !== root) {
    if (
      curr.name?.startsWith("__helper") ||
      curr.name?.startsWith("TransformControls") ||
      curr.userData?.isHelper ||
      curr.userData?.isGizmo ||
      curr.isTransformControls ||
      curr.type === "TransformControlsPlane"
    ) {
      return true;
    }
    curr = curr.parent;
  }
  return false;
}

/**
 * 3D Bounding Box Outline (Borda Azul no Hover e Seleção)
 * Wraps around the object with a crisp electric-blue wireframe boundary box
 * and a subtle translucent blue highlight.
 *
 * Garante que a borda azul sempre acompanhe milimetricamente o tamanho e
 * posição reais do modelo em tempo real, mesmo após edições de dimensões.
 */
export default function HoverBoundingBox({
  target,
  item = null,
  itemProps = null,
  color = "#38bdf8",
}) {
  const groupRef = useRef(null);
  const lineRef = useRef(null);
  const meshRef = useRef(null);
  const lastBoundsRef = useRef(null);

  const updateBoundingBox = useCallback(() => {
    if (!target || !groupRef.current || !lineRef.current || !meshRef.current) {
      return;
    }

    target.updateMatrixWorld(true);
    const inverseTarget = target.matrixWorld.clone().invert();
    const localBox = new THREE.Box3();

    target.traverse((child) => {
      // Ignore non-meshes or meshes without geometry
      if (!child.isMesh || !child.geometry) return;

      // Ignore hidden meshes
      if (!child.visible) return;

      // Ignore all editor helpers, gizmos, and bounding box components
      if (isHelperNode(child, target)) return;

      // Force-recompute geometry bounding box to ensure fresh vertex extrema
      child.geometry.computeBoundingBox();
      if (child.geometry.boundingBox) {
        const geomBox = child.geometry.boundingBox.clone();
        child.updateMatrixWorld(true);
        const childToTarget = child.matrixWorld.clone().premultiply(inverseTarget);
        geomBox.applyMatrix4(childToTarget);
        localBox.union(geomBox);
      }
    });

    if (localBox.isEmpty()) {
      groupRef.current.visible = false;
      return;
    }

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    localBox.getSize(size);
    localBox.getCenter(center);

    const padX = 0.006;
    const padY = 0.016;
    const padZ = 0.016;
    const sx = Math.max(0.04, size.x + padX);
    const sy = Math.max(0.02, size.y + padY);
    const sz = Math.max(0.04, size.z + padZ);

    const last = lastBoundsRef.current;
    if (
      last &&
      Math.abs(last.sx - sx) < 0.0005 &&
      Math.abs(last.sy - sy) < 0.0005 &&
      Math.abs(last.sz - sz) < 0.0005 &&
      Math.abs(last.cx - center.x) < 0.0005 &&
      Math.abs(last.cy - center.y) < 0.0005 &&
      Math.abs(last.cz - center.z) < 0.0005
    ) {
      groupRef.current.visible = true;
      return;
    }

    lastBoundsRef.current = { sx, sy, sz, cx: center.x, cy: center.y, cz: center.z };

    groupRef.current.position.set(center.x, center.y, center.z);
    groupRef.current.visible = true;

    // Dispose old geometries to prevent memory leaks
    const oldMeshGeom = meshRef.current.geometry;
    const oldLineGeom = lineRef.current.geometry;

    const newBoxGeom = new THREE.BoxGeometry(sx, sy, sz);
    const newEdgesGeom = new THREE.EdgesGeometry(newBoxGeom);

    meshRef.current.geometry = newBoxGeom;
    lineRef.current.geometry = newEdgesGeom;

    oldMeshGeom?.dispose();
    oldLineGeom?.dispose();
  }, [target]);

  // Update immediately after React/R3F commits DOM and geometry mutations
  useLayoutEffect(() => {
    updateBoundingBox();
  }, [target, item, itemProps, updateBoundingBox]);

  // Keep continuously synchronized on each frame (zero overhead if bounds haven't changed)
  useFrame(() => {
    updateBoundingBox();
  });

  // Clean up geometries on unmount
  useEffect(() => {
    const meshNode = meshRef.current;
    const lineNode = lineRef.current;
    return () => {
      meshNode?.geometry?.dispose();
      lineNode?.geometry?.dispose();
    };
  }, []);

  return (
    <group
      ref={groupRef}
      name="__helper_hover_box"
      userData={{ isHelper: true }}
      visible={false}
      raycast={() => null}
    >
      {/* 12-edge clean wireframe outline */}
      <lineSegments
        ref={lineRef}
        name="__helper_hover_lines"
        userData={{ isHelper: true }}
        raycast={() => null}
      >
        <lineBasicMaterial
          color={color}
          linewidth={2}
          transparent
          opacity={0.95}
          depthTest={false}
        />
      </lineSegments>

      {/* Subtle translucent fill */}
      <mesh
        ref={meshRef}
        name="__helper_hover_mesh"
        userData={{ isHelper: true }}
        raycast={() => null}
      >
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
