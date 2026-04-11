"use client";

import Image from "next/image";

const stats = [
  { value: "2+", label: "Anos de experiência" },
  { value: "15+", label: "Projetos entregues" },
  { value: "10+", label: "Tecnologias dominadas" },
];

const values = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    title: "Código limpo",
    description: "Priorizo legibilidade, manutenabilidade e padrões sólidos de engenharia.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Performance first",
    description: "Cada milissegundo importa. Otimizo desde a arquitetura até o deploy.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: "Design com propósito",
    description: "Interfaces minimalistas onde cada elemento tem uma razão de existir.",
  },
];

export default function About() {
  return (
    <section id="about" className="relative px-4 py-20">
      {/* Section header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-[13px] font-medium tracking-[0.2em] uppercase text-accent">
            Sobre
          </span>
        </div>
        <h2 className="text-[28px] sm:text-3xl font-medium text-neutral-100 leading-tight">
          Quem está por trás do código
        </h2>
      </div>

      {/* Story */}
      <div className="mb-10">
        <div className="rounded-3xl border border-[rgba(255,255,255,0.06)] bg-[#1a1e24]/80 backdrop-blur-sm p-5">
          <div className="flex items-start gap-4 mb-5">
            <Image
              src="/imagens/profile.png"
              alt="Arthur Alves"
              width={56}
              height={56}
              className="rounded-xl object-cover shrink-0 border border-[rgba(255,255,255,0.06)]"
            />
            <div>
              <h3 className="text-[16px] font-medium text-neutral-100">
                Arthur Alves
              </h3>
              <p className="text-[13px] text-accent">
                Desenvolvedor Fullstack
              </p>
            </div>
          </div>

          <div className="space-y-3 text-[14px] text-neutral-300 leading-relaxed">
            <p>
              Sou desenvolvedor fullstack apaixonado por transformar ideias
              complexas em soluções elegantes e performáticas. Minha jornada na
              tecnologia começou pela curiosidade de entender como as coisas
              funcionam — e evoluiu para a obsessão por construí-las da melhor
              forma possível.
            </p>
            <p>
              Trabalho com o ecossistema JavaScript/TypeScript, construindo
              desde interfaces interativas com React e Next.js até APIs robustas
              com Node.js. Acredito que o melhor código é aquele que resolve
              problemas reais com simplicidade.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="text-center py-4 px-2 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#1a1e24]/50"
          >
            <span className="block text-[24px] font-semibold text-accent mb-1">
              {stat.value}
            </span>
            <span className="text-[11px] text-neutral-500 leading-tight block">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Values / Philosophy */}
      <div className="space-y-3">
        <h3 className="text-[14px] font-medium text-neutral-300 tracking-wide mb-4">
          Minha filosofia
        </h3>
        {values.map((value) => (
          <div
            key={value.title}
            className="flex items-start gap-4 p-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1a1e24]/40 hover:border-[rgba(1,144,255,0.15)] transition-all duration-300"
          >
            <div className="shrink-0 w-9 h-9 rounded-lg bg-accent/5 border border-accent/10 flex items-center justify-center text-accent">
              {value.icon}
            </div>
            <div>
              <h4 className="text-[14px] font-medium text-neutral-200 mb-1">
                {value.title}
              </h4>
              <p className="text-[13px] text-neutral-500 leading-relaxed">
                {value.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
