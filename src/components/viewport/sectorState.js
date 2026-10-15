import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "sector_studio_scene_data_v3";

// Cenário padrão: Apenas o Piso Concreto
export const WAREHOUSE_TEMPLATE = [
  {
    id: "floor-main",
    type: "floor",
    name: "Piso Concreto",
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

  const [selectedId, setSelectedId] = useState(null);
  const [transformMode, setTransformMode] = useState("translate"); // 'translate' | 'rotate'
  const [snapToGrid, setSnapToGrid] = useState(true);

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
  const addItem = useCallback((type) => {
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
        newItem.name = "Piso Concreto";
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
      case "rail":
        newItem.name = "Trilho com Caixas";
        newItem.position = [0, 0, 0];
        newItem.props = { columns: 10, maxHeight: 5, pattern: "photo" };
        break;
      default:
        break;
    }

    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
    setTransformMode("translate");
  }, []);

  // Update item transforms
  const updateTransform = useCallback((id, { position, rotation }) => {
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
  }, []);

  // Update item custom properties
  const updateProps = useCallback((id, propUpdates) => {
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
  }, []);

  // Update item name
  const updateName = useCallback((id, name) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name } : item))
    );
  }, []);

  // Duplicate item
  const duplicateItem = useCallback(
    (id) => {
      const target = items.find((it) => it.id === id);
      if (!target) return;
      const clone = {
        ...target,
        id: `${target.type}-${Date.now()}`,
        name: `${target.name} (Cópia)`,
        position: [target.position[0] + 1.0, target.position[1], target.position[2] + 1.0],
      };
      setItems((prev) => [...prev, clone]);
      setSelectedId(clone.id);
      setTransformMode("translate");
    },
    [items]
  );

  // Remove item
  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  // Toggle item visibility
  const toggleVisibility = useCallback((id) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, hidden: !it.hidden } : it))
    );
  }, []);

  // Clear all items
  const clearAll = useCallback(() => {
    setItems([]);
    setSelectedId(null);
  }, []);

  // Load sample template
  const loadTemplate = useCallback(() => {
    setItems(WAREHOUSE_TEMPLATE);
    setSelectedId(null);
  }, []);

  const selectedItem = items.find((it) => it.id === selectedId) || null;

  return {
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
  };
}
