"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  Zap,
  Star,
  Bookmark,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Sparkles,
  SlidersHorizontal,
  Download,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Flame,
  Lightbulb,
  Layers,
  FolderPlus,
  ExternalLink,
  Activity
} from "lucide-react";
import { fetchStockUniverse, evaluateScreenerQuery, fetchSectors, getWebSocketUrl } from "@/services/api";
import { StockQuote } from "@/types";
import { AdvancedScreenerModal } from "@/components/AdvancedScreenerModal";
import { ColumnCustomizerModal } from "@/components/ColumnCustomizerModal";
import { StrategyScannerModal } from "@/components/StrategyScannerModal";
import { PRESET_STRATEGIES, PresetStrategy } from "@/constants/presetStrategies";
import {
  STOCK_COLUMNS_CATALOG,
  COLUMN_PRESETS,
  DEFAULT_COLUMN_KEYS,
  formatColumnCell,
  StockColumnDefinition
} from "@/constants/stockColumnCatalog";

interface UniverseViewProps {
  onSelectStock: (symbol: string) => void;
  onOpenTriggerModal: (symbol: string) => void;
  onNavigateToScreener?: () => void;
  isWatchlistOnly?: boolean;
  onNavigateToStocks?: () => void;
  initialSearch?: string;
}

const DEFAULT_SECTOR_OPTIONS = [
  "ALL",
  "Agriculture & Irrigation",
  "Auto Components & Tyres",
  "Automobile & Electric Vehicles",
  "Aviation & Airlines",
  "Banking & Financial Services",
  "Beverages & Breweries",
  "Capital Markets & FinTech",
  "Cement & Building Materials",
  "Chemicals & Petrochemicals",
  "Consumer Durables & Electronics",
  "Defence & Aerospace",
  "Diversified / General",
  "FMCG & Food Products",
  "Fertilizers & Agro Chemicals",
  "Gems, Jewellery & Luxury",
  "Healthcare, Pharma & Life Sciences",
  "Heavy Engineering & Capital Goods",
  "Hospitality, Hotels & Travel",
  "Information Technology",
  "Infrastructure & Capital Goods",
  "Iron, Steel & Metals",
  "Logistics, Ports & Supply Chain",
  "Media, Entertainment & Publishing",
  "Mining & Minerals",
  "Oil, Gas & Refineries",
  "Packaging & Containers",
  "Paper, Forest & Wood Products",
  "Power, Energy & CleanTech",
  "Railways & Mass Transit",
  "Real Estate & Urban Development",
  "Retail & Consumer E-Commerce",
  "Sugar & Distilleries",
  "Telecommunications",
  "Textiles & Apparel"
];

const PAGE_SIZE = 50;
const CORE_KEYS_SET = new Set(["symbol", "nse_ltp", "bse_ltp", "price_diff_pct", "change_pct", "volume"]);

export interface WatchlistGroup {
  id: string;
  name: string;
  symbols: string[];
}

const DEFAULT_WATCHLIST_GROUPS: WatchlistGroup[] = [
  {
    id: "default",
    name: "Primary Watchlist",
    symbols: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIARTL", "SBIN"]
  },
  {
    id: "momentum",
    name: "High Momentum",
    symbols: ["TATASTEEL", "ADANIENT", "BAJFINANCE", "LT", "TITAN"]
  },
  {
    id: "clean_energy",
    name: "Clean Energy & EV",
    symbols: ["TATAPOWER", "SUZLON", "ADANIGREEN", "BHEL", "JSWENERGY"]
  }
];

export interface StarterBasket extends PresetStrategy {
  icon: string;
  gradient: string;
}

const STARTER_BASKETS: StarterBasket[] = [
  {
    id: "nifty_titans",
    name: "Nifty Titans",
    category: "Quality & Moats",
    badge: "Large Cap Moats",
    desc: "Mega-cap market leaders (>₹1 Lakh Cr) with low debt and solid returns.",
    query: "market_cap > 100000 AND roe > 14 AND debt_to_equity < 0.6 AND roce > 12",
    icon: "👑",
    gradient: "from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-400"
  },
  {
    id: "momentum_breakouts",
    name: "Momentum Breakouts",
    category: "Technical & Momentum",
    badge: "High Beta",
    desc: "High volume breakout stocks (>1.2x surge) with RSI > 55.",
    query: "rsi > 55 AND change_pct >= 0 AND volume_surge_20d > 1.2 AND market_cap > 1000",
    icon: "⚡",
    gradient: "from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400"
  },
  {
    id: "cash_cow_defensives",
    name: "Cash Cow Defensives",
    category: "Deep Value & Safety",
    badge: "Defensive Moats",
    desc: "Recession-resilient FMCG, Pharma & Utilities with high operating margins.",
    query: 'sector in ["FMCG & Food Products", "Pharmaceuticals & Healthcare", "Power, Energy & CleanTech"] AND dividend_yield > 1.0 AND opm > 16 AND market_cap > 3000',
    icon: "🛡️",
    gradient: "from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400"
  },
  {
    id: "tech_digital_growth",
    name: "Tech & Digital Growth",
    category: "Growth & Multibaggers",
    badge: "IT & Software",
    desc: "Leading software exporters delivering high RoCE (>15%) and low debt.",
    query: 'sector == "Information Technology" AND roce > 15 AND market_cap > 1000',
    icon: "🤖",
    gradient: "from-purple-50 to-violet-50 border-purple-200 hover:border-purple-400"
  },
  {
    id: "green_energy_ev",
    name: "Green Energy & EV",
    category: "Capital Cycle & Capex",
    badge: "Clean Energy & EV",
    desc: "Renewable energy, clean infrastructure, and electric vehicle leaders.",
    query: 'sector in ["Power, Energy & CleanTech", "Automobile & Electric Vehicles"] AND market_cap > 5000',
    icon: "🔋",
    gradient: "from-green-50 to-emerald-50 border-green-200 hover:border-green-400"
  },
  {
    id: "banking_giants",
    name: "Banking Giants",
    category: "Quality & Moats",
    badge: "Banking & NBFCs",
    desc: "Premier banking and credit leaders with ROE > 12%.",
    query: 'sector == "Banking & Financial Services" AND roe > 12 AND market_cap > 10000',
    icon: "🏦",
    gradient: "from-sky-50 to-cyan-50 border-sky-200 hover:border-sky-400"
  }
];

const getStoredWatchlistGroups = (): WatchlistGroup[] => {
  if (typeof window === "undefined") return DEFAULT_WATCHLIST_GROUPS;
  try {
    const saved = localStorage.getItem("apex_user_watchlist_groups");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const legacy = localStorage.getItem("apex_user_watchlist");
    if (legacy) {
      const legacyParsed = JSON.parse(legacy);
      if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
        return [
          { id: "default", name: "Primary Watchlist", symbols: legacyParsed },
          ...DEFAULT_WATCHLIST_GROUPS.slice(1)
        ];
      }
    }
  } catch {}
  return DEFAULT_WATCHLIST_GROUPS;
};

const getStoredActiveWatchlistId = (): string => {
  if (typeof window === "undefined") return "default";
  try {
    const saved = localStorage.getItem("apex_active_watchlist_id");
    if (saved) return saved;
  } catch {}
  return "default";
};

const getStoredWatchlist = (): string[] => {
  const groups = getStoredWatchlistGroups();
  const activeId = getStoredActiveWatchlistId();
  const activeGroup = groups.find((g) => g.id === activeId) || groups[0];
  return activeGroup ? activeGroup.symbols : ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIARTL", "SBIN"];
};

export const UniverseView: React.FC<UniverseViewProps> = ({
  onSelectStock,
  onOpenTriggerModal,
  onNavigateToScreener,
  isWatchlistOnly = false,
  onNavigateToStocks,
  initialSearch = ""
}) => {
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [totalStocks, setTotalStocks] = useState<number>(5085);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const [search, setSearch] = useState<string>(initialSearch);

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [sectorOptions, setSectorOptions] = useState<string[]>(DEFAULT_SECTOR_OPTIONS);
  const [selectedExchange, setSelectedExchange] = useState<string>("ALL");
  const [selectedInstrument, setSelectedInstrument] = useState<string>("ALL");
  const [quickFilter, setQuickFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("volume");
  const [sortDir, setSortDir] = useState<string>("desc");
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);
  const [isDhanConnected, setIsDhanConnected] = useState<boolean>(true);
  const [lastTradingDatetime, setLastTradingDatetime] = useState<string>("");
  const [rowFlash, setRowFlash] = useState<Record<string, "up" | "down">>({});
  const wsRef = useRef<WebSocket | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());

  // Server-computed live telemetry summary across entire active filter slice
  const [serverSummary, setServerSummary] = useState<{
    total: number;
    advancing: number;
    declining: number;
    unchanged?: number;
    avg_change: number;
    top_gainer?: { symbol: string; change_pct: number; name?: string } | null;
    top_loser?: { symbol: string; change_pct: number; name?: string } | null;
    top_gainers?: Array<{ symbol: string; change_pct: number; name?: string }>;
    top_losers?: Array<{ symbol: string; change_pct: number; name?: string }>;
  } | null>(null);

  // Multiple Watchlist Groups & Active List State
  const [watchlistGroups, setWatchlistGroups] = useState<WatchlistGroup[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>("default");
  const [isCreatingList, setIsCreatingList] = useState<boolean>(false);
  const [newListName, setNewListName] = useState<string>("");
  const activeWatchlistGroup = watchlistGroups.find((g) => g.id === activeWatchlistId) || watchlistGroups[0];

  // Quick Add Autocomplete State
  const [quickAddQuery, setQuickAddQuery] = useState<string>("");
  const [quickAddResults, setQuickAddResults] = useState<StockQuote[]>([]);
  const [quickAddLoading, setQuickAddLoading] = useState<boolean>(false);
  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);
  const quickAddRef = useRef<HTMLDivElement | null>(null);

  // Starter Baskets Modal & Toast
  const [starterBasketsModalOpen, setStarterBasketsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Watchlist State & Synchronizer
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    const groups = getStoredWatchlistGroups();
    const activeId = getStoredActiveWatchlistId();
    setWatchlistGroups(groups);
    setActiveWatchlistId(activeId);
    const activeGroup = groups.find((g) => g.id === activeId) || groups[0];
    setWatchlist(activeGroup ? activeGroup.symbols : getStoredWatchlist());

    const handleWatchlistSync = (e: any) => {
      const refreshedGroups = getStoredWatchlistGroups();
      setWatchlistGroups(refreshedGroups);
      if (e?.detail && Array.isArray(e.detail)) {
        setWatchlist(e.detail);
      } else {
        setWatchlist(getStoredWatchlist());
      }
    };
    window.addEventListener("apex_watchlist_changed", handleWatchlistSync);
    window.addEventListener("storage", handleWatchlistSync);
    return () => {
      window.removeEventListener("apex_watchlist_changed", handleWatchlistSync);
      window.removeEventListener("storage", handleWatchlistSync);
    };
  }, []);

  const saveWatchlistGroups = (groups: WatchlistGroup[], targetActiveId?: string) => {
    setWatchlistGroups(groups);
    const curActiveId = targetActiveId || activeWatchlistId;
    const activeGroup = groups.find((g) => g.id === curActiveId) || groups[0];
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("apex_user_watchlist_groups", JSON.stringify(groups));
        if (activeGroup) {
          localStorage.setItem("apex_active_watchlist_id", activeGroup.id);
          localStorage.setItem("apex_user_watchlist", JSON.stringify(activeGroup.symbols));
          window.dispatchEvent(new CustomEvent("apex_watchlist_changed", { detail: activeGroup.symbols }));
        }
      } catch {}
    }
    if (activeGroup) {
      setWatchlist(activeGroup.symbols);
    }
  };

  const handleCreateWatchlist = (name: string) => {
    if (!name.trim()) return;
    const newId = `wl_${Date.now()}`;
    const newGroup: WatchlistGroup = {
      id: newId,
      name: name.trim(),
      symbols: []
    };
    const nextGroups = [...watchlistGroups, newGroup];
    setActiveWatchlistId(newId);
    saveWatchlistGroups(nextGroups, newId);
    setIsCreatingList(false);
    setNewListName("");
    showToast(`Created new watchlist "${name.trim()}"`);
  };

  const handleDeleteWatchlist = (id: string) => {
    if (watchlistGroups.length <= 1) {
      showToast("Cannot delete the last remaining watchlist");
      return;
    }
    const target = watchlistGroups.find((g) => g.id === id);
    const nextGroups = watchlistGroups.filter((g) => g.id !== id);
    const nextActive = nextGroups[0].id;
    setActiveWatchlistId(nextActive);
    saveWatchlistGroups(nextGroups, nextActive);
    showToast(`Deleted watchlist "${target?.name || id}"`);
  };

  const handleClearWatchlist = () => {
    const curGroup = watchlistGroups.find((g) => g.id === activeWatchlistId) || watchlistGroups[0];
    if (!curGroup || curGroup.symbols.length === 0) return;
    const nextGroups = watchlistGroups.map((g) => (g.id === activeWatchlistId ? { ...g, symbols: [] } : g));
    saveWatchlistGroups(nextGroups, activeWatchlistId);
    showToast(`Cleared "${curGroup.name}"`);
  };

  const handleAddStockToWatchlist = (symbol: string) => {
    const curGroup = watchlistGroups.find((g) => g.id === activeWatchlistId) || watchlistGroups[0];
    const currentSymbols = new Set(curGroup ? curGroup.symbols : watchlist);
    if (!currentSymbols.has(symbol)) {
      currentSymbols.add(symbol);
      const nextSymbols = Array.from(currentSymbols);
      const nextGroups = watchlistGroups.map((g) => {
        if (g.id === (curGroup?.id || activeWatchlistId)) {
          return { ...g, symbols: nextSymbols };
        }
        return g;
      });
      saveWatchlistGroups(nextGroups, curGroup?.id || activeWatchlistId);
      showToast(`✓ Added ${symbol} to ${curGroup?.name || "Watchlist"}`);
    } else {
      showToast(`${symbol} is already in ${curGroup?.name || "Watchlist"}`);
    }
    setQuickAddQuery("");
    setQuickAddOpen(false);
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "Quality & Moats":
        return {
          icon: "💎",
          border: "border-emerald-200/90 hover:border-emerald-400 hover:shadow-emerald-500/10",
          bg: "from-emerald-50/70 via-white to-teal-50/40",
          badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
          badgeText: "Quality Moat",
          btnHover: "hover:bg-emerald-600 hover:border-emerald-600 hover:text-white text-emerald-700 border-emerald-200"
        };
      case "Growth & Multibaggers":
        return {
          icon: "🚀",
          border: "border-purple-200/90 hover:border-purple-400 hover:shadow-purple-500/10",
          bg: "from-purple-50/70 via-white to-indigo-50/40",
          badgeBg: "bg-purple-100 text-purple-800 border-purple-200",
          badgeText: "High Growth",
          btnHover: "hover:bg-purple-600 hover:border-purple-600 hover:text-white text-purple-700 border-purple-200"
        };
      case "Deep Value & Safety":
        return {
          icon: "🛡️",
          border: "border-sky-200/90 hover:border-sky-400 hover:shadow-sky-500/10",
          bg: "from-sky-50/70 via-white to-blue-50/40",
          badgeBg: "bg-sky-100 text-sky-800 border-sky-200",
          badgeText: "Deep Value",
          btnHover: "hover:bg-sky-600 hover:border-sky-600 hover:text-white text-sky-700 border-sky-200"
        };
      case "Capital Cycle & Capex":
        return {
          icon: "⚙️",
          border: "border-amber-200/90 hover:border-amber-400 hover:shadow-amber-500/10",
          bg: "from-amber-50/70 via-white to-orange-50/40",
          badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
          badgeText: "Capex Cycle",
          btnHover: "hover:bg-amber-600 hover:border-amber-600 hover:text-white text-amber-700 border-amber-200"
        };
      case "Smart Money & Inflows":
        return {
          icon: "🐋",
          border: "border-cyan-200/90 hover:border-cyan-400 hover:shadow-cyan-500/10",
          bg: "from-cyan-50/70 via-white to-teal-50/40",
          badgeBg: "bg-cyan-100 text-cyan-800 border-cyan-200",
          badgeText: "Smart Money",
          btnHover: "hover:bg-cyan-600 hover:border-cyan-600 hover:text-white text-cyan-700 border-cyan-200"
        };
      case "Forensic & Solvency":
        return {
          icon: "🔬",
          border: "border-rose-200/90 hover:border-rose-400 hover:shadow-rose-500/10",
          bg: "from-rose-50/70 via-white to-pink-50/40",
          badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
          badgeText: "Clean Books",
          btnHover: "hover:bg-rose-600 hover:border-rose-600 hover:text-white text-rose-700 border-rose-200"
        };
      case "Technical & Momentum":
        return {
          icon: "⚡",
          border: "border-violet-200/90 hover:border-violet-400 hover:shadow-violet-500/10",
          bg: "from-violet-50/70 via-white to-fuchsia-50/40",
          badgeBg: "bg-violet-100 text-violet-800 border-violet-200",
          badgeText: "High Beta",
          btnHover: "hover:bg-violet-600 hover:border-violet-600 hover:text-white text-violet-700 border-violet-200"
        };
      default:
        return {
          icon: "✨",
          border: "border-blue-200/90 hover:border-blue-400 hover:shadow-blue-500/10",
          bg: "from-blue-50/70 via-white to-slate-50/40",
          badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
          badgeText: "Quantitative",
          btnHover: "hover:bg-blue-600 hover:border-blue-600 hover:text-white text-blue-700 border-blue-200"
        };
    }
  };

  const handleAddScreenerStrategy = async (strategy: PresetStrategy, mode: "all" | "top5" = "all") => {
    const loadingKey = `${strategy.id}-${mode}`;
    setLoadingStrategyId(loadingKey);
    try {
      const pageSize = mode === "all" ? 500 : 10;
      const res = await evaluateScreenerQuery(strategy.query, 1, pageSize);
      const matched = res?.stocks || [];
      if (matched.length === 0) {
        showToast(`No stocks currently match criteria for "${strategy.name}"`);
        return;
      }
      const curGroup = watchlistGroups.find((g) => g.id === activeWatchlistId) || watchlistGroups[0];
      const currentSymbols = new Set(curGroup ? curGroup.symbols : watchlist);
      let addedCount = 0;
      const targets = mode === "top5" ? matched.slice(0, 5) : matched;
      targets.forEach((stock: any) => {
        if (stock.symbol && !currentSymbols.has(stock.symbol)) {
          currentSymbols.add(stock.symbol);
          addedCount++;
        }
      });
      if (addedCount === 0) {
        showToast(`ℹ️ All ${mode === "top5" ? "top 5" : "qualifying"} stocks for "${strategy.name}" are already in ${curGroup?.name || "Watchlist"}`);
        return;
      }
      const nextSymbols = Array.from(currentSymbols);
      const nextGroups = watchlistGroups.map((g) => {
        if (g.id === (curGroup?.id || activeWatchlistId)) {
          return { ...g, symbols: nextSymbols };
        }
        return g;
      });
      saveWatchlistGroups(nextGroups, curGroup?.id || activeWatchlistId);
      showToast(`🎯 Added ${addedCount} ${mode === "all" ? "matching" : "top 5"} stocks from "${strategy.name}" to ${curGroup?.name || "Watchlist"}`);
    } catch (err) {
      console.error("Error evaluating screener strategy:", err);
      showToast(`Failed to evaluate formula for "${strategy.name}"`);
    } finally {
      setLoadingStrategyId(null);
    }
  };

  const handleInspectStrategyInScreener = (strategy: PresetStrategy) => {
    setScreenerModalFormula(strategy.query);
    setScreenerModalOpen(true);
  };

  const toggleWatchlist = (symbol: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const curGroup = watchlistGroups.find((g) => g.id === activeWatchlistId) || watchlistGroups[0];
    const current = curGroup ? curGroup.symbols : getStoredWatchlist();
    const exists = current.includes(symbol);
    const next = exists ? current.filter((s) => s !== symbol) : [...current, symbol];
    const nextGroups = watchlistGroups.length > 0
      ? watchlistGroups.map((g) => (g.id === (curGroup?.id || activeWatchlistId) ? { ...g, symbols: next } : g))
      : [{ id: "default", name: "Primary Watchlist", symbols: next }];
    saveWatchlistGroups(nextGroups, curGroup?.id || activeWatchlistId);
    showToast(exists ? `Removed ${symbol} from watchlist` : `Added ${symbol} to watchlist`);
  };

  // Debounced Quick Add Search
  useEffect(() => {
    if (!quickAddQuery.trim()) {
      setQuickAddResults([]);
      setQuickAddLoading(false);
      return;
    }
    const timer = setTimeout(async () => {
      setQuickAddLoading(true);
      try {
        const res = await fetchStockUniverse({
          search: quickAddQuery.trim(),
          page_size: 6
        });
        setQuickAddResults(res.stocks || []);
      } catch {
        setQuickAddResults([]);
      } finally {
        setQuickAddLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [quickAddQuery]);

  // Click outside to close quick add dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setQuickAddOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Modals & Active Filters
  const [screenerModalOpen, setScreenerModalOpen] = useState<boolean>(false);
  const [screenerModalFormula, setScreenerModalFormula] = useState<string>("");
  const [activeScreenerFormula, setActiveScreenerFormula] = useState<string | null>(null);
  const [screenerMetricsUsed, setScreenerMetricsUsed] = useState<string[]>([]);
  const [loadingStrategyId, setLoadingStrategyId] = useState<string | null>(null);
  const [scannerModalStrategy, setScannerModalStrategy] = useState<PresetStrategy | null>(null);

  // Dynamic leader rotation across top 5 movers
  const [leaderCycleIndex, setLeaderCycleIndex] = useState<number>(0);
  const [breadthFlash, setBreadthFlash] = useState<"up" | "down" | null>(null);
  const prevBreadthRef = useRef<{ advancing: number; declining: number }>({ advancing: 0, declining: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setLeaderCycleIndex((prev) => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Performance Pulse Metrics for Watchlist & Stocks Market Strip (Fully dynamic on all filters)
  const marketPulse = useMemo(() => {
    // 1. IN WATCHLIST MODE: Always compute dynamically from the active watchlist stocks!
    if (isWatchlistOnly) {
      if (stocks.length === 0) return null;
      const total = stocks.length;
      const advancing = stocks.filter((s) => (s.change_pct ?? 0) > 0).length;
      const declining = stocks.filter((s) => (s.change_pct ?? 0) < 0).length;
      const unchanged = Math.max(0, total - advancing - declining);
      const validChanges = stocks.map((s) => s.change_pct).filter((c): c is number => c !== undefined && c !== null);
      const avgChange = validChanges.length > 0 ? validChanges.reduce((a, b) => a + b, 0) / validChanges.length : 0;
      const sorted = [...stocks].sort((a, b) => (b.change_pct ?? 0) - (a.change_pct ?? 0));
      return {
        total,
        advancing,
        declining,
        unchanged,
        avgChange,
        topGainer: sorted[0] ? { symbol: sorted[0].symbol, name: sorted[0].name, change_pct: sorted[0].change_pct ?? 0 } : null,
        topLoser: sorted.length > 1 && sorted[sorted.length - 1].symbol !== sorted[0]?.symbol
          ? { symbol: sorted[sorted.length - 1].symbol, name: sorted[sorted.length - 1].name, change_pct: sorted[sorted.length - 1].change_pct ?? 0 }
          : null,
        leaderRank: 1
      };
    }

    // 2. IN UNIVERSE / STOCKS MODE: Use server-computed slice summary with live cycling across active top leaders
    if (serverSummary && serverSummary.total > 0) {
      const advancing = serverSummary.advancing ?? 0;
      const declining = serverSummary.declining ?? 0;
      const unchanged = serverSummary.unchanged ?? Math.max(0, serverSummary.total - advancing - declining);
      const topGainers: Array<{ symbol: string; name?: string; change_pct: number }> =
        serverSummary.top_gainers && serverSummary.top_gainers.length > 0
          ? serverSummary.top_gainers
          : serverSummary.top_gainer
          ? [serverSummary.top_gainer]
          : [];
      const topLosers: Array<{ symbol: string; name?: string; change_pct: number }> =
        serverSummary.top_losers && serverSummary.top_losers.length > 0
          ? serverSummary.top_losers
          : serverSummary.top_loser
          ? [serverSummary.top_loser]
          : [];

      const gIdx = topGainers.length > 0 ? leaderCycleIndex % topGainers.length : 0;
      const lIdx = topLosers.length > 0 ? leaderCycleIndex % topLosers.length : 0;

      return {
        total: serverSummary.total,
        advancing,
        declining,
        unchanged,
        avgChange: serverSummary.avg_change,
        topGainer: topGainers[gIdx] || serverSummary.top_gainer,
        topLoser: topLosers[lIdx] || serverSummary.top_loser,
        leaderRank: gIdx + 1
      };
    }

    if (stocks.length === 0) return null;
    const total = totalStocks;
    const advancing = stocks.filter((s) => (s.change_pct ?? 0) > 0).length;
    const declining = stocks.filter((s) => (s.change_pct ?? 0) < 0).length;
    const unchanged = Math.max(0, total - advancing - declining);
    const avgChange = stocks.reduce((acc, s) => acc + (s.change_pct ?? 0), 0) / stocks.length;
    const sorted = [...stocks].sort((a, b) => (b.change_pct ?? 0) - (a.change_pct ?? 0));
    return {
      total,
      advancing,
      declining,
      unchanged,
      avgChange,
      topGainer: sorted[0] ? { symbol: sorted[0].symbol, name: sorted[0].name, change_pct: sorted[0].change_pct ?? 0 } : null,
      topLoser: sorted.length > 1 ? { symbol: sorted[sorted.length - 1].symbol, name: sorted[sorted.length - 1].name, change_pct: sorted[sorted.length - 1].change_pct ?? 0 } : null,
      leaderRank: 1
    };
  }, [serverSummary, isWatchlistOnly, stocks, totalStocks, leaderCycleIndex]);

  // Flash breadth indicator on tick changes
  useEffect(() => {
    if (!marketPulse) return;
    const prev = prevBreadthRef.current;
    if (prev.advancing > 0 || prev.declining > 0) {
      if (marketPulse.advancing > prev.advancing) {
        setBreadthFlash("up");
        const t = setTimeout(() => setBreadthFlash(null), 700);
        return () => clearTimeout(t);
      } else if (marketPulse.declining > prev.declining) {
        setBreadthFlash("down");
        const t = setTimeout(() => setBreadthFlash(null), 700);
        return () => clearTimeout(t);
      }
    }
    prevBreadthRef.current = { advancing: marketPulse.advancing, declining: marketPulse.declining };
  }, [marketPulse?.advancing, marketPulse?.declining]);

  // Dynamic Telemetry Ribbon Label reflecting the active filter slice
  const ribbonMoveLabel = useMemo(() => {
    if (isWatchlistOnly) {
      return activeWatchlistGroup?.name ? `${activeWatchlistGroup.name.toUpperCase()} MOVE` : "WATCHLIST MOVE";
    }
    if (activeScreenerFormula) {
      return "SCREENER MOVE";
    }
    if (search.trim()) {
      return `"${search.trim().toUpperCase()}" MOVE`;
    }
    if (selectedInstrument && selectedInstrument !== "ALL") {
      switch (selectedInstrument) {
        case "EQUITY": return selectedExchange === "ALL" ? "EQUITIES MOVE" : `${selectedExchange} EQUITIES MOVE`;
        case "ETF": return "ETF MOVE";
        case "SME": return "SME EMERGE MOVE";
        case "BE": return "TRADE-FOR-TRADE MOVE";
        case "A": return "BSE GROUP A MOVE";
        case "B": return "BSE GROUP B MOVE";
        case "X": return "BSE GROUP X MOVE";
        case "T": return "BSE GROUP T MOVE";
        default: return `${selectedInstrument} MOVE`;
      }
    }
    if (selectedExchange === "NSE") return "NSE MOVE";
    if (selectedExchange === "BSE") return "BSE MOVE";
    if (selectedSector && selectedSector !== "ALL") return `${selectedSector.toUpperCase()} MOVE`;
    return "MARKET MOVE";
  }, [isWatchlistOnly, activeWatchlistGroup, activeScreenerFormula, search, selectedInstrument, selectedExchange, selectedSector]);

  const handleAddStocksFromScanner = (symbolsToAdd: string[], strategyName: string) => {
    const curGroup = watchlistGroups.find((g) => g.id === activeWatchlistId) || watchlistGroups[0];
    const currentSymbols = new Set(curGroup ? curGroup.symbols : watchlist);
    let addedCount = 0;
    symbolsToAdd.forEach((sym) => {
      if (!currentSymbols.has(sym)) {
        currentSymbols.add(sym);
        addedCount++;
      }
    });
    if (addedCount === 0) {
      showToast(`ℹ️ All selected stocks from "${strategyName}" are already in ${curGroup?.name || "Watchlist"}`);
      return;
    }
    const nextSymbols = Array.from(currentSymbols);
    const nextGroups = watchlistGroups.map((g) => {
      if (g.id === (curGroup?.id || activeWatchlistId)) {
        return { ...g, symbols: nextSymbols };
      }
      return g;
    });
    saveWatchlistGroups(nextGroups, curGroup?.id || activeWatchlistId);
    showToast(`🎯 Added ${addedCount} stocks from "${strategyName}" to ${curGroup?.name || "Watchlist"}`);
  };

  // Starter Baskets modal state
  const [modalBasketCategory, setModalBasketCategory] = useState<string>("ALL");
  const [modalBasketSearch, setModalBasketSearch] = useState<string>("");

  // Filtered baskets & strategies for Starter Baskets Modal
  const modalFilteredBaskets = useMemo(() => {
    if (modalBasketCategory !== "ALL" && modalBasketCategory !== "Curated Baskets") {
      return [];
    }
    if (!modalBasketSearch.trim()) return STARTER_BASKETS;
    const q = modalBasketSearch.toLowerCase();
    return STARTER_BASKETS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.badge.toLowerCase().includes(q) ||
        b.desc.toLowerCase().includes(q) ||
        b.query.toLowerCase().includes(q)
    );
  }, [modalBasketCategory, modalBasketSearch]);

  const modalFilteredStrategies = useMemo(() => {
    if (modalBasketCategory === "Curated Baskets") return [];
    return PRESET_STRATEGIES.filter((s) => {
      const matchCat = modalBasketCategory === "ALL" || s.category === modalBasketCategory;
      if (!matchCat) return false;
      if (!modalBasketSearch.trim()) return true;
      const q = modalBasketSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.query.toLowerCase().includes(q)
      );
    });
  }, [modalBasketCategory, modalBasketSearch]);

  // Complete Unified 44 Strategies Collection (6 Curated Starter Baskets + 38 Institutional Screener Strategies)
  const all44Strategies = useMemo(() => {
    return [
      ...STARTER_BASKETS.map((b) => ({
        ...b,
        isStarterBasket: true,
      })),
      ...PRESET_STRATEGIES.map((s) => {
        const theme = getCategoryTheme(s.category);
        return {
          ...s,
          icon: theme.icon,
          gradient: `${theme.bg} ${theme.border}`,
          isStarterBasket: false,
        };
      })
    ];
  }, []);

  // In-page Watchlist Strategy filter & search state
  const [watchlistStrategyCategory, setWatchlistStrategyCategory] = useState<string>("ALL");
  const [watchlistStrategySearch, setWatchlistStrategySearch] = useState<string>("" );

  const watchlistStrategyCategoryTabs = useMemo(() => {
    return [
      { id: "ALL", label: "All", count: all44Strategies.length },
      { id: "Starter Baskets", label: "Starter Baskets", count: all44Strategies.filter((s) => s.isStarterBasket).length },
      { id: "Quality & Moats", label: "Quality & Moats", count: all44Strategies.filter((s) => s.category === "Quality & Moats").length },
      { id: "Growth & Multibaggers", label: "Growth", count: all44Strategies.filter((s) => s.category === "Growth & Multibaggers").length },
      { id: "Deep Value & Safety", label: "Deep Value", count: all44Strategies.filter((s) => s.category === "Deep Value & Safety").length },
      { id: "Capital Cycle & Capex", label: "Capital Cycle", count: all44Strategies.filter((s) => s.category === "Capital Cycle & Capex").length },
      { id: "Smart Money & Inflows", label: "Smart Money", count: all44Strategies.filter((s) => s.category === "Smart Money & Inflows").length },
      { id: "Forensic & Solvency", label: "Forensic", count: all44Strategies.filter((s) => s.category === "Forensic & Solvency").length },
      { id: "Technical & Momentum", label: "Technical", count: all44Strategies.filter((s) => s.category === "Technical & Momentum").length },
    ];
  }, [all44Strategies]);

  const filteredWatchlistStrategies = useMemo(() => {
    return all44Strategies.filter((s) => {
      if (watchlistStrategyCategory === "Starter Baskets") {
        if (!s.isStarterBasket) return false;
      } else if (watchlistStrategyCategory !== "ALL") {
        if (s.category !== watchlistStrategyCategory) return false;
      }
      if (!watchlistStrategySearch.trim()) return true;
      const q = watchlistStrategySearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.query.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    });
  }, [all44Strategies, watchlistStrategyCategory, watchlistStrategySearch]);

  // Customizable Dynamic Columns (excluding the locked core columns)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [columnCustomizerOpen, setColumnCustomizerOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      // Purge old cache keys so previous stale "sector" column is not retained
      localStorage.removeItem("apex_stock_custom_columns");
      localStorage.removeItem("apex_stock_custom_columns_v2");
      localStorage.removeItem("apex_stock_custom_columns_v3");
      localStorage.removeItem("apex_stock_custom_columns_v4");

      const saved = localStorage.getItem("apex_stock_custom_columns_v5");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validKeys = new Set(STOCK_COLUMNS_CATALOG.map((c) => c.key));
          const unique = Array.from(new Set(parsed)).filter(
            (k) => typeof k === "string" && validKeys.has(k) && !CORE_KEYS_SET.has(k)
          );
          setSelectedColumns(unique);
          return;
        }
      }
      // True default: 0 additional columns. Only permanent core columns are shown.
      setSelectedColumns([]);
    } catch (e) {
      console.error("Failed to load custom columns:", e);
      setSelectedColumns([]);
    }
  }, []);

  const handleSaveColumns = (cols: string[]) => {
    const unique = Array.from(new Set(cols)).filter((k) => !CORE_KEYS_SET.has(k));
    setSelectedColumns(unique);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("apex_stock_custom_columns_v5", JSON.stringify(unique));
      } catch (e) {
        console.error("Failed to save custom columns:", e);
      }
    }
  };

  const handleResetDefaultColumns = () => {
    handleSaveColumns([]);
  };

  // 4. Sector filter reset: If "sector" column is removed by user, reset sector filter to ALL
  useEffect(() => {
    if (!selectedColumns.includes("sector") && selectedSector !== "ALL") {
      setSelectedSector("ALL");
    }
  }, [selectedColumns, selectedSector]);

  const activeCustomColumnDefs = useMemo<StockColumnDefinition[]>(() => {
    return selectedColumns
      .filter((k) => !CORE_KEYS_SET.has(k))
      .map((k) => STOCK_COLUMNS_CATALOG.find((c) => c.key === k))
      .filter(Boolean) as StockColumnDefinition[];
  }, [selectedColumns]);

  // Fetch full list of sectors dynamically from backend
  useEffect(() => {
    fetchSectors()
      .then((res) => {
        if (res?.sectors && res.sectors.length > 0) {
          setSectorOptions(["ALL", ...res.sectors]);
        }
      })
      .catch(() => {});
  }, []);

  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const stocksRef = useRef<StockQuote[]>(stocks);
  stocksRef.current = stocks;

  const handleContainerScroll = () => {
    if (tableContainerRef.current) {
      setShowScrollTop(tableContainerRef.current.scrollTop > 250);
    }
  };

  const scrollToTop = () => {
    tableContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCycleExchange = () => {
    setSelectedExchange((prev) => {
      if (prev === "ALL") return "BSE";
      if (prev === "BSE") return "NSE";
      return "ALL";
    });
  };

  const handleSort = (field: string) => {
    setQuickFilter("ALL");
    if (sortBy === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(["volume", "change_pct", "price_diff_pct"].includes(field) ? "desc" : "asc");
    }
  };

  const renderSortIcon = (field: string, isAlpha = false) => {
    const isActive = sortBy === field;
    return (
      <span
        title={`Sort by ${field} (${isActive ? (sortDir === "asc" ? "Ascending" : "Descending") : "Click to sort"})`}
        className={`inline-flex items-center justify-center p-0.5 rounded transition-all ml-1 ${
          isActive
            ? "text-blue-600 font-bold"
            : "text-slate-400 group-hover:text-slate-600 opacity-60 group-hover:opacity-100"
        }`}
      >
        {isActive ? (
          sortDir === "asc" ? (
            <ArrowUp className="w-3 h-3 stroke-[2.5]" />
          ) : (
            <ArrowDown className="w-3 h-3 stroke-[2.5]" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3" />
        )}
      </span>
    );
  };

  // 3. Exchange filter column visibility logic
  const isNseVisible = selectedExchange === "ALL" || selectedExchange === "NSE";
  const isBseVisible = selectedExchange === "ALL" || selectedExchange === "BSE";
  const isSpreadVisible = selectedExchange === "ALL";

  const totalRenderedCols =
    1 + // Instrument
    (isNseVisible ? 1 : 0) +
    (isBseVisible ? 1 : 0) +
    (isSpreadVisible ? 1 : 0) +
    1 + // Change %
    1 + // Volume
    activeCustomColumnDefs.length +
    1; // Actions

  // Initial load or when filters change
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // If Watchlist view and watchlist is empty, short-circuit
      if (isWatchlistOnly && watchlist.length === 0) {
        setStocks([]);
        setTotalStocks(0);
        setCurrentPage(1);
        setHasMore(false);
        setLoading(false);
        return;
      }

      let activeSortBy = sortBy;
      let activeSortDir = sortDir;
      let priceDiffOnly = false;

      // Adjust sort column if viewing single exchange and currently sorting on the other
      if (selectedExchange === "BSE" && activeSortBy === "nse_ltp") {
        activeSortBy = "bse_ltp";
      } else if (selectedExchange === "NSE" && activeSortBy === "bse_ltp") {
        activeSortBy = "nse_ltp";
      }

      if (quickFilter === "SPREAD") {
        priceDiffOnly = true;
      } else if (quickFilter === "GAINERS") {
        activeSortBy = "change_pct";
        activeSortDir = "desc";
      } else if (quickFilter === "LOSERS") {
        activeSortBy = "change_pct";
        activeSortDir = "asc";
      } else if (quickFilter === "HIGH_VOL") {
        activeSortBy = "volume";
        activeSortDir = "desc";
      }

      // If active screener formula is set, evaluate formula across universe
      if (activeScreenerFormula) {
        const res = await evaluateScreenerQuery(
          activeScreenerFormula,
          1,
          PAGE_SIZE,
          activeSortBy,
          activeSortDir
        );
        let initialList = res.stocks || [];
        if (selectedExchange === "NSE") {
          initialList = initialList.filter((s: StockQuote) => s.exchanges?.includes("NSE"));
        } else if (selectedExchange === "BSE") {
          initialList = initialList.filter((s: StockQuote) => s.exchanges?.includes("BSE"));
        }
        setStocks(initialList);
        setTotalStocks(res.total || 0);
        if (res.summary) {
          setServerSummary(res.summary);
        }
        setCurrentPage(1);
        setHasMore(initialList.length < (res.total || 0));
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollTop = 0;
        }
        return;
      }

      const res = await fetchStockUniverse({
        search,
        symbols: isWatchlistOnly ? (watchlist.length > 0 ? watchlist.join(",") : "NONE") : undefined,
        sector: selectedSector,
        exchange: selectedExchange,
        instrument: selectedInstrument,
        sort_by: activeSortBy,
        sort_dir: activeSortDir,
        price_diff_only: priceDiffOnly,
        page: 1,
        page_size: PAGE_SIZE
      });

      const initialList = res.stocks || [];
      setStocks(initialList);
      setTotalStocks(res.total ?? initialList.length);
      if (res.summary) {
        setServerSummary(res.summary);
      }
      if (res.dhan_connected !== undefined) {
        setIsDhanConnected(!!res.dhan_connected);
      }
      if (res.is_market_open !== undefined) {
        setIsMarketOpen(!!res.is_market_open);
      }
      if (res.last_trading_datetime_str) {
        setLastTradingDatetime(res.last_trading_datetime_str);
      }
      setCurrentPage(1);
      setHasMore(initialList.length < (res.total || 0));

      // Dynamically subscribe all visible symbols over WebSocket for sub-second ticks
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && initialList.length > 0) {
        initialList.forEach((s: StockQuote) => subscribedSymbolsRef.current.add(s.symbol));
        wsRef.current.send(JSON.stringify({
          action: "SUBSCRIBE_UNIVERSE",
          symbols: initialList.map((s: StockQuote) => s.symbol)
        }));
      }

      // Reset scroll position to top on filter change
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.error("Initial load error:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedSector, selectedExchange, selectedInstrument, quickFilter, sortBy, sortDir, activeScreenerFormula, isWatchlistOnly, watchlist]);

  // Load next page on scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    if (isWatchlistOnly && watchlist.length === 0) return;
    setLoadingMore(true);

    const nextPage = currentPage + 1;
    try {
      let activeSortBy = sortBy;
      let activeSortDir = sortDir;
      let priceDiffOnly = quickFilter === "SPREAD";

      if (selectedExchange === "BSE" && activeSortBy === "nse_ltp") {
        activeSortBy = "bse_ltp";
      } else if (selectedExchange === "NSE" && activeSortBy === "bse_ltp") {
        activeSortBy = "nse_ltp";
      }

      if (quickFilter === "GAINERS") {
        activeSortBy = "change_pct";
        activeSortDir = "desc";
      } else if (quickFilter === "LOSERS") {
        activeSortBy = "change_pct";
        activeSortDir = "asc";
      } else if (quickFilter === "HIGH_VOL") {
        activeSortBy = "volume";
        activeSortDir = "desc";
      }

      if (activeScreenerFormula) {
        const res = await evaluateScreenerQuery(
          activeScreenerFormula,
          nextPage,
          PAGE_SIZE,
          activeSortBy,
          activeSortDir
        );
        let nextStocks = res.stocks || [];
        if (selectedExchange === "NSE") {
          nextStocks = nextStocks.filter((s: StockQuote) => s.exchanges?.includes("NSE"));
        } else if (selectedExchange === "BSE") {
          nextStocks = nextStocks.filter((s: StockQuote) => s.exchanges?.includes("BSE"));
        }

        if (nextStocks.length > 0) {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            nextStocks.forEach((s: StockQuote) => subscribedSymbolsRef.current.add(s.symbol));
            wsRef.current.send(JSON.stringify({
              action: "SUBSCRIBE_UNIVERSE",
              symbols: nextStocks.map((s: StockQuote) => s.symbol)
            }));
          }
          setStocks((prev) => {
            const existingKeys = new Set(prev.map((s) => s.symbol));
            const filteredNew = nextStocks.filter((s: StockQuote) => !existingKeys.has(s.symbol));
            const updated = [...prev, ...filteredNew];
            setHasMore(updated.length < (res.total || 0));
            return updated;
          });
          setCurrentPage(nextPage);
        } else {
          setHasMore(false);
        }
        return;
      }

      const res = await fetchStockUniverse({
        search,
        symbols: isWatchlistOnly ? (watchlist.length > 0 ? watchlist.join(",") : "NONE") : undefined,
        sector: selectedSector,
        exchange: selectedExchange,
        instrument: selectedInstrument,
        sort_by: activeSortBy,
        sort_dir: activeSortDir,
        price_diff_only: priceDiffOnly,
        page: nextPage,
        page_size: PAGE_SIZE
      });

      const nextStocks = res.stocks || [];
      if (nextStocks.length > 0) {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          nextStocks.forEach((s: StockQuote) => subscribedSymbolsRef.current.add(s.symbol));
          wsRef.current.send(JSON.stringify({
            action: "SUBSCRIBE_UNIVERSE",
            symbols: nextStocks.map((s: StockQuote) => s.symbol)
          }));
        }
        setStocks((prev) => {
          const existingKeys = new Set(prev.map((s) => s.symbol));
          const filteredNew = nextStocks.filter((s: StockQuote) => !existingKeys.has(s.symbol));
          const updated = [...prev, ...filteredNew];
          setHasMore(updated.length < (res.total || 0));
          return updated;
        });
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMore, loading, loadingMore, search, selectedSector, selectedExchange, selectedInstrument, quickFilter, sortBy, sortDir, activeScreenerFormula, isWatchlistOnly, watchlist]);

  // Reset and load on filter changes
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Infinite scroll IntersectionObserver tied to tableContainerRef
  useEffect(() => {
    const el = observerTarget.current;
    const rootEl = tableContainerRef.current;
    if (!el || !rootEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { root: rootEl, threshold: 0.1, rootMargin: "250px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  // Real-Time WebSocket Listener for Dalal Street Ticks
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;
    let isMounted = true;

    const connectWs = () => {
      if (!isMounted) return;
      try {
        const wsUrl = getWebSocketUrl("/ws/terminal");
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          subscribedSymbolsRef.current.clear();
          if (stocks.length > 0) {
            stocks.forEach((s) => subscribedSymbolsRef.current.add(s.symbol));
            ws?.send(JSON.stringify({
              action: "SUBSCRIBE_UNIVERSE",
              symbols: stocks.map((s: StockQuote) => s.symbol)
            }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "STOCK_TICK" && data.symbol) {
              setStocks((prev) =>
                prev.map((item) => {
                  if (item.symbol !== data.symbol) return item;
                  const oldLtp = item.ltp;
                  const newLtp = data.ltp ?? item.ltp;
                  const nse = data.nse_ltp !== undefined ? data.nse_ltp : item.nse_ltp;
                  const bse = data.bse_ltp !== undefined ? data.bse_ltp : item.bse_ltp;

                  const hasPriceChanged =
                    (newLtp !== oldLtp && oldLtp > 0) ||
                    (data.nse_ltp !== undefined && item.nse_ltp !== undefined && data.nse_ltp !== item.nse_ltp) ||
                    (data.bse_ltp !== undefined && item.bse_ltp !== undefined && data.bse_ltp !== item.bse_ltp);

                  if (hasPriceChanged) {
                    setRowFlash((f) => ({ ...f, [data.symbol]: newLtp >= oldLtp ? "up" : "down" }));
                    setTimeout(() => {
                      setRowFlash((f) => {
                        const n = { ...f };
                        delete n[data.symbol];
                        return n;
                      });
                    }, 450);
                  }

                  let priceDiff = item.price_diff;
                  let priceDiffPct = item.price_diff_pct;
                  if (nse && bse && nse > 0 && bse > 0) {
                    priceDiff = parseFloat(Math.abs(nse - bse).toFixed(2));
                    const minP = Math.min(nse, bse);
                    priceDiffPct = minP > 0 ? parseFloat(((priceDiff / minP) * 100).toFixed(2)) : 0;
                  }

                  return {
                    ...item,
                    ltp: newLtp,
                    nse_ltp: nse,
                    bse_ltp: bse,
                    price_diff: priceDiff,
                    price_diff_pct: priceDiffPct,
                    change: data.change ?? item.change,
                    change_pct: data.change_pct ?? item.change_pct,
                    volume: data.volume || item.volume,
                    day_high: data.day_high || item.day_high,
                    day_low: data.day_low || item.day_low,
                    updated_at: data.updated_at || Date.now() / 1000
                  };
                })
              );
            } else if (data.type === "MARKET_PULSE") {
              if (data.is_market_open !== undefined) setIsMarketOpen(!!data.is_market_open);
              if (data.last_trading_datetime_str) setLastTradingDatetime(data.last_trading_datetime_str);
              if (data.summary && selectedExchange === "ALL" && selectedInstrument === "ALL" && selectedSector === "ALL" && !search && !activeScreenerFormula && !isWatchlistOnly) {
                setServerSummary(data.summary);
              }
            }
          } catch {}
        };

        ws.onclose = () => {
          if (isMounted) reconnectTimer = setTimeout(connectWs, 3000);
        };
        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        if (isMounted) reconnectTimer = setTimeout(connectWs, 5000);
      }
    };

    connectWs();

    // Fast dynamic sync (every 3.5s) to keep all filtered ribbon metrics and prices real-time
    const interval = setInterval(async () => {
      try {
        let activeSortBy = sortBy;
        let activeSortDir = sortDir;
        let priceDiffOnly = quickFilter === "SPREAD";

        if (selectedExchange === "BSE" && activeSortBy === "nse_ltp") {
          activeSortBy = "bse_ltp";
        } else if (selectedExchange === "NSE" && activeSortBy === "bse_ltp") {
          activeSortBy = "nse_ltp";
        }

        if (quickFilter === "GAINERS") {
          activeSortBy = "change_pct";
          activeSortDir = "desc";
        } else if (quickFilter === "LOSERS") {
          activeSortBy = "change_pct";
          activeSortDir = "asc";
        } else if (quickFilter === "HIGH_VOL") {
          activeSortBy = "volume";
          activeSortDir = "desc";
        }

        const totalVisible = stocksRef.current.length || PAGE_SIZE;
        const res = await fetchStockUniverse({
          search,
          symbols: isWatchlistOnly ? (watchlist.length > 0 ? watchlist.join(",") : "NONE") : undefined,
          sector: selectedSector,
          exchange: selectedExchange,
          instrument: selectedInstrument,
          sort_by: activeSortBy,
          sort_dir: activeSortDir,
          price_diff_only: priceDiffOnly,
          page: 1,
          page_size: Math.max(PAGE_SIZE, totalVisible)
        });

        if (res.summary) {
          setServerSummary(res.summary);
        }

        if (res.stocks && res.stocks.length > 0) {
          const freshMap = new Map<string, StockQuote>();
          res.stocks.forEach((s: StockQuote) => freshMap.set(s.symbol, s));

          setStocks((prev) =>
            prev.map((item) => {
              const fresh = freshMap.get(item.symbol);
              return fresh ? { ...item, ...fresh } : item;
            })
          );
          if (res.dhan_connected !== undefined) {
            setIsDhanConnected(!!res.dhan_connected);
          }
        }
      } catch (err) {
        console.debug("Tick sync:", err);
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [search, selectedSector, selectedExchange, selectedInstrument, quickFilter, sortBy, sortDir, activeScreenerFormula, isWatchlistOnly, watchlist]);

  // Synchronize WebSocket subscriptions for all currently rendered stocks
  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const newSymbols = stocks
      .map((s) => s.symbol)
      .filter((sym) => !subscribedSymbolsRef.current.has(sym));

    if (newSymbols.length > 0) {
      newSymbols.forEach((sym) => subscribedSymbolsRef.current.add(sym));
      wsRef.current.send(
        JSON.stringify({
          action: "SUBSCRIBE_UNIVERSE",
          symbols: newSymbols
        })
      );
    }
  }, [stocks]);

  const formatVolume = (vol: number) => {
    if (vol >= 10000000) return `${(vol / 10000000).toFixed(2)} Cr`;
    if (vol >= 100000) return `${(vol / 100000).toFixed(2)} L`;
    return vol.toLocaleString("en-IN");
  };

  const handleExportCSV = () => {
    const headers = ["Symbol", "Name", "NSE_LTP", "BSE_LTP", "Change_Pct", "Volume", ...activeCustomColumnDefs.map((c) => c.header)];
    const rows = stocks.map((s: any) => {
      const baseRow = [
        s.symbol,
        `"${s.name || s.symbol}"`,
        s.nse_ltp ?? s.ltp ?? 0,
        s.bse_ltp ?? s.ltp ?? 0,
        s.change_pct ?? 0,
        s.volume ?? 0
      ];
      const dynRow = activeCustomColumnDefs.map((c) => s[c.key] ?? "");
      return [...baseRow, ...dynRow];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `apex_${isWatchlistOnly ? "watchlist" : "universe"}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full space-y-2.5 font-sans w-full max-w-full overflow-hidden">
      {/* 0. Multiple Watchlists Navigation Bar (Watchlist Mode Only) */}
      {isWatchlistOnly && (
        <div className="shrink-0 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Watchlists:</span>
            </span>

            {watchlistGroups.map((group) => {
              const isActive = group.id === activeWatchlistId;
              return (
                <div key={group.id} className="relative flex items-center group">
                  <button
                    onClick={() => {
                      setActiveWatchlistId(group.id);
                      saveWatchlistGroups(watchlistGroups, group.id);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600 font-bold ring-2 ring-blue-500/20"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>{group.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {group.symbols.length}
                    </span>
                  </button>
                  {watchlistGroups.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWatchlist(group.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                      title={`Delete "${group.name}"`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Create New List Button / Inline Input */}
            {isCreatingList ? (
              <div className="flex items-center space-x-1 shrink-0 bg-blue-50/70 p-0.5 rounded-lg border border-blue-200">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List Name..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateWatchlist(newListName);
                    if (e.key === "Escape") setIsCreatingList(false);
                  }}
                  autoFocus
                  className="px-2 py-0.5 text-xs bg-white border border-slate-200 rounded font-medium focus:ring-1 focus:ring-blue-500 w-28"
                />
                <button
                  onClick={() => handleCreateWatchlist(newListName)}
                  className="p-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                  title="Save List"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setIsCreatingList(false);
                    setNewListName("");
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingList(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 border border-blue-200/80 transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New List</span>
              </button>
            )}
          </div>

          {/* Right actions: Starter Baskets button, Screener button, Export CSV, Clear List */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={() => setStarterBasketsModalOpen(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Explore Curated Watchlist Baskets & Screener Strategies (44 Total)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Starter Baskets (44)</span>
            </button>

            <button
              onClick={() => {
                setScreenerModalFormula("");
                setScreenerModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Open Institutional Screener & Custom Formula Studio"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Screener</span>
            </button>

            {watchlist.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Export Watchlist to CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
              </button>
            )}

            {watchlist.length > 0 && (
              <button
                onClick={handleClearWatchlist}
                className="px-2 py-1 rounded-lg text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer flex items-center gap-1"
                title="Clear current watchlist"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      )}

      {isWatchlistOnly && watchlist.length === 0 ? (
        /* Empty Watchlist Hero & Starter Studio: Full widescreen layout */
        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="w-full space-y-6">
            {/* 1. Hero Command Header & Integrated Quick Search (Widescreen Horizontal) */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 md:p-6 text-white shadow-md relative overflow-hidden border border-slate-800">
              {/* Background ambient glow */}
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-1/3 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Left: Value Proposition */}
                <div className="max-w-xl space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-bold tracking-wide uppercase">
                    <Bookmark className="w-3.5 h-3.5 fill-amber-300" />
                    <span>Personal Market Command Center</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">
                    {activeWatchlistGroup?.name || "Watchlist"} is Ready to Build
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                    Track your highest-conviction ideas, monitor live NSE & BSE price disparities, and seize breakout opportunities with real-time Dhan binary ticks.
                  </p>
                </div>

                {/* Right: Search Box + Quick Add Chips */}
                <div ref={quickAddRef} className="w-full lg:max-w-md relative">
                  <div className="bg-white/10 hover:bg-white/15 focus-within:bg-white p-3 rounded-xl border border-white/20 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/30 transition-all flex items-center gap-3 shadow-inner group">
                    <Search className="w-4 h-4 text-slate-300 group-focus-within:text-blue-600 shrink-0 ml-1" />
                    <input
                      type="text"
                      value={quickAddQuery}
                      onFocus={() => setQuickAddOpen(true)}
                      onChange={(e) => {
                        setQuickAddQuery(e.target.value);
                        setQuickAddOpen(true);
                      }}
                      placeholder="Search 5,000+ stocks (e.g. RELIANCE, TCS, INFY)..."
                      className="flex-1 bg-transparent text-xs text-white group-focus-within:text-slate-900 placeholder:text-slate-400 outline-none font-medium"
                    />
                    {quickAddLoading && <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin mr-1" />}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {quickAddOpen && quickAddQuery.trim().length > 0 && (
                    <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                        <span>Quick Add to {activeWatchlistGroup?.name || "Watchlist"}</span>
                        <span className="text-[9px] text-blue-600">5,000+ Universe</span>
                      </div>
                      {quickAddResults.length === 0 && !quickAddLoading && (
                        <div className="px-3 py-6 text-center text-xs text-slate-400">
                          No matching stocks found for "{quickAddQuery}"
                        </div>
                      )}
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                        {quickAddResults.map((s) => {
                          const isAlreadyIn = watchlist.includes(s.symbol);
                          const isPos = (s.change_pct ?? 0) >= 0;
                          return (
                            <div
                              key={s.symbol}
                              className="px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-slate-800">{s.symbol}</span>
                                  <span className="text-[9px] font-medium px-1 rounded bg-slate-100 text-slate-500">
                                    {s.exchanges?.[0] || "NSE"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">{s.name}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs font-semibold text-slate-800">
                                  ₹{s.ltp ? s.ltp.toLocaleString("en-IN") : "-"}
                                </div>
                                <div className={`text-[10px] font-bold ${isPos ? "text-emerald-600" : "text-rose-600"}`}>
                                  {isPos ? "+" : ""}{(s.change_pct ?? 0).toFixed(2)}%
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddStockToWatchlist(s.symbol)}
                                disabled={isAlreadyIn}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all ${
                                  isAlreadyIn
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                                }`}
                              >
                                {isAlreadyIn ? "Added" : "+ Add to List"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 1-Click Popular Stock Chips */}
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick Add:</span>
                    {["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "TATAMOTORS", "SBIN"].map((sym) => (
                      <button
                        key={sym}
                        onClick={() => handleAddStockToWatchlist(sym)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
                        title={`Click to add ${sym} to ${activeWatchlistGroup?.name || "Watchlist"}`}
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{sym}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Institutional Strategies & Starter Baskets (All 44 Options) */}
            <div>
              {/* Section Header with dynamic count & quick search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 px-1">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Institutional Strategies & Starter Baskets
                    </h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {all44Strategies.length} Strategies
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Explore all 44 quantitative models or 1-click add qualifying stocks to {activeWatchlistGroup?.name || "your list"}
                  </p>
                </div>

                {/* Quick Search */}
                <div className="relative w-full md:w-72 shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={watchlistStrategySearch}
                    onChange={(e) => setWatchlistStrategySearch(e.target.value)}
                    placeholder="Search 44 strategies (e.g. Moats, ROCE, EV)..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700 placeholder:text-slate-400 transition-colors shadow-2xs"
                  />
                  {watchlistStrategySearch && (
                    <button
                      onClick={() => setWatchlistStrategySearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills (Horizontal Scrollable) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3.5 scrollbar-none">
                {watchlistStrategyCategoryTabs.map((tab) => {
                  const isActive = watchlistStrategyCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setWatchlistStrategyCategory(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200/60"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* No match notice */}
              {filteredWatchlistStrategies.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 font-semibold mb-2">
                    No strategies match "{watchlistStrategySearch}" in {watchlistStrategyCategory}
                  </p>
                  <button
                    onClick={() => {
                      setWatchlistStrategySearch("");
                      setWatchlistStrategyCategory("ALL");
                    }}
                    className="px-3.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-700 shadow-xs"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                /* All 44 Strategies in 3-column Widescreen Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {filteredWatchlistStrategies.map((strat) => {
                    const isLoading = loadingStrategyId === `${strat.id}-all`;
                    return (
                      <div
                        key={strat.id}
                        className={`p-4 rounded-xl border bg-gradient-to-br ${strat.gradient} transition-all duration-200 hover:shadow-md flex flex-col justify-between group`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5 gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xl shrink-0 select-none">{strat.icon}</span>
                              <span className="text-xs font-black text-slate-900 leading-snug truncate" title={strat.name}>
                                {strat.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 text-slate-700 border border-slate-200/60 whitespace-nowrap">
                                {strat.badge}
                              </span>
                              {strat.isStarterBasket && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                                  STARTER
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 mb-2.5 line-clamp-2 leading-relaxed" title={strat.desc}>
                            {strat.desc}
                          </p>
                          <div className="mb-3.5 px-2.5 py-1.5 rounded bg-white/90 border border-slate-200/80 text-[10px] font-mono text-slate-700 shadow-2xs leading-normal">
                            <span className="font-bold text-slate-400 select-none mr-1.5">FORMULA:</span>
                            <span className="text-slate-800 break-words">{strat.query}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                          <button
                            onClick={() => {
                              setScannerModalStrategy(strat);
                            }}
                            className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs bg-white text-slate-800 border border-slate-200/80 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                            title="Scan qualifying stocks and pick top 5/10/20/50/all based on Market Cap, Volume, etc."
                          >
                            <Search className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Scan & Select</span>
                          </button>
                          <button
                            onClick={() => handleAddScreenerStrategy(strat, "all")}
                            disabled={!!loadingStrategyId}
                            className="py-1.5 px-2.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                            title={`Instantly add all matching stocks to ${activeWatchlistGroup?.name || "Watchlist"}`}
                          >
                            {isLoading ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Adding...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5 text-slate-500" />
                                <span>+ Add All</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Value Pillars & Full Scanner Navigation */}
            <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-700">Real-Time Dhan Live Ticks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="font-semibold text-slate-700">NSE & BSE Arbitrage Tracking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="font-semibold text-slate-700">Custom Multi-Year Fundamentals</span>
                </div>
              </div>

              {onNavigateToStocks && (
                <button
                  onClick={onNavigateToStocks}
                  className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer shrink-0"
                >
                  <span>Browse All 5,000+ Indian Stocks in Market Scanner →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
      {/* 1. Primary Command Bar: Search, Quick Add, Total Count, 1-Click Exchange Cycle & Sector */}
      <div className="shrink-0 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm flex items-center">
              <Search className="w-4 h-4 text-blue-500/80 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isWatchlistOnly ? "Filter this watchlist..." : "Search Stock (e.g. RELIANCE, TCS, INFY)..."}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all shadow-2xs placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Add Stock Input (Watchlist Mode Only) */}
            {isWatchlistOnly && (
              <div ref={quickAddRef} className="relative flex-1 max-w-xs">
                <div className="relative">
                  <Plus className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={quickAddQuery}
                    onFocus={() => setQuickAddOpen(true)}
                    onChange={(e) => {
                      setQuickAddQuery(e.target.value);
                      setQuickAddOpen(true);
                    }}
                    placeholder="Quick add stock (e.g. TATA, INFY)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-blue-50/40 hover:bg-blue-50/70 focus:bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all shadow-2xs placeholder:text-blue-500/70 text-slate-800"
                  />
                  {quickAddLoading && (
                    <RefreshCw className="w-3 h-3 text-blue-500 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>

            {/* Autocomplete Dropdown */}
            {quickAddOpen && quickAddQuery.trim().length > 0 && (
              <div className="absolute left-0 top-full mt-1.5 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                  <span>Quick Add to List</span>
                  <span className="text-[9px] text-blue-600">5,000+ Universe</span>
                </div>
                {quickAddResults.length === 0 && !quickAddLoading && (
                  <div className="px-3 py-4 text-center text-xs text-slate-400">
                    No matching stocks found for "{quickAddQuery}"
                  </div>
                )}
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                  {quickAddResults.map((s) => {
                    const isAlreadyIn = watchlist.includes(s.symbol);
                    const isPos = (s.change_pct ?? 0) >= 0;
                    return (
                      <div
                        key={s.symbol}
                        className="px-3 py-2 hover:bg-slate-50 flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-800">{s.symbol}</span>
                            <span className="text-[9px] font-medium px-1 rounded bg-slate-100 text-slate-500">
                              {s.exchanges?.[0] || "NSE"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium leading-tight">{s.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-semibold text-slate-800">
                            {(() => {
                              const p = (s.nse_ltp != null && s.nse_ltp > 0) ? s.nse_ltp : (s.bse_ltp != null && s.bse_ltp > 0) ? s.bse_ltp : (s.ltp || 0);
                              return p > 0 ? `₹${Number(p).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
                            })()}
                          </div>
                          <div
                            className={`text-[10px] font-bold ${
                              isPos ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isPos ? "+" : ""}
                            {(s.change_pct ?? 0).toFixed(2)}%
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddStockToWatchlist(s.symbol)}
                          disabled={isAlreadyIn}
                          className={`px-2 py-1 rounded text-[11px] font-bold shrink-0 cursor-pointer transition-all ${
                            isAlreadyIn
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                          }`}
                        >
                          {isAlreadyIn ? "Added" : "+ Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Controls: Count Pill, 1-Click Exchange Cycle Button, Sector Dropdown & Reset */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
          {/* Total Count Pill */}
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs shrink-0 select-none">
            {isWatchlistOnly ? `Watchlist (${totalStocks.toLocaleString()})` : `All (${totalStocks.toLocaleString()})`}
          </span>

          {/* Exchange Dropdown: Both, BSE, NSE */}
          <select
            value={selectedExchange}
            onChange={(e) => {
              setSelectedExchange(e.target.value);
              setSelectedInstrument("ALL");
            }}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-bold focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer shrink-0"
          >
            <option value="ALL">Both</option>
            <option value="BSE">BSE</option>
            <option value="NSE">NSE</option>
          </select>

          {/* Instrument / Series Filter Dropdown */}
          <select
            value={selectedInstrument}
            onChange={(e) => setSelectedInstrument(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer shrink-0"
            title="Filter by Instrument Category"
          >
            {selectedExchange === "NSE" ? (
              <>
                <option value="ALL">All Instruments</option>
                <option value="EQUITY">Equities (EQ)</option>
                <option value="ETF">ETFs & Index Funds</option>
                <option value="SME">SME Emerge (SM)</option>
                <option value="BE">Trade-for-Trade (BE)</option>
              </>
            ) : selectedExchange === "BSE" ? (
              <>
                <option value="ALL">All Instruments</option>
                <option value="A">Group A (Large & Mid Cap)</option>
                <option value="B">Group B (Mid & Small Cap)</option>
                <option value="X">Group X / XT (Small Cap)</option>
                <option value="T">Group T (Trade-for-Trade)</option>
                <option value="ETF">ETFs & Index Funds</option>
              </>
            ) : (
              <>
                <option value="ALL">All Instruments</option>
                <option value="EQUITY">Mainboard Equities</option>
                <option value="ETF">ETFs & Index Funds</option>
                <option value="SME">SME Emerge</option>
                <option value="BE">Trade-for-Trade (BE/T)</option>
              </>
            )}
          </select>

          {/* Sector Dropdown - ONLY SHOWN IF USER ADDS "sector" COLUMN */}
          {selectedColumns.includes("sector") && (
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer shrink-0"
            >
              <option value="ALL">All Sectors</option>
              {sectorOptions.filter((s) => s !== "ALL").map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          )}

          {/* Clear / Reset Filters */}
          {((selectedColumns.includes("sector") && selectedSector !== "ALL") || selectedExchange !== "ALL" || selectedInstrument !== "ALL" || search) && (
            <button
              onClick={() => {
                setSelectedSector("ALL");
                setSelectedExchange("ALL");
                setSelectedInstrument("ALL");
                setSearch("");
              }}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 2. Telemetry Pulse & Performance Strip (Rendered on both Watchlist & Stocks) */}
      {marketPulse && (
        <div className="shrink-0 bg-gradient-to-r from-slate-900 via-[#0e1726] to-[#132238] rounded-xl p-2.5 text-white border border-slate-800/90 shadow-md">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-center">
            {/* Metric 1: Tracked & Average Return */}
            <div className="flex items-center space-x-2.5 px-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                {isWatchlistOnly ? (
                  <Bookmark className="w-4 h-4 text-blue-400 fill-blue-400/30" />
                ) : (
                  <Activity className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {ribbonMoveLabel}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-black tracking-tight">{marketPulse.total.toLocaleString()} Scrips</span>
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
                      marketPulse.avgChange >= 0
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {marketPulse.avgChange >= 0 ? "+" : ""}
                    {marketPulse.avgChange.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Metric 2: Breadth (Advancing vs Declining vs Flat) */}
            <div className="flex items-center space-x-2.5 px-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Market Breadth</div>
                  <span className="inline-flex items-center gap-1 px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 select-none">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    LIVE
                  </span>
                </div>
                <div className={`text-[11px] font-bold text-slate-200 mt-0.5 flex items-center gap-1.5 flex-wrap transition-colors duration-300 ${
                  breadthFlash === "up" ? "text-emerald-300" : breadthFlash === "down" ? "text-rose-300" : ""
                }`}>
                  <span className="text-emerald-400">{marketPulse.advancing.toLocaleString()} Up</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-rose-400">{marketPulse.declining.toLocaleString()} Down</span>
                  {marketPulse.unchanged !== undefined && marketPulse.unchanged > 0 && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">{marketPulse.unchanged.toLocaleString()} Flat</span>
                    </>
                  )}
                </div>
                {/* 3-Way Breadth Bar representing 100% of all slice scrips */}
                <div
                  className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden flex"
                  title={`Market Breadth: ${marketPulse.advancing.toLocaleString()} Up, ${marketPulse.declining.toLocaleString()} Down, ${(marketPulse.unchanged || 0).toLocaleString()} Flat (Total: ${marketPulse.total.toLocaleString()} Scrips)`}
                >
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${marketPulse.total > 0 ? (marketPulse.advancing / marketPulse.total) * 100 : 0}%`
                    }}
                  />
                  {marketPulse.unchanged !== undefined && marketPulse.unchanged > 0 && (
                    <div
                      className="bg-slate-500/50 h-full transition-all duration-500 ease-out"
                      style={{
                        width: `${marketPulse.total > 0 ? (marketPulse.unchanged / marketPulse.total) * 100 : 0}%`
                      }}
                    />
                  )}
                  <div
                    className="bg-rose-500 h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${marketPulse.total > 0 ? (marketPulse.declining / marketPulse.total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Metric 3: Top Performer */}
            {marketPulse.topGainer && (
              <div
                onClick={() => marketPulse.topGainer && onSelectStock(marketPulse.topGainer.symbol)}
                className="flex items-center space-x-2.5 px-2 border-l border-slate-800 cursor-pointer hover:bg-slate-800/40 rounded-lg p-1 transition-colors group"
                title={`Click to view ${marketPulse.topGainer.symbol} (${marketPulse.topGainer.name || ""})`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Performer</div>
                    {marketPulse.leaderRank && marketPulse.leaderRank > 0 && !isWatchlistOnly && (
                      <span className="text-[9px] font-extrabold px-1 rounded bg-amber-400/20 text-amber-300">
                        #{marketPulse.leaderRank}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-bold text-white truncate">{marketPulse.topGainer.symbol}</span>
                    <span className="text-[11px] font-bold text-emerald-400">
                      +{(marketPulse.topGainer.change_pct ?? 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Metric 4: Top Lagging or Column Customizer */}
            <div className="flex items-center justify-between px-2 border-l border-slate-800">
              {marketPulse.topLoser && marketPulse.topLoser.symbol !== marketPulse.topGainer?.symbol ? (
                <div
                  onClick={() => marketPulse.topLoser && onSelectStock(marketPulse.topLoser.symbol)}
                  className="flex items-center space-x-2.5 cursor-pointer hover:bg-slate-800/40 rounded-lg p-1 transition-colors min-w-0 group"
                  title={`Click to view ${marketPulse.topLoser.symbol} (${marketPulse.topLoser.name || ""})`}
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Lagging</div>
                      {marketPulse.leaderRank && marketPulse.leaderRank > 0 && !isWatchlistOnly && (
                        <span className="text-[9px] font-extrabold px-1 rounded bg-rose-400/20 text-rose-300">
                          #{marketPulse.leaderRank}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-bold text-white truncate">{marketPulse.topLoser.symbol}</span>
                      <span className="text-[11px] font-bold text-rose-400">
                        {(marketPulse.topLoser.change_pct ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic px-2">No lagging stocks</div>
              )}
              <button
                onClick={() => setColumnCustomizerOpen(true)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer shrink-0"
                title="Customize Table Columns"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Quick Views Presets Toolbar (Rendered on both Watchlist & Stocks) */}
      <div className="shrink-0 bg-gradient-to-r from-white via-[#f8faff] to-[#edf4fe] rounded-xl p-2.5 border border-blue-200/70 shadow-xs shadow-blue-500/5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Quick Views:</span>
            </span>

            {/* 1. Default Option */}
            <button
              type="button"
              onClick={() => handleSaveColumns([])}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                selectedColumns.length === 0
                  ? "bg-blue-600 text-white border-blue-600 font-bold ring-2 ring-blue-500/20"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
              title="Default: Instrument, NSE (₹), BSE (₹), Spread (%), Change (%) & Volume"
            >
              <span>🌟</span>
              <span>Default</span>
            </button>

            {/* 2. Custom Option (immediately after Default!) */}
            <button
              type="button"
              onClick={() => setColumnCustomizerOpen(true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                selectedColumns.length > 0 &&
                !COLUMN_PRESETS.filter((p) => p.id !== "default").some(
                  (p) =>
                    p.columns.length === selectedColumns.length &&
                    p.columns.every((c) => selectedColumns.includes(c))
                )
                  ? "bg-blue-600 text-white border-blue-600 font-bold ring-2 ring-blue-500/20"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
              title="Customize table columns from 190+ financial & market metrics"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Custom{selectedColumns.length > 0 ? ` (${selectedColumns.length})` : ""}</span>
            </button>

            {/* 3. All other preset options */}
            {COLUMN_PRESETS.filter((p) => p.id !== "default").map((preset) => {
              const isMatch =
                preset.columns.length === selectedColumns.length &&
                preset.columns.every((c) => selectedColumns.includes(c));
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSaveColumns(preset.columns)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                    isMatch
                      ? "bg-blue-600 text-white border-blue-600 font-bold ring-2 ring-blue-500/20"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                  title={preset.description}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>

          {/* Export CSV (if active formula) */}
          {activeScreenerFormula && stocks.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer shrink-0"
              title="Download CSV export of filtered stocks"
            >
              <Download className="w-3 h-3 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {/* Active Formula Filter Banner */}
        {activeScreenerFormula && (
          <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/80 rounded-xl text-xs shadow-2xs">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-6 h-6 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className="font-bold text-blue-900 shrink-0">Active Screener Filter:</span>
                <code className="px-2 py-0.5 rounded bg-white text-blue-700 font-mono text-[11px] border border-blue-200 break-all">
                  {activeScreenerFormula}
                </code>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 shrink-0">
                  {totalStocks.toLocaleString()} qualifying stocks
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0 ml-2">
              <button
                onClick={() => setScreenerModalOpen(true)}
                className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
              >
                Edit Formula
              </button>
              <button
                onClick={() => {
                  setActiveScreenerFormula(null);
                  setScreenerMetricsUsed([]);
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. DEFAULT TABLE VIEW (No Card View Option) */}
      <div
        ref={tableContainerRef}
        onScroll={handleContainerScroll}
        className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-auto relative"
      >
        <table suppressHydrationWarning className="w-full text-left text-xs border-collapse min-w-max">
          {/* Table Header is Sticky at Top */}
          <thead className="bg-slate-50/95 backdrop-blur-md border-b border-slate-200/90 text-slate-600 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-20 shadow-xs">
            <tr>
              {/* 1. Core: Instrument (Sticky Left) */}
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-3.5 cursor-pointer select-none hover:bg-slate-100/90 transition-colors group sticky left-0 bg-slate-50/95 backdrop-blur-md z-30 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.06)] border-r border-slate-200/80 whitespace-nowrap min-w-[260px]"
              >
                <div className="flex items-center justify-between">
                  <span className={sortBy === "name" ? "text-blue-600 font-bold" : ""}>Instrument</span>
                  {renderSortIcon("name", true)}
                </div>
              </th>

              {/* 2. Core: NSE (₹) - Hidden if BSE Only */}
              {isNseVisible && (
                <th
                  onClick={() => handleSort("nse_ltp")}
                  className={`py-3 px-3 text-right whitespace-nowrap cursor-pointer select-none hover:bg-slate-100/90 transition-colors group min-w-[110px] border-r border-slate-100/80 ${
                    sortBy === "nse_ltp" ? "bg-blue-50/70 text-blue-700" : ""
                  }`}
                >
                  <div className="flex items-center justify-end">
                    <span>NSE (₹)</span>
                    {renderSortIcon("nse_ltp")}
                  </div>
                </th>
              )}

              {/* 3. Core: BSE (₹) - Hidden if NSE Only */}
              {isBseVisible && (
                <th
                  onClick={() => handleSort("bse_ltp")}
                  className={`py-3 px-3 text-right whitespace-nowrap cursor-pointer select-none hover:bg-slate-100/90 transition-colors group min-w-[110px] border-r border-slate-100/80 ${
                    sortBy === "bse_ltp" ? "bg-blue-50/70 text-blue-700" : ""
                  }`}
                >
                  <div className="flex items-center justify-end">
                    <span>BSE (₹)</span>
                    {renderSortIcon("bse_ltp")}
                  </div>
                </th>
              )}

              {/* 4. Core: Spread (%) - Shown only in Dual View (All Exchanges) */}
              {isSpreadVisible && (
                <th
                  onClick={() => handleSort("price_diff_pct")}
                  className={`py-3 px-3 text-right whitespace-nowrap cursor-pointer select-none hover:bg-slate-100/90 transition-colors group min-w-[105px] border-r border-slate-100/80 ${
                    sortBy === "price_diff_pct" ? "bg-blue-50/70 text-blue-700" : ""
                  }`}
                >
                  <div className="flex items-center justify-end">
                    <span>Spread (%)</span>
                    {renderSortIcon("price_diff_pct")}
                  </div>
                </th>
              )}

              {/* 5. Core: Change (%) */}
              <th
                onClick={() => handleSort("change_pct")}
                className={`py-3 px-3 text-right whitespace-nowrap cursor-pointer select-none hover:bg-slate-100/90 transition-colors group min-w-[105px] border-r border-slate-100/80 ${
                  sortBy === "change_pct" ? "bg-blue-50/70 text-blue-700" : ""
                }`}
              >
                <div className="flex items-center justify-end">
                  <span>Change (%)</span>
                  {renderSortIcon("change_pct")}
                </div>
              </th>

              {/* 6. Core: Volume */}
              <th
                onClick={() => handleSort("volume")}
                className={`py-3 px-3 text-right whitespace-nowrap cursor-pointer select-none hover:bg-slate-100/90 transition-colors group min-w-[110px] border-r border-slate-100/80 ${
                  sortBy === "volume" ? "bg-blue-50/70 text-blue-700" : ""
                }`}
              >
                <div className="flex items-center justify-end">
                  <span>Volume</span>
                  {renderSortIcon("volume")}
                </div>
              </th>

              {/* Dynamic User-Selected Columns (from 190+ catalog) */}
              {activeCustomColumnDefs.map((col) => {
                const isSorted = sortBy === col.key;
                const isWideText = col.key === "sector" || col.format === "text";
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    title={col.description || col.header}
                    className={`py-3 px-3.5 whitespace-nowrap cursor-pointer select-none hover:bg-slate-100/90 transition-colors group ${
                      isWideText ? "min-w-[220px]" : "min-w-[120px]"
                    } border-r border-slate-100/80 ${
                      isSorted ? "bg-blue-50/70 text-blue-700" : ""
                    } ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                  >
                    <div className={`flex items-center gap-1 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}`}>
                      <span className={isSorted ? "text-blue-600 font-bold" : ""}>
                        {col.shortHeader || col.header}
                      </span>
                      {renderSortIcon(col.key)}
                    </div>
                  </th>
                );
              })}

              {/* Actions (Sticky Right) */}
              <th className="py-3 px-3 text-right whitespace-nowrap sticky right-0 bg-slate-50/95 backdrop-blur-md z-20 min-w-[105px] border-l border-slate-200/80 shadow-[-4px_0_12px_-2px_rgba(0,0,0,0.05)]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium">
            {stocks.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={totalRenderedCols}
                  className="py-16 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-xs">
                      <Bookmark className="w-6 h-6 fill-amber-400/30 text-amber-500" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-sm font-bold text-slate-800">
                        {isWatchlistOnly
                          ? search
                            ? `No stocks found matching "${search}" in this watchlist`
                            : `${activeWatchlistGroup?.name || "Watchlist"} is empty`
                          : "No stocks found matching the selected criteria."}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {isWatchlistOnly
                          ? search
                            ? "Try searching for a different stock or clear your filter."
                            : "Use '+ Quick add stock' above to add scrips, or load curated institutional strategies."
                          : "Try adjusting your exchange, instrument, or search query."}
                      </p>
                    </div>
                    {isWatchlistOnly && !search && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => setStarterBasketsModalOpen(true)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
                          <span>Explore Starter Baskets & Strategies</span>
                        </button>
                        {onNavigateToStocks && (
                          <button
                            onClick={onNavigateToStocks}
                            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                          >
                            Browse All Stocks →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              stocks.map((stock: any) => {
                const isPos = (stock.change_pct ?? 0) >= 0;
                const isWatchlisted = watchlist.includes(stock.symbol);

                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="hover:bg-blue-50/40 even:bg-slate-50/25 transition-colors group cursor-pointer border-b border-slate-100"
                  >
                    {/* 1. Core: Instrument (Sticky Left) */}
                    <td className="py-2.5 px-3.5 sticky left-0 bg-white group-hover:bg-slate-50/95 transition-colors z-10 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.06)] border-r border-slate-200/80 whitespace-nowrap min-w-[260px]">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs tracking-tight">
                            {stock.symbol}
                          </span>
                          {selectedExchange === "BSE" ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200/80 shrink-0">
                              BSE
                            </span>
                          ) : selectedExchange === "NSE" ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-800 font-bold border border-indigo-200/80 shrink-0">
                              NSE
                            </span>
                          ) : stock.is_dual_listed ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shrink-0">
                              NSE+BSE
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium shrink-0">
                              {stock.exchanges?.[0] || "NSE"}
                            </span>
                          )}
                          {/* Instrument / Series Badge */}
                          {stock.is_etf ? (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200/80 shrink-0">
                              ETF
                            </span>
                          ) : stock.nse_series === "SM" || stock.series === "SM" ? (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 shrink-0">
                              SME
                            </span>
                          ) : stock.nse_series === "BE" || stock.series === "BE" || stock.bse_series === "T" ? (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200/80 shrink-0">
                              BE/TFT
                            </span>
                          ) : selectedExchange === "BSE" && stock.bse_series ? (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-sky-50 text-sky-700 font-semibold border border-sky-200/80 shrink-0">
                              Grp {stock.bse_series}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 whitespace-normal leading-tight">
                          {stock.name || stock.symbol}
                        </p>
                      </div>
                    </td>

                    {/* 2. Core: NSE (₹) - Hidden if BSE Only */}
                    {isNseVisible && (
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap font-bold min-w-[110px] border-r border-slate-100/60 text-xs">
                        {stock.nse_ltp != null ? (
                          <span className={`px-1.5 py-0.5 rounded transition-all duration-300 ${
                            rowFlash[stock.symbol] === "up"
                              ? "bg-emerald-500/20 text-emerald-700 font-bold ring-1 ring-emerald-500/50"
                              : rowFlash[stock.symbol] === "down"
                              ? "bg-rose-500/20 text-rose-700 font-bold ring-1 ring-rose-500/50"
                              : "text-slate-900"
                          }`}>
                            ₹{Number(stock.nse_ltp).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">NA</span>
                        )}
                      </td>
                    )}

                    {/* 3. Core: BSE (₹) - Hidden if NSE Only */}
                    {isBseVisible && (
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap font-semibold min-w-[110px] border-r border-slate-100/60 text-xs">
                        {stock.bse_ltp != null ? (
                          <span className={`px-1.5 py-0.5 rounded transition-all duration-300 ${
                            rowFlash[stock.symbol] === "up"
                              ? "bg-emerald-500/20 text-emerald-700 font-bold ring-1 ring-emerald-500/50"
                              : rowFlash[stock.symbol] === "down"
                              ? "bg-rose-500/20 text-rose-700 font-bold ring-1 ring-rose-500/50"
                              : "text-slate-700"
                          }`}>
                            ₹{Number(stock.bse_ltp).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">NA</span>
                        )}
                      </td>
                    )}

                    {/* 4. Core: Spread (%) - Shown only in Dual View */}
                    {isSpreadVisible && (
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap min-w-[105px] border-r border-slate-100/60 text-xs font-bold">
                        {stock.is_dual_listed && stock.price_diff_pct != null && stock.price_diff_pct > 0 ? (
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                            +{Number(stock.price_diff_pct).toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">0.00%</span>
                        )}
                      </td>
                    )}

                    {/* 5. Core: Change (%) */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap min-w-[105px] border-r border-slate-100/60">
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        isPos
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                          : "bg-rose-50 text-rose-700 border border-rose-200/70"
                      }`}>
                        {isPos ? "▲ +" : "▼ "}{stock.change_pct != null ? Number(stock.change_pct).toFixed(2) : "0.00"}%
                      </span>
                    </td>

                    {/* 6. Core: Volume */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap min-w-[110px] border-r border-slate-100/60 text-xs font-semibold text-slate-700">
                      {formatVolume(stock.volume || 0)}
                    </td>

                    {/* Dynamic User-Selected Metric Cells */}
                    {activeCustomColumnDefs.map((col) => {
                      const cell = formatColumnCell(stock[col.key], col.format);
                      const isWideText = col.key === "sector" || col.format === "text";
                      return (
                        <td
                          key={col.key}
                          className={`py-2.5 px-3.5 whitespace-nowrap text-xs ${
                            isWideText ? "min-w-[220px]" : "min-w-[120px]"
                          } border-r border-slate-100/60 ${
                            col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                          } ${cell.className || "text-slate-700 font-medium"}`}
                        >
                          {cell.text}
                        </td>
                      );
                    })}

                    {/* Actions (Sticky Right) */}
                    <td
                      className="py-2.5 px-3 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50/95 z-10 border-l border-slate-200/60 shadow-[-4px_0_12px_-2px_rgba(0,0,0,0.05)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end space-x-1">
                        {/* 1. Set Trigger */}
                        <button
                          onClick={() => onOpenTriggerModal(stock.symbol)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title={`Create Trigger on ${stock.symbol}`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                        {/* 2. View Chart */}
                        <button
                          onClick={() => onSelectStock(stock.symbol)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View Chart"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {/* 3. 5th Requirement: Watchlist Toggle */}
                        <button
                          onClick={(e) => toggleWatchlist(stock.symbol, e)}
                          className={`p-1 rounded-lg transition-colors cursor-pointer ${
                            isWatchlisted
                              ? "text-amber-500 hover:text-amber-600 bg-amber-50 hover:bg-amber-100"
                              : "text-slate-400 hover:text-amber-500 hover:bg-amber-50/50"
                          }`}
                          title={isWatchlisted ? `Remove ${stock.symbol} from Watchlist` : `Add ${stock.symbol} to Watchlist`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isWatchlisted ? "fill-amber-500 text-amber-500" : ""}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Infinite Scroll Sentinel */}
        <div ref={observerTarget} className="py-3 border-t border-slate-100 flex items-center justify-center text-xs text-slate-400">
          {loadingMore ? (
            <div className="flex items-center space-x-2 text-blue-600 font-medium py-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Loading more Dalal Street stocks...</span>
            </div>
          ) : hasMore ? (
            <span className="text-slate-400">Scroll down to view more ({stocks.length} of {totalStocks.toLocaleString()} loaded)</span>
          ) : (
            <span className="text-slate-500 font-medium">✓ All {totalStocks.toLocaleString()} companies loaded</span>
          )}
        </div>

        {/* Subtle Floating Scroll-To-Top Button */}
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className={`fixed bottom-6 right-8 z-40 bg-white/95 backdrop-blur-sm border border-slate-200/90 text-slate-600 hover:text-blue-600 hover:border-blue-300 px-3 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-1.5 text-xs font-semibold group cursor-pointer ${
            showScrollTop
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-3 pointer-events-none"
          }`}
          title="Scroll to Top"
        >
          <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform text-slate-500 group-hover:text-blue-600" />
          <span className="text-[11px] text-slate-600 group-hover:text-blue-600">Top</span>
        </button>
      </div>
        </>
      )}

      {/* Advanced Screener & Formula Filter Modal */}
      <AdvancedScreenerModal
        isOpen={screenerModalOpen}
        onClose={() => {
          setScreenerModalOpen(false);
          setScreenerModalFormula("");
        }}
        initialFormula={screenerModalFormula || activeScreenerFormula || ""}
        totalStocks={totalStocks}
        onApplyToUniverse={(form) => {
          setActiveScreenerFormula(form);
        }}
        onSelectStock={(sym) => {
          onSelectStock(sym);
          setScreenerModalOpen(false);
        }}
      />

      {/* Dynamic Table Column Customizer Modal */}
      <ColumnCustomizerModal
        isOpen={columnCustomizerOpen}
        onClose={() => setColumnCustomizerOpen(false)}
        selectedColumns={selectedColumns}
        onChangeColumns={handleSaveColumns}
        onResetDefaults={handleResetDefaultColumns}
      />

      {/* Interactive Strategy Scanner & Stock Picker Modal */}
      <StrategyScannerModal
        isOpen={!!scannerModalStrategy}
        onClose={() => setScannerModalStrategy(null)}
        strategy={scannerModalStrategy}
        activeWatchlistName={activeWatchlistGroup?.name || "Watchlist"}
        currentWatchlistSymbols={activeWatchlistGroup ? activeWatchlistGroup.symbols : watchlist}
        onAddStocksToWatchlist={handleAddStocksFromScanner}
        onInspectInScreener={(query) => {
          setScannerModalStrategy(null);
          setScreenerModalFormula(query);
          setScreenerModalOpen(true);
        }}
      />

      {/* Institutional Starter Baskets & Screener Strategies Modal (44 Total Options) */}
      {starterBasketsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 md:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 md:px-6 md:py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/40">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm md:text-base font-black text-slate-900">
                      Institutional Watchlist Baskets & Screener Strategies
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                      44 Options
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    1-click instant population to <strong className="text-slate-800">{activeWatchlistGroup?.name || "Watchlist"}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStarterBasketsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="p-3 md:px-6 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: "ALL", label: "All", count: 44 },
                  { id: "Curated Baskets", label: "Curated Baskets", count: 6 },
                  { id: "Quality & Moats", label: "Quality & Moats", count: PRESET_STRATEGIES.filter((s) => s.category === "Quality & Moats").length },
                  { id: "Growth & Multibaggers", label: "Growth", count: PRESET_STRATEGIES.filter((s) => s.category === "Growth & Multibaggers").length },
                  { id: "Deep Value & Safety", label: "Deep Value", count: PRESET_STRATEGIES.filter((s) => s.category === "Deep Value & Safety").length },
                  { id: "Capital Cycle & Capex", label: "Capital Cycle", count: PRESET_STRATEGIES.filter((s) => s.category === "Capital Cycle & Capex").length },
                  { id: "Smart Money & Inflows", label: "Smart Money", count: PRESET_STRATEGIES.filter((s) => s.category === "Smart Money & Inflows").length },
                  { id: "Forensic & Solvency", label: "Forensic", count: PRESET_STRATEGIES.filter((s) => s.category === "Forensic & Solvency").length },
                  { id: "Technical & Momentum", label: "Technical", count: PRESET_STRATEGIES.filter((s) => s.category === "Technical & Momentum").length }
                ].map((tab) => {
                  const isSelected = modalBasketCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setModalBasketCategory(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer border flex items-center gap-1.5 shadow-2xs ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? "bg-white/20 text-white" : "bg-white text-slate-500 border border-slate-200"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Search inside Modal */}
              <div className="relative w-full md:w-64 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={modalBasketSearch}
                  onChange={(e) => setModalBasketSearch(e.target.value)}
                  placeholder="Filter 44 options..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700 placeholder:text-slate-400 transition-colors"
                />
                {modalBasketSearch && (
                  <button
                    onClick={() => setModalBasketSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body: Scrollable Grid */}
            <div className="p-4 md:p-6 overflow-y-auto max-h-[68vh] bg-slate-50/50 space-y-6">
              {/* No results notice */}
              {modalFilteredBaskets.length === 0 && modalFilteredStrategies.length === 0 && (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <p className="text-sm font-semibold text-slate-600 mb-2">
                    No baskets or strategies match "{modalBasketSearch}" in {modalBasketCategory}
                  </p>
                  <button
                    onClick={() => {
                      setModalBasketSearch("");
                      setModalBasketCategory("ALL");
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-xs"
                  >
                    Reset Filters
                  </button>
                </div>
              )}

              {/* SECTION A: Curated Starter Baskets (6) */}
              {modalFilteredBaskets.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Curated Starter Baskets ({modalFilteredBaskets.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {modalFilteredBaskets.map((basket) => {
                      const theme = getCategoryTheme(basket.category);
                      const isLoading = loadingStrategyId === basket.id;
                      return (
                        <div
                          key={basket.id}
                          className={`p-4 rounded-xl border bg-gradient-to-br ${theme.bg} ${theme.border} flex flex-col justify-between transition-all duration-200 hover:shadow-md group`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base shrink-0 leading-none flex items-center justify-center select-none">{basket.icon}</span>
                                <h5 className="text-xs font-black text-slate-900 leading-snug">
                                  {basket.name}
                                </h5>
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${theme.badgeBg}`}>
                                {basket.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                              {basket.desc}
                            </p>
                            {/* Monospace Formula snippet */}
                            <div className="mb-3.5 px-2.5 py-1.5 rounded bg-white/90 border border-slate-200/80 text-[10px] font-mono text-slate-700 shadow-2xs leading-normal">
                              <span className="font-bold text-slate-400 select-none mr-1.5">FORMULA:</span>
                              <span className="text-slate-800 break-words">{basket.query}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                            <button
                              onClick={() => {
                                setStarterBasketsModalOpen(false);
                                setScannerModalStrategy(basket);
                              }}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs bg-white text-slate-800 border border-slate-200/80 ${theme.btnHover}`}
                              title={`Scan qualifying stocks and pick top 5/10/20/50/all based on Market Cap, Volume, etc.`}
                            >
                              <Search className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>Scan & Select</span>
                            </button>
                            <button
                              onClick={() => handleAddScreenerStrategy(basket, "all")}
                              disabled={!!loadingStrategyId}
                              className="py-1.5 px-2 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                              title={`Instantly add all matching stocks to ${activeWatchlistGroup?.name || "Watchlist"}`}
                            >
                              {loadingStrategyId === `${basket.id}-all` ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Adding...</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                                  <span>+ Add All</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setStarterBasketsModalOpen(false);
                                handleInspectStrategyInScreener(basket);
                              }}
                              className="py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                              title="Inspect and test query in Advanced Screener Studio"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Inspect</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION B: Institutional Screener Strategies (38) */}
              {modalFilteredStrategies.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Institutional Screener Strategies ({modalFilteredStrategies.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {modalFilteredStrategies.map((strat) => {
                      const theme = getCategoryTheme(strat.category);
                      return (
                        <div
                          key={strat.id}
                          className={`p-4 rounded-xl border bg-gradient-to-br ${theme.bg} ${theme.border} transition-all duration-200 hover:shadow-md flex flex-col justify-between group`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base shrink-0 leading-none flex items-center justify-center select-none">{theme.icon}</span>
                                <h5 className="text-xs font-black text-slate-900 leading-snug">
                                  {strat.name}
                                </h5>
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${theme.badgeBg}`}>
                                {strat.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                              {strat.desc}
                            </p>
                            {/* Monospace Formula snippet */}
                            <div className="mb-3.5 px-2.5 py-1.5 rounded bg-white/90 border border-slate-200/80 text-[10px] font-mono text-slate-700 shadow-2xs leading-normal">
                              <span className="font-bold text-slate-400 select-none mr-1.5">FORMULA:</span>
                              <span className="text-slate-800 break-words">{strat.query}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                            <button
                              onClick={() => {
                                setStarterBasketsModalOpen(false);
                                setScannerModalStrategy(strat);
                              }}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs bg-white text-slate-800 border border-slate-200/80 ${theme.btnHover}`}
                              title={`Scan qualifying stocks and pick top 5/10/20/50/all based on Market Cap, Volume, etc.`}
                            >
                              <Search className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>Scan & Select</span>
                            </button>
                            <button
                              onClick={() => handleAddScreenerStrategy(strat, "all")}
                              disabled={!!loadingStrategyId}
                              className="py-1.5 px-2 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                              title={`Scan universe and add all matching stocks to ${activeWatchlistGroup?.name || "Watchlist"}`}
                            >
                              {loadingStrategyId === `${strat.id}-all` ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Adding...</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                                  <span>+ Add All</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setStarterBasketsModalOpen(false);
                                handleInspectStrategyInScreener(strat);
                              }}
                              className="py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                              title="Inspect formula in Advanced Screener Studio"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Inspect</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs font-semibold flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
