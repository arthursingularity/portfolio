"use client";

import useScrollReveal from "@/hooks/useScrollReveal";

export default function Contact() {
  const revealRef = useScrollReveal();

  return (
    <section id="contact" className="relative px-6 py-28 sm:py-36" ref={revealRef}>
      <div className="max-w-lg mx-auto text-center">
        {/* Large headline */}
        <h2
          className="text-[32px] sm:text-[42px] lg:text-[52px] font-medium text-neutral-100 leading-[1.15] tracking-tight mb-6"
          data-reveal
        >
          Vamos criar<br />
          algo <span className="text-accent">incrível.</span>
        </h2>

        <p
          className="text-[16px] sm:text-[18px] text-neutral-400 leading-relaxed mb-12 max-w-md mx-auto"
          data-reveal
          data-reveal-delay="100"
        >
          Tem uma ideia, um projeto ou simplesmente quer trocar uma ideia?
          Estou disponível para conversar.
        </p>

        {/* Primary CTA */}
        <div data-reveal data-reveal-delay="200">
          <a
            href="mailto:arthuralvespe28@gmail.com"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent hover:bg-accent-hover text-white text-[16px] font-medium rounded-full transition-all duration-300"
          >
            Iniciar conversa
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>

        {/* Subtle social links */}
        <div className="flex justify-center gap-8 mt-12" data-reveal data-reveal-delay="300">
          <a
            href="https://github.com/arthursingularity?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-neutral-500 hover:text-neutral-200 transition-colors duration-300"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/arthur-alves-793463263/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-neutral-500 hover:text-neutral-200 transition-colors duration-300"
          >
            LinkedIn
          </a>
          <a
            href="mailto:arthuralvespe28@gmail.com"
            className="text-[13px] text-neutral-500 hover:text-neutral-200 transition-colors duration-300"
          >
            Email
          </a>
        </div>
      </div>
    </section>
  );
}
