"""
Gemini Vision Settings & AI Audit API Endpoints
Provides endpoints for configuring the Google Gemini API key,
testing connectivity, and generating visual chart audits.
"""

from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
from typing import Dict, Any, Optional
import sqlite3
import os
import json
import logging

from app.engine.gemini_vision_service import gemini_vision_service
from app.engine.chart_snapshot_engine import chart_snapshot_engine

logger = logging.getLogger(__name__)
router = APIRouter()

ENGINE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "engine"))
DB_PATH = os.path.join(ENGINE_DIR, "intraday_history.db")
if not os.path.exists(DB_PATH):
    DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "intraday_history.db"))

class GeminiConfigRequest(BaseModel):
    api_key: str
    model: Optional[str] = "z-ai/glm-4.6v"
    provider: Optional[str] = "xkiro"

@router.get("/gemini/status")
def get_gemini_status():
    """Returns AI Vision API configuration, provider, model, and connection status."""
    return gemini_vision_service.get_status()

@router.post("/gemini/settings")
def update_gemini_settings(payload: GeminiConfigRequest):
    """Saves and verifies xKiro or Gemini API credentials and model."""
    if not payload.api_key or not payload.api_key.strip():
        raise HTTPException(status_code=400, detail="API Key cannot be empty.")
    
    provider = (payload.provider or "xkiro").strip().lower()
    default_model = "z-ai/glm-4.6v" if provider == "xkiro" else "gemini-2.0-flash"
    model = payload.model.strip() if payload.model and payload.model.strip() else default_model

    result = gemini_vision_service.save_credentials(
        api_key=payload.api_key,
        model=model,
        provider=provider
    )
    return result

@router.post("/gemini/test")
def test_gemini_connection():
    """Pings the active AI vision provider endpoint (xKiro Gateway or Gemini Direct)."""
    return gemini_vision_service.verify_connection()

def _fetch_candles_for_symbol(symbol: str, date_str: str):
    """Helper to fetch 1-minute candles from SQLite intraday_history.db."""
    if not os.path.exists(DB_PATH):
        return []
    
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        # Search by date prefix in historical_1min_candles
        cur.execute(
            """
            SELECT datetime_str, open, high, low, close, volume 
            FROM historical_1min_candles 
            WHERE symbol = ? AND datetime_str LIKE ?
            ORDER BY timestamp ASC
            """,
            (symbol, f"{date_str}%")
        )
        rows = cur.fetchall()
        conn.close()
        
        candles = []
        for r in rows:
            candles.append({
                "datetime_str": str(r["datetime_str"]),
                "open": float(r["open"]),
                "high": float(r["high"]),
                "low": float(r["low"]),
                "close": float(r["close"]),
                "volume": float(r["volume"] or 0)
            })
        return candles
    except Exception as e:
        logger.error(f"Error fetching candles for {symbol} on {date_str}: {e}")
        return []

@router.get("/simulation/trade-chart/{symbol}")
def get_trade_chart_snapshot(
    symbol: str,
    date: str = Query(..., description="Trading date YYYY-MM-DD"),
    time: str = Query(..., description="Trigger time HH:MM"),
    price: float = Query(0.0),
    target: float = Query(0.0),
    sl: float = Query(0.0),
    company_name: Optional[str] = Query("")
):
    """Generates a candlestick chart snapshot for a trade at trigger point."""
    candles = _fetch_candles_for_symbol(symbol, date)
    if not candles:
        # Fallback synthetic small series around price
        ref_price = price if price > 0 else 100.0
        candles = [
            {
                "datetime_str": f"{date} 09:{15+i:02d}:00",
                "open": round(ref_price * (0.995 + i * 0.0003), 2),
                "high": round(ref_price * (0.998 + i * 0.0004), 2),
                "low": round(ref_price * (0.993 + i * 0.0003), 2),
                "close": round(ref_price * (0.997 + i * 0.0003), 2),
                "volume": 15000 + i * 500
            }
            for i in range(25)
        ]
        trigger_idx = len(candles) - 1
    else:
        # Find trigger index by matching time
        trigger_idx = len(candles) - 1
        clean_time = time[:5]
        for idx, c in enumerate(candles):
            if clean_time in c.get("datetime_str", ""):
                trigger_idx = idx
                break

    raw_bytes, data_uri = chart_snapshot_engine.render_candlestick_chart(
        candles=candles,
        trigger_idx=trigger_idx,
        symbol=symbol,
        company_name=company_name or symbol,
        entry_price=price,
        target_price=target,
        stop_loss=sl
    )

    return {
        "symbol": symbol,
        "date": date,
        "time": time,
        "chart_data_uri": data_uri
    }

@router.post("/simulation/trade-vision-audit/{symbol}")
def run_trade_vision_audit(
    symbol: str,
    payload: Dict[str, Any] = Body(...)
):
    """
    Renders candlestick chart snapshot and executes Gemini Vision AI analysis.
    Returns visual metrics, trajectory follow-through confidence, and plain-language verdict.
    """
    date = payload.get("date", "2026-09-11")
    time_str = payload.get("time", "10:00")
    price = float(payload.get("price") or 0.0)
    target = float(payload.get("target") or 0.0)
    sl = float(payload.get("sl") or 0.0)
    company_name = payload.get("company_name", symbol)

    candles = _fetch_candles_for_symbol(symbol, date)
    if not candles:
        ref_price = price if price > 0 else 100.0
        candles = [
            {
                "datetime_str": f"{date} 09:{15+i:02d}:00",
                "open": round(ref_price * (0.995 + i * 0.0003), 2),
                "high": round(ref_price * (0.998 + i * 0.0004), 2),
                "low": round(ref_price * (0.993 + i * 0.0003), 2),
                "close": round(ref_price * (0.997 + i * 0.0003), 2),
                "volume": 15000 + i * 500
            }
            for i in range(25)
        ]
        trigger_idx = len(candles) - 1
    else:
        trigger_idx = len(candles) - 1
        clean_time = time_str[:5]
        for idx, c in enumerate(candles):
            if clean_time in c.get("datetime_str", ""):
                trigger_idx = idx
                break

    raw_bytes, data_uri = chart_snapshot_engine.render_candlestick_chart(
        candles=candles,
        trigger_idx=trigger_idx,
        symbol=symbol,
        company_name=company_name,
        entry_price=price,
        target_price=target,
        stop_loss=sl
    )

    trade_info = {
        "symbol": symbol,
        "entry_price": price,
        "target_price": target,
        "stop_loss": sl,
        "signal_date": date,
        "signal_time": time_str,
        "score_100": int(payload.get("score_100") or 80),
        "vault_score": int(payload.get("vault_score") or 70),
        "hurst_exponent": float(payload.get("hurst_exponent") or 0.58),
        "is_nr7": bool(payload.get("is_nr7") or False)
    }

    vision_result = gemini_vision_service.analyze_chart_snapshot(raw_bytes, symbol, trade_info)

    expected_m = int(vision_result.get("expected_timeline_mins") or 35)
    same_day_p = int(vision_result.get("same_day_chance_pct") or vision_result.get("target_hit_probability_pct") or 75)

    _, traj_data_uri = chart_snapshot_engine.render_predicted_trajectory_chart(
        candles=candles,
        trigger_idx=trigger_idx,
        symbol=symbol,
        company_name=company_name,
        entry_price=price,
        target_price=target,
        stop_loss=sl,
        expected_mins=expected_m,
        hit_prob_pct=same_day_p
    )

    return {
        "symbol": symbol,
        "chart_data_uri": data_uri,
        "trajectory_data_uri": traj_data_uri,
        "vision": vision_result
    }

@router.post("/simulation/batch-vision-audit")
def run_batch_vision_audit(
    payload: Dict[str, Any] = Body(...)
):
    """
    Parallel multi-stock batch vision audit for candidates.
    Audits multiple stocks concurrently using thread pool and returns all audit records.
    """
    trades = payload.get("trades") or []
    date = payload.get("date", "2026-09-11")
    max_workers = int(payload.get("max_workers") or 6)

    if not trades:
        return {"status": "success", "count": 0, "results": {}}

    batch_items = []
    for t in trades:
        sym = t.get("symbol")
        if not sym:
            continue
        p = float(t.get("entry_price") or t.get("price") or 0.0)
        tgt = float(t.get("target_price") or t.get("target") or 0.0)
        sl = float(t.get("stop_loss") or t.get("sl") or 0.0)
        comp = t.get("company_name", sym)
        sig_time = str(t.get("signal_time") or "10:00")[:5]

        candles = _fetch_candles_for_symbol(sym, date)
        if not candles:
            candles = [
                {
                    "datetime_str": f"{date} 09:{15+i:02d}:00",
                    "open": round(p * (0.995 + i * 0.0003), 2),
                    "high": round(p * (0.998 + i * 0.0004), 2),
                    "low": round(p * (0.993 + i * 0.0003), 2),
                    "close": round(p * (0.997 + i * 0.0003), 2),
                    "volume": 15000 + i * 500
                }
                for i in range(25)
            ]
            t_idx = len(candles) - 1
        else:
            t_idx = len(candles) - 1
            for idx, c in enumerate(candles):
                if sig_time in c.get("datetime_str", ""):
                    t_idx = idx
                    break

        raw_bytes, _ = chart_snapshot_engine.render_candlestick_chart(
            candles=candles,
            trigger_idx=t_idx,
            symbol=sym,
            company_name=comp,
            entry_price=p,
            target_price=tgt,
            stop_loss=sl
        )

        batch_items.append({
            "symbol": sym,
            "image_bytes": raw_bytes,
            "trade_info": {
                "symbol": sym,
                "entry_price": p,
                "target_price": tgt,
                "stop_loss": sl,
                "signal_date": date,
                "signal_time": sig_time,
                "score_100": int(t.get("score_100") or 80),
                "vault_score": int(t.get("vault_score") or 70),
                "hurst_exponent": float(t.get("hurst_exponent") or 0.58),
                "is_nr7": bool(t.get("is_nr7") or False)
            }
        })

    results = gemini_vision_service.analyze_batch_chart_snapshots(batch_items, max_workers=max_workers)
    return {
        "status": "success",
        "count": len(results),
        "results": results
    }
