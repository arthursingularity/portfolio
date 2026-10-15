"use client";

import { ChevronDown } from "@carbon/icons-react";
import React, { useState } from "react";

export default function ItemPalette({
  onAddItem,
  transformMode,
  setTransformMode,
  snapToGrid,
  setSnapToGrid,
  onLoadTemplate,
  onClearAll,
  itemCount,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const catalog = [
    {
      type: "rack",
      name: "Porta-Paletes",
      desc: "Colunas azuis + vigas laranjas",
      badge: "Rack",
      color: "#2563eb",
    },
    {
      type: "cargo_red",
      name: "Carga Vermelha",
      desc: "Pallet com caixas vermelhas",
      badge: "Caixas",
      color: "#dc2626",
    },
    {
      type: "cargo_gray",
      name: "Carga Cinza",
      desc: "Pallet com caixas cinzas",
      badge: "Caixas",
      color: "#52525b",
    },
    {
      type: "pallet",
      name: "Pallet Madeira",
      desc: "Pallet de madeira vazio",
      badge: "Pallet",
      color: "#d97706",
    },
    {
      type: "floor",
      name: "Piso Concreto",
      desc: "Placa com demarcação amarela",
      badge: "Chão",
      color: "#71717a",
    },
    {
      type: "forklift",
      name: "Empilhadeira",
      desc: "Paleteira elétrica amarela",
      badge: "Veículo",
      color: "#eab308",
    },
    {
      type: "column",
      name: "Coluna Estrutural",
      desc: "Pilar de concreto do galpão",
      badge: "Estrutura",
      color: "#a1a1aa",
    },
    {
      type: "rail",
      name: "Trilho",
      desc: "Retângulo laranja + 10 fileiras de caixas",
      badge: "Trilho",
      color: "#ea580c",
    },
  ];

  return (
    <aside className="absolute top-4 left-4 z-20 flex flex-col w-[260px]">
      {/* Main Panel Box */}
      <div className="bg-neutral-500/60 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Panel Header */}
        <div className="flex items-center justify-between p-2.5 bg-neutral-800">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-white tracking-wide uppercase">
              Modelos
            </h2>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.07] text-white/60 font-mono">
              {itemCount} itens
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="cursor-pointer hover:bg-neutral-500 rounded p-[2px]"
          >
            <ChevronDown
              size={20}
              className={`transition-transform ${collapsed ? 'rotate-180':''}`}
            />
          </button>
        </div>

        {!collapsed && (
          <div className="p-2 flex flex-col gap-2.5">
            {/* Mode & Snap Tooling Bar */}
            <div className="flex items-center gap-1 bg-[#121214] border border-white/[0.06] rounded-lg p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setTransformMode("translate")}
                className={`flex-1 py-1 rounded font-medium transition-colors ${
                  transformMode === "translate"
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"
                }`}
                title="Mover objeto no espaço (Atalho: G ou T)"
              >
                Mover (G)
              </button>
              <button
                type="button"
                onClick={() => setTransformMode("rotate")}
                className={`flex-1 py-1 rounded font-medium transition-colors ${
                  transformMode === "rotate"
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"
                }`}
                title="Rotacionar objeto (Atalho: R)"
              >
                Girar (R)
              </button>
              <button
                type="button"
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`px-2 py-1 rounded font-mono text-[10px] transition-colors border ${
                  snapToGrid
                    ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                    : "border-transparent text-white/30 hover:text-white/60"
                }`}
                title="Ativar/Desativar atração pelo grid (Snap)"
              >
                SNAP
              </button>
            </div>

            {/* Catalog List */}
            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 px-1">
                Adicionar Elementos
              </span>
              {catalog.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => onAddItem(item.type)}
                  className="flex items-center justify-between p-1.5 rounded-lg border border-white/[0.06] bg-[#222226]/60 hover:bg-[#2b2b30] hover:border-white/20 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="text-xs font-medium text-white/90 truncate group-hover:text-white">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-white/40 truncate">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-white/30 group-hover:text-white/80 group-hover:translate-x-0.5 transition-transform pl-1">
                    +
                  </span>
                </button>
              ))}
            </div>

            {/* Presets and Global Actions */}
            <div className="pt-2 border-t border-white/[0.08] flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={onLoadTemplate}
                className="flex-1 py-1.5 px-2 bg-white/[0.08] hover:bg-white/15 text-white/80 hover:text-white rounded-lg border border-white/10 transition-colors text-center font-medium"
                title="Redefinir para o cenário padrão (Apenas Piso Concreto)"
              >
                Piso Padrão
              </button>
              <button
                type="button"
                onClick={onClearAll}
                className="py-1.5 px-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition-colors font-medium"
                title="Limpar todos os elementos do setor"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
