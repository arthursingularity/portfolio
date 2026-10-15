"use client";

import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

/**
 * Creates a clean clone of the sector group for GLTF/GLB export.
 * Strips out editor-only helpers like TransformControls, selection rings, and gizmos.
 */
function createCleanExportGroup(exportGroup, customName = "SetorPrincipal") {
  const cleanRoot = new THREE.Group();
  cleanRoot.name = customName;

  if (!exportGroup || !exportGroup.children) {
    return cleanRoot;
  }

  exportGroup.children.forEach((child) => {
    // Skip TransformControls, planes or gizmo helper objects
    if (
      child.isTransformControls ||
      child.type === "TransformControlsPlane" ||
      child.name?.startsWith("__helper") ||
      child.userData?.isHelper
    ) {
      return;
    }

    try {
      // Deep clone item model group
      const cloned = child.clone(true);

      // Remove internal helper meshes (e.g. selection ring)
      const toRemove = [];
      cloned.traverse((node) => {
        if (
          node.name?.startsWith("__helper") ||
          node.userData?.isHelper ||
          node.isTransformControls ||
          node.type === "TransformControlsPlane"
        ) {
          toRemove.push(node);
        }
      });

      toRemove.forEach((node) => {
        if (node.parent) {
          node.parent.remove(node);
        }
      });

      cleanRoot.add(cloned);
    } catch (err) {
      console.warn("Aviso ao clonar objeto para exportação:", err);
    }
  });

  return cleanRoot;
}

/**
 * Exports the 3D scene sector group to GLB ArrayBuffer.
 */
export function exportToGlbBuffer(exportGroup, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const cleanRoot = createCleanExportGroup(
        exportGroup,
        options.name || "SetorPrincipal"
      );

      const exporter = new GLTFExporter();
      exporter.parse(
        cleanRoot,
        (glbArrayBuffer) => {
          resolve(glbArrayBuffer);
        },
        (error) => {
          console.error("Erro no GLTFExporter:", error);
          reject(error);
        },
        {
          binary: true,
          onlyVisible: true,
          embedImages: true,
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Exports the sector 3D group and saves it as .glb on the server (/public/models).
 * Automatically replaces the file if it already exists.
 */
export async function saveSectorGlb({
  exportGroup,
  filename = "setor_principal.glb",
}) {
  let cleanName = String(filename).trim();
  if (!cleanName || cleanName === "File name") {
    cleanName = "setor_principal.glb";
  }
  if (!cleanName.toLowerCase().endsWith(".glb")) {
    cleanName += ".glb";
  }

  // 1. Export scene to binary GLB
  const glbBuffer = await exportToGlbBuffer(exportGroup, {
    name: cleanName.replace(/\.glb$/i, ""),
  });

  // 2. Prepare Blob
  const blob = new Blob([glbBuffer], { type: "model/gltf-binary" });

  // 3. Trigger direct browser download for user
  if (typeof window !== "undefined") {
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
  }

  // 4. Also persist to /public/models on the server
  let result = { success: true, filename: cleanName };
  try {
    const formData = new FormData();
    formData.append("file", blob, cleanName);
    formData.append("filename", cleanName);

    const response = await fetch("/api/save-model", {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      result = await response.json();
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar cópia em /public/models:", err);
  }

  return result;
}
