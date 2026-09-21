"use client";

import dynamic from "next/dynamic";

const TerminalApp = dynamic(
  () => import("@/components/TerminalApp").then((mod) => mod.TerminalApp),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-mono tracking-wider text-slate-300">INITIALIZING SPECIAL USER TERMINAL...</p>
      </div>
    ),
  }
);

export default function SuperPage() {
  return <TerminalApp forceSpecial={true} defaultTab="recommendations" />;
}
