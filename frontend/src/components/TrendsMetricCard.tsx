"use client";

import React, { useState, useEffect, useRef } from "react";
import { TrendMetricCardData } from "@/types";

interface TrendsMetricCardProps {
  card: TrendMetricCardData;
  onSelectStock?: (symbol: string) => void;
}

export const TrendsMetricCard: React.FC<TrendsMetricCardProps> = ({ card, onSelectStock }) => {
  // Live update flash effect
  const [isFlashing, setIsFlashing] = useState(false);
  const prevValRef = useRef(card.hero_val);

  useEffect(() => {
    if (prevValRef.current !== undefined && prevValRef.current !== card.hero_val) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 750);
      prevValRef.current = card.hero_val;
      return () => clearTimeout(timer);
    }
    prevValRef.current = card.hero_val;
  }, [card.hero_val]);

  // Traffic Signal Resolution: strictly green, orange, or red
  const sig = card.signal || (card.badge_type === "bullish" ? "green" : card.badge_type === "bearish" ? "red" : "orange");
  const isGreen = sig === "green";
  const isRed = sig === "red";
  const isOrange = sig === "orange";

  // Subtle pastel background tint & tinted borders for each traffic signal state
  const containerClasses = isGreen
    ? "bg-[#edf8f1] hover:bg-[#e6f5ec] border-emerald-300/80 hover:border-emerald-500 shadow-[0_2px_10px_rgba(16,185,129,0.06)] hover:shadow-md"
    : isRed
    ? "bg-[#fdf0f2] hover:bg-[#fae8eb] border-rose-300/80 hover:border-rose-500 shadow-[0_2px_10px_rgba(244,63,94,0.06)] hover:shadow-md"
    : "bg-[#fef9ec] hover:bg-[#fcf5e2] border-amber-300/80 hover:border-amber-500 shadow-[0_2px_10px_rgba(245,158,11,0.06)] hover:shadow-md";

  const dotClasses = isGreen
    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.95)] ring-2 ring-emerald-300/80"
    : isRed
    ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.95)] ring-2 ring-rose-300/80"
    : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.95)] ring-2 ring-amber-300/80";

  const badgeClasses = isGreen
    ? "bg-emerald-200/80 text-emerald-900 border-emerald-400/80 font-black"
    : isRed
    ? "bg-rose-200/80 text-rose-900 border-rose-400/80 font-black"
    : "bg-amber-200/80 text-amber-900 border-amber-400/80 font-black";

  const heroColor = isGreen
    ? "text-emerald-800"
    : isRed
    ? "text-rose-800"
    : "text-amber-800";

  const progressGradient = isGreen
    ? "from-emerald-500 to-teal-400"
    : isRed
    ? "from-rose-500 to-red-600"
    : "from-amber-500 to-orange-400";

  return (
    <div
      className={`rounded-xl border transition-colors duration-300 p-2.5 sm:p-3 flex flex-col justify-between overflow-hidden ${containerClasses} ${
        isFlashing ? "ring-2 ring-blue-400" : ""
      }`}
    >
      {/* 1. Header: Traffic Signal Beacon + Short Title + Status Badge */}
      <div className="flex items-center justify-between gap-1.5 min-w-0 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClasses} animate-pulse`} />
          <h4 className="text-[12px] sm:text-[12.5px] font-extrabold text-slate-900 truncate tracking-tight">
            {card.title}
          </h4>
        </div>
        <span
          className={`px-1.5 py-0.5 rounded text-[8.5px] uppercase tracking-wider border shrink-0 ${badgeClasses}`}
        >
          {card.badge}
        </span>
      </div>

      {/* 2. Hero Metric & Live Sub-stat (Prominent & High-density) */}
      <div className="my-1.5 shrink-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className={`text-2xl sm:text-[26px] font-black font-mono tracking-tight leading-none transition-all duration-200 ${heroColor} ${
            isFlashing ? "text-blue-700 scale-105" : ""
          }`}>
            {card.hero_val}
          </span>
          {card.progress_ratio !== undefined && (
            <span className="text-[10px] font-mono font-extrabold text-slate-500 bg-white/70 px-1.5 py-0.5 rounded border border-black/5">
              {card.progress_ratio.toFixed(0)}%
            </span>
          )}
        </div>

        {/* Dynamic Progress Bar */}
        {card.progress_ratio !== undefined && (
          <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full bg-gradient-to-r ${progressGradient} transition-all duration-500 rounded-full`}
              style={{ width: `${Math.min(Math.max(card.progress_ratio, 0), 100)}%` }}
            />
          </div>
        )}

        {/* Clear Sub-stat */}
        <p className="text-[10px] text-slate-600 font-bold truncate mt-1">
          {card.sub_stat}
        </p>
      </div>

      {/* 3. 30-Minute Behavioral Insight Box (Consumes vertical space with rich financial commentary) */}
      {card.insight && (
        <div className="my-1 px-2 py-1 rounded-lg bg-white/85 border border-black/5 shadow-2xs text-[9.5px] text-slate-700 font-medium leading-snug flex items-start gap-1.5 shrink-0">
          <span
            className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
              isGreen ? "bg-emerald-500" : isRed ? "bg-rose-500" : "bg-amber-500"
            }`}
          />
          <span className="line-clamp-2">{card.insight}</span>
        </div>
      )}

      {/* 4. Active Stock Chips / Live Leaders (Clickable to open chart studio) */}
      <div className="pt-1.5 border-t border-black/5 shrink-0">
        {card.chips && card.chips.length > 0 ? (
          <div className="flex items-center gap-1.5 w-full overflow-x-auto no-scrollbar">
            {card.chips.slice(0, 3).map((chip, idx) => {
              const chipBullish = (chip.change_pct ?? 0) >= 0;
              return (
                <button
                  key={`${chip.symbol}-${idx}`}
                  onClick={() => onSelectStock?.(chip.symbol)}
                  title={`Click to inspect ${chip.symbol} live chart studio`}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-white hover:bg-blue-50 border border-slate-300/80 hover:border-blue-400 text-slate-900 transition-all duration-150 shrink-0 text-[10px] cursor-pointer shadow-2xs active:scale-95 group/chip"
                >
                  <span className="font-extrabold font-mono text-slate-900 group-hover/chip:text-blue-700">
                    {chip.symbol}
                  </span>
                  {chip.change_pct !== undefined && (
                    <span
                      className={`font-mono text-[9px] font-extrabold px-1 py-0.2 rounded ${
                        chipBullish
                          ? "text-emerald-800 bg-emerald-100"
                          : "text-rose-800 bg-rose-100"
                      }`}
                    >
                      {chipBullish ? "+" : ""}
                      {chip.change_pct.toFixed(1)}%
                    </span>
                  )}
                  {chip.ltp !== undefined && chip.ltp > 0 && (
                    <span className="text-[9.5px] text-slate-500 font-mono font-bold hidden sm:inline">
                      ₹{chip.ltp < 10 ? chip.ltp.toFixed(2) : Math.round(chip.ltp).toLocaleString()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-[9.5px] text-slate-500 font-semibold italic py-0.5">
            Broad market composite tracking
          </div>
        )}
      </div>
    </div>
  );
};
