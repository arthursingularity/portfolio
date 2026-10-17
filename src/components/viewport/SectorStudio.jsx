"use client";

import React, { useState, useRef, useEffect } from "react";
import SceneCanvas from "./SceneCanvas";
import ViewportHud from "./ViewportHud";
import ItemPalette from "./ItemPalette";
import ItemInspector from "./ItemInspector";
import TreeFolderSection from "./TreeFolderSection";
import TransformPopup from "./TransformPopup";
import TopBar from "./TopBar";
import { useSectorState } from "./sectorState";
import { saveSectorGlb } from "./exportGlb";

export default function SectorStudio() {
  const [cellSize, setCellSize] = useState(1);
  const [gridVisible, setGridVisible] = useState(true);
  const controlsRef = useRef(null);
  const exportGroupRef = useRef(null);

  const [saveStatus, setSaveStatus] = useState("idle"); // "idle" | "saving" | "success" | "error"
  const [saveMessage, setSaveMessage] = useState("");
  const [projectName, setProjectName] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("sector_studio_project_name") || "setor_principal";
      } catch (e) {
        return "setor_principal";
      }
    }
    return "setor_principal";
  });

  useEffect(() => {
    if (typeof window !== "undefined" && projectName) {
      try {
        localStorage.setItem("sector_studio_project_name", projectName);
      } catch (e) {
        console.warn("Erro ao salvar nome no localStorage:", e);
      }
    }
  }, [projectName]);

  const {
    items,
    selectedId,
    selectedIds,
    setSelectedId,
    selectedItem,
    selectedItems,
    transformMode,
    setTransformMode,
    snapToGrid,
    setSnapToGrid,
    addItem,
    updateTransform,
    updateTransforms,
    updateProps,
    updateName,
    duplicateItem,
    multiplyColumns,
    removeItem,
    toggleVisibility,
    undo,
    redo,
    copyItem,
    pasteItem,
  } = useSectorState();

  const handleSaveScene = async (customFilename) => {
    if (saveStatus === "saving") return;
    try {
      setSaveStatus("saving");
      setSaveMessage("Gerando GLB...");

      const nameToUse = (customFilename || projectName || "setor_principal").trim();
      const filename = nameToUse.toLowerCase().endsWith(".glb")
        ? nameToUse
        : `${nameToUse}.glb`;

      const result = await saveSectorGlb({
        exportGroup: exportGroupRef.current,
        filename,
      });

      setSaveStatus("success");
      setSaveMessage(`Download de ${filename} concluído!`);
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 3500);
    } catch (err) {
      console.error("Erro ao salvar cenário:", err);
      setSaveStatus("error");
      setSaveMessage(err.message || "Erro ao salvar .glb");
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 4000);
    }
  };

  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
  });
  const viewportRef = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Keyboard shortcuts (Blender-like + Undo/Copy/Paste)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Ctrl + Z (Undo / Retroceder uma ação) & Ctrl + Shift + Z / Ctrl + Y (Redo)
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        redo();
      }
      // Ctrl + C (Copia o modelo selecionado)
      else if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        if (selectedId) {
          e.preventDefault();
          copyItem(selectedId);
        }
      }
      // Ctrl + V (Cola o modelo selecionado)
      else if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        pasteItem();
      }
      // Shift + A (Menu de adicionar)
      else if (e.shiftKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setContextMenu({
          isOpen: true,
          x: lastMousePos.current.x || window.innerWidth / 3,
          y: lastMousePos.current.y || window.innerHeight / 3,
        });
      } else if (e.key === "g" || e.key === "G" || e.key === "t" || e.key === "T") {
        setTransformMode("translate");
      } else if (e.key === "r" || e.key === "R") {
        setTransformMode("rotate");
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          removeItem(selectedId);
        }
      } else if (
        (e.shiftKey || e.ctrlKey || e.metaKey) &&
        (e.key === "d" || e.key === "D")
      ) {
        e.preventDefault();
        if (selectedId) {
          duplicateItem(selectedId);
        }
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedId,
    removeItem,
    duplicateItem,
    setTransformMode,
    setSelectedId,
    undo,
    redo,
    copyItem,
    pasteItem,
  ]);

  // Viewport right-click & mouse tracking for Blender context menu
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;

    const handlePointerDown = (e) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      if (e.button === 2) {
        startX = e.clientX;
        startY = e.clientY;
      }
    };

    const handlePointerMove = (e) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      // Open context menu if user clicked in place (< 6px movement)
      if (dist < 6) {
        setContextMenu({
          isOpen: true,
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    el.addEventListener("pointerdown", handlePointerDown);
    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("contextmenu", handleContextMenu);

    return () => {
      el.removeEventListener("pointerdown", handlePointerDown);
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  const setCameraView = (viewType) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = controls.object;

    switch (viewType) {
      case "top":
        camera.position.set(0, 24, 0.001);
        controls.target.set(0, 0, 0);
        break;
      case "front":
        camera.position.set(0, 6, 22);
        controls.target.set(0, 0, 0);
        break;
      case "side":
        camera.position.set(22, 6, 0);
        controls.target.set(0, 0, 0);
        break;
      case "isometric":
      default:
        camera.position.set(12, 10, 14);
        controls.target.set(0, 1.2, 0);
        break;
    }
    camera.updateProjectionMatrix();
    controls.update();
  };

  const handleResetCamera = () => {
    setCameraView("isometric");
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#111115] flex flex-col select-none font-sans">
      {/* ── Barra Superior Estilo Blender (Fica acima das 3 Seções) ── */}
      <TopBar
        projectName={projectName}
        setProjectName={setProjectName}
        saveStatus={saveStatus}
        onSave={() => handleSaveScene()}
        onUndo={undo}
        onRedo={redo}
        onAddItem={addItem}
        onDuplicate={() => {
          if (selectedId) duplicateItem(selectedId);
        }}
        onDelete={() => {
          if (selectedId) removeItem(selectedId);
        }}
        onExportGlb={() => handleSaveScene()}
        onResetCamera={handleResetCamera}
        onSetCameraView={setCameraView}
        gridVisible={gridVisible}
        setGridVisible={setGridVisible}
      />

      {/* ── As 3 Seções do Studio (Cenário 3D, Outliner e Inspector) ── */}
      <div className="flex-1 min-h-0 p-2 pt-2 grid grid-cols-[1fr_280px] grid-rows-[1fr_1.2fr] gap-2">
        {/* ── Seção Esquerda: Cenário 3D (Cobre a altura total - rows 1 e 2) ── */}
        <div
          ref={viewportRef}
          className="row-span-2 col-start-1 relative w-full h-full min-w-0 min-h-0 rounded-lg overflow-hidden border border-white/[0.08] bg-[#18181b]"
        >
          {/* HUD e Legenda na base do 3D */}
          <ViewportHud
            cellSize={cellSize}
            setCellSize={setCellSize}
            gridVisible={gridVisible}
            setGridVisible={setGridVisible}
            onResetCamera={handleResetCamera}
            onSetCameraView={setCameraView}
          />

          {/* Menu de Contexto Blender (Clique Direito no 3D ou Shift+A) */}
          <ItemPalette
            isOpen={contextMenu.isOpen}
            position={contextMenu}
            onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
            onAddItem={(type) => {
              addItem(type);
              setContextMenu((prev) => ({ ...prev, isOpen: false }));
            }}
            itemCount={items.length}
          />

          {/* Canvas 3D centrado perfeitamente no lado esquerdo */}
          <SceneCanvas
            cellSize={cellSize}
            sectionSize={5}
            gridVisible={gridVisible}
            items={items}
            selectedId={selectedId}
            selectedIds={selectedIds}
            selectedItems={selectedItems}
            onSelect={setSelectedId}
            onUpdateTransform={updateTransform}
            onUpdateTransforms={updateTransforms}
            transformMode={transformMode}
            snapToGrid={snapToGrid}
            controlsRef={controlsRef}
            exportGroupRef={exportGroupRef}
          />

          {/* ── Popup Fixo de Posição e Rotação (Canto Inferior Direito do Cenário 3D) ── */}
          {(selectedId || (selectedIds && selectedIds.length > 0)) && (
            <TransformPopup
              selectedItem={selectedItem}
              selectedItems={selectedItems}
              onUpdateTransform={updateTransform}
              onUpdateTransforms={updateTransforms}
            />
          )}
        </div>

        {/* ── Seção Direita Superior: TreeFolderSection ── */}
        <div className="col-start-2 row-start-1 relative w-full h-full min-h-0 min-w-0 rounded-lg overflow-hidden border border-white/[0.08] bg-[#1e1e21] flex flex-col">
          <TreeFolderSection
            items={items}
            selectedId={selectedId}
            selectedIds={selectedIds}
            onSelect={(id, isMulti) => {
              setSelectedId(id, isMulti);
              setTransformMode("translate");
            }}
            onToggleVisibility={toggleVisibility}
            onDuplicate={duplicateItem}
            onUpdateName={updateName}
            onSave={handleSaveScene}
            saveStatus={saveStatus}
            saveMessage={saveMessage}
            projectName={projectName}
            setProjectName={setProjectName}
          />
        </div>

        {/* ── Seção Direita Inferior: ItemInspector ── */}
        <div className="col-start-2 row-start-2 relative w-full h-full min-h-0 min-w-0 rounded-lg overflow-hidden border border-white/[0.08] bg-[#1e1e21] flex flex-col">
          <ItemInspector
            item={selectedItem}
            onUpdateTransform={updateTransform}
            onUpdateProps={updateProps}
            onUpdateName={updateName}
            onDuplicate={duplicateItem}
            onDelete={removeItem}
            onClose={() => setSelectedId(null)}
            onMultiplyColumns={multiplyColumns}
          />
        </div>
      </div>
    </div>
  );
}
