"use client";

import useScrollReveal from "@/hooks/useScrollReveal";

const pillars = [
  {
    number: "01",
    title: "Estratégia",
    description: "Entendo o seu negócio antes de escrever uma linha de código. O resultado começa pelo planejamento.",
  },
  {
    number: "02",
    title: "Design",
    description: "Cada interface é projetada para impressionar à primeira vista e guiar o usuário com naturalidade.",
  },
  {
    number: "03",
    title: "Desenvolvimento",
    description: "Construção sólida, rápida e otimizada — seu projeto funciona perfeitamente em qualquer dispositivo.",
  },
  {
    number: "04",
    title: "Entrega",
    description: "Acompanhamento até o lançamento e além. Seu projeto não termina na entrega — ele começa.",
  },
];

export default function Process() {
  const revealRef = useScrollReveal();

  return (
    <section id="process" className="relative px-6 py-28 sm:py-36" ref={revealRef}>
      {/* Section header */}
      <div className="max-w-2xl mx-auto text-center mb-20" data-reveal>
        <h2 className="text-[32px] sm:text-[42px] lg:text-[52px] font-medium text-neutral-100 leading-[1.15] tracking-tight mb-4">
          Como funciona.
        </h2>
        <p className="text-[16px] sm:text-[18px] text-neutral-400 max-w-md mx-auto">
          Um processo pensado para ser simples para você e preciso na execução.
        </p>
      </div>

      {/* Pillars */}
      <div className="max-w-lg mx-auto space-y-12">
        {pillars.map((pillar, i) => (
          <div
            key={pillar.number}
            className="flex gap-6 items-start"
            data-reveal
            data-reveal-delay={String(i * 100)}
          >
            <span className="text-[32px] sm:text-[40px] font-semibold text-accent/20 leading-none shrink-0 tabular-nums">
              {pillar.number}
            </span>
            <div>
              <h3 className="text-[18px] sm:text-[20px] font-medium text-neutral-100 mb-2">
                {pillar.title}
              </h3>
              <p className="text-[14px] sm:text-[15px] text-neutral-500 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
