"""
Autonomous Tape Ingestion & Parameter Re-Audit Daemon
Runs continuously in the background with zero human intervention required.
- Triggers at 16:15 IST every trading day (Mon-Fri)
- Auto-detects and catches up any missing days on backend startup
- Automatically cascades into auditable parameter recalculation (sliding 60-day window)
"""

import time
import logging
import threading
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

logger = logging.getLogger("auto_tape_daemon")
logger.setLevel(logging.INFO)

IST = timezone(timedelta(hours=5, minutes=30))


class AutoTapeDaemon:
    def __init__(self):
        self._thread: Optional[threading.Thread] = None
        self._is_active = False
        self._last_run_date = ""
        self._last_trigger_status = "IDLE"
        self._last_error = ""
        self._lock = threading.Lock()

    def start(self):
        with self._lock:
            if self._is_active:
                logger.info("AutoTapeDaemon already running.")
                return
            self._is_active = True
            self._thread = threading.Thread(target=self._daemon_loop, daemon=True, name="AutoTapeDaemon")
            self._thread.start()
            logger.info("AutoTapeDaemon background service started (16:15 IST Daily Ingestion).")

    def stop(self):
        with self._lock:
            self._is_active = False

    def _daemon_loop(self):
        logger.info("AutoTapeDaemon loop initialized.")
        
        # Step 1: Startup check - delay 15 seconds to allow Dhan TOTP & session authentication
        time.sleep(15.0)
        try:
            self._check_startup_catchup()
        except Exception as ex:
            logger.error(f"Error during startup catch-up check: {ex}")

        # Step 2: Main loop checking for 16:15 IST trigger every 30 seconds
        while self._is_active:
            try:
                now_ist = datetime.now(IST)
                today_str = now_ist.strftime("%Y-%m-%d")
                day_of_week = now_ist.weekday()  # 0 = Mon, 4 = Fri, 5 = Sat, 6 = Sun
                hour = now_ist.hour
                minute = now_ist.minute

                # Trigger at 16:15 IST on weekdays (Mon-Fri) if not already run today
                if day_of_week < 5 and hour == 16 and minute >= 15 and minute <= 45:
                    if self._last_run_date != today_str:
                        logger.info(f"AutoTapeDaemon: 16:15 IST weekday trigger hit for {today_str}. Initiating ingestion...")
                        self._last_run_date = today_str
                        self._trigger_ingestion()

            except Exception as e:
                logger.error(f"AutoTapeDaemon loop error: {e}")
                self._last_error = str(e)

            time.sleep(30.0)

    def _check_startup_catchup(self):
        from app.engine.daily_tape_ingest_service import daily_tape_service
        pending = daily_tape_service.get_pending_trading_dates()
        if pending:
            logger.info(f"AutoTapeDaemon detected {len(pending)} pending trading dates on startup: {pending}. Triggering catch-up...")
            res = daily_tape_service.start_catchup()
            logger.info(f"AutoTapeDaemon startup catchup result: {res}")
            self._last_trigger_status = f"STARTUP_CATCHUP: {len(pending)} dates"
        else:
            logger.info("AutoTapeDaemon startup check: All past trading dates up to date.")
            self._last_trigger_status = "UP_TO_DATE"

        # Check if started mid-session on a market day (after 09:17 AM) and catch up today's opening candles
        try:
            from app.engine.intraday_today_catchup import today_catchup_service
            today_catchup_service.ensure_startup_catchup()
        except Exception as e_today:
            logger.error(f"Error checking today's mid-session candle catchup: {e_today}")

    def _trigger_ingestion(self):
        from app.engine.daily_tape_ingest_service import daily_tape_service
        try:
            # Check for any pending dates including today
            pending = daily_tape_service.get_pending_trading_dates()
            if pending:
                logger.info(f"AutoTapeDaemon starting catch-up for dates: {pending}")
                res = daily_tape_service.start_catchup()
            else:
                now_ist = datetime.now(IST)
                today_str = now_ist.strftime("%Y-%m-%d")
                res = daily_tape_service.start_ingest(target_date=today_str)
            self._last_trigger_status = f"TRIGGERED: {res.get('message', '')}"
        except Exception as ex:
            logger.error(f"AutoTapeDaemon failed to trigger ingestion: {ex}")
            self._last_error = str(ex)
            self._last_trigger_status = f"ERROR: {ex}"

    def get_status(self) -> Dict[str, Any]:
        now_ist = datetime.now(IST)
        day_of_week = now_ist.weekday()
        
        # Calculate next scheduled run
        if day_of_week < 5:
            if (now_ist.hour * 100 + now_ist.minute) < 1615:
                next_run_str = f"Today ({now_ist.strftime('%d %b')}) at 04:15 PM IST"
            else:
                if day_of_week == 4:  # Friday post 16:15
                    next_monday = now_ist + timedelta(days=3)
                    next_run_str = f"Monday ({next_monday.strftime('%d %b')}) at 04:15 PM IST"
                else:
                    tomorrow = now_ist + timedelta(days=1)
                    next_run_str = f"Tomorrow ({tomorrow.strftime('%d %b')}) at 04:15 PM IST"
        else:
            # Weekend
            days_to_mon = 7 - day_of_week
            next_monday = now_ist + timedelta(days=days_to_mon)
            next_run_str = f"Monday ({next_monday.strftime('%d %b')}) at 04:15 PM IST"

        try:
            from app.engine.daily_tape_ingest_service import daily_tape_service
            pending = daily_tape_service.get_pending_trading_dates()
        except Exception:
            pending = []

        return {
            "is_active": self._is_active,
            "scheduled_time_ist": "16:15 IST (Mon-Fri)",
            "next_scheduled_run": next_run_str,
            "last_run_date": self._last_run_date,
            "last_trigger_status": self._last_trigger_status,
            "last_error": self._last_error,
            "pending_dates": pending,
            "pending_dates_count": len(pending)
        }


auto_tape_daemon = AutoTapeDaemon()
