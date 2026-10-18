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
  className = "",
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
      // Calculate group median center pivot (average of X and Z positions)
      let sumX = 0;
      let sumZ = 0;
      let validCount = 0;
      activeItems.forEach((it) => {
        if (it.position && it.position.length >= 3) {
          sumX += it.position[0];
          sumZ += it.position[2];
          validCount++;
        }
      });
      const cx = validCount > 0 ? sumX / validCount : 0;
      const cz = validCount > 0 ? sumZ / validCount : 0;

      const cos = Math.cos(deltaRad);
      const sin = Math.sin(deltaRad);

      const updates = activeItems.map((it) => {
        const curPos = it.position || [0, 0, 0];
        const curRot = it.rotation || [0, 0, 0];

        // Orbit around the center pivot (cx, cz)
        const dx = (curPos[0] ?? 0) - cx;
        const dz = (curPos[2] ?? 0) - cz;

        const rotX = dx * cos + dz * sin;
        const rotZ = -dx * sin + dz * cos;

        const newX = Math.round((cx + rotX) * 10000) / 10000;
        const newZ = Math.round((cz + rotZ) * 10000) / 10000;
        const newY = curPos[1] ?? 0;

        // Rotate individual orientation
        let newRotY = (curRot[1] + deltaRad) % (Math.PI * 2);
        if (newRotY < 0) newRotY += Math.PI * 2;
        newRotY = Math.round(newRotY * 10000) / 10000;

        return {
          id: it.id,
          position: [newX, newY, newZ],
          rotation: [curRot[0] || 0, newRotY, curRot[2] || 0],
        };
      });

      onUpdateTransforms(updates);
    } else {
      const curRot = primaryItem.rotation || [0, 0, 0];
      let newY = (curRot[1] + deltaRad) % (Math.PI * 2);
      if (newY < 0) newY += Math.PI * 2;
      newY = Math.round(newY * 10000) / 10000;
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

    if (Math.abs(deltaRad) < 1e-6) return;

    if (isMulti) {
      // Calculate group median center pivot (average of X and Z positions)
      let sumX = 0;
      let sumZ = 0;
      let validCount = 0;
      activeItems.forEach((it) => {
        if (it.position && it.position.length >= 3) {
          sumX += it.position[0];
          sumZ += it.position[2];
          validCount++;
        }
      });
      const cx = validCount > 0 ? sumX / validCount : 0;
      const cz = validCount > 0 ? sumZ / validCount : 0;

      const cos = Math.cos(deltaRad);
      const sin = Math.sin(deltaRad);

      const updates = activeItems.map((it) => {
        const curPos = it.position || [0, 0, 0];
        const curRot = it.rotation || [0, 0, 0];

        const dx = (curPos[0] ?? 0) - cx;
        const dz = (curPos[2] ?? 0) - cz;

        const rotX = dx * cos + dz * sin;
        const rotZ = -dx * sin + dz * cos;

        const newX = Math.round((cx + rotX) * 10000) / 10000;
        const newZ = Math.round((cz + rotZ) * 10000) / 10000;
        const newY = curPos[1] ?? 0;

        let newRotY = (curRot[1] + deltaRad) % (Math.PI * 2);
        if (newRotY < 0) newRotY += Math.PI * 2;
        newRotY = Math.round(newRotY * 10000) / 10000;

        return {
          id: it.id,
          position: [newX, newY, newZ],
          rotation: [curRot[0] || 0, newRotY, curRot[2] || 0],
        };
      });

      onUpdateTransforms(updates);
    } else {
      const curRot = primaryItem.rotation || [0, 0, 0];
      let newY = ((targetRad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      newY = Math.round(newY * 10000) / 10000;
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
      className={`relative z-30 select-none bg-[#121215]/95 backdrop-blur-md border border-white/[0.08] shadow-2xl rounded-md p-2.5 pt-2 flex flex-col space-y-2.5 w-[270px] ${className}`}
    >
      {/* Header do Widget */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <span className="text-[11px] font-semibold text-white/90 truncate">
            Mover / Rotacionar
          </span>
        </div>
      </div>

      {/* Linha divisória */}
      <div className="h-[1px] w-auto bg-neutral-700/70" />

      {/* Seção 1: Posição (Metros) */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-1">
          <Icon
            icon="basil:move-outline"
            className="text-[17px] text-neutral-300"
          />
          <span className="text-[12px] text-neutral-400">Mover</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 font-mono">
          {/* Eixo X */}
          <div className="flex items-center bg-[#0a0a0c] border border-white/[0.08] focus-within:border-red-500/50 rounded px-1.5 py-1.5 text-[11px] ">
            <span className="text-[10px] font-bold mr-1 text-red-400 select-none">
              X
            </span>
            <input
              type="number"
              step="0.05"
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
          <div className="flex items-center bg-[#0a0a0c] border border-white/[0.08] focus-within:border-emerald-500/50 rounded px-1.5 py-1 text-[11px] ">
            <span className="text-[10px] font-bold mr-1 text-emerald-400 select-none">
              Y
            </span>
            <input
              type="number"
              step="0.05"
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
          <div className="flex items-center bg-[#0a0a0c] border border-white/[0.08] focus-within:border-blue-500/50 rounded px-1.5 py-1 text-[11px] ">
            <span className="text-[10px] font-bold mr-1 text-blue-400 select-none">
              Z
            </span>
            <input
              type="number"
              step="0.05"
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

      {/* Linha divisória */}
      <div className="h-[1px] w-auto bg-neutral-700/70" />

      {/* Seção 2: Rotação (Graus) */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-1">
          <Icon
            icon="basil:refresh-solid"
            className="text-[17px] text-neutral-300"
          />
          <span className="text-[12px] text-neutral-400">Rotação</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Girar 90° */}
          <button
            type="button"
            onClick={() => rotateBy(-90)}
            title="Girar -90°"
            className="flex-1 py-1.5 rounded bg-neutral-700/70 text-[11px] font-mono text-white buttonHover flex items-center justify-center gap-1 "
          >
            <Icon icon="lucide:rotate-ccw" className="text-[12px] mr-[2px]" />
            90°
          </button>

          {/* Campo Numérico de Graus */}
          <div className="flex-[1.2] flex items-center bg-[#0a0a0c] border border-white/[0.08] focus-within:border-white/25 rounded px-1.5 py-1.5 text-[11px] font-mono ">
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

          {/* Girar 180° */}
          <button
            type="button"
            onClick={() => rotateBy(180)}
            title="Girar -90°"
            className="flex-1 py-1.5 rounded bg-neutral-700/70 text-[11px] font-mono text-white buttonHover flex items-center justify-center gap-1 "
          >
            <Icon icon="lucide:rotate-ccw" className="text-[12px] mr-[2px]" />
            180°
          </button>
        </div>
      </div>
    </div>
  );
}
