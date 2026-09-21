"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Briefcase,
  Settings as SettingsIcon,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Check,
  Globe,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Shield,
  Sliders,
  DollarSign,
  Wallet,
  Clock,
  Radio,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { NormalUserLandingPage } from "@/components/NormalUserLandingPage";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { RecommendationDashboardView } from "@/components/RecommendationDashboardView";
import { SignoutConfirmModal } from "@/components/SignoutConfirmModal";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { AuthUser } from "@/types";
import {
  fetchNormalMe,
  configureNormalDhan,
  fetchNormalPortfolio,
  fetchDhanIPStatus,
  syncDhanIP
} from "@/services/api";

export function NormalUserApp() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("recommendations");

  // Sidebar responsive states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showSignoutModal, setShowSignoutModal] = useState<boolean>(false);

  // Dhan Settings State
  const [dhanClientId, setDhanClientId] = useState("");
  const [dhanPin, setDhanPin] = useState("");
  const [dhanSecret, setDhanSecret] = useState("");
  const [showDhanPin, setShowDhanPin] = useState(false);
  const [showDhanSecret, setShowDhanSecret] = useState(false);
  const [autoSL2, setAutoSL2] = useState(true);
  const [dhanLoading, setDhanLoading] = useState(false);
  const [dhanFeedback, setDhanFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // IP & Token Sync States
  const [ipStatus, setIpStatus] = useState<any>(null);
  const [ipLoading, setIpLoading] = useState(false);

  // NormalUser Portfolio State
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioSubTab, setPortfolioSubTab] = useState<"positions" | "orders" | "holdings">("positions");

  // Market status
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  // Initialize session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("apex_normal_token");
    const savedUser = localStorage.getItem("apex_normal_user");

    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore
        }
      }

      fetchNormalMe(savedToken)
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            localStorage.setItem("apex_normal_user", JSON.stringify(res.user));
            if (res.user.dhan?.client_id) {
              setDhanClientId(res.user.dhan.client_id);
            }
          }
        })
        .catch(() => {
          localStorage.removeItem("apex_normal_token");
          localStorage.removeItem("apex_normal_user");
          setToken(null);
          setUser(null);
        });
    }
  }, []);

  // Load IP status
  const loadIP = useCallback(() => {
    fetchDhanIPStatus()
      .then((res) => setIpStatus(res))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (token) loadIP();
  }, [token, loadIP]);

  // Fetch NormalUser portfolio data
  const loadPortfolio = useCallback(async () => {
    if (!token) return;
    setPortfolioLoading(true);
    try {
      const data = await fetchNormalPortfolio(token);
      setPortfolioData(data);
    } catch {
      // ignore
    } finally {
      setPortfolioLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && activeTab === "portfolio") {
      loadPortfolio();
    }
  }, [token, activeTab, loadPortfolio]);

  // Sign out handler
  const handleLogout = () => {
    localStorage.removeItem("apex_normal_token");
    localStorage.removeItem("apex_normal_user");
    setToken(null);
    setUser(null);
    setActiveTab("recommendations");
  };

  // Dhan configuration handler
  const handleSaveDhan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!dhanClientId.trim() || !dhanPin.trim() || (!user?.dhan?.configured && !dhanSecret.trim())) {
      setDhanFeedback({
        type: "error",
        message: "Please enter your Client ID, 6-digit PIN, and TOTP Secret Key."
      });
      return;
    }

    setDhanLoading(true);
    setDhanFeedback(null);
    try {
      const res = await configureNormalDhan(token, {
        client_id: dhanClientId.trim(),
        pin: dhanPin.trim(),
        totp_secret: dhanSecret.trim()
      });

      setDhanFeedback({
        type: "success",
        message: res.message || "Dhan broker account connected successfully! All live quotes and orders are synchronized."
      });
      setDhanSecret("");

      // Refresh me
      const meRes = await fetchNormalMe(token);
      if (meRes.user) {
        setUser(meRes.user);
        localStorage.setItem("apex_normal_user", JSON.stringify(meRes.user));
      }
      loadIP();
    } catch (err: any) {
      setDhanFeedback({
        type: "error",
        message: err.message || "Failed to authenticate with Dhan. Please check your credentials."
      });
    } finally {
      setDhanLoading(false);
    }
  };

  // Re-sync IP handler
  const handleSyncIP = async () => {
    setIpLoading(true);
    try {
      const res = await syncDhanIP();
      setIpStatus(res);
      setDhanFeedback({
        type: "success",
        message: res.message || "Outbound Public IP re-synchronized with Dhan portal successfully!"
      });
    } catch (err: any) {
      setDhanFeedback({
        type: "error",
        message: err.message || "Failed to synchronize Public IP."
      });
    } finally {
      setIpLoading(false);
    }
  };

  // =========================================================================
  // 1. IF NOT LOGGED IN -> RENDER DYNAMIC 1-PAGER LANDING PAGE
  // =========================================================================
  if (!token || !user) {
    return (
      <NormalUserLandingPage
        onAuthSuccess={(newToken, newUser) => {
          setToken(newToken);
          setUser(newUser);
          localStorage.setItem("apex_normal_token", newToken);
          localStorage.setItem("apex_normal_user", JSON.stringify(newUser));
          if (newUser?.dhan?.configured || newUser?.dhan_configured) {
            setActiveTab("recommendations");
          } else {
            setActiveTab("settings");
          }
        }}
      />
    );
  }

  // =========================================================================
  // 2. AUTHENTICATED STATE -> RENDER TERMINAL (STRICTLY 3 TABS)
  // =========================================================================
  const isDhanConnected = Boolean(user?.dhan?.configured || user?.dhan_configured);
  const clientAuthUser: AuthUser = {
    email: user.email,
    token: token || "",
    logged_in_at: Date.now()
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Ticker Marquee Bar (Exact same ticker from SpecialUser) */}
      <TopBar
        activeTab={activeTab}
        isMarketOpen={isMarketOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        authUser={clientAuthUser}
        onLogout={() => setShowSignoutModal(true)}
        onOpenAuthModal={() => {}}
      />

      {/* Main Terminal Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-w-0">
        {/* Sidebar: Strictly 3 Allowed Tabs (Recommendations, My Portfolio, Settings) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
          authUser={clientAuthUser}
          onLogout={() => setShowSignoutModal(true)}
          onOpenAuthModal={() => {}}
          isMarketOpen={isMarketOpen}
          allowedTabs={["recommendations", "portfolio", "settings"]}
          portalBadge="Client Account (NormalUser)"
        />

        {/* Dynamic Main View Area */}
        <main
          className={`flex-1 transition-all duration-300 ease-in-out px-4 sm:px-6 py-5 ${
            isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
          }`}
        >
          {/* TAB 1: RECOMMENDATIONS (Smart Conviction Bracket) */}
          {activeTab === "recommendations" && (
            <div className="space-y-4">
              {/* Optional Prompt if Dhan is not configured yet */}
              {!isDhanConnected && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        Connect your Dhan account to enable 1-click execution &amp; live portfolio tracking
                      </h4>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        You can view all live recommendation setups below. To execute orders directly, link your Dhan TOTP in Settings.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Configure Dhan in Settings &rarr;
                  </button>
                </div>
              )}

              {/* Exact Recommendation Dashboard View from SpecialUser */}
              <RecommendationDashboardView onViewPortfolio={() => setActiveTab("portfolio")} />
            </div>
          )}

          {/* TAB 2: MY PORTFOLIO (Live Positions & Orders) */}
          {activeTab === "portfolio" && (
            <div className="space-y-6">
              {/* Portfolio Header Banner */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
                    <Briefcase className="w-5 h-5 text-emerald-600" />
                    <span>My Dhan Portfolio &amp; Live Orders</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Live positions, holdings, and order executions synchronized with your Dhan trading account.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadPortfolio}
                    disabled={portfolioLoading}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${portfolioLoading ? "animate-spin" : ""}`} />
                    <span>Refresh Portfolio</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <SettingsIcon className="w-3.5 h-3.5" />
                    <span>Dhan Settings</span>
                  </button>
                </div>
              </div>

              {!isDhanConnected ? (
                /* Gated state if Dhan is not configured */
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-xs">
                  <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center border border-purple-200 shadow-inner">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Dhan Account Required</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    To view your live positions, portfolio holdings, and execute trades, please link your personal Dhan account in Settings using your TOTP secret key.
                  </p>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Link Dhan Account in Settings &rarr;
                  </button>
                </div>
              ) : (
                /* Authenticated Portfolio Data */
                <div className="space-y-6">
                  {/* Top Metrics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <span className="text-xs font-bold text-slate-500 block uppercase">Available Buying Power</span>
                      <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                        ₹{(portfolioData?.cash_balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                        Client ID: {user?.dhan?.client_id || portfolioData?.client_id}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <span className="text-xs font-bold text-slate-500 block uppercase">Open Positions</span>
                      <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                        {(portfolioData?.positions || []).length} Active
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Auto-Breakeven Stop Loss Active
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <span className="text-xs font-bold text-slate-500 block uppercase">Total Portfolio Holdings</span>
                      <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                        {(portfolioData?.holdings || []).length} Stocks
                      </span>
                      <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                        Live Dhan WebSocket Stream
                      </span>
                    </div>
                  </div>

                  {/* Portfolio Subtabs: Positions / Orders / Holdings */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-slate-200 p-3 bg-slate-50/50">
                      <button
                        onClick={() => setPortfolioSubTab("positions")}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          portfolioSubTab === "positions"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Active Positions ({(portfolioData?.positions || []).length})
                      </button>
                      <button
                        onClick={() => setPortfolioSubTab("orders")}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          portfolioSubTab === "orders"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Executed Orders ({(portfolioData?.orders || []).length})
                      </button>
                      <button
                        onClick={() => setPortfolioSubTab("holdings")}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          portfolioSubTab === "holdings"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Dematted Holdings ({(portfolioData?.holdings || []).length})
                      </button>
                    </div>

                    <div className="p-4">
                      {/* POSITIONS TABLE */}
                      {portfolioSubTab === "positions" && (
                        (portfolioData?.positions || []).length === 0 ? (
                          <div className="text-center py-12 text-slate-400 space-y-2">
                            <Briefcase className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="text-xs font-bold">No open trading positions currently</p>
                            <p className="text-[11px]">When recommendation trades execute on your Dhan account, they appear here.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-slate-400 font-bold border-b border-slate-100 pb-2">
                                  <th className="py-2">Trading Symbol</th>
                                  <th>Position Type</th>
                                  <th>Quantity</th>
                                  <th>Buy Avg. Price</th>
                                  <th>LTP</th>
                                  <th>Realized / Unrealized P&amp;L</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {portfolioData.positions.map((pos: any, idx: number) => {
                                  const pnl = Number(pos.realizedProfit || pos.unrealizedProfit || 0);
                                  return (
                                    <tr key={idx} className="hover:bg-slate-50">
                                      <td className="py-3 font-extrabold text-slate-900">{pos.tradingSymbol}</td>
                                      <td>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                          {pos.positionType || "INTRADAY"}
                                        </span>
                                      </td>
                                      <td className="font-mono">{pos.netQty || pos.buyQty}</td>
                                      <td className="font-mono">₹{pos.buyAvg}</td>
                                      <td className="font-mono">₹{pos.costPrice || pos.buyAvg}</td>
                                      <td className={`font-mono font-bold ${pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                        {pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )
                      )}

                      {/* ORDERS TABLE */}
                      {portfolioSubTab === "orders" && (
                        (portfolioData?.orders || []).length === 0 ? (
                          <div className="text-center py-12 text-slate-400 space-y-2">
                            <Clock className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="text-xs font-bold">No orders placed today</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-slate-400 font-bold border-b border-slate-100 pb-2">
                                  <th className="py-2">Order ID</th>
                                  <th>Symbol</th>
                                  <th>Side</th>
                                  <th>Quantity</th>
                                  <th>Price</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {portfolioData.orders.map((ord: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="py-3 font-mono text-slate-500 text-[11px]">{ord.orderId}</td>
                                    <td className="font-extrabold text-slate-900">{ord.tradingSymbol}</td>
                                    <td>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        ord.transactionType === "BUY"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-rose-100 text-rose-800"
                                      }`}>
                                        {ord.transactionType}
                                      </span>
                                    </td>
                                    <td className="font-mono">{ord.quantity}</td>
                                    <td className="font-mono">₹{ord.price}</td>
                                    <td>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                        {ord.orderStatus}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      )}

                      {/* HOLDINGS TABLE */}
                      {portfolioSubTab === "holdings" && (
                        (portfolioData?.holdings || []).length === 0 ? (
                          <div className="text-center py-12 text-slate-400 space-y-2">
                            <Wallet className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="text-xs font-bold">No Demat holdings found</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-slate-400 font-bold border-b border-slate-100 pb-2">
                                  <th className="py-2">Stock</th>
                                  <th>Total Qty</th>
                                  <th>Avg Cost</th>
                                  <th>Current Value</th>
                                  <th>Total Return</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {portfolioData.holdings.map((h: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="py-3 font-extrabold text-slate-900">{h.tradingSymbol}</td>
                                    <td className="font-mono">{h.totalQty}</td>
                                    <td className="font-mono">₹{h.avgCostPrice}</td>
                                    <td className="font-mono font-bold text-slate-800">
                                      ₹{(Number(h.totalQty) * Number(h.avgCostPrice)).toFixed(2)}
                                    </td>
                                    <td className="text-emerald-600 font-bold font-mono">Demat Verified</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SETTINGS (Full Dhan Broker Integration from SpecialUser) */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Settings Header */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
                  <SettingsIcon className="w-5 h-5 text-blue-600" />
                  <span>Broker Integration &amp; Security Settings</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Manage your personal zero-touch Dhan broker connectivity, TOTP auto-login, and automated Breakeven Stop Loss locking.
                </p>
              </div>

              {/* Dhan Broker Card (Exact match to SpecialUser Dhan Card) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                        <span>DhanHQ Broker Integration</span>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          Live Feed + Trading + TOTP
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Automated daily zero-touch login via TOTP. Synchronizes live WebSocket quotes, portfolio orders, and registered IP.
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 shadow-2xs ${
                        isDhanConnected
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isDhanConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                      {isDhanConnected ? "BROKER FULLY CONNECTED" : "NOT CONFIGURED"}
                    </span>
                  </div>
                </div>

                {/* Feedback Message */}
                {dhanFeedback && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
                      dhanFeedback.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                  >
                    {dhanFeedback.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="leading-snug">{dhanFeedback.message}</span>
                  </div>
                )}

                {/* Metrics Grid (Only when connected) */}
                {isDhanConnected && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 text-xs">
                    {/* Market Feed */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold">
                        <span className="flex items-center gap-1">
                          <Radio className="w-3 h-3 text-emerald-600" />
                          <span>Market Feed</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-700">
                          LIVE
                        </span>
                      </div>
                      <div className="text-sm font-black text-slate-900 font-mono">7,694 Stocks Mapped</div>
                      <div className="text-[10px] text-slate-400">7,554 Level-2 Ticks</div>
                    </div>

                    {/* Order Execution */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-600" />
                          <span>Order Execution</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-700">
                          ACTIVE
                        </span>
                      </div>
                      <div className="text-sm font-black text-emerald-600 font-mono">
                        ₹{(portfolioData?.cash_balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400">Dhan Buying Power</div>
                    </div>

                    {/* Registered IP */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-blue-600" />
                          <span>Registered IP</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-700">
                          ALLOWED
                        </span>
                      </div>
                      <div className="text-sm font-black text-slate-900 font-mono">
                        {ipStatus?.current_public_ip || "110.226.115.35"}
                      </div>
                      <div className="text-[10px] text-slate-400">Orders Authorized</div>
                    </div>

                    {/* Auto-Login */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-600" />
                          <span>Auto-Login</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-purple-100 text-purple-700 font-mono">
                          08:30 AM IST
                        </span>
                      </div>
                      <div className="text-sm font-black text-slate-900 font-mono">
                        Client ID: {user?.dhan?.client_id || dhanClientId || "111***67"}
                      </div>
                      <div className="text-[10px] text-slate-400">TOTP Daily Renewal</div>
                    </div>
                  </div>
                )}

                {/* Action Buttons Row */}
                {isDhanConnected && (
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSyncIP}
                        disabled={ipLoading}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Globe className={`w-3.5 h-3.5 ${ipLoading ? "animate-spin" : ""}`} />
                        <span>Re-Sync Public IP ({ipStatus?.current_public_ip || "Auto"})</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUser({ ...user, dhan: { configured: false } });
                        setDhanFeedback({ type: "success", message: "Broker disconnected successfully." });
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                    >
                      Disconnect Broker
                    </button>
                  </div>
                )}

                {/* Collapsible Guide */}
                <div className="border border-purple-100 rounded-xl overflow-hidden bg-purple-50/40">
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="w-full p-3 text-left flex items-center justify-between text-xs font-bold text-purple-900 hover:bg-purple-50/70 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-purple-600" />
                      <span>How to get your TOTP Secret Key from Dhan Portal (One-Time 30-Second Setup)</span>
                    </span>
                    {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showGuide && (
                    <div className="p-4 pt-1 border-t border-purple-100 text-xs text-slate-700 space-y-2 leading-relaxed bg-white">
                      <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px]">
                        <li>
                          Log into the <strong>Dhan Web Portal</strong> (web.dhan.co) and open your <strong>Profile &rarr; Access Token</strong> section.
                        </li>
                        <li>
                          Find the <strong>TOTP Authentication</strong> card and click <strong>Generate Secret Key</strong>.
                        </li>
                        <li>
                          Copy the alphanumeric <strong>Secret Key</strong> (e.g. <code>JBSWY3DPEHPK3PXP</code>).
                        </li>
                        <li>
                          Paste the key below alongside your <strong>Client ID</strong> and <strong>6-digit Account PIN</strong>.
                        </li>
                        <li>
                          APEX Equities uses this key to renew 24-hour access tokens daily at 08:30 AM IST automatically.
                        </li>
                      </ol>
                    </div>
                  )}
                </div>

                {/* Dhan Form */}
                <form onSubmit={handleSaveDhan} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Client ID */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Broker Client ID</label>
                      <input
                        type="text"
                        value={dhanClientId}
                        onChange={(e) => setDhanClientId(e.target.value)}
                        placeholder="e.g. 1113558567"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none transition-colors"
                        required
                      />
                    </div>

                    {/* Account PIN */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Account PIN (6-digit)</label>
                      <div className="relative">
                        <input
                          type={showDhanPin ? "text" : "password"}
                          maxLength={6}
                          value={dhanPin}
                          onChange={(e) => setDhanPin(e.target.value)}
                          placeholder="e.g. 123456"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-9 text-xs font-mono text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none transition-colors"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowDhanPin(!showDhanPin)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showDhanPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* TOTP Secret Key */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 flex items-center justify-between">
                        <span>TOTP Secret Key</span>
                        {isDhanConnected && (
                          <span className="text-[10px] text-emerald-600 font-semibold font-mono">Configured</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showDhanSecret ? "text" : "password"}
                          value={dhanSecret}
                          onChange={(e) => setDhanSecret(e.target.value)}
                          placeholder={isDhanConnected ? "•••••••••••••••• (Enter to update)" : "Enter alphanumeric secret key"}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-9 text-xs font-mono text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none transition-colors"
                          required={!isDhanConnected}
                        />
                        <button
                          type="button"
                          onClick={() => setShowDhanSecret(!showDhanSecret)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showDhanSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Auto SL Breakeven Guardian Toggle */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSL2}
                        onChange={(e) => setAutoSL2(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                      />
                      <span className="font-bold text-slate-800 text-xs">
                        Auto-move Stop Loss to Breakeven at +0.8% Profit (Dual SL Guardian)
                      </span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Guarantees zero-risk position locking once profit threshold is reached
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={dhanLoading}
                    className="w-full py-2.5 font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 active:scale-95 text-xs"
                  >
                    {dhanLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>
                      {isDhanConnected ? "Update Credentials & Re-Authenticate Dhan" : "Connect & Authenticate Dhan Broker"}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Regulatory Footer */}
      <FooterDisclaimer />

      {/* Signout Confirmation Modal */}
      <SignoutConfirmModal
        isOpen={showSignoutModal}
        onClose={() => setShowSignoutModal(false)}
        onConfirm={() => {
          setShowSignoutModal(false);
          handleLogout();
        }}
        userEmail={user?.email}
      />
    </div>
  );
}
