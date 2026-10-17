"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import RackModel from "./models/RackModel";
import PalletModel from "./models/PalletModel";
import CargoModel from "./models/CargoModel";
import FloorModel from "./models/FloorModel";
import ForkliftModel from "./models/ForkliftModel";
import ColumnModel from "./models/ColumnModel";
import BoxModel from "./models/BoxModel";
import HoverBoundingBox from "./HoverBoundingBox";

export default function EditableItem({
  item,
  isSelected,
  isPrimarySelected = false,
  isHovered: isHoveredProp,
  onPointerOverItem,
  onPointerOutItem,
  onSelect,
  onUpdateTransform,
  onUpdateTransforms,
  selectedItems = [],
  targetRegistryRef,
  transformMode = "translate",
  snapToGrid = true,
  gridSnapSize = 0.1,
  orbitControlsRef,
  hideGizmo = false,
}) {
  // Use state for target mesh so TransformControls re-renders immediately on mount
  const [target, setTarget] = useState(null);
  const [localHovered, setLocalHovered] = useState(false);
  const isHovered = isHoveredProp !== undefined ? isHoveredProp : localHovered;
  const transformRef = useRef(null);

  const setTargetCallback = useCallback(
    (node) => {
      if (node) {
        setTarget((prev) => (prev !== node ? node : prev));
        if (targetRegistryRef) {
          targetRegistryRef.current[item.id] = node;
        }
      } else if (targetRegistryRef) {
        delete targetRegistryRef.current[item.id];
      }
    },
    [item.id, targetRegistryRef]
  );

  // Fix Three.js TransformControls inverted cone bug when viewed from below/negative angles
  const fixGizmoCones = useCallback((controls) => {
    if (!controls) return false;
    const fwdMap = {};
    const bwdList = [];

    // Traverse the entire controls tree to find fwd and bwd meshes regardless of internal hierarchy
    controls.traverse((child) => {
      if (child.isMesh) {
        if (child.tag === "fwd") {
          fwdMap[child.name] = child;
        } else if (child.tag === "bwd") {
          bwdList.push(child);
        }
      }
    });

    if (bwdList.length === 0 || Object.keys(fwdMap).length === 0) {
      return false;
    }

    for (const bwdChild of bwdList) {
      const fwdChild = fwdMap[bwdChild.name];
      if (fwdChild && fwdChild.geometry) {
        // bwd was originally baked with a 180° rotation, but TransformControls also scales it by -1 along that axis.
        // Scaling by -1 along the length of an already-reversed cone inverts its geometry (making it funnel-shaped).
        // By replacing bwd's geometry with fwd's geometry, the -1 scale moves the cone into position with its tip pointing out correctly.
        bwdChild.geometry = fwdChild.geometry.clone();
      }
    }

    // Invert Y and Z colors to match Blender (Z = Blue vertical height, Y = Green horizontal depth)
    controls.traverse((child) => {
      if ((child.isMesh || child.isLine) && child.material && child.material.color) {
        if (child.name === "Y") {
          child.material = child.material.clone();
          child.material.color.set("#3b82f6"); // Blue for Vertical (Z in Blender)
        } else if (child.name === "Z") {
          child.material = child.material.clone();
          child.material.color.set("#52b536"); // Green for Depth (Y in Blender)
        }
      }
    });

    controls._conesFixed = true;
    return true;
  }, []);

  // useFrame ensures the cones are fixed immediately on the first render frame of the gizmo
  useFrame(() => {
    const controls = transformRef.current;
    if (controls && !controls._conesFixed) {
      fixGizmoCones(controls);
    }
  });

  const setTransformRef = useCallback(
    (node) => {
      transformRef.current = node;
      if (node) {
        node._conesFixed = false;
        fixGizmoCones(node);
      }
    },
    [fixGizmoCones]
  );

  // Sync OrbitControls enabled state during Transform drag and coordinate multi-object transform
  useEffect(() => {
    if (!transformRef.current) return;
    const controls = transformRef.current;
    controls._conesFixed = false;
    fixGizmoCones(controls);

    const dragStartData = {
      startPos: null,
      startRot: null,
      others: [],
    };

    const handleDraggingChanged = (event) => {
      if (orbitControlsRef?.current) {
        orbitControlsRef.current.enabled = !event.value;
      }
      if (event.value) {
        // Drag START: Capture snapshot of positions and rotations of all selected items
        if (target) {
          dragStartData.startPos = target.position.clone();
          dragStartData.startRot = target.rotation.clone();
          dragStartData.others = (selectedItems || [])
            .filter((it) => it.id !== item.id)
            .map((it) => {
              const node = targetRegistryRef?.current?.[it.id];
              return {
                id: it.id,
                node,
                initialPos: node
                  ? node.position.clone()
                  : new THREE.Vector3(...it.position),
                initialRot: node
                  ? node.rotation.clone()
                  : new THREE.Euler(...it.rotation),
              };
            });
        }
      } else {
        // Drag END: Save final positions and rotations of all selected items
        if (target && dragStartData.startPos) {
          const deltaPos = target.position.clone().sub(dragStartData.startPos);
          const deltaRotY = target.rotation.y - dragStartData.startRot.y;

          const updates = [
            {
              id: item.id,
              position: [
                Math.round(target.position.x * 100) / 100,
                Math.round(target.position.y * 100) / 100,
                Math.round(target.position.z * 100) / 100,
              ],
              rotation: [
                Math.round(target.rotation.x * 100) / 100,
                Math.round(target.rotation.y * 100) / 100,
                Math.round(target.rotation.z * 100) / 100,
              ],
            },
          ];

          dragStartData.others.forEach((other) => {
            const finalPos = other.node
              ? other.node.position
              : other.initialPos.clone().add(deltaPos);
            const finalRot = other.node ? other.node.rotation : other.initialRot;
            updates.push({
              id: other.id,
              position: [
                Math.round(finalPos.x * 100) / 100,
                Math.round(finalPos.y * 100) / 100,
                Math.round(finalPos.z * 100) / 100,
              ],
              rotation: [
                Math.round(finalRot.x * 100) / 100,
                Math.round(finalRot.y * 100) / 100,
                Math.round(finalRot.z * 100) / 100,
              ],
            });
          });

          if (onUpdateTransforms && updates.length > 1) {
            onUpdateTransforms(updates);
          } else {
            onUpdateTransform(item.id, updates[0]);
          }

          dragStartData.startPos = null;
          dragStartData.others = [];
        }
      }
    };

    const handleObjectChange = () => {
      if (!target || !dragStartData.startPos || dragStartData.others.length === 0)
        return;
      const deltaPos = target.position.clone().sub(dragStartData.startPos);
      const deltaRotY = target.rotation.y - dragStartData.startRot.y;

      dragStartData.others.forEach((other) => {
        if (!other.node) return;
        if (transformMode === "translate") {
          other.node.position.copy(other.initialPos).add(deltaPos);
        } else if (transformMode === "rotate") {
          // Rotate around the active item's starting position (Blender active element pivot)
          const offset = other.initialPos.clone().sub(dragStartData.startPos);
          offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), deltaRotY);
          other.node.position.copy(dragStartData.startPos).add(offset);
          other.node.rotation.y = other.initialRot.y + deltaRotY;
        }
      });
    };

    controls.addEventListener("dragging-changed", handleDraggingChanged);
    controls.addEventListener("objectChange", handleObjectChange);
    return () => {
      controls.removeEventListener("dragging-changed", handleDraggingChanged);
      controls.removeEventListener("objectChange", handleObjectChange);
    };
  }, [
    orbitControlsRef,
    item.id,
    target,
    fixGizmoCones,
    onUpdateTransform,
    onUpdateTransforms,
    selectedItems,
    targetRegistryRef,
    transformMode,
  ]);

  // Keep group position synced with state
  useEffect(() => {
    if (target) {
      target.position.set(...item.position);
      target.rotation.set(...item.rotation);
    }
  }, [item.position, item.rotation, target]);

  const renderModel = () => {
    switch (item.type) {
      case "rack":
        return <RackModel {...item.props} />;
      case "pallet":
        return <PalletModel {...item.props} />;
      case "cargo_red":
        return <CargoModel cargoType="red" {...item.props} />;
      case "cargo_gray":
        return <CargoModel cargoType="gray" {...item.props} />;
      case "floor":
        return <FloorModel {...item.props} />;
      case "forklift":
        return <ForkliftModel {...item.props} />;
      case "column":
        return <ColumnModel {...item.props} />;
      case "box":
        return (
          <BoxModel
            {...item.props}
            itemId={item.id}
            modelId={item.id}
            position={item.position}
            name={item.name}
          />
        );
      default:
        return null;
    }
  };

  if (item.hidden) return null;

  return (
    <>
      <group
        ref={setTargetCallback}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item.id, e.shiftKey || e.ctrlKey || e.metaKey);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOverItem?.(item.id);
          setLocalHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          onPointerOutItem?.(item.id);
          setLocalHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        {renderModel()}

        {/* 3D Blue Bounding Box Outline on Hover or when Selected */}
        {(isHovered || isSelected) && target && (
          <HoverBoundingBox
            target={target}
            itemProps={item.props}
            color="#38bdf8"
          />
        )}

        {/* Selection Indicator Ring (raycast disabled so it never interferes with hover) */}
        {isSelected && (
          <mesh
            name="__helper_selection_ring"
            userData={{ isHelper: true }}
            position={[0, 0.02, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            raycast={() => null}
          >
            <ringGeometry args={[0.7, 0.74, 32]} />
            <meshBasicMaterial color="#3b82f6" depthTest={false} transparent opacity={0.8} />
          </mesh>
        )}
      </group>

      {/* 3D Transform Gizmo for primary active item - mounts immediately when selected, hides during modal G move */}
      {isSelected && isPrimarySelected && target && !hideGizmo && (
        <TransformControls
          ref={setTransformRef}
          object={target}
          mode={transformMode}
          translationSnap={snapToGrid ? (gridSnapSize || 0.1) : null}
          rotationSnap={snapToGrid ? 0.1 : null}
          size={0.85}
        />
      )}
    </>
  );
}
