"use client";

import React, { use } from "react";
import { AdminPortalView } from "@/components/AdminPortalView";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

interface AdminUserPageProps {
  params: Promise<{ token: string }>;
}

const ADMIN_USER_SECRET = "Deevarsh@150399";

export default function AdminUserPage({ params }: AdminUserPageProps) {
  const resolvedParams = use(params);
  const rawToken = resolvedParams.token || "";
  let decodedToken = rawToken;
  try {
    decodedToken = decodeURIComponent(rawToken);
  } catch {
    decodedToken = rawToken;
  }

  const isAuthorized = decodedToken === ADMIN_USER_SECRET || rawToken === ADMIN_USER_SECRET;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">404 - Access Prohibited</h1>
        <p className="text-slate-400 max-w-md text-sm mb-6">
          The requested administrative endpoint does not exist or your security token could not be verified.
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

  // Token verified: render AdminUser Management Portal
  return <AdminPortalView />;
}
