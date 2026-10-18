"use client";

import React from "react";
import { Icon } from "@iconify/react";

/**
 * FloorMarkingPopup - Painel de Configurações do Modo Marcação
 * Exibido no canto inferior direito do Cenário 3D diretamente acima de TransformPopup.jsx
 * exclusivamente quando o Modo Marcação do Piso estiver ATIVO.
 */
export default function FloorMarkingPopup({ item, onUpdateProps }) {
  if (!item || item.type !== "floor" || !item.props?.markingMode) return null;

  const currentGridSize = Math.max(
    0.05,
    Number(item.props?.markingGridSize) || 0.5
  );
  const floorW = Math.max(1, Number(item.props?.width) || 12);
  const floorD = Math.max(1, Number(item.props?.depth) || 12);
  const gridCols = Math.round(floorW / currentGridSize);
  const gridRows = Math.round(floorD / currentGridSize);
  const totalCells = gridCols * gridRows;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="select-none bg-[#1e1e21] border border-white/[0.08] relative shadow-2xl rounded-md p-2.5 pt-2 flex flex-col space-y-2 w-[270px] font-sans max-h-[calc(100vh-280px)] overflow-y-auto"
    >
      {/* Header do Painel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-white/90">
            Modo Marcação
          </span>
        </div>
        <Icon
          icon="carbon:close"
          onClick={() => onUpdateProps(item.id, { markingMode: false })}
          className="absolute top-[2px] right-[2px] text-[27px] text-neutral-400 buttonHover"
        />
      </div>

      {/* Linha divisória */}
      <div className="h-[1px] w-auto bg-neutral-700/70" />

      {/* Ferramenta: Pincel vs Borracha */}
      <div className="flex flex-col space-y-1.5">
        <span className="text-[12px] text-neutral-400">
          Ferramenta
        </span>
        <div className="grid grid-cols-2 gap-1 ">
          <button
            type="button"
            onClick={() => onUpdateProps(item.id, { markingTool: "paint" })}
            className={`py-1 rounded text-[11px] flex items-center justify-center gap-1 cursor-pointer  ${(item.props?.markingTool || "paint") === "paint"
              ? "bg-primary-300 text-black"
              : "hover:bg-neutral-700 hover:border-neutral-700 border-white/10 text-white/60 hover:text-white border"
              }`}
          >
            <Icon icon="carbon:paint-brush" className="text-[13px]" />
            Marcar
          </button>

          <button
            type="button"
            onClick={() => onUpdateProps(item.id, { markingTool: "erase" })}
            className={`py-1 rounded text-[11px] flex items-center justify-center gap-1 cursor-pointer  ${item.props?.markingTool === "erase"
              ? "bg-red-500 text-white"
              : "border-white/10 text-white/60 hover:text-white border border-neutral-400"
              }`}
          >
            <Icon icon="carbon:erase" className="text-[13px]" />
            Apagar
          </button>
        </div>
      </div>

      {/* Densidade do Quadriculado */}
      <div className="flex flex-col space-y-1.5">
        <span className="text-[12px] text-neutral-400">
          Densidade
        </span>
        {/* Atalhos Rápidos */}
        <div className="grid grid-cols-4 gap-1">
          {[
            { label: "0.10m", value: 0.1 },
            { label: "0.15m", value: 0.15 },
            { label: "0.20m", value: 0.20 },
            { label: "0.25m", value: 0.25 }
          ].map((sz) => (
            <button
              key={sz.label}
              type="button"
              onClick={() =>
                onUpdateProps(item.id, {
                  markingGridSize: sz.value,
                })
              }
              className={`py-1 rounded border text-[10px]  cursor-pointer  ${Math.abs(currentGridSize - sz.value) < 0.01
                ? "bg-white text-black border-white font-medium"
                : "hover:bg-neutral-700 hover:border-neutral-700 border-white/10 text-white/60 hover:text-white"
                }`}
            >
              {sz.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cor da Faixa */}
      <div className="flex justify-between">
        <div className="flex flex-col space-y-1.5">
          <span className="text-[12px] text-neutral-400">
            Cor da Marcação
          </span>
          <div className="flex gap-1.5 items-center">
            {[
              { hex: "#FACC15", name: "Amarelo" },
              { hex: "#FAFAFA", name: "Branco" },
              { hex: "#EF4444", name: "Vermelho" },
              { hex: "#3B82F6", name: "Azul" },
              { hex: "#35ED10", name: "Verde" },
            ].map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.name}
                onClick={() =>
                  onUpdateProps(item.id, { markingColor: c.hex })
                }
                className={`w-5 h-5 rounded border cursor-pointer ${(item.props?.markingColor || "#FACC15").toLowerCase() ===
                  c.hex.toLowerCase()
                  ? "scale-110 border-white ring-1 ring-white"
                  : "border-white/20 hover:scale-105"
                  }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
        {/* Botão Limpar Marcações */}
        <button
          type="button"
          onClick={() => onUpdateProps(item.id, { paintedCells: {} })}
          className="h-[26px] px-2 mt-auto border border-red-500/80 rounded text-[11px] text-red-500 hover:bg-red-500 hover:text-black flex items-center justify-center gap-1 cursor-pointer"
        >
          <Icon icon="carbon:trash-can" className="text-[13px]" />
          Limpar
        </button>
      </div>
    </div>
  );
}
