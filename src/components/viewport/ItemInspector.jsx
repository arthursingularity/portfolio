"use client";

import React from "react";

export default function ItemInspector({
  item,
  onUpdateTransform,
  onUpdateProps,
  onUpdateName,
  onDuplicate,
  onDelete,
  onClose,
}) {
  if (!item) return null;

  const handlePositionChange = (axisIndex, value) => {
    const val = parseFloat(value) || 0;
    const newPos = [...item.position];
    newPos[axisIndex] = Math.round(val * 100) / 100;
    onUpdateTransform(item.id, { position: newPos });
  };

  const handleRotate90 = () => {
    const newRot = [...item.rotation];
    newRot[1] =
      Math.round(((newRot[1] + Math.PI / 2) % (Math.PI * 2)) * 100) / 100;
    onUpdateTransform(item.id, { rotation: newRot });
  };

  const handleSnapToGround = () => {
    const newPos = [...item.position];
    newPos[1] = 0;
    onUpdateTransform(item.id, { position: newPos });
  };

  return (
    <aside className="w-full shrink-0 flex flex-col select-none bg-[#17171a] border-t border-white/10 overflow-y-auto max-h-[50vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08] bg-[#141416]/80">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <input
            type="text"
            value={item.name}
            onChange={(e) => onUpdateName(item.id, e.target.value)}
            className="text-xs font-semibold text-white bg-transparent outline-none border-b border-transparent focus:border-white/30 truncate w-full"
            title="Clique para renomear"
          />
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

      <div className="p-3 flex flex-col gap-3 text-xs">
        {/* Coordinates (X, Y, Z) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
            Posição (Metros)
          </span>
          <div className="grid grid-cols-3 gap-1.5 font-mono">
            {["X", "Y", "Z"].map((axis, idx) => (
              <div
                key={axis}
                className="flex items-center bg-[#121214] border border-white/[0.08] rounded-md px-1.5 py-1 text-[11px]"
              >
                <span
                  className={`text-[10px] font-bold mr-1 ${
                    axis === "X"
                      ? "text-red-400"
                      : axis === "Y"
                        ? "text-blue-400"
                        : "text-emerald-400"
                  }`}
                >
                  {axis}
                </span>
                <input
                  type="number"
                  step="0.5"
                  value={item.position[idx]}
                  onChange={(e) => handlePositionChange(idx, e.target.value)}
                  className="w-full bg-transparent text-white outline-none text-right"
                />
              </div>
            ))}
          </div>
        </div>

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
                  className={`flex-1 py-1 rounded border text-[11px] font-mono transition-colors ${
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
                  className={`flex-1 py-1 rounded border text-[11px] font-mono transition-colors ${
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
                    className={`py-1 rounded border text-[10px] font-mono transition-colors ${
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

        {item.type === "rail" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                Configuração do Trilho
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                10 Fileiras
              </span>
            </div>

            {/* Altura Máxima das Caixas (1 a 5) */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-neutral-400 font-mono">
                Altura Máx. (1 a 5 Caixas)
              </span>
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onUpdateProps(item.id, { maxHeight: lvl })}
                    className={`py-1 rounded border text-xs font-mono transition-colors ${
                      (item.props.maxHeight || 5) === lvl
                        ? "bg-white text-black border-white font-semibold"
                        : "border-white/10 text-white/50 hover:text-white"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Padrão de Preenchimento */}
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                Padrão de Empilhamento
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateProps(item.id, { pattern: "photo" })}
                  className={`py-1 px-1.5 rounded border text-[10px] font-mono transition-colors ${
                    item.props.pattern !== "uniform"
                      ? "bg-white text-black border-white font-medium"
                      : "border-white/10 text-white/50 hover:text-white"
                  }`}
                >
                  Variado
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateProps(item.id, { pattern: "uniform" })}
                  className={`py-1 px-1.5 rounded border text-[10px] font-mono transition-colors ${
                    item.props.pattern === "uniform"
                      ? "bg-white text-black border-white font-medium"
                      : "border-white/10 text-white/50 hover:text-white"
                  }`}
                >
                  Uniforme
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Transformation Actions */}
        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={handleRotate90}
            className="py-1 px-2 rounded bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors text-[11px] font-medium"
            title="Girar 90 graus"
          >
            ↻ Girar 90°
          </button>
          <button
            type="button"
            onClick={handleSnapToGround}
            className="py-1 px-2 rounded bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors text-[11px] font-medium"
            title="Alinhar altura ao chão"
          >
            ⤓ Chão (Y=0)
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(item.id)}
            className="py-1 px-2 rounded bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors text-[11px] font-medium"
            title="Duplicar elemento (Shift + D)"
          >
            ❐ Duplicar
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="py-1 px-2 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 transition-colors text-[11px] font-medium"
            title="Excluir elemento (Delete)"
          >
            ✕ Excluir
          </button>
        </div>
      </div>
    </aside>
  );
}
