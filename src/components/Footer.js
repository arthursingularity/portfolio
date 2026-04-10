function GitHubIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

const socialLinks = [
  {
    label: "GitHub",
    href: "https://github.com/",
    icon: <GitHubIcon />,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/",
    icon: <LinkedInIcon />,
  },
  {
    label: "E-mail",
    href: "mailto:contato@exemplo.com",
    icon: <MailIcon />,
  },
];

export default function Footer() {
  return (
    <footer id="contact" className="py-20 hidden sm:py-28 px-6 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent mb-20" />

        <div className="flex flex-col items-center text-center">
          {/* CTA heading */}
          <p className="text-[13px] text-accent-muted uppercase tracking-widest mb-6">
            Contato
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-200 tracking-tight mb-4">
            Vamos trabalhar juntos?
          </h2>
          <p className="text-neutral-500 text-[15px] max-w-md mb-10 leading-relaxed">
            Estou disponível para freelance e oportunidades de colaboração.
            Sinta-se à vontade para entrar em contato.
          </p>

          {/* Email link */}
          <a
            href="mailto:contato@exemplo.com"
            className="text-accent hover:text-accent-hover text-sm font-medium tracking-wide transition-colors duration-300 mb-14 underline underline-offset-4 decoration-accent/30 hover:decoration-accent/60"
          >
            contato@exemplo.com
          </a>

          {/* Social links */}
          <div className="flex items-center gap-6 mb-16">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="text-neutral-600 hover:text-accent transition-colors duration-300"
              >
                {link.icon}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-[12px] text-neutral-700 tracking-wide">
            © {new Date().getFullYear()} Arthur Alves. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
