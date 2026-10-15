"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * Trilho com Caixas Brancas (Warehouse Stacking Rail)
 * - Base: Retângulo sólido laranja de aço onde as caixas repousam
 * - 10 fileiras de caixas brancas
 * - Até 5 caixas de altura por fileira
 * - Variações de tons de branco individuais para cada caixa (evitando o efeito de parede única)
 * - Ranhuras, bordas de encaixe (rim) e detalhes volumétricos em cada caixa
 * - Topo no mesmo tom de branco das caixas (sem partes pretas no topo)
 * - Sem etiquetas vermelhas e verdes
 */
export default function RailModel({
  columns = 10,
  maxHeight = 5,
  pattern = "photo", // "photo" (variado como na foto) | "uniform" (todas com maxHeight)
  wireframe = false,
}) {
  // Paleta de variações sutis de branco industrial
  const whiteTones = useMemo(
    () => [
      { main: "#ffffff", rim: "#f1f1f4", recess: "#e8e8ed" }, // Branco puro
      { main: "#f4f4f6", rim: "#e4e4e7", recess: "#dbdbdf" }, // Branco neutro
      { main: "#f8fafc", rim: "#e2e8f0", recess: "#cbd5e1" }, // Branco ardósia suave
      { main: "#f1f5f9", rim: "#e2e8f0", recess: "#cbd5e1" }, // Branco gelo
      { main: "#eceef2", rim: "#dedfe5", recess: "#d4d6dc" }, // Branco industrial clássico
      { main: "#f5f5f4", rim: "#e7e5e4", recess: "#d6d3d1" }, // Branco pedra
    ],
    []
  );

  // Criar materiais dinâmicos para cada variação de branco
  const materials = useMemo(() => {
    const whiteMats = whiteTones.map((tone) => ({
      body: new THREE.MeshStandardMaterial({
        color: tone.main,
        roughness: 0.55,
        metalness: 0.05,
        wireframe,
      }),
      rim: new THREE.MeshStandardMaterial({
        color: tone.rim,
        roughness: 0.5,
        metalness: 0.08,
        wireframe,
      }),
      top: new THREE.MeshStandardMaterial({
        color: tone.recess,
        roughness: 0.65,
        metalness: 0.05,
        wireframe,
      }),
    }));

    return {
      whiteMats,
      // Trilho Laranja industrial
      orangeRail: new THREE.MeshStandardMaterial({
        color: "#ea580c",
        roughness: 0.35,
        metalness: 0.35,
        wireframe,
      }),
      orangeDark: new THREE.MeshStandardMaterial({
        color: "#c2410c",
        roughness: 0.45,
        metalness: 0.3,
        wireframe,
      }),
      // Alça frontal em tom escuro sutil
      crateHandle: new THREE.MeshStandardMaterial({
        color: "#3f3f46",
        roughness: 0.7,
        metalness: 0.2,
        wireframe,
      }),
    };
  }, [whiteTones, wireframe]);

  // Dimensões do conjunto
  const crateW = 0.38; // Largura no eixo X
  const crateD = 0.56; // Profundidade no eixo Z
  const crateH = 0.25; // Altura no eixo Y
  const crateGap = 0.002; // Espaçamento entre colunas vizinhas

  const railH = 0.08; // Altura do trilho laranja (sólido no chão)
  const railPaddingX = 0.08;
  const railPaddingZ = 0.06;

  const totalLength =
    columns * crateW + (columns - 1) * crateGap + railPaddingX * 2;
  const railDepth = crateD + railPaddingZ * 2;

  // Distribuição de alturas das 10 fileiras
  const columnHeights = useMemo(() => {
    const photoProfile = [1, 2, 4, 4, 5, 5, 5, 5, 4, 2];
    const result = [];
    for (let c = 0; c < columns; c++) {
      if (pattern === "uniform") {
        result.push(Math.min(5, Math.max(1, maxHeight)));
      } else {
        const baseH = photoProfile[c % photoProfile.length];
        result.push(Math.min(Math.max(1, maxHeight), baseH));
      }
    }
    return result;
  }, [columns, maxHeight, pattern]);

  // Posições X das colunas
  const startX = -totalLength / 2 + railPaddingX + crateW / 2;

  return (
    <group position={[0, 0, 0]}>
      {/* ── 1. Trilho Sólido Laranja de Chão ── */}
      <group position={[0, railH / 2, 0]}>
        {/* Viga sólida central laranja */}
        <mesh material={materials.orangeRail} position={[0, 0, 0]}>
          <boxGeometry args={[totalLength, railH, railDepth]} />
        </mesh>

        {/* Bordas elevadas de contenção lateral (friso do trilho) */}
        <mesh
          material={materials.orangeDark}
          position={[0, railH / 2 + 0.006, -railDepth / 2 + 0.015]}
        >
          <boxGeometry args={[totalLength, 0.014, 0.025]} />
        </mesh>
        <mesh
          material={materials.orangeDark}
          position={[0, railH / 2 + 0.006, railDepth / 2 - 0.015]}
        >
          <boxGeometry args={[totalLength, 0.014, 0.025]} />
        </mesh>

        {/* Pés de apoio na base */}
        {[
          -totalLength / 2 + 0.1,
          -totalLength / 4,
          0,
          totalLength / 4,
          totalLength / 2 - 0.1,
        ].map((px, i) => (
          <mesh
            key={i}
            material={materials.orangeDark}
            position={[px, -railH / 2 + 0.005, 0]}
          >
            <boxGeometry args={[0.08, 0.01, railDepth - 0.04]} />
          </mesh>
        ))}
      </group>

      {/* ── 2. Caixas Brancas Empilhadas (10 Fileiras, até 5 de altura) ── */}
      {columnHeights.map((cratesCount, colIdx) => {
        const colX = startX + colIdx * (crateW + crateGap);

        return (
          <group key={colIdx} position={[colX, railH, 0]}>
            {Array.from({ length: cratesCount }).map((_, tierIdx) => {
              const crateY = tierIdx * crateH + crateH / 2;

              // Variação determinística do tom de branco para cada caixa individual
              const toneIdx =
                (colIdx * 3 + tierIdx * 7 + (colIdx + 1) * (tierIdx + 2)) %
                materials.whiteMats.length;
              const crateMat = materials.whiteMats[toneIdx];

              return (
                <group key={tierIdx} position={[0, crateY, 0]}>
                  {/* Corpo da Caixa com leve rebaixo nas bordas */}
                  <mesh material={crateMat.body}>
                    <boxGeometry
                      args={[crateW - 0.012, crateH - 0.014, crateD - 0.012]}
                    />
                  </mesh>

                  {/* Borda superior de empilhamento (Rim reforçado) */}
                  <mesh
                    material={crateMat.rim}
                    position={[0, crateH / 2 - 0.012, 0]}
                  >
                    <boxGeometry
                      args={[crateW, 0.022, crateD]}
                    />
                  </mesh>

                  {/* Borda inferior de encaixe (Base lip) */}
                  <mesh
                    material={crateMat.rim}
                    position={[0, -crateH / 2 + 0.008, 0]}
                  >
                    <boxGeometry
                      args={[crateW - 0.004, 0.016, crateD - 0.004]}
                    />
                  </mesh>

                  {/* Topo da caixa: da mesma cor da caixa (branco) */}
                  <mesh
                    material={crateMat.top}
                    position={[0, crateH / 2 - 0.003, 0]}
                  >
                    <boxGeometry
                      args={[crateW - 0.03, 0.004, crateD - 0.03]}
                    />
                  </mesh>

                  {/* Nervuras verticais frontais (estilo industrial Stam) */}
                  <mesh
                    material={crateMat.rim}
                    position={[-crateW * 0.24, 0, crateD / 2 + 0.001]}
                  >
                    <boxGeometry args={[0.012, crateH * 0.65, 0.003]} />
                  </mesh>
                  <mesh
                    material={crateMat.rim}
                    position={[crateW * 0.24, 0, crateD / 2 + 0.001]}
                  >
                    <boxGeometry args={[0.012, crateH * 0.65, 0.003]} />
                  </mesh>

                  {/* Alça frontal sutil */}
                  <mesh
                    material={materials.crateHandle}
                    position={[0, crateH * 0.2, crateD / 2 + 0.002]}
                  >
                    <boxGeometry args={[0.09, 0.024, 0.003]} />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
