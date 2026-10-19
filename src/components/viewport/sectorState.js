import { useState, useEffect, useCallback, useRef } from "react";
import * as THREE from "three";
import { isModelResizable } from "./LeftBar";

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
    props: { width: 16, depth: 14, thickness: 0.08, showDemarcation: true, color: "#b0b4b8", paintedCells: {} },
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
            // Garante que ao recarregar a página, o modo marcação sempre seja desativado
            return parsed.map((item) =>
              item?.props?.markingMode
                ? { ...item, props: { ...item.props, markingMode: false } }
                : item
            );
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

  // Auto-save to localStorage whenever items change (garante markingMode sempre false no storage)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const sanitizedItems = items.map((item) =>
          item?.props?.markingMode
            ? { ...item, props: { ...item.props, markingMode: false } }
            : item
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedItems));
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
          newItem.props = { width: 10, depth: 10, thickness: 0.1, showDemarcation: true, color: "#b0b4b8", paintedCells: {} };
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
        case "wall":
          newItem.name = `Parede ${items.filter((it) => it.type === "wall").length + 1}`;
          newItem.position = [0, 0, 0];
          newItem.props = {
            width: 0.2,
            height: 2.8,
            depth: 4.0,
            color: "#d1d5db",
          };
          break;
        case "bar":
          newItem.name = `Barra ${items.filter((it) => it.type === "bar").length + 1}`;
          newItem.position = [0, 0, 0];
          newItem.props = {
            width: 0.05,
            height: 0.05,
            depth: 2.0,
            color: "#383d42",
          };
          break;
        case "cube":
          newItem.name = `Cubo ${items.filter((it) => it.type === "cube").length + 1}`;
          newItem.position = [0, 0, 0];
          newItem.props = {
            width: 1.0,
            height: 1.0,
            depth: 1.0,
            color: "#3b82f6",
          };
          break;
        case "drawer_g": {
          pushHistory(items);
          const timestamp = Date.now();
          const groupId = `drawer_group_${timestamp}`;
          const newGroupItems = [];
          const newGroupIds = [];

          for (let i = 0; i < 5; i++) {
            const itemId = `drawer_g-${timestamp}-${i + 1}`;
            newGroupIds.push(itemId);
            newGroupItems.push({
              id: itemId,
              type: "drawer_g",
              groupId: groupId,
              name: `Gaveta G ${i + 1}`,
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              props: {
                tierIndex: i,
                groupId: groupId,
                color: "#26272B",
                cageColor: "#ff6600",
                plateColor: "#DBDBDB",
                tamanho: 18,
                escalaAltura: 1.0,
                topGap: 0.035,
                hasFeet: true,
                legHeight: 0.07,
              },
            });
          }

          setItems((prev) => [...prev, ...newGroupItems]);
          setSelectedIds([newGroupIds[0]]);
          setTransformMode("translate");
          return;
        }
        default:
          break;
      }

      setItems((prev) => [...prev, newItem]);
      setSelectedIds([newItem.id]);
      setTransformMode("translate");
    },
    [items, pushHistory]
  );

  // Update single item transforms (syncs entire group when item has groupId)
  const updateTransform = useCallback(
    (id, { position, rotation, scale }) => {
      pushHistory(items);
      const targetItem = items.find((it) => it.id === id);
      const groupId = targetItem?.groupId || targetItem?.props?.groupId;

      if (groupId && targetItem) {
        const deltaPos = position
          ? [
              position[0] - targetItem.position[0],
              position[1] - targetItem.position[1],
              position[2] - targetItem.position[2],
            ]
          : [0, 0, 0];
        const deltaRotY = rotation ? rotation[1] - targetItem.rotation[1] : 0;

        setItems((prev) =>
          prev.map((item) => {
            if ((item.groupId || item.props?.groupId) === groupId) {
              if (item.id === id) {
                return {
                  ...item,
                  position: position || item.position,
                  rotation: rotation || item.rotation,
                  scale: scale !== undefined ? scale : (item.scale || [1, 1, 1]),
                };
              }

              let newPos = [
                Math.round((item.position[0] + deltaPos[0]) * 10000) / 10000,
                Math.round((item.position[1] + deltaPos[1]) * 10000) / 10000,
                Math.round((item.position[2] + deltaPos[2]) * 10000) / 10000,
              ];
              if (Math.abs(deltaRotY) > 1e-6) {
                const ox = item.position[0] - targetItem.position[0];
                const oz = item.position[2] - targetItem.position[2];
                const cos = Math.cos(deltaRotY);
                const sin = Math.sin(deltaRotY);
                const rx = ox * cos - oz * sin;
                const rz = ox * sin + oz * cos;
                newPos[0] = Math.round((targetItem.position[0] + deltaPos[0] + rx) * 10000) / 10000;
                newPos[2] = Math.round((targetItem.position[2] + deltaPos[2] + rz) * 10000) / 10000;
              }

              return {
                ...item,
                position: newPos,
                rotation: [
                  item.rotation[0],
                  Math.round((item.rotation[1] + deltaRotY) * 10000) / 10000,
                  item.rotation[2],
                ],
                scale: scale !== undefined ? scale : (item.scale || [1, 1, 1]),
              };
            }
            return item;
          })
        );
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                position: position || item.position,
                rotation: rotation || item.rotation,
                scale: scale !== undefined ? scale : (item.scale || [1, 1, 1]),
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
              scale: match.scale !== undefined ? match.scale : (item.scale || [1, 1, 1]),
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

  // Duplicate item (supports single and multi-selection, preserving groups)
  const duplicateItem = useCallback(
    (id) => {
      let idsToDup =
        selectedIds.length > 1 && (!id || selectedIds.includes(id))
          ? selectedIds
          : id
          ? [id]
          : selectedIds;

      if (idsToDup.length === 0) return;

      // Expand to include the entire group for any grouped item (e.g. Gaveta G multiplication)
      const groupIds = new Set();
      idsToDup.forEach((tid) => {
        const it = items.find((x) => x.id === tid);
        const gid = it?.groupId || it?.props?.groupId;
        if (gid) groupIds.add(gid);
      });

      if (groupIds.size > 0) {
        const extraIds = items
          .filter((it) => {
            const gid = it.groupId || it.props?.groupId;
            return gid && groupIds.has(gid);
          })
          .map((it) => it.id);
        idsToDup = [...new Set([...idsToDup, ...extraIds])];
      }

      pushHistory(items);
      const timestamp = Date.now();
      const newItems = [];
      const newIds = [];
      const groupMap = {};

      const existingNumbers = items
        .filter((it) => it.type === "drawer_g")
        .map((it) => {
          const m = it.name?.match(/Gaveta\s+G\s+(\d+)/i);
          return m ? parseInt(m[1], 10) : 0;
        });
      let nextDrawerNumber = Math.max(0, ...existingNumbers) + 1;

      idsToDup.forEach((targetId, idx) => {
        const target = items.find((it) => it.id === targetId);
        if (!target) return;
        const newId = `${target.type}-${timestamp}-${idx}`;
        newIds.push(newId);

        let newGroupId = target.groupId || target.props?.groupId;
        if (newGroupId) {
          if (!groupMap[newGroupId]) {
            groupMap[newGroupId] = `drawer_group_${timestamp}_${Math.floor(Math.random() * 1000)}`;
          }
          newGroupId = groupMap[newGroupId];
        }

        let itemName = target.name;
        if (target.type === "drawer_g") {
          itemName = `Gaveta G ${nextDrawerNumber++}`;
        } else if (!itemName?.includes("(Cópia)")) {
          itemName = `${itemName || target.type} (Cópia)`;
        }

        newItems.push({
          ...JSON.parse(JSON.stringify(target)),
          id: newId,
          groupId: newGroupId || target.groupId,
          name: itemName,
          position: [
            target.position?.[0] !== undefined ? target.position[0] : 0,
            target.position?.[1] !== undefined ? target.position[1] : 0,
            target.position?.[2] !== undefined ? target.position[2] : 0,
          ],
          props: {
            ...(target.props ? JSON.parse(JSON.stringify(target.props)) : {}),
            groupId: newGroupId || target.props?.groupId,
            colorSeed: Math.random(),
          },
        });
      });

      if (newItems.length > 0) {
        setItems((prev) => [...prev, ...newItems]);
        setSelectedIds(newIds.length > 0 ? [newIds[0]] : []);
        setTransformMode("translate");
      }
    },
    [items, selectedIds, pushHistory]
  );

  // Multiplicar colunas lateralmente (BoxModel conectando varais ou Gaveta G multiplicando torres)
  const multiplyColumns = useCallback(
    (id, count = 2) => {
      const target = items.find((it) => it.id === id);
      if (!target || count < 2) return;

      pushHistory(items);

      if (target.type === "drawer_g") {
        const targetGroupId = target.groupId || target.props?.groupId;
        const now = Date.now();
        const masterGroupId = targetGroupId || `drawer_group_${now}`;

        // Localizar todas as gavetas pertencentes à mesma coluna da gaveta alvo (mesmo X e Z aproximados)
        const colItems = items.filter((it) => {
          if (it.type !== "drawer_g") return false;
          if (
            targetGroupId &&
            (it.groupId === targetGroupId || it.props?.groupId === targetGroupId)
          ) {
            const dx = Math.abs((it.position?.[0] ?? 0) - (target.position?.[0] ?? 0));
            const dz = Math.abs((it.position?.[2] ?? 0) - (target.position?.[2] ?? 0));
            return dx < 0.05 && dz < 0.05;
          }
          return it.id === target.id;
        });

        const sourceDrawers = colItems.length > 0 ? colItems : [target];
        sourceDrawers.sort(
          (a, b) => (a.props?.tierIndex ?? 0) - (b.props?.tierIndex ?? 0)
        );

        // Dimensões físicas da Gaiola / Gaveta G
        const tamanho = Number(target.props?.tamanho) || 18;
        const scaleFactor = Math.max(0.01, tamanho / 10);
        const W = Math.max(0.15, Number(target.props?.width) || 0.31);
        const sideGap = 0.008;
        const barSize = 0.012;
        const cageW = W + sideGap * 2 + barSize * 2; // 0.35m
        const larguraTotal = cageW * scaleFactor; // 0.63m
        const GAP_X = 0.005; // 5mm de folga entre as estruturas metálicas
        const PASSO_COLUNA = larguraTotal + GAP_X;

        const rot = target.rotation || [0, 0, 0];
        const dir = new THREE.Vector3(PASSO_COLUNA, 0, 0).applyEuler(
          new THREE.Euler(rot[0] || 0, rot[1] || 0, rot[2] || 0)
        );

        // Identifica maior número de Gaveta G existente no cenário para numeração sequencial
        const existingNumbers = items
          .filter((it) => it.type === "drawer_g")
          .map((it) => {
            const m = it.name?.match(/Gaveta\s+G\s+(\d+)/i);
            return m ? parseInt(m[1], 10) : 0;
          });
        let nextNumber = Math.max(0, ...existingNumbers) + 1;

        const newItems = [];
        for (let c = 1; c < count; c++) {
          sourceDrawers.forEach((drawer, tierIdx) => {
            const newId = `drawer_g-${now}-c${c}-${tierIdx + 1}`;
            const newPos = [
              Math.round((drawer.position[0] + c * dir.x) * 10000) / 10000,
              drawer.position[1],
              Math.round((drawer.position[2] + c * dir.z) * 10000) / 10000,
            ];
            const newName = `Gaveta G ${nextNumber++}`;

            newItems.push({
              id: newId,
              type: "drawer_g",
              groupId: masterGroupId,
              name: newName,
              position: newPos,
              rotation: [...(drawer.rotation || rot)],
              props: {
                ...JSON.parse(JSON.stringify(drawer.props || {})),
                groupId: masterGroupId,
                tierIndex: drawer.props?.tierIndex ?? tierIdx,
              },
            });
          });
        }

        setItems((prev) => {
          const updated = prev.map((it) => {
            if (
              it.id === target.id ||
              (targetGroupId &&
                (it.groupId === targetGroupId ||
                  it.props?.groupId === targetGroupId))
            ) {
              return {
                ...it,
                groupId: masterGroupId,
                props: {
                  ...it.props,
                  groupId: masterGroupId,
                },
              };
            }
            return it;
          });
          return [...updated, ...newItems];
        });

        // Mantém a gaveta alvo selecionada para permitir edição/renomeação pontual
        setSelectedIds([target.id]);
        return;
      }

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

  // Copy item to clipboard (Ctrl + C) - supports multiple items and full group expansion
  const copyItem = useCallback(
    (id) => {
      const idsToCopy =
        selectedIds.length > 1 && (!id || selectedIds.includes(id))
          ? selectedIds
          : id
          ? [id]
          : selectedIds;

      if (idsToCopy.length === 0) return null;

      // Expand to include the entire group for any grouped item (e.g. Gaveta G multiplication)
      const groupIds = new Set();
      idsToCopy.forEach((tid) => {
        const it = items.find((x) => x.id === tid);
        const gid = it?.groupId || it?.props?.groupId;
        if (gid) groupIds.add(gid);
      });

      let fullList = items.filter((it) => idsToCopy.includes(it.id));
      if (groupIds.size > 0) {
        const groupItems = items.filter((it) => {
          const gid = it.groupId || it.props?.groupId;
          return gid && groupIds.has(gid);
        });
        const map = new Map();
        fullList.forEach((it) => map.set(it.id, it));
        groupItems.forEach((it) => map.set(it.id, it));
        fullList = Array.from(map.values());
      }

      if (fullList.length === 0) return null;

      const copy = JSON.parse(JSON.stringify(fullList));
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

  // Paste item from clipboard (Ctrl + V) - creates an independent copy with fresh group IDs
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
    const groupMap = {};

    // Calculate sequential numbering for Gaveta G if copying drawer_g
    const existingNumbers = items
      .filter((it) => it.type === "drawer_g")
      .map((it) => {
        const m = it.name?.match(/Gaveta\s+G\s+(\d+)/i);
        return m ? parseInt(m[1], 10) : 0;
      });
    let nextDrawerNumber = Math.max(0, ...existingNumbers) + 1;

    list.forEach((target, idx) => {
      const newId = `${target.type}-${timestamp}-${idx}`;
      newIds.push(newId);

      let newGroupId = target.groupId || target.props?.groupId;
      if (newGroupId) {
        if (!groupMap[newGroupId]) {
          groupMap[newGroupId] = `drawer_group_${timestamp}_${Math.floor(Math.random() * 1000)}`;
        }
        newGroupId = groupMap[newGroupId];
      }

      let itemName = target.name;
      if (target.type === "drawer_g") {
        itemName = `Gaveta G ${nextDrawerNumber++}`;
      } else if (!itemName?.includes("(Cópia)")) {
        itemName = `${itemName || target.type} (Cópia)`;
      }

      newItems.push({
        ...JSON.parse(JSON.stringify(target)),
        id: newId,
        groupId: newGroupId || target.groupId,
        name: itemName,
        position: [
          target.position?.[0] !== undefined ? target.position[0] : 0,
          target.position?.[1] !== undefined ? target.position[1] : 0,
          target.position?.[2] !== undefined ? target.position[2] : 0,
        ],
        props: {
          ...(target.props ? JSON.parse(JSON.stringify(target.props)) : {}),
          groupId: newGroupId || target.props?.groupId,
          colorSeed: Math.random(),
        },
      });
    });

    setItems((prev) => [...prev, ...newItems]);
    setSelectedIds(newIds.length > 0 ? [newIds[0]] : []);
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

  // Remove item (supports single or multi-selected items, and cleans up full group)
  const removeItem = useCallback(
    (id) => {
      let idsToRemove =
        selectedIds.length > 1 && (!id || selectedIds.includes(id))
          ? selectedIds
          : id
          ? [id]
          : selectedIds;

      if (idsToRemove.length === 0) return;

      // Se algum item pertencer a um grupo (ex: torre de Gaveta G), remove todos do grupo juntos
      const groupIds = new Set();
      idsToRemove.forEach((tid) => {
        const it = items.find((x) => x.id === tid);
        const gid = it?.groupId || it?.props?.groupId;
        if (gid) groupIds.add(gid);
      });

      if (groupIds.size > 0) {
        const extraIds = items
          .filter((it) => groupIds.has(it.groupId || it.props?.groupId))
          .map((it) => it.id);
        idsToRemove = [...new Set([...idsToRemove, ...extraIds])];
      }

      pushHistory(items);
      setItems((prev) => prev.filter((it) => !idsToRemove.includes(it.id)));
      setSelectedIds((cur) => cur.filter((x) => !idsToRemove.includes(x)));
    },
    [items, selectedIds, pushHistory]
  );

  // Juntar modelos (Join Models - Blender Ctrl+J)
  const joinItems = useCallback(
    (targetIds) => {
      const idsToJoin =
        targetIds && targetIds.length >= 2
          ? targetIds
          : selectedIds.length >= 2
          ? selectedIds
          : [];

      if (idsToJoin.length < 2) return null;

      const itemsToJoin = items.filter((it) => idsToJoin.includes(it.id));
      if (itemsToJoin.length < 2) return null;

      // Valida se todos os modelos permitem alteração de tamanho
      const invalid = itemsToJoin.some((it) => !isModelResizable(it));
      if (invalid) {
        return null;
      }

      pushHistory(items);

      // Decompõe cada item em peças no espaço global (world space)
      const worldParts = [];
      itemsToJoin.forEach((item) => {
        if (item.type === "joined" && Array.isArray(item.props?.parts)) {
          const parentMat = new THREE.Matrix4();
          const pos = new THREE.Vector3(...item.position);
          const eul = new THREE.Euler(...(item.rotation || [0, 0, 0]));
          const quat = new THREE.Quaternion().setFromEuler(eul);
          const scl = new THREE.Vector3(...(item.scale || [1, 1, 1]));
          parentMat.compose(pos, quat, scl);

          item.props.parts.forEach((p) => {
            const partMat = new THREE.Matrix4();
            const pPos = new THREE.Vector3(...(p.position || [0, 0, 0]));
            const pEul = new THREE.Euler(...(p.rotation || [0, 0, 0]));
            const pQuat = new THREE.Quaternion().setFromEuler(pEul);
            const pScl = new THREE.Vector3(...(p.scale || [1, 1, 1]));
            partMat.compose(pPos, pQuat, pScl);

            const combinedMat = new THREE.Matrix4().multiplyMatrices(parentMat, partMat);
            const wPos = new THREE.Vector3();
            const wQuat = new THREE.Quaternion();
            const wScl = new THREE.Vector3();
            combinedMat.decompose(wPos, wQuat, wScl);
            const wEul = new THREE.Euler().setFromQuaternion(wQuat);

            worldParts.push({
              id: p.id || `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              type: p.type,
              worldPos: [wPos.x, wPos.y, wPos.z],
              worldRot: [wEul.x, wEul.y, wEul.z],
              worldScale: [wScl.x, wScl.y, wScl.z],
              props: JSON.parse(JSON.stringify(p.props || {})),
            });
          });
        } else {
          worldParts.push({
            id: item.id,
            type: item.type,
            worldPos: [...item.position],
            worldRot: [...(item.rotation || [0, 0, 0])],
            worldScale: [...(item.scale || [1, 1, 1])],
            props: JSON.parse(JSON.stringify(item.props || {})),
          });
        }
      });

      // Calcula o centroide médio de todas as peças
      let sumX = 0, sumY = 0, sumZ = 0;
      worldParts.forEach((wp) => {
        sumX += wp.worldPos[0];
        sumY += wp.worldPos[1];
        sumZ += wp.worldPos[2];
      });
      const count = worldParts.length;
      const centerX = Math.round((sumX / count) * 1000) / 1000;
      const centerY = Math.round((sumY / count) * 1000) / 1000;
      const centerZ = Math.round((sumZ / count) * 1000) / 1000;

      // Converte as coordenadas das peças para espaço local relativo ao novo centro
      const relativeParts = worldParts.map((wp) => ({
        id: wp.id,
        type: wp.type,
        position: [
          Math.round((wp.worldPos[0] - centerX) * 1000) / 1000,
          Math.round((wp.worldPos[1] - centerY) * 1000) / 1000,
          Math.round((wp.worldPos[2] - centerZ) * 1000) / 1000,
        ],
        rotation: wp.worldRot,
        scale: wp.worldScale,
        props: wp.props,
      }));

      const timestamp = Date.now();
      const newJoinedItem = {
        id: `joined_${timestamp}`,
        type: "joined",
        name: `União (${itemsToJoin.map((it) => it.name || it.type).join(" + ")})`,
        position: [centerX, centerY, centerZ],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        props: {
          parts: relativeParts,
        },
      };

      const idsToRemoveSet = new Set(itemsToJoin.map((it) => it.id));
      setItems((prev) => [
        ...prev.filter((it) => !idsToRemoveSet.has(it.id)),
        newJoinedItem,
      ]);
      setSelectedIds([newJoinedItem.id]);
      setTransformMode("translate");

      return newJoinedItem;
    },
    [items, selectedIds, pushHistory, setTransformMode]
  );

  // Separar modelo unido (Desfazer união)
  const separateItem = useCallback(
    (id) => {
      const targetId = id || selectedIds[0];
      const target = items.find((it) => it.id === targetId);
      if (!target || target.type !== "joined" || !Array.isArray(target.props?.parts)) {
        return;
      }

      pushHistory(items);

      const parentMat = new THREE.Matrix4();
      const pos = new THREE.Vector3(...target.position);
      const eul = new THREE.Euler(...(target.rotation || [0, 0, 0]));
      const quat = new THREE.Quaternion().setFromEuler(eul);
      const scl = new THREE.Vector3(...(target.scale || [1, 1, 1]));
      parentMat.compose(pos, quat, scl);

      const timestamp = Date.now();
      const newItems = target.props.parts.map((p, idx) => {
        const partMat = new THREE.Matrix4();
        const pPos = new THREE.Vector3(...(p.position || [0, 0, 0]));
        const pEul = new THREE.Euler(...(p.rotation || [0, 0, 0]));
        const pQuat = new THREE.Quaternion().setFromEuler(pEul);
        const pScl = new THREE.Vector3(...(p.scale || [1, 1, 1]));
        partMat.compose(pPos, pQuat, pScl);

        const combinedMat = new THREE.Matrix4().multiplyMatrices(parentMat, partMat);
        const wPos = new THREE.Vector3();
        const wQuat = new THREE.Quaternion();
        const wScl = new THREE.Vector3();
        combinedMat.decompose(wPos, wQuat, wScl);
        const wEul = new THREE.Euler().setFromQuaternion(wQuat);

        const typeName =
          p.type === "wall"
            ? "Parede"
            : p.type === "bar"
            ? "Barra"
            : p.type === "cube"
            ? "Cubo"
            : p.type === "floor"
            ? "Piso"
            : "Modelo";

        return {
          id: `${p.type}-${timestamp}-${idx}`,
          type: p.type,
          name: `${typeName} ${idx + 1}`,
          position: [
            Math.round(wPos.x * 1000) / 1000,
            Math.round(wPos.y * 1000) / 1000,
            Math.round(wPos.z * 1000) / 1000,
          ],
          rotation: [
            Math.round(wEul.x * 10000) / 10000,
            Math.round(wEul.y * 10000) / 10000,
            Math.round(wEul.z * 10000) / 10000,
          ],
          scale: [
            Math.round(wScl.x * 1000) / 1000,
            Math.round(wScl.y * 1000) / 1000,
            Math.round(wScl.z * 1000) / 1000,
          ],
          props: JSON.parse(JSON.stringify(p.props || {})),
        };
      });

      const newIds = newItems.map((it) => it.id);
      setItems((prev) => [...prev.filter((it) => it.id !== target.id), ...newItems]);
      setSelectedIds(newIds);
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
    joinItems,
    separateItem,
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
