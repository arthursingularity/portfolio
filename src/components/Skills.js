"use client";

const categories = [
  {
    name: "Frontend",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    skills: [
      { name: "React", level: "Avançado" },
      { name: "Next.js", level: "Avançado" },
      { name: "TypeScript", level: "Avançado" },
      { name: "Tailwind CSS", level: "Avançado" },
      { name: "HTML/CSS", level: "Avançado" },
      { name: "Three.js", level: "Intermediário" },
    ],
  },
  {
    name: "Backend",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
      </svg>
    ),
    skills: [
      { name: "Node.js", level: "Avançado" },
      { name: "Express", level: "Avançado" },
      { name: "PostgreSQL", level: "Intermediário" },
      { name: "MongoDB", level: "Intermediário" },
      { name: "REST APIs", level: "Avançado" },
      { name: "Prisma", level: "Intermediário" },
    ],
  },
  {
    name: "Ferramentas & DevOps",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1H21M3 3v18" />
      </svg>
    ),
    skills: [
      { name: "Git/GitHub", level: "Avançado" },
      { name: "Docker", level: "Intermediário" },
      { name: "Linux", level: "Intermediário" },
      { name: "Vercel", level: "Avançado" },
      { name: "Figma", level: "Intermediário" },
      { name: "VS Code", level: "Avançado" },
    ],
  },
];

function getLevelWidth(level) {
  switch (level) {
    case "Avançado":
      return "w-full";
    case "Intermediário":
      return "w-3/5";
    case "Básico":
      return "w-1/3";
    default:
      return "w-1/2";
  }
}

function getLevelColor(level) {
  switch (level) {
    case "Avançado":
      return "bg-accent";
    case "Intermediário":
      return "bg-accent/60";
    case "Básico":
      return "bg-accent/30";
    default:
      return "bg-accent/40";
  }
}

export default function Skills() {
  return (
    <section id="skills" className="relative px-4 py-20">
      {/* Section header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-[13px] font-medium tracking-[0.2em] uppercase text-accent">
            Stack
          </span>
        </div>
        <h2 className="text-[28px] sm:text-3xl font-medium text-neutral-100 leading-tight">
          Tecnologias & ferramentas
        </h2>
        <p className="text-[14px] text-neutral-400 mt-2 max-w-sm">
          As ferramentas que uso diariamente para criar soluções robustas e
          escaláveis.
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.name}>
            {/* Category header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="text-accent/70">{category.icon}</div>
              <h3 className="text-[14px] font-medium text-neutral-300">
                {category.name}
              </h3>
            </div>

            {/* Skills grid */}
            <div className="grid grid-cols-2 gap-2">
              {category.skills.map((skill) => (
                <div
                  key={skill.name}
                  className="group relative p-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1a1e24]/50 hover:border-[rgba(1,144,255,0.15)] transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-medium text-neutral-200 group-hover:text-neutral-100 transition-colors">
                      {skill.name}
                    </span>
                    <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
                      {skill.level}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-[2px] w-full bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getLevelWidth(skill.level)} ${getLevelColor(skill.level)} transition-all duration-700`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
