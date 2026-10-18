"use client";

import React, { useMemo, useEffect, useState, useRef, useCallback } from "react";
import * as THREE from "three";

/**
 * ============================================================================
 * CONFIGURAÇÃO DO QUADRICULADO:
 * Você pode alterar a quantidade/tamanho do quadriculado aqui no código através
 * do parâmetro `markingGridSize` (padrão: 0.5 metros por quadradinho).
 * 
 * Exemplos de densidade da grade:
 *  - markingGridSize = 0.20 -> Quadradinhos de 20cm (alta densidade / 60x60)
 *  - markingGridSize = 0.25 -> Quadradinhos de 25cm (alta precisão / 48x48)
 *  - markingGridSize = 0.50 -> Quadradinhos de 50cm (padrão industrial / 24x24)
 *  - markingGridSize = 1.00 -> Quadradinhos de 1 metro (linhas largas / 12x12)
 * 
 * Você também pode alterar dinamicamente na aba de Propriedades do Piso na interface!
 * ============================================================================
 */

/**
 * Algoritmo de interpolação de linha em grade (Bresenham)
 * Garante que ao arrastar o mouse rapidamente, NENHUM quadradinho seja pulado no caminho.
 */
function getLineCells(c0, r0, c1, r1) {
  const cells = [];
  const dx = Math.abs(c1 - c0);
  const dz = Math.abs(r1 - r0);
  const sx = c0 < c1 ? 1 : -1;
  const sz = r0 < r1 ? 1 : -1;
  let err = dx - dz;

  let currX = c0;
  let currZ = r0;

  while (true) {
    cells.push({ col: currX, row: currZ });
    if (currX === c1 && currZ === r1) break;
    const e2 = 2 * err;
    if (e2 > -dz) {
      err -= dz;
      currX += sx;
    }
    if (e2 < dx) {
      err += dx;
      currZ += sz;
    }
  }
  return cells;
}

export default function FloorModel({
  width = 12,
  depth = 12,
  thickness = 0.08,
  wireframe = false,
  color = "#b0b4b8",
  markingMode = false,
  markingTool = "paint", // "paint" | "erase"
  markingGridSize = 0.5, // <-- TAMANHO DO QUADRADINHO (em metros). Altere aqui se desejar!
  markingColor = "#FACC15",
  paintedCells = {},
  itemId,
  onUpdateProps,
  orbitControlsRef,
}) {
  const groupRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastCellRef = useRef(null);
  const currentCellsRef = useRef(paintedCells || {});

  // Células pintadas mantidas em estado local para atualização instantânea a 60fps
  const [localCells, setLocalCells] = useState(paintedCells || {});
  const [hoverCell, setHoverCell] = useState(null);

  // Sincroniza estado local quando as props mudarem externamente (ex: limpar, desfazer)
  useEffect(() => {
    setLocalCells(paintedCells || {});
    currentCellsRef.current = paintedCells || {};
  }, [paintedCells]);

  const materials = useMemo(
    () => ({
      concrete: new THREE.MeshStandardMaterial({
        color: color || "#b0b4b8",
        roughness: 0.85,
        metalness: 0.05,
        wireframe,
      }),
    }),
    [wireframe, color]
  );

  // Atualiza cor do material em tempo real sem recriar shader
  useEffect(() => {
    if (materials.concrete) {
      materials.concrete.color.set(color || "#b0b4b8");
    }
  }, [color, materials.concrete]);

  const safeW = Math.max(0.5, Number(width) || 10);
  const safeD = Math.max(0.5, Number(depth) || 10);
  const fixedThickness = 0.08; // Altura sempre fixa

  // Tamanho do quadradinho da grade (grid size)
  const cellSize = Math.max(0.05, Number(markingGridSize) || 0.5);

  // Geometria do Quadriculado (Grid de Linhas) exibido apenas no Modo Marcação
  const gridGeometry = useMemo(() => {
    if (!markingMode) return null;
    const pts = [];
    const hw = safeW / 2;
    const hd = safeD / 2;

    const minCol = Math.floor(-hw / cellSize);
    const maxCol = Math.ceil(hw / cellSize);
    for (let c = minCol; c <= maxCol; c++) {
      const x = Math.round(c * cellSize * 1000) / 1000;
      if (x >= -hw - 0.001 && x <= hw + 0.001) {
        pts.push(new THREE.Vector3(x, fixedThickness / 2 + 0.0015, -hd));
        pts.push(new THREE.Vector3(x, fixedThickness / 2 + 0.0015, hd));
      }
    }

    const minRow = Math.floor(-hd / cellSize);
    const maxRow = Math.ceil(hd / cellSize);
    for (let r = minRow; r <= maxRow; r++) {
      const z = Math.round(r * cellSize * 1000) / 1000;
      if (z >= -hd - 0.001 && z <= hd + 0.001) {
        pts.push(new THREE.Vector3(-hw, fixedThickness / 2 + 0.0015, z));
        pts.push(new THREE.Vector3(hw, fixedThickness / 2 + 0.0015, z));
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [markingMode, safeW, safeD, fixedThickness, cellSize]);

  // Geometria 3D e contorno do quadradinho sob hover
  const hoverBoxGeo = useMemo(() => {
    return new THREE.BoxGeometry(cellSize * 0.99, 0.003, cellSize * 0.99);
  }, [cellSize]);

  const hoverEdgesGeo = useMemo(() => {
    return new THREE.EdgesGeometry(hoverBoxGeo);
  }, [hoverBoxGeo]);

  // Converte ponto de interseção do raycaster 3D em célula da grade
  const getCellFromWorldPoint = useCallback(
    (worldPoint) => {
      if (!groupRef.current || !worldPoint) return null;
      groupRef.current.updateWorldMatrix(true, false);
      const local = groupRef.current.worldToLocal(worldPoint.clone());
      const px = local.x;
      const pz = local.z;

      // Tolerância para garantir detecção até as bordas
      const hw = safeW / 2;
      const hd = safeD / 2;
      if (Math.abs(px) > hw + 0.1 || Math.abs(pz) > hd + 0.1) return null;

      const col = Math.floor(px / cellSize);
      const row = Math.floor(pz / cellSize);
      const cx = (col + 0.5) * cellSize;
      const cz = (row + 0.5) * cellSize;

      return {
        col,
        row,
        key: `${col}_${row}`,
        cx: Math.round(cx * 1000) / 1000,
        cz: Math.round(cz * 1000) / 1000,
        size: cellSize,
      };
    },
    [safeW, safeD, cellSize]
  );

  // Salva permanentemente as células pintadas no estado do projeto
  const commitPaint = useCallback(() => {
    if (!onUpdateProps || !itemId) return;
    onUpdateProps(itemId, {
      paintedCells: { ...currentCellsRef.current },
    });
  }, [onUpdateProps, itemId]);

  // Pinta ou apaga uma lista de células (com suporte a interpolação para arrasto suave)
  const paintCellsList = useCallback(
    (cellsToPaint) => {
      if (!cellsToPaint || cellsToPaint.length === 0) return;

      const current = { ...currentCellsRef.current };
      const isErase = markingTool === "erase";
      const activeColor = markingColor || "#FACC15";
      let changed = false;

      cellsToPaint.forEach(({ col, row }) => {
        const cx = Math.round((col + 0.5) * cellSize * 1000) / 1000;
        const cz = Math.round((row + 0.5) * cellSize * 1000) / 1000;

        // Limita ao piso
        if (Math.abs(cx) > safeW / 2 || Math.abs(cz) > safeD / 2) return;

        const key = `${col}_${row}`;

        if (isErase) {
          if (current[key]) {
            delete current[key];
            changed = true;
          }
        } else {
          if (
            !current[key] ||
            current[key].color !== activeColor ||
            current[key].size !== cellSize
          ) {
            current[key] = {
              x: cx,
              z: cz,
              size: cellSize,
              color: activeColor,
            };
            changed = true;
          }
        }
      });

      if (changed) {
        currentCellsRef.current = current;
        setLocalCells(current);
      }
    },
    [cellSize, safeW, safeD, markingTool, markingColor]
  );

  // Eventos de Ponteiro: Clicar e Arrastar Contínuo
  const handlePointerDown = (e) => {
    if (!markingMode) return;
    // Aceita apenas botão esquerdo (button 0)
    if (e.button !== 0) return;

    e.stopPropagation();

    // Captura o ponteiro para garantir que todos os eventos de arrasto sejam entregues
    if (e.target && e.target.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {
        // Ignora caso o navegador não suporte
      }
    }

    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = false;
    }

    isDraggingRef.current = true;

    const cell = getCellFromWorldPoint(e.point);
    if (cell) {
      lastCellRef.current = { col: cell.col, row: cell.row };
      paintCellsList([cell]);
    }
  };

  const handlePointerMove = (e) => {
    if (!markingMode) return;
    e.stopPropagation();

    const cell = getCellFromWorldPoint(e.point);
    setHoverCell(cell);
    if (document.body.style.cursor !== "crosshair") {
      document.body.style.cursor = "crosshair";
    }

    // Se estiver arrastando (clique segurado)
    if ((isDraggingRef.current || e.buttons === 1) && cell) {
      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        if (orbitControlsRef?.current) {
          orbitControlsRef.current.enabled = false;
        }
      }

      if (lastCellRef.current) {
        // Interpolação contínua entre a célula anterior e a atual (evita pulos)
        const line = getLineCells(
          lastCellRef.current.col,
          lastCellRef.current.row,
          cell.col,
          cell.row
        );
        paintCellsList(line);
      } else {
        paintCellsList([cell]);
      }
      lastCellRef.current = { col: cell.col, row: cell.row };
    }
  };

  const handlePointerUp = (e) => {
    if (!markingMode) return;
    if (e) e.stopPropagation();

    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      lastCellRef.current = null;
      commitPaint();
    }

    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = true;
    }
  };

  const handlePointerLeave = () => {
    setHoverCell(null);
    document.body.style.cursor = "default";
  };

  // Garante restauração do cursor caso saia do modo marcação
  useEffect(() => {
    if (!markingMode) {
      setHoverCell(null);
      document.body.style.cursor = "default";
    }
    return () => {
      document.body.style.cursor = "default";
    };
  }, [markingMode]);

  // Garante que o OrbitControls é reativado se o usuário soltar o clique em qualquer lugar
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        lastCellRef.current = null;
        if (orbitControlsRef?.current) {
          orbitControlsRef.current.enabled = true;
        }
        commitPaint();
      }
    };

    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => window.removeEventListener("pointerup", handleGlobalPointerUp);
  }, [commitPaint, orbitControlsRef]);

  // Lista de células pintadas ativas
  const cellList = Object.entries(localCells || {});

  // Cores dinâmicas do Hover para TODOS os quadradinhos (Azul Claro)
  const hoverVisual = useMemo(() => {
    if (!hoverCell) return null;
    const isErase = markingTool === "erase";
    const existing = localCells?.[hoverCell.key];

    // Azul claro como cor padrão do hover
    const lightBlue = "#38bdf8";
    const lightBlueBorder = "#bae6fd";

    let color = lightBlue;
    let opacity = 0.8;
    let borderColor = lightBlueBorder;

    if (isErase) {
      color = "#EF4444";
      opacity = existing ? 0.92 : 0.45;
      borderColor = "#EF4444";
    } else {
      if (existing) {
        // Célula já pintada: realce azul claro luminoso com contorno branco
        color = "#7dd3fc";
        opacity = 0.95;
        borderColor = "#ffffff";
      } else {
        // Célula vazia: preenchimento azul claro limpo
        color = lightBlue;
        opacity = 0.8;
        borderColor = lightBlueBorder;
      }
    }

    return {
      color,
      opacity,
      borderColor,
    };
  }, [hoverCell, markingTool, localCells]);

  return (
    <group
      ref={groupRef}
      position={[0, -fixedThickness / 2, 0]}
      onPointerDown={markingMode ? handlePointerDown : undefined}
      onPointerMove={markingMode ? handlePointerMove : undefined}
      onPointerUp={markingMode ? handlePointerUp : undefined}
      onPointerLeave={markingMode ? handlePointerLeave : undefined}
    >
      {/* ── 1. Placa de Concreto Principal (Superfície Base que recebe diretamente os eventos 3D) ── */}
      <mesh
        material={materials.concrete}
        onPointerDown={markingMode ? handlePointerDown : undefined}
        onPointerMove={markingMode ? handlePointerMove : undefined}
        onPointerUp={markingMode ? handlePointerUp : undefined}
        onPointerLeave={markingMode ? handlePointerLeave : undefined}
      >
        <boxGeometry args={[safeW, fixedThickness, safeD]} />
      </mesh>

      {/* ── 2. Células / Quadradinhos Pintados (Linhas Retas, Diagonais e Áreas) ── */}
      {cellList.map(([key, cell]) => {
        const size = Number(cell.size) || cellSize;
        return (
          <mesh
            key={key}
            position={[cell.x, fixedThickness / 2 + 0.0016, cell.z]}
            raycast={() => null}
          >
            <boxGeometry args={[size * 0.99, 0.002, size * 0.99]} />
            <meshStandardMaterial
              color={cell.color || "#FACC15"}
              roughness={0.35}
              metalness={0.08}
            />
          </mesh>
        );
      })}

      {/* ── 3. Quadriculado (Grid Lines) quando o Modo Marcação está ativo ── */}
      {markingMode && gridGeometry && (
        <lineSegments geometry={gridGeometry} raycast={() => null}>
          <lineBasicMaterial
            color="#ffffff"
            opacity={0.45}
            transparent
            depthWrite={false}
          />
        </lineSegments>
      )}

      {/* ── 4. Indicador de Hover do Quadradinho sob o Cursor (Muda de Cor instantaneamente) ── */}
      {markingMode && hoverCell && hoverVisual && (
        <group position={[hoverCell.cx, fixedThickness / 2 + 0.0025, hoverCell.cz]}>
          {/* Caixa 3D preenchendo o quadradinho inteiro com a nova cor vibrante */}
          <mesh geometry={hoverBoxGeo} renderOrder={999} raycast={() => null}>
            <meshBasicMaterial
              color={hoverVisual.color}
              opacity={hoverVisual.opacity}
              transparent
              depthTest={false}
            />
          </mesh>

          {/* Borda / Contorno de Destaque do Quadradinho sob hover */}
          <lineSegments geometry={hoverEdgesGeo} renderOrder={1000} raycast={() => null}>
            <lineBasicMaterial
              color={hoverVisual.borderColor}
              depthTest={false}
            />
          </lineSegments>
        </group>
      )}
    </group>
  );
}
