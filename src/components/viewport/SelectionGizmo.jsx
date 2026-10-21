"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import { getSelectionWorldCenter } from "./transformUtils";

/**
 * SelectionGizmo - Manipulador 3D centralizado para seleção única e múltipla
 *
 * Características:
 * 1. Para 1 modelo: exibe as setas coloridas exatamente no centro geométrico 3D do modelo (não na base).
 * 2. Para múltiplos modelos: exibe as setas no centro exato entre os modelos selecionados.
 * 3. Rotação: gira o(s) modelo(s) tendo como pivô o centro do modelo (ou centro entre os modelos).
 * 4. Translação: move todos os modelos selecionados em conjunto.
 */
export default function SelectionGizmo({
  selectedItems = [],
  selectedId = null,
  allItems = [],
  targetRegistryRef,
  transformMode = "translate",
  axisLock = null,
  snapToGrid = true,
  gridSnapSize = 0.025,
  orbitControlsRef,
  hideGizmo = false,
  isModalGrab = false,
  isTransformingRef,
  justFinishedTransformRef,
  onTransformStart,
  onTransformEnd,
  onUpdateTransform,
  onUpdateTransforms,
}) {
  const [pivotNode, setPivotNode] = useState(null);
  const pivotRef = useRef(null);
  const controlsRef = useRef(null);
  const isDraggingRef = useRef(false);

  const setPivotCallback = useCallback((node) => {
    pivotRef.current = node;
    setPivotNode(node);
  }, []);

  const activeSelectedItems = useMemo(() => {
    if (selectedItems && selectedItems.length > 0) return selectedItems;
    if (selectedId && allItems) {
      const match = allItems.find((it) => it.id === selectedId);
      return match ? [match] : [];
    }
    return [];
  }, [selectedItems, selectedId, allItems]);

  // Expande a seleção para incluir todos os membros do grupo (Gaveta G, Caixas Brancas multiplicadas)
  const effectiveGroupItems = useMemo(() => {
    if (!activeSelectedItems || activeSelectedItems.length === 0) return [];
    const groupIds = new Set();
    activeSelectedItems.forEach((it) => {
      const gid = it.groupId || it.props?.groupId;
      if (gid) groupIds.add(gid);
    });

    const candidates = allItems && allItems.length > 0 ? allItems : activeSelectedItems;
    const map = new Map();
    activeSelectedItems.forEach((it) => map.set(it.id, it));

    candidates.forEach((it) => {
      const gid = it.groupId || it.props?.groupId;
      if (gid && groupIds.has(gid)) {
        map.set(it.id, it);
      }
      // Fallback para Caixas Brancas conectadas por varal/trilho sem groupId explícito
      if (!gid && it.type === "box" && (it.props?.rail || it.props?.trilho)) {
        const isConnected = activeSelectedItems.some(
          (r) =>
            r.type === "box" &&
            (r.props?.rail || r.props?.trilho) &&
            Math.abs((it.position?.[1] ?? 0) - (r.position?.[1] ?? 0)) < 0.05 &&
            (it.props?.connectedLeft || it.props?.connectedRight || r.props?.connectedLeft || r.props?.connectedRight)
        );
        if (isConnected) {
          map.set(it.id, it);
        }
      }
    });
    return Array.from(map.values());
  }, [activeSelectedItems, allItems]);

  // Centro geométrico imediato da seleção (calculado na renderização para nunca nascer em 0,0,0)
  const initialCenter = useMemo(() => {
    if (effectiveGroupItems.length === 0) return new THREE.Vector3(0, 0, 0);
    return getSelectionWorldCenter(effectiveGroupItems, targetRegistryRef?.current);
  }, [effectiveGroupItems, targetRegistryRef]);

  // Sincroniza a posição inicial do pivot e força attach no TransformControls imediatamente
  useEffect(() => {
    if (pivotNode && !isDraggingRef.current) {
      pivotNode.position.copy(initialCenter);
      pivotNode.rotation.set(0, 0, 0);
      if (controlsRef.current) {
        controlsRef.current.attach(pivotNode);
        controlsRef.current.updateMatrixWorld();
      }
    }
  }, [pivotNode, initialCenter]);

  // Fix Three.js TransformControls cone geometries and apply Blender colors
  const fixGizmoCones = useCallback((controls) => {
    if (!controls) return false;
    const fwdMap = {};
    const bwdList = [];

    controls.traverse((child) => {
      if (child.isMesh) {
        if (child.tag === "fwd") {
          fwdMap[child.name] = child;
        } else if (child.tag === "bwd") {
          bwdList.push(child);
        }
      }
    });

    for (const bwdChild of bwdList) {
      const fwdChild = fwdMap[bwdChild.name];
      if (fwdChild && fwdChild.geometry) {
        bwdChild.geometry = fwdChild.geometry.clone();
      }
    }

    // Invert Y and Z colors to match Blender (Z = Blue vertical height, Y = Green horizontal depth)
    controls.traverse((child) => {
      if ((child.isMesh || child.isLine) && child.material && child.material.color) {
        if (child.name === "Y") {
          child.material = child.material.clone();
          child.material.color.set("#3b82f6"); // Blue for Vertical
        } else if (child.name === "Z") {
          child.material = child.material.clone();
          child.material.color.set("#52b536"); // Green for Depth
        }
      }
    });

    controls._conesFixed = true;
    return true;
  }, []);

  // Update pivot position to exact selection center on every frame when not actively dragging
  useFrame(() => {
    if (isDraggingRef.current || !pivotRef.current || effectiveGroupItems.length === 0) {
      return;
    }
    const center = getSelectionWorldCenter(effectiveGroupItems, targetRegistryRef?.current);
    if (pivotRef.current.position.distanceToSquared(center) > 0.00001) {
      pivotRef.current.position.copy(center);
      if (controlsRef.current) {
        controlsRef.current.updateMatrixWorld();
      }
    }
    if (!controlsRef.current?.dragging) {
      pivotRef.current.rotation.set(0, 0, 0);
    }
  });

  // Ensure cones are fixed immediately on gizmo mount or mode change
  useFrame(() => {
    const controls = controlsRef.current;
    if (controls && !controls._conesFixed) {
      fixGizmoCones(controls);
    }
  });

  // Sync axis locks
  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    controls.showX = !axisLock || axisLock === "x";
    controls.showY = !axisLock || axisLock === "z";
    controls.showZ = !axisLock || axisLock === "y";
  }, [axisLock]);

  // Setup transform events
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls._conesFixed = false;
    fixGizmoCones(controls);

    const dragSession = {
      startPivotPos: new THREE.Vector3(),
      startPivotQuat: new THREE.Quaternion(),
      targets: [],
    };

    const handleDraggingChanged = (event) => {
      if (orbitControlsRef?.current) {
        orbitControlsRef.current.enabled = !event.value;
      }

      if (event.value) {
        // Drag START
        isDraggingRef.current = true;
        if (justFinishedTransformRef) justFinishedTransformRef.current = false;
        if (isTransformingRef) isTransformingRef.current = true;
        onTransformStart?.(selectedId);

        if (pivotRef.current) {
          dragSession.startPivotPos.copy(pivotRef.current.position);
          dragSession.startPivotQuat.copy(pivotRef.current.quaternion);

          // Find all target nodes (including all items in their groups)
          const targetItems = effectiveGroupItems.length > 0 ? effectiveGroupItems : activeSelectedItems;

          dragSession.targets = targetItems.map((it) => {
            const node = targetRegistryRef?.current?.[it.id];
            return {
              id: it.id,
              node,
              startPos: node
                ? node.position.clone()
                : new THREE.Vector3(it.position[0], it.position[1], it.position[2]),
              startRot: node
                ? node.rotation.clone()
                : new THREE.Euler(...it.rotation),
              startQuat: node
                ? node.quaternion.clone()
                : new THREE.Quaternion().setFromEuler(new THREE.Euler(...it.rotation)),
            };
          });
        }
      } else {
        // Drag END
        isDraggingRef.current = false;
        if (justFinishedTransformRef) justFinishedTransformRef.current = true;
        if (isTransformingRef) isTransformingRef.current = false;

        if (dragSession.targets.length > 0) {
          const updates = dragSession.targets.map((t) => {
            const pos = t.node ? t.node.position : t.startPos;
            const eul = t.node
              ? new THREE.Euler().setFromQuaternion(t.node.quaternion, "XYZ")
              : t.startRot;

            return {
              id: t.id,
              position: [
                Math.round(pos.x * 10000) / 10000,
                Math.round(pos.y * 10000) / 10000,
                Math.round(pos.z * 10000) / 10000,
              ],
              rotation: [
                Math.round(eul.x * 10000) / 10000,
                Math.round(eul.y * 10000) / 10000,
                Math.round(eul.z * 10000) / 10000,
              ],
            };
          });

          if (onUpdateTransforms && updates.length > 1) {
            onUpdateTransforms(updates);
          } else if (onUpdateTransform && updates.length === 1) {
            onUpdateTransform(updates[0].id, updates[0]);
          }

          dragSession.targets = [];
        }

        // Reset pivot orientation
        if (pivotRef.current) {
          pivotRef.current.rotation.set(0, 0, 0);
          const center = getSelectionWorldCenter(effectiveGroupItems, targetRegistryRef?.current);
          pivotRef.current.position.copy(center);
        }

        onTransformEnd?.(selectedId);
      }
    };

    const handleObjectChange = () => {
      if (!isDraggingRef.current || !pivotRef.current || dragSession.targets.length === 0) {
        return;
      }

      if (transformMode === "translate") {
        const delta = pivotRef.current.position.clone().sub(dragSession.startPivotPos);
        dragSession.targets.forEach((t) => {
          if (t.node) {
            t.node.position.copy(t.startPos).add(delta);
          }
        });
      } else if (transformMode === "rotate") {
        const deltaQuat = pivotRef.current.quaternion
          .clone()
          .multiply(dragSession.startPivotQuat.clone().invert());

        const pivotCenter = dragSession.startPivotPos;

        dragSession.targets.forEach((t) => {
          if (t.node) {
            // Orbit position around the rotation center (model center or selection center)
            const offset = t.startPos.clone().sub(pivotCenter);
            offset.applyQuaternion(deltaQuat);
            t.node.position.copy(pivotCenter).add(offset);

            // Rotate orientation by deltaQuat
            t.node.quaternion.copy(deltaQuat).multiply(t.startQuat);
          }
        });
      }
    };

    controls.addEventListener("dragging-changed", handleDraggingChanged);
    controls.addEventListener("objectChange", handleObjectChange);

    return () => {
      controls.removeEventListener("dragging-changed", handleDraggingChanged);
      controls.removeEventListener("objectChange", handleObjectChange);
    };
  }, [
    pivotNode,
    activeSelectedItems,
    allItems,
    selectedId,
    transformMode,
    orbitControlsRef,
    fixGizmoCones,
    onTransformStart,
    onTransformEnd,
    onUpdateTransform,
    onUpdateTransforms,
    isTransformingRef,
    justFinishedTransformRef,
    targetRegistryRef,
  ]);

  if (activeSelectedItems.length === 0 || hideGizmo || isModalGrab) {
    return null;
  }

  // Check if primary selected item is floor in marking mode
  const isFloorMarking = activeSelectedItems.some(
    (it) => it.type === "floor" && it.props?.markingMode
  );
  if (isFloorMarking) return null;

  if (transformMode === "select" || transformMode === "size") {
    return null;
  }

  return (
    <>
      <group
        key={`pivot_${selectedId || "none"}`}
        ref={setPivotCallback}
        name="__selection_gizmo_pivot"
        position={[initialCenter.x, initialCenter.y, initialCenter.z]}
      />
      {pivotNode && (
        <TransformControls
          key={`tc_${selectedId || "none"}_${transformMode}`}
          ref={controlsRef}
          object={pivotNode}
          mode={transformMode}
          translationSnap={snapToGrid ? gridSnapSize || 0.025 : null}
          rotationSnap={snapToGrid ? 0.05 : null}
          size={0.85}
          showX={!axisLock || axisLock === "x"}
          showY={!axisLock || axisLock === "z"}
          showZ={!axisLock || axisLock === "y"}
        />
      )}
    </>
  );
}
