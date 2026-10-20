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
  gridSnapSize = 0.025,
  justFinishedTransformRef = null,
  onTransformStart,
  onFinishGrab = () => {},
  onGrabInfoChange = () => {},
}) {
  const { camera, gl } = useThree();

  const stateRef = useRef({
    isGrabbing: false,
    axisLock: null,
    axisSpace: "none", // 'global' | 'local' | 'none'
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
    onTransformStart,
    onFinishGrab,
    onGrabInfoChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      onUpdateTransform,
      onUpdateTransforms,
      setAxisLock,
      onTransformStart,
      onFinishGrab,
      onGrabInfoChange,
    };
  }, [
    onUpdateTransform,
    onUpdateTransforms,
    setAxisLock,
    onTransformStart,
    onFinishGrab,
    onGrabInfoChange,
  ]);

  // Sincroniza axisLock recebido externamente
  useEffect(() => {
    if (stateRef.current.isGrabbing && axisLock !== undefined) {
      stateRef.current.axisLock = axisLock;
      stateRef.current.axisSpace = axisLock ? "global" : "none";
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

    if (!isGrabActive || !axisLock || rawTargets.length === 0) {
      if (stateRef.current.isGrabbing) {
        stateRef.current.isGrabbing = false;
        stateRef.current.axisLock = null;
        stateRef.current.axisSpace = "none";
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
    stateRef.current.axisSpace = axisLock ? "global" : "none";
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

    callbacksRef.current.onTransformStart?.(rawTargets[0]?.id);

    callbacksRef.current.onGrabInfoChange?.({
      axisLock: axisLock || null,
      axisSpace: axisLock ? "global" : "none",
      axisVector: null,
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

  // Função auxiliar para obter vetor 3D do eixo (Global ou Local)
  const getAxisVector = (axis, space = "global", primaryNode = null) => {
    if (!axis) return null;

    if (space === "local" && primaryNode) {
      primaryNode.updateMatrixWorld(true);
      const mat = primaryNode.matrixWorld;
      // Local X: Coluna 0
      if (axis === "x") return new THREE.Vector3().setFromMatrixColumn(mat, 0).normalize();
      // Local Y (Blender Y = Z no Three.js / Profundidade horizontal): Coluna 2
      if (axis === "y") return new THREE.Vector3().setFromMatrixColumn(mat, 2).normalize();
      // Local Z (Blender Z = Y no Three.js / Altura vertical): Coluna 1
      if (axis === "z") return new THREE.Vector3().setFromMatrixColumn(mat, 1).normalize();
    }

    // Global
    if (axis === "x") return new THREE.Vector3(1, 0, 0);
    // Blender Y = Profundidade horizontal no Three.js (Z)
    if (axis === "y") return new THREE.Vector3(0, 0, 1);
    // Blender Z = Altura vertical no Three.js (Y)
    if (axis === "z") return new THREE.Vector3(0, 1, 0);
    return null;
  };

  // Alterna restrição de eixo: Global -> Local -> Nenhum (Livre)
  const cycleAxisLock = (axisKey) => {
    const s = stateRef.current;
    if (!s.isGrabbing) return;

    let nextAxis = axisKey;
    let nextSpace = "global";

    if (s.axisLock !== axisKey) {
      // 1º toque no eixo: Eixo Global
      nextAxis = axisKey;
      nextSpace = "global";
    } else {
      // Mesma tecla pressionada novamente (toggle cíclico)
      if (s.axisSpace === "global") {
        // 2º toque: Eixo Local
        nextAxis = axisKey;
        nextSpace = "local";
      } else if (s.axisSpace === "local") {
        // 3º toque: encerra o modal grab e retorna às setinhas de orientação
        confirmGrab();
        return;
      } else {
        nextAxis = axisKey;
        nextSpace = "global";
      }
    }

    s.axisLock = nextAxis;
    s.axisSpace = nextSpace;
    s.initialAxisParam = null; // Reseta referência para não saltar

    const primaryTarget = s.activeTargets[0];
    const targetNode = primaryTarget ? targetRegistryRef?.current?.[primaryTarget.id] : null;
    const axisVec = getAxisVector(nextAxis, nextSpace, targetNode);

    callbacksRef.current.setAxisLock?.(nextAxis);
    callbacksRef.current.onGrabInfoChange?.({
      axisLock: nextAxis,
      axisSpace: nextSpace,
      axisVector: axisVec,
      deltaVector: s.currentDelta,
      deltaAmount: 0,
      mousePos: s.centerScreen,
      centerPos: s.centerScreen,
      pivot3D: s.pivot3D,
    });
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

    if (justFinishedTransformRef) {
      justFinishedTransformRef.current = true;
    }

    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = true;
    }
    document.body.style.cursor = "default";
    const finishedId = s.activeTargets[0]?.id;
    s.isGrabbing = false;
    s.axisLock = null;
    s.axisSpace = "none";
    callbacksRef.current.onGrabInfoChange?.(null);
    callbacksRef.current.setAxisLock?.(null);
    callbacksRef.current.onFinishGrab?.(finishedId);
  };

  // Cancelar movimento e restaurar posições originais
  const cancelGrab = () => {
    const s = stateRef.current;
    if (!s.isGrabbing) return;

    if (justFinishedTransformRef) {
      justFinishedTransformRef.current = true;
    }

    s.activeTargets.forEach((it) => {
      const node = targetRegistryRef?.current?.[it.id];
      const init = s.initialData[it.id];
      if (node && init) {
        node.position.copy(init);
        node.updateMatrixWorld(true);
      }
    });

    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = true;
    }
    document.body.style.cursor = "default";
    const finishedId = s.activeTargets[0]?.id;
    s.isGrabbing = false;
    s.axisLock = null;
    s.axisSpace = "none";
    callbacksRef.current.onGrabInfoChange?.(null);
    callbacksRef.current.setAxisLock?.(null);
    callbacksRef.current.onFinishGrab?.(finishedId);
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

      const primaryTarget = s.activeTargets[0];
      const targetNode = primaryTarget ? targetRegistryRef?.current?.[primaryTarget.id] : null;
      const axisVec = getAxisVector(s.axisLock, s.axisSpace, targetNode);

      if (axisVec) {
        // Cálculo geométrico do ponto mais próximo entre retas reversas (Skew Lines)
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
          sParam = (ev - b * d) / denom;
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
            const distToCam = camera.position ? camera.position.distanceTo(p2) : 10;
            const fovRad = ((camera.fov || 50) * Math.PI) / 180;
            const worldPerPixel = (2 * distToCam * Math.tan(fovRad / 2)) / Math.max(1, rect.height);
            sParam = mouseDelta.dot(screenDir) * worldPerPixel;
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
          const snap = gridSnapSize || 0.025;
          deltaS = Math.round(deltaS / snap) * snap;
        }

        deltaS = Math.round(deltaS * 1000) / 1000;
        deltaVector = axisVec.clone().multiplyScalar(deltaS);
      } else {
        // Movimentação livre desativada: movimento exclusivo nos eixos X, Y ou Z
        return;
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
      if (s.axisLock && axisVec) {
        deltaAmount = deltaVector.dot(axisVec);
      } else {
        deltaAmount = deltaVector.length();
      }

      callbacksRef.current.onGrabInfoChange?.({
        axisLock: s.axisLock,
        axisSpace: s.axisSpace,
        axisVector: axisVec,
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
        if (justFinishedTransformRef) {
          justFinishedTransformRef.current = true;
        }
        confirmGrab();
      } else if (e.button === 2) {
        // Clique direito: cancela e restaura posição original
        e.preventDefault();
        e.stopPropagation();
        if (justFinishedTransformRef) {
          justFinishedTransformRef.current = true;
        }
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
        cycleAxisLock("x");
      } else if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        e.stopPropagation();
        cycleAxisLock("y");
      } else if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        e.stopPropagation();
        cycleAxisLock("z");
      } else if (
        e.key === "Enter" ||
        e.key === " " ||
        e.key === "g" ||
        e.key === "G"
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (justFinishedTransformRef) {
          justFinishedTransformRef.current = true;
        }
        confirmGrab();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (justFinishedTransformRef) {
          justFinishedTransformRef.current = true;
        }
        cancelGrab();
      }
    };

    const handleContextMenu = (e) => {
      if (stateRef.current.isGrabbing) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [camera, gl, snapToGrid, gridSnapSize]);

  return null;
}
