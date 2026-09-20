"use client";

import React, { use } from "react";
import { TerminalApp } from "@/components/TerminalApp";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

interface SuperUserPageProps {
  params: Promise<{ token: string }>;
}

const SUPER_USER_SECRET = "Deevarsh@190521";

export default function SuperUserPage({ params }: SuperUserPageProps) {
  const resolvedParams = use(params);
  const rawToken = resolvedParams.token || "";
  let decodedToken = rawToken;
  try {
    decodedToken = decodeURIComponent(rawToken);
  } catch {
    decodedToken = rawToken;
  }

  const isAuthorized = decodedToken === SUPER_USER_SECRET || rawToken === SUPER_USER_SECRET;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">404 - Access Prohibited</h1>
        <p className="text-slate-400 max-w-md text-sm mb-6">
          The requested system endpoint does not exist or your access credentials could not be verified.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // Token verified: render full 11-module SpecialUser terminal
  return <TerminalApp forceSpecial={true} defaultTab="recommendations" />;
}
