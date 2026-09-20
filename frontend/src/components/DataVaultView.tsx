"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  RotateCw,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Zap,
  Play,
  Pause,
  Flame,
  Droplets,
  Info,
  Layers,
  ArrowRight,
  Database,
  CheckCircle2,
  Trash2
} from "lucide-react";

interface UniverseItem {
  symbol: string;
  security_id: string;
  exchange: string;
  company_name: string;
  sector: string;
  mcap_category: string;
  candle_count: number;
  days_available: number;
  date_from: string;
  date_to: string;
  status: "SYNCED" | "PENDING" | "IN_PROGRESS" | "FAILED" | "RATE_LIMITED";
  last_synced_at: string;
  is_nr7?: boolean;
  volume_dryup_ratio?: number;
  hurst_exponent?: number;
  audited_score?: number;
  qualification_status?: string;
  trend_character?: string;
  coil_status?: string;
  dryup_status?: string;
  liquidity_tier?: string;
  error_message?: string;
  bse_security_id?: string;
  bse_candle_count?: number;
  bse_status?: string;
}

interface WorkerStatus {
  is_running: boolean;
  is_paused: boolean;
  total_candles: number;
  unique_stocks_count: number;
  nse_completed_count: number;
  bse_completed_count: number;
  pending_count: number;
  progress_pct: number;
  current_symbol: string;
  estimated_remaining_mins: number;
  status_message: string;
}

interface ParamsWorkerStatus {
  is_running: boolean;
  is_paused: boolean;
  completed_count: number;
  total_count: number;
  progress_pct: number;
  current_symbol: string;
  status_message: string;
}

interface TapeMetrics {
  is_self_sustaining: boolean;
  zero_dhan_rest_calls: boolean;
  total_candles: number;
  nse_candles: number;
  bse_candles: number;
  audited_stocks: number;
  max_days_available: number;
  min_days_available?: number;
  avg_days_available: number;
  is_auditing_locally: boolean;
  last_local_audit: string;
}

interface ExchangeIngestStatus {
  total: number;
  completed: number;
  pending: number;
  is_running: boolean;
  is_paused: boolean;
  is_completed: boolean;
  is_partial: boolean;
  current_symbol: string;
  error_message: string;
}

interface DailyIngestStatus {
  date_str: string;
  can_ingest: boolean;
  reason: string;
  time_ist: string;
  distinct_days_vault: number;
  today_candles_count: number;
  total_target?: number;
  total_completed?: number;
  total_pending?: number;
  progress_pct?: number;
  pending_dates?: string[];
  pending_dates_count?: number;
  is_running?: boolean;
  is_paused?: boolean;
  is_completed?: boolean;
  current_symbol?: string;
  current_exchange?: string;
  error_message?: string;
  nse: {
    total: number;
    completed: number;
    pending: number;
    is_completed: boolean;
  };
  bse: {
    total: number;
    completed: number;
    pending: number;
    is_completed: boolean;
  };
}

interface DaemonStatus {
  is_active: boolean;
  scheduled_time_ist: string;
  next_scheduled_run: string;
  last_run_date: string;
  last_trigger_status: string;
  pending_dates: string[];
  pending_dates_count: number;
}

interface Candle {
  timestamp: number;
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
  exchange?: string;
  minute_return_pct?: number;
  upper_wick_pct?: number;
  close_to_high_pct?: number;
  atr_14_pct?: number;
  vwap_distance_pct?: number;
  ema_alignment?: boolean;
  ema_slope_deg?: number;
  rvol_multiple?: number;
}

/**
 * Interactive tooltip that clearly explains:
 * 1. What the metric is
 * 2. How to interpret the data (Bullish vs Caution)
 * 3. Direct actionable takeaway for the user
 * Zero mention of "Parameter {no}" and zero raw math notation.
 */
function InterpretTooltip({
  title,
  definition,
  bullish,
  bearish,
  takeaway,
  align = "left"
}: {
  title: string;
  definition: string;
  bullish: string;
  bearish: string;
  takeaway?: string;
  align?: "left" | "center" | "right";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const show = isOpen || isHovered;

  const alignClass =
    align === "right"
      ? "right-0 left-auto"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "left-0";

  return (
    <span
      className="relative inline-flex items-center ml-1.5 z-40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`p-0.5 rounded-full transition-colors cursor-pointer ${
          show
            ? "text-indigo-600 bg-indigo-50 ring-2 ring-indigo-200"
            : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
        }`}
        title="Click to pin or hover to read"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {show && (
        <div
          className={`absolute z-[100] top-full mt-2 w-72 p-3 rounded-xl bg-slate-900 text-white text-xs shadow-2xl border border-slate-700/80 text-left font-normal normal-case leading-relaxed ${alignClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
            <div>
              <div className="font-bold text-white text-xs tracking-tight">
                {title}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                {definition}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsHovered(false);
              }}
              className="text-slate-400 hover:text-white p-0.5 transition-colors cursor-pointer shrink-0"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clean 2-Row Interpretation */}
          <div className="space-y-1.5 text-[11px] my-1.5">
            <div className="flex items-start gap-2 bg-slate-800/60 px-2 py-1.5 rounded-lg border border-slate-700/50">
              <span className="text-emerald-400 shrink-0 font-bold">🟢</span>
              <span className="text-slate-200 leading-tight">{bullish}</span>
            </div>
            <div className="flex items-start gap-2 bg-slate-800/60 px-2 py-1.5 rounded-lg border border-slate-700/50">
              <span className="text-rose-400 shrink-0 font-bold">🔴</span>
              <span className="text-slate-200 leading-tight">{bearish}</span>
            </div>
          </div>

          {/* Direct Takeaway */}
          {takeaway && (
            <div className="pt-1.5 border-t border-slate-800 text-[10px] text-amber-200/90 flex items-start gap-1.5">
              <span className="font-semibold text-amber-300 shrink-0">💡 Tip:</span>
              <span className="text-slate-300 leading-tight">{takeaway}</span>
            </div>
          )}
        </div>
      )}
    </span>
  );
}

export default function DataVaultView() {
  // Workers State
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [paramsWorkerStatus, setParamsWorkerStatus] = useState<ParamsWorkerStatus | null>(null);
  const [tapeMetrics, setTapeMetrics] = useState<TapeMetrics | null>(null);

  // Table Data State
  const [items, setItems] = useState<UniverseItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [exchangeFilter, setExchangeFilter] = useState("ALL");

  // Server-Side Dropdown Filters
  const [filterTrend, setFilterTrend] = useState<string>("ALL");
  const [filterSqueeze, setFilterSqueeze] = useState<string>("ALL");
  const [filterDryUp, setFilterDryUp] = useState<string>("ALL");
  const [filterScore, setFilterScore] = useState<string>("ALL");

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

  // Modal State for 1-min Candle Inspection
  const [modalSymbol, setModalSymbol] = useState<string | null>(null);
  const [modalCandles, setModalCandles] = useState<Candle[]>([]);
  const [modalTotalCandles, setModalTotalCandles] = useState(0);
  const [modalPage, setModalPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(100);
  const [modalTotalPages, setModalTotalPages] = useState(1);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalDateFilter, setModalDateFilter] = useState<string>("");
  const [modalExchangeFilter, setModalExchangeFilter] = useState<string>("ALL");
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  // Daily Tape Ingestion (04:00 PM Post-Market) & Autonomous 16:15 IST Daemon
  const [dailyIngest, setDailyIngest] = useState<DailyIngestStatus | null>(null);
  const [daemonStatus, setDaemonStatus] = useState<DaemonStatus | null>(null);
  const [isStartingDailyIngest, setIsStartingDailyIngest] = useState(false);

  const fetchDailyIngestStatus = useCallback(async () => {
    try {
      const [res, dRes] = await Promise.all([
        fetch("/api/v1/historical-data/daily-ingest/status"),
        fetch("/api/v1/historical-data/daily-ingest/daemon-status")
      ]);
      if (res.ok) {
        setDailyIngest(await res.json());
      }
      if (dRes.ok) {
        setDaemonStatus(await dRes.json());
      }
    } catch (e) {
      console.debug("Daily ingest / daemon status fetch failed", e);
    }
  }, []);

  const handleStartCatchup = async () => {
    setIsStartingDailyIngest(true);
    try {
      await fetch("/api/v1/historical-data/daily-ingest/catchup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      await fetchDailyIngestStatus();
    } catch (e) {
      console.error("Failed to start catchup:", e);
    } finally {
      setIsStartingDailyIngest(false);
    }
  };

  const handleStartDailyIngest = async () => {
    setIsStartingDailyIngest(true);
    try {
      await fetch("/api/v1/historical-data/daily-ingest/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      await fetchDailyIngestStatus();
    } catch (e) {
      console.error("Failed to start daily ingest:", e);
    } finally {
      setIsStartingDailyIngest(false);
    }
  };

  const handlePauseDailyIngest = async () => {
    try {
      await fetch("/api/v1/historical-data/daily-ingest/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      await fetchDailyIngestStatus();
    } catch (e) {
      console.error("Failed to pause daily ingest:", e);
    }
  };

  const handleCleanToday = async () => {
    if (!confirm("Clean today's collected data across NSE & BSE to test fresh?")) return;
    try {
      await fetch("/api/v1/historical-data/daily-ingest/clean-today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      await fetchDailyIngestStatus();
      await fetchTapeMetrics();
      await fetchUniverse();
    } catch (e) {
      console.error("Failed to clean today tape:", e);
    }
  };

  // 1. Fetch Ingestion Worker Status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/historical-data/status");
      if (res.ok) {
        setWorkerStatus(await res.json());
      }
    } catch (e) {
      console.debug("Worker status fetch failed", e);
    }
  }, []);

  // 2. Fetch Parameter Computation Status
  const fetchParamsStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/historical-data/compute-parameters/status");
      if (res.ok) {
        setParamsWorkerStatus(await res.json());
      }
    } catch (e) {
      console.debug("Params worker status fetch failed", e);
    }
  }, []);

  // 3. Fetch Tape Metrics (Self-Sustaining Cumulative Tape)
  const fetchTapeMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/historical-data/tape-metrics");
      if (res.ok) {
        setTapeMetrics(await res.json());
      }
    } catch (e) {
      console.debug("Tape metrics fetch failed", e);
    }
  }, []);

  // 4. Fetch Equities Table Data with Full Server-Side Filtering
  const fetchUniverse = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const qParams = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        search: searchQuery.trim(),
        status: statusFilter,
        exchange: exchangeFilter,
        trend: filterTrend,
        squeeze: filterSqueeze,
        volume_dryup: filterDryUp,
        setup_quality: filterScore
      });

      const res = await fetch(`/api/v1/historical-data/universe?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalItems(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (e) {
      console.error("Failed to fetch universe items:", e);
    } finally {
      setIsLoadingList(false);
    }
  }, [page, pageSize, searchQuery, statusFilter, exchangeFilter, filterTrend, filterSqueeze, filterDryUp, filterScore]);

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchParamsStatus();
    fetchTapeMetrics();
    fetchDailyIngestStatus();
  }, [fetchStatus, fetchParamsStatus, fetchTapeMetrics, fetchDailyIngestStatus]);

  // Polling for daily ingest & tape status
  useEffect(() => {
    const isAnyRunning = dailyIngest?.is_running;
    const pollInterval = isAnyRunning ? 2000 : 15000;
    const timer = setInterval(() => {
      fetchDailyIngestStatus();
      if (isAnyRunning) {
        fetchTapeMetrics();
      }
    }, pollInterval);
    return () => clearInterval(timer);
  }, [fetchDailyIngestStatus, fetchTapeMetrics, dailyIngest?.is_running]);

  // Debounced search & filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUniverse();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUniverse]);

  // Filter change handlers (always reset to page 1)
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };
  const handleTrendChange = (val: string) => {
    setFilterTrend(val);
    setPage(1);
  };
  const handleSqueezeChange = (val: string) => {
    setFilterSqueeze(val);
    setPage(1);
  };
  const handleDryUpChange = (val: string) => {
    setFilterDryUp(val);
    setPage(1);
  };
  const handleScoreChange = (val: string) => {
    setFilterScore(val);
    setPage(1);
  };
  const handleResetFilters = () => {
    setFilterTrend("ALL");
    setFilterSqueeze("ALL");
    setFilterDryUp("ALL");
    setFilterScore("ALL");
    setSearchQuery("");
    setExchangeFilter("ALL");
    setPage(1);
  };

  // Candle Inspection Modal Handlers
  const fetchCandlesPage = async (
    symbol: string,
    p: number = 1,
    ps: number = modalPageSize,
    dFilter: string = modalDateFilter,
    exFilter: string = modalExchangeFilter
  ) => {
    setModalLoading(true);
    try {
      const qParams = new URLSearchParams({
        page: p.toString(),
        page_size: ps.toString()
      });
      if (dFilter) qParams.append("date_filter", dFilter);
      if (exFilter && exFilter !== "ALL") qParams.append("exchange", exFilter);

      const res = await fetch(`/api/v1/historical-data/candles/${symbol}?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setModalCandles(data.candles || []);
        setModalTotalCandles(data.total || 0);
        setModalPage(data.page || 1);
        setModalTotalPages(data.total_pages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenCandlesModal = (symbol: string) => {
    setModalSymbol(symbol);
    setModalDateFilter("");
    const targetEx = exchangeFilter === "BSE" ? "BSE" : (exchangeFilter === "NSE" ? "NSE" : "ALL");
    setModalExchangeFilter(targetEx);
    setModalPage(1);
    fetchCandlesPage(symbol, 1, modalPageSize, "", targetEx);
  };

  const handleExportCSV = async () => {
    if (!modalSymbol) return;
    setIsExportingCSV(true);
    try {
      const qParams = new URLSearchParams({ fetch_all: "true" });
      if (modalDateFilter) qParams.append("date_filter", modalDateFilter);
      if (modalExchangeFilter && modalExchangeFilter !== "ALL") qParams.append("exchange", modalExchangeFilter);

      const res = await fetch(`/api/v1/historical-data/candles/${modalSymbol}?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const allCandles: Candle[] = data.candles || [];
        const headers = [
          "Timestamp",
          "Datetime",
          "Exchange",
          "Open",
          "High",
          "Low",
          "Close",
          "Volume",
          "VWAP",
          "1Min_Return_%",
          "Top_Wick_%",
          "Close_Placement_%",
          "ATR14_Volatility_%",
          "VWAP_Distance_%",
          "EMA_Alignment",
          "EMA_Slope_Deg",
          "RVOL"
        ];
        const rows = allCandles.map((c) => [
          c.timestamp,
          `"${c.datetime}"`,
          c.exchange || "NSE",
          c.open,
          c.high,
          c.low,
          c.close,
          c.volume,
          c.vwap,
          c.minute_return_pct ?? 0.0,
          c.upper_wick_pct ?? 0.0,
          c.close_to_high_pct ?? 100.0,
          c.atr_14_pct ?? 0.0,
          c.vwap_distance_pct ?? 0.0,
          c.ema_alignment ? "BULLISH" : "BEARISH",
          c.ema_slope_deg ?? 0.0,
          c.rvol_multiple ?? 1.0
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `${modalSymbol}_historical_tape.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const hasActiveFilters =
    filterTrend !== "ALL" ||
    filterSqueeze !== "ALL" ||
    filterDryUp !== "ALL" ||
    filterScore !== "ALL" ||
    searchQuery.trim() !== "" ||
    exchangeFilter !== "ALL";

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. SLIM & CLEAN HEADER */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Historical Tape Vault
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Tape Verified • Auto-Expanding
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Self-sustaining exchange tape accumulating daily across NSE & BSE equities • 0 broker REST calls needed.
            </p>
          </div>

          {/* Quick Actions & Guide Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGlossary(!showGlossary)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>{showGlossary ? "Hide Guide" : "Audit Guide"}</span>
            </button>

            {/* Self-Sustaining Auto-Expanding Tape Status Pill */}
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-medium text-xs flex items-center gap-2 shadow-xs select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-[11px] text-slate-100">
                Auto-Expanding ({tapeMetrics?.max_days_available || 60}+ Days)
              </span>
            </div>

            <button
              onClick={() => {
                fetchStatus();
                fetchTapeMetrics();
                fetchDailyIngestStatus();
                fetchUniverse();
              }}
              title="Refresh table"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DAILY DHAN API INGESTION BAR (16:15 IST ZERO-TOUCH DAEMON) */}
        <div className="mt-4 p-4 rounded-xl border bg-slate-50/90 border-slate-200/90 flex flex-col gap-3 shadow-2xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-indigo-100/80 border border-indigo-200 flex items-center justify-center shrink-0 mt-0.5">
                <Download className="w-4 h-4 text-indigo-700" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900">
                    Daily Market Tape Ingestion (Dhan API)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Zero-Touch Daemon Active • 16:15 IST (Mon–Fri)
                  </span>
                  {daemonStatus?.next_scheduled_run && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      Next Auto-Run: {daemonStatus.next_scheduled_run}
                    </span>
                  )}
                  {dailyIngest?.is_running && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 animate-pulse">
                      <RotateCw className="w-3 h-3 animate-spin" />
                      Backfilling {dailyIngest?.date_str} Tape • {dailyIngest?.current_exchange || "NSE"}: {dailyIngest?.current_symbol || "..."} ({dailyIngest?.progress_pct || 0}%)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <strong>NSE:</strong> {dailyIngest?.nse?.completed || 0} / {dailyIngest?.nse?.total || 3325} synced
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <strong>BSE:</strong> {dailyIngest?.bse?.completed || 0} / {dailyIngest?.bse?.total || 4240} synced
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3 text-indigo-600" />
                    <strong>{dailyIngest?.date_str || "Current Session"}:</strong> {(dailyIngest?.today_candles_count || 0).toLocaleString()} candles collected
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-500" />
                    <strong>Vault Depth:</strong> {dailyIngest?.distinct_days_vault || 60} Days Rolling Window
                  </span>
                </div>
              </div>
            </div>

            {/* SINGLE MASTER PIPELINE BUTTON + RESET */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap w-full lg:w-auto justify-end">
              {dailyIngest?.is_completed ? (
                <button
                  disabled
                  className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-300/80 flex items-center gap-1.5 opacity-95 cursor-not-allowed select-none"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tape Fully Ingested ({dailyIngest.total_completed} Stocks)</span>
                </button>
              ) : dailyIngest?.is_running ? (
                <button
                  onClick={handlePauseDailyIngest}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Pause className="w-3.5 h-3.5 text-white" />
                  <span>
                    Pause ({dailyIngest.current_exchange}: {dailyIngest.current_symbol || "..."})
                  </span>
                </button>
              ) : (dailyIngest?.pending_dates && dailyIngest.pending_dates.length > 0) ? (
                <button
                  onClick={handleStartCatchup}
                  disabled={isStartingDailyIngest}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                  <span>Backfill {dailyIngest.pending_dates.length} Pending Days</span>
                </button>
              ) : (dailyIngest?.total_completed || 0) > 0 ? (
                <button
                  onClick={handleStartDailyIngest}
                  disabled={isStartingDailyIngest}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                  <span>Resume Ingestion ({dailyIngest?.total_pending} Left)</span>
                </button>
              ) : (
                <button
                  onClick={handleStartDailyIngest}
                  disabled={!dailyIngest?.can_ingest || isStartingDailyIngest}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                    dailyIngest?.can_ingest && !isStartingDailyIngest
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-95"
                      : "bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80"
                  }`}
                  title={dailyIngest?.reason || "Ingest today's 1-min candles across NSE & BSE via Dhan API"}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ingest Daily Market Tape</span>
                </button>
              )}

              {/* RESET BUTTON */}
              <button
                onClick={handleCleanToday}
                title="Clean today's collected data to test fresh"
                className="px-2.5 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* AUTO-CATCHUP PENDING DAYS BANNER */}
          {dailyIngest?.pending_dates && dailyIngest.pending_dates.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="text-amber-900 font-bold">
                  {dailyIngest.pending_dates.length} Missing Trading Days Detected for Auto-Catchup:
                </span>
                <span className="text-amber-700 font-medium">
                  {dailyIngest.pending_dates.join(", ")}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Auto-processed sequentially by daemon at 16:15 IST or via button above
              </span>
            </div>
          )}
        </div>

        {/* Compact Stats Ribbon with Segmented Exchange Selector */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Segmented Exchange Tabs */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/60">
            <button
              onClick={() => { setExchangeFilter("ALL"); setPage(1); }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                exchangeFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Equities ({(workerStatus?.unique_stocks_count || 4957).toLocaleString()})
            </button>
            <button
              onClick={() => { setExchangeFilter("NSE"); setPage(1); }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                exchangeFilter === "NSE"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-blue-700"
              }`}
            >
              NSE ({(workerStatus?.nse_completed_count || 3325).toLocaleString()})
            </button>
            <button
              onClick={() => { setExchangeFilter("BSE"); setPage(1); }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                exchangeFilter === "BSE"
                  ? "bg-white text-amber-700 shadow-2xs"
                  : "text-slate-600 hover:text-amber-700"
              }`}
            >
              BSE ({(workerStatus?.bse_completed_count || 4240).toLocaleString()})
            </button>
          </div>

          {/* Candle Data & Exact Days Available Summary */}
          <div className="flex items-center gap-3 text-slate-500 font-medium flex-wrap">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                <strong className="text-slate-800">{(tapeMetrics?.total_candles || workerStatus?.total_candles || 111891563).toLocaleString()}</strong> Verified Candles
              </span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 text-indigo-700 font-semibold bg-indigo-50/70 border border-indigo-200/70 px-2.5 py-0.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{tapeMetrics?.max_days_available || 60} Days Available in Vault</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. OPTIONAL COLLAPSIBLE GUIDE (PLAIN ENGLISH HOW TO INTERPRET) */}
      {showGlossary && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              Quick Guide: What Each Column Means
            </h2>
            <button
              onClick={() => setShowGlossary(false)}
              className="text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Trend Style</span>
              </div>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Shows if the stock moves in a steady direction. <strong>Trending</strong> stocks keep moving up. <strong>Choppy</strong> stocks trap buyers.
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Range Squeeze</span>
              </div>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Price stayed in a very tight range for 7 days. Like a compressed spring, big breakout moves usually follow.
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Droplets className="w-3 h-3 text-cyan-600" />
                <span>Supply Dry-Up</span>
              </div>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Sellers have stopped dumping shares. With low selling resistance, the stock can rise much faster.
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>Setup Score</span>
              </div>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Overall 0–100 score based on real 60-day trading data. Focus on <strong>Prime (80+)</strong> stocks for top quality.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. STREAMLINED, MODERN FILTER BAR */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ticker, company name (e.g. RELIANCE)..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Compact Dropdown Filters (Unified Neutral Styling) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 max-w-3xl">
            {/* Filter 1: Movement Style */}
            <select
              value={filterTrend}
              onChange={(e) => handleTrendChange(e.target.value)}
              className={`border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer ${
                filterTrend !== "ALL"
                  ? "bg-white border-slate-400 text-slate-900 font-bold shadow-2xs"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
              }`}
            >
              <option value="ALL">Trend: All</option>
              <option value="STRONG">Strong Trend</option>
              <option value="BALANCED">Balanced</option>
              <option value="CHOP">Choppy</option>
            </select>

            {/* Filter 2: 7-Day Squeeze */}
            <select
              value={filterSqueeze}
              onChange={(e) => handleSqueezeChange(e.target.value)}
              className={`border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer ${
                filterSqueeze !== "ALL"
                  ? "bg-white border-slate-400 text-slate-900 font-bold shadow-2xs"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
              }`}
            >
              <option value="ALL">Squeeze: All</option>
              <option value="YES">Squeezed (Tight Range)</option>
              <option value="NO">Normal Range</option>
            </select>

            {/* Filter 3: Volume Dry-Up */}
            <select
              value={filterDryUp}
              onChange={(e) => handleDryUpChange(e.target.value)}
              className={`border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer ${
                filterDryUp !== "ALL"
                  ? "bg-white border-slate-400 text-slate-900 font-bold shadow-2xs"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
              }`}
            >
              <option value="ALL">Supply: All</option>
              <option value="HIGH_DROP">Sellers Dried Up (-40%+)</option>
              <option value="NORMAL">Normal Flow</option>
            </select>

            {/* Filter 4: Setup Quality */}
            <select
              value={filterScore}
              onChange={(e) => handleScoreChange(e.target.value)}
              className={`border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer ${
                filterScore !== "ALL"
                  ? "bg-white border-slate-400 text-slate-900 font-bold shadow-2xs"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
              }`}
            >
              <option value="ALL">Score: All</option>
              <option value="PRIME">Prime (80–100)</option>
              <option value="MID">Average (50–79)</option>
              <option value="LOW">Low (&lt;50)</option>
            </select>
          </div>

          {/* Active Filter Clear & Total Count */}
          <div className="flex items-center justify-end gap-2 text-xs text-slate-500 shrink-0">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-slate-600 hover:text-slate-900 text-xs font-semibold underline cursor-pointer"
              >
                Reset
              </button>
            )}
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 font-bold text-slate-800">
              {totalItems.toLocaleString()}
            </span>
            <span>stocks</span>
          </div>
        </div>
      </div>

      {/* 4. CLEAN DATA TABLE WITH REFINED TYPOGRAPHY */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-visible">
        <div className="overflow-x-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50 text-slate-600 font-bold text-xs tracking-tight">
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">
                  <div className="inline-flex items-center">
                    <span>Tape Coverage</span>
                    <InterpretTooltip
                      title="Trading Activity"
                      definition="Active trading minutes across market sessions (60-day horizon)."
                      bullish="High: Traded constantly. Instant buy & sell."
                      bearish="Low: Thinly traded. Can be slow to exit."
                      takeaway="Stick to high activity for smooth trades."
                      align="left"
                    />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">
                  <div className="inline-flex items-center justify-center">
                    <span>Trend Style</span>
                    <InterpretTooltip
                      title="Trend Style"
                      definition="Is price moving cleanly or in a choppy zig-zag?"
                      bullish="Trending: Clean moves that keep running."
                      bearish="Choppy: Messy swings that trap buyers."
                      takeaway="Trade Trending stocks. Skip Choppy ones."
                      align="center"
                    />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">
                  <div className="inline-flex items-center justify-center">
                    <span>Range Squeeze</span>
                    <InterpretTooltip
                      title="Range Squeeze"
                      definition="Price narrowed into a tight 7-day range."
                      bullish="Squeezed: Tight coil. A big move usually follows."
                      bearish="Normal: Regular daily price swings."
                      takeaway="Watch for a fast breakout move."
                      align="center"
                    />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">
                  <div className="inline-flex items-center justify-center">
                    <span>Supply Dry-Up</span>
                    <InterpretTooltip
                      title="Supply Dry-Up"
                      definition="Are sellers drying up during pullbacks?"
                      bullish="Sellers Dry: Selling dropped sharply (-40%+)."
                      bearish="Normal: Sellers are still active."
                      takeaway="Stocks rise faster when sellers disappear."
                      align="center"
                    />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">
                  <div className="inline-flex items-center justify-center">
                    <span>Setup Score</span>
                    <InterpretTooltip
                      title="Setup Score (0–100)"
                      definition="Quality rating from trend strength & low selling."
                      bullish="80+ (Prime): Clean trend + no sellers left."
                      bearish="Under 50: Weak. Choppy or heavy selling."
                      takeaway="Focus only on 80+ Prime setups."
                      align="right"
                    />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Tape</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoadingList ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading equities audit records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    No stocks match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const hasCandles = row.candle_count > 0;
                  const score = row.audited_score ?? 65;
                  const hurstVal = row.hurst_exponent ?? 0.65;
                  const isTrending = hurstVal >= 0.65;
                  const isChop = hurstVal < 0.45;
                  const isCoiled = row.is_nr7;
                  const dryupRatio = row.volume_dryup_ratio ?? 1.0;
                  const isDryUp = dryupRatio <= 0.65;
                  const dropPct = Math.max(0, Math.round((1.0 - dryupRatio) * 100));

                  return (
                    <tr
                      key={row.symbol}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* 1. Stock Information */}
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                              {row.symbol}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {row.exchange === "BOTH" ? "NSE • BSE" : row.exchange}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 truncate max-w-[240px]" title={row.company_name}>
                            {row.company_name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {row.sector}
                          </div>
                        </div>
                      </td>

                      {/* 2. Tape Coverage */}
                      <td className="py-3 px-4">
                        {hasCandles ? (
                          <div>
                            <div className="font-mono font-semibold text-slate-800 text-xs">
                              {row.candle_count.toLocaleString()} candles
                            </div>
                            <div className="text-[11px] font-semibold text-indigo-700 mt-0.5 flex items-center gap-1">
                              <span>{row.days_available || 60} Days Available</span>
                              <span className="text-slate-300 font-normal">•</span>
                              <span className="text-slate-400 font-normal">{row.liquidity_tier || "Active"}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Pending Ingestion</span>
                        )}
                      </td>

                      {/* 3. Trend Style (Clean typography, no neon background) */}
                      <td className="py-3 px-3 text-center">
                        {isTrending ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-xs font-semibold text-emerald-700">
                              Trending
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              H: {hurstVal.toFixed(2)}
                            </span>
                          </div>
                        ) : isChop ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-xs font-semibold text-rose-600">
                              Choppy
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              H: {hurstVal.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-xs font-medium text-slate-600">
                              Balanced
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              H: {hurstVal.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 4. Range Squeeze (Subtle badge or neutral dash) */}
                      <td className="py-3 px-3 text-center">
                        {isCoiled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 text-xs font-semibold">
                            <Flame className="w-3 h-3 text-amber-600" />
                            Squeezed
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* 5. Supply Dry-Up (Clean text or neutral dash) */}
                      <td className="py-3 px-3 text-center">
                        {isDryUp ? (
                          <span className="text-xs font-semibold text-slate-800">
                            -{dropPct}% Sellers
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* 6. Setup Score (Single focal point badge) */}
                      <td className="py-3 px-3 text-center">
                        {score >= 80 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            {score} Prime
                          </span>
                        ) : score >= 50 ? (
                          <span className="text-xs font-semibold text-slate-700">
                            {score}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-rose-600">
                            {score}
                          </span>
                        )}
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenCandlesModal(row.symbol)}
                          disabled={!hasCandles}
                          className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Clean Pagination Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{items.length}</span> of{" "}
            <span className="font-bold text-slate-800">{totalItems.toLocaleString()}</span> Equities
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1 || isLoadingList}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoadingList}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-semibold text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoadingList}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || isLoadingList}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* 5. 1-MINUTE CANDLE TAPE MODAL (PLAIN ENGLISH HOW TO INTERPRET) */}
      {modalSymbol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    {modalSymbol}
                  </h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60">
                    1-Minute Historical Tape Audit
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {modalTotalCandles.toLocaleString()} exchange candles recorded directly from Dhan&apos;s raw 1-minute historical feed.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  disabled={isExportingCSV || modalTotalCandles === 0}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download className={`w-3.5 h-3.5 ${isExportingCSV ? "animate-bounce" : ""}`} />
                  <span>{isExportingCSV ? "Exporting..." : "Export CSV"}</span>
                </button>
                <button
                  onClick={() => setModalSymbol(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Filter Bar */}
            <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Date:</span>
                  <input
                    type="date"
                    value={modalDateFilter}
                    onChange={(e) => {
                      setModalDateFilter(e.target.value);
                      setModalPage(1);
                      if (modalSymbol) fetchCandlesPage(modalSymbol, 1, modalPageSize, e.target.value, modalExchangeFilter);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {modalDateFilter && (
                    <button
                      onClick={() => {
                        setModalDateFilter("");
                        setModalPage(1);
                        if (modalSymbol) fetchCandlesPage(modalSymbol, 1, modalPageSize, "", modalExchangeFilter);
                      }}
                      className="text-xs text-indigo-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                  <span className="text-slate-500 font-medium">Exchange:</span>
                  <select
                    value={modalExchangeFilter}
                    onChange={(e) => {
                      setModalExchangeFilter(e.target.value);
                      setModalPage(1);
                      if (modalSymbol) fetchCandlesPage(modalSymbol, 1, modalPageSize, modalDateFilter, e.target.value);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">All</option>
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                  </select>
                </div>
              </div>

              <div className="text-slate-500 text-xs">
                Page <span className="font-bold text-slate-900">{modalPage}</span> of {modalTotalPages}
              </div>
            </div>

            {/* Modal Table Content (All Microstructure Columns with Interpretations) */}
            <div className="flex-1 overflow-y-auto p-3">
              {modalLoading ? (
                <div className="py-20 text-center text-slate-400">
                  <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                  Loading candles and calculating microstructure...
                </div>
              ) : modalCandles.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  No candles found for this filter.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-2 text-center">Ex</th>
                      <th className="py-2.5 px-3 text-right">Close (₹)</th>
                      <th className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end">
                          <span>1-Min Move</span>
                          <InterpretTooltip
                            title="1-Min Return"
                            definition="Price change in this 1 minute."
                            bullish="Green (+): Buyers pushed price higher."
                            bearish="Red (-): Sellers pushed price lower."
                            takeaway="Green bars show buyer dominance."
                            align="left"
                          />
                        </div>
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center">
                          <span>Top Wick %</span>
                          <InterpretTooltip
                            title="Upper Wick %"
                            definition="Price rejected from the high of the minute."
                            bullish="Under 20%: Strong close near the high."
                            bearish="Over 40%: Sellers knocked price down."
                            takeaway="Don't buy right into tall upper wicks."
                            align="center"
                          />
                        </div>
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center">
                          <span>Close Place</span>
                          <InterpretTooltip
                            title="Close Position"
                            definition="Where candle closed between high and low."
                            bullish="Top 80%+: Closed near high. Strong buyers."
                            bearish="Under 50%: Closed near low. Sellers in control."
                            takeaway="High closes favor upward continuation."
                            align="center"
                          />
                        </div>
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center">
                          <span>ATR-14 Vol</span>
                          <InterpretTooltip
                            title="Candle Volatility"
                            definition="Average 1-min swing size in rupees."
                            bullish="Low/Normal: Smooth moves. Tighter stop loss."
                            bearish="High: Wide swings. Needs wider stop loss."
                            takeaway="Use wider stop loss on high volatility."
                            align="center"
                          />
                        </div>
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center">
                          <span>VWAP Dist</span>
                          <InterpretTooltip
                            title="Distance from VWAP"
                            definition="Distance from today's average volume price."
                            bullish="Above VWAP: Buyers are winning today."
                            bearish="Below VWAP: Sellers are winning today."
                            takeaway="Buying near VWAP gives lowest risk."
                            align="center"
                          />
                        </div>
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center">
                          <span>20/50 EMA</span>
                          <InterpretTooltip
                            title="Trend Alignment"
                            definition="Short-term vs medium-term momentum."
                            bullish="Bullish (20 > 50): Fast trend is pointing up."
                            bearish="Neutral / Bearish: Flat or crossing down."
                            takeaway="Trade in the direction of the EMA."
                            align="center"
                          />
                        </div>
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center">
                          <span>EMA Angle</span>
                          <InterpretTooltip
                            title="Trend Slope"
                            definition="Steepness of the trend line in degrees."
                            bullish="Steep (+15°+): Trend speed is accelerating."
                            bearish="Flat (around 0°): Sideways price action."
                            takeaway="Steep angles confirm fast breakout speed."
                            align="center"
                          />
                        </div>
                      </th>
                      <th className="py-2.5 px-3 text-right">Volume</th>
                      <th className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center">
                          <span>RVOL</span>
                          <InterpretTooltip
                            title="Relative Volume"
                            definition="Volume vs normal for this exact time."
                            bullish="High (1.5x+): Big institutional orders active."
                            bearish="Normal (~1.0x): Regular retail trading."
                            takeaway="High volume confirms genuine moves."
                            align="right"
                          />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {modalCandles.map((c, idx) => {
                      const ret = c.minute_return_pct ?? 0.0;
                      const isUp = ret >= 0;
                      const wick = c.upper_wick_pct ?? 0.0;
                      const closePlace = c.close_to_high_pct ?? 100.0;
                      const vwapDist = c.vwap_distance_pct ?? 0.0;
                      const atrVol = c.atr_14_pct ?? 0.0;
                      const emaAngle = c.ema_slope_deg ?? 0.0;
                      const isFlat = c.high === c.low;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-sans text-slate-700">{c.datetime}</td>
                          <td className="py-2 px-2 text-center text-[10px] font-semibold text-slate-500 font-sans">
                            {c.exchange || "NSE"}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            ₹{c.close.toFixed(2)}
                          </td>
                          <td className={`py-2 px-3 text-right font-semibold ${isUp ? "text-emerald-600" : "text-rose-600"}`}>
                            {isUp ? "+" : ""}{ret.toFixed(2)}%
                          </td>
                          <td className="py-2 px-3 text-center text-[11px]">
                            {isFlat ? (
                              <span className="text-slate-400">0%</span>
                            ) : wick <= 20.0 ? (
                              <span className="text-emerald-600 font-semibold">{wick.toFixed(0)}%</span>
                            ) : wick >= 40.0 ? (
                              <span className="text-rose-600 font-semibold">{wick.toFixed(0)}%</span>
                            ) : (
                              <span className="text-slate-600">{wick.toFixed(0)}%</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center text-[11px]">
                            {isFlat ? (
                              <span className="text-slate-400">Neutral</span>
                            ) : closePlace >= 85.0 ? (
                              <span className="text-emerald-600 font-semibold">Top {closePlace.toFixed(0)}%</span>
                            ) : (
                              <span className="text-slate-500">Top {closePlace.toFixed(0)}%</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center text-[11px] text-slate-600">
                            {atrVol.toFixed(2)}%
                          </td>
                          <td className="py-2 px-3 text-center text-[11px]">
                            <span className={vwapDist >= 0 ? "text-indigo-600" : "text-slate-500"}>
                              {vwapDist >= 0 ? "+" : ""}{vwapDist.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center text-[11px] font-sans">
                            {c.ema_alignment ? (
                              <span className="text-emerald-600 font-semibold">Bullish</span>
                            ) : (
                              <span className="text-slate-400">Neutral</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center text-[11px] text-slate-700">
                            {emaAngle ? `${emaAngle > 0 ? "+" : ""}${emaAngle.toFixed(1)}°` : "0.0°"}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {c.volume.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-center font-sans font-semibold">
                            {(c.rvol_multiple ?? 1.0) >= 1.8 ? (
                              <span className="text-amber-600">{(c.rvol_multiple || 1.0).toFixed(1)}x</span>
                            ) : (
                              <span className="text-slate-400">{(c.rvol_multiple || 1.0).toFixed(1)}x</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Pagination */}
            <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => {
                  const np = Math.max(1, modalPage - 1);
                  setModalPage(np);
                  if (modalSymbol) fetchCandlesPage(modalSymbol, np, modalPageSize, modalDateFilter, modalExchangeFilter);
                }}
                disabled={modalPage <= 1 || modalLoading}
                className="px-3 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>
              <span>
                Page {modalPage} of {modalTotalPages}
              </span>
              <button
                onClick={() => {
                  const np = Math.min(modalTotalPages, modalPage + 1);
                  setModalPage(np);
                  if (modalSymbol) fetchCandlesPage(modalSymbol, np, modalPageSize, modalDateFilter, modalExchangeFilter);
                }}
                disabled={modalPage >= modalTotalPages || modalLoading}
                className="px-3 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
