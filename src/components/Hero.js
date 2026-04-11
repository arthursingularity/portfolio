"use client";

import Image from "next/image";
import dynamic from "next/dynamic";

const Cube3D = dynamic(() => import("./Cube3D"), { ssr: false });

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex flex-col p-4"
    >
      {/* Profile card */}
      <div className="opacity-0 animate-fade-in-up animate-delay-100 mb-10">
        <div className="flex justify-between w-full items-center bg-[#1a1e24] rounded-full px-4 py-3 border border-[rgba(255,255,255,0.06)]">
          <div className="flex space-x-3">
            <Image
              src="/imagens/profile.png"
              alt="Arthur Alves"
              width={45}
              height={45}
              className="rounded-full object-cover shrink-0"
              priority
            />
            <div className="flex flex-col justify-center gap-[5px]">
              <p className="text-[22px] font-medium text-neutral-100 leading-none">
                Arthur Alves
              </p>
              <p className="text-[14px] font-regular text-[#C9D4E4] leading-none">
                Desenvolvedor Fullstack
              </p>
            </div>
          </div>
          <img src='/imagens/logo.svg' className="w-[33px] mr-2"/>
        </div>
      </div>

      {/* Main heading */}
      <h1 className="opacity-0 mt-8 animate-fade-in-up animate-delay-200 text-[32px] sm:text-4xl lg:text-5xl font-regular text-neutral-100 leading-[1.2] tracking-tight mb-6">
        Desenvolvendo a{" "}
        <span className="text-accent">próxima geração</span> de
        aplicações web de alto nível.
      </h1>

      {/* Subtitle */}
      <p className="opacity-0 animate-fade-in-up animate-delay-300 text-[15px] sm:text-base font-light text-[#C9D4E4] leading-relaxed mb-10 max-w-md">
        Especialista em criar sistemas eficientes onde o design minimalista
        esconde uma engenharia de dados precisa.
      </p>

      {/* CTA Button */}
      <div className="opacity-0 animate-fade-in-up animate-delay-400">
        <button
          className="flex items-center justify-center w-full py-3 bg-accent hover:bg-accent-hover text-white text-[15px] font-medium rounded-full transition-all duration-300"
        >
          Entrar em contato
        </button>
      </div>
    </section>
  );
}
