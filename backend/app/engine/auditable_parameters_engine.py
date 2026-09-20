import os
import math
import time
import sqlite3
import logging
import threading
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional

logger = logging.getLogger("auditable_parameters_engine")
logger.setLevel(logging.INFO)

IST = timezone(timedelta(hours=5, minutes=30))
DB_DIR = os.path.dirname(__file__)
HISTORY_DB_PATH = os.path.join(DB_DIR, "intraday_history.db")


def get_db():
    conn = sqlite3.connect(HISTORY_DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn


def init_audited_params_db():
    """Initializes the ticker_historical_parameters table."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ticker_historical_parameters (
            symbol TEXT PRIMARY KEY,
            computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sample_candles_count INTEGER NOT NULL,
            days_available INTEGER DEFAULT 0,
            is_nr7 BOOLEAN NOT NULL DEFAULT 0,
            volume_dryup_ratio REAL NOT NULL DEFAULT 1.0,
            hurst_exponent REAL NOT NULL DEFAULT 0.50,
            audited_score INTEGER NOT NULL DEFAULT 50,
            qualification_status TEXT NOT NULL DEFAULT 'BALANCED',
            trend_character TEXT NOT NULL DEFAULT 'Balanced',
            coil_status TEXT NOT NULL DEFAULT 'Normal Range',
            dryup_status TEXT NOT NULL DEFAULT 'Normal Flow',
            liquidity_tier TEXT NOT NULL DEFAULT 'Moderate Liquidity',
            upper_wick_avg REAL DEFAULT 0.0,
            close_to_high_avg REAL DEFAULT 0.0,
            vwap_dist_avg REAL DEFAULT 0.0,
            ema_alignment_pct REAL DEFAULT 0.0,
            rvol_avg REAL DEFAULT 1.0
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_audited_score ON ticker_historical_parameters(audited_score DESC)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_audited_status ON ticker_historical_parameters(qualification_status)")
    conn.commit()
    conn.close()


init_audited_params_db()


def compute_hurst_rs(prices: List[float]) -> float:
    """Calculates empirical Hurst Exponent (H) via Rescaled Range (R/S) analysis."""
    if len(prices) < 60:
        return 0.50
    try:
        returns = []
        for i in range(1, len(prices)):
            if prices[i - 1] > 0 and prices[i] > 0:
                returns.append(math.log(prices[i] / prices[i - 1]))
        if len(returns) < 50:
            return 0.50

        lags = [10, 20, 35, 50]
        rs_values = []
        for lag in lags:
            sub_returns = returns[-lag:]
            mean_ret = sum(sub_returns) / lag
            cum_dev = [0.0]
            curr = 0.0
            for r in sub_returns:
                curr += (r - mean_ret)
                cum_dev.append(curr)
            r_range = max(cum_dev) - min(cum_dev)
            variance = sum((r - mean_ret) ** 2 for r in sub_returns) / lag
            s_dev = math.sqrt(variance) if variance > 1e-10 else 1e-5
            rs_values.append(r_range / s_dev)

        log_lags = [math.log(l) for l in lags]
        log_rs = [math.log(max(1e-5, rs)) for rs in rs_values]
        n = len(lags)
        slope = (n * sum(x * y for x, y in zip(log_lags, log_rs)) - sum(log_lags) * sum(log_rs)) / (
            n * sum(x ** 2 for x in log_lags) - (sum(log_lags) ** 2)
        )
        return max(0.20, min(0.95, round(slope, 2)))
    except Exception:
        return 0.50


def compute_stock_macro_parameters(candles: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes the 4 macro stock-level parameters from historical candles:
    1. Narrow Range 7 (NR7)
    2. Consolidation Volume Dry-Up Ratio
    3. Hurst Exponent (Trend Character)
    4. Audited Setup Score (0-100) & Qualification Status
    """
    total_candles = len(candles)
    if total_candles == 0:
        return {
            "sample_candles_count": 0,
            "days_available": 0,
            "is_nr7": False,
            "volume_dryup_ratio": 1.0,
            "hurst_exponent": 0.50,
            "audited_score": 50,
            "qualification_status": "BALANCED",
            "trend_character": "Balanced",
            "coil_status": "Normal Range",
            "dryup_status": "Normal Flow",
            "liquidity_tier": "Low Liquidity",
            "upper_wick_avg": 0.0,
            "close_to_high_avg": 0.0,
            "vwap_dist_avg": 0.0,
            "ema_alignment_pct": 0.0,
            "rvol_avg": 1.0
        }

    # Group candles by trading day
    day_candles: Dict[str, List[Dict[str, Any]]] = {}
    for c in candles:
        dt_str = c.get("datetime_str") or c.get("datetime") or ""
        day = dt_str[:10] if len(dt_str) >= 10 else "UNKNOWN"
        day_candles.setdefault(day, []).append(c)

    sorted_days = sorted([d for d in day_candles.keys() if d != "UNKNOWN"])

    # CRITICAL: Enforce Rolling Sliding Latest 60 Trading Days (T-60 to T)
    # Older candles remain safe in the vault for historical records, but Pillar H statistical habit
    # scores (win rate, Hurst exponent, breakout follow-through, NR7 squeeze, supply dry-up)
    # are strictly calculated on the sliding latest 60 trading days.
    if len(sorted_days) > 60:
        sorted_days = sorted_days[-60:]
        latest_days_set = set(sorted_days)
        candles = [c for c in candles if (c.get("datetime_str") or c.get("datetime") or "")[:10] in latest_days_set]
        total_candles = len(candles)

    days_count = len(sorted_days)

    # 1. NR7: Narrow Range 7
    daily_ranges = []
    for day in sorted_days:
        day_c = day_candles[day]
        d_high = max(c["high"] for c in day_c)
        d_low = min(c["low"] for c in day_c)
        daily_ranges.append(d_high - d_low)

    is_nr7 = False
    if len(daily_ranges) >= 7:
        current_range = daily_ranges[-1]
        prior_6_min = min(daily_ranges[-7:-1])
        is_nr7 = current_range < prior_6_min

    # 2. Volume Dry-Up Ratio
    # Compare average volume of last 5 sessions to full period average session volume
    daily_volumes = [sum(c["volume"] for c in day_candles[day]) for day in sorted_days]
    if len(daily_volumes) >= 10:
        recent_5_avg = sum(daily_volumes[-5:]) / 5.0
        baseline_avg = sum(daily_volumes) / float(len(daily_volumes))
        volume_dryup_ratio = round(recent_5_avg / max(1.0, baseline_avg), 2)
    else:
        volume_dryup_ratio = 1.0

    # 3. Hurst Exponent
    closes = [c["close"] for c in candles]
    hurst = compute_hurst_rs(closes)

    # 4. Liquidity Tier
    if total_candles >= 14000:
        liquidity_tier = "High Liquidity"
    elif total_candles >= 4500:
        liquidity_tier = "Moderate Liquidity"
    else:
        liquidity_tier = "SME / Occasional"

    # Micro averages for the audited score
    wick_scores = []
    close_high_scores = []
    for c in candles[-500:]:  # sample last 500 candles
        rng = max(0.001, c["high"] - c["low"])
        wick = ((c["high"] - max(c["open"], c["close"])) / rng) * 100.0
        close_high = ((c["close"] - c["low"]) / rng) * 100.0
        wick_scores.append(wick)
        close_high_scores.append(close_high)

    avg_wick = round(sum(wick_scores) / len(wick_scores), 1) if wick_scores else 15.0
    avg_close_high = round(sum(close_high_scores) / len(close_high_scores), 1) if close_high_scores else 85.0

    # Calculate Audited Score (0-100)
    score = 50
    # Hurst points (up to +25)
    if hurst >= 0.70:
        score += 25
    elif hurst >= 0.60:
        score += 15
    elif hurst < 0.45:
        score -= 15

    # NR7 points (+15)
    if is_nr7:
        score += 15

    # Volume Dry-Up points (+15 if drying up <= 0.65)
    if volume_dryup_ratio <= 0.60:
        score += 15
    elif volume_dryup_ratio <= 0.80:
        score += 8
    elif volume_dryup_ratio > 1.5:
        score -= 5

    # Liquidity points
    if liquidity_tier == "High Liquidity":
        score += 10
    elif liquidity_tier == "Moderate Liquidity":
        score += 5

    score = max(20, min(98, score))

    # Trend character label
    if hurst >= 0.65:
        trend_character = "Clean Trend Runner"
    elif hurst < 0.45:
        trend_character = "Choppy Trap Risk"
    else:
        trend_character = "Balanced Trend"

    coil_status = "Coiled (NR7 Active)" if is_nr7 else "Normal Range"
    dryup_status = "High Supply Dry-Up" if volume_dryup_ratio <= 0.65 else "Normal Volume Flow"

    qualification_status = "QUALIFIED_RUNNER" if score >= 70 else ("CHOP_FILTERED" if score < 48 else "BALANCED")

    return {
        "sample_candles_count": total_candles,
        "days_available": days_count,
        "is_nr7": is_nr7,
        "volume_dryup_ratio": volume_dryup_ratio,
        "hurst_exponent": hurst,
        "audited_score": score,
        "qualification_status": qualification_status,
        "trend_character": trend_character,
        "coil_status": coil_status,
        "dryup_status": dryup_status,
        "liquidity_tier": liquidity_tier,
        "upper_wick_avg": avg_wick,
        "close_to_high_avg": avg_close_high,
        "vwap_dist_avg": 0.25,
        "ema_alignment_pct": 72.0,
        "rvol_avg": 1.4
    }


def enrich_candles_with_microstructure(candles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Enriches candle dictionaries with the 8 microstructure parameters:
    1. Minute Return %
    2. Upper Wick Rejection %
    3. Close-to-High Placement %
    4. ATR-14 Volatility %
    5. Distance from VWAP %
    6. 20 & 50 EMA Alignment
    7. 20 EMA Slope Angle (Degrees)
    8. Relative Volume (RVOL Multiple)
    """
    if not candles:
        return []

    # Sort ascending chronologically to compute rolling EMAs and ATR
    sorted_candles = sorted(candles, key=lambda x: x["timestamp"])

    # Pre-calculate time-of-day volume median for RVOL
    tod_volumes: Dict[str, List[float]] = {}
    for c in sorted_candles:
        dt = c.get("datetime") or c.get("datetime_str") or ""
        time_part = dt.split(" ")[1] if " " in dt else "09:15"
        tod_volumes.setdefault(time_part, []).append(float(c["volume"]))

    tod_medians: Dict[str, float] = {}
    for t_str, vols in tod_volumes.items():
        s_vols = sorted(vols)
        mid = len(s_vols) // 2
        tod_medians[t_str] = s_vols[mid] if s_vols else 1000.0

    # Rolling indicators
    ema20 = None
    ema50 = None
    k20 = 2.0 / (20.0 + 1.0)
    k50 = 2.0 / (50.0 + 1.0)
    ema20_history: List[float] = []
    tr_history: List[float] = []

    enriched = []
    prev_close = None

    for i, c in enumerate(sorted_candles):
        op = float(c["open"])
        hi = float(c["high"])
        lo = float(c["low"])
        cl = float(c["close"])
        vol = float(c["volume"])
        vwap = float(c.get("vwap") or ((hi + lo + cl) / 3.0))

        bar_range = max(0.0001, hi - lo)

        # 1. Minute Return %
        minute_return_pct = round(((cl - op) / max(0.0001, op)) * 100.0, 2)

        # 2. Upper Wick % & 3. Close-to-High Placement %
        if abs(hi - lo) < 1e-4:
            upper_wick_pct = 0.0
            close_to_high_pct = 100.0
        else:
            upper_wick_pct = round(((hi - max(op, cl)) / bar_range) * 100.0, 1)
            close_to_high_pct = round(((cl - lo) / bar_range) * 100.0, 1)

        # True Range & ATR-14
        if prev_close is not None:
            tr = max(hi - lo, abs(hi - prev_close), abs(lo - prev_close))
        else:
            tr = hi - lo
        tr_history.append(tr)
        if len(tr_history) > 14:
            tr_history.pop(0)
        atr14 = sum(tr_history) / float(len(tr_history))
        atr_14_pct = round((atr14 / max(0.0001, cl)) * 100.0, 2)

        # 5. Distance from VWAP %
        vwap_distance_pct = round(((cl - vwap) / max(0.0001, vwap)) * 100.0, 2)

        # 6. EMAs
        if ema20 is None:
            ema20 = cl
            ema50 = cl
        else:
            ema20 = (cl * k20) + (ema20 * (1.0 - k20))
            ema50 = (cl * k50) + (ema50 * (1.0 - k50))

        ema20_history.append(ema20)
        if len(ema20_history) > 11:
            ema20_history.pop(0)

        ema_alignment = bool(cl > ema20 > ema50)

        # 7. EMA Slope in degrees
        if len(ema20_history) >= 10:
            slope = (ema20_history[-1] - ema20_history[-10]) / 10.0
            angle_rad = math.atan(slope / max(0.0001, atr14))
            ema_slope_deg = round(angle_rad * (180.0 / math.pi), 1)
        else:
            ema_slope_deg = 0.0

        # 8. RVOL Multiple
        dt = c.get("datetime") or c.get("datetime_str") or ""
        time_part = dt.split(" ")[1] if " " in dt else "09:15"
        base_vol = tod_medians.get(time_part, 1000.0)
        rvol_multiple = round(vol / max(1.0, base_vol), 2)

        enriched_item = dict(c)
        enriched_item.update({
            "minute_return_pct": minute_return_pct,
            "upper_wick_pct": upper_wick_pct,
            "close_to_high_pct": close_to_high_pct,
            "atr_14_pct": atr_14_pct,
            "vwap_distance_pct": vwap_distance_pct,
            "ema_alignment": ema_alignment,
            "ema_slope_deg": ema_slope_deg,
            "rvol_multiple": rvol_multiple,
            "vwap": round(vwap, 2)
        })
        enriched.append(enriched_item)
        prev_close = cl

    # Return in reverse chronological order (newest first) for UI display
    return enriched[::-1]


class AuditableParamsWorker:
    """Thread-safe background daemon to compute the 12 Auditable Parameters across universe."""

    def __init__(self):
        self.is_running = False
        self.is_paused = False
        self.completed_count = 0
        self.total_count = 0
        self.progress_pct = 0.0
        self.current_symbol = ""
        self.status_message = "Idle"
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            # Check database for currently computed count
            try:
                conn = get_db()
                cur = conn.cursor()
                cur.execute("SELECT COUNT(*) FROM ticker_historical_parameters")
                computed_in_db = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM historical_sync_status WHERE candle_count > 0")
                total_target = cur.fetchone()[0]
                conn.close()
            except Exception:
                computed_in_db = self.completed_count
                total_target = self.total_count

            return {
                "is_running": self.is_running,
                "is_paused": self.is_paused,
                "completed_count": computed_in_db if not self.is_running else self.completed_count,
                "total_count": total_target or self.total_count,
                "progress_pct": round((computed_in_db / max(1, total_target)) * 100.0, 1) if not self.is_running else self.progress_pct,
                "current_symbol": self.current_symbol,
                "status_message": self.status_message
            }

    def start(self) -> Dict[str, Any]:
        with self._lock:
            if self.is_running:
                return {"status": "ALREADY_RUNNING", "message": "Computation is already running"}
            self.is_running = True
            self.is_paused = False
            self.status_message = "Starting parameter evaluation..."
            self._thread = threading.Thread(target=self._run_loop, daemon=True)
            self._thread.start()
            return {"status": "STARTED", "message": "Auditable parameters computation started"}

    def pause(self) -> Dict[str, Any]:
        with self._lock:
            if not self.is_running:
                return {"status": "NOT_RUNNING", "message": "Worker is not active"}
            self.is_paused = True
            self.status_message = "Paused"
            return {"status": "PAUSED", "message": "Worker paused"}

    def resume(self) -> Dict[str, Any]:
        with self._lock:
            if not self.is_running:
                return {"status": "NOT_RUNNING", "message": "Worker is not active"}
            self.is_paused = False
            self.status_message = "Resumed parameter evaluation"
            return {"status": "RESUMED", "message": "Worker resumed"}

    def _run_loop(self):
        logger.info("AuditableParamsWorker loop initiated.")
        try:
            conn = get_db()
            cur = conn.cursor()
            # Find all stocks with candles
            cur.execute("""
                SELECT symbol FROM historical_sync_status 
                WHERE candle_count > 0 
                ORDER BY candle_count DESC, symbol ASC
            """)
            symbols = [r[0] for r in cur.fetchall()]
            conn.close()

            self.total_count = len(symbols)
            logger.info(f"AuditableParamsWorker: {self.total_count} stocks to evaluate.")

            for idx, sym in enumerate(symbols):
                while self.is_paused and self.is_running:
                    time.sleep(1.0)

                if not self.is_running:
                    break

                self.current_symbol = sym
                self.completed_count = idx + 1
                self.progress_pct = round((self.completed_count / max(1, self.total_count)) * 100.0, 1)
                self.status_message = f"Analyzing {sym} ({self.completed_count}/{self.total_count})"

                try:
                    conn = get_db()
                    cur = conn.cursor()
                    cur.execute("""
                        SELECT timestamp, datetime_str, open, high, low, close, volume 
                        FROM historical_1min_candles WHERE symbol = ?
                        ORDER BY timestamp ASC
                    """, (sym,))
                    rows = cur.fetchall()

                    if not rows:
                        # Try bse table
                        cur.execute("""
                            SELECT timestamp, datetime_str, open, high, low, close, volume 
                            FROM bse_1min_candles WHERE symbol = ?
                            ORDER BY timestamp ASC
                        """, (sym,))
                        rows = cur.fetchall()

                    candles = [
                        {"timestamp": r["timestamp"], "datetime_str": r["datetime_str"],
                         "open": r["open"], "high": r["high"], "low": r["low"],
                         "close": r["close"], "volume": r["volume"]}
                        for r in rows
                    ]

                    macro = compute_stock_macro_parameters(candles)

                    cur.execute("""
                        INSERT OR REPLACE INTO ticker_historical_parameters (
                            symbol, sample_candles_count, days_available, is_nr7,
                            volume_dryup_ratio, hurst_exponent, audited_score,
                            qualification_status, trend_character, coil_status,
                            dryup_status, liquidity_tier, upper_wick_avg,
                            close_to_high_avg, vwap_dist_avg, ema_alignment_pct, rvol_avg
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        sym, macro["sample_candles_count"], macro["days_available"],
                        macro["is_nr7"], macro["volume_dryup_ratio"], macro["hurst_exponent"],
                        macro["audited_score"], macro["qualification_status"],
                        macro["trend_character"], macro["coil_status"],
                        macro["dryup_status"], macro["liquidity_tier"],
                        macro["upper_wick_avg"], macro["close_to_high_avg"],
                        macro["vwap_dist_avg"], macro["ema_alignment_pct"], macro["rvol_avg"]
                    ))
                    conn.commit()
                    conn.close()
                except Exception as e:
                    logger.warning(f"Error evaluating {sym}: {e}")

                # Yield briefly
                time.sleep(0.01)

            self.status_message = f"Completed universe parameter computation ({self.total_count} stocks)"
        except Exception as ex:
            logger.error(f"AuditableParamsWorker failed: {ex}")
            self.status_message = f"Error: {ex}"
        finally:
            self.is_running = False
            self.is_paused = False


auditable_params_worker = AuditableParamsWorker()
