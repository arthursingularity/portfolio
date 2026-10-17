import { useState, useEffect, useCallback, useRef } from "react";
import * as THREE from "three";

const STORAGE_KEY = "sector_studio_scene_data_v3";
const CLIPBOARD_KEY = "sector_studio_clipboard_v1";

// Cenário padrão: Apenas o Piso
export const WAREHOUSE_TEMPLATE = [
  {
    id: "floor-main",
    type: "floor",
    name: "Piso",
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    props: { width: 16, depth: 14, thickness: 0.08, showDemarcation: true },
  },
];

export function useSectorState() {
  const [items, setItems] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn("Erro ao ler cenário do localStorage:", err);
      }
    }
    return WAREHOUSE_TEMPLATE;
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const selectedId = selectedIds[selectedIds.length - 1] || null;
  const [transformMode, setTransformMode] = useState("translate"); // 'translate' | 'rotate'
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Undo / Redo History Stacks
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const lastStateRef = useRef(null);

  // Copy / Paste Clipboard
  const clipboardRef = useRef(null);

  // Selection handler supporting single and multi-selection (Shift/Ctrl + Click)
  const setSelectedId = useCallback((id, isMulti = false) => {
    if (id === null || id === undefined) {
      setSelectedIds([]);
      return;
    }
    if (isMulti) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  }, []);

  // Helper to push snapshot before state mutation
  const pushHistory = useCallback((currentItems) => {
    if (!currentItems || currentItems.length === 0) return;
    const serialized = JSON.stringify(currentItems);
    if (serialized === lastStateRef.current) return;
    lastStateRef.current = serialized;

    pastRef.current.push(JSON.parse(serialized));
    if (pastRef.current.length > 50) {
      pastRef.current.shift();
    }
    futureRef.current = [];
  }, []);

  // Initialize clipboard from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedClip = localStorage.getItem(CLIPBOARD_KEY);
        if (savedClip) {
          clipboardRef.current = JSON.parse(savedClip);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Auto-save to localStorage whenever items change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (err) {
        console.warn("Erro ao persistir cenário no localStorage:", err);
      }
    }
  }, [items]);

  // Add new item to center of scene or offset
  const addItem = useCallback(
    (type) => {
      pushHistory(items);
      const timestamp = Date.now();
      let newItem = {
        id: `${type}-${timestamp}`,
        type,
        name: `${type.toUpperCase()} #${Math.floor(Math.random() * 900 + 100)}`,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        props: {},
      };

      switch (type) {
        case "rack":
          newItem.name = "Porta-Paletes";
          newItem.position = [0, 0, 0];
          newItem.props = { levels: 3, width: 2.8, depth: 1.1, height: 3.6 };
          break;
        case "pallet":
          newItem.name = "Pallet Madeira";
          newItem.position = [0, 0, 0];
          newItem.props = { width: 1.2, depth: 1.0, height: 0.14 };
          break;
        case "cargo_red":
          newItem.name = "Carga Vermelha";
          newItem.position = [0, 0, 0];
          newItem.props = { layers: 3 };
          break;
        case "cargo_gray":
          newItem.name = "Carga Cinza";
          newItem.position = [0, 0, 0];
          newItem.props = { layers: 4 };
          break;
        case "floor":
          newItem.name = "Piso";
          newItem.position = [0, 0, 0];
          newItem.props = { width: 10, depth: 10, thickness: 0.1, showDemarcation: true };
          break;
        case "forklift":
          newItem.name = "Empilhadeira";
          newItem.position = [0, 0, 0];
          newItem.props = {};
          break;
        case "column":
          newItem.name = "Coluna Estrutural";
          newItem.position = [0, 0, 0];
          newItem.props = { height: 4.5, size: 0.5 };
          break;
        case "box":
          newItem.name = "Caixas Brancas";
          newItem.position = [0, 0, 0];
          newItem.props = {
            columns: 1,
            maxHeight: 6,
            rail: false,
            trilho: false,
            varal: false,
            colorSeed: Math.random(),
            boxColor: "#E0E0E0",
            selectedColors: ["#E0E0E0"],
            boxColors: ["#E0E0E0", "#E0E0E0", "#E0E0E0", "#E0E0E0", "#E0E0E0", "#E0E0E0"],
          };
          break;
        default:
          break;
      }

      setItems((prev) => [...prev, newItem]);
      setSelectedIds([newItem.id]);
      setTransformMode("translate");
    },
    [items, pushHistory]
  );

  // Update single item transforms
  const updateTransform = useCallback(
    (id, { position, rotation }) => {
      pushHistory(items);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              position: position || item.position,
              rotation: rotation || item.rotation,
            }
            : item
        )
      );
    },
    [items, pushHistory]
  );

  // Batch update multiple item transforms simultaneously
  const updateTransforms = useCallback(
    (updates) => {
      if (!updates || updates.length === 0) return;
      pushHistory(items);
      setItems((prev) =>
        prev.map((item) => {
          const match = Array.isArray(updates)
            ? updates.find((u) => u.id === item.id)
            : updates[item.id];
          if (match) {
            return {
              ...item,
              position: match.position || item.position,
              rotation: match.rotation || item.rotation,
            };
          }
          return item;
        })
      );
    },
    [items, pushHistory]
  );

  // Update item custom properties
  const updateProps = useCallback(
    (id, propUpdates) => {
      pushHistory(items);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              props: { ...item.props, ...propUpdates },
            }
            : item
        )
      );
    },
    [items, pushHistory]
  );

  // Update item name
  const updateName = useCallback(
    (id, name) => {
      pushHistory(items);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, name } : item))
      );
    },
    [items, pushHistory]
  );

  // Duplicate item (supports single and multi-selection)
  const duplicateItem = useCallback(
    (id) => {
      const idsToDup =
        selectedIds.length > 1 && (!id || selectedIds.includes(id))
          ? selectedIds
          : id
          ? [id]
          : selectedIds;

      if (idsToDup.length === 0) return;

      pushHistory(items);
      const timestamp = Date.now();
      const newItems = [];
      const newIds = [];

      idsToDup.forEach((targetId, idx) => {
        const target = items.find((it) => it.id === targetId);
        if (!target) return;
        const newId = `${target.type}-${timestamp}-${idx}`;
        newIds.push(newId);
        newItems.push({
          ...JSON.parse(JSON.stringify(target)),
          id: newId,
          name: target.name?.includes("(Cópia)")
            ? target.name
            : `${target.name} (Cópia)`,
          position: [
            Math.round((target.position[0] + 1.0) * 100) / 100,
            target.position[1],
            Math.round((target.position[2] + 1.0) * 100) / 100,
          ],
          props: {
            ...(target.props ? JSON.parse(JSON.stringify(target.props)) : {}),
            colorSeed: Math.random(),
          },
        });
      });

      if (newItems.length > 0) {
        setItems((prev) => [...prev, ...newItems]);
        setSelectedIds(newIds);
        setTransformMode("translate");
      }
    },
    [items, selectedIds, pushHistory]
  );

  // Multiplicar colunas de BoxModel lateralmente conectando os varais
  const multiplyColumns = useCallback(
    (id, count = 2) => {
      const target = items.find((it) => it.id === id);
      if (!target || count < 2) return;

      pushHistory(items);

      const CAIXA_LARGURA = 0.298096 * 1.95; // 0.5812872
      const GAP_X = 0.003; // Mesmo tamanho do gap vertical entre as caixas da mesma coluna (GAP_Y)
      const PASSO_COLUNA = CAIXA_LARGURA + GAP_X;
      const rot = target.rotation || [0, 0, 0];
      const dir = new THREE.Vector3(PASSO_COLUNA, 0, 0).applyEuler(
        new THREE.Euler(rot[0] || 0, rot[1] || 0, rot[2] || 0)
      );

      const rawBaseName = (target.name || "Caixas Brancas")
        .replace(/\s*\d+$/, "")
        .trim();
      const baseName = rawBaseName || "Caixas Brancas";

      const now = Date.now();

      const hasRail = Boolean(target.props?.rail || target.props?.trilho);
      const hasVaral = Boolean(hasRail && target.props?.varal);

      // Atualiza o item original para ser a Coluna 1 do grupo
      const updatedOriginal = {
        ...target,
        name: target.name?.match(/\s+\d+$/) ? target.name : `${baseName} 1`,
        props: {
          ...target.props,
          rail: hasRail,
          trilho: hasRail,
          varal: hasVaral,
          connectedLeft: hasRail ? false : Boolean(target.props?.connectedLeft),
          connectedRight: hasRail ? true : Boolean(target.props?.connectedRight),
        },
      };

      // Cria as count - 1 novas colunas independentes à direita
      const newItems = [];
      const newIds = [target.id];
      for (let i = 1; i < count; i++) {
        const colPos = [
          Math.round((target.position[0] + i * dir.x) * 10000) / 10000,
          target.position[1],
          Math.round((target.position[2] + i * dir.z) * 10000) / 10000,
        ];

        const isLast = i === count - 1;
        const colId = `box-${now}-${i}`;
        newIds.push(colId);

        newItems.push({
          id: colId,
          type: "box",
          name: `${baseName} ${i + 1}`,
          position: colPos,
          rotation: [...rot],
          props: {
            ...JSON.parse(JSON.stringify(target.props || {})),
            colorSeed: Math.random(),
            rail: hasRail,
            trilho: hasRail,
            varal: hasVaral,
            connectedLeft: hasRail ? true : false,
            connectedRight: hasRail ? !isLast : false,
          },
        });
      }

      setItems((prev) => {
        const updated = prev.map((it) => (it.id === id ? updatedOriginal : it));
        return [...updated, ...newItems];
      });

      // Seleciona todas as colunas multiplicadas para facilitar movimentação conjunta
      setSelectedIds(newIds);
    },
    [items, pushHistory]
  );

  // Copy item to clipboard (Ctrl + C) - supports multiple items
  const copyItem = useCallback(
    (id) => {
      const idsToCopy =
        selectedIds.length > 1 && (!id || selectedIds.includes(id))
          ? selectedIds
          : id
          ? [id]
          : selectedIds;

      const targetList = items.filter((it) => idsToCopy.includes(it.id));
      if (targetList.length === 0) return null;

      const copy = JSON.parse(JSON.stringify(targetList));
      clipboardRef.current = copy;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(copy));
        } catch (e) {
          // ignore
        }
      }
      return copy;
    },
    [items, selectedIds]
  );

  // Paste item from clipboard (Ctrl + V) - supports multiple items
  const pasteItem = useCallback(() => {
    let targets = clipboardRef.current;
    if (!targets && typeof window !== "undefined") {
      try {
        const savedClip = localStorage.getItem(CLIPBOARD_KEY);
        if (savedClip) {
          targets = JSON.parse(savedClip);
          clipboardRef.current = targets;
        }
      } catch (e) {
        // ignore
      }
    }
    if (!targets) return null;

    const list = Array.isArray(targets) ? targets : [targets];
    if (list.length === 0) return null;

    pushHistory(items);

    const timestamp = Date.now();
    const newItems = [];
    const newIds = [];

    list.forEach((target, idx) => {
      const newId = `${target.type}-${timestamp}-${idx}`;
      newIds.push(newId);
      newItems.push({
        ...JSON.parse(JSON.stringify(target)),
        id: newId,
        name: target.name?.includes("(Cópia)")
          ? target.name
          : `${target.name || target.type} (Cópia)`,
        position: [
          Math.round(((target.position?.[0] || 0) + 1.0) * 100) / 100,
          target.position?.[1] || 0,
          Math.round(((target.position?.[2] || 0) + 1.0) * 100) / 100,
        ],
      });
    });

    setItems((prev) => [...prev, ...newItems]);
    setSelectedIds(newIds);
    setTransformMode("translate");

    clipboardRef.current = newItems;
    return newItems;
  }, [items, pushHistory]);

  // Undo last action (Ctrl + Z)
  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return false;
    const previous = pastRef.current.pop();
    futureRef.current.push(JSON.parse(JSON.stringify(items)));
    lastStateRef.current = JSON.stringify(previous);
    setItems(previous);
    setSelectedIds((cur) => cur.filter((id) => previous.some((it) => it.id === id)));
    return true;
  }, [items]);

  // Redo last undone action (Ctrl + Shift + Z or Ctrl + Y)
  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return false;
    const next = futureRef.current.pop();
    pastRef.current.push(JSON.parse(JSON.stringify(items)));
    lastStateRef.current = JSON.stringify(next);
    setItems(next);
    setSelectedIds((cur) => cur.filter((id) => next.some((it) => it.id === id)));
    return true;
  }, [items]);

  // Remove item (supports single or multi-selected items)
  const removeItem = useCallback(
    (id) => {
      const idsToRemove =
        selectedIds.length > 1 && (!id || selectedIds.includes(id))
          ? selectedIds
          : id
          ? [id]
          : selectedIds;

      if (idsToRemove.length === 0) return;

      pushHistory(items);
      setItems((prev) => prev.filter((it) => !idsToRemove.includes(it.id)));
      setSelectedIds((cur) => cur.filter((x) => !idsToRemove.includes(x)));
    },
    [items, selectedIds, pushHistory]
  );

  // Toggle item visibility
  const toggleVisibility = useCallback(
    (id) => {
      pushHistory(items);
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, hidden: !it.hidden } : it))
      );
    },
    [items, pushHistory]
  );

  // Clear all items
  const clearAll = useCallback(() => {
    pushHistory(items);
    setItems([]);
    setSelectedIds([]);
  }, [items, pushHistory]);

  // Load sample template
  const loadTemplate = useCallback(() => {
    pushHistory(items);
    setItems(WAREHOUSE_TEMPLATE);
    setSelectedIds([]);
  }, [items, pushHistory]);

  const selectedItem = items.find((it) => it.id === selectedId) || null;
  const selectedItems = items.filter((it) => selectedIds.includes(it.id));

  return {
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
    removeItem,
    toggleVisibility,
    clearAll,
    loadTemplate,
    undo,
    redo,
    copyItem,
    pasteItem,
  };
}
