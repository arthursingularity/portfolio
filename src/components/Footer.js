export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative px-4 pb-24 pt-10">
      <div className="border-t border-[rgba(255,255,255,0.06)] pt-8">
        {/* Top row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <img src="/imagens/logo.svg" className="w-5 h-5" alt="Logo" />
            <span className="text-[14px] font-medium text-neutral-300">
              Arthur Alves
            </span>
          </div>
          <a
            href="#hero"
            className="text-[12px] text-neutral-500 hover:text-accent transition-colors duration-300 flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 15.75l7.5-7.5 7.5 7.5"
              />
            </svg>
            Voltar ao topo
          </a>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
          {[
            { label: "Projetos", href: "#projects" },
            { label: "Sobre", href: "#about" },
            { label: "Stack", href: "#skills" },
            { label: "Contato", href: "#contact" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[13px] text-neutral-500 hover:text-neutral-300 transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <p className="text-[12px] text-neutral-600">
          © {currentYear} Arthur Alves. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
