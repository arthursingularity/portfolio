"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative px-6 pb-10 pt-6">
      <div className="border-t border-[rgba(255,255,255,0.06)] pt-8 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-neutral-600">
            © {currentYear} Arthur Alves
          </p>
          <a
            href="#hero"
            className="text-[12px] text-neutral-600 hover:text-neutral-400 transition-colors duration-300"
          >
            Voltar ao topo ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
