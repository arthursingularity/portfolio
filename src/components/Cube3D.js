"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Suppress THREE.Clock deprecation warning from showing up in console
if (typeof console !== "undefined") {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
    originalWarn(...args);
  };
}

function CubeModel({ color = "#0190FF" }) {
  const { scene } = useGLTF("/cube.glb");
  const groupRef = useRef();

  useEffect(() => {
    if (!scene) return;

    // Apply color to all meshes
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          metalness: 0.15,
          roughness: 0.25,
        });
      }
    });

    // Center and normalize the model to fit within a 1x1x1 box
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    scene.position.sub(center);
    scene.scale.multiplyScalar(1 / maxDim);
  }, [scene, color]);

  // Set random initial rotation
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
    }
  }, []);

  // Auto-rotate slower and across multiple axes for a fluid, random feel
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += delta * 0.5;
      groupRef.current.rotation.y += delta * 0.50;
      groupRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

/**
 * Cube3D — renders the cube.glb model
 * @param {number} size - Width & height of the container in pixels (default: 120)
 * @param {string} color - Hex color for the cube material (default: "#0190FF")
 * @param {string} className - Optional additional CSS classes
 */
export default function Cube3D({ size = 120, color = "#0190FF", className = "" }) {
  return (
    <div
      style={{ width: size, height: size, lineHeight: 0 }}
      className={`flex items-center justify-center shrink-0 ${className}`}
    >
      <Canvas
        camera={{ position: [1.8, 1.4, 1.8], fov: 35, near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent", width: size, height: size }}
      >
        {/* Soft Ambient Light */}
        <ambientLight intensity={1.2} color="#ffffff" />
        {/* Main Key Light - Smooth and direct */}
        <directionalLight position={[4, 5, 3]} intensity={1.8} color="#ffffff" />
        {/* Fill Light - Cool and soft on the shadows */}
        <directionalLight position={[-4, -2, 0]} intensity={0.8} color="#b3dfff" />
        {/* Rim Light - Highlights the edges */}
        <directionalLight position={[0, 4, -4]} intensity={2.5} color="#e6f4ff" />
        <CubeModel color={color} />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/cube.glb");
