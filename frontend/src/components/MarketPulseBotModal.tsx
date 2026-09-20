"use client";

import React from "react";
import {
  X,
  Clock,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Bot,
  Activity,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  Calendar
} from "lucide-react";
import { MarketPulse, TrendStockChip } from "@/types";

interface MarketPulseBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  pulses: MarketPulse[];
  dateStr?: string;
  todayStr?: string;
  availableDates?: string[];
  onSelectDate?: (date: string) => void;
  isMarketOpen?: boolean;
  marketStatus?: string;
  onSelectStock?: (symbol: string) => void;
}

export const MarketPulseBotModal: React.FC<MarketPulseBotModalProps> = ({
  isOpen,
  onClose,
  pulses,
  dateStr = "Today",
  todayStr = "Today",
  availableDates = [],
  onSelectDate,
  isMarketOpen = false,
  marketStatus = "Market Closed",
  onSelectStock,
}) => {
  if (!isOpen) return null;

  const latestPulse = pulses.length > 0 ? pulses[0] : null;
  const bullishCount = pulses.filter((p) => p.sentiment === "BULLISH").length;
  const bearishCount = pulses.filter((p) => p.sentiment === "BEARISH").length;
  const neutralCount = pulses.filter((p) => p.sentiment === "NEUTRAL").length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 text-white h-full shadow-2xl overflow-y-auto flex flex-col border-l border-slate-800 animate-in slide-in-from-right duration-300">
        {/* 1. Header with Live Badge & Date Selector Dropdown */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30 shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  Apex Market Pulse Bot
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                  isMarketOpen
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
                  {isMarketOpen ? "Live Real-Time" : "Last Close / Armed"}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                30-Minute Market Narrative • Session: {dateStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Day Selector Dropdown */}
            {availableDates.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700/80 shadow-xs transition-colors">
                <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <select
                  value={dateStr}
                  onChange={(e) => onSelectDate?.(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white font-medium">
                      {d === todayStr ? `${d} (Today)` : `${d} (Session)`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Close Bot Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {pulses.length === 0 ? (
          /* Empty / Armed State (e.g. today before market open) */
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400 shadow-inner">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-base font-black text-white tracking-tight mb-2">
              {isMarketOpen ? "Awaiting First 30-Minute Pulse (09:30 AM IST)" : "Trading Session Opens at 09:15 AM IST"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6 font-medium">
              {isMarketOpen
                ? "Dalal Street is currently active. The first 30-minute market pulse for today will be recorded at 09:30 AM IST based on real-time exchange ticks."
                : `Dalal Street is currently closed (${marketStatus}). The session for ${dateStr} has not commenced yet. Live 30-minute pulses will start recording at 09:30 AM IST.`}
            </p>

            {availableDates.length > 1 && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 max-w-sm text-left shadow-lg">
                <div className="text-[11.5px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Review Previous Completed Session</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3 leading-snug">
                  Inspect the full 13-slot chronological pulse journey from the last completed trading session.
                </p>
                <button
                  onClick={() => onSelectDate?.(availableDates.find(d => d !== todayStr) || availableDates[0])}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>View Session for {availableDates.find(d => d !== todayStr) || "Previous Day"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 2. Session Analytics Ribbon */}
            <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/50 border-b border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                  Session Pulse Overview • {dateStr}
                </span>
                <span className="font-mono text-blue-400 font-bold bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 text-[11px]">
                  {pulses.length} Half-Hour Sessions Logged
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-2.5 shadow-sm">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Bullish Waves</div>
                  <div className="text-lg font-black text-emerald-300 mt-0.5">{bullishCount}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Buying Dominance</div>
                </div>

                <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-2.5 shadow-sm">
                  <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Rangebound</div>
                  <div className="text-lg font-black text-amber-300 mt-0.5">{neutralCount}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Equilibrium / Rest</div>
                </div>

                <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-2.5 shadow-sm">
                  <div className="text-[10px] uppercase tracking-wider text-rose-400 font-bold">Selling Waves</div>
                  <div className="text-lg font-black text-rose-300 mt-0.5">{bearishCount}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Profit Booking</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed font-medium bg-white/5 rounded-xl p-2.5 border border-white/5">
                💡 <strong>How the Bot Works:</strong> Every 30 minutes from 09:15 AM to 03:30 PM IST, our engine scans 5,092 NSE &amp; BSE stocks, tracks sector rotation, and generates a plain-English story of who is buying, who is selling, and which sectors are leading.
              </p>
            </div>

            {/* 3. Chronological 30-Minute Timeline Feed */}
            <div className="p-5 space-y-6 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  Chronological Market Journey (Latest First)
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">09:15 AM ➔ 03:30 PM IST</span>
              </div>

              <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 pl-6">
                {pulses.map((pulse, idx) => {
                  const isBull = pulse.sentiment === "BULLISH";
                  const isBear = pulse.sentiment === "BEARISH";
                  const dotColor = isBull
                    ? "bg-emerald-500 ring-4 ring-emerald-500/20"
                    : isBear
                    ? "bg-rose-500 ring-4 ring-rose-500/20"
                    : "bg-amber-500 ring-4 ring-amber-500/20";

                  const badgeColor = isBull
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : isBear
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30";

                  return (
                    <div key={pulse.id || idx} className="relative group">
                      {/* Timeline Glowing Node */}
                      <span
                        className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full ${dotColor} transition-transform group-hover:scale-125`}
                      />

                      {/* Card Container */}
                      <div className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-md space-y-3">
                        {/* Top Row: Time Slot, Sentiment Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black font-mono text-white bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-blue-400" />
                              {pulse.slot_time}
                            </span>
                            {idx === 0 && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500 text-white uppercase tracking-wider">
                                Latest
                              </span>
                            )}
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider ${badgeColor}`}>
                            {pulse.badge_label}
                          </span>
                        </div>

                        {/* Headline */}
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          {pulse.headline}
                        </h4>

                        {/* Plain Language Story */}
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          {pulse.story}
                        </p>

                        {/* Sector Rotation Highlights Strip */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-slate-400 text-[10px]">Leader:</span>
                            <span className="text-emerald-300 font-bold truncate">
                              {pulse.leading_sector || "Selective Leaders"}
                            </span>
                          </div>

                          <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                            <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="text-slate-400 text-[10px]">Laggard:</span>
                            <span className="text-rose-300 font-bold truncate">
                              {pulse.lagging_sector || "Secondary Sectors"}
                            </span>
                          </div>
                        </div>

                        {/* Breadth Mini Bar */}
                        <div className="space-y-1 pt-1 border-t border-slate-900">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                            <span className="text-emerald-400">🟢 {pulse.advances} Advancing</span>
                            <span className="text-slate-500">{pulse.unchanged} Flat</span>
                            <span className="text-rose-400">🔴 {pulse.declines} Declining</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full transition-all"
                              style={{
                                width: `${(pulse.advances / Math.max(1, pulse.advances + pulse.declines)) * 100}%`,
                              }}
                            />
                            <div
                              className="bg-rose-500 h-full transition-all"
                              style={{
                                width: `${(pulse.declines / Math.max(1, pulse.advances + pulse.declines)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Top Movers Chips (Clickable) */}
                        {pulse.top_gainers && pulse.top_gainers.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
                              Movers:
                            </span>
                            {pulse.top_gainers.map((chip, cIdx) => (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() => onSelectStock && onSelectStock(chip.symbol)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 border border-white/10 text-[10.5px] font-mono text-slate-200 transition-colors cursor-pointer"
                              >
                                <span>{chip.symbol}</span>
                                <span className="text-emerald-400 font-bold">
                                  +{chip.change_pct}%
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* 4. Sticky Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between sticky bottom-0 z-20">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>100% System Calculated • Zero Manual Bias</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
          >
            Close Timeline
          </button>
        </div>
      </div>
    </div>
  );
};
