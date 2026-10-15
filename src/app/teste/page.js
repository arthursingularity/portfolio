"use client";

import dynamic from "next/dynamic";

const EstoqueViewer = dynamic(() => import("./EstoqueViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
    </div>
  ),
});

export default function TestePage() {
  return (
    <main className="w-screen h-screen overflow-hidden m-0 p-0">
      <EstoqueViewer />
    </main>
  );
}