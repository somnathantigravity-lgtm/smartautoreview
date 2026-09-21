"""
intraday_today_catchup.py
Automatic Intraday Candle Catch-Up & ORB Calibration Service.
Ensures that if the engine or computer restarts mid-session (after 09:15 AM):
1. All elapsed 1-minute candles for today (09:15 to current minute) are ingested from Dhan API.
2. Opening 15-Minute Range (ORB High/Low), True Day High/Low, Cumulative Volume, and VWAP are calibrated.
3. dhan_provider.stocks_cache is populated in RAM so scanners and recommendation engines have 100% accurate data.
"""

import os
import json
import time
import sqlite3
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional

logger = logging.getLogger("today_catchup")
logger.setLevel(logging.INFO)

IST = timezone(timedelta(hours=5, minutes=30))
DB_PATH = os.path.join(os.path.dirname(__file__), "intraday_history.db")
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "dhan_config.json")


def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


class IntradayTodayCatchupService:
    def __init__(self):
        self._is_running = False
        self._last_catchup_time = 0.0
        self._last_catchup_date = ""

    def is_market_hours(self) -> bool:
        now_ist = datetime.now(IST)
        # Mon-Fri (0-4)
        if now_ist.weekday() > 4:
            return False
        # Active market window: 09:15 to 15:30 IST
        market_open = datetime.strptime("09:15:00", "%H:%M:%S").time()
        market_close = datetime.strptime("15:30:00", "%H:%M:%S").time()
        return market_open <= now_ist.time() <= market_close

    def catchup_today_candles(self, max_stocks: Optional[int] = None) -> Dict[str, Any]:
        """Ingests today's 1-minute bars from Dhan for all active stocks."""
        if self._is_running:
            return {"status": "IN_PROGRESS", "message": "Catchup already running."}

        if not os.path.exists(CONFIG_PATH):
            return {"status": "ERROR", "message": "dhan_config.json not found"}

        try:
            with open(CONFIG_PATH, "r") as f:
                cfg = json.load(f)
            client_id = cfg.get("client_id")
            access_token = cfg.get("access_token")
            if not client_id or not access_token:
                return {"status": "ERROR", "message": "Missing Dhan credentials"}
        except Exception as e:
            return {"status": "ERROR", "message": f"Error reading config: {e}"}

        from dhanhq import dhanhq, DhanContext
        from app.engine.dhan_provider import dhan_provider

        ctx = DhanContext(client_id, access_token)
        client = dhanhq(ctx)

        now_ist = datetime.now(IST)
        today_str = now_ist.strftime("%Y-%m-%d")
        current_time_str = now_ist.strftime("%H:%M:%S")

        self._is_running = True
        logger.info(f"Starting intraday candle catch-up for {today_str} at {current_time_str} IST...")

        # Target symbols from stocks_cache or eligible universe
        symbols = list(dhan_provider.stocks_cache.keys())
        if not symbols:
            # Fallback to loading from universe loader
            try:
                from app.engine.master_universe_loader import load_master_universe
                universe = load_master_universe()
                symbols = [s["symbol"] for s in universe]
            except Exception:
                symbols = []

        if max_stocks:
            symbols = symbols[:max_stocks]

        total_symbols = len(symbols)
        logger.info(f"Identified {total_symbols} stocks for today's candle catch-up.")

        # Rate limiter helper: max 6 requests per second to stay safely under Dhan rate limits
        class RateLimiter:
            def __init__(self, rate: float = 6.0):
                self.rate = rate
                self.last_t = 0.0
                import threading
                self._lock = threading.Lock()

            def acquire(self):
                with self._lock:
                    now = time.time()
                    elapsed = now - self.last_t
                    if elapsed < (1.0 / self.rate):
                        time.sleep((1.0 / self.rate) - elapsed)
                    self.last_t = time.time()

        limiter = RateLimiter(rate=6.0)
        success_count = 0
        total_candles_ingested = 0
        all_db_candles_nse = []
        all_db_candles_bse = []

        def _fetch_symbol_candles(sym: str):
            stk = dhan_provider.stocks_cache.get(sym, {})
            sec_id = stk.get("nse_id") or stk.get("bse_id")
            exchange = "NSE" if stk.get("nse_id") else "BSE"
            seg = "NSE_EQ" if exchange == "NSE" else "BSE_EQ"

            if not sec_id:
                return None

            for attempt in range(3):
                limiter.acquire()
                try:
                    res = client.intraday_minute_data(
                        security_id=str(sec_id),
                        exchange_segment=seg,
                        instrument_type="EQUITY",
                        from_date=today_str,
                        to_date=today_str,
                        interval=1
                    )
                    if isinstance(res, dict) and res.get("status") == "error":
                        remarks = str(res.get("remarks") or "") + str(res.get("data") or "")
                        if "429" in remarks or "805" in remarks or "rate limit" in remarks.lower():
                            time.sleep(1.5 * (attempt + 1))
                            continue

                    if isinstance(res, dict) and res.get("status") == "success" and "data" in res:
                        d = res["data"]
                        ts_list = d.get("timestamp", [])
                        op_list = d.get("open", [])
                        hi_list = d.get("high", [])
                        lo_list = d.get("low", [])
                        cl_list = d.get("close", [])
                        vol_list = d.get("volume", [])
                        count = len(ts_list)
                        if count > 0:
                            return {
                                "sym": sym,
                                "exchange": exchange,
                                "count": count,
                                "timestamps": ts_list,
                                "opens": op_list,
                                "highs": hi_list,
                                "lows": lo_list,
                                "closes": cl_list,
                                "volumes": vol_list
                            }
                        return None
                except Exception as ex:
                    logger.debug(f"Error fetching candles for {sym}: {ex}")
                    time.sleep(1.0)
            return None

        # Multithreaded worker execution with conservative 3 workers
        with ThreadPoolExecutor(max_workers=3) as pool:
            futures = {pool.submit(_fetch_symbol_candles, sym): sym for sym in symbols}
            for fut in as_completed(futures):
                res = fut.result()
                if not res:
                    continue

                sym = res["sym"]
                exch = res["exchange"]
                count = res["count"]
                ts_list = res["timestamps"]
                op_list = res["opens"]
                hi_list = res["highs"]
                lo_list = res["lows"]
                cl_list = res["closes"]
                vol_list = res["volumes"]

                success_count += 1
                total_candles_ingested += count

                # Compute calibrated intraday metrics
                first_open = float(op_list[0]) if op_list else 0.0
                day_high = max(float(h) for h in hi_list) if hi_list else 0.0
                day_low = min(float(l) for l in lo_list) if lo_list else 0.0
                latest_close = float(cl_list[-1]) if cl_list else 0.0
                total_vol = sum(float(v) for v in vol_list) if vol_list else 0.0

                # VWAP calculation: sum(close * volume) / sum(volume)
                cum_pv = sum(float(cl_list[i]) * float(vol_list[i]) for i in range(count))
                vwap = round(cum_pv / max(1.0, total_vol), 2) if total_vol > 0 else latest_close

                # Opening 15-Min Range (09:15 to 09:30)
                # First 15 candles
                orb_count = min(15, count)
                orb_high = max(float(hi_list[i]) for i in range(orb_count)) if orb_count > 0 else day_high
                orb_low = min(float(lo_list[i]) for i in range(orb_count)) if orb_count > 0 else day_low

                # Update in-memory stocks_cache immediately
                if sym in dhan_provider.stocks_cache:
                    s = dhan_provider.stocks_cache[sym]
                    s["open"] = first_open
                    s["day_high"] = day_high
                    s["high"] = day_high
                    s["day_low"] = day_low
                    s["low"] = day_low
                    s["ltp"] = latest_close
                    s["close"] = latest_close
                    s["volume"] = int(total_vol)
                    s["vwap"] = vwap
                    s["orb_15_high"] = orb_high
                    s["orb_15_low"] = orb_low
                    s["has_today_bars"] = True
                    s["bars_today_count"] = count

                # Prepare DB batch
                for idx in range(count):
                    raw_ts = int(ts_list[idx])
                    ts = (raw_ts // 60) * 60
                    dt_str = datetime.fromtimestamp(ts, tz=IST).strftime("%Y-%m-%d %H:%M:00")
                    o = float(op_list[idx])
                    h = float(hi_list[idx])
                    l = float(lo_list[idx])
                    c = float(cl_list[idx])
                    v = float(vol_list[idx])

                    if exch == "BSE":
                        all_db_candles_bse.append((sym, ts, dt_str, o, h, l, c, v))
                    else:
                        all_db_candles_nse.append((sym, ts, dt_str, o, h, l, c, v, "NSE"))

        # Batch insert into intraday_history.db
        if all_db_candles_nse or all_db_candles_bse:
            try:
                conn = get_db()
                c = conn.cursor()
                if all_db_candles_nse:
                    c.executemany("""
                        INSERT OR REPLACE INTO historical_1min_candles 
                        (symbol, timestamp, datetime_str, open, high, low, close, volume, exchange)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, all_db_candles_nse)
                if all_db_candles_bse:
                    c.executemany("""
                        INSERT OR REPLACE INTO bse_1min_candles 
                        (symbol, timestamp, datetime_str, open, high, low, close, volume)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, all_db_candles_bse)
                conn.commit()
                conn.close()
                logger.info(f"Flushed {len(all_db_candles_nse)} NSE & {len(all_db_candles_bse)} BSE candles into intraday_history.db")
            except Exception as e_db:
                logger.error(f"Error persisting candles to DB: {e_db}")

        self._is_running = False
        self._last_catchup_time = time.time()
        self._last_catchup_date = today_str

        msg = (
            f"Successfully caught up {success_count}/{total_symbols} stocks "
            f"({total_candles_ingested} 1-min candles) for {today_str} up to {current_time_str} IST."
        )
        logger.info(msg)
        return {
            "status": "COMPLETED",
            "success_count": success_count,
            "total_symbols": total_symbols,
            "candles_count": total_candles_ingested,
            "message": msg
        }

    def ensure_startup_catchup(self):
        """Auto-triggers catch-up if started mid-session after 09:17 AM."""
        now_ist = datetime.now(IST)
        # Mon-Fri
        if now_ist.weekday() > 4:
            return

        market_open_threshold = datetime.strptime("09:17:00", "%H:%M:%S").time()
        market_close = datetime.strptime("15:30:00", "%H:%M:%S").time()

        if market_open_threshold <= now_ist.time() <= market_close:
            logger.info(f"[Auto-Guardian] Startup mid-market detected ({now_ist.strftime('%H:%M:%S')} IST). Launching automatic 1-minute candle catch-up...")
            import threading
            t = threading.Thread(target=self.catchup_today_candles, daemon=True, name="TodayStartupCatchup")
            t.start()


today_catchup_service = IntradayTodayCatchupService()
