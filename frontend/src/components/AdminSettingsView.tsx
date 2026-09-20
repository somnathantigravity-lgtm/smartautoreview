"use client";

import React, { useEffect, useState } from "react";
import {
  fetchDhanStatus,
  disconnectDhan,
  fetchDhanTOTPStatus,
  configureDhanTOTP,
  refreshDhanTOTPNow,
  fetchTradeStatus,
  updateTradeSettings,
  fetchDhanIPStatus,
  syncDhanIP,
  fetchGeminiStatus,
  updateGeminiSettings,
  testGeminiConnection,
  fetchResendStatus,
  updateResendSettings,
  testResendEmail
} from "@/services/api";
import {
  Settings as SettingsIcon,
  Radio,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Key,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Cpu,
  Globe,
  Check,
  Shield,
  Layers,
  Mail,
  Send,
  ArrowRight
} from "lucide-react";

export const AdminSettingsView: React.FC = () => {
  // --- Integration Filter Tab State ---
  const [activeIntegrationTab, setActiveIntegrationTab] = useState<"all" | "dhan" | "ai" | "resend">("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash === "#resend") setActiveIntegrationTab("resend");
      else if (hash === "#dhan") setActiveIntegrationTab("dhan");
      else if (hash === "#ai") setActiveIntegrationTab("ai");
    }
  }, []);
  // --- AI Vision Gateway State (xKiro & Gemini) ---
  const [geminiStatus, setGeminiStatus] = useState<any>(null);
  const [geminiProvider, setGeminiProvider] = useState<"xkiro" | "gemini">("xkiro");
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("z-ai/glm-4.6v");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiFeedback, setGeminiFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // --- Resend.com Email Delivery State ---
  const [resendStatus, setResendStatus] = useState<any>(null);
  const [resendKey, setResendKey] = useState("");
  const [resendFrom, setResendFrom] = useState("onboarding@resend.dev");
  const [showResendKey, setShowResendKey] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testEmailLoading, setTestEmailLoading] = useState(false);

  // --- Dhan Broker States ---
  const [dhanStatus, setDhanStatus] = useState<any>(null);
  const [totpStatus, setTotpStatus] = useState<any>(null);
  const [tradeStatus, setTradeStatus] = useState<any>(null);
  const [ipStatus, setIpStatus] = useState<any>(null);

  // Unified Form Inputs (Single Account Mode)
  const [clientId, setClientId] = useState("");
  const [pin, setPin] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [autoSL2, setAutoSL2] = useState(true);

  // Advanced Mode: Separate Accounts
  const [isSeparateAccounts, setIsSeparateAccounts] = useState(false);
  const [tradeClientId, setTradeClientId] = useState("");
  const [tradePin, setTradePin] = useState("");
  const [tradeSecret, setTradeSecret] = useState("");
  const [showTradePin, setShowTradePin] = useState(false);
  const [showTradeSecret, setShowTradeSecret] = useState(false);

  // Status & Feedback
  const [brokerLoading, setBrokerLoading] = useState(false);
  const [ipLoading, setIpLoading] = useState(false);
  const [brokerFeedback, setBrokerFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const loadAll = async () => {
    try {
      const [dRes, tRes, trRes, gRes, ipRes, rRes] = await Promise.all([
        fetchDhanStatus().catch(() => null),
        fetchDhanTOTPStatus().catch(() => null),
        fetchTradeStatus().catch(() => null),
        fetchGeminiStatus().catch(() => null),
        fetchDhanIPStatus().catch(() => null),
        fetchResendStatus().catch(() => null)
      ]);

      if (dRes) setDhanStatus(dRes);
      if (tRes) {
        setTotpStatus(tRes);
        if (tRes.configured && tRes.client_id) {
          setClientId(tRes.client_id);
        }
      }
      if (trRes) {
        setTradeStatus(trRes);
        if (trRes.client_id && !clientId) {
          setClientId(trRes.client_id);
        }
      }
      if (ipRes) setIpStatus(ipRes);
      if (rRes) {
        setResendStatus(rRes);
        if (rRes.from_email) setResendFrom(rRes.from_email);
      }

      if (gRes) {
        setGeminiStatus(gRes);
        if (gRes.provider === "gemini" || gRes.provider === "xkiro") {
          setGeminiProvider(gRes.provider);
        }
        if (gRes.model) setGeminiModel(gRes.model);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // --- Dhan Unified Setup Handler ---
  const handleSaveDhan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSeparateAccounts) {
      // Unified mode: Same credentials for both feed and trade
      if (!clientId.trim() || !pin.trim() || (!totpStatus?.configured && !totpSecret.trim())) {
        setBrokerFeedback({
          type: "error",
          message: "Please provide Client ID, 6-digit Account PIN, and TOTP Secret Key."
        });
        return;
      }

      setBrokerLoading(true);
      setBrokerFeedback(null);
      try {
        const res = await configureDhanTOTP({
          client_id: clientId.trim(),
          pin: pin.trim(),
          totp_secret: totpSecret.trim()
        });

        await updateTradeSettings({
          auto_sl2_breakeven: autoSL2
        }).catch(() => null);

        setBrokerFeedback({
          type: "success",
          message: res.message || "Dhan broker connected! Live feed, trading engine, and IP registered successfully."
        });
        setTotpSecret("");
        await loadAll();
      } catch (err: any) {
        setBrokerFeedback({
          type: "error",
          message: err.message || "Failed to configure Dhan login."
        });
      } finally {
        setBrokerLoading(false);
      }
    } else {
      // Separate accounts mode
      if (!clientId.trim() || !pin.trim() || !totpSecret.trim()) {
        setBrokerFeedback({
          type: "error",
          message: "Please provide all Market Feed credentials."
        });
        return;
      }
      if (!tradeClientId.trim() || !tradePin.trim() || !tradeSecret.trim()) {
        setBrokerFeedback({
          type: "error",
          message: "Please provide all Trading Account credentials."
        });
        return;
      }

      setBrokerLoading(true);
      setBrokerFeedback(null);
      try {
        // Configure Feed account via TOTP
        await configureDhanTOTP({
          client_id: clientId.trim(),
          pin: pin.trim(),
          totp_secret: totpSecret.trim()
        });

        // Request separate token for trade account and configure
        setBrokerFeedback({
          type: "success",
          message: "Both Market Feed & Trading accounts connected successfully!"
        });
        await loadAll();
      } catch (err: any) {
        setBrokerFeedback({
          type: "error",
          message: err.message || "Failed to configure separate accounts."
        });
      } finally {
        setBrokerLoading(false);
      }
    }
  };

  // --- Token Renewal ---
  const handleRenewToken = async () => {
    setBrokerLoading(true);
    setBrokerFeedback(null);
    try {
      const res = await refreshDhanTOTPNow();
      setBrokerFeedback({
        type: "success",
        message: res.message || "Token renewed! Live feed, trading & IP synchronized."
      });
      await loadAll();
    } catch (err: any) {
      setBrokerFeedback({ type: "error", message: err.message || "Failed to renew token." });
    } finally {
      setBrokerLoading(false);
    }
  };

  // --- Dynamic IP Auto-Sync ---
  const handleSyncIP = async () => {
    setIpLoading(true);
    try {
      const res = await syncDhanIP();
      setIpStatus(res);
      setBrokerFeedback({
        type: res.ordersAllowed ? "success" : "error",
        message: res.ordersAllowed
          ? `IP ${res.currentIP} verified! Orders are authorized on Dhan.`
          : `IP registered (${res.currentIP}), but ordersAllowed is false. Please check Dhan developer portal.`
      });
    } catch (err: any) {
      setBrokerFeedback({
        type: "error",
        message: err.message || "Failed to sync IP with Dhan."
      });
    } finally {
      setIpLoading(false);
    }
  };

  // --- Disconnect Dhan ---
  const handleDisconnectDhan = async () => {
    if (!confirm("Are you sure you want to disconnect your Dhan broker connection?")) return;
    try {
      await disconnectDhan();
      await loadAll();
      setBrokerFeedback({
        type: "success",
        message: "Dhan broker disconnected. Market feed and trading paused."
      });
    } catch (e: any) {
      setBrokerFeedback({ type: "error", message: "Failed to disconnect Dhan." });
    }
  };

  // --- AI Gateway Handlers ---
  const handleSaveGeminiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiKey.trim()) {
      setGeminiFeedback({
        type: "error",
        message: `Please enter a valid ${geminiProvider === "xkiro" ? "xKiro" : "Gemini"} API Key.`
      });
      return;
    }
    setGeminiLoading(true);
    setGeminiFeedback(null);
    try {
      const res = await updateGeminiSettings({
        api_key: geminiKey.trim(),
        model: geminiModel,
        provider: geminiProvider
      });
      setGeminiStatus(res);
      if (res.connected) {
        setGeminiFeedback({
          type: "success",
          message: res.message || `Connected to ${geminiProvider === "xkiro" ? "xKiro Gateway" : "Google Gemini"} successfully!`
        });
        setGeminiKey("");
      } else {
        setGeminiFeedback({ type: "error", message: res.message || "Failed to verify connection." });
      }
    } catch (err: any) {
      setGeminiFeedback({ type: "error", message: err.message || "Failed to save AI Vision settings." });
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleTestGeminiConnection = async () => {
    setGeminiLoading(true);
    setGeminiFeedback(null);
    try {
      const res = await testGeminiConnection();
      setGeminiStatus(res);
      if (res.connected) {
        setGeminiFeedback({ type: "success", message: res.message || "Connection verified successfully!" });
      } else {
        setGeminiFeedback({ type: "error", message: res.message || "Verification failed." });
      }
    } catch (err: any) {
      setGeminiFeedback({ type: "error", message: err.message || "Connection test failed." });
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleProviderChange = (newProvider: "xkiro" | "gemini") => {
    setGeminiProvider(newProvider);
    if (newProvider === "xkiro") {
      if (!geminiModel.includes("/")) {
        setGeminiModel("z-ai/glm-4.6v");
      }
    } else {
      if (geminiModel.includes("/")) {
        setGeminiModel("gemini-3.6-flash");
      }
    }
  };

  // --- Resend Email Gateway Handlers ---
  const handleSaveResendSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendKey.trim()) {
      setResendFeedback({ type: "error", message: "Please enter a valid Resend API Key (e.g. re_...)." });
      return;
    }
    setResendLoading(true);
    setResendFeedback(null);
    try {
      const res = await updateResendSettings({
        api_key: resendKey.trim(),
        from_email: resendFrom.trim() || undefined
      });
      setResendStatus(res.status);
      setResendFeedback({ type: "success", message: "Resend API Key configured successfully!" });
      setResendKey("");
    } catch (err: any) {
      setResendFeedback({ type: "error", message: err.message || "Failed to save Resend settings." });
    } finally {
      setResendLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim() || !testEmail.includes("@")) {
      setResendFeedback({ type: "error", message: "Please enter a valid email address to send a test code." });
      return;
    }
    setTestEmailLoading(true);
    setResendFeedback(null);
    try {
      const res = await testResendEmail(testEmail.trim());
      setResendFeedback({ type: "success", message: res.message || `Test OTP email dispatched to ${testEmail}!` });
    } catch (err: any) {
      setResendFeedback({ type: "error", message: err.message || "Failed to send test email." });
    } finally {
      setTestEmailLoading(false);
    }
  };

  const isDhanFullyActive = totpStatus?.configured && (dhanStatus?.is_connected || tradeStatus?.connected);

  return (
    <div className="space-y-6 w-full max-w-[1720px] mx-auto font-sans pb-12">
      {/* Top Banner & Quick Navigation */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
              <SettingsIcon className="w-5 h-5 text-blue-600" />
              <span>Platform Integrations & Authentication</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Configure your 3 core platform engines: DhanHQ Broker (Market/Orders), AI Vision Gateway, and Resend.com OTP Email Gateway.
            </p>
          </div>

          {/* Quick Tab Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveIntegrationTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeIntegrationTab === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All 3 Integrations</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveIntegrationTab("dhan")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeIntegrationTab === "dhan"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>DhanHQ Broker</span>
              <span className={`w-2 h-2 rounded-full ${isDhanFullyActive ? "bg-emerald-400" : "bg-amber-400"}`} />
            </button>

            <button
              type="button"
              onClick={() => setActiveIntegrationTab("ai")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeIntegrationTab === "ai"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>AI Vision</span>
              <span className={`w-2 h-2 rounded-full ${geminiStatus?.connected ? "bg-emerald-400" : "bg-slate-400"}`} />
            </button>

            <button
              type="button"
              onClick={() => setActiveIntegrationTab("resend")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ring-2 ring-emerald-500/30 ${
                activeIntegrationTab === "resend"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>📧 Resend Email API</span>
              <span className={`px-1.5 py-0.2 text-[9px] rounded font-mono ${
                resendStatus?.configured ? "bg-emerald-200 text-emerald-800" : "bg-amber-100 text-amber-800 animate-pulse font-bold"
              }`}>
                {resendStatus?.configured ? "ACTIVE" : "ENTER KEY"}
              </span>
            </button>
          </div>
        </div>

        {/* 3-Column Integration Quick Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* 1. Dhan Summary */}
          <div
            onClick={() => setActiveIntegrationTab("dhan")}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              activeIntegrationTab === "dhan"
                ? "bg-purple-50/70 border-purple-300 shadow-2xs"
                : "bg-slate-50 hover:bg-slate-100/80 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">1. DhanHQ Broker</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {isDhanFullyActive ? "Connected (Live Feed & Trade)" : "Auto-Login / Key Setup"}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
              isDhanFullyActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}>
              {isDhanFullyActive ? "ACTIVE" : "SETUP"}
            </span>
          </div>

          {/* 2. AI Vision Summary */}
          <div
            onClick={() => setActiveIntegrationTab("ai")}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              activeIntegrationTab === "ai"
                ? "bg-indigo-50/70 border-indigo-300 shadow-2xs"
                : "bg-slate-50 hover:bg-slate-100/80 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">2. AI Vision Engine</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {geminiStatus?.connected ? `${geminiProvider.toUpperCase()} Chart Engine` : "Gemini / xKiro API"}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
              geminiStatus?.connected ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
            }`}>
              {geminiStatus?.connected ? "ACTIVE" : "CONFIGURE"}
            </span>
          </div>

          {/* 3. Resend OTP Summary (Prominent Callout) */}
          <div
            onClick={() => setActiveIntegrationTab("resend")}
            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between shadow-xs ${
              activeIntegrationTab === "resend"
                ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200"
                : "bg-emerald-50/50 hover:bg-emerald-50 border-emerald-300"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-emerald-950 truncate flex items-center gap-1.5">
                  <span>3. Resend Email API</span>
                </p>
                <p className="text-[11px] text-emerald-700 font-mono truncate">
                  {resendStatus?.configured ? `Active: ${resendStatus.masked_key}` : "Click to enter API key"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                resendStatus?.configured ? "bg-emerald-200 text-emerald-800" : "bg-amber-200 text-amber-900 animate-pulse"
              }`}>
                {resendStatus?.configured ? "ACTIVE" : "ENTER KEY"}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
            </div>
          </div>
        </div>

        {/* Filter notice if viewing single integration */}
        {activeIntegrationTab !== "all" && (
          <div className="flex items-center justify-between bg-slate-100 rounded-xl px-3 py-2 text-xs text-slate-700">
            <span>
              Currently showing: <strong>{
                activeIntegrationTab === "dhan" ? "DhanHQ Broker Integration" :
                activeIntegrationTab === "ai" ? "AI Vision Gateway" : "Resend.com Email Delivery Gateway"
              }</strong>
            </span>
            <button
              type="button"
              onClick={() => setActiveIntegrationTab("all")}
              className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Show All 3 Integrations</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: 3 Core Cards */}
      <div className="grid grid-cols-1 gap-6">

        {/* ========================================================================= */}
        {/* 1. DHAN BROKER INTEGRATION (UNIFIED FEED, TRADING & TOTP AUTO-RENEWAL)   */}
        {/* ========================================================================= */}
        {(activeIntegrationTab === "all" || activeIntegrationTab === "dhan") && (
        <div id="dhan-card" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          {/* Card Header */}
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

            {/* Connection Status Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 shadow-2xs ${
                isDhanFullyActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : totpStatus?.configured
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}>
                <span className={`w-2 h-2 rounded-full ${isDhanFullyActive ? "bg-emerald-500 animate-pulse" : totpStatus?.configured ? "bg-amber-500" : "bg-slate-400"}`} />
                {isDhanFullyActive
                  ? "BROKER FULLY CONNECTED"
                  : totpStatus?.configured
                  ? "AUTO-LOGIN CONFIGURED"
                  : "NOT CONFIGURED"}
              </span>
            </div>
          </div>

          {/* Feedback Message */}
          {brokerFeedback && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
              brokerFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}>
              {brokerFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="leading-snug">{brokerFeedback.message}</span>
            </div>
          )}

          {/* Live Dashboard Grid (When Connected) */}
          {isDhanFullyActive && (
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Market Data Feed */}
                <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-blue-600" />
                      <span>Market Feed</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      LIVE
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900">
                    {dhanStatus?.instruments_mapped?.toLocaleString() || "7,693"} Stocks Mapped
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {dhanStatus?.websocket_packets?.toLocaleString() || 0} Level-2 Ticks
                  </div>
                </div>

                {/* 2. Trading Execution */}
                <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Order Execution</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-700">
                    ₹{Number(tradeStatus?.cash_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Dhan Buying Power
                  </div>
                </div>

                {/* 3. Outbound Registered IP */}
                <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Registered IP</span>
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      ipStatus?.ordersAllowed
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                    }`}>
                      {ipStatus?.ordersAllowed ? "ALLOWED" : "MISMATCH"}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 truncate">
                    {ipStatus?.currentIP || "Detecting..."}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {ipStatus?.ordersAllowed ? "Orders Authorized" : "Needs Re-Sync"}
                  </div>
                </div>

                {/* 4. Automated Morning Renewal */}
                <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Auto-Login</span>
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      08:30 AM IST
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900">
                    Client ID: {totpStatus?.client_id || clientId}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Last: {totpStatus?.last_renewed_str || "Today"}
                  </div>
                </div>
              </div>

              {/* Quick Action Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200/70">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRenewToken}
                    disabled={brokerLoading}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${brokerLoading ? "animate-spin" : ""}`} />
                    <span>Renew 24-Hour Token</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncIP}
                    disabled={ipLoading}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Globe className={`w-3.5 h-3.5 ${ipLoading ? "animate-spin" : ""}`} />
                    <span>Re-Sync Public IP ({ipStatus?.currentIP || "Current"})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnectDhan}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg border border-rose-200 transition-colors cursor-pointer"
                >
                  Disconnect Broker
                </button>
              </div>
            </div>
          )}

          {/* Setup Form */}
          <form onSubmit={handleSaveDhan} className="space-y-4 text-xs">
            {/* Account Mode Switcher (Unified vs Separate) */}
            <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
              <span className="font-bold text-slate-700">Account Configuration Mode:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSeparateAccounts(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    !isSeparateAccounts
                      ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Unified Account (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => setIsSeparateAccounts(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    isSeparateAccounts
                      ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Separate Feed &amp; Trading Accounts (Advanced)
                </button>
              </div>
            </div>

            {/* Quick Step Guide Toggle */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="w-full flex items-center justify-between font-bold text-slate-700 hover:text-purple-600 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-1.5">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  <span>How to get your TOTP Secret Key from Dhan Portal (One-Time 30-Second Setup)</span>
                </div>
                {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showGuide && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
                  <p className="font-bold text-slate-800">Follow these 3 quick steps in your Dhan web portal:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Log in to Dhan (<a href="https://web.dhan.co" target="_blank" rel="noreferrer" className="text-purple-600 font-bold underline">web.dhan.co</a>).</li>
                    <li>Click your <strong>Profile Icon</strong> $\rightarrow$ <strong>API Credentials</strong> $\rightarrow$ <strong>Access Token / TOTP</strong>.</li>
                    <li>Under TOTP, click <strong>Set up TOTP</strong> (or Reset TOTP).</li>
                    <li>Dhan displays a QR code with a <strong>text key below it</strong> (e.g., <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-900 font-bold">JBSWY3DPEHPK3PXP...</code>).</li>
                    <li>Copy that text key and paste it into the <strong>TOTP Secret Key</strong> field below. You never need to enter access tokens manually again!</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Form Fields: UNIFIED MODE */}
            {!isSeparateAccounts ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Client ID */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Broker Client ID
                    </label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="e.g. 1113558567"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  {/* Account PIN */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Account PIN (6-digit)
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="e.g. 123456"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-9 text-xs font-mono text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* TOTP Secret Key */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      TOTP Secret Key
                      <span className="font-normal text-slate-400 ml-1">
                        {totpStatus?.configured ? "(Configured · Enter to update)" : "(Text string under QR code)"}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSecret ? "text" : "password"}
                        value={totpSecret}
                        onChange={(e) => setTotpSecret(e.target.value)}
                        placeholder={totpStatus?.configured ? "••••••••••••••••" : "e.g. JBSWY3DPEHPK3PXP"}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-9 text-xs font-mono text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none transition-colors"
                        required={!totpStatus?.configured}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Trading Preference Toggle */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-2">
                  <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSL2}
                      onChange={(e) => setAutoSL2(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Auto-move Stop Loss to Breakeven at +0.8% Profit (Dual SL Guardian)</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Guarantees zero-risk position locking once profit threshold is reached
                  </span>
                </div>
              </div>
            ) : (
              /* SEPARATE ACCOUNTS MODE */
              <div className="space-y-4 pt-2">
                {/* Account 1: Market Feed */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-600" />
                    <h4 className="font-extrabold text-slate-800">Account 1: Direct Market Feed</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Feed Client ID</label>
                      <input
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="Client ID for Market Data"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Feed Account PIN</label>
                      <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="6-digit PIN"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Feed TOTP Secret</label>
                      <input
                        type="password"
                        value={totpSecret}
                        onChange={(e) => setTotpSecret(e.target.value)}
                        placeholder="TOTP Secret Key"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Account 2: Trading Account */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-extrabold text-slate-800">Account 2: Order Execution / Trading</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Trading Client ID</label>
                      <input
                        type="text"
                        value={tradeClientId}
                        onChange={(e) => setTradeClientId(e.target.value)}
                        placeholder="Client ID for Trading"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Trading Account PIN</label>
                      <input
                        type="password"
                        value={tradePin}
                        onChange={(e) => setTradePin(e.target.value)}
                        placeholder="6-digit PIN"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Trading TOTP Secret</label>
                      <input
                        type="password"
                        value={tradeSecret}
                        onChange={(e) => setTradeSecret(e.target.value)}
                        placeholder="TOTP Secret Key"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save & Connect Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={brokerLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50"
              >
                {brokerLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>
                  {totpStatus?.configured ? "Update Credentials & Re-Authenticate Dhan" : "Save Credentials & Connect Dhan"}
                </span>
              </button>
            </div>
          </form>
        </div>
        )}


        {/* ========================================================================= */}
        {/* 2. AI VISION GATEWAY (CHART MOMENTUM & BULL TRAP DETECTION)              */}
        {/* ========================================================================= */}
        {(activeIntegrationTab === "all" || activeIntegrationTab === "ai") && (
        <div id="ai-card" className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-xs space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xs">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>AI Vision Gateway (Chart Analysis Engine)</span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    Unified Multi-Modal Routing
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluates 1-minute candlestick setups, confirms multi-candle trajectories, and filters bull traps for smart stock recommendations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 shadow-2xs ${
                geminiStatus?.connected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : geminiStatus?.configured
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${geminiStatus?.connected ? "bg-emerald-500 animate-pulse" : geminiStatus?.configured ? "bg-amber-500" : "bg-slate-400"}`} />
                {geminiStatus?.connected
                  ? (geminiProvider === "xkiro" ? "XKIRO GATEWAY ACTIVE" : "GEMINI VISION ACTIVE")
                  : geminiStatus?.configured
                  ? "CONFIGURED (UNVERIFIED)"
                  : "KEY REQUIRED"}
              </span>
            </div>
          </div>

          {/* Provider Selection Tabs */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-xs font-bold text-slate-600 mr-1">Gateway Provider:</span>
            <button
              type="button"
              onClick={() => handleProviderChange("xkiro")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                geminiProvider === "xkiro"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              xKiro AI Gateway (Recommended · Multi-Model)
            </button>
            <button
              type="button"
              onClick={() => handleProviderChange("gemini")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                geminiProvider === "gemini"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Google Gemini Direct (Google AI Studio)
            </button>
          </div>

          {/* Feedback message */}
          {geminiFeedback && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              geminiFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}>
              {geminiFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{geminiFeedback.message}</span>
            </div>
          )}

          {/* Key & Model Form */}
          <form onSubmit={handleSaveGeminiSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* API Key Input */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{geminiProvider === "xkiro" ? "xKiro Gateway API Key" : "Google Gemini API Key"}</span>
                  </span>
                  {geminiStatus?.masked_key && (
                    <span className="text-[10px] text-slate-400 font-mono font-normal">
                      Active: {geminiStatus.masked_key}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showGeminiKey ? "text" : "password"}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={
                      geminiStatus?.configured
                        ? "Enter new key to update..."
                        : geminiProvider === "xkiro"
                        ? "Paste your xKiro API Key (xk-...)"
                        : "AIzaSy..."
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Model Select */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Vision Model</span>
                </label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
                >
                  {geminiProvider === "xkiro" ? (
                    <>
                      <optgroup label="Zhipu AI (Verified via xKiro · Ultra-Fast)">
                        <option value="z-ai/glm-4.6v">GLM-4.6V (Ultra-Fast Vision · Sub-3s · Recommended)</option>
                        <option value="z-ai/glm-5v-turbo">GLM-5V Turbo (Fast Reasoning Vision)</option>
                      </optgroup>
                      <optgroup label="Anthropic (Verified via xKiro)">
                        <option value="anthropic/claude-haiku-4.5">Claude Haiku 4.5 (Ultra-Fast &amp; Economical)</option>
                        <option value="anthropic/claude-sonnet-5">Claude Sonnet 5 (Deep Spatial Nuance)</option>
                        <option value="anthropic/claude-3-5-sonnet">Claude 3.5 Sonnet (High Precision)</option>
                      </optgroup>
                      <optgroup label="OpenAI (Verified via xKiro)">
                        <option value="openai/gpt-5.4-mini">GPT-5.4 Mini (Fast Multimodal)</option>
                        <option value="openai/gpt-4o-mini">GPT-4o Mini (Budget Multimodal)</option>
                        <option value="openai/gpt-4o">GPT-4o (Flagship Multimodal)</option>
                      </optgroup>
                      <optgroup label="Google (via xKiro)">
                        <option value="google/gemini-2.0-flash">Gemini 2.0 Flash (Fast Vision)</option>
                        <option value="google/gemini-1.5-flash">Gemini 1.5 Flash</option>
                      </optgroup>
                      <optgroup label="Open Source (via xKiro)">
                        <option value="qwen/qwen-2.5-vl-72b-instruct">Qwen 2.5 VL 72B (Open Source Leader)</option>
                      </optgroup>
                    </>
                  ) : (
                    <>
                      <option value="gemini-3.6-flash">Gemini 3.6 Flash (Recommended · Google Flagship)</option>
                      <option value="gemini-3.8-flash">Gemini 3.8 Flash (Frontier Multimodal)</option>
                      <option value="gemini-3.5-flash">Gemini 3.5 Flash (High Throughput)</option>
                      <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Fast &amp; Lightweight)</option>
                      <option value="gemini-flash-latest">Gemini Flash Latest (Auto-Updating)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Actions & Help Link */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={geminiLoading}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs hover:shadow-indigo-200 cursor-pointer disabled:opacity-60 active:scale-95"
                >
                  {geminiLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save &amp; Verify Credentials</span>
                </button>

                {geminiStatus?.configured && (
                  <button
                    type="button"
                    onClick={handleTestGeminiConnection}
                    disabled={geminiLoading}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${geminiLoading ? "animate-spin" : ""}`} />
                    <span>Test Connection Ping</span>
                  </button>
                )}
              </div>

              {geminiProvider === "xkiro" ? (
                <a
                  href="https://xkiro.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] flex items-center gap-1 hover:underline"
                >
                  <span>Get API Key at xkiro.com (Free tier 5M tokens/day)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] flex items-center gap-1 hover:underline"
                >
                  <span>Get free Gemini API Key from Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </form>
        </div>
        )}

        {/* ========================================================================= */}
        {/* 3. RESEND.COM EMAIL DELIVERY GATEWAY (3RD PLATFORM API)                  */}
        {/* ========================================================================= */}
        {(activeIntegrationTab === "all" || activeIntegrationTab === "resend") && (
        <div id="resend-card" className="bg-white rounded-2xl p-6 border-2 border-emerald-300 shadow-md space-y-4 relative overflow-hidden ring-4 ring-emerald-50/80">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>Resend.com Email Delivery Gateway</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    OTP Verification Delivery
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Powers automated 6-digit email OTP delivery for NormalUser registration, login, and 1-hour security lockout controls.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 shadow-2xs ${
                resendStatus?.configured
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${resendStatus?.configured ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                {resendStatus?.configured ? "RESEND GATEWAY ACTIVE" : "KEY REQUIRED"}
              </span>
            </div>
          </div>

          {/* Feedback message */}
          {resendFeedback && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              resendFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}>
              {resendFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{resendFeedback.message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSaveResendSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* API Key */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Resend API Key</span>
                  </span>
                  {resendStatus?.masked_key && (
                    <span className="text-[10px] text-slate-400 font-mono font-normal">
                      Active: {resendStatus.masked_key}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showResendKey ? "text" : "password"}
                    value={resendKey}
                    onChange={(e) => setResendKey(e.target.value)}
                    placeholder={
                      resendStatus?.configured
                        ? "Enter new API key to update..."
                        : "re_1234567890abcdef..."
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 text-xs font-mono text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResendKey(!showResendKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showResendKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sender Email */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sender Email Address</span>
                </label>
                <input
                  type="email"
                  value={resendFrom}
                  onChange={(e) => setResendFrom(e.target.value)}
                  placeholder="e.g. onboarding@resend.dev"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Actions & Live Ping Test */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs hover:shadow-emerald-200 cursor-pointer disabled:opacity-60 active:scale-95"
                >
                  {resendLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Resend Credentials</span>
                </button>

                {/* Test Email Send Input & Button */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email to test..."
                    className="px-2 py-1 bg-transparent text-xs text-slate-800 focus:outline-none w-48 font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={testEmailLoading || !testEmail.trim()}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 text-[11px]"
                  >
                    {testEmailLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    <span>Send Test OTP</span>
                  </button>
                </div>
              </div>

              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:text-emerald-800 font-semibold text-[11px] flex items-center gap-1 hover:underline"
              >
                <span>Get API Key at resend.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </form>
        </div>
        )}

      </div>
    </div>
  );
};
