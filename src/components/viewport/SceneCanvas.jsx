"use client";

import React, { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import BlenderGrid from "./BlenderGrid";
import EditableItem from "./EditableItem";
import BlenderModalTransform from "./BlenderModalTransform";

/**
 * 3D Viewport Scene Canvas with Interactive Sector Items & Blender Navigation
 */
export default function SceneCanvas({
  cellSize = 1,
  sectionSize = 5,
  gridVisible = true,
  items = [],
  selectedId = null,
  onSelect = () => {},
  onUpdateTransform = () => {},
  transformMode = "translate",
  snapToGrid = true,
  controlsRef,
  exportGroupRef,
}) {
  const localControlsRef = useRef(null);
  const activeControls = controlsRef || localControlsRef;
  const localExportRef = useRef(null);
  const activeExportRef = exportGroupRef || localExportRef;

  const [modalActive, setModalActive] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);

  const selectedItem = items.find((it) => it.id === selectedId);

  return (
    <div
      className="relative w-full h-full select-none overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, #46464a 0%, #38383c 60%, #2e2e32 100%)",
      }}
    >
      {/* Blender-style Modal Transform Status Badge */}
      {modalInfo && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none flex items-center gap-2.5 bg-[#18181b]/95 border border-white/15 px-4 py-1.5 rounded-full shadow-2xl backdrop-blur text-xs font-mono text-white">
          <span className="w-2 h-2 rounded-full animate-pulse bg-emerald-400 shrink-0" />
          <span className="font-semibold">
            {modalInfo.axisLock === "x" && (
              <span className="text-[#f87171]">Mover [Eixo X]: ΔX = {modalInfo.delta.dx}m</span>
            )}
            {modalInfo.axisLock === "y" && (
              <span className="text-[#4ade80]">Mover [Eixo Y / Altura]: ΔY = {modalInfo.delta.dy}m</span>
            )}
            {modalInfo.axisLock === "z" && (
              <span className="text-[#60a5fa]">Mover [Eixo Z / Profundidade]: ΔZ = {modalInfo.delta.dz}m</span>
            )}
            {!modalInfo.axisLock && (
              <span className="text-neutral-200">
                Mover [Livre]: ({modalInfo.delta.dx}m, {modalInfo.delta.dz}m)
              </span>
            )}
          </span>
          <span className="text-white/30">•</span>
          <span className="text-white/60 text-[11px]">
            [X, Y, Z] Travar eixo | Clique Esq: Confirmar | Esc / Botão Dir: Cancelar
          </span>
        </div>
      )}

      <Canvas
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
        className="w-full h-full"
        onPointerMissed={() => onSelect(null)}
      >
        {/* Balanced Industrial Lighting sem sombras */}
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[25, 40, 25]}
          intensity={0.9}
        />
        <directionalLight
          position={[-25, 20, -25]}
          intensity={0.4}
          color="#dbeafe"
        />
        <directionalLight
          position={[0, 20, -35]}
          intensity={0.3}
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

        {/* Dynamic Sector Items (Racks, Pallets, Floor, Cargo, Forklift) */}
        <group ref={activeExportRef} name="SetorPrincipal">
          {items.map((item) => (
            <EditableItem
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
              onSelect={onSelect}
              onUpdateTransform={onUpdateTransform}
              transformMode={transformMode}
              snapToGrid={snapToGrid}
              gridSnapSize={0.1}
              orbitControlsRef={activeControls}
              hideGizmo={modalActive}
            />
          ))}
        </group>

        {/* Blender Modal Move (G + Axis X/Y/Z + Mouse Move) */}
        <BlenderModalTransform
          selectedItem={selectedItem}
          onUpdateTransform={onUpdateTransform}
          snapToGrid={snapToGrid}
          gridSnapSize={0.1}
          orbitControlsRef={activeControls}
          onModalActiveChange={setModalActive}
          onModalInfoChange={setModalInfo}
        />

        {/* Orbit Controls (LMB = Rotate, RMB = Pan) */}
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
            LEFT: 0, // Botão esquerdo do mouse rotaciona a visão do cenário 3D
            MIDDLE: 0, // MMB também rotaciona
            RIGHT: 2, // Botão direito para pan
          }}
        />

        {/* Blender Orientation Gizmo (Top-Right of 3D Viewport) */}
        <GizmoHelper alignment="top-right" margin={[65, 65]}>
          <GizmoViewport
            axisColors={["#e03535", "#3b82f6", "#52b536"]}
            labelColor="#ffffff"
          />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}
