"use client";

import { Menu, Chat } from "@carbon/icons-react";

export default function Header() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40">
      <div className="relative max-w-md mx-auto bg-[#1a1e24] border-b border-[rgba(255,255,255,0.06)] px-6 h-[65px] flex items-center justify-between">
        {/* Background extension to cover iOS Safari safe-area at the top */}
        <div className="absolute bottom-full left-0 right-0 h-[100px] bg-[#1a1e24] pointer-events-none" />

        <Menu size={26} className="text-neutral-100 cursor-pointer" />
        <img src="/imagens/logo.svg" alt="Logo" className="w-8" />
        <Chat size={26} className="text-neutral-100 cursor-pointer" />
      </div>
    </nav>
  );
}
