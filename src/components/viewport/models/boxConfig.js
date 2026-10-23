"use client";

import * as THREE from "three";

// ---------------------------------------------------------------------------
// CONFIGURAÇÃO CENTRALIZADA DE ESCALA, DIMENSÕES E CORES DAS CAIXAS
// Compartilhada entre PalletModel.jsx e BoxModel.jsx
// ---------------------------------------------------------------------------

// Fator de escala unificado (Blender / Estoque)
export const FATOR_ESCALA = 1.99;

// Dimensões base métricas das caixas no Blender
export const CAIXA_COMPRIMENTO_BASE = 0.466947; // L
export const CAIXA_LARGURA_BASE = 0.298096;     // W
export const CAIXA_ALTURA_BASE = 0.193756;      // H

// Dimensões escaladas prontas para uso no Three.js
export const CAIXA_COMPRIMENTO = CAIXA_COMPRIMENTO_BASE * FATOR_ESCALA; // ~0.9292m
export const CAIXA_LARGURA = CAIXA_LARGURA_BASE * FATOR_ESCALA;         // ~0.5932m
export const CAIXA_ALTURA = CAIXA_ALTURA_BASE * FATOR_ESCALA;           // ~0.3856m

// Gaps milimétricos entre caixas
export const GAP_Y = 0.003;       // 3mm de separação vertical sutil
export const GAP_LATERAL = 0.009; // 3mm de separação lateral entre caixas

// Constantes de empilhamento no Pallet
export const BOXES_PER_LAYER = 5;
export const MAX_PALLET_BOXES = 30;

// Cor padrão da caixa branca
export const DEFAULT_BOX_COLOR = "#E0E0E0";

// Paleta padrão de cores adicionais
export const BOX_PALETTE_COLORS = [
  { id: "branco", name: "Branco", hex: "#E0E0E0", border: "#B0B0B0" },
  { id: "azul", name: "Azul", hex: "#4C75B7", border: "#3B5F9E" },
  { id: "verde", name: "Verde", hex: "#009F5A", border: "#007A44" },
  { id: "vermelho", name: "Vermelho", hex: "#B65241", border: "#9A4132" },
  { id: "cinza", name: "Cinza", hex: "#676767", border: "#525252" },
  { id: "amarelo", name: "Amarelo", hex: "#DAB900", border: "#B89D00" },
];

/**
 * Hash determinístico para converter strings (ex: item.id ou coordenadas) em inteiro positivo
 */
export function hashString(str) {
  if (!str) return 1;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 1;
}

/**
 * Gerador pseudo-aleatório determinístico (retorna float entre 0 e 1)
 */
export function pseudoRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Resolve a semente determinística base do modelo para garantir estabilidade visual
 */
export function resolveSeedBase({ colorSeed, seed, itemId, modelId, position, fallbackSeed }) {
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
  return fallbackSeed || 12345;
}

/**
 * Calcula a variação tonal HSL sutil e realista para cada caixa individual
 */
export function computeBoxColor(hex = DEFAULT_BOX_COLOR, seedBase = 1, index = 0) {
  const baseColor = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  baseColor.getHSL(hsl);

  const upperHex = String(hex).trim().toUpperCase();
  let maxEscurecimento = 0.026;

  if (upperHex.includes("009F5A")) {
    maxEscurecimento = 0.020;
  } else if (upperHex.includes("DAB900")) {
    maxEscurecimento = 0.022;
  } else if (upperHex.includes("4C75B7")) {
    maxEscurecimento = 0.026;
  } else if (upperHex.includes("B65241")) {
    maxEscurecimento = 0.026;
  } else if (
    upperHex.includes("E0E0E0") ||
    upperHex.includes("DEDEDE") ||
    upperHex.includes("FFFFFF") ||
    upperHex.includes("E2E4E6")
  ) {
    // Branco: variação sutil (~10%) que dá textura natural de papelão branco a cada caixa
    maxEscurecimento = 0.1;
  } else if (upperHex.includes("676767")) {
    maxEscurecimento = 0.028;
  } else {
    maxEscurecimento = Math.min(0.028, Math.max(0.015, hsl.l * 0.06));
  }

  // Semente única para este modelo + índice da caixa
  const tierSeed = seedBase * 1009 + (index + 1) * 6271 + 4057;
  const rand = pseudoRandom(tierSeed); // [0, 1]

  const darkFactor = rand * maxEscurecimento;
  const newL = Math.max(0.10, hsl.l - darkFactor);

  const col = new THREE.Color();
  col.setHSL(hsl.h, hsl.s, newL);
  return col;
}

/**
 * Cria o MeshStandardMaterial correspondente com os parâmetros de material unificados
 */
export function createBoxMaterial(hex = DEFAULT_BOX_COLOR, seedBase = 1, index = 0, wireframe = false) {
  const col = computeBoxColor(hex, seedBase, index);
  return new THREE.MeshStandardMaterial({
    color: col,
    roughness: 0.65,
    metalness: 0.05,
    wireframe,
  });
}

// ---------------------------------------------------------------------------
// MODELOS ULMA M E ULMA P (Configurações didáticas em seus próprios arquivos)
// ---------------------------------------------------------------------------
export {
  LARGURA_BASE as ULMA_M_LARGURA_BASE,
  COMPRIMENTO_BASE as ULMA_M_COMPRIMENTO_BASE,
  ALTURA_BASE as ULMA_M_ALTURA_BASE,
  LARGURA as ULMA_M_LARGURA,
  COMPRIMENTO as ULMA_M_COMPRIMENTO,
  ALTURA as ULMA_M_ALTURA,
  GAP_COLUNAS as ULMA_GAP,
  MAX_BOXES as MAX_ULMA_M_BOXES,
  NUM_ANDARES as ULMA_M_TIERS,
  COR_BASE as ULMA_BASE_COLOR,
  computeUlmaColor,
  createUlmaMaterial,
} from "./UlmaMModel";

export {
  LARGURA_BASE as ULMA_P_LARGURA_BASE,
  COMPRIMENTO_BASE as ULMA_P_COMPRIMENTO_BASE,
  ALTURA_BASE as ULMA_P_ALTURA_BASE,
  LARGURA as ULMA_P_LARGURA,
  COMPRIMENTO as ULMA_P_COMPRIMENTO,
  ALTURA as ULMA_P_ALTURA,
  MAX_BOXES as MAX_ULMA_P_BOXES,
  NUM_ANDARES as ULMA_P_TIERS,
} from "./UlmaPModel";


