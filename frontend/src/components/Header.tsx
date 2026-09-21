"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Settings as SettingsIcon,
  Menu,
  X,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  User,
  LogOut,
  Sparkles,
  Bookmark,
  Flame,
  Bot,
  Newspaper
} from "lucide-react";
import { fetchMarketIndices, getWebSocketUrl } from "@/services/api";
import { MarketIndex, TickerMover, AuthUser } from "@/types";
import { AuthModal } from "@/components/AuthModal";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectStock?: (symbol: string) => void;
}

const DEFAULT_TOP_GAINERS: TickerMover[] = [
  { symbol: "RADHIKAJWE", name: "Radhika Jeweltech", ltp: 83.16, change: 11.60, change_pct: 16.23, volume: 1450000 },
  { symbol: "JISLJALEQS", name: "Jain Irrigation Systems", ltp: 30.87, change: 2.58, change_pct: 9.12, volume: 29500000 },
  { symbol: "TATASTEEL", name: "Tata Steel", ltp: 188.79, change: 4.59, change_pct: 2.49, volume: 36500000 },
  { symbol: "RELIANCE", name: "Reliance Industries", ltp: 1322.00, change: 17.90, change_pct: 1.37, volume: 13000000 },
  { symbol: "HDFCBANK", name: "HDFC Bank", ltp: 712.10, change: 3.75, change_pct: 0.53, volume: 14500000 }
];

const DEFAULT_TOP_LOSERS: TickerMover[] = [
  { symbol: "SUZLON", name: "Suzlon Energy", ltp: 45.35, change: -0.76, change_pct: -1.65, volume: 55400000 },
  { symbol: "IDFCFIRSTB", name: "IDFC First Bank", ltp: 86.71, change: -1.10, change_pct: -1.25, volume: 15300000 },
  { symbol: "ETERNAL", name: "Eternal", ltp: 322.75, change: -2.55, change_pct: -0.78, volume: 17800000 },
  { symbol: "CANBK", name: "Canara Bank", ltp: 125.50, change: -0.80, change_pct: -0.63, volume: 12100000 },
  { symbol: "KOTAKBANK", name: "Kotak Bank", ltp: 424.50, change: -1.35, change_pct: -0.32, volume: 940000 }
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onSelectStock
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [topGainers, setTopGainers] = useState<TickerMover[]>(DEFAULT_TOP_GAINERS);
  const [topLosers, setTopLosers] = useState<TickerMover[]>(DEFAULT_TOP_LOSERS);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);
  const [lastTradingDatetime, setLastTradingDatetime] = useState<string>("");
  const [marketStatusLabel, setMarketStatusLabel] = useState<string>("Market Closed");

  // Track previous prices to trigger subtle real-time tick flashes
  const prevPricesRef = useRef<Record<string, number>>({});
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down">>({});

  const checkAuth = () => {
    try {
      const stored = localStorage.getItem("apex_user");
      setAuthUser(stored ? JSON.parse(stored) : null);
    } catch {
      setAuthUser(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("apex_user");
    setAuthUser(null);
    window.dispatchEvent(new Event("storage"));
  };

  const applyTickerUpdate = useCallback((res: any) => {
    if (!res) return;
    const newFlash: Record<string, "up" | "down"> = {};
    let hasFlash = false;

    // Detect price movement for benchmark indices
    if (res.indices && res.indices.length > 0) {
      res.indices.forEach((idx: MarketIndex) => {
        const prev = prevPricesRef.current[idx.symbol];
        if (prev !== undefined && prev !== idx.value) {
          newFlash[idx.symbol] = idx.value > prev ? "up" : "down";
          hasFlash = true;
        }
        prevPricesRef.current[idx.symbol] = idx.value;
      });
      setIndices(res.indices);
    }

    // Detect price movement for top gainers
    if (res.top_gainers && res.top_gainers.length > 0) {
      res.top_gainers.forEach((g: TickerMover) => {
        const prev = prevPricesRef.current[g.symbol];
        if (prev !== undefined && prev !== g.ltp) {
          newFlash[g.symbol] = g.ltp > prev ? "up" : "down";
          hasFlash = true;
        }
        prevPricesRef.current[g.symbol] = g.ltp;
      });
      setTopGainers(res.top_gainers);
    }

    // Detect price movement for top losers
    if (res.top_losers && res.top_losers.length > 0) {
      res.top_losers.forEach((l: TickerMover) => {
        const prev = prevPricesRef.current[l.symbol];
        if (prev !== undefined && prev !== l.ltp) {
          newFlash[l.symbol] = l.ltp > prev ? "up" : "down";
          hasFlash = true;
        }
        prevPricesRef.current[l.symbol] = l.ltp;
      });
      setTopLosers(res.top_losers);
    }

    if (res.is_market_open !== undefined) setIsMarketOpen(!!res.is_market_open);
    if (res.last_trading_datetime_str) setLastTradingDatetime(res.last_trading_datetime_str);
    if (res.status_label) setMarketStatusLabel(res.status_label);

    if (hasFlash) {
      setFlashMap(newFlash);
      setTimeout(() => setFlashMap({}), 450);
    }
  }, []);

  const loadIndices = useCallback(() => {
    fetchMarketIndices()
      .then((res: any) => {
        applyTickerUpdate(res);
      })
      .catch((err) => console.debug("Indices fetch poll:", err));
  }, [applyTickerUpdate]);

  useEffect(() => {
    loadIndices();
    checkAuth();
    window.addEventListener("storage", checkAuth);

    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;
    let isMounted = true;

    const connectWs = () => {
      if (!isMounted) return;
      try {
        const wsUrl = getWebSocketUrl("/ws/terminal");
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "MARKET_PULSE") {
              applyTickerUpdate(data);
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

    // Fallback polling every 5s if WebSocket is quiet
    const interval = setInterval(loadIndices, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
      window.removeEventListener("storage", checkAuth);
    };
  }, [applyTickerUpdate, loadIndices]);

  const renderTickerTrack = () => (
    <div className="flex items-center space-x-6 shrink-0">
      {/* Benchmark Indices */}
      {indices.map((idx) => {
        const isPos = idx.change_pct >= 0;
        const flash = flashMap[idx.symbol];
        return (
          <div key={idx.symbol} className="flex items-center space-x-2 text-[11px] whitespace-nowrap">
            <span className="text-slate-400 font-bold uppercase tracking-wider">{idx.symbol}</span>
            <span
              className={`font-bold tabular-nums px-1 rounded transition-all duration-300 ${
                flash === "up"
                  ? "bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50"
                  : flash === "down"
                  ? "bg-rose-500/30 text-rose-300 ring-1 ring-rose-500/50"
                  : "text-white"
              }`}
            >
              ₹{idx.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span
              className={`inline-flex items-center font-bold font-mono text-[10px] px-1.5 py-0.5 rounded ${
                isPos
                  ? "text-emerald-400 bg-emerald-950/80 border border-emerald-700/50"
                  : "text-rose-400 bg-rose-950/80 border border-rose-700/50"
              }`}
            >
              {isPos ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
              {isPos ? "+" : ""}
              {idx.change_pct.toFixed(2)}%
            </span>
          </div>
        );
      })}

      <span className="text-slate-700 font-semibold select-none">|</span>

      {/* Top 5 Gainers */}
      <div className="flex items-center space-x-3 text-[11px] whitespace-nowrap">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-950/90 border border-emerald-600/60 text-emerald-400 shadow-2xs">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          Top Gainers
        </span>
        {topGainers.map((g) => {
          const flash = flashMap[g.symbol];
          return (
            <div
              key={g.symbol}
              onClick={() => onSelectStock?.(g.symbol)}
              className="flex items-center space-x-1.5 cursor-pointer hover:bg-slate-850 px-2 py-0.5 rounded transition-colors group/item"
              title={`View ${g.name || g.symbol} chart`}
            >
              <span className="font-bold text-slate-200 group-hover/item:text-emerald-300 transition-colors">
                {g.symbol}
              </span>
              <span
                className={`font-semibold tabular-nums px-1 rounded transition-all duration-300 ${
                  flash === "up"
                    ? "bg-emerald-500/30 text-emerald-300 font-bold ring-1 ring-emerald-500/50"
                    : flash === "down"
                    ? "bg-rose-500/30 text-rose-300 font-bold ring-1 ring-rose-500/50"
                    : "text-slate-400"
                }`}
              >
                ₹{g.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span className="font-bold text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-700/40 px-1 py-0.5 rounded">
                +{g.change_pct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      <span className="text-slate-700 font-semibold select-none">|</span>

      {/* Top 5 Losers */}
      <div className="flex items-center space-x-3 text-[11px] whitespace-nowrap">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-950/90 border border-rose-600/60 text-rose-400 shadow-2xs">
          <TrendingDown className="w-3 h-3 text-rose-400" />
          Top Losers
        </span>
        {topLosers.map((l) => {
          const flash = flashMap[l.symbol];
          return (
            <div
              key={l.symbol}
              onClick={() => onSelectStock?.(l.symbol)}
              className="flex items-center space-x-1.5 cursor-pointer hover:bg-slate-850 px-2 py-0.5 rounded transition-colors group/item"
              title={`View ${l.name || l.symbol} chart`}
            >
              <span className="font-bold text-slate-200 group-hover/item:text-rose-300 transition-colors">
                {l.symbol}
              </span>
              <span
                className={`font-semibold tabular-nums px-1 rounded transition-all duration-300 ${
                  flash === "up"
                    ? "bg-emerald-500/30 text-emerald-300 font-bold ring-1 ring-emerald-500/50"
                    : flash === "down"
                    ? "bg-rose-500/30 text-rose-300 font-bold ring-1 ring-rose-500/50"
                    : "text-slate-400"
                }`}
              >
                ₹{l.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span className="font-bold text-[10px] font-mono text-rose-400 bg-rose-950/70 border border-rose-700/40 px-1 py-0.5 rounded">
                {l.change_pct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      <span className="text-slate-700 font-semibold select-none">|</span>
    </div>
  );

  const navItems = [
    { id: "recommendations", label: "Recommendations", icon: Sparkles },
    { id: "universe", label: "Stocks", icon: Layers },
    { id: "watchlist", label: "My Watchlist", icon: Bookmark },
    { id: "trends", label: "Trends", icon: Flame },
    { id: "news", label: "Live News", icon: Newspaper },
    // { id: "bots", label: "Bot Studio", icon: Bot }, // Commented out temporarily
    { id: "chart", label: "Chart & Rules", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 font-sans shadow-xs">
      {/* 1. Ticker Slider (Only visible on advanced terminal views, hidden on clean recommendation view) */}
      {activeTab !== "recommendations" && (
      <div className="bg-slate-950 border-b border-slate-800 text-white text-xs flex items-center shadow-md relative z-30 ticker-wrapper select-none">
        {/* Fixed Left Live / Closed Session Badge */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-slate-900 border-r border-slate-800/80 shrink-0 z-20 text-[11px] font-bold text-slate-200">
          {isMarketOpen ? (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.9)]"></span>
              </span>
              <span className="tracking-wider text-emerald-400 font-extrabold flex items-center gap-1">
                LIVE FETCH <span className="text-[10px] text-slate-400 font-medium">• NSE/BSE</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"></span>
              <span className="tracking-wide text-amber-200/95 font-mono">
                DALAL STREET • LAST CLOSE: {lastTradingDatetime || "04.09.2026 15:30 IST"}
              </span>
            </div>
          )}
        </div>

        {/* Continuous Horizontal Ticker Scroll Area (Pauses on Hover / Interaction) */}
        <div
          className="flex-1 overflow-x-auto no-scrollbar py-2 cursor-grab active:cursor-grabbing"
          title="Scroll or hover anywhere to pause"
        >
          <div className="animate-ticker flex items-center space-x-6 px-4">
            {renderTickerTrack()}
            {renderTickerTrack()}
          </div>
        </div>

        {/* Fixed Right Market Status Badge */}
        <div
          className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-slate-900 border-l border-slate-800/80 shrink-0 text-[11px] font-semibold text-slate-300 z-20"
          title={isMarketOpen ? "Indian Market is actively trading (09:15 - 15:30 IST)" : `Market is closed. Showing official closing prices from ${lastTradingDatetime || "15:30 IST"}`}
        >
          {isMarketOpen ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
              <span className="text-emerald-300 font-bold">Market Live</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]"></span>
              <span className="text-amber-300/90 font-medium">Market Closed</span>
            </>
          )}
        </div>
      </div>
      )}

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Terminal Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("universe")}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm tracking-tight text-slate-900">APEX</span>
                <span className="font-bold text-xs text-blue-600 tracking-wider">EQUITIES</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none">Dalal Street Market Terminal</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: User Account / Sign In */}
          <div className="flex items-center space-x-2">
            {authUser ? (
              <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="max-w-[120px] truncate">{authUser.email}</span>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-0.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3-Step Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setAuthUser(user);
          window.dispatchEvent(new Event("storage"));
        }}
      />

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-2 space-y-1 shadow-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
