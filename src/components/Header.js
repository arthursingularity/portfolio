"use client";

import { Menu, Chat } from "@carbon/icons-react";

export default function Header() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 bg-[#1a1e24] border-b border-[rgba(255,255,255,0.06)]"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="max-w-md mx-auto px-6 h-[65px] flex items-center justify-between">
        <Menu size={26} className="text-neutral-100 cursor-pointer" />
        <img src="/imagens/logo.svg" alt="Logo" className="w-8" />
        <Chat size={26} className="text-neutral-100 cursor-pointer" />
      </div>
    </nav>
  );
}
