"use client";

import React, { useState, useEffect, useRef } from "react";

/**
 * Minimalist, high-performance FPS Counter badge
 * Measures actual browser / WebGL animation frames with 500ms smooth averaging.
 */
export default function FpsCounter() {
  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let animId;

    const loop = (now) => {
      frameCountRef.current++;
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 500) {
        const measuredFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(measuredFps);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const textColor =
    fps >= 50
      ? "text-emerald-400"
      : fps >= 30
      ? "text-amber-400"
      : "text-rose-400";

  return (
    <div
      className="absolute top-1 right-2 z-20 pointer-events-none select-none flex items-center gap-1.5 font-mono text-[11px] text-neutral-300"
    >
      <span className={`tabular-nums ${textColor}`}>{fps}</span>
      <span className="text-[11px] text-neutral-400 font-sans">FPS</span>
    </div>
  );
}
