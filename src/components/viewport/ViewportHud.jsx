"use client";

import React from "react";

export default function ViewportHud({
  cellSize,
  setCellSize,
  gridVisible,
  setGridVisible,
  onResetCamera,
  onSetCameraView,
}) {
  return (
    <>
      {/* Blender-style Top-Left Viewport Header */}
      <div className="hidden absolute top-4 left-4 z-10 pointer-events-none select-none flex flex-col gap-1 ">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-white/90 tracking-tight drop-shadow">
            User Perspective
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-black/30 border border-white/10 text-white/60 font-mono">
            Setor 3D
          </span>
        </div>
        <div className="text-[11px] font-mono text-white/50 flex items-center gap-2">
          <span>Grid: {cellSize}m</span>
          <span>•</span>
          <span>Origem: (0, 0, 0)</span>
        </div>
      </div>

      {/* Subtle Blender Bottom Status Bar */}
      <div className="absolute bottom-2 left-4 z-10 pointer-events-none font-mono select-none flex items-center gap-4 text-[12px]">
        <span className="hidden sm:inline text-white/50">
          Shift+A: Adicionar | Mover(G) | Girar(R) | Ctrl+Z: Desfazer | Ctrl+C / Ctrl+V: Copiar/Colar
        </span>
      </div>
    </>
  );
}
