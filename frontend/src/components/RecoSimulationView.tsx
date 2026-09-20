"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  RotateCw,
  Search,
  Filter,
  Flame,
  Droplets,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  Award,
  Database,
  ShoppingCart,
  Target,
  Activity,
  Cpu,
  X
} from "lucide-react";
import TradeOnePagerModal from "./TradeOnePagerModal";
import { OrderPlacementModal } from "@/components/OrderPlacementModal";

interface SimulationDate {
  date: string;
  label: string;
}

interface Trade {
  symbol: string;
  company_name: string;
  exchange: string;
  sector: string;
  signal_datetime: string;
  signal_time: string;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  target_pct?: number;
  stop_loss_pct?: number;
  target_source?: string;
  rr_ratio?: number;
  exit_price: number;
  exit_datetime: string;
  exit_time: string;
  duration_mins: number;
  outcome: "SUCCESS" | "FAILURE" | "TRADEOFF";
  pnl_pct: number;
  vault_score: number;
  is_nr7: boolean;
  is_dryup: boolean;
  hurst_exponent: number;
  vault_tag: string;
  raw_score?: number;
  max_raw_score?: number;
  score_100?: number;
  min_score?: number;
  history_score?: number;
  history_min_score?: number;
  ai_vision_score?: number;
  is_eligible?: boolean;
  matched_params_count?: number;
  total_params_count?: number;
  match_pct?: number;
  reco_reason?: string;
  session?: string;
  session_label?: string;
  strategy?: string;
  strategy_label?: string;
}

interface Summary {
  total_trades: number;
  success_count: number;
  failure_count: number;
  tradeoff_count: number;
  win_rate_pct: number;
  profit_factor: number;
  avg_duration_mins: number;
  net_return_pct: number;
  eligible_count?: number;
}

export default function RecoSimulationView() {
  const [dates, setDates] = useState<SimulationDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [mode, setMode] = useState<"CURRENT" | "VALIDATED" | "AI_VISION" | "PREDICTIVE">("CURRENT");
  const [strategy, setStrategy] = useState<"ALL" | "TREND_RUNNER" | "VWAP_PULLBACK" | "BREAKOUT">("ALL");
  const [targetPct, setTargetPct] = useState<number | string>(1.0);
  const [stopLossPct, setStopLossPct] = useState<number | string>(0.6);
  const [minScore, setMinScore] = useState<number | string>(80);
  const [historyMinScore, setHistoryMinScore] = useState<number | string>(45);
  const [visionMinScore, setVisionMinScore] = useState<number | string>(60);

  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);

  // Local Table Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<"ALL" | "SUCCESS" | "FAILURE" | "TRADEOFF">("ALL");
  const [vaultFilter, setVaultFilter] = useState<"ALL" | "ELIGIBLE" | "PRIME" | "SQUEEZE" | "DRYUP">("ALL");
  const [sessionFilter, setSessionFilter] = useState<"ALL" | "MORNING" | "MIDDAY" | "POWER_HOUR">("ALL");
  const [sortOrder, setSortOrder] = useState<"LATEST_FIRST" | "OLDEST_FIRST">("LATEST_FIRST");

  // 1-Pager Modal
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Dhan Buy Now Order Modal
  const [orderTrade, setOrderTrade] = useState<Trade | null>(null);

  // 1. Fetch available trading dates
  useEffect(() => {
    async function loadDates() {
      try {
        const res = await fetch("/api/v1/simulation/dates");
        if (res.ok) {
          const data: SimulationDate[] = await res.json();
          setDates(data);
          if (data.length > 0 && !selectedDate) {
            setSelectedDate(data[0].date);
          }
        }
      } catch (e) {
        console.error("Failed to load simulation dates:", e);
      }
    }
    loadDates();
  }, []);

  const [isBatchAuditing, setIsBatchAuditing] = useState(false);
  const [batchAuditCount, setBatchAuditCount] = useState<number | null>(null);

  // 2. Run simulation handler with custom Target, SL, and dynamic Min Scores
  const handleRunSimulation = useCallback(async (
    dateOverride?: string,
    modeOverride?: "CURRENT" | "VALIDATED" | "AI_VISION" | "PREDICTIVE",
    strategyOverride?: "ALL" | "TREND_RUNNER" | "VWAP_PULLBACK" | "BREAKOUT"
  ) => {
    const d = dateOverride || selectedDate;
    const m = modeOverride || mode;
    const s = strategyOverride || strategy;
    if (!d) return;

    setIsLoading(true);
    try {
      const parsedTarget = typeof targetPct === "string" ? parseFloat(targetPct) : targetPct;
      const parsedSL = typeof stopLossPct === "string" ? parseFloat(stopLossPct) : stopLossPct;
      const parsedMinScore = typeof minScore === "string" ? parseInt(minScore) : minScore;
      const parsedHistoryMinScore = typeof historyMinScore === "string" ? parseInt(historyMinScore) : historyMinScore;
      const parsedVisionMinScore = typeof visionMinScore === "string" ? parseInt(visionMinScore) : visionMinScore;

      const res = await fetch("/api/v1/simulation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: d,
          mode: m,
          strategy: s,
          target_pct: !isNaN(parsedTarget) && parsedTarget > 0 ? parsedTarget : 1.0,
          stop_loss_pct: !isNaN(parsedSL) && parsedSL > 0 ? parsedSL : 0.6,
          min_score: !isNaN(parsedMinScore) ? parsedMinScore : 80,
          history_min_score: (m === "VALIDATED" || m === "AI_VISION" || m === "PREDICTIVE") ? (!isNaN(parsedHistoryMinScore) ? parsedHistoryMinScore : 45) : 0,
          vision_min_score: (m === "PREDICTIVE" || m === "AI_VISION") ? (!isNaN(parsedVisionMinScore) ? parsedVisionMinScore : 60) : 0
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || data);
        setTrades(data.trades || []);
      }
    } catch (e) {
      console.error("Simulation run failed:", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, mode, strategy, targetPct, stopLossPct, minScore, historyMinScore, visionMinScore]);

  // Parallel multi-stock Batch Vision Audit handler
  const handleBatchVisionAudit = useCallback(async () => {
    if (!trades || trades.length === 0) return;
    setIsBatchAuditing(true);
    setBatchAuditCount(null);
    try {
      const candidates = trades.filter((t) => {
        if ((t.score_100 || 0) < 80) return false;
        if (mode === "PREDICTIVE" && (t.history_score ?? t.vault_score ?? 0) < 70) return false;
        return true;
      });

      const res = await fetch("/api/v1/simulation/batch-vision-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trades: candidates,
          date: selectedDate,
          max_workers: 6
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBatchAuditCount(data.count || candidates.length);
        handleRunSimulation(selectedDate, mode, strategy);
      }
    } catch (err) {
      console.error("Batch vision audit error:", err);
    } finally {
      setIsBatchAuditing(false);
    }
  }, [trades, mode, selectedDate, strategy, handleRunSimulation]);

  // Auto-run when initial date is loaded
  useEffect(() => {
    if (selectedDate && !summary) {
      handleRunSimulation(selectedDate, mode, strategy);
    }
  }, [selectedDate, mode, strategy, summary, handleRunSimulation]);

  // Filtered and Sorted trades - ONLY showing recommendations meeting user criteria and session timing
  const filteredTrades = useMemo(() => {
    const parsedMinScore = typeof minScore === "string" ? parseInt(minScore) : minScore;
    const curThreshold = !isNaN(parsedMinScore) ? parsedMinScore : 0;

    const parsedHistoryMinScore = typeof historyMinScore === "string" ? parseInt(historyMinScore) : historyMinScore;
    const histThreshold = !isNaN(parsedHistoryMinScore) ? parsedHistoryMinScore : 0;

    const parsedVisionMinScore = typeof visionMinScore === "string" ? parseInt(visionMinScore) : visionMinScore;
    const visionThreshold = !isNaN(parsedVisionMinScore) ? parsedVisionMinScore : 0;

    return trades
      .filter((t) => {
        // Must meet user's set minimum score criteria (Current 19-Parameter Score)
        if ((t.score_100 || 0) < curThreshold) return false;

        // In History/Validated, AI Vision, or Predictive mode: filter out based on History Min score
        if (mode === "VALIDATED" || mode === "AI_VISION" || mode === "PREDICTIVE") {
          if (histThreshold > 0 && ((t.history_score ?? t.vault_score ?? 0) < histThreshold)) {
            return false;
          }
        }

        // In AI Vision or Predictive mode: filter out based on Min Predictive Score (≥ 70%)
        if (mode === "AI_VISION" || mode === "PREDICTIVE") {
          if (visionThreshold > 0 && ((t.ai_vision_score ?? 0) < visionThreshold)) {
            return false;
          }
        }

        // Session filter (Morning: 09:15-11:30, Midday: 11:30-13:45, Power Hour: 13:45-15:30)
        if (sessionFilter !== "ALL" && t.session !== sessionFilter) {
          return false;
        }

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const match = t.symbol.toLowerCase().includes(q) || t.company_name.toLowerCase().includes(q);
          if (!match) return false;
        }
        if (outcomeFilter !== "ALL" && t.outcome !== outcomeFilter) {
          return false;
        }
        if (vaultFilter === "PRIME" && ((t.history_score ?? t.vault_score ?? 0) < 80)) return false;
        if (vaultFilter === "SQUEEZE" && !t.is_nr7) return false;
        if (vaultFilter === "DRYUP" && !t.is_dryup) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "LATEST_FIRST") {
          return b.signal_datetime.localeCompare(a.signal_datetime);
        } else {
          return a.signal_datetime.localeCompare(b.signal_datetime);
        }
      });
  }, [trades, minScore, historyMinScore, visionMinScore, mode, sessionFilter, searchQuery, outcomeFilter, vaultFilter, sortOrder]);

  // Dynamic KPIs computed for active session/filters so user can directly validate Morning vs Midday vs Power Hour
  const activeMetrics = useMemo(() => {
    const total = filteredTrades.length;
    const success = filteredTrades.filter(t => t.outcome === "SUCCESS").length;
    const failure = filteredTrades.filter(t => t.outcome === "FAILURE").length;
    const tradeoff = filteredTrades.filter(t => t.outcome === "TRADEOFF").length;
    const winRate = total > 0 ? Number(((success / total) * 100).toFixed(1)) : 0;
    const winRateWithBe = total > 0 ? Number((((success + tradeoff) / total) * 100).toFixed(1)) : 0;
    const avgMins = total > 0 ? Math.round(filteredTrades.reduce((acc, t) => acc + (t.duration_mins || 0), 0) / total) : 0;
    const avgTradePnl = total > 0 ? Number((filteredTrades.reduce((acc, t) => acc + (t.pnl_pct || 0), 0) / total).toFixed(2)) : 0;

    // Top 10 conviction allocation for this filtered set
    const top10 = [...filteredTrades]
      .sort((a, b) => (b.score_100 || 0) - (a.score_100 || 0) || (b.vault_score || 0) - (a.vault_score || 0))
      .slice(0, 10);
    const portfolioReturn = top10.length > 0
      ? Number((top10.reduce((acc, t) => acc + (t.pnl_pct || 0) / 10.0, 0)).toFixed(2))
      : 0;

    // When no local session/search/outcome/history filter is active, preserve official backend metrics
    if (summary && filteredTrades.length === summary.total_trades && sessionFilter === "ALL" && outcomeFilter === "ALL" && vaultFilter === "ALL" && !searchQuery) {
      return {
        total: summary.total_trades,
        success: summary.success_count,
        failure: summary.failure_count,
        tradeoff: summary.tradeoff_count,
        winRate: summary.win_rate_pct ?? (summary as any).win_rate ?? 0,
        winRateWithBe: (summary as any).win_rate_with_be ?? 0,
        avgMins: summary.avg_duration_mins ?? 0,
        portfolioReturn: (summary as any).portfolio_return_pct !== undefined ? Number((summary as any).portfolio_return_pct) : (summary.net_return_pct ?? 0),
        avgTradePnl: (summary as any).avg_trade_pnl_pct !== undefined ? Number((summary as any).avg_trade_pnl_pct) : 0
      };
    }

    return {
      total,
      success,
      failure,
      tradeoff,
      winRate,
      winRateWithBe,
      avgMins,
      portfolioReturn,
      avgTradePnl
    };
  }, [summary, filteredTrades, sessionFilter, outcomeFilter, vaultFilter, searchQuery]);

  const winRateVal = activeMetrics ? activeMetrics.winRate : (summary ? (summary.win_rate_pct ?? (summary as any).win_rate ?? 0) : 0);
  const netReturnVal = activeMetrics ? activeMetrics.portfolioReturn : (summary ? (summary.net_return_pct ?? (summary as any).net_day_return_pct ?? 0) : 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. HERO HEADER & SIMULATION COCKPIT */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-4.5 shadow-xs">
        {/* Row 1: Header (Left) and Date Filter (Right) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Left: Title + Crisp Short Description */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Walk-Forward Simulation
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  1-Min Granularity
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Backtest trade recommendations minute-by-minute with custom risk and validation rules.
              </p>
            </div>
          </div>

          {/* Right: Date Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs shadow-2xs shrink-0 self-start sm:self-center">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                handleRunSimulation(e.target.value, mode, strategy);
              }}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1 text-xs"
            >
              {dates.map((d) => (
                <option key={d.date} value={d.date}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Mode Switcher (Left) & Target, SL, Run Simulation (Right) - All fitted in 1 single clean line */}
        <div className="pt-3 flex items-center justify-between gap-3 flex-wrap">
          {/* Left: Mode Switcher (4 Modes) */}
          <div className="inline-flex rounded-xl bg-slate-100/90 p-1 border border-slate-200/80 text-xs font-semibold shadow-2xs shrink-0">
            <button
              onClick={() => {
                setMode("CURRENT");
                handleRunSimulation(selectedDate, "CURRENT", strategy);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === "CURRENT"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="1. Current: Evaluates all 19 live technical parameters (≥80%)"
            >
              Current
            </button>
            <button
              onClick={() => {
                setMode("VALIDATED");
                handleRunSimulation(selectedDate, "VALIDATED", strategy);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === "VALIDATED"
                  ? "bg-white text-indigo-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-indigo-700"
              }`}
              title="2. History: Current (≥80%) + 60-Day Historical Breakout Replay (≥45%)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>History</span>
            </button>
            <button
              onClick={() => {
                setMode("AI_VISION");
                handleRunSimulation(selectedDate, "AI_VISION", strategy);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === "AI_VISION"
                  ? "bg-white text-violet-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-violet-700"
              }`}
              title="3. AI Vision: Current (≥80%) + History (≥45%) + AI Vision Visual Audit (≥60%)"
            >
              <Cpu className="w-3.5 h-3.5 text-violet-600" />
              <span>AI Vision</span>
            </button>
            {/* Full 3-Step tab consolidated into AI Vision linear pipeline
            <button
              onClick={() => {
                setMode("PREDICTIVE");
                handleRunSimulation(selectedDate, "PREDICTIVE", strategy);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === "PREDICTIVE"
                  ? "bg-white text-emerald-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-emerald-700"
              }`}
              title="4. Full 3-Step: Current (≥80%) + History (≥45%) + AI Vision (≥70%) Triple Confirmation"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full 3-Step</span>
            </button>
            */}
          </div>

          {/* Right: Target %, Stop Loss %, and Run Simulation Button - All in 1 line */}
          <div className="flex items-center gap-2.5 ml-auto flex-wrap shrink-0">
            {/* Target % Input */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
              <span className="text-slate-600 font-semibold text-[11px]">Target:</span>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] leading-none">+</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={targetPct}
                  onChange={(e) => setTargetPct(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRunSimulation(); }}
                  placeholder="1.0"
                  className="w-11 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-md px-1 py-0.5 text-xs text-center font-bold text-emerald-700 shadow-2xs outline-none transition-all"
                  title="Enter target percentage (e.g. 1.0, 1.5, 2.0)"
                />
                <span className="text-slate-500 text-[11px] font-medium">%</span>
              </div>
            </div>

            {/* Stop Loss % Input */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
              <span className="text-slate-600 font-semibold text-[11px]">SL:</span>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-[10px] leading-none">-</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={stopLossPct}
                  onChange={(e) => setStopLossPct(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRunSimulation(); }}
                  placeholder="0.6"
                  className="w-11 bg-white border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-md px-1 py-0.5 text-xs text-center font-bold text-rose-700 shadow-2xs outline-none transition-all"
                  title="Enter stop loss percentage (e.g. 0.6, 0.8, 1.0)"
                />
                <span className="text-slate-500 text-[11px] font-medium">%</span>
              </div>
            </div>

            {/* Batch AI Vision Audit Button for AI Vision & Full 3-Step */}
            {(mode === "AI_VISION" || mode === "PREDICTIVE") && (
              <button
                onClick={handleBatchVisionAudit}
                disabled={isBatchAuditing || isLoading}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs hover:shadow-violet-200/50 cursor-pointer active:scale-95 shrink-0 disabled:opacity-50"
                title="Send all qualifying candidate stocks to AI Vision concurrently in parallel"
              >
                <Cpu className={`w-3.5 h-3.5 text-violet-200 ${isBatchAuditing ? "animate-spin" : ""}`} />
                <span>{isBatchAuditing ? "Auditing in Parallel..." : `Audit All (${trades.length}) with AI Vision`}</span>
              </button>
            )}

            {/* Run Simulation Button (Right side of SL) */}
            <button
              onClick={() => handleRunSimulation()}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-500 hover:to-violet-600 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs hover:shadow-indigo-200/50 cursor-pointer active:scale-95 shrink-0"
              title="Execute simulation backtest"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-300 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Simulating..." : "Run Simulation"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. PERFORMANCE KPI RIBBON (Permanently rendered with skeleton state during loading) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Qualified Signals */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {mode === "CURRENT" ? "Qualified Recos" :
                 mode === "VALIDATED" ? "History Qualified" :
                 mode === "AI_VISION" ? "AI Vision Qualified" :
                 "Full 3-Step Qualified"}
              </span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {sessionFilter === "ALL" ? "All Day" : sessionFilter === "MORNING" ? "Morning" : sessionFilter === "MIDDAY" ? "Midday" : "Power Hour"}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
            {isLoading ? (
              <span className="inline-block w-12 h-7 bg-slate-200/80 animate-pulse rounded-md" />
            ) : (
              activeMetrics.total
            )}
          </div>
          <div className="text-[11px] font-medium mt-1 truncate">
            {sessionFilter === "MORNING" ? (
              <span className="text-sky-600 font-bold flex items-center gap-1">
                <span>🌅 Morning</span>
                <span className="text-slate-400 font-normal">(09:15–11:30)</span>
              </span>
            ) : sessionFilter === "MIDDAY" ? (
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <span>☀️ Midday</span>
                <span className="text-slate-400 font-normal">(11:30–13:45)</span>
              </span>
            ) : sessionFilter === "POWER_HOUR" ? (
              <span className="text-purple-600 font-bold flex items-center gap-1">
                <span>⚡ Power Hour</span>
                <span className="text-slate-400 font-normal">(13:45–15:30)</span>
              </span>
            ) : (
              <span className="text-slate-600">
                {mode === "CURRENT" ? (
                  strategy === "ALL" ? "📊 Current Analysis (All Strategies)" :
                  strategy === "TREND_RUNNER" ? "⚡ Current Trend Runner" :
                  strategy === "VWAP_PULLBACK" ? "🎯 Current VWAP Pullback" :
                  "🚀 Current Classical Breakout"
                ) : mode === "VALIDATED" ? (
                  `Filtered from Current Recos (≥ ${minScore}%)`
                ) : mode === "AI_VISION" ? (
                  `Current + History + AI Vision (≥ ${visionMinScore}%)`
                ) : (
                  "Triple Confirmation (Current + History + Vision)"
                )}
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Win Rate % */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {mode === "CURRENT" ? "Current Win Rate %" :
                 mode === "VALIDATED" ? "History Win Rate %" :
                 mode === "AI_VISION" ? "AI Vision Win Rate %" :
                 "Full 3-Step Win Rate %"}
              </span>
            </span>
            {activeMetrics.winRateWithBe !== undefined && !isLoading && (
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/70" title="Win Rate including Breakeven Protection">
                {activeMetrics.winRateWithBe}% Win+BE
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2 tracking-tight flex items-baseline gap-2">
            {isLoading ? (
              <span className="inline-block w-16 h-7 bg-slate-200/80 animate-pulse rounded-md" />
            ) : (
              <>
                <span>{activeMetrics.winRate}%</span>
                <span className="text-xs font-normal text-slate-500">
                  ({activeMetrics.success}/{activeMetrics.total} Targets)
                </span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {activeMetrics.success} Won
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {activeMetrics.failure} Stopped
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              {activeMetrics.tradeoff} BE
            </span>
          </div>
        </div>

        {/* Card 3: Avg Mins to Exit */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Avg Mins to Exit</span>
            </span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
              Holding Time
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight flex items-baseline gap-1.5">
            {isLoading ? (
              <span className="inline-block w-14 h-7 bg-slate-200/80 animate-pulse rounded-md" />
            ) : (
              <>
                <span>{activeMetrics.avgMins}</span>
                <span className="text-xs text-slate-500 font-medium">minutes</span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Walk-forward exit horizon
          </div>
        </div>

        {/* Card 4: Realistic Portfolio Return */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              <span>Portfolio Return</span>
            </span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
              10 Slots
            </span>
          </div>
          <div className={`text-2xl font-bold mt-2 tracking-tight flex items-baseline gap-1.5 ${activeMetrics.portfolioReturn >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {isLoading ? (
              <span className="inline-block w-16 h-7 bg-slate-200/80 animate-pulse rounded-md" />
            ) : (
              <span>{activeMetrics.portfolioReturn >= 0 ? `+${Number(activeMetrics.portfolioReturn).toFixed(2)}%` : `${Number(activeMetrics.portfolioReturn).toFixed(2)}%`}</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Avg/trade: <strong className={activeMetrics.avgTradePnl >= 0 ? "text-emerald-600" : "text-rose-600"}>{activeMetrics.avgTradePnl >= 0 ? "+" : ""}{Number(activeMetrics.avgTradePnl).toFixed(2)}%</strong> (net of 0.15% fee)
          </div>
        </div>
      </div>

      {/* 4. FILTER & SESSION NAVIGATION BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Row 1: Search + Session Timing Segmented Tabs */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search symbol or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Session Timing Segmented Tabs (Horizontal scroll on mobile, strict whitespace-nowrap) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none bg-slate-100/80 p-1 rounded-xl border border-slate-200/70 shrink-0">
            {/* All Day */}
            <button
              onClick={() => setSessionFilter("ALL")}
              className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all shrink-0 ${
                sessionFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>All Day</span>
            </button>

            {/* Morning */}
            <button
              onClick={() => setSessionFilter("MORNING")}
              className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all shrink-0 ${
                sessionFilter === "MORNING"
                  ? "bg-sky-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-sky-700 hover:bg-white/60"
              }`}
              title="09:15 to 11:30 IST - Morning Momentum & Breakouts"
            >
              <span>🌅 Morning</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium ${
                sessionFilter === "MORNING" ? "bg-sky-500/80 text-white" : "text-slate-400 bg-slate-200/60"
              }`}>
                09:15–11:30
              </span>
            </button>

            {/* Midday */}
            <button
              onClick={() => setSessionFilter("MIDDAY")}
              className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all shrink-0 ${
                sessionFilter === "MIDDAY"
                  ? "bg-amber-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-amber-700 hover:bg-white/60"
              }`}
              title="11:30 to 13:45 IST - Midday Absorption & Pullbacks"
            >
              <span>☀️ Midday</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium ${
                sessionFilter === "MIDDAY" ? "bg-amber-500/80 text-white" : "text-slate-400 bg-slate-200/60"
              }`}>
                11:30–13:45
              </span>
            </button>

            {/* Power Hour */}
            <button
              onClick={() => setSessionFilter("POWER_HOUR")}
              className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all shrink-0 ${
                sessionFilter === "POWER_HOUR"
                  ? "bg-purple-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-purple-700 hover:bg-white/60"
              }`}
              title="13:45 to 15:30 IST - Late Afternoon Power Hour"
            >
              <span>⚡ Power Hour</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium ${
                sessionFilter === "POWER_HOUR" ? "bg-purple-500/80 text-white" : "text-slate-400 bg-slate-200/60"
              }`}>
                13:45–15:30
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Dropdowns (Outcome, Quality) + Summary Counter Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Outcome Filter */}
            <div className="relative">
              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value as "ALL" | "SUCCESS" | "FAILURE" | "TRADEOFF")}
                className="appearance-none bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Outcome: All</option>
                <option value="SUCCESS">🟢 Target Hit</option>
                <option value="FAILURE">🔴 Stop Loss Hit</option>
                <option value="TRADEOFF">⚪ Square-Off (15:15)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
            </div>

            {/* Vault Quality Filter */}
            <div className="relative">
              <select
                value={vaultFilter}
                onChange={(e) => setVaultFilter(e.target.value as "ALL" | "ELIGIBLE" | "PRIME" | "SQUEEZE" | "DRYUP")}
                className="appearance-none bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Quality: All</option>
                <option value="PRIME">✨ Prime Tape (80+)</option>
                <option value="SQUEEZE">🔥 Squeezed (NR7)</option>
                <option value="DRYUP">💧 Supply Dry-Up</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Qualified Count Badge */}
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Showing <strong className="text-slate-900 font-bold">{filteredTrades.length}</strong> of {trades.length} qualified
            </span>
          </div>
        </div>
      </div>

      {/* 5. SIMULATION RESULTS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50 text-slate-600 font-bold text-xs tracking-tight">
                <th className="py-3 px-4">Instrument</th>
                <th
                  onClick={() => setSortOrder(prev => prev === "LATEST_FIRST" ? "OLDEST_FIRST" : "LATEST_FIRST")}
                  className="py-3 px-3 cursor-pointer hover:text-indigo-600 select-none group"
                  title="Click to sort by Signal Time"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Signal Time</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Buy Price</th>
                <th className="py-3 px-3 text-right">Target</th>
                <th className="py-3 px-3 text-right">Stop Loss</th>
                <th className="py-3 px-3 text-right">Exit Price</th>
                <th className="py-3 px-3 text-center">Outcome</th>
                <th className="py-3 px-3 text-right">P&L %</th>
                <th className="py-3 px-3 text-center">
                  Score (C / H / A)
                </th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400 animate-spin" />
                      <span>Walking forward through 1-minute exchange candles across full market session...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No simulation trades found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t, idx) => {
                  const isSuccess = t.outcome === "SUCCESS";
                  const isFailure = t.outcome === "FAILURE";
                  const isSquareOff = t.outcome === "TRADEOFF";

                  return (
                    <tr
                      key={`${t.symbol}-${idx}`}
                      onClick={() => {
                        setSelectedTrade(t);
                        setIsModalOpen(true);
                      }}
                      className="hover:bg-indigo-50/40 transition-colors group cursor-pointer"
                      title="Click to view 1-Pager Audit"
                    >
                      {/* 1. Instrument */}
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                              {t.symbol}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {t.exchange}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px]" title={t.company_name}>
                            {t.company_name}
                          </div>
                        </div>
                      </td>

                      {/* 2. Signal Time */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-800 font-bold text-xs">
                          {t.signal_time}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          IST
                        </div>
                      </td>

                      {/* 3. Buy Price */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                        ₹{t.entry_price.toLocaleString()}
                      </td>

                      {/* 4. Target Price */}
                      <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                        ₹{t.target_price.toLocaleString()}
                        <div className="text-[10px] text-emerald-600 font-sans mt-0.5">
                          +{(t.target_pct ?? 1.5).toFixed(1)}%
                        </div>
                      </td>

                      {/* 5. Stop Loss */}
                      <td className="py-3 px-3 text-right font-mono text-rose-600">
                        ₹{t.stop_loss.toLocaleString()}
                        <div className="text-[10px] text-rose-500 font-sans mt-0.5">
                          -{(t.stop_loss_pct ?? 0.7).toFixed(1)}%
                        </div>
                      </td>

                      {/* 6. Exit Price & Time */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          ₹{t.exit_price.toLocaleString()}
                        </div>
                        <div className="text-[10.5px] text-slate-500 mt-0.5">
                          at {t.exit_time} ({t.duration_mins}m)
                        </div>
                      </td>

                      {/* 7. Outcome Badge */}
                      <td className="py-3 px-3 text-center">
                        {isSuccess && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Target Hit
                          </span>
                        )}
                        {isFailure && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Stop Loss
                          </span>
                        )}
                        {isSquareOff && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold">
                            Square-Off
                          </span>
                        )}
                      </td>

                      {/* 8. P&L % */}
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={t.pnl_pct > 0 ? "text-emerald-600" : (t.pnl_pct < 0 ? "text-rose-600" : "text-slate-500")}>
                          {t.pnl_pct > 0 ? `+${t.pnl_pct.toFixed(2)}%` : `${t.pnl_pct.toFixed(2)}%`}
                        </span>
                      </td>

                      {/* 9. Inspect Score */}
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedTrade(t);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex flex-col items-start justify-center rounded-lg text-xs font-mono transition-all hover:bg-indigo-50 hover:border-indigo-300 bg-slate-50 border border-slate-200/90 px-3 py-1.5 cursor-pointer text-left min-w-[90px] shadow-2xs group"
                          title="Click to view 1-Pager audit"
                        >
                          <div className="flex items-center gap-1.5 text-[11px] leading-tight">
                            <span className="text-slate-400 font-sans font-bold">C:</span>
                            <span className="font-bold text-indigo-700">{t.score_100 ?? 80}%</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] leading-tight mt-0.5">
                            <span className="text-slate-400 font-sans font-bold">H:</span>
                            <span className="font-bold text-emerald-700">{t.history_score || t.vault_score || 50}%</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] leading-tight mt-0.5">
                            <span className="text-slate-400 font-sans font-bold">A:</span>
                            <span className="font-bold text-violet-700">{t.ai_vision_score || 70}%</span>
                          </div>
                        </button>
                      </td>

                      {/* 10. Buy Now Action */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setOrderTrade(t)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
                          title={`Buy ${t.symbol} via Dhan`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Buy Now</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. 1-PAGER AUDIT MODAL */}
      <TradeOnePagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trade={selectedTrade}
        simulationWinRate={winRateVal}
      />

      {/* 7. DHAN 1-CLICK ORDER EXECUTION PIPELINE */}
      {orderTrade && (
        <OrderPlacementModal
          key={`dhan-order-table-${orderTrade.symbol}`}
          isOpen={!!orderTrade}
          onClose={() => setOrderTrade(null)}
          recommendation={{
            symbol: orderTrade.symbol,
            company_name: orderTrade.company_name,
            bse_price: orderTrade.entry_price,
            entry_min: orderTrade.entry_price,
            entry_max: orderTrade.entry_price,
            target_price: orderTrade.target_price,
            stop_loss: orderTrade.stop_loss,
            conviction_tier: "TIER_1",
            phase3_score: orderTrade.score_100 || 90
          }}
        />
      )}
    </div>
  );
}

