"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

/**
 * BlenderGrabModal (Mover G - Blender Style)
 *
 * Funcionalidade idêntica ao Blender:
 * 1. Pressionar G ativa o modo de deslocamento modal.
 * 2. Mover o cursor desloca os objetos selecionados no plano de visão da câmera.
 * 3. Pressionar X trava o movimento estritamente no Eixo X (Vermelho).
 * 4. Pressionar Y trava o movimento no Eixo Y (Verde / Profundidade / Z no Three.js).
 * 5. Pressionar Z trava o movimento no Eixo Z (Azul / Altura / Y no Three.js).
 * 6. Pressionar a mesma tecla de eixo novamente restaura o movimento livre.
 * 7. Segurar Shift permite ajuste fino de precisão.
 * 8. Clique Esquerdo, Enter ou G confirma a nova posição.
 * 9. Clique Direito ou Esc cancela e restaura a posição original.
 */
export default function BlenderGrabModal({
  selectedItem,
  selectedItems = [],
  onUpdateTransform,
  onUpdateTransforms,
  targetRegistryRef,
  orbitControlsRef,
  isGrabActive = false,
  axisLock = null,
  setAxisLock = () => {},
  snapToGrid = false,
  gridSnapSize = 0.05,
  onFinishGrab = () => {},
  onGrabInfoChange = () => {},
}) {
  const { camera, gl } = useThree();

  const stateRef = useRef({
    isGrabbing: false,
    axisLock: null,
    pivot3D: new THREE.Vector3(),
    centerScreen: { x: 0, y: 0 },
    initialData: {},
    initialMouse: null,
    initialPlaneIntersect: null,
    initialAxisParam: null,
    currentDelta: new THREE.Vector3(0, 0, 0),
    activeTargets: [],
  });

  const callbacksRef = useRef({
    onUpdateTransform,
    onUpdateTransforms,
    setAxisLock,
    onFinishGrab,
    onGrabInfoChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      onUpdateTransform,
      onUpdateTransforms,
      setAxisLock,
      onFinishGrab,
      onGrabInfoChange,
    };
  }, [
    onUpdateTransform,
    onUpdateTransforms,
    setAxisLock,
    onFinishGrab,
    onGrabInfoChange,
  ]);

  // Sincroniza axisLock recebido externamente
  useEffect(() => {
    if (stateRef.current.isGrabbing && axisLock !== undefined) {
      stateRef.current.axisLock = axisLock;
      stateRef.current.initialAxisParam = null; // recalcula referência para não saltar
    }
  }, [axisLock]);

  // Iniciar e encerrar sessão de Grab
  useEffect(() => {
    const rawTargets =
      selectedItems && selectedItems.length > 0
        ? selectedItems
        : selectedItem
        ? [selectedItem]
        : [];

    if (!isGrabActive || rawTargets.length === 0) {
      if (stateRef.current.isGrabbing) {
        stateRef.current.isGrabbing = false;
        stateRef.current.axisLock = null;
        if (orbitControlsRef?.current) {
          orbitControlsRef.current.enabled = true;
        }
        document.body.style.cursor = "default";
        callbacksRef.current.onGrabInfoChange?.(null);
      }
      return;
    }

    // Calcula o pivô 3D (média das posições dos itens selecionados)
    const pivot = new THREE.Vector3();
    const initMap = {};
    rawTargets.forEach((it) => {
      const node = targetRegistryRef?.current?.[it.id];
      const curPos = node
        ? new THREE.Vector3(node.position.x, node.position.y, node.position.z)
        : new THREE.Vector3(it.position[0], it.position[1], it.position[2]);
      initMap[it.id] = curPos.clone();
      pivot.add(curPos);
    });
    pivot.divideScalar(rawTargets.length);

    stateRef.current.pivot3D = pivot;
    stateRef.current.initialData = initMap;
    stateRef.current.activeTargets = rawTargets;
    stateRef.current.isGrabbing = true;
    stateRef.current.axisLock = axisLock || null;
    stateRef.current.currentDelta = new THREE.Vector3(0, 0, 0);
    stateRef.current.initialMouse = null;
    stateRef.current.initialPlaneIntersect = null;
    stateRef.current.initialAxisParam = null;

    // Projeta o pivô 3D na tela 2D
    camera.updateMatrixWorld();
    const proj = pivot.clone().project(camera);
    const rect = gl.domElement.getBoundingClientRect();
    const centerScreenX = ((proj.x + 1) / 2) * rect.width + rect.left;
    const centerScreenY = ((-proj.y + 1) / 2) * rect.height + rect.top;
    stateRef.current.centerScreen = { x: centerScreenX, y: centerScreenY };

    // Desativa OrbitControls durante o movimento
    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = false;
    }
    document.body.style.cursor = "move";

    callbacksRef.current.onGrabInfoChange?.({
      axisLock: axisLock || null,
      deltaVector: new THREE.Vector3(0, 0, 0),
      deltaAmount: 0,
      mousePos: { x: centerScreenX, y: centerScreenY },
      centerPos: { x: centerScreenX, y: centerScreenY },
      pivot3D: pivot,
    });
  }, [
    isGrabActive,
    selectedItem,
    selectedItems,
    axisLock,
    camera,
    gl,
    orbitControlsRef,
    targetRegistryRef,
  ]);

  // Função auxiliar para obter vetor 3D do eixo
  const getAxisVector = (axis) => {
    if (axis === "x") return new THREE.Vector3(1, 0, 0);
    // Blender Y = Profundidade horizontal no Three.js (Z)
    if (axis === "y") return new THREE.Vector3(0, 0, 1);
    // Blender Z = Altura vertical no Three.js (Y)
    if (axis === "z") return new THREE.Vector3(0, 1, 0);
    return null;
  };

  // Confirmar movimento
  const confirmGrab = () => {
    const s = stateRef.current;
    if (!s.isGrabbing) return;

    const updates = s.activeTargets.map((it) => {
      const node = targetRegistryRef?.current?.[it.id];
      const newPos = node
        ? [
            Math.round(node.position.x * 1000) / 1000,
            Math.round(node.position.y * 1000) / 1000,
            Math.round(node.position.z * 1000) / 1000,
          ]
        : it.position;
      return {
        id: it.id,
        position: newPos,
      };
    });

    if (updates.length > 1 && callbacksRef.current.onUpdateTransforms) {
      callbacksRef.current.onUpdateTransforms(updates);
    } else if (updates.length === 1 && callbacksRef.current.onUpdateTransform) {
      callbacksRef.current.onUpdateTransform(updates[0].id, {
        position: updates[0].position,
      });
    }

    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = true;
    }
    document.body.style.cursor = "default";
    s.isGrabbing = false;
    callbacksRef.current.onGrabInfoChange?.(null);
    callbacksRef.current.setAxisLock?.(null);
    callbacksRef.current.onFinishGrab?.();
  };

  // Cancelar movimento e restaurar posições originais
  const cancelGrab = () => {
    const s = stateRef.current;
    if (!s.isGrabbing) return;

    s.activeTargets.forEach((it) => {
      const node = targetRegistryRef?.current?.[it.id];
      const init = s.initialData[it.id];
      if (node && init) {
        node.position.copy(init);
      }
    });

    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = true;
    }
    document.body.style.cursor = "default";
    s.isGrabbing = false;
    callbacksRef.current.onGrabInfoChange?.(null);
    callbacksRef.current.setAxisLock?.(null);
    callbacksRef.current.onFinishGrab?.();
  };

  // Event Listeners globais de Mouse e Teclado
  useEffect(() => {
    const raycaster = new THREE.Raycaster();

    const handlePointerMove = (e) => {
      const s = stateRef.current;
      if (!s.isGrabbing) return;

      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);

      // Inicializa ponto de partida do mouse e plano de visão se ainda não capturado
      const cameraDir = camera.getWorldDirection(new THREE.Vector3());
      const viewPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        cameraDir.clone().negate(),
        s.pivot3D
      );

      const planeIntersect = new THREE.Vector3();
      const hasIntersect = raycaster.ray.intersectPlane(viewPlane, planeIntersect);

      if (!s.initialMouse) {
        s.initialMouse = { x: e.clientX, y: e.clientY };
        s.initialPlaneIntersect = hasIntersect ? planeIntersect.clone() : s.pivot3D.clone();
      }

      let deltaVector = new THREE.Vector3();
      const axisVec = getAxisVector(s.axisLock);

      if (axisVec) {
        // Cálculo geométrico do ponto mais próximo na linha do eixo 3D
        const p1 = raycaster.ray.origin;
        const d1 = raycaster.ray.direction;
        const p2 = s.pivot3D;
        const d2 = axisVec;

        const v = new THREE.Vector3().subVectors(p1, p2);
        const a = d1.dot(d1); // 1
        const b = d1.dot(d2);
        const c = d2.dot(d2); // 1
        const d = d1.dot(v);
        const ev = d2.dot(v);

        const denom = a * c - b * b;
        let sParam = 0;

        if (Math.abs(denom) > 1e-4) {
          sParam = (b * d - ev) / denom;
        } else {
          // Fallback se a câmera estiver olhando diretamente pelo eixo
          const projP0 = p2.clone().project(camera);
          const projP1 = p2.clone().add(d2).project(camera);
          const screenDir = new THREE.Vector2(
            (projP1.x - projP0.x) * rect.width * 0.5,
            -(projP1.y - projP0.y) * rect.height * 0.5
          );
          const len = screenDir.length();
          if (len > 0.001) {
            screenDir.divideScalar(len);
            const mouseDelta = new THREE.Vector2(
              e.clientX - s.initialMouse.x,
              e.clientY - s.initialMouse.y
            );
            sParam = (mouseDelta.dot(screenDir) / len) * 2.0;
          }
        }

        if (s.initialAxisParam === null) {
          s.initialAxisParam = sParam;
        }

        let deltaS = sParam - s.initialAxisParam;

        if (e.shiftKey) {
          deltaS *= 0.15; // Precisão fina
        }

        if (snapToGrid) {
          const snap = gridSnapSize || 0.05;
          deltaS = Math.round(deltaS / snap) * snap;
        }

        deltaS = Math.round(deltaS * 1000) / 1000;
        deltaVector = axisVec.clone().multiplyScalar(deltaS);
      } else {
        // Movimento livre no plano de visão da câmera
        if (hasIntersect && s.initialPlaneIntersect) {
          let delta = planeIntersect.clone().sub(s.initialPlaneIntersect);
          if (e.shiftKey) {
            delta.multiplyScalar(0.15);
          }
          if (snapToGrid) {
            const snap = gridSnapSize || 0.05;
            delta.x = Math.round(delta.x / snap) * snap;
            delta.y = Math.round(delta.y / snap) * snap;
            delta.z = Math.round(delta.z / snap) * snap;
          }
          deltaVector = delta;
        }
      }

      s.currentDelta = deltaVector;

      // Aplica a nova posição diretamente aos nós do Three.js
      s.activeTargets.forEach((it) => {
        const node = targetRegistryRef?.current?.[it.id];
        const init = s.initialData[it.id];
        if (node && init) {
          node.position.set(
            init.x + deltaVector.x,
            init.y + deltaVector.y,
            init.z + deltaVector.z
          );
        }
      });

      // Quantidade métrica de deslocamento no eixo ativo
      let deltaAmount = 0;
      if (s.axisLock === "x") deltaAmount = deltaVector.x;
      else if (s.axisLock === "y") deltaAmount = deltaVector.z; // Profundidade no Three.js Z
      else if (s.axisLock === "z") deltaAmount = deltaVector.y; // Altura no Three.js Y
      else deltaAmount = deltaVector.length();

      callbacksRef.current.onGrabInfoChange?.({
        axisLock: s.axisLock,
        deltaVector,
        deltaAmount,
        mousePos: { x: e.clientX, y: e.clientY },
        centerPos: s.centerScreen,
        pivot3D: s.pivot3D,
      });
    };

    const handlePointerDown = (e) => {
      const s = stateRef.current;
      if (!s.isGrabbing) return;

      if (e.button === 0) {
        // Clique esquerdo: confirma
        e.preventDefault();
        e.stopPropagation();
        confirmGrab();
      } else if (e.button === 2) {
        // Clique direito: cancela
        e.preventDefault();
        e.stopPropagation();
        cancelGrab();
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
      if (!s.isGrabbing) return;

      if (e.key === "x" || e.key === "X") {
        e.preventDefault();
        e.stopPropagation();
        const next = s.axisLock === "x" ? null : "x";
        s.axisLock = next;
        s.initialAxisParam = null;
        callbacksRef.current.setAxisLock?.(next);
        callbacksRef.current.onGrabInfoChange?.({
          axisLock: next,
          deltaVector: s.currentDelta,
          deltaAmount: 0,
          mousePos: s.centerScreen,
          centerPos: s.centerScreen,
          pivot3D: s.pivot3D,
        });
      } else if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        e.stopPropagation();
        const next = s.axisLock === "y" ? null : "y";
        s.axisLock = next;
        s.initialAxisParam = null;
        callbacksRef.current.setAxisLock?.(next);
        callbacksRef.current.onGrabInfoChange?.({
          axisLock: next,
          deltaVector: s.currentDelta,
          deltaAmount: 0,
          mousePos: s.centerScreen,
          centerPos: s.centerScreen,
          pivot3D: s.pivot3D,
        });
      } else if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        e.stopPropagation();
        const next = s.axisLock === "z" ? null : "z";
        s.axisLock = next;
        s.initialAxisParam = null;
        callbacksRef.current.setAxisLock?.(next);
        callbacksRef.current.onGrabInfoChange?.({
          axisLock: next,
          deltaVector: s.currentDelta,
          deltaAmount: 0,
          mousePos: s.centerScreen,
          centerPos: s.centerScreen,
          pivot3D: s.pivot3D,
        });
      } else if (
        e.key === "Enter" ||
        e.key === " " ||
        e.key === "g" ||
        e.key === "G"
      ) {
        e.preventDefault();
        e.stopPropagation();
        confirmGrab();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancelGrab();
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
  }, [camera, gl, snapToGrid, gridSnapSize]);

  return null;
}
