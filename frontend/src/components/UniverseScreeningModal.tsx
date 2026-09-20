"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Sliders,
  Sparkles,
  CheckCircle2,
  Coins,
  Scale,
  Ban,
  Building2,
  TrendingDown,
  RefreshCw,
  Info
} from "lucide-react";

export interface ExclusionRules {
  // 1. Price & Penny Stocks
  exclude_penny: boolean;
  min_price: number;

  // 2. Smart Liquidity & Volume
  exclude_illiquid: boolean;
  min_volume: number;
  volume_lookback_days: number;       // 10, 20, 30 days
  volume_calc_type: "MEDIAN" | "AVERAGE"; // "MEDIAN" (Spike-resistant) or "AVERAGE"
  exclude_low_turnover: boolean;
  min_turnover_cr: number;            // Turnover in ₹ Crores (e.g. 2.0 Cr)

  // 3. Regulatory & Instruments
  exclude_surveillance_sme: boolean;  // ASM/GSM, T2T, SME
  exclude_non_equity: boolean;        // ETFs, Gold, Liquid, Debt
  exclude_circuit_trappers: boolean;  // Narrow 2% or 5% bands

  // 4. Solvency & Fundamentals
  exclude_high_debt: boolean;
  max_debt_to_equity: number;
  exclude_bankruptcy_distress: boolean;
  min_altman_z: number;
  exclude_weak_piotroski: boolean;
  min_piotroski: number;

  // 5. Governance & Ownership
  exclude_high_pledge: boolean;
  max_promoter_pledge: number;
  exclude_low_promoter_holding: boolean;
  min_promoter_holding: number;

  // 6. Quality & Price Action Traps
  exclude_loss_makers: boolean;       // PAT <= 0
  exclude_negative_cfo: boolean;      // CFO < 0
  exclude_52w_low_fallers: boolean;   // Near 52W low breakdown
  exclude_choppy_traps: boolean;      // High whipsaw / choppy false-breakout risk
}

const PRESET_BALANCED: ExclusionRules = {
  exclude_penny: true,
  min_price: 15.0,
  exclude_illiquid: true,
  min_volume: 100000,
  volume_lookback_days: 10,
  volume_calc_type: "MEDIAN",
  exclude_low_turnover: true,
  min_turnover_cr: 2.0,
  exclude_surveillance_sme: true,
  exclude_non_equity: true,
  exclude_circuit_trappers: true,
  exclude_high_debt: true,
  max_debt_to_equity: 3.0,
  exclude_bankruptcy_distress: true,
  min_altman_z: 1.8,
  exclude_weak_piotroski: true,
  min_piotroski: 4,
  exclude_high_pledge: true,
  max_promoter_pledge: 25.0,
  exclude_low_promoter_holding: false,
  min_promoter_holding: 20.0,
  exclude_loss_makers: false,
  exclude_negative_cfo: false,
  exclude_52w_low_fallers: false,
  exclude_choppy_traps: false,
};

const PRESET_CONSERVATIVE: ExclusionRules = {
  exclude_penny: true,
  min_price: 20.0,
  exclude_illiquid: true,
  min_volume: 150000,
  volume_lookback_days: 20,
  volume_calc_type: "MEDIAN",
  exclude_low_turnover: true,
  min_turnover_cr: 3.0,
  exclude_surveillance_sme: true,
  exclude_non_equity: true,
  exclude_circuit_trappers: true,
  exclude_high_debt: true,
  max_debt_to_equity: 2.0,
  exclude_bankruptcy_distress: true,
  min_altman_z: 2.5,
  exclude_weak_piotroski: true,
  min_piotroski: 5,
  exclude_high_pledge: true,
  max_promoter_pledge: 15.0,
  exclude_low_promoter_holding: true,
  min_promoter_holding: 30.0,
  exclude_loss_makers: true,
  exclude_negative_cfo: true,
  exclude_52w_low_fallers: true,
  exclude_choppy_traps: true,
};

const PRESET_HIGH_COVERAGE: ExclusionRules = {
  exclude_penny: true,
  min_price: 10.0,
  exclude_illiquid: true,
  min_volume: 50000,
  volume_lookback_days: 10,
  volume_calc_type: "AVERAGE",
  exclude_low_turnover: false,
  min_turnover_cr: 1.0,
  exclude_surveillance_sme: true,
  exclude_non_equity: true,
  exclude_circuit_trappers: false,
  exclude_high_debt: false,
  max_debt_to_equity: 4.0,
  exclude_bankruptcy_distress: false,
  min_altman_z: 1.5,
  exclude_weak_piotroski: false,
  min_piotroski: 3,
  exclude_high_pledge: false,
  max_promoter_pledge: 40.0,
  exclude_low_promoter_holding: false,
  min_promoter_holding: 15.0,
  exclude_loss_makers: false,
  exclude_negative_cfo: false,
  exclude_52w_low_fallers: false,
  exclude_choppy_traps: false,
};

interface UniverseScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated: (appliedRules?: ExclusionRules) => void;
  initialRules?: Partial<ExclusionRules>;
}

export const UniverseScreeningModal: React.FC<UniverseScreeningModalProps> = ({
  isOpen,
  onClose,
  onActivated,
  initialRules,
}) => {
  const [rules, setRules] = useState<ExclusionRules>(() => ({
    ...PRESET_BALANCED,
    ...(initialRules || {}),
  }));
  const [activePreset, setActivePreset] = useState<"BALANCED" | "CONSERVATIVE" | "HIGH_COVERAGE" | "CUSTOM">("BALANCED");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState<{
    master_count: number;
    eligible_count: number;
    ineligible_count: number;
    breakdown: Record<string, number>;
    rule_impact: Record<string, number>;
  }>({
    master_count: 5087,
    eligible_count: 981,
    ineligible_count: 4106,
    breakdown: {},
    rule_impact: {},
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reqSeqRef = useRef<number>(0);
  const prevIsOpenRef = useRef<boolean>(false);

  const fetchPreview = useCallback(async (currentRules: ExclusionRules) => {
    const seq = ++reqSeqRef.current;
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/v1/recommendations/preview-exclusions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentRules),
      });
      if (res.ok) {
        const data = await res.json();
        // Discard out-of-order responses
        if (seq === reqSeqRef.current) {
          setPreview({
            master_count: data.master_count || 5087,
            eligible_count: data.eligible_count || 0,
            ineligible_count: data.ineligible_count || 0,
            breakdown: data.breakdown || {},
            rule_impact: data.rule_impact || {},
          });
        }
      }
    } catch (e) {
      console.error("Preview error:", e);
    } finally {
      if (seq === reqSeqRef.current) {
        setPreviewLoading(false);
      }
    }
  }, []);

  // Initialize rules ONLY when the modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const merged: ExclusionRules = {
        ...PRESET_BALANCED,
        ...(initialRules || {}),
      };
      setRules(merged);
      setActivePreset("CUSTOM");
      fetchPreview(merged);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialRules, fetchPreview]);

  // Synchronously update local state and debounce the preview API call
  const handleRuleChange = (field: keyof ExclusionRules, value: any) => {
    setActivePreset("CUSTOM");
    setRules((prev) => {
      const updated = { ...prev, [field]: value };
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        fetchPreview(updated);
      }, 100);
      return updated;
    });
  };

  const applyPreset = (presetType: "BALANCED" | "CONSERVATIVE" | "HIGH_COVERAGE") => {
    setActivePreset(presetType);
    let target = PRESET_BALANCED;
    if (presetType === "CONSERVATIVE") target = PRESET_CONSERVATIVE;
    if (presetType === "HIGH_COVERAGE") target = PRESET_HIGH_COVERAGE;
    setRules(target);
    fetchPreview(target);
  };

  const handleConfirmAndActivate = async () => {
    setApplying(true);
    try {
      const res = await fetch("/api/v1/recommendations/apply-exclusions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules),
      });
      if (res.ok) {
        onActivated(rules);
        onClose();
      } else {
        alert("Failed to activate universe. Please check backend.");
      }
    } catch (e) {
      console.error("Error applying universe rules:", e);
      alert("Error applying universe rules.");
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  const eligiblePct = Math.round((preview.eligible_count / Math.max(1, preview.master_count)) * 100);
  const ineligiblePct = 100 - eligiblePct;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Broad, spacious modal dialog (max-w-6xl) */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden text-slate-900 font-sans">
        
        {/* Header Ribbon */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Morning Universe Filter Studio
                </h2>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Negative Exclusion Setup
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select which stocks to exclude from today's live recommendations. Unscreened stocks stay strictly locked.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High-Contrast Tally Bar (Clean Dark Theme) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex flex-col gap-2.5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-8">
              {/* Eligible Counter */}
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Eligible for Recos
                  </div>
                  <div className="text-2xl font-black text-white flex items-baseline gap-1.5">
                    <span>{preview.eligible_count.toLocaleString()}</span>
                    <span className="text-xs font-semibold text-emerald-400">({eligiblePct}%)</span>
                  </div>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-800" />

              {/* Excluded Counter */}
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-rose-400 ring-4 ring-rose-400/20" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                    Excluded Stocks
                  </div>
                  <div className="text-2xl font-black text-white flex items-baseline gap-1.5">
                    <span>{preview.ineligible_count.toLocaleString()}</span>
                    <span className="text-xs font-semibold text-rose-400">({ineligiblePct}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Master Pool Tally & Status */}
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {previewLoading && (
                <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Calculating pool...</span>
                </div>
              )}
              <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 font-mono text-xs">
                Master Pool: <span className="font-bold text-white">{preview.master_count.toLocaleString()}</span> stocks
              </div>
            </div>
          </div>

          {/* Ratio Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${eligiblePct}%` }}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-300"
              style={{ width: `${ineligiblePct}%` }}
            />
          </div>
        </div>

        {/* Quick Presets Ribbon */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Preset Strategy:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => applyPreset("BALANCED")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
                activePreset === "BALANCED"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>⚖️ Balanced (Default)</span>
            </button>
            <button
              onClick={() => applyPreset("CONSERVATIVE")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
                activePreset === "CONSERVATIVE"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>🛡️ Conservative (Strict)</span>
            </button>
            <button
              onClick={() => applyPreset("HIGH_COVERAGE")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
                activePreset === "HIGH_COVERAGE"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>🚀 High Coverage (Permissive)</span>
            </button>
            {activePreset === "CUSTOM" && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-[10px] uppercase tracking-wider border border-amber-200">
                Custom Modified
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Negative Parameter Cards (2 Spacious Columns) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* ================= LEFT COLUMN ================= */}
            <div className="space-y-5">
              
              {/* SECTION 1: LIQUIDITY & TURNOVER */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Coins className="w-4 h-4 text-indigo-600" />
                    <span>Price, Liquidity & Turnover Floors</span>
                  </div>
                </div>

                {/* 1. Exclude Penny Stocks */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  rules.exclude_penny ? "bg-white border-slate-300" : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
                      <input
                        type="checkbox"
                        checked={rules.exclude_penny}
                        onChange={(e) => handleRuleChange("exclude_penny", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>🚫 Exclude Penny Stocks</span>
                    </label>
                    {rules.exclude_penny && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{preview.rule_impact?.exclude_penny || 0} stocks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Disqualifies micro-caps to avoid low-capitalization pump-and-dump traps.
                  </p>
                  {rules.exclude_penny && (
                    <div className="mt-2.5 pl-6 flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600">Price Floor:</span>
                      <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2 py-1 border border-slate-200">
                        <span className="text-xs text-slate-500 font-bold">₹</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={rules.min_price}
                          onChange={(e) => handleRuleChange("min_price", parseFloat(e.target.value) || 15)}
                          className="w-14 text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400">(Stocks &lt; ₹{rules.min_price} excluded)</span>
                    </div>
                  )}
                </div>

                {/* 2. SMART ILLIQUID STOCKS FILTER */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  rules.exclude_illiquid ? "bg-white border-slate-300 ring-1 ring-indigo-500/10" : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
                      <input
                        type="checkbox"
                        checked={rules.exclude_illiquid}
                        onChange={(e) => handleRuleChange("exclude_illiquid", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>🚫 Exclude Illiquid Stocks (Smart Volume Engine)</span>
                    </label>
                    {rules.exclude_illiquid && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{preview.rule_impact?.exclude_illiquid || 0} stocks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Combines NSE + BSE volume so dual-listed stocks (like AUGMONT) are protected.
                  </p>

                  {rules.exclude_illiquid && (
                    <div className="mt-3 pl-6 pt-2.5 border-t border-slate-100 space-y-3">
                      {/* Smart Parameter Controls: Lookback & Calc Mode */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Lookback Days */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Volume Lookback Period:
                          </label>
                          <select
                            value={String(rules.volume_lookback_days)}
                            onChange={(e) => handleRuleChange("volume_lookback_days", parseInt(e.target.value, 10))}
                            className="w-full text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
                          >
                            <option value="1">Today Only (Intraday Live)</option>
                            <option value="10">Last 10 Days (Recommended)</option>
                            <option value="20">Last 20 Days (Institutional)</option>
                            <option value="30">Last 30 Days (Deep Horizon)</option>
                          </select>
                        </div>

                        {/* Calculation Type: Median vs Average */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Calculation Type:
                          </label>
                          <select
                            value={rules.volume_calc_type}
                            onChange={(e) => handleRuleChange("volume_calc_type", e.target.value as "MEDIAN" | "AVERAGE")}
                            className="w-full text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
                          >
                            <option value="MEDIAN">Median (Filters 1-Day Spikes)</option>
                            <option value="AVERAGE">Average (Simple Mean)</option>
                          </select>
                        </div>
                      </div>

                      {/* Microcopy clarifying Median benefits */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 text-[11px] text-slate-600 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span>
                          {rules.volume_calc_type === "MEDIAN"
                            ? "Rolling Median rejects isolated operator volume spikes or block trades, ensuring only genuinely liquid stocks qualify."
                            : "Simple Average sums all ticks divided by lookback days."}
                        </span>
                      </div>

                      {/* Volume Floor Select */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                        <span className="text-xs font-semibold text-slate-600">Volume Threshold Floor:</span>
                        <select
                          value={String(rules.min_volume)}
                          onChange={(e) => handleRuleChange("min_volume", parseInt(e.target.value, 10))}
                          className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-hidden cursor-pointer"
                        >
                          <option value="25000">25,000 shares</option>
                          <option value="50000">50,000 shares</option>
                          <option value="100000">100,000 shares (Recommended)</option>
                          <option value="150000">150,000 shares</option>
                          <option value="250000">250,000 shares</option>
                          <option value="500000">500,000 shares</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Minimum Daily Turnover Floor */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  rules.exclude_low_turnover ? "bg-white border-slate-300" : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
                      <input
                        type="checkbox"
                        checked={rules.exclude_low_turnover}
                        onChange={(e) => handleRuleChange("exclude_low_turnover", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>🚫 Exclude Low Daily Turnover</span>
                    </label>
                    {rules.exclude_low_turnover && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{preview.rule_impact?.exclude_low_turnover || 0} stocks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Ensures sufficient rupee value is traded daily for instant order fill without slippage.
                  </p>
                  {rules.exclude_low_turnover && (
                    <div className="mt-2.5 pl-6 flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600">Turnover Floor:</span>
                      <select
                        value={Number(rules.min_turnover_cr).toString()}
                        onChange={(e) => handleRuleChange("min_turnover_cr", parseFloat(e.target.value))}
                        className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-hidden cursor-pointer"
                      >
                        <option value="0.5">₹0.5 Cr / day (Permissive)</option>
                        <option value="1">₹1.0 Cr / day</option>
                        <option value="2">₹2.0 Cr / day (Recommended)</option>
                        <option value="3">₹3.0 Cr / day</option>
                        <option value="5">₹5.0 Cr / day (Strict)</option>
                      </select>
                    </div>
                  )}
                </div>

              </div>

              {/* SECTION 2: REGULATORY & SURVEILLANCE */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Ban className="w-4 h-4 text-indigo-600" />
                    <span>Regulatory & Exchange Restrictions</span>
                  </div>
                </div>

                {/* 4. Surveillance & SME */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  rules.exclude_surveillance_sme ? "bg-white border-slate-300" : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
                      <input
                        type="checkbox"
                        checked={rules.exclude_surveillance_sme}
                        onChange={(e) => handleRuleChange("exclude_surveillance_sme", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>🚫 Exclude ASM/GSM & SME Stocks</span>
                    </label>
                    {rules.exclude_surveillance_sme && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{preview.rule_impact?.exclude_surveillance_sme || 0} stocks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Filters out SEBI surveillance lists (GSM/ASM), Trade-to-Trade (T2T) 100% margin lockups, and Illiquid SME board lots (-SM).
                  </p>
                </div>

                {/* 5. ETFs & Non-Equities */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  rules.exclude_non_equity ? "bg-white border-slate-300" : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
                      <input
                        type="checkbox"
                        checked={rules.exclude_non_equity}
                        onChange={(e) => handleRuleChange("exclude_non_equity", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>🚫 Exclude ETFs, Funds & Non-Equities</span>
                    </label>
                    {rules.exclude_non_equity && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{preview.rule_impact?.exclude_non_equity || 0} funds
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Excludes Nifty BeES, Gold ETFs, Liquid ETFs, and debt fund units from equity signals.
                  </p>
                </div>

                {/* 6. Circuit Trappers */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  rules.exclude_circuit_trappers ? "bg-white border-slate-300" : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
                      <input
                        type="checkbox"
                        checked={rules.exclude_circuit_trappers}
                        onChange={(e) => handleRuleChange("exclude_circuit_trappers", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>🚫 Exclude Circuit Trappers (Narrow 2%-5% Bands)</span>
                    </label>
                    {rules.exclude_circuit_trappers && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{preview.rule_impact?.exclude_circuit_trappers || 0} stocks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Disqualifies stocks locked in tight 2% or 5% price bands where traders cannot exit positions.
                  </p>
                </div>

              </div>

            </div>

            {/* ================= RIGHT COLUMN ================= */}
            <div className="space-y-5">
              
              {/* SECTION 3: SOLVENCY & FINANCIAL HEALTH */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    <span>Financial Health & Solvency Shields</span>
                  </div>
                </div>

                {/* 7. High Debt-to-Equity */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  rules.exclude_high_debt ? "bg-white border-slate-300" : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
                      <input
                        type="checkbox"
                        checked={rules.exclude_high_debt}
                        onChange={(e) => handleRuleChange("exclude_high_debt", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>🚫 Exclude High Debt (D/E &gt; {rules.max_debt_to_equity}x)</span>
                    </label>
                    {rules.exclude_high_debt && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{preview.rule_impact?.exclude_high_debt || 0} stocks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Eliminates companies overburdened with debt and interest servicing obligations.
                  </p>
                  {rules.exclude_high_debt && (
                    <div className="mt-2.5 pl-6 flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600">D/E Ceiling:</span>
                      <select
                        value={Number(rules.max_debt_to_equity).toString()}
                        onChange={(e) => handleRuleChange("max_debt_to_equity", parseFloat(e.target.value))}
                        className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-hidden cursor-pointer"
                      >
                        <option value="1.5">1.5x (Strict)</option>
                        <option value="2">2.0x (Moderate)</option>
                        <option value="3">3.0x (Balanced Default)</option>
                        <option value="4">4.0x (Relaxed)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 8. Bankruptcy Distress (Altman Z) */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  rules.exclude_bankruptcy_distress ? "bg-white border-slate-300" : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
                      <input
                        type="checkbox"
                        checked={rules.exclude_bankruptcy_distress}
                        onChange={(e) => handleRuleChange("exclude_bankruptcy_distress", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>🚫 Exclude Bankruptcy Distress (Z-Score &lt; {rules.min_altman_z})</span>
                    </label>
                    {rules.exclude_bankruptcy_distress && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{preview.rule_impact?.exclude_bankruptcy_distress || 0} stocks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Altman Z-Score below 1.8 indicates severe distress and insolvency probability.
                  </p>
                  {rules.exclude_bankruptcy_distress && (
                    <div className="mt-2.5 pl-6 flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600">Z-Score Floor:</span>
                      <select
                        value={Number(rules.min_altman_z).toString()}
                        onChange={(e) => handleRuleChange("min_altman_z", parseFloat(e.target.value))}
                        className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-hidden cursor-pointer"
                      >
                        <option value="1.5">1.5 (High risk allowed)</option>
                        <option value="1.8">1.8 (Distress Zone Floor)</option>
                        <option value="2.5">2.5 (Conservative)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 9. Weak Piotroski Score */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  rules.exclude_weak_piotroski ? "bg-white border-slate-300" : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
                      <input
                        type="checkbox"
                        checked={rules.exclude_weak_piotroski}
                        onChange={(e) => handleRuleChange("exclude_weak_piotroski", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>🚫 Exclude Weak Fundamentals (Piotroski &lt; {rules.min_piotroski})</span>
                    </label>
                    {rules.exclude_weak_piotroski && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{preview.rule_impact?.exclude_weak_piotroski || 0} stocks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    F-Score below 4 flags companies with deteriorating operational and cash margins.
                  </p>
                </div>

              </div>

              {/* SECTION 4: GOVERNANCE, EARNINGS & PRICE STRUCTURE */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Governance, Earnings & Momentum Traps</span>
                  </div>
                </div>

                {/* 10. High Promoter Pledge */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  rules.exclude_high_pledge ? "bg-white border-slate-300" : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
                      <input
                        type="checkbox"
                        checked={rules.exclude_high_pledge}
                        onChange={(e) => handleRuleChange("exclude_high_pledge", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>🚫 Exclude High Promoter Pledge (&gt; {rules.max_promoter_pledge}%)</span>
                    </label>
                    {rules.exclude_high_pledge && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{preview.rule_impact?.exclude_high_pledge || 0} stocks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Prevents margin-call crashes caused by forced lender offloading.
                  </p>
                  {rules.exclude_high_pledge && (
                    <div className="mt-2.5 pl-6 flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600">Pledge Ceiling:</span>
                      <select
                        value={Number(rules.max_promoter_pledge).toString()}
                        onChange={(e) => handleRuleChange("max_promoter_pledge", parseFloat(e.target.value))}
                        className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-hidden cursor-pointer"
                      >
                        <option value="15">15.0% (Strict)</option>
                        <option value="25">25.0% (Standard Default)</option>
                        <option value="35">35.0% (Relaxed)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 11. 52-Week Low Fallers */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  rules.exclude_52w_low_fallers ? "bg-white border-slate-300" : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
                      <input
                        type="checkbox"
                        checked={rules.exclude_52w_low_fallers}
                        onChange={(e) => handleRuleChange("exclude_52w_low_fallers", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>🚫 Exclude 52-Week Low Trappers</span>
                    </label>
                    {rules.exclude_52w_low_fallers && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{preview.rule_impact?.exclude_52w_low_fallers || 0} stocks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Filters out stocks trading near 52-week lows or in severe multi-month structural breakdowns.
                  </p>
                </div>

                {/* 12. Choppy Breakout Traps */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  rules.exclude_choppy_traps ? "bg-white border-slate-300" : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
                      <input
                        type="checkbox"
                        checked={rules.exclude_choppy_traps}
                        onChange={(e) => handleRuleChange("exclude_choppy_traps", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>🚫 Exclude Choppy False-Breakout Traps</span>
                    </label>
                    {rules.exclude_choppy_traps && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{preview.rule_impact?.exclude_choppy_traps || 0} stocks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Disqualifies stocks exhibiting high whipsaw frequency and low empirical audit reliability.
                  </p>
                </div>

                {/* 13. Loss-Making Companies */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  rules.exclude_loss_makers ? "bg-white border-slate-300" : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
                      <input
                        type="checkbox"
                        checked={rules.exclude_loss_makers}
                        onChange={(e) => handleRuleChange("exclude_loss_makers", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>🚫 Exclude Net Loss-Making Companies (PAT &le; 0)</span>
                    </label>
                    {rules.exclude_loss_makers && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{preview.rule_impact?.exclude_loss_makers || 0} stocks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Excludes companies burning cash with negative bottom-line profit after tax.
                  </p>
                </div>

                {/* 14. Low Promoter Holding */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  rules.exclude_low_promoter_holding ? "bg-white border-slate-300" : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
                      <input
                        type="checkbox"
                        checked={rules.exclude_low_promoter_holding}
                        onChange={(e) => handleRuleChange("exclude_low_promoter_holding", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>🚫 Exclude Low Promoter Holding (&lt; {rules.min_promoter_holding}%)</span>
                    </label>
                    {rules.exclude_low_promoter_holding && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{preview.rule_impact?.exclude_low_promoter_holding || 0} stocks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Filters ownerless or operator-dominated shells with insufficient promoter stake.
                  </p>
                </div>

              </div>

            </div>

          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-slate-600">
            Once confirmed, only the <span className="font-bold text-emerald-700">{preview.eligible_count.toLocaleString()} eligible stocks</span> will be scanned for live recommendations.
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={applying}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmAndActivate}
              disabled={applying || preview.eligible_count === 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {applying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Activating Universe...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Activate Universe ({preview.eligible_count.toLocaleString()} Stocks)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
