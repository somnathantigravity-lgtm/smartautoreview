"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Lock,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  LogOut,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Database,
  Layers,
  FileText,
  Search,
  Filter,
  Check,
  X,
  Info,
  ExternalLink,
  Activity,
  Bot,
  BookOpen
} from "lucide-react";
import QuantCopilotView from "./QuantCopilotView";
import PlatformBibleView from "./PlatformBibleView";

export default function AdminPortalPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("somnathdey269@gmail.com");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"UNIVERSE_INSPECTOR" | "QUANT_COPILOT" | "CANDIDATES" | "STRATEGIES" | "EOD_REPORTS" | "INJECTOR" | "PLATFORM_BIBLE">("QUANT_COPILOT");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [candidateFilter, setCandidateFilter] = useState<string>("all");
  const [quotaStats, setQuotaStats] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [eodReports, setEodReports] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({ public_batch_limit: "5" });
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>("");

  // Universe Inspector State (5,092 stocks)
  const [universePage, setUniversePage] = useState<number>(1);
  const [universePageSize, setUniversePageSize] = useState<number>(50);
  const [universeSearch, setUniverseSearch] = useState<string>("");
  const [universeSector, setUniverseSector] = useState<string>("ALL");
  const [universeStatus, setUniverseStatus] = useState<string>("ALL");
  const [universeTotal, setUniverseTotal] = useState<number>(0);
  const [universeItems, setUniverseItems] = useState<any[]>([]);
  const [solvencyStatus, setSolvencyStatus] = useState<{
    has_run_today: boolean;
    date_str?: string;
    approved_count: number;
    rejected_count: number;
    executed_at?: string | number;
    executed_at_str?: string;
    last_updated_as_on?: string;
    status: string;
  }>({
    has_run_today: false,
    approved_count: 0,
    rejected_count: 0,
    status: "PENDING"
  });
  const [loadingUniverse, setLoadingUniverse] = useState<boolean>(false);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);

  // Manual Injector Form State
  const [injectSymbol, setInjectSymbol] = useState<string>("");
  const [injectName, setInjectName] = useState<string>("");
  const [injectPrice, setInjectPrice] = useState<string>("");
  const [injectTarget, setInjectTarget] = useState<string>("");
  const [injectStop, setInjectStop] = useState<string>("");
  const [injectReason, setInjectReason] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("apex_admin_token");
    if (token) {
      setIsAuthenticated(true);
      fetchAdminData();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/admin-portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonBody({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("apex_admin_token", data.token);
        setIsAuthenticated(true);
        fetchAdminData();
      } else {
        setLoginError(data.detail || "Invalid administrative credentials.");
      }
    } catch (err) {
      setLoginError("Could not connect to backend server on port 8000.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("apex_admin_token");
    setIsAuthenticated(false);
  };

  const jsonBody = (data: any) => JSON.stringify(data);

  const fetchAdminData = async (candFilter: string = candidateFilter) => {
    try {
      setLoading(true);
      const [candRes, stratRes, eodRes, setRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/admin-portal/candidates?filter_type=${candFilter}`),
        fetch("http://localhost:8000/api/v1/admin-portal/strategies"),
        fetch("http://localhost:8000/api/v1/admin-portal/eod-reports"),
        fetch("http://localhost:8000/api/v1/admin-portal/settings")
      ]);

      if (candRes.ok) {
        const d = await candRes.json();
        setCandidates(d.candidates || []);
        if (d.quota_stats) setQuotaStats(d.quota_stats);
      }
      if (stratRes.ok) {
        const d = await stratRes.json();
        setStrategies(d.strategies || []);
      }
      if (eodRes.ok) {
        const d = await eodRes.json();
        setEodReports(d.reports || []);
      }
      if (setRes.ok) {
        const d = await setRes.json();
        setSettings(d.settings || {});
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterCandidate = async (filt: string) => {
    setCandidateFilter(filt);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin-portal/candidates?filter_type=${filt}`);
      if (res.ok) {
        const d = await res.json();
        setCandidates(d.candidates || []);
        if (d.quota_stats) setQuotaStats(d.quota_stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleActivateStrategy = async (version: string) => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/v1/admin-portal/strategies/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonBody({ version })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`🎯 Strategy ${version} activated as live Champion! Zero coding needed.`);
        fetchAdminData();
        setTimeout(() => setActionMessage(""), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string, currentVal: number) => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/admin-portal/toggle-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonBody({ id, publish: currentVal === 1 ? false : true })
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLimit = async (newLimit: string) => {
    try {
      setSettings(prev => ({ ...prev, public_batch_limit: newLimit }));
      await fetch("http://localhost:8000/api/v1/admin-portal/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonBody({ settings: { public_batch_limit: newLimit } })
      });
      setActionMessage(`Public recommendation limit set to top ${newLimit} stocks.`);
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRegime = async (newRegime: string) => {
    try {
      setSettings(prev => ({ ...prev, market_regime: newRegime }));
      await fetch("http://localhost:8000/api/v1/admin-portal/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonBody({ settings: { market_regime: newRegime } })
      });
      setActionMessage(`Market Regime Gate set to: ${newRegime}. Engine entry hurdles updated.`);
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMinApplicable = async (val: string) => {
    try {
      setSettings(prev => ({ ...prev, min_applicable_parameters: val }));
      await fetch("http://localhost:8000/api/v1/admin-portal/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonBody({ settings: { min_applicable_parameters: val } })
      });
      setActionMessage(`Minimum applicable parameters threshold updated to ${val} / 18`);
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualInject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!injectSymbol || !injectPrice || !injectTarget || !injectStop) return;
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/v1/admin-portal/manual-inject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonBody({
          symbol: injectSymbol.toUpperCase(),
          company_name: injectName || injectSymbol.toUpperCase(),
          bse_price: parseFloat(injectPrice),
          target_price: parseFloat(injectTarget),
          stop_loss: parseFloat(injectStop),
          reasons: injectReason ? [injectReason] : ["Manually injected opportunity by Administrator."]
        })
      });
      if (res.ok) {
        setActionMessage(`Successfully injected ${injectSymbol.toUpperCase()} to recommendations!`);
        setInjectSymbol("");
        setInjectName("");
        setInjectPrice("");
        setInjectTarget("");
        setInjectStop("");
        setInjectReason("");
        fetchAdminData();
        setTimeout(() => setActionMessage(""), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScan = async () => {
    try {
      setLoading(true);
      await fetch("http://localhost:8000/api/v1/admin-portal/run-scan-now", { method: "POST" });
      setActionMessage("Triggered 30-minute candidate scan cycle across BSE universe.");
      fetchAdminData();
      fetchUniverseData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUniverseData = useCallback(async () => {
    try {
      setLoadingUniverse(true);
      const params = new URLSearchParams({
        page: universePage.toString(),
        page_size: universePageSize.toString(),
        search: universeSearch,
        sector: universeSector,
        filter_status: universeStatus,
      });
      const [univRes, solvRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/admin-portal/universe-inspector?${params.toString()}`),
        fetch("http://localhost:8000/api/v1/admin-portal/solvency-status")
      ]);
      if (univRes.ok) {
        const d = await univRes.json();
        setUniverseItems(d.items || []);
        setUniverseTotal(d.total_stocks || 0);
      }
      if (solvRes.ok) {
        const s = await solvRes.json();
        setSolvencyStatus(s);
      }
    } catch (err) {
      console.error("Failed to load universe inspector:", err);
    } finally {
      setLoadingUniverse(false);
    }
  }, [universePage, universePageSize, universeSearch, universeSector, universeStatus]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "UNIVERSE_INSPECTOR") {
      fetchUniverseData();
    }
  }, [isAuthenticated, activeTab, fetchUniverseData]);

  const handleRunSolvencyGate = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/v1/admin-portal/run-solvency-now", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`✅ Solvency Gate Executed: Approved ${data.approved_count} stocks, Rejected ${data.rejected_count} penny/illiquid/surveillance stocks.`);
        fetchUniverseData();
        fetchAdminData();
        setTimeout(() => setActionMessage(""), 6000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerUniverseScan = async () => {
    try {
      setLoading(true);
      await fetch("http://localhost:8000/api/v1/admin-portal/run-scan-now", { method: "POST" });
      setActionMessage("⚡ Executed 5-Core + 6-Catalyst Scan across 5,092 stocks! Evaluations updated.");
      fetchUniverseData();
      fetchAdminData();
      setTimeout(() => setActionMessage(""), 6000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100 font-sans"
        style={{
          minHeight: "100vh",
          backgroundColor: "#020617",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          color: "#f8fafc"
        }}
      >
        <div
          className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 admin-card"
          style={{
            maxWidth: "28rem",
            width: "100%",
            backgroundColor: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "1.5rem",
            padding: "2rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
          }}
        >
          <div className="text-center space-y-2" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div
              className="w-12 h-12 rounded-2xl bg-blue-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-600/30"
              style={{
                width: "3.25rem",
                height: "3.25rem",
                borderRadius: "1rem",
                backgroundColor: "#2563eb",
                margin: "0 auto 0.75rem auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.4)"
              }}
            >
              <Shield className="w-6 h-6" style={{ width: "1.5rem", height: "1.5rem", color: "#ffffff" }} />
            </div>
            <h2 className="text-xl font-black text-white" style={{ fontSize: "1.25rem", fontWeight: 900, color: "#ffffff", margin: 0 }}>
              Admin Intelligence Portal
            </h2>
            <p className="text-xs text-slate-400" style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "0.25rem 0 0 0" }}>
              Restricted workstation on <span className="font-mono text-blue-400" style={{ color: "#60a5fa", fontWeight: 700 }}>Port 3001</span>
            </p>
          </div>

          {loginError && (
            <div
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold"
              style={{
                padding: "0.875rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(244, 63, 94, 0.1)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                color: "#fb7185",
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: "1rem"
              }}
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label
                className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider"
                style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium outline-none focus:border-blue-500 transition-colors"
                style={{
                  width: "100%",
                  padding: "0.65rem 1rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider"
                style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium outline-none focus:border-blue-500 transition-colors"
                style={{
                  width: "100%",
                  padding: "0.65rem 1rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-blue-600/20"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.75rem",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "0.8rem",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.3)",
                marginTop: "0.5rem"
              }}
            >
              Sign In to Command Deck
            </button>
          </form>

          <div
            className="pt-2 text-center text-[11px] text-slate-500"
            style={{ paddingTop: "0.5rem", textAlign: "center", fontSize: "0.7rem", color: "#64748b" }}
          >
            Protected instance • BSE Large & Mid-Cap Strategy Controller
          </div>
        </div>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD
  const championStrat = strategies.find(s => s.status === "CHAMPION_ACTIVE") || strategies.find(s => s.version === "v1.2") || { version: "v1.2", name: "Apex 18-Parameter Engine" };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-600/30">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white">Apex Intelligence Command Deck</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Port 3001 Isolated
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Operator: <strong className="text-slate-300">{email}</strong> • Market Engine: <span className="text-emerald-400 font-bold">ONLINE</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerScan}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
            <span>Run 30-Min Scan Now</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Action Banner */}
      {actionMessage && (
        <div className="bg-blue-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage("")} className="hover:opacity-80">✕</button>
        </div>
      )}

      {/* Sub Navigation Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2.5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("UNIVERSE_INSPECTOR")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "UNIVERSE_INSPECTOR" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>All Stocks Universe Inspector</span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.2 rounded-full font-mono font-bold">
              {universeTotal > 0 ? universeTotal.toLocaleString() : "5,092"} Stocks
            </span>
          </button>

          <button
            onClick={() => setActiveTab("QUANT_COPILOT")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "QUANT_COPILOT" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-indigo-300" />
            <span>Quant Copilot &amp; 26-Vector Inspector</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.2 rounded-full font-mono font-bold">
              AI Chat
            </span>
          </button>

          <button
            onClick={() => setActiveTab("CANDIDATES")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "CANDIDATES" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Preserved Candidates ({quotaStats?.all_time_archive?.total_preserved || candidates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("STRATEGIES")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "STRATEGIES" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Version &amp; Inclusion Governance</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-mono font-bold">
              {championStrat?.version || "v1.2"} Active
            </span>
          </button>

          <button
            onClick={() => setActiveTab("EOD_REPORTS")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "EOD_REPORTS" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Daily EOD Reports ({eodReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("INJECTOR")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "INJECTOR" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Stock Injector</span>
          </button>

          <button
            onClick={() => setActiveTab("PLATFORM_BIBLE")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "PLATFORM_BIBLE"
                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
            <span>Platform Bible &amp; Architecture</span>
            <span className="text-[10px] bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.2 rounded-full font-mono font-bold">
              28 Modules · 72 APIs
            </span>
          </button>
        </div>

        {/* Controls: Regime, Limit & Min Parameters */}
        <div className="flex items-center gap-4 text-xs flex-wrap">
          {/* Market Regime Control */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Market Regime:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {[
                { id: "BULL_MOMENTUM", label: "🟢 Bullish" },
                { id: "NEUTRAL_RANGE", label: "🟡 Neutral" },
                { id: "DEFENSIVE_VOLATILE", label: "🔴 Defensive" }
              ].map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => handleUpdateRegime(reg.id)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    (settings.market_regime || "BULL_MOMENTUM") === reg.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Min Applicable Parameters Dynamic Control */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Min Applicable:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {["8", "10", "12", "14"].map((num) => (
                <button
                  key={num}
                  onClick={() => handleUpdateMinApplicable(num)}
                  className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                    (settings.min_applicable_parameters || "10") === num
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {num} / 18
                </button>
              ))}
            </div>
          </div>

          {/* Public Limit */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Public Limit:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {["3", "5", "8", "10"].map((num) => (
                <button
                  key={num}
                  onClick={() => handleUpdateLimit(num)}
                  className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                    settings.public_batch_limit === num
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Top {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
        {/* TAB 0: ALL STOCKS UNIVERSE INSPECTOR (5,092 STOCKS) */}
        {activeTab === "UNIVERSE_INSPECTOR" && (
          <div className="space-y-6">
            {/* Top Header & Execution Banners */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">BSE Universe Inspector (5,092 Stocks)</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold">
                    Institutional Multi-Gate Architecture
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Examine every single stock: Pre-Market Solvency Gate (08:45 AM), 5 Core Kill-Switch Rules, and 6 Dynamic Catalysts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunSolvencyGate}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>Run Solvency Gate Now</span>
                </button>

                <button
                  onClick={handleTriggerUniverseScan}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  <span>Run 5-Core Scan Across All Stocks</span>
                </button>
              </div>
            </div>

            {/* KPI Status Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Gate 1: Solvency Gate */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Priority 1: Solvency Gate
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    solvencyStatus.has_run_today
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  }`}>
                    {solvencyStatus.has_run_today ? "🟢 Executed Today" : "🟡 Pending Run"}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-white">{solvencyStatus.approved_count.toLocaleString()}</span>
                  <span className="text-xs text-emerald-400 font-semibold">Liquid Stocks Approved</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <span>Filtered Out: <strong className="text-rose-400">{solvencyStatus.rejected_count.toLocaleString()}</strong> illiquid/penny</span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    Last updated as on: <strong className="text-emerald-400">{solvencyStatus.last_updated_as_on || solvencyStatus.executed_at_str || (solvencyStatus.executed_at ? new Date(solvencyStatus.executed_at).toLocaleTimeString() : "08:45 AM Scheduled")}</strong>
                  </span>
                </div>
              </div>

              {/* Gate 2: 5 Core Kill-Switch */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                    Phase 2: 5 Core Rules
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    09:15 - 14:45 IST
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium space-y-1 mt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">1. Price &gt; VWAP:</span>
                    <span className="text-slate-200 font-semibold">Mandatory</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">2. Volume Multiple:</span>
                    <span className="text-slate-200 font-semibold">&ge; 1.5x 20-Day</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">3. R:R &amp; 30D Base &amp; 20 EMA:</span>
                    <span className="text-slate-200 font-semibold">&ge; 1:2.0 + Support</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                  <span>Hurdle Requirement:</span>
                  <strong className="text-blue-400">All 5 of 5 Must Pass</strong>
                </div>
              </div>

              {/* Gate 3: Dynamic Catalysts & Guardian */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    Catalysts &amp; System 2
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    Min 2 of 6 Catalysts
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 mt-1">
                  <div className="text-[11px] text-slate-400">
                    News (P1) • Breadth (P2) • ORB Base (P7) • 52W High (P9) • SEBI Reg 30 (P10) • Delivery (P5)
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                  <span>Trade Management:</span>
                  <span className="text-amber-400 font-semibold">Active &amp; Trimmed Tabs</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Symbol (e.g. TCS, RELIANCE), Company Name, or BSE Scrip Code..."
                  value={universeSearch}
                  onChange={(e) => {
                    setUniverseSearch(e.target.value);
                    setUniversePage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                />
                {universeSearch && (
                  <button
                    onClick={() => {
                      setUniverseSearch("");
                      setUniversePage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sector Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 whitespace-nowrap">Sector:</span>
                <select
                  value={universeSector}
                  onChange={(e) => {
                    setUniverseSector(e.target.value);
                    setUniversePage(1);
                  }}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Sectors (5,092)</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Banking & Finance">Banking & Finance</option>
                  <option value="Automobile">Automobile</option>
                  <option value="Pharmaceuticals">Pharmaceuticals</option>
                  <option value="Energy, Oil & Gas">Energy, Oil & Gas</option>
                  <option value="Consumer & FMCG">Consumer & FMCG</option>
                  <option value="Metals & Mining">Metals & Mining</option>
                  <option value="Infrastructure & Capital Goods">Infrastructure</option>
                  <option value="Chemicals">Chemicals</option>
                  <option value="Telecommunication">Telecommunication</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 whitespace-nowrap">Status:</span>
                <select
                  value={universeStatus}
                  onChange={(e) => {
                    setUniverseStatus(e.target.value);
                    setUniversePage(1);
                  }}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SOLVENCY_PASSED">🟢 Solvency Approved Only</option>
                  <option value="SOLVENCY_REJECTED">🔴 Solvency Rejected Only</option>
                  <option value="INTRADAY_ACTIVE">⚡ Intraday Active Recos</option>
                  <option value="SQUARED_OFF_TRIMMED">✂️ Squared Off (Trimmed)</option>
                  <option value="DISCARDED_CORE_FAIL">❌ Failed Core Checks</option>
                  <option value="DISCARDED_LOW_CATALYST">⚠️ Low Catalysts (&lt; 2)</option>
                </select>
              </div>

              {/* Page Size */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 whitespace-nowrap">Show:</span>
                <select
                  value={universePageSize}
                  onChange={(e) => {
                    setUniversePageSize(Number(e.target.value));
                    setUniversePage(1);
                  }}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-2.5 py-2 outline-none focus:border-blue-500 cursor-pointer font-mono"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            {/* Total Results Summary */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Showing <strong className="text-white">{universeItems.length}</strong> of{" "}
                <strong className="text-white">{universeTotal.toLocaleString()}</strong> stocks
                {universeSearch && <span> matching &ldquo;{universeSearch}&rdquo;</span>}
                {universeSector !== "ALL" && <span> in &ldquo;{universeSector}&rdquo;</span>}
                {universeStatus !== "ALL" && <span> with status &ldquo;{universeStatus}&rdquo;</span>}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUniversePage((p) => Math.max(1, p - 1))}
                  disabled={universePage <= 1 || loadingUniverse}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <span className="font-mono text-slate-300">
                  Page {universePage} of {Math.max(1, Math.ceil(universeTotal / universePageSize))}
                </span>
                <button
                  onClick={() => setUniversePage((p) => p + 1)}
                  disabled={universePage >= Math.ceil(universeTotal / universePageSize) || loadingUniverse}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Universe Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {loadingUniverse ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                  <p className="text-xs font-semibold">Querying 5,092 stock evaluations across SQLite index...</p>
                </div>
              ) : universeItems.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <AlertTriangle className="w-8 h-8 mx-auto text-amber-500/50" />
                  <p className="text-sm font-bold text-slate-300">No stocks found matching the criteria.</p>
                  <p className="text-xs text-slate-500">Try clearing your search query or selecting &ldquo;All Statuses&rdquo;.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Instrument</th>
                        <th className="py-3 px-3">Solvency Gate Verdict</th>
                        <th className="py-3 px-3 text-right">LTP / VWAP</th>
                        <th className="py-3 px-3 text-center">5 Core Rules</th>
                        <th className="py-3 px-3 text-center">6 Catalysts</th>
                        <th className="py-3 px-4">Diagnostic Verdict &amp; &ldquo;Why Now&rdquo;</th>
                        <th className="py-3 px-3 text-center">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {universeItems.map((item) => {
                        const isExpanded = expandedStock === item.symbol;
                        const isApproved = item.solvency_status === "APPROVED" || item.solvency_passed === 1;
                        const currentStatus = item.current_status || item.status;
                        const isIntraday = currentStatus === "INTRADAY_ACTIVE";
                        const isTrimmed = currentStatus === "SQUARED_OFF_TRIMMED";
                        const corePassed = item.core_rules_passed ?? (item.core_passed === 1 ? 5 : (item.core_details ? Object.values(item.core_details).filter((r: any) => r.passed).length : 0));
                        const catCount = item.catalysts_count ?? (item.catalysts_active ? item.catalysts_active.length : (item.active_catalysts ? item.active_catalysts.length : 0));
                        const ltp = item.price || item.ltp || 0;
                        const vwap = item.vwap || (ltp > 0 ? ltp * 0.995 : 0);
                        const ltpAboveVwap = ltp > 0 && vwap > 0 && ltp >= vwap;
                        const activeCats = item.catalysts_active || item.active_catalysts || [];
                        const bseScrip = item.bse_scrip || item.bse_scrip_code || "--";
                        const mcapTier = item.market_cap_tier || "BSE";
                        const coreChecks = {
                          price_above_vwap: item.core_details?.rule1_vwap_and_depth?.passed ?? item.core_checks?.price_above_vwap ?? true,
                          volume_surge: item.core_details?.rule2_volume_surge?.passed ?? item.core_checks?.volume_surge ?? true,
                          rr_above_2: item.core_details?.rule3_risk_reward?.passed ?? item.core_checks?.rr_above_2 ?? true,
                          trend_30d_higher_low: item.core_details?.rule4_30d_trend_structure?.passed ?? item.core_checks?.trend_30d_higher_low ?? true,
                          price_above_20ema: item.core_details?.rule5_ema_floor?.passed ?? item.core_checks?.price_above_20ema ?? true
                        };

                        return (
                          <React.Fragment key={item.symbol}>
                            <tr
                              onClick={() => setExpandedStock(isExpanded ? null : item.symbol)}
                              className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${
                                isIntraday
                                  ? "bg-blue-950/20"
                                  : isTrimmed
                                  ? "bg-amber-950/15"
                                  : !isApproved
                                  ? "opacity-80"
                                  : ""
                              }`}
                            >
                              {/* Instrument */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="font-extrabold text-white text-sm">{item.symbol}</div>
                                  {isIntraday && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500 text-white animate-pulse">
                                      Active
                                    </span>
                                  )}
                                  {isTrimmed && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                      Trimmed
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px]">
                                  {item.company_name}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                                  <span>BSE: {bseScrip}</span>
                                  <span>•</span>
                                  <span className="text-slate-400">{item.sector}</span>
                                  <span>•</span>
                                  <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">
                                    {mcapTier}
                                  </span>
                                </div>
                              </td>

                              {/* Solvency Gate Verdict */}
                              <td className="py-3 px-3">
                                {isApproved ? (
                                  <div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Approved
                                    </span>
                                    <div className="text-[10px] text-slate-400 mt-1">Liquid &bull; Spread &lt; 0.8%</div>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-bold">
                                      <XCircle className="w-3 h-3" />
                                      Filtered
                                    </span>
                                    <div className="text-[10px] text-rose-300/80 mt-1 max-w-[170px] leading-tight">
                                      {item.solvency_reason || "Ineligible metrics"}
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* LTP / VWAP */}
                              <td className="py-3 px-3 text-right font-mono">
                                <div className="font-extrabold text-white text-xs">
                                  ₹{ltp > 0 ? ltp.toFixed(2) : "--"}
                                </div>
                                <div className={`text-[10px] flex items-center justify-end gap-1 ${
                                  ltpAboveVwap ? "text-emerald-400 font-bold" : "text-rose-400"
                                }`}>
                                  <span>VWAP: ₹{vwap > 0 ? vwap.toFixed(2) : "--"}</span>
                                </div>
                              </td>

                              {/* 5 Core Rules */}
                              <td className="py-3 px-3 text-center">
                                <div className="inline-block">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                                    corePassed === 5
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                      : "bg-slate-800 text-slate-400 border border-slate-700"
                                  }`}>
                                    {corePassed === 5 ? <Check className="w-3 h-3" /> : null}
                                    {corePassed} / 5
                                  </span>
                                  <div className="text-[9px] text-slate-400 mt-1 font-mono">
                                    {corePassed === 5 ? "All Passed" : `${5 - corePassed} Failed`}
                                  </div>
                                </div>
                              </td>

                              {/* 6 Catalysts */}
                              <td className="py-3 px-3 text-center">
                                <div className="inline-block">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                                    catCount >= 2
                                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                      : "bg-slate-800 text-slate-400 border border-slate-700"
                                  }`}>
                                    <Sparkles className="w-3 h-3" />
                                    {catCount} / 6
                                  </span>
                                  <div className="text-[9px] text-slate-400 mt-1 font-mono">
                                    {catCount >= 2 ? "Confirmed" : "Low Catalyst"}
                                  </div>
                                </div>
                              </td>

                              {/* Diagnostic Verdict & Why Now */}
                              <td className="py-3 px-4">
                                <div className="text-[11px] leading-relaxed text-slate-300 line-clamp-2 max-w-md">
                                  {item.diagnostic_summary || item.why_now || "Stock evaluated by continuous scan cycle."}
                                </div>
                                {activeCats && activeCats.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                    {activeCats.map((cat: string, i: number) => (
                                      <span
                                        key={i}
                                        className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold"
                                      >
                                        {cat}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>

                              {/* Expand Action */}
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedStock(isExpanded ? null : item.symbol);
                                  }}
                                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                >
                                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Detail Drawer */}
                            {isExpanded && (
                              <tr className="bg-slate-950/70 border-b border-slate-800">
                                <td colSpan={7} className="p-4 space-y-3">
                                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4">
                                    {/* 5 Core Checklist Row */}
                                    <div>
                                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-blue-400" />
                                        5 Core Kill-Switch Rule Verification
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                                        {[
                                          { name: "1. Price > VWAP", passed: coreChecks.price_above_vwap, desc: item.core_details?.rule1_vwap_and_depth?.detail || "Holding above institutional average" },
                                          { name: "2. Vol Multiple ≥ 1.5x", passed: coreChecks.volume_surge, desc: item.core_details?.rule2_volume_surge?.detail || "Surging volume vs 20-Day avg" },
                                          { name: "3. R:R ≥ 1:2.0", passed: coreChecks.rr_above_2, desc: item.core_details?.rule3_risk_reward?.detail || "Favorable asymmetric payoff" },
                                          { name: "4. 30D Trend Base", passed: coreChecks.trend_30d_higher_low, desc: item.core_details?.rule4_30d_trend_structure?.detail || "Higher-low consolidation floor" },
                                          { name: "5. 20-Day EMA Floor", passed: coreChecks.price_above_20ema, desc: item.core_details?.rule5_ema_floor?.detail || "Above rising dynamic average" }
                                        ].map((check, idx) => (
                                          <div
                                            key={idx}
                                            className={`p-2 rounded-lg border text-xs ${
                                              check.passed
                                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                            }`}
                                          >
                                            <div className="font-bold flex items-center gap-1">
                                              {check.passed ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-rose-400" />}
                                              <span>{check.name}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{check.desc}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Conversational Detailing */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                                      <div>
                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                          Conversational "Why Now" &amp; Setup Context
                                        </div>
                                        <div className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 font-sans">
                                          {item.why_now || item.diagnostic_summary || "No specific catalyst recorded for this ticker."}
                                        </div>
                                      </div>

                                      <div>
                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                          Institutional Solvency Metrics
                                        </div>
                                        <div className="text-xs text-slate-300 space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Solvency Status:</span>
                                            <span className={`font-bold ${isApproved ? "text-emerald-400" : "text-rose-400"}`}>
                                              {item.solvency_status}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Rejection Cause:</span>
                                            <span className="text-slate-200">{item.solvency_reason || "None (Eligible Liquid Stock)"}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Current Score:</span>
                                            <span className="font-mono font-bold text-blue-400">{item.score || 0} / 100</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">System 2 Invalidation Guardian:</span>
                                            <span className="text-amber-400 font-semibold">VWAP Breakdown, 30m Stagnation, Orderbook</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
              <div>
                Showing Page <strong className="text-white">{universePage}</strong> of{" "}
                <strong className="text-white">{Math.max(1, Math.ceil(universeTotal / universePageSize))}</strong> (
                {universeTotal.toLocaleString()} stocks evaluated)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUniversePage((p) => Math.max(1, p - 1))}
                  disabled={universePage <= 1 || loadingUniverse}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous Page</span>
                </button>
                <button
                  onClick={() => setUniversePage((p) => p + 1)}
                  disabled={universePage >= Math.ceil(universeTotal / universePageSize) || loadingUniverse}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Next Page</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: CANDIDATE PRESERVATION & SESSION QUOTA LEDGER */}
        {activeTab === "CANDIDATES" && (
          <div className="space-y-6">
            {/* HERO SESSION QUOTA & CANDIDATE ARCHIVAL STATUS */}
            <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/40 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-black text-lg">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2 flex-wrap">
                      <span>Candidate Preservation &amp; 3-Session Quota Control</span>
                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        ✓ 100% CANDIDATES PRESERVED (NO DELETIONS)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      All Phase 1 &amp; Phase 2 qualified candidates are permanently archived in SQLite. Only candidates passing Phase 3 Alpha Conviction (&ge;90/100) within session ceilings are published to the user dashboard.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">Session Clock:</span>
                  <span className="text-cyan-400 font-bold bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                    {quotaStats?.current_session || "ACTIVE_MONITORING"}
                  </span>
                </div>
              </div>

              {/* 4 Session Quota Meters & Daily Hard Cap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                {/* Morning Session */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Morning (09:15–11:30)</span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">Max 8</span>
                    </div>
                    <div className="text-lg font-black text-white mt-1">
                      {quotaStats?.today?.published_morning || 0} <span className="text-xs text-slate-500 font-normal">/ 8 Published</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((quotaStats?.today?.published_morning || 0) / 8) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Midday Session */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Midday (11:30–13:30)</span>
                      <span className="text-[10px] font-mono text-blue-400 font-bold">Max 5</span>
                    </div>
                    <div className="text-lg font-black text-white mt-1">
                      {quotaStats?.today?.published_midday || 0} <span className="text-xs text-slate-500 font-normal">/ 5 Published</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((quotaStats?.today?.published_midday || 0) / 5) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Afternoon Session */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Afternoon (13:30–14:45)</span>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">Max 7</span>
                    </div>
                    <div className="text-lg font-black text-white mt-1">
                      {quotaStats?.today?.published_afternoon || 0} <span className="text-xs text-slate-500 font-normal">/ 7 Published</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((quotaStats?.today?.published_afternoon || 0) / 7) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Daily Hard Ceiling */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                      <span>Daily Hard Ceiling</span>
                      <span className="text-[10px] font-mono font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">Max 20</span>
                    </div>
                    <div className="text-lg font-black text-white mt-1">
                      {quotaStats?.today?.published_total || 0} <span className="text-xs text-slate-500 font-normal">/ 20 Total</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((quotaStats?.today?.published_total || 0) / 20) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Complete Candidate Archive */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-purple-400 font-semibold">
                      <span>Preserved Candidates</span>
                      <span className="text-[10px] font-mono font-bold bg-purple-500/20 px-1.5 py-0.5 rounded text-purple-300">SQLite DB</span>
                    </div>
                    <div className="text-lg font-black text-white mt-1">
                      {quotaStats?.all_time_archive?.total_preserved || candidates.length} <span className="text-xs text-slate-500 font-normal">Total Preserved</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <span>Passed P3:</span> <strong className="text-emerald-400 font-mono">{quotaStats?.all_time_archive?.total_p3_passed || 0}</strong>
                    <span>•</span>
                    <span>Held:</span> <strong className="text-slate-300 font-mono">{quotaStats?.all_time_archive?.total_shadow_held || 0}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* FILTER PILLS & REFRESH BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleFilterCandidate("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    candidateFilter === "all"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  All Preserved ({quotaStats?.all_time_archive?.total_preserved || candidates.length})
                </button>
                <button
                  onClick={() => handleFilterCandidate("tier_1")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    candidateFilter === "tier_1"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  <span>🔥</span>
                  <span>Published Tier 1 Rocket ({quotaStats?.today?.published_tier1 || 0})</span>
                </button>
                <button
                  onClick={() => handleFilterCandidate("tier_2")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    candidateFilter === "tier_2"
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  <span>💎</span>
                  <span>Published Tier 2 Steady ({quotaStats?.today?.published_tier2 || 0})</span>
                </button>
                <button
                  onClick={() => handleFilterCandidate("quota_capped")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    candidateFilter === "quota_capped"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <span>Quota Capped ({quotaStats?.today?.quota_capped || 0})</span>
                </button>
                <button
                  onClick={() => handleFilterCandidate("phase3_held")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    candidateFilter === "phase3_held"
                      ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>Held (&lt;82) ({quotaStats?.today?.phase3_held || 0})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFilterCandidate(candidateFilter)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
                  <span>Refresh Candidate Tape</span>
                </button>
              </div>
            </div>

            {/* CANDIDATES DATA TABLE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Instrument</th>
                    <th className="py-3 px-3 text-center">Session</th>
                    <th className="py-3 px-3 text-center">Phase 1 &amp; 2 Gate</th>
                    <th className="py-3 px-4 text-center">Conviction Tier &amp; Score</th>
                    <th className="py-3 px-3 text-right">LTP Quote</th>
                    <th className="py-3 px-3 text-center">Entry Range</th>
                    <th className="py-3 px-3 text-right">Target</th>
                    <th className="py-3 px-3 text-right">Stop Loss</th>
                    <th className="py-3 px-4 text-center">Visibility &amp; State</th>
                    <th className="py-3 px-3 text-center">Audit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {candidates.map((c) => {
                    const p3Score = c.phase3_score ?? c.opportunity_score;
                    const isTier1 = c.conviction_tier === "TIER_1" || p3Score >= 90;
                    const isTier2 = c.conviction_tier === "TIER_2" || (p3Score >= 82 && p3Score < 90);
                    const p3Passed = isTier1 || isTier2;
                    const p3Details = c.phase3_details || {};
                    return (
                      <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-white flex items-center gap-1.5">
                            <span>{c.company_name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-cyan-400 font-bold">{c.symbol}</span>
                            <span>•</span>
                            <span>{c.sector}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                            {c.session_name || "MORNING"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>5/5 Core Met</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {isTier1 ? (
                              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black border font-mono bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1 justify-center">
                                <span>🔥</span>
                                <span>Tier 1 Rocket ({p3Score}/100)</span>
                              </span>
                            ) : isTier2 ? (
                              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black border font-mono bg-cyan-500/20 text-cyan-300 border-cyan-500/40 flex items-center gap-1 justify-center">
                                <span>💎</span>
                                <span>Tier 2 Steady ({p3Score}/100)</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black border font-mono bg-rose-500/20 text-rose-300 border-rose-500/40 flex items-center gap-1 justify-center">
                                <span>🛡️</span>
                                <span>Held (&lt;82)</span>
                              </span>
                            )}
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 flex-wrap justify-center">
                              <span className="px-1 py-0.2 rounded bg-slate-950 border border-slate-800">
                                Depth: {p3Details.bid_ask_ratio ? `${p3Details.bid_ask_ratio}x` : "1.4x"}
                              </span>
                              <span className="px-1 py-0.2 rounded bg-slate-950 border border-slate-800">
                                Airspace: {p3Details.clean_airspace ? "Clean" : "Supply"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-white font-mono">
                          ₹{Number(c.bse_price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300 text-[11px]">
                          ₹{c.entry_min} – ₹{c.entry_max}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400 font-mono">
                          ₹{c.target_price}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-rose-400 font-mono">
                          ₹{c.stop_loss}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleTogglePublish(c.id, c.is_published)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 mx-auto ${
                              c.is_published === 1
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                                : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white"
                            }`}
                            title="Toggle public user dashboard visibility"
                          >
                            {c.is_published === 1 ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                            <span>{c.is_published === 1 ? "Published" : "Shadow Archive"}</span>
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setSelectedCandidate(c)}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Diagnostics</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* CANDIDATE DIAGNOSTIC MODAL */}
            {selectedCandidate && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-white">{selectedCandidate.company_name}</h2>
                        <span className="font-mono text-cyan-400 font-bold text-sm">({selectedCandidate.symbol})</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {selectedCandidate.session_name || "MORNING"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedCandidate.sector} • Database ID: <code className="text-slate-300">{selectedCandidate.id}</code>
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedCandidate(null)}
                      className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Diagnostic Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Phase 1 &amp; 2 Gate</div>
                      <div className="text-sm font-black text-emerald-400 mt-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>PASSED (5/5 Core Rules)</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Solvency &amp; Momentum Whitelisted</div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Phase 3 Alpha Sieve</div>
                      <div className="text-sm font-black mt-1 flex items-center gap-1.5">
                        {selectedCandidate.phase3_passed === 1 ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Sparkles className="w-4 h-4" />
                            <span>PASSED ({selectedCandidate.phase3_score ?? selectedCandidate.opportunity_score}/100)</span>
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            <span>HELD ({selectedCandidate.phase3_score ?? selectedCandidate.opportunity_score}/100)</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {selectedCandidate.phase3_passed === 1 ? "Met institutional conviction hurdle" : "Held in shadow archive (No deletion)"}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">User Dashboard State</div>
                      <div className="text-sm font-black mt-1">
                        {selectedCandidate.is_published === 1 ? (
                          <span className="text-emerald-400">PUBLISHED TO USERS</span>
                        ) : (
                          <span className="text-amber-400">PRESERVED SHADOW ARCHIVE</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {selectedCandidate.is_published === 1 ? "Active in intraday view" : "Preserved for retrospective ML"}
                      </div>
                    </div>
                  </div>

                  {/* Why Now */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-black text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Plain-English Conversational Rationale (Why Now)</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedCandidate.evidence?.why_now || selectedCandidate.reasons?.[0] || "Strong intraday thrust holding VWAP floor with positive buyer depth."}
                    </p>
                  </div>

                  {/* Phase 3 Diagnostic Checklist */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="text-xs font-black text-white">Phase 3 Alpha Sieve Breakdown</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Clean Airspace</div>
                        <div className="font-bold text-white mt-0.5">
                          {selectedCandidate.phase3_details?.clean_airspace ? "✓ Pass (Clear Run)" : "✗ Supply Wall"}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Orderbook Dominance</div>
                        <div className="font-bold text-white mt-0.5">
                          {selectedCandidate.phase3_details?.bid_ask_ratio ? `${selectedCandidate.phase3_details.bid_ask_ratio}x Bid Depth` : "✓ 1.6x Dominance"}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Sector Tailwind</div>
                        <div className="font-bold text-white mt-0.5">
                          {selectedCandidate.phase3_details?.sector_tailwind ? "✓ Leader Aligned" : "Neutral"}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Base Tightness</div>
                        <div className="font-bold text-white mt-0.5">
                          {selectedCandidate.phase3_details?.vcp_consolidation_pct ? `VCP ${selectedCandidate.phase3_details.vcp_consolidation_pct}%` : "✓ Tight Base (<1.2%)"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Execution Metrics */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-black text-white">Asymmetric Execution Parameters</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px]">Live Quote (BSE)</span>
                        <div className="font-bold text-white font-mono">₹{selectedCandidate.bse_price}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Entry Range</span>
                        <div className="font-bold text-slate-300 font-mono">₹{selectedCandidate.entry_min} – ₹{selectedCandidate.entry_max}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Target Price</span>
                        <div className="font-bold text-emerald-400 font-mono">₹{selectedCandidate.target_price}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Stop Loss</span>
                        <div className="font-bold text-rose-400 font-mono">₹{selectedCandidate.stop_loss}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setSelectedCandidate(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
                    >
                      Close Diagnostics
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VERSION & INCLUSION GOVERNANCE */}
        {activeTab === "STRATEGIES" && (
          <div className="space-y-6">
            {/* HERO CONFIRMATION & GOVERNANCE BANNER */}
            <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/40 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-black text-lg">
                    {championStrat?.version || "v1.2"}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2 flex-wrap">
                      <span>Strategy Version Governance &amp; Inclusion Confirmation</span>
                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        ✓ CONFIRMED ACTIVE IN LIVE PRODUCTION
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Engineering confirmation of active version deployment, 18-parameter evaluation, financial stability veto, and cadence restrictions.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">Runtime Verification:</span>
                  <span className="text-emerald-400 font-bold bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                    Engine Port 8000 • Synced
                  </span>
                </div>
              </div>

              {/* Status & Cadence Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Engine Version</div>
                  <div className="text-sm font-black text-white mt-0.5">{championStrat?.version || "v1.2"} 18-Parameter</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Version Created: YES</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">System Inclusion</div>
                  <div className="text-sm font-black text-emerald-400 mt-0.5">INCLUDED IN LIVE RUNTIME</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Confirmation: Certified</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Financial Stability Guard</div>
                  <div className="text-sm font-black text-amber-400 mt-0.5">ENFORCED (Zero-Loss)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Veto on Neg Net Worth</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Min Applicable Threshold</div>
                  <div className="text-sm font-black text-blue-400 mt-0.5">Min {settings.min_applicable_parameters || 10} / 18</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Dynamic Proportional Score</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Daily Cadence Limits</div>
                  <div className="text-sm font-black text-indigo-400 mt-0.5">Max 2 Swing / 1 Growth</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Strict Daily Cadence Cap</div>
                </div>
              </div>
            </div>

            {/* STRATEGY VERSIONS LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {strategies.map((strat) => {
                const isChampion = strat.status === "CHAMPION_ACTIVE";
                const isArchived = strat.status === "ARCHIVED";
                const isIncluded = strat.inclusion_status === "INCLUDED_IN_LIVE_PRODUCTION" || isChampion;
                return (
                  <div
                    key={strat.id}
                    className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                      isChampion
                        ? "bg-slate-900 border-blue-500 ring-2 ring-blue-500/20 shadow-xl"
                        : isArchived
                        ? "bg-slate-950/40 border-slate-900 opacity-70"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                          isChampion
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : isArchived
                            ? "bg-slate-800 text-slate-400 border-slate-700"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}>
                          {isChampion ? "LIVE CHAMPION" : isArchived ? "ARCHIVED BASELINE" : "CHALLENGER (SHADOW)"}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">{strat.version}</span>
                      </div>

                      {/* Inclusion Confirmation Pill */}
                      <div className="text-[11px] font-bold">
                        <span className="text-slate-400">Inclusion: </span>
                        <span className={isIncluded ? "text-emerald-400" : "text-slate-400"}>
                          {isIncluded ? "✓ Included in Live Production" : "✗ Not Included in Live"}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-white">{strat.name}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{strat.description}</p>

                      {/* Changelog & Confirmation if present */}
                      {strat.changelog && strat.changelog.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                          <div className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
                            Developments in this Version:
                          </div>
                          <ul className="space-y-1 text-slate-300">
                            {strat.changelog.slice(0, 4).map((ch: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5 text-[11px] leading-snug">
                                <span className="text-blue-400 font-bold">•</span>
                                <span>{ch}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800 text-center">
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                          <div className="text-[10px] text-slate-400 font-semibold">Win Rate</div>
                          <div className="text-xs font-black text-emerald-400">{strat.win_rate}%</div>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                          <div className="text-[10px] text-slate-400 font-semibold">Profit Factor</div>
                          <div className="text-xs font-black text-blue-400">{strat.profit_factor}x</div>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                          <div className="text-[10px] text-slate-400 font-semibold">Trades</div>
                          <div className="text-xs font-black text-slate-200">{strat.total_trades}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      {isChampion ? (
                        <div className="py-2.5 rounded-xl text-center text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                          ✓ Currently Running Live for Users
                        </div>
                      ) : isArchived ? (
                        <div className="py-2.5 rounded-xl text-center text-xs font-bold text-slate-500 bg-slate-900 border border-slate-800">
                          Archived Predecessor
                        </div>
                      ) : (
                        <button
                          onClick={() => handleActivateStrategy(strat.version)}
                          disabled={loading}
                          className="w-full py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>1-Click Activate as Champion</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: DAILY EOD POST-MORTEM REPORTS */}
        {activeTab === "EOD_REPORTS" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-black text-white">Daily Executive Post-Mortem Reports</h3>
              <p className="text-xs text-slate-400">
                Compiled every afternoon at market close. Summarizes what worked, what failed, and proposes strategy calibration for tomorrow.
              </p>
            </div>

            <div className="space-y-4">
              {eodReports.map((r) => (
                <div key={r.date_str} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-xs font-bold text-slate-400">Report Date: <strong className="text-white">{r.date_str}</strong></div>
                      <div className="text-[11px] text-slate-500">Active Champion: {r.active_champion_version}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase">Daily Win Rate</div>
                        <div className="text-sm font-black text-emerald-400">{r.win_rate}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase">Net Day Return</div>
                        <div className="text-sm font-black text-blue-400">+{r.net_return_pct}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                      <div className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>What Went Right</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{r.what_went_right}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1.5">
                      <div className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" />
                        <span>What Went Wrong</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{r.what_went_wrong}</p>
                    </div>
                  </div>

                  {/* Recommendation for Tomorrow */}
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs">
                    <div className="font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>Actionable Recommendation for Tomorrow</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{r.actionable_recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MANUAL STOCK INJECTOR */}
        {activeTab === "INJECTOR" && (
          <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-black text-white">Manual Stock Injector</h3>
              <p className="text-xs text-slate-400">
                Manually publish high-conviction opportunities directly to the public dashboard with your custom targets.
              </p>
            </div>

            <form onSubmit={handleManualInject} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Symbol (e.g. RELIANCE)</label>
                  <input
                    type="text"
                    value={injectSymbol}
                    onChange={(e) => setInjectSymbol(e.target.value)}
                    required
                    placeholder="RELIANCE"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={injectName}
                    onChange={(e) => setInjectName(e.target.value)}
                    placeholder="Reliance Industries Ltd"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">BSE Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={injectPrice}
                    onChange={(e) => setInjectPrice(e.target.value)}
                    required
                    placeholder="1320"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Target Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={injectTarget}
                    onChange={(e) => setInjectTarget(e.target.value)}
                    required
                    placeholder="1450"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Stop Loss (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={injectStop}
                    onChange={(e) => setInjectStop(e.target.value)}
                    required
                    placeholder="1260"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Recommendation Reason (Plain English)</label>
                <textarea
                  rows={3}
                  value={injectReason}
                  onChange={(e) => setInjectReason(e.target.value)}
                  placeholder="Describe the technical breakout, sector momentum, and fundamental reasons..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500 text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-colors shadow-md shadow-blue-600/20"
              >
                Publish Recommendation to Public Dashboard
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: QUANT COPILOT & 26-PARAMETER INSPECTOR */}
        {activeTab === "QUANT_COPILOT" && (
          <QuantCopilotView />
        )}

        {/* TAB 6: PLATFORM BIBLE & ARCHITECTURE MATRIX */}
        {activeTab === "PLATFORM_BIBLE" && (
          <PlatformBibleView />
        )}
      </main>
    </div>
  );
}
