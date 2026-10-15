"use client";

import React, { useMemo, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}

// ---------------------------------------------------------------------------
// AJUSTE DE ESCALA E DIMENSÕES DAS CAIXAS (EDITÁVEL)
// ---------------------------------------------------------------------------
const FATOR_ESCALA = 1.95;
const GAP = 0.008 * FATOR_ESCALA; // Separação entre caixas

// 1. Caixa Vermelha Original (Padrão 5 por camada)
const CAIXA_COMPRIMENTO = 0.466947 * FATOR_ESCALA; // L
const CAIXA_LARGURA = 0.298096 * FATOR_ESCALA;     // W
const CAIXA_ALTURA = 0.193756 * FATOR_ESCALA;      // H

// 2. Caixa Cinza Padrão (2 colunas de 6 andares = 12 caixas)
const CAIXA_CINZA_LARGURA = 0.525 * FATOR_ESCALA;      // X: Largura de cada coluna
const CAIXA_CINZA_COMPRIMENTO = 0.800 * FATOR_ESCALA;  // Z: Comprimento no pallet
const CAIXA_CINZA_ALTURA = 0.184 * FATOR_ESCALA;       // Y: Altura (6 andares)

// 3. Nova Caixa Cinza Fina (2 colunas de 12 andares = 24 caixas)
const CAIXA_CINZA_FINA_LARGURA = 0.525 * FATOR_ESCALA;      // X: Largura de cada coluna
const CAIXA_CINZA_FINA_COMPRIMENTO = 0.800 * FATOR_ESCALA;  // Z: Comprimento no pallet
const CAIXA_CINZA_FINA_ALTURA = 0.089 * FATOR_ESCALA;       // Y: Altura reduzida para 12 andares

export interface EstoqueModelProps {
  saldos?: Record<string, number>;
  wireframe?: boolean;
  onStatsUpdate?: (stats: any) => void;
}

// Função de hash determinística sem viés de agrupamento
function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return Math.abs(h);
}

// Distribuição de pallets: 5% Cinza Fina, 30% Cinza Padrão, 65% Vermelha
function getTipoPallet(vagaId: string): "cinza_fina" | "cinza_padrao" | "vermelha" {
  const normalized = hashString(vagaId) % 100;
  if (normalized < 5) return "cinza_fina";     // 5% das vagas
  if (normalized < 10) return "cinza_padrao";  // 30% das vagas
  return "vermelha";                           // 65% das vagas
}

// Variação de saldo para a caixa cinza fina (Capacidade: 24 caixas)
function gerarSaldoCinzaFina(vagaId: string): number {
  const normalized = hashString(vagaId + "_saldo_fina") % 100;
  if (normalized < 65) return 24;
  if (normalized < 85) return 16 + (normalized % 8);
  return 8 + (normalized % 8);
}

// Variação de saldo do pallet cinza padrão (Capacidade: 12 caixas)
function gerarSaldoCinza(vagaId: string): number {
  const normalized = hashString(vagaId + "_saldo") % 100;
  if (normalized < 65) return 12;
  if (normalized < 85) return 8 + (normalized % 4);
  return 4 + (normalized % 4);
}

// Variação de saldo da caixa vermelha original
function gerarSaldoVariado(vagaId: string, capacidadeMaxima: number): number {
  let hash = 0;
  for (let i = 0; i < vagaId.length; i++) {
    hash = (hash << 5) - hash + vagaId.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 100);

  if (normalized < 60) {
    const range = Math.min(25, capacidadeMaxima) - 20;
    return 20 + Math.abs(hash % (range + 1));
  }
  if (normalized < 75) {
    return 12 + Math.abs(hash % 7);
  }
  if (normalized < 90) {
    return 6 + Math.abs(hash % 7);
  }
  return 3 + Math.abs(hash % 4);
}

export function EstoqueModel({
  saldos = {},
  wireframe = false,
  onStatsUpdate,
}: EstoqueModelProps) {
  const { scene } = useGLTF("/estoque9.glb");

  const caixasVermelhasMeshRef = useRef<THREE.InstancedMesh>(null);
  const caixasCinzasMeshRef = useRef<THREE.InstancedMesh>(null);
  const caixasCinzasFinasMeshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      useGLTF.preload("/estoque9.glb");
    }
  }, []);

  const materiaisEstrutura = useMemo(() => ({
    laranja: new THREE.MeshStandardMaterial({
      color: "#FF6600",
      roughness: 0.35,
      metalness: 0.25,
      wireframe,
    }),
    azul: new THREE.MeshStandardMaterial({
      color: "#495F92",
      roughness: 0.35,
      metalness: 0.25,
      wireframe,
    }),
    amarela: new THREE.MeshStandardMaterial({
      color: "#FFEB46",
      roughness: 0.35,
      metalness: 0.25,
      wireframe,
    }),
    preta: new THREE.MeshStandardMaterial({
      color: "#2B2B2B",
      roughness: 0.45,
      metalness: 0.2,
      wireframe,
    }),
    pallet: new THREE.MeshStandardMaterial({
      color: "#C49A67",
      roughness: 0.75,
      metalness: 0.05,
      wireframe,
    }),
    chao: new THREE.MeshStandardMaterial({
      color: "#AFB1AC",
      roughness: 0.9,
      metalness: 0.02,
      wireframe,
    }),
    computador: new THREE.MeshStandardMaterial({
      color: "#585858",
      roughness: 0.9,
      metalness: 0.02,
      wireframe,
    }),
    balanca: new THREE.MeshStandardMaterial({
      color: "#4D4D4D",
      roughness: 0.9,
      metalness: 0.02,
      wireframe,
    }),
    mousepad: new THREE.MeshStandardMaterial({
      color: "#1E8419",
      roughness: 0.9,
      metalness: 0.02,
      wireframe,
    }),
    caixavermelha: new THREE.MeshStandardMaterial({
      color: "#B65241",
      roughness: 0.9,
      metalness: 0.02,
      wireframe,
    }),
    film: new THREE.MeshStandardMaterial({
      color: "#E9E9E9",
      roughness: 0.9,
      metalness: 0.02,
      wireframe,
    }),
    paleteiraamarela: new THREE.MeshStandardMaterial({
      color: "#F9C418",
      roughness: 0.9,
      metalness: 0.02,
      wireframe,
    }),
    paleteiracinza: new THREE.MeshStandardMaterial({
      color: "#686868",
      roughness: 0.9,
      metalness: 0.02,
      wireframe,
    }),
    paleteiragarfo: new THREE.MeshStandardMaterial({
      color: "#787878",
      roughness: 0.9,
      metalness: 0.02,
      wireframe,
    }),
    paleteiravidro: new THREE.MeshPhysicalMaterial({
      color: "#E2E4E6",
      transparent: true,
      opacity: 0.80,
      roughness: 0.15,
      metalness: 0.05,
      transmission: 0.65,
      ior: 1.45,
      depthWrite: false,
      wireframe,
    }),
  }), [wireframe]);

  const rot0 = useMemo(() => new THREE.Quaternion(), []);
  const rot90 = useMemo(
    () => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
    []
  );
  const scaleUnit = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  const {
    transformsVermelhas,
    transformsCinzas,
    transformsCinzasFinas,
    totalPallets,
  } = useMemo(() => {
    if (!scene) {
      return {
        transformsVermelhas: [],
        transformsCinzas: [],
        transformsCinzasFinas: [],
        totalPallets: 0,
      };
    }

    scene.updateMatrixWorld(true);

    const listVermelhas: THREE.Matrix4[] = [];
    const listCinzas: THREE.Matrix4[] = [];
    const listCinzasFinas: THREE.Matrix4[] = [];

    const tempMatrix = new THREE.Matrix4();
    const tempLocalPos = new THREE.Vector3();
    const worldBox = new THREE.Box3();
    const palletQuat = new THREE.Quaternion();

    // Padrão vermelho original
    const posZ_Horizontais = -(CAIXA_COMPRIMENTO / 2) - GAP / 2;
    const posZ_Verticais = CAIXA_LARGURA / 2 + GAP / 2;

    const padraoCamadaVermelha = [
      { x: -(CAIXA_COMPRIMENTO + GAP) / 2, z: posZ_Horizontais, rot: rot90 },
      { x: (CAIXA_COMPRIMENTO + GAP) / 2,  z: posZ_Horizontais, rot: rot90 },
      { x: -(CAIXA_LARGURA + GAP),         z: posZ_Verticais,   rot: rot0 },
      { x: 0,                              z: posZ_Verticais,   rot: rot0 },
      { x: (CAIXA_LARGURA + GAP),          z: posZ_Verticais,   rot: rot0 },
    ];

    const offsetX_Cinza = (CAIXA_CINZA_LARGURA + GAP) / 2;
    const offsetX_CinzaFina = (CAIXA_CINZA_FINA_LARGURA + GAP) / 2;

    let countPallets = 0;
    const processedPalletUuids = new Set<string>();

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const name = mesh.name.toUpperCase();
        const parent = mesh.parent;
        const parentName = parent && parent.type !== "Scene" ? parent.name.toUpperCase() : "";

        // 1. Cores das Estruturas e Acessórios
        if (name.includes("CHAO") || parentName.includes("CHAO")) {
          mesh.material = materiaisEstrutura.chao;
        } else if (name.includes("ESTRUTURALARANJA") || parentName.includes("ESTRUTURALARANJA")) {
          mesh.material = materiaisEstrutura.laranja;
        } else if (name.includes("ESTRUTURAAZUL") || parentName.includes("ESTRUTURAAZUL")) {
          mesh.material = materiaisEstrutura.azul;
        } else if (name.includes("ESTRUTURAAMARELA") || parentName.includes("ESTRUTURAAMARELA")) {
          mesh.material = materiaisEstrutura.amarela;
        } else if (name.includes("ESTRUTURAPRETA") || parentName.includes("ESTRUTURAPRETA")) {
          mesh.material = materiaisEstrutura.preta;
        } else if (name.includes("COMPUTADOR") || parentName.includes("COMPUTADOR")) {
          mesh.material = materiaisEstrutura.computador;
        } else if (name.includes("BALANCA") || parentName.includes("BALANCA")) {
          mesh.material = materiaisEstrutura.balanca;
        } else if (name.includes("MOUSEPAD") || parentName.includes("MOUSEPAD")) {
          mesh.material = materiaisEstrutura.mousepad;
        } else if (name.includes("CAIXAVERMELHA") || parentName.includes("CAIXAVERMELHA")) {
          mesh.material = materiaisEstrutura.caixavermelha;
        } else if (name.includes("FILM") || parentName.includes("FILM")) {
          mesh.material = materiaisEstrutura.film;
        } else if (name.includes("PALETEIRAAMARELA") || parentName.includes("PALETEIRAAMARELA")) {
          mesh.material = materiaisEstrutura.paleteiraamarela;
        } else if (name.includes("PALETEIRACINZA") || parentName.includes("PALETEIRACINZA")) {
          mesh.material = materiaisEstrutura.paleteiracinza;
        } else if (name.includes("PALETEIRAGARFO") || parentName.includes("PALETEIRAGARFO")) {
          mesh.material = materiaisEstrutura.paleteiragarfo;
        } else if (name.includes("PALETEIRAVIDRO") || parentName.includes("PALETEIRAVIDRO")) {
          mesh.material = materiaisEstrutura.paleteiravidro;
          mesh.castShadow = false;
        }

        // 2. Processamento dos Pallets
        const isPalletMesh = name.includes("PALLET");
        const isPalletChild = parentName.includes("PALLET");

        if (isPalletMesh || isPalletChild) {
          const palletRoot = isPalletChild && parent ? parent : mesh;

          if (processedPalletUuids.has(palletRoot.uuid)) {
            mesh.material = materiaisEstrutura.pallet;
            return;
          }
          processedPalletUuids.add(palletRoot.uuid);

          mesh.material = materiaisEstrutura.pallet;
          palletRoot.traverse((sub) => {
            if ((sub as THREE.Mesh).isMesh) {
              (sub as THREE.Mesh).material = materiaisEstrutura.pallet;
            }
          });

          countPallets++;

          let vagaId = palletRoot.name.toUpperCase();
          if (palletRoot.parent && palletRoot.parent.type !== "Scene") {
            vagaId = palletRoot.parent.name.toUpperCase();
          }

          worldBox.setFromObject(palletRoot);
          const palletTopY = worldBox.max.y;
          const palletCenterX = (worldBox.min.x + worldBox.max.x) / 2;
          const palletCenterZ = (worldBox.min.z + worldBox.max.z) / 2;

          palletRoot.getWorldQuaternion(palletQuat);

          const tipoPallet = getTipoPallet(vagaId || palletRoot.uuid);

          if (tipoPallet === "cinza_fina") {
            const capacidade = 24;
            const saldoVaga = saldos[vagaId] !== undefined
              ? saldos[vagaId]
              : saldos[palletRoot.name] !== undefined
              ? saldos[palletRoot.name]
              : gerarSaldoCinzaFina(vagaId);

            const caixasAtivas = Math.min(Math.max(saldoVaga, 0), capacidade);

            for (let i = 0; i < caixasAtivas; i++) {
              const andarCaixa = Math.floor(i / 2);
              const coluna = i % 2;
              const localX = coluna === 0 ? -offsetX_CinzaFina : offsetX_CinzaFina;

              tempLocalPos.set(
                localX,
                (andarCaixa + 0.5) * (CAIXA_CINZA_FINA_ALTURA + GAP),
                0
              );

              tempLocalPos.applyQuaternion(palletQuat);

              const finalPos = new THREE.Vector3(
                palletCenterX + tempLocalPos.x,
                palletTopY + tempLocalPos.y,
                palletCenterZ + tempLocalPos.z
              );

              tempMatrix.compose(finalPos, palletQuat, scaleUnit);
              listCinzasFinas.push(tempMatrix.clone());
            }
          } else if (tipoPallet === "cinza_padrao") {
            const capacidade = 12;
            const saldoVaga = saldos[vagaId] !== undefined
              ? saldos[vagaId]
              : saldos[palletRoot.name] !== undefined
              ? saldos[palletRoot.name]
              : gerarSaldoCinza(vagaId);

            const caixasAtivas = Math.min(Math.max(saldoVaga, 0), capacidade);

            for (let i = 0; i < caixasAtivas; i++) {
              const andarCaixa = Math.floor(i / 2);
              const coluna = i % 2;
              const localX = coluna === 0 ? -offsetX_Cinza : offsetX_Cinza;

              tempLocalPos.set(
                localX,
                (andarCaixa + 0.5) * (CAIXA_CINZA_ALTURA + GAP),
                0
              );

              tempLocalPos.applyQuaternion(palletQuat);

              const finalPos = new THREE.Vector3(
                palletCenterX + tempLocalPos.x,
                palletTopY + tempLocalPos.y,
                palletCenterZ + tempLocalPos.z
              );

              tempMatrix.compose(finalPos, palletQuat, scaleUnit);
              listCinzas.push(tempMatrix.clone());
            }
          } else {
            let capacidadeMaxima = 30;
            if (vagaId.includes("N2")) {
              capacidadeMaxima = 25;
            } else if (vagaId.includes("N1") || vagaId.includes("N3")) {
              capacidadeMaxima = 30;
            }

            const saldoVaga = saldos[vagaId] !== undefined
              ? saldos[vagaId]
              : saldos[palletRoot.name] !== undefined
              ? saldos[palletRoot.name]
              : gerarSaldoVariado(vagaId, capacidadeMaxima);

            const caixasAtivas = Math.min(Math.max(saldoVaga, 0), capacidadeMaxima);

            for (let i = 0; i < caixasAtivas; i++) {
              const itemCamada = i % 5;
              const andarCaixa = Math.floor(i / 5);
              const config = padraoCamadaVermelha[itemCamada];

              tempLocalPos.set(
                config.x,
                (andarCaixa + 0.5) * (CAIXA_ALTURA + GAP),
                config.z
              );

              tempLocalPos.applyQuaternion(palletQuat);

              const finalPos = new THREE.Vector3(
                palletCenterX + tempLocalPos.x,
                palletTopY + tempLocalPos.y,
                palletCenterZ + tempLocalPos.z
              );
              const finalRot = palletQuat.clone().multiply(config.rot);

              tempMatrix.compose(finalPos, finalRot, scaleUnit);
              listVermelhas.push(tempMatrix.clone());
            }
          }
        }
      }
    });

    return {
      transformsVermelhas: listVermelhas,
      transformsCinzas: listCinzas,
      transformsCinzasFinas: listCinzasFinas,
      totalPallets: countPallets,
    };
  }, [scene, saldos, rot0, rot90, scaleUnit, materiaisEstrutura]);

  // Atualiza Vermelhas
  useEffect(() => {
    if (caixasVermelhasMeshRef.current && transformsVermelhas.length > 0) {
      const baseColor = new THREE.Color("#D56F55");
      const tempColor = new THREE.Color();
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);

      transformsVermelhas.forEach((matrix, i) => {
        caixasVermelhasMeshRef.current!.setMatrixAt(i, matrix);
        const pseudoRandom = Math.abs(Math.sin(i * 12.9898 + 78.233));
        const lVar = (pseudoRandom - 0.5) * 0.14;
        const sVar = (pseudoRandom - 0.5) * 0.08;

        tempColor.setHSL(
          hsl.h,
          Math.max(0.2, Math.min(0.9, hsl.s + sVar)),
          Math.max(0.25, Math.min(0.65, hsl.l + lVar))
        );
        caixasVermelhasMeshRef.current!.setColorAt(i, tempColor);
      });

      caixasVermelhasMeshRef.current.instanceMatrix.needsUpdate = true;
      if (caixasVermelhasMeshRef.current.instanceColor) {
        caixasVermelhasMeshRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [transformsVermelhas]);

  // Atualiza Cinzas Padrão (6 andares)
  useEffect(() => {
    if (caixasCinzasMeshRef.current && transformsCinzas.length > 0) {
      const baseColorCinza = new THREE.Color("#404142");
      const tempColor = new THREE.Color();
      const hsl = { h: 0, s: 0, l: 0 };
      baseColorCinza.getHSL(hsl);

      transformsCinzas.forEach((matrix, i) => {
        caixasCinzasMeshRef.current!.setMatrixAt(i, matrix);
        const pseudoRandom = Math.abs(Math.sin(i * 15.123 + 45.678));
        const lVar = (pseudoRandom - 0.4) * 0.1;

        tempColor.setHSL(
          hsl.h,
          hsl.s,
          Math.max(0.17, Math.min(0.18, hsl.l + lVar))
        );
        caixasCinzasMeshRef.current!.setColorAt(i, tempColor);
      });

      caixasCinzasMeshRef.current.instanceMatrix.needsUpdate = true;
      if (caixasCinzasMeshRef.current.instanceColor) {
        caixasCinzasMeshRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [transformsCinzas]);

  // Atualiza Cinzas Finas (12 andares)
  useEffect(() => {
    if (caixasCinzasFinasMeshRef.current && transformsCinzasFinas.length > 0) {
      const baseColorCinzaFina = new THREE.Color("#404142");
      const tempColor = new THREE.Color();
      const hsl = { h: 0, s: 0, l: 0 };
      baseColorCinzaFina.getHSL(hsl);

      transformsCinzasFinas.forEach((matrix, i) => {
        caixasCinzasFinasMeshRef.current!.setMatrixAt(i, matrix);
        const pseudoRandom = Math.abs(Math.sin(i * 19.345 + 32.112));
        const lVar = (pseudoRandom - 0.4) * 0.1;

        tempColor.setHSL(
          hsl.h,
          hsl.s,
          Math.max(0.17, Math.min(0.18, hsl.l + lVar))
        );
        caixasCinzasFinasMeshRef.current!.setColorAt(i, tempColor);
      });

      caixasCinzasFinasMeshRef.current.instanceMatrix.needsUpdate = true;
      if (caixasCinzasFinasMeshRef.current.instanceColor) {
        caixasCinzasFinasMeshRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [transformsCinzasFinas]);

  // Atualiza estatísticas
  useEffect(() => {
    if (onStatsUpdate) {
      const totalCaixas = transformsVermelhas.length + transformsCinzas.length + transformsCinzasFinas.length;
      onStatsUpdate({
        totalMeshes: totalCaixas,
        caixasVermelhas: transformsVermelhas.length,
        caixasCinzas: transformsCinzas.length,
        caixasCinzasFinas: transformsCinzasFinas.length,
        drawCalls: (transformsVermelhas.length > 0 ? 1 : 0) + 
                  (transformsCinzas.length > 0 ? 1 : 0) + 
                  (transformsCinzasFinas.length > 0 ? 1 : 0),
        totalVertices: totalCaixas * 24,
        totalTriangles: totalCaixas * 12,
        totalPallets,
        mode: "instanced",
      });
    }
  }, [transformsVermelhas.length, transformsCinzas.length, transformsCinzasFinas.length, totalPallets, onStatsUpdate]);

  return (
    <group name="galpao-sincronizado-root">
      <primitive object={scene} />

      {/* 1. Caixas Vermelhas */}
      {transformsVermelhas.length > 0 && (
        <instancedMesh
          ref={caixasVermelhasMeshRef}
          args={[undefined, undefined, transformsVermelhas.length]}
          matrixAutoUpdate={false}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[CAIXA_LARGURA, CAIXA_ALTURA, CAIXA_COMPRIMENTO]} />
          <meshStandardMaterial
            roughness={0.65}
            metalness={0.05}
            wireframe={wireframe}
          />
        </instancedMesh>
      )}

      {/* 2. Caixas Cinzas Padrão (6 andares) */}
      {transformsCinzas.length > 0 && (
        <instancedMesh
          ref={caixasCinzasMeshRef}
          args={[undefined, undefined, transformsCinzas.length]}
          matrixAutoUpdate={false}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[CAIXA_CINZA_LARGURA, CAIXA_CINZA_ALTURA, CAIXA_CINZA_COMPRIMENTO]} />
          <meshStandardMaterial
            roughness={0.6}
            metalness={0.08}
            wireframe={wireframe}
          />
        </instancedMesh>
      )}

      {/* 3. Caixas Cinzas Finas (12 andares) */}
      {transformsCinzasFinas.length > 0 && (
        <instancedMesh
          ref={caixasCinzasFinasMeshRef}
          args={[undefined, undefined, transformsCinzasFinas.length]}
          matrixAutoUpdate={false}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[CAIXA_CINZA_FINA_LARGURA, CAIXA_CINZA_FINA_ALTURA, CAIXA_CINZA_FINA_COMPRIMENTO]} />
          <meshStandardMaterial
            roughness={0.6}
            metalness={0.08}
            wireframe={wireframe}
          />
        </instancedMesh>
      )}
    </group>
  );
}