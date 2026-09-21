"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Plus,
  Copy,
  Trash2,
  Save,
  ArrowRight,
  ArrowLeft,
  Info,
  Clock,
  Zap,
  BarChart3,
  Eye,
  Lock,
  ChevronDown,
  Activity,
  Check,
  Scale,
  DollarSign,
  Sliders,
  Settings2,
  FileText,
  XCircle,
  PowerOff,
  Sunrise,
  Sun,
  Sunset,
  Award,
  Target,
  Flame,
  Compass,
  Gauge,
  Percent,
  ChevronRight,
  ShieldAlert,
  Calendar
} from "lucide-react";
import { ExcludedStocksModal } from "./ExcludedStocksModal";

export interface SessionPrioritySettings {
  session_name: string;
  time_window: string;
  max_recommendations: number;
  lookback_days: number;
  stat_measure: "AVERAGE" | "MEDIAN" | "75TH_PERCENTILE";
  min_per_day_high_gain_pct: number;
  max_per_day_low_dip_pct: number;
  min_win_rate_pct: number;
  min_rvol: number;
  max_base_compression_pct: number;
  min_hurst_exponent: number;
  min_adr_pct: number;
  min_turnover_cr: number;
  max_trap_rate_pct: number;
  priority_ranking_criterion: "RISE_DIP_RATIO" | "CONFLUENCE_SCORE" | "WIN_RATE" | "RVOL" | "ADR";
}

export interface BlockEPriorityRules {
  enabled: boolean;
  status?: string;
  title?: string;
  description?: string;
  vwap_bounce?: {
    enabled: boolean;
    max_distance_pct: number;
    bounce_candles: number;
  };
  orderbook_imbalance?: {
    enabled: boolean;
    buy_sell_ratio: number;
    depth_levels: number;
    ask_sweeps: boolean;
  };
  breakout_retest?: {
    enabled: boolean;
    retest_hold_mins: number;
    pullback_tolerance_pct: number;
  };
  relative_strength?: {
    enabled: boolean;
    min_outperformance_pct: number;
    benchmark: string;
  };
  rise_dip_ratio?: {
    enabled: boolean;
    min_ratio: number;
    lookback_days: number;
    metric: "MEDIAN" | "AVERAGE";
  };
  session_quotas?: {
    enabled: boolean;
    morning_cap: number;
    midday_cap: number;
    day_end_cap: number;
  };
  sessions: {
    morning: SessionPrioritySettings;
    afternoon: SessionPrioritySettings;
    day_end: SessionPrioritySettings;
  };
}

export const DEFAULT_PRIORITY_RULES: BlockEPriorityRules = {
  enabled: true,
  status: "ACTIVE",
  title: "Priority Rules & Session Allocator",
  description: "High-conviction institutional execution rules including VWAP Bounce, Order Book Imbalance, Breakout Retest, and Relative Strength.",
  vwap_bounce: {
    enabled: true,
    max_distance_pct: 0.5,
    bounce_candles: 1
  },
  orderbook_imbalance: {
    enabled: true,
    buy_sell_ratio: 2.0,
    depth_levels: 5,
    ask_sweeps: true
  },
  breakout_retest: {
    enabled: true,
    retest_hold_mins: 2,
    pullback_tolerance_pct: 0.4
  },
  relative_strength: {
    enabled: true,
    min_outperformance_pct: 0.5,
    benchmark: "NIFTY50"
  },
  rise_dip_ratio: {
    enabled: true,
    min_ratio: 2.0,
    lookback_days: 45,
    metric: "MEDIAN"
  },
  session_quotas: {
    enabled: true,
    morning_cap: 5,
    midday_cap: 3,
    day_end_cap: 4
  },
  sessions: {
    morning: {
      session_name: "Morning Breakout",
      time_window: "09:15 - 11:30 AM",
      max_recommendations: 5,
      lookback_days: 60,
      stat_measure: "AVERAGE",
      min_per_day_high_gain_pct: 1.5,
      max_per_day_low_dip_pct: 0.8,
      min_win_rate_pct: 65.0,
      min_rvol: 1.5,
      max_base_compression_pct: 2.0,
      min_hurst_exponent: 0.55,
      min_adr_pct: 2.5,
      min_turnover_cr: 2.0,
      max_trap_rate_pct: 20.0,
      priority_ranking_criterion: "RISE_DIP_RATIO"
    },
    afternoon: {
      session_name: "Midday Absorption",
      time_window: "11:30 AM - 01:45 PM",
      max_recommendations: 3,
      lookback_days: 60,
      stat_measure: "MEDIAN",
      min_per_day_high_gain_pct: 1.8,
      max_per_day_low_dip_pct: 0.7,
      min_win_rate_pct: 70.0,
      min_rvol: 1.8,
      max_base_compression_pct: 1.8,
      min_hurst_exponent: 0.58,
      min_adr_pct: 2.8,
      min_turnover_cr: 3.0,
      max_trap_rate_pct: 15.0,
      priority_ranking_criterion: "CONFLUENCE_SCORE"
    },
    day_end: {
      session_name: "Power Hour Sweep",
      time_window: "01:45 - 03:30 PM",
      max_recommendations: 4,
      lookback_days: 45,
      stat_measure: "AVERAGE",
      min_per_day_high_gain_pct: 2.0,
      max_per_day_low_dip_pct: 0.9,
      min_win_rate_pct: 65.0,
      min_rvol: 2.0,
      max_base_compression_pct: 2.2,
      min_hurst_exponent: 0.56,
      min_adr_pct: 3.0,
      min_turnover_cr: 5.0,
      max_trap_rate_pct: 18.0,
      priority_ranking_criterion: "RVOL"
    }
  }
};

interface BlockAFilters {
  enabled: boolean;
  exclude_penny: boolean;
  min_price: number;
  exclude_illiquid: boolean;
  min_volume: number;
  volume_lookback_days: number;
  volume_calc_type: "MEDIAN" | "AVERAGE";
  exclude_low_turnover: boolean;
  min_turnover_cr: number;
  exclude_surveillance_sme: boolean;
  exclude_non_equity: boolean;
  exclude_circuit_trappers: boolean;
  exclude_high_debt: boolean;
  max_debt_to_equity: number;
  exclude_bankruptcy_distress: boolean;
  min_altman_z: number;
  exclude_weak_piotroski: boolean;
  min_piotroski: number;
  exclude_high_pledge: boolean;
  max_promoter_pledge: number;
  exclude_low_promoter_holding: boolean;
  min_promoter_holding: number;
  exclude_loss_makers: boolean;
  exclude_negative_cfo: boolean;
  exclude_52w_low_fallers: boolean;
  exclude_choppy_traps: boolean;
  // Dynamic Market Regime & Volatility Squeeze (X1)
  market_regime_filter?: {
    enabled: boolean;
    index_symbol: string;
    require_above_open: boolean;
    require_above_dma20: boolean;
    pause_on_heavy_red: boolean;
  };
  volatility_squeeze?: {
    enabled: boolean;
    max_3d_range_pct: number;
    volume_dryup_threshold: number;
  };
}

export interface DayGuardrailSettings {
  enabled: boolean;
  max_vwap_distance_pct: number;
  max_gap_open_pct: number;
  min_open_cushion_pct: number;
  min_bar_turnover_lakhs: number;
  require_volume_expansion: boolean;
  min_volume_expansion_ratio: number;
  require_coiling_base: boolean;
  max_base_compression_pct: number;
  circuit_safety_buffer_pct: number;
  max_bid_ask_spread_pct: number;
  min_win_rate_floor: number;
  max_retrace_atr_ratio: number;
  nifty_anti_chop_filter: boolean;
}

export const DEFAULT_DAY_GUARDRAILS: Record<string, DayGuardrailSettings> = {
  MON: {
    enabled: true,
    max_vwap_distance_pct: 1.2,
    max_gap_open_pct: 3.5,
    min_open_cushion_pct: 0.5,
    min_bar_turnover_lakhs: 2.5,
    require_volume_expansion: true,
    min_volume_expansion_ratio: 1.5,
    require_coiling_base: true,
    max_base_compression_pct: 3.0,
    circuit_safety_buffer_pct: 1.5,
    max_bid_ask_spread_pct: 0.15,
    min_win_rate_floor: 50,
    max_retrace_atr_ratio: 1.2,
    nifty_anti_chop_filter: true,
  },
  TUE: {
    enabled: true,
    max_vwap_distance_pct: 1.4,
    max_gap_open_pct: 4.0,
    min_open_cushion_pct: 0.5,
    min_bar_turnover_lakhs: 2.5,
    require_volume_expansion: true,
    min_volume_expansion_ratio: 1.5,
    require_coiling_base: true,
    max_base_compression_pct: 3.0,
    circuit_safety_buffer_pct: 1.5,
    max_bid_ask_spread_pct: 0.15,
    min_win_rate_floor: 50,
    max_retrace_atr_ratio: 1.2,
    nifty_anti_chop_filter: true,
  },
  WED: {
    enabled: true,
    max_vwap_distance_pct: 1.2,
    max_gap_open_pct: 3.5,
    min_open_cushion_pct: 0.5,
    min_bar_turnover_lakhs: 2.5,
    require_volume_expansion: true,
    min_volume_expansion_ratio: 1.5,
    require_coiling_base: true,
    max_base_compression_pct: 3.0,
    circuit_safety_buffer_pct: 1.5,
    max_bid_ask_spread_pct: 0.15,
    min_win_rate_floor: 50,
    max_retrace_atr_ratio: 1.2,
    nifty_anti_chop_filter: true,
  },
  THU: {
    enabled: true,
    max_vwap_distance_pct: 0.9,
    max_gap_open_pct: 2.5,
    min_open_cushion_pct: 0.7,
    min_bar_turnover_lakhs: 4.0,
    require_volume_expansion: true,
    min_volume_expansion_ratio: 2.0,
    require_coiling_base: true,
    max_base_compression_pct: 2.5,
    circuit_safety_buffer_pct: 2.0,
    max_bid_ask_spread_pct: 0.12,
    min_win_rate_floor: 55,
    max_retrace_atr_ratio: 1.0,
    nifty_anti_chop_filter: true,
  },
  FRI: {
    enabled: true,
    max_vwap_distance_pct: 1.0,
    max_gap_open_pct: 3.0,
    min_open_cushion_pct: 0.6,
    min_bar_turnover_lakhs: 3.0,
    require_volume_expansion: true,
    min_volume_expansion_ratio: 1.8,
    require_coiling_base: true,
    max_base_compression_pct: 2.5,
    circuit_safety_buffer_pct: 2.0,
    max_bid_ask_spread_pct: 0.12,
    min_win_rate_floor: 55,
    max_retrace_atr_ratio: 1.1,
    nifty_anti_chop_filter: true,
  },
};

export interface BlockIKnockoutGuardrails {
  enabled: boolean;
  status?: string;
  title?: string;
  description?: string;
  max_vwap_distance_pct?: number;
  max_gap_open_pct?: number;
  min_open_cushion_pct?: number;
  min_bar_turnover_lakhs?: number;
  require_volume_expansion?: boolean;
  min_volume_expansion_ratio?: number;
  require_coiling_base?: boolean;
  max_base_compression_pct?: number;
  circuit_safety_buffer_pct?: number;
  max_bid_ask_spread_pct?: number;
  min_win_rate_floor?: number;
  max_retrace_atr_ratio?: number;
  nifty_anti_chop_filter?: boolean;
  allowed_entry_days?: string[];
  blocked_days_message?: string;
  days?: Record<string, DayGuardrailSettings>;
  rules_enabled?: Record<string, boolean>;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  horizon?: "INTRADAY" | "BTST_1_2_DAYS" | "SWING_1W_3M" | "LONG_TERM_3M_PLUS";
  is_default?: boolean;
  is_active?: boolean;
  created_at?: number;
  updated_at?: number;
  target_pct?: number;
  stop_loss_pct?: number;
  block_a_morning_filters: BlockAFilters;
  block_i_knockout_guardrails?: BlockIKnockoutGuardrails;
  block_b_current_params?: {
    enabled: boolean;
    status: string;
    title: string;
    description: string;
    min_current_score?: number;
    max_vwap_distance_pct?: number;
    require_volume_expansion?: boolean;
    require_coiling_base?: boolean;
    scoring_mode?: "DIRECT_POINTS" | "DISCRETE_SCORES";
    rules?: DynamicScoringRule[];
  };
  block_c_validate_history?: {
    enabled: boolean;
    status: string;
    title: string;
    description: string;
    min_history_score?: number;
    min_win_rate_pct?: number;
    max_retrace_atr_ratio?: number;
    require_clean_trend?: boolean;
    scoring_mode?: "DIRECT_POINTS" | "DISCRETE_SCORES";
    rules?: DynamicScoringRule[];
  };
  block_d_ai_vision?: {
    enabled: boolean;
    status: string;
    title: string;
    description: string;
    min_vision_score?: number;
    veto_overhead_resistance?: boolean;
    veto_overextended_wicks?: boolean;
  };
  block_e_priority_rules?: BlockEPriorityRules;
  block_f_execution_gate?: BlockFExecutionGate;
}

export type RangeOperator = "BETWEEN" | "GTE" | "LTE" | "STATE";

export interface DynamicRangeOption {
  id: string;
  label: string;
  min_val?: number;
  max_val?: number;
  state_val?: string;
  score: number; // user sets: +3, +2, +1, 0, -1, -2, -3
  operator?: RangeOperator; // optional for backwards compatibility
}

export interface DynamicRangeBand {
  label: string;
  range_text: string;
  points: number;
  tier: "optimal" | "moderate" | "suboptimal";
}

export interface DynamicScoringRule {
  id: string;
  name: string;
  desc: string;
  category: string;
  unit: string;
  type: "numeric" | "state";
  enabled: boolean;
  options: DynamicRangeOption[];
  bands?: DynamicRangeBand[];
  max_points?: number;
}

export const SCORE_CHOICES = [3, 2, 1, 0, -1, -2, -3];

export function normalizeDynamicRule(r: any): DynamicScoringRule {
  if (r.options && Array.isArray(r.options) && r.options.length > 0) {
    return {
      ...r,
      unit: r.unit || "%",
      type: r.type || "numeric",
      enabled: r.enabled !== false,
      options: r.options.map((opt: any, idx: number) => ({
        id: opt.id || `opt_${idx + 1}`,
        label: opt.label !== undefined ? opt.label : `Option ${idx + 1}`,
        min_val: opt.min_val !== undefined ? Number(opt.min_val) : 0,
        max_val: opt.max_val !== undefined ? Number(opt.max_val) : (opt.min_val !== undefined ? Number(opt.min_val) + 1 : 1),
        state_val: opt.state_val || "",
        score: typeof opt.score === "number" ? opt.score : 0
      }))
    };
  }

  // Backwards compatibility migration from 3 bands
  if (r.bands && Array.isArray(r.bands)) {
    const opts: DynamicRangeOption[] = r.bands.map((b: any, bIdx: number) => {
      const txt = String(b.range_text || "");
      const nums = txt.match(/[-+]?\d*\.?\d+/g)?.map(Number) || [];

      if (nums.length >= 2) {
        return {
          id: `opt_${bIdx + 1}`,
          label: b.label || `Option ${bIdx + 1}`,
          min_val: nums[0],
          max_val: nums[1],
          score: 0
        };
      } else if (nums.length === 1) {
        return {
          id: `opt_${bIdx + 1}`,
          label: b.label || `Option ${bIdx + 1}`,
          min_val: nums[0],
          max_val: nums[0] + 1,
          score: 0
        };
      } else {
        return {
          id: `opt_${bIdx + 1}`,
          label: b.label || `Option ${bIdx + 1}`,
          state_val: txt,
          score: 0
        };
      }
    });

    return {
      id: r.id,
      name: r.name,
      desc: r.desc,
      category: r.category,
      unit: "%",
      type: "numeric",
      enabled: r.enabled !== false,
      options: opts
    };
  }

  return r as DynamicScoringRule;
}

export const DEFAULT_PILLAR_C_RULES: DynamicScoringRule[] = [
  {
    id: "c_vwap_proximity",
    name: "Proximity to Value / VWAP Anchor",
    desc: "Strictly prevents buying overextended green candles. Ensures entry occurs within safe distance to the VWAP anchor.",
    category: "Value & Location",
    unit: "%",
    type: "numeric",
    enabled: true,
    options: [
      { id: "c_vwap_opt_1", label: "Sweet Spot", min_val: 0.0, max_val: 0.8, score: 3 },
      { id: "c_vwap_opt_2", label: "Moderate Extension", min_val: 0.8, max_val: 1.2, score: 1 },
      { id: "c_vwap_opt_3", label: "Overextended", min_val: 1.2, max_val: 3.0, score: -2 }
    ]
  },
  {
    id: "c_volume_surge",
    name: "3-Min Volume Expansion Surge",
    desc: "Demands an immediate influx of trading volume on the setup trigger candle compared to 20-candle average.",
    category: "Volume & Liquidity",
    unit: "x",
    type: "numeric",
    enabled: true,
    options: [
      { id: "c_vol_opt_1", label: "Surge Spike", min_val: 2.5, max_val: 10.0, score: 3 },
      { id: "c_vol_opt_2", label: "Moderate Volume", min_val: 1.5, max_val: 2.5, score: 1 },
      { id: "c_vol_opt_3", label: "Low Volume", min_val: 0.0, max_val: 1.5, score: -2 }
    ]
  },
  {
    id: "c_base_coiling",
    name: "Pre-Breakout Coiling Base Compression",
    desc: "Ensures price has consolidated tightly in a narrow base before attempting to break out.",
    category: "Price Structure",
    unit: "%",
    type: "numeric",
    enabled: true,
    options: [
      { id: "c_base_opt_1", label: "Tight Base", min_val: 0.0, max_val: 1.5, score: 3 },
      { id: "c_base_opt_2", label: "Moderate Base", min_val: 1.5, max_val: 2.5, score: 1 },
      { id: "c_base_opt_3", label: "Loose Base", min_val: 2.5, max_val: 6.0, score: -2 }
    ]
  },
  {
    id: "c_supertrend",
    name: "SuperTrend (7, 3) Bullish Direction",
    desc: "SuperTrend indicator confirms upward directional bias on 1-min and 5-min candles.",
    category: "Trend Direction",
    unit: "state",
    type: "state",
    enabled: true,
    options: [
      { id: "c_st_opt_1", label: "Dual Bullish", state_val: "Bullish on 1m & 5m", score: 3 },
      { id: "c_st_opt_2", label: "5m Only", state_val: "Bullish on 5m only", score: 1 },
      { id: "c_st_opt_3", label: "Bearish / Neutral", state_val: "Bearish or Neutral", score: -3 }
    ]
  },
  {
    id: "c_rsi_sweet_spot",
    name: "RSI Momentum Sweet Spot (14)",
    desc: "RSI reflects bullish momentum without entering extreme blow-off overbought exhaustion.",
    category: "Momentum",
    unit: "pts",
    type: "numeric",
    enabled: true,
    options: [
      { id: "c_rsi_opt_1", label: "Bullish Sweet Spot", min_val: 55.0, max_val: 68.0, score: 3 },
      { id: "c_rsi_opt_2", label: "Moderate Momentum", min_val: 48.0, max_val: 55.0, score: 1 },
      { id: "c_rsi_opt_3", label: "Exhausted / Bearish", min_val: 68.0, max_val: 100.0, score: -2 }
    ]
  },
  {
    id: "c_opening_range_breakout_bias",
    name: "Opening Range Breakout (ORB) Bias",
    desc: "Position of price relative to the high of the first 15 or 30 minutes of trading.",
    category: "Intraday Microstructure",
    unit: "%",
    type: "numeric",
    enabled: true,
    options: [
      { id: "c_orb_opt_1", label: "Clean ORB Breakout", min_val: 0.3, max_val: 2.5, score: 3 },
      { id: "c_orb_opt_2", label: "Testing Range High", min_val: 0.0, max_val: 0.3, score: 1 },
      { id: "c_orb_opt_3", label: "Inside / Below Range", min_val: -5.0, max_val: 0.0, score: -2 }
    ]
  },
  {
    id: "c_rvol_threshold",
    name: "Relative Volume (RVOL) Multiple",
    desc: "Session trading volume divided by expected time-of-day historical volume benchmark.",
    category: "Volume & Liquidity",
    unit: "x",
    type: "numeric",
    enabled: true,
    options: [
      { id: "c_rvol_opt_1", label: "Heavy Institutional RVOL", min_val: 2.5, max_val: 10.0, score: 3 },
      { id: "c_rvol_opt_2", label: "Moderate Activity", min_val: 1.5, max_val: 2.5, score: 1 },
      { id: "c_rvol_opt_3", label: "Sub-par RVOL", min_val: 0.0, max_val: 1.5, score: -2 }
    ]
  },
  {
    id: "c_ema_alignment_stack",
    name: "EMA Trend Alignment (9 > 21 > 50)",
    desc: "Short, medium, and long exponential moving averages ordered sequentially upward.",
    category: "Trend Direction",
    unit: "state",
    type: "state",
    enabled: false,
    options: [
      { id: "c_ema_opt_1", label: "Full Bullish Stack", state_val: "9 > 21 > 50 EMA Stacked", score: 3 },
      { id: "c_ema_opt_2", label: "Partial Stack", state_val: "9 > 21 Above 50 EMA", score: 1 },
      { id: "c_ema_opt_3", label: "Tangled / Bearish", state_val: "EMAs Tangled or Inverted", score: -2 }
    ]
  },
  {
    id: "c_turnover_velocity",
    name: "Turnover Velocity per Minute",
    desc: "Rupee value transacted per minute showing sustained institutional money flow.",
    category: "Volume & Liquidity",
    unit: "Cr/m",
    type: "numeric",
    enabled: false,
    options: [
      { id: "c_turn_opt_1", label: "High Velocity", min_val: 0.5, max_val: 5.0, score: 3 },
      { id: "c_turn_opt_2", label: "Moderate Velocity", min_val: 0.2, max_val: 0.5, score: 1 },
      { id: "c_turn_opt_3", label: "Slow Flow", min_val: 0.0, max_val: 0.2, score: -1 }
    ]
  },
  {
    id: "c_adx_trend_strength",
    name: "ADX Trend Strength (14)",
    desc: "Average Directional Index quantifying trend conviction regardless of direction.",
    category: "Price Structure",
    unit: "pts",
    type: "numeric",
    enabled: false,
    options: [
      { id: "c_adx_opt_1", label: "Strong Trend", min_val: 25.0, max_val: 60.0, score: 3 },
      { id: "c_adx_opt_2", label: "Developing Trend", min_val: 18.0, max_val: 25.0, score: 1 },
      { id: "c_adx_opt_3", label: "Choppy Market", min_val: 0.0, max_val: 18.0, score: -2 }
    ]
  },
  {
    id: "c_donchian_breakout_band",
    name: "Donchian 20-Period High Breakout",
    desc: "Proximity to the highest high of the previous 20 candles.",
    category: "Volatility & Noise",
    unit: "%",
    type: "numeric",
    enabled: false,
    options: [
      { id: "c_don_opt_1", label: "New 20-High Break", min_val: 0.0, max_val: 1.0, score: 3 },
      { id: "c_don_opt_2", label: "Within 1% of High", min_val: -1.0, max_val: 0.0, score: 1 },
      { id: "c_don_opt_3", label: "Well Below High", min_val: -10.0, max_val: -1.0, score: -1 }
    ]
  },
  {
    id: "c_hurst_exponent_persistence",
    name: "Hurst Exponent Trend Persistence",
    desc: "Statistical metric distinguishing genuine trending behavior (H > 0.55) from mean reversion.",
    category: "Volatility & Noise",
    unit: "H",
    type: "numeric",
    enabled: false,
    options: [
      { id: "c_hurst_opt_1", label: "Persistent Trend", min_val: 0.6, max_val: 1.0, score: 3 },
      { id: "c_hurst_opt_2", label: "Mild Trend", min_val: 0.5, max_val: 0.6, score: 1 },
      { id: "c_hurst_opt_3", label: "Mean Reverting", min_val: 0.0, max_val: 0.5, score: -2 }
    ]
  },
  {
    id: "c_macd_histogram_momentum",
    name: "MACD Histogram Momentum Slope",
    desc: "Rate of change of the MACD histogram showing accelerating buying pressure.",
    category: "Momentum",
    unit: "state",
    type: "state",
    enabled: false,
    options: [
      { id: "c_macd_opt_1", label: "Accelerating Bullish", state_val: "Positive & Expanding", score: 3 },
      { id: "c_macd_opt_2", label: "Positive Flattening", state_val: "Positive Flat", score: 1 },
      { id: "c_macd_opt_3", label: "Negative / Contracting", state_val: "Negative", score: -2 }
    ]
  },
  {
    id: "c_parabolic_sar_step",
    name: "Parabolic SAR (0.02, 0.2) Support",
    desc: "Trailing stop dots aligned comfortably beneath recent price action.",
    category: "Trend Direction",
    unit: "state",
    type: "state",
    enabled: false,
    options: [
      { id: "c_sar_opt_1", label: "Dots Below Price", state_val: "Dots Below (Bullish)", score: 3 },
      { id: "c_sar_opt_2", label: "Dots Flipping", state_val: "Dots Testing (Neutral)", score: 1 },
      { id: "c_sar_opt_3", label: "Dots Above Price", state_val: "Dots Above (Bearish)", score: -2 }
    ]
  },
  {
    id: "c_stochastic_rsi_cycle",
    name: "Stochastic RSI %K / %D Cross",
    desc: "Fast cyclical turning points confirming momentum cycle inflection.",
    category: "Momentum",
    unit: "%",
    type: "numeric",
    enabled: false,
    options: [
      { id: "c_stoch_opt_1", label: "Bullish Cycle Turn", min_val: 20.0, max_val: 60.0, score: 3 },
      { id: "c_stoch_opt_2", label: "Extended Bullish", min_val: 60.0, max_val: 80.0, score: 1 },
      { id: "c_stoch_opt_3", label: "Overbought Cycle", min_val: 80.0, max_val: 100.0, score: -1 }
    ]
  },
  {
    id: "c_bollinger_band_pinch",
    name: "Bollinger Band Pinch Squeeze",
    desc: "Bandwidth narrowing indicating volatility contraction before breakout.",
    category: "Volatility & Noise",
    unit: "%",
    type: "numeric",
    enabled: false,
    options: [
      { id: "c_bb_opt_1", label: "Extreme Squeeze", min_val: 0.0, max_val: 1.5, score: 3 },
      { id: "c_bb_opt_2", label: "Moderate Squeeze", min_val: 1.5, max_val: 3.0, score: 1 },
      { id: "c_bb_opt_3", label: "Wide Bands", min_val: 3.0, max_val: 10.0, score: -1 }
    ]
  },
  {
    id: "c_atr_expansion_ratio",
    name: "ATR Multiplier Expansion",
    desc: "Candle body expansion relative to recent Average True Range.",
    category: "Volatility & Noise",
    unit: "x",
    type: "numeric",
    enabled: false,
    options: [
      { id: "c_atr_opt_1", label: "Strong Expansion", min_val: 1.8, max_val: 5.0, score: 3 },
      { id: "c_atr_opt_2", label: "Normal Expansion", min_val: 1.0, max_val: 1.8, score: 1 },
      { id: "c_atr_opt_3", label: "Sub-ATR", min_val: 0.0, max_val: 1.0, score: -1 }
    ]
  },
  {
    id: "c_range_compression_ratio",
    name: "Range Compression Ratio",
    desc: "Ratio of 3-candle range to 20-candle average demonstrating volatility squeeze.",
    category: "Price Structure",
    unit: "ratio",
    type: "numeric",
    enabled: false,
    options: [
      { id: "c_comp_opt_1", label: "Tight Compression", min_val: 0.1, max_val: 0.5, score: 3 },
      { id: "c_comp_opt_2", label: "Average Range", min_val: 0.5, max_val: 0.8, score: 1 },
      { id: "c_comp_opt_3", label: "Wide / Dispersed", min_val: 0.8, max_val: 2.0, score: -1 }
    ]
  },
  {
    id: "c_tape_orderflow_imbalance",
    name: "Tape Orderflow Bid-Ask Imbalance",
    desc: "Ratio of aggressive market buyers absorbing resting asks.",
    category: "Intraday Microstructure",
    unit: "%",
    type: "numeric",
    enabled: false,
    options: [
      { id: "c_tape_opt_1", label: "Heavy Bid Dominance", min_val: 60.0, max_val: 95.0, score: 3 },
      { id: "c_tape_opt_2", label: "Slight Bid Lead", min_val: 50.0, max_val: 60.0, score: 1 },
      { id: "c_tape_opt_3", label: "Ask Heavy", min_val: 0.0, max_val: 50.0, score: -2 }
    ]
  }
];

export const DEFAULT_PILLAR_H_RULES: DynamicScoringRule[] = [
  {
    id: "h_win_rate",
    name: "45-Day Historical Breakout Win Rate",
    desc: "Requires empirical target hit success rate across past 20 similar setups.",
    category: "Historical Hit Rate",
    unit: "%",
    type: "numeric",
    enabled: true,
    options: [
      { id: "h_win_opt_1", label: "High Hit Rate", min_val: 65.0, max_val: 100.0, score: 3 },
      { id: "h_win_opt_2", label: "Moderate Win Rate", min_val: 55.0, max_val: 65.0, score: 1 },
      { id: "h_win_opt_3", label: "Unreliable Hit Rate", min_val: 0.0, max_val: 55.0, score: -2 }
    ]
  },
  {
    id: "h_max_pullback_atr",
    name: "Adverse Excursion Drawdown (Max Pullback)",
    desc: "Measures deepest dip relative to ATR before stock targets are achieved.",
    category: "Drawdown Risk",
    unit: "x",
    type: "numeric",
    enabled: true,
    options: [
      { id: "h_draw_opt_1", label: "Shallow Dip", min_val: 0.0, max_val: 0.8, score: 3 },
      { id: "h_draw_opt_2", label: "Normal Retrace", min_val: 0.8, max_val: 1.2, score: 1 },
      { id: "h_draw_opt_3", label: "Deep Shakeout", min_val: 1.2, max_val: 3.0, score: -2 }
    ]
  },
  {
    id: "h_profit_factor",
    name: "Historical Profit Factor (Gross Wins / Losses)",
    desc: "Ratio of cumulative historical gains to cumulative losses across backtest window.",
    category: "Risk-Adjusted Edge",
    unit: "ratio",
    type: "numeric",
    enabled: true,
    options: [
      { id: "h_pf_opt_1", label: "Exceptional Edge", min_val: 2.2, max_val: 10.0, score: 3 },
      { id: "h_pf_opt_2", label: "Positive Edge", min_val: 1.4, max_val: 2.2, score: 1 },
      { id: "h_pf_opt_3", label: "Sub-par Edge", min_val: 0.0, max_val: 1.4, score: -2 }
    ]
  },
  {
    id: "h_morning_momentum_win_rate",
    name: "Morning Session Win Rate (9:15–11:00)",
    desc: "Historical performance specifically during the morning momentum drive window.",
    category: "Session Edge",
    unit: "%",
    type: "numeric",
    enabled: true,
    options: [
      { id: "h_morn_opt_1", label: "Strong Morning Edge", min_val: 65.0, max_val: 100.0, score: 3 },
      { id: "h_morn_opt_2", label: "Average Morning Edge", min_val: 50.0, max_val: 65.0, score: 1 },
      { id: "h_morn_opt_3", label: "Morning Trap Stock", min_val: 0.0, max_val: 50.0, score: -2 }
    ]
  },
  {
    id: "h_trap_failure_rate",
    name: "False Breakout Trap Rate",
    desc: "Frequency at which historical breakouts failed and reversed back through breakout price.",
    category: "Drawdown Risk",
    unit: "%",
    type: "numeric",
    enabled: true,
    options: [
      { id: "h_trap_opt_1", label: "Clean Follow-Through", min_val: 0.0, max_val: 15.0, score: 3 },
      { id: "h_trap_opt_2", label: "Occasional Traps", min_val: 15.0, max_val: 25.0, score: 1 },
      { id: "h_trap_opt_3", label: "Chronic Trap Stock", min_val: 25.0, max_val: 100.0, score: -3 }
    ]
  },
  {
    id: "h_volume_confluence_ratio",
    name: "Volume Confluence Reliability",
    desc: "Percentage of historical winning trades that had volume above 2x at entry.",
    category: "Historical Hit Rate",
    unit: "%",
    type: "numeric",
    enabled: false,
    options: [
      { id: "h_vc_opt_1", label: "High Confluence", min_val: 70.0, max_val: 100.0, score: 3 },
      { id: "h_vc_opt_2", label: "Moderate Confluence", min_val: 50.0, max_val: 70.0, score: 1 },
      { id: "h_vc_opt_3", label: "Unreliable Volume", min_val: 0.0, max_val: 50.0, score: -1 }
    ]
  },
  {
    id: "h_hurst_backtest_persistence",
    name: "60-Day Hurst Trend Persistence",
    desc: "Average empirical Hurst exponent across past 60 trading days.",
    category: "Risk-Adjusted Edge",
    unit: "H",
    type: "numeric",
    enabled: false,
    options: [
      { id: "h_hp_opt_1", label: "Strongly Persistent", min_val: 0.65, max_val: 1.0, score: 3 },
      { id: "h_hp_opt_2", label: "Mildly Persistent", min_val: 0.55, max_val: 0.65, score: 1 },
      { id: "h_hp_opt_3", label: "Mean-Reverting Noise", min_val: 0.0, max_val: 0.55, score: -2 }
    ]
  },
  {
    id: "h_midday_chop_resilience",
    name: "Midday Chop Resilience (11:30–13:30)",
    desc: "Win rate when trades trigger during slower midday session.",
    category: "Session Edge",
    unit: "%",
    type: "numeric",
    enabled: false,
    options: [
      { id: "h_mid_opt_1", label: "Chop Resilient", min_val: 60.0, max_val: 100.0, score: 3 },
      { id: "h_mid_opt_2", label: "Average Midday", min_val: 45.0, max_val: 60.0, score: 1 },
      { id: "h_mid_opt_3", label: "Midday Bleeder", min_val: 0.0, max_val: 45.0, score: -2 }
    ]
  },
  {
    id: "h_adr_realization_rate",
    name: "Average Daily Range (ADR) Capture Rate",
    desc: "Percentage of historical days where stock achieves full ADR move.",
    category: "Historical Hit Rate",
    unit: "%",
    type: "numeric",
    enabled: false,
    options: [
      { id: "h_adr_opt_1", label: "High Range Capture", min_val: 70.0, max_val: 100.0, score: 3 },
      { id: "h_adr_opt_2", label: "Average Capture", min_val: 50.0, max_val: 70.0, score: 1 },
      { id: "h_adr_opt_3", label: "Compressed Moves", min_val: 0.0, max_val: 50.0, score: -1 }
    ]
  },
  {
    id: "h_volatility_adjusted_expectancy",
    name: "Volatility-Adjusted Edge Expectancy",
    desc: "Expected rupee value per trade normalized by historical volatility.",
    category: "Risk-Adjusted Edge",
    unit: "pts",
    type: "numeric",
    enabled: false,
    options: [
      { id: "h_exp_opt_1", label: "High Expectancy", min_val: 1.5, max_val: 5.0, score: 3 },
      { id: "h_exp_opt_2", label: "Positive Expectancy", min_val: 0.8, max_val: 1.5, score: 1 },
      { id: "h_exp_opt_3", label: "Negative Expectancy", min_val: -2.0, max_val: 0.8, score: -2 }
    ]
  },
  {
    id: "h_avg_trade_gain_loss",
    name: "Average Trade Gain-to-Loss Multiple",
    desc: "Average gain on winners divided by average loss on stopped trades.",
    category: "Risk-Adjusted Edge",
    unit: "ratio",
    type: "numeric",
    enabled: false,
    options: [
      { id: "h_gl_opt_1", label: "High Multiple", min_val: 2.0, max_val: 10.0, score: 3 },
      { id: "h_gl_opt_2", label: "Acceptable Multiple", min_val: 1.3, max_val: 2.0, score: 1 },
      { id: "h_gl_opt_3", label: "Poor Multiple", min_val: 0.0, max_val: 1.3, score: -2 }
    ]
  },
  {
    id: "h_consecutive_losses",
    name: "Max Consecutive Loss Streak",
    desc: "Worst historical streak of consecutive stop-outs in backtest window.",
    category: "Drawdown Risk",
    unit: "trades",
    type: "numeric",
    enabled: false,
    options: [
      { id: "h_loss_opt_1", label: "Short Streak (1-2)", min_val: 1.0, max_val: 2.0, score: 3 },
      { id: "h_loss_opt_2", label: "Average Streak (3)", min_val: 3.0, max_val: 3.0, score: 1 },
      { id: "h_loss_opt_3", label: "Long Streak (>4)", min_val: 4.0, max_val: 10.0, score: -3 }
    ]
  }
];

export interface BlockFExecutionGate {
  enabled: boolean;
  status?: string;
  title?: string;
  description?: string;
  hod_tolerance_ratio: number;
  min_rvol: number;
  require_above_vwap: boolean;
  max_vwap_distance_pct: number;
  max_base_compression_pct: number;
  min_candle_close_pos_pct: number;
  rules_enabled?: Record<string, boolean>;
  // Dynamic Risk & Trade Management (X2 & X3)
  dynamic_risk_reward?: {
    enabled: boolean;
    stop_loss_type: "ATR_BASED" | "FIXED_PCT" | "SWING_LOW";
    stop_loss_atr_mult: number;
    target_atr_mult: number;
    min_rr_ratio: number;
  };
  trade_management?: {
    enabled: boolean;
    breakeven_latch_pct: number;
    trailing_stop_enabled: boolean;
  };
}

export const DEFAULT_EXECUTION_GATE: BlockFExecutionGate = {
  enabled: true,
  status: "ACTIVE",
  title: "Execution Gate (Go / No-Go Breakout Trigger)",
  description: "Point-in-Time intraday breakout timing. Validates real-time Day High (HOD) breakout, relative volume expansion, and VWAP launchpad before elevating a CHA-passed stock to Live Recommendations.",
  hod_tolerance_ratio: 0.998,
  min_rvol: 1.2,
  require_above_vwap: true,
  max_vwap_distance_pct: 1.5,
  max_base_compression_pct: 2.5,
  min_candle_close_pos_pct: 65,
  rules_enabled: {
    p_hod_tolerance: true,
    p_1min_rvol: true,
    p_vwap_launchpad: true,
    p_base_compression: true,
    p_orderbook_depth: true,
    p_rise_dip_asymmetry: true,
    p_dynamic_risk_reward: true,
    p_trade_management: true,
  },
  dynamic_risk_reward: {
    enabled: true,
    stop_loss_type: "ATR_BASED",
    stop_loss_atr_mult: 1.5,
    target_atr_mult: 2.5,
    min_rr_ratio: 1.8
  },
  trade_management: {
    enabled: true,
    breakeven_latch_pct: 0.8,
    trailing_stop_enabled: true
  }
};

export const GUARDRAIL_RULES_LIST = [
  { id: "i_calendar", num: 1, name: "Trade Calendar Lock", tag: "Session Gate", desc: "Mon–Fri regular session (09:15–15:30 IST) trading gate" },
  { id: "i_series", num: 2, name: "Mainboard Series EQ Gate", tag: "Lot Liquidity", desc: "Mainboard EQ series only; excludes SME / BE / lot-size lockouts" },
  { id: "i_vwap_dist", num: 3, name: "Max VWAP Distance Buffer", tag: "Value Anchor", desc: "Rejects overextended candles trading too far above intraday VWAP" },
  { id: "i_vol_exp", num: 4, name: "3-Min Volume Expansion Surge", tag: "Volume Surge", desc: "Demands relative volume surge multiple (≥ 1.5x) on ignition candle" },
  { id: "i_coiling", num: 5, name: "Base Coiling Compression", tag: "Coil Compression", desc: "Requires tight consolidation base before expansion (≤ 3.0%)" },
  { id: "i_circuit", num: 6, name: "Circuit Safety Buffer", tag: "Upper Band", desc: "Safe distance from upper freeze price band (≥ 1.5% buffer)" },
  { id: "i_spread", num: 7, name: "Bid-Ask Spread & Slippage", tag: "Orderbook", desc: "Protects against illiquid book spread (≤ 0.15% maximum)" },
  { id: "i_hit_rate", num: 8, name: "60-Day Historical Hit Rate", tag: "Historical Proof", desc: "Enforces 60-day historical edge win rate floor (≥ 50%)" },
  { id: "i_retrace", num: 9, name: "Max Retracement ATR Ratio", tag: "Trend Pullback", desc: "Restricts deep retracements exceeding 1.2x ATR" },
  { id: "i_anti_chop", num: 10, name: "Nifty Anti-Chop Confluence", tag: "Market Confluence", desc: "Eliminates counter-trend entries during market whipsaws" },
  { id: "i_solvency", num: 11, name: "Solvency & ASM/GSM Safe", tag: "Credit Safety", desc: "Strictly excludes ASM, GSM surveillance, and insolvency risks" },
];

export const PRIORITY_RULES_LIST = [
  { id: "p_hod_tolerance", num: 1, name: "HOD Breakout Tolerance", tag: "Day High", desc: "Demands price to breach or test within 0.2% of High of Day (0.998)" },
  { id: "p_1min_rvol", num: 2, name: "1-Min RVOL Surge Multiple", tag: "Ignition RVOL", desc: "Breakout candle 1-min volume must exceed 15-min avg (≥ 1.2x)" },
  { id: "p_vwap_launchpad", num: 3, name: "VWAP Launchpad Confluence", tag: "Support Anchor", desc: "Price must hold strictly above intraday VWAP as support" },
  { id: "p_base_compression", num: 4, name: "Base Compression Range", tag: "Narrow Base", desc: "Tight base consolidation range (≤ 2.5%) prior to trigger" },
  { id: "p_orderbook_depth", num: 5, name: "Orderbook Depth Imbalance", tag: "Bid Power", desc: "Total buyer depth in market depth must exceed 55%" },
  { id: "p_rise_dip_asymmetry", num: 6, name: "Rise / Dip Asymmetry Ratio", tag: "Speed Advantage", desc: "Impulsive breakout move must be faster than consolidation dip (≥ 1.5)" },
  { id: "p_dynamic_risk_reward", num: 7, name: "Dynamic Risk-to-Reward Ratio", tag: "Risk Engine", desc: "Target to Stop Loss ratio must offer minimum 1.8:1 edge" },
  { id: "p_trade_management", num: 8, name: "Trade Management Disciplines", tag: "Exit Armor", desc: "Breakeven profit latch and ATR dynamic trailing stops enforced" },
];

interface RecoRulesViewProps {
  onNavigateToAudit?: () => void;
}

const DEFAULT_FILTERS: BlockAFilters = {
  enabled: true,
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
  exclude_choppy_traps: false
};

// Sleek modern iOS/macOS switch component
function IOSSwitch({
  checked,
  onChange,
  disabled = false
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
        disabled
          ? "bg-slate-200 cursor-not-allowed opacity-50"
          : checked
          ? "bg-emerald-500 hover:bg-emerald-600"
          : "bg-slate-300 hover:bg-slate-400/80"
      }`}
    >
      <div
        className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function RecoRulesView({ onNavigateToAudit }: RecoRulesViewProps) {
  // Navigation View State: "HUB" (Screen 1) | "STRATEGY_OVERVIEW" (Screen 2) | "BLOCK_DETAIL" (Screen 3)
  const [viewMode, setViewMode] = useState<"HUB" | "STRATEGY_OVERVIEW" | "BLOCK_DETAIL">("HUB");
  const [activeBlock, setActiveBlock] = useState<"BLOCK_A" | "BLOCK_I" | "BLOCK_B" | "BLOCK_C" | "BLOCK_D" | "BLOCK_E" | "BLOCK_F">("BLOCK_A");
  const [pillarCHSubTab, setPillarCHSubTab] = useState<"PILLAR_C" | "PILLAR_H">("PILLAR_C");
  const [prioritySessionTab, setPrioritySessionTab] = useState<"morning" | "afternoon" | "day_end">("morning");
  const [activeGuardrailDay, setActiveGuardrailDay] = useState<"MON" | "TUE" | "WED" | "THU" | "FRI">("MON");

  // Data states
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [activeStrategyId, setActiveStrategyId] = useState<string>("strat_institutional_momentum");
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Live preview counts for Block A filters
  const [previewCounts, setPreviewCounts] = useState<{
    master: number;
    eligible: number;
    ineligible: number;
    ruleImpact: Record<string, number>;
  }>({
    master: 5087,
    eligible: 299,
    ineligible: 4788,
    ruleImpact: {}
  });
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [excludedModal, setExcludedModal] = useState<{
    ruleId: string;
    ruleTitle: string;
    ruleThresholdText: string;
  } | null>(null);

  // Load strategies from backend
  const fetchStrategies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/recommendations/strategies");
      const data = await res.json();
      if (data && data.strategies) {
        setStrategies(data.strategies);
        const activeId = data.active_strategy_id || data.strategies[0]?.id;
        setActiveStrategyId(activeId);
        const activeObj = data.strategies.find((s: Strategy) => s.id === activeId) || data.strategies[0];
        setSelectedStrategy(activeObj);
      }
    } catch (e) {
      console.error("Error loading strategies:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  // Live Recalculate Block A preview counts
  const refreshPreviewCounts = useCallback(async (filters: BlockAFilters) => {
    if (!filters.enabled) {
      setPreviewCounts({
        master: 5087,
        eligible: 5087,
        ineligible: 0,
        ruleImpact: {}
      });
      return;
    }
    try {
      setPreviewLoading(true);
      const res = await fetch("/api/v1/recommendations/preview-exclusions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters)
      });
      const data = await res.json();
      if (data && data.status === "SUCCESS") {
        setPreviewCounts({
          master: data.master_count || 5087,
          eligible: data.eligible_count || 0,
          ineligible: data.ineligible_count || 0,
          ruleImpact: data.rule_impact || {}
        });
      }
    } catch (e) {
      console.error("Failed to preview exclusions:", e);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStrategy?.block_a_morning_filters) {
      refreshPreviewCounts(selectedStrategy.block_a_morning_filters);
    }
  }, [selectedStrategy?.block_a_morning_filters, refreshPreviewCounts]);

  // Open Strategy Overview (Screen 2)
  const handleOpenStrategy = (s: Strategy) => {
    setSelectedStrategy({ ...s });
    setViewMode("STRATEGY_OVERVIEW");
  };

  // Open Block Details (Screen 3)
  const handleOpenBlock = (blockKey: "BLOCK_A" | "BLOCK_I" | "BLOCK_B" | "BLOCK_C" | "BLOCK_D" | "BLOCK_E" | "BLOCK_F") => {
    setActiveBlock(blockKey);
    setViewMode("BLOCK_DETAIL");
  };

  const guardRules: BlockIKnockoutGuardrails = {
    enabled: true,
    status: "ACTIVE",
    title: "Knockout Guardrails (Pillar I)",
    description: "Hard binary vetoes protecting against buying overextended spikes far from VWAP, dry volume, or uncoiled bases.",
    max_vwap_distance_pct: 1.2,
    max_gap_open_pct: 3.5,
    min_open_cushion_pct: 0.5,
    min_bar_turnover_lakhs: 2.5,
    require_volume_expansion: true,
    min_volume_expansion_ratio: 1.5,
    require_coiling_base: true,
    max_base_compression_pct: 3.0,
    circuit_safety_buffer_pct: 1.5,
    max_bid_ask_spread_pct: 0.15,
    min_win_rate_floor: 50,
    max_retrace_atr_ratio: 1.2,
    nifty_anti_chop_filter: true,
    allowed_entry_days: ["MON", "TUE", "WED", "THU", "FRI"],
    blocked_days_message: "",
    days: DEFAULT_DAY_GUARDRAILS,
    ...(selectedStrategy?.block_i_knockout_guardrails || {})
  };

  const updateGuardrails = (updater: (prev: BlockIKnockoutGuardrails) => BlockIKnockoutGuardrails) => {
    if (!selectedStrategy) return;
    const current: BlockIKnockoutGuardrails = {
      enabled: true,
      status: "ACTIVE",
      title: "Knockout Guardrails (Pillar I)",
      description: "Hard binary vetoes protecting against buying overextended spikes far from VWAP, dry volume, or uncoiled bases.",
      max_vwap_distance_pct: 1.2,
      max_gap_open_pct: 3.5,
      min_open_cushion_pct: 0.5,
      min_bar_turnover_lakhs: 2.5,
      require_volume_expansion: true,
      min_volume_expansion_ratio: 1.5,
      require_coiling_base: true,
      max_base_compression_pct: 3.0,
      circuit_safety_buffer_pct: 1.5,
      max_bid_ask_spread_pct: 0.15,
      min_win_rate_floor: 50,
      max_retrace_atr_ratio: 1.2,
      nifty_anti_chop_filter: true,
      allowed_entry_days: ["MON", "TUE", "WED", "THU", "FRI"],
      blocked_days_message: "",
      days: DEFAULT_DAY_GUARDRAILS,
      ...(selectedStrategy.block_i_knockout_guardrails || {})
    };
    const updated = updater(current);
    setSelectedStrategy({
      ...selectedStrategy,
      block_i_knockout_guardrails: updated
    });
  };

  const updateDayGuardrails = (dayKey: string, updater: (prev: DayGuardrailSettings) => DayGuardrailSettings) => {
    updateGuardrails(prev => {
      const existingDays = prev.days || { ...DEFAULT_DAY_GUARDRAILS };
      const currentDaySetting: DayGuardrailSettings = existingDays[dayKey] || { ...(DEFAULT_DAY_GUARDRAILS[dayKey] || DEFAULT_DAY_GUARDRAILS.MON) };
      const updatedDaySetting = updater(currentDaySetting);
      const newDays = { ...existingDays, [dayKey]: updatedDaySetting };
      const allowedDays = ["MON", "TUE", "WED", "THU", "FRI"].filter(d => (newDays[d]?.enabled ?? true));

      return {
        ...prev,
        days: newDays,
        allowed_entry_days: allowedDays
      };
    });
  };

  const copyDaySettingsToAll = (sourceDayKey: string) => {
    updateGuardrails(prev => {
      const existingDays = prev.days || { ...DEFAULT_DAY_GUARDRAILS };
      const sourceSetting = existingDays[sourceDayKey] || DEFAULT_DAY_GUARDRAILS[sourceDayKey] || DEFAULT_DAY_GUARDRAILS.MON;
      const newDays: Record<string, DayGuardrailSettings> = {};
      ["MON", "TUE", "WED", "THU", "FRI"].forEach(d => {
        newDays[d] = {
          ...sourceSetting,
          enabled: existingDays[d]?.enabled ?? sourceSetting.enabled
        };
      });
      return {
        ...prev,
        days: newDays
      };
    });
  };

  const activeDaySettings: DayGuardrailSettings = (guardRules.days && guardRules.days[activeGuardrailDay])
    ? guardRules.days[activeGuardrailDay]
    : (DEFAULT_DAY_GUARDRAILS[activeGuardrailDay] || DEFAULT_DAY_GUARDRAILS.MON);

  const gateRules: BlockFExecutionGate = {
    ...DEFAULT_EXECUTION_GATE,
    ...(selectedStrategy?.block_f_execution_gate || {})
  };

  const updateExecutionGate = (updater: (prev: BlockFExecutionGate) => BlockFExecutionGate) => {
    if (!selectedStrategy) return;
    const current: BlockFExecutionGate = {
      ...DEFAULT_EXECUTION_GATE,
      ...(selectedStrategy.block_f_execution_gate || {})
    };
    const updated = updater(current);
    setSelectedStrategy({
      ...selectedStrategy,
      block_f_execution_gate: updated
    });
  };

  // Active Guardrail & Priority Rules Configuration (Compulsory 100% Matching)
  const defaultGuardrailRulesEnabled: Record<string, boolean> = {
    i_calendar: true,
    i_series: true,
    i_vwap_dist: true,
    i_vol_exp: true,
    i_coiling: true,
    i_circuit: true,
    i_spread: true,
    i_hit_rate: true,
    i_retrace: true,
    i_anti_chop: true,
    i_solvency: true,
  };

  const defaultPriorityRulesEnabled: Record<string, boolean> = {
    p_hod_tolerance: true,
    p_1min_rvol: true,
    p_vwap_launchpad: true,
    p_base_compression: true,
    p_orderbook_depth: true,
    p_rise_dip_asymmetry: true,
    p_dynamic_risk_reward: true,
    p_trade_management: true,
  };

  const activeGuardrailRulesEnabled: Record<string, boolean> = {
    ...defaultGuardrailRulesEnabled,
    ...(guardRules.rules_enabled || {})
  };

  const activeGuardrailCount = GUARDRAIL_RULES_LIST.filter(r => activeGuardrailRulesEnabled[r.id] !== false).length;

  const activePriorityRulesEnabled: Record<string, boolean> = {
    ...defaultPriorityRulesEnabled,
    ...(gateRules.rules_enabled || {})
  };

  const activePriorityCount = PRIORITY_RULES_LIST.filter(r => activePriorityRulesEnabled[r.id] !== false).length;

  const toggleGuardrailRule = (ruleId: string) => {
    const currentVal = activeGuardrailRulesEnabled[ruleId] !== false;
    updateGuardrails(prev => ({
      ...prev,
      rules_enabled: {
        ...(prev.rules_enabled || defaultGuardrailRulesEnabled),
        [ruleId]: !currentVal
      }
    }));
  };

  const enableAllGuardrails = () => {
    const allOn: Record<string, boolean> = {};
    GUARDRAIL_RULES_LIST.forEach(r => { allOn[r.id] = true; });
    updateGuardrails(prev => ({
      ...prev,
      rules_enabled: allOn
    }));
  };

  const selectCore7Guardrails = () => {
    const core7: Record<string, boolean> = {
      i_calendar: true,
      i_series: true,
      i_vwap_dist: true,
      i_vol_exp: true,
      i_coiling: true,
      i_circuit: true,
      i_spread: true,
      i_hit_rate: false,
      i_retrace: false,
      i_anti_chop: false,
      i_solvency: false,
    };
    updateGuardrails(prev => ({
      ...prev,
      rules_enabled: core7
    }));
  };

  const togglePriorityRule = (ruleId: string) => {
    const currentVal = activePriorityRulesEnabled[ruleId] !== false;
    updateExecutionGate(prev => ({
      ...prev,
      rules_enabled: {
        ...(prev.rules_enabled || defaultPriorityRulesEnabled),
        [ruleId]: !currentVal
      }
    }));
  };

  const enableAllPriority = () => {
    const allOn: Record<string, boolean> = {};
    PRIORITY_RULES_LIST.forEach(r => { allOn[r.id] = true; });
    updateExecutionGate(prev => ({
      ...prev,
      rules_enabled: allOn
    }));
  };

  const pRules: BlockEPriorityRules = {
    ...DEFAULT_PRIORITY_RULES,
    ...(selectedStrategy?.block_e_priority_rules || {}),
    sessions: {
      ...DEFAULT_PRIORITY_RULES.sessions,
      ...(selectedStrategy?.block_e_priority_rules?.sessions || {})
    }
  };
  const currentSessionRules: SessionPrioritySettings = pRules.sessions[prioritySessionTab] || DEFAULT_PRIORITY_RULES.sessions[prioritySessionTab];

  const updatePriorityRules = (updater: (prev: BlockEPriorityRules) => BlockEPriorityRules) => {
    if (!selectedStrategy) return;
    const current: BlockEPriorityRules = {
      ...DEFAULT_PRIORITY_RULES,
      ...(selectedStrategy.block_e_priority_rules || {}),
      sessions: {
        ...DEFAULT_PRIORITY_RULES.sessions,
        ...(selectedStrategy.block_e_priority_rules?.sessions || {})
      }
    };
    const updated = updater(current);
    setSelectedStrategy({
      ...selectedStrategy,
      block_e_priority_rules: updated
    });
  };

  const updateCurrentSession = (key: keyof SessionPrioritySettings, val: any) => {
    updatePriorityRules(prev => ({
      ...prev,
      sessions: {
        ...prev.sessions,
        [prioritySessionTab]: {
          ...prev.sessions[prioritySessionTab],
          [key]: val
        }
      }
    }));
  };

  const copySessionSettingsToAll = () => {
    updatePriorityRules(prev => {
      const src = prev.sessions[prioritySessionTab];
      return {
        ...prev,
        sessions: {
          morning: { ...src, session_name: "Morning Breakout", time_window: "09:15 - 11:30 AM" },
          afternoon: { ...src, session_name: "Midday Absorption", time_window: "11:30 AM - 01:45 PM" },
          day_end: { ...src, session_name: "Power Hour Sweep", time_window: "01:45 - 03:30 PM" }
        }
      };
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Pillar C dynamic rules helpers
  const rawPillarCRules = selectedStrategy?.block_b_current_params?.rules && selectedStrategy.block_b_current_params.rules.length > 0
    ? selectedStrategy.block_b_current_params.rules
    : DEFAULT_PILLAR_C_RULES;
  const pillarCRules: DynamicScoringRule[] = rawPillarCRules.map(normalizeDynamicRule);

  const updatePillarCRule = (ruleId: string, updater: (prev: DynamicScoringRule) => DynamicScoringRule) => {
    if (!selectedStrategy) return;
    const currentRules = pillarCRules.map(r => r.id === ruleId ? updater(r) : r);
    setSelectedStrategy({
      ...selectedStrategy,
      block_b_current_params: {
        ...(selectedStrategy.block_b_current_params || { enabled: true, status: "ACTIVE", title: "Current Parameter Analysis", description: "" }),
        scoring_mode: "DISCRETE_SCORES",
        rules: currentRules
      }
    });
  };

  const addOptionToPillarCRule = (ruleId: string) => {
    updatePillarCRule(ruleId, rule => {
      if (rule.options.length >= 6) return rule;
      const nextIdx = rule.options.length + 1;
      const newOpt: DynamicRangeOption = {
        id: `opt_${Date.now()}_${nextIdx}`,
        label: `Option ${nextIdx}`,
        operator: "BETWEEN",
        min_val: 0,
        max_val: 1,
        score: 0
      };
      return { ...rule, options: [...rule.options, newOpt] };
    });
  };

  const removeOptionFromPillarCRule = (ruleId: string, optId: string) => {
    updatePillarCRule(ruleId, rule => {
      if (rule.options.length <= 2) return rule;
      return { ...rule, options: rule.options.filter(o => o.id !== optId) };
    });
  };

  const setAllPillarCRulesEnabled = (enabled: boolean) => {
    if (!selectedStrategy) return;
    const updated = pillarCRules.map(r => ({ ...r, enabled }));
    setSelectedStrategy({
      ...selectedStrategy,
      block_b_current_params: {
        ...(selectedStrategy.block_b_current_params || { enabled: true, status: "ACTIVE", title: "Current Parameter Analysis", description: "" }),
        scoring_mode: "DISCRETE_SCORES",
        rules: updated
      }
    });
  };

  const resetPillarCRulesDefault = () => {
    if (!selectedStrategy) return;
    setSelectedStrategy({
      ...selectedStrategy,
      block_b_current_params: {
        ...(selectedStrategy.block_b_current_params || { enabled: true, status: "ACTIVE", title: "Current Parameter Analysis", description: "" }),
        scoring_mode: "DISCRETE_SCORES",
        min_current_score: 25,
        rules: JSON.parse(JSON.stringify(DEFAULT_PILLAR_C_RULES))
      }
    });
  };

  // Pillar H dynamic rules helpers
  const rawPillarHRules = selectedStrategy?.block_c_validate_history?.rules && selectedStrategy.block_c_validate_history.rules.length > 0
    ? selectedStrategy.block_c_validate_history.rules
    : DEFAULT_PILLAR_H_RULES;
  const pillarHRules: DynamicScoringRule[] = rawPillarHRules.map(normalizeDynamicRule);

  const updatePillarHRule = (ruleId: string, updater: (prev: DynamicScoringRule) => DynamicScoringRule) => {
    if (!selectedStrategy) return;
    const currentRules = pillarHRules.map(r => r.id === ruleId ? updater(r) : r);
    setSelectedStrategy({
      ...selectedStrategy,
      block_c_validate_history: {
        ...(selectedStrategy.block_c_validate_history || { enabled: true, status: "ACTIVE", title: "Validate with History", description: "" }),
        scoring_mode: "DISCRETE_SCORES",
        rules: currentRules
      }
    });
  };

  const addOptionToPillarHRule = (ruleId: string) => {
    updatePillarHRule(ruleId, rule => {
      if (rule.options.length >= 6) return rule;
      const nextIdx = rule.options.length + 1;
      const newOpt: DynamicRangeOption = {
        id: `opt_${Date.now()}_${nextIdx}`,
        label: `Option ${nextIdx}`,
        operator: "BETWEEN",
        min_val: 0,
        max_val: 1,
        score: 0
      };
      return { ...rule, options: [...rule.options, newOpt] };
    });
  };

  const removeOptionFromPillarHRule = (ruleId: string, optId: string) => {
    updatePillarHRule(ruleId, rule => {
      if (rule.options.length <= 2) return rule;
      return { ...rule, options: rule.options.filter(o => o.id !== optId) };
    });
  };

  const setAllPillarHRulesEnabled = (enabled: boolean) => {
    if (!selectedStrategy) return;
    const updated = pillarHRules.map(r => ({ ...r, enabled }));
    setSelectedStrategy({
      ...selectedStrategy,
      block_c_validate_history: {
        ...(selectedStrategy.block_c_validate_history || { enabled: true, status: "ACTIVE", title: "Validate with History", description: "" }),
        scoring_mode: "DISCRETE_SCORES",
        rules: updated
      }
    });
  };

  const resetPillarHRulesDefault = () => {
    if (!selectedStrategy) return;
    setSelectedStrategy({
      ...selectedStrategy,
      block_c_validate_history: {
        ...(selectedStrategy.block_c_validate_history || { enabled: true, status: "ACTIVE", title: "Validate with History", description: "" }),
        scoring_mode: "DISCRETE_SCORES",
        min_history_score: 18,
        rules: JSON.parse(JSON.stringify(DEFAULT_PILLAR_H_RULES))
      }
    });
  };

  // Set as Active Strategy on Backend
  const handleMakeActive = async (stratId?: string) => {
    const targetId = stratId || selectedStrategy?.id;
    if (!targetId) return;
    try {
      const res = await fetch("/api/v1/recommendations/strategies/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy_id: targetId })
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setActiveStrategyId(targetId);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        await fetchStrategies();
      }
    } catch (e) {
      console.error("Failed to set active strategy:", e);
    }
  };

  // Deactivate Active Strategy
  const handleDeactivate = async () => {
    try {
      const res = await fetch("/api/v1/recommendations/strategies/deactivate", {
        method: "POST"
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setActiveStrategyId("");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        await fetchStrategies();
      }
    } catch (e) {
      console.error("Failed to deactivate strategy:", e);
    }
  };

  // Save Strategy Changes
  const handleSaveStrategy = async () => {
    if (!selectedStrategy) return;
    try {
      setSaving(true);
      const res = await fetch("/api/v1/recommendations/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedStrategy)
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        await fetchStrategies();
      }
    } catch (e) {
      console.error("Failed to save strategy:", e);
    } finally {
      setSaving(false);
    }
  };

  // Create New Strategy
  const handleCreateNewStrategy = () => {
    const newId = `strat_custom_${Date.now()}`;
    const newStrat: Strategy = {
      id: newId,
      name: `Custom Strategy #${strategies.length + 1}`,
      description: "Custom strategy combining universe negative filters and real-time intraday indicators.",
      is_default: false,
      block_a_morning_filters: { ...DEFAULT_FILTERS },
      block_b_current_params: {
        enabled: true,
        status: "HARDCODED_PILLAR_C",
        title: "Current Parameter Analysis",
        description: "19 Intraday Live Parameters"
      },
      block_c_validate_history: {
        enabled: true,
        status: "HARDCODED_PILLAR_H",
        title: "Validate with History",
        description: "12 Historical Empirical Backtest Parameters"
      },
      block_d_ai_vision: {
        enabled: true,
        status: "HARDCODED_PILLAR_A",
        title: "AI Vision Setup",
        description: "Gemini Multimodal Chart Vision Verification"
      },
      block_e_priority_rules: { ...DEFAULT_PRIORITY_RULES }
    };
    setStrategies([...strategies, newStrat]);
    setSelectedStrategy(newStrat);
    setViewMode("STRATEGY_OVERVIEW");
  };

  // Clone Strategy
  const handleCloneStrategy = (s?: Strategy) => {
    const target = s || selectedStrategy;
    if (!target) return;
    const cloneId = `strat_clone_${Date.now()}`;
    const cloned: Strategy = {
      ...target,
      id: cloneId,
      name: `${target.name} (Copy)`,
      is_default: false
    };
    setStrategies([...strategies, cloned]);
    setSelectedStrategy(cloned);
    setViewMode("STRATEGY_OVERVIEW");
  };

  // Delete Strategy
  const handleDeleteStrategy = async (s?: Strategy) => {
    const target = s || selectedStrategy;
    if (!target || target.is_default) return;
    if (!confirm(`Are you sure you want to delete strategy "${target.name}"?`)) return;
    try {
      const res = await fetch(`/api/v1/recommendations/strategies/${target.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        await fetchStrategies();
        setViewMode("HUB");
      }
    } catch (e) {
      console.error("Failed to delete strategy:", e);
    }
  };

  // Update Block A Filter values
  const updateFilter = <K extends keyof BlockAFilters>(key: K, value: BlockAFilters[K]) => {
    if (!selectedStrategy) return;
    const updatedFilters = {
      ...selectedStrategy.block_a_morning_filters,
      [key]: value
    };
    setSelectedStrategy({
      ...selectedStrategy,
      block_a_morning_filters: updatedFilters
    });
  };

  if (loading || !selectedStrategy) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="font-medium text-sm">Loading Strategy Hub...</span>
        </div>
      </div>
    );
  }

  const isCurrentActive = selectedStrategy.id === activeStrategyId;
  const aFilters = selectedStrategy.block_a_morning_filters;

  // =========================================================================
  // SCREEN 1: THE STRATEGY HUB (DEFAULT VIEW)
  // =========================================================================
  if (viewMode === "HUB") {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
        {/* Hub Header */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shadow-xs">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Strategy Hub
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-bold uppercase tracking-wider">
                  {strategies.length} Strategies
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Select a strategy card below to configure its universe filters, intraday scoring, and AI vision rules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCreateNewStrategy}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Strategy</span>
            </button>
            {onNavigateToAudit && (
              <button
                onClick={onNavigateToAudit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
              >
                <span>Go to Reco Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Strategy Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {strategies.map((strat) => {
            const isActive = strat.id === activeStrategyId;
            const blockA = strat.block_a_morning_filters;
            return (
              <div
                key={strat.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  isActive
                    ? "border-emerald-500 ring-2 ring-emerald-500/20"
                    : "border-slate-200/90 hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Top Bar: Title & Active Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight line-clamp-1">
                      {strat.name}
                    </h2>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 text-[10px] font-bold uppercase tracking-wider shrink-0">
                        <Check className="w-3 h-3 text-emerald-700" />
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-4">
                    {strat.description || "No description provided."}
                  </p>

                  {/* 4 Modular Status Summary Chips */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 mb-5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                        Morning Universe Shield
                      </span>
                      {blockA?.enabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3 text-slate-400" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-indigo-500" />
                        Intraday Scoring (Pillar C)
                      </span>
                      <span title="Coming Soon (Baseline Active)" className="p-1 rounded-md bg-indigo-50 text-indigo-500 border border-indigo-100 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                        History Backtest (Pillar H)
                      </span>
                      <span title="Coming Soon (Baseline Active)" className="p-1 rounded-md bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-teal-500" />
                        AI Vision Setup (Pillar A)
                      </span>
                      <span title="Coming Soon (Baseline Active)" className="p-1 rounded-md bg-teal-50 text-teal-500 border border-teal-100 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isActive ? (
                      <button
                        onClick={() => handleDeactivate()}
                        className="px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/90 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Deactivate this strategy"
                      >
                        <PowerOff className="w-3 h-3 text-amber-600" />
                        <span>Deactivate</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMakeActive(strat.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
                        title="Set as active strategy for live recommendations"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleCloneStrategy(strat)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Clone Strategy"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {!strat.is_default && (
                      <button
                        onClick={() => handleDeleteStrategy(strat)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Strategy"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenStrategy(strat)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 rounded-xl transition-all cursor-pointer"
                  >
                    <span>Configure ➔</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 2: STRATEGY OVERVIEW & 4 BLOCK CARDS
  // =========================================================================
  if (viewMode === "STRATEGY_OVERVIEW") {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
        {/* Navigation Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode("HUB")}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Strategies</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden md:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Strategy Overview:</span>
                <span className="text-sm font-black text-slate-900">{selectedStrategy.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isCurrentActive ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Active Strategy
                </span>
                <button
                  onClick={() => handleDeactivate()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/90 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  title="Deactivate this strategy"
                >
                  <PowerOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Deactivate</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleMakeActive()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Make Active Strategy</span>
              </button>
            )}

            <button
              onClick={handleSaveStrategy}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer ${
                saveSuccess ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? "Saved!" : "Save Changes"}</span>
            </button>
          </div>
        </div>

        {/* Strategy Title & Description Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Strategy Name
              </label>
              <input
                type="text"
                value={selectedStrategy.name}
                onChange={(e) => setSelectedStrategy({ ...selectedStrategy, name: e.target.value })}
                className="w-full text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Strategy Name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Strategy Description
              </label>
              <input
                type="text"
                value={selectedStrategy.description}
                onChange={(e) => setSelectedStrategy({ ...selectedStrategy, description: e.target.value })}
                className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Brief summary of what this strategy targets"
              />
            </div>
          </div>
        </div>

        {/* 5 Modular Pillar Cards */}
        <div>
          <div className="mb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Modular Evaluation Pipeline (6 Stages)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click on any stage card below to view or customize its underlying rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Morning Filters */}
            <div
              onClick={() => handleOpenBlock("BLOCK_A")}
              className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                        1. Morning Filter Studio (Universe Shield)
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">Stage 1 • Pre-Market Gate</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      aFilters.enabled
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {aFilters.enabled ? `Active (${previewCounts.eligible} Eligible)` : "Disabled (All 5,087)"}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Filters out penny stocks, illiquid shares (10D/20D/30D volume), SME surveillance lots, and financially distressed companies before market open.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
                <span>Configure Filter Parameters</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Knockout Guardrails & Calendar Lock (Pillar I) */}
            <div
              onClick={() => handleOpenBlock("BLOCK_I")}
              className="bg-white border border-slate-200 hover:border-rose-400 hover:shadow-md rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                        2. Knockout Guardrails & Calendar Lock (Pillar I)
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">Stage 2 • Binary Hard Vetoes & Day Filter</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      guardRules.enabled
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {guardRules.enabled ? "Active (Enforced)" : "Disabled"}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Fast-fail binary vetoes: stops chasing overextended VWAP spikes, rejects dry volume triggers, enforces base coiling, and locks allowed trading days (e.g. blocking Thursday & Friday for BTST).
                </p>

                <div className="mt-3.5 flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/70 font-semibold font-mono">
                    <span>🛡️ Active Compulsory:</span>
                    <span className="font-bold text-rose-900">{activeGuardrailCount}/11 (100% Match)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold font-mono">
                    <span>⚡ Max VWAP Dist:</span>
                    <span className="font-bold text-slate-900">≤{guardRules.max_vwap_distance_pct ?? 1.2}%</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold font-mono">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>Days:</span>
                    <span className="font-bold text-slate-900">{(guardRules.allowed_entry_days || ["MON","TUE","WED","THU","FRI"]).join(", ")}</span>
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-600">
                <span>Configure Knockout Guardrails</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Current Setup Verification (Pillar C) */}
            <div
              onClick={() => {
                setPillarCHSubTab("PILLAR_C");
                handleOpenBlock("BLOCK_B");
              }}
              className="bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/80 flex items-center justify-center shrink-0 shadow-xs">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        3. Current Setup Verification (Pillar C)
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">Stage 3 • Live Indicators (60% Cutoff)</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded shrink-0">
                    Pillar C • 60% Gate
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Validates live WebSocket momentum across 19 intraday indicators including VWAP price alignment, RVOL surge, SuperTrend direction, and order book depth imbalance.
                </p>

                <div className="mt-3.5 flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200/70 font-semibold font-mono">
                    <span>⚡ Pillar C:</span>
                    <span className="font-bold text-slate-900">19 Indicators</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold font-mono">
                    <span>Threshold:</span>
                    <span className="font-bold text-slate-900">60%</span>
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span>Configure Pillar C Rules</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: Historical Backtest Verification (Pillar H) */}
            <div
              onClick={() => {
                setPillarCHSubTab("PILLAR_H");
                handleOpenBlock("BLOCK_C");
              }}
              className="bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-xs">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        4. Historical Backtest Verification (Pillar H)
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">Stage 4 • 12 Backtest Rules (60% Cutoff)</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                    Pillar H • 60% Gate
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Cross-references live setups with 60 days of historical tick backtests, verifying win-rate persistence (50%+ target hit), Hurst exponent directionality, and ADR expansion.
                </p>

                <div className="mt-3.5 flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-semibold font-mono">
                    <span>📊 Pillar H:</span>
                    <span className="font-bold text-slate-900">12 Backtest Rules</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold font-mono">
                    <span>Threshold:</span>
                    <span className="font-bold text-slate-900">60%</span>
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>Configure Pillar H Rules</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 5: Execution Gate & Priority Allocator (Go / No-Go Trigger - Base) */}
            <div
              onClick={() => handleOpenBlock("BLOCK_F")}
              className="bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-lg rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50/40"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                          5. Execution Gate & Priority Allocator
                        </h3>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 tracking-wider">
                          Base Trigger
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Stage 5 • Intraday Timing • RVOL • Quotas
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 border ${
                        selectedStrategy?.block_f_execution_gate?.enabled
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {selectedStrategy?.block_f_execution_gate?.enabled ? "Active (Enforced)" : "Draft Mode (Inactive)"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Decides the exact minute a CHA-passed stock triggers as an Execution Candidate and receives live quota allocation. Base gate mandates HOD breakout (e.g. 0.998), 1-minute RVOL (≥ 1.2x), VWAP alignment, and strictly enforces per-session recommendation caps (Morning 5, Midday 3, Day End 4).
                </p>

                {/* Execution Gate & Priority Metrics Badges */}
                <div className="mt-3.5 flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-semibold font-mono">
                    <span>🎯 Active Compulsory:</span>
                    <span className="font-bold text-emerald-900">{activePriorityCount}/8 (100% Match)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-semibold font-mono">
                    <span>🎯 HOD:</span>
                    <span className="font-bold text-slate-900">{selectedStrategy?.block_f_execution_gate?.hod_tolerance_ratio ?? 0.998}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/70 font-semibold font-mono">
                    <span>⚡ RVOL:</span>
                    <span className="font-bold text-slate-900">≥{selectedStrategy?.block_f_execution_gate?.min_rvol ?? 1.2}x</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200/70 font-semibold font-mono">
                    <span>📈 VWAP:</span>
                    <span className="font-bold text-slate-900">≤+{selectedStrategy?.block_f_execution_gate?.max_vwap_distance_pct ?? 1.5}%</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200/70 font-semibold font-mono">
                    <span>🔒 Base:</span>
                    <span className="font-bold text-slate-900">≤{selectedStrategy?.block_f_execution_gate?.max_base_compression_pct ?? 2.5}%</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/70 font-semibold">
                    <span>🌅 Session Cap:</span>
                    <span className="font-bold text-slate-900">
                      {selectedStrategy?.block_e_priority_rules?.session_quotas?.enabled ? `${selectedStrategy?.block_e_priority_rules?.sessions?.morning?.max_recommendations ?? 5} Max` : "Uncapped (Off)"}
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>Configure Execution Gate & Priority Parameters</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 6: AI Vision Setup */}
            <div
              onClick={() => handleOpenBlock("BLOCK_D")}
              className="bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shrink-0 shadow-xs">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                          6. AI Vision Setup (Pillar A)
                        </h3>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 tracking-wider">
                          Stage 6
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Post-Execution Gate Multimodal Chart Inspection</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded shrink-0">
                    Active • Triggered Candidates Only
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Invoked exclusively when a stock passes the Execution Gate breakout trigger. Analyzes candlestick chart symmetry with Gemini Multimodal AI to confirm genuine breakouts and filter out bull-trap wick rejections before Priority allocation.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
                <span>View AI Vision Pipeline</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 3: BLOCK DEEP-DIVE (1 PARAMETER PER LINE)
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Top Navigation */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setViewMode("STRATEGY_OVERVIEW")}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          {/* Strategy Horizon Selector Dropdown */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/90 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Strategy:</span>
              <select
                value={selectedStrategy.id}
                onChange={(e) => {
                  const found = strategies.find(s => s.id === e.target.value);
                  if (found) {
                    setSelectedStrategy({ ...found });
                  }
                }}
                className="text-xs font-black text-slate-900 bg-transparent border-0 focus:outline-none cursor-pointer pr-1"
              >
                {strategies.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.horizon === "INTRADAY" && "⚡ "}
                    {s.horizon === "BTST_1_2_DAYS" && "⏱ "}
                    {s.horizon === "SWING_1W_3M" && "📈 "}
                    {s.horizon === "LONG_TERM_3M_PLUS" && "🏛 "}
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedStrategy.horizon && (
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl border font-mono shadow-2xs ${
                selectedStrategy.horizon === "INTRADAY" ? "bg-amber-50 text-amber-800 border-amber-300" :
                selectedStrategy.horizon === "BTST_1_2_DAYS" ? "bg-indigo-50 text-indigo-800 border-indigo-300" :
                selectedStrategy.horizon === "SWING_1W_3M" ? "bg-blue-50 text-blue-800 border-blue-300" :
                "bg-emerald-50 text-emerald-800 border-emerald-300"
              }`}>
                {selectedStrategy.horizon === "INTRADAY" && "⚡ Intraday Alpha"}
                {selectedStrategy.horizon === "BTST_1_2_DAYS" && "⏱ BTST 1-2 Days"}
                {selectedStrategy.horizon === "SWING_1W_3M" && "📈 Swing 1W-3M"}
                {selectedStrategy.horizon === "LONG_TERM_3M_PLUS" && "🏛 Long-Term 3M+"}
              </span>
            )}
          </div>

          <div className="text-xs hidden xl:block">
            <span className="text-slate-400">/ </span>
            <span className="font-bold text-slate-900">
              {activeBlock === "BLOCK_A" && "1. Morning Filter Studio"}
              {activeBlock === "BLOCK_I" && "2. Knockout Guardrails (Pillar I)"}
              {activeBlock === "BLOCK_B" && "3. Pillar C Current Setup Scoring"}
              {activeBlock === "BLOCK_C" && "4. Pillar H Historical Setup Scoring"}
              {(activeBlock === "BLOCK_F" || activeBlock === "BLOCK_E") && "5. Execution Gate & Priority Allocator"}
              {activeBlock === "BLOCK_D" && "6. AI Vision Setup (Pillar A)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSaveStrategy}
            disabled={saving}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer ${
              saveSuccess ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saveSuccess ? "Saved!" : "Save Strategy"}</span>
          </button>
        </div>
      </div>

      {/* 6-Stage Clean Funnel Navigation Tabs Bar */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 flex items-center gap-1.5 overflow-x-auto shadow-2xs">
        <button
          onClick={() => setActiveBlock("BLOCK_A")}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeBlock === "BLOCK_A" ? "bg-white text-blue-700 shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>1. Morning Filters (M)</span>
        </button>

        <button
          onClick={() => setActiveBlock("BLOCK_I")}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeBlock === "BLOCK_I" ? "bg-white text-rose-700 shadow-xs border border-slate-200 ring-2 ring-rose-500/20" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>2. Knockout Guardrails (I)</span>
          <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
            activeBlock === "BLOCK_I" ? "bg-rose-100 text-rose-800" : "bg-slate-200 text-slate-700"
          }`}>
            {activeGuardrailCount}/11 Active
          </span>
        </button>

        <button
          onClick={() => setActiveBlock("BLOCK_B")}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeBlock === "BLOCK_B" ? "bg-white text-indigo-700 shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>3. Pillar C (Current)</span>
        </button>

        <button
          onClick={() => setActiveBlock("BLOCK_C")}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeBlock === "BLOCK_C" ? "bg-white text-emerald-700 shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
          <span>4. Pillar H (History)</span>
        </button>

        <button
          onClick={() => setActiveBlock("BLOCK_F")}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeBlock === "BLOCK_F" || activeBlock === "BLOCK_E" ? "bg-white text-emerald-800 shadow-xs border border-emerald-300 ring-2 ring-emerald-500/20" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Target className="w-3.5 h-3.5 text-emerald-600" />
          <span>5. Execution Gate (P)</span>
          <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
            activeBlock === "BLOCK_F" || activeBlock === "BLOCK_E" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
          }`}>
            {activePriorityCount}/8 Active
          </span>
        </button>

        <button
          onClick={() => setActiveBlock("BLOCK_D")}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeBlock === "BLOCK_D" ? "bg-white text-teal-700 shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-teal-600" />
          <span>6. AI Vision (A)</span>
        </button>
      </div>

      {/* =========================================================================
          SCREEN 3A: BLOCK A - MORNING FILTERS (1 PARAMETER PER LINE)
         ========================================================================= */}
      {activeBlock === "BLOCK_A" && (
        <div className="space-y-5">
          {/* Master Enable/Disable Switch & Description */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Enable Pre-Market Universe Filters
                </h2>
                <span className="text-xs font-semibold text-slate-500">(Optional)</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                When turned ON, only stocks meeting your criteria will be passed to intraday scoring. When turned OFF, all 5,087+ listed stocks are assessed.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">
                {aFilters.enabled ? "Shield Active" : "Shield Disabled"}
              </span>
              <IOSSwitch
                checked={aFilters.enabled}
                onChange={(val) => updateFilter("enabled", val)}
              />
            </div>
          </div>

          {/* Sticky Live Impact Ribbon */}
          {aFilters.enabled && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Master Universe
                  </span>
                  <div className="text-xl font-black text-white">
                    {previewCounts.master.toLocaleString()}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Eligible for Recos
                  </span>
                  <div className="text-xl font-black text-emerald-400 flex items-center gap-2">
                    {previewLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    ) : (
                      previewCounts.eligible.toLocaleString()
                    )}
                    <span className="text-xs font-semibold text-emerald-300/80">
                      ({((previewCounts.eligible / previewCounts.master) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                    Excluded Stocks
                  </span>
                  <div className="text-xl font-black text-rose-400">
                    {previewLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                    ) : (
                      previewCounts.ineligible.toLocaleString()
                    )}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                Live 52M candle & financial audit calculation
              </div>
            </div>
          )}

          {/* 1 PARAMETER PER LINE LIST */}
          {aFilters.enabled && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
              {/* Row 1: Penny Stocks */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Exclude Penny Stocks</span>
                    {aFilters.exclude_penny && (
                      <button
                        type="button"
                        onClick={() =>
                          setExcludedModal({
                            ruleId: "exclude_penny",
                            ruleTitle: "Exclude Penny Stocks",
                            ruleThresholdText: `Price < ₹${aFilters.min_price} Floor`
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                        title="Click to view excluded stocks & their real prices"
                      >
                        <span>-{previewCounts.ruleImpact?.exclude_penny || 576} excluded</span>
                        <Eye className="w-3 h-3 text-rose-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rejects micro-penny equities trading below price floor to prevent operator manipulation.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {aFilters.exclude_penny && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Floor:</span>
                      {[10, 15, 20, 50, 100].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => updateFilter("min_price", p)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                            aFilters.min_price === p
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          ₹{p}
                        </button>
                      ))}
                    </div>
                  )}

                  <IOSSwitch
                    checked={aFilters.exclude_penny}
                    onChange={(val) => updateFilter("exclude_penny", val)}
                  />
                </div>
              </div>

              {/* Row 2: Smart Liquidity & Volume Floor */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Smart Liquidity & Volume Floor</span>
                    {aFilters.exclude_illiquid && (
                      <button
                        type="button"
                        onClick={() =>
                          setExcludedModal({
                            ruleId: "exclude_illiquid",
                            ruleTitle: "Smart Liquidity & Volume Floor",
                            ruleThresholdText: `Vol < ${(aFilters.min_volume / 1000).toFixed(0)}k (${aFilters.volume_lookback_days}D ${aFilters.volume_calc_type})`
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                        title="Click to view excluded stocks & their real volume"
                      >
                        <span>-{previewCounts.ruleImpact?.exclude_illiquid || 3660} excluded</span>
                        <Eye className="w-3 h-3 text-rose-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Consolidates dual-exchange (NSE + BSE) volume across multi-day lookback to eliminate dead stocks.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {aFilters.exclude_illiquid && (
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Lookback Pills */}
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        {[
                          { label: "1D (Today)", val: 1 },
                          { label: "10 Days", val: 10 },
                          { label: "20 Days", val: 20 },
                          { label: "30 Days", val: 30 }
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => updateFilter("volume_lookback_days", item.val)}
                            className={`px-2 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                              aFilters.volume_lookback_days === item.val
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>

                      {/* Mode Pills: Median vs Average */}
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateFilter("volume_calc_type", "MEDIAN")}
                          className={`px-2 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                            aFilters.volume_calc_type === "MEDIAN"
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Median (Filters Spikes)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateFilter("volume_calc_type", "AVERAGE")}
                          className={`px-2 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                            aFilters.volume_calc_type === "AVERAGE"
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Average (Mean)
                        </button>
                      </div>

                      {/* Floor Pills */}
                      <div className="flex items-center gap-1">
                        {[50000, 100000, 200000, 500000].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => updateFilter("min_volume", v)}
                            className={`px-2 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                              aFilters.min_volume === v
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {(v / 1000).toFixed(0)}k
                          </button>
                        ))}
                      </div>

                      {/* Manual Volume Input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1000}
                          step={1000}
                          placeholder="Custom"
                          value={
                            ![50000, 100000, 200000, 500000].includes(aFilters.min_volume)
                              ? aFilters.min_volume
                              : ""
                          }
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val > 0) {
                              updateFilter("min_volume", val);
                            }
                          }}
                          className={`w-[90px] px-2 py-1 text-xs font-bold rounded-lg border text-center transition-colors ${
                            ![50000, 100000, 200000, 500000].includes(aFilters.min_volume)
                              ? "bg-blue-600 text-white border-blue-700 placeholder:text-blue-200"
                              : "bg-white text-slate-700 border-slate-200 placeholder:text-slate-400"
                          }`}
                          title="Enter a custom volume floor (e.g. 10000, 20000)"
                        />
                        {![50000, 100000, 200000, 500000].includes(aFilters.min_volume) && (
                          <span className="text-[10px] font-bold text-blue-600 whitespace-nowrap">
                            {(aFilters.min_volume / 1000).toFixed(aFilters.min_volume % 1000 === 0 ? 0 : 1)}k
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <IOSSwitch
                    checked={aFilters.exclude_illiquid}
                    onChange={(val) => updateFilter("exclude_illiquid", val)}
                  />
                </div>
              </div>

              {/* Row 3: Daily Turnover Floor */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Daily Turnover Floor</span>
                    {aFilters.exclude_low_turnover && (
                      <button
                        type="button"
                        onClick={() =>
                          setExcludedModal({
                            ruleId: "exclude_low_turnover",
                            ruleTitle: "Daily Turnover Floor",
                            ruleThresholdText: `Turnover < ₹${aFilters.min_turnover_cr} Cr`
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                        title="Click to view excluded stocks & their real daily turnover"
                      >
                        <span>-{previewCounts.ruleImpact?.exclude_low_turnover || 280} excluded</span>
                        <Eye className="w-3 h-3 text-rose-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ensures high trade value turnover in Crores to guarantee smooth order fills without slippage.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {aFilters.exclude_low_turnover && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Min Turnover:</span>
                      {[1.0, 2.0, 5.0, 10.0].map((cr) => (
                        <button
                          key={cr}
                          type="button"
                          onClick={() => updateFilter("min_turnover_cr", cr)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                            aFilters.min_turnover_cr === cr
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          ₹{cr} Cr
                        </button>
                      ))}
                    </div>
                  )}

                  <IOSSwitch
                    checked={aFilters.exclude_low_turnover}
                    onChange={(val) => updateFilter("exclude_low_turnover", val)}
                  />
                </div>
              </div>

              {/* Row 4: Surveillance & SME */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Exclude Surveillance (ASM/GSM) & SME Lots</span>
                    {aFilters.exclude_surveillance_sme && (
                      <button
                        type="button"
                        onClick={() =>
                          setExcludedModal({
                            ruleId: "exclude_surveillance_sme",
                            ruleTitle: "Exclude Surveillance (ASM/GSM) & SME Lots",
                            ruleThresholdText: "SEBI ASM / GSM / T2T / SME Lots"
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                        title="Click to view excluded surveillance & SME stocks"
                      >
                        <span>-{previewCounts.ruleImpact?.exclude_surveillance_sme || 903} excluded</span>
                        <Eye className="w-3 h-3 text-rose-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filters out SEBI surveillance stages, Trade-to-Trade (T2T), Z/XT series, and -SM SME batch lots.
                  </p>
                </div>

                <IOSSwitch
                  checked={aFilters.exclude_surveillance_sme}
                  onChange={(val) => updateFilter("exclude_surveillance_sme", val)}
                />
              </div>

              {/* Row 5: Non-Equity Instruments */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Exclude Non-Equity Instruments</span>
                    {aFilters.exclude_non_equity && (
                      <button
                        type="button"
                        onClick={() =>
                          setExcludedModal({
                            ruleId: "exclude_non_equity",
                            ruleTitle: "Exclude Non-Equity Instruments",
                            ruleThresholdText: "Index ETFs, Gold BeES, Liquid & Debt Funds"
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                        title="Click to view excluded non-equity instruments"
                      >
                        <span>-{previewCounts.ruleImpact?.exclude_non_equity || 204} excluded</span>
                        <Eye className="w-3 h-3 text-rose-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filters out index ETFs, Gold BeES, Liquid funds, Silver funds, and debt instruments.
                  </p>
                </div>

                <IOSSwitch
                  checked={aFilters.exclude_non_equity}
                  onChange={(val) => updateFilter("exclude_non_equity", val)}
                />
              </div>

              {/* Row 6: Circuit Trappers */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Exclude Circuit Trappers</span>
                    {aFilters.exclude_circuit_trappers && (
                      <button
                        type="button"
                        onClick={() =>
                          setExcludedModal({
                            ruleId: "exclude_circuit_trappers",
                            ruleTitle: "Exclude Circuit Trappers",
                            ruleThresholdText: "2% - 5% Circuit Bands / Illiquid Exit Risk"
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                        title="Click to view excluded circuit trappers"
                      >
                        <span>-{previewCounts.ruleImpact?.exclude_circuit_trappers || 140} excluded</span>
                        <Eye className="w-3 h-3 text-rose-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Excludes stocks with tight 2% or 5% circuit bands where orders cannot be exited during reversals.
                  </p>
                </div>

                <IOSSwitch
                  checked={aFilters.exclude_circuit_trappers}
                  onChange={(val) => updateFilter("exclude_circuit_trappers", val)}
                />
              </div>

              {/* Row 7: High Debt-to-Equity */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Exclude High Debt-to-Equity</span>
                    {aFilters.exclude_high_debt && (
                      <button
                        type="button"
                        onClick={() =>
                          setExcludedModal({
                            ruleId: "exclude_high_debt",
                            ruleTitle: "Exclude High Debt-to-Equity",
                            ruleThresholdText: `D/E > ${aFilters.max_debt_to_equity}x Ceiling`
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                        title="Click to view excluded high-debt companies"
                      >
                        <span>-{previewCounts.ruleImpact?.exclude_high_debt || 412} excluded</span>
                        <Eye className="w-3 h-3 text-rose-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Screens out heavily leveraged balance sheets with excessive borrowing burdens.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {aFilters.exclude_high_debt && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Max D/E:</span>
                      {[1.5, 2.0, 3.0, 5.0].map((de) => (
                        <button
                          key={de}
                          type="button"
                          onClick={() => updateFilter("max_debt_to_equity", de)}
                          className={`px-2 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                            aFilters.max_debt_to_equity === de
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {de}x
                        </button>
                      ))}
                    </div>
                  )}

                  <IOSSwitch
                    checked={aFilters.exclude_high_debt}
                    onChange={(val) => updateFilter("exclude_high_debt", val)}
                  />
                </div>
              </div>

              {/* Row 8: Altman Z-Score Distress */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Exclude Bankruptcy Distress (Altman Z)</span>
                    {aFilters.exclude_bankruptcy_distress && (
                      <button
                        type="button"
                        onClick={() =>
                          setExcludedModal({
                            ruleId: "exclude_bankruptcy_distress",
                            ruleTitle: "Exclude Bankruptcy Distress (Altman Z)",
                            ruleThresholdText: `Altman Z < ${aFilters.min_altman_z} Distress Floor`
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                        title="Click to view excluded distressed companies"
                      >
                        <span>-{previewCounts.ruleImpact?.exclude_bankruptcy_distress || 350} excluded</span>
                        <Eye className="w-3 h-3 text-rose-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filters out companies in the financial distress zone (Altman Z &lt; 1.8).
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {aFilters.exclude_bankruptcy_distress && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Min Z:</span>
                      {[1.5, 1.8, 2.2, 3.0].map((z) => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => updateFilter("min_altman_z", z)}
                          className={`px-2 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                            aFilters.min_altman_z === z
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {z}
                        </button>
                      ))}
                    </div>
                  )}

                  <IOSSwitch
                    checked={aFilters.exclude_bankruptcy_distress}
                    onChange={(val) => updateFilter("exclude_bankruptcy_distress", val)}
                  />
                </div>
              </div>

              {/* Row 9: Weak Piotroski Score */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Exclude Weak Piotroski Score</span>
                    {aFilters.exclude_weak_piotroski && (
                      <button
                        type="button"
                        onClick={() =>
                          setExcludedModal({
                            ruleId: "exclude_weak_piotroski",
                            ruleTitle: "Exclude Weak Piotroski Score",
                            ruleThresholdText: `Piotroski Score < ${aFilters.min_piotroski} / 9`
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                        title="Click to view excluded weak fundamental companies"
                      >
                        <span>-{previewCounts.ruleImpact?.exclude_weak_piotroski || 280} excluded</span>
                        <Eye className="w-3 h-3 text-rose-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filters out companies with poor fundamental accounting momentum (Score &lt; 4 / 9).
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {aFilters.exclude_weak_piotroski && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Min Score:</span>
                      {[3, 4, 5, 6].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => updateFilter("min_piotroski", score)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                            aFilters.min_piotroski === score
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {score} / 9
                        </button>
                      ))}
                    </div>
                  )}

                  <IOSSwitch
                    checked={aFilters.exclude_weak_piotroski}
                    onChange={(val) => updateFilter("exclude_weak_piotroski", val)}
                  />
                </div>
              </div>

              {/* Row 10: High Promoter Pledge */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Exclude High Promoter Pledge</span>
                    {aFilters.exclude_high_pledge && (
                      <button
                        type="button"
                        onClick={() =>
                          setExcludedModal({
                            ruleId: "exclude_high_pledge",
                            ruleTitle: "Exclude High Promoter Pledge",
                            ruleThresholdText: `Promoter Pledge > ${aFilters.max_promoter_pledge}% Ceiling`
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                        title="Click to view excluded high promoter pledge stocks"
                      >
                        <span>-{previewCounts.ruleImpact?.exclude_high_pledge || 190} excluded</span>
                        <Eye className="w-3 h-3 text-rose-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Screens out promoters who have pledged a dangerous percentage of their shares as collateral.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {aFilters.exclude_high_pledge && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Max Pledge:</span>
                      {[10, 25, 50].map((pl) => (
                        <button
                          key={pl}
                          type="button"
                          onClick={() => updateFilter("max_promoter_pledge", pl)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                            aFilters.max_promoter_pledge === pl
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {pl}%
                        </button>
                      ))}
                    </div>
                  )}

                  <IOSSwitch
                    checked={aFilters.exclude_high_pledge}
                    onChange={(val) => updateFilter("exclude_high_pledge", val)}
                  />
                </div>
              </div>

              {/* Row 11: Low Promoter Stake */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Exclude Low Promoter Stake</span>
                    {aFilters.exclude_low_promoter_holding && (
                      <button
                        type="button"
                        onClick={() =>
                          setExcludedModal({
                            ruleId: "exclude_low_promoter_holding",
                            ruleTitle: "Exclude Low Promoter Stake",
                            ruleThresholdText: `Promoter Stake < ${aFilters.min_promoter_holding}% Floor`
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                        title="Click to view excluded low founder ownership stocks"
                      >
                        <span>-{previewCounts.ruleImpact?.exclude_low_promoter_holding || 310} excluded</span>
                        <Eye className="w-3 h-3 text-rose-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filters out companies with negligible founder ownership (&lt; 20%).
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {aFilters.exclude_low_promoter_holding && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Min Stake:</span>
                      {[20, 30, 50].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updateFilter("min_promoter_holding", st)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                            aFilters.min_promoter_holding === st
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {st}%
                        </button>
                      ))}
                    </div>
                  )}

                  <IOSSwitch
                    checked={aFilters.exclude_low_promoter_holding}
                    onChange={(val) => updateFilter("exclude_low_promoter_holding", val)}
                  />
                </div>
              </div>

              {/* Row 12: Net Loss Makers */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Exclude Net Loss Makers</span>
                    {aFilters.exclude_loss_makers && (
                      <button
                        type="button"
                        onClick={() =>
                          setExcludedModal({
                            ruleId: "exclude_loss_makers",
                            ruleTitle: "Exclude Net Loss Makers",
                            ruleThresholdText: "Net Earnings PAT ≤ 0"
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                        title="Click to view excluded net loss making companies"
                      >
                        <span>-{previewCounts.ruleImpact?.exclude_loss_makers || 620} excluded</span>
                        <Eye className="w-3 h-3 text-rose-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filters out companies declaring net negative earnings after tax (PAT &le; 0).
                  </p>
                </div>

                <IOSSwitch
                  checked={aFilters.exclude_loss_makers}
                  onChange={(val) => updateFilter("exclude_loss_makers", val)}
                />
              </div>

              {/* Row 13: Negative Cash Flow */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Exclude Negative Operating Cash Flow</span>
                    {aFilters.exclude_negative_cfo && (
                      <button
                        type="button"
                        onClick={() =>
                          setExcludedModal({
                            ruleId: "exclude_negative_cfo",
                            ruleTitle: "Exclude Negative Operating Cash Flow",
                            ruleThresholdText: "Operating Cash Flow CFO < 0"
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                        title="Click to view excluded cash-burning companies"
                      >
                        <span>-{previewCounts.ruleImpact?.exclude_negative_cfo || 480} excluded</span>
                        <Eye className="w-3 h-3 text-rose-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filters out businesses burning cash with negative operational cash flow (CFO &lt; 0).
                  </p>
                </div>

                <IOSSwitch
                  checked={aFilters.exclude_negative_cfo}
                  onChange={(val) => updateFilter("exclude_negative_cfo", val)}
                />
              </div>

              {/* Institutional Section: Market Regime (NIFTY Gate) & Volatility Squeeze (X1) */}
              <div className="bg-slate-50/90 p-4 border-t border-b border-slate-200">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Market Regime & Pre-Market Compression Gates (X1)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Protects against false breakouts on choppy index days and pre-screens for coiled spring setups before market opens.
                </p>
              </div>

              {/* 1. NIFTY Market Regime Filter */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">NIFTY 50 Market Regime Gate</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Anti-Chop Shield
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automatically pauses long breakout signals when NIFTY 50 trades below its Day Open or 20-DMA to prevent chop losses.
                  </p>
                </div>
                <IOSSwitch
                  checked={aFilters.market_regime_filter?.enabled ?? true}
                  onChange={(val) =>
                    updateFilter("market_regime_filter" as any, {
                      ...(aFilters.market_regime_filter || { index_symbol: "NIFTY50", require_above_open: true, require_above_dma20: true, pause_on_heavy_red: true }),
                      enabled: val
                    })
                  }
                />
              </div>

              {/* 2. Pre-Market Volatility Squeeze */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Pre-Market Volatility Squeeze</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300">
                      Coiling Spring
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Screens for stocks where 3-day high/low candle range is tightly compressed (&le; 3.0%) with volume absorption before opening.
                  </p>
                </div>
                <IOSSwitch
                  checked={aFilters.volatility_squeeze?.enabled ?? true}
                  onChange={(val) =>
                    updateFilter("volatility_squeeze" as any, {
                      ...(aFilters.volatility_squeeze || { max_3d_range_pct: 3.0, volume_dryup_threshold: 0.8 }),
                      enabled: val
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SCREEN 3-I: BLOCK I - KNOCKOUT GUARDRAILS & CALENDAR LOCK (STAGE 2)
         ========================================================================= */}
      {activeBlock === "BLOCK_I" && (
        <div className="space-y-6">
          {/* Master Enable/Disable & Flowchart Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-rose-600">
                  Stage 2 Fast-Fail Veto Pipeline
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Knockout Guardrails (Pillar I)
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-mono">
                  {activeGuardrailCount}/11 Active (100% Compulsory)
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Knockout Guardrails & Trade Calendar Lock
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                Binary hard vetoes executed immediately after Morning Filters. Whatever rules you activate below are <strong>100% strictly compulsory</strong> — if even a single active rule fails, the recommendation is permanently vetoed at root and never shown on your dashboard.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold ${guardRules.enabled ? "text-rose-700" : "text-slate-400"}`}>
                {guardRules.enabled ? "Guardrails Enforced" : "Guardrails Bypassed"}
              </span>
              <IOSSwitch
                checked={guardRules.enabled}
                onChange={(val) => updateGuardrails(prev => ({ ...prev, enabled: val }))}
              />
            </div>
          </div>

          {/* Section 0: Active Compulsory Knockout Guardrails Selection Matrix */}
          <div className="bg-white border border-rose-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-rose-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Active Compulsory Guardrails Selection ({activeGuardrailCount} of 11 Active)</span>
                  </h3>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border font-mono ${
                    activeGuardrailCount === 11 
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}>
                    {activeGuardrailCount === 11 ? "All 11 Active (100% Compulsory)" : `${activeGuardrailCount}/11 Active (Strict 100% Match Required)`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                  Toggle which rules are active. Only rules set to <strong className="text-emerald-700">Active (Compulsory)</strong> are evaluated. Recommendations require an exact <strong className="text-rose-700">100% match ({activeGuardrailCount}/{activeGuardrailCount})</strong> of active rules — any single failure triggers an immediate knockout veto.
                </p>
              </div>

              {/* Fast Select Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={enableAllGuardrails}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    activeGuardrailCount === 11
                      ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                      : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  }`}
                >
                  All 11 Active (100% Compulsory)
                </button>
                <button
                  type="button"
                  onClick={selectCore7Guardrails}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    activeGuardrailCount === 7
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                  }`}
                >
                  Core 7 Active (7/7 Compulsory)
                </button>
              </div>
            </div>

            {/* Grid of 11 Guardrails with Individual Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {GUARDRAIL_RULES_LIST.map((r) => {
                const isActive = activeGuardrailRulesEnabled[r.id] !== false;
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleGuardrailRule(r.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 select-none ${
                      isActive
                        ? "bg-emerald-50/40 border-emerald-300/80 shadow-2xs hover:bg-emerald-50/70"
                        : "bg-slate-50/50 border-slate-200 opacity-60 hover:opacity-100 hover:bg-slate-100/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-slate-800">
                            #{r.num} {r.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {r.tag}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <IOSSwitch
                          checked={isActive}
                          onChange={() => toggleGuardrailRule(r.id)}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {r.desc}
                    </p>

                    <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                        isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}>
                        {isActive ? "✓ Compulsory (100% Match)" : "⚪ Bypassed / Inactive"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isActive ? "Mandatory gate" : "Ignored in audit"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 1: Trading Days Execution Calendar (Day-of-Week Guardrail Selector) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Trading Days Execution Calendar (5-Day Safety Lock)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select any trading day below to customize its specific safety guardrails. Each day can have its own independent risk thresholds or be blocked entirely.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    ["MON", "TUE", "WED", "THU", "FRI"].forEach(d => {
                      updateDayGuardrails(d, prev => ({ ...prev, enabled: true }));
                    });
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  All 5 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    ["MON", "TUE", "WED"].forEach(d => updateDayGuardrails(d, prev => ({ ...prev, enabled: true })));
                    ["THU", "FRI"].forEach(d => updateDayGuardrails(d, prev => ({ ...prev, enabled: false })));
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                >
                  Mon-Wed (BTST Safe)
                </button>
                <button
                  type="button"
                  onClick={() => copyDaySettingsToAll(activeGuardrailDay)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                  title={`Copy ${activeGuardrailDay} guardrail settings to all 5 days`}
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy {activeGuardrailDay} to All</span>
                </button>
              </div>
            </div>

            {/* 5-Day Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { id: "MON", label: "Monday", sub: "Session Open" },
                { id: "TUE", label: "Tuesday", sub: "Trend Day" },
                { id: "WED", label: "Wednesday", sub: "Mid-Week" },
                { id: "THU", label: "Thursday", sub: "F&O Expiry Volatility" },
                { id: "FRI", label: "Friday", sub: "Weekend Gap Risk" }
              ].map(day => {
                const daySetting = (guardRules.days && guardRules.days[day.id])
                  ? guardRules.days[day.id]
                  : (DEFAULT_DAY_GUARDRAILS[day.id] || DEFAULT_DAY_GUARDRAILS.MON);
                const isAllowed = daySetting.enabled;
                const isSelected = activeGuardrailDay === day.id;
                const isThuOrFri = day.id === "THU" || day.id === "FRI";

                return (
                  <div
                    key={day.id}
                    onClick={() => setActiveGuardrailDay(day.id as any)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? "ring-2 ring-blue-600 border-blue-500 bg-blue-50/40 shadow-sm"
                        : isAllowed
                        ? isThuOrFri
                          ? "bg-amber-50/40 border-amber-300/80 hover:bg-amber-50/70"
                          : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/60"
                        : "bg-slate-50/40 border-slate-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-slate-900">{day.id}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          isAllowed ? (isThuOrFri ? "bg-amber-500" : "bg-blue-600") : "bg-slate-300"
                        }`} />
                        {isSelected && (
                          <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-100 px-1 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold block mt-1 text-slate-800">{day.label}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{day.sub}</span>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        isAllowed
                          ? isThuOrFri
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}>
                        {isAllowed ? "Enabled" : "Blocked"}
                      </span>

                      {/* Mini Switch to toggle enabled for this day */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateDayGuardrails(day.id, prev => ({ ...prev, enabled: !isAllowed }));
                        }}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          isAllowed
                            ? "text-rose-600 hover:bg-rose-50"
                            : "text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        {isAllowed ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Thursday / Friday Blocked Shield Alert */}
            {((guardRules.days?.THU?.enabled === false) || (guardRules.days?.FRI?.enabled === false)) && (
              <div className="bg-amber-50/80 border border-amber-300/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block">
                    🛡️ Capital Protection Shield: Thursday / Friday Entry Lock Active
                  </span>
                  <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                    Thursday (F&O Weekly Expiry volatility) and/or Friday (weekend macro gap risk) entries are strictly blocked. Positions initiated on Monday, Tuesday, or Wednesday give ample time to capture moves without overnight weekend risks.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Active Day Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-500/30 border border-blue-400/40 text-blue-200 text-[11px] font-black rounded-md font-mono">
                  {activeGuardrailDay}
                </span>
                <h3 className="text-base font-black tracking-tight">
                  {activeGuardrailDay === "MON" && "Monday Guardrail Rules & Risk Controls"}
                  {activeGuardrailDay === "TUE" && "Tuesday Guardrail Rules & Risk Controls"}
                  {activeGuardrailDay === "WED" && "Wednesday Guardrail Rules & Risk Controls"}
                  {activeGuardrailDay === "THU" && "Thursday (Weekly F&O Expiry) Guardrail Rules"}
                  {activeGuardrailDay === "FRI" && "Friday (Weekend Pre-Positioning) Guardrail Rules"}
                </h3>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {activeGuardrailDay === "MON" && "Opening range discovery. Enforces clean breakout cushion from open and eliminates pre-market noise."}
                {activeGuardrailDay === "TUE" && "Prime trend day with highest momentum continuation. Allows slightly wider trend expansion."}
                {activeGuardrailDay === "WED" && "Mid-week institutional liquidity day. Balances tight value anchors with robust volume surge."}
                {activeGuardrailDay === "THU" && "Weekly NSE F&O Expiry day prone to violent stop-hunting and index whipsaws. Tighter thresholds and higher turnover are recommended."}
                {activeGuardrailDay === "FRI" && "Pre-weekend session. Stricter circuit buffer and drawdown controls protect against holding into weekend macro gap risks."}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-300 block">Day Execution Status</span>
                <span className={`text-xs font-black uppercase ${activeDaySettings.enabled ? "text-emerald-400" : "text-rose-400"}`}>
                  {activeDaySettings.enabled ? "Entries Permitted" : "Entries Blocked"}
                </span>
              </div>
              <IOSSwitch
                checked={activeDaySettings.enabled}
                onChange={(val) => updateDayGuardrails(activeGuardrailDay, prev => ({ ...prev, enabled: val }))}
              />
            </div>
          </div>

          {!activeDaySettings.enabled && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="font-black">Notice: Entries on {activeGuardrailDay} are disabled.</span>
                <p className="text-rose-700 mt-0.5">
                  The scanner will fast-fail and reject any candle dated on {activeGuardrailDay}. You can still configure or review the guardrail rules below for when this day is enabled.
                </p>
              </div>
            </div>
          )}

          {/* Section 2: Technical Value-Anchor & Price Traps */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>Category 1: Value-Anchor & Price Traps ({activeGuardrailDay})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prevents chasing overextended green candles, morning exhaustion gaps, or struggling opens.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400 font-mono">3 Rules</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Gate 1: Max VWAP Distance */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">1. Max VWAP Distance (%)</label>
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    ≤+{activeDaySettings.max_vwap_distance_pct ?? 1.2}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="3.0"
                  step="0.1"
                  value={activeDaySettings.max_vwap_distance_pct ?? 1.2}
                  onChange={(e) => updateDayGuardrails(activeGuardrailDay, prev => ({ ...prev, max_vwap_distance_pct: parseFloat(e.target.value) || 1.2 }))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.4% (Ultra Tight)</span>
                  <span>1.2% (Standard)</span>
                  <span>3.0% (Wide)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  Fast-fail rejects buying any candle overextended far above VWAP. Prevents buying at the top of an exhausted climax run.
                </p>
              </div>

              {/* Gate 2: Max Gap-Up Open */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">2. Max Gap-Up Open (%)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1.0"
                      max="8.0"
                      step="0.1"
                      value={activeDaySettings.max_gap_open_pct ?? 3.5}
                      onChange={(e) => updateDayGuardrails(activeGuardrailDay, prev => ({ ...prev, max_gap_open_pct: parseFloat(e.target.value) || 3.5 }))}
                      className="w-16 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-center"
                    />
                    <span className="font-bold text-slate-500">%</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  Disqualifies stocks opening above this threshold relative to previous close. Protects against morning gap-and-crap traps.
                </p>
              </div>

              {/* Gate 3: Min Day-Open Cushion */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">3. Min Day-Open Cushion (%)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.1"
                      max="3.0"
                      step="0.1"
                      value={activeDaySettings.min_open_cushion_pct ?? 0.5}
                      onChange={(e) => updateDayGuardrails(activeGuardrailDay, prev => ({ ...prev, min_open_cushion_pct: parseFloat(e.target.value) || 0.5 }))}
                      className="w-16 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-center"
                    />
                    <span className="font-bold text-slate-500">%</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  Demands trigger candle close to hold safely above the Day Open. Eliminates hesitation setups hovering near open price.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Volume, Liquidity & Orderbook Protection */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Category 2: Volume, Liquidity & Spread Protection ({activeGuardrailDay})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filters out dry float drifts, illiquid operator candles, and dangerous bid-ask slippage.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400 font-mono">3 Rules</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Gate 4: 3-Min Volume Expansion Surge */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">4. 3-Min Volume Expansion</span>
                    <IOSSwitch
                      checked={activeDaySettings.require_volume_expansion ?? true}
                      onChange={(val) => updateDayGuardrails(activeGuardrailDay, prev => ({ ...prev, require_volume_expansion: val }))}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-slate-500">Surge Multiple:</span>
                    <select
                      value={activeDaySettings.min_volume_expansion_ratio ?? 1.5}
                      onChange={(e) => updateDayGuardrails(activeGuardrailDay, prev => ({ ...prev, min_volume_expansion_ratio: parseFloat(e.target.value) || 1.5 }))}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    >
                      <option value="1.2">1.2x (Soft Surge)</option>
                      <option value="1.5">1.5x (Recommended)</option>
                      <option value="2.0">2.0x (Heavy Influx)</option>
                      <option value="2.5">2.5x (Institutional Spike)</option>
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Requires immediate volume influx on the trigger bar relative to the 20-candle moving average. Disqualifies quiet, dry floats.
                </p>
              </div>

              {/* Gate 5: Min 1-Min Bar Turnover */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">5. Min 1-Min Bar Turnover</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.5"
                      max="15.0"
                      step="0.5"
                      value={activeDaySettings.min_bar_turnover_lakhs ?? 2.5}
                      onChange={(e) => updateDayGuardrails(activeGuardrailDay, prev => ({ ...prev, min_bar_turnover_lakhs: parseFloat(e.target.value) || 2.5 }))}
                      className="w-16 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-center"
                    />
                    <span className="font-bold text-slate-500">₹ Lakhs</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  Enforces true institutional turnover in the trigger candle (e.g. ₹2.5L+ on Mon-Wed, ₹4.0L+ on Thursday expiry).
                </p>
              </div>

              {/* Gate 6: Max Bid-Ask Spread */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">6. Max Bid-Ask Spread (%)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.05"
                      max="0.80"
                      step="0.01"
                      value={activeDaySettings.max_bid_ask_spread_pct ?? 0.15}
                      onChange={(e) => updateDayGuardrails(activeGuardrailDay, prev => ({ ...prev, max_bid_ask_spread_pct: parseFloat(e.target.value) || 0.15 }))}
                      className="w-16 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-center"
                    />
                    <span className="font-bold text-slate-500">%</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  Rejects thin orderbooks where large market orders cause high entry slippage. Disqualifies illiquid stocks instantly.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Structure, Base Compression & Circuits */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                  <span>Category 3: Structure & Base Compression ({activeGuardrailDay})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Demands clean price tightening before ignition and protects against hitting upper circuit limits.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400 font-mono">2 Rules</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Gate 7: Coiling Base Consolidation */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">7. Coiling Base Consolidation</span>
                    <IOSSwitch
                      checked={activeDaySettings.require_coiling_base ?? true}
                      onChange={(val) => updateDayGuardrails(activeGuardrailDay, prev => ({ ...prev, require_coiling_base: val }))}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-slate-500">Max 15-Min Compression:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1.0"
                        max="5.0"
                        step="0.1"
                        value={activeDaySettings.max_base_compression_pct ?? 3.0}
                        onChange={(e) => updateDayGuardrails(activeGuardrailDay, prev => ({ ...prev, max_base_compression_pct: parseFloat(e.target.value) || 3.0 }))}
                        className="w-16 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-center"
                      />
                      <span className="font-bold text-slate-500">%</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Demands a tight 15-minute consolidation base before the trigger bar fires. Rejects erratic, choppy wide-range candlesticks.
                </p>
              </div>

              {/* Gate 8: Upper Circuit Safety Buffer */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">8. Upper Circuit Safety Buffer (%)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.5"
                      max="4.0"
                      step="0.1"
                      value={activeDaySettings.circuit_safety_buffer_pct ?? 1.5}
                      onChange={(e) => updateDayGuardrails(activeGuardrailDay, prev => ({ ...prev, circuit_safety_buffer_pct: parseFloat(e.target.value) || 1.5 }))}
                      className="w-16 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-center"
                    />
                    <span className="font-bold text-slate-500">%</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  Vetoes entries if current price is within this percentage of the stock upper circuit limit. Prevents trapped orders or sudden reversals.
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Statistical Habit & Market Anti-Chop */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Category 4: Empirical Habit & Market Anti-Chop ({activeGuardrailDay})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  60-day historical tick patterns and NIFTY index regime checks to prevent fakeouts in hostile market environments.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400 font-mono">3 Rules</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Gate 9: Min Win Rate Floor */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">9. Min Historical Win Rate Floor</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="40"
                      max="85"
                      step="1"
                      value={activeDaySettings.min_win_rate_floor ?? 50}
                      onChange={(e) => updateDayGuardrails(activeGuardrailDay, prev => ({ ...prev, min_win_rate_floor: parseInt(e.target.value, 10) || 50 }))}
                      className="w-16 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-center"
                    />
                    <span className="font-bold text-slate-500">%</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Stocks whose historical 60-day setup win rate is below this floor are rejected automatically, regardless of how promising the current chart looks.
                </p>
              </div>

              {/* Gate 10: Max Retrace ATR Ratio */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">10. Max Retrace ATR Ratio</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={activeDaySettings.max_retrace_atr_ratio ?? 1.2}
                      onChange={(e) => updateDayGuardrails(activeGuardrailDay, prev => ({ ...prev, max_retrace_atr_ratio: parseFloat(e.target.value) || 1.2 }))}
                      className="w-16 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-center"
                    />
                    <span className="font-bold text-slate-500">x ATR</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fast-fail rejects high-whipsaw stocks whose typical pullbacks exceed this multiple of ATR, ensuring tight stop-loss orders are not hit by normal noise.
                </p>
              </div>

              {/* Gate 11: NIFTY Anti-Chop Kill-Switch */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">11. NIFTY Index Anti-Chop Kill-Switch</span>
                    <IOSSwitch
                      checked={activeDaySettings.nifty_anti_chop_filter ?? true}
                      onChange={(val) => updateDayGuardrails(activeGuardrailDay, prev => ({ ...prev, nifty_anti_chop_filter: val }))}
                    />
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    activeDaySettings.nifty_anti_chop_filter ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                  }`}>
                    {activeDaySettings.nifty_anti_chop_filter ? "Active (Kill on Index Chop)" : "Bypassed"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Automatically pauses entries if NIFTY benchmark is trapped in a sideways consolidation range (&lt; 0.15%) or trading below its VWAP.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN 3B: BLOCK B - CURRENT SETUP VERIFICATION (PILLAR C)
         ========================================================================= */}
      {activeBlock === "BLOCK_B" && (() => {
        const activeCount = pillarCRules.filter(r => r.enabled).length;
        const maxPointsPool = pillarCRules.filter(r => r.enabled).reduce((sum, r) => sum + Math.max(...r.options.map(o => o.score), 0), 0);
        const rawPassing = selectedStrategy.block_b_current_params?.min_current_score;
        const default60Score = Math.round(maxPointsPool * 0.6);
        const minPassing = (typeof rawPassing === "number" && rawPassing <= maxPointsPool && rawPassing > 0) ? rawPassing : default60Score;
        const minPct = maxPointsPool > 0 ? Math.round((minPassing / maxPointsPool) * 100) : 60;

        return (
          <div className="space-y-5">
            {/* Hero Summary KPI Banner */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-indigo-700/50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-300">
                      <Zap className="w-4 h-4 text-indigo-300" />
                    </div>
                    <span className="text-[11px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-mono">
                      Stage 3 • Pillar C Pure Scoring
                    </span>
                    <span className="text-[11px] font-bold text-indigo-200">
                      19 Live Technical Indicators
                    </span>
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-mono">
                      60% Default Cutoff
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    Current Setup Verification — Pure Discrete Scoring Engine
                  </h2>
                  <p className="text-xs text-indigo-200/90 mt-1 leading-relaxed">
                    Dynamic range scoring (+3, +2, +1, 0, -1, -2, -3). High conviction momentum earns bonus points, neutral gets 0, and risky signals suffer penalties. Requires passing the 60% cutoff threshold ({default60Score} pts).
                  </p>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-white/5 border border-white/10 p-3 rounded-xl shrink-0 text-center">
                  <div className="px-2">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Active Rules</span>
                    <span className="text-base sm:text-lg font-mono font-black text-white">{activeCount} / 19</span>
                  </div>
                  <div className="px-2 border-x border-white/10">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Max Score Pool</span>
                    <span className="text-base sm:text-lg font-mono font-black text-emerald-400">+{maxPointsPool} pts</span>
                  </div>
                  <div className="px-2">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Passing Cutoff</span>
                    <span className="text-base sm:text-lg font-mono font-black text-amber-300">{minPassing} pts</span>
                  </div>
                </div>
              </div>

              {/* Threshold & Action Controls */}
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl">
                    <span className="font-bold text-indigo-200">Min Passing Score:</span>
                    <input
                      type="number"
                      min="5"
                      max={maxPointsPool}
                      step="1"
                      value={minPassing}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setSelectedStrategy(prev => prev ? {
                          ...prev,
                          block_b_current_params: {
                            ...(prev.block_b_current_params || { enabled: true, status: "ACTIVE", title: "Current Parameter Analysis", description: "" }),
                            min_current_score: val
                          }
                        } : null);
                      }}
                      className="w-16 px-2 py-0.5 text-xs font-mono font-black text-white bg-indigo-950 border border-indigo-400/50 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="text-indigo-300 font-mono">pts ({minPct}%)</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const recommended = Math.round(maxPointsPool * 0.6);
                      setSelectedStrategy(prev => prev ? {
                        ...prev,
                        block_b_current_params: {
                          ...(prev.block_b_current_params || { enabled: true, status: "ACTIVE", title: "Current Parameter Analysis", description: "" }),
                          min_current_score: recommended
                        }
                      } : null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-100 text-[11px] font-bold border border-indigo-400/40 transition-colors cursor-pointer"
                  >
                    Set 60% Cutoff ({default60Score} pts)
                  </button>

                  <span className="text-[11px] text-indigo-300/80 hidden md:inline">
                    Stocks scoring &ge; {minPassing} pts clear Pillar C and advance to Pillar H.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAllPillarCRulesEnabled(true)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Enable All (19)
                  </button>
                  <button
                    type="button"
                    onClick={resetPillarCRulesDefault}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reset Intraday Defaults (7)
                  </button>
                </div>
              </div>
            </div>

            {/* 19 Dynamic Parameter Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Individual Parameter Range & Scoring Options (19 Indicators)
                </span>
                <span className="text-xs text-slate-400">
                  Max Active Pool: <strong className="text-slate-700 font-mono">+{maxPointsPool} Points</strong>
                </span>
              </div>

              {pillarCRules.map((r, idx) => {
                const maxRuleScore = Math.max(...r.options.map(o => o.score), 0);

                return (
                  <div
                    key={r.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 ${
                      r.enabled
                        ? "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                        : "bg-slate-50/70 border-slate-200/60 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900">{r.name}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                              {r.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-700 border border-slate-200 font-mono">
                              Max: {maxRuleScore > 0 ? `+${maxRuleScore}` : maxRuleScore} pts
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                              {r.options.length} Options
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className="text-xs font-bold text-slate-600">
                          {r.enabled ? "Active" : "Disabled"}
                        </span>
                        <IOSSwitch
                          checked={r.enabled}
                          onChange={(val) => updatePillarCRule(r.id, prev => ({ ...prev, enabled: val }))}
                        />
                      </div>
                    </div>

                    {r.enabled ? (
                      <div className="space-y-3 mt-3.5 pt-1">
                        {/* Dynamic Options Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {r.options.map((opt, optIdx) => {
                            const isPositive = opt.score > 0;
                            const isNegative = opt.score < 0;

                            return (
                              <div
                                key={opt.id}
                                className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50/90 transition-all flex flex-col justify-between gap-2.5 shadow-2xs"
                              >
                                {/* Option Header */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-500 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                      {optIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={opt.label}
                                      placeholder={`Option ${optIdx + 1}`}
                                      onChange={(e) => {
                                        const lbl = e.target.value;
                                        updatePillarCRule(r.id, prev => ({
                                          ...prev,
                                          options: prev.options.map(o => o.id === opt.id ? { ...o, label: lbl } : o)
                                        }));
                                      }}
                                      className="text-xs font-semibold text-slate-800 placeholder-slate-400 bg-white/70 hover:bg-white focus:bg-white border border-slate-200/60 focus:border-indigo-400 rounded px-2 py-1 flex-1 min-w-0 focus:outline-none transition-colors"
                                      title="Click to rename option"
                                    />
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[11px] font-medium text-slate-500">Score:</span>
                                    <select
                                      value={opt.score}
                                      onChange={(e) => {
                                        const sc = parseInt(e.target.value, 10);
                                        updatePillarCRule(r.id, prev => ({
                                          ...prev,
                                          options: prev.options.map(o => o.id === opt.id ? { ...o, score: sc } : o)
                                        }));
                                      }}
                                      className={`text-xs font-mono font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none transition-colors ${
                                        isPositive
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                          : isNegative
                                          ? "bg-rose-50 text-rose-700 border-rose-300"
                                          : "bg-white text-slate-700 border-slate-300"
                                      }`}
                                    >
                                      <option value={3}>+3</option>
                                      <option value={2}>+2</option>
                                      <option value={1}>+1</option>
                                      <option value={0}>0</option>
                                      <option value={-1}>-1</option>
                                      <option value={-2}>-2</option>
                                      <option value={-3}>-3</option>
                                    </select>

                                    {r.options.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => removeOptionFromPillarCRule(r.id, opt.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                        title="Delete option"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Clean Range Row (No filter dropdown) */}
                                {r.type === "state" ? (
                                  <div className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 text-xs">
                                    <span className="text-[11px] text-slate-400 font-medium shrink-0">Match:</span>
                                    <input
                                      type="text"
                                      value={opt.state_val || ""}
                                      placeholder="e.g. Bullish on 1m & 5m"
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        updatePillarCRule(r.id, prev => ({
                                          ...prev,
                                          options: prev.options.map(o => o.id === opt.id ? { ...o, state_val: v } : o)
                                        }));
                                      }}
                                      className="w-full text-xs font-medium text-slate-800 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 text-xs">
                                    <span className="text-[11px] text-slate-400 font-medium shrink-0">From</span>
                                    <input
                                      type="number"
                                      step={r.unit === "%" || r.unit === "x" ? "0.1" : "1"}
                                      value={opt.min_val ?? 0}
                                      onChange={(e) => {
                                        const v = parseFloat(e.target.value) || 0;
                                        updatePillarCRule(r.id, prev => ({
                                          ...prev,
                                          options: prev.options.map(o => o.id === opt.id ? { ...o, min_val: v } : o)
                                        }));
                                      }}
                                      className="w-20 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded text-center focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                    <span className="text-[11px] text-slate-400 font-medium shrink-0">to</span>
                                    <input
                                      type="number"
                                      step={r.unit === "%" || r.unit === "x" ? "0.1" : "1"}
                                      value={opt.max_val ?? 0}
                                      onChange={(e) => {
                                        const v = parseFloat(e.target.value) || 0;
                                        updatePillarCRule(r.id, prev => ({
                                          ...prev,
                                          options: prev.options.map(o => o.id === opt.id ? { ...o, max_val: v } : o)
                                        }));
                                      }}
                                      className="w-20 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded text-center focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                    <span className="font-semibold text-slate-500 text-xs shrink-0 font-mono">{r.unit}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Add Option Button (up to 5 options) */}
                        {r.options.length < 5 && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => addOptionToPillarCRule(r.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Option ({r.options.length}/5)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 text-[11px] text-slate-400 italic">
                        This indicator is currently disabled and contributes 0 points to the score pool.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          SCREEN 3C: BLOCK C - HISTORICAL BACKTEST VERIFICATION (PILLAR H)
         ========================================================================= */}
      {activeBlock === "BLOCK_C" && (() => {
        const activeCount = pillarHRules.filter(r => r.enabled).length;
        const maxPointsPool = pillarHRules.filter(r => r.enabled).reduce((sum, r) => sum + Math.max(...r.options.map(o => o.score), 0), 0);
        const rawPassing = selectedStrategy.block_c_validate_history?.min_history_score;
        const default60Score = Math.round(maxPointsPool * 0.6);
        const minPassing = (typeof rawPassing === "number" && rawPassing <= maxPointsPool && rawPassing > 0) ? rawPassing : default60Score;
        const minPct = maxPointsPool > 0 ? Math.round((minPassing / maxPointsPool) * 100) : 60;

        return (
          <div className="space-y-5">
            {/* Hero Summary KPI Banner */}
            <div className="bg-gradient-to-br from-amber-950 via-amber-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-amber-700/50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
                      <BarChart3 className="w-4 h-4 text-amber-300" />
                    </div>
                    <span className="text-[11px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30 font-mono">
                      Stage 4 • Pillar H Pure Scoring
                    </span>
                    <span className="text-[11px] font-bold text-amber-200">
                      12 Empirical Statistical Rules
                    </span>
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-mono">
                      60% Default Cutoff
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    Historical Backtest Verification — Pure Discrete Scoring Engine
                  </h2>
                  <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                    60-day empirical tick vault probability verification with discrete scores (+3, +2, +1, 0, -1, -2, -3). High historical win rate and shallow pullbacks award bonus points, while frequent stop-outs suffer deductions. Requires meeting the 60% passing cutoff ({default60Score} pts).
                  </p>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-white/5 border border-white/10 p-3 rounded-xl shrink-0 text-center">
                  <div className="px-2">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Active Rules</span>
                    <span className="text-base sm:text-lg font-mono font-black text-white">{activeCount} / 12</span>
                  </div>
                  <div className="px-2 border-x border-white/10">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Max Score Pool</span>
                    <span className="text-base sm:text-lg font-mono font-black text-emerald-400">+{maxPointsPool} pts</span>
                  </div>
                  <div className="px-2">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Passing Cutoff</span>
                    <span className="text-base sm:text-lg font-mono font-black text-amber-300">{minPassing} pts</span>
                  </div>
                </div>
              </div>

              {/* Threshold & Action Controls */}
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl">
                    <span className="font-bold text-amber-200">Min Historical Cutoff:</span>
                    <input
                      type="number"
                      min="5"
                      max={maxPointsPool}
                      step="1"
                      value={minPassing}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setSelectedStrategy(prev => prev ? {
                          ...prev,
                          block_c_validate_history: {
                            ...(prev.block_c_validate_history || { enabled: true, status: "ACTIVE", title: "Validate with History", description: "" }),
                            min_history_score: val
                          }
                        } : null);
                      }}
                      className="w-16 px-2 py-0.5 text-xs font-mono font-black text-white bg-amber-950 border border-amber-400/50 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="text-amber-300 font-mono">pts ({minPct}%)</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const recommended = Math.round(maxPointsPool * 0.6);
                      setSelectedStrategy(prev => prev ? {
                        ...prev,
                        block_c_validate_history: {
                          ...(prev.block_c_validate_history || { enabled: true, status: "ACTIVE", title: "Validate with History", description: "" }),
                          min_history_score: recommended
                        }
                      } : null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 text-amber-100 text-[11px] font-bold border border-amber-400/40 transition-colors cursor-pointer"
                  >
                    Set 60% Cutoff ({default60Score} pts)
                  </button>

                  <span className="text-[11px] text-amber-300/80 hidden md:inline">
                    Stocks scoring &ge; {minPassing} pts clear Pillar H and advance to Priority Allocator.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAllPillarHRulesEnabled(true)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Enable All (12)
                  </button>
                  <button
                    type="button"
                    onClick={resetPillarHRulesDefault}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reset Intraday Defaults (5)
                  </button>
                </div>
              </div>
            </div>

            {/* 12 Dynamic Parameter Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Individual Statistical Rules & Scoring Options (12 Rules)
                </span>
                <span className="text-xs text-slate-400">
                  Max Active Pool: <strong className="text-slate-700 font-mono">+{maxPointsPool} Points</strong>
                </span>
              </div>

              {pillarHRules.map((r, idx) => {
                const maxRuleScore = Math.max(...r.options.map(o => o.score), 0);

                return (
                  <div
                    key={r.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 ${
                      r.enabled
                        ? "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                        : "bg-slate-50/70 border-slate-200/60 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900">{r.name}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                              {r.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-700 border border-slate-200 font-mono">
                              Max: {maxRuleScore > 0 ? `+${maxRuleScore}` : maxRuleScore} pts
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                              {r.options.length} Options
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className="text-xs font-bold text-slate-600">
                          {r.enabled ? "Active" : "Disabled"}
                        </span>
                        <IOSSwitch
                          checked={r.enabled}
                          onChange={(val) => updatePillarHRule(r.id, prev => ({ ...prev, enabled: val }))}
                        />
                      </div>
                    </div>

                    {r.enabled ? (
                      <div className="space-y-3 mt-3.5 pt-1">
                        {/* Dynamic Options Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {r.options.map((opt, optIdx) => {
                            const isPositive = opt.score > 0;
                            const isNegative = opt.score < 0;

                            return (
                              <div
                                key={opt.id}
                                className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50/90 transition-all flex flex-col justify-between gap-2.5 shadow-2xs"
                              >
                                {/* Option Header */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-500 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                      {optIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={opt.label}
                                      placeholder={`Option ${optIdx + 1}`}
                                      onChange={(e) => {
                                        const lbl = e.target.value;
                                        updatePillarHRule(r.id, prev => ({
                                          ...prev,
                                          options: prev.options.map(o => o.id === opt.id ? { ...o, label: lbl } : o)
                                        }));
                                      }}
                                      className="text-xs font-semibold text-slate-800 placeholder-slate-400 bg-white/70 hover:bg-white focus:bg-white border border-slate-200/60 focus:border-amber-400 rounded px-2 py-1 flex-1 min-w-0 focus:outline-none transition-colors"
                                      title="Click to rename option"
                                    />
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[11px] font-medium text-slate-500">Score:</span>
                                    <select
                                      value={opt.score}
                                      onChange={(e) => {
                                        const sc = parseInt(e.target.value, 10);
                                        updatePillarHRule(r.id, prev => ({
                                          ...prev,
                                          options: prev.options.map(o => o.id === opt.id ? { ...o, score: sc } : o)
                                        }));
                                      }}
                                      className={`text-xs font-mono font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none transition-colors ${
                                        isPositive
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                          : isNegative
                                          ? "bg-rose-50 text-rose-700 border-rose-300"
                                          : "bg-white text-slate-700 border-slate-300"
                                      }`}
                                    >
                                      <option value={3}>+3</option>
                                      <option value={2}>+2</option>
                                      <option value={1}>+1</option>
                                      <option value={0}>0</option>
                                      <option value={-1}>-1</option>
                                      <option value={-2}>-2</option>
                                      <option value={-3}>-3</option>
                                    </select>

                                    {r.options.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => removeOptionFromPillarHRule(r.id, opt.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                        title="Delete option"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Clean Range Row (No filter dropdown) */}
                                {r.type === "state" ? (
                                  <div className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 text-xs">
                                    <span className="text-[11px] text-slate-400 font-medium shrink-0">Match:</span>
                                    <input
                                      type="text"
                                      value={opt.state_val || ""}
                                      placeholder="e.g. Higher-Highs persistent"
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        updatePillarHRule(r.id, prev => ({
                                          ...prev,
                                          options: prev.options.map(o => o.id === opt.id ? { ...o, state_val: v } : o)
                                        }));
                                      }}
                                      className="w-full text-xs font-medium text-slate-800 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 text-xs">
                                    <span className="text-[11px] text-slate-400 font-medium shrink-0">From</span>
                                    <input
                                      type="number"
                                      step={r.unit === "%" || r.unit === "x" ? "0.1" : "1"}
                                      value={opt.min_val ?? 0}
                                      onChange={(e) => {
                                        const v = parseFloat(e.target.value) || 0;
                                        updatePillarHRule(r.id, prev => ({
                                          ...prev,
                                          options: prev.options.map(o => o.id === opt.id ? { ...o, min_val: v } : o)
                                        }));
                                      }}
                                      className="w-20 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded text-center focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                    />
                                    <span className="text-[11px] text-slate-400 font-medium shrink-0">to</span>
                                    <input
                                      type="number"
                                      step={r.unit === "%" || r.unit === "x" ? "0.1" : "1"}
                                      value={opt.max_val ?? 0}
                                      onChange={(e) => {
                                        const v = parseFloat(e.target.value) || 0;
                                        updatePillarHRule(r.id, prev => ({
                                          ...prev,
                                          options: prev.options.map(o => o.id === opt.id ? { ...o, max_val: v } : o)
                                        }));
                                      }}
                                      className="w-20 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded text-center focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                    />
                                    <span className="font-semibold text-slate-500 text-xs shrink-0 font-mono">{r.unit}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Add Option Button (up to 5 options) */}
                        {r.options.length < 5 && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => addOptionToPillarHRule(r.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Option ({r.options.length}/5)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 text-[11px] text-slate-400 italic">
                        This rule is currently disabled and contributes 0 points to the score pool.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          SCREEN 3D: BLOCK D - AI VISION SETUP (1 PARAMETER PER LINE)
         ========================================================================= */}
      {activeBlock === "BLOCK_D" && (
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-teal-700" />
              <div>
                <h2 className="text-sm font-bold text-teal-950">
                  AI Vision Setup (Pillar A) — Gemini Multimodal Pipeline
                </h2>
                <p className="text-xs text-teal-800">
                  Verifies multi-timeframe candlestick chart symmetry to reject trap wicks and confirm clean breakouts. Custom prompt rules and model configuration will unlock here soon.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-teal-200/80 text-teal-900 text-[11px] font-bold uppercase shrink-0">
              Active Baseline
            </span>
          </div>

          {/* Dynamic AI Risk & Trap Veto Controls for Active Strategy */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-600" />
                  <span>AI Multimodal Risk Auditor & Trap Veto</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Switches Gemini from an uncritical cheerleader to a ruthless risk auditor to protect users from bull traps.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Dynamic Veto
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Min AI Vision Confidence (%)</label>
                <input
                  type="number"
                  value={selectedStrategy.block_d_ai_vision?.min_vision_score ?? 65}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 65;
                    setSelectedStrategy(prev => prev ? {
                      ...prev,
                      block_d_ai_vision: {
                        ...(prev.block_d_ai_vision || { enabled: true, status: "ACTIVE", title: "AI Vision Setup", description: "" }),
                        min_vision_score: val
                      }
                    } : null);
                  }}
                  className="w-full text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">AI pattern conviction gate</span>
              </div>

              <div className="flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-700 mb-1">Veto Overhead Resistance Walls</span>
                <IOSSwitch
                  checked={selectedStrategy.block_d_ai_vision?.veto_overhead_resistance ?? true}
                  onChange={(val) => {
                    setSelectedStrategy(prev => prev ? {
                      ...prev,
                      block_d_ai_vision: {
                        ...(prev.block_d_ai_vision || { enabled: true, status: "ACTIVE", title: "AI Vision Setup", description: "" }),
                        veto_overhead_resistance: val
                      }
                    } : null);
                  }}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Rejects entry into heavy sell-blocks</span>
              </div>

              <div className="flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-700 mb-1">Veto Extended Upper Trap Wicks</span>
                <IOSSwitch
                  checked={selectedStrategy.block_d_ai_vision?.veto_overextended_wicks ?? true}
                  onChange={(val) => {
                    setSelectedStrategy(prev => prev ? {
                      ...prev,
                      block_d_ai_vision: {
                        ...(prev.block_d_ai_vision || { enabled: true, status: "ACTIVE", title: "AI Vision Setup", description: "" }),
                        veto_overextended_wicks: val
                      }
                    } : null);
                  }}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Rejects shooting star & climax wicks</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
            {[
              { name: "Candlestick Wick Rejection Ratio", desc: "Upper shadow must be less than 25% of the total candle range on the breakout bar.", criteria: "Upper Wick < 25%" },
              { name: "Cup & Handle Consolidation Symmetry", desc: "Visual round bottom consolidation followed by a shallow sideways handle.", criteria: "Symmetric Handle" },
              { name: "Bull Flag Consolidation Width", desc: "Flag pole height at least 2.5x larger than the consolidation drift channel.", criteria: "Flag Ratio 2.5x" },
              { name: "Multi-Timeframe Chart Alignment", desc: "1-minute micro-breakout aligned with the 5-minute and 15-minute trend direction.", criteria: "1m + 5m + 15m" },
              { name: "Gemini Vision Confidence Score (≥ 65/100)", desc: "Multimodal LLM assigns pattern conviction score of at least 65 out of 100.", criteria: "Score ≥ 65/100" },
              { name: "Overhead Resistance Cleanliness", desc: "Absence of nearby heavy price congestion or sell-walls within the target range.", criteria: "Clean Horizon" },
              { name: "False Whipsaw Visual Shield", desc: "Immediate rejection if candle shows long opposing wicks or doji indecision.", criteria: "Zero Indecision" }
            ].map((p, idx) => (
              <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <span className="text-sm font-bold text-slate-900">{p.name}</span>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      {p.criteria}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0">
                  Hardcoded Baseline
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN 3E: BLOCK E - PRIORITY RULES & SESSION ALLOCATOR (12 PARAMETERS)
         ========================================================================= */}
      {activeBlock === "BLOCK_E" && (
        <div className="space-y-6">
          {/* Card Master Status & Draft Mode Explanation Banner */}
          <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-400/20 text-violet-200 border border-violet-400/30">
                    Module 6 • Session Allocator
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    pRules.enabled
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-400/40"
                  }`}>
                    {pRules.enabled ? "● Active & Enforced" : "○ Draft Mode (Engine Inactive)"}
                  </span>
                </div>
                <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-6 h-6 text-violet-300" />
                  <span>Recommendation Priority & Multi-Session Allocator</span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Controls how many recommendations to surface during Morning, Afternoon, and Day End sessions. 
                  When more candidates trigger than allowed, the engine ranks them using your customized 12-factor priority formula.
                </p>
                {!pRules.enabled && (
                  <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-xl px-3 py-1.5 mt-2">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Kept in <strong>Draft Mode</strong>: Parameters you customize and save here are safely preserved, but will <strong>not</strong> filter live recommendations until you toggle this switch to Active.
                    </span>
                  </div>
                )}
              </div>

              {/* Master Activation Toggle Switch */}
              <div className="flex flex-col items-end gap-2 shrink-0 bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl">
                <span className="text-xs font-bold text-slate-200">
                  {pRules.enabled ? "Module Enforced" : "Module Inactive (Draft)"}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-slate-300">
                    {pRules.enabled ? "Live Enforced" : "Draft Only"}
                  </span>
                  <IOSSwitch
                    checked={pRules.enabled}
                    onChange={(checked) => {
                      updatePriorityRules(prev => ({
                        ...prev,
                        enabled: checked,
                        status: checked ? "ACTIVE" : "DRAFT_INACTIVE"
                      }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Session Selector Navigation Tabs */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-xs flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {[
                { id: "morning", label: "Morning Breakout", icon: Sunrise, time: "09:15 - 11:30 AM" },
                { id: "afternoon", label: "Midday Absorption", icon: Sun, time: "11:30 AM - 01:45 PM" },
                { id: "day_end", label: "Power Hour Sweep", icon: Sunset, time: "01:45 - 03:30 PM" }
              ].map((s) => {
                const isSelected = prioritySessionTab === s.id;
                const IconComp = s.icon;
                const sessData = pRules.sessions[s.id as "morning" | "afternoon" | "day_end"];
                return (
                  <button
                    key={s.id}
                    onClick={() => setPrioritySessionTab(s.id as any)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <IconComp className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-400"}`} />
                    <div className="text-left">
                      <div className="font-extrabold">{s.label}</div>
                      <div className={`text-[10px] font-normal ${isSelected ? "text-violet-100" : "text-slate-400"}`}>
                        {s.time} • {sessData?.max_recommendations ?? 5} Max
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={copySessionSettingsToAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              title="Duplicate current tab parameters to Afternoon and Day End"
            >
              <Copy className="w-3.5 h-3.5 text-violet-600" />
              <span>Copy to All Sessions</span>
            </button>
          </div>

          {/* Priority Rules Cards Container (Identical clean layout to Morning Filter Studio) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs divide-y divide-slate-100 overflow-hidden">
            
            {/* Card 1: Institutional VWAP Bounce (Buy the Dip) */}
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="max-w-md">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">1. Institutional VWAP Bounce (Buy the Dip)</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Prop Desk Model
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Never buy the peak. Waits for the stock to pull back near the Volume-Weighted Average Price (VWAP) and enter off institutional defense.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {pRules.vwap_bounce?.enabled && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Max Distance:</span>
                      {[0.3, 0.5, 0.8, 1.0].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => updatePriorityRules(prev => ({
                            ...prev,
                            vwap_bounce: {
                              enabled: true,
                              max_distance_pct: d,
                              bounce_candles: prev.vwap_bounce?.bounce_candles ?? 1
                            }
                          }))}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                            (pRules.vwap_bounce?.max_distance_pct ?? 0.5) === d
                              ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {d}%
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Bounce:</span>
                      {[1, 2].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updatePriorityRules(prev => ({
                            ...prev,
                            vwap_bounce: {
                              enabled: true,
                              max_distance_pct: prev.vwap_bounce?.max_distance_pct ?? 0.5,
                              bounce_candles: c
                            }
                          }))}
                          className={`px-2 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                            (pRules.vwap_bounce?.bounce_candles ?? 1) === c
                              ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {c} Candle{c > 1 ? "s" : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <IOSSwitch
                  checked={pRules.vwap_bounce?.enabled ?? true}
                  onChange={(val) => updatePriorityRules(prev => ({
                    ...prev,
                    vwap_bounce: {
                      enabled: val,
                      max_distance_pct: prev.vwap_bounce?.max_distance_pct ?? 0.5,
                      bounce_candles: prev.vwap_bounce?.bounce_candles ?? 1
                    }
                  }))}
                />
              </div>
            </div>

            {/* Card 2: Level-2 Order Book Imbalance (Depth Dominance) */}
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="max-w-md">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">2. Level-2 Order Book Imbalance</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live Cash Flow
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspects live Dhan market depth to verify real buyer demand. Recommends only when cash buyers significantly outnumber sellers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {pRules.orderbook_imbalance?.enabled && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Buy/Sell Ratio:</span>
                      {[1.5, 2.0, 2.5, 3.0].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => updatePriorityRules(prev => ({
                            ...prev,
                            orderbook_imbalance: {
                              enabled: true,
                              buy_sell_ratio: r,
                              depth_levels: prev.orderbook_imbalance?.depth_levels ?? 5,
                              ask_sweeps: prev.orderbook_imbalance?.ask_sweeps ?? true
                            }
                          }))}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                            (pRules.orderbook_imbalance?.buy_sell_ratio ?? 2.0) === r
                              ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {r.toFixed(1)}x
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Depth:</span>
                      {[3, 5].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => updatePriorityRules(prev => ({
                            ...prev,
                            orderbook_imbalance: {
                              enabled: true,
                              buy_sell_ratio: prev.orderbook_imbalance?.buy_sell_ratio ?? 2.0,
                              depth_levels: d,
                              ask_sweeps: prev.orderbook_imbalance?.ask_sweeps ?? true
                            }
                          }))}
                          className={`px-2 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                            (pRules.orderbook_imbalance?.depth_levels ?? 5) === d
                              ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Top {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <IOSSwitch
                  checked={pRules.orderbook_imbalance?.enabled ?? true}
                  onChange={(val) => updatePriorityRules(prev => ({
                    ...prev,
                    orderbook_imbalance: {
                      enabled: val,
                      buy_sell_ratio: prev.orderbook_imbalance?.buy_sell_ratio ?? 2.0,
                      depth_levels: prev.orderbook_imbalance?.depth_levels ?? 5,
                      ask_sweeps: prev.orderbook_imbalance?.ask_sweeps ?? true
                    }
                  }))}
                />
              </div>
            </div>

            {/* Card 3: Breakout Retest Confirmation (Anti-Bull Trap) */}
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="max-w-md">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">3. Breakout Retest Confirmation</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Trap Killer
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Eliminates buying the peak. Requires the stock to touch the breakout level, pull back, and prove that buyers defend the new support floor.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {pRules.breakout_retest?.enabled && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Hold Time:</span>
                      {[1, 2, 3].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => updatePriorityRules(prev => ({
                            ...prev,
                            breakout_retest: {
                              enabled: true,
                              retest_hold_mins: m,
                              pullback_tolerance_pct: prev.breakout_retest?.pullback_tolerance_pct ?? 0.4
                            }
                          }))}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                            (pRules.breakout_retest?.retest_hold_mins ?? 2) === m
                              ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {m} Min{m > 1 ? "s" : ""}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Tolerance:</span>
                      {[0.2, 0.4, 0.6].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updatePriorityRules(prev => ({
                            ...prev,
                            breakout_retest: {
                              enabled: true,
                              retest_hold_mins: prev.breakout_retest?.retest_hold_mins ?? 2,
                              pullback_tolerance_pct: t
                            }
                          }))}
                          className={`px-2 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                            (pRules.breakout_retest?.pullback_tolerance_pct ?? 0.4) === t
                              ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {t}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <IOSSwitch
                  checked={pRules.breakout_retest?.enabled ?? true}
                  onChange={(val) => updatePriorityRules(prev => ({
                    ...prev,
                    breakout_retest: {
                      enabled: val,
                      retest_hold_mins: prev.breakout_retest?.retest_hold_mins ?? 2,
                      pullback_tolerance_pct: prev.breakout_retest?.pullback_tolerance_pct ?? 0.4
                    }
                  }))}
                />
              </div>
            </div>

            {/* Card 4: Relative Strength vs Benchmark (Market Decoupling) */}
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="max-w-md">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">4. Relative Strength vs Benchmark</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Decoupled Edge
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filters for institutional leaders that are outperforming NIFTY 50 today. When the broader market rallies, these surge fastest.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {pRules.relative_strength?.enabled && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Outperformance:</span>
                      {[0.5, 1.0, 1.5].map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => updatePriorityRules(prev => ({
                            ...prev,
                            relative_strength: {
                              enabled: true,
                              min_outperformance_pct: o,
                              benchmark: prev.relative_strength?.benchmark ?? "NIFTY50"
                            }
                          }))}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                            (pRules.relative_strength?.min_outperformance_pct ?? 0.5) === o
                              ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          +{o}%
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Benchmark:</span>
                      {["NIFTY50", "SECTOR"].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => updatePriorityRules(prev => ({
                            ...prev,
                            relative_strength: {
                              enabled: true,
                              min_outperformance_pct: prev.relative_strength?.min_outperformance_pct ?? 0.5,
                              benchmark: b
                            }
                          }))}
                          className={`px-2 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                            (pRules.relative_strength?.benchmark ?? "NIFTY50") === b
                              ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {b === "NIFTY50" ? "NIFTY 50" : "Sector Index"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <IOSSwitch
                  checked={pRules.relative_strength?.enabled ?? true}
                  onChange={(val) => updatePriorityRules(prev => ({
                    ...prev,
                    relative_strength: {
                      enabled: val,
                      min_outperformance_pct: prev.relative_strength?.min_outperformance_pct ?? 0.5,
                      benchmark: prev.relative_strength?.benchmark ?? "NIFTY50"
                    }
                  }))}
                />
              </div>
            </div>

            {/* Card 5: Rise-to-Dip Asymmetry Ratio */}
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="max-w-md">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">5. Rise-to-Dip Asymmetry Ratio</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    Smooth Runners
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Eliminates choppy trappers. Requires the stock to historically rise at least 2.0x further on typical intraday rallies than it dips.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {pRules.rise_dip_ratio?.enabled && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Min Ratio:</span>
                      {[1.5, 2.0, 2.5].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => updatePriorityRules(prev => ({
                            ...prev,
                            rise_dip_ratio: {
                              enabled: true,
                              min_ratio: r,
                              lookback_days: prev.rise_dip_ratio?.lookback_days ?? 45,
                              metric: prev.rise_dip_ratio?.metric ?? "MEDIAN"
                            }
                          }))}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                            (pRules.rise_dip_ratio?.min_ratio ?? 2.0) === r
                              ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {r.toFixed(1)}x
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Lookback:</span>
                      {[30, 45, 60].map((lb) => (
                        <button
                          key={lb}
                          type="button"
                          onClick={() => updatePriorityRules(prev => ({
                            ...prev,
                            rise_dip_ratio: {
                              enabled: true,
                              min_ratio: prev.rise_dip_ratio?.min_ratio ?? 2.0,
                              lookback_days: lb,
                              metric: prev.rise_dip_ratio?.metric ?? "MEDIAN"
                            }
                          }))}
                          className={`px-2 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                            (pRules.rise_dip_ratio?.lookback_days ?? 45) === lb
                              ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {lb}D
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <IOSSwitch
                  checked={pRules.rise_dip_ratio?.enabled ?? true}
                  onChange={(val) => updatePriorityRules(prev => ({
                    ...prev,
                    rise_dip_ratio: {
                      enabled: val,
                      min_ratio: prev.rise_dip_ratio?.min_ratio ?? 2.0,
                      lookback_days: prev.rise_dip_ratio?.lookback_days ?? 45,
                      metric: prev.rise_dip_ratio?.metric ?? "MEDIAN"
                    }
                  }))}
                />
              </div>
            </div>

            {/* Card 6: Session Quota & Overload Protection */}
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="max-w-md">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">6. Session Quota & Max Recommendation Cap</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Focus Shield
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prevents recommendation flood by strictly surfacing only the top 3 to 5 highest-conviction opportunities per market session.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {pRules.session_quotas?.enabled && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Morning (09:15-11:30):</span>
                      {[3, 5, 8].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updatePriorityRules(prev => ({
                            ...prev,
                            session_quotas: {
                              enabled: true,
                              morning_cap: c,
                              midday_cap: prev.session_quotas?.midday_cap ?? 3,
                              day_end_cap: prev.session_quotas?.day_end_cap ?? 4
                            }
                          }))}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                            (pRules.session_quotas?.morning_cap ?? 5) === c
                              ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Top {c}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Midday:</span>
                      {[2, 3, 5].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updatePriorityRules(prev => ({
                            ...prev,
                            session_quotas: {
                              enabled: true,
                              morning_cap: prev.session_quotas?.morning_cap ?? 5,
                              midday_cap: c,
                              day_end_cap: prev.session_quotas?.day_end_cap ?? 4
                            }
                          }))}
                          className={`px-2 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                            (pRules.session_quotas?.midday_cap ?? 3) === c
                              ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Top {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <IOSSwitch
                  checked={pRules.session_quotas?.enabled ?? true}
                  onChange={(val) => updatePriorityRules(prev => ({
                    ...prev,
                    session_quotas: {
                      enabled: val,
                      morning_cap: prev.session_quotas?.morning_cap ?? 5,
                      midday_cap: prev.session_quotas?.midday_cap ?? 3,
                      day_end_cap: prev.session_quotas?.day_end_cap ?? 4
                    }
                  }))}
                />
              </div>
            </div>

          </div>

          {/* Sticky Save Confirmation Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">
                Priority Rules Configuration
              </span>
              <span className="text-[11px] text-slate-400">• Ready to apply to live recommendations</span>
            </div>
            <button
              onClick={handleSaveStrategy}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 cursor-pointer transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? "Saved Successfully!" : "Save Strategy"}</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN 3F: BLOCK F - EXECUTION GATE (GO / NO-GO BREAKOUT TRIGGER)
         ========================================================================= */}
      {(activeBlock === "BLOCK_F" || activeBlock === "BLOCK_E") && (
        <div className="space-y-5">
          {/* Master Enable/Disable Switch & Description */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black text-slate-900">
                  Execution Gate & Priority Allocator (Unified Base Trigger)
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Base Module
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                  {activePriorityCount}/8 Active (100% Compulsory)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Controls the precise real-time timing ignition criteria and dynamic session quotas before elevating a <strong className="text-slate-800">CHA-passed stock</strong> to a <strong className="text-emerald-700">Live Recommendation</strong>. All breakout thresholds and session caps below are strictly mandatory requirements.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-700">
                {gateRules.enabled ? "Gate Active (Enforced)" : "Gate Inactive (Draft Mode)"}
              </span>
              <IOSSwitch
                checked={gateRules.enabled}
                onChange={(val) => updateExecutionGate(prev => ({ ...prev, enabled: val }))}
              />
            </div>
          </div>

          {/* Section 0: Active Compulsory Execution Gate Triggers Selection Matrix */}
          <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-emerald-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span>Active Compulsory Execution Gate Triggers ({activePriorityCount} of 8 Active)</span>
                  </h3>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border font-mono ${
                    activePriorityCount === 8
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}>
                    {activePriorityCount === 8 ? "All 8 Active (100% Compulsory)" : `${activePriorityCount}/8 Active (Strict 100% Match Required)`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                  Real-time ignition triggers before elevating a setup to Live Recommendations. Active rules require a strict <strong className="text-emerald-700">100% match ({activePriorityCount}/{activePriorityCount})</strong>. If any single active trigger condition is missed, the setup is blocked from recommendation.
                </p>
              </div>

              {/* Fast Select Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={enableAllPriority}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    activePriorityCount === 8
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  All 8 Active (100% Compulsory)
                </button>
              </div>
            </div>

            {/* Grid of 8 Priority Triggers with Individual Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRIORITY_RULES_LIST.map((r) => {
                const isActive = activePriorityRulesEnabled[r.id] !== false;
                return (
                  <div
                    key={r.id}
                    onClick={() => togglePriorityRule(r.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 select-none ${
                      isActive
                        ? "bg-emerald-50/40 border-emerald-300/80 shadow-2xs hover:bg-emerald-50/70"
                        : "bg-slate-50/50 border-slate-200 opacity-60 hover:opacity-100 hover:bg-slate-100/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-xs text-slate-800 block">
                          #{r.num} {r.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {r.tag}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <IOSSwitch
                          checked={isActive}
                          onChange={() => togglePriorityRule(r.id)}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {r.desc}
                    </p>

                    <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                        isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}>
                        {isActive ? "✓ Compulsory" : "⚪ Bypassed"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isActive ? "100% required" : "Ignored"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settings Cards Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
            {/* Card 1: Breakout & Trigger Price Engine */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">1. High-of-Day (HOD) Breakout Tolerance Ratio</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                    Trigger Price Engine
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Defines how close to the Day's High price must be to trigger. <strong className="text-slate-700">0.998</strong> triggers within 0.2% of HOD; <strong className="text-slate-700">0.990</strong> allows an earlier 1.0% breakout front-run; <strong className="text-slate-700">1.000</strong> strictly demands an exact new Day High breach.
                </p>
                <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-mono text-slate-700">
                  <span className="font-bold text-emerald-700">Live Simulation:</span>
                  <span>₹500.00 HOD stock triggers at ₹{(500 * (gateRules.hod_tolerance_ratio || 0.998)).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[0.990, 0.995, 0.998, 1.000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => updateExecutionGate(prev => ({ ...prev, hod_tolerance_ratio: preset }))}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors font-mono ${
                        gateRules.hod_tolerance_ratio === preset
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset.toFixed(3)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.001"
                    min="0.950"
                    max="1.050"
                    value={gateRules.hod_tolerance_ratio}
                    onChange={(e) => updateExecutionGate(prev => ({ ...prev, hod_tolerance_ratio: parseFloat(e.target.value) || 0.998 }))}
                    className="w-24 px-3 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-right"
                  />
                  <span className="text-xs font-semibold text-slate-400">Ratio</span>
                </div>
              </div>
            </div>

            {/* Card 2: 1-Minute RVOL Surge */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">2. 1-Minute Relative Volume Surge (RVOL)</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                    Volume Ignition
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Requires the 1-minute candle volume at the breakout point to exceed the 15-minute moving average volume by this multiple. Filters out sluggish low-liquidity drift and guarantees institutional participation.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1.0, 1.2, 1.5, 2.0].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => updateExecutionGate(prev => ({ ...prev, min_rvol: preset }))}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors font-mono ${
                        gateRules.min_rvol === preset
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset.toFixed(1)}x
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="5.0"
                    value={gateRules.min_rvol}
                    onChange={(e) => updateExecutionGate(prev => ({ ...prev, min_rvol: parseFloat(e.target.value) || 1.2 }))}
                    className="w-20 px-3 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right"
                  />
                  <span className="text-xs font-semibold text-slate-400">x Vol</span>
                </div>
              </div>
            </div>

            {/* Card 3: Intraday VWAP Launchpad Alignment */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">3. Intraday VWAP Launchpad & Over-Extension Cap</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                    Trend Floor
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Ensures the stock trades cleanly above the volume-weighted average price (VWAP) while capping the maximum allowable distance to prevent buying into over-extended price spikes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Above VWAP:</span>
                  <IOSSwitch
                    checked={gateRules.require_above_vwap}
                    onChange={(val) => updateExecutionGate(prev => ({ ...prev, require_above_vwap: val }))}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-500">Max Distance:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="5.0"
                    value={gateRules.max_vwap_distance_pct}
                    onChange={(e) => updateExecutionGate(prev => ({ ...prev, max_vwap_distance_pct: parseFloat(e.target.value) || 1.5 }))}
                    className="w-18 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-right"
                  />
                  <span className="text-xs font-semibold text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Card 4: Base Compression & Candle Integrity */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">4. Coiled Base Compression & Bullish Candle Close</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                    Trap Shield
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Rejects erratic chop where the preceding 15-minute range exceeds the base compression limit, and verifies that the trigger candle closes in the upper portion of its high-low range (blocks upper-wick shooting star traps).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">Max Base:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="6.0"
                    value={gateRules.max_base_compression_pct}
                    onChange={(e) => updateExecutionGate(prev => ({ ...prev, max_base_compression_pct: parseFloat(e.target.value) || 2.5 }))}
                    className="w-18 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-right"
                  />
                  <span className="text-xs font-semibold text-slate-400">%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">Min Close Pos:</span>
                  <input
                    type="number"
                    step="1"
                    min="50"
                    max="95"
                    value={gateRules.min_candle_close_pos_pct}
                    onChange={(e) => updateExecutionGate(prev => ({ ...prev, min_candle_close_pos_pct: parseInt(e.target.value, 10) || 65 }))}
                    className="w-18 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-right"
                  />
                  <span className="text-xs font-semibold text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Card 5: Order Book Depth & Bid/Ask Imbalance */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">5. Order Book Depth & Bid/Ask Imbalance Ratio</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                    Liquidity Pressure
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Demands buyer queue domination over seller ask wall before triggering. Prevents entering stocks where large hidden sell blocks cap upward movement.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">Min Bid/Ask Ratio:</span>
                  {[1.1, 1.2, 1.5, 2.0].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => updatePriorityRules(prev => ({
                        ...prev,
                        orderbook_imbalance: {
                          enabled: true,
                          buy_sell_ratio: r,
                          depth_levels: prev.orderbook_imbalance?.depth_levels ?? 5,
                          ask_sweeps: prev.orderbook_imbalance?.ask_sweeps ?? true
                        }
                      }))}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors font-mono ${
                        (pRules.orderbook_imbalance?.buy_sell_ratio ?? 1.2) === r
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {r.toFixed(1)}x
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Enforce:</span>
                  <IOSSwitch
                    checked={pRules.orderbook_imbalance?.enabled ?? true}
                    onChange={(val) => updatePriorityRules(prev => ({
                      ...prev,
                      orderbook_imbalance: {
                        enabled: val,
                        buy_sell_ratio: prev.orderbook_imbalance?.buy_sell_ratio ?? 1.2,
                        depth_levels: prev.orderbook_imbalance?.depth_levels ?? 5,
                        ask_sweeps: prev.orderbook_imbalance?.ask_sweeps ?? true
                      }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Card 6: Dynamic Rise / Dip Asymmetry */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">6. Dynamic Rise / Dip Historical Asymmetry</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-mono">
                    Asymmetric Edge
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Eliminates choppy traps. Requires the stock to historically rise at least 2.0x further on typical intraday rallies than it dips over the lookback period.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">Min Ratio:</span>
                  {[1.5, 2.0, 2.5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => updatePriorityRules(prev => ({
                        ...prev,
                        rise_dip_ratio: {
                          enabled: true,
                          min_ratio: r,
                          lookback_days: prev.rise_dip_ratio?.lookback_days ?? 45,
                          metric: prev.rise_dip_ratio?.metric ?? "MEDIAN"
                        }
                      }))}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors font-mono ${
                        (pRules.rise_dip_ratio?.min_ratio ?? 2.0) === r
                          ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {r.toFixed(1)}x
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Enforce:</span>
                  <IOSSwitch
                    checked={pRules.rise_dip_ratio?.enabled ?? true}
                    onChange={(val) => updatePriorityRules(prev => ({
                      ...prev,
                      rise_dip_ratio: {
                        enabled: val,
                        min_ratio: prev.rise_dip_ratio?.min_ratio ?? 2.0,
                        lookback_days: prev.rise_dip_ratio?.lookback_days ?? 45,
                        metric: prev.rise_dip_ratio?.metric ?? "MEDIAN"
                      }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Card 7: Dynamic Risk & ATR Target Engine (X2) */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">7. Dynamic Risk & ATR Target/Stop Loss Engine (X2)</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                    Dynamic Sizing
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Replaces static fixed 0.8% stops with volatility-adjusted brackets. Sets Stop Loss to 1.5x ATR and Target to 2.5x ATR ensuring minimum 1:1.6+ R:R asymmetry.
                </p>
                <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-mono text-slate-700">
                  <span className="font-bold text-emerald-700">Calculated R:R:</span>
                  <span>Target {gateRules.dynamic_risk_reward?.target_atr_mult ?? 2.5}x ATR / SL {gateRules.dynamic_risk_reward?.stop_loss_atr_mult ?? 1.5}x ATR (Ratio: {((gateRules.dynamic_risk_reward?.target_atr_mult ?? 2.5) / (gateRules.dynamic_risk_reward?.stop_loss_atr_mult ?? 1.5)).toFixed(2)}:1)</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">Stop Loss ATR:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="3.0"
                    value={gateRules.dynamic_risk_reward?.stop_loss_atr_mult ?? 1.5}
                    onChange={(e) => updateExecutionGate(prev => ({
                      ...prev,
                      dynamic_risk_reward: {
                        enabled: prev.dynamic_risk_reward?.enabled ?? true,
                        stop_loss_type: prev.dynamic_risk_reward?.stop_loss_type ?? "ATR_BASED",
                        stop_loss_atr_mult: parseFloat(e.target.value) || 1.5,
                        target_atr_mult: prev.dynamic_risk_reward?.target_atr_mult ?? 2.5,
                        min_rr_ratio: prev.dynamic_risk_reward?.min_rr_ratio ?? 1.6
                      }
                    }))}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                  />
                  <span className="text-xs font-semibold text-slate-400">x</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">Target ATR:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1.5"
                    max="5.0"
                    value={gateRules.dynamic_risk_reward?.target_atr_mult ?? 2.5}
                    onChange={(e) => updateExecutionGate(prev => ({
                      ...prev,
                      dynamic_risk_reward: {
                        enabled: prev.dynamic_risk_reward?.enabled ?? true,
                        stop_loss_type: prev.dynamic_risk_reward?.stop_loss_type ?? "ATR_BASED",
                        stop_loss_atr_mult: prev.dynamic_risk_reward?.stop_loss_atr_mult ?? 1.5,
                        target_atr_mult: parseFloat(e.target.value) || 2.5,
                        min_rr_ratio: prev.dynamic_risk_reward?.min_rr_ratio ?? 1.6
                      }
                    }))}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                  />
                  <span className="text-xs font-semibold text-slate-400">x</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Enforce:</span>
                  <IOSSwitch
                    checked={gateRules.dynamic_risk_reward?.enabled ?? true}
                    onChange={(val) => updateExecutionGate(prev => ({
                      ...prev,
                      dynamic_risk_reward: {
                        enabled: val,
                        stop_loss_type: prev.dynamic_risk_reward?.stop_loss_type ?? "ATR_BASED",
                        stop_loss_atr_mult: prev.dynamic_risk_reward?.stop_loss_atr_mult ?? 1.5,
                        target_atr_mult: prev.dynamic_risk_reward?.target_atr_mult ?? 2.5,
                        min_rr_ratio: prev.dynamic_risk_reward?.min_rr_ratio ?? 1.6
                      }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Card 8: Active Trade Management & Trailing Stop / Breakeven Latch (X3) */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">8. Trade Management & Breakeven Latch (X3)</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                    Capital Defense
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Locks in gains once the position moves in our favor. Latches Stop Loss to Entry (Break-even) at +0.80% gain, preventing winning trades from turning into losses.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">Latch Breakeven At:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.4"
                    max="2.0"
                    value={gateRules.trade_management?.breakeven_latch_pct ?? 0.8}
                    onChange={(e) => updateExecutionGate(prev => ({
                      ...prev,
                      trade_management: {
                        enabled: prev.trade_management?.enabled ?? true,
                        breakeven_latch_pct: parseFloat(e.target.value) || 0.8,
                        trailing_stop_enabled: prev.trade_management?.trailing_stop_enabled ?? true
                      }
                    }))}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <span className="text-xs font-semibold text-slate-400">%</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Trailing Stop:</span>
                  <IOSSwitch
                    checked={gateRules.trade_management?.trailing_stop_enabled ?? true}
                    onChange={(val) => updateExecutionGate(prev => ({
                      ...prev,
                      trade_management: {
                        enabled: prev.trade_management?.enabled ?? true,
                        breakeven_latch_pct: prev.trade_management?.breakeven_latch_pct ?? 0.8,
                        trailing_stop_enabled: val
                      }
                    }))}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Enforce:</span>
                  <IOSSwitch
                    checked={gateRules.trade_management?.enabled ?? true}
                    onChange={(val) => updateExecutionGate(prev => ({
                      ...prev,
                      trade_management: {
                        enabled: val,
                        breakeven_latch_pct: prev.trade_management?.breakeven_latch_pct ?? 0.8,
                        trailing_stop_enabled: prev.trade_management?.trailing_stop_enabled ?? true
                      }
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Summary Banner */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Full 4-Stage Institutional Pipeline Overview
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs mt-3">
              <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="font-black text-slate-900 block mb-1">1. Exclusion Shield</span>
                <span className="text-slate-500 text-[11px]">Filters penny stocks, illiquid shares, SME lots, and insolvency distress out of 5,087 equities.</span>
              </div>
              <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="font-black text-slate-900 block mb-1">2. CHA Setup Score</span>
                <span className="text-slate-500 text-[11px]">Validates Current momentum (C ≥ 60%), Historical Win Rate (H ≥ 50%), and AI Vision (A ≥ 60%).</span>
              </div>
              <div className="p-3 bg-white/90 rounded-xl border border-emerald-300 ring-2 ring-emerald-500/20 shadow-2xs">
                <span className="font-black text-emerald-800 block mb-1">3. Execution Gate (Here)</span>
                <span className="text-slate-600 text-[11px]">Monitors live 1-min candles for HOD breakout ({gateRules.hod_tolerance_ratio}), RVOL ({gateRules.min_rvol}x), and VWAP.</span>
              </div>
              <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="font-black text-slate-900 block mb-1">4. Priority Allocation</span>
                <span className="text-slate-500 text-[11px]">Caps morning at 5 and midday at 3 recommendations to keep trading focused and disciplined.</span>
              </div>
            </div>
          </div>

          {/* Sticky Save Confirmation Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">
                Execution Gate Configuration
              </span>
              <span className="text-[11px] text-slate-400">• Real-time breakout engine & trigger prices active</span>
            </div>
            <button
              onClick={handleSaveStrategy}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? "Saved Successfully!" : "Save Strategy"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Excluded Stocks Details Modal */}
      {excludedModal && (
        <ExcludedStocksModal
          ruleId={excludedModal.ruleId}
          ruleTitle={excludedModal.ruleTitle}
          ruleThresholdText={excludedModal.ruleThresholdText}
          strategyRules={aFilters}
          onClose={() => setExcludedModal(null)}
        />
      )}
    </div>
  );
}

export default RecoRulesView;
