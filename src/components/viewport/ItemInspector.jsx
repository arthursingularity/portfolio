"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

const BOX_PALETTE_COLORS = [
  { id: "branco", name: "Branco", hex: "#E0E0E0", border: "#B0B0B0" },
  { id: "azul", name: "Azul", hex: "#4C75B7", border: "#3B5F9E" },
  { id: "verde", name: "Verde", hex: "#009F5A", border: "#007A44" },
  { id: "vermelho", name: "Vermelho", hex: "#B65241", border: "#9A4132" },
  { id: "cinza", name: "Cinza", hex: "#676767", border: "#525252" },
  { id: "amarelo", name: "Amarelo", hex: "#DAB900", border: "#B89D00" },
];

export default function ItemInspector({
  item,
  onUpdateTransform,
  onUpdateProps,
  onUpdateName,
  onDuplicate,
  onDelete,
  onClose,
  onMultiplyColumns,
}) {
  const [boxMultiplier, setBoxMultiplier] = useState(3);
  const [localName, setLocalName] = useState(item?.name || "");

  useEffect(() => {
    if (item?.name) {
      setLocalName(item.name);
    }
  }, [item?.id, item?.name]);

  if (!item) {
    return (
      <aside className="w-full h-full flex flex-col select-none bg-[#1e1e21] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08] bg-[#141416]/80 shrink-0">
          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
            Propriedades
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white/30 font-mono text-xs gap-2 select-none">
          <Icon icon="carbon:select-window" className="text-2xl text-white/20" />
          <span className="font-medium text-white/40">Nenhum objeto selecionado</span>
          <span className="text-[11px] text-white/20 max-w-[190px]">
            Selecione um objeto no cenário ou no Outliner para editar propriedades
          </span>
        </div>
      </aside>
    );
  }


  return (
    <aside className="w-full h-full flex flex-col select-none bg-[#1e1e21] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08] bg-[#141416]/80 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] focus-within:border-blue-500/60 rounded px-2 py-0.5 transition-colors">
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={() => {
                const trimmed = localName.trim();
                if (trimmed && trimmed !== item.name) {
                  onUpdateName(item.id, trimmed);
                } else {
                  setLocalName(item.name);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                } else if (e.key === "Escape") {
                  setLocalName(item.name);
                  e.currentTarget.blur();
                }
              }}
              className="text-xs font-semibold text-white bg-transparent outline-none truncate w-full"
              title="Clique para renomear modelo"
              placeholder="Nome do objeto..."
            />
            <Icon icon="lucide:pencil" className="text-white/30 text-[11px] shrink-0 pointer-events-none" />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/40 hover:text-white text-xs px-1"
          title="Deselecionar"
        >
          ✕
        </button>
      </div>

      <div className="p-3 flex-1 min-h-0 flex flex-col gap-3 text-xs overflow-y-auto">

        {/* Specific Object Customization */}
        {item.type === "rack" && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
              Níveis de Prateleira
            </span>
            <div className="flex gap-1">
              {[2, 3, 4].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onUpdateProps(item.id, { levels: lvl })}
                  className={`flex-1 py-1 rounded border text-[11px] font-mono  ${
                    (item.props.levels || 3) === lvl
                      ? "bg-white text-black border-white font-medium"
                      : "border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {lvl} Andares
                </button>
              ))}
            </div>
          </div>
        )}

        {(item.type === "cargo_red" || item.type === "cargo_gray") && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
              Camadas de Caixas
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((lyr) => (
                <button
                  key={lyr}
                  type="button"
                  onClick={() => onUpdateProps(item.id, { layers: lyr })}
                  className={`flex-1 py-1 rounded border text-[11px] font-mono  ${
                    (item.props.layers || 3) === lyr
                      ? "bg-white text-black border-white font-medium"
                      : "border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {lyr}
                </button>
              ))}
            </div>
          </div>
        )}

        {item.type === "floor" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                Dimensões do Piso
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                Altura fixa: 0.08m
              </span>
            </div>

            {/* Direct numeric inputs for Largura (X) and Comprimento (Z) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-neutral-400 font-mono">
                  Largura (X)
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

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-neutral-400 font-mono">
                  Comprimento (Z)
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
            </div>

            {/* Presets Rápidos */}
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                Atalhos Rápidos
              </span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: "10x10", w: 10, d: 10 },
                  { label: "16x14", w: 16, d: 14 },
                  { label: "20x20", w: 20, d: 20 },
                  { label: "30x20", w: 30, d: 20 },
                ].map((dim) => (
                  <button
                    key={dim.label}
                    type="button"
                    onClick={() =>
                      onUpdateProps(item.id, { width: dim.w, depth: dim.d })
                    }
                    className={`py-1 rounded border text-[10px] font-mono  ${
                      Number(item.props.width) === dim.w &&
                      Number(item.props.depth) === dim.d
                        ? "bg-white text-black border-white font-medium"
                        : "border-white/10 text-white/50 hover:text-white"
                    }`}
                  >
                    {dim.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {item.type === "box" && (() => {
          const currentMaxHeight =
            item.props?.maxHeight !== undefined ? item.props.maxHeight : 6;
          const boxMaxBoxes = Math.min(6, Math.max(0, currentMaxHeight));
          const boxSelectedColors =
            Array.isArray(item.props?.selectedColors) && item.props.selectedColors.length > 0
              ? item.props.selectedColors.slice(0, Math.max(1, boxMaxBoxes))
              : [item.props?.boxColor || "#E0E0E0"];

          const boxBoxColors = Array.from({ length: boxMaxBoxes }).map((_, i) => {
            if (Array.isArray(item.props?.boxColors) && item.props.boxColors[i]) {
              return item.props.boxColors[i];
            }
            return boxSelectedColors[i % boxSelectedColors.length] || "#E0E0E0";
          });

          const handleboxMaxHeightChange = (lvl) => {
            const clampedSelected = boxSelectedColors.slice(0, Math.max(1, lvl));
            const newSelected = clampedSelected.length > 0 ? clampedSelected : ["#E0E0E0"];
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

            const nextBoxColors = Array.from({ length: boxMaxBoxes }, (_, i) => {
              const prev = boxBoxColors[i];
              if (nextSelected.includes(prev)) return prev;
              return nextSelected[i % nextSelected.length];
            });

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
            <div className="flex flex-col gap-2.5">
              {/* Opções Estruturais: Trilho e Varal (Lado a Lado) */}
              <div className="pt-1.5 border-t border-white/[0.08] grid grid-cols-2 gap-2">
                {/* Checkbox Trilho */}
                <label className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-white/[0.04] cursor-pointer group border border-white/[0.06] bg-black/20">
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
                    className="w-4 h-4 rounded border border-white/20 bg-neutral-900 text-[#FF6600] focus:ring-0 cursor-pointer accent-[#FF6600]"
                  />
                </label>

                {/* Checkbox Varal (habilitado apenas quando Trilho estiver marcado) */}
                <label
                  className={`flex items-center justify-between py-1 px-1.5 rounded border border-white/[0.06] bg-black/20 transition-opacity ${
                    Boolean(item.props.rail || item.props.trilho)
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
                      (item.props.rail || item.props.trilho) && item.props.varal
                    )}
                    onChange={(e) =>
                      onUpdateProps(item.id, { varal: e.target.checked })
                    }
                    className="w-4 h-4 rounded border border-white/20 bg-neutral-900 text-[#FF6600] focus:ring-0 cursor-pointer accent-[#FF6600] disabled:cursor-not-allowed"
                  />
                </label>
              </div>

              {/* Multiplicar Colunas (Conectar Varais) */}
              <div className="pt-1.5 border-t border-white/[0.08] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                    Multiplicar Colunas
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Conectar Varais
                  </span>
                </div>
                
                {/* Multiplicação Customizada */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex items-center bg-[#121214] border border-white/[0.08] rounded-md px-2 py-1 text-[11px] flex-1">
                    <span className="text-[10px] font-mono text-white/40 mr-1.5">Qtd:</span>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={boxMultiplier}
                      onChange={(e) =>
                        setBoxMultiplier(
                          Math.max(1, Math.min(200, parseInt(e.target.value) || 1))
                        )
                      }
                      className="w-full bg-transparent text-white outline-none font-mono text-right"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onMultiplyColumns?.(item.id, boxMultiplier)}
                    className="py-1 px-3 rounded border border-white/20 bg-white text-black hover:bg-neutral-200 text-[11px] font-semibold transition-colors shrink-0"
                  >
                    Multiplicar
                  </button>
                </div>

                {/* Conexões Laterais da Coluna Atual */}
                <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                  <label className="flex items-center justify-between py-1 px-1.5 rounded border border-white/[0.06] bg-black/20 hover:bg-white/[0.04] cursor-pointer group">
                    <span className="text-[10px] text-white/60 group-hover:text-white font-mono">
                      Conexão Esq.
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(item.props.connectedLeft)}
                      onChange={(e) =>
                        onUpdateProps(item.id, {
                          connectedLeft: e.target.checked,
                        })
                      }
                      className="w-3.5 h-3.5 rounded border border-white/20 bg-neutral-900 text-[#FF6600] focus:ring-0 cursor-pointer accent-[#FF6600]"
                    />
                  </label>
                  <label className="flex items-center justify-between py-1 px-1.5 rounded border border-white/[0.06] bg-black/20 hover:bg-white/[0.04] cursor-pointer group">
                    <span className="text-[10px] text-white/60 group-hover:text-white font-mono">
                      Conexão Dir.
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(item.props.connectedRight)}
                      onChange={(e) =>
                        onUpdateProps(item.id, {
                          connectedRight: e.target.checked,
                        })
                      }
                      className="w-3.5 h-3.5 rounded border border-white/20 bg-neutral-900 text-[#FF6600] focus:ring-0 cursor-pointer accent-[#FF6600]"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                  Configuração da coluna
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {boxMaxBoxes === 0 ? "0 Caixas (Estrutura)" : `${boxMaxBoxes} Caixa${boxMaxBoxes > 1 ? "s" : ""}`}
                </span>
              </div>

              {/* Altura / Quantidade de Caixas (0 a 6) */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-neutral-400 font-mono">
                  Quantidade de Caixas (0 a 6)
                </span>
                <div className="grid grid-cols-7 gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleboxMaxHeightChange(lvl)}
                      className={`py-1 rounded border text-xs font-mono  ${
                        currentMaxHeight === lvl
                          ? "bg-white text-black border-white font-semibold"
                          : "border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cores Base das Caixas */}
              {boxMaxBoxes > 0 ? (
                <>
                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-white/[0.08]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                        Cores das Caixas
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {boxSelectedColors.length} / {boxMaxBoxes} selecionada(s)
                      </span>
                    </div>

                    {/* Grid das 6 Cores com Seleção Rápida e Checkbox Múltiplo */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {BOX_PALETTE_COLORS.map((c) => {
                        const isSelected = boxSelectedColors.includes(c.hex);
                        const isOnlySelected = isSelected && boxSelectedColors.length === 1;

                        return (
                          <div
                            key={c.id}
                            className={`flex items-center justify-between px-2 py-1.5 rounded border cursor-pointer ${
                              isSelected
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
                                  borderColor: isSelected ? "#ffffff" : c.border,
                                }}
                              />
                              <span className="text-[11px] font-medium truncate">{c.name}</span>
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
                              className="w-3.5 h-3.5 rounded border border-white/20 bg-neutral-900 text-white focus:ring-0 cursor-pointer accent-green-500 disabled:opacity-30"
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
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                          Cor por Caixa na Coluna
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {boxMaxBoxes} caixas
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 bg-black/20 p-1.5 rounded border border-white/[0.06]">
                        {Array.from({ length: boxMaxBoxes })
                          .map((_, i) => boxMaxBoxes - 1 - i)
                          .map((tierIdx) => {
                            const assignedHex = boxBoxColors[tierIdx] || boxSelectedColors[0];

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
                                    const colorDef = BOX_PALETTE_COLORS.find((c) => c.hex === hex);
                                    const isCurrent = assignedHex === hex;

                                    return (
                                      <button
                                        key={hex}
                                        type="button"
                                        title={`${colorDef?.name || hex}`}
                                        onClick={() => handleboxBoxColorChange(tierIdx, hex)}
                                        className={`w-4 h-4 rounded flex items-center justify-center ${
                                          isCurrent
                                            ? "ring-2 ring-white ring-offset-1 ring-offset-black scale-110"
                                            : "opacity-40 hover:opacity-100 hover:scale-105 cursor-pointer"
                                        }`}
                                        style={{ backgroundColor: hex }}
                                      >
                                      </button>
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
                  <span className="text-white/60 font-medium">Nenhuma caixa na coluna (0 caixas).</span>
                  <span className="text-[10px] text-white/30">Apenas o trilho e o varal estão visíveis.</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Ações do Objeto (Duplicar e Excluir) */}
        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={() => onDuplicate(item.id)}
            className="py-1 px-2 rounded bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-[11px] font-medium transition-colors"
            title="Duplicar elemento (Shift + D)"
          >
            ❐ Duplicar
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="py-1 px-2 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-[11px] font-medium transition-colors"
            title="Excluir elemento (Delete)"
          >
            ✕ Excluir
          </button>
        </div>
      </div>
    </aside>
  );
}
