"use client";

import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { EstoqueModel } from "./EstoqueModel";

function CanvasLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/90 backdrop-blur-md border border-zinc-300 text-zinc-800 shadow-xl min-w-[200px]">
        <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin mb-2" />
        <span className="text-xs font-mono font-medium text-zinc-600">
          Carregando... {Math.round(progress)}%
        </span>
      </div>
    </Html>
  );
}

export default function EstoqueViewer() {
  const controlsRef = useRef<any>(null);

  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing">
      <Canvas
        shadows="soft"
        camera={{ position: [24, 18, 28], fov: 40, near: 0.1, far: 2000 }}
        gl={{
          powerPreference: "high-performance",
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        dpr={[1, 2]}
      >

        <Suspense fallback={<CanvasLoader />}>
          {/* 1. Luz Solar Principal com Sombra Suave */}
          <directionalLight
            position={[30, 65, 30]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-35}
            shadow-camera-right={35}
            shadow-camera-top={35}
            shadow-camera-bottom={-35}
            shadow-camera-near={5}
            shadow-camera-far={140}
            shadow-bias={-0.0001}
            shadow-normalBias={0.02}
          />

          {/* 2. Luz de Preenchimento Lateral (Fill Light) - Evita sombras chapadas/pretas */}
          <directionalLight
            position={[-35, 25, -25]}
            intensity={0.65}
            color="#d0e2ff"
          />

          {/* 3. Luz Frontal Suave de Rebote */}
          <directionalLight
            position={[0, 20, 40]}
            intensity={0.45}
            color="#fff8ed"
          />

          {/* 4. Luz de Fundo / Rim Light - Destaca as bordas traseiras das caixas */}
          <directionalLight
            position={[0, 20, -40]}
            intensity={0.4}
            color="#e2ecf7"
          />

          {/* 5. Iluminação Hemisférica (Céu Claro + Rebote do Chão) */}
          <hemisphereLight
            args={["#ffffff", "#6b7280", 0.65]}
            position={[0, 60, 0]}
          />

          {/* Luz Ambiente Geral */}
          <ambientLight intensity={0.35} />

          {/* Modelo 3D Sincronizado */}
          <EstoqueModel />

          {/* Controles de Câmera */}
          <OrbitControls
            ref={controlsRef}
            target={[0, 2.5, 0]}
            enableDamping
            dampingFactor={0.05}
            minDistance={4}
            maxDistance={250}
            maxPolarAngle={Math.PI / 2 - 0.02}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}