"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import useScrollReveal from "@/hooks/useScrollReveal";

const projects = [
  {
    title: "Bruno Duarte Personal",
    image: "/imagens/projects/brunoduartepersonal.jpg",
    category: "Landing Page",
    description:
      "Presença digital completa para personal trainer — com agendamento integrado, design premium e performance otimizada.",
    links: { live: "https://brunoduartepersonal.com.br" },
  },
  {
    title: "Lucas Maia",
    image: "/imagens/projects/lucasmaia.jpg",
    category: "Landing Page",
    description:
      "Plataforma interativa com painel de controle, métricas em tempo real e experiência fluida para o usuário final.",
    links: { live: "https://lucasmaiafisio.com.br" },
  },
  {
    title: "Comunidade Brasileiros no Texas",
    image: "/imagens/projects/brunoduartepersonal.jpg",
    category: "Landing Page",
    description:
      "Portal de comunidade conectando brasileiros no exterior — informações, eventos e networking em um só lugar.",
    links: { live: "#" },
  },
  {
    title: "Imports Klein",
    image: "/imagens/projects/brunoduartepersonal.jpg",
    category: "E-commerce",
    description:
      "Loja virtual de importados com catálogo inteligente, checkout simplificado e identidade visual marcante.",
    links: { live: "#" },
  },
];

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  );
}

/**
 * Circular offset: shortest path from activePos to index around the ring.
 */
function circularOffset(index, activePos, total) {
  let diff = index - activePos;
  while (diff > total / 2) diff -= total;
  while (diff < -total / 2) diff += total;
  return diff;
}

/**
 * Interpolate 3D card properties from a continuous offset value.
 */
function interpolateCard(offset) {
  const abs = Math.abs(offset);
  const sign = offset === 0 ? 0 : offset > 0 ? 1 : -1;

  if (abs > 2.5) {
    return { x: sign * 100, scale: 0.35, rotateY: -sign * 55, z: -350, opacity: 0, brightness: 0.15, zIndex: 0, visible: false };
  }

  const keyframes = [
    { abs: 0, x: 0, scale: 1, rotateY: 0, z: 0, opacity: 1, brightness: 1, zIndex: 10 },
    { abs: 1, x: 65, scale: 0.68, rotateY: 40, z: -130, opacity: 0.8, brightness: 0.45, zIndex: 6 },
    { abs: 2, x: 88, scale: 0.48, rotateY: 50, z: -260, opacity: 0.4, brightness: 0.28, zIndex: 3 },
    { abs: 3, x: 100, scale: 0.35, rotateY: 55, z: -350, opacity: 0, brightness: 0.15, zIndex: 0 },
  ];

  let lo = keyframes[0], hi = keyframes[1];
  for (let i = 1; i < keyframes.length; i++) {
    if (abs <= keyframes[i].abs) {
      lo = keyframes[i - 1];
      hi = keyframes[i];
      break;
    }
  }

  const t = (abs - lo.abs) / (hi.abs - lo.abs || 1);
  const lerp = (a, b) => a + (b - a) * t;

  return {
    x: sign * lerp(lo.x, hi.x),
    scale: lerp(lo.scale, hi.scale),
    rotateY: -sign * lerp(lo.rotateY, hi.rotateY),
    z: lerp(lo.z, hi.z),
    opacity: lerp(lo.opacity, hi.opacity),
    brightness: lerp(lo.brightness, hi.brightness),
    zIndex: Math.round(lerp(lo.zIndex, hi.zIndex)),
    visible: true,
  };
}

export default function Projects() {
  const [activeIndex, setActiveIndex] = useState(0);
  const revealRef = useScrollReveal();
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const total = projects.length;

  const DRAG_SENSITIVITY = 150;

  const containerRef = useRef(null);
  const startXRef = useRef(0);

  const goTo = useCallback(
    (index) => {
      setActiveIndex(((index % total) + total) % total);
      setDragOffset(0);
    },
    [total]
  );

  // Keyboard nav
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowRight") goTo(activeIndex + 1);
      if (e.key === "ArrowLeft") goTo(activeIndex - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, goTo]);

  function handleDragStart(clientX) {
    startXRef.current = clientX;
    setIsDragging(true);
    setDragOffset(0);
  }

  function handleDragMove(clientX) {
    if (!isDragging) return;
    const delta = clientX - startXRef.current;
    setDragOffset(-delta / DRAG_SENSITIVITY);
  }

  function handleDragEnd() {
    if (!isDragging) return;
    setIsDragging(false);
    const snapped = Math.round(dragOffset);
    if (snapped !== 0) {
      goTo(activeIndex + snapped);
    } else {
      setDragOffset(0);
    }
  }

  useEffect(() => {
    if (!isDragging) return;
    function onMouseMove(e) { handleDragMove(e.clientX); }
    function onMouseUp() { handleDragEnd(); }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  });

  function onMouseDown(e) {
    e.preventDefault();
    handleDragStart(e.clientX);
  }

  function onTouchStart(e) { handleDragStart(e.touches[0].clientX); }
  function onTouchMove(e) {
    e.preventDefault();
    handleDragMove(e.touches[0].clientX);
  }
  function onTouchEnd() { handleDragEnd(); }

  const effectivePos = activeIndex + dragOffset;
  const cardTransition = isDragging
    ? "none"
    : "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, filter 0.35s ease";

  return (
    <section id="projects" className="relative py-28 sm:py-36 overflow-hidden">
      {/* Section header — Apple style, centered */}
      <div className="text-center mb-10 px-6 pb-6" ref={revealRef}>
        <h2
          className="text-[32px] sm:text-[42px] lg:text-[52px] font-medium text-neutral-100 leading-[1.15] tracking-tight mb-4"
          data-reveal
        >
          Trabalhos selecionados.
        </h2>
        <p
          className="text-[16px] sm:text-[18px] text-neutral-300 max-w-md mx-auto"
          data-reveal
          data-reveal-delay="100"
        >
          Cada projeto é uma história de colaboração, estratégia e <span className="text-white font-medium">atenção aos detalhes.</span>
        </p>
      </div>

      {/* 3D Carousel */}
      <div
        ref={containerRef}
        className="relative w-full select-none cursor-grab active:cursor-grabbing"
        style={{
          perspective: "1200px",
          height: "520px",
          touchAction: "pan-y",
        }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {projects.map((project, index) => {
            const offset = circularOffset(index, effectivePos, total);
            const t = interpolateCard(offset);
            if (!t.visible) return null;
            const isCenter = Math.abs(offset) < 0.5;

            return (
              <article
                key={project.title}
                className="absolute left-1/2 top-1/2"
                style={{
                  width: "90%",
                  maxWidth: "380px",
                  transform: `
                    translate(-50%, -50%)
                    translateX(${t.x}%)
                    translateZ(${t.z}px)
                    scale(${t.scale})
                    rotateY(${t.rotateY}deg)
                  `,
                  zIndex: t.zIndex,
                  opacity: t.opacity,
                  filter: `brightness(${t.brightness})`,
                  transition: cardTransition,
                  transformOrigin: "center center",
                  willChange: "transform, opacity",
                  pointerEvents: isCenter ? "auto" : "none",
                }}
              >
                <div
                  className={`rounded-3xl overflow-hidden transition-colors duration-300 ${
                    isCenter
                      ? "border border-[rgba(255,255,255,0.08)] bg-[#161a20]"
                      : "border border-[rgba(255,255,255,0.04)] bg-[#161a20]/80"
                  }`}
                >
                  {/* Project image */}
                  {project.image && (
                    <div className="relative w-full h-[380px] overflow-hidden bg-[rgba(255,255,255,0.02)]">
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover"
                        sizes="360px"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5">
                    {/* Category */}
                    <span className="text-[12px] text-accent uppercase tracking-widest">
                      {project.category}
                    </span>

                    {/* Title */}
                    <h3
                      className={`text-[18px] font-medium mt-2 mb-2 transition-colors duration-300 ${
                        isCenter ? "text-neutral-50" : "text-neutral-300"
                      }`}
                    >
                      {project.title}
                    </h3>

                    {/* Description */}
                    <p className="text-[13px] text-neutral-500 leading-relaxed mb-5 line-clamp-2">
                      {project.description}
                    </p>

                    {/* CTA */}
                    {project.links.live && (
                      <a
                        href={project.links.live}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-[13px] text-accent hover:text-accent-hover transition-colors duration-300"
                      >
                        Ver projeto
                        <ArrowIcon />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {projects.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir para projeto ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "bg-accent w-6"
                : "bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.25)] w-1.5"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
