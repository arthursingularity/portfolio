"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex flex-col p-5 pt-[130px] pb-6 overflow-hidden"
    >
      {/* Content layer */}
      <div className="relative z-10 flex flex-col">

        {/* Main heading */}
        <h1 className="opacity-0 mt-5 animate-fade-in-up animate-delay-200 text-[36px] sm:text-4xl lg:text-5xl font-regular text-neutral-100 leading-[1.2] tracking-tight mb-6">
          Desenvolvendo a{" "}
          <span className="text-accent">próxima geração</span> de
          páginas web de alto nível.
        </h1>

        {/* Subtitle */}
        <p className="opacity-0 animate-fade-in-up animate-delay-300 text-[15px] sm:text-base font-extralight text-[#C9D4E4] leading-relaxed mb-10 max-w-md">
          Especialista em criar sistemas e páginas eficientes com design premium.
        </p>

        {/* CTA Button */}
        <div className="opacity-0 animate-fade-in-up animate-delay-400">
          <button
            className="flex items-center justify-center w-full py-3 bg-accent hover:bg-accent-hover text-white text-[15px] font-medium rounded-full transition-all duration-300"
          >
            Entrar em contato
          </button>
        </div>
      </div>
    </section>
  );
}
