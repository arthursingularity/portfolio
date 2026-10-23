"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { resolveSeedBase } from "./boxConfig";

// ---------------------------------------------------------------------------
// 📦 CONFIGURAÇÃO DIDÁTICA E EDITÁVEL - CAIXA CINZA PADRÃO (ULMA M)
// ---------------------------------------------------------------------------
// Estrutura: 2 colunas de 6 andares = 12 caixas no total

// Fator de escala unificado (Blender / Estoque)
export const FATOR_ESCALA = 1.99;

// Dimensões base métricas de cada caixa individual (em metros)
export const LARGURA_BASE = 0.484;      // Largura no eixo da coluna (W)
export const COMPRIMENTO_BASE = 0.680;  // Comprimento da caixa (L)
export const ALTURA_BASE = 0.184;       // Altura de cada caixa (H)

// Dimensões finais escaladas prontas para uso no Three.js
export const LARGURA = LARGURA_BASE * FATOR_ESCALA;         // ~1.0447m
export const COMPRIMENTO = COMPRIMENTO_BASE * FATOR_ESCALA; // ~1.5920m
export const ALTURA = ALTURA_BASE * FATOR_ESCALA;           // ~0.3661m

// Gaps e espaçamento entre caixas (em metros)
export const GAP_COLUNAS = 0.008 * FATOR_ESCALA;  // Separação lateral entre as 2 colunas (~15.9mm)
export const GAP_VERTICAL = 0.008 * FATOR_ESCALA; // Separação vertical entre andares (~15.9mm)

// Configuração do empilhamento
export const NUM_COLUNAS = 2;                       // 2 colunas lado a lado
export const NUM_ANDARES = 6;                       // 6 andares de empilhamento
export const MAX_BOXES = NUM_COLUNAS * NUM_ANDARES; // 12 caixas no total
export const MAX_ULMA_M_BOXES = MAX_BOXES;

// Rotação padrão (90 graus no eixo Y para alinhamento ao pallet)
export const ROTACAO_PADRAO_Y = Math.PI / 2; // 90° em radianos

// Cor base industrial e propriedades do material
export const COR_BASE = "#404142"; // Cinza escuro industrial padronizado
export const ROUGHNESS = 0.6;      // Rugosidade fosca
export const METALNESS = 0.08;     // Reflexo metálico suave

// Aliases para manter compatibilidade com módulos externos
export const ULMA_M_LARGURA = LARGURA;
export const ULMA_M_COMPRIMENTO = COMPRIMENTO;
export const ULMA_M_ALTURA = ALTURA;
export const ULMA_GAP = GAP_COLUNAS;
export const ULMA_BASE_COLOR = COR_BASE;

/**
 * Calcula a variação tonal HSL sutil das caixas cinzas Ulma M
 * Baseado no modelo original EstoqueModel.tsx (lightness restrito entre 0.17 e 0.18)
 */
export function computeUlmaColor(seedBase = 1, index = 0) {
  const baseColor = new THREE.Color(COR_BASE);
  const hsl = { h: 0, s: 0, l: 0 };
  baseColor.getHSL(hsl);

  const pseudo = Math.abs(Math.sin((seedBase * 31 + index) * 15.123 + 45.678));
  const lVar = (pseudo - 0.4) * 0.1;

  const col = new THREE.Color();
  col.setHSL(
    hsl.h,
    hsl.s,
    Math.max(0.17, Math.min(0.18, hsl.l + lVar))
  );
  return col;
}

/**
 * Cria o material para as caixas Ulma M com parâmetros industriais foscos
 */
export function createUlmaMaterial(seedBase = 1, index = 0, wireframe = false) {
  const col = computeUlmaColor(seedBase, index);
  return new THREE.MeshStandardMaterial({
    color: col,
    roughness: ROUGHNESS,
    metalness: METALNESS,
    wireframe,
  });
}

/**
 * UlmaMModel: Caixa Cinza Padrão (2 colunas de 6 andares = 12 caixas)
 * - Rotacionada 90° por padrão no eixo Y
 * - Dimensões métricas, gaps e andares configuráveis diretamente no topo do arquivo
 */
export default function UlmaMModel({
  count = MAX_BOXES,
  boxCount,
  baseY = 0,
  wireframe = false,
  rotation = [0, ROTACAO_PADRAO_Y, 0],
  itemId = null,
  modelId = null,
  colorSeed = null,
  seed = null,
  position = null,
}) {
  const seedBase = useMemo(() => {
    return resolveSeedBase({
      colorSeed,
      seed,
      itemId,
      modelId,
      position,
      fallbackSeed: 42109,
    });
  }, [colorSeed, seed, itemId, modelId, position]);

  const rawCount = boxCount !== undefined ? boxCount : count;
  const safeCount = Math.min(
    MAX_BOXES,
    Math.max(0, parseInt(rawCount, 10) || 0)
  );

  const boxGeo = useMemo(
    () => new THREE.BoxGeometry(LARGURA, ALTURA, COMPRIMENTO),
    []
  );

  const offsetX = (LARGURA + GAP_COLUNAS) / 2;

  const boxes = useMemo(() => {
    if (safeCount <= 0) return [];

    return Array.from({ length: safeCount }).map((_, i) => {
      const andarCaixa = Math.floor(i / NUM_COLUNAS);
      const coluna = i % NUM_COLUNAS;
      const localX = coluna === 0 ? -offsetX : offsetX;
      const y = baseY + (andarCaixa + 0.5) * (ALTURA + GAP_VERTICAL);
      const mat = createUlmaMaterial(seedBase, i, wireframe);

      return {
        position: [localX, y, 0],
        material: mat,
      };
    });
  }, [safeCount, baseY, offsetX, seedBase, wireframe]);

  if (safeCount <= 0) return null;

  return (
    <group name="ulma-m-model" rotation={rotation}>
      {boxes.map((box, idx) => (
        <mesh
          key={idx}
          geometry={boxGeo}
          material={box.material}
          position={box.position}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
}
