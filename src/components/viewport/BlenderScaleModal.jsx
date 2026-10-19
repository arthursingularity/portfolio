"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { isModelResizable } from "./LeftBar";

/**
 * BlenderScaleModal (Modificar Tamanho S - Blender Style)
 *
 * Funcionalidade idêntica ao Blender:
 * 1. Apenas disponível para modelos que permitem edição de tamanho (Parede, Barra, Piso).
 * 2. Mover o cursor aumenta/diminui o tamanho do objeto proporcionalmente à distância até o centro.
 * 3. Pressionar X trava o redimensionamento estritamente na orientação X.
 * 4. Pressionar Y trava o redimensionamento na orientação Y (profundidade).
 * 5. Pressionar Z trava o redimensionamento na orientação Z (altura).
 * 6. Pressionar a mesma tecla novamente restaura o redimensionamento uniforme em todas as orientações.
 * 7. Segurar Shift permite ajuste fino de precisão.
 * 8. Clique Esquerdo ou Enter confirma o novo tamanho e atualiza as propriedades métricas do modelo.
 * 9. Clique Direito ou Esc cancela e restaura o tamanho original.
 */
export default function BlenderScaleModal({
  selectedItem,
  selectedItems = [],
  onUpdateTransform,
  onUpdateTransforms,
  onUpdateProps,
  targetRegistryRef,
  orbitControlsRef,
  isScaleActive = false,
  axisLock = null,
  setAxisLock = () => {},
  onFinishScale = () => {},
  onScaleInfoChange = () => {},
}) {
  const { camera, gl } = useThree();

  const stateRef = useRef({
    isScaling: false,
    axisLock: null, // 'x' | 'y' | 'z' | null
    initialDist: 100,
    initialMouseCaptured: false,
    centerScreen: { x: 0, y: 0 },
    initialData: {},
    currentFactor: 1.0,
    pivot3D: new THREE.Vector3(),
    selectedItem,
    selectedItems,
  });

  const callbacksRef = useRef({
    onUpdateTransform,
    onUpdateTransforms,
    onUpdateProps,
    setAxisLock,
    onFinishScale,
    onScaleInfoChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      onUpdateTransform,
      onUpdateTransforms,
      onUpdateProps,
      setAxisLock,
      onFinishScale,
      onScaleInfoChange,
    };
  }, [
    onUpdateTransform,
    onUpdateTransforms,
    onUpdateProps,
    setAxisLock,
    onFinishScale,
    onScaleInfoChange,
  ]);

  useEffect(() => {
    stateRef.current.selectedItem = selectedItem;
    stateRef.current.selectedItems = selectedItems;
  }, [selectedItem, selectedItems]);

  // Sincroniza axisLock recebido externamente
  useEffect(() => {
    if (stateRef.current.isScaling && axisLock !== undefined) {
      stateRef.current.axisLock = axisLock;
      stateRef.current.initialMouseCaptured = false;
    }
  }, [axisLock]);

  // Iniciar e encerrar sessão de escala
  useEffect(() => {
    const rawTargets =
      selectedItems && selectedItems.length > 0
        ? selectedItems
        : selectedItem
        ? [selectedItem]
        : [];

    // Filtra estritamente apenas os modelos que permitem alterar tamanho
    const activeTargets = rawTargets.filter((it) => isModelResizable(it));

    if (!isScaleActive || activeTargets.length === 0) {
      if (stateRef.current.isScaling) {
        stateRef.current.isScaling = false;
        stateRef.current.axisLock = null;
        if (orbitControlsRef?.current) {
          orbitControlsRef.current.enabled = true;
        }
        document.body.style.cursor = "default";
        callbacksRef.current.onScaleInfoChange?.(null);
      }
      return;
    }

    // Calcula o pivô 3D (média das posições dos itens selecionados)
    const pivot = new THREE.Vector3();
    activeTargets.forEach((it) => {
      const p = it.position || [0, 0, 0];
      pivot.add(new THREE.Vector3(p[0], p[1], p[2]));
    });
    pivot.divideScalar(activeTargets.length);
    stateRef.current.pivot3D = pivot;

    // Projeta o pivô 3D na tela 2D
    camera.updateMatrixWorld();
    const proj = pivot.clone().project(camera);
    const rect = gl.domElement.getBoundingClientRect();
    const centerScreenX = ((proj.x + 1) / 2) * rect.width + rect.left;
    const centerScreenY = ((-proj.y + 1) / 2) * rect.height + rect.top;
    stateRef.current.centerScreen = { x: centerScreenX, y: centerScreenY };

    // Guarda os estados iniciais de escala, posição e propriedades métricas
    const initMap = {};
    activeTargets.forEach((it) => {
      const node = targetRegistryRef?.current?.[it.id];
      const curScale = node
        ? [node.scale.x, node.scale.y, node.scale.z]
        : it.scale || [1, 1, 1];
      const curPos = node
        ? [node.position.x, node.position.y, node.position.z]
        : [...it.position];
      initMap[it.id] = {
        scale: curScale,
        position: curPos,
        props: it.props ? JSON.parse(JSON.stringify(it.props)) : {},
      };
    });
    stateRef.current.initialData = initMap;

    stateRef.current.initialDist = 100;
    stateRef.current.initialMouseCaptured = false;
    stateRef.current.isScaling = true;
    stateRef.current.axisLock = axisLock || null;
    stateRef.current.currentFactor = 1.0;

    // Desativa controles de órbita durante a transformação
    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = false;
    }
    document.body.style.cursor = "crosshair";

    callbacksRef.current.onScaleInfoChange?.({
      factor: 1.0,
      axisLock: axisLock || null,
      mousePos: { x: centerScreenX + 60, y: centerScreenY },
      centerPos: { x: centerScreenX, y: centerScreenY },
      pivot3D: pivot,
    });
  }, [
    isScaleActive,
    selectedItem,
    selectedItems,
    camera,
    gl,
    orbitControlsRef,
    targetRegistryRef,
    onScaleInfoChange,
  ]);

  // Função para aplicar a escala aos nós Three.js em tempo real
  const applyScale = (factor, axis) => {
    const s = stateRef.current;
    const rawTargets =
      s.selectedItems && s.selectedItems.length > 0
        ? s.selectedItems
        : s.selectedItem
        ? [s.selectedItem]
        : [];
    const activeTargets = rawTargets.filter((it) => isModelResizable(it));

    activeTargets.forEach((it) => {
      const node = targetRegistryRef?.current?.[it.id];
      const init = s.initialData[it.id];
      if (!node || !init) return;

      let sx = init.scale[0];
      let sy = init.scale[1];
      let sz = init.scale[2];

      if (axis === "x") {
        sx = Math.round(init.scale[0] * factor * 1000) / 1000;
      } else if (axis === "y") {
        // Orientação Y no Blender = Profundidade horizontal (Z no Three.js)
        sz = Math.round(init.scale[2] * factor * 1000) / 1000;
      } else if (axis === "z") {
        // Orientação Z no Blender = Altura vertical (Y no Three.js)
        sy = Math.round(init.scale[1] * factor * 1000) / 1000;
      } else {
        // Uniforme em todas as orientações
        sx = Math.round(init.scale[0] * factor * 1000) / 1000;
        sy = Math.round(init.scale[1] * factor * 1000) / 1000;
        sz = Math.round(init.scale[2] * factor * 1000) / 1000;
      }

      node.scale.set(
        Math.max(0.005, sx),
        Math.max(0.005, sy),
        Math.max(0.005, sz)
      );

      // Se múltiplos itens estiverem selecionados, escala suas distâncias em relação ao pivô
      if (activeTargets.length > 1) {
        const offset = new THREE.Vector3(
          init.position[0] - s.pivot3D.x,
          init.position[1] - s.pivot3D.y,
          init.position[2] - s.pivot3D.z
        );

        if (axis === "x") offset.x *= factor;
        else if (axis === "y") offset.z *= factor;
        else if (axis === "z") offset.y *= factor;
        else offset.multiplyScalar(factor);

        node.position.set(
          Math.round((s.pivot3D.x + offset.x) * 1000) / 1000,
          Math.round((s.pivot3D.y + offset.y) * 1000) / 1000,
          Math.round((s.pivot3D.z + offset.z) * 1000) / 1000
        );
      }
    });
  };

  // Confirmar novo tamanho
  const confirmScale = () => {
    const s = stateRef.current;
    if (!s.isScaling) return;

    const rawTargets =
      s.selectedItems && s.selectedItems.length > 0
        ? s.selectedItems
        : s.selectedItem
        ? [s.selectedItem]
        : [];
    const activeTargets = rawTargets.filter((it) => isModelResizable(it));

    activeTargets.forEach((it) => {
      const node = targetRegistryRef?.current?.[it.id];
      const init = s.initialData[it.id];
      if (!node || !init) return;

      const scaleXFactor = node.scale.x / Math.max(0.0001, init.scale[0]);
      const scaleYFactor = node.scale.y / Math.max(0.0001, init.scale[1]);
      const scaleZFactor = node.scale.z / Math.max(0.0001, init.scale[2]);

      // Atualiza as dimensões métricas no props do modelo para sincronizar com o painel de propriedades
      if (it.type === "wall") {
        const initW = init.props?.width !== undefined ? init.props.width : 0.2;
        const initH = init.props?.height !== undefined ? init.props.height : 2.8;
        const initD = init.props?.depth !== undefined ? init.props.depth : 4.0;

        const newW = Math.max(0.02, Math.round(initW * scaleXFactor * 100) / 100);
        const newH = Math.max(0.1, Math.round(initH * scaleYFactor * 100) / 100);
        const newD = Math.max(0.1, Math.round(initD * scaleZFactor * 100) / 100);

        callbacksRef.current.onUpdateProps?.(it.id, { width: newW, height: newH, depth: newD });
      } else if (it.type === "bar") {
        const initW = init.props?.width !== undefined ? Number(init.props.width) || 0.05 : 0.05;
        const initH = init.props?.height !== undefined ? Number(init.props.height) || 0.05 : 0.05;
        const initD = init.props?.depth !== undefined ? Number(init.props.depth) || 2.0 : 2.0;

        const newW = Math.max(0.005, Math.round(initW * scaleXFactor * 1000) / 1000);
        const newH = Math.max(0.005, Math.round(initH * scaleYFactor * 1000) / 1000);
        const newD = Math.max(0.01, Math.round(initD * scaleZFactor * 100) / 100);

        callbacksRef.current.onUpdateProps?.(it.id, { width: newW, height: newH, depth: newD });
      } else if (it.type === "cube") {
        const initW = init.props?.width !== undefined ? Number(init.props.width) || 1.0 : 1.0;
        const initH = init.props?.height !== undefined ? Number(init.props.height) || 1.0 : 1.0;
        const initD = init.props?.depth !== undefined ? Number(init.props.depth) || 1.0 : 1.0;

        const newW = Math.max(0.01, Math.round(initW * scaleXFactor * 100) / 100);
        const newH = Math.max(0.01, Math.round(initH * scaleYFactor * 100) / 100);
        const newD = Math.max(0.01, Math.round(initD * scaleZFactor * 100) / 100);

        callbacksRef.current.onUpdateProps?.(it.id, { width: newW, height: newH, depth: newD });
      } else if (it.type === "floor") {
        const initW = init.props?.width !== undefined ? Number(init.props.width) || 10 : 10;
        const initD = init.props?.depth !== undefined ? Number(init.props.depth) || 10 : 10;

        const newW = Math.max(0.5, Math.round(initW * scaleXFactor * 10) / 10);
        const newD = Math.max(0.5, Math.round(initD * scaleZFactor * 10) / 10);

        callbacksRef.current.onUpdateProps?.(it.id, { width: newW, depth: newD });
      } else if (it.type === "joined") {
        // Modelo combinado mantém a escala tridimensional
      }

      // Restaura a escala para 1 em modelos que tiveram suas dimensões geométricas atualizadas
      if (it.type !== "joined") {
        node.scale.set(1, 1, 1);
      }
    });

    const updates = activeTargets.map((it) => {
      const node = targetRegistryRef?.current?.[it.id];
      const targetScale =
        it.type === "joined" && node
          ? [
              Math.round(node.scale.x * 1000) / 1000,
              Math.round(node.scale.y * 1000) / 1000,
              Math.round(node.scale.z * 1000) / 1000,
            ]
          : [1, 1, 1];

      return {
        id: it.id,
        scale: targetScale,
        position: node
          ? [
              Math.round(node.position.x * 1000) / 1000,
              Math.round(node.position.y * 1000) / 1000,
              Math.round(node.position.z * 1000) / 1000,
            ]
          : it.position,
      };
    });

    if (updates.length > 1 && callbacksRef.current.onUpdateTransforms) {
      callbacksRef.current.onUpdateTransforms(updates);
    } else if (updates.length === 1 && callbacksRef.current.onUpdateTransform) {
      callbacksRef.current.onUpdateTransform(updates[0].id, {
        scale: [1, 1, 1],
        position: updates[0].position,
      });
    }

    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = true;
    }
    document.body.style.cursor = "default";
    stateRef.current.isScaling = false;
    callbacksRef.current.onScaleInfoChange?.(null);
    callbacksRef.current.setAxisLock?.(null);
    callbacksRef.current.onFinishScale?.();
  };

  // Cancelar e restaurar tamanho original
  const cancelScale = () => {
    const s = stateRef.current;
    if (!s.isScaling) return;

    const rawTargets =
      s.selectedItems && s.selectedItems.length > 0
        ? s.selectedItems
        : s.selectedItem
        ? [s.selectedItem]
        : [];
    const activeTargets = rawTargets.filter((it) => isModelResizable(it));

    activeTargets.forEach((it) => {
      const node = targetRegistryRef?.current?.[it.id];
      const init = s.initialData[it.id];
      if (node && init) {
        node.scale.set(...init.scale);
        node.position.set(...init.position);
      }
    });

    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = true;
    }
    document.body.style.cursor = "default";
    stateRef.current.isScaling = false;
    callbacksRef.current.onScaleInfoChange?.(null);
    callbacksRef.current.setAxisLock?.(null);
    callbacksRef.current.onFinishScale?.();
  };

  // Event Listeners globais de Mouse e Teclado
  useEffect(() => {
    const handlePointerMove = (e) => {
      const s = stateRef.current;
      if (!s.isScaling) return;

      if (!s.initialMouseCaptured) {
        s.initialMouseCaptured = true;
        s.initialDist = Math.max(
          40,
          Math.hypot(e.clientX - s.centerScreen.x, e.clientY - s.centerScreen.y)
        );
      }

      const currentDist = Math.hypot(
        e.clientX - s.centerScreen.x,
        e.clientY - s.centerScreen.y
      );

      let rawFactor = currentDist / Math.max(30, s.initialDist);

      // Segurar Shift permite ajuste de alta precisão
      if (e.shiftKey) {
        rawFactor = 1.0 + (rawFactor - 1.0) * 0.15;
      }

      const factor = Math.max(0.01, Math.round(rawFactor * 100) / 100);
      s.currentFactor = factor;

      applyScale(factor, s.axisLock);

      callbacksRef.current.onScaleInfoChange?.({
        factor,
        axisLock: s.axisLock,
        mousePos: { x: e.clientX, y: e.clientY },
        centerPos: s.centerScreen,
        pivot3D: s.pivot3D,
      });
    };

    const handlePointerDown = (e) => {
      const s = stateRef.current;
      if (!s.isScaling) return;

      if (e.button === 0) {
        // Clique esquerdo: confirma
        e.preventDefault();
        e.stopPropagation();
        confirmScale();
      } else if (e.button === 2) {
        // Clique direito: cancela
        e.preventDefault();
        e.stopPropagation();
        cancelScale();
      }
    };

    const handleKeyDown = (e) => {
      // Ignora se estiver digitando em campos de texto
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const s = stateRef.current;
      if (!s.isScaling) return;

      if (e.key === "x" || e.key === "X") {
        e.preventDefault();
        e.stopPropagation();
        const next = s.axisLock === "x" ? null : "x";
        s.axisLock = next;
        s.initialMouseCaptured = false;
        callbacksRef.current.setAxisLock?.(next);
        applyScale(s.currentFactor, next);
        callbacksRef.current.onScaleInfoChange?.({
          factor: s.currentFactor,
          axisLock: next,
          mousePos: { x: s.centerScreen.x, y: s.centerScreen.y },
          centerPos: s.centerScreen,
          pivot3D: s.pivot3D,
        });
      } else if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        e.stopPropagation();
        const next = s.axisLock === "y" ? null : "y";
        s.axisLock = next;
        s.initialMouseCaptured = false;
        callbacksRef.current.setAxisLock?.(next);
        applyScale(s.currentFactor, next);
        callbacksRef.current.onScaleInfoChange?.({
          factor: s.currentFactor,
          axisLock: next,
          mousePos: { x: s.centerScreen.x, y: s.centerScreen.y },
          centerPos: s.centerScreen,
          pivot3D: s.pivot3D,
        });
      } else if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        e.stopPropagation();
        const next = s.axisLock === "z" ? null : "z";
        s.axisLock = next;
        s.initialMouseCaptured = false;
        callbacksRef.current.setAxisLock?.(next);
        applyScale(s.currentFactor, next);
        callbacksRef.current.onScaleInfoChange?.({
          factor: s.currentFactor,
          axisLock: next,
          mousePos: { x: s.centerScreen.x, y: s.centerScreen.y },
          centerPos: s.centerScreen,
          pivot3D: s.pivot3D,
        });
      } else if (
        e.key === "Enter" ||
        e.key === " " ||
        e.key === "s" ||
        e.key === "S"
      ) {
        e.preventDefault();
        e.stopPropagation();
        confirmScale();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancelScale();
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return null;
}
