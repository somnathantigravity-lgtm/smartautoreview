import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import httpx

logger = logging.getLogger(__name__)

SUPABASE_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "supabase_config.json")

class SupabaseService:
    def __init__(self):
        self.supabase_url: Optional[str] = os.environ.get("SUPABASE_URL")
        self.supabase_key: Optional[str] = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
        self._load_config()

    def _load_config(self):
        if os.path.exists(SUPABASE_CONFIG_FILE):
            try:
                with open(SUPABASE_CONFIG_FILE, "r") as f:
                    data = json.load(f)
                    if not self.supabase_url:
                        self.supabase_url = data.get("supabase_url")
                    if not self.supabase_key:
                        self.supabase_key = data.get("supabase_key") or data.get("supabase_service_role_key")
            except Exception as e:
                logger.error(f"[Supabase] Error loading config file: {e}")

    def is_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_key and "supabase.co" in self.supabase_url)

    def set_credentials(self, url: str, key: str):
        self.supabase_url = url.strip()
        self.supabase_key = key.strip()
        try:
            with open(SUPABASE_CONFIG_FILE, "w") as f:
                json.dump({"supabase_url": self.supabase_url, "supabase_key": self.supabase_key}, f, indent=2)
            logger.info("[Supabase] Credentials updated and saved successfully.")
        except Exception as e:
            logger.error(f"[Supabase] Failed to write config: {e}")

    def _get_headers(self) -> Dict[str, str]:
        return {
            "apikey": self.supabase_key or "",
            "Authorization": f"Bearer {self.supabase_key or ''}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    # ==================== USERS & AUTH ====================

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        if not self.is_configured():
            return None
        try:
            url = f"{self.supabase_url}/rest/v1/users?email=eq.{email.lower().strip()}&select=*"
            with httpx.Client(timeout=5.0) as client:
                res = client.get(url, headers=self._get_headers())
                if res.status_code == 200:
                    rows = res.json()
                    return rows[0] if rows else None
        except Exception as e:
            logger.warning(f"[Supabase] Error querying user {email}: {e}")
        return None

    def upsert_user(self, email: str, password_hash: str, is_verified: bool = True, role: str = "NormalUser") -> Optional[Dict[str, Any]]:
        if not self.is_configured():
            return None
        try:
            url = f"{self.supabase_url}/rest/v1/users"
            payload = {
                "email": email.lower().strip(),
                "password_hash": password_hash,
                "is_verified": is_verified,
                "role": role,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            headers = self._get_headers()
            headers["Prefer"] = "resolution=merge-duplicates,return=representation"
            with httpx.Client(timeout=5.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code in (200, 201):
                    rows = res.json()
                    return rows[0] if rows else None
                else:
                    logger.warning(f"[Supabase] Upsert user error ({res.status_code}): {res.text}")
        except Exception as e:
            logger.warning(f"[Supabase] Upsert user exception: {e}")
        return None

    def update_user_lockout(self, email: str, failed_attempts: int, locked_until_iso: Optional[str] = None):
        if not self.is_configured():
            return
        try:
            url = f"{self.supabase_url}/rest/v1/users?email=eq.{email.lower().strip()}"
            payload = {
                "failed_attempts": failed_attempts,
                "locked_until": locked_until_iso,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            with httpx.Client(timeout=5.0) as client:
                client.patch(url, headers=self._get_headers(), json=payload)
        except Exception as e:
            logger.warning(f"[Supabase] Error updating lockout for {email}: {e}")

    def fetch_all_users(self) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return []
        try:
            url = f"{self.supabase_url}/rest/v1/users?select=*&order=created_at.desc"
            with httpx.Client(timeout=5.0) as client:
                res = client.get(url, headers=self._get_headers())
                if res.status_code == 200:
                    return res.json()
        except Exception as e:
            logger.warning(f"[Supabase] Error fetching all users: {e}")
        return []

    # ==================== DHAN CREDENTIALS ====================

    def save_dhan_credentials(self, email: str, client_id: str, access_token: str, totp_secret: str, ip_address: str = ""):
        if not self.is_configured():
            return
        try:
            user = self.get_user_by_email(email)
            if not user or not user.get("id"):
                return
            user_id = user["id"]
            url = f"{self.supabase_url}/rest/v1/user_dhan_credentials"
            payload = {
                "user_id": user_id,
                "client_id": client_id,
                "access_token": access_token,
                "totp_secret": totp_secret,
                "ip_address": ip_address,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            headers = self._get_headers()
            headers["Prefer"] = "resolution=merge-duplicates,return=representation"
            with httpx.Client(timeout=5.0) as client:
                client.post(url, headers=headers, json=payload)
        except Exception as e:
            logger.warning(f"[Supabase] Error saving Dhan credentials for {email}: {e}")

    def get_dhan_credentials(self, email: str) -> Optional[Dict[str, Any]]:
        if not self.is_configured():
            return None
        try:
            user = self.get_user_by_email(email)
            if not user or not user.get("id"):
                return None
            user_id = user["id"]
            url = f"{self.supabase_url}/rest/v1/user_dhan_credentials?user_id=eq.{user_id}&select=*"
            with httpx.Client(timeout=5.0) as client:
                res = client.get(url, headers=self._get_headers())
                if res.status_code == 200:
                    rows = res.json()
                    return rows[0] if rows else None
        except Exception as e:
            logger.warning(f"[Supabase] Error getting Dhan credentials: {e}")
        return None

    # ==================== RECOMMENDATIONS & AUDITS ====================

    def publish_recommendation(self, reco: Dict[str, Any]):
        if not self.is_configured():
            return
        try:
            url = f"{self.supabase_url}/rest/v1/published_recommendations"
            payload = {
                "symbol": reco.get("symbol"),
                "exchange": reco.get("exchange", "NSE"),
                "reco_type": reco.get("reco_type", "BUY"),
                "entry_price": float(reco.get("entry_price", 0.0)),
                "target_price": float(reco.get("target_price", 0.0)) if reco.get("target_price") else None,
                "stop_loss": float(reco.get("stop_loss", 0.0)) if reco.get("stop_loss") else None,
                "strategy_name": reco.get("strategy_name", "Quantitative Alpha"),
                "status": reco.get("status", "ACTIVE"),
                "confidence_score": float(reco.get("confidence_score", 92.5)),
                "meta": reco.get("meta", {})
            }
            with httpx.Client(timeout=5.0) as client:
                client.post(url, headers=self._get_headers(), json=payload)
        except Exception as e:
            logger.warning(f"[Supabase] Error publishing reco: {e}")

    def log_rule_audit(self, symbol: str, rule_name: str, passed: bool, reason: str = "", details: Dict[str, Any] = None):
        if not self.is_configured():
            return
        try:
            url = f"{self.supabase_url}/rest/v1/reco_rule_audits"
            payload = {
                "symbol": symbol,
                "rule_name": rule_name,
                "passed": passed,
                "reason": reason,
                "details": details or {}
            }
            with httpx.Client(timeout=5.0) as client:
                client.post(url, headers=self._get_headers(), json=payload)
        except Exception as e:
            logger.warning(f"[Supabase] Error logging rule audit: {e}")

    # ==================== STRATEGIES & RECO RULES ====================

    def upsert_strategy(self, strategy: Dict[str, Any]):
        if not self.is_configured():
            return
        try:
            url = f"{self.supabase_url}/rest/v1/reco_strategies"
            payload = {
                "id": strategy.get("id"),
                "name": strategy.get("name", "Custom Alpha Strategy"),
                "horizon": strategy.get("horizon", "INTRADAY"),
                "is_active": bool(strategy.get("is_active", False)),
                "target_pct": float(strategy.get("target_pct", 2.0)) if strategy.get("target_pct") is not None else None,
                "stop_loss_pct": float(strategy.get("stop_loss_pct", 1.0)) if strategy.get("stop_loss_pct") is not None else None,
                "rules_config": strategy,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            headers = self._get_headers()
            headers["Prefer"] = "resolution=merge-duplicates,return=representation"
            with httpx.Client(timeout=5.0) as client:
                client.post(url, headers=headers, json=payload)
        except Exception as e:
            logger.warning(f"[Supabase] Error saving strategy {strategy.get('id')}: {e}")

    def fetch_all_strategies(self) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return []
        try:
            url = f"{self.supabase_url}/rest/v1/reco_strategies?select=*&order=updated_at.desc"
            with httpx.Client(timeout=5.0) as client:
                res = client.get(url, headers=self._get_headers())
                if res.status_code == 200:
                    rows = res.json()
                    # Return reconstructed strategy config
                    strategies = []
                    for r in rows:
                        cfg = r.get("rules_config", {})
                        if isinstance(cfg, dict):
                            cfg["id"] = r.get("id")
                            cfg["name"] = r.get("name")
                            cfg["is_active"] = r.get("is_active")
                            strategies.append(cfg)
                    return strategies
        except Exception as e:
            logger.warning(f"[Supabase] Error fetching strategies: {e}")
        return []

    def set_system_state(self, key: str, value: Any):
        if not self.is_configured():
            return
        try:
            url = f"{self.supabase_url}/rest/v1/reco_system_state"
            payload = {
                "key": key,
                "value": value,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            headers = self._get_headers()
            headers["Prefer"] = "resolution=merge-duplicates,return=representation"
            with httpx.Client(timeout=5.0) as client:
                client.post(url, headers=headers, json=payload)
        except Exception as e:
            logger.warning(f"[Supabase] Error updating system state {key}: {e}")

    def get_system_state(self, key: str) -> Optional[Any]:
        if not self.is_configured():
            return None
        try:
            url = f"{self.supabase_url}/rest/v1/reco_system_state?key=eq.{key}&select=value"
            with httpx.Client(timeout=5.0) as client:
                res = client.get(url, headers=self._get_headers())
                if res.status_code == 200:
                    rows = res.json()
                    if rows:
                        return rows[0].get("value")
        except Exception as e:
            logger.warning(f"[Supabase] Error fetching system state {key}: {e}")
        return None

supabase_service = SupabaseService()

