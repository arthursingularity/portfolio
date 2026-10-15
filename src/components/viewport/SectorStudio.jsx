"use client";

import React, { useState, useRef, useEffect } from "react";
import SceneCanvas from "./SceneCanvas";
import ViewportHud from "./ViewportHud";
import ItemPalette from "./ItemPalette";
import ItemInspector from "./ItemInspector";
import SceneOutliner from "./SceneOutliner";
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
    setSelectedId,
    selectedItem,
    transformMode,
    setTransformMode,
    snapToGrid,
    setSnapToGrid,
    addItem,
    updateTransform,
    updateProps,
    updateName,
    duplicateItem,
    removeItem,
    toggleVisibility,
    clearAll,
    loadTemplate,
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

  // Keyboard shortcuts (Blender-like)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "g" || e.key === "G" || e.key === "t" || e.key === "T") {
        setTransformMode("translate");
      } else if (e.key === "r" || e.key === "R") {
        setTransformMode("rotate");
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          removeItem(selectedId);
        }
      } else if (
        (e.shiftKey || e.ctrlKey) &&
        (e.key === "d" || e.key === "D")
      ) {
        e.preventDefault();
        if (selectedId) {
          duplicateItem(selectedId);
        }
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, removeItem, duplicateItem, setTransformMode, setSelectedId]);

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
    <div className="relative w-screen h-screen overflow-hidden bg-[#38383c] flex flex-row select-none">
      {/* ── Lado Esquerdo: Cenário 3D (Ocupa todo o espaço restante e centraliza o grid nele) ── */}
      <div className="relative flex-1 h-full min-w-0 overflow-hidden">
        {/* HUD e Legenda na base do 3D */}
        <ViewportHud
          cellSize={cellSize}
          setCellSize={setCellSize}
          gridVisible={gridVisible}
          setGridVisible={setGridVisible}
          onResetCamera={handleResetCamera}
          onSetCameraView={setCameraView}
        />

        {/* Menu de Modelos flutuante à esquerda */}
        <ItemPalette
          onAddItem={addItem}
          transformMode={transformMode}
          setTransformMode={setTransformMode}
          snapToGrid={snapToGrid}
          setSnapToGrid={setSnapToGrid}
          onLoadTemplate={loadTemplate}
          onClearAll={clearAll}
          itemCount={items.length}
        />

        {/* Canvas 3D centrado perfeitamente no lado esquerdo */}
        <SceneCanvas
          cellSize={cellSize}
          sectionSize={5}
          gridVisible={gridVisible}
          items={items}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdateTransform={updateTransform}
          transformMode={transformMode}
          snapToGrid={snapToGrid}
          controlsRef={controlsRef}
          exportGroupRef={exportGroupRef}
        />
      </div>

      {/* ── Lado Direito: Barra da Estrutura do Projeto (300px Fixos) ── */}
      <div className="w-[280px] h-full shrink-0 flex flex-col bg-[#1e1e21] border-l border-white/10 z-20 overflow-hidden">
        <SceneOutliner
          items={items}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setTransformMode("translate");
          }}
          onToggleVisibility={toggleVisibility}
          onDuplicate={duplicateItem}
          onSave={handleSaveScene}
          saveStatus={saveStatus}
          saveMessage={saveMessage}
          projectName={projectName}
          setProjectName={setProjectName}
        />

        {selectedItem && (
          <ItemInspector
            item={selectedItem}
            onUpdateTransform={updateTransform}
            onUpdateProps={updateProps}
            onUpdateName={updateName}
            onDuplicate={duplicateItem}
            onDelete={removeItem}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}
