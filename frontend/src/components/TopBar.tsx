"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Menu,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  User,
  LogOut,
  Radio
} from "lucide-react";
import { fetchMarketIndices } from "@/services/api";
import { MarketIndex, TickerMover, AuthUser } from "@/types";

interface TopBarProps {
  activeTab: string;
  isMarketOpen: boolean;
  onToggleMobileMenu: () => void;
  authUser: AuthUser | null;
  onLogout: () => void;
  onOpenAuthModal: () => void;
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

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  isMarketOpen: initialMarketOpen,
  onToggleMobileMenu,
  authUser,
  onLogout,
  onOpenAuthModal,
  onSelectStock
}) => {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [topGainers, setTopGainers] = useState<TickerMover[]>(DEFAULT_TOP_GAINERS);
  const [topLosers, setTopLosers] = useState<TickerMover[]>(DEFAULT_TOP_LOSERS);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(initialMarketOpen);
  const [lastTradingDatetime, setLastTradingDatetime] = useState<string>("");

  const prevPricesRef = useRef<Record<string, number>>({});
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down">>({});

  const applyTickerUpdate = useCallback((res: any) => {
    if (!res) return;
    const newFlash: Record<string, "up" | "down"> = {};
    let hasFlash = false;

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

    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;
    let isMounted = true;

    const connectWs = () => {
      if (!isMounted) return;
      try {
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = window.location.hostname || "localhost";
        const wsUrl = `${wsProtocol}//${wsHost}:8000/ws/terminal`;
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
    const interval = setInterval(loadIndices, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
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
              {idx.change >= 0 ? "+" : ""}
              {idx.change.toFixed(2)} ({idx.change_pct >= 0 ? "+" : ""}
              {idx.change_pct.toFixed(2)}%)
            </span>
          </div>
        );
      })}

      <span className="text-slate-700 font-semibold select-none">|</span>

      {/* Top Gainers */}
      <div className="flex items-center space-x-4">
        <span className="text-emerald-400 font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          GAINERS
        </span>
        {topGainers.map((g) => {
          const flash = flashMap[g.symbol];
          return (
            <div
              key={g.symbol}
              onClick={() => onSelectStock && onSelectStock(g.symbol)}
              className="flex items-center space-x-1.5 text-[11px] whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
              title={`View ${g.name || g.symbol}`}
            >
              <span className="text-slate-200 font-bold hover:text-blue-400">{g.symbol}</span>
              <span
                className={`tabular-nums transition-colors duration-300 px-0.5 rounded ${
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

      {/* Top Losers */}
      <div className="flex items-center space-x-4">
        <span className="text-rose-400 font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          LOSERS
        </span>
        {topLosers.map((l) => {
          const flash = flashMap[l.symbol];
          return (
            <div
              key={l.symbol}
              onClick={() => onSelectStock && onSelectStock(l.symbol)}
              className="flex items-center space-x-1.5 text-[11px] whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
              title={`View ${l.name || l.symbol}`}
            >
              <span className="text-slate-200 font-bold hover:text-blue-400">{l.symbol}</span>
              <span
                className={`tabular-nums transition-colors duration-300 px-0.5 rounded ${
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

  return (
    <div className="sticky top-0 z-30 w-full flex flex-col bg-slate-950 text-white select-none shadow-md">
      {/* 1. Mobile Header Bar (Only visible on small devices) */}
      <div className="flex md:hidden items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="font-black text-sm text-white">APEX</span>
            <span className="font-bold text-xs text-blue-400">EQUITIES</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {authUser ? (
            <div className="flex items-center gap-1 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="max-w-[100px] truncate">{authUser.email}</span>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* 2. Full-Width Financial Ticker Strip */}
      <div className="flex items-center text-xs h-9 overflow-hidden relative">
        {/* Left Live Badge */}
        <div className="hidden md:flex items-center gap-2 px-3.5 h-full bg-slate-900/90 border-r border-slate-800/80 shrink-0 z-20 text-[11px] font-bold text-slate-200">
          {isMarketOpen ? (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.9)]"></span>
              </span>
              <span className="tracking-wider text-emerald-400 font-extrabold flex items-center gap-1">
                LIVE <span className="text-[10px] text-slate-400 font-medium">• BSE/NSE</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"></span>
              <span className="tracking-wide text-amber-200/95 font-mono text-[10px]">
                DALAL STREET • LAST CLOSE: {lastTradingDatetime || "10.09.2026 15:30 IST"}
              </span>
            </div>
          )}
        </div>

        {/* Continuous Horizontal Ticker Scroll Area */}
        <div
          className="flex-1 overflow-x-auto no-scrollbar py-1 cursor-grab active:cursor-grabbing"
          title="Scroll or hover anywhere to pause"
        >
          <div className="animate-ticker flex items-center space-x-6 px-4">
            {renderTickerTrack()}
            {renderTickerTrack()}
          </div>
        </div>

        {/* Right Market Status Indicator */}
        <div
          className="hidden lg:flex items-center space-x-2 px-4 h-full bg-slate-900/90 border-l border-slate-800/80 shrink-0 text-[11px] font-semibold text-slate-300 z-20"
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
    </div>
  );
};
