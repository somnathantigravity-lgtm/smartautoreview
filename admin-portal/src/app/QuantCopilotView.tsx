"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Search,
  Filter,
  BarChart2,
  Clock,
  ChevronRight,
  Database,
  Layers,
  ArrowUpRight,
  Cpu,
  RefreshCw
} from "lucide-react";

interface QuantParameter {
  id: number;
  name: string;
  category: string;
  threshold: string;
  weight: number;
  status: "PASS" | "FAIL";
  value: string;
}

interface StockProfile {
  symbol: string;
  company_name: string;
  sector: string;
  security_id: string;
  ltp: number;
  confluence_score: number;
  verdict: string;
  tier: string;
  total_triggers_60d: number;
  win_rate_pct: number;
  loss_rate_pct: number;
  avg_time_to_target_mins: number;
  avg_mae_drawdown_pct: number;
  avg_mfe_rally_pct: number;
  false_breakout_trap_pct: number;
  parameters: QuantParameter[];
  last_analyzed_at: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  suggested_chips?: string[];
  linked_symbol?: string;
}

const QUICK_PROMPTS = [
  "Audit CANBK and check 60-day hit rate",
  "Why was HDFCBANK disqualified?",
  "Show Top 5 High-Conviction Stocks",
  "Which stocks have Hurst H ≥ 0.68?",
  "Explain the 26 parameters in simple terms"
];

export default function QuantCopilotView() {
  const [activeSymbol, setActiveSymbol] = useState<string>("CANBK");
  const [stockProfile, setStockProfile] = useState<StockProfile | null>(null);
  const [allStocksList, setAllStocksList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [loadingChat, setLoadingChat] = useState<boolean>(false);

  // Chatbot State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      text: "👋 Welcome to the **Apex Quant Copilot & 26-Parameter Inspector**.\n\nI have pre-evaluated **500 liquid stocks** against our 26 quantitative parameters and 60-day intraday 1-minute triggers.\n\nClick any stock on the left or ask me anything to inspect its parameters, historical win rates, or rejection reasons.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggested_chips: QUICK_PROMPTS
    }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch Stocks List
  const fetchStocksList = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/admin-portal/copilot/stocks-dna?limit=1000");
      if (res.ok) {
        const data = await res.json();
        setAllStocksList(data.stocks || []);
      }
    } catch (e) {
      console.error("Failed to load stocks DNA list:", e);
    }
  };

  // Fetch Individual Stock Profile
  const fetchStockProfile = async (symbol: string) => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin-portal/copilot/stock/${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setStockProfile(data);
        setActiveSymbol(symbol);
      }
    } catch (e) {
      console.error("Failed to load stock profile:", e);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchStocksList();
    fetchStockProfile("CANBK");
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Send Chat
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query || loadingChat) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setLoadingChat(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/admin-portal/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, active_symbol: activeSymbol })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggested_chips: data.suggested_chips,
          linked_symbol: data.symbol
        };
        setMessages((prev) => [...prev, assistantMsg]);

        if (data.card_data && data.card_data.symbol) {
          setStockProfile(data.card_data);
          setActiveSymbol(data.card_data.symbol);
        } else if (data.symbol && data.symbol !== activeSymbol) {
          fetchStockProfile(data.symbol);
        }
      }
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "⚠️ Sorry, I encountered an error connecting to the Copilot Engine.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoadingChat(false);
    }
  };

  // Filtered Parameters
  const filteredParameters = (stockProfile?.parameters || []).filter((p) => {
    if (selectedCategory === "ALL") return true;
    if (selectedCategory === "STRUCTURAL" && p.category.includes("Structural")) return true;
    if (selectedCategory === "VOLATILITY" && p.category.includes("Volatility")) return true;
    if (selectedCategory === "INSTITUTIONAL" && p.category.includes("Institutional")) return true;
    if (selectedCategory === "FUNDAMENTAL" && p.category.includes("Fundamental")) return true;
    return false;
  });

  const passedCount = (stockProfile?.parameters || []).filter((p) => p.status === "PASS").length;
  const failedCount = (stockProfile?.parameters || []).filter((p) => p.status === "FAIL").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shadow-inner">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Quant Copilot &amp; 26-Parameter Inspector
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                  Dhan 60-Day 1-Min Validated
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Conversational natural-language auditor cross-checking 3,000+ liquid stocks across 26 institutional microstructure parameters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Universe Ingestion</div>
              <div className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                3,056 Scrips Calibrated
              </div>
            </div>
            <button
              onClick={() => fetchStockProfile(activeSymbol)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Refresh Current Stock Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Conversational Chatbot (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col h-[780px] shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold text-white">Quant Copilot Chat</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
              Focus: <span className="text-indigo-300 font-bold">{activeSymbol}</span>
            </span>
          </div>

          {/* Quick Chip Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none border-b border-slate-800/60">
            {QUICK_PROMPTS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700/60 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>{chip}</span>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-xs ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white font-medium"
                      : "bg-slate-950/80 text-slate-200 border border-slate-800/90 shadow-inner"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div
                    className={`text-[9px] mt-1.5 font-mono ${
                      m.role === "user" ? "text-indigo-200" : "text-slate-500 text-right"
                    }`}
                  >
                    {m.timestamp}
                  </div>

                  {/* Dynamic Chips Attached to Bot Answers */}
                  {m.suggested_chips && m.suggested_chips.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                      {m.suggested_chips.map((sc, scIdx) => (
                        <button
                          key={scIdx}
                          onClick={() => handleSendMessage(sc)}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-indigo-500/20 text-indigo-300 border border-slate-700 hover:border-indigo-500/40 transition-colors cursor-pointer"
                        >
                          {sc}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loadingChat && (
              <div className="flex items-center gap-2 text-xs text-indigo-400 py-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-100" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-200" />
                <span>Auditing 26 parameters against 60-day historical data...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="pt-3 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about any stock (e.g. 'Audit TATASTEEL' or 'Why was SBIN rejected?')"
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || loadingChat}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: 26-Parameter Visual Scorecard & DNA (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Stock Quick Selector Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stock symbol..."
                className="bg-slate-950 border border-slate-700/70 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 font-mono uppercase"
              />
            </div>

            {/* Popular Stock Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["CANBK", "TATASTEEL", "RELIANCE", "TCS", "JIOFIN", "BSE", "HDFCBANK", "SBIN"].map((s) => (
                <button
                  key={s}
                  onClick={() => fetchStockProfile(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeSymbol === s
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Active Stock Diagnostic Card */}
          {loadingProfile ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
              <p className="text-xs">Loading 26-parameter DNA scorecard for {activeSymbol}...</p>
            </div>
          ) : stockProfile ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              {/* Header Info */}
              <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-white font-mono tracking-tight">
                      {stockProfile.symbol}
                    </h2>
                    <span className="text-sm font-semibold text-slate-300 font-mono">
                      ₹{stockProfile.ltp?.toFixed(2)}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        stockProfile.confluence_score >= 90
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : stockProfile.confluence_score >= 80
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      {stockProfile.verdict.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {stockProfile.company_name} • <span className="text-indigo-400">{stockProfile.sector}</span>
                  </div>
                </div>

                {/* Confluence Score Ring */}
                <div className="flex items-center gap-4 bg-slate-950 border border-slate-800/80 rounded-2xl px-5 py-3 shadow-inner">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Confluence</div>
                    <div className="text-xs text-slate-500">26 Parameters</div>
                  </div>
                  <div className="text-3xl font-black font-mono text-white flex items-baseline gap-1">
                    <span
                      className={
                        stockProfile.confluence_score >= 90
                          ? "text-emerald-400"
                          : stockProfile.confluence_score >= 80
                          ? "text-blue-400"
                          : "text-rose-400"
                      }
                    >
                      {stockProfile.confluence_score}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">/100</span>
                  </div>
                </div>
              </div>

              {/* 60-Day Historical Expectancy Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">60D Target Hit Rate</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    {stockProfile.win_rate_pct}%
                  </div>
                  <div className="text-[10px] text-slate-400">{stockProfile.total_triggers_60d} Historical Triggers</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Avg Time to Target</div>
                  <div className="text-base font-bold text-blue-400 font-mono mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {stockProfile.avg_time_to_target_mins} Mins
                  </div>
                  <div className="text-[10px] text-slate-400">Fast Momentum</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Max Drawdown (MAE)</div>
                  <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                    {stockProfile.avg_mae_drawdown_pct}%
                  </div>
                  <div className="text-[10px] text-slate-400">Typical Retracement</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">False Breakout Trap</div>
                  <div
                    className={`text-base font-bold font-mono mt-0.5 ${
                      stockProfile.false_breakout_trap_pct <= 15 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {stockProfile.false_breakout_trap_pct}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {stockProfile.false_breakout_trap_pct <= 15 ? "Low Trap Risk" : "Elevated Trap Risk"}
                  </div>
                </div>
              </div>

              {/* Category Filter Pills for 26 Parameters */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setSelectedCategory("ALL")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedCategory === "ALL" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All 26 ({passedCount} Passed, {failedCount} Failed)
                  </button>
                  <button
                    onClick={() => setSelectedCategory("STRUCTURAL")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedCategory === "STRUCTURAL" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Structural &amp; Trend (6)
                  </button>
                  <button
                    onClick={() => setSelectedCategory("VOLATILITY")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedCategory === "VOLATILITY" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Volatility &amp; VCP (6)
                  </button>
                  <button
                    onClick={() => setSelectedCategory("INSTITUTIONAL")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedCategory === "INSTITUTIONAL" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Volume &amp; CVD (7)
                  </button>
                  <button
                    onClick={() => setSelectedCategory("FUNDAMENTAL")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedCategory === "FUNDAMENTAL" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Fundamentals &amp; Risk (7)
                  </button>
                </div>
              </div>

              {/* 26 Parameters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                {filteredParameters.map((p) => {
                  const isPass = p.status === "PASS";
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isPass
                          ? "bg-slate-950/70 border-emerald-900/40 hover:border-emerald-700/60"
                          : "bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500 font-bold">#{p.id}</span>
                          <span className="text-xs font-bold text-slate-200 leading-tight">{p.name}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 flex items-center gap-1 ${
                            isPass
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          }`}
                        >
                          {isPass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {p.status}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-medium font-mono">{p.value}</span>
                      </div>

                      <div className="mt-1 text-[10px] text-slate-500 italic">
                        Threshold: {p.threshold}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              No stock selected. Click any stock above to inspect its 26 parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
