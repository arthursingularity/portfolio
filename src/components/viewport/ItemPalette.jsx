"use client";

import { Icon } from "@iconify/react";
import React, { useState, useEffect, useRef } from "react";

// Minimalist Blender-style SVG Icons
function MeshIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className={className}
    >
      <polygon points="8,1.5 14.5,5.2 8,9 1.5,5.2" />
      <polyline points="1.5,5.2 1.5,10.8 8,14.5 14.5,10.8 14.5,5.2" />
      <line x1="8" y1="9" x2="8" y2="14.5" />
    </svg>
  );
}

function RackIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className={className}
    >
      <line x1="2" y1="1" x2="2" y2="15" />
      <line x1="14" y1="1" x2="14" y2="15" />
      <line x1="2" y1="5" x2="14" y2="5" />
      <line x1="2" y1="9" x2="14" y2="9" />
      <line x1="2" y1="13" x2="14" y2="13" />
    </svg>
  );
}

function BoxIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className={className}
    >
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <line x1="2" y1="7" x2="14" y2="7" />
      <line x1="8" y1="7" x2="8" y2="13" />
    </svg>
  );
}

function PalletIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className={className}
    >
      <line x1="1" y1="9" x2="15" y2="9" />
      <line x1="13" y1="13" x2="1" y2="13" />
      <rect x="2" y="10" width="3" height="3" />
      <rect x="6.5" y="10" width="3" height="3" />
      <rect x="11" y="10" width="3" height="3" />
    </svg>
  );
}

function FloorIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className={className}
    >
      <polygon points="8,2 15,6 8,10 1,6" />
      <polygon points="8,6 15,10 8,14 1,10" strokeOpacity="0.4" />
    </svg>
  );
}

function ForkliftIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className={className}
    >
      <rect x="2" y="6" width="7" height="6" rx="1" />
      <circle cx="4" cy="13" r="1.5" />
      <circle cx="8" cy="13" r="1.5" />
      <line x1="9" y1="3" x2="9" y2="13" />
      <line x1="9" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function ColumnIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className={className}
    >
      <rect x="5" y="3" width="6" height="11" rx="0.5" />
      <line x1="3" y1="2" x2="13" y2="2" />
      <line x1="3" y1="14" x2="13" y2="14" />
    </svg>
  );
}

export default function ItemPalette({
  isOpen = false,
  position = { x: 0, y: 0 },
  onClose = () => {},
  onAddItem = () => {},
}) {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const menuRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const catalog = [
    {
      type: "rack",
      name: "Porta-Paletes",
      desc: "Colunas azuis + vigas laranjas",
      badge: "Rack",
      color: "#2563eb",
      icon: RackIcon,
    },
    {
      type: "cargo_red",
      name: "Carga Vermelha",
      desc: "Pallet com caixas vermelhas",
      badge: "Caixas",
      color: "#dc2626",
      icon: BoxIcon,
    },
    {
      type: "cargo_gray",
      name: "Carga Cinza",
      desc: "Pallet com caixas cinzas",
      badge: "Caixas",
      color: "#71717a",
      icon: BoxIcon,
    },
    {
      type: "pallet",
      name: "Pallet Madeira",
      desc: "Pallet de madeira vazio",
      badge: "Pallet",
      color: "#d97706",
      icon: PalletIcon,
    },
    {
      type: "floor",
      name: "Piso",
      desc: "Placa com demarcação amarela",
      badge: "Chão",
      color: "#71717a",
      icon: FloorIcon,
    },
    {
      type: "forklift",
      name: "Empilhadeira",
      desc: "Paleteira elétrica amarela",
      badge: "Veículo",
      color: "#eab308",
      icon: ForkliftIcon,
    },
    {
      type: "column",
      name: "Coluna Estrutural",
      desc: "Pilar de concreto do galpão",
      badge: "Estrutura",
      color: "#a1a1aa",
      icon: ColumnIcon,
    },
    {
      type: "box",
      name: "Caixa Branca",
      desc: "Coluna de Caixas Brancas",
      badge: "Caixa Branca",
      color: "#ea580c",
      icon: BoxIcon,
    },
  ];

  // Calculate clamped coordinates and submenu placement
  const [coords, setCoords] = useState({
    x: 0,
    y: 0,
    openLeft: false,
    openTop: false,
  });

  useEffect(() => {
    if (!isOpen) {
      setSubmenuOpen(false);
      return;
    }

    const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
    const winH = typeof window !== "undefined" ? window.innerHeight : 800;

    const menuW = 190;
    const menuH = 80;
    const submenuW = 230;
    const submenuH = 290;

    const posX = position?.x ?? 100;
    const posY = position?.y ?? 100;

    // Clamped coordinates for main menu
    const clampedX = Math.min(Math.max(10, posX), winW - menuW - 10);
    const clampedY = Math.min(Math.max(10, posY), winH - menuH - 10);

    // Should submenu open to the left or right?
    const openLeft = clampedX + menuW + submenuW > winW - 10;
    // Should submenu flip upward?
    const openTop = clampedY + submenuH > winH - 10;

    setCoords({
      x: clampedX,
      y: clampedY,
      openLeft,
      openTop,
    });
  }, [isOpen, position]);

  // Click outside and ESC handling
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle smooth submenu hover with slight grace period
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setSubmenuOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setSubmenuOpen(false);
    }, 160);
  };

  const handleItemSelect = (type) => {
    onAddItem(type);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 select-none font-sans"
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
      }}
    >
      {/* ── Menu Principal (Blender Context Menu) ── */}
      <div className="w-[190px] bg-[#1e1e21] rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.5)] p-1.5 flex flex-col gap-0.5">
        {/* Cabeçalho 'Adicionar' estilo Blender */}
        <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-white/40 tracking-wider uppercase border-b border-white/[0.06] mb-0.5">
          <span>Adicionar</span>
          <span className="text-[10px] text-white/30 font-mono">Shift+A</span>
        </div>

        {/* Item com Submenu: 'Adicionar modelo >' */}
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            className={`w-full flex items-center justify-between px-2 pr-1.5 py-1.5 rounded text-xs text-white cursor-pointer group ${
              submenuOpen ? "bg-[#3D3D42]" : "hover:bg-[#3D3D42]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon icon={"carbon:cube"} className="text-[15px]" />
              <span className="font-medium">Adicionar modelo</span>
            </div>
            {/* Ícone de seta Blender ▶ */}
            <Icon icon={"carbon:chevron-right"} className="text-[15px]" />
          </button>

          {/* ── Submenu Lista de Modelos (Catalog) ── */}
          {submenuOpen && (
            <div
              className={`absolute ${
                coords.openLeft
                  ? "right-[calc(100%+4px)]"
                  : "left-[calc(100%+4px)]"
              } ${
                coords.openTop ? "bottom-0" : "top-0"
              } w-[220px] bg-[#1e1e21] rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.5)] p-1 flex flex-col gap-0.5 z-50`}
            >
              {/* Invisible hover bridge to prevent pointer leave */}
              <div
                className={`absolute top-0 bottom-0 w-3 ${
                  coords.openLeft ? "-right-3" : "-left-3"
                }`}
              />

              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 border-b border-white/[0.06] mb-0.5">
                Modelos Disponíveis
              </div>

              {catalog.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleItemSelect(item.type)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-[4px] text-xs text-white/85 hover:bg-[#3D3D42] hover:text-white cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <IconComponent className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white shrink-0" />
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">{item.name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-white/30 group-hover:text-white/60 font-mono shrink-0 pl-1">
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
