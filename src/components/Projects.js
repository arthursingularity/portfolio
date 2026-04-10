const projects = [
  {
    title: "ERP Industrial",
    description:
      "Sistema de gestão empresarial completo com módulos de estoque, produção e financeiro. Dashboard em tempo real com visualização 3D de inventário.",
    technologies: ["Next.js", "React", "Node.js", "PostgreSQL", "Three.js"],
    link: "#",
  },
  {
    title: "Plataforma de Manutenção 3D",
    description:
      "Aplicação web interativa para visualização e gerenciamento de manutenção industrial com modelos 3D, telemetria em tempo real e controle de ativos.",
    technologies: ["React Three Fiber", "WebGL", "REST API", "Tailwind CSS"],
    link: "#",
  },
  {
    title: "Dashboard Analítico",
    description:
      "Painel de controle para análise de dados com gráficos dinâmicos, filtros avançados e exportação de relatórios. Interface responsiva e performática.",
    technologies: ["Next.js", "Chart.js", "Prisma", "MySQL"],
    link: "#",
  },
  {
    title: "Design System Corporativo",
    description:
      "Biblioteca de componentes reutilizáveis com tokens de design, documentação interativa e integração com Storybook para equipes de desenvolvimento.",
    technologies: ["React", "Tailwind CSS", "Storybook", "Figma"],
    link: "#",
  },
];

function ArrowIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
      />
    </svg>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="py-32 hidden sm:py-40 px-6 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="mb-20">
          <p className="text-[13px] text-accent-muted uppercase tracking-widest mb-4">
            Projetos Selecionados
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-neutral-100 tracking-tight">
            Trabalho recente
          </h2>
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project, index) => (
            <a
              key={index}
              href={project.link}
              className="group relative p-8 rounded-2xl border border-border-subtle bg-card hover:bg-card-hover hover:border-border-hover transition-all duration-500"
            >
              {/* Arrow */}
              <div className="absolute top-8 right-8 text-neutral-600 group-hover:text-accent transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                <ArrowIcon />
              </div>

              {/* Content */}
              <div className="pr-8">
                <h3 className="text-lg font-medium text-neutral-200 group-hover:text-neutral-100 transition-colors duration-300 mb-3">
                  {project.title}
                </h3>
                <p className="text-[15px] text-neutral-500 leading-relaxed mb-6">
                  {project.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="text-[12px] text-neutral-500 bg-bg-elevated px-2.5 py-1 rounded-md font-mono tracking-wide"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
