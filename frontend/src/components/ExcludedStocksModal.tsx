"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  AlertTriangle,
  RefreshCw,
  Ban,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Info
} from "lucide-react";

interface IneligibleStockItem {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  ltp: number;
  volume: number;
  turnover_cr?: number;
  primary_reason: string;
  category: string;
  failed_rules: string[];
  financials?: {
    debt_to_equity?: number;
    altman_z?: number;
    piotroski?: number;
    pledge_pct?: number;
    promoter_holding?: number;
    net_profit?: number;
  };
}

interface ExcludedStocksModalProps {
  ruleId: string;
  ruleTitle: string;
  ruleThresholdText: string;
  strategyRules?: any;
  onClose: () => void;
}

export const ExcludedStocksModal: React.FC<ExcludedStocksModalProps> = ({
  ruleId,
  ruleTitle,
  ruleThresholdText,
  strategyRules,
  onClose,
}) => {
  const [items, setItems] = useState<IneligibleStockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchExcludedStocks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        rule_id: ruleId,
        page: String(page),
        page_size: "50",
      });
      if (search.trim()) params.set("search", search.trim());
      if (strategyRules) {
        params.set("rules_json", JSON.stringify(strategyRules));
      }

      const res = await fetch(`/api/v1/recommendations/ineligible-stocks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load excluded stocks");
      const data = await res.json();
      setItems(data.items || []);
      setTotalCount(data.total_count || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error("Error loading excluded stocks:", err);
    } finally {
      setLoading(false);
    }
  }, [ruleId, page, search, strategyRules]);

  useEffect(() => {
    fetchExcludedStocks();
  }, [fetchExcludedStocks]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Format the real trigger value based on rule
  const renderRealValue = (item: IneligibleStockItem) => {
    if (ruleId === "exclude_penny") {
      return (
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded">
            ₹{item.ltp > 0 ? item.ltp.toFixed(2) : "0.00"}
          </span>
          <span className="text-[10px] text-slate-400">LTP</span>
        </div>
      );
    }
    if (ruleId === "exclude_illiquid") {
      return (
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded">
            {item.volume ? item.volume.toLocaleString() : "0"}
          </span>
          <span className="text-[10px] text-slate-400">Vol</span>
        </div>
      );
    }
    if (ruleId === "exclude_low_turnover") {
      return (
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded">
            ₹{item.turnover_cr !== undefined ? item.turnover_cr.toFixed(2) : "0.00"} Cr
          </span>
          <span className="text-[10px] text-slate-400">Turnover</span>
        </div>
      );
    }
    if (ruleId === "exclude_surveillance_sme") {
      return (
        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded">
          {item.category || "Surveillance / SME"}
        </span>
      );
    }
    if (ruleId === "exclude_non_equity") {
      return (
        <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
          {item.category || "Non-Equity / ETF"}
        </span>
      );
    }
    if (ruleId === "exclude_high_debt") {
      return (
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded">
            {item.financials?.debt_to_equity !== undefined ? `${item.financials.debt_to_equity.toFixed(1)}x` : "High D/E"}
          </span>
          <span className="text-[10px] text-slate-400">D/E</span>
        </div>
      );
    }
    if (ruleId === "exclude_bankruptcy_distress") {
      return (
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded">
            Z: {item.financials?.altman_z !== undefined ? item.financials.altman_z.toFixed(2) : "< 1.8"}
          </span>
          <span className="text-[10px] text-slate-400">Distress</span>
        </div>
      );
    }
    if (ruleId === "exclude_weak_piotroski") {
      return (
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded">
            {item.financials?.piotroski !== undefined ? `${item.financials.piotroski} / 9` : "< 4"}
          </span>
          <span className="text-[10px] text-slate-400">F-Score</span>
        </div>
      );
    }
    if (ruleId === "exclude_high_pledge") {
      return (
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded">
            {item.financials?.pledge_pct !== undefined ? `${item.financials.pledge_pct.toFixed(1)}%` : "> Max"}
          </span>
          <span className="text-[10px] text-slate-400">Pledge</span>
        </div>
      );
    }
    if (ruleId === "exclude_low_promoter_holding") {
      return (
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded">
            {item.financials?.promoter_holding !== undefined ? `${item.financials.promoter_holding.toFixed(1)}%` : "< Min"}
          </span>
          <span className="text-[10px] text-slate-400">Stake</span>
        </div>
      );
    }
    if (ruleId === "exclude_loss_makers") {
      return (
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded">
            {item.financials?.net_profit !== undefined && item.financials.net_profit !== 0
              ? `PAT: ₹${item.financials.net_profit.toFixed(1)} Cr`
              : "Net Loss Maker"}
          </span>
        </div>
      );
    }

    // Default fallback
    return (
      <span className="text-xs font-mono font-bold text-slate-700">
        ₹{item.ltp > 0 ? item.ltp.toFixed(2) : "—"}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900">{ruleTitle}</h3>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  {totalCount.toLocaleString()} Excluded
                </span>
                {ruleThresholdText && (
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    {ruleThresholdText}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing all companies disqualified by this filter and their real trigger values.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Info Bar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by symbol, company, or sector..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 self-end sm:self-center">
            <span>
              Showing {items.length > 0 ? (page - 1) * 50 + 1 : 0} -{" "}
              {Math.min(page * 50, totalCount)} of {totalCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Excluded Stocks Table */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[500px]">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
              <span className="text-xs font-semibold">Loading excluded stocks...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Info className="w-8 h-8 text-slate-300" />
              <span className="text-xs font-semibold text-slate-600">No excluded stocks matched your query.</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200/80 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 z-10">
                <tr>
                  <th className="py-2.5 px-4 w-12">#</th>
                  <th className="py-2.5 px-4">Instrument / Company</th>
                  <th className="py-2.5 px-4">Sector</th>
                  <th className="py-2.5 px-4 text-right">Real Value Recorded</th>
                  <th className="py-2.5 px-4">Primary Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {items.map((it, idx) => (
                  <tr key={it.symbol} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                      {(page - 1) * 50 + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-900">{it.symbol}</div>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {it.exchange || "NSE"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {it.name || it.symbol}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs truncate max-w-[140px]">
                      {it.sector || "General"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end">{renderRealValue(it)}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {it.primary_reason || "Filtered out by universe rule"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer / Pagination */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Page <strong className="text-slate-800">{page}</strong> of{" "}
            <strong className="text-slate-800">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
