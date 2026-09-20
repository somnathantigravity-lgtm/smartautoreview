import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APEX EQUITIES • Indian Equities Terminal, Open Screener & Dynamic Triggers",
  description: "Real-time BSE & NSE stock universe scanner, open 2-factor financial screener, custom portfolios, and dynamic technical trigger studio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased bg-slate-50">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">{children}</body>
    </html>
  );
}
