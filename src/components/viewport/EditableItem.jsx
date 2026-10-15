"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { TransformControls } from "@react-three/drei";
import RackModel from "./models/RackModel";
import PalletModel from "./models/PalletModel";
import CargoModel from "./models/CargoModel";
import FloorModel from "./models/FloorModel";
import ForkliftModel from "./models/ForkliftModel";
import ColumnModel from "./models/ColumnModel";
import RailModel from "./models/RailModel";
import HoverBoundingBox from "./HoverBoundingBox";

export default function EditableItem({
  item,
  isSelected,
  onSelect,
  onUpdateTransform,
  transformMode = "translate",
  snapToGrid = true,
  gridSnapSize = 0.1,
  orbitControlsRef,
  hideGizmo = false,
}) {
  // Use state for target mesh so TransformControls re-renders immediately on mount
  const [target, setTarget] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const transformRef = useRef(null);

  const setTargetCallback = useCallback((node) => {
    if (node) {
      setTarget((prev) => (prev !== node ? node : prev));
    }
  }, []);

  // Sync OrbitControls enabled state during Transform drag
  useEffect(() => {
    if (!transformRef.current) return;
    const controls = transformRef.current;

    const handleDraggingChanged = (event) => {
      if (orbitControlsRef?.current) {
        orbitControlsRef.current.enabled = !event.value;
      }
      // When dragging finishes, persist final position & rotation to state
      if (!event.value && target) {
        const pos = target.position;
        const rot = target.rotation;
        onUpdateTransform(item.id, {
          position: [
            Math.round(pos.x * 100) / 100,
            Math.round(pos.y * 100) / 100,
            Math.round(pos.z * 100) / 100,
          ],
          rotation: [
            Math.round(rot.x * 100) / 100,
            Math.round(rot.y * 100) / 100,
            Math.round(rot.z * 100) / 100,
          ],
        });
      }
    };

    controls.addEventListener("dragging-changed", handleDraggingChanged);
    return () => {
      controls.removeEventListener("dragging-changed", handleDraggingChanged);
    };
  }, [orbitControlsRef, item.id, onUpdateTransform, target, isSelected]);

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
      case "rail":
        return <RailModel {...item.props} />;
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
          onSelect(item.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setIsHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        {renderModel()}

        {/* 3D Blue Bounding Box Outline on Hover */}
        {isHovered && target && (
          <HoverBoundingBox
            target={target}
            itemProps={item.props}
            color="#38bdf8"
          />
        )}

        {/* Selection Indicator Ring */}
        {isSelected && (
          <mesh
            name="__helper_selection_ring"
            userData={{ isHelper: true }}
            position={[0, 0.02, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.7, 0.74, 32]} />
            <meshBasicMaterial color="#3b82f6" depthTest={false} transparent opacity={0.8} />
          </mesh>
        )}
      </group>

      {/* 3D Transform Gizmo for active item - mounts immediately when selected, hides during modal G move */}
      {isSelected && target && !hideGizmo && (
        <TransformControls
          ref={transformRef}
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
