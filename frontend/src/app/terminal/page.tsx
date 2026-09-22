"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TerminalPage() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("apex_active_portal", "special");
      window.location.replace("/terminal/Deevarsh190521");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-mono tracking-wider text-slate-300">OPENING SECURE TERMINAL...</p>
    </div>
  );
}

