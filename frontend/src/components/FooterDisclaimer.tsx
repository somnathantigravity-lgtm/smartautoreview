"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";

export const FooterDisclaimer: React.FC = () => {
  return (
    <footer className="border-t border-slate-100 py-4 px-4 text-xs font-sans mt-8">
      <div className="w-full max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
        <div>© 2026 Apex Indian Equities Terminal • BSE & NSE Real-Time Market Master</div>
        <div>Powered by xKiro.com Unified AI Gateway</div>
      </div>
    </footer>
  );
};
