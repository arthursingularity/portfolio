"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

export default function TopBar({
  projectName = "setor_principal",
  setProjectName,
  saveStatus = "idle",
  onSave,
  onUndo,
  onRedo,
  onAddItem,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onExportGlb,
  onResetCamera,
  onSetCameraView,
  gridVisible,
  setGridVisible,
  transformMode = "translate",
  setTransformMode,
  selectedCount = 0,
  onSelectAll,
  onDeselectAll,
}) {
  const [activeTab, setActiveTab] = useState("Layout");
  const [openMenu, setOpenMenu] = useState(null); // "file" | "edit" | "render" | "window" | "help" | null
  const menuBarRef = useRef(null);

  // Fecha menus ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuHover = (menuKey) => {
    if (openMenu !== null) {
      setOpenMenu(menuKey);
    }
  };

  const toggleMenu = (menuKey) => {
    setOpenMenu((prev) => (prev === menuKey ? null : menuKey));
  };

  const closeMenus = () => setOpenMenu(null);

  return (
    <header className="relative w-full flex flex-col border-b border-white/[0.08] bg-[#18181b] z-50">
      {/* ── 2. Linha Inferior: Menus e Abas de Workspaces ── */}
      <div
        ref={menuBarRef}
        className="h-[25px] flex items-center px-1 justify-between bg-[#1e1e22] text-[12px] relative z-50"
      >
        <div className="flex items-center h-full">
          {/* Logo Arthur */}
          <div className="flex items-center justify-center px-1.5 text-white/90">
            <img src={'/imagens/logo.svg'} className="h-[17px] w-fit shrink-0 buttonHover"/>
          </div>

          {/* ── Menus Principais: File, Edit, Render, Window, Help ── */}
          <div className="flex items-center h-full">
            {/* File */}
            <div className="relative h-full flex items-center">
              <button
                type="button"
                onClick={() => toggleMenu("file")}
                onMouseEnter={() => handleMenuHover("file")}
                className={`px-2 py-0.5 rounded-[3px] text-zinc-300 hover:text-white cursor-pointer ${
                  openMenu === "file" ? "bg-[#34343a] text-white" : "hover:bg-white/[0.06]"
                }`}
              >
                File
              </button>
              {openMenu === "file" && (
                <div className="absolute top-full left-0 mt-0.5 w-52 bg-[#252528] border border-white/[0.10] rounded-md shadow-2xl py-1 z-50 text-[12px] text-zinc-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSave) onSave();
                      closeMenus();
                    }}
                    className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#34343a] hover:text-white"
                  >
                    <span>Save</span>
                    <span className="text-zinc-500 text-[11px]">Ctrl+S</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onExportGlb) onExportGlb();
                      closeMenus();
                    }}
                    className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#34343a] hover:text-white"
                  >
                    <span>Export glTF 2.0 (.glb)</span>
                    <span className="text-zinc-500 text-[11px]">Ctrl+E</span>
                  </button>
                  <div className="h-[1px] bg-white/[0.08] my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      if (onResetCamera) onResetCamera();
                      closeMenus();
                    }}
                    className="w-full px-3 py-1 text-left hover:bg-[#34343a] hover:text-white"
                  >
                    Reset View (Isometric)
                  </button>
                </div>
              )}
            </div>

            {/* Edit */}
            <div className="relative h-full flex items-center">
              <button
                type="button"
                onClick={() => toggleMenu("edit")}
                onMouseEnter={() => handleMenuHover("edit")}
                className={`px-2 py-0.5 rounded-[3px] text-zinc-300 hover:text-white cursor-pointer ${
                  openMenu === "edit" ? "bg-[#34343a] text-white" : "hover:bg-white/[0.06]"
                }`}
              >
                Edit
              </button>
              {openMenu === "edit" && (
                <div className="absolute top-full left-0 mt-0.5 w-48 bg-[#252528] border border-white/[0.10] rounded-md shadow-2xl py-1 z-50 text-[12px] text-zinc-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (onUndo) onUndo();
                      closeMenus();
                    }}
                    className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#34343a] hover:text-white"
                  >
                    <span>Undo</span>
                    <span className="text-zinc-500 text-[11px]">Ctrl+Z</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onRedo) onRedo();
                      closeMenus();
                    }}
                    className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#34343a] hover:text-white"
                  >
                    <span>Redo</span>
                    <span className="text-zinc-500 text-[11px]">Ctrl+Shift+Z</span>
                  </button>
                  <div className="h-[1px] bg-white/[0.08] my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectAll) onSelectAll();
                      closeMenus();
                    }}
                    className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#34343a] hover:text-white"
                  >
                    <span>Select All</span>
                    <span className="text-zinc-500 text-[11px]">Ctrl+A</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeselectAll) onDeselectAll();
                      closeMenus();
                    }}
                    className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#34343a] hover:text-white"
                  >
                    <span>Deselect All</span>
                    <span className="text-zinc-500 text-[11px]">Esc</span>
                  </button>
                  <div className="h-[1px] bg-white/[0.08] my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      if (onCopy) onCopy();
                      closeMenus();
                    }}
                    className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#34343a] hover:text-white"
                  >
                    <span>Copy</span>
                    <span className="text-zinc-500 text-[11px]">Ctrl+C</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onPaste) onPaste();
                      closeMenus();
                    }}
                    className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#34343a] hover:text-white"
                  >
                    <span>Paste</span>
                    <span className="text-zinc-500 text-[11px]">Ctrl+V</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDuplicate) onDuplicate();
                      closeMenus();
                    }}
                    className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#34343a] hover:text-white"
                  >
                    <span>Duplicate</span>
                    <span className="text-zinc-500 text-[11px]">Shift+D</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDelete) onDelete();
                      closeMenus();
                    }}
                    className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#34343a] hover:text-white text-red-400 hover:text-red-300"
                  >
                    <span>Delete</span>
                    <span className="text-zinc-500 text-[11px]">Del / X</span>
                  </button>
                </div>
              )}
            </div>

            {/* Render */}
            <div className="relative h-full flex items-center">
              <button
                type="button"
                onClick={() => toggleMenu("render")}
                onMouseEnter={() => handleMenuHover("render")}
                className={`px-2 py-0.5 rounded-[3px] text-zinc-300 hover:text-white cursor-pointer ${
                  openMenu === "render" ? "bg-[#34343a] text-white" : "hover:bg-white/[0.06]"
                }`}
              >
                Render
              </button>
              {openMenu === "render" && (
                <div className="absolute top-full left-0 mt-0.5 w-48 bg-[#252528] border border-white/[0.10] rounded-md shadow-2xl py-1 z-50 text-[12px] text-zinc-200">
                  <button
                    type="button"
                    onClick={closeMenus}
                    className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#34343a] hover:text-white"
                  >
                    <span>Render Image</span>
                    <span className="text-zinc-500 text-[11px]">F12</span>
                  </button>
                  <button
                    type="button"
                    onClick={closeMenus}
                    className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#34343a] hover:text-white"
                  >
                    <span>Render Animation</span>
                    <span className="text-zinc-500 text-[11px]">Ctrl+F12</span>
                  </button>
                </div>
              )}
            </div>

            {/* Window */}
            <div className="relative h-full flex items-center">
              <button
                type="button"
                onClick={() => toggleMenu("window")}
                onMouseEnter={() => handleMenuHover("window")}
                className={`px-2 py-0.5 rounded-[3px] text-zinc-300 hover:text-white cursor-pointer ${
                  openMenu === "window" ? "bg-[#34343a] text-white" : "hover:bg-white/[0.06]"
                }`}
              >
                Window
              </button>
              {openMenu === "window" && (
                <div className="absolute top-full left-0 mt-0.5 w-48 bg-[#252528] border border-white/[0.10] rounded-md shadow-2xl py-1 z-50 text-[12px] text-zinc-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof document !== "undefined") {
                        if (!document.fullscreenElement) {
                          document.documentElement.requestFullscreen().catch(() => {});
                        } else {
                          document.exitFullscreen().catch(() => {});
                        }
                      }
                      closeMenus();
                    }}
                    className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#34343a] hover:text-white"
                  >
                    <span>Toggle Fullscreen</span>
                    <span className="text-zinc-500 text-[11px]">F11</span>
                  </button>
                  {setGridVisible && (
                    <button
                      type="button"
                      onClick={() => {
                        setGridVisible((prev) => !prev);
                        closeMenus();
                      }}
                      className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#34343a] hover:text-white"
                    >
                      <span>Toggle Grid</span>
                      <span className="text-zinc-500 text-[11px]">{gridVisible ? "On" : "Off"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Help */}
            <div className="relative h-full flex items-center">
              <button
                type="button"
                onClick={() => toggleMenu("help")}
                onMouseEnter={() => handleMenuHover("help")}
                className={`px-2 py-0.5 rounded-[3px] text-zinc-300 hover:text-white cursor-pointer ${
                  openMenu === "help" ? "bg-[#34343a] text-white" : "hover:bg-white/[0.06]"
                }`}
              >
                Help
              </button>
              {openMenu === "help" && (
                <div className="absolute top-full left-0 mt-0.5 w-48 bg-[#252528] border border-white/[0.10] rounded-md shadow-2xl py-1 z-50 text-[12px] text-zinc-200">
                  <div className="px-3 py-1.5 font-medium text-white border-b border-white/[0.08]">
                    Sector Studio 3D
                  </div>
                  <div className="px-3 py-1 text-zinc-400 text-[11px]">
                    Shift+A: Adicionar Objeto<br />
                    W: Modo Seleção / Arraste: Caixa de seleção<br />
                    G: Mover / R: Girar<br />
                    Scroll: Zoom / Botão Meio: Orbit
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
