"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// ---------------------------------------------------------------------------
// DIMENSÕES E ESCALA EXATAMENTE IGUAIS ÀS CAIXAS DE EstoqueModel.tsx
// ---------------------------------------------------------------------------
const FATOR_ESCALA = 1.95;
const CAIXA_COMPRIMENTO = 0.466947 * FATOR_ESCALA; // L = 0.91054665 (Profundidade no eixo Z)
const CAIXA_LARGURA = 0.298096 * FATOR_ESCALA;     // W = 0.5812872 (Largura no eixo X)
const CAIXA_ALTURA = 0.193756 * FATOR_ESCALA;      // H = 0.3778242 (Altura no eixo Y)
const GAP_Y = 0.003; // Separação vertical sutil entre caixas empilhadas

// Hash determinístico para converter strings (ex: item.id) em número inteiro positivo
function hashString(str) {
  if (!str) return 1;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 1;
}

// Gerador pseudo-aleatório determinístico (retorna float entre 0 e 1)
function pseudoRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

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
  connectedLeft = false,
  connectedRight = false,
  boxColor = "#E0E0E0",
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
  const railH = 0.070;
  const baseY = hasRail ? railH : 0;

  // Conexões laterais entre colunas
  const isConnL = Boolean(connectedLeft);
  const isConnR = Boolean(connectedRight);

  // Quantidade de caixas na coluna: 0 até o máximo de 6
  const targetCount = maxHeight ?? count ?? 6;
  const safeCount = Math.min(6, Math.max(0, targetCount));

  // Instância fallback única caso nenhum ID ou seed seja passado
  const instanceSeed = useMemo(
    () => Math.floor(Math.random() * 1000000) + 1,
    []
  );

  // Semente única calculada para este modelo específico
  const seedBase = useMemo(() => {
    if (typeof colorSeed === "number" && !isNaN(colorSeed)) {
      return Math.floor(colorSeed * 1000000) + 1;
    }
    if (typeof seed === "number" && !isNaN(seed)) {
      return Math.floor(seed) + 1;
    }
    const idToUse =
      itemId ||
      modelId ||
      (Array.isArray(position) ? position.join(",") : null);
    if (idToUse) {
      return hashString(String(idToUse));
    }
    return instanceSeed;
  }, [colorSeed, seed, itemId, modelId, position, instanceSeed]);

  // Materiais das caixas por andar (tier), preservando as cores bases exatas com variações suaves e sutis por modelo
  const tierMaterials = useMemo(() => {
    return Array.from({ length: safeCount }).map((_, tierIdx) => {
      let hex = "#E0E0E0";
      if (Array.isArray(boxColors) && boxColors[tierIdx]) {
        hex = boxColors[tierIdx];
      } else if (Array.isArray(selectedColors) && selectedColors.length > 0) {
        hex = selectedColors[tierIdx % selectedColors.length];
      } else if (boxColor) {
        hex = boxColor;
      }

      const baseColor = new THREE.Color(hex);
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);

      // Limite calibrado de escurecimento por cor:
      // Reduz significativamente a grande diferença de tonalidade para Verde (#009F5A),
      // Amarelo (#DAB900) e Azul (#4C75B7), evitando caixas excessivamente escuras ou desbotadas.
      const upperHex = String(hex).trim().toUpperCase();
      let maxEscurecimento = 0.026;

      if (upperHex.includes("009F5A")) {
        // Verde: já possui L baixo (~0.31). Variação sutil (~2.0%) evita tons pretos/musgo
        maxEscurecimento = 0.020;
      } else if (upperHex.includes("DAB900")) {
        // Amarelo: variação sutil (~2.2%) evita tons mostarda/oliva escuros
        maxEscurecimento = 0.022;
      } else if (upperHex.includes("4C75B7")) {
        // Azul: variação suave (~2.6%) evita azul-marinho excessivo
        maxEscurecimento = 0.026;
      } else if (upperHex.includes("B65241")) {
        // Vermelho
        maxEscurecimento = 0.026;
      } else if (upperHex.includes("E0E0E0")) {
        // Branco
        maxEscurecimento = 0.1;
      } else if (upperHex.includes("676767")) {
        // Cinza
        maxEscurecimento = 0.028;
      } else {
        maxEscurecimento = Math.min(0.028, Math.max(0.015, hsl.l * 0.06));
      }

      // Gerador pseudo-aleatório determinístico único para este modelo + andar
      const tierSeed = seedBase * 1009 + (tierIdx + 1) * 6271 + 4057;
      const rand = pseudoRandom(tierSeed); // [0, 1]

      // Variação suave tendendo a levemente mais escura mantendo estritamente Hue e Saturation
      const darkFactor = rand * maxEscurecimento;
      const newL = Math.max(0.10, hsl.l - darkFactor);

      const col = new THREE.Color();
      col.setHSL(hsl.h, hsl.s, newL);

      return new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.65,
        metalness: 0.05,
        wireframe,
      });
    });
  }, [safeCount, boxColors, selectedColors, boxColor, wireframe, seedBase]);

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
  const railD = hasVaral ? crateD + postD : crateD;
  const railCenterZ = hasVaral ? -postD / 2 : 0;

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

      {/* ── 3. Coluna de Caixas compartilhando a mesma geometria (Zero GC / Instância limpa) ── */}
      {safeCount > 0 && (
        <group position={[0, baseY, 0]}>
          {Array.from({ length: safeCount }).map((_, tierIdx) => {
            const crateY = (tierIdx + 0.5) * crateH + tierIdx * GAP_Y;
            const crateMat = tierMaterials[tierIdx];

            return (
              <mesh
                key={tierIdx}
                geometry={crateGeo}
                material={crateMat}
                position={[0, crateY, 0]}
              />
            );
          })}
        </group>
      )}
    </group>
  );
}
