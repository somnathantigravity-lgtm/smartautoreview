import os
import json
import time
import logging
from typing import Dict, Any, List, Optional
import httpx
from app.engine.xkiro_models_catalog import XKIRO_MASTER_MODELS

logger = logging.getLogger(__name__)

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "xkiro_config.json")

class XKiroClient:
    def __init__(self):
        self.api_key = os.environ.get("XKIRO_API_KEY", "")
        self.base_url = os.environ.get("XKIRO_BASE_URL", "https://api.xkiro.com/v1").rstrip("/")
        self.default_model = os.environ.get("XKIRO_MODEL", "anthropic/claude-sonnet-5")
        self.is_connected = False
        self.last_test_time = 0.0
        self.last_error = ""

        # Load persisted credentials if available
        self._load_config()

        if self.api_key:
            res = self.test_connection(self.api_key, self.default_model, self.base_url)
            if res.get("success"):
                self.is_connected = True
                self.last_error = ""
                self.last_test_time = time.time()
                if res.get("verified_model"):
                    self.default_model = res["verified_model"]
            else:
                self.is_connected = False
                self.last_error = res.get("error", "Connection failed")

    def _load_config(self):
        try:
            if os.path.exists(CONFIG_PATH):
                with open(CONFIG_PATH, "r") as f:
                    cfg = json.load(f)
                    if cfg.get("api_key"):
                        self.api_key = cfg["api_key"]
                    if cfg.get("base_url"):
                        self.base_url = cfg["base_url"].rstrip("/")
                    if cfg.get("model"):
                        self.default_model = cfg["model"]
        except Exception as e:
            logger.warning(f"Failed to load xkiro_config.json: {e}")

    def _save_config(self):
        try:
            with open(CONFIG_PATH, "w") as f:
                json.dump({
                    "api_key": self.api_key,
                    "base_url": self.base_url,
                    "model": self.default_model
                }, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to save xkiro_config.json: {e}")

    def set_credentials(self, api_key: str, model: str = "anthropic/claude-sonnet-5", base_url: str = "https://api.xkiro.com/v1") -> Dict[str, Any]:
        """Sets credentials and immediately verifies them against xKiro.com API."""
        api_key = api_key.strip()
        base_url = base_url.strip().rstrip("/")
        model = model.strip() or "anthropic/claude-sonnet-5"

        if not api_key:
            self.is_connected = False
            self.api_key = ""
            self.last_error = "API key cannot be empty."
            return {"success": False, "error": self.last_error}

        test_result = self.test_connection(api_key, model, base_url)
        if test_result.get("success"):
            verified_model = test_result.get("verified_model") or model
            self.api_key = api_key
            self.default_model = verified_model
            self.base_url = base_url
            self.is_connected = True
            self.last_error = ""
            self.last_test_time = time.time()
            self._save_config()
            return {
                "success": True,
                "message": test_result.get("message", f"Successfully connected to xKiro.com API using model '{verified_model}'."),
                "model": verified_model,
                "base_url": base_url,
                "available_models": test_result.get("available_models", [])
            }
        else:
            self.is_connected = False
            self.last_error = test_result.get("error", "Failed to connect")
            return test_result

    def disconnect(self):
        self.api_key = ""
        self.is_connected = False
        self.last_error = ""
        try:
            if os.path.exists(CONFIG_PATH):
                os.remove(CONFIG_PATH)
        except Exception:
            pass
        return {"success": True, "message": "xKiro.com API disconnected."}

    def get_status(self) -> Dict[str, Any]:
        masked_key = ""
        if self.api_key:
            if len(self.api_key) > 8:
                masked_key = f"{self.api_key[:4]}...{self.api_key[-4:]}"
            else:
                masked_key = "********"
        return {
            "is_connected": self.is_connected,
            "api_key_masked": masked_key,
            "model": self.default_model,
            "base_url": self.base_url,
            "last_test_time": self.last_test_time,
            "last_error": self.last_error
        }

    def get_anthropic_client(self) -> Optional[Any]:
        """
        Returns an initialized official Anthropic Claude SDK client routed through the xKiro gateway.
        """
        if not self.api_key:
            return None
        import anthropic
        base = self.base_url
        if base.endswith("/v1"):
            base = base[:-3]
        return anthropic.Anthropic(
            api_key=self.api_key,
            base_url=base
        )

    def get_available_models(self, api_key: Optional[str] = None, base_url: Optional[str] = None) -> List[Dict[str, str]]:
        """
        Returns the comprehensive catalog of 110+ models supported on xKiro.
        Also attempts to query /models on xKiro to dynamically merge any additional models.
        """
        key = api_key or self.api_key
        url_base = (base_url or self.base_url).rstrip("/")

        # Start with master catalog
        models_dict = {m["id"]: dict(m) for m in XKIRO_MASTER_MODELS}

        if key:
            headers = {"Authorization": f"Bearer {key}"}
            try:
                with httpx.Client(timeout=8.0) as client:
                    res = client.get(f"{url_base}/models", headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        models_list = data.get("data", [])
                        if isinstance(models_list, list):
                            for item in models_list:
                                if isinstance(item, dict) and "id" in item:
                                    mid = item["id"]
                                    if mid not in models_dict:
                                        provider = "xKiro"
                                        lower_m = mid.lower()
                                        if "claude" in lower_m: provider = "Anthropic"
                                        elif "gpt" in lower_m or "o1" in lower_m or "o3" in lower_m: provider = "OpenAI"
                                        elif "gemini" in lower_m: provider = "Google"
                                        elif "deepseek" in lower_m: provider = "DeepSeek"
                                        elif "llama" in lower_m: provider = "Meta"
                                        elif "qwen" in lower_m: provider = "Qwen"
                                        elif "mistral" in lower_m or "codestral" in lower_m: provider = "Mistral"
                                        elif "xiaomi" in lower_m: provider = "Xiaomi"
                                        models_dict[mid] = {
                                            "id": mid,
                                            "name": mid.split("/")[-1].replace("-", " ").title(),
                                            "provider": provider,
                                            "badge": "Active"
                                        }
            except Exception as e:
                logger.warning(f"Failed to fetch live models from {url_base}/models: {e}")

        return list(models_dict.values())

    def test_connection(self, api_key: str, model: str = "anthropic/claude-sonnet-5", base_url: str = "https://api.xkiro.com/v1") -> Dict[str, Any]:
        """
        Sends a verification call to xKiro endpoint.
        Checks /models first to verify API key and discover available models.
        Falls back to pinging chat/completions.
        """
        base_url = base_url.strip().rstrip("/")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        # 1. Try querying /models
        available_models = []
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.get(f"{base_url}/models", headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    raw_models = data.get("data", [])
                    if isinstance(raw_models, list):
                        available_models = [m["id"] for m in raw_models if isinstance(m, dict) and "id" in m]
        except Exception:
            pass

        # If /models succeeded, key is 100% valid!
        if available_models:
            active_model = model
            if model not in available_models:
                # Find best fallback
                preferred = ["anthropic/claude-sonnet-5", "anthropic/claude-opus-4.8", "openai/gpt-6-astra", "openai/gpt-5.5", "google/gemini-3.8-flash", "deepseek/deepseek-v4-pro"]
                found_pref = next((p for p in preferred if p in available_models), None)
                active_model = found_pref or available_models[0]
            
            return {
                "success": True,
                "message": f"Connection verified! Using active model: '{active_model}'.",
                "verified_model": active_model,
                "available_models": available_models
            }

        # 2. If /models is not accessible, test chat/completions with fallback candidates
        candidate_models = [model]
        for fallback in ["anthropic/claude-sonnet-5", "openai/gpt-6-astra", "google/gemini-3.8-flash", "deepseek/deepseek-v4-flash"]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        last_error = ""
        for m in candidate_models:
            payload = {
                "model": m,
                "messages": [
                    {"role": "system", "content": "Respond with OK."},
                    {"role": "user", "content": "Ping"}
                ],
                "max_tokens": 5,
                "temperature": 0.1
            }
            try:
                with httpx.Client(timeout=8.0) as client:
                    res = client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
                    if res.status_code == 200:
                        return {
                            "success": True,
                            "message": f"Connection verified with xKiro.com using '{m}'.",
                            "verified_model": m
                        }
                    else:
                        last_error = f"HTTP {res.status_code}: {res.text[:200]}"
                        # If error is specifically model not found, try next candidate
                        if "not_found" not in res.text and "does not exist" not in res.text:
                            return {"success": False, "error": last_error}
            except Exception as e:
                return {"success": False, "error": f"Failed to reach xKiro API: {str(e)}"}

        return {"success": False, "error": last_error or f"Model '{model}' not found on xKiro endpoint."}

    def run_agent_analysis(
        self,
        symbol: str,
        company_name: str,
        ltp: float,
        technicals: Dict[str, Any],
        strategy_prompt: str,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes real intelligent reasoning on a stock trigger using xKiro AI Gateway.
        If offline or API key not yet entered, provides rich simulated quantitative reasoning.
        """
        chosen_model = model or self.default_model

        if self.is_connected and self.api_key:
            prompt = f"""
You are an elite quantitative analyst specializing in Indian Equities (NSE/BSE).
Analyze the following trigger setup for {symbol} ({company_name}):
Current Price (LTP): ₹{ltp:.2f}
Technical Indicators:
- RSI (14): {technicals.get('rsi', 'N/A')}
- 20 EMA: ₹{technicals.get('ema_20', 'N/A')}
- 50 EMA: ₹{technicals.get('ema_50', 'N/A')}
- 200 EMA: ₹{technicals.get('ema_200', 'N/A')}
- VWAP: ₹{technicals.get('vwap', 'N/A')}
- Volume Shock: {technicals.get('volume_surge', 'Normal')}
Strategy Intent: {strategy_prompt}

Respond ONLY in valid JSON with these exact keys:
{{
  "signal": "BULLISH" | "BEARISH" | "NEUTRAL",
  "conviction_pct": 75,
  "summary": "Brief 2-sentence rationale.",
  "suggested_entry": 100.0,
  "stop_loss": 98.0,
  "target_price": 105.0,
  "risk_reward_ratio": "1:2.5",
  "key_catalysts": ["catalyst 1", "catalyst 2"]
}}
"""
            url = f"{self.base_url}/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": chosen_model,
                "messages": [
                    {"role": "system", "content": "You are a disciplined quantitative trader for Indian stocks. Always respond with raw JSON."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 400
            }
            try:
                with httpx.Client(timeout=12.0) as client:
                    res = client.post(url, headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        raw_content = data["choices"][0]["message"]["content"].strip()
                        if raw_content.startswith("```json"):
                            raw_content = raw_content.replace("```json", "").replace("```", "").strip()
                        elif raw_content.startswith("```"):
                            raw_content = raw_content.replace("```", "").strip()
                        parsed = json.loads(raw_content)
                        parsed["source"] = f"xKiro.com ({chosen_model})"
                        return parsed
            except Exception as e:
                logger.warning(f"xKiro call failed, falling back to quantitative model: {e}")

        # Fallback quantitative logic when xKiro is not yet connected
        rsi = technicals.get("rsi", 50.0)
        ema_20 = technicals.get("ema_20", ltp)
        ema_50 = technicals.get("ema_50", ltp)

        is_bullish = ltp >= ema_20 and (rsi >= 50 or ema_20 >= ema_50)
        signal = "BULLISH" if is_bullish else "BEARISH"
        conviction = 72 if is_bullish else 68

        if is_bullish:
            entry = round(ltp * 1.001, 2)
            sl = round(ltp * 0.985, 2)
            target = round(ltp * 1.035, 2)
            summary = f"{symbol} shows strong trend continuation with price trading above 20 EMA (₹{ema_20:.2f}) and healthy RSI momentum at {rsi:.1f}."
            catalysts = ["Bullish EMA alignment", "Strong institutional order flow depth"]
        else:
            entry = round(ltp * 0.999, 2)
            sl = round(ltp * 1.015, 2)
            target = round(ltp * 0.965, 2)
            summary = f"{symbol} faces overhead resistance near ₹{ema_20:.2f} with softening volume and cooling RSI at {rsi:.1f}."
            catalysts = ["Bearish divergence", "Weakening intraday volume"]

        return {
            "signal": signal,
            "conviction_pct": conviction,
            "summary": summary,
            "suggested_entry": entry,
            "stop_loss": sl,
            "target_price": target,
            "risk_reward_ratio": "1:2.3",
            "key_catalysts": catalysts,
            "source": "Local Quant Model (Connect xKiro.com for frontier LLM reasoning)"
        }

xkiro_client = XKiroClient()
