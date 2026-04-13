"use client";

import { useState } from "react";
import useScrollReveal from "@/hooks/useScrollReveal";

const socialLinks = [
  {
    name: "GitHub",
    href: "https://github.com/arthursingularity?tab=repositories",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/arthur-alves-793463263/",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: "Email",
    href: "mailto:arthuralvespe28@gmail.com",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState(null); // 'sending' | 'sent' | 'error'
  const revealRef = useScrollReveal();

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");

    // Simulate send (replace with actual API call)
    setTimeout(() => {
      setStatus("sent");
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setStatus(null), 4000);
    }, 1500);
  }

  return (
    <section id="contact" className="relative px-4 py-20" ref={revealRef}>
      {/* Section header */}
      <div className="mb-10" data-reveal>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-[13px] font-medium tracking-[0.2em] uppercase text-accent">
            Contato
          </span>
        </div>
        <h2 className="text-[28px] sm:text-3xl font-medium text-neutral-100 leading-tight">
          Vamos trabalhar juntos
        </h2>
        <p className="text-[14px] text-neutral-400 mt-2 max-w-sm">
          Tem um projeto em mente ou quer trocar uma ideia? Estou sempre aberto
          a novas oportunidades.
        </p>
      </div>

      {/* Social links */}
      <div className="flex gap-3 mb-8">
        {socialLinks.map((link, i) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.name}
            className="flex items-center justify-center w-11 h-11 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1a1e24]/50 text-neutral-400 hover:text-accent hover:border-[rgba(1,144,255,0.2)] transition-all duration-300"
            data-reveal="scale"
            data-reveal-delay={String((i + 1) * 100)}
          >
            {link.icon}
          </a>
        ))}
      </div>

      {/* Contact form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-4xl border border-[rgba(255,255,255,0.06)] bg-[#1a1e24]/80 backdrop-blur-sm p-5"
        data-reveal
        data-reveal-delay="200"
      >
        <div>
          <label
            htmlFor="contact-name"
            className="block text-[12px] text-neutral-500 uppercase tracking-wider mb-2"
          >
            Nome
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-[14px] text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-accent/30 transition-colors duration-300"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block text-[12px] text-neutral-500 uppercase tracking-wider mb-2"
          >
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-[14px] text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-accent/30 transition-colors duration-300"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="block text-[12px] text-neutral-500 uppercase tracking-wider mb-2"
          >
            Mensagem
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={4}
            value={formData.message}
            onChange={handleChange}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-[14px] text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-accent/30 transition-colors duration-300 resize-none"
            placeholder="Conte-me sobre seu projeto..."
          />
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-[14px] font-medium rounded-full transition-all duration-300 flex items-center justify-center gap-2"
        >
          {status === "sending" ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Enviando...
            </>
          ) : status === "sent" ? (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              Mensagem enviada!
            </>
          ) : (
            "Enviar mensagem"
          )}
        </button>
      </form>
    </section>
  );
}
