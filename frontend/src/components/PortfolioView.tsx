"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ExternalLink,
  DollarSign,
  Layers,
  X,
  XCircle,
  Sliders,
  Wallet
} from "lucide-react";
import {
  fetchTradePositions,
  fetchTradeOrders,
  fetchTradeHoldings,
  fetchTradeStatus,
  squareOffTradePosition,
  cancelTradeOrder
} from "@/services/api";

interface PortfolioViewProps {
  onNavigateToRecommendations?: () => void;
  onOpenSettings?: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  onNavigateToRecommendations,
  onOpenSettings
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"positions" | "orders" | "holdings">("positions");

  // Data states
  const [tradeStatus, setTradeStatus] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);

  // Loading & error states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Square-off confirmation modal
  const [squareOffItem, setSquareOffItem] = useState<any | null>(null);
  const [squareOffLoading, setSquareOffLoading] = useState<boolean>(false);
  const [squareOffSuccess, setSquareOffSuccess] = useState<string | null>(null);
  const [squareOffError, setSquareOffError] = useState<string | null>(null);

  // Order book sub-filter & cancel state
  const [orderFilterTab, setOrderFilterTab] = useState<"pending" | "traded" | "cancelled">("pending");
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const loadAllPortfolioData = useCallback(async (isSilent: boolean = false) => {
    if (!isSilent) setRefreshing(true);
    setError(null);
    try {
      const [sRes, pRes, oRes, hRes] = await Promise.all([
        fetchTradeStatus().catch(() => null),
        fetchTradePositions().catch(() => ({ positions: [] })),
        fetchTradeOrders().catch(() => ({ orders: [] })),
        fetchTradeHoldings().catch(() => ({ holdings: [] }))
      ]);

      if (sRes) setTradeStatus(sRes);
      setPositions(pRes.positions || []);
      setOrders(oRes.orders || []);
      setHoldings(hRes.holdings || []);
    } catch (err: any) {
      console.error("Error loading portfolio data:", err);
      setError("Unable to sync live portfolio data from Dhan broker.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllPortfolioData();

    // Auto-refresh real-time positions every 2 seconds
    const interval = setInterval(() => {
      loadAllPortfolioData(true);
    }, 2000);

    return () => clearInterval(interval);
  }, [loadAllPortfolioData]);

  // Handle Square Off
  const handleConfirmSquareOff = async () => {
    if (!squareOffItem) return;
    setSquareOffLoading(true);
    setSquareOffError(null);
    try {
      const res = await squareOffTradePosition({
        position_id: squareOffItem.position_id || squareOffItem.id || "",
        symbol: squareOffItem.symbol,
        quantity: squareOffItem.quantity
      });

      setSquareOffSuccess(res.message || `Successfully squared off ${squareOffItem.quantity} shares of ${squareOffItem.symbol}`);
      setTimeout(() => {
        setSquareOffItem(null);
        setSquareOffSuccess(null);
        loadAllPortfolioData(true);
      }, 1500);
    } catch (err: any) {
      setSquareOffError(err.message || "Failed to square off position.");
    } finally {
      setSquareOffLoading(false);
    }
  };

  // Calculations for summary metrics
  const totalPositionsPnl = positions.reduce((acc, p) => acc + (p.tentative_pnl ?? p.unrealized_pnl ?? 0), 0);
  const totalPositionsValue = positions.reduce((acc, p) => acc + ((p.cmp || p.current_price || p.buy_avg || p.buy_avg_price || 0) * (p.quantity || 0)), 0);
  const totalHoldingsValue = holdings.reduce((acc, h) => acc + (h.current_value || ((h.cmp || h.current_price || 0) * h.quantity) || 0), 0);
  const totalHoldingsInvested = holdings.reduce((acc, h) => acc + (h.invested_value || ((h.buy_avg || h.buy_avg_price || 0) * h.quantity) || 0), 0);
  const totalHoldingsPnl = totalHoldingsValue - totalHoldingsInvested;

  const cashBalance = tradeStatus?.cash_balance ?? 250000;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. TOP HEADER & DHAN CONNECTION STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">My Dhan Portfolio</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                tradeStatus?.connected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}>
                <span className={`w-2 h-2 rounded-full ${tradeStatus?.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span>{tradeStatus?.connected ? `Dhan Live (${tradeStatus.client_id || "Active"})` : "Sandbox Simulator"}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-Time Open Positions, Order Execution Book &amp; Demat Holdings
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => loadAllPortfolioData(false)}
            disabled={refreshing}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Refresh Feed"}</span>
          </button>

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Dhan API Keys</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Margin */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Dhan Available Margin</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-mono font-black text-slate-900">
            ₹{cashBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            100% Ready for 1-Click Order Execution
          </div>
        </div>

        {/* Total Positions P&L */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Open Positions Tentative P&amp;L</span>
            {totalPositionsPnl >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className={`text-2xl font-mono font-black ${
            totalPositionsPnl >= 0 ? "text-emerald-600" : "text-rose-600"
          }`}>
            {totalPositionsPnl >= 0 ? "+" : ""}₹{totalPositionsPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            Across {positions.length} Active Positions
          </div>
        </div>

        {/* Demat Holdings Value */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Demat Holdings Value</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-mono font-black text-slate-900">
            ₹{totalHoldingsValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className={`text-[11px] font-semibold mt-1 ${
            totalHoldingsPnl >= 0 ? "text-emerald-600" : "text-rose-600"
          }`}>
            {totalHoldingsPnl >= 0 ? "+" : ""}₹{totalHoldingsPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })} Overall Return
          </div>
        </div>

        {/* Execution Guard */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-5 rounded-3xl text-white shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-200 text-xs font-bold mb-2">
            <span>Risk Guard Protection</span>
            <ShieldCheck className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="text-lg font-black text-white">
            Dual Stops Active
          </div>
          <div className="text-[11px] text-indigo-200 mt-1 leading-tight">
            Stop Loss 1 (Hard Cap) &amp; SL 2 (Breakeven Lock) on all orders
          </div>
        </div>
      </div>

      {/* 3. SUB-NAVIGATION TABS */}
      <div className="border-b border-slate-200 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("positions")}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "positions"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>Open Positions</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            activeSubTab === "positions" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
          }`}>
            {positions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("orders")}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "orders"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>Order Book (All Orders)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            activeSubTab === "orders" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
          }`}>
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("holdings")}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "holdings"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>Demat Holdings</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            activeSubTab === "holdings" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
          }`}>
            {holdings.length}
          </span>
        </button>
      </div>

      {/* 4. TAB CONTENT */}

      {/* --- TAB 1: OPEN POSITIONS --- */}
      {activeSubTab === "positions" && (
        <div className="space-y-4">
          {positions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Briefcase className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">No Open Positions Currently</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  You do not have any active trades open in Dhan. Explore recommendations and place high-conviction orders with dual stop protection.
                </p>
              </div>
              {onNavigateToRecommendations && (
                <button
                  type="button"
                  onClick={onNavigateToRecommendations}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Browse Buy Recommendations</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dhan Exchange Integration Guidance Banner */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-blue-950">Dhan Exchange Active Integration</span>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Both your <strong>Stop-Loss</strong> and <strong>Exit Target</strong> orders are registered directly on the exchange via Dhan. 
                    In your Dhan web portal / app, they are listed under the <strong>Orders &gt; Pending</strong> tab (with active exchange triggers).
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Instrument</th>
                        <th className="py-3.5 px-3 text-center">Side</th>
                        <th className="py-3.5 px-3 text-right">Qty</th>
                        <th className="py-3.5 px-3 text-right">Buy Price</th>
                        <th className="py-3.5 px-3 text-right">Live CMP</th>
                        <th className="py-3.5 px-3 text-center">Exit Target</th>
                        <th className="py-3.5 px-3 text-center">Stop Loss</th>
                        <th className="py-3.5 px-3 text-right">Tentative P&amp;L</th>
                        <th className="py-3.5 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {positions.map((pos, idx) => {
                        const buyAvg = pos.buy_price || pos.buy_avg || pos.buy_avg_price || 0;
                        const curPrice = pos.cmp || pos.current_price || buyAvg;
                        const pnl = pos.tentative_pnl ?? pos.unrealized_pnl ?? ((curPrice - buyAvg) * (pos.quantity || 0));
                        const pnlPct = pos.tentative_pnl_pct ?? pos.unrealized_pnl_pct ?? (buyAvg > 0 ? ((curPrice - buyAvg) / buyAvg) * 100 : 0);
                        const isProfit = pnl >= 0;
                        const sl2 = pos.stop_loss_2 || pos.conditional_stop_2;

                        return (
                          <tr key={pos.position_id || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-4">
                              <div className="font-extrabold text-slate-900 text-sm">{pos.symbol}</div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                {pos.company_name || pos.symbol} • {pos.exchange_segment || "NSE"}
                              </div>
                            </td>

                            <td className="py-4 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {pos.transaction_type || "BUY"}
                              </span>
                            </td>

                            <td className="py-4 px-3 text-right font-mono font-bold text-slate-800">
                              {pos.quantity}
                            </td>

                            <td className="py-4 px-3 text-right font-mono font-bold text-slate-900">
                              ₹{Number(buyAvg).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>

                            <td className="py-4 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                <span className="font-mono font-black text-slate-900">
                                  ₹{Number(curPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-3 text-center">
                              <div className="inline-flex flex-col gap-1 items-center">
                                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  {pos.target_price ? `₹${Number(pos.target_price).toFixed(2)}` : "—"}
                                </span>
                                {pos.target_order_id ? (
                                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5" title={`Registered on Dhan (Order ID: ${pos.target_order_id})`}>
                                    <span>✓ Dhan Active</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-medium">Auto-Target</span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-3 text-center">
                              <div className="inline-flex flex-col gap-1 items-center">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                    SL1: ₹{pos.stop_loss_1 || pos.stop_loss || "—"}
                                  </span>
                                  {pos.sl_order_id && (
                                    <span className="text-[9px] font-extrabold text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-0.5" title={`Registered on Dhan (Order ID: ${pos.sl_order_id})`}>
                                      <span>✓ Dhan Active</span>
                                    </span>
                                  )}
                                </div>
                                {sl2 && (
                                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                    SL2: ₹{sl2} (Lock)
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-3 text-right">
                              <div className={`font-mono font-black text-sm ${isProfit ? "text-emerald-600" : "text-rose-600"}`}>
                                {isProfit ? "+" : ""}₹{Number(pnl).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </div>
                              <div className={`text-[10px] font-bold ${isProfit ? "text-emerald-600" : "text-rose-500"}`}>
                                ({isProfit ? "+" : ""}{Number(pnlPct).toFixed(2)}%)
                              </div>
                            </td>

                            <td className="py-4 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setSquareOffItem(pos)}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer"
                              >
                                <span>Sell Off</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: ORDER BOOK --- */}
      {activeSubTab === "orders" && (() => {
        const pendingOrders = orders.filter(o => {
          const s = (o.status || "").toUpperCase();
          return s === "PENDING" || s === "TRIGGER_PENDING" || s === "TRANSIT";
        });
        const tradedOrders = orders.filter(o => {
          const s = (o.status || "").toUpperCase();
          return s === "TRADED" || s === "COMPLETE" || s === "FILLED";
        });
        const cancelledOrders = orders.filter(o => {
          const s = (o.status || "").toUpperCase();
          return s === "CANCELLED" || s === "CANCELED" || s === "REJECTED" || s === "EXPIRED";
        });
        const currentOrdersList = orderFilterTab === "pending" 
          ? pendingOrders 
          : orderFilterTab === "traded" 
          ? tradedOrders 
          : cancelledOrders;

        const handleCancelPendingOrder = async (orderId: string) => {
          if (!window.confirm(`Are you sure you want to cancel order ${orderId} on Dhan exchange?`)) return;
          setCancelingOrderId(orderId);
          try {
            await cancelTradeOrder(orderId);
            setCancelMessage(`Order ${orderId} cancelled successfully.`);
            await loadAllPortfolioData(true);
            setTimeout(() => setCancelMessage(null), 3500);
          } catch (err: any) {
            alert(err.message || "Failed to cancel order");
          } finally {
            setCancelingOrderId(null);
          }
        };

        return (
          <div className="space-y-4">
            {/* Sub-Tabs: Pending Orders vs Traded Orders vs Cancelled Orders */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setOrderFilterTab("pending")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    orderFilterTab === "pending"
                      ? "bg-white text-indigo-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pending Orders</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    orderFilterTab === "pending" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
                  }`}>
                    {pendingOrders.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilterTab("traded")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    orderFilterTab === "traded"
                      ? "bg-white text-indigo-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Traded Orders</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    orderFilterTab === "traded" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                  }`}>
                    {tradedOrders.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilterTab("cancelled")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    orderFilterTab === "cancelled"
                      ? "bg-white text-indigo-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Cancelled Orders</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    orderFilterTab === "cancelled" ? "bg-rose-100 text-rose-800" : "bg-slate-200 text-slate-600"
                  }`}>
                    {cancelledOrders.length}
                  </span>
                </button>
              </div>

              {cancelMessage && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 animate-fade-in">
                  ✓ {cancelMessage}
                </div>
              )}
            </div>

            {currentOrdersList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <Clock className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {orderFilterTab === "pending"
                    ? "No Pending Orders"
                    : orderFilterTab === "traded"
                    ? "No Traded Orders Yet"
                    : "No Cancelled Orders"}
                </h3>
                <p className="text-xs text-slate-500">
                  {orderFilterTab === "pending"
                    ? "You have no active pending limit or stop-loss orders on the exchange."
                    : orderFilterTab === "traded"
                    ? "Orders filled on the exchange will appear here with execution details."
                    : "Orders cancelled or rejected on the exchange will appear here."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Order ID &amp; Time</th>
                        <th className="py-3.5 px-4">Instrument</th>
                        <th className="py-3.5 px-3 text-center">Side</th>
                        <th className="py-3.5 px-3 text-right">Qty</th>
                        <th className="py-3.5 px-3 text-right">Order Price</th>
                        <th className="py-3.5 px-3 text-right">Live CMP</th>
                        <th className="py-3.5 px-3 text-center">Type / Triggers</th>
                        <th className="py-3.5 px-3 text-center">Status</th>
                        {orderFilterTab === "pending" && (
                          <th className="py-3.5 px-4 text-center">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {currentOrdersList.map((ord, idx) => {
                        const status = (ord.status || "FILLED").toUpperCase();
                        const isFilled = status === "TRADED" || status === "COMPLETE" || status === "FILLED";
                        const isPending = status === "PENDING" || status === "TRIGGER_PENDING" || status === "TRANSIT";
                        const isRejected = status === "REJECTED" || status === "FAILED" || status === "CANCELLED";
                        const isCanceling = cancelingOrderId === ord.order_id;
                        const cmpVal = ord.cmp || ord.current_price || ord.price;

                        return (
                          <tr key={ord.order_id || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-4">
                              <div className="font-mono font-bold text-slate-800 text-[11px]">{ord.order_id || "ORD-" + idx}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {ord.placed_at || ord.created_at || "Today, Live Market"}
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="font-extrabold text-slate-900 text-sm">{ord.symbol}</div>
                              <div className="text-[10px] text-slate-500">
                                {ord.order_type || "LIMIT"} • {ord.exchange_segment || "NSE"}
                              </div>
                            </td>

                            <td className="py-4 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                ord.transaction_type === "BUY"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-rose-100 text-rose-800 border border-rose-300"
                              }`}>
                                {ord.transaction_type || "BUY"}
                              </span>
                            </td>

                            <td className="py-4 px-3 text-right font-mono font-bold text-slate-800">
                              {ord.quantity}
                            </td>

                            <td className="py-4 px-3 text-right font-mono font-black text-slate-900">
                              ₹{Number(ord.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>

                            <td className="py-4 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                <span className="font-mono font-black text-slate-900">
                                  ₹{Number(cmpVal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-3 text-center">
                              <div className="inline-flex flex-col gap-0.5 items-center">
                                <span className="text-[10px] font-bold text-slate-700">
                                  {ord.order_type || "LIMIT"}
                                </span>
                                {ord.trigger_price > 0 && (
                                  <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                    Trigger: ₹{ord.trigger_price}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                                isFilled
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isPending
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : isRejected
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}>
                                {status}
                              </span>
                            </td>

                            {orderFilterTab === "pending" && (
                              <td className="py-4 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleCancelPendingOrder(ord.order_id)}
                                  disabled={isCanceling}
                                  className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer disabled:opacity-50"
                                  title="Cancel this order on Dhan exchange"
                                >
                                  <X className="w-3.5 h-3.5 text-rose-600" />
                                  <span>{isCanceling ? "Canceling..." : "Cancel"}</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* --- TAB 3: DEMAT HOLDINGS --- */}
      {activeSubTab === "holdings" && (
        <div className="space-y-4">
          {holdings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Layers className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">No Demat Holdings Found</h3>
              <p className="text-xs text-slate-500">
                Long-term equities in your Dhan account will appear here once connected.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Instrument</th>
                      <th className="py-3.5 px-3 text-right">Quantity</th>
                      <th className="py-3.5 px-3 text-right">Avg Cost</th>
                      <th className="py-3.5 px-3 text-right">CMP</th>
                      <th className="py-3.5 px-3 text-right">Invested Value</th>
                      <th className="py-3.5 px-3 text-right">Current Value</th>
                      <th className="py-3.5 px-4 text-right">Total P&amp;L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {holdings.map((h, idx) => {
                      const invested = h.invested_value || ((h.buy_avg || 0) * (h.quantity || 0));
                      const curVal = h.current_value || ((h.cmp || 0) * (h.quantity || 0));
                      const pnl = curVal - invested;
                      const pnlPct = invested > 0 ? ((pnl / invested) * 100) : 0;
                      const isProfit = pnl >= 0;

                      return (
                        <tr key={h.symbol || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-extrabold text-slate-900 text-sm">{h.symbol}</div>
                            <div className="text-[10px] text-slate-400">{h.company_name || h.symbol}</div>
                          </td>

                          <td className="py-4 px-3 text-right font-mono font-bold text-slate-800">
                            {h.quantity}
                          </td>

                          <td className="py-4 px-3 text-right font-mono font-semibold text-slate-700">
                            ₹{Number(h.buy_avg || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-4 px-3 text-right font-mono font-black text-slate-900">
                            ₹{Number(h.cmp || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-4 px-3 text-right font-mono text-slate-700">
                            ₹{invested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-4 px-3 text-right font-mono font-black text-slate-900">
                            ₹{curVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className={`font-mono font-black text-sm ${isProfit ? "text-emerald-600" : "text-rose-600"}`}>
                              {isProfit ? "+" : ""}₹{pnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </div>
                            <div className={`text-[10px] font-bold ${isProfit ? "text-emerald-600" : "text-rose-500"}`}>
                              ({isProfit ? "+" : ""}{pnlPct.toFixed(2)}%)
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. SQUARE OFF / SELL CONFIRMATION MODAL */}
      {squareOffItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-extrabold">Confirm 1-Click Square-Off</h3>
              </div>
              <button
                type="button"
                onClick={() => setSquareOffItem(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-600">
                Are you sure you want to sell and close your open position in{" "}
                <strong className="text-slate-900">{squareOffItem.symbol}</strong>?
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Instrument:</span>
                  <span className="font-extrabold text-slate-900">{squareOffItem.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity to Sell:</span>
                  <span className="font-mono font-bold text-slate-800">{squareOffItem.quantity} Shares</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Market Price (CMP):</span>
                  <span className="font-mono font-bold text-slate-900">₹{Number(squareOffItem.cmp || squareOffItem.current_price || squareOffItem.buy_avg || 0).toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-200 my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Tentative Realized P&amp;L:</span>
                  <span className={`font-mono font-black text-sm ${
                    (squareOffItem.tentative_pnl ?? squareOffItem.unrealized_pnl ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {(squareOffItem.tentative_pnl ?? squareOffItem.unrealized_pnl ?? 0) >= 0 ? "+" : ""}₹{Number(squareOffItem.tentative_pnl ?? squareOffItem.unrealized_pnl ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {squareOffSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{squareOffSuccess}</span>
                </div>
              )}

              {squareOffError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
                  {squareOffError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSquareOffItem(null)}
                  disabled={squareOffLoading}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSquareOff}
                  disabled={squareOffLoading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {squareOffLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{squareOffLoading ? "Selling..." : "Confirm & Sell Off"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
