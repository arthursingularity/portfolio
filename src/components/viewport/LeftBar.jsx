"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

/* ─── Catálogo de Itens ─── */
const CATALOG_ITEMS = [
  {
    type: "pallet",
    name: "Pallet Madeira",
    icon: "fa7-solid:pallet",
  },
  {
    type: "floor",
    name: "Piso",
    icon: "akar-icons:square-fill",
  },
  {
    type: "box",
    name: "Caixa Branca",
    icon: "at-icons:cube",
  },
  {
    type: "drawer_g",
    name: "Gaveta G",
    icon: "lucide:inbox",
  },
  {
    type: "wall",
    name: "Parede",
    icon: "lucide:brick-wall",
  },
  {
    type: "cube",
    name: "Cubo",
    icon: "lucide:box",
  },
];

/* ─── Ferramentas de Transformação ─── */
const TRANSFORM_TOOLS = [
  {
    mode: "select",
    title: "Modo Seleção (W)",
    icon: "reicon:pointer-filled",
    iconClass: "text-[22px]",
  },
  {
    mode: "translate",
    title: "Mover (G)",
    icon: "basil:move-outline",
    iconClass: "text-[25px]",
  },
  {
    mode: "rotate",
    title: "Rotacionar (R)",
    icon: "griddy-icons:refresh-cw",
    iconClass: "text-[23px]",
  },
  {
    mode: "size",
    title: "Modificar Tamanho (S)",
    icon: "lsicon:screen-full-outline",
    iconClass: "text-[23px]",
  },
];

/* ─── Modelos que Permitem Modificar Tamanho ─── */
export const RESIZABLE_TYPES = ["wall", "bar", "floor", "joined", "cube"];

export function isModelResizable(item) {
  if (!item) return false;
  const type = typeof item === "string" ? item : item.type;
  if (!type) return false;
  return RESIZABLE_TYPES.includes(type);
}

/* ─── Helpers Visuais ─── */
const getToolbarBtnClass = (isActive) =>
  `relative rounded w-[32px] h-[32px] cursor-pointer flex items-center justify-center  ${
    isActive
      ? "bg-neutral-600/70 text-primary-300"
      : "text-neutral-300 hover:bg-neutral-600/70 hover:text-primary-300"
  }`;

/* ─── Subcomponente: ItemPalette (Popover) ─── */
export function ItemPalette({
  isOpen = false,
  onClose = () => {},
  onAddItem = () => {},
  triggerRef,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      const clickedMenu = menuRef.current?.contains(e.target);
      const clickedTrigger = triggerRef?.current?.contains(e.target);

      if (!clickedMenu && !clickedTrigger) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("pointerdown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute left-[44px] -top-[2px] z-50 !m-0"
    >
      <div className="w-[160px] bg-[#1e1e21] border border-white/[0.08] rounded-lg p-1.5 flex flex-col gap-0.5 backdrop-blur-md shadow-2xl">
        <div className="flex items-center justify-between px-2 pl-1.5 py-1 text-[11px] font-semibold text-white/50 border-b border-white/[0.06] mb-0.5">
          <span>Adicionar Modelo</span>
        </div>

        {CATALOG_ITEMS.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => {
              onAddItem(item.type);
              onClose();
            }}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-[4px] text-xs text-white/85 hover:bg-[#3D3D42] hover:text-white cursor-pointer text-left group "
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon
                icon={item.icon}
                className="text-[15px] text-neutral-400 group-hover:text-primary-300 shrink-0"
              />
              <span className="truncate">{item.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Componente Principal: LeftBar ─── */
export default function LeftBar({
  onResetCamera,
  onAddItem,
  onOpenAddMenu,
  onCloseAddMenu,
  isAddMenuOpen: controlledIsOpen,
  setIsAddMenuOpen: controlledSetIsOpen,
  transformMode = "translate",
  setTransformMode,
  selectedItem = null,
  selectedItems = [],
  onJoinModels,
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const triggerRef = useRef(null);

  const activeItems =
    selectedItems && selectedItems.length > 0
      ? selectedItems
      : selectedItem
      ? [selectedItem]
      : [];
  const canResize =
    activeItems.length > 0 && activeItems.every((it) => isModelResizable(it));

  const canJoin =
    activeItems.length >= 2 && activeItems.every((it) => isModelResizable(it));

  let joinTitle = "Juntar modelos (Ctrl+J)";
  if (activeItems.length === 0) {
    joinTitle = "Juntar modelos - Selecione 2 modelos que permitem alterar tamanho";
  } else if (activeItems.length === 1) {
    joinTitle = "Juntar modelos - Selecione outro modelo (Shift+Clique) para juntar";
  } else if (!canJoin) {
    joinTitle = "Juntar modelos - Apenas modelos que permitem alterar tamanho podem ser unidos";
  }

  const isAddMenuOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsAddMenuOpen = controlledSetIsOpen || setInternalIsOpen;

  const toggleMenu = (e) => {
    if (onOpenAddMenu && controlledIsOpen === undefined) {
      onOpenAddMenu(e);
    } else {
      setIsAddMenuOpen((prev) => !prev);
    }
  };

  const closeMenu = () => {
    setIsAddMenuOpen(false);
    onCloseAddMenu?.();
  };

  return (
    <div className="absolute left-1 top-1 flex flex-col space-y-1 items-center z-20 select-none">
      {/* Grupo: Ferramentas de Transformação */}
      <div className="bg-black/30 backdrop-blur-md rounded-md flex flex-col space-y-1 justify-center p-1 border border-neutral-800">
        {TRANSFORM_TOOLS.map((tool) => {
          const isSizeTool = tool.mode === "size";
          const isDisabled = isSizeTool && !canResize;

          let btnTitle = tool.title;
          if (isSizeTool) {
            if (activeItems.length === 0) {
              btnTitle = "Modificar Tamanho (S) - Selecione um modelo que permita alterar tamanho";
            } else if (!canResize) {
              btnTitle = "Modificar Tamanho (S) - Este modelo não permite alterar tamanho";
            }
          }

          return (
            <button
              key={tool.mode}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (isDisabled) return;
                setTransformMode?.(tool.mode);
              }}
              title={btnTitle}
              className={`relative rounded w-[32px] h-[32px] flex items-center justify-center ${
                isDisabled
                  ? "opacity-70 cursor-not-allowed text-neutral-500"
                  : transformMode === tool.mode
                  ? "bg-neutral-600/70 text-primary-300 cursor-pointer"
                  : "text-neutral-300 hover:bg-neutral-600/70 hover:text-primary-300 cursor-pointer"
              }`}
            >
              <Icon icon={tool.icon} className={tool.iconClass} />
            </button>
          );
        })}
      </div>

      {/* Grupo: Adicionar Modelo com ItemPalette Popover */}
      <div className="relative bg-black/30 backdrop-blur-md rounded-md flex flex-col space-y-1 justify-center p-1 border border-neutral-800">
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleMenu}
          title="Adicionar modelo"
          className={getToolbarBtnClass(isAddMenuOpen)}
        >
          <span className="text-[20px] text-primary-300 absolute -top-[7px] -right-[1px] pointer-events-none leading-none">
            +
          </span>
          <Icon icon="carbon:cube" className="text-[19px]" />
        </button>

        {/* Lista de Modelos */}
        <ItemPalette
          isOpen={isAddMenuOpen}
          onClose={closeMenu}
          onAddItem={(type) => onAddItem?.(type)}
          triggerRef={triggerRef}
        />

        <button
          type="button"
          disabled={!canJoin}
          onClick={() => {
            if (canJoin) {
              onJoinModels?.();
            }
          }}
          title={joinTitle}
          className={`relative rounded w-[32px] h-[32px] flex items-center justify-center transition-all ${
            !canJoin
              ? "opacity-70 cursor-not-allowed text-neutral-500"
              : "text-neutral-300 hover:bg-neutral-600/70 hover:text-primary-300 cursor-pointer"
          }`}
        >
          <Icon icon="iconoven:blend-mode" className="text-[22px]" />
        </button>
      </div>

      {/* Grupo: Resetar Câmera */}
      <div className="bg-black/30 backdrop-blur-md rounded-md flex flex-col space-y-1 justify-center p-1 border border-neutral-800">
        <button
          type="button"
          onClick={() => onResetCamera?.()}
          title="Resetar Câmera"
          className={getToolbarBtnClass(false)}
        >
          <Icon
            icon="boxicons:refresh-cw-filled"
            className="text-[12px] text-primary-300 absolute top-[1px] right-[1px] pointer-events-none"
          />
          <Icon icon="carbon:camera" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}