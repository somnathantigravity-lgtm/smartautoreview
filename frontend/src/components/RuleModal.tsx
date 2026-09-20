"use client";

import React, { useState } from "react";
import { X, Zap, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { createRule } from "@/services/api";
import { DynamicCondition } from "@/types";

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  onSuccess?: () => void;
}

export const RuleModal: React.FC<RuleModalProps> = ({ isOpen, onClose, symbol, onSuccess }) => {
  const [name, setName] = useState<string>(`${symbol} Momentum Trigger`);
  const [actionType, setActionType] = useState<"ALERT">("ALERT");
  const [logicOperator, setLogicOperator] = useState<"AND" | "OR">("AND");
  const [conditions, setConditions] = useState<DynamicCondition[]>([
    { field: "rsi", operator: "<=", value: 35, timeframe: "15m" }
  ]);
  const [saving, setSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: "ltp", operator: ">=", value: 100, timeframe: "15m" }
    ]);
  };

  const removeCondition = (idx: number) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx: number, updates: Partial<DynamicCondition>) => {
    const updated = [...conditions];
    updated[idx] = { ...updated[idx], ...updates };
    setConditions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createRule({
        name,
        symbol,
        exchange: "NSE",
        description: `Dynamic trigger on ${symbol}`,
        logic_operator: logicOperator,
        conditions,
        action_type: actionType
      });
      alert(`Trigger on ${symbol} created successfully!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      alert("Failed to save trigger: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 fill-white" />
            <div>
              <h3 className="text-base font-bold">Create Dynamic Trigger for {symbol}</h3>
              <p className="text-[10px] text-blue-100 font-medium flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Real-Time WebSocket Evaluation • Zero Latency</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Trigger Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Action</label>
              <select
                value={actionType}
                onChange={(e: any) => setActionType("ALERT")}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="ALERT">Notification Alert</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Logic Group</label>
              <select
                value={logicOperator}
                onChange={(e: any) => setLogicOperator(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="AND">Match ALL (AND)</option>
                <option value="OR">Match ANY (OR)</option>
              </select>
            </div>
          </div>

          {/* Conditions List */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Conditions</label>
            {conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <select
                  value={c.field}
                  onChange={(e) => updateCondition(i, { field: e.target.value })}
                  className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg flex-1"
                >
                  <option value="rsi">RSI (14)</option>
                  <option value="ltp">Price (LTP)</option>
                  <option value="ema_20">20 EMA</option>
                  <option value="ema_50">50 EMA</option>
                  <option value="vwap">VWAP</option>
                  <option value="change_pct">% Change</option>
                </select>

                <select
                  value={c.operator}
                  onChange={(e) => updateCondition(i, { operator: e.target.value })}
                  className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="<=">&lt;=</option>
                  <option value=">=">&gt;=</option>
                  <option value="<">&lt;</option>
                  <option value=">">&gt;</option>
                  <option value="crosses_above">Crosses Above</option>
                  <option value="crosses_below">Crosses Below</option>
                </select>

                <input
                  type="text"
                  value={c.value}
                  onChange={(e) => updateCondition(i, { value: e.target.value })}
                  className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg w-20 font-mono"
                />

                {conditions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCondition(i)}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addCondition}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Condition
            </button>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all"
            >
              {saving ? "Saving..." : "Save Trigger"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
