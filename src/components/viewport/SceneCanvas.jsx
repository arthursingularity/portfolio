"use client";

import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import BlenderGrid from "./BlenderGrid";
import EditableItem from "./EditableItem";

/**
 * Helper component inside Canvas to keep camera, viewport size, and renderer live
 */
function CameraProjector({ projectorRef }) {
  const { camera, size, gl } = useThree();
  projectorRef.current = { camera, size, gl };
  return null;
}

/**
 * Calculates which 3D items fall inside or intersect the 2D screen selection box
 */
function getItemsInRect(rect, camera, size, items, targetRegistryRef) {
  if (!camera || !size || !rect || !items) return [];
  const minX = rect.left;
  const maxX = rect.left + rect.width;
  const minY = rect.top;
  const maxY = rect.top + rect.height;

  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();

  const matchedIds = [];

  items.forEach((item) => {
    // Floor is ignored during box drag to avoid selecting the entire warehouse room
    if (item.hidden || item.type === "floor") return;

    const node = targetRegistryRef?.current?.[item.id];
    let corners = [];

    if (node) {
      const box3 = new THREE.Box3().setFromObject(node);
      if (!box3.isEmpty()) {
        corners = [
          new THREE.Vector3(box3.min.x, box3.min.y, box3.min.z),
          new THREE.Vector3(box3.min.x, box3.min.y, box3.max.z),
          new THREE.Vector3(box3.min.x, box3.max.y, box3.min.z),
          new THREE.Vector3(box3.min.x, box3.max.y, box3.max.z),
          new THREE.Vector3(box3.max.x, box3.min.y, box3.min.z),
          new THREE.Vector3(box3.max.x, box3.min.y, box3.max.z),
          new THREE.Vector3(box3.max.x, box3.max.y, box3.min.z),
          new THREE.Vector3(box3.max.x, box3.max.y, box3.max.z),
          box3.getCenter(new THREE.Vector3()),
        ];
      }
    }

    if (corners.length === 0) {
      const px = item.position[0];
      const py = item.position[1];
      const pz = item.position[2];
      corners = [
        new THREE.Vector3(px - 0.35, py, pz - 0.35),
        new THREE.Vector3(px + 0.35, py, pz + 0.35),
        new THREE.Vector3(px - 0.35, py + 0.8, pz - 0.35),
        new THREE.Vector3(px + 0.35, py + 0.8, pz + 0.35),
        new THREE.Vector3(px, py + 0.4, pz),
      ];
    }

    let minScreenX = Infinity;
    let maxScreenX = -Infinity;
    let minScreenY = Infinity;
    let maxScreenY = -Infinity;
    let anyInFront = false;

    corners.forEach((pt) => {
      const p = pt.clone().project(camera);
      if (p.z < 1) {
        anyInFront = true;
      }
      const sx = ((p.x + 1) * size.width) / 2;
      const sy = ((-p.y + 1) * size.height) / 2;

      minScreenX = Math.min(minScreenX, sx);
      maxScreenX = Math.max(maxScreenX, sx);
      minScreenY = Math.min(minScreenY, sy);
      maxScreenY = Math.max(maxScreenY, sy);
    });

    if (anyInFront) {
      const overlaps =
        minX <= maxScreenX &&
        maxX >= minScreenX &&
        minY <= maxScreenY &&
        maxY >= minScreenY;

      if (overlaps) {
        matchedIds.push(item.id);
      }
    }
  });

  return matchedIds;
}

/**
 * 3D Viewport Scene Canvas with Interactive Sector Items & Blender Navigation
 */
export default function SceneCanvas({
  cellSize = 1,
  sectionSize = 5,
  gridVisible = true,
  items = [],
  selectedId = null,
  selectedIds = [],
  setSelectedIds,
  selectedItems = [],
  onSelect = () => { },
  onUpdateTransform = () => { },
  onUpdateTransforms = () => { },
  transformMode = "translate",
  axisLock = null,
  snapToGrid = true,
  onUpdateProps,
  controlsRef,
  exportGroupRef,
}) {
  const containerRef = useRef(null);
  const localControlsRef = useRef(null);
  const activeControls = controlsRef || localControlsRef;
  const localExportRef = useRef(null);
  const activeExportRef = exportGroupRef || localExportRef;
  const targetRegistryRef = useRef({});
  const projectorRef = useRef(null);
  const dragStateRef = useRef(null);
  const justFinishedBoxDragRef = useRef(false);

  const [selectionRect, setSelectionRect] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const selectedItem = items.find((it) => it.id === selectedId);
  const activeSelectedIds =
    selectedIds && selectedIds.length > 0
      ? selectedIds
      : selectedId
        ? [selectedId]
        : [];
  const activeSelectedItems =
    selectedItems && selectedItems.length > 0
      ? selectedItems
      : selectedItem
        ? [selectedItem]
        : [];

  const isFloorMarkingActive = Boolean(
    selectedItem?.type === "floor" && selectedItem?.props?.markingMode
  );

  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Only LMB
    if (transformMode !== "select" || isFloorMarkingActive) return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    dragStateRef.current = {
      startX,
      startY,
      isDragging: false,
      shiftKey: e.shiftKey || e.ctrlKey || e.metaKey,
      initialSelectedIds: activeSelectedIds || [],
    };
  };

  const handlePointerMove = (e) => {
    if (!dragStateRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    const dx = curX - dragStateRef.current.startX;
    const dy = curY - dragStateRef.current.startY;
    const dist = Math.hypot(dx, dy);

    if (dist >= 4) {
      dragStateRef.current.isDragging = true;
      justFinishedBoxDragRef.current = true;

      const left = Math.min(dragStateRef.current.startX, curX);
      const top = Math.min(dragStateRef.current.startY, curY);
      const width = Math.abs(dx);
      const height = Math.abs(dy);

      const boxRect = { left, top, width, height };
      setSelectionRect(boxRect);

      if (projectorRef.current?.camera && projectorRef.current?.size) {
        const matched = getItemsInRect(
          boxRect,
          projectorRef.current.camera,
          projectorRef.current.size,
          items,
          targetRegistryRef
        );

        let nextIds = matched;
        if (dragStateRef.current.shiftKey) {
          nextIds = Array.from(
            new Set([...dragStateRef.current.initialSelectedIds, ...matched])
          );
        }

        if (setSelectedIds) {
          setSelectedIds(nextIds);
        } else if (onSelect) {
          if (nextIds.length === 1) onSelect(nextIds[0]);
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (!dragStateRef.current) return;

    const wasDragging = dragStateRef.current.isDragging;
    const shiftKey = dragStateRef.current.shiftKey;
    const initialIds = dragStateRef.current.initialSelectedIds;

    if (
      wasDragging &&
      selectionRect &&
      projectorRef.current?.camera &&
      projectorRef.current?.size
    ) {
      const matched = getItemsInRect(
        selectionRect,
        projectorRef.current.camera,
        projectorRef.current.size,
        items,
        targetRegistryRef
      );

      let nextIds = matched;
      if (shiftKey) {
        nextIds = Array.from(new Set([...initialIds, ...matched]));
      }

      if (setSelectedIds) {
        setSelectedIds(nextIds);
      } else if (onSelect) {
        onSelect(nextIds[nextIds.length - 1] || null);
      }
    }

    dragStateRef.current = null;
    setSelectionRect(null);

    if (wasDragging) {
      setTimeout(() => {
        justFinishedBoxDragRef.current = false;
      }, 100);
    } else {
      justFinishedBoxDragRef.current = false;
    }
  };

  useEffect(() => {
    const onWindowPointerUp = () => {
      if (dragStateRef.current) {
        handlePointerUp();
      }
    };
    window.addEventListener("pointerup", onWindowPointerUp);
    return () => window.removeEventListener("pointerup", onWindowPointerUp);
  }, [selectionRect, items]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none overflow-hidden ${
        transformMode === "select" ? "cursor-crosshair" : ""
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => {
        handlePointerUp();
        setHoveredId(null);
      }}
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, #46464a 0%, #38383c 60%, #2e2e32 100%)",
      }}
    >
      {/* Visual Box Selection Rect (matches desktop marquee box) */}
      {selectionRect && (
        <div
          className="absolute pointer-events-none z-30 border border-[#0078d7] bg-[#0078d7]/20 rounded-[1px]"
          style={{
            left: selectionRect.left,
            top: selectionRect.top,
            width: selectionRect.width,
            height: selectionRect.height,
          }}
        />
      )}

      {/* Indicador de Trava de Eixo Ativo para Mover */}
      {axisLock && transformMode === "translate" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none flex items-center gap-2.5 bg-[#18181b]/95 border border-white/15 px-4 py-1.5 rounded-full shadow-2xl backdrop-blur text-xs font-mono text-white">
          <span
            className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${
              axisLock === "x"
                ? "bg-red-400"
                : axisLock === "y"
                ? "bg-green-400"
                : "bg-blue-400"
            }`}
          />
          <span className="font-semibold">
            {axisLock === "x" && (
              <span className="text-[#f87171]">Mover [Eixo X - Vermelho]</span>
            )}
            {axisLock === "y" && (
              <span className="text-[#4ade80]">
                Mover [Eixo Y - Verde / Profundidade]
              </span>
            )}
            {axisLock === "z" && (
              <span className="text-[#60a5fa]">
                Mover [Eixo Z - Azul / Altura]
              </span>
            )}
          </span>
          <span className="text-white/30">•</span>
          <span className="text-white/60 text-[11px]">
            Arraste a seta ou use as setas do teclado | Pressione {axisLock.toUpperCase()} ou Esc para liberar
          </span>
        </div>
      )}

      <Canvas
        shadows={false}
        dpr={[1, 1.5]}
        camera={{
          position: [12, 10, 14],
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: true,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = false;
        }}
        className="w-full h-full"
        onPointerMissed={() => {
          if (justFinishedBoxDragRef.current) return;
          if (selectedItem?.type === "floor" && selectedItem?.props?.markingMode) {
            onUpdateProps?.(selectedItem.id, { markingMode: false });
          }
          if (setSelectedIds) {
            setSelectedIds([]);
          } else {
            onSelect(null);
          }
          setHoveredId(null);
        }}
      >
        <CameraProjector projectorRef={projectorRef} />

        {/* Balanced Industrial Studio Lighting for High-Performance CAD */}
        <ambientLight intensity={0.78} />
        <directionalLight
          position={[14, 28, 12]}
          intensity={0.88}
        />
        <directionalLight
          position={[-18, 18, -18]}
          intensity={0.42}
          color="#dbeafe"
        />
        <directionalLight
          position={[-5, 16, 20]}
          intensity={0.30}
          color="#fef3c7"
        />

        {/* Blender Ground Grid */}
        {gridVisible && (
          <BlenderGrid
            cellSize={cellSize}
            sectionSize={sectionSize}
            fadeDistance={120}
          />
        )}

        {/* Dynamic Sector Items (Racks, Pallets, Floor, Cargo, Forklift, Gaveta G, etc.) */}
        <group ref={activeExportRef} name="SetorPrincipal">
          {items.map((item) => (
            <EditableItem
              key={item.id}
              item={item}
              isSelected={activeSelectedIds.includes(item.id)}
              isPrimarySelected={item.id === selectedId}
              isHovered={item.id === hoveredId}
              onPointerOverItem={(id) => setHoveredId(id)}
              onPointerOutItem={(id) =>
                setHoveredId((cur) => (cur === id ? null : cur))
              }
              onSelect={(newId, isMulti) => {
                if (justFinishedBoxDragRef.current) return;
                if (
                  newId !== selectedId &&
                  selectedItem?.type === "floor" &&
                  selectedItem?.props?.markingMode
                ) {
                  onUpdateProps?.(selectedItem.id, { markingMode: false });
                }
                onSelect(newId, isMulti);
              }}
              onUpdateTransform={onUpdateTransform}
              onUpdateTransforms={onUpdateTransforms}
              onUpdateProps={onUpdateProps}
              selectedItems={activeSelectedItems}
              allItems={items}
              targetRegistryRef={targetRegistryRef}
              transformMode={transformMode}
              axisLock={axisLock}
              snapToGrid={snapToGrid}
              gridSnapSize={0.05}
              orbitControlsRef={activeControls}
              hideGizmo={false}
              justFinishedBoxDragRef={justFinishedBoxDragRef}
            />
          ))}
        </group>

        {/* Orbit Controls (LMB = Rotate when not in select mode, RMB = Pan, MMB = Rotate) */}
        <OrbitControls
          ref={activeControls}
          makeDefault
          enableDamping
          dampingFactor={0.06}
          screenSpacePanning
          minDistance={1.2}
          maxDistance={250}
          target={[0, 1.2, 0]}
          mouseButtons={{
            LEFT: isFloorMarkingActive || transformMode === "select" ? -1 : 0,
            MIDDLE: 0,
            RIGHT: 2,
          }}
        />

        {/* Blender Orientation Gizmo (Top-Right of 3D Viewport) */}
        <GizmoHelper alignment="top-right" margin={[65, 75]}>
          <GizmoViewport
            axisColors={["#e03535", "#3b82f6", "#52b536"]}
            labels={["X", "Z", "Y"]}
            labelColor="#ffffff"
          />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}
