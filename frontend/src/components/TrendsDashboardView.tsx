"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart3,
  Rocket,
  Waves,
  LineChart,
  PieChart,
  RefreshCw,
  Clock,
  Bot,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { fetchTrends, fetchTrendsPulses } from "@/services/api";
import { TrendMetricCardData, TrendsApiResponse, MarketPulse } from "@/types";
import { TrendsMetricCard } from "@/components/TrendsMetricCard";
import { MarketPulseBotModal } from "@/components/MarketPulseBotModal";

interface TrendsDashboardViewProps {
  onSelectStock: (symbol: string) => void;
}

interface TabOption {
  id: string;
  label: string;
  icon: React.ElementType;
}

const TABS: TabOption[] = [
  { id: "breadth", label: "Breadth", icon: BarChart3 },
  { id: "price_action", label: "Price Action", icon: Rocket },
  { id: "volume", label: "Volume & Flow", icon: Waves },
  { id: "technicals", label: "Technicals", icon: LineChart },
  { id: "sectors", label: "Sectors", icon: PieChart }
];

export const TrendsDashboardView: React.FC<TrendsDashboardViewProps> = ({ onSelectStock }) => {
  const [activeTab, setActiveTab] = useState<string>("breadth");
  const [exchange, setExchange] = useState<string>("ALL");
  const [cards, setCards] = useState<TrendMetricCardData[]>([]);
  const [totalTracked, setTotalTracked] = useState<number>(5092);
  const [intervalLabel, setIntervalLabel] = useState<string>("14:30 IST");
  const [marketSummary30m, setMarketSummary30m] = useState<string>(
    "Dalal Street breadth indicates selective consolidation; large-caps defend intraday VWAP support while liquid leaders absorb supply."
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [isBotOpen, setIsBotOpen] = useState<boolean>(false);
  const [todayPulses, setTodayPulses] = useState<MarketPulse[]>([]);
  const [latestPulse, setLatestPulse] = useState<MarketPulse | null>(null);
  const latestPulseRef = useRef<MarketPulse | null>(null);
  const [pulseDateStr, setPulseDateStr] = useState<string>("Today");
  const [todayStr, setTodayStr] = useState<string>("Today");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);
  const [marketStatus, setMarketStatus] = useState<string>("Market Closed");
  const [lastTickTime, setLastTickTime] = useState<string>("Live");

  // Fetch 30-minute pulses history with optional date selection
  const loadPulses = useCallback(async (targetDate?: string) => {
    try {
      const res = await fetchTrendsPulses(targetDate);
      if (res) {
        if (res.pulses) {
          setTodayPulses(res.pulses);
        }
        if (res.latest) {
          latestPulseRef.current = res.latest;
          setLatestPulse(res.latest);
          setIntervalLabel(res.latest.slot_time);
          setMarketSummary30m(res.latest.story || res.latest.headline);
        }
        if (res.date_str) setPulseDateStr(res.date_str);
        if (res.today_str) setTodayStr(res.today_str);
        if (res.available_dates) setAvailableDates(res.available_dates);
        if (res.is_market_open !== undefined) setIsMarketOpen(res.is_market_open);
        if (res.market_status) setMarketStatus(res.market_status);
      }
    } catch (err) {
      console.debug("Failed to load trends pulses:", err);
    }
  }, []);

  // Fetch live trends data from backend (depends strictly on activeTab and exchange)
  const loadTrends = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const data: TrendsApiResponse = await fetchTrends(activeTab, exchange);
      if (data && data.cards) {
        setCards(data.cards);
        if (data.total_tracked) {
          setTotalTracked(data.total_tracked);
        }
        if (data.interval_label && !latestPulseRef.current) {
          setIntervalLabel(data.interval_label);
        }
        if (data.market_summary_30m && !latestPulseRef.current) {
          setMarketSummary30m(data.market_summary_30m);
        }
        const now = new Date();
        setLastTickTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch (err) {
      console.error("Failed to load trends data:", err);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) {
        setTimeout(() => setIsRefreshing(false), 250);
      }
    }
  }, [activeTab, exchange]);

  // Initial tab / exchange change: show loader only if cards are empty
  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  // Load pulses on mount and every 60s
  useEffect(() => {
    loadPulses();
    const interval = setInterval(() => {
      loadPulses();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadPulses]);

  // Polling every 4 seconds to sync with live market moves without thrashing
  useEffect(() => {
    const interval = setInterval(() => {
      loadTrends(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [loadTrends]);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden select-none">
      {/* 1. SINGLE-LINE HEADER: Sub-tabs + Filter Options in 1 Line */}
      <div className="shrink-0 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/80 px-2.5 py-1.5 mb-1.5 shadow-2xs flex items-center justify-between gap-2">
        {/* Left: Compact Sub-tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs shadow-blue-500/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Exchange Filter, Real-time Scrips Beacon & Refresh */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Exchange Filter Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/70 text-[11px] font-bold">
            <button
              onClick={() => setExchange("ALL")}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                exchange === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setExchange("NSE")}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                exchange === "NSE"
                  ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              NSE
            </button>
            <button
              onClick={() => setExchange("BSE")}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                exchange === "BSE"
                  ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              BSE
            </button>
          </div>

          {/* Real-time Dynamic Data Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/70 text-[10.5px] font-bold text-emerald-800" title={`Last live tick received at: ${lastTickTime}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">LIVE</span>
            <span className="font-mono text-emerald-950 font-extrabold">
              {totalTracked.toLocaleString()} Equities
            </span>
            <span className="text-[10px] text-emerald-600/80 font-mono hidden md:inline">• {lastTickTime}</span>
          </div>

          {/* Quick Refresh Icon */}
          <button
            onClick={() => {
              loadTrends(true);
              loadPulses();
            }}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Refresh trends feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. BLACK COLOR RIBBON: Strictly 1 Single Latest Pulse + View All Pulses Button */}
      <div className="shrink-0 bg-slate-950 text-white rounded-xl px-3 py-1.5 mb-2 border border-slate-800/90 shadow-sm flex items-center gap-3 text-xs overflow-hidden relative ticker-wrapper select-none">
        {/* Fixed Left Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10.5px] font-black uppercase tracking-wider shrink-0 z-20 bg-slate-950 shadow-md">
          <Clock className="w-3 h-3 text-blue-400" />
          <span>{latestPulse ? latestPulse.slot_time : intervalLabel}</span>
        </div>

        {/* Continuous Horizontal Rolling Text Track: Strictly 1 Single Latest Pulse */}
        <div className="overflow-hidden flex-1 relative flex items-center py-0.5">
          <div className="animate-ticker flex items-center shrink-0 space-x-12">
            <span className="text-[12px] text-slate-100 font-semibold tracking-wide whitespace-nowrap flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {latestPulse?.badge_label || "Active Pulse"}
              </span>
              <span>{latestPulse ? `${latestPulse.headline} — ${latestPulse.story}` : marketSummary30m}</span>
            </span>
            <span className="text-slate-600 font-extrabold select-none">•</span>
            <span className="text-[12px] text-slate-100 font-semibold tracking-wide whitespace-nowrap flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {latestPulse?.badge_label || "Active Pulse"}
              </span>
              <span>{latestPulse ? `${latestPulse.headline} — ${latestPulse.story}` : marketSummary30m}</span>
            </span>
            <span className="text-slate-600 font-extrabold select-none">•</span>
          </div>
        </div>

        {/* Attractive Market Pulse Bot Button */}
        <button
          type="button"
          onClick={() => setIsBotOpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-black shadow-md shadow-blue-500/25 transition-all cursor-pointer z-20 border border-blue-400/40 group active:scale-95"
          title="Open Apex Market Pulse Bot to view full chronological session timeline"
        >
          <Bot className="w-3.5 h-3.5 text-blue-200 group-hover:rotate-12 transition-transform" />
          <span>View All Pulses ({todayPulses.length > 0 ? `${todayPulses.length} Logged` : `${availableDates.length} Sessions`})</span>
          <ChevronRight className="w-3.5 h-3.5 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 3. RESPONSIVE 3×4 GRID (12 Metric Cards, Traffic Signals, 1 Single Page) */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {loading && cards.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-6 md:grid-rows-3 gap-2 h-full">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/80 rounded-xl border border-slate-200/60 p-2.5 animate-pulse flex flex-col justify-between"
              >
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-slate-200 rounded w-20"></div>
                  <div className="h-3.5 bg-slate-200 rounded w-12"></div>
                </div>
                <div className="my-1.5">
                  <div className="h-5 bg-slate-200 rounded w-16 mb-1"></div>
                  <div className="h-1.5 bg-slate-200 rounded w-full"></div>
                </div>
                <div className="h-3.5 bg-slate-100 rounded w-28"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-6 md:grid-rows-3 gap-2 h-full">
            {cards.map((card) => (
              <TrendsMetricCard
                key={card.id}
                card={card}
                onSelectStock={onSelectStock}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. CHRONOLOGICAL APEX MARKET PULSE BOT SLIDE-OUT TIMELINE */}
      <MarketPulseBotModal
        isOpen={isBotOpen}
        onClose={() => setIsBotOpen(false)}
        pulses={todayPulses}
        dateStr={pulseDateStr}
        todayStr={todayStr}
        availableDates={availableDates}
        onSelectDate={(newDate) => {
          setPulseDateStr(newDate);
          loadPulses(newDate);
        }}
        isMarketOpen={isMarketOpen}
        marketStatus={marketStatus}
        onSelectStock={onSelectStock}
      />
    </div>
  );
};
