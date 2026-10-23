import { useState, useEffect, useCallback, useRef } from "react";
import * as THREE from "three";
import { isModelResizable } from "./LeftBar";
import { GAVETAS_GAP } from "./models/DrawerGModel";

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

// Separa clusters desconectados de caixas brancas para garantir que cada multiplicação seja 100% isolada
function sanitizeBoxGroups(itemList) {
  if (!Array.isArray(itemList) || itemList.length === 0) return itemList;

  const boxes = itemList.filter((it) => it.type === "box");
  if (boxes.length <= 1) return itemList;

  const groupMap = {};
  boxes.forEach((b) => {
    const gid = b.groupId || b.props?.groupId;
    if (gid) {
      if (!groupMap[gid]) groupMap[gid] = [];
      groupMap[gid].push(b);
    }
  });

  const clusterBoxes = (boxList) => {
    const visited = new Set();
    const clusters = [];
    boxList.forEach((b) => {
      if (visited.has(b.id)) return;
      const cluster = [];
      const queue = [b];
      visited.add(b.id);
      while (queue.length > 0) {
        const curr = queue.shift();
        cluster.push(curr);
        boxList.forEach((neighbor) => {
          if (!visited.has(neighbor.id)) {
            const dx = (curr.position?.[0] ?? 0) - (neighbor.position?.[0] ?? 0);
            const dy = (curr.position?.[1] ?? 0) - (neighbor.position?.[1] ?? 0);
            const dz = (curr.position?.[2] ?? 0) - (neighbor.position?.[2] ?? 0);
            const dist = Math.hypot(dx, dy, dz);
            // Caixas multiplicadas ficam lado a lado a ~0.58m. Se > 1.2m, são de linhas/multiplicações diferentes
            if (dist <= 1.2) {
              visited.add(neighbor.id);
              queue.push(neighbor);
            }
          }
        });
      }
      clusters.push(cluster);
    });
    return clusters;
  };

  // Se caixas fisicamente distantes compartilham o mesmo groupId, divide em grupos independentes
  Object.entries(groupMap).forEach(([gid, groupBoxes]) => {
    const clusters = clusterBoxes(groupBoxes);
    if (clusters.length > 1) {
      clusters.forEach((cluster, idx) => {
        if (idx > 0) {
          const splitGid = `${gid}_split_${idx}_${Date.now()}`;
          cluster.forEach((b) => {
            b.groupId = splitGid;
            if (!b.props) b.props = {};
            b.props.groupId = splitGid;
          });
        }
      });
    }
  });

  return itemList;
}

export function useSectorState() {
  const [items, setItems] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Garante que haja estritamente no máximo 1 piso principal ativo na cena
            let hasMainFloor = false;
            const initialList = parsed.map((item) => {
              if (item?.type === "floor") {
                const isMain = Boolean(item.isMainFloor || item.props?.isMain || item.props?.isMainFloor);
                const active = isMain && !hasMainFloor;
                if (active) hasMainFloor = true;
                return {
                  ...item,
                  isMainFloor: active,
                  props: {
                    ...item.props,
                    markingMode: false,
                    isMain: active,
                    isMainFloor: active,
                  },
                };
              }
              return item?.props?.markingMode
                ? { ...item, props: { ...item.props, markingMode: false } }
                : item;
            });

            // Sanitiza e isola qualquer multiplicação desconectada
            return sanitizeBoxGroups(initialList);
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

  // Autocura imediata para separar grupos desconectados caso já existam no estado
  useEffect(() => {
    setItems((prev) => sanitizeBoxGroups([...prev]));
  }, []);

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

  // Add new item to center of scene or on top of the main floor
  const addItem = useCallback(
    (type) => {
      pushHistory(items);
      const timestamp = Date.now();

      // Encontra o piso definido como principal (se houver)
      const mainFloor = items.find(
        (it) =>
          it.type === "floor" &&
          !it.hidden &&
          Boolean(it.isMainFloor || it.props?.isMain || it.props?.isMainFloor)
      );

      // Topo milimétrico do piso: a geometria de FloorModel ancora a superfície do piso em Y = 0 local
      // (com espessura de 0.08m projetada para baixo em -fixedThickness/2).
      // Portanto, a face superior do piso coincide exatamente com mainFloor.position[1].
      const floorTopY = mainFloor ? (mainFloor.position?.[1] || 0) : 0;
      const spawnPos = mainFloor
        ? [
            Math.round((mainFloor.position?.[0] || 0) * 10000) / 10000,
            Math.round(floorTopY * 10000) / 10000,
            Math.round((mainFloor.position?.[2] || 0) * 10000) / 10000,
          ]
        : [0, 0, 0];

      let newItem = {
        id: `${type}-${timestamp}`,
        type,
        name: `${type.toUpperCase()} #${Math.floor(Math.random() * 900 + 100)}`,
        position: type === "floor" ? [0, 0, 0] : [...spawnPos],
        rotation: [0, 0, 0],
        props: {},
      };

      switch (type) {
        case "rack":
          newItem.name = "Porta-Paletes";
          newItem.position = [...spawnPos];
          newItem.props = { levels: 3, width: 2.8, depth: 1.1, height: 3.6 };
          break;
        case "pallet":
          newItem.name = "Pallet Madeira";
          newItem.position = [...spawnPos];
          newItem.props = { boxCount: 0 };
          break;
        case "cargo_red":
          newItem.name = "Carga Vermelha";
          newItem.position = [...spawnPos];
          newItem.props = { layers: 3 };
          break;
        case "cargo_gray":
          newItem.name = "Carga Cinza";
          newItem.position = [...spawnPos];
          newItem.props = { layers: 4 };
          break;
        case "floor":
          newItem.name = "Piso";
          newItem.position = [0, 0, 0];
          newItem.props = { width: 10, depth: 10, thickness: 0.1, showDemarcation: true, color: "#b0b4b8", paintedCells: {} };
          break;
        case "forklift":
          newItem.name = "Empilhadeira";
          newItem.position = [...spawnPos];
          newItem.props = {};
          break;
        case "column":
          newItem.name = "Coluna Estrutural";
          newItem.position = [...spawnPos];
          newItem.props = { height: 4.5, size: 0.5 };
          break;
        case "box":
          newItem.name = "Caixas Brancas";
          newItem.position = [...spawnPos];
          newItem.props = {
            columns: 1,
            maxHeight: 6,
            rail: false,
            trilho: false,
            varal: false,
            doubleRail: false,
            trilhoDuplo: false,
            colorSeed: Math.random(),
            boxColor: "#E0E0E0",
            selectedColors: ["#E0E0E0"],
            boxColors: ["#E0E0E0", "#E0E0E0", "#E0E0E0", "#E0E0E0", "#E0E0E0", "#E0E0E0"],
          };
          break;
        case "wall":
          newItem.name = `Parede ${items.filter((it) => it.type === "wall").length + 1}`;
          newItem.position = [...spawnPos];
          newItem.props = {
            width: 0.2,
            height: 2.8,
            depth: 4.0,
            color: "#d1d5db",
          };
          break;
        case "bar":
          newItem.name = `Barra ${items.filter((it) => it.type === "bar").length + 1}`;
          newItem.position = [...spawnPos];
          newItem.props = {
            width: 0.05,
            height: 0.05,
            depth: 2.0,
            color: "#383d42",
          };
          break;
        case "cube":
          newItem.name = `Cubo ${items.filter((it) => it.type === "cube").length + 1}`;
          newItem.position = [...spawnPos];
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
              position: [...spawnPos],
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
        const deltaRotX = rotation ? rotation[0] - targetItem.rotation[0] : 0;
        const deltaRotY = rotation ? rotation[1] - targetItem.rotation[1] : 0;
        const deltaRotZ = rotation ? rotation[2] - targetItem.rotation[2] : 0;

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
              if (Math.abs(deltaRotX) > 1e-6) {
                const oy = newPos[1] - (targetItem.position[1] + deltaPos[1]);
                const oz = newPos[2] - (targetItem.position[2] + deltaPos[2]);
                const cos = Math.cos(deltaRotX);
                const sin = Math.sin(deltaRotX);
                const ry = oy * cos - oz * sin;
                const rz = oy * sin + oz * cos;
                newPos[1] = Math.round((targetItem.position[1] + deltaPos[1] + ry) * 10000) / 10000;
                newPos[2] = Math.round((targetItem.position[2] + deltaPos[2] + rz) * 10000) / 10000;
              }
              if (Math.abs(deltaRotZ) > 1e-6) {
                const ox = newPos[0] - (targetItem.position[0] + deltaPos[0]);
                const oy = newPos[1] - (targetItem.position[1] + deltaPos[1]);
                const cos = Math.cos(deltaRotZ);
                const sin = Math.sin(deltaRotZ);
                const rx = ox * cos - oy * sin;
                const ry = ox * sin + oy * cos;
                newPos[0] = Math.round((targetItem.position[0] + deltaPos[0] + rx) * 10000) / 10000;
                newPos[1] = Math.round((targetItem.position[1] + deltaPos[1] + ry) * 10000) / 10000;
              }

              return {
                ...item,
                position: newPos,
                rotation: [
                  Math.round((item.rotation[0] + deltaRotX) * 10000) / 10000,
                  Math.round((item.rotation[1] + deltaRotY) * 10000) / 10000,
                  Math.round((item.rotation[2] + deltaRotZ) * 10000) / 10000,
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
      const target = items.find((it) => it.id === id);
      const targetGroupId = target?.groupId || target?.props?.groupId;

      // Se for uma caixa branca e a atualização envolver Trilho, Varal ou Trilho Duplo,
      // sincroniza todas as caixas pertencentes àquela multiplicação específica
      let connectedBoxIds = null;
      if (
        target?.type === "box" &&
        (
          "rail" in propUpdates ||
          "trilho" in propUpdates ||
          "varal" in propUpdates ||
          "doubleRail" in propUpdates ||
          "trilhoDuplo" in propUpdates
        )
      ) {
        if (targetGroupId) {
          connectedBoxIds = new Set(
            items
              .filter(
                (it) =>
                  it.type === "box" &&
                  (it.groupId === targetGroupId || it.props?.groupId === targetGroupId)
              )
              .map((it) => it.id)
          );
        }
      }

      // Se a atualização for o nome de uma pasta (folderName), propaga para todos os modelos daquela pasta
      if (propUpdates && "folderName" in propUpdates) {
        const folderKey =
          propUpdates.folderId ||
          target?.folderId ||
          target?.props?.folderId ||
          target?.groupId ||
          target?.props?.groupId;
        if (folderKey) {
          setItems((prev) =>
            prev.map((item) => {
              if (
                item.folderId === folderKey ||
                item.props?.folderId === folderKey ||
                item.groupId === folderKey ||
                item.props?.groupId === folderKey ||
                item.id === id
              ) {
                return {
                  ...item,
                  folderName: propUpdates.folderName,
                  props: { ...item.props, folderName: propUpdates.folderName },
                };
              }
              return item;
            })
          );
          return;
        }
      }

      // Se for um piso e a atualização envolver isMain / isMainFloor,
      // garante ESTRITAMENTE que no máximo 1 piso seja o principal
      if (
        target?.type === "floor" &&
        ("isMain" in propUpdates || "isMainFloor" in propUpdates)
      ) {
        const nextVal = Boolean(propUpdates.isMain ?? propUpdates.isMainFloor);
        setItems((prev) =>
          prev.map((item) => {
            if (item.type !== "floor") return item;
            const isTarget = item.id === id;
            const active = isTarget ? nextVal : false;
            return {
              ...item,
              isMainFloor: active,
              props: {
                ...item.props,
                ...(isTarget ? propUpdates : {}),
                isMain: active,
                isMainFloor: active,
              },
            };
          })
        );
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (connectedBoxIds && connectedBoxIds.has(item.id)) {
            return {
              ...item,
              props: { ...item.props, ...propUpdates },
            };
          }
          if (item.id === id) {
            return {
              ...item,
              props: { ...item.props, ...propUpdates },
            };
          }
          return item;
        })
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

      const folderMap = {};
      idsToDup.forEach((targetId, idx) => {
        const target = items.find((it) => it.id === targetId);
        if (!target) return;
        const newId = `${target.type}-${timestamp}-${idx}`;
        newIds.push(newId);

        let newGroupId = target.groupId || target.props?.groupId;
        if (newGroupId) {
          if (!groupMap[newGroupId]) {
            const prefix = target.type === "box" ? "box_group" : "drawer_group";
            groupMap[newGroupId] = `${prefix}_${timestamp}_${Math.floor(Math.random() * 1000)}`;
          }
          newGroupId = groupMap[newGroupId];
        }

        let newFolderId = target.folderId || target.props?.folderId;
        let newFolderName = target.folderName || target.props?.folderName;
        if (newFolderId) {
          if (!folderMap[newFolderId]) {
            const existingFolderNames = new Set([
              ...items.map((it) => it.folderName || it.props?.folderName).filter(Boolean),
              ...Object.values(folderMap).map((f) => f.name),
            ]);
            const isDrawer = target.type === "drawer_g";
            const prefix = isDrawer ? "Prateleira G" : "Trilho";
            let num = 1;
            while (existingFolderNames.has(`${prefix} ${num}`)) {
              num++;
            }
            folderMap[newFolderId] = {
              id: `folder_${isDrawer ? "drawer" : "rail"}_${timestamp}_${Math.floor(Math.random() * 1000)}`,
              name: `${prefix} ${num}`,
            };
          }
          newFolderName = folderMap[newFolderId].name;
          newFolderId = folderMap[newFolderId].id;
        }

        let itemName = target.name;
        if (target.type === "drawer_g") {
          itemName = `Gaveta G ${nextDrawerNumber++}`;
        } else if (!itemName?.includes("(Cópia)")) {
          itemName = `${itemName || target.type} (Cópia)`;
        }

        const isFloor = target.type === "floor";
        newItems.push({
          ...JSON.parse(JSON.stringify(target)),
          id: newId,
          isMainFloor: false, // Duplicatas de piso nunca são o piso principal
          groupId: newGroupId || target.groupId,
          folderId: newFolderId,
          folderName: newFolderName,
          name: itemName,
          position: [
            target.position?.[0] !== undefined ? target.position[0] : 0,
            target.position?.[1] !== undefined ? target.position[1] : 0,
            target.position?.[2] !== undefined ? target.position[2] : 0,
          ],
          props: {
            ...(target.props ? JSON.parse(JSON.stringify(target.props)) : {}),
            groupId: newGroupId || target.props?.groupId,
            folderId: newFolderId,
            folderName: newFolderName,
            colorSeed: Math.random(),
            ...(isFloor ? { isMain: false, isMainFloor: false } : {}),
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
    (id, count = 2, customGap) => {
      const target = items.find((it) => it.id === id);
      if (!target || count < 2) return;

      pushHistory(items);

      if (target.type === "drawer_g") {
        const targetGroupId = target.groupId || target.props?.groupId;
        // Se já estiver multiplicada (mais de 5 gavetas no mesmo grupo ou flag isMultiplied), bloqueia
        if (target.isMultiplied || target.props?.isMultiplied) return;
        if (targetGroupId) {
          const groupCount = items.filter(
            (it) => it.type === "drawer_g" && (it.groupId === targetGroupId || it.props?.groupId === targetGroupId)
          ).length;
          if (groupCount > 5) return;
        }

        const now = Date.now();
        const masterGroupId = `drawer_group_${now}_${Math.floor(Math.random() * 10000)}`;

        // Identifica o próximo número de Prateleira G disponível para a pasta
        const existingFolderNames = new Set(
          items
            .map((it) => it.folderName || it.props?.folderName)
            .filter(Boolean)
        );
        let shelfNum = 1;
        while (existingFolderNames.has(`Prateleira G ${shelfNum}`)) {
          shelfNum++;
        }
        const folderName = `Prateleira G ${shelfNum}`;
        const folderId = `folder_drawer_${now}`;

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
        const W = Math.max(0.15, Number(target.props?.width) || 0.36);
        const sideGap = 0.008;
        const barSize = 0.012;
        const cageW = W + sideGap * 2 + barSize * 2; // 0.40m
        const larguraTotal = cageW * scaleFactor; // 0.72m
        const gapOffset = customGap !== undefined ? Number(customGap) : (GAVETAS_GAP ?? 0);
        const PASSO_COLUNA = larguraTotal + gapOffset;

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
              isMultiplied: true,
              groupId: masterGroupId,
              folderId: folderId,
              folderName: folderName,
              name: newName,
              position: newPos,
              rotation: [...(drawer.rotation || rot)],
              props: {
                ...JSON.parse(JSON.stringify(drawer.props || {})),
                isMultiplied: true,
                groupId: masterGroupId,
                folderId: folderId,
                folderName: folderName,
                tierIndex: drawer.props?.tierIndex ?? tierIdx,
              },
            });
          });
        }

        const sourceIds = new Set(sourceDrawers.map((sd) => sd.id));
        setItems((prev) => {
          const updated = prev.map((it) => {
            if (sourceIds.has(it.id)) {
              return {
                ...it,
                isMultiplied: true,
                groupId: masterGroupId,
                folderId: folderId,
                folderName: folderName,
                props: {
                  ...it.props,
                  isMultiplied: true,
                  groupId: masterGroupId,
                  folderId: folderId,
                  folderName: folderName,
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

      const targetGroupId = target.groupId || target.props?.groupId;
      // Se já estiver multiplicada (mais de 1 caixa no mesmo grupo ou conexões laterais ou flag isMultiplied), bloqueia
      if (target.isMultiplied || target.props?.isMultiplied) return;
      if (targetGroupId) {
        const groupCount = items.filter(
          (it) => it.type === "box" && (it.groupId === targetGroupId || it.props?.groupId === targetGroupId)
        ).length;
        if (groupCount > 1) return;
      }
      if (target.props?.connectedLeft || target.props?.connectedRight) return;

      const CAIXA_LARGURA = 0.298096 * 1.95; // 0.5812872
      const GAP_X = customGap !== undefined ? Number(customGap) : 0.003;
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
      const hasDoubleRail = Boolean(target.props?.doubleRail || target.props?.trilhoDuplo);

      const uniqueGroupId = `box_group_${now}_${Math.floor(Math.random() * 10000)}`;

      // Identifica o próximo número de Trilho disponível para a pasta
      const existingFolderNames = new Set(
        items
          .map((it) => it.folderName || it.props?.folderName)
          .filter(Boolean)
      );
      let railNum = 1;
      while (existingFolderNames.has(`Trilho ${railNum}`)) {
        railNum++;
      }
      const folderName = `Trilho ${railNum}`;
      const folderId = `folder_box_${now}`;

      // Atualiza o item original para conter o groupId, folderId e ser a Coluna 1 do grupo
      const updatedOriginal = {
        ...target,
        isMultiplied: true,
        groupId: uniqueGroupId,
        folderId: folderId,
        folderName: folderName,
        name: target.name?.match(/\s+\d+$/) ? target.name : `${baseName} 1`,
        props: {
          ...target.props,
          isMultiplied: true,
          groupId: uniqueGroupId,
          folderId: folderId,
          folderName: folderName,
          rail: hasRail,
          trilho: hasRail,
          varal: hasVaral,
          doubleRail: hasDoubleRail,
          trilhoDuplo: hasDoubleRail,
          connectedLeft: false,
          connectedRight: hasRail ? count > 1 : false,
        },
      };

      // Cria as count - 1 novas colunas à direita
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
          isMultiplied: true,
          groupId: uniqueGroupId,
          folderId: folderId,
          folderName: folderName,
          name: `${baseName} ${i + 1}`,
          position: colPos,
          rotation: [...rot],
          props: {
            ...JSON.parse(JSON.stringify(target.props || {})),
            isMultiplied: true,
            groupId: uniqueGroupId,
            folderId: folderId,
            folderName: folderName,
            colorSeed: Math.random(),
            rail: hasRail,
            trilho: hasRail,
            varal: hasVaral,
            doubleRail: hasDoubleRail,
            trilhoDuplo: hasDoubleRail,
            connectedLeft: hasRail ? true : false,
            connectedRight: hasRail ? !isLast : false,
          },
        });
      }

      setItems((prev) => {
        const updated = prev.map((it) => (it.id === target.id ? updatedOriginal : it));
        return [...updated, ...newItems];
      });

      // Mantém a caixa alvo selecionada
      setSelectedIds([target.id]);
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
          const prefix = target.type === "box" ? "box_group" : "drawer_group";
          groupMap[newGroupId] = `${prefix}_${timestamp}_${Math.floor(Math.random() * 1000)}`;
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

  // Alterna a definição do Piso Principal da cena (Garante ESTRITAMENTE no máximo 1 piso principal)
  const toggleMainFloor = useCallback(
    (floorId) => {
      pushHistory(items);
      const targetFloor = items.find((it) => it.id === floorId);
      const targetIsCurrentlyMain = Boolean(
        targetFloor?.isMainFloor || targetFloor?.props?.isMain || targetFloor?.props?.isMainFloor
      );
      // Se o piso clicado já era principal, desativa. Se não era, ele se torna o ÚNICO piso principal da cena.
      const shouldBeMain = !targetIsCurrentlyMain;

      setItems((prev) =>
        prev.map((it) => {
          if (it.type !== "floor") return it;
          const isThisTarget = it.id === floorId;
          const active = isThisTarget ? shouldBeMain : false;

          return {
            ...it,
            isMainFloor: active,
            props: {
              ...it.props,
              isMain: active,
              isMainFloor: active,
            },
          };
        })
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
    toggleMainFloor,
    clearAll,
    loadTemplate,
    undo,
    redo,
    copyItem,
    pasteItem,
  };
}
