"use client";

import React, { useState, useEffect } from "react";
import * as THREE from "three";
import { Icon } from "@iconify/react";
import { getModelLocalCenter, getSelectionWorldCenter } from "./transformUtils";

/**
 * TransformPopup - Manipulador Fixo de Posição e Rotação
 * Exibido no canto inferior direito do Cenário 3D sempre que 1 ou mais modelos estiverem selecionados.
 * Suporta seleção única e múltipla de modelos de forma sincronizada.
 */
export default function TransformPopup({
  selectedItem,
  selectedItems = [],
  allItems = [],
  onUpdateTransform,
  onUpdateTransforms,
  targetRegistryRef,
  className = "",
}) {
  const activeItems =
    selectedItems && selectedItems.length > 0
      ? selectedItems
      : selectedItem
        ? [selectedItem]
        : [];

  const effectiveGroupItems = React.useMemo(() => {
    if (!activeItems || activeItems.length === 0) return [];
    const groupIds = new Set();
    activeItems.forEach((it) => {
      const gid = it.groupId || it.props?.groupId;
      if (gid) groupIds.add(gid);
    });

    if (groupIds.size === 0 || !allItems || allItems.length === 0) {
      return activeItems;
    }

    const map = new Map();
    activeItems.forEach((it) => map.set(it.id, it));
    allItems.forEach((it) => {
      const gid = it.groupId || it.props?.groupId;
      if (gid && groupIds.has(gid)) {
        map.set(it.id, it);
      }
    });
    return Array.from(map.values());
  }, [activeItems, allItems]);

  const primaryItem = selectedItem || activeItems[0] || null;
  const isMulti = activeItems.length > 1 || effectiveGroupItems.length > 1;

  // Local input state for smooth typing without race conditions
  const [posX, setPosX] = useState("");
  const [posY, setPosY] = useState("");
  const [posZ, setPosZ] = useState("");
  const [rotX, setRotX] = useState("");
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
    if (focusedField !== "rotX") {
      const radX = primaryItem.rotation ? primaryItem.rotation[0] : 0;
      let deg = Math.round((radX * 180) / Math.PI);
      deg = ((deg % 360) + 360) % 360;
      setRotX(String(deg));
    }
    if (focusedField !== "rotY") {
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
    primaryItem?.rotation?.[0],
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

    const targets = effectiveGroupItems.length > 0 ? effectiveGroupItems : activeItems;
    if (targets.length > 1 && onUpdateTransforms) {
      const updates = targets.map((it) => {
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

  // Centralized rotation around model center (or center between models for multi-selection)
  const performRotation = (axis, deltaDeg) => {
    const deltaRad = (deltaDeg * Math.PI) / 180;
    if (Math.abs(deltaRad) < 1e-6) return;

    const targets = effectiveGroupItems.length > 0 ? effectiveGroupItems : activeItems;

    // 1. Get the shared pivot center in world coordinates (center of selection or entire group)
    const pivotCenter = getSelectionWorldCenter(targets, targetRegistryRef?.current);

    // 2. Rotation axis in world coordinates:
    // 'horizontal' -> rotate around world Y axis (Three.js vertical axis)
    // 'vertical' -> rotate around world X axis (pitch / tilt)
    const rotAxis =
      axis === "horizontal"
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(1, 0, 0);

    const deltaQuat = new THREE.Quaternion().setFromAxisAngle(rotAxis, deltaRad);

    const updates = targets.map((it) => {
      const node = targetRegistryRef?.current?.[it.id];
      const curPos = node
        ? node.position.clone()
        : new THREE.Vector3(it.position[0], it.position[1], it.position[2]);
      const curRot = it.rotation || [0, 0, 0];
      const curEuler = new THREE.Euler(curRot[0], curRot[1], curRot[2], "XYZ");
      const curQuat = new THREE.Quaternion().setFromEuler(curEuler);

      // Local center offset of this item
      const localCenter = getModelLocalCenter(node, it);

      // Current world center of this item:
      // worldCenter = curPos + curQuat * localCenter
      const itemWorldCenter = curPos.clone().add(localCenter.clone().applyQuaternion(curQuat));

      // Orbit item's world center around the shared pivotCenter:
      const offset = itemWorldCenter.clone().sub(pivotCenter);
      offset.applyQuaternion(deltaQuat);
      const newWorldCenter = pivotCenter.clone().add(offset);

      // New orientation of item:
      const newQuat = deltaQuat.clone().multiply(curQuat);
      const newEuler = new THREE.Euler().setFromQuaternion(newQuat, "XYZ");

      // New base position = newWorldCenter - newQuat * localCenter:
      const newPos = newWorldCenter.clone().sub(localCenter.clone().applyQuaternion(newQuat));

      return {
        id: it.id,
        position: [
          Math.round(newPos.x * 10000) / 10000,
          Math.round(newPos.y * 10000) / 10000,
          Math.round(newPos.z * 10000) / 10000,
        ],
        rotation: [
          Math.round(newEuler.x * 10000) / 10000,
          Math.round(newEuler.y * 10000) / 10000,
          Math.round(newEuler.z * 10000) / 10000,
        ],
      };
    });

    if (targets.length > 1 && onUpdateTransforms) {
      onUpdateTransforms(updates);
    } else {
      onUpdateTransform(primaryItem.id, updates[0]);
    }
  };

  // Quick Rotate by degrees (+90, -90, or any delta) - Horizontal (Y axis)
  const rotateByHorizontal = (deltaDeg) => {
    performRotation("horizontal", deltaDeg);
  };

  // Direct degree angle change - Horizontal
  const applyRotationDegHorizontal = (newDegVal) => {
    const targetDeg = parseFloat(newDegVal);
    if (isNaN(targetDeg)) return;
    const targetRad = (targetDeg * Math.PI) / 180;
    const curRad = primaryItem.rotation ? primaryItem.rotation[1] : 0;
    const deltaRad = targetRad - curRad;
    performRotation("horizontal", (deltaRad * 180) / Math.PI);
  };

  // Quick Rotate by degrees (+90, 180, or any delta) - Vertical (Three.js X axis)
  const rotateByVertical = (deltaDeg) => {
    performRotation("vertical", deltaDeg);
  };

  // Direct degree angle change - Vertical
  const applyRotationDegVertical = (newDegVal) => {
    const targetDeg = parseFloat(newDegVal);
    if (isNaN(targetDeg)) return;
    const targetRad = (targetDeg * Math.PI) / 180;
    const curRad = primaryItem.rotation ? primaryItem.rotation[0] : 0;
    const deltaRad = targetRad - curRad;
    performRotation("vertical", (deltaRad * 180) / Math.PI);
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
              step="0.025"
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
              step="0.025"
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
              step="0.025"
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

        {/* Linha Horizontal */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-400 font-medium">
              Horizontal
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono">
            {/* Girar 90° Horizontal */}
            <button
              type="button"
              onClick={() => rotateByHorizontal(-90)}
              title="Girar 90° horizontalmente"
              className="flex-1 py-1.5 rounded bg-neutral-700/70 text-[11px] font-mono text-white buttonHover flex items-center justify-center gap-1"
            >
              <Icon icon="lucide:rotate-ccw" className="text-[12px] mr-[2px]" />
              90°
            </button>

            {/* Campo Numérico de Graus Horizontal */}
            <div className="flex-[1.2] flex items-center bg-[#0a0a0c] border border-white/[0.08] focus-within:border-white/25 rounded px-1.5 py-1.5 text-[11px] font-mono">
              <input
                type="number"
                step="15"
                value={rotY}
                onFocus={() => setFocusedField("rotY")}
                onChange={(e) => {
                  setRotY(e.target.value);
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) applyRotationDegHorizontal(val);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  const val = parseFloat(rotY);
                  if (!isNaN(val)) applyRotationDegHorizontal(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="w-full bg-transparent text-white outline-none text-center font-mono"
              />
              <span className="text-white/30 text-[10px] select-none">°</span>
            </div>

            {/* Girar 180° Horizontal */}
            <button
              type="button"
              onClick={() => rotateByHorizontal(180)}
              title="Girar 180° horizontalmente"
              className="flex-1 py-1.5 rounded bg-neutral-700/70 text-[11px] font-mono text-white buttonHover flex items-center justify-center gap-1"
            >
              <Icon icon="lucide:rotate-ccw" className="text-[12px] mr-[2px]" />
              180°
            </button>
          </div>
        </div>

        {/* Linha Vertical */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-400 font-medium">
              Vertical
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono">
            {/* Girar 90° Vertical */}
            <button
              type="button"
              onClick={() => rotateByVertical(90)}
              title="Girar 90° verticalmente"
              className="flex-1 py-1.5 rounded bg-neutral-700/70 text-[11px] font-mono text-white buttonHover flex items-center justify-center gap-1"
            >
              <Icon icon="lucide:rotate-cw" className="text-[12px] mr-[2px]" />
              90°
            </button>

            {/* Campo Numérico de Graus Vertical */}
            <div className="flex-[1.2] flex items-center bg-[#0a0a0c] border border-white/[0.08] focus-within:border-white/25 rounded px-1.5 py-1.5 text-[11px] font-mono">
              <input
                type="number"
                step="15"
                value={rotX}
                onFocus={() => setFocusedField("rotX")}
                onChange={(e) => {
                  setRotX(e.target.value);
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) applyRotationDegVertical(val);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  const val = parseFloat(rotX);
                  if (!isNaN(val)) applyRotationDegVertical(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="w-full bg-transparent text-white outline-none text-center font-mono"
              />
              <span className="text-white/30 text-[10px] select-none">°</span>
            </div>

            {/* Girar 180° Vertical */}
            <button
              type="button"
              onClick={() => rotateByVertical(180)}
              title="Girar 180° verticalmente"
              className="flex-1 py-1.5 rounded bg-neutral-700/70 text-[11px] font-mono text-white buttonHover flex items-center justify-center gap-1"
            >
              <Icon icon="lucide:rotate-cw" className="text-[12px] mr-[2px]" />
              180°
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
