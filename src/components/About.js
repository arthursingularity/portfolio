"use client";

import Image from "next/image";
import useScrollReveal from "@/hooks/useScrollReveal";

export default function About() {
  const revealRef = useScrollReveal();

  return (
    <section id="about" className="relative px-6 py-28 sm:py-36" ref={revealRef}>
      {/* Large statement */}
      <div className="max-w-2xl mx-auto text-center mb-20" data-reveal>
        <h2 className="text-[32px] sm:text-[42px] lg:text-[52px] font-medium text-neutral-100 leading-[1.15] tracking-tight mb-6">
          Criando experiências<br />
          que <span className="text-accent">fazem a diferença.</span>
        </h2>
        <p className="text-[16px] sm:text-[18px] text-neutral-400 leading-relaxed max-w-lg mx-auto">
          Cada projeto é tratado como uma oportunidade de superar expectativas.
          O resultado? Presença digital que transmite confiança e gera resultados.
        </p>
      </div>

      {/* Minimal profile card */}
      <div className="max-w-sm mx-auto text-center" data-reveal data-reveal-delay="200">
        <div className="mb-6">
          <Image
            src="/imagens/profile.png"
            alt="Arthur Alves"
            width={88}
            height={88}
            className="rounded-full object-cover mx-auto border-2 border-[rgba(255,255,255,0.08)]"
          />
        </div>
        <h3 className="text-[18px] font-medium text-neutral-100 mb-1">
          Arthur Alves
        </h3>
        <p className="text-[14px] text-accent mb-4">
          Engenheiro de Software
        </p>
        <p className="text-[14px] text-neutral-500 leading-relaxed">
          Focado em transformar ideias em produtos digitais de alto nível,
          com atenção a cada detalhe — do conceito à entrega final.
        </p>
      </div>

      {/* Stats — clean, Apple-style */}
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-16" data-reveal data-reveal-delay="300">
        {[
          { value: "2+", label: "Anos de experiência" },
          { value: "15+", label: "Projetos entregues" },
          { value: "100%", label: "Satisfação dos clientes" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <span className="block text-[28px] sm:text-[32px] font-semibold text-neutral-100 mb-1">
              {stat.value}
            </span>
            <span className="text-[11px] sm:text-[12px] text-neutral-500 leading-tight block">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
