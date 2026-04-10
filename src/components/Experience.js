const skills = [
  {
    category: "Frontend",
    items: [
      "React / Next.js",
      "JavaScript (ES6+)",
      "TypeScript",
      "Tailwind CSS",
      "HTML5 / CSS3",
      "Three.js / R3F",
    ],
  },
  {
    category: "Backend",
    items: [
      "Node.js",
      "Express",
      "REST APIs",
      "PostgreSQL",
      "MySQL",
      "Prisma ORM",
    ],
  },
  {
    category: "Ferramentas & Outros",
    items: [
      "Git / GitHub",
      "Docker",
      "Figma",
      "Linux",
      "CI/CD",
      "Metodologias Ágeis",
    ],
  },
];

const experience = [
  {
    role: "Desenvolvedor Full Stack",
    company: "Freelancer",
    period: "2024 — Presente",
    description:
      "Desenvolvimento de aplicações web completas para clientes, desde a concepção do design até o deploy em produção. Foco em performance e experiência do usuário.",
  },
  {
    role: "Desenvolvedor Frontend",
    company: "Projetos Pessoais",
    period: "2023 — 2024",
    description:
      "Construção de interfaces interativas, dashboards analíticos e sistemas de visualização 3D com React e Three.js.",
  },
];

export default function Experience() {
  return (
    <section id="experience" className="py-32 hidden sm:py-40 px-6 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* ── Experience ── */}
        <div className="mb-28">
          <div className="mb-20">
            <p className="text-[13px] text-accent-muted uppercase tracking-widest mb-4">
              Trajetória
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-neutral-100 tracking-tight">
              Experiência
            </h2>
          </div>

          <div className="space-y-12">
            {experience.map((exp, index) => (
              <div
                key={index}
                className="group relative pl-8 border-l border-border-subtle hover:border-accent/20 transition-colors duration-500"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-1.5 w-2 h-2 -translate-x-[4.5px] rounded-full bg-neutral-700 group-hover:bg-accent/60 transition-colors duration-500" />

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-3">
                  <div>
                    <h3 className="text-base font-medium text-neutral-200">
                      {exp.role}
                    </h3>
                    <p className="text-sm text-neutral-500">{exp.company}</p>
                  </div>
                  <span className="text-[13px] text-neutral-600 font-mono whitespace-nowrap">
                    {exp.period}
                  </span>
                </div>
                <p className="text-[15px] text-neutral-500 leading-relaxed max-w-2xl">
                  {exp.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent mb-28" />

        {/* ── Skills ── */}
        <div>
          <div className="mb-20">
            <p className="text-[13px] text-accent-muted uppercase tracking-widest mb-4">
              Competências
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-neutral-100 tracking-tight">
              Habilidades técnicas
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 sm:gap-16">
            {skills.map((group) => (
              <div key={group.category}>
                <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wider mb-6">
                  {group.category}
                </h3>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="text-[15px] text-neutral-500 hover:text-neutral-300 transition-colors duration-300 cursor-default"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
