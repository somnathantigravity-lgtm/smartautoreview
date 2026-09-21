"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle2,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronDown,
  Zap
} from "lucide-react";
import { PresetStrategy } from "@/constants/presetStrategies";
import { evaluateScreenerQuery, getWebSocketUrl } from "@/services/api";

interface StrategyScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: PresetStrategy | null;
  activeWatchlistName: string;
  currentWatchlistSymbols: string[];
  onAddStocksToWatchlist: (symbols: string[], strategyName: string) => void;
  onInspectInScreener: (query: string) => void;
}

type SortField = "market_cap" | "volume" | "change_pct" | "roe" | "roce" | "pe";

const SORT_OPTIONS: { id: SortField; label: string; icon: string }[] = [
  { id: "market_cap", label: "Market Cap", icon: "🏢" },
  { id: "volume", label: "Volume & Liquidity", icon: "📊" },
  { id: "change_pct", label: "Today's Change %", icon: "🚀" },
  { id: "roe", label: "ROE %", icon: "📈" },
  { id: "roce", label: "RoCE %", icon: "⚡" },
  { id: "pe", label: "P/E Valuation", icon: "🏷️" },
];

export const StrategyScannerModal: React.FC<StrategyScannerModalProps> = ({
  isOpen,
  onClose,
  strategy,
  activeWatchlistName,
  currentWatchlistSymbols,
  onAddStocksToWatchlist,
  onInspectInScreener,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<SortField>("market_cap");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(new Set());
  const [rowFlash, setRowFlash] = useState<Record<string, "up" | "down">>({});

  const wsRef = useRef<WebSocket | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());

  const currentSymbolsSet = useMemo(
    () => new Set(currentWatchlistSymbols.map((s) => s.toUpperCase())),
    [currentWatchlistSymbols]
  );

  // Fetch stocks matching strategy whenever modal opens or strategy changes
  useEffect(() => {
    if (!isOpen || !strategy) return;
    let isMounted = true;
    setLoading(true);
    setError(null);
    setSearchFilter("");

    evaluateScreenerQuery(strategy.query, 1, 500, sortBy, sortDir)
      .then((res) => {
        if (!isMounted) return;
        const matched = res?.stocks || [];
        setStocks(matched);
        // By default, pre-select the top 10 stocks (or all if < 10)
        const initialPick = new Set<string>();
        matched.slice(0, Math.min(10, matched.length)).forEach((s: any) => {
          if (s.symbol) initialPick.add(s.symbol);
        });
        setSelectedSymbols(initialPick);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Strategy scanner error:", err);
        setError(err.message || "Failed to scan universe for this strategy");
        setStocks([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, strategy]);

  // Real-Time WebSocket Listener to follow the Stocks tab in real time
  useEffect(() => {
    if (!isOpen) return;

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
          if (!isMounted) return;
          subscribedSymbolsRef.current.clear();
          if (stocks.length > 0) {
            const syms = stocks.map((s: any) => s.symbol).filter(Boolean);
            syms.forEach((sym: string) => subscribedSymbolsRef.current.add(sym));
            ws?.send(
              JSON.stringify({
                action: "SUBSCRIBE_UNIVERSE",
                symbols: syms,
              })
            );
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "STOCK_TICK" && data.symbol) {
              setStocks((prev) =>
                prev.map((item) => {
                  if (item.symbol !== data.symbol) return item;

                  const oldLtp = item.nse_ltp ?? item.bse_ltp ?? item.ltp ?? 0;
                  const nse = data.nse_ltp !== undefined ? data.nse_ltp : item.nse_ltp;
                  const bse = data.bse_ltp !== undefined ? data.bse_ltp : item.bse_ltp;
                  const newLtp = nse ?? bse ?? (data.ltp ?? oldLtp);

                  const hasPriceChanged =
                    (oldLtp > 0 && newLtp !== oldLtp) ||
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

                  return {
                    ...item,
                    ltp: data.ltp ?? item.ltp,
                    current_price: newLtp,
                    nse_ltp: nse,
                    bse_ltp: bse,
                    change: data.change ?? item.change,
                    change_pct: data.change_pct !== undefined ? data.change_pct : item.change_pct,
                    volume: data.volume || item.volume,
                    day_high: data.day_high || item.day_high,
                    day_low: data.day_low || item.day_low,
                    updated_at: data.updated_at || Date.now() / 1000,
                  };
                })
              );
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

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
      wsRef.current = null;
    };
  }, [isOpen]);

  // Subscribe newly loaded stocks to WebSocket
  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const newSymbols = stocks
      .map((s: any) => s.symbol)
      .filter((sym: string) => sym && !subscribedSymbolsRef.current.has(sym));

    if (newSymbols.length > 0) {
      newSymbols.forEach((s: string) => subscribedSymbolsRef.current.add(s));
      wsRef.current.send(
        JSON.stringify({
          action: "SUBSCRIBE_UNIVERSE",
          symbols: newSymbols,
        })
      );
    }
  }, [stocks]);

  // Sort and filter stocks
  const sortedStocks = useMemo(() => {
    let list = [...stocks];
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(
        (s) =>
          (s.symbol && s.symbol.toLowerCase().includes(q)) ||
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.sector && s.sector.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (valA === undefined || valA === null) valA = sortDir === "desc" ? -Infinity : Infinity;
      if (valB === undefined || valB === null) valB = sortDir === "desc" ? -Infinity : Infinity;

      if (typeof valA === "string") {
        return sortDir === "desc"
          ? valB.toString().localeCompare(valA.toString())
          : valA.toString().localeCompare(valB.toString());
      }
      return sortDir === "desc" ? Number(valB) - Number(valA) : Number(valA) - Number(valB);
    });

    return list;
  }, [stocks, sortBy, sortDir, searchFilter]);

  // Helper to quickly select top N based on current sort
  const handleQuickSelect = (count: number | "all" | "none") => {
    if (count === "none") {
      setSelectedSymbols(new Set());
      return;
    }
    const nextSet = new Set<string>();
    const targetList = sortedStocks;
    const limit = count === "all" ? targetList.length : Math.min(count, targetList.length);
    for (let i = 0; i < limit; i++) {
      if (targetList[i]?.symbol) {
        nextSet.add(targetList[i].symbol);
      }
    }
    setSelectedSymbols(nextSet);
  };

  const handleToggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  };

  const handleAddSelected = () => {
    if (selectedSymbols.size === 0 || !strategy) return;
    const toAdd = Array.from(selectedSymbols);
    onAddStocksToWatchlist(toAdd, strategy.name);
    onClose();
  };

  const handleAddAll = () => {
    if (stocks.length === 0 || !strategy) return;
    const allSyms = stocks.map((s) => s.symbol).filter(Boolean);
    onAddStocksToWatchlist(allSyms, strategy.name);
    onClose();
  };

  if (!isOpen || !strategy) return null;

  const totalMatches = stocks.length;
  const selectedCount = selectedSymbols.size;
  const newStocksCount = Array.from(selectedSymbols).filter((s) => !currentSymbolsSet.has(s)).length;

  const formatMarketCap = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return "—";
    if (val >= 1000) {
      return `₹${Math.round(val).toLocaleString("en-IN")} Cr`;
    }
    return `₹${val.toFixed(1)} Cr`;
  };

  const formatVolume = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return "—";
    if (val >= 10000000) {
      return `${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `${(val / 100000).toFixed(2)} L`;
    }
    return val.toLocaleString("en-IN");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl xl:max-w-6xl max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                {(strategy as any).icon || "⚡"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    {strategy.name}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                    {strategy.badge || strategy.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-normal">{strategy.desc}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Strategy formula pill & real-time feed indicator */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs max-w-2xl overflow-x-auto">
              <span className="text-slate-400 font-bold select-none shrink-0">FORMULA:</span>
              <span className="text-slate-800 font-semibold">{strategy.query}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Real-time sync badge identical to Stocks tab */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md shadow-2xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Real-Time Dalal Street Live</span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-blue-50/70 border border-blue-200/60 px-2.5 py-1 rounded-md shrink-0">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Target:</span>
                <strong className="text-blue-900 font-bold">{activeWatchlistName}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS TOOLBAR: Sort Options & Quick Select Presets */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-white flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Sort Metric Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                Sort By:
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {SORT_OPTIONS.map((opt) => {
                  const isActive = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (isActive) {
                          setSortDir((d) => (d === "desc" ? "asc" : "desc"));
                        } else {
                          setSortBy(opt.id);
                          setSortDir(opt.id === "pe" ? "asc" : "desc");
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                        isActive
                          ? "bg-blue-600 text-white shadow-blue-200"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                      }`}
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                      {isActive && (
                        <span className="text-[10px] ml-0.5 opacity-90">
                          {sortDir === "desc" ? "↓" : "↑"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick in-modal Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter results..."
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick Select Buttons: Top 5, 10, 20, 50, All */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider mr-1">
                Quick Select:
              </span>
              {[5, 10, 20, 50].map((num) => {
                if (totalMatches < num && num > 10) return null;
                return (
                  <button
                    key={num}
                    onClick={() => handleQuickSelect(num)}
                    className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200/80 text-slate-700 transition-all cursor-pointer"
                  >
                    Top {num}
                  </button>
                );
              })}
              <button
                onClick={() => handleQuickSelect("all")}
                className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200/80 text-slate-700 transition-all cursor-pointer"
              >
                All ({totalMatches})
              </button>
              <button
                onClick={() => handleQuickSelect("none")}
                className="px-2 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="text-[11px] font-semibold text-slate-500">
              Matches: <span className="text-slate-900 font-bold">{totalMatches}</span> stocks | Selected:{" "}
              <span className="text-blue-600 font-bold">{selectedCount}</span>
            </div>
          </div>
        </div>

        {/* RESULTS TABLE / LIST */}
        <div className="flex-1 overflow-y-auto min-h-[260px] max-h-[50vh] p-2 sm:p-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs font-semibold text-slate-600">
                Scanning 5,092 Indian equities with strategy formula...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-xs font-bold text-rose-600 mb-2">Error running screener scan</p>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          ) : sortedStocks.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No equities found matching this strategy criteria.
            </div>
          ) : (
            <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                  <tr>
                    <th className="p-2.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedCount > 0 && selectedCount === sortedStocks.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleQuickSelect("all");
                          } else {
                            handleQuickSelect("none");
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-2.5">Company & Sector</th>
                    <th className="p-2.5 text-right">LTP (₹)</th>
                    <th className="p-2.5 text-right">Day %</th>
                    <th className="p-2.5 text-right">
                      {SORT_OPTIONS.find((o) => o.id === sortBy)?.label || "Metric"}
                    </th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {sortedStocks.map((stock, idx) => {
                    const isSelected = selectedSymbols.has(stock.symbol);
                    const isInWatchlist = currentSymbolsSet.has(stock.symbol);

                    // Strict real-time price prioritization mirroring Stocks tab
                    const displayPrice =
                      stock.nse_ltp != null && stock.nse_ltp > 0
                        ? stock.nse_ltp
                        : stock.bse_ltp != null && stock.bse_ltp > 0
                        ? stock.bse_ltp
                        : (stock.ltp ?? stock.current_price ?? 0);

                    const changePct = stock.change_pct != null ? Number(stock.change_pct) : 0;
                    const isPos = changePct >= 0;
                    const flash = rowFlash[stock.symbol];

                    let metricDisplay = "—";
                    if (sortBy === "market_cap") metricDisplay = formatMarketCap(stock.market_cap);
                    else if (sortBy === "volume") metricDisplay = formatVolume(stock.volume);
                    else if (sortBy === "change_pct") metricDisplay = `${isPos ? "+" : ""}${changePct.toFixed(2)}%`;
                    else if (sortBy === "roe") metricDisplay = stock.roe != null ? `${stock.roe.toFixed(1)}%` : "—";
                    else if (sortBy === "roce") metricDisplay = stock.roce != null ? `${stock.roce.toFixed(1)}%` : "—";
                    else if (sortBy === "pe") metricDisplay = stock.pe != null ? `${stock.pe.toFixed(1)}x` : "—";

                    return (
                      <tr
                        key={stock.symbol || idx}
                        onClick={() => handleToggleSymbol(stock.symbol)}
                        className={`transition-colors cursor-pointer hover:bg-blue-50/50 ${
                          isSelected ? "bg-blue-50/30" : ""
                        }`}
                      >
                        <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSymbol(stock.symbol)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{stock.symbol}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200 shrink-0">
                              {stock.bse_ltp && stock.nse_ltp ? "NSE+BSE" : "NSE"}
                            </span>
                            <span className="text-slate-500 text-[11px] truncate max-w-[150px] sm:max-w-[220px]">
                              {stock.name || stock.company_name}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{stock.sector || "General"}</div>
                        </td>

                        {/* Real-time LTP with dynamic flash ring mirroring Stocks tab */}
                        <td className="p-2.5 text-right font-mono tabular-nums whitespace-nowrap text-xs font-bold">
                          {displayPrice > 0 ? (
                            <span
                              className={`px-1.5 py-0.5 rounded transition-all duration-300 ${
                                flash === "up"
                                  ? "bg-emerald-500/20 text-emerald-700 font-bold ring-1 ring-emerald-500/50"
                                  : flash === "down"
                                  ? "bg-rose-500/20 text-rose-700 font-bold ring-1 ring-rose-500/50"
                                  : "text-slate-900"
                              }`}
                            >
                              ₹{Number(displayPrice).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">—</span>
                          )}
                        </td>

                        {/* Day Change % with matching pill badges */}
                        <td className="p-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isPos
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                                : "bg-rose-50 text-rose-700 border border-rose-200/70"
                            }`}
                          >
                            {isPos ? "▲ +" : "▼ "}{Math.abs(changePct).toFixed(2)}%
                          </span>
                        </td>

                        <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                          {metricDisplay}
                        </td>

                        <td className="p-2.5 text-center">
                          {isInWatchlist ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              In List
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600">
              Selected: <strong className="text-slate-900">{selectedCount}</strong> stocks
              {newStocksCount < selectedCount && (
                <span className="text-slate-400 text-[11px] ml-1">
                  ({selectedCount - newStocksCount} already in watchlist)
                </span>
              )}
            </span>
            <button
              onClick={() => {
                onClose();
                onInspectInScreener(strategy.query);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 ml-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Inspect in Screener Studio
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {totalMatches > selectedCount && (
              <button
                onClick={handleAddAll}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                title={`Add all ${totalMatches} matching stocks to ${activeWatchlistName}`}
              >
                + Add All ({totalMatches})
              </button>
            )}

            <button
              onClick={handleAddSelected}
              disabled={selectedCount === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                selectedCount > 0
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                Add {selectedCount} Selected to {activeWatchlistName}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
