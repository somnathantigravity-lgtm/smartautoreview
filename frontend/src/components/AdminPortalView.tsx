"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Lock,
  Layers,
  Sparkles,
  Briefcase,
  Settings as SettingsIcon,
  LogOut,
  Terminal
} from "lucide-react";
import { TerminalApp } from "@/components/TerminalApp";
import { fetchAdminUsers, unlockAdminUser } from "@/services/api";
import { SignoutConfirmModal } from "@/components/SignoutConfirmModal";

export function AdminPortalView() {
  const [activeAdminTab, setActiveAdminTab] = useState<"terminal" | "users">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [unlockingEmail, setUnlockingEmail] = useState<string | null>(null);
  const [showSignoutModal, setShowSignoutModal] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminUsers();
      setUsers(res.users || []);
    } catch (err: any) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    const interval = setInterval(loadUsers, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleUnlock = async (email: string) => {
    setUnlockingEmail(email);
    setFeedback(null);
    try {
      const res = await unlockAdminUser(email);
      setFeedback({ type: "success", message: res.message || `Account unlocked for ${email}.` });
      await loadUsers();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to unlock user." });
    } finally {
      setUnlockingEmail(null);
    }
  };

  const totalUsers = users.length;
  const lockedUsers = users.filter((u) => u.is_locked).length;
  const activeDhanUsers = users.filter((u) => u.dhan_configured).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Admin Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight">APEX EQUITIES • ADMIN CONSOLE</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                PORT 3002
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              System Administration, User Security Management &amp; Terminal Engine
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveAdminTab("users")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeAdminTab === "users"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User &amp; Lockout Console</span>
              {lockedUsers > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
            <button
              onClick={() => setActiveAdminTab("terminal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeAdminTab === "terminal"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full Terminal App</span>
            </button>
          </div>

          <button
            onClick={() => setShowSignoutModal(true)}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        {activeAdminTab === "terminal" ? (
          <TerminalApp defaultTab="recommendations" forceSpecial={true} />
        ) : (
          <main className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>Registered NormalUsers</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-mono font-black text-slate-900">{totalUsers}</div>
                <p className="text-[11px] text-slate-400">Total client registrations</p>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>Active Dhan Connections</span>
                  <Zap className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-mono font-black text-emerald-600">{activeDhanUsers}</div>
                <p className="text-[11px] text-slate-400">Clients with verified TOTP &amp; trading</p>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>Locked Out Accounts (1-Hour Block)</span>
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-mono font-black text-rose-600">{lockedUsers}</div>
                <p className="text-[11px] text-slate-400">Exceeded 3 OTP verification attempts</p>
              </div>
            </div>

            {/* Feedback message */}
            {feedback && (
              <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}>
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Client Account Management &amp; Security Control</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    View client status, Dhan TOTP setup, and manually unlock accounts locked out by OTP attempts.
                  </p>
                </div>
                <button
                  onClick={loadUsers}
                  disabled={loading}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Refresh Users</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">User Email</th>
                      <th className="py-3 px-4">Registered On</th>
                      <th className="py-3 px-4">Dhan Broker Status</th>
                      <th className="py-3 px-4">Security / Lockout</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No registered NormalUsers found yet. Register a client on port 3001 to see them here.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        return (
                          <tr key={u.id || u.email} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{u.email}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{u.id}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {u.created_at || "Recent"}
                            </td>
                            <td className="py-3 px-4">
                              {u.dhan_configured ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Client ID: {u.dhan_client_id}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Lock className="w-3 h-3" />
                                  <span>Not Connected</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {u.is_locked ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <Clock className="w-3 h-3" />
                                  <span>LOCKED ({Math.ceil(u.lock_remaining_sec / 60)}m left)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>Active (0 failed attempts)</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {u.is_locked ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnlock(u.email)}
                                  disabled={unlockingEmail === u.email}
                                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 ml-auto transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {unlockingEmail === u.email ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Unlock className="w-3 h-3" />
                                  )}
                                  <span>Unlock Account</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-normal">Normal</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Signout Modal */}
      <SignoutConfirmModal
        isOpen={showSignoutModal}
        onClose={() => setShowSignoutModal(false)}
        onConfirm={() => {
          setShowSignoutModal(false);
          localStorage.removeItem("apex_user");
          window.location.reload();
        }}
      />
    </div>
  );
}
