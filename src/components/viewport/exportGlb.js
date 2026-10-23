"use client";

import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Creates a clean clone of the sector group for GLTF/GLB export.
 * Strips out editor-only helpers like TransformControls, selection rings, and gizmos.
 * Embeds full project metadata (items, properties, folders, hierarchy) inside the GLB.
 */
function createCleanExportGroup(exportGroup, customName = "SetorPrincipal", projectData = null) {
  const cleanRoot = new THREE.Group();
  cleanRoot.name = customName;

  // Embed Sector Studio project metadata into the 3D scene root
  if (projectData) {
    const serialized = typeof projectData === "string" ? projectData : JSON.stringify(projectData);
    cleanRoot.userData.sectorStudioProject = serialized;

    // Guaranteed child node with metadata so GLTF loaders preserve extras reliably
    const metaNode = new THREE.Object3D();
    metaNode.name = "__sectorStudioMetadata";
    metaNode.userData = {
      sectorStudioProject: serialized,
    };
    cleanRoot.add(metaNode);
  }

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
 * Exports the 3D scene sector group to GLB ArrayBuffer with embedded project configuration.
 */
export function exportToGlbBuffer(exportGroup, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const cleanRoot = createCleanExportGroup(
        exportGroup,
        options.name || "SetorPrincipal",
        options.projectData || null
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
 * Exports the sector 3D group and saves it as .glb on the user's computer and server (/public/models).
 * The exported .glb includes 100% of the project layout, configurations and models embedded.
 */
export async function saveSectorGlb({
  exportGroup,
  filename = "setor_principal.glb",
  projectData = null,
}) {
  let cleanName = String(filename).trim();
  if (!cleanName || cleanName === "File name") {
    cleanName = "setor_principal.glb";
  }
  if (!cleanName.toLowerCase().endsWith(".glb")) {
    cleanName += ".glb";
  }

  // 1. Export scene to binary GLB with embedded project data
  const glbBuffer = await exportToGlbBuffer(exportGroup, {
    name: cleanName.replace(/\.glb$/i, ""),
    projectData,
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

  // 4. Also persist to /public/models on the server if the endpoint is available
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


/**
 * Imports project from a binary GLB file, extracting embedded Sector Studio configuration.
 */
export function importProjectFromGlb(fileOrBuffer) {
  return new Promise((resolve, reject) => {
    try {
      const parseBuffer = (arrayBuffer, originalName = "") => {
        const loader = new GLTFLoader();
        loader.parse(
          arrayBuffer,
          "",
          (gltf) => {
            let foundRaw = null;

            // 1. Root scene userData
            if (gltf.scene?.userData?.sectorStudioProject) {
              foundRaw = gltf.scene.userData.sectorStudioProject;
            } else if (gltf.userData?.sectorStudioProject) {
              foundRaw = gltf.userData.sectorStudioProject;
            }

            // 2. Metadata helper node
            if (!foundRaw && gltf.scene) {
              const metaNode = gltf.scene.getObjectByName("__sectorStudioMetadata");
              if (metaNode?.userData?.sectorStudioProject) {
                foundRaw = metaNode.userData.sectorStudioProject;
              }
            }

            // 3. Traverse all nodes in the scene
            if (!foundRaw && gltf.scene) {
              gltf.scene.traverse((node) => {
                if (foundRaw) return;
                if (node.userData?.sectorStudioProject) {
                  foundRaw = node.userData.sectorStudioProject;
                } else if (node.userData?.project) {
                  foundRaw = node.userData.project;
                }
              });
            }

            if (foundRaw) {
              try {
                const parsed =
                  typeof foundRaw === "string" ? JSON.parse(foundRaw) : foundRaw;
                if (parsed && Array.isArray(parsed.items)) {
                  resolve({
                    success: true,
                    projectName:
                      parsed.projectName ||
                      originalName.replace(/\.glb$/i, "") ||
                      "setor_restaurado",
                    items: parsed.items,
                    version: parsed.version || 2,
                    savedAt: parsed.savedAt,
                    hasFullConfig: true,
                  });
                  return;
                }
              } catch (parseErr) {
                console.warn("Erro ao fazer parse dos metadados embutidos no GLB:", parseErr);
              }
            }

            // Se for um modelo GLB exportado sem metadados JSON, podemos recuperar a estrutura básica
            const recoveredItems = [];
            const timestamp = Date.now();
            let idx = 1;

            if (gltf.scene) {
              gltf.scene.children.forEach((child) => {
                if (child.name === "__sectorStudioMetadata") return;
                const childName = child.name || `Objeto ${idx}`;
                const lowerName = childName.toLowerCase();
                let inferredType = "cube";
                if (lowerName.includes("floor") || lowerName.includes("piso")) inferredType = "floor";
                else if (lowerName.includes("box") || lowerName.includes("caixa")) inferredType = "box";
                else if (lowerName.includes("ulma_m") || lowerName.includes("ulma m")) inferredType = "ulma_m";
                else if (lowerName.includes("ulma_p") || lowerName.includes("ulma p")) inferredType = "ulma_p";
                else if (lowerName.includes("pallet")) inferredType = "pallet";
                else if (lowerName.includes("wall") || lowerName.includes("parede")) inferredType = "wall";

                recoveredItems.push({
                  id: `imported-${timestamp}-${idx++}`,
                  name: childName,
                  type: inferredType,
                  position: [
                    Math.round(child.position.x * 1000) / 1000,
                    Math.round(child.position.y * 1000) / 1000,
                    Math.round(child.position.z * 1000) / 1000,
                  ],
                  rotation: [
                    Math.round(child.rotation.x * 1000) / 1000,
                    Math.round(child.rotation.y * 1000) / 1000,
                    Math.round(child.rotation.z * 1000) / 1000,
                  ],
                  props: child.userData || {},
                });
              });
            }

            if (recoveredItems.length > 0) {
              resolve({
                success: true,
                projectName: originalName.replace(/\.glb$/i, "") || "modelo_importado",
                items: recoveredItems,
                hasFullConfig: false,
                message: "Objetos 3D recuperados da cena GLB.",
              });
              return;
            }

            resolve({
              success: false,
              error: "O arquivo .glb selecionado não contém modelos válidos ou metadados de projeto.",
            });
          },
          (err) => {
            reject(
              new Error(
                "Falha ao processar arquivo .glb: " + (err.message || String(err))
              )
            );
          }
        );
      };

      if (fileOrBuffer instanceof ArrayBuffer) {
        parseBuffer(fileOrBuffer);
      } else if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
        const originalName = fileOrBuffer.name || "";
        const reader = new FileReader();
        reader.onload = () => parseBuffer(reader.result, originalName);
        reader.onerror = () => reject(new Error("Falha ao ler o arquivo .glb."));
        reader.readAsArrayBuffer(fileOrBuffer);
      } else {
        reject(new Error("Entrada inválida para importação de GLB."));
      }
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Unified project import: imports project from .glb or .gltf
 */
export async function importProjectFile(file) {
  if (!file) throw new Error("Nenhum arquivo fornecido.");
  const fileName = (file.name || "").toLowerCase();

  if (fileName.endsWith(".glb") || fileName.endsWith(".gltf")) {
    return await importProjectFromGlb(file);
  } else {
    throw new Error(
      "Formato não suportado. Por favor, selecione um arquivo 3D .glb do projeto."
    );
  }
}
