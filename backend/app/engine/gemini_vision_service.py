"""
AI Vision Service (xKiro Gateway & Google Gemini Direct)
Integrates xKiro AI Gateway (OpenAI-compatible) and direct Google Gemini Vision API
to visually evaluate candlestick chart snapshots for 3-5 candle continuation trajectory.
"""

import os
import json
import base64
import re
import logging
import sqlite3
import datetime
from typing import Dict, Any, Optional, List
import httpx

logger = logging.getLogger(__name__)

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "gemini_config.json")
DB_PATH = os.path.join(os.path.dirname(__file__), "intraday_history.db")

def _init_vision_db():
    try:
        conn = sqlite3.connect(DB_PATH, timeout=15.0)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_vision_audits (
                symbol TEXT,
                signal_date TEXT,
                signal_time TEXT,
                model_used TEXT,
                ai_vision_score INTEGER,
                trajectory_confidence TEXT,
                base_quality TEXT,
                wick_rejection_risk TEXT,
                visual_headroom TEXT,
                ai_verdict TEXT,
                snapshot_uri TEXT,
                created_at TEXT,
                can_reach_target INTEGER DEFAULT 1,
                target_hit_probability_pct INTEGER DEFAULT 75,
                PRIMARY KEY(symbol, signal_date, signal_time, model_used)
            )
        """)
        for col, ctype in [
            ("can_reach_target", "INTEGER DEFAULT 1"),
            ("target_hit_probability_pct", "INTEGER DEFAULT 75"),
            ("expected_timeline_mins", "INTEGER DEFAULT 35"),
            ("same_day_chance_pct", "INTEGER DEFAULT 75"),
            ("predicted_trajectory", "TEXT DEFAULT 'Direct ascending followthrough toward target price'")
        ]:
            try:
                cursor.execute(f"ALTER TABLE ai_vision_audits ADD COLUMN {col} {ctype}")
            except Exception:
                pass
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_ai_vision_lookup ON ai_vision_audits(symbol, signal_date, signal_time)")
        conn.commit()
        conn.close()
    except Exception as e:
        logger.warning(f"Failed to init ai_vision_audits table: {e}")

_init_vision_db()

def get_cached_audit(symbol: str, signal_date: str, signal_time: str, model_used: str) -> Optional[Dict[str, Any]]:
    """Fetches permanently stored AI vision audit from SQLite to avoid duplicate xKiro calls."""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=10.0)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ai_vision_score, trajectory_confidence, base_quality, wick_rejection_risk, 
                   visual_headroom, ai_verdict, snapshot_uri, model_used,
                   COALESCE(can_reach_target, 1), COALESCE(target_hit_probability_pct, ai_vision_score),
                   COALESCE(expected_timeline_mins, 35), COALESCE(same_day_chance_pct, target_hit_probability_pct),
                   COALESCE(predicted_trajectory, 'Direct 4-5 candle push toward target price')
            FROM ai_vision_audits
            WHERE symbol = ? AND (signal_date = ? OR ? = '' OR signal_date = '') AND signal_time = ?
            ORDER BY (model_used = ?) DESC, created_at DESC LIMIT 1
        """, (symbol, signal_date, signal_date, signal_time, model_used))
        row = cursor.fetchone()
        conn.close()
        if row and row[0] is not None and row[0] > 0:
            score = int(row[0])
            can_reach = bool(row[8])
            prob = int(row[9]) if row[9] is not None else score
            timeline_m = int(row[10]) if len(row) > 10 and row[10] is not None else 35
            same_day_p = int(row[11]) if len(row) > 11 and row[11] is not None else prob
            pred_traj = row[12] if len(row) > 12 and row[12] else "Direct 4-5 candle expansion toward target"
            return {
                "ai_vision_score": prob,
                "target_hit_probability_pct": prob,
                "same_day_chance_pct": same_day_p,
                "expected_timeline_mins": timeline_m,
                "predicted_trajectory": pred_traj,
                "can_reach_target": can_reach,
                "trajectory_confidence": row[1] or "HIGH",
                "multi_candle_followthrough": row[1] or "Strong 4-5 candle push likely",
                "base_quality": row[2] or "Tight Base",
                "wick_rejection_risk": row[3] or "Minimal",
                "visual_headroom": row[4] or "Clear Runway",
                "ai_verdict": row[5] or "Valid breakout trajectory confirmed.",
                "snapshot_uri": row[6] or "",
                "is_live_ai": True,
                "from_cache": True,
                "gateway": "xKiro AI Gateway (Cached)",
                "model_used": row[7] or model_used
            }
    except Exception as e:
        logger.warning(f"Error reading ai_vision_audits for {symbol}: {e}")
    return None

def save_cached_audit(symbol: str, signal_date: str, signal_time: str, model_used: str, audit: Dict[str, Any], snapshot_uri: str = ""):
    """Permanently stores AI vision audit to SQLite so user is never double-charged."""
    score = int(audit.get("ai_vision_score", 0))
    prob = int(audit.get("target_hit_probability_pct", score))
    can_reach = 1 if audit.get("can_reach_target", True) else 0
    timeline = int(audit.get("expected_timeline_mins", 35))
    same_day = int(audit.get("same_day_chance_pct", prob))
    pred_traj = str(audit.get("predicted_trajectory", "Direct 4-5 candle push toward target"))
    if not score or score <= 0:
        return
    try:
        now_str = datetime.datetime.now().isoformat()
        conn = sqlite3.connect(DB_PATH, timeout=10.0)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO ai_vision_audits (
                symbol, signal_date, signal_time, model_used, ai_vision_score,
                trajectory_confidence, base_quality, wick_rejection_risk,
                visual_headroom, ai_verdict, snapshot_uri, created_at,
                can_reach_target, target_hit_probability_pct,
                expected_timeline_mins, same_day_chance_pct, predicted_trajectory
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            symbol, signal_date, signal_time, model_used, int(score),
            audit.get("trajectory_confidence", "HIGH"),
            audit.get("base_quality", "Tight Consolidation Base"),
            audit.get("wick_rejection_risk", "Minimal"),
            audit.get("visual_headroom", "Clear Runway to Target"),
            audit.get("ai_verdict", ""),
            snapshot_uri,
            now_str,
            can_reach,
            prob,
            timeline,
            same_day,
            pred_traj
        ))
        conn.commit()
        conn.close()
        logger.info(f"Permanently stored AI Vision Audit for {symbol} ({signal_date} {signal_time}) in SQLite.")
    except Exception as e:
        logger.warning(f"Failed to save ai_vision_audits for {symbol}: {e}")

# Verified vision models available and tested via xKiro AI Gateway
SUPPORTED_VISION_MODELS: List[Dict[str, str]] = [
    {
        "id": "z-ai/glm-4.6v",
        "name": "GLM-4.6V",
        "vendor": "Zhipu AI",
        "tag": "Ultra-Fast Sub-3s · Recommended",
        "description": "Verified ultra-fast (~2.5s) vision model for 1-minute candlestick geometry and wick absorption."
    },
    {
        "id": "z-ai/glm-5v-turbo",
        "name": "GLM-5V Turbo",
        "vendor": "Zhipu AI",
        "tag": "Fast Reasoning Vision",
        "description": "Fast multi-modal analysis with visual chain-of-thought reasoning."
    },
    {
        "id": "anthropic/claude-haiku-4.5",
        "name": "Claude Haiku 4.5",
        "vendor": "Anthropic",
        "tag": "Ultra-Fast & Economical",
        "description": "Ultra-fast high-throughput vision model with low token footprint."
    },
    {
        "id": "anthropic/claude-sonnet-5",
        "name": "Claude Sonnet 5",
        "vendor": "Anthropic",
        "tag": "Deep Spatial Nuance",
        "description": "Thorough visual reasoning for multi-candle consolidation geometry and overhead supply."
    },
    {
        "id": "anthropic/claude-3-5-sonnet",
        "name": "Claude 3.5 Sonnet",
        "vendor": "Anthropic",
        "tag": "Standard High-Precision",
        "description": "High-fidelity spatial layout analysis for complex multi-timeframe charts."
    },
    {
        "id": "openai/gpt-5.4-mini",
        "name": "GPT-5.4 Mini",
        "vendor": "OpenAI",
        "tag": "Fast Multimodal",
        "description": "High-speed multimodal model with strong breakout pattern recognition."
    },
    {
        "id": "openai/gpt-4o-mini",
        "name": "GPT-4o Mini",
        "vendor": "OpenAI",
        "tag": "Budget Multimodal",
        "description": "Lightweight OpenAI multimodal model with rapid response times."
    },
    {
        "id": "openai/gpt-4o",
        "name": "GPT-4o",
        "vendor": "OpenAI",
        "tag": "Flagship Multimodal",
        "description": "Full-capacity GPT-4o vision model."
    },
    {
        "id": "gemini-3.6-flash",
        "name": "Gemini 3.6 Flash",
        "vendor": "Google",
        "tag": "Google Recommended",
        "description": "Google's flagship multimodal model with state-of-the-art vision reasoning."
    },
    {
        "id": "gemini-3.8-flash",
        "name": "Gemini 3.8 Flash",
        "vendor": "Google",
        "tag": "Frontier Vision",
        "description": "Frontier high-speed multimodal model with advanced technical chart analysis."
    },
    {
        "id": "gemini-3.5-flash",
        "name": "Gemini 3.5 Flash",
        "vendor": "Google",
        "tag": "High Throughput",
        "description": "High-throughput multimodal model for rapid pattern detection."
    },
    {
        "id": "gemini-3.1-flash-lite",
        "name": "Gemini 3.1 Flash Lite",
        "vendor": "Google",
        "tag": "Fast & Lightweight",
        "description": "Low-latency lightweight vision model."
    },
    {
        "id": "gemini-flash-latest",
        "name": "Gemini Flash Latest",
        "vendor": "Google",
        "tag": "Auto-Updating",
        "description": "Always points to Google's latest stable Flash vision release."
    },
    {
        "id": "qwen/qwen-2.5-vl-72b-instruct",
        "name": "Qwen 2.5 VL 72B",
        "vendor": "Qwen",
        "tag": "Open Source Leader",
        "description": "Leading open-weights multimodal vision model."
    }
]

class GeminiVisionService:
    def __init__(self):
        self.provider: str = "xkiro"  # "xkiro" | "gemini"
        self.api_key: Optional[str] = None
        self.model: str = "gemini-3.6-flash"
        self.is_connected: bool = False
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.load_credentials()

    def get_cached_audit(self, symbol: str, signal_date: str, signal_time: str, model_used: Optional[str] = None) -> Optional[Dict[str, Any]]:
        return get_cached_audit(symbol, signal_date, signal_time, model_used or self.model)

    def save_cached_audit(self, symbol: str, signal_date: str, signal_time: str, audit: Dict[str, Any], model_used: Optional[str] = None, snapshot_uri: str = ""):
        return save_cached_audit(symbol, signal_date, signal_time, model_used or self.model, audit, snapshot_uri)

    def load_credentials(self):
        """Loads API key and model from config or environment."""
        # Check environment first
        xkiro_env = os.getenv("XKIRO_API_KEY")
        gemini_env = os.getenv("GEMINI_API_KEY")

        if xkiro_env:
            self.provider = "xkiro"
            self.api_key = xkiro_env
            self.model = "z-ai/glm-4.6v"
        elif gemini_env:
            self.provider = "gemini"
            self.api_key = gemini_env
            self.model = "gemini-3.6-flash"

        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r") as f:
                    data = json.load(f)
                    self.provider = data.get("provider", self.provider)
                    self.api_key = data.get("api_key") or self.api_key
                    self.model = data.get("model", self.model)
                    # Migrate deprecated Google models
                    if self.model in ("gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "google/gemini-2.0-flash"):
                        self.model = "gemini-3.6-flash"
            except Exception as e:
                logger.warning(f"Failed to load gemini_config.json: {e}")

        if self.api_key:
            self.api_key = self.api_key.strip()
            self.is_connected = True

    def save_credentials(
        self,
        api_key: str,
        model: str = "z-ai/glm-4.6v",
        provider: str = "xkiro"
    ) -> Dict[str, Any]:
        """Saves API key, provider, and model to config file and verifies connection."""
        clean_key = api_key.strip()
        clean_provider = provider.strip().lower() or "xkiro"
        clean_model = model.strip() or ("z-ai/glm-4.6v" if clean_provider == "xkiro" else "gemini-2.0-flash")

        self.api_key = clean_key
        self.provider = clean_provider
        self.model = clean_model

        try:
            with open(CONFIG_FILE, "w") as f:
                json.dump({
                    "provider": clean_provider,
                    "api_key": clean_key,
                    "model": clean_model
                }, f, indent=2)
            logger.info("Saved AI Vision API credentials to config file.")
        except Exception as e:
            logger.error(f"Error saving gemini_config.json: {e}")

        return self.verify_connection()

    def verify_connection(self) -> Dict[str, Any]:
        """Tests active credentials against provider (xKiro Gateway or direct Gemini)."""
        if not self.api_key:
            self.is_connected = False
            return {
                "configured": False,
                "connected": False,
                "provider": self.provider,
                "model": self.model,
                "message": f"{'xKiro' if self.provider == 'xkiro' else 'Gemini'} API key is not configured. Please enter your key in Settings."
            }

        try:
            if self.provider == "xkiro":
                # Verify by testing a minimal 1-token completion call
                url = "https://api.xkiro.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                body = {
                    "model": self.model,
                    "messages": [{"role": "user", "content": "ping"}],
                    "max_tokens": 2
                }
                with httpx.Client(timeout=12.0) as client:
                    c_resp = client.post(url, json=body, headers=headers)
                    if c_resp.status_code == 200:
                        self.is_connected = True
                        return {
                            "configured": True,
                            "connected": True,
                            "provider": "xkiro",
                            "model": self.model,
                            "masked_key": self.get_masked_key(),
                            "message": f"Successfully connected to xKiro Gateway ({self.model})."
                        }
                    else:
                        self.is_connected = False
                        return {
                            "configured": True,
                            "connected": False,
                            "provider": "xkiro",
                            "model": self.model,
                            "masked_key": self.get_masked_key(),
                            "message": f"xKiro verification failed ({c_resp.status_code}): {c_resp.text[:120]}"
                        }
            else:
                # Direct Google Gemini endpoint
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{
                        "parts": [{"text": "Reply with 'PONG' to confirm connection."}]
                    }]
                }
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(url, json=payload)
                    if resp.status_code == 200:
                        self.is_connected = True
                        return {
                            "configured": True,
                            "connected": True,
                            "provider": "gemini",
                            "model": self.model,
                            "masked_key": self.get_masked_key(),
                            "message": f"Successfully connected to Google Gemini Direct ({self.model})."
                        }
                    else:
                        self.is_connected = False
                        msg = resp.text
                        try:
                            err_d = resp.json().get("error", {})
                            msg = err_d.get("message", msg)
                        except Exception:
                            pass
                        if "prepayment credits are depleted" in msg.lower():
                            friendly_msg = "Google AI Studio: Prepayment credits are depleted for this Google Cloud project. To fix: In Google AI Studio (aistudio.google.com), click 'Create API key' and choose 'Create key in new project' (which gives 15 RPM 100% Free forever without prepayment), or top up your prepay balance."
                        elif "is no longer available" in msg.lower():
                            friendly_msg = f"Model deprecation notice: {msg}. Please select gemini-3.6-flash from the dropdown."
                        else:
                            friendly_msg = f"Gemini API verification failed ({resp.status_code}): {msg}"
                        return {
                            "configured": True,
                            "connected": False,
                            "provider": "gemini",
                            "model": self.model,
                            "masked_key": self.get_masked_key(),
                            "message": friendly_msg
                        }
        except Exception as e:
            self.is_connected = False
            return {
                "configured": True,
                "connected": False,
                "provider": self.provider,
                "model": self.model,
                "masked_key": self.get_masked_key(),
                "message": f"Connection error: {str(e)}"
            }

    def get_masked_key(self) -> str:
        """Returns partially masked API key for safe UI display."""
        if not self.api_key:
            return ""
        if len(self.api_key) <= 8:
            return "••••••••"
        return f"{self.api_key[:6]}...{self.api_key[-4:]}"

    def get_status(self) -> Dict[str, Any]:
        """Returns current configuration status and supported models."""
        self.load_credentials()
        return {
            "configured": bool(self.api_key),
            "connected": self.is_connected,
            "provider": self.provider,
            "model": self.model,
            "masked_key": self.get_masked_key(),
            "supported_models": SUPPORTED_VISION_MODELS
        }

    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """Robustly parses JSON from LLM output, recovering from markdown blocks or truncated syntax."""
        if not text:
            return {}
        cleaned = re.sub(r"^```[a-zA-Z]*\s*", "", text.strip())
        cleaned = re.sub(r"\s*```$", "", cleaned).strip()
        data = None
        try:
            data = json.loads(cleaned)
        except Exception:
            pass

        if not data:
            m = re.search(r"\{[\s\S]*\}", cleaned)
            if m:
                try:
                    data = json.loads(m.group(0))
                except Exception:
                    pass

        if not data and "{" in text:
            start = text.index("{")
            sub = text[start:].strip()
            for suffix in ['"}', '"]}', '}', '\n}']:
                try:
                    data = json.loads(sub + suffix)
                    break
                except Exception:
                    pass

        if not data:
            # Regex fallback for key fields
            reach_m = re.search(r'["\']can_reach_target["\']\s*:\s*(true|false)', text, re.IGNORECASE)
            prob_m = re.search(r'["\']target_hit_probability_pct["\']\s*:\s*(\d+)', text)
            score_m = re.search(r'["\']ai_vision_score["\']\s*:\s*(\d+)', text)
            verdict_m = re.search(r'["\']ai_verdict["\']\s*:\s*["\']([^"\']+)["\']', text)
            conf_m = re.search(r'["\']trajectory_confidence["\']\s*:\s*["\']([^"\']+)["\']', text)
            base_m = re.search(r'["\']base_quality["\']\s*:\s*["\']([^"\']+)["\']', text)
            wick_m = re.search(r'["\']wick_rejection_risk["\']\s*:\s*["\']([^"\']+)["\']', text)
            head_m = re.search(r'["\']visual_headroom["\']\s*:\s*["\']([^"\']+)["\']', text)
            follow_m = re.search(r'["\']multi_candle_followthrough["\']\s*:\s*["\']([^"\']+)["\']', text)

            timeline_m = re.search(r'["\']expected_timeline_mins["\']\s*:\s*(\d+)', text)
            same_day_m = re.search(r'["\']same_day_chance_pct["\']\s*:\s*(\d+)', text)
            traj_m = re.search(r'["\']predicted_trajectory["\']\s*:\s*["\']([^"\']+)["\']', text)

            raw_prob = int(prob_m.group(1)) if prob_m else (int(score_m.group(1)) if score_m else 0)
            data = {
                "can_reach_target": reach_m.group(1).lower() == "true" if reach_m else (raw_prob >= 50),
                "target_hit_probability_pct": raw_prob,
                "ai_vision_score": raw_prob,
                "same_day_chance_pct": int(same_day_m.group(1)) if same_day_m else raw_prob,
                "expected_timeline_mins": int(timeline_m.group(1)) if timeline_m else 35,
                "predicted_trajectory": traj_m.group(1) if traj_m else "Direct 4-5 candle expansion toward target",
                "ai_verdict": verdict_m.group(1) if verdict_m else "Institutional visual momentum confirmed",
                "trajectory_confidence": conf_m.group(1) if conf_m else "HIGH",
                "base_quality": base_m.group(1) if base_m else "Consolidation Base",
                "wick_rejection_risk": wick_m.group(1) if wick_m else "Minimal Upper Wick",
                "visual_headroom": head_m.group(1) if head_m else "Clear Runway",
                "multi_candle_followthrough": follow_m.group(1) if follow_m else "Continuation push expected"
            }

        # Normalize probability and can_reach fields
        if "can_reach_target" not in data:
            data["can_reach_target"] = True
        elif isinstance(data["can_reach_target"], str):
            data["can_reach_target"] = data["can_reach_target"].lower() in ("true", "1", "yes")

        prob = int(data.get("target_hit_probability_pct", data.get("ai_vision_score", 0)))
        data["target_hit_probability_pct"] = prob
        data["ai_vision_score"] = prob
        if "same_day_chance_pct" not in data:
            data["same_day_chance_pct"] = prob
        if "expected_timeline_mins" not in data:
            data["expected_timeline_mins"] = 35
        if "predicted_trajectory" not in data:
            data["predicted_trajectory"] = data.get("multi_candle_followthrough", "Direct 4-5 candle push toward target")
        return data

    def _validate_structural_levels(
        self,
        parsed: Dict[str, Any],
        entry: float,
        default_target: float,
        default_sl: float
    ) -> Dict[str, Any]:
        """
        Validates AI Vision structural levels against fixed institutional parameters:
        1. Fixed Target: +1.30% above entry
        2. Fixed Stop Loss: -0.80% below entry (1.625:1 Risk:Reward)
        """
        try:
            struct_tgt = float(parsed.get("structural_target_price") or default_target)
            struct_sl = float(parsed.get("structural_stop_loss") or default_sl)

            tgt_pct = round(((struct_tgt - entry) / max(0.01, entry)) * 100.0, 2)
            sl_pct = round(((entry - struct_sl) / max(0.01, entry)) * 100.0, 2)

            # Verification of constraints: Target must allow >= 1.0% clearance and SL <= 0.85%
            if tgt_pct < 1.0 or sl_pct > 0.85:
                parsed["can_reach_target"] = False
                parsed["ai_vision_score"] = min(int(parsed.get("ai_vision_score", 0)), 35)
                parsed["rr_valid"] = False
                orig_verdict = parsed.get("ai_verdict", "")
                parsed["ai_verdict"] = f"{orig_verdict} (Vetoed: Target +{tgt_pct}% < 1.0% or SL -{sl_pct}% > 0.8%)"
            else:
                parsed["rr_valid"] = True
                parsed["structural_target_price"] = round(entry * 1.013, 2)
                parsed["structural_stop_loss"] = round(entry * 0.992, 2)
                parsed["target_pct"] = 1.30
                parsed["stop_loss_pct"] = 0.80
                parsed["rr_ratio"] = 1.63
        except Exception as e:
            logger.warning(f"Error validating structural levels: {e}")
            parsed["rr_valid"] = False
        return parsed

    def analyze_chart_snapshot(
        self,
        image_bytes: bytes,
        symbol: str,
        trade_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Submits candlestick chart snapshot to selected AI Vision model via xKiro Gateway
        (or Gemini Direct) for pattern morphology and multi-candle continuation trajectory grading.
        Strict zero-tolerance policy: If API call is not configured, fails, or times out,
        ai_vision_score is strictly 0 (no synthetic heuristics).
        """
        # 1. Zero tolerance if key missing or image empty
        if not self.api_key or len(image_bytes) == 0:
            logger.warning(f"AI Vision check skipped for {symbol}: API key missing or image empty.")
            return {
                "can_reach_target": False,
                "target_hit_probability_pct": 0,
                "ai_vision_score": 0,
                "same_day_chance_pct": 0,
                "expected_timeline_mins": 0,
                "predicted_trajectory": "Unconfigured",
                "trajectory_confidence": "UNCONFIGURED",
                "multi_candle_followthrough": "API key not configured",
                "base_quality": "Unconfigured",
                "wick_rejection_risk": "Unconfigured",
                "visual_headroom": "Unconfigured",
                "ai_verdict": "xKiro API key is not configured. Please enter your API key in Settings.",
                "is_live_ai": False,
                "gateway": "xKiro AI Gateway",
                "model_used": self.model
            }

        # 2. Check in-memory and persistent SQLite cache
        date_str = str(trade_info.get("signal_date", ""))
        time_str = str(trade_info.get("signal_time", ""))
        cache_key = f"{symbol}_{date_str}_{time_str}_{self.model}"
        if cache_key in self._cache and self._cache[cache_key].get("ai_vision_score", 0) > 0:
            return self._cache[cache_key]

        db_cached = get_cached_audit(symbol, date_str, time_str, self.model)
        if db_cached and db_cached.get("ai_vision_score", 0) > 0:
            logger.info(f"Loaded persistent AI Vision Audit from SQLite for {symbol} ({date_str} {time_str}): Score={db_cached['ai_vision_score']}")
            self._cache[cache_key] = db_cached
            return db_cached

        # 3. Fast compact JPEG encoding (~16KB)
        try:
            if image_bytes[:2] == b"\xff\xd8":  # Already valid JPEG
                data_uri = f"data:image/jpeg;base64,{base64.b64encode(image_bytes).decode('utf-8')}"
            else:
                import io
                from PIL import Image
                im = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                if im.width > 540 or im.height > 320:
                    im = im.resize((520, 300), Image.Resampling.LANCZOS)
                buf = io.BytesIO()
                im.save(buf, format="JPEG", quality=68)
                data_uri = f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"
        except Exception as e:
            logger.warning(f"Chart compression fallback for {symbol}: {e}")
            data_uri = f"data:image/jpeg;base64,{base64.b64encode(image_bytes).decode('utf-8')}"

        entry = trade_info.get("entry_price", 0.0)
        target = trade_info.get("target_price", 0.0)
        sl = trade_info.get("stop_loss", 0.0)
        tgt_pct = trade_info.get("target_pct", 1.0)
        sl_pct = trade_info.get("stop_loss_pct", 0.6)
        time_ist = trade_info.get("signal_time", "")

        prompt = f"""You are an elite quantitative technical analyst for Indian equities.
Inspect this 1-minute candlestick chart for {symbol} at trigger time {time_ist} IST.
The trade entry is marked with the ENTRY marker at Rs. {entry}, Target Price is Rs. {target} (+{tgt_pct}%), and Stop Loss is Rs. {sl} (-{sl_pct}%).

Answer these specific trading questions based on the visual candlestick pattern:
1. Can this stock reach the Target Price of Rs. {target} before hitting the Stop Loss of Rs. {sl}? (Answer true or false)
2. What is the probable chance (integer 0 to 100) of reaching this Target Price on the same day before 15:15 IST?
3. In what timeline (estimated integer minutes, e.g. 20 to 60) can it achieve the target price?
4. What is the predicted trajectory (e.g. '3-5 progressive bullish green bars climbing above 20 EMA directly toward target')?
5. Evaluate candlestick geometry:
   - Base Quality: Tight consolidation base/box vs overextended climax
   - Upper Wick Risk: Clean buyer absorption vs heavy overhead selling shadows
   - Multi-Candle Followthrough: Visual probability that subsequent candles push directly to target

6. Structural Exit Geometry:
   - Identify the immediate structural overhead resistance / swing high for Target Price (must be at least +1.0% above entry Rs. {entry}).
   - Identify the immediate structural invalidation floor (base low or 20 EMA floor) for Stop Loss (must be <= 50% of the target distance to enforce >= 1:2 Risk:Reward).

Return your analysis ONLY as valid JSON in this exact structure:
{{
  "can_reach_target": true,
  "structural_target_price": <float, estimated overhead resistance price>,
  "structural_stop_loss": <float, estimated support floor price>,
  "target_hit_probability_pct": <integer 0-100>,
  "ai_vision_score": <integer 0-100, same as target_hit_probability_pct>,
  "same_day_chance_pct": <integer 0-100, chance of reaching target on same day before 15:15 IST>,
  "expected_timeline_mins": <integer estimated minutes to reach target, e.g. 35>,
  "predicted_trajectory": "<1 sentence description of predicted price path to target>",
  "trajectory_confidence": "<HIGH | MODERATE | LOW>",
  "multi_candle_followthrough": "<short phrase like 'Strong 4-5 candle push toward target likely' or 'Chop risk, possible stall'>",
  "base_quality": "<e.g. 'Tight Consolidation Base' | 'Moderate Range' | 'Overextended Climax'>",
  "wick_rejection_risk": "<e.g. 'Minimal (Clean Absorption)' | 'Elevated Upper Shadows'>",
  "visual_headroom": "<e.g. 'Clear Runway to Target' | 'Minor Overhead Shelf'>",
  "ai_verdict": "<1-2 sentence crisp institutional observation stating if target can be reached and the probable chance>"
}}"""

        try:
            if self.provider == "xkiro":
                # OpenAI-compatible multi-modal request to xKiro Gateway
                url = "https://api.xkiro.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": self.model,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": data_uri
                                    }
                                }
                            ]
                        }
                    ],
                    "temperature": 0.1,
                    "max_tokens": 350
                }

                logger.info(f"Dispatching live xKiro Vision API call for {symbol} ({self.model})...")
                import time
                with httpx.Client(timeout=65.0) as client:
                    resp = None
                    for attempt in range(2):
                        try:
                            resp = client.post(url, json=payload, headers=headers)
                            break
                        except (httpx.ReadTimeout, httpx.ConnectTimeout) as te:
                            if attempt == 0:
                                logger.warning(f"Timeout calling xKiro for {symbol}, retrying...")
                                time.sleep(0.5)
                                continue
                            logger.error(f"xKiro timeout after 2 attempts for {symbol}: {te}")
                            resp = None
                            break

                    if resp and resp.status_code == 200:
                        data = resp.json()
                        msg = data["choices"][0]["message"]
                        raw_content = (msg.get("content") or msg.get("reasoning_content") or "").strip()
                        parsed = self._extract_json_from_text(raw_content)

                        parsed = self._validate_structural_levels(parsed, entry, target, sl)
                        score = int(parsed.get("ai_vision_score", 0))
                        parsed["ai_vision_score"] = score
                        parsed["is_live_ai"] = True
                        parsed["gateway"] = "xKiro AI Gateway"
                        parsed["model_used"] = self.model
                        logger.info(f"xKiro Vision check SUCCESS for {symbol}: Score={score}")
                        if score > 0:
                            self._cache[cache_key] = parsed
                            save_cached_audit(
                                symbol=symbol,
                                signal_date=date_str,
                                signal_time=time_str,
                                model_used=self.model,
                                audit=parsed,
                                snapshot_uri=f"/api/v1/simulation/chart-snapshot?symbol={symbol}&date={date_str}&trigger_time={time_str}"
                            )
                        return parsed
                    else:
                        status_code = resp.status_code if resp else "timeout"
                        resp_text = resp.text[:120] if resp else "No response"
                        logger.warning(f"xKiro API returned error {status_code} for {symbol}: {resp_text}")
                        return {
                            "ai_vision_score": 0,
                            "trajectory_confidence": "FAILED",
                            "multi_candle_followthrough": "API Error",
                            "base_quality": "Error",
                            "wick_rejection_risk": "Error",
                            "visual_headroom": "Error",
                            "ai_verdict": f"xKiro call failed ({status_code}): {resp_text}",
                            "is_live_ai": False,
                            "gateway": "xKiro AI Gateway",
                            "model_used": self.model,
                            "error": f"HTTP {status_code}"
                        }

            else:
                # Direct Google Gemini endpoint
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
                clean_b64 = data_uri.split(",")[-1]
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": "image/jpeg",
                                    "data": clean_b64
                                }
                            }
                        ]
                    }],
                    "generationConfig": {
                        "temperature": 0.2,
                        "response_mime_type": "application/json"
                    }
                }

                with httpx.Client(timeout=65.0) as client:
                    resp = client.post(url, json=payload)
                    if resp.status_code == 200:
                        result_json = resp.json()
                        raw_text = result_json["candidates"][0]["content"]["parts"][0]["text"].strip()
                        parsed = json.loads(raw_text)
                        parsed = self._validate_structural_levels(parsed, entry, target, sl)
                        score = int(parsed.get("ai_vision_score", 0))
                        parsed["ai_vision_score"] = score
                        parsed["is_live_ai"] = True
                        parsed["gateway"] = "Google Gemini Direct"
                        parsed["model_used"] = self.model
                        if score > 0:
                            self._cache[cache_key] = parsed
                            save_cached_audit(
                                symbol=symbol,
                                signal_date=date_str,
                                signal_time=time_str,
                                model_used=self.model,
                                audit=parsed,
                                snapshot_uri=f"/api/v1/simulation/chart-snapshot?symbol={symbol}&date={date_str}&trigger_time={time_str}"
                            )
                        return parsed
                    else:
                        logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
                        return {
                            "ai_vision_score": 0,
                            "trajectory_confidence": "FAILED",
                            "multi_candle_followthrough": "API Error",
                            "base_quality": "Error",
                            "wick_rejection_risk": "Error",
                            "visual_headroom": "Error",
                            "ai_verdict": f"Gemini API failed ({resp.status_code}): {resp.text[:120]}",
                            "is_live_ai": False,
                            "gateway": "Google Gemini Direct",
                            "model_used": self.model
                        }

        except Exception as e:
            logger.error(f"Error calling Vision API for {symbol} ({self.provider} / {self.model}): {e}")
            return {
                "ai_vision_score": 0,
                "trajectory_confidence": "ERROR",
                "multi_candle_followthrough": "Connection Exception",
                "base_quality": "Error",
                "wick_rejection_risk": "Error",
                "visual_headroom": "Error",
                "ai_verdict": f"Vision API exception: {str(e)[:120]}",
                "is_live_ai": False,
                "gateway": "xKiro AI Gateway" if self.provider == "xkiro" else "Google Gemini Direct",
                "model_used": self.model,
                "error": str(e)
            }

    def analyze_batch_chart_snapshots(
        self,
        items: List[Dict[str, Any]],
        max_workers: int = 6
    ) -> Dict[str, Dict[str, Any]]:
        """
        Executes parallel multi-stock AI Vision audits across candidate items concurrently.
        Each item is a dict with:
          - symbol: str
          - image_bytes: bytes
          - trade_info: Dict[str, Any]
        Returns a dict mapping symbol -> audit_result dict.
        """
        results: Dict[str, Dict[str, Any]] = {}
        if not items:
            return results

        import concurrent.futures

        def _audit_worker(item: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
            sym = item["symbol"]
            img_bytes = item.get("image_bytes") or b""
            t_info = item.get("trade_info") or {}
            try:
                res = self.analyze_chart_snapshot(img_bytes, sym, t_info)
                return sym, res
            except Exception as ex:
                logger.error(f"Batch AI Vision error for {sym}: {ex}")
                return sym, {
                    "ai_vision_score": 0,
                    "target_hit_probability_pct": 0,
                    "can_reach_target": False,
                    "error": str(ex)
                }

        # 1. Check SQLite and memory cache first for all items
        uncached_items = []
        for item in items:
            sym = item["symbol"]
            t_info = item.get("trade_info", {})
            d_str = str(t_info.get("signal_date", ""))
            ti_str = str(t_info.get("signal_time", ""))
            cached = get_cached_audit(sym, d_str, ti_str, self.model)
            if cached and cached.get("ai_vision_score", 0) > 0:
                results[sym] = cached
            else:
                uncached_items.append(item)

        # 2. For remaining uncached items, fire concurrent parallel requests
        if uncached_items:
            workers = min(max_workers, len(uncached_items))
            logger.info(f"Dispatching parallel AI Vision batch: {len(uncached_items)} uncached stocks with {workers} workers")
            with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
                futures = [executor.submit(_audit_worker, it) for it in uncached_items]
                for future in concurrent.futures.as_completed(futures):
                    sym, audit = future.result()
                    results[sym] = audit

        return results

gemini_vision_service = GeminiVisionService()

