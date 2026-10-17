"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

/**
 * TransformPopup - Manipulador Fixo de Posição e Rotação
 * Exibido no canto inferior direito do Cenário 3D sempre que 1 ou mais modelos estiverem selecionados.
 * Suporta seleção única e múltipla de modelos de forma sincronizada.
 */
export default function TransformPopup({
  selectedItem,
  selectedItems = [],
  onUpdateTransform,
  onUpdateTransforms,
}) {
  const activeItems =
    selectedItems && selectedItems.length > 0
      ? selectedItems
      : selectedItem
      ? [selectedItem]
      : [];

  const primaryItem = selectedItem || activeItems[0] || null;
  const isMulti = activeItems.length > 1;

  // Local input state for smooth typing without race conditions
  const [posX, setPosX] = useState("");
  const [posY, setPosY] = useState("");
  const [posZ, setPosZ] = useState("");
  const [rotY, setRotY] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  // Sync inputs from primaryItem when not actively focused
  useEffect(() => {
    if (!primaryItem) return;

    if (focusedField !== "x") {
      setPosX(String(primaryItem.position ? primaryItem.position[0] : 0));
    }
    // Three.js mappings:
    // X = pos[0], Y = pos[2] (floor depth), Z = pos[1] (vertical height)
    if (focusedField !== "y") {
      setPosY(String(primaryItem.position ? primaryItem.position[2] : 0));
    }
    if (focusedField !== "z") {
      setPosZ(String(primaryItem.position ? primaryItem.position[1] : 0));
    }
    if (focusedField !== "rot") {
      const radY = primaryItem.rotation ? primaryItem.rotation[1] : 0;
      let deg = Math.round((radY * 180) / Math.PI);
      deg = ((deg % 360) + 360) % 360;
      setRotY(String(deg));
    }
  }, [
    primaryItem?.id,
    primaryItem?.position?.[0],
    primaryItem?.position?.[1],
    primaryItem?.position?.[2],
    primaryItem?.rotation?.[1],
    focusedField,
  ]);

  if (!primaryItem) return null;

  // Handle position change (X, Y, Z)
  const applyPosition = (axisKey, newNum) => {
    if (isNaN(newNum)) return;
    const rounded = Math.round(newNum * 100) / 100;
    // axisKey: 'x' -> 0, 'y' -> 2 (profundidade chão), 'z' -> 1 (altura vertical)
    const axisIdx = axisKey === "x" ? 0 : axisKey === "y" ? 2 : 1;
    const currentVal = primaryItem.position ? primaryItem.position[axisIdx] : 0;
    const delta = rounded - currentVal;

    if (isMulti) {
      const updates = activeItems.map((it) => {
        const p = [...(it.position || [0, 0, 0])];
        p[axisIdx] = Math.round((p[axisIdx] + delta) * 100) / 100;
        return { id: it.id, position: p };
      });
      onUpdateTransforms(updates);
    } else {
      const p = [...(primaryItem.position || [0, 0, 0])];
      p[axisIdx] = rounded;
      onUpdateTransform(primaryItem.id, { position: p });
    }
  };

  // Quick Rotate by degrees (+90, -90, or any delta)
  const rotateBy = (deltaDeg) => {
    const deltaRad = (deltaDeg * Math.PI) / 180;
    if (isMulti) {
      const updates = activeItems.map((it) => {
        const curRot = it.rotation || [0, 0, 0];
        const newY =
          Math.round(
            ((((curRot[1] + deltaRad) % (Math.PI * 2)) + Math.PI * 2) %
              (Math.PI * 2)) *
              100
          ) / 100;
        return {
          id: it.id,
          rotation: [curRot[0] || 0, newY, curRot[2] || 0],
        };
      });
      onUpdateTransforms(updates);
    } else {
      const curRot = primaryItem.rotation || [0, 0, 0];
      const newY =
        Math.round(
          ((((curRot[1] + deltaRad) % (Math.PI * 2)) + Math.PI * 2) %
            (Math.PI * 2)) *
            100
        ) / 100;
      onUpdateTransform(primaryItem.id, {
        rotation: [curRot[0] || 0, newY, curRot[2] || 0],
      });
    }
  };

  // Direct degree angle change
  const applyRotationDeg = (newDegVal) => {
    const targetDeg = parseFloat(newDegVal);
    if (isNaN(targetDeg)) return;
    const targetRad = (targetDeg * Math.PI) / 180;
    const curRad = primaryItem.rotation ? primaryItem.rotation[1] : 0;
    const deltaRad = targetRad - curRad;

    if (isMulti) {
      const updates = activeItems.map((it) => {
        const curRot = it.rotation || [0, 0, 0];
        const newY =
          Math.round(
            ((((curRot[1] + deltaRad) % (Math.PI * 2)) + Math.PI * 2) %
              (Math.PI * 2)) *
              100
          ) / 100;
        return {
          id: it.id,
          rotation: [curRot[0] || 0, newY, curRot[2] || 0],
        };
      });
      onUpdateTransforms(updates);
    } else {
      const curRot = primaryItem.rotation || [0, 0, 0];
      const newY =
        Math.round(
          ((((targetRad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) *
            100) /
            100
        );
      onUpdateTransform(primaryItem.id, {
        rotation: [curRot[0] || 0, newY, curRot[2] || 0],
      });
    }
  };

  // Snap to ground (Z / Altura = 0)
  const snapToGround = () => {
    if (isMulti) {
      const updates = activeItems.map((it) => {
        const p = [...(it.position || [0, 0, 0])];
        p[1] = 0; // vertical height = 0
        return { id: it.id, position: p };
      });
      onUpdateTransforms(updates);
    } else {
      const p = [...(primaryItem.position || [0, 0, 0])];
      p[1] = 0;
      onUpdateTransform(primaryItem.id, { position: p });
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-3 right-3 z-30 select-none bg-[#121215]/95 backdrop-blur-md border border-white/[0.08] shadow-2xl rounded-lg p-2.5 flex flex-col gap-2 min-w-[240px] max-w-[280px]"
    >
      {/* Header do Widget */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          <span
            className="text-[11px] font-semibold text-white/90 truncate"
            title={primaryItem.name}
          >
            {isMulti
              ? `${activeItems.length} objetos selecionados`
              : primaryItem.name}
          </span>
        </div>
        <span
          className="text-[10px] font-mono text-white/30 px-1 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]"
          title="Atalhos: G (Mover), R (Girar)"
        >
          G / R
        </span>
      </div>

      {/* Seção 1: Posição (Metros) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
            Posição (Metros)
          </span>
          <button
            type="button"
            onClick={snapToGround}
            title="Apoiar modelo no chão (Z = 0)"
            className="flex items-center gap-1 text-[10px] font-mono text-white/50 hover:text-white px-1.5 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
          >
            <Icon icon="lucide:arrow-down-to-line" className="text-[10px]" />
            Chão
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 font-mono">
          {/* Eixo X */}
          <div className="flex items-center bg-[#0a0a0c] border border-white/[0.08] focus-within:border-red-500/50 rounded px-1.5 py-1 text-[11px] transition-colors">
            <span className="text-[10px] font-bold mr-1 text-red-400 select-none">
              X
            </span>
            <input
              type="number"
              step="0.1"
              value={posX}
              onFocus={() => setFocusedField("x")}
              onChange={(e) => {
                setPosX(e.target.value);
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) applyPosition("x", val);
              }}
              onBlur={() => {
                setFocusedField(null);
                const val = parseFloat(posX);
                if (!isNaN(val)) applyPosition("x", val);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-full bg-transparent text-white outline-none text-right font-mono"
            />
          </div>

          {/* Eixo Y (Profundidade chão) */}
          <div className="flex items-center bg-[#0a0a0c] border border-white/[0.08] focus-within:border-emerald-500/50 rounded px-1.5 py-1 text-[11px] transition-colors">
            <span className="text-[10px] font-bold mr-1 text-emerald-400 select-none">
              Y
            </span>
            <input
              type="number"
              step="0.1"
              value={posY}
              onFocus={() => setFocusedField("y")}
              onChange={(e) => {
                setPosY(e.target.value);
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) applyPosition("y", val);
              }}
              onBlur={() => {
                setFocusedField(null);
                const val = parseFloat(posY);
                if (!isNaN(val)) applyPosition("y", val);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-full bg-transparent text-white outline-none text-right font-mono"
            />
          </div>

          {/* Eixo Z (Altura vertical) */}
          <div className="flex items-center bg-[#0a0a0c] border border-white/[0.08] focus-within:border-blue-500/50 rounded px-1.5 py-1 text-[11px] transition-colors">
            <span className="text-[10px] font-bold mr-1 text-blue-400 select-none">
              Z
            </span>
            <input
              type="number"
              step="0.1"
              value={posZ}
              onFocus={() => setFocusedField("z")}
              onChange={(e) => {
                setPosZ(e.target.value);
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) applyPosition("z", val);
              }}
              onBlur={() => {
                setFocusedField(null);
                const val = parseFloat(posZ);
                if (!isNaN(val)) applyPosition("z", val);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-full bg-transparent text-white outline-none text-right font-mono"
            />
          </div>
        </div>
      </div>

      {/* Seção 2: Rotação (Graus) */}
      <div className="flex flex-col gap-1 pt-1 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
            Rotação (Graus)
          </span>
          <button
            type="button"
            onClick={() => {
              applyRotationDeg(0);
              setRotY("0");
            }}
            title="Resetar rotação para 0°"
            className="text-[10px] font-mono text-white/40 hover:text-white px-1 rounded hover:bg-white/[0.04]"
          >
            0°
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Girar -90° */}
          <button
            type="button"
            onClick={() => rotateBy(-90)}
            title="Girar -90°"
            className="flex-1 py-1 rounded bg-[#0a0a0c] hover:bg-white/[0.08] border border-white/[0.08] text-[10px] font-mono text-white/70 hover:text-white flex items-center justify-center gap-1 transition-colors"
          >
            <Icon icon="lucide:rotate-ccw" className="text-[10px]" />
            -90°
          </button>

          {/* Campo Numérico de Graus */}
          <div className="flex-[1.2] flex items-center bg-[#0a0a0c] border border-white/[0.08] focus-within:border-white/25 rounded px-1.5 py-1 text-[11px] font-mono transition-colors">
            <input
              type="number"
              step="15"
              value={rotY}
              onFocus={() => setFocusedField("rot")}
              onChange={(e) => {
                setRotY(e.target.value);
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) applyRotationDeg(val);
              }}
              onBlur={() => {
                setFocusedField(null);
                const val = parseFloat(rotY);
                if (!isNaN(val)) applyRotationDeg(val);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-full bg-transparent text-white outline-none text-center font-mono"
            />
            <span className="text-white/30 text-[10px] select-none">°</span>
          </div>

          {/* Girar +90° */}
          <button
            type="button"
            onClick={() => rotateBy(90)}
            title="Girar +90°"
            className="flex-1 py-1 rounded bg-[#0a0a0c] hover:bg-white/[0.08] border border-white/[0.08] text-[10px] font-mono text-white/70 hover:text-white flex items-center justify-center gap-1 transition-colors"
          >
            +90°
            <Icon icon="lucide:rotate-cw" className="text-[10px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
