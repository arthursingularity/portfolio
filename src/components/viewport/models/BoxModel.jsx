"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

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
        maxEscurecimento = 0.035;
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

  return (
    <group position={[0, 0, 0]}>
      {/* ── 1. Trilho Sólido Laranja de Chão (apenas quando ativado) ── */}
      {hasRail && (
        <group position={[0, railH / 2, 0]}>
          {/* Viga sólida laranja */}
          <mesh
            material={railMaterials.orangeRail}
            position={[railCenterX, 0, railCenterZ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[railW, railH, railD]} />
          </mesh>

          {/* Pés de apoio na base (apenas nas extremidades externas da estrutura) */}
          {!isConnL && (
            <mesh
              material={railMaterials.orangeDark}
              position={[-crateW * 0.35 + railCenterX, -railH / 2 + 0.004, railCenterZ]}
            >
              <boxGeometry args={[0.06, 0.008, railD - 0.03]} />
            </mesh>
          )}
          {!isConnR && (
            <mesh
              material={railMaterials.orangeDark}
              position={[crateW * 0.35 + railCenterX, -railH / 2 + 0.004, railCenterZ]}
            >
              <boxGeometry args={[0.06, 0.008, railD - 0.03]} />
            </mesh>
          )}
        </group>
      )}

      {/* ── 2. Varal Atrás das Caixas (quando ativado) ── */}
      {hasVaral && (
        <group position={[0, 0, varalZ]}>
          {/* Poste Vertical Esquerdo (somente na coluna da extrema esquerda) */}
          {!isConnL && (
            <mesh
              material={railMaterials.orangeRail}
              position={[leftPostX, postCenterY, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[postW, postHeight, postD]} />
            </mesh>
          )}

          {/* Poste Vertical Direito (somente na coluna da extrema direita) */}
          {!isConnR && (
            <mesh
              material={railMaterials.orangeRail}
              position={[rightPostX, postCenterY, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[postW, postHeight, postD]} />
            </mesh>
          )}

          {/* Barra Superior Horizontal (conecta perfeitamente com colunas vizinhas) */}
          <mesh
            material={railMaterials.orangeRail}
            position={[topBeamCenterX, topBeamCenterY, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[topBeamW, beamH, postD]} />
          </mesh>

          {/* Placa Central no Topo (por cima do varal, 1 para cada coluna) */}
          <mesh
            material={railMaterials.blackPlaca}
            position={[0, tabCenterY, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[tabW, tabH, postD + 0.006]} />
          </mesh>
        </group>
      )}

      {/* ── 3. Coluna Única de Caixas (0 a 6 de altura com cores configuradas) ── */}
      {safeCount > 0 && (
        <group position={[0, baseY, 0]}>
          {Array.from({ length: safeCount }).map((_, tierIdx) => {
            const crateY = (tierIdx + 0.5) * crateH + tierIdx * GAP_Y;
            const crateMat = tierMaterials[tierIdx];

            return (
              <mesh
                key={tierIdx}
                material={crateMat}
                position={[0, crateY, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[crateW, crateH, crateD]} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}
