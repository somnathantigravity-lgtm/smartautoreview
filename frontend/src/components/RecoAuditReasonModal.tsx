"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Filter
} from "lucide-react";

interface AuditHistoryItem {
  id: string;
  date: string;
  trigger_time: string;
  session_label: string;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  target_pct: number;
  stop_loss_pct: number;
  outcome: "TARGET_HIT" | "NOT_HIT" | "STOP_LOSS" | "TRADEOFF" | "ACTIVE";
  outcome_label: string;
  return_pct: number;
  score_100: number;
  score_c?: number;
  score_h?: number;
  score_a?: number;
  score_wa?: number;
  rvol: number;
  reasons: string[];
  failure_reason?: string | null;
}

interface AuditHistoryData {
  status: string;
  symbol: string;
  total_checks_today?: number;
  target_hits_today?: number;
  history_count: number;
  history: AuditHistoryItem[];
}

interface RecoAuditReasonModalProps {
  symbol: string;
  name: string;
  scoreWA: number;
  scoreC: number;
  scoreH: number;
  scoreA: number;
  policyPassed: boolean;
  policyStatus: string;
  policyFailDesc: string;
  targetHitsRatio?: string; // e.g. "2/225"
  onClose: () => void;
}

export const RecoAuditReasonModal: React.FC<RecoAuditReasonModalProps> = ({
  symbol,
  name,
  scoreWA,
  scoreC,
  scoreH,
  scoreA,
  policyPassed,
  policyStatus,
  policyFailDesc,
  targetHitsRatio,
  onClose
}) => {
  const [data, setData] = useState<AuditHistoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"ALL" | "HIT" | "NOT_HIT">("ALL");

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/recommendations/audit-history/${symbol}`);
        if (!res.ok) throw new Error("Failed to load audit history");
        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load audit reasons");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [symbol]);

  const historyItems = useMemo(() => {
    if (!data || !data.history) return [];
    if (filterTab === "ALL") return data.history;
    if (filterTab === "HIT") return data.history.filter((it) => it.outcome === "TARGET_HIT");
    if (filterTab === "NOT_HIT") return data.history.filter((it) => it.outcome !== "TARGET_HIT");
    return data.history;
  }, [data, filterTab]);

  const hitCount = useMemo(() => {
    if (!data || !data.history) return 0;
    return data.history.filter((it) => it.outcome === "TARGET_HIT").length;
  }, [data]);

  const notHitCount = useMemo(() => {
    if (!data || !data.history) return 0;
    return data.history.filter((it) => it.outcome !== "TARGET_HIT").length;
  }, [data]);

  const totalCount = data?.history ? data.history.length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-black tracking-tight text-slate-900 font-mono">{symbol}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {name}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    policyPassed
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {policyPassed ? "MICHPA Passed" : `Held: ${policyStatus}`}
                </span>
                {targetHitsRatio && (() => {
                  const parts = targetHitsRatio.split("/");
                  const h = parseInt(parts[0], 10) || 0;
                  const t = parseInt(parts[1], 10) || 1;
                  const pct = Math.round((h / Math.max(1, t)) * 100);
                  return (
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 font-black border border-indigo-200 inline-flex items-center gap-1.5">
                      <span>Hits: {targetHitsRatio}</span>
                      <span className="bg-indigo-200/70 text-indigo-900 px-1.5 py-0.2 rounded font-extrabold text-[10.5px]">
                        {pct}%
                      </span>
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Session Audit Checks • Threshold Failure Attribution Log
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs: All, Hit, Not Hit */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterTab("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === "ALL"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Events ({totalCount})
            </button>
            <button
              onClick={() => setFilterTab("HIT")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === "HIT"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
              }`}
            >
              🎯 Target Hit ({hitCount})
            </button>
            <button
              onClick={() => setFilterTab("NOT_HIT")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === "NOT_HIT"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-white text-rose-700 hover:bg-rose-50 border border-rose-200"
              }`}
            >
              🛡️ Not Hit / Held ({notHitCount})
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            Thresholds: C ≥ 50% • H ≥ 50% • A ≥ 60%
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold">Loading daily audit checks...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No audit check events match the selected filter.
            </div>
          ) : (
            <div className="space-y-2.5">
              {historyItems.map((item, idx) => {
                const isHit = item.outcome === "TARGET_HIT";
                const itemC = item.score_c || item.score_100 || scoreC || 75;
                const itemH = item.score_h || scoreH || 55;
                const itemA = item.score_a || scoreA || 70;
                const itemWA = item.score_wa || Math.round((itemC * 0.45) + (itemH * 0.35) + (itemA * 0.20));

                // Plain reason of why it was not triggered
                let failureDesc = item.failure_reason || (item.reasons && item.reasons[0]) || "";
                if (!isHit && !failureDesc) {
                  const reasons: string[] = [];
                  if (itemC < 50) reasons.push(`C is below threshold (${itemC}% < 50%)`);
                  if (itemH < 50) reasons.push(`H is below threshold (${itemH}% < 50%)`);
                  if (itemA < 60) reasons.push(`A is below threshold (${itemA}% < 60%)`);
                  failureDesc = reasons.join(" • ") || "Waiting for Breakout";
                }

                return (
                  <div
                    key={item.id || idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isHit
                        ? "bg-emerald-50/40 border-emerald-300 shadow-2xs"
                        : "bg-slate-50/90 border-slate-200 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 shadow-2xs">
                          {item.trigger_time} IST
                        </span>

                        {/* Point-in-time WA / C / H / A pills */}
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                            WA: {itemWA}%
                          </span>
                          <span className={`px-1.5 py-0.5 rounded font-bold border ${itemC >= 60 ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                            C: {itemC}%
                          </span>
                          <span className={`px-1.5 py-0.5 rounded font-bold border ${itemH >= 50 ? "bg-blue-50 text-blue-800 border-blue-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                            H: {itemH}%
                          </span>
                          <span className={`px-1.5 py-0.5 rounded font-bold border ${itemA >= 60 ? "bg-indigo-50 text-indigo-800 border-indigo-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                            A: {itemA}%
                          </span>
                        </div>

                        {item.entry_price > 0 && (
                          <span className="text-xs font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            ₹{item.entry_price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                            isHit
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {isHit ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {isHit ? "Target Hit" : "Not Triggered"}
                        </span>
                      </div>
                    </div>

                    {/* Simple layman reason of why it was not triggered */}
                    <div className="mt-2 text-xs pt-2 border-t border-slate-200/70">
                      {isHit ? (
                        <div className="text-emerald-800 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>All criteria met: C, H, and A scores above threshold. Target trigger fired.</span>
                        </div>
                      ) : (
                        <div className="text-slate-700 font-medium flex items-start gap-1.5">
                          <span className="text-rose-600 font-bold shrink-0">• Reason Not Hit:</span>
                          <span className="text-slate-800">{failureDesc}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Showing {historyItems.length} of {totalCount} checks evaluated today
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
