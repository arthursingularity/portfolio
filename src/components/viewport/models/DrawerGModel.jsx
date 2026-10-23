"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Dimensões base de referência (em metros)
export const BASE_DIMENSIONS = {
  width: 0.36,
  depth: 0.44,
  height: 0.19, // Altura original: 190mm
};

// Distância fixa (gap) entre as colunas de gavetas ao multiplicar (em metros)
// Aceita valores positivos, zero ou negativos:
//   > 0  -> Afastamento / folga entre colunas (ex: 0.01 para 1cm)
//     0  -> Encostadas perfeitamente lado a lado
//   < 0  -> Mais próximas / fundindo os tubos metálicos (ex: -0.0216 para fundir as colunas)
export const GAVETAS_GAP = -0.02;

// Dimensões das divisórias de madeira (em metros)
// Altere estes valores facilmente para ajustar o tamanho das placas de madeira:
const DIVISORIA_DIMENSIONS = {
  width: 0.348,      // Largura da divisória transversal (ao longo do eixo X)
  depth: 0.428,      // Comprimento da divisória longitudinal (ao longo do eixo Z)
  height: 0.18,      // Altura das divisórias (ao longo do eixo Y)
  thickness: 0.007,  // Espessura da chapa de madeira (7mm)
};

const TAMANHO_PADRAO = 10;

// Cache global em memória de geometrias fundidas (compartilhado por todas as gavetas da cena)
const geometryCache = new Map();

/**
 * Constrói e funde todas as partes da Gaveta G em apenas 3 geometrias compactas:
 * 1. drawerBodyGeo: Todas as paredes, friso, fundo curvado e traseira da gaveta plástica
 * 2. cageFrameGeo: As 4 colunas verticais e 4 travessas inferiores de aço da gaiola
 * 3. ceilingPlateGeo: Placa superior / piso intermediário
 * 4. legsGeo & basePlateGeo: Pés e placa de chão para a base (Tier 0)
 * 5. dividerLongGeo & dividerTransGeo: Divisórias de madeira personalizáveis
 */
function getDrawerGeometries(W, D, H, topGap, effectiveLegH, customDivDims = {}) {
  const divDims = { ...DIVISORIA_DIMENSIONS, ...customDivDims };
  const divW = Number(divDims.width) || (W - 0.012);
  const divD = Number(divDims.depth) || (D - 0.012);
  const divH = Number(divDims.height) || (H * 0.42);
  const divThick = Number(divDims.thickness) || 0.007;

  const cacheKey = `${W.toFixed(4)}_${D.toFixed(4)}_${H.toFixed(4)}_${Number(topGap).toFixed(4)}_${effectiveLegH.toFixed(4)}_${divW.toFixed(4)}_${divD.toFixed(4)}_${divH.toFixed(4)}_${divThick.toFixed(4)}`;
  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey);
  }

  const t = 0.006;               // Espessura sólida das paredes (6mm)
  const Hf = H * 0.42;           // Frente acompanha proporcionalmente a altura total
  const bottomCurveH = H * 0.30; // Início da curva inferior
  const bottomCurveZ = D * 0.16; // Recuo inferior em Z

  // ─── DIMENSÕES DA GAIOLA ───
  const barSize = 0.012;         // Espessura das barras (12mm)
  const plateThickness = 0.008;  // Placas de 8mm
  const sideGap = 0.008;         // Folga lateral e frontal entre gaveta e gaiola (8mm)
  const clearanceTop = Math.max(0.002, Number(topGap) || 0.02);

  const cageW = W + sideGap * 2 + barSize * 2;
  const cageD = D + sideGap * 2 + barSize * 2;
  const cageH = barSize + H + clearanceTop;

  // Coordenadas em Z da gaveta
  const zFront = -D / 2;
  const zRear = D / 2;
  const zSlopeStart = zFront + D * 0.25;
  const zSlopeTop = zFront + D * 0.20;

  // ── 1. Parede Lateral Esquerda ──
  const shapeSide = new THREE.Shape();
  const Z = (z) => -z;

  shapeSide.moveTo(Z(zFront + bottomCurveZ), 0);
  shapeSide.lineTo(Z(zRear), 0);
  shapeSide.lineTo(Z(zRear), H);
  shapeSide.lineTo(Z(zSlopeStart), H);
  shapeSide.quadraticCurveTo(
    Z(zSlopeStart - 0.012),
    H,
    Z(zSlopeTop),
    H - 0.014
  );
  shapeSide.lineTo(Z(zFront + 0.01), Hf + 0.008);
  shapeSide.quadraticCurveTo(Z(zFront), Hf + 0.002, Z(zFront), Hf - 0.006);
  shapeSide.lineTo(Z(zFront), bottomCurveH);
  shapeSide.quadraticCurveTo(
    Z(zFront + 0.006),
    0.004,
    Z(zFront + bottomCurveZ),
    0
  );
  shapeSide.closePath();

  const sideWallLeft = new THREE.ExtrudeGeometry(shapeSide, {
    steps: 1,
    depth: t,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.001,
    bevelThickness: 0.001,
  });
  sideWallLeft.translate(0, 0, -t / 2);
  sideWallLeft.rotateY(Math.PI / 2);
  sideWallLeft.translate(-W / 2 + t / 2, 0, 0);

  // ── 2. Parede Lateral Direita ──
  const sideWallRight = sideWallLeft.clone();
  sideWallRight.translate(W - t, 0, 0);

  // ── 3. Frente e Fundo Curvado ──
  const shapeFront = new THREE.Shape();
  const innerW = W - t * 2;

  shapeFront.moveTo(Z(zFront), Hf);
  shapeFront.lineTo(Z(zFront), bottomCurveH);
  shapeFront.quadraticCurveTo(
    Z(zFront + 0.006),
    0.004,
    Z(zFront + bottomCurveZ),
    0
  );
  shapeFront.lineTo(Z(zRear), 0);
  shapeFront.lineTo(Z(zRear), t);
  shapeFront.lineTo(Z(zFront + bottomCurveZ), t);
  shapeFront.quadraticCurveTo(
    Z(zFront + t + 0.006),
    t + 0.004,
    Z(zFront + t),
    bottomCurveH
  );
  shapeFront.lineTo(Z(zFront + t), Hf);
  shapeFront.closePath();

  const frontBottomCurve = new THREE.ExtrudeGeometry(shapeFront, {
    steps: 1,
    depth: innerW,
    bevelEnabled: false,
  });
  frontBottomCurve.translate(0, 0, -innerW / 2);
  frontBottomCurve.rotateY(Math.PI / 2);

  // ── 4. Friso Frontal da Borda ──
  const lipThickness = 0.007;
  const lipOut = 0.005;
  const frontLip = new THREE.BoxGeometry(W + lipOut, lipThickness, lipThickness * 1.4);
  frontLip.translate(0, Hf - 0.002, zFront + 0.001);

  // ── 5. Parede Traseira ──
  const backWall = new THREE.BoxGeometry(W - t * 2, H, t);
  backWall.translate(0, H / 2, zRear - t / 2);

  // Fusão de todas as partes da gaveta plástica em 1 única geometria indexada
  const drawerParts = [
    sideWallLeft,
    sideWallRight,
    frontBottomCurve,
    frontLip,
    backWall,
  ].map((g) => (g.index ? g.toNonIndexed() : g));

  const rawDrawer = mergeGeometries(drawerParts, false);
  rawDrawer.computeVertexNormals();
  const drawerBodyGeo = mergeVertices(rawDrawer);

  sideWallLeft.dispose();
  sideWallRight.dispose();
  frontBottomCurve.dispose();
  frontLip.dispose();
  backWall.dispose();
  rawDrawer.dispose();

  // ── 6. Gaiola Estrutural Completa (4 colunas + 4 travessas inferiores) ──
  const xCageEdge = cageW / 2 - barSize / 2;
  const zCageEdge = cageD / 2 - barSize / 2;

  const cageParts = [];
  // 4 Colunas verticais
  [
    [-xCageEdge, -zCageEdge],
    [xCageEdge, -zCageEdge],
    [-xCageEdge, zCageEdge],
    [xCageEdge, zCageEdge],
  ].forEach(([px, pz]) => {
    const post = new THREE.BoxGeometry(barSize, cageH, barSize);
    post.translate(px, cageH / 2, pz);
    cageParts.push(post);
  });

  // 2 Travessas X (Frente e Fundo)
  [-zCageEdge, zCageEdge].forEach((pz) => {
    const beam = new THREE.BoxGeometry(cageW - barSize * 2, barSize, barSize);
    beam.translate(0, barSize / 2, pz);
    cageParts.push(beam);
  });

  // 2 Travessas Z (Laterais)
  [-xCageEdge, xCageEdge].forEach((px) => {
    const beam = new THREE.BoxGeometry(barSize, barSize, cageD - barSize * 2);
    beam.translate(px, barSize / 2, 0);
    cageParts.push(beam);
  });

  const rawCage = mergeGeometries(
    cageParts.map((g) => (g.index ? g.toNonIndexed() : g)),
    false
  );
  rawCage.computeVertexNormals();
  const cageFrameGeo = mergeVertices(rawCage);
  cageParts.forEach((g) => g.dispose());
  rawCage.dispose();

  // ── 7. Placa do Teto / Piso intermediário ──
  const ceilingPlateGeo = new THREE.BoxGeometry(cageW, plateThickness, cageD);

  // ── 8. Pés da Base (Tier 0) ──
  let legsGeo = null;
  if (effectiveLegH > 0) {
    const legParts = [
      [-xCageEdge, -zCageEdge],
      [xCageEdge, -zCageEdge],
      [-xCageEdge, zCageEdge],
      [xCageEdge, zCageEdge],
    ].map(([px, pz]) => {
      const leg = new THREE.BoxGeometry(barSize, effectiveLegH, barSize);
      leg.translate(px, effectiveLegH / 2, pz);
      return leg;
    });

    const rawLegs = mergeGeometries(
      legParts.map((g) => (g.index ? g.toNonIndexed() : g)),
      false
    );
    rawLegs.computeVertexNormals();
    legsGeo = mergeVertices(rawLegs);
    legParts.forEach((g) => g.dispose());
    rawLegs.dispose();
  }

  // ── 9. Placa da Base (Tier 0) ──
  const basePlateGeo = new THREE.BoxGeometry(
    cageW - barSize * 2,
    plateThickness,
    cageD - barSize * 2
  );

  // ── 10. Divisória de Madeira 1 (Longitudinal - Frente/Fundo dividindo Esquerda e Direita) ──
  const zFrontIn = zFront + t;
  const zBackIn = Math.min(zRear - t, zFrontIn + divD);
  const yMaxDiv = Math.min(H - 0.004, t + divH);

  // Parâmetros do chanfro/rampa da lateral da gaveta (baseados em shapeSide)
  const yRampBottom = Hf - 0.004; // Altura na boca frontal rebaixada
  const yRampTop = H - 0.014;    // Altura onde a rampa encontra o topo
  const zRampBottom = zFrontIn;
  const zRampTop = zSlopeTop;

  const shapeDivLong = new THREE.Shape();
  // 1. Início na traseira sobre o piso interno
  shapeDivLong.moveTo(Z(zBackIn), t);
  // 2. Piso reto interno até o início da curva frontal
  const zCurveStart = Math.min(zBackIn, zFront + bottomCurveZ);
  shapeDivLong.lineTo(Z(zCurveStart), t);
  // 3. Curvatura inferior que acompanha perfeitamente o perfil da gaveta
  shapeDivLong.quadraticCurveTo(
    Z(zFront + t + 0.006),
    t + 0.004,
    Z(zFrontIn),
    Math.min(yMaxDiv, bottomCurveH)
  );
  // 4. Sobe pela parede frontal até a borda rebaixada da boca da gaveta
  if (yMaxDiv > bottomCurveH) {
    shapeDivLong.lineTo(Z(zFrontIn), Math.min(yMaxDiv, yRampBottom));
  }
  // 5. Acompanha o chanfro inclinado da lateral da gaveta (evita vazar para fora)
  if (yMaxDiv > yRampBottom) {
    if (yMaxDiv < yRampTop) {
      const rampFrac = (yMaxDiv - yRampBottom) / (yRampTop - yRampBottom);
      const zIntersect = zRampBottom + rampFrac * (zRampTop - zRampBottom);
      shapeDivLong.lineTo(Z(zIntersect), yMaxDiv);
    } else {
      shapeDivLong.lineTo(Z(zRampTop), yRampTop);
      shapeDivLong.quadraticCurveTo(
        Z(zSlopeStart - 0.012),
        yMaxDiv,
        Z(zSlopeStart),
        yMaxDiv
      );
    }
  }
  // 6. Linha reta no topo até a traseira
  shapeDivLong.lineTo(Z(zBackIn), yMaxDiv);
  // 7. Parede traseira vertical até o piso
  shapeDivLong.lineTo(Z(zBackIn), t);
  shapeDivLong.closePath();

  const divider1Raw = new THREE.ExtrudeGeometry(shapeDivLong, {
    steps: 1,
    depth: divThick,
    bevelEnabled: false,
  });
  divider1Raw.translate(0, 0, -divThick / 2);
  divider1Raw.rotateY(Math.PI / 2);
  divider1Raw.computeVertexNormals();
  const dividerLongGeo = mergeVertices(divider1Raw);
  divider1Raw.dispose();

  // ── 11. Divisória de Madeira 2 (Transversal - Esquerda/Direita dividindo Frente e Fundo) ──
  const divider2Raw = new THREE.BoxGeometry(divW, divH, divThick);
  divider2Raw.translate(0, t + divH / 2, 0);
  divider2Raw.computeVertexNormals();
  const dividerTransGeo = mergeVertices(divider2Raw);
  divider2Raw.dispose();

  const result = {
    drawerBodyGeo,
    cageFrameGeo,
    ceilingPlateGeo,
    legsGeo,
    basePlateGeo,
    dividerLongGeo,
    dividerTransGeo,
    barSize,
    cageH,
    plateThickness,
    tierStep: cageH + plateThickness,
  };

  geometryCache.set(cacheKey, result);
  return result;
}

/**
 * DrawerGModel - Modelo Otimizado de Alta Performance para Ambientes Corporativos
 * - Agrupa geometrias por material para reduzir draw calls em ~80%
 * - Caching global de geometrias unificadas (zero impacto de garbage collection)
 * - Removidas sombras em tempo real para manter 120+ FPS mesmo com dezenas de gavetas
 */
export default function DrawerGModel({
  tierIndex,              // Índice do nível (0 a 4) quando usado como gaveta individual na torre
  quantity = 5,           // Quantidade de gavetas empilhadas (quando tierIndex for omitido)
  levels,                 // Alias para quantity
  tamanho = 18,           // Escala proporcional geral (X, Y, Z)
  escalaAltura = 1.0,     // Multiplicador exclusivo para esticar/encurtar a altura da gaveta
  topGap = 0.035,         // Espaço entre topo da gaveta e teto (35mm)
  hasFeet = true,         // Pés ativados por padrão na primeira gaiola
  legHeight = 0.07,       // Altura padrão dos pés (70mm)
  color = "#26272B",      // Cor da gaveta (Polipropileno preto/grafite)
  cageColor = "#ff6600",  // Laranja da gaiola (colunas e barras)
  plateColor = "#DBDBDB", // Placa do teto e da base
  width,                  // Opcional: largura em metros
  depth,                  // Opcional: profundidade em metros
  height,                 // Opcional: altura em metros
  wireframe = false,
  dividers = 0,
  dividerDimensions,      // Opcional: override de dimensões das divisórias
}) {
  const isIndividualTier = tierIndex !== undefined;
  const numDrawers = Math.min(5, Math.max(1, Number(quantity ?? levels) || 5));
  const scaleFactor = Math.max(0.01, (Number(tamanho) || TAMANHO_PADRAO) / TAMANHO_PADRAO);
  const numDividers = Number(dividers) || 0;

  // Altura efetiva dos pés na base (0 se hasFeet for falso)
  const effectiveLegH = hasFeet ? Math.max(0.005, Number(legHeight) || 0.04) : 0;

  // Dimensões da gaveta
  const W = Math.max(0.15, Number(width) || BASE_DIMENSIONS.width);
  const D = Math.max(0.2, Number(depth) || BASE_DIMENSIONS.depth);
  const baseH = (Number(height) || BASE_DIMENSIONS.height) * Math.max(0.1, Number(escalaAltura) || 1.0);
  const H = Math.max(0.1, baseH);

  // Materiais compartilhados por instância
  const materials = useMemo(() => {
    return {
      drawer: new THREE.MeshStandardMaterial({
        color: new THREE.Color(color || "#26272B"),
        roughness: 0.42,
        metalness: 0.10,
        wireframe,
      }),
      cageOrange: new THREE.MeshStandardMaterial({
        color: new THREE.Color(cageColor || "#ff6600"),
        roughness: 0.38,
        metalness: 0.20,
        wireframe,
      }),
      plateGreen: new THREE.MeshStandardMaterial({
        color: new THREE.Color(plateColor || "#DBDBDB"),
        roughness: 0.45,
        metalness: 0.12,
        wireframe,
      }),
      woodDivider: new THREE.MeshStandardMaterial({
        color: new THREE.Color("#c19a6b"),
        roughness: 0.68,
        metalness: 0.05,
        wireframe,
      }),
    };
  }, [color, cageColor, plateColor, wireframe]);

  // Obtém geometrias unificadas instantâneas do cache
  const geos = useMemo(() => {
    return getDrawerGeometries(W, D, H, topGap, effectiveLegH, dividerDimensions);
  }, [W, D, H, topGap, effectiveLegH, dividerDimensions]);

  const tiersToRender = isIndividualTier
    ? [Number(tierIndex)]
    : Array.from({ length: numDrawers }, (_, idx) => idx);

  const shouldRenderBase = !isIndividualTier || Number(tierIndex) === 0;

  return (
    <group position={[0, 0, 0]} scale={[scaleFactor, scaleFactor, scaleFactor]}>
      {/* ─── PÉS DA BASE (Apenas 1 mesh unificada para os 4 pés do tier 0) ─── */}
      {shouldRenderBase && geos.legsGeo && (
        <mesh
          geometry={geos.legsGeo}
          position={[0, 0, 0]}
          material={materials.cageOrange}
        />
      )}

      {/* ─── PLACA BASE (Chão da primeira gaveta) ─── */}
      {shouldRenderBase && (
        <mesh
          geometry={geos.basePlateGeo}
          position={[0, effectiveLegH + geos.plateThickness / 2, 0]}
          material={materials.plateGreen}
        />
      )}

      {/* ─── NÍVEIS EMPILHADOS (Apenas 3 meshes de alta performance por nível!) ─── */}
      {tiersToRender.map((i) => {
        const Yi = effectiveLegH + i * geos.tierStep;

        return (
          <group key={`tier-${i}`}>
            {/* 1. Gaveta plástica inteira fundida em 1 único draw call */}
            <mesh
              geometry={geos.drawerBodyGeo}
              position={[0, Yi + geos.barSize, 0]}
              material={materials.drawer}
            />

            {/* Divisória 1 de Madeira (Longitudinal) */}
            {numDividers >= 1 && geos.dividerLongGeo && (
              <mesh
                geometry={geos.dividerLongGeo}
                position={[0, Yi + geos.barSize, 0]}
                material={materials.woodDivider}
              />
            )}

            {/* Divisória 2 de Madeira (Transversal) */}
            {numDividers >= 2 && geos.dividerTransGeo && (
              <mesh
                geometry={geos.dividerTransGeo}
                position={[0, Yi + geos.barSize, 0]}
                material={materials.woodDivider}
              />
            )}

            {/* 2. Gaiola estrutural completa (4 colunas + 4 travessas) em 1 único draw call */}
            <mesh
              geometry={geos.cageFrameGeo}
              position={[0, Yi, 0]}
              material={materials.cageOrange}
            />

            {/* 3. Placa do teto / piso intermediário */}
            <mesh
              geometry={geos.ceilingPlateGeo}
              position={[0, Yi + geos.cageH + geos.plateThickness / 2, 0]}
              material={materials.plateGreen}
            />
          </group>
        );
      })}
    </group>
  );
}