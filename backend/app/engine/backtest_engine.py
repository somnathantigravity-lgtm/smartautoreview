import math
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.engine.strategy_dsl import StrategyDefinition, RuleCondition
from app.engine.dhan_provider import dhan_provider
from app.engine.cost_engine import cost_engine

SAMPLE_NIFTY_UNIVERSE = [
    "RELIANCE", "TATASTEEL", "HDFCBANK", "INFY", "ICICIBANK",
    "SBIN", "BHARTIARTL", "LT", "ITC", "TCS"
]

class BacktestEngine:
    def __init__(self):
        pass

    def run_backtest(
        self,
        strategy: StrategyDefinition,
        test_symbol: Optional[str] = None,
        initial_capital: float = 100000.0,
        bars_count: int = 120
    ) -> Dict[str, Any]:
        """
        Executes a deterministic historical simulation on OHLCV bars.
        Calculates exact gross P&L, deducts Indian STT/Brokerage/GST,
        and produces execution analytics and trade log.
        """
        target_symbols = [test_symbol.upper()] if test_symbol else []
        if not target_symbols:
            if strategy.universe.custom_symbols:
                target_symbols = [s.upper() for s in strategy.universe.custom_symbols[:5]]
            elif strategy.universe.base == "NIFTY_50":
                target_symbols = SAMPLE_NIFTY_UNIVERSE[:6]
            else:
                target_symbols = SAMPLE_NIFTY_UNIVERSE[:4]

        all_trades: List[Dict[str, Any]] = []
        equity_curve: List[Dict[str, Any]] = []
        current_equity = initial_capital
        peak_equity = initial_capital
        max_drawdown_pct = 0.0

        for sym in target_symbols:
            chart = dhan_provider.get_chart_data(sym, timeframe="15m", bars=bars_count)
            candles = chart.get("candles", [])
            if len(candles) < 25:
                continue

            trades_for_sym = self._simulate_symbol(strategy, sym, candles, initial_capital)
            all_trades.extend(trades_for_sym)

        # Sort trades chronologically
        all_trades.sort(key=lambda t: t.get("entry_time", 0))

        # Recompute portfolio equity curve & cumulative metrics
        winning_trades = 0
        losing_trades = 0
        total_gross_pnl = 0.0
        total_statutory_costs = 0.0
        total_net_pnl = 0.0
        gross_profits = 0.0
        gross_losses = 0.0

        for t in all_trades:
            net_p = t["net_pnl"]
            total_net_pnl += net_p
            total_gross_pnl += t["gross_pnl"]
            total_statutory_costs += t["statutory_costs"]
            current_equity += net_p

            if net_p > 0:
                winning_trades += 1
                gross_profits += net_p
            else:
                losing_trades += 1
                gross_losses += abs(net_p)

            if current_equity > peak_equity:
                peak_equity = current_equity
            dd = ((peak_equity - current_equity) / peak_equity) * 100.0 if peak_equity > 0 else 0.0
            if dd > max_drawdown_pct:
                max_drawdown_pct = dd

            equity_curve.append({
                "time": t["exit_time"],
                "equity": round(current_equity, 2),
                "drawdown_pct": round(dd, 2)
            })

        total_trades = len(all_trades)
        win_rate = round((winning_trades / max(1, total_trades)) * 100.0, 1)
        profit_factor = round(gross_profits / max(0.01, gross_losses), 2)
        total_return_pct = round((total_net_pnl / max(1.0, initial_capital)) * 100.0, 2)

        return {
            "strategy_id": strategy.id,
            "strategy_name": strategy.name,
            "backtest_run_at": datetime.now().strftime("%d %b %Y, %H:%M:%S"),
            "initial_capital": initial_capital,
            "ending_capital": round(current_equity, 2),
            "total_net_pnl": round(total_net_pnl, 2),
            "total_gross_pnl": round(total_gross_pnl, 2),
            "total_statutory_costs": round(total_statutory_costs, 2),
            "return_pct": total_return_pct,
            "win_rate_pct": win_rate,
            "profit_factor": profit_factor,
            "max_drawdown_pct": round(max_drawdown_pct, 2),
            "total_trades": total_trades,
            "winning_trades": winning_trades,
            "losing_trades": losing_trades,
            "symbols_tested": target_symbols,
            "trade_log": all_trades,
            "equity_curve": equity_curve
        }

    def _simulate_symbol(
        self,
        strategy: StrategyDefinition,
        symbol: str,
        candles: List[Dict[str, Any]],
        capital: float
    ) -> List[Dict[str, Any]]:
        trades = []
        in_position = False
        entry_price = 0.0
        entry_time = 0
        quantity = 1
        target_price = 0.0
        stop_loss_price = 0.0
        trailing_stop_pct = strategy.exit.trailing_stop_pct
        highest_price_since_entry = 0.0
        bars_held = 0

        # Precalculate indicators along series
        closes = [c["close"] for c in candles]
        volumes = [c["volume"] for c in candles]

        # Allocate capital per trade
        alloc = strategy.position_sizing.capital_allocation or 50000.0
        alloc = min(alloc, capital * 0.5)

        for i in range(25, len(candles)):
            c = candles[i]
            cur_price = c["close"]
            cur_high = c["high"]
            cur_low = c["low"]
            cur_time = c["time"]

            # Compute window indicators
            sub_closes = closes[:i + 1]
            sub_volumes = volumes[:i + 1]
            rsi_val = self._calc_rsi(sub_closes, 14)
            ema_20_val = self._calc_ema(sub_closes, 20)
            ema_50_val = self._calc_ema(sub_closes, 50)
            ema_200_val = self._calc_ema(sub_closes, min(200, len(sub_closes)))
            avg_vol_20 = sum(sub_volumes[-20:]) / 20.0
            day_change = ((cur_price - sub_closes[max(0, i - 15)]) / sub_closes[max(0, i - 15)]) * 100.0

            indicators = {
                "ltp": cur_price,
                "rsi": rsi_val,
                "ema_20": ema_20_val,
                "ema_50": ema_50_val,
                "ema_200": ema_200_val,
                "volume": c["volume"],
                "avg_volume_20d": avg_vol_20,
                "vwap": round(sum(candles[j]["close"] * candles[j]["volume"] for j in range(max(0, i - 25), i + 1)) / max(1, sum(candles[j]["volume"] for j in range(max(0, i - 25), i + 1))), 2),
                "change_pct": day_change
            }

            if not in_position:
                # Evaluate entry conditions
                match = self._evaluate_entry(strategy.entry.conditions, strategy.entry.logic, indicators)
                if match:
                    in_position = True
                    # Simulate realistic execution slippage of 0.04%
                    entry_price = round(cur_price * 1.0004, 2)
                    entry_time = cur_time
                    quantity = max(1, int(alloc / max(1.0, entry_price)))
                    highest_price_since_entry = entry_price
                    bars_held = 0

                    # Calculate targets
                    tgt_pct = strategy.exit.target_pct or 3.0
                    sl_pct = strategy.exit.stop_loss_pct or 1.5
                    target_price = round(entry_price * (1 + tgt_pct / 100.0), 2)
                    stop_loss_price = round(entry_price * (1 - sl_pct / 100.0), 2)
            else:
                bars_held += 1
                highest_price_since_entry = max(highest_price_since_entry, cur_high)

                # Trailing stop ratchet
                if trailing_stop_pct and trailing_stop_pct > 0:
                    trailed_sl = round(highest_price_since_entry * (1 - trailing_stop_pct / 100.0), 2)
                    if trailed_sl > stop_loss_price:
                        stop_loss_price = trailed_sl

                exit_reason = None
                exit_price = 0.0

                # Check Target Hit
                if cur_high >= target_price:
                    exit_reason = "TARGET HIT"
                    exit_price = target_price
                # Check Stop Loss Hit
                elif cur_low <= stop_loss_price:
                    exit_reason = "STOP LOSS" if stop_loss_price <= entry_price else "TRAILING STOP"
                    exit_price = stop_loss_price
                # Check Max Holding Timeout
                elif strategy.exit.max_holding_bars and bars_held >= strategy.exit.max_holding_bars:
                    exit_reason = "TIME EXPIRY"
                    exit_price = cur_price
                # Check Last Bar EOD Exit
                elif i == len(candles) - 1:
                    exit_reason = "SESSION CLOSE"
                    exit_price = cur_price

                if exit_reason:
                    trade_record = self._finalize_trade(
                        symbol=symbol,
                        entry_time=entry_time,
                        exit_time=cur_time,
                        entry_price=entry_price,
                        exit_price=exit_price,
                        quantity=quantity,
                        exit_reason=exit_reason,
                        bars_held=bars_held
                    )
                    trades.append(trade_record)
                    in_position = False

        return trades

    def _evaluate_entry(
        self,
        conditions: List[RuleCondition],
        logic: str,
        ind: Dict[str, Any]
    ) -> bool:
        if not conditions:
            return False

        results = []
        for cond in conditions:
            f = cond.field.lower()
            op = cond.operator.upper()
            val = cond.value
            left = ind.get(f)

            if left is None:
                results.append(False)
                continue

            # Right value resolution
            if isinstance(val, str) and val.lower() in ind:
                right = ind[val.lower()] * (cond.multiplier or 1.0)
            else:
                try:
                    right = float(val) * (cond.multiplier or 1.0)
                except Exception:
                    right = 0.0

            res = False
            if op in [">", "CROSSES_ABOVE"]:
                res = left > right
            elif op in ["<", "CROSSES_BELOW"]:
                res = left < right
            elif op == ">=":
                res = left >= right
            elif op == "<=":
                res = left <= right
            elif op == "==":
                res = abs(left - right) < 0.001
            else:
                res = left > right

            results.append(res)

        return all(results) if logic == "AND" else any(results)

    def _finalize_trade(
        self,
        symbol: str,
        entry_time: int,
        exit_time: int,
        entry_price: float,
        exit_price: float,
        quantity: int,
        exit_reason: str,
        bars_held: int
    ) -> Dict[str, Any]:
        turnover_buy = entry_price * quantity
        turnover_sell = exit_price * quantity
        total_turnover = turnover_buy + turnover_sell
        gross_pnl = round(turnover_sell - turnover_buy, 2)

        # Exact Indian statutory calculation
        # 1. Brokerage: Rs 20 buy + Rs 20 sell capped
        brokerage = min(40.0, total_turnover * 0.0003)
        # 2. STT: Intraday cash sell @ 0.025%
        stt = turnover_sell * 0.00025
        # 3. Exchange charges: NSE ~0.00345%
        exch_charges = total_turnover * 0.0000345
        # 4. SEBI charges: Rs 10 per crore
        sebi_charges = total_turnover * 0.000001
        # 5. GST: 18% on (brokerage + exchange + sebi)
        gst = (brokerage + exch_charges + sebi_charges) * 0.18
        # 6. Stamp duty: 0.003% on buy
        stamp_duty = turnover_buy * 0.00003

        statutory_costs = round(brokerage + stt + exch_charges + sebi_charges + gst + stamp_duty, 2)
        net_pnl = round(gross_pnl - statutory_costs, 2)
        return_pct = round((net_pnl / max(1.0, turnover_buy)) * 100.0, 2)

        entry_dt = datetime.fromtimestamp(entry_time).strftime("%d %b %H:%M") if entry_time > 0 else "-"
        exit_dt = datetime.fromtimestamp(exit_time).strftime("%d %b %H:%M") if exit_time > 0 else "-"

        return {
            "symbol": symbol,
            "entry_time": entry_time,
            "exit_time": exit_time,
            "entry_date_str": entry_dt,
            "exit_date_str": exit_dt,
            "entry_price": round(entry_price, 2),
            "exit_price": round(exit_price, 2),
            "quantity": quantity,
            "turnover": round(turnover_buy, 2),
            "gross_pnl": gross_pnl,
            "statutory_costs": statutory_costs,
            "net_pnl": net_pnl,
            "return_pct": return_pct,
            "exit_reason": exit_reason,
            "holding_bars": bars_held
        }

    def _calc_rsi(self, closes: List[float], period: int = 14) -> float:
        if len(closes) < period + 1:
            return 50.0
        gains = []
        losses = []
        for i in range(1, len(closes)):
            diff = closes[i] - closes[i - 1]
            if diff >= 0:
                gains.append(diff)
                losses.append(0.0)
            else:
                gains.append(0.0)
                losses.append(abs(diff))

        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        if avg_loss == 0:
            return 100.0
        rs = avg_gain / avg_loss
        return round(100.0 - (100.0 / (1.0 + rs)), 1)

    def _calc_ema(self, series: List[float], period: int) -> float:
        if not series:
            return 0.0
        if len(series) < period:
            return round(sum(series) / len(series), 2)
        multiplier = 2.0 / (period + 1)
        ema = sum(series[:period]) / period
        for price in series[period:]:
            ema = (price - ema) * multiplier + ema
        return round(ema, 2)

backtest_engine = BacktestEngine()
