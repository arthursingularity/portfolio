"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import {
  CAIXA_COMPRIMENTO,
  CAIXA_LARGURA,
  CAIXA_ALTURA,
  GAP_Y,
  DEFAULT_BOX_COLOR,
  resolveSeedBase,
  createBoxMaterial,
} from "./boxConfig";

/**
 * Trilho com Caixas (Warehouse Stacking Rail)
 * - 1 coluna única de caixas (cubos puros boxGeometry)
 * - Altura ajustável de 1 até o máximo de 6 caixas empilhadas
 * - Cores base personalizáveis por caixa com variância determinística HSL única por modelo
 * - Base: Trilho sólido laranja de aço onde as caixas repousam
 * - Opção 'Varal': Estrutura metálica laranja atrás das caixas com postes laterais,
 *   barra superior e placa central no topo.
 */
export default function BoxModel({
  maxHeight = 6,
  count = 6,
  rail = false,
  trilho = false,
  varal = false,
  showVaral = false,
  doubleRail = false,
  trilhoDuplo = false,
  connectedLeft = false,
  connectedRight = false,
  boxColor = DEFAULT_BOX_COLOR,
  selectedColors = null,
  boxColors = null,
  wireframe = false,
  itemId = null,
  modelId = null,
  colorSeed = null,
  seed = null,
  position = null,
}) {
  const hasRail = Boolean(rail || trilho);
  const hasVaral = Boolean(hasRail && (varal || showVaral));
  const isDoubleRail = Boolean(doubleRail || trilhoDuplo);
  const railH = 0.070;
  const baseY = hasRail ? railH : 0;

  // Conexões laterais entre colunas
  const isConnL = Boolean(connectedLeft);
  const isConnR = Boolean(connectedRight);

  // Quantidade de caixas na coluna: 0 até o máximo de 6
  const targetCount = maxHeight ?? count ?? 6;
  const safeCount = Math.min(6, Math.max(0, targetCount));

  // Instância fallback única caso nenhum ID ou seed seja passado
  const instanceSeed = 12345;

  // Semente única calculada para este modelo específico
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

  // Materiais das caixas por andar (tier), compartilhando exatamente as mesmas regras de tonalidade e HSL
  const tierMaterials = useMemo(() => {
    return Array.from({ length: safeCount }).map((_, tierIdx) => {
      let hex = DEFAULT_BOX_COLOR;
      if (Array.isArray(boxColors) && boxColors[tierIdx]) {
        hex = boxColors[tierIdx];
      } else if (Array.isArray(selectedColors) && selectedColors.length > 0) {
        hex = selectedColors[tierIdx % selectedColors.length];
      } else if (boxColor) {
        hex = boxColor;
      }

      return createBoxMaterial(hex, seedBase, tierIdx, wireframe);
    });
  }, [safeCount, boxColors, selectedColors, boxColor, wireframe, seedBase]);

  // Materiais das caixas da 2ª fileira (Trilho Duplo) com sutil variação tonal realista
  const tierMaterialsRow2 = useMemo(() => {
    if (!isDoubleRail) return [];
    return Array.from({ length: safeCount }).map((_, tierIdx) => {
      let hex = DEFAULT_BOX_COLOR;
      if (Array.isArray(boxColors) && boxColors[tierIdx]) {
        hex = boxColors[tierIdx];
      } else if (Array.isArray(selectedColors) && selectedColors.length > 0) {
        hex = selectedColors[tierIdx % selectedColors.length];
      } else if (boxColor) {
        hex = boxColor;
      }

      return createBoxMaterial(hex, seedBase, tierIdx + 12, wireframe);
    });
  }, [isDoubleRail, safeCount, boxColors, selectedColors, boxColor, wireframe, seedBase]);

  // Materiais do trilho metálico laranja de base e varal
  const railMaterials = useMemo(
    () => ({
      orangeRail: new THREE.MeshStandardMaterial({
        color: "#FF6600",
        roughness: 0.35,
        metalness: 0.35,
        wireframe,
      }),
      orangeDark: new THREE.MeshStandardMaterial({
        color: "#FF6600",
        roughness: 0.45,
        metalness: 0.3,
        wireframe,
      }),
      blackPlaca: new THREE.MeshStandardMaterial({
        color: "#18181b",
        roughness: 0.5,
        metalness: 0.2,
        wireframe,
      }),
    }),
    [wireframe]
  );

  // Dimensões do conjunto baseadas nas caixas do EstoqueModel
  const crateW = CAIXA_LARGURA;
  const crateD = CAIXA_COMPRIMENTO;
  const crateH = CAIXA_ALTURA;

  // Parâmetros da estrutura do Varal
  const postW = 0.04; // Espessura dos postes em X
  const postD = 0.02; // Espessura dos postes em Z
  const beamH = 0.045; // Altura da barra superior em Y

  // Placa
  const tabW = 0.25; // Largura do bloco central no topo
  const tabH = 0.09; // Altura do bloco central no topo
  const gapAbove6thBox = 0.03; // Espaço acima da 6ª caixa até a barra superior

  // O trilho e o varal possuem exatamente o mesmo tamanho lateral que as caixas brancas (crateW)
  // Quando conectado com colunas vizinhas, estende metade do gap lateral (GAP_Y / 2) para conectar sem costura
  const GAP_LATERAL = GAP_Y; // 0.003
  const bridgeLeft = isConnL ? GAP_LATERAL / 2 : 0;
  const bridgeRight = isConnR ? GAP_LATERAL / 2 : 0;

  const topBeamW = crateW + bridgeLeft + bridgeRight;
  const topBeamCenterX = (bridgeRight - bridgeLeft) / 2;

  const railW = crateW + bridgeLeft + bridgeRight;
  const railCenterX = (bridgeRight - bridgeLeft) / 2;

  // Dimensões em Z considerando se é Trilho Duplo (+1 fileira em profundidade)
  const GAP_Z = 0.004; // Espaçamento de 4mm entre fileiras para corte visual nítido
  const row2OffsetZ = crateD + GAP_Z;
  const effectiveCrateD = isDoubleRail ? 2 * crateD + GAP_Z : crateD;
  const baseCenterZ = isDoubleRail ? (crateD + GAP_Z) / 2 : 0;

  const railD = hasVaral ? effectiveCrateD + postD : effectiveCrateD;
  const railCenterZ = baseCenterZ + (hasVaral ? -postD / 2 : 0);

  // Geometria e alturas do Varal (dimensionado para a altura máxima de 6 caixas)
  const maxBoxes = 6;
  const stackTopY = railH + maxBoxes * crateH + (maxBoxes - 1) * GAP_Y;
  const topBeamBottomY = stackTopY + gapAbove6thBox;
  const postHeight = topBeamBottomY - railH;
  const postCenterY = railH + postHeight / 2;
  const topBeamCenterY = topBeamBottomY + beamH / 2;
  const tabCenterY = topBeamBottomY + tabH / 2;

  // Posições dos postes externos laterais (alinhados com as bordas da caixa, sem passar para fora)
  const leftPostX = -crateW / 2 + postW / 2;
  const rightPostX = crateW / 2 - postW / 2;
  const varalZ = -crateD / 2 - postD / 2;

  // Geometria reutilizada para todas as caixas da coluna
  const crateGeo = useMemo(
    () => new THREE.BoxGeometry(crateW, crateH, crateD),
    [crateW, crateH, crateD]
  );

  // Placa central de identificação do topo
  const placaGeo = useMemo(
    () => (hasVaral ? new THREE.BoxGeometry(tabW, tabH, postD + 0.006) : null),
    [hasVaral, tabW, tabH, postD]
  );

  // Fusão de toda a estrutura metálica de suporte (Trilho + Pés + Varal) em 1 único draw call
  const steelStructureGeo = useMemo(() => {
    if (!hasRail && !hasVaral) return null;
    const parts = [];

    // Viga principal do trilho de chão
    if (hasRail) {
      const viga = new THREE.BoxGeometry(railW, railH, railD);
      viga.translate(railCenterX, railH / 2, railCenterZ);
      parts.push(viga);

      // Pés externos de apoio
      if (!isConnL) {
        const footL = new THREE.BoxGeometry(0.06, 0.008, railD - 0.03);
        footL.translate(-crateW * 0.35 + railCenterX, 0.004, railCenterZ);
        parts.push(footL);
      }
      if (!isConnR) {
        const footR = new THREE.BoxGeometry(0.06, 0.008, railD - 0.03);
        footR.translate(crateW * 0.35 + railCenterX, 0.004, railCenterZ);
        parts.push(footR);
      }
    }

    // Estrutura do varal traseiro
    if (hasVaral) {
      if (!isConnL) {
        const postL = new THREE.BoxGeometry(postW, postHeight, postD);
        postL.translate(leftPostX, postCenterY, varalZ);
        parts.push(postL);
      }
      if (!isConnR) {
        const postR = new THREE.BoxGeometry(postW, postHeight, postD);
        postR.translate(rightPostX, postCenterY, varalZ);
        parts.push(postR);
      }
      const topBeam = new THREE.BoxGeometry(topBeamW, beamH, postD);
      topBeam.translate(topBeamCenterX, topBeamCenterY, varalZ);
      parts.push(topBeam);
    }

    if (parts.length === 0) return null;
    const raw = mergeGeometries(
      parts.map((g) => (g.index ? g.toNonIndexed() : g)),
      false
    );
    raw.computeVertexNormals();
    const result = mergeVertices(raw);
    parts.forEach((g) => g.dispose());
    raw.dispose();
    return result;
  }, [
    hasRail,
    hasVaral,
    isConnL,
    isConnR,
    railW,
    railH,
    railD,
    railCenterX,
    railCenterZ,
    crateW,
    postW,
    postHeight,
    postD,
    leftPostX,
    rightPostX,
    postCenterY,
    varalZ,
    topBeamW,
    beamH,
    topBeamCenterX,
    topBeamCenterY,
  ]);

  return (
    <group position={[0, 0, 0]}>
      {/* ── 1. Toda a estrutura de aço fundida em 1 único draw call ── */}
      {steelStructureGeo && (
        <mesh
          geometry={steelStructureGeo}
          material={railMaterials.orangeRail}
        />
      )}

      {/* ── 2. Placa Central no Topo (1 único mesh) ── */}
      {hasVaral && placaGeo && (
        <mesh
          geometry={placaGeo}
          material={railMaterials.blackPlaca}
          position={[0, tabCenterY, varalZ]}
        />
      )}

      {/* ── 3. Coluna(s) de Caixas compartilhando a mesma geometria (Zero GC / Instância limpa) ── */}
      {safeCount > 0 && (
        <group position={[0, baseY, 0]}>
          {/* Fileira 1 (Traseira - padrão) */}
          {Array.from({ length: safeCount }).map((_, tierIdx) => {
            const crateY = (tierIdx + 0.5) * crateH + tierIdx * GAP_Y;
            const crateMat = tierMaterials[tierIdx];

            return (
              <mesh
                key={`row1-${tierIdx}`}
                geometry={crateGeo}
                material={crateMat}
                position={[0, crateY, 0]}
              />
            );
          })}

          {/* Fileira 2 (Frontal - Trilho Duplo visual) */}
          {isDoubleRail &&
            Array.from({ length: safeCount }).map((_, tierIdx) => {
              const crateY = (tierIdx + 0.5) * crateH + tierIdx * GAP_Y;
              const crateMat = tierMaterialsRow2[tierIdx] || tierMaterials[tierIdx];

              return (
                <mesh
                  key={`row2-${tierIdx}`}
                  geometry={crateGeo}
                  material={crateMat}
                  position={[0, crateY, row2OffsetZ]}
                />
              );
            })}
        </group>
      )}
    </group>
  );
}
