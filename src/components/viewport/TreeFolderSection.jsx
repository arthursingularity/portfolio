"use client";

import React, { useState, useMemo } from "react";
import { Search } from "@carbon/icons-react";
import { Icon } from "@iconify/react";

/**
 * Blender-style Scene Outliner (Árvore de Coleções e Objetos)
 * Replicates the exact Outliner panel seen in Blender:
 * - Scene Collection tree hierarchy
 * - Object selection sync with 3D viewport
 * - Real-time Search filter
 * - Eye icon toggle for hide/show in 3D scene
 * - Quick delete / duplicate actions
 */
export default function TreeFolderSection({
  items = [],
  selectedId,
  selectedIds = [],
  onSelect,
  onToggleVisibility,
  onDuplicate,
  onUpdateName,
  onSave,
  saveStatus = "idle",
  saveMessage = "",
  projectName = "setor_principal",
  setProjectName = () => {},
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionExpanded, setCollectionExpanded] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName || "setor_principal");
  const [editingItemId, setEditingItemId] = useState(null);
  const [tempItemName, setTempItemName] = useState("");

  const commitItemName = (id, currentName) => {
    const val = tempItemName.trim();
    if (val && val !== currentName) {
      onUpdateName?.(id, val);
    }
    setEditingItemId(null);
  };

  const startEditing = (id, currentName) => {
    setEditingItemId(id);
    setTempItemName(currentName || "");
  };

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (it) =>
        it.name?.toLowerCase().includes(q) ||
        it.type?.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  // Ícone padrão dos objetos (Blender Theme)
  const getItemIcon = () => (
    <Icon icon="at-icons:cube" className="text-[14px]" />
  );

  return (
    <aside className="w-full flex-1 min-h-0 flex flex-col select-none overflow-hidden">
      <div className="h-full flex flex-col bg-[#1e1e21] overflow-hidden">
        {/* Search Bar */}
        <div className="px-2 py-1.5 bg-[#141416]/80 border-b border-white/[0.06] flex items-center gap-1.5 shrink-0">
          <Search size={13} className="text-white/40 shrink-0" />
          <input
            type="text"
            placeholder="Filtrar objetos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[11px] text-white/90 placeholder:text-white/30 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[10px] text-white/40 hover:text-white px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tree View (Blender Scene Collection) */}
        <div className="flex-1 min-h-0 overflow-y-auto text-[11px] py-1">
          {/* Root: Scene Collection */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-white/60">
            <Icon
              icon={"ant-design:folder-filled"}
              className="text-blue-400 text-[17px] shrink-0"
            />
            {isEditingName ? (
              <input
                type="text"
                value={tempName}
                autoFocus
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => {
                  const val = tempName.trim() || "setor_principal";
                  setProjectName(val);
                  setIsEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = tempName.trim() || "setor_principal";
                    setProjectName(val);
                    setIsEditingName(false);
                  } else if (e.key === "Escape") {
                    setTempName(projectName);
                    setIsEditingName(false);
                  }
                }}
                className="bg-black/60 border border-blue-400/50 rounded px-1 py-0.5 text-[11px] text-white outline-none w-full"
              />
            ) : (
              <span
                onClick={() => {
                  setTempName(projectName);
                  setIsEditingName(true);
                }}
                title="Clique para renomear"
                className="font-medium text-white/80 text-[11px] cursor-pointer hover:text-white truncate"
              >
                {projectName ? `${projectName}.glb` : "setor_principal.glb"}
              </span>
            )}
          </div>

          {/* Sub: Collection (Setor) */}
          <div className="flex items-center justify-between px-4 py-1 text-white/50 hover:bg-white/[0.03]">
            <div
              className="flex items-center gap-1.5 cursor-pointer"
              onClick={() => setCollectionExpanded(!collectionExpanded)}
            >
              {collectionExpanded ? (
                <Icon
                  icon={"akar-icons:chevron-right"}
                  className="text-white text-[13px]"
                />
              ) : (
                <Icon
                  icon={"akar-icons:chevron-down"}
                  className="text-white text-[13px]"
                />
              )}
              {collectionExpanded ? (
                <Icon
                  icon={"ant-design:folder-open-filled"}
                  className="text-blue-400 text-[17px]"
                />
              ) : (
                <Icon
                  icon={"ant-design:folder-filled"}
                  className="text-blue-400 text-[17px]"
                />
              )}
              <span
                className={`${collectionExpanded ? "text-white" : "text-white/70"}`}
              >
                Setor Principal
              </span>
            </div>
          </div>

          {/* Items Tree */}
          {collectionExpanded && (
            <div className="flex flex-col">
              {filteredItems.length === 0 ? (
                <div className="px-8 py-3 text-white/30 text-[10px] italic ">
                  {searchQuery
                    ? "Nenhum objeto corresponde à busca."
                    : "Nenhum objeto na cena. Adicione pelo menu à esquerda."}
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected =
                    selectedIds && selectedIds.length > 0
                      ? selectedIds.includes(item.id)
                      : item.id === selectedId;
                  const isHidden = item.hidden;

                  return (
                    <div
                      key={item.id}
                      onClick={(e) =>
                        onSelect(item.id, e.shiftKey || e.ctrlKey || e.metaKey)
                      }
                      className={`group flex items-center justify-between pl-9 pr-2.5 py-1 cursor-pointer border-l-2 ${
                        isSelected
                          ? "bg-[#284968] text-white border-blue-400"
                          : "hover:bg-white/[0.06] text-white/70 border-transparent"
                      }`}
                    >
                      {/* Item icon and name */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getItemIcon(item.type)}
                        {editingItemId === item.id ? (
                          <input
                            type="text"
                            value={tempItemName}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setTempItemName(e.target.value)}
                            onBlur={() => commitItemName(item.id, item.name)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                                commitItemName(item.id, item.name);
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingItemId(null);
                              }
                            }}
                            className="bg-black/90 border border-blue-400 rounded px-1.5 py-0.5 text-[11px] text-white outline-none w-full font-medium"
                          />
                        ) : (
                          <span
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              startEditing(item.id, item.name);
                            }}
                            title="Clique duas vezes para renomear"
                            className={`truncate text-[11px] cursor-pointer hover:underline ${
                              isHidden
                                ? "opacity-50"
                                : isSelected
                                ? "font-medium text-white"
                                : "text-white/80"
                            }`}
                          >
                            {item.name}
                          </span>
                        )}
                      </div>

                      {/* Quick Actions (Rename & Eye toggle visibility) */}
                      <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100">
                        {/* Botão de Renomear */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(item.id, item.name);
                          }}
                          className="p-1 rounded hover:bg-white/20 text-white/50 hover:text-white cursor-pointer"
                          title="Renomear modelo"
                        >
                          <Icon icon="lucide:pencil" className="text-[11px]" />
                        </button>

                        {/* Toggle 3D Visibility */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility(item.id);
                          }}
                          className={`p-0.5 rounded hover:bg-white/20 cursor-pointer ${
                            isHidden
                              ? "text-red-400"
                              : isSelected
                                ? "text-white"
                                : "text-white/60 hover:text-white"
                          }`}
                          title={
                            isHidden
                              ? "Objeto oculto (clique para exibir)"
                              : "Ocultar objeto na cena"
                          }
                        >
                          {isHidden ? (
                            <Icon
                              icon={"carbon:view-off-filled"}
                              className="text-white text-[15px]"
                            />
                          ) : (
                            <Icon
                              icon={"carbon:view-filled"}
                              className="text-white text-[15px]"
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 mt-auto">
          {saveMessage && (
            <div
              className={`text-[10px] w-full text-right px-3 truncate ${
                saveStatus === "error"
                  ? "text-red-400"
                  : saveStatus === "success"
                  ? "text-emerald-400"
                  : "text-white/60"
              }`}
              title={saveMessage}
            >
              {saveMessage}
            </div>
          )}
          <button
            type="button"
            onClick={() => onSave && onSave(projectName)}
            disabled={saveStatus === "saving"}
            className={`ml-auto justify-end bg-blue-400 text-black text-[13px] px-4 py-1 rounded mb-2 mr-2 cursor-pointer hover:opacity-80 flex items-center gap-1.5 ${
              saveStatus === "saving" ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {saveStatus === "saving" ? (
              <>
                <span className="w-2.5 h-2.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : saveStatus === "success" ? (
              <span>✓ Salvo!</span>
            ) : (
              <span>Salvar</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
