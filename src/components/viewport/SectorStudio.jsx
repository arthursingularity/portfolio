"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import SceneCanvas from "./SceneCanvas";
import ViewportHud from "./ViewportHud";
import ModelProperties from "./ModelProperties";
import TreeFolderSection from "./TreeFolderSection";
import TransformPopup from "./TransformPopup";
import FloorMarkingPopup from "../configPopups/FloorMarkingPopup";
import FpsCounter from "./FpsCounter";
import TopBar from "./TopBar";
import { useSectorState } from "./sectorState";
import { saveSectorGlb, importProjectFile } from "./exportGlb";
import LeftBar, { isModelResizable } from "./LeftBar";
import { Icon } from "@iconify/react";

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
        return (
          localStorage.getItem("sector_studio_project_name") ||
          "setor_principal"
        );
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
    setSelectedIds,
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
    joinItems,
    separateItem,
    removeItem,
    toggleVisibility,
    toggleMainFloor,
    loadTemplate,
    loadProject,
    undo,
    redo,
    copyItem,
    pasteItem,
  } = useSectorState();

  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const triggerImportProject = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, []);

  const handleImportFile = useCallback(
    async (file) => {
      if (!file) return;
      try {
        setSaveStatus("saving");
        setSaveMessage(`Carregando ${file.name}...`);
        const result = await importProjectFile(file);
        if (result.success && Array.isArray(result.items)) {
          loadProject({
            projectName: result.projectName,
            items: result.items,
          });
          if (result.projectName) {
            setProjectName(result.projectName);
          }
          setSaveStatus("success");
          setSaveMessage(
            `Projeto '${result.projectName}' carregado com sucesso (${result.items.length} objetos)!`
          );
          setTimeout(() => {
            setSaveStatus("idle");
            setSaveMessage("");
          }, 3500);
        } else {
          throw new Error(
            result.error || "Não foi possível carregar o projeto do arquivo."
          );
        }
      } catch (err) {
        console.error("Erro na importação:", err);
        setSaveStatus("error");
        setSaveMessage(err.message || "Falha ao importar arquivo.");
        setTimeout(() => {
          setSaveStatus("idle");
          setSaveMessage("");
        }, 4500);
      }
    },
    [loadProject]
  );


  const handleSaveScene = async (customFilename) => {
    if (saveStatus === "saving") return;
    try {
      setSaveStatus("saving");
      setSaveMessage("Salvando projeto .glb...");

      const nameToUse = (
        customFilename ||
        projectName ||
        "setor_principal"
      ).trim();
      const filename = nameToUse.toLowerCase().endsWith(".glb")
        ? nameToUse
        : `${nameToUse}.glb`;

      const projectData = {
        version: 2,
        format: "sector_studio_project",
        savedAt: new Date().toISOString(),
        projectName: nameToUse.replace(/\.glb$/i, ""),
        items,
      };

      await saveSectorGlb({
        exportGroup: exportGroupRef.current,
        filename,
        projectData,
      });

      setSaveStatus("success");
      setSaveMessage(`Projeto ${filename} salvo com sucesso!`);
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 3500);
    } catch (err) {
      console.error("Erro ao salvar cenário:", err);
      setSaveStatus("error");
      setSaveMessage(err.message || "Erro ao salvar projeto .glb");
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 4000);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingFile(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleImportFile(files[0]);
    }
  };

  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
  });
  const [axisLock, setAxisLock] = useState(null); // 'x' | 'y' | 'z' | null
  const [isModalGrab, setIsModalGrab] = useState(false);
  const viewportRef = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const targetRegistryRef = useRef({});

  // Se mudar de seleção enquanto em modo 'size' para um objeto que não permite alterar tamanho, reseta para 'select'
  useEffect(() => {
    if (transformMode === "size") {
      const activeTargets =
        selectedItems && selectedItems.length > 0
          ? selectedItems
          : selectedItem
          ? [selectedItem]
          : [];
      const canScale =
        activeTargets.length > 0 &&
        activeTargets.every((it) => isModelResizable(it));
      if (!canScale) {
        setTransformMode("select");
      }
    }
  }, [selectedItem, selectedItems, transformMode, setTransformMode]);

  const handleSetTransformMode = useCallback(
    (mode) => {
      setTransformMode(mode);
      setIsModalGrab(false);
      setAxisLock(null);
    },
    [setTransformMode]
  );

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
        if (selectedIds.length > 0 || selectedId) {
          e.preventDefault();
          copyItem(selectedId);
        }
      }
      // Ctrl + V (Cola o modelo selecionado)
      else if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        pasteItem();
      }
      // Ctrl + J (Juntar modelos selecionados - Blender Style)
      else if ((e.ctrlKey || e.metaKey) && (e.key === "j" || e.key === "J")) {
        e.preventDefault();
        joinItems();
      }
      // Ctrl + S (Salvar projeto .glb)
      else if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        handleSaveScene();
      }
      // Ctrl + O (Abrir / Importar projeto)
      else if ((e.ctrlKey || e.metaKey) && (e.key === "o" || e.key === "O")) {
        e.preventDefault();
        triggerImportProject();
      }
      // Shift + A (Menu de adicionar)
      else if (e.shiftKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setContextMenu({
          isOpen: true,
          x: lastMousePos.current.x || window.innerWidth / 3,
          y: lastMousePos.current.y || window.innerHeight / 3,
        });
      } else if (
        e.key === "w" ||
        e.key === "W" ||
        e.key === "b" ||
        e.key === "B"
      ) {
        e.preventDefault();
        setTransformMode("select");
        setIsModalGrab(false);
        setAxisLock(null);
      } else if (
        e.key === "g" ||
        e.key === "G" ||
        e.key === "t" ||
        e.key === "T"
      ) {
        e.preventDefault();
        setTransformMode("translate");
        setIsModalGrab(false);
        setAxisLock(null);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        setTransformMode("rotate");
        setIsModalGrab(false);
        setAxisLock(null);
      } else if (
        (e.key === "s" || e.key === "S") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const activeTargets =
          selectedItems && selectedItems.length > 0
            ? selectedItems
            : selectedItem
            ? [selectedItem]
            : [];
        const canScale =
          activeTargets.length > 0 &&
          activeTargets.every((it) => isModelResizable(it));

        if (canScale) {
          e.preventDefault();
          setIsModalGrab(false);
          setTransformMode("size");
          setAxisLock(null);
        }
      } else if (
        (e.key === "x" || e.key === "X") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const hasSelection = (selectedIds && selectedIds.length > 0) || selectedId;
        if (hasSelection && (transformMode === "translate" || isModalGrab)) {
          e.preventDefault();
          if (!isModalGrab) {
            setTransformMode("translate");
            setIsModalGrab(true);
            setAxisLock("x");
          }
        }
      } else if (
        (e.key === "y" || e.key === "Y") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const hasSelection = (selectedIds && selectedIds.length > 0) || selectedId;
        if (hasSelection && (transformMode === "translate" || isModalGrab)) {
          e.preventDefault();
          if (!isModalGrab) {
            setTransformMode("translate");
            setIsModalGrab(true);
            setAxisLock("y");
          }
        }
      } else if (
        (e.key === "z" || e.key === "Z") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const hasSelection = (selectedIds && selectedIds.length > 0) || selectedId;
        if (hasSelection && (transformMode === "translate" || isModalGrab)) {
          e.preventDefault();
          if (!isModalGrab) {
            setTransformMode("translate");
            setIsModalGrab(true);
            setAxisLock("z");
          }
        }
      } else if (
        (e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight") &&
        transformMode === "translate" &&
        (selectedIds.length > 0 || selectedId)
      ) {
        e.preventDefault();
        const step = 0.025;
        let deltaX = 0;
        let deltaY = 0; // vertical height in Three.js (Blender Z)
        let deltaZ = 0; // depth in Three.js (Blender Y)

        if (axisLock === "x") {
          deltaX = e.key === "ArrowRight" || e.key === "ArrowUp" ? step : -step;
        } else if (axisLock === "y") {
          // Y axis in Blender = depth (Three.js Z)
          deltaZ = e.key === "ArrowUp" || e.key === "ArrowRight" ? step : -step;
        } else if (axisLock === "z") {
          // Z axis in Blender = vertical height (Three.js Y)
          deltaY = e.key === "ArrowUp" || e.key === "ArrowRight" ? step : -step;
        } else {
          if (e.key === "ArrowLeft") deltaX = -step;
          if (e.key === "ArrowRight") deltaX = step;
          if (e.key === "ArrowUp") deltaZ = -step;
          if (e.key === "ArrowDown") deltaZ = step;
        }

        const activeTargets =
          selectedItems.length > 0
            ? selectedItems
            : selectedItem
            ? [selectedItem]
            : [];
        if (activeTargets.length > 1) {
          const updates = activeTargets.map((it) => ({
            id: it.id,
            position: [
              Math.round(((it.position?.[0] || 0) + deltaX) * 10000) / 10000,
              Math.round(((it.position?.[1] || 0) + deltaY) * 10000) / 10000,
              Math.round(((it.position?.[2] || 0) + deltaZ) * 10000) / 10000,
            ],
          }));
          updateTransforms(updates);
        } else if (activeTargets.length === 1) {
          const it = activeTargets[0];
          updateTransform(it.id, {
            position: [
              Math.round(((it.position?.[0] || 0) + deltaX) * 10000) / 10000,
              Math.round(((it.position?.[1] || 0) + deltaY) * 10000) / 10000,
              Math.round(((it.position?.[2] || 0) + deltaZ) * 10000) / 10000,
            ],
          });
        }
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "a" || e.key === "A")
      ) {
        e.preventDefault();
        setSelectedIds(
          items.filter((it) => it.type !== "floor" && !it.hidden).map((it) => it.id)
        );
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0 || selectedId) {
          removeItem(selectedId);
        }
      } else if (
        (e.shiftKey || e.ctrlKey || e.metaKey) &&
        (e.key === "d" || e.key === "D")
      ) {
        e.preventDefault();
        if (selectedIds.length > 0 || selectedId) {
          duplicateItem(selectedId);
        }
      } else if (e.key === "Escape") {
        if (axisLock !== null) {
          e.preventDefault();
          setAxisLock(null);
        } else {
          setSelectedId(null);
          setSelectedIds([]);
          setContextMenu((prev) => ({ ...prev, isOpen: false }));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedId,
    selectedIds,
    selectedItem,
    selectedItems,
    items,
    transformMode,
    axisLock,
    removeItem,
    duplicateItem,
    setTransformMode,
    setSelectedId,
    setSelectedIds,
    undo,
    redo,
    copyItem,
    pasteItem,
    updateTransform,
    updateTransforms,
  ]);

  // Prevent browser context menu on 3D canvas so right-click is dedicated to viewport panning
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    el.addEventListener("contextmenu", handleContextMenu);
    return () => {
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
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative w-screen h-screen overflow-hidden bg-[#111115] flex flex-col font-sans"
    >
      {/* ── Barra Superior Estilo Blender (Fica acima das 3 Seções) ── */}
      <TopBar
        projectName={projectName}
        setProjectName={setProjectName}
        saveStatus={saveStatus}
        onSave={() => handleSaveScene()}
        onImportProject={triggerImportProject}
        onNewProject={loadTemplate}
        onUndo={undo}
        onRedo={redo}
        onAddItem={addItem}
        onCopy={() => {
          if (selectedIds.length > 0 || selectedId) copyItem(selectedId);
        }}
        onPaste={pasteItem}
        onDuplicate={() => {
          if (selectedIds.length > 0 || selectedId) duplicateItem(selectedId);
        }}
        onDelete={() => {
          if (selectedIds.length > 0 || selectedId) removeItem(selectedId);
        }}
        onExportGlb={() => handleSaveScene()}
        onResetCamera={handleResetCamera}
        onSetCameraView={setCameraView}
        gridVisible={gridVisible}
        setGridVisible={setGridVisible}
        transformMode={transformMode}
        setTransformMode={handleSetTransformMode}
        selectedCount={selectedIds.length}
        onSelectAll={() =>
          setSelectedIds(
            items.filter((it) => it.type !== "floor" && !it.hidden).map((it) => it.id)
          )
        }
        onDeselectAll={() => setSelectedId(null)}
      />

      {/* ── As 3 Seções do Studio (Cenário 3D, Outliner e Inspector) ── */}
      <div className="flex-1 min-h-0 p-2 pt-2 grid grid-cols-[1fr_280px] grid-rows-[1fr_1fr] gap-2">
        {/* ── Seção Esquerda: Cenário 3D (Cobre a altura total - rows 1 e 2) ── */}
        <div
          ref={viewportRef}
          className="row-span-2 col-start-1 relative w-full h-full min-w-0 min-h-0 rounded-lg overflow-hidden border border-white/[0.08] bg-[#18181b]"
        >
          {/* Barra Lateral */}
          <LeftBar
            transformMode={transformMode}
            setTransformMode={handleSetTransformMode}
            selectedItem={selectedItem}
            selectedItems={selectedItems}
            onResetCamera={handleResetCamera}
            onAddItem={addItem}
            onJoinModels={joinItems}
            onDelete={() => {
              if (selectedIds.length > 0 || selectedId) removeItem(selectedId);
            }}
            isAddMenuOpen={contextMenu.isOpen}
            setIsAddMenuOpen={(open) =>
              setContextMenu((prev) => ({
                ...prev,
                isOpen: typeof open === "function" ? open(prev.isOpen) : open,
              }))
            }
          />

          {/* Indicador de FPS no Canto Superior Direito */}
          <FpsCounter />

          {/* HUD e Legenda na base do 3D */}
          <ViewportHud
            cellSize={cellSize}
            setCellSize={setCellSize}
            gridVisible={gridVisible}
            setGridVisible={setGridVisible}
            onResetCamera={handleResetCamera}
            onSetCameraView={setCameraView}
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
            setSelectedIds={setSelectedIds}
            onUpdateTransform={updateTransform}
            onUpdateTransforms={updateTransforms}
            onUpdateProps={updateProps}
            transformMode={transformMode}
            setTransformMode={handleSetTransformMode}
            axisLock={axisLock}
            setAxisLock={setAxisLock}
            isModalGrab={isModalGrab}
            setIsModalGrab={setIsModalGrab}
            snapToGrid={snapToGrid}
            controlsRef={controlsRef}
            exportGroupRef={exportGroupRef}
            targetRegistryRef={targetRegistryRef}
          />

          {/* ── Popups Fixos (Canto Inferior Direito do Cenário 3D) ── */}
          {(selectedId || (selectedIds && selectedIds.length > 0)) && (
            <div className="absolute bottom-1 right-1 z-30 flex flex-col space-y-1.5 items-end pointer-events-none">
              {(() => {
                const floor =
                  selectedItem?.type === "floor"
                    ? selectedItem
                    : selectedItems?.find((it) => it.type === "floor");
                if (!floor || !floor.props?.markingMode) return null;
                return (
                  <div className="pointer-events-auto">
                    <FloorMarkingPopup
                      item={floor}
                      onUpdateProps={updateProps}
                    />
                  </div>
                );
              })()}
              <div className="pointer-events-auto">
                <TransformPopup
                  selectedItem={selectedItem}
                  selectedItems={selectedItems}
                  allItems={items}
                  onUpdateTransform={updateTransform}
                  onUpdateTransforms={updateTransforms}
                  targetRegistryRef={targetRegistryRef}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Seção Direita Superior: TreeFolderSection ── */}
        <div className="col-start-2 row-start-1 relative w-full h-full min-h-0 min-w-0 rounded-lg overflow-hidden border border-white/[0.08] bg-[#1e1e21] flex flex-col">
          <TreeFolderSection
            items={items}
            selectedId={selectedId}
            selectedIds={selectedIds}
            onSelect={(id, isMulti) => {
              if (Array.isArray(id)) {
                setSelectedIds(id);
              } else {
                setSelectedId(id, isMulti);
              }
              setTransformMode("translate");
            }}
            onSelectMultiple={(ids) => {
              setSelectedIds(ids);
              setTransformMode("translate");
            }}
            onToggleVisibility={toggleVisibility}
            onDuplicate={duplicateItem}
            onUpdateName={updateName}
            onUpdateProps={updateProps}
            onToggleMainFloor={toggleMainFloor}
            onSave={handleSaveScene}
            onImportProject={triggerImportProject}
            saveStatus={saveStatus}
            saveMessage={saveMessage}
            projectName={projectName}
            setProjectName={setProjectName}
          />
        </div>

        {/* ── Seção Direita Inferior: ModelProperties ── */}
        <div className="col-start-2 row-start-2 relative w-full h-full min-h-0 min-w-0 rounded-lg overflow-hidden border border-white/[0.08] bg-[#1e1e21] flex flex-col">
          <ModelProperties
            item={selectedItem}
            items={items}
            onUpdateTransform={updateTransform}
            onUpdateProps={updateProps}
            onUpdateName={updateName}
            onDuplicate={duplicateItem}
            onSeparateItem={separateItem}
            onDelete={removeItem}
            onClose={() => setSelectedId(null)}
            onMultiplyColumns={multiplyColumns}
          />
        </div>
      </div>

      {/* Input de arquivo invisível para Importar Projeto */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportFile(file);
        }}
      />

      {/* Overlay minimalista de Drag & Drop */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm border-2 border-dashed border-blue-400/80 m-3 rounded-xl flex flex-col items-center justify-center gap-2.5 pointer-events-none select-none">
          <Icon
            icon="carbon:cloud-upload"
            className="text-blue-400 text-5xl animate-bounce"
          />
          <div className="text-white text-sm font-medium">
            Solte o arquivo do projeto (.glb) aqui
          </div>
          <div className="text-white/50 text-[11px]">
            O cenário e todas as configurações dos modelos serão restaurados.
          </div>
        </div>
      )}

      {/* Toast Notification (Vercel Style) */}
      {saveStatus !== "idle" && saveMessage && (
        <div className="absolute bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2 rounded-md bg-[#18181b]/95 border border-white/[0.12] text-xs shadow-2xl backdrop-blur-md select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          {saveStatus === "saving" && (
            <Icon
              icon="carbon:progress-bar-round"
              className="animate-spin text-blue-400 text-sm"
            />
          )}
          {saveStatus === "success" && (
            <Icon
              icon="carbon:checkmark-filled"
              className="text-emerald-400 text-sm"
            />
          )}
          {saveStatus === "error" && (
            <Icon
              icon="carbon:warning-filled"
              className="text-red-400 text-sm"
            />
          )}
          <span className="text-white/90 font-medium">{saveMessage}</span>
        </div>
      )}
    </div>
  );
}
