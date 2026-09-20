"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Target,
  Layers,
  IndianRupee,
  RefreshCw
} from "lucide-react";
import { placeTradeOrder } from "@/services/api";

interface OrderPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: any;
  onSuccess?: (orderResult: any) => void;
  onViewPortfolio?: () => void;
}

export const OrderPlacementModal: React.FC<OrderPlacementModalProps> = ({
  isOpen,
  onClose,
  recommendation,
  onSuccess,
  onViewPortfolio
}) => {
  if (!isOpen || !recommendation) return null;

  const symbol = recommendation.symbol || recommendation.bse_code || "STOCK";
  const companyName = recommendation.company_name || symbol;
  const exchange = recommendation.nse_price ? "NSE" : (recommendation.exchange || "BSE");
  const cmp = Number(recommendation.bse_price || recommendation.nse_price || recommendation.current_price || recommendation.entry_min || recommendation.ltp || 100);

  const defaultTarget = Number(recommendation.target_price || (cmp * 1.013).toFixed(2));
  const defaultSL = Number(recommendation.stop_loss || (cmp * 0.992).toFixed(2));

  // 1. PURCHASE PRICE (Default = CMP, user-editable)
  const [purchasePriceStr, setPurchasePriceStr] = useState<string>(cmp.toFixed(2));
  const [isPriceEdited, setIsPriceEdited] = useState<boolean>(false);

  // 2. QUANTITY: Default strictly 1 share (User requirement: "default quantity would always be 1")
  const [rawQuantity, setRawQuantity] = useState<string>("1");

  // 3. TARGET: editable, toggleable
  const [hasTarget, setHasTarget] = useState<boolean>(true);
  const [targetPriceStr, setTargetPriceStr] = useState<string>(defaultTarget.toFixed(2));
  const [isTargetEdited, setIsTargetEdited] = useState<boolean>(false);

  // 4. STOP LOSS: editable, toggleable
  const [hasStopLoss, setHasStopLoss] = useState<boolean>(true);
  const [stopLossStr, setStopLossStr] = useState<string>(defaultSL.toFixed(2));
  const [isSlEdited, setIsSlEdited] = useState<boolean>(false);

  // Status & Execution tracking
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  // Sync CMP to purchase price if props change and user hasn't edited
  useEffect(() => {
    if (!isPriceEdited && cmp > 0) {
      setPurchasePriceStr(cmp.toFixed(2));
    }
  }, [cmp, isPriceEdited]);

  // Sync default target and stop loss if props change and user hasn't edited
  useEffect(() => {
    if (!isTargetEdited && defaultTarget > 0) {
      setTargetPriceStr(defaultTarget.toFixed(2));
    }
  }, [defaultTarget, isTargetEdited]);

  useEffect(() => {
    if (!isSlEdited && defaultSL > 0) {
      setStopLossStr(defaultSL.toFixed(2));
    }
  }, [defaultSL, isSlEdited]);

  // Derived calculations
  const parsedPrice = Math.max(0.05, parseFloat(purchasePriceStr) || cmp);
  const parsedQty = Math.max(1, parseInt(rawQuantity, 10) || 1);
  const parsedTarget = parseFloat(targetPriceStr) || defaultTarget;
  const parsedSL = parseFloat(stopLossStr) || defaultSL;

  const totalInvestment = Number((parsedPrice * parsedQty).toFixed(2));

  const targetDiff = parsedTarget - parsedPrice;
  const targetPct = parsedPrice > 0 ? ((targetDiff / parsedPrice) * 100).toFixed(2) : "1.30";
  const projectedProfit = Number((Math.max(0, targetDiff) * parsedQty).toFixed(2));

  const slDiff = parsedPrice - parsedSL;
  const slPct = parsedPrice > 0 ? ((slDiff / parsedPrice) * 100).toFixed(2) : "0.80";
  const projectedRisk = Number((Math.max(0, slDiff) * parsedQty).toFixed(2));

  const handleExecuteOrder = async () => {
    if (parsedQty <= 0) {
      setError("Quantity must be at least 1 share.");
      return;
    }
    if (parsedPrice <= 0) {
      setError("Purchase price must be greater than zero.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // User-edited values must be sent directly to Dhan
      const isPriceModified = Math.abs(parsedPrice - cmp) > 0.05;
      const payload = {
        symbol: symbol,
        security_id: recommendation.bse_code || recommendation.security_id || "",
        exchange_segment: exchange === "NSE" ? "NSE_EQ" : "BSE_EQ",
        transaction_type: "BUY",
        quantity: parsedQty,
        order_type: isPriceModified ? "LIMIT" : "LIMIT",
        price: parsedPrice,
        target_price: hasTarget ? parsedTarget : 0,
        stop_loss_1: hasStopLoss ? parsedSL : 0,
        has_target: hasTarget,
        has_stop_loss: hasStopLoss,
        recommendation_id: recommendation.id || recommendation.recommendation_id || ""
      };

      const result = await placeTradeOrder(payload);
      setSuccessResult(result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      setError(err.message || "Order rejected by Dhan broker.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header — Dhan Branded (Compact) */}
        <div className="px-4 py-3 border-b border-teal-900/30 flex items-center justify-between bg-gradient-to-r from-[#004d40] via-[#00695c] to-[#00897b] text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00e5ff] to-[#00bcd4] flex items-center justify-center text-[#004d40] font-black shadow-xs shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black tracking-tight">{symbol}</h2>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/20 text-white/90">
                  {exchange}
                </span>
                <div className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/30 border border-emerald-400/40 text-[9px] font-bold text-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Dhan</span>
                </div>
              </div>
              <p className="text-[10.5px] text-teal-200 line-clamp-1">{companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/10 px-2 py-0.5 rounded-lg border border-white/10 text-right font-mono text-[11px]">
              <span className="text-teal-300 text-[8.5px] block uppercase leading-none">CMP</span>
              <strong className="text-[#00e5ff] text-xs">₹{cmp.toFixed(2)}</strong>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Compact Form Body (Zero Vertical Scrolling Needed) */}
        <div className="p-4 space-y-2.5 text-slate-800">

          {/* ROW 1: Purchase Price & Quantity (2-Column Grid) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Purchase Price (Editable, defaults to CMP) */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-teal-600" />
                  <span>Purchase Price</span>
                </label>
                <span className="text-[9px] font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded">
                  {isPriceEdited ? "Custom" : "CMP"}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  step="0.05"
                  value={purchasePriceStr}
                  onChange={(e) => {
                    setPurchasePriceStr(e.target.value);
                    setIsPriceEdited(true);
                  }}
                  className="w-full bg-white border border-slate-300 focus:border-teal-600 rounded-lg pl-6 pr-2 py-1.5 text-sm font-mono font-bold text-slate-900 focus:outline-none transition-all"
                  placeholder="Price..."
                />
              </div>
            </div>

            {/* Quantity (Default = 1) */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-teal-600" />
                  <span>Quantity</span>
                </label>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded">
                  Shares
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={rawQuantity}
                  onChange={(e) => setRawQuantity(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-teal-600 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 focus:outline-none transition-all"
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* ROW 2: Target Price */}
          <div className={`p-2.5 border rounded-xl space-y-1 transition-all ${
            hasTarget ? "bg-emerald-50/40 border-emerald-200" : "bg-slate-50/70 border-slate-200 opacity-60"
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTarget}
                  onChange={(e) => setHasTarget(e.target.checked)}
                  className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300 accent-teal-600 cursor-pointer"
                />
                <Target className="w-3 h-3 text-emerald-600" />
                <span>Target Price</span>
              </label>
              {hasTarget && (
                <span className="text-[10px] font-bold text-emerald-700">
                  +{targetPct}% (Gain: +₹{projectedProfit.toLocaleString("en-IN")})
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="0.05"
                disabled={!hasTarget}
                value={targetPriceStr}
                onChange={(e) => {
                  setTargetPriceStr(e.target.value);
                  setIsTargetEdited(true);
                }}
                className={`w-full bg-white border rounded-lg pl-6 pr-2 py-1.5 text-sm font-mono font-bold text-slate-900 focus:outline-none transition-all ${
                  hasTarget ? "border-emerald-300 focus:border-emerald-600" : "border-slate-200 bg-slate-100 text-slate-400"
                }`}
                placeholder="Target..."
              />
            </div>
          </div>

          {/* ROW 3: Stop Loss Price */}
          <div className={`p-2.5 border rounded-xl space-y-1 transition-all ${
            hasStopLoss ? "bg-rose-50/40 border-rose-200" : "bg-slate-50/70 border-slate-200 opacity-60"
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasStopLoss}
                  onChange={(e) => setHasStopLoss(e.target.checked)}
                  className="w-3.5 h-3.5 text-rose-600 rounded border-slate-300 accent-rose-600 cursor-pointer"
                />
                <ShieldCheck className="w-3 h-3 text-rose-600" />
                <span>Stop Loss Price</span>
              </label>
              {hasStopLoss && (
                <span className="text-[10px] font-bold text-rose-700">
                  -{slPct}% (Risk: -₹{projectedRisk.toLocaleString("en-IN")})
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="0.05"
                disabled={!hasStopLoss}
                value={stopLossStr}
                onChange={(e) => {
                  setStopLossStr(e.target.value);
                  setIsSlEdited(true);
                }}
                className={`w-full bg-white border rounded-lg pl-6 pr-2 py-1.5 text-sm font-mono font-bold text-slate-900 focus:outline-none transition-all ${
                  hasStopLoss ? "border-rose-300 focus:border-rose-600" : "border-slate-200 bg-slate-100 text-slate-400"
                }`}
                placeholder="Stop loss..."
              />
            </div>
          </div>

          {/* Investment Summary */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-600 pt-0.5">
            <span>Total Capital Required:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              ₹{totalInvestment.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2 text-rose-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold">Order Error:</div>
                <div className="text-[11px] text-rose-800 leading-tight">{error}</div>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1.5 text-emerald-900 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-black text-xs text-emerald-950">Order Placed Successfully via Dhan!</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-200 text-[10.5px] font-mono flex justify-between">
                <span>{parsedQty} Share(s) @ ₹{parsedPrice}</span>
                <span className="font-bold text-emerald-700">{successResult.status || "CONFIRMED"}</span>
              </div>
            </div>
          )}

          {/* Execute Button */}
          <div className="pt-1">
            {!successResult ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleExecuteOrder}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#004d40] via-[#00695c] to-[#00897b] hover:from-[#00382e] hover:to-[#00695c] text-white font-bold text-xs shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00e5ff]" />
                    <span>Submitting Order to Dhan...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-[#00e5ff]" />
                    <span>Buy via Dhan (₹{totalInvestment.toLocaleString("en-IN")})</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                {onViewPortfolio && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewPortfolio();
                    }}
                    className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                  >
                    <span>View Portfolio</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
