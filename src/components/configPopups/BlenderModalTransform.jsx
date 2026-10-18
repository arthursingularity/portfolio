"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Calculates the point on a 3D line (P0 + t * axisDir) closest to camera ray.
 */
function projectRayOntoAxis(ray, p0, axisDir) {
  const u = axisDir.clone().normalize();
  const v = ray.direction.clone().normalize();
  const w0 = p0.clone().sub(ray.origin);

  const b = u.dot(v);
  const d = u.dot(w0);
  const e = v.dot(w0);

  const D = 1 - b * b;
  if (Math.abs(D) < 1e-5) {
    return 0; // Ray is parallel to axis
  }

  return (b * e - d) / D;
}

/**
 * BlenderModalTransform
 * Enables Blender-style modal grab/move:
 * 1. Select object
 * 2. Press G -> follows mouse
 * 3. Press X / Y / Z -> locks movement strictly along that axis
 * 4. Move mouse -> object moves along locked axis without clicking arrows
 * 5. Left Click / Enter -> confirms position
 * 6. Right Click / Esc -> cancels and restores original position
 */
export default function BlenderModalTransform({
  selectedItem,
  selectedItems = [],
  onUpdateTransform,
  onUpdateTransforms,
  snapToGrid = true,
  gridSnapSize = 0.05,
  orbitControlsRef,
  onModalActiveChange,
  onModalInfoChange,
}) {
  const { camera, gl } = useThree();
  const [isMoving, setIsMoving] = useState(false);
  const [axisLock, setAxisLock] = useState(null); // 'x' | 'y' | 'z' | null
  const [initialPos, setInitialPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);

  // Keep ref to avoid stale closures in event listeners
  const stateRef = useRef({
    isMoving: false,
    axisLock: null,
    initialPos: null,
    currentPos: null,
    selectedItem,
    selectedItems,
    initialPositionsMap: {},
    snapToGrid,
    gridSnapSize,
  });

  useEffect(() => {
    stateRef.current.selectedItem = selectedItem;
    stateRef.current.selectedItems = selectedItems;
    stateRef.current.snapToGrid = snapToGrid;
    stateRef.current.gridSnapSize = gridSnapSize;
  }, [selectedItem, selectedItems, snapToGrid, gridSnapSize]);

  // Notify parent of modal active state and UI info
  useEffect(() => {
    onModalActiveChange?.(isMoving);
    if (!isMoving) {
      onModalInfoChange?.(null);
    } else {
      const init = initialPos || [0, 0, 0];
      const curr = currentPos || init;
      const dx = (curr[0] - init[0]).toFixed(2);
      const dy = (curr[1] - init[1]).toFixed(2);
      const dz = (curr[2] - init[2]).toFixed(2);

      onModalInfoChange?.({
        axisLock,
        initialPos: init,
        currentPos: curr,
        delta: { dx, dy, dz },
      });
    }
  }, [isMoving, axisLock, initialPos, currentPos, onModalActiveChange, onModalInfoChange]);

  // Finish move (Confirm)
  const confirmMove = () => {
    const s = stateRef.current;
    if (!s.isMoving) return;

    if (
      s.selectedItems &&
      s.selectedItems.length > 1 &&
      onUpdateTransforms &&
      s.initialPos &&
      s.currentPos
    ) {
      const deltaX = s.currentPos[0] - s.initialPos[0];
      const deltaY = s.currentPos[1] - s.initialPos[1];
      const deltaZ = s.currentPos[2] - s.initialPos[2];
      const updates = s.selectedItems.map((it) => {
        const baseP = s.initialPositionsMap?.[it.id] || it.position;
        return {
          id: it.id,
          position: [
            Math.round((baseP[0] + deltaX) * 100) / 100,
            Math.round((baseP[1] + deltaY) * 100) / 100,
            Math.round((baseP[2] + deltaZ) * 100) / 100,
          ],
        };
      });
      onUpdateTransforms(updates);
    } else if (s.selectedItem && s.currentPos) {
      onUpdateTransform?.(s.selectedItem.id, {
        position: [
          Math.round(s.currentPos[0] * 100) / 100,
          Math.round(s.currentPos[1] * 100) / 100,
          Math.round(s.currentPos[2] * 100) / 100,
        ],
      });
    }

    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = true;
    }
    document.body.style.cursor = "default";

    stateRef.current.isMoving = false;
    stateRef.current.axisLock = null;
    stateRef.current.initialPos = null;
    stateRef.current.currentPos = null;
    stateRef.current.initialPositionsMap = {};

    setIsMoving(false);
    setAxisLock(null);
    setInitialPos(null);
    setCurrentPos(null);
  };

  // Cancel move (Revert to initialPos)
  const cancelMove = () => {
    const s = stateRef.current;
    if (!s.isMoving) return;

    if (
      s.selectedItems &&
      s.selectedItems.length > 1 &&
      onUpdateTransforms &&
      s.initialPositionsMap
    ) {
      const updates = s.selectedItems.map((it) => ({
        id: it.id,
        position: [...(s.initialPositionsMap[it.id] || it.position)],
      }));
      onUpdateTransforms(updates);
    } else if (s.selectedItem && s.initialPos) {
      onUpdateTransform?.(s.selectedItem.id, {
        position: [...s.initialPos],
      });
    }

    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = true;
    }
    document.body.style.cursor = "default";

    stateRef.current.isMoving = false;
    stateRef.current.axisLock = null;
    stateRef.current.initialPos = null;
    stateRef.current.currentPos = null;
    stateRef.current.initialPositionsMap = {};

    setIsMoving(false);
    setAxisLock(null);
    setInitialPos(null);
    setCurrentPos(null);
  };

  // Global keydown listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in form inputs
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const s = stateRef.current;

      // Start modal move when G is pressed and an item is selected
      if (e.key === "g" || e.key === "G") {
        if (!s.isMoving && s.selectedItem) {
          e.preventDefault();
          e.stopPropagation();

          const startPos = [...s.selectedItem.position];
          const initMap = {};
          (s.selectedItems || []).forEach((it) => {
            initMap[it.id] = [...it.position];
          });
          stateRef.current.isMoving = true;
          stateRef.current.axisLock = null;
          stateRef.current.initialPos = startPos;
          stateRef.current.currentPos = startPos;
          stateRef.current.initialPositionsMap = initMap;

          if (orbitControlsRef?.current) {
            orbitControlsRef.current.enabled = false;
          }
          document.body.style.cursor = "move";

          setIsMoving(true);
          setAxisLock(null);
          setInitialPos(startPos);
          setCurrentPos(startPos);
        } else if (s.isMoving) {
          e.preventDefault();
          confirmMove();
        }
        return;
      }

      // While moving, handle Axis Locks & Confirm/Cancel
      if (s.isMoving) {
        if (e.key === "x" || e.key === "X") {
          e.preventDefault();
          const next = s.axisLock === "x" ? null : "x";
          stateRef.current.axisLock = next;
          setAxisLock(next);
        } else if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          const next = s.axisLock === "y" ? null : "y";
          stateRef.current.axisLock = next;
          setAxisLock(next);
        } else if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          const next = s.axisLock === "z" ? null : "z";
          stateRef.current.axisLock = next;
          setAxisLock(next);
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          confirmMove();
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          cancelMove();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Pointer Move & Pointer Down handlers
  useEffect(() => {
    const handlePointerMove = (e) => {
      const s = stateRef.current;
      if (!s.isMoving || !s.selectedItem || !s.initialPos) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const ray = raycaster.ray;

      const p0 = new THREE.Vector3(...s.initialPos);
      let newX = p0.x;
      let newY = p0.y;
      let newZ = p0.z;

      const step = s.snapToGrid ? s.gridSnapSize || 0.05 : 0.05;
      const snapVal = (val, st) => Math.round(Math.round(val / st) * st * 1000) / 1000;

      if (s.axisLock === "x") {
        const t = projectRayOntoAxis(ray, p0, new THREE.Vector3(1, 0, 0));
        newX = p0.x + snapVal(t, step);
      } else if (s.axisLock === "z") {
        // In Blender convention, Z is height (Y in Three.js)
        const t = projectRayOntoAxis(ray, p0, new THREE.Vector3(0, 1, 0));
        newY = p0.y + snapVal(t, step);
      } else if (s.axisLock === "y") {
        // In Blender convention, Y is depth (Z in Three.js)
        const t = projectRayOntoAxis(ray, p0, new THREE.Vector3(0, 0, 1));
        newZ = p0.z + snapVal(t, step);
      } else {
        // Free movement along horizontal plane (X and Z)
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -p0.y);
        const hit = new THREE.Vector3();
        if (ray.intersectPlane(plane, hit)) {
          newX = snapVal(hit.x, step);
          newZ = snapVal(hit.z, step);
        }
      }

      const nextPos = [
        Math.round(newX * 10) / 10,
        Math.round(newY * 10) / 10,
        Math.round(newZ * 10) / 10,
      ];

      stateRef.current.currentPos = nextPos;
      setCurrentPos(nextPos);

      // Realtime visual position update
      if (s.selectedItems && s.selectedItems.length > 1 && onUpdateTransforms) {
        const deltaX = nextPos[0] - s.initialPos[0];
        const deltaY = nextPos[1] - s.initialPos[1];
        const deltaZ = nextPos[2] - s.initialPos[2];
        const updates = s.selectedItems.map((it) => {
          const baseP = s.initialPositionsMap?.[it.id] || it.position;
          return {
            id: it.id,
            position: [
              Math.round((baseP[0] + deltaX) * 100) / 100,
              Math.round((baseP[1] + deltaY) * 100) / 100,
              Math.round((baseP[2] + deltaZ) * 100) / 100,
            ],
          };
        });
        onUpdateTransforms(updates);
      } else {
        onUpdateTransform?.(s.selectedItem.id, { position: nextPos });
      }
    };

    const handlePointerDown = (e) => {
      const s = stateRef.current;
      if (!s.isMoving) return;

      if (e.button === 0) {
        // Left click confirms move
        e.preventDefault();
        e.stopPropagation();
        confirmMove();
      } else if (e.button === 2) {
        // Right click cancels move
        e.preventDefault();
        e.stopPropagation();
        cancelMove();
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [camera, gl, onUpdateTransform]);

  // Render 3D guide lines when axis is locked
  const axisLine = useMemo(() => {
    if (!isMoving || !currentPos) return null;

    let points = null;
    let color = "#e03535";

    if (axisLock === "x") {
      color = "#e03535"; // Red for X
      points = [
        new THREE.Vector3(currentPos[0] - 250, currentPos[1], currentPos[2]),
        new THREE.Vector3(currentPos[0] + 250, currentPos[1], currentPos[2]),
      ];
    } else if (axisLock === "z") {
      color = "#3b82f6"; // Blue for Z (Height / Vertical in Blender)
      points = [
        new THREE.Vector3(currentPos[0], currentPos[1] - 250, currentPos[2]),
        new THREE.Vector3(currentPos[0], currentPos[1] + 250, currentPos[2]),
      ];
    } else if (axisLock === "y") {
      color = "#52b536"; // Green for Y (Depth / Horizontal in Blender)
      points = [
        new THREE.Vector3(currentPos[0], currentPos[1], currentPos[2] - 250),
        new THREE.Vector3(currentPos[0], currentPos[1], currentPos[2] + 250),
      ];
    }

    if (!points) return null;

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return { geometry, color };
  }, [isMoving, axisLock, currentPos]);

  // Dashed connection from origin (initialPos) to object (currentPos)
  const offsetLine = useMemo(() => {
    if (!isMoving || !initialPos || !currentPos) return null;
    const p1 = new THREE.Vector3(...initialPos);
    const p2 = new THREE.Vector3(...currentPos);
    if (p1.distanceTo(p2) < 0.05) return null;

    const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    return geometry;
  }, [isMoving, initialPos, currentPos]);

  if (!isMoving) return null;

  return (
    <group name="__helper_modal_transform" userData={{ isHelper: true }}>
      {/* Infinite Axis Guide Line */}
      {axisLine && (
        <line geometry={axisLine.geometry}>
          <lineBasicMaterial
            color={axisLine.color}
            linewidth={2}
            depthTest={false}
          />
        </line>
      )}

      {/* Origin to Current Offset Line */}
      {offsetLine && (
        <line geometry={offsetLine}>
          <lineDashedMaterial
            color="#ffffff"
            dashSize={0.2}
            gapSize={0.15}
            transparent
            opacity={0.6}
            depthTest={false}
          />
        </line>
      )}
    </group>
  );
}
