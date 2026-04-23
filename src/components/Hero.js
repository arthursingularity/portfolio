"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

import * as THREE from "three";

function ParticleWave() {
  const pointsRef = useRef(null);
  
  // Create a 150x150 grid of points for higher density
  const width = 150;
  const depth = 150;
  const count = width * depth;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    let i = 0;
    for (let xi = 0; xi < width; xi++) {
      for (let zi = 0; zi < depth; zi++) {
        let x = (xi - width / 2) * 0.15;
        let z = (zi - depth / 2) * 0.15;
        let y = 0;
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
        i++;
      }
    }
    return pos;
  }, [count]);

  const circleTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    context.beginPath();
    context.arc(32, 32, 30, 0, Math.PI * 2);
    context.fillStyle = "#fff";
    context.fill();
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const pos = pointsRef.current.geometry.attributes.position.array;
    let i = 0;
    for (let xi = 0; xi < width; xi++) {
      for (let zi = 0; zi < depth; zi++) {
        const x = (xi - width / 2) * 0.15;
        const z = (zi - depth / 2) * 0.15;
        
        // Dynamic undulating wave function
        const y = 
          Math.sin(x * 0.5 + time * 0.5) * 0.5 +
          Math.sin(z * 0.3 + time * 0.4) * 0.5 +
          Math.cos((x + z) * 0.2 + time * 0.6) * 0.5;

        pos[i * 3 + 1] = y;
        i++;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#0190ff"
        transparent
        opacity={0.8}
        sizeAttenuation={true}
        map={circleTexture}
        depthWrite={false}
      />
    </points>
  );
}

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex flex-col p-5 pt-[130px] pb-6 h-[100dvh] overflow-hidden"
    >
      {/* 3D Particle Mesh Background */}
      <div className="absolute inset-0 z-0 top-[30%]">
        <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
          <fog attach="fog" args={["#101317", 2, 12]} />
          <ParticleWave />
        </Canvas>
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-col">

        {/* Main heading */}
        <h1 className="opacity-0 mt-5 animate-fade-in-up animate-delay-200 text-[42px] sm:text-5xl lg:text-6xl font-medium text-neutral-100 leading-[1.2] tracking-tight mb-8">
          Engenharia de<br />
          software <span className="text-accent">precisa.</span>
        </h1>

        {/* CTA Button */}
        <div className="opacity-0 animate-fade-in-up animate-delay-300">
          <button
            className="flex items-center justify-center w-full sm:w-[320px] py-4 bg-accent hover:bg-accent-hover text-white text-[16px] font-medium rounded-full transition-all duration-300"
          >
            Iniciar Projeto
          </button>
        </div>
      </div>
    </section>
  );
}
