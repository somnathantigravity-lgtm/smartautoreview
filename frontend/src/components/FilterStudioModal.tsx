"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Zap,
  Plus,
  Trash2,
  X,
  RotateCcw,
  Check,
  Layers,
  Sparkles,
  TrendingUp,
  Target,
  Clock,
  ShieldCheck,
  Building2,
  Sliders,
  DollarSign,
  BarChart3,
  BookmarkPlus
} from "lucide-react";

export type FilterField =
  | "price"
  | "segment"
  | "session"
  | "stage"
  | "outcome"
  | "score_c"
  | "score_h"
  | "score_a"
  | "score_wa"
  | "buy_volume"
  | "total_volume"
  | "buyers_dominant"
  | "above_vwap"
  | "near_day_high"
  | "target_in_5d"
  | "win_rate"
  | "trap_rate";

export type FilterOperator =
  | "gte"
  | "lte"
  | "eq"
  | "between"
  | "is"
  | "is_not"
  | "is_true"
  | "is_false";

export interface FilterCondition {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: any;
  value2?: any;
}

export interface FilterBucket {
  id: string;
  name: string;
  matchType: "ALL" | "ANY"; // ALL = AND inside bucket, ANY = OR inside bucket
  conditions: FilterCondition[];
}

export interface DynamicFilterConfig {
  enabled: boolean;
  bucketJoin: "AND" | "OR"; // Logic between buckets
  buckets: FilterBucket[];
}

export const DEFAULT_SMART_CONDITIONS: FilterCondition[] = [
  {
    id: "c_def_price",
    field: "price",
    operator: "between",
    value: 50,
    value2: 1000
  },
  {
    id: "c_def_above_vwap",
    field: "above_vwap",
    operator: "is_true",
    value: true
  },
  {
    id: "c_def_buyers",
    field: "buyers_dominant",
    operator: "is_true",
    value: true
  },
  {
    id: "c_def_vol",
    field: "buy_volume",
    operator: "gte",
    value: 50000
  },
  {
    id: "c_def_target5d",
    field: "target_in_5d",
    operator: "is_true",
    value: true
  }
];

export const DEFAULT_FILTER_CONFIG: DynamicFilterConfig = {
  enabled: true,
  bucketJoin: "AND",
  buckets: [
    {
      id: "b1",
      name: "Default Smart Confluence",
      matchType: "ALL",
      conditions: DEFAULT_SMART_CONDITIONS
    }
  ]
};

export interface FieldMeta {
  id: FilterField;
  label: string;
  category: "Price & Size" | "Scores & Conviction" | "Order Flow & VWAP" | "Classification";
  type: "numeric" | "select" | "boolean";
  unit?: string;
  icon: any;
  options?: { value: string; label: string }[];
  defaultOp: FilterOperator;
  defaultValue: any;
}

export const FIELD_DEFINITIONS: FieldMeta[] = [
  // Price & Size
  {
    id: "price",
    label: "Stock Price (LTP)",
    category: "Price & Size",
    type: "numeric",
    unit: "₹",
    icon: DollarSign,
    defaultOp: "gte",
    defaultValue: 100
  },
  {
    id: "buy_volume",
    label: "Buy Volume Depth",
    category: "Price & Size",
    type: "numeric",
    unit: "shares",
    icon: TrendingUp,
    defaultOp: "gte",
    defaultValue: 50000
  },
  {
    id: "total_volume",
    label: "Total Daily Volume",
    category: "Price & Size",
    type: "numeric",
    unit: "shares",
    icon: BarChart3,
    defaultOp: "gte",
    defaultValue: 100000
  },
  {
    id: "segment",
    label: "Market Cap Segment",
    category: "Classification",
    type: "select",
    icon: Building2,
    defaultOp: "is",
    defaultValue: "Large",
    options: [
      { value: "Large", label: "🏢 Large Cap" },
      { value: "Mid", label: "🏗️ Mid Cap" },
      { value: "Small", label: "🏠 Small Cap" },
      { value: "Micro", label: "🔬 Micro Cap" }
    ]
  },
  {
    id: "session",
    label: "Session Timing",
    category: "Classification",
    type: "select",
    icon: Clock,
    defaultOp: "is",
    defaultValue: "MORNING",
    options: [
      { value: "MORNING", label: "🌅 Morning Breakout (09:15 - 11:30)" },
      { value: "MIDDAY", label: "☀️ Midday Consolidation (11:30 - 13:45)" },
      { value: "POWER_HOUR", label: "⚡ Power Hour (13:45 - 15:30)" }
    ]
  },
  {
    id: "stage",
    label: "MICHPA Stage",
    category: "Classification",
    type: "select",
    icon: ShieldCheck,
    defaultOp: "is",
    defaultValue: "AI_PASSED",
    options: [
      { value: "KNOCKOUT_PASSED", label: "🛡️ Knockout Passed" },
      { value: "CURRENT_PASSED", label: "⚡ Current Passed" },
      { value: "HISTORY_PASSED", label: "📊 History Passed" },
      { value: "PRIORITY_PASSED", label: "🚀 Priority Passed" },
      { value: "AI_PASSED", label: "🤖 AI Vision Passed" }
    ]
  },
  {
    id: "outcome",
    label: "Trade Outcome",
    category: "Classification",
    type: "select",
    icon: Target,
    defaultOp: "is",
    defaultValue: "TARGET_HIT",
    options: [
      { value: "TARGET_HIT", label: "🎯 Target Hit" },
      { value: "OPEN", label: "⚡ Position Open" },
      { value: "STOP_LOSS", label: "🛡️ Stop Loss" },
      { value: "SQUARED_OFF", label: "📦 Squared Off" }
    ]
  },
  // Scores & Conviction
  {
    id: "score_c",
    label: "Current Score (Pillar C)",
    category: "Scores & Conviction",
    type: "numeric",
    unit: "%",
    icon: Zap,
    defaultOp: "gte",
    defaultValue: 70
  },
  {
    id: "score_h",
    label: "History Score (Pillar H)",
    category: "Scores & Conviction",
    type: "numeric",
    unit: "%",
    icon: BarChart3,
    defaultOp: "gte",
    defaultValue: 65
  },
  {
    id: "score_a",
    label: "AI Vision Score (Pillar A)",
    category: "Scores & Conviction",
    type: "numeric",
    unit: "%",
    icon: Sparkles,
    defaultOp: "gte",
    defaultValue: 70
  },
  {
    id: "score_wa",
    label: "Weighted Average (WA)",
    category: "Scores & Conviction",
    type: "numeric",
    unit: "%",
    icon: Sliders,
    defaultOp: "gte",
    defaultValue: 80
  },
  {
    id: "win_rate",
    label: "Historical Win Rate",
    category: "Scores & Conviction",
    type: "numeric",
    unit: "%",
    icon: Target,
    defaultOp: "gte",
    defaultValue: 60
  },
  {
    id: "trap_rate",
    label: "Bull Trap Rate (Max)",
    category: "Scores & Conviction",
    type: "numeric",
    unit: "%",
    icon: ShieldCheck,
    defaultOp: "lte",
    defaultValue: 20
  },
  // Order Flow & VWAP
  {
    id: "buyers_dominant",
    label: "Buyers > Sellers Dominance",
    category: "Order Flow & VWAP",
    type: "boolean",
    icon: TrendingUp,
    defaultOp: "is_true",
    defaultValue: true
  },
  {
    id: "above_vwap",
    label: "Price Above VWAP Launchpad",
    category: "Order Flow & VWAP",
    type: "boolean",
    icon: TrendingUp,
    defaultOp: "is_true",
    defaultValue: true
  },
  {
    id: "near_day_high",
    label: "Near Day High (Within %)",
    category: "Order Flow & VWAP",
    type: "numeric",
    unit: "%",
    icon: Target,
    defaultOp: "lte",
    defaultValue: 2.0
  },
  {
    id: "target_in_5d",
    label: "Target Within 5-Day High",
    category: "Order Flow & VWAP",
    type: "boolean",
    icon: Target,
    defaultOp: "is_true",
    defaultValue: true
  }
];

export function countActiveRules(config: DynamicFilterConfig): number {
  if (!config || !config.enabled) return 0;
  return (config.buckets || []).reduce((acc, b) => acc + (b.conditions ? b.conditions.length : 0), 0);
}

export function evalCondition(trade: any, cond: FilterCondition): boolean {
  if (!trade || !cond) return true;

  switch (cond.field) {
    case "price": {
      const ltp = Number(trade.current_price || trade.ltp || (trade.exchange === "NSE" ? trade.nse_price : trade.bse_price) || trade.entry_price || 0);
      const val = Number(cond.value || 0);
      if (cond.operator === "gte") return ltp >= val;
      if (cond.operator === "lte") return ltp <= val;
      if (cond.operator === "eq") return Math.abs(ltp - val) < 0.05;
      if (cond.operator === "between") {
        const val2 = Number(cond.value2 || 999999);
        return ltp >= val && ltp <= val2;
      }
      return true;
    }
    case "segment": {
      const cat = String(trade.market_cap_category || "").toLowerCase();
      const targetVal = String(cond.value || "").toLowerCase();
      if (cond.operator === "is_not") return !cat.includes(targetVal);
      return cat.includes(targetVal);
    }
    case "session": {
      const sess = String(trade.trigger_session || "").toUpperCase();
      const targetVal = String(cond.value || "").toUpperCase();
      if (cond.operator === "is_not") return sess !== targetVal;
      return sess === targetVal;
    }
    case "stage": {
      const targetVal = String(cond.value || "").toUpperCase();
      let match = false;
      if (targetVal === "ALL") {
        match = true;
      } else if (targetVal === "KNOCKOUT_PASSED") {
        match = Boolean((trade as any).is_guardrails_passed !== false && !(trade as any).is_knockout_vetoed);
      } else if (targetVal === "CURRENT_PASSED") {
        match = (trade.score_100 || 0) >= 60 || Boolean((trade as any).is_current_passed);
      } else if (targetVal === "HISTORY_PASSED") {
        match = Boolean((trade as any).is_history_passed) || ((trade.history_score ?? trade.vault_score ?? 0) >= 60);
      } else if (targetVal === "PRIORITY_PASSED") {
        match = Boolean((trade as any).is_priority_passed);
      } else if (targetVal === "AI_PASSED") {
        match = Boolean((trade as any).is_ai_passed || trade.mode_vision || (trade as any).vision_status === "COMPLETED");
      } else {
        match = String(trade.stage || "").toUpperCase() === targetVal;
      }
      if (cond.operator === "is_not") return !match;
      return match;
    }
    case "outcome": {
      const status = String(trade.status || "").toUpperCase();
      const targetVal = String(cond.value || "").toUpperCase();
      let match = status === targetVal;
      if (targetVal === "TARGET_HIT") {
        match = status.includes("TARGET") || status.includes("SUCCESS");
      } else if (targetVal === "STOP_LOSS") {
        match = status.includes("STOP") || status.includes("FAIL");
      } else if (targetVal === "SQUARED_OFF") {
        match = status.includes("SQUARE") || status.includes("CLOSE");
      } else if (targetVal === "OPEN") {
        match = !status.includes("TARGET") && !status.includes("SUCCESS") && !status.includes("STOP") && !status.includes("FAIL") && !status.includes("SQUARE") && !status.includes("CLOSE");
      }
      if (cond.operator === "is_not") return !match;
      return match;
    }
    case "score_c": {
      const c = Number(trade.score_100 || 0);
      const val = Number(cond.value || 0);
      return cond.operator === "lte" ? c <= val : c >= val;
    }
    case "score_h": {
      const h = Number(trade.history_score ?? trade.vault_score ?? 0);
      const val = Number(cond.value || 0);
      return cond.operator === "lte" ? h <= val : h >= val;
    }
    case "score_a": {
      const a = Number(trade.ai_vision_score ?? 70);
      const val = Number(cond.value || 0);
      return cond.operator === "lte" ? a <= val : a >= val;
    }
    case "score_wa": {
      const curScore = Number(trade.score_100 || 0);
      const histScore = Number(trade.history_score ?? trade.vault_score ?? 0);
      const wa = Number(trade.weighted_average ?? Math.round(((curScore * 0.45) + (histScore * 0.35)) / 0.80));
      const val = Number(cond.value || 0);
      return cond.operator === "lte" ? wa <= val : wa >= val;
    }
    case "buy_volume": {
      const buyVol = Number((trade as any).trigger_buy_volume ?? trade.buy_quantity ?? trade.bid_qty ?? trade.total_buy_qty ?? 0);
      const val = Number(cond.value || 0);
      return cond.operator === "lte" ? buyVol <= val : buyVol >= val;
    }
    case "total_volume": {
      const vol = Number((trade as any).trigger_total_volume ?? trade.volume ?? trade.volume_total ?? 0);
      const val = Number(cond.value || 0);
      return cond.operator === "lte" ? vol <= val : vol >= val;
    }
    case "buyers_dominant": {
      const trigDom = (trade as any).trigger_buyers_dominant;
      let isDom = false;
      if (trigDom !== undefined) {
        isDom = Boolean(trigDom);
      } else {
        const bidQ = Number(trade.bid_qty || trade.buy_quantity || trade.total_buy_qty || 0);
        const askQ = Number(trade.ask_qty || trade.sell_quantity || trade.total_sell_qty || 0);
        isDom = (bidQ > 0 && askQ > 0) ? (bidQ > askQ) : (bidQ > 0);
      }
      return cond.operator === "is_false" ? !isDom : isDom;
    }
    case "above_vwap": {
      const trigAbove = (trade as any).trigger_above_vwap;
      if (trigAbove !== undefined) {
        return cond.operator === "is_false" ? !trigAbove : Boolean(trigAbove);
      }
      const vwap = Number(trade.vwap || 0);
      const ltp = Number(trade.ltp || trade.current_price || trade.entry_price || 0);
      if (vwap <= 0 || ltp <= 0) return true;
      const isAbove = ltp >= vwap;
      return cond.operator === "is_false" ? !isAbove : isAbove;
    }
    case "near_day_high": {
      const trigDist = (trade as any).trigger_day_high_dist_pct;
      const maxPct = Number(cond.value || 2.0);
      if (trigDist !== undefined) {
        return Number(trigDist) <= maxPct;
      }
      const dh = Number(trade.day_high || 0);
      const ltp = Number(trade.ltp || trade.current_price || trade.entry_price || 0);
      if (dh <= 0 || ltp <= 0) return true;
      const distPct = ((dh - ltp) / ltp) * 100;
      return distPct <= maxPct;
    }
    case "target_in_5d": {
      const h5d = Number((trade as any).trigger_high_5d || trade.high_5d || 0);
      const tgt = Number(trade.target_price || 0);
      if (h5d <= 0 || tgt <= 0) return true;
      const inRange = tgt <= h5d;
      return cond.operator === "is_false" ? !inRange : inRange;
    }
    case "win_rate": {
      const wr = Number(trade.win_rate ?? trade.history_win_rate ?? -1);
      if (wr < 0) return true;
      const val = Number(cond.value || 60);
      return cond.operator === "lte" ? wr <= val : wr >= val;
    }
    case "trap_rate": {
      const tr = Number(trade.bull_trap_pct ?? -1);
      if (tr < 0) return true;
      const val = Number(cond.value || 20);
      return tr <= val;
    }
    default:
      return true;
  }
}

export function matchesDynamicFilter(trade: any, config: DynamicFilterConfig): boolean {
  if (!config || !config.enabled || !config.buckets || config.buckets.length === 0) return true;

  const activeBuckets = config.buckets.filter(b => b.conditions && b.conditions.length > 0);
  if (activeBuckets.length === 0) return true;

  const evalBucket = (bucket: FilterBucket): boolean => {
    if (!bucket.conditions || bucket.conditions.length === 0) return true;
    if (bucket.matchType === "ALL") {
      return bucket.conditions.every(c => evalCondition(trade, c));
    } else {
      return bucket.conditions.some(c => evalCondition(trade, c));
    }
  };

  if (config.bucketJoin === "AND") {
    return activeBuckets.every(evalBucket);
  } else {
    return activeBuckets.some(evalBucket);
  }
}

interface FilterStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DynamicFilterConfig;
  onApply: (config: DynamicFilterConfig) => void;
  trades: any[];
}

export const FilterStudioModal: React.FC<FilterStudioModalProps> = ({
  isOpen,
  onClose,
  config,
  onApply,
  trades
}) => {
  // Local working copy of state inside the modal
  const [workingConfig, setWorkingConfig] = useState<DynamicFilterConfig>(config);
  const [customPresets, setCustomPresets] = useState<{ name: string; config: DynamicFilterConfig }[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);

  // Sync working config when modal opens
  useEffect(() => {
    if (isOpen) {
      setWorkingConfig(JSON.parse(JSON.stringify(config)));
    }
  }, [isOpen, config]);

  // Load custom presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dalal_filter_presets_custom");
      if (saved) {
        setCustomPresets(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Save presets to localStorage
  const handleSaveCustomPreset = () => {
    if (!newPresetName.trim()) return;
    const updated = [
      ...customPresets.filter(p => p.name !== newPresetName.trim()),
      { name: newPresetName.trim(), config: { ...workingConfig, enabled: true } }
    ];
    setCustomPresets(updated);
    try {
      localStorage.setItem("dalal_filter_presets_custom", JSON.stringify(updated));
    } catch {}
    setNewPresetName("");
    setShowSavePresetInput(false);
  };

  const handleDeleteCustomPreset = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter(p => p.name !== name);
    setCustomPresets(updated);
    try {
      localStorage.setItem("dalal_filter_presets_custom", JSON.stringify(updated));
    } catch {}
  };

  // Real-time live count preview
  const matchingTradesCount = useMemo(() => {
    const previewCfg = { ...workingConfig, enabled: true };
    return trades.filter(t => matchesDynamicFilter(t, previewCfg)).length;
  }, [trades, workingConfig]);

  if (!isOpen) return null;

  // Add Bucket
  const handleAddBucket = () => {
    const newBucket: FilterBucket = {
      id: `b_${Date.now()}`,
      name: `Bucket ${workingConfig.buckets.length + 1}`,
      matchType: "ALL",
      conditions: []
    };
    setWorkingConfig(prev => ({
      ...prev,
      buckets: [...prev.buckets, newBucket]
    }));
  };

  // Remove Bucket
  const handleRemoveBucket = (bucketId: string) => {
    if (workingConfig.buckets.length <= 1) {
      // If only 1 bucket, just clear its conditions
      setWorkingConfig(prev => ({
        ...prev,
        buckets: [{ id: "b1", name: "Bucket 1", matchType: "ALL", conditions: [] }]
      }));
      return;
    }
    setWorkingConfig(prev => ({
      ...prev,
      buckets: prev.buckets.filter(b => b.id !== bucketId)
    }));
  };

  // Add Condition to Bucket
  const handleAddCondition = (bucketId: string) => {
    const defaultDef = FIELD_DEFINITIONS[0];
    const newCond: FilterCondition = {
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      field: defaultDef.id,
      operator: defaultDef.defaultOp,
      value: defaultDef.defaultValue
    };
    setWorkingConfig(prev => ({
      ...prev,
      buckets: prev.buckets.map(b => {
        if (b.id !== bucketId) return b;
        return {
          ...b,
          conditions: [...b.conditions, newCond]
        };
      })
    }));
  };

  // Update Condition Field
  const handleUpdateConditionField = (bucketId: string, condId: string, newField: FilterField) => {
    const fieldDef = FIELD_DEFINITIONS.find(f => f.id === newField) || FIELD_DEFINITIONS[0];
    setWorkingConfig(prev => ({
      ...prev,
      buckets: prev.buckets.map(b => {
        if (b.id !== bucketId) return b;
        return {
          ...b,
          conditions: b.conditions.map(c => {
            if (c.id !== condId) return c;
            return {
              ...c,
              field: newField,
              operator: fieldDef.defaultOp,
              value: fieldDef.defaultValue,
              value2: undefined
            };
          })
        };
      })
    }));
  };

  // Update Condition Details
  const handleUpdateCondition = (bucketId: string, condId: string, patch: Partial<FilterCondition>) => {
    setWorkingConfig(prev => ({
      ...prev,
      buckets: prev.buckets.map(b => {
        if (b.id !== bucketId) return b;
        return {
          ...b,
          conditions: b.conditions.map(c => {
            if (c.id !== condId) return c;
            return { ...c, ...patch };
          })
        };
      })
    }));
  };

  // Delete Condition
  const handleDeleteCondition = (bucketId: string, condId: string) => {
    setWorkingConfig(prev => ({
      ...prev,
      buckets: prev.buckets.map(b => {
        if (b.id !== bucketId) return b;
        return {
          ...b,
          conditions: b.conditions.filter(c => c.id !== condId)
        };
      })
    }));
  };

  // Toggle matchType inside bucket (ALL vs ANY)
  const handleToggleBucketMatchType = (bucketId: string) => {
    setWorkingConfig(prev => ({
      ...prev,
      buckets: prev.buckets.map(b => {
        if (b.id !== bucketId) return b;
        return {
          ...b,
          matchType: b.matchType === "ALL" ? "ANY" : "ALL"
        };
      })
    }));
  };

  // 1-Click Quick Presets
  const applyPreset = (presetKey: string) => {
    switch (presetKey) {
      case "SMART_DEFAULT":
        setWorkingConfig(JSON.parse(JSON.stringify(DEFAULT_FILTER_CONFIG)));
        break;
      case "CLEAR":
        setWorkingConfig({
          enabled: false,
          bucketJoin: "AND",
          buckets: [{ id: "b1", name: "Bucket 1", matchType: "ALL", conditions: [] }]
        });
        break;
      case "HIGH_VOL":
        setWorkingConfig({
          enabled: true,
          bucketJoin: "AND",
          buckets: [
            {
              id: "b1",
              name: "High Liquidity & Volume",
              matchType: "ALL",
              conditions: [
                { id: "c1", field: "buy_volume", operator: "gte", value: 50000 },
                { id: "c2", field: "above_vwap", operator: "is_true", value: true }
              ]
            }
          ]
        });
        break;
      case "NEAR_HOD":
        setWorkingConfig({
          enabled: true,
          bucketJoin: "AND",
          buckets: [
            {
              id: "b1",
              name: "Breakout Ignition",
              matchType: "ALL",
              conditions: [
                { id: "c1", field: "near_day_high", operator: "lte", value: 2.0 },
                { id: "c2", field: "buyers_dominant", operator: "is_true", value: true }
              ]
            }
          ]
        });
        break;
      case "HOLY_GRAIL":
        setWorkingConfig({
          enabled: true,
          bucketJoin: "AND",
          buckets: [
            {
              id: "b1",
              name: "3 Pillars Confluence (C & H & A)",
              matchType: "ALL",
              conditions: [
                { id: "c1", field: "score_c", operator: "gte", value: 75 },
                { id: "c2", field: "score_h", operator: "gte", value: 70 },
                { id: "c3", field: "score_a", operator: "gte", value: 70 }
              ]
            }
          ]
        });
        break;
      case "INSTITUTIONAL_PRIME":
        setWorkingConfig({
          enabled: true,
          bucketJoin: "AND",
          buckets: [
            {
              id: "b1",
              name: "Institutional Prime Flow",
              matchType: "ALL",
              conditions: [
                { id: "c1", field: "score_wa", operator: "gte", value: 80 },
                { id: "c2", field: "buyers_dominant", operator: "is_true", value: true },
                { id: "c3", field: "above_vwap", operator: "is_true", value: true }
              ]
            }
          ]
        });
        break;
      case "MULTI_BUCKET_SAMPLE":
        setWorkingConfig({
          enabled: true,
          bucketJoin: "OR",
          buckets: [
            {
              id: "b1",
              name: "Bucket 1: Large Cap Steady",
              matchType: "ALL",
              conditions: [
                { id: "c1", field: "segment", operator: "is", value: "Large" },
                { id: "c2", field: "score_h", operator: "gte", value: 65 }
              ]
            },
            {
              id: "b2",
              name: "Bucket 2: High Surge Mid/Small",
              matchType: "ALL",
              conditions: [
                { id: "c3", field: "buy_volume", operator: "gte", value: 50000 },
                { id: "c4", field: "above_vwap", operator: "is_true", value: true }
              ]
            }
          ]
        });
        break;
      default:
        break;
    }
  };

  const handleCommit = () => {
    const totalActiveRules = workingConfig.buckets.reduce((acc, b) => acc + b.conditions.length, 0);
    const finalConfig: DynamicFilterConfig = {
      ...workingConfig,
      enabled: totalActiveRules > 0
    };
    onApply(finalConfig);
    onClose();
  };

  const handleResetToDefault = () => {
    applyPreset("SMART_DEFAULT");
  };

  const handleClearAll = () => {
    applyPreset("CLEAR");
  };

  const totalRules = workingConfig.buckets.reduce((acc, b) => acc + b.conditions.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-5xl xl:max-w-6xl h-[88vh] max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header: Premium Obsidian & Indigo Confluence Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-indigo-500/20">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-600/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Filter Studio &amp; Confluence Engine
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 tracking-wide">
                  Dynamic Rule Builder
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Build condition Buckets connected by AND / OR logic to pinpoint institutional confluence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Preview Match Counter */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-slate-300">Live Match:</span>
              <span className="font-mono text-sm font-black text-emerald-400">
                {matchingTradesCount} <span className="text-slate-400 text-xs font-normal">/ {trades.length}</span>
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                {trades.length > 0 ? ((matchingTradesCount / trades.length) * 100).toFixed(1) : 0}%
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
              title="Close filter studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1-Click Quick Presets Bar */}
        <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto shrink-0 scrollbar-thin">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Presets:</span>
            </span>

            {/* Default Smart Confluence Filter (Price 50-1000 + 4 Smart Rules) */}
            <button
              type="button"
              onClick={() => applyPreset("SMART_DEFAULT")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500/25 via-amber-500/30 to-amber-600/25 border border-amber-400/60 text-amber-200 hover:bg-amber-500/35 hover:text-white transition-all cursor-pointer shadow-xs"
              title="Reset to 4 Smart Filters + Price between ₹50 and ₹1,000"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>⭐ Smart Default (₹50-1k + 4 Rules)</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset("CLEAR")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shadow-2xs"
            >
              🌐 Show All ({trades.length})
            </button>
            <button
              type="button"
              onClick={() => applyPreset("HIGH_VOL")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-700/60 text-indigo-300 hover:text-white transition-colors cursor-pointer shadow-2xs"
            >
              ⚡ Buy Vol &gt; 50k
            </button>
            <button
              type="button"
              onClick={() => applyPreset("NEAR_HOD")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 hover:text-white transition-colors cursor-pointer shadow-2xs"
            >
              🚀 Near HOD + Demand
            </button>
            <button
              type="button"
              onClick={() => applyPreset("HOLY_GRAIL")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-950/80 hover:bg-violet-900/80 border border-violet-700/60 text-violet-300 hover:text-white transition-colors cursor-pointer shadow-2xs"
            >
              👑 3 Pillars (C,H,A ≥ 70)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("INSTITUTIONAL_PRIME")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/80 hover:bg-rose-900/80 border border-rose-700/60 text-rose-300 hover:text-white transition-colors cursor-pointer shadow-2xs"
            >
              🔥 WA ≥ 80% + VWAP
            </button>
            <button
              type="button"
              onClick={() => applyPreset("MULTI_BUCKET_SAMPLE")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-950/80 hover:bg-sky-900/80 border border-sky-700/60 text-sky-300 hover:text-white transition-colors cursor-pointer shadow-2xs"
            >
              🔀 Multi-Bucket Demo (A OR B)
            </button>

            {/* Custom Saved Presets */}
            {customPresets.map((p, idx) => (
              <div key={idx} className="inline-flex items-center rounded-xl bg-slate-800 border border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setWorkingConfig(p.config)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-200 hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  ⭐ {p.name}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteCustomPreset(p.name, e)}
                  className="px-2 py-1 text-slate-400 hover:text-rose-400 text-xs cursor-pointer"
                  title="Delete preset"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {showSavePresetInput ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Preset Name..."
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-indigo-400 font-medium"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomPreset}
                  className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowSavePresetInput(false)}
                  className="px-1.5 py-1 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSavePresetInput(true)}
                disabled={totalRules === 0}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  totalRules === 0
                    ? "text-slate-600 border-slate-800 cursor-not-allowed"
                    : "text-indigo-300 border-indigo-700/60 bg-indigo-950/60 hover:bg-indigo-900/80 cursor-pointer"
                }`}
                title="Save current rule setup as a reusable preset"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save Preset</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Rule Builder */}
        <div className="p-6 sm:p-7 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {workingConfig.buckets.map((bucket, bIdx) => (
            <React.Fragment key={bucket.id}>
              {/* Inter-Bucket Operator Divider (if bIdx > 0) */}
              {bIdx > 0 && (
                <div className="relative flex items-center justify-center my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-dashed border-indigo-200" />
                  </div>
                  <div className="relative inline-flex items-center p-1 rounded-2xl bg-white border border-indigo-300 shadow-md">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase px-2.5">
                      Inter-Bucket Rule:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setWorkingConfig(prev => ({
                          ...prev,
                          bucketJoin: prev.bucketJoin === "AND" ? "OR" : "AND"
                        }))
                      }
                      className={`px-3.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs ${
                        workingConfig.bucketJoin === "AND"
                          ? "bg-indigo-600 text-white ring-2 ring-indigo-400"
                          : "bg-purple-600 text-white ring-2 ring-purple-400"
                      }`}
                    >
                      {workingConfig.bucketJoin === "AND"
                        ? "AND (All Buckets Must Match)"
                        : "OR (Any Bucket Can Match)"}
                    </button>
                  </div>
                </div>
              )}

              {/* Bucket Card */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4 hover:border-indigo-300 hover:shadow-md transition-all">
                {/* Bucket Header */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      {bIdx + 1}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={bucket.name}
                        onChange={e => {
                          const val = e.target.value;
                          setWorkingConfig(prev => ({
                            ...prev,
                            buckets: prev.buckets.map(b => (b.id === bucket.id ? { ...b, name: val } : b))
                          }));
                        }}
                        className="text-sm font-black text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-0.5"
                      />
                      <span className="text-[10px] text-slate-400 ml-2 font-medium">
                        ({bucket.conditions.length} condition{bucket.conditions.length === 1 ? "" : "s"})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Inside-Bucket Match Mode Toggle: ALL (AND) vs ANY (OR) */}
                    <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => handleToggleBucketMatchType(bucket.id)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          bucket.matchType === "ALL"
                            ? "bg-white text-indigo-700 shadow-2xs font-black border border-slate-200"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                        title="All conditions in this bucket must match (AND)"
                      >
                        Match ALL (AND)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleBucketMatchType(bucket.id)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          bucket.matchType === "ANY"
                            ? "bg-white text-purple-700 shadow-2xs font-black border border-slate-200"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                        title="Any condition in this bucket can match (OR)"
                      >
                        Match ANY (OR)
                      </button>
                    </div>

                    {/* Delete Bucket Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveBucket(bucket.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Bucket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Condition Rows List */}
                <div className="space-y-2.5">
                  {bucket.conditions.length === 0 ? (
                    <div className="text-center py-7 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/60">
                      <Layers className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-700">
                        No rules in this bucket yet
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Add a condition below or load the Smart Default preset above
                      </p>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddCondition(bucket.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Condition</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset("SMART_DEFAULT")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold cursor-pointer transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Load Smart Default</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    bucket.conditions.map((cond, cIdx) => {
                      const fieldDef = FIELD_DEFINITIONS.find(f => f.id === cond.field) || FIELD_DEFINITIONS[0];

                      return (
                        <div
                          key={cond.id}
                          className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50/90 border border-slate-200 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex-wrap sm:flex-nowrap"
                        >
                          {/* Inner Confluence Operator Badge */}
                          <div className="w-14 shrink-0 text-center">
                            {cIdx === 0 ? (
                              <span className="text-[10px] font-black text-slate-500 px-2 py-0.5 rounded bg-slate-200/80 uppercase tracking-wider">
                                WHERE
                              </span>
                            ) : (
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                  bucket.matchType === "ALL"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {bucket.matchType === "ALL" ? "AND" : "OR"}
                              </span>
                            )}
                          </div>

                          {/* 1. Field Dropdown */}
                          <div className="relative min-w-[210px] flex-1 sm:flex-none">
                            <select
                              value={cond.field}
                              onChange={e => handleUpdateConditionField(bucket.id, cond.id, e.target.value as FilterField)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
                            >
                              <optgroup label="Price & Volume">
                                <option value="price">💵 Stock Price (LTP)</option>
                                <option value="buy_volume">📈 Buy Volume Depth</option>
                                <option value="total_volume">📊 Total Volume</option>
                              </optgroup>
                              <optgroup label="Pillars & Scores">
                                <option value="score_c">⚡ Current Score (Pillar C)</option>
                                <option value="score_h">📊 History Score (Pillar H)</option>
                                <option value="score_a">🤖 AI Vision Score (Pillar A)</option>
                                <option value="score_wa">⚖️ Weighted Average (WA)</option>
                                <option value="win_rate">🏆 Historical Win Rate (%)</option>
                                <option value="trap_rate">⚠️ Bull Trap Rate (%)</option>
                              </optgroup>
                              <optgroup label="Order Flow & Breakout">
                                <option value="buyers_dominant">🟢 Buyers &gt; Sellers</option>
                                <option value="above_vwap">🚀 Price Above VWAP</option>
                                <option value="near_day_high">🎯 Near Day High (% HOD)</option>
                                <option value="target_in_5d">🎯 Target in 5-Day High</option>
                              </optgroup>
                              <optgroup label="Classification">
                                <option value="segment">🏢 Market Cap Segment</option>
                                <option value="session">⏰ Session Timing</option>
                                <option value="stage">🛡️ MICHPA Stage</option>
                                <option value="outcome">🎯 Trade Outcome</option>
                              </optgroup>
                            </select>
                          </div>

                          {/* 2. Operator Dropdown */}
                          <div className="relative shrink-0">
                            {fieldDef.type === "numeric" && (
                              <select
                                value={cond.operator}
                                onChange={e => handleUpdateCondition(bucket.id, cond.id, { operator: e.target.value as FilterOperator })}
                                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
                              >
                                <option value="between">Between</option>
                                <option value="gte">≥</option>
                                <option value="lte">≤</option>
                                <option value="eq">=</option>
                              </select>
                            )}

                            {fieldDef.type === "select" && (
                              <select
                                value={cond.operator}
                                onChange={e => handleUpdateCondition(bucket.id, cond.id, { operator: e.target.value as FilterOperator })}
                                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
                              >
                                <option value="is">is</option>
                                <option value="is_not">is not</option>
                              </select>
                            )}

                            {fieldDef.type === "boolean" && (
                              <select
                                value={cond.operator}
                                onChange={e => handleUpdateCondition(bucket.id, cond.id, { operator: e.target.value as FilterOperator })}
                                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
                              >
                                <option value="is_true">is True (Active)</option>
                                <option value="is_false">is False (Off)</option>
                              </select>
                            )}
                          </div>

                          {/* 3. Value Input */}
                          <div className="flex-1 min-w-[160px]">
                            {fieldDef.type === "numeric" && cond.operator === "between" ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  placeholder="Min"
                                  value={cond.value ?? ""}
                                  onChange={e => handleUpdateCondition(bucket.id, cond.id, { value: Number(e.target.value) })}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
                                />
                                <span className="text-slate-400 text-xs font-bold">to</span>
                                <input
                                  type="number"
                                  placeholder="Max"
                                  value={cond.value2 ?? ""}
                                  onChange={e => handleUpdateCondition(bucket.id, cond.id, { value2: Number(e.target.value) })}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
                                />
                                {fieldDef.unit && (
                                  <span className="text-[11px] font-bold text-slate-500 shrink-0">
                                    {fieldDef.unit}
                                  </span>
                                )}
                              </div>
                            ) : fieldDef.type === "numeric" ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={cond.value ?? ""}
                                  onChange={e => handleUpdateCondition(bucket.id, cond.id, { value: Number(e.target.value) })}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
                                />
                                {fieldDef.unit && (
                                  <span className="text-[11px] font-bold text-slate-500 shrink-0">
                                    {fieldDef.unit}
                                  </span>
                                )}
                              </div>
                            ) : fieldDef.type === "select" ? (
                              <select
                                value={cond.value}
                                onChange={e => handleUpdateCondition(bucket.id, cond.id, { value: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
                              >
                                {(fieldDef.options || []).map(opt => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Verified Snapshot Confluence</span>
                              </div>
                            )}
                          </div>

                          {/* 4. Delete Condition Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCondition(bucket.id, cond.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                            title="Remove condition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Condition inside this Bucket */}
                {bucket.conditions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleAddCondition(bucket.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Rule to {bucket.name}</span>
                  </button>
                )}
              </div>
            </React.Fragment>
          ))}

          {/* Add Another Bucket Button */}
          <div className="pt-2 flex items-center justify-center">
            <button
              type="button"
              onClick={handleAddBucket}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 text-indigo-700 hover:bg-indigo-50/60 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Another Bucket (Group)</span>
            </button>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="px-6 py-4 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
              title="Reset rules to Smart Default (Price 50-1000 + 4 Smart Rules)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Reset to Default (Smart 5)</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Clear all rules to show entire qualified stream"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
              <span>Clear All</span>
            </button>

            <span className="text-xs text-slate-400 font-medium ml-1">
              Active: {totalRules} rule{totalRules === 1 ? "" : "s"} across {workingConfig.buckets.length} bucket{workingConfig.buckets.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
              <span className="text-slate-500">Live Match:</span>
              <span className="font-mono font-black text-indigo-600 text-sm">
                {matchingTradesCount} of {trades.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCommit}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-700 hover:to-violet-800 text-white shadow-md shadow-indigo-300 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Apply Filters ({matchingTradesCount} Setups)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
