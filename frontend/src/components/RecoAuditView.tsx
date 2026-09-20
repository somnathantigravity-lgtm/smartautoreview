"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Target,
  ArrowUp,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Shield,
  Activity,
  Check,
  Lock,
  Calendar,
  X
} from "lucide-react";
import { RecoAuditReasonModal } from "./RecoAuditReasonModal";

interface RecoAuditViewProps {
  onNavigateToRules?: () => void;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  is_active?: boolean;
  block_a_morning_filters?: any;
  block_b_current_params?: any;
  block_c_validate_history?: any;
  block_d_ai_vision?: any;
}

interface AuditMatrixItem {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  market_cap_category: string;
  ltp: number;
  change: number;
  change_pct: number;
  volume: number;
  bid_qty: number;
  ask_qty: number;
  bid_pct: number;
  score_wa: number;
  score_c: number;
  score_h: number;
  score_a: number;
  target_hits: number;
  total_setups: number;
  hit_rate_pct: number;
  daily_triggers?: number;
  daily_hits?: number;
  daily_checks?: number;
  target_hits_ratio?: string; // e.g. "2/225"
  target_hit_pct?: number;
  daily_stopped?: number;
  daily_outcome?: "BULLS_EYE" | "BEAR" | "ACTIVE" | "NONE";
  daily_outcome_label?: string;
  price_pass?: boolean;
  vol_pass?: boolean;
  audit_date?: string;
  policy_passed: boolean;
  policy_status: "PASSED" | "HELD";
  policy_fail_desc: string;
  reasons: string[];
  has_live_reco: boolean;
  tick_flash?: "up" | "down" | null;
  execution_gate_status?: "GO" | "WAITING";
  trigger_price?: number;
  trigger_gap_pct?: number;
  day_high?: number;
  day_low?: number;
  rvol?: number;
  vwap?: number;
  execution_gate_reasons?: string[];
  vwap_dist_pct?: number;
  base_compression_pct?: number;
  max_base_compression_pct?: number;
  min_rvol_required?: number;
  hod_tolerance_ratio?: number;
  max_vwap_distance_pct?: number;
  orderbook_ratio?: number;
  session_name?: string;
  session_quota_max?: number;
  session_quota_allocated?: number;
  is_hod_pass?: boolean;
  is_rvol_pass?: boolean;
  is_vwap_pass?: boolean;
  is_base_pass?: boolean;
  is_ob_pass?: boolean;
  is_quota_pass?: boolean;
  pillar_i_passed?: boolean;
  pillar_i_ratio?: string;
  pillar_c_points?: number;
  pillar_c_ratio?: string;
  pillar_h_points?: number;
  pillar_h_ratio?: string;
  pillar_p_status?: "GO" | "WAITING";
  pillar_p_ratio?: string;
  pillar_a_score?: number;
  michpa_qualified?: boolean;
}

interface IneligibleItem {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  ltp: number;
  volume: number;
  primary_reason: string;
  category: string;
  failed_rules: string[];
  financials: {
    debt_to_equity: number;
    altman_z: number;
    piotroski: number;
    pledge_pct: number;
    promoter_holding: number;
  };
}

export const RecoAuditView: React.FC<RecoAuditViewProps> = ({ onNavigateToRules }) => {
  // Screen mode: "SELECT_STRATEGY" (Screen 1) | "AUDIT_MATRIX" (Screen 2)
  const [screenMode, setScreenMode] = useState<"SELECT_STRATEGY" | "AUDIT_MATRIX">("SELECT_STRATEGY");

  // Strategy States
  const [activeStrategies, setActiveStrategies] = useState<Strategy[]>([]);
  const [activeStrategyId, setActiveStrategyId] = useState<string>("");
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  // Screening / Sync state for locking
  const [screeningStatus, setScreeningStatus] = useState<any>(null);

  // Cadence & Real-Time Audit Engine state
  const [isAuditActive, setIsAuditActive] = useState<boolean>(true);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);
  const [auditInterval, setAuditInterval] = useState<number>(5); // 5s or 60s
  const [cadenceData, setCadenceData] = useState<{
    checked_1m: number;
    checked_10m: number;
    next_audit_in: number;
  }>({
    checked_1m: 0,
    checked_10m: 0,
    next_audit_in: 0
  });

  // Data states for Matrix
  const [items, setItems] = useState<AuditMatrixItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [passedCount, setPassedCount] = useState<number>(0);
  const [heldCount, setHeldCount] = useState<number>(0);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedGate, setSelectedGate] = useState<"ALL" | "GO" | "WAITING">("ALL");
  const [selectedPolicy, setSelectedPolicy] = useState<"ALL" | "PASSED" | "HELD">("ALL");
  const [hitRatioPreset, setHitRatioPreset] = useState<"ALL" | "GE_80" | "GE_50" | "LT_50" | "CUSTOM">("ALL");
  const [minHitRatio, setMinHitRatio] = useState<number | null>(null);
  const [maxHitRatio, setMaxHitRatio] = useState<number | null>(null);
  const [customMinInput, setCustomMinInput] = useState<string>("");
  const [customMaxInput, setCustomMaxInput] = useState<string>("");
  const [isHitFilterOpen, setIsHitFilterOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [ineligibleSummary, setIneligibleSummary] = useState<{
    total_ineligible: number;
    breakdown: Record<string, number>;
  }>({ total_ineligible: 0, breakdown: {} });

  // Main Tab: "ACTIVE" vs "INELIGIBLE"
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "INELIGIBLE">("ACTIVE");

  // Ineligible list
  const [ineligibleItems, setIneligibleItems] = useState<IneligibleItem[]>([]);
  const [ineligibleLoading, setIneligibleLoading] = useState<boolean>(false);
  const [ineligibleSearch, setIneligibleSearch] = useState<string>("");

  // Modal item
  const [activeModalItem, setActiveModalItem] = useState<AuditMatrixItem | null>(null);
  const [selectedGateItem, setSelectedGateItem] = useState<AuditMatrixItem | null>(null);

  // Back to top floating button
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // WebSocket Live Connection
  const wsRef = useRef<WebSocket | null>(null);
  const tickBufferRef = useRef<Record<string, { ltp: number; change: number; change_pct: number; volume: number }>>({});

  // 1. Fetch strategies from Reco Rules
  const fetchStrategies = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/recommendations/strategies");
      const data = await res.json();
      if (data && data.strategies) {
        const mapped = data.strategies.map((s: any) => ({
          ...s,
          is_active: s.id === data.active_strategy_id || s.is_active === true
        }));
        setActiveStrategies(mapped);
        setActiveStrategyId(data.active_strategy_id || "");
        setSelectedStrategy(mapped.find((s: any) => s.id === data.active_strategy_id) || mapped[0] || null);
      }
    } catch (e) {
      console.error("Error loading strategies:", e);
    }
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  // Toggle strategy active/inactive
  const handleToggleStrategy = async (strategyId: string, currentActive: boolean) => {
    const nextState = !currentActive;
    setActiveStrategies((prev) =>
      prev.map((s) => (s.id === strategyId ? { ...s, is_active: nextState } : s))
    );
    if (selectedStrategy?.id === strategyId) {
      setSelectedStrategy((prev) => (prev ? { ...prev, is_active: nextState } : null));
    }
    if (nextState) {
      setActiveStrategyId(strategyId);
    } else if (activeStrategyId === strategyId) {
      setActiveStrategyId("");
    }
    try {
      await fetch("/api/v1/recommendations/strategies/toggle-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy_id: strategyId, is_active: nextState })
      });
      fetchStrategies();
      fetchCadence();
    } catch (err) {
      console.error("Failed to toggle strategy active status:", err);
    }
  };

  // Change date and persist to actual tested dates
  const handleDateChange = async (newDate: string) => {
    if (!newDate) return;
    setSelectedDate(newDate);
    setPage(1);
    loadInitialMatrix(newDate);
    if (!availableDates.includes(newDate)) {
      setAvailableDates((prev) => [newDate, ...prev]);
    }
    try {
      const res = await fetch("/api/v1/recommendations/audit-dates/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate })
      });
      if (res.ok) {
        const d = await res.json();
        if (d.available_dates) {
          setAvailableDates(d.available_dates);
        }
      }
    } catch (e) {
      console.error("Failed to record tested date:", e);
    }
  };

  // 2. Fetch cadence info & market status regularly
  const fetchCadence = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/recommendations/audit-cadence");
      if (res.ok) {
        const data = await res.json();
        setIsAuditActive(data.is_audit_active ?? true);
        setIsMarketOpen(Boolean(data.is_market_open));
        setAuditInterval(data.interval_seconds ?? 5);
        setCadenceData({
          checked_1m: Number(data.checked_1m || 0),
          checked_10m: Number(data.checked_10m || 0),
          next_audit_in: Number(data.next_audit_in || 0)
        });
      }
    } catch {
      // Ignore cadence network glitches
    }
  }, []);

  useEffect(() => {
    fetchCadence();
    const interval = setInterval(fetchCadence, 3000);
    return () => clearInterval(interval);
  }, [fetchCadence]);

  // Change Audit Interval (5s vs 60s)
  const handleChangeInterval = async (seconds: number) => {
    setAuditInterval(seconds);
    try {
      await fetch("/api/v1/recommendations/audit-cadence/interval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds })
      });
      fetchCadence();
    } catch (e) {
      console.error("Failed to set interval:", e);
    }
  };

  // 3. Fetch Matrix Data (Initial Page 1)
  const loadInitialMatrix = useCallback(async (overrideDate?: string) => {
    setLoading(true);
    setPage(1);
    try {
      const activeDate = (overrideDate !== undefined ? overrideDate : selectedDate).trim();
      const params = new URLSearchParams({
        page: "1",
        page_size: String(pageSize),
      });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (activeDate) params.set("date", activeDate);
      if (selectedGate && selectedGate !== "ALL") params.set("gate", selectedGate);
      if (selectedPolicy && selectedPolicy !== "ALL") params.set("policy", selectedPolicy);
      if (minHitRatio !== null) params.set("min_hit_pct", String(minHitRatio));
      if (maxHitRatio !== null) params.set("max_hit_pct", String(maxHitRatio));

      const res = await fetch(`/api/v1/recommendations/audit-matrix?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch audit matrix");
      const data = await res.json();

      setItems(data.items || []);
      setTotalCount(data.total_count || 0);
      setPassedCount(data.michpa_qualified_count !== undefined ? data.michpa_qualified_count : (data.passed_count || 0));
      setHeldCount(data.held_count || 0);
      setHasMore((data.items || []).length < (data.total_count || 0));

      if (data.available_dates && Array.isArray(data.available_dates)) {
        setAvailableDates(data.available_dates);
      }
      if (!selectedDate && data.audit_date) {
        setSelectedDate(data.audit_date);
      }
      if (data.screening_status) {
        setScreeningStatus(data.screening_status);
      }
      if (data.ineligible_summary) {
        setIneligibleSummary(data.ineligible_summary);
      }
    } catch (err) {
      console.error("Load initial matrix error:", err);
    } finally {
      setLoading(false);
    }
  }, [pageSize, searchQuery, selectedDate, selectedGate, selectedPolicy, minHitRatio, maxHitRatio]);

  useEffect(() => {
    if (screenMode === "AUDIT_MATRIX") {
      loadInitialMatrix();
    }
  }, [screenMode, loadInitialMatrix]);

  // 4. Infinite Scroll: Load Next 50
  const loadMoreItems = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({
        page: String(nextPage),
        page_size: String(pageSize),
      });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedDate.trim()) params.set("date", selectedDate.trim());
      if (selectedGate && selectedGate !== "ALL") params.set("gate", selectedGate);
      if (selectedPolicy && selectedPolicy !== "ALL") params.set("policy", selectedPolicy);
      if (minHitRatio !== null) params.set("min_hit_pct", String(minHitRatio));
      if (maxHitRatio !== null) params.set("max_hit_pct", String(maxHitRatio));

      const res = await fetch(`/api/v1/recommendations/audit-matrix?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const newItems = data.items || [];
        if (newItems.length > 0) {
          setItems((prev) => [...prev, ...newItems]);
          setPage(nextPage);
          if (items.length + newItems.length >= (data.total_count || 0)) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error("Load more items error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, page, pageSize, searchQuery, selectedDate, selectedGate, selectedPolicy, minHitRatio, maxHitRatio, items.length]);

  // Observer for Infinite Scroll
  useEffect(() => {
    const el = observerTarget.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreItems();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMoreItems]);

  // Scroll listener for Floating "Back to Top" button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Sync Action: Only permitted if rules changed or not yet synced for today
  const isSyncAllowed = useMemo(() => {
    if (!screeningStatus) return true;
    // If backend reports can_sync === false, disable button
    return Boolean(screeningStatus.can_sync ?? !screeningStatus.is_screened);
  }, [screeningStatus]);

  const handleSync = async () => {
    if (!selectedStrategy || !isSyncAllowed) return;
    try {
      setIsSyncing(true);
      const res = await fetch("/api/v1/recommendations/sync-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy_id: selectedStrategy.id })
      });
      const json = await res.json();
      if (res.ok && json.status === "SUCCESS") {
        setSyncToast({ message: json.message || "Universe Synced Successfully for Today", type: "success" });
        await loadInitialMatrix();
      } else {
        setSyncToast({ message: json.detail || "Failed to sync universe", type: "error" });
      }
    } catch {
      setSyncToast({ message: "Network error during sync", type: "error" });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 4000);
    }
  };

  // Ineligible list fetcher
  const fetchIneligibleList = useCallback(async () => {
    setIneligibleLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", page_size: "100" });
      if (ineligibleSearch.trim()) params.set("search", ineligibleSearch.trim());
      const res = await fetch(`/api/v1/recommendations/ineligible-stocks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIneligibleItems(data.items || []);
      }
    } catch (e) {
      console.error("Error fetching ineligible:", e);
    } finally {
      setIneligibleLoading(false);
    }
  }, [ineligibleSearch]);

  useEffect(() => {
    if (activeTab === "INELIGIBLE") {
      fetchIneligibleList();
    }
  }, [activeTab, fetchIneligibleList]);

  // Silent Real-Time Matrix Refresh (updates hit ratios, checks, and scores without resetting scroll or showing loader)
  const refreshMatrixSilently = useCallback(async () => {
    if (screenMode !== "AUDIT_MATRIX") return;
    try {
      const activeDate = selectedDate.trim();
      const countToFetch = Math.max(pageSize, items.length || pageSize);
      const params = new URLSearchParams({
        page: "1",
        page_size: String(countToFetch),
      });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (activeDate) params.set("date", activeDate);
      if (selectedGate && selectedGate !== "ALL") params.set("gate", selectedGate);
      if (minHitRatio !== null) params.set("min_hit_pct", String(minHitRatio));
      if (maxHitRatio !== null) params.set("max_hit_pct", String(maxHitRatio));

      const res = await fetch(`/api/v1/recommendations/audit-matrix?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        setItems((prev) => {
          const incomingMap = new Map<string, AuditMatrixItem>(data.items.map((it: AuditMatrixItem) => [it.symbol, it]));
          return prev.map((item) => {
            const fresh = incomingMap.get(item.symbol);
            if (!fresh) return item;
            return {
              ...item,
              ltp: fresh.ltp > 0 ? fresh.ltp : item.ltp,
              change: fresh.change,
              change_pct: fresh.change_pct,
              volume: fresh.volume,
              score_wa: fresh.score_wa,
              score_c: fresh.score_c,
              score_h: fresh.score_h,
              score_a: fresh.score_a,
              target_hits_ratio: fresh.target_hits_ratio,
              target_hit_pct: fresh.target_hit_pct,
              daily_checks: fresh.daily_checks,
              daily_hits: fresh.daily_hits,
              daily_outcome: fresh.daily_outcome,
              daily_outcome_label: fresh.daily_outcome_label,
              policy_passed: fresh.policy_passed,
              policy_status: fresh.policy_status,
              policy_fail_desc: fresh.policy_fail_desc,
              has_live_reco: fresh.has_live_reco,
              execution_gate_status: fresh.execution_gate_status,
              trigger_price: fresh.trigger_price,
              trigger_gap_pct: fresh.trigger_gap_pct,
              rvol: fresh.rvol,
              vwap: fresh.vwap,
              execution_gate_reasons: fresh.execution_gate_reasons,
              pillar_i_passed: fresh.pillar_i_passed,
              pillar_i_ratio: fresh.pillar_i_ratio,
              pillar_c_points: fresh.pillar_c_points,
              pillar_c_ratio: fresh.pillar_c_ratio,
              pillar_h_points: fresh.pillar_h_points,
              pillar_h_ratio: fresh.pillar_h_ratio,
              pillar_p_status: fresh.pillar_p_status,
              pillar_p_ratio: fresh.pillar_p_ratio,
              pillar_a_score: fresh.pillar_a_score,
              michpa_qualified: fresh.michpa_qualified
            };
          });
        });
        if (data.total_count !== undefined) setTotalCount(data.total_count);
        if (data.michpa_qualified_count !== undefined) setPassedCount(data.michpa_qualified_count);
        else if (data.passed_count !== undefined) setPassedCount(data.passed_count);
        if (data.held_count !== undefined) setHeldCount(data.held_count);
      }
    } catch {
      // Ignore silent refresh glitches
    }
  }, [screenMode, selectedDate, pageSize, items.length, searchQuery, selectedGate, selectedPolicy, minHitRatio, maxHitRatio]);

  // Immediate Client-Side Filter for 0ms UI reactivity on Gate, Policy, and Hit Ratio
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Policy Filter (CHA Passed vs Held)
      if (selectedPolicy === "PASSED" && item.policy_status !== "PASSED") {
        return false;
      }
      if (selectedPolicy === "HELD" && item.policy_status !== "HELD") {
        return false;
      }
      // Execution Gate Filter
      if (selectedGate === "GO" && item.execution_gate_status !== "GO") {
        return false;
      }
      if (selectedGate === "WAITING" && item.execution_gate_status !== "WAITING") {
        return false;
      }
      // Hit Ratio Filter
      const hitPct = item.target_hit_pct !== undefined
        ? item.target_hit_pct
        : (item.daily_checks && item.daily_checks > 0
          ? ((item.daily_hits || 0) / item.daily_checks) * 100
          : 0);
      if (minHitRatio !== null && hitPct < minHitRatio) {
        return false;
      }
      if (maxHitRatio !== null && hitPct > maxHitRatio) {
        return false;
      }
      return true;
    });
  }, [items, selectedGate, selectedPolicy, minHitRatio, maxHitRatio]);

  // Real-time automatic cadence polling to increase numbers in the last column
  useEffect(() => {
    if (screenMode !== "AUDIT_MATRIX") return;
    const timer = setInterval(() => {
      refreshMatrixSilently();
    }, 4000);
    return () => clearInterval(timer);
  }, [screenMode, refreshMatrixSilently]);

  // WebSocket Live Updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    let isMounted = true;

    const connectWs = () => {
      try {
        const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.hostname || "localhost";
        ws = new WebSocket(`${proto}//${host}:8000/ws/terminal`);

        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === "AUDIT_CYCLE_COMPLETED") {
              fetchCadence();
              refreshMatrixSilently();
            } else if (data.type === "RECOMMENDATION_NEW" && data.recommendation?.symbol) {
              const recSym = data.recommendation.symbol.toUpperCase();
              setItems((prev) =>
                prev.map((item) =>
                  item.symbol.toUpperCase() === recSym ? { ...item, has_live_reco: true } : item
                )
              );
            } else if (data.symbol && data.ltp) {
              tickBufferRef.current[data.symbol.toUpperCase()] = {
                ltp: Number(data.ltp),
                change: Number(data.change || 0),
                change_pct: Number(data.change_pct || 0),
                volume: Number(data.volume || 0)
              };
            }
          } catch {}
        };
        wsRef.current = ws;
      } catch {}
    };

    connectWs();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchCadence, refreshMatrixSilently]);

  // Flush buffer every 300ms
  useEffect(() => {
    const interval = setInterval(() => {
      const buf = tickBufferRef.current;
      const keys = Object.keys(buf);
      if (keys.length === 0) return;
      tickBufferRef.current = {};

      setItems((prev) => {
        let changed = false;
        const next = prev.map((item) => {
          const t = buf[item.symbol];
          if (!t) return item;
          changed = true;
          return {
            ...item,
            ltp: t.ltp,
            change: t.change !== 0 ? t.change : item.change,
            change_pct: t.change_pct !== 0 ? t.change_pct : item.change_pct,
            volume: t.volume > 0 ? t.volume : item.volume
          };
        });
        return changed ? next : prev;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // =========================================================================
  // SCREEN 1: STRATEGY SELECTOR (ACTIVE ONLY with real operational metrics)
  // =========================================================================
  if (screenMode === "SELECT_STRATEGY") {
    return (
      <div className="w-full max-w-[1400px] mx-auto space-y-6 pb-20 pt-4 font-sans text-slate-900">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reco Audit Studio</h1>
                <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {activeStrategies.filter((s) => s.is_active === true || s.id === activeStrategyId).length} Active {activeStrategies.filter((s) => s.is_active === true || s.id === activeStrategyId).length === 1 ? "Strategy" : "Strategies"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Select an active strategy below to view its live stock compliance, audit cadence, and policy triggers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToRules && (
              <button
                onClick={onNavigateToRules}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 border border-slate-200 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <span>Manage Strategies in Reco Rules ↗</span>
              </button>
            )}
          </div>
        </div>

        {/* Strategy Cards Grid - Operational Metrics Only (Active in Reco Rules Only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeStrategies.filter((s) => s.is_active === true || s.id === activeStrategyId).map((strat) => {
            const isSelected = selectedStrategy?.id === strat.id;
            const isStratActive = strat.id === activeStrategyId || strat.is_active === true;

            return (
              <div
                key={strat.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between p-6 shadow-2xs hover:shadow-md ${
                  isStratActive ? "border-emerald-500 ring-2 ring-emerald-500/15" : "border-slate-200 opacity-90"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{strat.name}</h3>

                    {/* Active / Inactive Interactive Toggle */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStrategy(strat.id, isStratActive);
                      }}
                      className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 transition-all shadow-2xs group/toggle shrink-0"
                      title={isStratActive ? "Click to deactivate strategy (pauses live audit)" : "Click to activate strategy (starts live audit)"}
                    >
                      <span className={`text-xs font-black transition-colors ${isStratActive ? "text-emerald-700" : "text-slate-400"}`}>
                        {isStratActive ? "Active" : "Inactive"}
                      </span>
                      <div className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                        isStratActive ? "bg-emerald-600" : "bg-slate-300"
                      }`}>
                        <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-200 ${
                          isStratActive ? "translate-x-3.5" : "translate-x-0"
                        }`} />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed min-h-[44px]">
                    {strat.description || "Active high-conviction momentum screening and intraday scoring rules."}
                  </p>

                  {/* 4 Operational Parameters with values on the right */}
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-3 text-xs">
                    {/* 1. Eligible Stocks */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Eligible Stocks</span>
                      <span className="font-bold text-slate-900 font-mono text-sm bg-slate-100 px-2 py-0.5 rounded">
                        1,119 Stocks
                      </span>
                    </div>

                    {/* 2. Recommendations Generated */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Recommendations Today</span>
                      <span className="font-bold text-purple-700 font-mono text-xs bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {isStratActive ? (isMarketOpen ? "4 Generated" : "0 Generated") : "0 Generated"}
                      </span>
                    </div>

                    {/* 3. Audit Frequency */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Audit Cadence</span>
                      <span className="font-bold text-emerald-700 font-mono text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Every 5 Seconds
                      </span>
                    </div>

                    {/* 4. Dalal Street State */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Market Execution Status</span>
                      {isStratActive ? (
                        <span className={`font-bold text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                          isMarketOpen 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
                          {isMarketOpen ? "Market Open (Auditing Live)" : "Ready for 09:15 AM Open"}
                        </span>
                      ) : (
                        <span className="font-bold text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Audit Paused (Strategy Inactive)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setSelectedStrategy(strat);
                      setActiveStrategyId(strat.id);
                      setScreenMode("AUDIT_MATRIX");
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <span>Inspect Strategy Audit Studio</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 2: AUDIT MATRIX STUDIO (LOCKED)
  // ==========================================
  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-3.5 pb-24 pt-2 font-sans text-slate-900">
      
      {/* 1. Compact Header: Short title/desc on left; Date + Locked/Active Sync on right */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-2xs flex items-center justify-between flex-wrap gap-3">
        {/* Left Side: Short title & description */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 tracking-tight">Reco Audit Studio</h1>
              <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full font-bold uppercase">
                {selectedStrategy?.name || "Strategy Audit"}
              </span>
              <button
                onClick={() => setScreenMode("SELECT_STRATEGY")}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold ml-1 cursor-pointer underline"
              >
                Change
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Automated equity audit, dynamic MICHPA continuous 5s evaluation & execution gate.
            </p>
          </div>
        </div>

        {/* Right Side: Date Filter + Sync Button (Locked once synced for today unless rules changed) */}
        <div className="flex items-center gap-2.5">
          {/* Date Selector with Dropdown and Custom Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500 uppercase">Date:</span>
            <select
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {availableDates.map((dt) => {
                const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
                const isToday = dt === todayIST;
                return (
                  <option key={dt} value={dt}>
                    {isToday ? `Today (${dt})` : dt}
                  </option>
                );
              })}
            </select>
            {/* Custom Date Picker input icon */}
            <div className="relative flex items-center ml-1 border-l border-slate-200 pl-1.5" title="Pick any session date to audit">
              <Calendar className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition-colors pointer-events-none" />
              <input
                type="date"
                title="Select date to test reco audit"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) handleDateChange(e.target.value);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
          </div>

          {/* Sync Button / Synced for Today Badge */}
          {isSyncAllowed ? (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-60"
              title="Evaluate today's universe quotes for this strategy"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync"}</span>
            </button>
          ) : (
            <div
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 select-none shadow-2xs"
              title="Already synced for today's market session. Sync unlocks automatically if you modify rules in Reco Rules."
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Synced for Today</span>
            </div>
          )}
        </div>
      </div>

      {/* Inactive Strategy Notice Banner */}
      {selectedStrategy && (selectedStrategy.is_active === false || (activeStrategyId && selectedStrategy.id !== activeStrategyId)) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>This strategy is currently <strong>Inactive</strong>. Live stock auditing, real-time price monitoring, and scoring are suspended.</span>
          </div>
          <button
            onClick={() => handleToggleStrategy(selectedStrategy.id, false)}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all"
          >
            Activate Strategy
          </button>
        </div>
      )}

      {/* Sync Toast */}
      {syncToast && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
            syncToast.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{syncToast.message}</span>
          </div>
          <button onClick={() => setSyncToast(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* 2. Metric Cards: Uniform Height + 2 Cadence Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Eligible Equities */}
        <div 
          onClick={() => {
            setActiveTab("ACTIVE");
            setSelectedPolicy("ALL");
            setSelectedGate("ALL");
          }}
          className={`p-3 rounded-2xl bg-white border shadow-2xs flex flex-col justify-between h-[84px] cursor-pointer transition-all hover:shadow-md ${
            activeTab === "ACTIVE" && selectedPolicy === "ALL" && selectedGate === "ALL"
              ? "border-slate-900 ring-2 ring-slate-900/10"
              : "border-slate-200 hover:border-slate-400"
          }`}
        >
          <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Eligible Equities</span>
            {selectedPolicy === "ALL" && selectedGate === "ALL" && (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            )}
          </div>
          <div className="text-xl font-black text-slate-900 flex items-baseline gap-1.5">
            <span>{(screeningStatus?.eligible_count || totalCount || 1122).toLocaleString()}</span>
            <span className="text-[10.5px] font-semibold text-slate-500">Monitored</span>
          </div>
        </div>

        {/* Card 2: MICHPA Qualified */}
        <div 
          onClick={() => {
            setActiveTab("ACTIVE");
            setSelectedPolicy((prev) => (prev === "PASSED" ? "ALL" : "PASSED"));
          }}
          className={`p-3 rounded-2xl bg-emerald-50/50 border shadow-2xs flex flex-col justify-between h-[84px] cursor-pointer transition-all hover:shadow-md ${
            activeTab === "ACTIVE" && selectedPolicy === "PASSED"
              ? "border-emerald-600 ring-2 ring-emerald-600/30 bg-emerald-100/70"
              : "border-emerald-200 hover:border-emerald-400"
          }`}
        >
          <div className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>MICHPA Qualified</span>
            </div>
            {selectedPolicy === "PASSED" && (
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white">Filtered</span>
            )}
          </div>
          <div className="text-xl font-black text-emerald-900 flex items-baseline gap-1.5">
            <span>{isMarketOpen ? passedCount.toLocaleString() : (passedCount > 0 ? passedCount.toLocaleString() : "0")}</span>
            <span className="text-[10.5px] font-semibold text-emerald-700">{isMarketOpen ? "Qualified" : (passedCount > 0 ? "Qualified" : "Awaiting 09:15 AM")}</span>
          </div>
        </div>

        {/* Card 3: Held / Pending */}
        <div 
          onClick={() => {
            setActiveTab("ACTIVE");
            setSelectedPolicy((prev) => (prev === "HELD" ? "ALL" : "HELD"));
          }}
          className={`p-3 rounded-2xl bg-amber-50/50 border shadow-2xs flex flex-col justify-between h-[84px] cursor-pointer transition-all hover:shadow-md ${
            activeTab === "ACTIVE" && selectedPolicy === "HELD"
              ? "border-amber-600 ring-2 ring-amber-600/30 bg-amber-100/70"
              : "border-amber-200 hover:border-amber-400"
          }`}
        >
          <div className="text-[10.5px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Held / Pending</span>
            </div>
            {selectedPolicy === "HELD" && (
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-600 text-white">Filtered</span>
            )}
          </div>
          <div className="text-xl font-black text-amber-900 flex items-baseline gap-1.5">
            <span>{isMarketOpen ? heldCount.toLocaleString() : totalCount.toLocaleString()}</span>
            <span className="text-[10.5px] font-semibold text-amber-700">Waiting</span>
          </div>
        </div>

        {/* Card 4: Ineligible Universe */}
        <div 
          onClick={() => setActiveTab("INELIGIBLE")}
          className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200 shadow-2xs flex flex-col justify-between h-[84px] cursor-pointer hover:bg-rose-50"
        >
          <div className="text-[10.5px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
            <span>Ineligible Universe</span>
          </div>
          <div className="text-xl font-black text-rose-900 flex items-baseline gap-1.5">
            <span>{ineligibleSummary.total_ineligible.toLocaleString()}</span>
            <span className="text-[10.5px] font-semibold text-rose-700">Excluded</span>
          </div>
        </div>

        {/* Card 5: Checked (Last 1 Min) */}
        <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200 shadow-2xs flex flex-col justify-between h-[84px]">
          <div className="text-[10.5px] font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isMarketOpen ? "bg-emerald-500 animate-ping" : "bg-slate-300"}`} />
            <span>Last 1 Min Audited</span>
          </div>
          <div className="text-xl font-black text-indigo-900 flex items-baseline gap-1.5">
            <span>{isMarketOpen ? cadenceData.checked_1m.toLocaleString() : "0"}</span>
            <span className="text-[10.5px] font-semibold text-indigo-700">{isMarketOpen ? "Stocks" : "Market Closed"}</span>
          </div>
        </div>

        {/* Card 6: Checked (Last 10 Mins) */}
        <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200 shadow-2xs flex flex-col justify-between h-[84px]">
          <div className="text-[10.5px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-purple-600" />
            <span>Last 10 Min Audited</span>
          </div>
          <div className="text-xl font-black text-purple-900 flex items-baseline gap-1.5">
            <span>{isMarketOpen ? cadenceData.checked_10m.toLocaleString() : "0"}</span>
            <span className="text-[10.5px] font-semibold text-purple-700">{isMarketOpen ? "Audits" : "Market Closed"}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Tab Switcher: "Active" and "Ineligible" with Automatic Market Cadence Status */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "ACTIVE"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Active ({totalCount.toLocaleString()})</span>
          </button>

          <button
            onClick={() => setActiveTab("INELIGIBLE")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "INELIGIBLE"
                ? "bg-rose-700 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-rose-50 border border-slate-200"
            }`}
          >
            <span>Ineligible ({ineligibleSummary.total_ineligible.toLocaleString()})</span>
          </button>
        </div>

        {/* Automatic Real-Time Market Status & Cadence Switch */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
          <span className="text-[11px] font-bold text-slate-600 uppercase">Audit Cadence:</span>
          
          <button
            onClick={() => handleChangeInterval(5)}
            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              auditInterval === 5
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Every 5 Secs
          </button>

          <button
            onClick={() => handleChangeInterval(60)}
            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              auditInterval === 60
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Every 1 Min
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Automatic Market Hours Status (Always active during 09:15-15:30 IST) */}
          <div className={`px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1.5 select-none ${
            isMarketOpen
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
              : "bg-slate-100 text-slate-700 border border-slate-300"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isMarketOpen ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
            <span>{isMarketOpen ? "Market Open (Auditing Active)" : "Market Closed (Audit Paused)"}</span>
          </div>
        </div>
      </div>

      {/* 4. TAB 1: ACTIVE MONITORED TABLE */}
      {activeTab === "ACTIVE" && (
        <div className="space-y-3">
          {/* Search + Execution Gate & Hit Ratio Filters Row */}
          <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            {/* Left: Search Input */}
            <div className="relative w-full md:max-w-md flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search symbol, company name or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-indigo-500 font-mono transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-700 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Middle-Right: Eligible Stocks Count Badge based on active filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs whitespace-nowrap self-end md:self-auto">
              <span className={`w-2 h-2 rounded-full ${selectedGate === "GO" ? "bg-emerald-500 animate-pulse" : "bg-indigo-500"}`} />
              <span className="text-slate-500 font-semibold">Eligible:</span>
              <span className={`font-extrabold font-mono ${selectedGate === "GO" ? "text-emerald-700" : "text-indigo-700"}`}>
                {totalCount.toLocaleString()}
              </span>
              <span className="text-slate-400 text-[11px] font-medium">
                / {(screeningStatus?.eligible_count || 1122).toLocaleString()} stocks
              </span>
            </div>

            {/* Right: Extreme Right Sleek Filters (Execution Gate + Hit Ratio Range) */}
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
              {/* Filter 1: Execution Gate Segmented Control */}
              <div className="inline-flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80 text-[11px] font-bold shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSelectedGate("ALL")}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedGate === "ALL"
                      ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All Gates
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGate("GO")}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 ${
                    selectedGate === "GO"
                      ? "bg-emerald-600 text-white shadow-2xs font-black"
                      : "text-emerald-700 hover:bg-emerald-50/70"
                  }`}
                >
                  <Zap className="w-3 h-3 fill-current" />
                  <span>GO Live</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGate("WAITING")}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 ${
                    selectedGate === "WAITING"
                      ? "bg-amber-500 text-white shadow-2xs font-black"
                      : "text-amber-800 hover:bg-amber-50/70"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Waiting</span>
                </button>
              </div>

              {/* Filter 2: Hit Ratio Range Dropdown Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsHitFilterOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    hitRatioPreset !== "ALL" || minHitRatio !== null || maxHitRatio !== null
                      ? "bg-indigo-50 text-indigo-900 border-indigo-300 ring-2 ring-indigo-500/20"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Target className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {hitRatioPreset === "GE_80" && "Hit: ≥ 80%"}
                    {hitRatioPreset === "GE_50" && "Hit: ≥ 50%"}
                    {hitRatioPreset === "LT_50" && "Hit: < 50%"}
                    {hitRatioPreset === "CUSTOM" && `Hit: ${minHitRatio ?? 0}%-${maxHitRatio ?? 100}%`}
                    {hitRatioPreset === "ALL" && "Hit Ratio"}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isHitFilterOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Popover Backdrop & Card */}
                {isHitFilterOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsHitFilterOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl p-3 shadow-xl z-30 space-y-3 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-indigo-600" />
                          Target Hit % Range
                        </span>
                        {(hitRatioPreset !== "ALL" || minHitRatio !== null || maxHitRatio !== null) && (
                          <button
                            type="button"
                            onClick={() => {
                              setHitRatioPreset("ALL");
                              setMinHitRatio(null);
                              setMaxHitRatio(null);
                              setCustomMinInput("");
                              setCustomMaxInput("");
                              setIsHitFilterOpen(false);
                            }}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      {/* Quick Presets */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setHitRatioPreset("ALL");
                            setMinHitRatio(null);
                            setMaxHitRatio(null);
                            setIsHitFilterOpen(false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border text-left cursor-pointer transition-colors ${
                            hitRatioPreset === "ALL"
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          All (0–100%)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHitRatioPreset("GE_80");
                            setMinHitRatio(80);
                            setMaxHitRatio(null);
                            setIsHitFilterOpen(false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border text-left cursor-pointer transition-colors ${
                            hitRatioPreset === "GE_80"
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-indigo-50/60 text-indigo-800 border-indigo-200 hover:bg-indigo-100"
                          }`}
                        >
                          🔥 ≥ 80% (High)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHitRatioPreset("GE_50");
                            setMinHitRatio(50);
                            setMaxHitRatio(null);
                            setIsHitFilterOpen(false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border text-left cursor-pointer transition-colors ${
                            hitRatioPreset === "GE_50"
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-emerald-50/60 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          ✅ ≥ 50% (Edge)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHitRatioPreset("LT_50");
                            setMinHitRatio(null);
                            setMaxHitRatio(49.9);
                            setIsHitFilterOpen(false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border text-left cursor-pointer transition-colors ${
                            hitRatioPreset === "LT_50"
                              ? "bg-rose-600 text-white border-rose-600"
                              : "bg-rose-50/60 text-rose-800 border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          ⚠️ &lt; 50% (Low)
                        </button>
                      </div>

                      {/* Custom Range */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custom % Range</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Min %"
                            min={0}
                            max={100}
                            value={customMinInput}
                            onChange={(e) => setCustomMinInput(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:border-indigo-500"
                          />
                          <span className="text-slate-400 text-xs font-bold">to</span>
                          <input
                            type="number"
                            placeholder="Max %"
                            min={0}
                            max={100}
                            value={customMaxInput}
                            onChange={(e) => setCustomMaxInput(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const minVal = customMinInput ? parseFloat(customMinInput) : null;
                            const maxVal = customMaxInput ? parseFloat(customMaxInput) : null;
                            setMinHitRatio(minVal);
                            setMaxHitRatio(maxVal);
                            setHitRatioPreset("CUSTOM");
                            setIsHitFilterOpen(false);
                          }}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Apply Range
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Simple Table */}
          <div ref={tableContainerRef} className="bg-white border border-slate-200 rounded-2xl overflow-visible shadow-2xs relative">
            <div className="overflow-x-auto lg:overflow-visible">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="sticky top-9 z-20 bg-slate-50 shadow-xs border-b border-slate-200">
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider select-none">
                    <th className="sticky top-9 z-20 bg-slate-50/98 backdrop-blur-md py-3 px-3 w-12 text-center">#</th>
                    <th className="sticky top-9 z-20 bg-slate-50/98 backdrop-blur-md py-3 px-4">Instrument Name</th>
                    <th className="sticky top-9 z-20 bg-slate-50/98 backdrop-blur-md py-3 px-4 text-right">LTP (Current Price)</th>
                    <th className="sticky top-9 z-20 bg-slate-50/98 backdrop-blur-md py-3 px-4 text-center">Volume & Depth</th>
                    <th className="sticky top-9 z-20 bg-slate-50/98 backdrop-blur-md py-3 px-4 text-center">MICHPA Pillars (I, C, H, P, A)</th>
                    <th className="sticky top-9 z-20 bg-slate-50/98 backdrop-blur-md py-3 px-4 text-center">Execution Gate</th>
                    <th className="sticky top-9 z-20 bg-slate-50/98 backdrop-blur-md py-3 px-4 text-center">Target Hit % (Ratio)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading && items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                          <span className="font-semibold text-slate-600">Loading audit matrix...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-500">
                        <div className="font-bold text-slate-800 text-sm">
                          {selectedGate !== "ALL" || minHitRatio !== null || maxHitRatio !== null
                            ? `No stocks matched active filter (${selectedGate !== "ALL" ? `Gate: ${selectedGate}` : ""}${minHitRatio !== null ? ` • Hit ≥ ${minHitRatio}%` : ""})`
                            : "No Stocks Matched Active Search"}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => {
                      const hasLtp = item.ltp > 0;
                      const isUp = item.change >= 0;
                      const hitsRatio = item.target_hits_ratio || "0/0";

                      return (
                        <tr key={item.symbol} className="hover:bg-slate-50/80 transition-colors">
                          {/* Row Num */}
                          <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>

                          {/* 1. Instrument Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-xs shrink-0">
                                {item.symbol.substring(0, 2)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-slate-900 text-xs font-mono">
                                    {item.symbol}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded uppercase">
                                    {item.exchange}
                                  </span>
                                  {isMarketOpen && item.has_live_reco && (
                                    <span className="text-[9px] font-extrabold text-purple-700 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded-full animate-pulse">
                                      LIVE RECO
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                                  {item.name} <span className="text-slate-300">•</span> {item.sector}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. LTP */}
                          <td className="py-3.5 px-4 text-right">
                            {hasLtp ? (
                              <div>
                                <div className="font-black font-mono text-sm text-slate-900">
                                  ₹{item.ltp.toFixed(2)}
                                </div>
                                <div
                                  className={`text-[11px] font-bold font-mono flex items-center justify-end gap-0.5 ${
                                    isUp ? "text-emerald-700" : "text-rose-600"
                                  }`}
                                >
                                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  <span>
                                    {isUp ? "+" : ""}{item.change.toFixed(2)} ({isUp ? "+" : ""}{item.change_pct.toFixed(2)}%)
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">—</span>
                            )}
                          </td>

                          {/* 3. Volume & Depth */}
                          <td className="py-3.5 px-4 text-center">
                            {isMarketOpen && item.volume > 0 ? (
                              <div className="inline-block text-left w-32">
                                <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                                  <span className="text-slate-700 font-bold">Vol: {item.volume.toLocaleString()}</span>
                                  <span className="text-slate-500">{item.bid_pct}% Bids</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-rose-200 overflow-hidden flex">
                                  <div className="h-full bg-emerald-500" style={{ width: `${item.bid_pct}%` }} />
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs" title="Volume recorded when market opens at 09:15 AM">—</span>
                            )}
                          </td>

                          {/* 4. Score Pillars (MICHPA: I, C, H, P, A) */}
                          <td className="py-3.5 px-4 text-center">
                            {item.pillar_i_ratio || item.score_c > 0 || (isMarketOpen && item.score_wa > 0) ? (
                              <div className="flex items-center justify-center gap-1 font-mono text-[10.5px] flex-wrap max-w-[280px] mx-auto">
                                {/* Pillar I: Knockout Guardrails */}
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold border ${
                                    item.pillar_i_passed
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : "bg-rose-50 text-rose-800 border-rose-200"
                                  }`}
                                  title={`Pillar I (Knockout Guardrails): ${item.pillar_i_passed ? 'PASSED 100%' : 'GUARDRAIL KNOCKOUT'} (${item.pillar_i_ratio || '11/11'})`}
                                >
                                  I: {item.pillar_i_ratio || (item.pillar_i_passed ? "11/11" : "FAIL")}
                                </span>

                                {/* Pillar C: Current Setup */}
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold border ${
                                    item.score_c >= 60
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : "bg-rose-50 text-rose-800 border-rose-200"
                                  }`}
                                  title={`Pillar C (Current Setup): ${item.score_c}% (${item.pillar_c_points ?? item.score_c}pts, ${item.pillar_c_ratio || ''})`}
                                >
                                  C: {item.score_c}%
                                </span>

                                {/* Pillar H: Historical Proof */}
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold border ${
                                    item.score_h >= 50
                                      ? "bg-blue-50 text-blue-800 border-blue-200"
                                      : "bg-rose-50 text-rose-800 border-rose-200"
                                  }`}
                                  title={`Pillar H (Historical Backtest): ${item.score_h}% (${item.pillar_h_points ?? item.score_h}pts, ${item.pillar_h_ratio || ''})`}
                                >
                                  H: {item.score_h}%
                                </span>

                                {/* Pillar P: Execution Gate */}
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold border ${
                                    item.pillar_p_status === "GO" || item.execution_gate_status === "GO"
                                      ? "bg-emerald-600 text-white border-emerald-600 font-black"
                                      : "bg-amber-50 text-amber-800 border-amber-200"
                                  }`}
                                  title={`Pillar P (Execution Gate): ${item.pillar_p_status || item.execution_gate_status || 'WAITING'} (${item.pillar_p_ratio || ''})`}
                                >
                                  P: {item.pillar_p_status || (item.execution_gate_status === "GO" ? "GO" : "WAIT")}
                                </span>

                                {/* Pillar A: AI Vision Feasibility */}
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold border ${
                                    (item.pillar_a_score ?? item.score_a) >= 60
                                      ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                      : "bg-rose-50 text-rose-800 border-rose-200"
                                  }`}
                                  title={`Pillar A (AI Feasibility): ${item.pillar_a_score ?? item.score_a}%`}
                                >
                                  A: {item.pillar_a_score ?? item.score_a}%
                                </span>

                                {item.michpa_qualified && (
                                  <span className="px-1 py-0.5 rounded bg-emerald-600 text-white font-extrabold text-[9px] animate-pulse">
                                    MICHPA 100%
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs" title="Evaluated continuously every 5 seconds">—</span>
                            )}
                          </td>

                          {/* 5. Execution Gate (GO vs WAITING with Trigger Price) */}
                          <td className="py-3.5 px-4 text-center">
                            {item.has_live_reco || item.execution_gate_status === "GO" || item.pillar_p_status === "GO" ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-[11px] shadow-sm shadow-emerald-500/30 animate-pulse">
                                  <Zap className="w-3.5 h-3.5 fill-white" />
                                  <span>GO 🔥 LIVE</span>
                                </span>
                                <span className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">
                                  Triggered at ₹{item.ltp.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedGateItem(item)}
                                className="inline-flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
                                title="Click to view full Breakout & Execution Gate trigger telemetry"
                              >
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 group-hover:bg-amber-100 text-amber-900 border border-amber-200 group-hover:border-amber-300 font-bold text-[11px] transition-all">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>WAITING ⏳</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10.5px] font-mono font-bold mt-0.5">
                                  <span className="text-slate-400">Trig:</span>
                                  <span className="text-indigo-600">₹{(item.trigger_price || item.ltp * 1.002).toFixed(2)}</span>
                                  <span className={`text-[10px] ${(item.trigger_gap_pct ?? 0) > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                                    ({(item.trigger_gap_pct ?? 0) >= 0 ? `+${(item.trigger_gap_pct ?? 0).toFixed(1)}%` : `${(item.trigger_gap_pct ?? 0).toFixed(1)}%`})
                                  </span>
                                </div>
                              </button>
                            )}
                          </td>

                          {/* 6. Target Hit (% and Ratio - Clickable Trigger) */}
                          <td className="py-3.5 px-4 text-center">
                            {isMarketOpen && item.daily_checks && item.daily_checks > 0 ? (
                              <button
                                onClick={() => setActiveModalItem(item)}
                                className={`inline-flex flex-col items-center px-3.5 py-1 rounded-xl border font-mono transition-all cursor-pointer shadow-2xs hover:scale-105 ${
                                  (item.target_hit_pct ?? 0) >= 80
                                    ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border-indigo-200 hover:border-indigo-300"
                                    : (item.target_hit_pct ?? 0) >= 40
                                    ? "bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-200 hover:border-amber-300"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
                                }`}
                                title="Click to view all daily audit check events & reasons"
                              >
                                <span className="font-black text-xs">
                                  {item.target_hit_pct !== undefined ? `${Math.round(item.target_hit_pct)}%` : hitsRatio}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold">
                                  ({hitsRatio})
                                </span>
                              </button>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs" title="Awaiting market opening at 09:15 AM">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Infinite Scroll Trigger Sentinel */}
            <div ref={observerTarget} className="py-4 text-center text-xs text-slate-500">
              {loadingMore && (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Loading next 50 instruments...</span>
                </div>
              )}
              {!hasMore && items.length > 0 && (
                <span className="text-slate-400 font-mono">
                  All {totalCount.toLocaleString()} instruments loaded.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 2: INELIGIBLE UNIVERSE */}
      {activeTab === "INELIGIBLE" && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-2xs">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search excluded stock or reason..."
                value={ineligibleSearch}
                onChange={(e) => setIneligibleSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4 text-right">LTP</th>
                  <th className="py-3 px-4 text-right">Volume</th>
                  <th className="py-3 px-4 text-left">Primary Exclusion Reason</th>
                  <th className="py-3 px-4 text-left">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {ineligibleLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-rose-600 mb-2" />
                      Loading excluded stocks...
                    </td>
                  </tr>
                ) : ineligibleItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No excluded stocks found.
                    </td>
                  </tr>
                ) : (
                  ineligibleItems.map((it) => (
                    <tr key={it.symbol} className="hover:bg-rose-50/20">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {it.symbol} <span className="text-slate-400 font-normal">({it.name})</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {it.ltp > 0 ? `₹${it.ltp.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {it.volume > 0 ? it.volume.toLocaleString() : "0"}
                      </td>
                      <td className="py-3 px-4 text-left">
                        <span className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs">
                          {it.primary_reason}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left text-slate-600">
                        {it.category}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating "Back to Top" Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-8 z-40 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
        >
          <ArrowUp className="w-4 h-4" />
          <span>Back to Top</span>
        </button>
      )}

      {/* Target Hit / 225 Evaluations Reason Modal */}
      {activeModalItem && (
        <RecoAuditReasonModal
          symbol={activeModalItem.symbol}
          name={activeModalItem.name}
          scoreWA={activeModalItem.score_wa}
          scoreC={activeModalItem.score_c}
          scoreH={activeModalItem.score_h}
          scoreA={activeModalItem.score_a}
          policyPassed={activeModalItem.policy_passed}
          policyStatus={activeModalItem.policy_status}
          policyFailDesc={activeModalItem.policy_fail_desc}
          targetHitsRatio={activeModalItem.target_hits_ratio || `${activeModalItem.daily_hits || 0}/${activeModalItem.daily_checks || 225}`}
          onClose={() => setActiveModalItem(null)}
        />
      )}

      {/* Execution Gate & Breakout Telemetry Modal (Expanded Full-Width Dashboard) */}
      {selectedGateItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 md:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-black font-mono">
                    {selectedGateItem.symbol}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    {selectedGateItem.exchange || "NSE"} • {selectedGateItem.sector || "General"}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedGateItem.name || selectedGateItem.symbol}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                    selectedGateItem.has_live_reco || selectedGateItem.execution_gate_status === "GO"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
                      : "bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs"
                  }`}
                >
                  {selectedGateItem.has_live_reco || selectedGateItem.execution_gate_status === "GO" ? (
                    <>
                      <Zap className="w-4 h-4 text-emerald-600 fill-current" />
                      <span>GO 🔥 LIVE RECO</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>WAITING FOR BREAKOUT</span>
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGateItem(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mandatory Parameter Title */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <span>Execution Gate & Priority Rules Parameters</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold tracking-wide">
                    ALL MANDATORY
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real-time verification of user-configured breakout triggers and institutional session quotas.
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                Current LTP: ₹{selectedGateItem.ltp.toFixed(2)}
              </span>
            </div>

            {/* MICHPA Multi-Pillar Confluence Status */}
            {selectedGateItem.policy_fail_desc && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="font-bold flex items-center justify-between text-slate-800 mb-1.5">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-slate-700">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    M-I-C-H-P-A Multi-Pillar Gate Status
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${selectedGateItem.policy_status === "PASSED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {selectedGateItem.policy_status}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-600 leading-relaxed bg-white p-2 rounded-xl border border-slate-200/60">
                  {selectedGateItem.policy_fail_desc}
                </div>
              </div>
            )}

            {/* 6-Metric Execution & Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
              {/* Parameter 1: Day's High (HOD) Breakout */}
              <div className={`p-3.5 rounded-2xl border ${selectedGateItem.is_hod_pass ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-slate-200/80"}`}>
                <div className="flex items-center justify-between mb-1 font-sans">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">1. Day's High (HOD)</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${selectedGateItem.is_hod_pass ? "bg-emerald-600 text-white" : "bg-amber-200 text-amber-900"}`}>
                    {selectedGateItem.is_hod_pass ? "Passed" : "Waiting"}
                  </span>
                </div>
                <div className="text-sm font-black text-slate-900">
                  Trigger: ₹{(selectedGateItem.trigger_price || selectedGateItem.day_high || selectedGateItem.ltp).toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-500 font-sans mt-0.5 flex justify-between">
                  <span>HOD: ₹{(selectedGateItem.day_high || selectedGateItem.ltp).toFixed(2)}</span>
                  <span className="font-bold text-indigo-600">
                    {(selectedGateItem.trigger_gap_pct ?? 0) <= 0 ? "Breached" : `+${(selectedGateItem.trigger_gap_pct ?? 0).toFixed(1)}%`}
                  </span>
                </div>
              </div>

              {/* Parameter 2: 1-Min Relative Volume (RVOL) Surge */}
              <div className={`p-3.5 rounded-2xl border ${selectedGateItem.is_rvol_pass ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-slate-200/80"}`}>
                <div className="flex items-center justify-between mb-1 font-sans">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">2. 1-Min RVOL Surge</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${selectedGateItem.is_rvol_pass ? "bg-emerald-600 text-white" : "bg-amber-200 text-amber-900"}`}>
                    {selectedGateItem.is_rvol_pass ? "Passed" : "Waiting"}
                  </span>
                </div>
                <div className="text-sm font-black text-slate-900">
                  {(selectedGateItem.rvol || 0.85).toFixed(1)}x
                </div>
                <div className="text-[11px] text-slate-500 font-sans mt-0.5 flex justify-between">
                  <span>Requirement:</span>
                  <span className="font-bold text-slate-700">≥ {selectedGateItem.min_rvol_required || 1.2}x</span>
                </div>
              </div>

              {/* Parameter 3: Intraday VWAP Alignment */}
              <div className={`p-3.5 rounded-2xl border ${selectedGateItem.is_vwap_pass ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-slate-200/80"}`}>
                <div className="flex items-center justify-between mb-1 font-sans">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">3. Intraday VWAP</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${selectedGateItem.is_vwap_pass ? "bg-emerald-600 text-white" : "bg-amber-200 text-amber-900"}`}>
                    {selectedGateItem.is_vwap_pass ? "Passed" : "Waiting"}
                  </span>
                </div>
                <div className="text-sm font-black text-slate-900">
                  ₹{(selectedGateItem.vwap || selectedGateItem.ltp * 0.998).toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-500 font-sans mt-0.5 flex justify-between">
                  <span>VWAP Distance:</span>
                  <span className="font-bold text-emerald-700">
                    {selectedGateItem.vwap_dist_pct !== undefined ? `+${selectedGateItem.vwap_dist_pct}%` : "Launchpad"}
                  </span>
                </div>
              </div>

              {/* Parameter 4: Base Compression */}
              <div className={`p-3.5 rounded-2xl border ${selectedGateItem.is_base_pass ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-slate-200/80"}`}>
                <div className="flex items-center justify-between mb-1 font-sans">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">4. Base Consolidation</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${selectedGateItem.is_base_pass ? "bg-emerald-600 text-white" : "bg-amber-200 text-amber-900"}`}>
                    {selectedGateItem.is_base_pass ? "Passed" : "Waiting"}
                  </span>
                </div>
                <div className="text-sm font-black text-slate-900">
                  {(selectedGateItem.base_compression_pct ?? 1.8).toFixed(1)}% Range
                </div>
                <div className="text-[11px] text-slate-500 font-sans mt-0.5 flex justify-between">
                  <span>Compression Cap:</span>
                  <span className="font-bold text-slate-700">≤ {selectedGateItem.max_base_compression_pct ?? 2.5}%</span>
                </div>
              </div>

              {/* Parameter 5: Order Book Depth Imbalance */}
              <div className={`p-3.5 rounded-2xl border ${selectedGateItem.is_ob_pass ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-slate-200/80"}`}>
                <div className="flex items-center justify-between mb-1 font-sans">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">5. Order Book Depth</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${selectedGateItem.is_ob_pass ? "bg-emerald-600 text-white" : "bg-amber-200 text-amber-900"}`}>
                    {selectedGateItem.is_ob_pass ? "Passed" : "Waiting"}
                  </span>
                </div>
                <div className="text-sm font-black text-slate-900">
                  {selectedGateItem.bid_pct ?? 52}% Bids
                </div>
                <div className="text-[11px] text-slate-500 font-sans mt-0.5 flex justify-between">
                  <span>Bid/Ask Imbalance:</span>
                  <span className="font-bold text-indigo-700">
                    {selectedGateItem.orderbook_ratio ?? 1.1}x Ratio
                  </span>
                </div>
              </div>

              {/* Parameter 6: Session Quota & Allocator */}
              <div className={`p-3.5 rounded-2xl border ${selectedGateItem.is_quota_pass ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-slate-200/80"}`}>
                <div className="flex items-center justify-between mb-1 font-sans">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">6. Session Allocator</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${selectedGateItem.is_quota_pass ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
                    {selectedGateItem.is_quota_pass ? "Available" : "Full"}
                  </span>
                </div>
                <div className="text-sm font-black text-slate-900">
                  {selectedGateItem.session_name || "Morning Momentum"}
                </div>
                <div className="text-[11px] text-slate-500 font-sans mt-0.5 flex justify-between">
                  <span>Session Cap:</span>
                  <span className="font-bold text-slate-700">
                    {selectedGateItem.session_quota_allocated ?? 0} / {selectedGateItem.session_quota_max ?? 5} Max
                  </span>
                </div>
              </div>
            </div>

            {/* Checklist of Diagnostic Telemetry */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Breakout & Priority Telemetry Diagnostics
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Real-time tick compliance
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {(selectedGateItem.execution_gate_reasons && selectedGateItem.execution_gate_reasons.length > 0
                  ? selectedGateItem.execution_gate_reasons
                  : [
                      `Waiting for HOD Breakout at ₹${(selectedGateItem.trigger_price || selectedGateItem.ltp * 1.002).toFixed(2)}`,
                      `Awaiting 1-minute volume expansion to meet RVOL threshold`,
                      `VWAP floor is holding cleanly`
                    ]
                ).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-700 font-medium">
                    {selectedGateItem.has_live_reco || selectedGateItem.execution_gate_status === "GO" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mandatory Policy Alert Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Mandatory Verification Rule:</strong>
                All parameters shown above are mandatory conditions. In accordance with your priority rules, a stock will only trigger and transition to <strong>LIVE RECO</strong> when all breakout thresholds and session quota slots are satisfied simultaneously.
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedGateItem(null)}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Close Telemetry Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
