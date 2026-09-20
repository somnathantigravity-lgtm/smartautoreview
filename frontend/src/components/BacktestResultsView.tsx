"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { BacktestResult, BacktestTrade } from "@/types";

interface BacktestResultsViewProps {
  results: BacktestResult;
  onSelectStock?: (symbol: string) => void;
  onClose?: () => void;
}

export const BacktestResultsView: React.FC<BacktestResultsViewProps> = ({
  results,
  onSelectStock,
  onClose
}) => {
  const isProfitable = results.total_net_pnl >= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-sm font-bold text-slate-900">
              Backtest Performance: {results.strategy_name}
            </h2>
            <span className="text-[10px] font-mono text-slate-500">
              ({results.backtest_run_at})
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Tested across {results.symbols_tested?.join(", ") || "Universe"} with ₹{results.initial_capital.toLocaleString("en-IN")} initial capital
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-md text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕ Close Backtest
          </button>
        )}
      </div>

      {/* 5 Core Metric Cards */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0 border-b border-slate-100 bg-gradient-to-b from-slate-50/30 to-white">
        {/* 1. Net Return */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Net Return</span>
            {isProfitable ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            )}
          </div>
          <div
            className={`text-lg font-black font-mono tracking-tight ${
              isProfitable ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {results.return_pct >= 0 ? "+" : ""}
            {results.return_pct.toFixed(2)}%
          </div>
          <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
            ₹{results.total_net_pnl >= 0 ? "+" : ""}
            {results.total_net_pnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* 2. Win Rate */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Win Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-black font-mono tracking-tight text-blue-600">
            {results.win_rate_pct.toFixed(1)}%
          </div>
          <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
            {results.winning_trades} W / {results.losing_trades} L ({results.total_trades} trades)
          </div>
        </div>

        {/* 3. Profit Factor */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Profit Factor</span>
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-lg font-black font-mono tracking-tight text-indigo-600">
            {results.profit_factor.toFixed(2)}
          </div>
          <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
            Gross ₹{results.total_gross_pnl >= 0 ? "+" : ""}{results.total_gross_pnl.toFixed(0)}
          </div>
        </div>

        {/* 4. Max Drawdown */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Max Drawdown</span>
            <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-black font-mono tracking-tight text-amber-700">
            -{results.max_drawdown_pct.toFixed(2)}%
          </div>
          <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
            Peak to trough drop
          </div>
        </div>

        {/* 5. Indian Statutory Charges */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Statutory Taxes</span>
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-lg font-black font-mono tracking-tight text-slate-800">
            ₹{results.total_statutory_costs.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-medium text-slate-400 mt-0.5">
            STT + Brokerage + GST
          </div>
        </div>
      </div>

      {/* Trade History Log Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Trade Log ({results.trade_log?.length || 0} executed signals)
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Click symbol to inspect chart</span>
        </div>

        {(!results.trade_log || results.trade_log.length === 0) ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            No trades were triggered during the backtest window with the given entry conditions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-2 px-3">Stock</th>
                  <th className="py-2 px-3">Entry</th>
                  <th className="py-2 px-3">Exit</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  <th className="py-2 px-3 text-right">Entry ₹</th>
                  <th className="py-2 px-3 text-right">Exit ₹</th>
                  <th className="py-2 px-3 text-center">Exit Reason</th>
                  <th className="py-2 px-3 text-right">Taxes ₹</th>
                  <th className="py-2 px-3 text-right">Net P&L ₹</th>
                  <th className="py-2 px-3 text-right">Return %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.trade_log.map((t, idx) => {
                  const isWin = t.net_pnl > 0;
                  const reasonBadge =
                    t.exit_reason === "TARGET HIT"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : t.exit_reason === "STOP LOSS"
                      ? "bg-rose-50 text-rose-700 border-rose-300"
                      : t.exit_reason === "TRAILING STOP"
                      ? "bg-blue-50 text-blue-700 border-blue-300"
                      : "bg-slate-100 text-slate-600 border-slate-200";

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectStock?.(t.symbol)}
                    >
                      <td className="py-2 px-3 font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1">
                        <span>{t.symbol}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                        {t.entry_date_str}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                        {t.exit_date_str}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        {t.quantity}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        ₹{t.entry_price.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        ₹{t.exit_price.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${reasonBadge}`}
                        >
                          {t.exit_reason}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-400 text-[11px]">
                        ₹{t.statutory_costs.toFixed(2)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono font-bold ${
                          isWin ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {t.net_pnl >= 0 ? "+" : ""}
                        ₹{t.net_pnl.toFixed(2)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono font-bold ${
                          isWin ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {t.return_pct >= 0 ? "+" : ""}
                        {t.return_pct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
