"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import {
  mergeGeometries,
  mergeVertices,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  FATOR_ESCALA,
  CAIXA_COMPRIMENTO,
  CAIXA_LARGURA,
  CAIXA_ALTURA,
  GAP_Y,
  GAP_LATERAL,
  BOXES_PER_LAYER,
  MAX_PALLET_BOXES,
  DEFAULT_BOX_COLOR,
  resolveSeedBase,
  createBoxMaterial,
} from "./boxConfig";

// Re-exporta para manter compatibilidade
export { FATOR_ESCALA, CAIXA_COMPRIMENTO, CAIXA_LARGURA, CAIXA_ALTURA };

// Dimensões base do Pallet no Blender multiplicadas pelo FATOR_ESCALA centralizado
export const PALLET_WIDTH = 0.81548 * FATOR_ESCALA;  // ~1.6228m (Eixo X)
export const PALLET_DEPTH = 0.98422 * FATOR_ESCALA;  // ~1.9586m (Eixo Z)
export const PALLET_HEIGHT = 0.11000 * FATOR_ESCALA; // ~0.2348m (Eixo Y)

/**
 * PalletModel milimetricamente fiel às referências do Blender:
 * - 7 ripas superiores longitudinais (eixo Z), sendo a 1ª, 4ª e 7ª alinhadas às colunas
 * - 3 travessas transversais intermediárias (eixo X) logo abaixo do tampo superior
 * - 9 blocos espaçadores (3x3) formando os vãos laterais e frontais da empilhadeira
 * - 3 longarinas inferiores longitudinais (eixo Z) formando as 4 janelas inferiores
 * - Geometria fundida em 1 único draw call (Zero GC)
 * - Suporte a caixas brancas com dimensões e tonalidades HSL idênticas ao BoxModel
 */
export default function PalletModel({
  width = PALLET_WIDTH,
  depth = PALLET_DEPTH,
  height = PALLET_HEIGHT,
  color = "#c49a67",
  wireframe = false,
  boxCount = 0,
  boxColor = DEFAULT_BOX_COLOR,
  itemId = null,
  modelId = null,
  colorSeed = null,
  seed = null,
  position = null,
}) {
  const instanceSeed = useMemo(
    () => Math.floor(Math.random() * 1000000) + 1,
    []
  );

  const seedBase = useMemo(() => {
    return resolveSeedBase({
      colorSeed,
      seed,
      itemId,
      modelId,
      position,
      fallbackSeed: instanceSeed,
    });
  }, [colorSeed, seed, itemId, modelId, position, instanceSeed]);

  const palletMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.78,
        metalness: 0.05,
        wireframe,
      }),
    [color, wireframe]
  );

  const palletGeo = useMemo(() => {
    const parts = [];

    // Proporções exatas extraídas da malha de referência do Blender
    const numTopSlats = 7;
    // As 7 ripas têm a mesma largura das 3 colunas/longarinas; os 6 vãos têm ~28.5% da largura da ripa
    const slatW = width / (numTopSlats + 6 * 0.285);
    const slatGap = (width - numTopSlats * slatW) / (numTopSlats - 1);

    // Espessuras verticais (Eixo Y):
    // 1. Ripas do topo (~16% da altura total)
    // 2. Travessa transversal (~18% da altura total)
    // 3. Blocos espaçadores (~48% da altura total)
    // 4. Longarinas da base (~18% da altura total)
    const topSlatH = height * 0.16;
    const crossBoardH = height * 0.18;
    const bottomRunnerH = height * 0.18;
    const blockH = height - topSlatH - crossBoardH - bottomRunnerH;

    // Largura das 3 colunas longitudinais (alinhadas com a 1ª, 4ª e 7ª ripas)
    const colW = slatW;
    const colPositionsX = [-width / 2 + colW / 2, 0, width / 2 - colW / 2];

    // Comprimento (Z) dos blocos frontais, centrais e traseiros
    const endBlockD = depth * 0.115;
    const midBlockD = depth * 0.115;
    const rowPositionsZ = [
      { z: -depth / 2 + endBlockD / 2, d: endBlockD },
      { z: 0, d: midBlockD },
      { z: depth / 2 - endBlockD / 2, d: endBlockD },
    ];

    // Centros verticais (Y de 0 até height)
    const yBottomRunner = bottomRunnerH / 2;
    const yBlock = bottomRunnerH + blockH / 2;
    const yCrossBoard = bottomRunnerH + blockH + crossBoardH / 2;
    const yTopSlat = height - topSlatH / 2;

    // ── 1. 7 Ripas Superiores Longitudinais (correm ao longo de Z) ──
    for (let i = 0; i < numTopSlats; i++) {
      const x = -width / 2 + slatW / 2 + i * (slatW + slatGap);
      const slat = new THREE.BoxGeometry(slatW, topSlatH, depth);
      slat.translate(x, yTopSlat, 0);
      parts.push(slat);
    }

    // ── 2. 3 Travessas Transversais abaixo das ripas (correm ao longo de X) ──
    for (const row of rowPositionsZ) {
      const cross = new THREE.BoxGeometry(width, crossBoardH, row.d);
      cross.translate(0, yCrossBoard, row.z);
      parts.push(cross);
    }

    // ── 3. 9 Blocos Espaçadores (3 colunas x 3 linhas) ──
    for (const x of colPositionsX) {
      for (const row of rowPositionsZ) {
        const block = new THREE.BoxGeometry(colW, blockH, row.d);
        block.translate(x, yBlock, row.z);
        parts.push(block);
      }
    }

    // ── 4. 3 Longarinas Inferiores Longitudinais (correm ao longo de Z) ──
    for (const x of colPositionsX) {
      const runner = new THREE.BoxGeometry(colW, bottomRunnerH, depth);
      runner.translate(x, yBottomRunner, 0);
      parts.push(runner);
    }

    const raw = mergeGeometries(
      parts.map((g) => (g.index ? g.toNonIndexed() : g)),
      false
    );
    raw.computeVertexNormals();
    const merged = mergeVertices(raw);

    parts.forEach((g) => g.dispose());
    raw.dispose();

    return merged;
  }, [width, depth, height]);

  // Geometrias reutilizáveis compartilhadas por todas as caixas do pallet (Zero GC)
  const geomHorizontal = useMemo(
    () => new THREE.BoxGeometry(CAIXA_COMPRIMENTO, CAIXA_ALTURA, CAIXA_LARGURA),
    []
  );
  const geomVertical = useMemo(
    () => new THREE.BoxGeometry(CAIXA_LARGURA, CAIXA_ALTURA, CAIXA_COMPRIMENTO),
    []
  );

  const boxInstances = useMemo(() => {
    const validCount = Math.min(MAX_PALLET_BOXES, Math.max(0, parseInt(boxCount, 10) || 0));
    if (validCount <= 0) return [];

    const boxL = CAIXA_COMPRIMENTO;
    const boxW = CAIXA_LARGURA;
    const boxH = CAIXA_ALTURA;
    const gap = GAP_LATERAL;
    const gapY = GAP_Y;

    // Disposição fiel às referências (Imagens de exemplo):
    // - Coluna esquerda: 3 caixas horizontais (largura boxL, profundidade boxW)
    // - Coluna direita: 2 caixas verticais (largura boxW, profundidade boxL)
    const patternWidth = boxL + gap + boxW;
    const leftColX = -patternWidth / 2 + boxL / 2;
    const rightColX = patternWidth / 2 - boxW / 2;

    const depth3 = 3 * boxW + 2 * gap;
    const startZ3 = -depth3 / 2;

    const depth2 = 2 * boxL + gap;
    const startZ2 = -depth2 / 2;

    // As 3 caixas e as 2 caixas ficam ambas perfeitamente centralizadas no eixo Z (z = 0)
    const boxConfigs = [
      { x: leftColX, z: startZ3 + boxW / 2, isVertical: false },
      { x: leftColX, z: startZ3 + boxW + gap + boxW / 2, isVertical: false },
      { x: leftColX, z: startZ3 + 2 * (boxW + gap) + boxW / 2, isVertical: false },
      { x: rightColX, z: startZ2 + boxL / 2, isVertical: true },
      { x: rightColX, z: startZ2 + boxL + gap + boxL / 2, isVertical: true },
    ];

    return Array.from({ length: validCount }).map((_, i) => {
      const layerIdx = Math.floor(i / BOXES_PER_LAYER);
      const boxInLayer = i % BOXES_PER_LAYER;
      const cfg = boxConfigs[boxInLayer];
      const y = height + layerIdx * (boxH + gapY) + boxH / 2;

      // Material com a exata mesma regra de variação tonal HSL e propriedades físicas do BoxModel
      const mat = createBoxMaterial(boxColor, seedBase, i, wireframe);

      return {
        position: [cfg.x, y, cfg.z],
        isVertical: cfg.isVertical,
        material: mat,
      };
    });
  }, [boxCount, height, boxColor, seedBase, wireframe]);

  return (
    <group position={[0, 0, 0]}>
      <mesh geometry={palletGeo} material={palletMaterial} />
      {boxInstances.map((box, idx) => (
        <mesh
          key={idx}
          geometry={box.isVertical ? geomVertical : geomHorizontal}
          material={box.material}
          position={box.position}
        />
      ))}
    </group>
  );
}