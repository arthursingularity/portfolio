"use client";

import dynamic from "next/dynamic";

const SectorStudio = dynamic(
  () => import("../components/viewport/SectorStudio"),
  {
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen bg-[#38383c] flex items-center justify-center">
        <div className="flex items-center gap-3 text-xs font-mono text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Inicializando Grid 3D...</span>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-[#38383c]">
      <SectorStudio />
    </main>
  );
}
