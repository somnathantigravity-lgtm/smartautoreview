"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Briefcase,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  TrendingUp,
  Clock,
  Shield,
  Layers,
  ChevronRight,
  ArrowUpRight,
  ExternalLink,
  Check,
  User,
  X,
  Radio,
  Sliders,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  requestNormalOtp,
  verifyNormalOtp,
  setNormalPassword,
  loginNormalUser
} from "@/services/api";

interface NormalUserLandingPageProps {
  onAuthSuccess: (token: string, user: any) => void;
  initialAuthMode?: "register" | "login" | null;
}

export const NormalUserLandingPage: React.FC<NormalUserLandingPageProps> = ({
  onAuthSuccess,
  initialAuthMode = null
}) => {
  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(Boolean(initialAuthMode));
  const [authMode, setAuthMode] = useState<"register" | "login">(initialAuthMode || "register");

  // Registration states (Step 1: Email, Step 2: OTP, Step 3: Password)
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Interactive Demo Toggle in Hero
  const [activeDemoTab, setActiveDemoTab] = useState<"reco" | "portfolio">("reco");

  // Expandable FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Open modal helper
  const openModal = (mode: "register" | "login") => {
    setAuthMode(mode);
    setAuthFeedback(null);
    if (mode === "register") setRegStep(1);
    setIsAuthModalOpen(true);
  };

  // --- Step 1: Request OTP ---
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setAuthFeedback({ type: "error", message: "Please enter a valid email address." });
      return;
    }
    setAuthLoading(true);
    setAuthFeedback(null);
    try {
      const res = await requestNormalOtp(email.trim());
      setAuthFeedback({ type: "success", message: res.message || `Verification OTP code sent to ${email}!` });
      setRegStep(2);
    } catch (err: any) {
      setAuthFeedback({ type: "error", message: err.message || "Failed to dispatch verification code." });
    } finally {
      setAuthLoading(false);
    }
  };

  // --- Step 2: Verify OTP ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setAuthFeedback({ type: "error", message: "Please enter the 6-digit code received on your email." });
      return;
    }
    setAuthLoading(true);
    setAuthFeedback(null);
    try {
      await verifyNormalOtp(email.trim(), otp.trim());
      setAuthFeedback({ type: "success", message: "Email verified! Set your 10-character password." });
      setRegStep(3);
    } catch (err: any) {
      setAuthFeedback({ type: "error", message: err.message || "Invalid or expired verification code." });
    } finally {
      setAuthLoading(false);
    }
  };

  // --- Step 3: Set Password & Complete Registration ---
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setAuthFeedback({ type: "error", message: "Please enter and confirm your password." });
      return;
    }
    if (password !== confirmPassword) {
      setAuthFeedback({ type: "error", message: "Passwords do not match." });
      return;
    }
    setAuthLoading(true);
    setAuthFeedback(null);
    try {
      const res = await setNormalPassword({
        email: email.trim(),
        password,
        confirm_password: confirmPassword
      });
      localStorage.setItem("apex_normal_token", res.token);
      localStorage.setItem("apex_normal_user", JSON.stringify(res.user));
      setIsAuthModalOpen(false);
      onAuthSuccess(res.token, res.user);
    } catch (err: any) {
      setAuthFeedback({ type: "error", message: err.message || "Failed to set password." });
    } finally {
      setAuthLoading(false);
    }
  };

  // --- Login Handler ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setAuthFeedback({ type: "error", message: "Please enter both email and password." });
      return;
    }
    setAuthLoading(true);
    setAuthFeedback(null);
    try {
      const res = await loginNormalUser({ email: email.trim(), password });
      localStorage.setItem("apex_normal_token", res.token);
      localStorage.setItem("apex_normal_user", JSON.stringify(res.user));
      setIsAuthModalOpen(false);
      onAuthSuccess(res.token, res.user);
    } catch (err: any) {
      setAuthFeedback({ type: "error", message: err.message || "Invalid email or password." });
    } finally {
      setAuthLoading(false);
    }
  };

  // Password rules validation
  const isLengthValid = password.length >= 6 && password.length <= 10;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_]/.test(password);
  const isMatch = password === confirmPassword && password.length > 0;
  const isPasswordReady = isLengthValid && hasUppercase && hasNumber && hasSpecial && isMatch;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* STICKY DAY THEME NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-base tracking-tight text-slate-900">APEX</span>
              <span className="font-extrabold text-sm text-blue-600 tracking-wider">EQUITIES</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 ml-1">
                Client Portal
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-none">
              Dalal Street Terminal • Investor Edition
            </p>
          </div>
        </div>

        {/* Center Nav Anchors */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600">
          <a href="#recommendations" className="hover:text-blue-600 transition-colors">
            Smart Recommendations
          </a>
          <a href="#portfolio" className="hover:text-blue-600 transition-colors">
            Dhan Portfolio Sync
          </a>
          <a href="#guardian" className="hover:text-blue-600 transition-colors">
            Breakeven Guardian
          </a>
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
            How It Works
          </a>
          <a href="#faq" className="hover:text-blue-600 transition-colors">
            FAQ &amp; Security
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal("login")}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => openModal("register")}
            className="px-4 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <span>Create Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* HERO SECTION (DAY THEME) */}
      <section className="pt-14 pb-16 px-4 sm:px-8 max-w-7xl mx-auto text-center space-y-7">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-slate-700 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-Time 1-Minute Momentum Scanner • Live NSE &amp; BSE Equities Feed</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Smart Institutional Stock Recos. <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Automated To Your Personal Dhan Account.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Gain an institutional edge with quantitative 1-minute candlestick momentum, AI bull-trap filtering, and zero-touch Dhan broker execution with automated Breakeven Stop-Loss locking.
          </p>
        </div>

        {/* Single Primary Action Button: "Create Account" */}
        <div className="flex flex-col items-center justify-center gap-2 pt-2">
          <button
            onClick={() => openModal("register")}
            className="px-8 py-4 text-base font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/35 transition-all cursor-pointer active:scale-95 flex items-center gap-2.5"
          >
            <span>Create Account</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-slate-500 font-medium">
            Already registered?{" "}
            <button
              onClick={() => openModal("login")}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Sign In to Terminal
            </button>
          </p>
        </div>

        {/* INTERACTIVE DEMO PREVIEW CARD (DAY THEME) */}
        <div className="pt-6 max-w-3xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-left relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDemoTab("reco")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeDemoTab === "reco"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Smart Recommendation Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDemoTab("portfolio")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeDemoTab === "portfolio"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Live Dhan Portfolio Sync</span>
                </button>
              </div>

              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE FEED SYNCHRONIZED</span>
              </span>
            </div>

            {/* Tab 1: Live Recommendation Showcase */}
            {activeDemoTab === "reco" && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-extrabold text-sm shadow-2xs">
                        REL
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-base">RELIANCE</span>
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            BULLISH 1-MIN MOMENTUM
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Institutional Volume Absorption Setup</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-slate-900 font-mono">₹1,322.00</span>
                      <span className="block text-xs font-bold text-emerald-600 font-mono">+1.37% Today</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-slate-200">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-extrabold">Entry Level</span>
                      <span className="font-mono font-black text-slate-900 text-sm">₹1,320.00</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-extrabold">Target 1</span>
                      <span className="font-mono font-black text-emerald-600 text-sm">₹1,348.00 (+2.1%)</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-extrabold">Stop Loss</span>
                      <span className="font-mono font-black text-rose-600 text-sm">₹1,308.00 (-0.9%)</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-extrabold">AI Conviction</span>
                      <span className="font-mono font-black text-purple-700 text-sm">94% High</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Dual SL Guardian:</strong> Stop Loss auto-relocates to Breakeven (+0.8% Profit).</span>
                    </div>
                    <span className="font-mono font-extrabold text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      ZERO RISK LOCKED
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Live Dhan Portfolio Showcase */}
            {activeDemoTab === "portfolio" && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Dhan Buying Power</span>
                      <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">₹1,24,500.00</span>
                      <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">Linked Client ID: 111***67</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Today&apos;s Realized P&amp;L</span>
                      <span className="text-xl font-black text-emerald-600 font-mono mt-0.5 block">+₹3,420.50</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">3 Orders Executed</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Auto-Login Status</span>
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mt-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Daily TOTP Sync Active</span>
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Next Renewal: 08:30 AM IST</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
                    <span>Live WebSocket stream synchronizes orders, executions, and positions directly with your Dhan account.</span>
                    <button
                      onClick={() => openModal("register")}
                      className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer text-xs"
                    >
                      Connect Your Dhan &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* IN-DEPTH SECTION 1: HOW SMART RECOMMENDATIONS WORK                        */}
      {/* ========================================================================= */}
      <section id="recommendations" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
            Quantitative Scanner Engine
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How The Smart Recommendation Engine Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Unlike static alert tools or simple moving average crossovers, APEX Equities runs a multi-stage quantitative pipeline designed specifically for high-probability Indian equity breakouts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3 hover:border-purple-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-black flex items-center justify-center font-mono text-sm border border-purple-200">
              01
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">1-Minute Tape Ingestion</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Continuously monitors real-time Level-2 tick data across 7,600+ NSE &amp; BSE equities to isolate abnormal volume spikes and institutional order flow absorption.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3 hover:border-purple-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-black flex items-center justify-center font-mono text-sm border border-purple-200">
              02
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Multi-Candle Momentum</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Evaluates consecutive candle trajectories across multiple timeframes (1m, 3m, 5m). Only moves forward when price structure confirms institutional continuation.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3 hover:border-purple-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-black flex items-center justify-center font-mono text-sm border border-purple-200">
              03
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">AI Bull-Trap Filtering</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Identifies liquidity traps, false breakouts, and heavy overhead resistance levels to discard low-probability setups before they ever reach your screen.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3 hover:border-purple-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-black flex items-center justify-center font-mono text-sm border border-purple-200">
              04
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Audited Trade Brackets</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every live recommendation displays precise Entry Price, Target 1, Target 2, Stop Loss, and an AI Conviction Score (80%–98%) with dual stop-loss profit protection.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* IN-DEPTH SECTION 2: HOW DHAN PORTFOLIO MANAGEMENT WORKS                   */}
      {/* ========================================================================= */}
      <section id="portfolio" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-slate-200 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Seamless Broker Connectivity
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Zero-Touch Dhan Execution: <br />
              Connected Once, Active Every Day.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Traditional trading platforms force you to manually log in every single morning, copy-paste 24-hour access tokens, and face order rejections due to dynamic IP mismatches. APEX Equities eliminates this entirely through automated TOTP synchronization.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Daily 08:30 AM Auto-Authentication</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Our backend engine generates fresh Dhan 24-hour access tokens daily at 08:30 AM IST using your TOTP secret key, well before the market opens.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Dynamic Public IP Auto-Registration</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dhan requires outbound orders to come from a registered IP address. We detect and register the public IP automatically on your account so orders are never blocked.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Real-Time Portfolio &amp; Order Sync</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View your actual Dhan buying power, intraday positions, executed order statuses, and Demat holdings in your dedicated My Portfolio tab.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card Illustration */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-extrabold text-slate-900">Dhan Broker Sync Architecture</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                ZERO-TOUCH
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">Authentication Mode:</span>
                <span className="font-bold text-slate-900">Automated TOTP Secret</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">Daily Renewal Schedule:</span>
                <span className="font-bold text-slate-900 font-mono">08:30 AM IST (Automated)</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">Public IP Synchronization:</span>
                <span className="font-bold text-emerald-600">Auto-Registered with Dhan</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">User AI Key Requirement:</span>
                <span className="font-bold text-blue-600">None (Platform Handled)</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => openModal("register")}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Create Account &amp; Link Your Dhan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* IN-DEPTH SECTION 3: THE BREAKEVEN STOP-LOSS GUARDIAN                     */}
      {/* ========================================================================= */}
      <section id="guardian" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-3xl p-8 sm:p-12">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-white border border-blue-200 px-3 py-1 rounded-full shadow-2xs">
              Risk Management Innovation
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Dual SL Guardian: Never Let A Winning Trade Turn Into A Loss
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              The number one failure point for retail traders is giving back profits when a stock reverses after reaching a green position. The Breakeven Stop-Loss Guardian eliminates this human hesitation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
              <span className="font-black text-slate-900 text-sm block">1. The Trigger (+0.8%)</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                As soon as an open position gains <strong>+0.8% profit</strong> from your exact entry price, the guardian detects the threshold in real time.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
              <span className="font-black text-slate-900 text-sm block">2. Automatic Modification</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                The platform immediately sends a modification request to Dhan to move your active Stop Loss order to your <strong>original purchase price (breakeven)</strong>.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
              <span className="font-black text-slate-900 text-sm block">3. Zero-Risk Continuation</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your worst-case scenario becomes ₹0 loss. You can hold through market volatility to capture full Target 1 and Target 2 without financial anxiety.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* IN-DEPTH SECTION 4: HOW IT WORKS IN 3 STEPS                               */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
            Simple 60-Second Setup
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How To Get Started With NormalUser Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            No complex installations or API programming required. Follow 3 simple steps to start receiving live setups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 relative space-y-3 shadow-xs">
            <span className="text-4xl font-black text-slate-300 block font-mono">01</span>
            <h3 className="text-base font-extrabold text-slate-900">Register with Email OTP</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Click &quot;Create Account&quot;, enter your email, and verify with the 6-digit code sent via Resend.com. Set your secure 10-character password.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 relative space-y-3 shadow-xs">
            <span className="text-4xl font-black text-slate-300 block font-mono">02</span>
            <h3 className="text-base font-extrabold text-slate-900">Enter Your Dhan TOTP Key</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              In Settings, enter your Dhan Client ID, 6-digit PIN, and TOTP key once. Automated daily zero-touch login is now active on your account.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 relative space-y-3 shadow-xs">
            <span className="text-4xl font-black text-slate-300 block font-mono">03</span>
            <h3 className="text-base font-extrabold text-slate-900">Trade &amp; Track In Real-Time</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your Recommendations and Portfolio tabs are live! View institutional setups, track your positions, and execute with Breakeven SL protection.
            </p>
          </div>
        </div>

        <div className="text-center pt-10">
          <button
            onClick={() => openModal("register")}
            className="px-8 py-3.5 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
          >
            Create Your Account Now &rarr;
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* IN-DEPTH SECTION 5: FAQ & SECURITY                                        */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 px-4 sm:px-8 max-w-5xl mx-auto border-t border-slate-200">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions &amp; Security
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Clear answers about your credentials, capital safety, and platform permissions.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Can APEX Equities withdraw funds from my Dhan account?",
              a: "Absolutely not. The DhanHQ API does not permit third-party fund withdrawals. Your funds remain 100% under your control inside your official Dhan broker account at all times."
            },
            {
              q: "Do I need to enter an AI API key or pay for LLMs?",
              a: "No. For Normal Users, the platform automatically routes chart evaluation and bull-trap filtering through its internal high-performance quantitative infrastructure. You only connect your Dhan account."
            },
            {
              q: "What happens if I enter the wrong password 3 times?",
              a: "To protect your account against brute-force attacks, 3 consecutive failed verification attempts automatically locks the account for 1 hour. Administrators can also unlock your account from the admin console."
            },
            {
              q: "Why do you use TOTP instead of daily passwords?",
              a: "Dhan's TOTP authentication allows secure, automated renewal of your 24-hour token every morning at 08:30 AM without requiring you to manually log in before market hours."
            },
            {
              q: "What are the only 3 tabs I will see in my terminal?",
              a: "Once logged in, your terminal contains only 3 focused tabs: (1) Recommendations (all live institutional setups), (2) My Portfolio (your live Dhan positions and orders), and (3) Settings (your Dhan broker connection)."
            }
          ].map((faq, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openFaq === i && (
                <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER (DAY THEME) */}
      <footer className="py-12 px-4 sm:px-8 border-t border-slate-200 text-center text-xs text-slate-500 space-y-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-2 font-black text-slate-900 text-sm">
          <span>APEX</span>
          <span className="text-blue-600">EQUITIES</span>
          <span className="text-slate-300 font-normal">|</span>
          <span className="text-xs text-slate-500 font-medium">NormalUser Client Portal</span>
        </div>
        <p className="max-w-2xl mx-auto text-[11px] leading-relaxed">
          Disclaimer: Recommendations provided are for educational and research purposes based on quantitative technical rules. Trading in equities, futures, and options involves financial risk. Ensure you evaluate your risk appetite before executing trades through your linked Dhan account.
        </p>
        <p className="text-[10px] text-slate-400">
          &copy; {new Date().getFullYear()} APEX Equities Terminal • All rights reserved.
        </p>
      </footer>

      {/* ========================================================================= */}
      {/* AUTH MODAL (SIGN UP & SIGN IN - DAY THEME)                                */}
      {/* ========================================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                <span>Client Portal Access</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                APEX <span className="text-blue-600">EQUITIES</span>
              </h2>
              <p className="text-xs text-slate-500">
                {authMode === "register"
                  ? "Create your account with email OTP to unlock live recommendations"
                  : "Sign in with your email and password to access your terminal"}
              </p>
            </div>

            {/* Tab Toggle: Sign Up vs Sign In */}
            <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setRegStep(1);
                  setAuthFeedback(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  authMode === "register"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthFeedback(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  authMode === "login"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Feedback Alert */}
            {authFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  authFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {authFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="leading-snug">{authFeedback.message}</span>
              </div>
            )}

            {/* SIGN UP FLOW */}
            {authMode === "register" && (
              <div className="space-y-4">
                {/* Step indicator */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2">
                  <span className={regStep === 1 ? "text-blue-600" : regStep > 1 ? "text-emerald-600" : ""}>
                    1. Email
                  </span>
                  <span>&rarr;</span>
                  <span className={regStep === 2 ? "text-blue-600" : regStep > 2 ? "text-emerald-600" : ""}>
                    2. Verify OTP
                  </span>
                  <span>&rarr;</span>
                  <span className={regStep === 3 ? "text-blue-600" : ""}>3. Password</span>
                </div>

                {/* Step 1: Email */}
                {regStep === 1 && (
                  <form onSubmit={handleRequestOtp} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                        required
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2.5 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {authLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>Send 6-Digit OTP</span>
                    </button>
                  </form>
                )}

                {/* Step 2: OTP */}
                {regStep === 2 && (
                  <form onSubmit={handleVerifyOtp} className="space-y-3.5 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-slate-700">Enter 6-Digit Code</label>
                        <button
                          type="button"
                          onClick={() => setRegStep(1)}
                          className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                        >
                          Change Email
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono tracking-widest text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                        required
                        autoFocus
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Check your inbox at <strong>{email}</strong> for the 6-digit code.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading || otp.length < 6}
                      className="w-full py-2.5 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {authLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>Verify Code &amp; Continue</span>
                    </button>
                  </form>
                )}

                {/* Step 3: Password */}
                {regStep === 3 && (
                  <form onSubmit={handleSetPassword} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Set Password (Max 10 Chars)</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          maxLength={10}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="e.g. Stock@2026"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          maxLength={10}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter same password"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Live Rules Validation */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-[11px]">
                      <div className={`flex items-center gap-1.5 ${isLengthValid ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isLengthValid ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span>Between 6 and 10 characters ({password.length}/10)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasUppercase ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span>At least 1 uppercase letter (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span>At least 1 number (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasSpecial ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span>At least 1 special character (!@#$%^&amp;*)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${isMatch ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isMatch ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span>Passwords match exactly</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading || !isPasswordReady}
                      className="w-full py-2.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {authLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>Complete Registration &amp; Enter Terminal</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* SIGN IN FLOW */}
            {authMode === "login" && (
              <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {authLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Sign In to Terminal</span>
                </button>

                <p className="text-[11px] text-slate-500 text-center pt-2">
                  Need an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setRegStep(1);
                      setAuthFeedback(null);
                    }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Create Account
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
