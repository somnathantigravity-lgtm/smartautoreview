"use client";

import React from "react";
import {
  Play,
  Bookmark,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Layers,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  TrendingDown,
  ArrowRight,
  X
} from "lucide-react";
import { BotStrategyDefinition } from "@/types";

interface StrategyVisualizerCardProps {
  strategy: BotStrategyDefinition;
  onChangeStrategy: (updated: BotStrategyDefinition) => void;
  onRunBacktest: () => void;
  onSaveBot: () => void;
  isBacktesting: boolean;
  isSaving: boolean;
  onClose?: () => void;
}

export const StrategyVisualizerCard: React.FC<StrategyVisualizerCardProps> = ({
  strategy,
  onChangeStrategy,
  onRunBacktest,
  onSaveBot,
  isBacktesting,
  isSaving,
  onClose
}) => {
  const updateExit = (field: string, val: any) => {
    onChangeStrategy({
      ...strategy,
      exit: {
        ...strategy.exit,
        [field]: val,
      },
    });
  };

  const updateUniverse = (field: string, val: any) => {
    onChangeStrategy({
      ...strategy,
      universe: {
        ...strategy.universe,
        [field]: val,
      },
    });
  };

  const riskBadgeColor =
    strategy.risk_score === "LOW"
      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
      : strategy.risk_score === "HIGH"
      ? "bg-rose-50 text-rose-700 border-rose-300"
      : "bg-amber-50 text-amber-700 border-amber-300";

  const rrRatio =
    strategy.exit.target_pct && strategy.exit.stop_loss_pct
      ? (strategy.exit.target_pct / strategy.exit.stop_loss_pct).toFixed(1)
      : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Strategy Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">{strategy.name}</h2>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase border ${riskBadgeColor}`}
            >
              Risk: {strategy.risk_score || "MODERATE"}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              v{strategy.version || 1}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
            {strategy.description || "Deterministic algorithmic trading rules"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onSaveBot}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Save bot to library"
          >
            <Bookmark className="w-3.5 h-3.5 text-blue-600" />
            <span>{isSaving ? "Saving..." : "Save Bot"}</span>
          </button>

          <button
            onClick={onRunBacktest}
            disabled={isBacktesting}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:bg-blue-400"
          >
            {isBacktesting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Backtesting...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Backtest</span>
              </>
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
              title="Close side panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. Universe Selector */}
        <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Stock Universe
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Liquidity: &gt; ₹{(strategy.universe.min_price || 20).toFixed(0)} | Vol &gt; {((strategy.universe.min_volume || 200000) / 1000).toFixed(0)}k
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "NIFTY_50", label: "NIFTY 50", desc: "Top 50 Bluechips" },
              { id: "NIFTY_500", label: "NIFTY 500", desc: "Broad Market" },
              { id: "ALL_EQUITIES", label: "All Equities", desc: "NSE + BSE (5k+ stocks)" }
            ].map((u) => {
              const isSelected = strategy.universe.base === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => updateUniverse("base", u.id)}
                  className={`p-2 rounded-md text-left transition-all border cursor-pointer ${
                    isSelected
                      ? "bg-blue-50/80 border-blue-400 text-blue-900 shadow-2xs"
                      : "bg-white border-slate-200 hover:bg-slate-100/60 text-slate-700"
                  }`}
                >
                  <div className="text-xs font-bold">{u.label}</div>
                  <div className="text-[10px] text-slate-500">{u.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Entry Rules */}
        <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Entry Conditions ({strategy.entry.logic} Match)
            </span>
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {strategy.entry.time_filter_start || "09:30"} - {strategy.entry.time_filter_end || "14:30"} IST
            </span>
          </div>

          <div className="space-y-2">
            {strategy.entry.conditions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 italic">No entry conditions defined yet.</div>
            ) : (
              strategy.entry.conditions.map((cond, idx) => (
                <div
                  key={cond.id || idx}
                  className="p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold font-mono text-[10px] flex items-center justify-center border border-blue-200">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="font-mono uppercase text-blue-700 font-bold bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
                          {cond.field}
                        </span>
                        <span className="font-bold text-slate-500">{cond.operator}</span>
                        <span className="font-mono text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                          {cond.multiplier && cond.multiplier !== 1 ? `${cond.multiplier}x ` : ""}
                          {cond.value}
                        </span>
                      </div>
                      {cond.description && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{cond.description}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {cond.timeframe || "15m"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Exit & Profit Taking (Interactive Controls) */}
        <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/70">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Exit Rules &amp; Profit Targets
            </span>
            {rrRatio && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Risk-Reward: 1:{rrRatio}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Target % */}
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                <Target className="w-3 h-3 text-emerald-600" /> Target Profit %
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="20"
                  value={strategy.exit.target_pct || 3.0}
                  onChange={(e) => updateExit("target_pct", parseFloat(e.target.value) || 3.0)}
                  className="w-full text-xs font-bold font-mono text-emerald-700 bg-emerald-50/60 border border-emerald-200 rounded px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            {/* Stop Loss % */}
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-rose-600" /> Stop Loss %
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  max="10"
                  value={strategy.exit.stop_loss_pct || 1.5}
                  onChange={(e) => updateExit("stop_loss_pct", parseFloat(e.target.value) || 1.5)}
                  className="w-full text-xs font-bold font-mono text-rose-700 bg-rose-50/60 border border-rose-200 rounded px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                />
                <span className="text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            {/* Trailing Stop % */}
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                <Shield className="w-3 h-3 text-blue-600" /> Trailing Stop %
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={strategy.exit.trailing_stop_pct || 1.0}
                  onChange={(e) => updateExit("trailing_stop_pct", parseFloat(e.target.value) || 0.0)}
                  className="w-full text-xs font-bold font-mono text-blue-700 bg-blue-50/60 border border-blue-200 rounded px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-400">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Risk Profile & Regulatory Safety Disclosure */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Safety &amp; Risk Notes
            </span>
          </div>
          <div className="space-y-1">
            {(strategy.risk_notes && strategy.risk_notes.length > 0
              ? strategy.risk_notes
              : [
                  "Stop-loss is mandatory to avoid catastrophic intraday drawdowns.",
                  "Indian statutory taxes (STT, brokerage, turnover, GST) will be deducted from gross returns."
                ]
            ).map((note, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                <span className="text-amber-500 font-bold">•</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
