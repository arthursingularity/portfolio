"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import PalletModel from "./models/PalletModel";
import FloorModel from "./models/FloorModel";
import BoxModel from "./models/BoxModel";
import DrawerGModel from "./models/DrawerGModel";
import WallModel from "./models/WallModel";
import BarModel from "./models/BarModel";
import CubeModel from "./models/CubeModel";
import JoinedModel from "./models/JoinedModel";
import UlmaMModel from "./models/UlmaMModel";
import UlmaPModel from "./models/UlmaPModel";
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
  onUpdateProps,
  selectedItems = [],
  allItems = [],
  targetRegistryRef,
  transformMode = "translate",
  axisLock = null,
  isModalGrab = false,
  snapToGrid = true,
  gridSnapSize = 0.025,
  orbitControlsRef,
  hideGizmo = false,
  justFinishedBoxDragRef,
  isTransforming = false,
  isTransformingRef = null,
  justFinishedTransformRef = null,
  onTransformStart,
  onTransformEnd,
}) {
  // Use state for target mesh so TransformControls re-renders immediately on mount
  const [target, setTarget] = useState(null);
  const [localHovered, setLocalHovered] = useState(false);
  const transformRef = useRef(null);

  const isHoverBlocked = Boolean(isTransforming) || Boolean(isModalGrab);

  const isHovered = !isHoverBlocked
    ? isHoveredProp !== undefined
      ? isHoveredProp
      : localHovered
    : false;



  const callbacksRef = useRef({
    onTransformStart,
    onTransformEnd,
    onUpdateTransform,
    onUpdateTransforms,
    onSelect,
  });

  useEffect(() => {
    callbacksRef.current = {
      onTransformStart,
      onTransformEnd,
      onUpdateTransform,
      onUpdateTransforms,
      onSelect,
    };
  }, [
    onTransformStart,
    onTransformEnd,
    onUpdateTransform,
    onUpdateTransforms,
    onSelect,
  ]);

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

  // Keep group position, rotation, and scale synced with state
  useEffect(() => {
    if (target) {
      target.position.set(...item.position);
      target.rotation.set(...item.rotation);
      if (item.scale) {
        target.scale.set(...item.scale);
      } else {
        target.scale.set(1, 1, 1);
      }
    }
  }, [item.position, item.rotation, item.scale, target]);

  const renderModel = () => {
    switch (item.type) {
      case "pallet":
        return (
          <PalletModel
            {...item.props}
            itemId={item.id}
            modelId={item.id}
            position={item.position}
          />
        );
      case "floor":
        return (
          <FloorModel
            {...item.props}
            itemId={item.id}
            onUpdateProps={onUpdateProps}
            orbitControlsRef={orbitControlsRef}
          />
        );
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
      case "drawer_g":
        return <DrawerGModel {...item.props} />;
      case "wall":
        return <WallModel {...item.props} />;
      case "bar":
        return <BarModel {...item.props} />;
      case "cube":
        return <CubeModel {...item.props} />;
      case "joined":
        return <JoinedModel {...item.props} />;
      case "ulma_m":
        return (
          <UlmaMModel
            {...item.props}
            itemId={item.id}
            modelId={item.id}
            position={item.position}
          />
        );
      case "ulma_p":
        return (
          <UlmaPModel
            {...item.props}
            itemId={item.id}
            modelId={item.id}
            position={item.position}
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
          if (
            document.activeElement?.tagName === "INPUT" ||
            document.activeElement?.tagName === "TEXTAREA"
          ) {
            document.activeElement.blur();
          }
          if (
            justFinishedTransformRef?.current ||
            isTransformingRef?.current ||
            isTransforming ||
            justFinishedBoxDragRef?.current ||
            isModalGrab
          ) {
            e.stopPropagation();
            return;
          }
          e.stopPropagation();
          onSelect(item.id, e.shiftKey || e.ctrlKey || e.metaKey);
        }}
        onPointerOver={(e) => {
          if (
            isHoverBlocked ||
            justFinishedBoxDragRef?.current
          ) {
            return;
          }
          if (!item.props?.markingMode) {
            e.stopPropagation();
            onPointerOverItem?.(item.id);
            setLocalHovered(true);
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          if (
            isHoverBlocked ||
            justFinishedBoxDragRef?.current
          ) {
            setLocalHovered(false);
            return;
          }
          if (!item.props?.markingMode) {
            onPointerOutItem?.(item.id);
            setLocalHovered(false);
            document.body.style.cursor = "default";
          }
        }}
      >
        {renderModel()}

        {/* 3D Blue Bounding Box Outline on Hover or when Selected (hides during floor marking mode) */}
        {(isHovered || isSelected) && target && !item.props?.markingMode && (
          <HoverBoundingBox
            target={target}
            item={item}
            itemProps={item.props}
            color="#38bdf8"
          />
        )}
      </group>
    </>
  );
}
