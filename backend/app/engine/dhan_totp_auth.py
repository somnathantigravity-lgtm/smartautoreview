import os
import json
import time
import logging
import threading
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
import urllib.request
import urllib.error

import pyotp

logger = logging.getLogger(__name__)

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "..", "..", ".dhan_totp_config.json")
SESSION_FILE = os.path.join(os.path.dirname(__file__), "..", "..", ".dhan_session.json")

IST = timezone(timedelta(hours=5, minutes=30))

def get_jwt_expiry(token: str) -> float:
    try:
        parts = token.strip().strip('"').strip("'").split(".")
        if len(parts) >= 2:
            payload_b64 = parts[1]
            rem = len(payload_b64) % 4
            if rem > 0:
                payload_b64 += "=" * (4 - rem)
            import base64
            payload_bytes = base64.urlsafe_b64decode(payload_b64.encode("ascii"))
            payload = json.loads(payload_bytes.decode("utf-8", errors="ignore"))
            return float(payload.get("exp", 0))
    except Exception:
        pass
    return 0.0

class DhanTOTPAuthService:
    def __init__(self):
        self.client_id: str = ""
        self.pin: str = ""
        self.totp_secret: str = ""
        self.last_renewed_at: float = 0.0
        self.last_error: str = ""
        self.is_scheduler_running: bool = False
        self._scheduler_thread: Optional[threading.Thread] = None

        self._load_config()

    def _load_config(self):
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r") as f:
                    data = json.load(f)
                    self.client_id = str(data.get("client_id", "")).strip()
                    self.pin = str(data.get("pin", "")).strip()
                    self.totp_secret = str(data.get("totp_secret", "")).strip().replace(" ", "").upper()
                    self.last_renewed_at = float(data.get("last_renewed_at", 0.0))
            except Exception as e:
                logger.error(f"Failed to load TOTP config: {e}")

    def save_config(self, client_id: str, pin: str, totp_secret: str):
        self.client_id = str(client_id).strip()
        self.pin = str(pin).strip()
        self.totp_secret = str(totp_secret).strip().replace(" ", "").upper()

        data = {
            "client_id": self.client_id,
            "pin": self.pin,
            "totp_secret": self.totp_secret,
            "last_renewed_at": self.last_renewed_at
        }
        try:
            with open(CONFIG_FILE, "w") as f:
                json.dump(data, f, indent=2)
            logger.info("Saved Dhan TOTP credentials.")
        except Exception as e:
            logger.error(f"Failed to write TOTP config: {e}")

    def generate_current_totp(self, secret: Optional[str] = None) -> str:
        s = (secret or self.totp_secret or "").strip().replace(" ", "").upper()
        if not s:
            raise ValueError("TOTP Secret Key is missing.")
        missing_padding = len(s) % 8
        if missing_padding:
            s += "=" * (8 - missing_padding)
        totp = pyotp.TOTP(s)
        return totp.now()

    def request_access_token(self, client_id: str, pin: str, totp_secret: str) -> Dict[str, Any]:
        """
        Calls official Dhan authentication endpoint:
        POST https://auth.dhan.co/app/generateAccessToken
        """
        cid = str(client_id).strip()
        p = str(pin).strip()
        sec = str(totp_secret).strip().replace(" ", "").upper()

        if not cid:
            return {"success": False, "error": "Client ID is required."}
        if not p:
            return {"success": False, "error": "Account PIN is required."}
        if not sec:
            return {"success": False, "error": "TOTP Secret Key is required."}

        try:
            current_totp = self.generate_current_totp(sec)
        except Exception as e:
            return {"success": False, "error": f"Invalid TOTP Secret Key: {e}"}

        try:
            import requests
            url = "https://auth.dhan.co/app/generateAccessToken"
            params = {
                "dhanClientId": cid,
                "pin": p,
                "totp": current_totp
            }

            resp = requests.post(url, params=params, timeout=12)
            try:
                data = resp.json()
            except Exception:
                data = {"raw": resp.text}

            token = data.get("accessToken") or data.get("access_token") or data.get("token")
            if resp.status_code == 200 and token:
                self.last_renewed_at = time.time()
                self.last_error = ""
                if self.client_id and self.pin and self.totp_secret:
                    self.save_config(self.client_id, self.pin, self.totp_secret)
                return {
                    "success": True,
                    "access_token": token,
                    "client_id": cid,
                    "message": "Successfully generated 24-hour access token from Dhan."
                }
            else:
                error_msg = data.get("message") or data.get("error") or data.get("remarks") or data.get("raw") or f"HTTP {resp.status_code}"
                self.last_error = f"Dhan error: {error_msg}"
                return {"success": False, "error": self.last_error}

        except Exception as ex:
            self.last_error = f"Connection error: {ex}"
            return {"success": False, "error": self.last_error}

    def renew_and_connect(self) -> Dict[str, Any]:
        """
        Uses stored TOTP credentials to obtain a new token and update dhan_provider.
        """
        if not self.is_configured():
            return {"success": False, "error": "TOTP credentials not configured."}

        res = self.request_access_token(self.client_id, self.pin, self.totp_secret)
        if not res.get("success"):
            return res

        token = res["access_token"]
        cid = res["client_id"]

        try:
            with open(SESSION_FILE, "w") as f:
                json.dump({"client_id": cid, "access_token": token}, f, indent=2)
            os.environ["DHAN_CLIENT_ID"] = cid
            os.environ["DHAN_ACCESS_TOKEN"] = token
        except Exception as e:
            logger.warning(f"Could not write session file: {e}")

        # 1. Connect live market feed
        feed_connected = False
        try:
            from app.engine.dhan_provider import dhan_provider
            conn_res = dhan_provider.connect(cid, token)
            feed_connected = conn_res.get("success", False)
        except Exception as e:
            logger.warning(f"Failed to connect provider: {e}")

        # 2. Update and sync live trade execution service
        try:
            from app.engine.dhan_trade_service import dhan_trade_service
            dhan_trade_service.save_credentials(cid, token)
        except Exception as e:
            logger.warning(f"Failed to update trade service: {e}")

        # 3. Automatically register and sync outbound public IP to Dhan
        ip_res = {}
        try:
            from app.engine.dhan_ip_service import dhan_ip_service
            ip_res = dhan_ip_service.check_and_sync_ip(force=True)
            logger.info(f"Dhan IP sync after TOTP renewal: {ip_res.get('message', '')} (OrdersAllowed: {ip_res.get('ordersAllowed')})")
        except Exception as e:
            logger.warning(f"Failed to auto-sync IP after TOTP renewal: {e}")

        logger.info(f"Dhan auto-renewal successful! Connected as Client ID: {cid}")
        return {
            "success": True,
            "message": f"Token renewed! Live Feed & Trading Connected, IP Registered ({ip_res.get('currentIP', '')}).",
            "client_id": cid,
            "live_feed_connected": feed_connected,
            "orders_allowed": ip_res.get("ordersAllowed", True)
        }

    def is_configured(self) -> bool:
        return bool(self.client_id and self.pin and self.totp_secret)

    def auto_refresh_if_needed(self) -> bool:
        """
        Checks if the current session token is missing, expired, or >20 hours old.
        If configured, automatically renews.
        """
        if not self.is_configured():
            return False

        try:
            from app.engine.dhan_provider import dhan_provider
            now = time.time()
            
            token_exp = 0.0
            if os.path.exists(SESSION_FILE):
                try:
                    with open(SESSION_FILE) as sf:
                        sdata = json.load(sf)
                        token_exp = get_jwt_expiry(sdata.get("access_token", ""))
                except Exception:
                    pass

            is_token_expired = (token_exp > 0 and now >= token_exp - 3600)
            needs_renewal = (
                not dhan_provider.is_connected
                or is_token_expired
                or (now - self.last_renewed_at > 20 * 3600)
            )

            if needs_renewal:
                logger.info(f"Initiating automatic Dhan token renewal (expired={is_token_expired}, is_connected={dhan_provider.is_connected})...")
                res = self.renew_and_connect()
                return bool(res.get("success"))
        except Exception as e:
            logger.error(f"Auto-refresh check failed: {e}")

        return False

    def start_morning_scheduler(self):
        """
        Starts a background daemon thread that checks every minute:
        - At 08:30 AM IST on trading mornings, automatically generates fresh token.
        - Checks token expiration and reconnects live feed whenever needed.
        """
        if self.is_scheduler_running:
            return

        self.is_scheduler_running = True

        def _worker():
            logger.info("Dhan Morning TOTP Scheduler started (Daily target: 08:30 AM IST).")
            last_renewed_day = ""

            while True:
                try:
                    time.sleep(60)
                    if not self.is_configured():
                        continue

                    now_ist = datetime.now(IST)
                    today_str = now_ist.strftime("%Y-%m-%d")
                    hour = now_ist.hour
                    minute = now_ist.minute

                    is_morning_window = (hour == 8 and 25 <= minute <= 45)

                    if is_morning_window and last_renewed_day != today_str:
                        logger.info(f"Triggering morning scheduled TOTP login for {today_str} at {now_ist.strftime('%H:%M:%S')} IST...")
                        res = self.renew_and_connect()
                        if res.get("success"):
                            last_renewed_day = today_str
                            logger.info("Morning TOTP login completed successfully.")
                        else:
                            logger.warning(f"Morning TOTP renewal attempt returned: {res.get('error')}")

                    # Periodic automatic expiration and health check
                    self.auto_refresh_if_needed()

                    from app.engine.dhan_provider import dhan_provider
                    if dhan_provider.is_connected and not dhan_provider.is_websocket_connected:
                        if hasattr(dhan_provider, "context") and dhan_provider.context:
                            logger.info("Dhan WebSocket disconnected while provider is active. Reconnecting WebSocket feed...")
                            dhan_provider._start_websocket_feed(dhan_provider.context)

                except Exception as e:
                    logger.error(f"Error in morning scheduler loop: {e}")
                    time.sleep(30)

        self._scheduler_thread = threading.Thread(target=_worker, daemon=True)
        self._scheduler_thread.start()

    def get_status(self) -> Dict[str, Any]:
        masked_cid = f"{self.client_id[:3]}***{self.client_id[-2:]}" if len(self.client_id) > 5 else self.client_id
        return {
            "configured": self.is_configured(),
            "client_id": masked_cid if self.is_configured() else "",
            "last_renewed_at": self.last_renewed_at,
            "last_renewed_str": datetime.fromtimestamp(self.last_renewed_at, IST).strftime("%d.%m.%Y %H:%M:%S IST") if self.last_renewed_at > 0 else "Never",
            "last_error": self.last_error,
            "scheduler_active": self.is_scheduler_running
        }

dhan_totp_service = DhanTOTPAuthService()
