"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import ColorPicker from "./ColorPicker";

import { BOX_PALETTE_COLORS, DEFAULT_BOX_COLOR } from "./models/boxConfig";

export default function ModelProperties({
  item,
  items = [],
  onUpdateTransform,
  onUpdateProps,
  onUpdateName,
  onDuplicate,
  onDelete,
  onClose,
  onMultiplyColumns,
  onSeparateItem,
}) {
  const [boxMultiplier, setBoxMultiplier] = useState(3);
  const [drawerMultiplier, setDrawerMultiplier] = useState(2);
  const [localName, setLocalName] = useState(item?.name || "");
  const [drawerDividersInput, setDrawerDividersInput] = useState(
    item?.props?.dividers !== undefined ? item.props.dividers : 1
  );

  const isBoxMultiplied = useMemo(() => {
    if (!item || item.type !== "box") return false;
    if (item.props?.isMultiplied || item.isMultiplied) return true;
    const gid = item.groupId || item.props?.groupId;
    if (gid && Array.isArray(items)) {
      const groupCount = items.filter(
        (it) => it.type === "box" && (it.groupId === gid || it.props?.groupId === gid)
      ).length;
      if (groupCount > 1) return true;
    }
    return Boolean(item.props?.connectedLeft || item.props?.connectedRight);
  }, [item, items]);

  const isDrawerMultiplied = useMemo(() => {
    if (!item || item.type !== "drawer_g") return false;
    if (item.props?.isMultiplied || item.isMultiplied) return true;
    const gid = item.groupId || item.props?.groupId;
    if (gid && Array.isArray(items)) {
      const groupCount = items.filter(
        (it) => it.type === "drawer_g" && (it.groupId === gid || it.props?.groupId === gid)
      ).length;
      if (groupCount > 5) return true;
    }
    return false;
  }, [item, items]);

  const [prevItemId, setPrevItemId] = useState(item?.id);
  const [prevItemName, setPrevItemName] = useState(item?.name);

  if (item?.id !== prevItemId || (item?.name && item.name !== prevItemName && localName === prevItemName)) {
    setPrevItemId(item?.id);
    setPrevItemName(item?.name);
    setLocalName(item?.name || "");
    if (item?.type === "drawer_g") {
      setDrawerDividersInput(
        item.props?.dividers !== undefined ? item.props.dividers : 1
      );
    }
  }

  const handleGenerateDividers = () => {
    if (!item || item.type !== "drawer_g") return;
    const rawVal = drawerDividersInput === "" ? 0 : parseInt(drawerDividersInput, 10);
    const qty = isNaN(rawVal) ? 0 : Math.min(2, Math.max(0, rawVal));

    const currentComps = item.props?.compartments || [];

    let newCompartments = [];
    if (qty === 1) {
      newCompartments = [
        {
          id: 1,
          key: "esq",
          label: "ESQUERDA",
          name: currentComps[0]?.name || "D1",
        },
        {
          id: 2,
          key: "dir",
          label: "DIREITA",
          name: currentComps[1]?.name || "D2",
        },
      ];
    } else if (qty === 2) {
      newCompartments = [
        {
          id: 1,
          key: "frente_esq",
          label: "FRENTE ESQ",
          name: currentComps[0]?.name || "D1",
        },
        {
          id: 2,
          key: "frente_dir",
          label: "FRENTE DIR",
          name: currentComps[1]?.name || "D2",
        },
        {
          id: 3,
          key: "fundo_esq",
          label: "FUNDO ESQ",
          name: currentComps[2]?.name || "D3",
        },
        {
          id: 4,
          key: "fundo_dir",
          label: "FUNDO DIR",
          name: currentComps[3]?.name || "D4",
        },
      ];
    } else {
      newCompartments = [];
    }

    onUpdateProps(item.id, {
      dividers: qty,
      compartments: newCompartments,
    });
  };

  const handleUpdateCompartmentName = (index, newName) => {
    if (!item) return;
    const currentComps = item.props?.compartments || [];
    const updated = currentComps.map((c, i) =>
      i === index ? { ...c, name: newName } : c
    );
    onUpdateProps(item.id, { compartments: updated });
  };

  if (!item) {
    return (
      <aside className="w-full h-full flex flex-col bg-[#1e1e21] overflow-hidden">
        {/* Header */}
        <div className="px-2.5 py-1 pt-[2px] border-b border-white/[0.08] bg-[#141416]/80 shrink-0">
          <span className="text-[12px] text-neutral-400">Propriedades</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white/30 font-mono text-xs gap-2">
          <Icon
            icon="carbon:select-window"
            className="text-2xl text-white/20"
          />
          <span className="font-medium text-white/40">
            Nenhum objeto selecionado
          </span>
          <span className="text-[11px] text-white/20 max-w-[190px]">
            Selecione um objeto no cenário ou no Outliner para editar
            propriedades
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full h-full flex flex-col bg-[#1e1e21] overflow-hidden">
      {/* Header */}
      <div className="px-2.5 py-1 pt-[2px] border-b border-white/[0.08] bg-[#141416]/80 shrink-0">
        <span className="text-[12px] text-neutral-400">Propriedades</span>
      </div>

      <div className="p-3 flex-1 min-h-0 flex flex-col gap-3 text-xs overflow-y-auto">
        {/* Specific Object Customization */}
        {/* ─── Propriedades do Pallet ─── */}
        {/* ─── Propriedades do Pallet ─── */}
        {item.type === "pallet" && (() => {
          const boxType = item.props?.boxType || "branca";
          const maxBoxes = boxType === "ulma_m" ? 12 : boxType === "ulma_p" ? 24 : 30;
          const boxesPerTier = boxType === "branca" ? 5 : 2;

          const currentBoxes =
            item.props?.boxCount !== undefined && item.props?.boxCount !== ""
              ? item.props.boxCount
              : 0;
          const numBoxes = Math.min(maxBoxes, Math.max(0, parseInt(currentBoxes, 10) || 0));
          const layers = Math.ceil(numBoxes / boxesPerTier);
          const tierWord =
            boxType === "branca"
              ? (layers === 1 ? "camada" : "camadas")
              : (layers === 1 ? "andar" : "andares");

          const handleBoxTypeChange = (newType) => {
            const newMax = newType === "ulma_m" ? 12 : newType === "ulma_p" ? 24 : 30;
            const currentNum = parseInt(item.props?.boxCount, 10) || 0;
            onUpdateProps(item.id, {
              boxType: newType,
              boxCount: Math.min(newMax, currentNum),
            });
          };

          const handleBoxCountChange = (val) => {
            if (val === "") {
              onUpdateProps(item.id, { boxCount: "" });
              return;
            }
            const num = parseInt(val, 10);
            if (!isNaN(num)) {
              onUpdateProps(item.id, {
                boxCount: Math.min(maxBoxes, Math.max(0, num)),
              });
            }
          };

          const currentBoxColor = item.props?.boxColor || DEFAULT_BOX_COLOR;
          const selectedColorDef = BOX_PALETTE_COLORS.find(
            (c) => c.hex.toUpperCase() === currentBoxColor.toUpperCase()
          );

          // Presets adaptados ao tipo
          const presets =
            boxType === "ulma_m"
              ? [0, 2, 4, 6, 8, 10, 12]
              : boxType === "ulma_p"
              ? [0, 4, 8, 12, 16, 20, 24]
              : [0, 5, 10, 15, 20, 25, 30];

          return (
            <div className="flex flex-col gap-3">
              {/* Seletor de Tipo de Caixa */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] text-neutral-400 font-medium">
                  Tipo de Caixa
                </span>
                <div className="grid grid-cols-3 gap-1 bg-[#121214] p-0.5 rounded border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => handleBoxTypeChange("branca")}
                    className={`py-1.5 px-1 rounded text-[11px] font-medium cursor-pointer text-center ${
                      boxType === "branca"
                        ? "bg-white text-black font-semibold shadow-xs"
                        : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    Caixa Branca
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBoxTypeChange("ulma_m")}
                    className={`py-1.5 px-1 rounded text-[11px] font-medium cursor-pointer text-center ${
                      boxType === "ulma_m"
                        ? "bg-white text-black font-semibold shadow-xs"
                        : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    Ulma M
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBoxTypeChange("ulma_p")}
                    className={`py-1.5 px-1 rounded text-[11px] font-medium cursor-pointer text-center ${
                      boxType === "ulma_p"
                        ? "bg-white text-black font-semibold shadow-xs"
                        : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    Ulma P
                  </button>
                </div>
              </div>

              {/* Controles de Quantidade */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-neutral-400 font-medium">
                    Caixas no Pallet
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                    {numBoxes === 0
                      ? "Vazio (0 caixas)"
                      : `${numBoxes} un • ${layers} ${tierWord}`}
                  </span>
                </div>

                {/* Campo Numérico com Botões - e + */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={numBoxes <= 0}
                    onClick={() => handleBoxCountChange(Math.max(0, numBoxes - 1))}
                    className="w-7 h-[28px] flex items-center justify-center bg-[#121214] border border-white/[0.08] hover:border-white/25 disabled:opacity-30 disabled:cursor-not-allowed rounded text-white/80 hover:text-white cursor-pointer shrink-0"
                    title="Diminuir 1 caixa"
                  >
                    <Icon icon="lucide:minus" className="text-xs" />
                  </button>

                  <div className="flex-1 flex items-center bg-[#121214] border border-white/[0.08] focus-within:border-white/25 rounded px-2 h-[28px]">
                    <input
                      type="number"
                      min="0"
                      max={maxBoxes}
                      step="1"
                      value={currentBoxes}
                      onChange={(e) => handleBoxCountChange(e.target.value)}
                      onBlur={() => {
                        const parsed = parseInt(item.props?.boxCount, 10);
                        onUpdateProps(item.id, {
                          boxCount: isNaN(parsed) ? 0 : Math.min(maxBoxes, Math.max(0, parsed)),
                        });
                      }}
                      placeholder="0"
                      className="w-full bg-transparent text-white outline-none font-mono text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono ml-1 shrink-0">
                      cx
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={numBoxes >= maxBoxes}
                    onClick={() => handleBoxCountChange(Math.min(maxBoxes, numBoxes + 1))}
                    className="w-7 h-[28px] flex items-center justify-center bg-[#121214] border border-white/[0.08] hover:border-white/25 disabled:opacity-30 disabled:cursor-not-allowed rounded text-white/80 hover:text-white cursor-pointer shrink-0"
                    title="Aumentar 1 caixa"
                  >
                    <Icon icon="lucide:plus" className="text-xs" />
                  </button>
                </div>

                {/* Slider visual de 0 a maxBoxes */}
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="range"
                    min="0"
                    max={maxBoxes}
                    step="1"
                    value={numBoxes}
                    onChange={(e) => handleBoxCountChange(e.target.value)}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>

                {/* Presets Rápidos por Nível / Camada */}
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {boxType === "branca"
                      ? "Atalhos por Camada (5 caixas / nível):"
                      : "Atalhos por Andar (2 caixas / nível):"}
                  </span>
                  <div className="grid grid-cols-7 gap-1">
                    {presets.map((preset) => {
                      const isActive = numBoxes === preset;
                      const levelNum = preset / boxesPerTier;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleBoxCountChange(preset)}
                          className={`py-1 rounded border text-[11px] font-mono tabular-nums cursor-pointer ${
                            isActive
                              ? "bg-white border-white text-black font-semibold shadow-xs"
                              : "bg-[#121214] border-white/[0.08] text-white/60 hover:text-white hover:border-white/25"
                          }`}
                          title={`${preset} caixas (${levelNum} ${levelNum === 1 ? tierWord : tierWord})`}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Linha divisória */}
              <div className="h-[1px] w-auto bg-neutral-700/70 my-0.5" />

              {/* ─── Cor das Caixas do Pallet (Apenas Caixa Branca) ─── */}
              {boxType === "branca" ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-neutral-400 font-medium">
                      Cor das Caixas
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400 tabular-nums uppercase">
                      {selectedColorDef ? selectedColorDef.name : currentBoxColor}
                    </span>
                  </div>

                  {/* Presets Rápidos de Cores das Caixas */}
                  <div className="grid grid-cols-6 gap-1.5">
                    {BOX_PALETTE_COLORS.map((c) => {
                      const isSelected =
                        currentBoxColor.toUpperCase() === c.hex.toUpperCase();
                      return (
                        <button
                          key={c.id}
                          type="button"
                          title={`${c.name} (${c.hex})`}
                          onClick={() =>
                            onUpdateProps(item.id, { boxColor: c.hex })
                          }
                          className={`h-7 rounded border cursor-pointer flex items-center justify-center relative ${
                            isSelected
                              ? "border-white ring-1 ring-white scale-[1.03]"
                              : "border-white/10 hover:border-white/40 opacity-80 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <></>
              )}
            </div>
          );
        })()}

        {/* ─── Propriedades da Parede ─── */}
        {item.type === "wall" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-[12px] text-neutral-400">
                Dimensões da Parede
              </span>

              {/* Grid com Altura, Largura, Comprimento */}
              <div className="grid grid-cols-3 gap-2">
                {/* Altura Y */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-400">
                    Altura (Y)
                  </span>
                  <div className="flex items-center bg-[#121214] border border-white/[0.08] focus-within:border-white/25 rounded-md px-2 py-1 text-xs">
                    <input
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      value={
                        item.props.height !== undefined
                          ? item.props.height
                          : 2.8
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateProps(item.id, {
                          height: isNaN(val) ? "" : Math.max(0.1, val),
                        });
                      }}
                      className="w-full bg-transparent text-white outline-none font-mono"
                      placeholder="2.8"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono ml-1">
                      m
                    </span>
                  </div>
                </div>

                {/* Largura X (Espessura) */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-400">
                    Largura (X)
                  </span>
                  <div className="flex items-center bg-[#121214] border border-white/[0.08] focus-within:border-white/25 rounded-md px-2 py-1 text-xs">
                    <input
                      type="number"
                      min="0.02"
                      max="20"
                      step="0.05"
                      value={
                        item.props.width !== undefined ? item.props.width : 0.2
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateProps(item.id, {
                          width: isNaN(val) ? "" : Math.max(0.01, val),
                        });
                      }}
                      className="w-full bg-transparent text-white outline-none font-mono"
                      placeholder="0.2"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono ml-1">
                      m
                    </span>
                  </div>
                </div>

                {/* Comprimento Z */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-400">
                    Compr. (Z)
                  </span>
                  <div className="flex items-center bg-[#121214] border border-white/[0.08] focus-within:border-white/25 rounded-md px-2 py-1 text-xs">
                    <input
                      type="number"
                      min="0.1"
                      max="200"
                      step="0.5"
                      value={
                        item.props.depth !== undefined ? item.props.depth : 4.0
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateProps(item.id, {
                          depth: isNaN(val) ? "" : Math.max(0.1, val),
                        });
                      }}
                      className="w-full bg-transparent text-white outline-none font-mono"
                      placeholder="4.0"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono ml-1">
                      m
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Linha divisória */}
            <div className="h-[1px] w-auto bg-neutral-700/70 my-1" />

            {/* Cor da Parede */}
            <div className="flex flex-col gap-2">
              <span className="text-[12px] text-neutral-400">
                Cor da Parede
              </span>

              {/* Presets rápidos */}
              <div className="flex gap-1.5 mb-1">
                {[
                  { name: "Branco Neve", hex: "#f1f5f9" },
                  { name: "Cinza Claro", hex: "#d1d5db" },
                  { name: "Cinza Concreto", hex: "#9ca3af" },
                  { name: "Grafite", hex: "#4b5563" },
                  { name: "Tijolo Industrial", hex: "#994d38" },
                  { name: "Azul Industrial", hex: "#1e3a5f" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => onUpdateProps(item.id, { color: c.hex })}
                    className={`w-5 h-5 rounded border ${(item.props.color || "#d1d5db") === c.hex
                      ? "border-white ring-1 ring-white"
                      : "border-white/20 hover:border-white/60"
                      }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>

              <ColorPicker
                color={item.props.color || "#d1d5db"}
                onChange={(newColor) =>
                  onUpdateProps(item.id, { color: newColor })
                }
              />
            </div>
          </div>
        )}

        {/* ─── Propriedades da Barra Metálica (Metalon) ─── */}
        {item.type === "bar" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-[12px] text-neutral-400">
                Perfil Metálico (Metalon)
              </span>

              {/* Presets rápidos de bitola industrial */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-neutral-500 font-mono">
                  Padrões Rápidos (Largura x Altura):
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: "30x30", w: 0.03, h: 0.03 },
                    { label: "50x50", w: 0.05, h: 0.05 },
                    { label: "80x40", w: 0.08, h: 0.04 },
                    { label: "100x100", w: 0.1, h: 0.1 },
                  ].map((preset) => {
                    const isMatch =
                      Math.abs((item.props.width || 0.05) - preset.w) < 0.005 &&
                      Math.abs((item.props.height || 0.05) - preset.h) < 0.005;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          onUpdateProps(item.id, {
                            width: preset.w,
                            height: preset.h,
                          })
                        }
                        className={`py-1 px-1 rounded border text-[10px] font-mono ${isMatch
                          ? "bg-white text-black border-white font-semibold"
                          : "border-white/10 text-white/70 hover:bg-white/10"
                          }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid com Altura, Largura, Comprimento */}
              <div className="grid grid-cols-3 gap-2 mt-1">
                {/* Altura Y */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-400">
                    Altura (Y)
                  </span>
                  <div className="flex items-center bg-[#121214] border border-white/[0.08] focus-within:border-white/25 rounded-md px-2 py-1 text-xs">
                    <input
                      type="number"
                      min="0.005"
                      max="10"
                      step="0.01"
                      value={
                        item.props.height !== undefined
                          ? item.props.height
                          : 0.05
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateProps(item.id, {
                          height: isNaN(val) ? "" : Math.max(0.005, val),
                        });
                      }}
                      className="w-full bg-transparent text-white outline-none font-mono"
                      placeholder="0.05"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono ml-1">
                      m
                    </span>
                  </div>
                </div>

                {/* Largura X */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-400">
                    Largura (X)
                  </span>
                  <div className="flex items-center bg-[#121214] border border-white/[0.08] focus-within:border-white/25 rounded-md px-2 py-1 text-xs">
                    <input
                      type="number"
                      min="0.005"
                      max="10"
                      step="0.01"
                      value={
                        item.props.width !== undefined
                          ? item.props.width
                          : 0.05
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateProps(item.id, {
                          width: isNaN(val) ? "" : Math.max(0.005, val),
                        });
                      }}
                      className="w-full bg-transparent text-white outline-none font-mono"
                      placeholder="0.05"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono ml-1">
                      m
                    </span>
                  </div>
                </div>

                {/* Comprimento Z */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-400">
                    Compr. (Z)
                  </span>
                  <div className="flex items-center bg-[#121214] border border-white/[0.08] focus-within:border-white/25 rounded-md px-2 py-1 text-xs">
                    <input
                      type="number"
                      min="0.05"
                      max="100"
                      step="0.1"
                      value={
                        item.props.depth !== undefined ? item.props.depth : 2.0
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateProps(item.id, {
                          depth: isNaN(val) ? "" : Math.max(0.05, val),
                        });
                      }}
                      className="w-full bg-transparent text-white outline-none font-mono"
                      placeholder="2.0"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono ml-1">
                      m
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Linha divisória */}
            <div className="h-[1px] w-auto bg-neutral-700/70 my-1" />

            {/* Cor do Metal */}
            <div className="flex flex-col gap-2">
              <span className="text-[12px] text-neutral-400">
                Cor do Metal
              </span>

              {/* Presets metálicos rápidos */}
              <div className="flex gap-1.5 mb-1">
                {[
                  { name: "Aço Carbono / Metalon", hex: "#383d42" },
                  { name: "Aço Galvanizado", hex: "#8a929a" },
                  { name: "Preto Fosco", hex: "#1f1f23" },
                  { name: "Alumínio", hex: "#d4d4d8" },
                  { name: "Laranja Industrial", hex: "#ea580c" },
                  { name: "Amarelo Segurança", hex: "#eab308" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => onUpdateProps(item.id, { color: c.hex })}
                    className={`w-5 h-5 rounded border ${(item.props.color || "#383d42") === c.hex
                      ? "border-white ring-1 ring-white"
                      : "border-white/20 hover:border-white/60"
                      }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>

              <ColorPicker
                color={item.props.color || "#383d42"}
                onChange={(newColor) =>
                  onUpdateProps(item.id, { color: newColor })
                }
              />
            </div>
          </div>
        )}

        {/* ─── Propriedades do Cubo ─── */}
        {item.type === "cube" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-[12px] text-neutral-400">
                Dimensões do Cubo
              </span>

              {/* Presets rápidos de tamanho */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-neutral-500 font-mono">
                  Padrões Rápidos (L x A x C):
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: "0.5m", w: 0.5, h: 0.5, d: 0.5 },
                    { label: "1.0m", w: 1.0, h: 1.0, d: 1.0 },
                    { label: "1.5m", w: 1.5, h: 1.5, d: 1.5 },
                    { label: "2.0m", w: 2.0, h: 2.0, d: 2.0 },
                  ].map((preset) => {
                    const isMatch =
                      Math.abs((item.props.width || 1.0) - preset.w) < 0.01 &&
                      Math.abs((item.props.height || 1.0) - preset.h) < 0.01 &&
                      Math.abs((item.props.depth || 1.0) - preset.d) < 0.01;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          onUpdateProps(item.id, {
                            width: preset.w,
                            height: preset.h,
                            depth: preset.d,
                          })
                        }
                        className={`py-1 px-1 rounded border text-[10px] font-mono  ${isMatch
                          ? "bg-white text-black border-white font-semibold"
                          : "border-white/10 text-white/70 hover:bg-white/10"
                          }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid com Largura, Altura, Comprimento */}
              <div className="grid grid-cols-3 gap-2 mt-1">
                {/* Largura X */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-400">
                    Largura (X)
                  </span>
                  <div className="flex items-center bg-[#121214] border border-white/[0.08] focus-within:border-white/25 rounded-md px-2 py-1 text-xs">
                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.1"
                      value={
                        item.props.width !== undefined ? item.props.width : 1.0
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateProps(item.id, {
                          width: isNaN(val) ? "" : Math.max(0.01, val),
                        });
                      }}
                      className="w-full bg-transparent text-white outline-none font-mono"
                      placeholder="1.0"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono ml-1">
                      m
                    </span>
                  </div>
                </div>

                {/* Altura Y */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-400">
                    Altura (Y)
                  </span>
                  <div className="flex items-center bg-[#121214] border border-white/[0.08] focus-within:border-white/25 rounded-md px-2 py-1 text-xs">
                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.1"
                      value={
                        item.props.height !== undefined
                          ? item.props.height
                          : 1.0
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateProps(item.id, {
                          height: isNaN(val) ? "" : Math.max(0.01, val),
                        });
                      }}
                      className="w-full bg-transparent text-white outline-none font-mono"
                      placeholder="1.0"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono ml-1">
                      m
                    </span>
                  </div>
                </div>

                {/* Comprimento Z */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-400">
                    Compr. (Z)
                  </span>
                  <div className="flex items-center bg-[#121214] border border-white/[0.08] focus-within:border-white/25 rounded-md px-2 py-1 text-xs">
                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.1"
                      value={
                        item.props.depth !== undefined ? item.props.depth : 1.0
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateProps(item.id, {
                          depth: isNaN(val) ? "" : Math.max(0.01, val),
                        });
                      }}
                      className="w-full bg-transparent text-white outline-none font-mono"
                      placeholder="1.0"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono ml-1">
                      m
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Linha divisória */}
            <div className="h-[1px] w-auto bg-neutral-700/70 my-1" />

            {/* Cor do Cubo */}
            <div className="flex flex-col gap-2">
              <span className="text-[12px] text-neutral-400">
                Cor do Cubo
              </span>

              {/* Presets rápidos */}
              <div className="flex gap-1.5 mb-1">
                {[
                  { name: "Azul Tecnológico", hex: "#3b82f6" },
                  { name: "Cinza Claro", hex: "#e2e8f0" },
                  { name: "Grafite Escuro", hex: "#374151" },
                  { name: "Verde Esmeralda", hex: "#10b981" },
                  { name: "Laranja Industrial", hex: "#ea580c" },
                  { name: "Amarelo Âmbar", hex: "#f59e0b" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => onUpdateProps(item.id, { color: c.hex })}
                    className={`w-5 h-5 rounded border ${(item.props.color || "#3b82f6") === c.hex
                      ? "border-white ring-1 ring-white"
                      : "border-white/20 hover:border-white/60"
                      }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>

              <ColorPicker
                color={item.props.color || "#3b82f6"}
                onChange={(newColor) =>
                  onUpdateProps(item.id, { color: newColor })
                }
              />
            </div>
          </div>
        )}

        {item.type === "floor" && (
          <div className="flex flex-col gap-2">
            {/* Direct numeric inputs for Largura (X) and Comprimento (Z) */}
            <div className="w-full flex gap-3">
              <div className="w-full flex flex-col gap-1">
                <span className="text-[12px] text-neutral-400">
                  Largura Y
                </span>
                <div className="flex items-center bg-[#121214] border border-white/[0.08] focus-within:border-white/25 rounded-md px-2 py-1 text-xs">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    step="0.5"
                    value={
                      item.props.width !== undefined ? item.props.width : 10
                    }
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateProps(item.id, {
                        width: isNaN(val) ? "" : Math.max(0.5, val),
                      });
                    }}
                    className="w-full bg-transparent text-white outline-none font-mono"
                    placeholder="10"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono ml-1">
                    m
                  </span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-1">
                <span className="text-[12px] text-neutral-400">
                  Comprimento X
                </span>
                <div className="flex items-center bg-[#121214] border border-white/[0.08] focus-within:border-white/25 rounded-md px-2 py-1 text-xs">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    step="0.5"
                    value={
                      item.props.depth !== undefined ? item.props.depth : 10
                    }
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateProps(item.id, {
                        depth: isNaN(val) ? "" : Math.max(0.5, val),
                      });
                    }}
                    className="w-full bg-transparent text-white outline-none font-mono"
                    placeholder="10"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono ml-1">
                    m
                  </span>
                </div>
              </div>

              {/* Modo Marcação */}
              <div className="flex flex-col space-y-[4px] space-x-1">
                <span className="text-[12px] text-neutral-400">Marcação</span>
                <div
                  onClick={() =>
                    onUpdateProps(item.id, {
                      markingMode: !item.props.markingMode,
                    })
                  }
                  className={`buttonHover relative rounded-full p-[2px] w-[54px] ${item.props.markingMode ? 'bg-green-500' : 'bg-neutral-700'}`}
                >
                  <div className={`rounded-full w-[20px] h-[20px] bg-white shadow-lg ${item.props.markingMode ? 'ml-auto' : ''}`} />
                </div>
              </div>
            </div>

            {/* Linha divisória */}
            <div className="h-[1px] w-auto bg-neutral-700/70 my-1" />

            {/* Seletor Livre de Cor do Piso (ColorPicker) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-neutral-400">
                  Cor do piso
                </span>
              </div>

              <ColorPicker
                color={item.props.color || "#b0b4b8"}
                onChange={(newColor) =>
                  onUpdateProps(item.id, { color: newColor })
                }
              />
            </div>
          </div>
        )}

        {item.type === "box" &&
          (() => {
            const currentMaxHeight =
              item.props?.maxHeight !== undefined ? item.props.maxHeight : 6;
            const boxMaxBoxes = Math.min(6, Math.max(0, currentMaxHeight));
            const boxSelectedColors =
              Array.isArray(item.props?.selectedColors) &&
                item.props.selectedColors.length > 0
                ? item.props.selectedColors.slice(0, Math.max(1, boxMaxBoxes))
                : [item.props?.boxColor || "#E0E0E0"];

            const boxBoxColors = Array.from({ length: boxMaxBoxes }).map(
              (_, i) => {
                if (
                  Array.isArray(item.props?.boxColors) &&
                  item.props.boxColors[i]
                ) {
                  return item.props.boxColors[i];
                }
                return (
                  boxSelectedColors[i % boxSelectedColors.length] || "#E0E0E0"
                );
              },
            );

            const handleboxMaxHeightChange = (lvl) => {
              const clampedSelected = boxSelectedColors.slice(
                0,
                Math.max(1, lvl),
              );
              const newSelected =
                clampedSelected.length > 0 ? clampedSelected : ["#E0E0E0"];
              const newBoxColors = Array.from({ length: lvl }, (_, i) => {
                if (boxBoxColors[i]) return boxBoxColors[i];
                return newSelected[i % newSelected.length];
              });

              const updates = {
                maxHeight: lvl,
                selectedColors: newSelected,
                boxColors: newBoxColors,
              };

              // Se selecionar 0 caixas, garante que o trilho esteja ativo para exibir o trilho e varal
              if (lvl === 0 && !item.props?.rail && !item.props?.trilho) {
                updates.rail = true;
                updates.trilho = true;
              }

              onUpdateProps(item.id, updates);
            };

            const handleboxToggleColor = (hex) => {
              let nextSelected;
              if (boxSelectedColors.includes(hex)) {
                if (boxSelectedColors.length === 1) return;
                nextSelected = boxSelectedColors.filter((c) => c !== hex);
              } else {
                if (boxSelectedColors.length >= boxMaxBoxes) return;
                nextSelected = [...boxSelectedColors, hex];
              }

              const nextBoxColors = Array.from(
                { length: boxMaxBoxes },
                (_, i) => {
                  const prev = boxBoxColors[i];
                  if (nextSelected.includes(prev)) return prev;
                  return nextSelected[i % nextSelected.length];
                },
              );

              onUpdateProps(item.id, {
                selectedColors: nextSelected,
                boxColors: nextBoxColors,
                boxColor: nextSelected[0],
              });
            };

            const handleboxBoxColorChange = (boxIndex, chosenHex) => {
              const next = [...boxBoxColors];
              next[boxIndex] = chosenHex;
              onUpdateProps(item.id, { boxColors: next });
            };

            return (
              <div className="flex flex-col space-y-3.5">
                {/* Altura / Quantidade de Caixas */}
                <div className="flex flex-col space-y-2">
                  <span className="text-[12px] text-neutral-400">
                    Quantidade de Caixas
                  </span>
                  <div className="grid grid-cols-7 gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleboxMaxHeightChange(lvl)}
                        className={`py-1 rounded border text-xs tabular-nums  ${currentMaxHeight === lvl
                          ? "bg-white border-white text-black font-medium"
                          : "border-neutral-600 hover:bg-neutral-600 hover:text-white cursor-pointer"
                          }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Linha divisória */}
                <div className="h-[1px] w-auto bg-neutral-700/70" />

                {/* Opções Estruturais: Trilho, Varal e Duplo (Lado a Lado) */}
                <div className="flex w-full space-x-2">
                  {/* Checkbox Trilho */}
                  <label className="flex w-full items-center justify-between py-1 px-1.5 rounded hover:bg-white/[0.04] cursor-pointer group border border-white/[0.06] bg-black/20">
                    <span className="text-[11px] text-white/80 group-hover:text-white font-medium">
                      Trilho
                    </span>
                    <input
                      type="checkbox"
                      id="box-rail-toggle"
                      checked={Boolean(item.props.rail || item.props.trilho)}
                      onChange={(e) => {
                        const nextRail = e.target.checked;
                        onUpdateProps(item.id, {
                          rail: nextRail,
                          trilho: nextRail,
                          varal: nextRail ? Boolean(item.props.varal) : false,
                        });
                      }}
                      className="w-4 h-4 rounded border border-white/20 bg-neutral-900 text-[#FF6600] focus:ring-0 cursor-pointer accent-primary-300"
                    />
                  </label>

                  {/* Checkbox Varal (habilitado apenas quando Trilho estiver marcado) */}
                  <label
                    className={`w-full flex items-center justify-between py-1 px-1.5 rounded border border-white/[0.06] bg-black/20  ${Boolean(item.props.rail || item.props.trilho)
                      ? "hover:bg-white/[0.04] cursor-pointer group"
                      : "opacity-40 cursor-not-allowed"
                      }`}
                    title={
                      Boolean(item.props.rail || item.props.trilho)
                        ? "Ativar/desativar estrutura do varal"
                        : "O varal só pode ser marcado quando o Trilho estiver ativo"
                    }
                  >
                    <span className="text-[11px] text-white/80 group-hover:text-white font-medium">
                      Varal
                    </span>
                    <input
                      type="checkbox"
                      id="box-varal-toggle"
                      disabled={!Boolean(item.props.rail || item.props.trilho)}
                      checked={Boolean(
                        (item.props.rail || item.props.trilho) &&
                        item.props.varal,
                      )}
                      onChange={(e) =>
                        onUpdateProps(item.id, { varal: e.target.checked })
                      }
                      className="w-4 h-4 rounded border border-white/20 bg-neutral-900 text-[#FF6600] focus:ring-0 cursor-pointer accent-primary-300 disabled:cursor-not-allowed"
                    />
                  </label>

                  {/* Checkbox Duplo (independente de Trilho e Varal) */}
                  <label
                    className="w-full flex items-center justify-between py-1 px-1.5 rounded border border-white/[0.06] bg-black/20 hover:bg-white/[0.04] cursor-pointer group"
                    title="Ativar/desativar fileira dupla (+1 fileira de caixas)"
                  >
                    <span className="text-[11px] text-white/80 group-hover:text-white font-medium">
                      Duplo
                    </span>
                    <input
                      type="checkbox"
                      id="box-double-rail-toggle"
                      checked={Boolean(
                        item.props.doubleRail || item.props.trilhoDuplo
                      )}
                      onChange={(e) => {
                        const nextDouble = e.target.checked;
                        onUpdateProps(item.id, {
                          doubleRail: nextDouble,
                          trilhoDuplo: nextDouble,
                        });
                      }}
                      className="w-4 h-4 rounded border border-white/20 bg-neutral-900 text-[#FF6600] focus:ring-0 cursor-pointer accent-primary-300"
                    />
                  </label>
                </div>

                {/* Linha divisória */}
                <div className="h-[1px] w-auto bg-neutral-700" />

                {/* Multiplicar Colunas (Conectar Varais) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-neutral-400">
                      Multiplicar Colunas
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {isBoxMultiplied ? "Já multiplicado" : "Conectar varais"}
                    </span>
                  </div>

                  {/* Multiplicação Customizada */}
                  <div className="flex items-center space-x-2">
                    <div
                      className={`flex items-center bg-[#121214] border border-white/[0.08] rounded-md px-2 text-[11px] w-full  ${isBoxMultiplied ? "opacity-35 cursor-not-allowed" : ""
                        }`}
                    >
                      <span className="text-[10px] text-neutral-400">Quantidade:</span>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        disabled={isBoxMultiplied}
                        value={boxMultiplier}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            setBoxMultiplier("");
                            return;
                          }
                          const val = parseInt(raw, 10);
                          if (!isNaN(val)) {
                            setBoxMultiplier(Math.min(200, val));
                          }
                        }}
                        onBlur={() => {
                          if (!boxMultiplier || Number(boxMultiplier) < 1) {
                            setBoxMultiplier(1);
                          }
                        }}
                        className="w-full h-[27px] bg-transparent text-white outline-none font-mono text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:cursor-not-allowed"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isBoxMultiplied}
                      onClick={() =>
                        onMultiplyColumns?.(
                          item.id,
                          Math.max(1, Number(boxMultiplier) || 1),
                        )
                      }
                      title={
                        isBoxMultiplied
                          ? "Este conjunto de caixas já foi multiplicado"
                          : "Multiplicar colunas"
                      }
                      className={`h-[27px] rounded px-2 text-xs font-medium ${isBoxMultiplied
                          ? "bg-neutral-800 text-neutral-500 opacity-40 cursor-not-allowed border border-white/[0.04]"
                          : "bg-primary-300 text-black buttonHover"
                        }`}
                    >
                      Multiplicar
                    </button>
                  </div>
                </div>

                {/* Linha divisória */}
                <div className="h-[1px] w-auto bg-neutral-700/70" />

                {/* Cores Base das Caixas */}
                {boxMaxBoxes > 0 ? (
                  <>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-neutral-400">
                          Cores das caixas
                        </span>
                        <span className="text-[12px] text-neutral-400 tabular-nums">
                          {boxSelectedColors.length} / {boxMaxBoxes}{" "}
                        </span>
                      </div>

                      {/* Grid das 6 Cores com Seleção Rápida e Checkbox Múltiplo */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {BOX_PALETTE_COLORS.map((c) => {
                          const isSelected = boxSelectedColors.includes(c.hex);
                          const isOnlySelected =
                            isSelected && boxSelectedColors.length === 1;

                          return (
                            <div
                              key={c.id}
                              className={`flex items-center justify-between px-2 py-1.5 rounded border cursor-pointer ${isSelected
                                ? "bg-white/[0.08] border-white/40 text-white"
                                : "bg-black/20 border-white/[0.06] text-white/50 hover:text-white/80 hover:border-white/20"
                                }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateProps(item.id, {
                                    boxColor: c.hex,
                                    selectedColors: [c.hex],
                                    boxColors: Array(boxMaxBoxes).fill(c.hex),
                                  });
                                }}
                                className="flex items-center gap-1.5 flex-1 min-w-0 text-left cursor-pointer"
                                title={`Clique para definir todas as caixas como ${c.name}`}
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded shrink-0 border shadow-sm"
                                  style={{
                                    backgroundColor: c.hex,
                                    borderColor: isSelected
                                      ? "#ffffff"
                                      : c.border,
                                  }}
                                />
                                <span className="text-[11px] font-medium truncate">
                                  {c.name}
                                </span>
                              </button>

                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isOnlySelected}
                                onChange={() => handleboxToggleColor(c.hex)}
                                title={
                                  isOnlySelected
                                    ? "Pelo menos 1 cor deve estar ativa"
                                    : isSelected
                                      ? `Remover ${c.name} da seleção`
                                      : `Adicionar ${c.name} à seleção`
                                }
                                className="w-3.5 h-3.5 rounded border border-white/20 bg-neutral-900 text-white focus:ring-0 cursor-pointer accent-primary-300 disabled:opacity-30"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Atribuição por Caixa (exibida quando mais de 1 cor estiver selecionada) */}
                    {boxSelectedColors.length > 1 && (
                      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-white/[0.08]">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-neutral-400">
                            Cor por Caixa
                          </span>
                          <div className="flex items-center space-x-1">
                            <Icon
                              icon="at-icons:cube"
                              className="text-[14px] text-neutral-300"
                            />
                            <span className="text-[12px] text-neutral-400 tabular-nums">
                              {boxMaxBoxes}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 bg-black/20 p-1.5 rounded border border-white/[0.06]">
                          {Array.from({ length: boxMaxBoxes })
                            .map((_, i) => boxMaxBoxes - 1 - i)
                            .map((tierIdx) => {
                              const assignedHex =
                                boxBoxColors[tierIdx] || boxSelectedColors[0];

                              return (
                                <div
                                  key={tierIdx}
                                  className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-white/[0.03] "
                                >
                                  <span className="text-[11px] font-mono text-white/70">
                                    Caixa {tierIdx + 1}
                                  </span>

                                  <div className="flex items-center gap-2">
                                    {boxSelectedColors.map((hex) => {
                                      const colorDef = BOX_PALETTE_COLORS.find(
                                        (c) => c.hex === hex,
                                      );
                                      const isCurrent = assignedHex === hex;

                                      return (
                                        <button
                                          key={hex}
                                          type="button"
                                          title={`${colorDef?.name || hex}`}
                                          onClick={() =>
                                            handleboxBoxColorChange(
                                              tierIdx,
                                              hex,
                                            )
                                          }
                                          className={`w-4 h-4 rounded flex items-center justify-center ${isCurrent
                                            ? "ring-2 ring-white ring-offset-1 ring-offset-black scale-110"
                                            : "opacity-40 hover:opacity-100 hover:scale-105 cursor-pointer"
                                            }`}
                                          style={{ backgroundColor: hex }}
                                        ></button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="pt-2 border-t border-white/[0.08] text-[11px] font-mono text-white/40 text-center py-2 flex flex-col items-center gap-1 bg-black/10 rounded">
                    <span className="text-white/60 font-medium">
                      Nenhuma caixa na coluna (0 caixas).
                    </span>
                    <span className="text-[10px] text-white/30">
                      Apenas o trilho e o varal estão visíveis.
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

        {/* ─── Propriedades da Gaveta G ─── */}
        {item.type === "drawer_g" && (
          <div className="flex flex-col gap-3">
            {/* Informações do Nível */}
            <div className="flex items-center justify-between text-neutral-400 text-[11px]">
              <span>Módulo</span>
              <span className="font-mono text-white/70">
                Nível {(item.props?.tierIndex !== undefined ? item.props.tierIndex + 1 : 1)} de 5
              </span>
            </div>

            {/* Linha divisória */}
            <div className="h-[1px] w-auto bg-neutral-700/70" />

            {/* Cor da Gaveta */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-neutral-400">
                  Cor da Gaveta
                </span>
              </div>

              {/* Cores rápidas padrão industrial */}
              <div className="flex gap-1.5">
                {[
                  { name: "Preto", hex: "#26272B" },
                  { name: "Azul", hex: "#1d4ed8" },
                  { name: "Verde", hex: "#15803d" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => onUpdateProps(item.id, { color: c.hex })}
                    className={`w-5 h-5 rounded border ${(item.props.color || "#26272B") === c.hex
                      ? "border-white ring-1 ring-white"
                      : "border-white/20 hover:border-white/60"
                      }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Linha divisória */}
            <div className="h-[1px] w-auto bg-neutral-700/70" />

            {/* Multiplicar Colunas */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-neutral-400">
                  Multiplicar Colunas
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {isDrawerMultiplied
                    ? "Já multiplicado"
                    : drawerMultiplier
                      ? `${drawerMultiplier} colunas (${drawerMultiplier * 5} gavetas)`
                      : ""}
                </span>
              </div>

              {/* Multiplicação Customizada */}
              <div className="flex items-center space-x-2">
                <div
                  className={`flex items-center bg-[#121214] border border-white/[0.08] rounded-md px-2 text-[11px] w-full  ${isDrawerMultiplied ? "opacity-35 cursor-not-allowed" : ""
                    }`}
                >
                  <span className="text-[10px] text-neutral-400">Quantidade:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    disabled={isDrawerMultiplied}
                    value={drawerMultiplier}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setDrawerMultiplier("");
                        return;
                      }
                      const val = parseInt(raw, 10);
                      if (!isNaN(val)) {
                        setDrawerMultiplier(Math.min(100, val));
                      }
                    }}
                    onBlur={() => {
                      if (!drawerMultiplier || Number(drawerMultiplier) < 1) {
                        setDrawerMultiplier(1);
                      }
                    }}
                    className="w-full h-[27px] bg-transparent text-white outline-none font-mono text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:cursor-not-allowed"
                  />
                </div>
                <button
                  type="button"
                  disabled={isDrawerMultiplied}
                  onClick={() =>
                    onMultiplyColumns?.(
                      item.id,
                      Math.max(1, Number(drawerMultiplier) || 1),
                    )
                  }
                  title={
                    isDrawerMultiplied
                      ? "Esta estante já foi multiplicada"
                      : "Multiplicar colunas"
                  }
                  className={`h-[27px] rounded px-2 text-xs font-medium  ${isDrawerMultiplied
                      ? "bg-neutral-800 text-neutral-500 opacity-40 cursor-not-allowed border border-white/[0.04]"
                      : "bg-primary-300 text-black buttonHover"
                    }`}
                >
                  Multiplicar
                </button>
              </div>
            </div>

            {/* Linha divisória */}
            <div className="h-[1px] w-auto bg-neutral-700/70" />

            {/* ─── Divisórias & Compartimentos da Gaveta ─── */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-neutral-400 font-medium">
                  Divisórias da Gaveta
                </span>
              </div>

              {/* Input de Quantidade + Botão Gerar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-[#121214] border border-white/[0.08] focus-within:border-white/25 rounded px-2 h-[28px]">
                  <span className="text-[11px] text-neutral-400 shrink-0">
                    Qtd (1 ou 2):
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="1"
                    value={drawerDividersInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setDrawerDividersInput("");
                        return;
                      }
                      const val = parseInt(raw, 10);
                      if (!isNaN(val)) {
                        setDrawerDividersInput(Math.min(2, Math.max(0, val)));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleGenerateDividers();
                      }
                    }}
                    placeholder="1 ou 2"
                    className="w-full bg-transparent text-white outline-none font-mono text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateDividers}
                  className="bg-primary-300 buttonHover text-black font-mnedium text-xs px-3 h-[28px] rounded shrink-0 cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Gerar divisórias de madeira e compartimentos"
                >
                  <span>Dividir</span>
                </button>
              </div>

              {/* Botões rápidos de seleção 0, 1 ou 2 */}
              <div className="flex items-center gap-1">
                {[
                  { qty: 0, label: "0 (Nenhuma)" },
                  { qty: 1, label: "1 (2 vagas)" },
                  { qty: 2, label: "2 (4 vagas)" },
                ].map((opt) => (
                  <button
                    key={opt.qty}
                    type="button"
                    onClick={() => {
                      setDrawerDividersInput(opt.qty);
                    }}
                    className={`flex-1 py-1 rounded border text-[10px] font-mono cursor-pointer ${Number(drawerDividersInput) === opt.qty
                      ? "bg-white/[0.12] border-white/40 text-white font-medium"
                      : "bg-[#121214] border-white/[0.06] text-white/50 hover:text-white/80"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Propriedades do Modelo Unido (JoinedModel) ─── */}
        {item.type === "joined" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] text-neutral-400">
                Modelo Combinado
              </span>
              <div className="bg-[#121214] border border-white/[0.08] rounded-md p-2 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Peças Integradas:</span>
                  <span className="font-mono text-white/90 font-medium">
                    {item.props?.parts?.length || 0} modelos
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.props?.parts?.map((p, idx) => (
                    <span
                      key={p.id || idx}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] border border-white/[0.08] text-neutral-300 font-mono"
                    >
                      {p.type === "wall" ? "Parede" : p.type === "bar" ? "Barra" : p.type === "cube" ? "Cubo" : p.type === "floor" ? "Piso" : p.type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Linha divisória */}
            <div className="h-[1px] w-auto bg-neutral-700/70" />

            {/* Botão de Desfazer União / Separar Peças */}
            {onSeparateItem && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] text-neutral-400">
                  Desmembrar União
                </span>
                <button
                  type="button"
                  onClick={() => onSeparateItem(item.id)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] hover:border-white/25 text-white/90 text-xs  cursor-pointer"
                  title="Separar novamente os modelos individuais"
                >
                  <Icon icon="iconoven:blend-mode" className="text-sm text-primary-400" />
                  <span>Separar Modelos</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
