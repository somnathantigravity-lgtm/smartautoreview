import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apex Admin Intelligence Portal | Port 3001",
  description: "Restricted administrative command deck for AI recommendation engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased"
        style={{ backgroundColor: "#020617", color: "#f8fafc", margin: 0, minHeight: "100vh" }}
      >
        {children}
      </body>
    </html>
  );
}
