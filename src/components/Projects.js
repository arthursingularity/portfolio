"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import useScrollReveal from "@/hooks/useScrollReveal";

const projects = [
  {
    title: "Bruno Duarte Personal",
    image: "/imagens/projects/brunoduartepersonal.jpg",
    description:
      "Plataforma de e-commerce completa com painel admin, sistema de pagamentos integrado e gestão de inventário em tempo real.",
    impact: "Redução de 45% no tempo de carregamento",
    tech: ["Next.js", "Tailwind CSS", "EmailJS", "Stripe"],
    links: { github: "#", live: "#" },
  },
  {
    title: "Lucas Maia",
    image: "/imagens/projects/lucasmaia.jpg",
    description:
      "Dashboard de análise de dados com visualizações interativas, relatórios em PDF e monitoramento de métricas em tempo real via WebSocket.",
    impact: "Processamento de +50k eventos/dia",
    tech: ["React", "D3.js", "Express", "MongoDB", "Socket.io"],
    links: { github: "#", live: "#" },
  },
  {
    title: "Comunidade Brasileiros no Texas",
    image: "/imagens/projects/brunoduartepersonal.jpg",
    description:
      "Plataforma de e-commerce completa com painel admin, sistema de pagamentos integrado e gestão de inventário em tempo real.",
    impact: "Redução de 45% no tempo de carregamento",
    tech: ["Next.js", "EmailJS", "Stripe"],
    links: { github: "#", live: "#" },
  },
  {
    title: "Imports Klein",
    image: "/imagens/projects/brunoduartepersonal.jpg",
    description:
      "Microserviço de gateway com rate limiting, autenticação JWT, cache distribuído e documentação automática via OpenAPI.",
    impact: "Latência média de 12ms por request",
    tech: ["Node.js", "TypeScript", "Docker", "Redis", "Swagger"],
    links: { github: "#" },
  }
];

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

/**
 * Circular offset: shortest path from activePos to index around the ring.
 * activePos can be fractional (e.g. 1.4 during drag).
 */
function circularOffset(index, activePos, total) {
  let diff = index - activePos;
  while (diff > total / 2) diff -= total;
  while (diff < -total / 2) diff += total;
  return diff;
}

/**
 * Interpolate 3D card properties from a continuous offset value.
 * This creates smooth transitions as offset goes from e.g. 0 to 1.
 */
function interpolateCard(offset) {
  const abs = Math.abs(offset);
  const sign = offset === 0 ? 0 : offset > 0 ? 1 : -1;

  // Clamp to max visible range
  if (abs > 2.5) {
    return { x: sign * 100, scale: 0.35, rotateY: -sign * 55, z: -350, opacity: 0, brightness: 0.15, zIndex: 0, visible: false };
  }

  // Keyframes:  offset 0 (center),  1 (neighbor),  2 (far)
  const keyframes = [
    { abs: 0, x: 0, scale: 1, rotateY: 0, z: 0, opacity: 1, brightness: 1, zIndex: 10 },
    { abs: 1, x: 65, scale: 0.68, rotateY: 40, z: -130, opacity: 0.8, brightness: 0.45, zIndex: 6 },
    { abs: 2, x: 88, scale: 0.48, rotateY: 50, z: -260, opacity: 0.4, brightness: 0.28, zIndex: 3 },
    { abs: 3, x: 100, scale: 0.35, rotateY: 55, z: -350, opacity: 0, brightness: 0.15, zIndex: 0 },
  ];

  // Find the two keyframes to interpolate between
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
  // dragOffset: fractional offset applied DURING a drag. 0 when idle.
  // Negative = dragging right (going to previous), Positive = dragging left (going to next)
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const total = projects.length;

  // How many px of drag = 1 full card transition
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

  // ── Unified start ──
  function handleDragStart(clientX) {
    startXRef.current = clientX;
    setIsDragging(true);
    setDragOffset(0);
  }

  // ── Unified move ──
  function handleDragMove(clientX) {
    if (!isDragging) return;
    const delta = clientX - startXRef.current;
    // Convert px to fractional card offset
    // Negative delta (swipe left) = positive offset (go next)
    setDragOffset(-delta / DRAG_SENSITIVITY);
  }

  // ── Unified end ──
  function handleDragEnd() {
    if (!isDragging) return;
    setIsDragging(false);

    // Snap: if dragged more than 0.3 of a card, commit the move
    const snapped = Math.round(dragOffset);
    if (snapped !== 0) {
      goTo(activeIndex + snapped);
    } else {
      setDragOffset(0);
    }
  }

  // ── Mouse events ──
  useEffect(() => {
    if (!isDragging) return;

    function onMouseMove(e) {
      handleDragMove(e.clientX);
    }
    function onMouseUp() {
      handleDragEnd();
    }

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

  // ── Touch events ──
  function onTouchStart(e) {
    handleDragStart(e.touches[0].clientX);
  }

  function onTouchMove(e) {
    // Prevent vertical scroll while dragging carousel
    e.preventDefault();
    handleDragMove(e.touches[0].clientX);
  }

  function onTouchEnd() {
    handleDragEnd();
  }

  // The "effective position" during drag — fractional
  const effectivePos = activeIndex + dragOffset;

  // Use faster transition when dragging (none), snap transition when releasing
  const cardTransition = isDragging
    ? "none"
    : "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, filter 0.35s ease";

  return (
    <section id="projects" className="relative mt-20 overflow-hidden">
      {/* Section header */}
      <div className="mb-6 py-3 px-4" ref={revealRef}>
        <h2 className="text-[24px] sm:text-3xl font-regular text-neutral-100 leading-tight" data-reveal>
          Trabalhos em destaque
        </h2>
        <p className="text-[14px] text-neutral-400 mt-2 max-w-sm" data-reveal data-reveal-delay="100">
          Projetos selecionados que demonstram minha abordagem técnica e
          capacidade de resolver problemas reais.
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
                  maxWidth: "360px",
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
                  className={`rounded-4xl border p-5 backdrop-blur-sm transition-colors duration-300 ${isCenter
                      ? "border-[rgba(1,144,255,0.25)] bg-[#1a1e24]"
                      : "border-[rgba(255,255,255,0.06)] bg-[#1a1e24]/80"
                    }`}
                >
                  {/* Glow behind active */}
                  {isCenter && (
                    <div
                      className="absolute -inset-2 rounded-3xl pointer-events-none -z-10"
                      style={{
                        background:
                          "radial-gradient(ellipse at center, rgba(1,144,255,0.06) 0%, transparent 70%)",
                      }}
                    />
                  )}

                  {/* Project image */}
                  {project.image && (
                    <div className="relative w-full h-[230px] rounded-2xl overflow-hidden mb-4 bg-[rgba(255,255,255,0.02)]">
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover"
                        sizes="350px"
                      />
                    </div>
                  )}

                  {/* Title */}
                  <h3
                    className={`text-[18px] font-medium mb-2 transition-colors duration-300 ${isCenter ? "text-neutral-50" : "text-neutral-300"
                      }`}
                  >
                    {project.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[13px] text-neutral-400 leading-relaxed mb-3 line-clamp-3">
                    {project.description}
                  </p>

                  {/* Tech */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tech.map((tech) => (
                      <span
                        key={tech}
                        className="text-[11px] text-neutral-400 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded-md"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Links */}
                  <div className="flex justify-between pt-5 border-t border-[rgba(255,255,255,0.04)]">
                    <div className="flex items-center gap-3 ">
                      {project.links.github && (
                        <a
                          href={project.links.github}
                          className="flex border border-[rgba(255,255,255,0.06)] rounded-full p-1 px-1.5 pr-2 items-center gap-1.5 text-[12px] text-neutral-500 hover:text-neutral-200 transition-colors duration-300"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GithubIcon />
                          <span>Github</span>
                        </a>
                      )}
                    </div>
                    <button className="bg-accent font-light text-[14px] px-4 py-1 rounded-full">
                      Conferir
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-3 pb-2">
        {projects.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir para projeto ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === activeIndex
                ? "bg-accent w-6"
                : "bg-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.3)] w-2"
              }`}
          />
        ))}
      </div>
    </section>
  );
}
