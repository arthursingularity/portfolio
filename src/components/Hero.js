"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

// Suppress THREE.Clock deprecation warning caused by @react-three/fiber internal usage
if (typeof console !== "undefined") {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
    originalWarn(...args);
  };
}

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

  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    // Accumulate delta to avoid using deprecated THREE.Clock
    timeRef.current += delta;
    const time = timeRef.current;
    
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
  const text1 = "Engenharia de";
  const text2 = "software ";
  const text3 = "precisa.";

  const [typed1, setTyped1] = useState("");
  const [typed2, setTyped2] = useState("");
  const [typed3, setTyped3] = useState("");

  useEffect(() => {
    let timeout;
    let t1 = 0, t2 = 0, t3 = 0;
    const typingSpeed = 60;

    const type = () => {
      if (t1 < text1.length) {
        setTyped1(text1.slice(0, t1 + 1));
        t1++;
        timeout = setTimeout(type, typingSpeed);
      } else if (t2 < text2.length) {
        setTyped2(text2.slice(0, t2 + 1));
        t2++;
        timeout = setTimeout(type, typingSpeed);
      } else if (t3 < text3.length) {
        setTyped3(text3.slice(0, t3 + 1));
        t3++;
        timeout = setTimeout(type, typingSpeed);
      }
    };

    timeout = setTimeout(type, 500);

    return () => clearTimeout(timeout);
  }, []);

  const isTyping1 = typed1.length < text1.length;
  const isFinished = typed3.length === text3.length;
  
  // Only blink when finished, otherwise stay solid so it doesn't disappear during typing
  const caretStyle = isFinished ? { animation: "blink 1s step-start infinite" } : { opacity: 1 };

  return (
    <section
      id="hero"
      className="relative flex flex-col justify-center p-5 pt-[130px] pb-[280px] h-[100dvh] overflow-hidden"
    >
      {/* 3D Particle Mesh Background */}
      <div className="absolute inset-0 z-0 top-[30%]">
        <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
          <fog attach="fog" args={["#101317", 2, 16]} />
          <ParticleWave />
        </Canvas>
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-col">
        {/* Main heading */}
        <h1 className="mt-5 text-[42px] sm:text-5xl lg:text-6xl font-regular text-neutral-100 leading-[1.2] tracking-tight mb-8">
          <span className="block min-h-[1.2em]">
            {typed1}
            {isTyping1 && (
              <span 
                className="inline-block w-[2px] h-[0.9em] bg-accent ml-[2px] align-middle translate-y-[-2px]" 
                style={caretStyle}
              />
            )}
          </span>
          <span className="block min-h-[1.2em]">
            {typed2}
            <span className="text-accent">{typed3}</span>
            {!isTyping1 && (
              <span 
                className="inline-block w-[2px] h-[0.9em] bg-accent ml-[2px] align-middle translate-y-[-2px]" 
                style={caretStyle}
              />
            )}
          </span>
          <style>{`
            @keyframes blink {
              50% { opacity: 0; }
            }
          `}</style>
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
