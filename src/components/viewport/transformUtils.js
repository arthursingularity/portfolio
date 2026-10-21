"use client";

import * as THREE from "three";

/**
 * Computes the geometric local center of a model from its live 3D meshes.
 * If meshes are not available yet, falls back to estimated model center from item props.
 */
export function getModelLocalCenter(node, item) {
  if (node) {
    node.updateMatrixWorld(true);
    const inverseTarget = node.matrixWorld.clone().invert();
    const localBox = new THREE.Box3();

    node.traverse((child) => {
      if (
        child.isMesh &&
        child.geometry &&
        !child.name?.startsWith("__helper") &&
        !child.userData?.isHelper
      ) {
        if (!child.geometry.boundingBox) {
          child.geometry.computeBoundingBox();
        }
        if (child.geometry.boundingBox) {
          const geomBox = child.geometry.boundingBox.clone();
          const childToTarget = child.matrixWorld.clone().premultiply(inverseTarget);
          geomBox.applyMatrix4(childToTarget);
          localBox.union(geomBox);
        }
      }
    });

    if (!localBox.isEmpty()) {
      const center = new THREE.Vector3();
      localBox.getCenter(center);
      return center;
    }
  }

  // Fallback estimation if node or meshes are not ready
  if (!item) return new THREE.Vector3(0, 0, 0);

  let h = 0.5;
  switch (item.type) {
    case "drawer_g": {
      const count = item.props?.count || 5;
      h = Math.max(0.2, count * 0.222);
      break;
    }
    case "pallet":
      h = 0.15;
      break;
    case "box": {
      const count = item.props?.count ?? item.props?.maxHeight ?? 6;
      h = Math.max(0.2, count * 0.24);
      break;
    }
    case "wall":
      h = Number(item.props?.height) || 2.5;
      break;
    case "bar":
      h = Number(item.props?.height) || 0.05;
      break;
    case "cube":
      h = Number(item.props?.height) || 1.0;
      break;
    default:
      h = 0.5;
  }

  return new THREE.Vector3(0, h / 2, 0);
}

/**
 * Computes the world center position of a single model.
 */
export function getModelWorldCenter(node, item) {
  if (node) {
    const localCenter = getModelLocalCenter(node, item);
    node.updateMatrixWorld(true);
    return node.localToWorld(localCenter.clone());
  }

  const p = item?.position || [0, 0, 0];
  const r = item?.rotation || [0, 0, 0];
  const localCenter = getModelLocalCenter(null, item);
  const euler = new THREE.Euler(r[0], r[1], r[2], "XYZ");
  localCenter.applyEuler(euler);
  return new THREE.Vector3(p[0] + localCenter.x, p[1] + localCenter.y, p[2] + localCenter.z);
}

/**
 * Computes the 3D world center of a selection of models.
 * - For 1 model: exact center of that model (X, Y height, Z).
 * - For 2 or more models: exact geometric center between all selected models.
 */
export function getSelectionWorldCenter(items, targetRegistry) {
  if (!items || items.length === 0) {
    return new THREE.Vector3(0, 0, 0);
  }

  if (items.length === 1) {
    const it = items[0];
    const node = targetRegistry?.[it.id];
    return getModelWorldCenter(node, it);
  }

  const combinedBox = new THREE.Box3();
  let hasValidMesh = false;

  items.forEach((it) => {
    const node = targetRegistry?.[it.id];
    if (node) {
      node.updateMatrixWorld(true);
      node.traverse((child) => {
        if (
          child.isMesh &&
          child.geometry &&
          !child.name?.startsWith("__helper") &&
          !child.userData?.isHelper
        ) {
          if (!child.geometry.boundingBox) {
            child.geometry.computeBoundingBox();
          }
          if (child.geometry.boundingBox) {
            const worldBox = child.geometry.boundingBox.clone();
            worldBox.applyMatrix4(child.matrixWorld);
            combinedBox.union(worldBox);
            hasValidMesh = true;
          }
        }
      });
    }
  });

  if (hasValidMesh && !combinedBox.isEmpty()) {
    const center = new THREE.Vector3();
    combinedBox.getCenter(center);
    return center;
  }

  // Fallback if meshes are not yet measurable: average world centers
  const sum = new THREE.Vector3();
  items.forEach((it) => {
    const node = targetRegistry?.[it.id];
    sum.add(getModelWorldCenter(node, it));
  });
  sum.divideScalar(items.length);
  return sum;
}
