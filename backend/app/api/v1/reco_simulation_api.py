from fastapi import APIRouter, Query, HTTPException, Body
from typing import Optional, List, Dict, Any
from app.engine.reco_simulation_engine import reco_simulation_engine

router = APIRouter()

@router.get("/simulation/dates")
def get_simulation_dates():
    """Returns past market trading dates available for simulation."""
    return reco_simulation_engine.get_available_dates()

@router.post("/simulation/run")
def run_simulation(payload: Dict[str, Any] = Body(...)):
    """
    Runs minute-by-minute walk-forward simulation for selected day.
    Payload:
    - date: str (e.g. '2026-09-11')
    - mode: '26_PARAMS' or '26_PARAMS_VAULT'
    - target_pct: float (default 1.5)
    - stop_loss_pct: float (default 0.8)
    """
    date = payload.get("date")
    if not date:
        dates = reco_simulation_engine.get_available_dates()
        date = dates[0]["date"] if dates else "2026-09-11"

    mode = payload.get("mode", "CURRENT")
    strategy = payload.get("strategy", "TREND_RUNNER")
    target_pct = float(payload.get("target_pct") or 1.5)
    stop_loss_pct = float(payload.get("stop_loss_pct") or 0.8)
    min_score = int(payload.get("min_score") if payload.get("min_score") is not None else 80)
    history_min_score = int(payload.get("history_min_score") if payload.get("history_min_score") is not None else 45)
    vision_min_score = int(payload.get("vision_min_score") if payload.get("vision_min_score") is not None else 70)

    return reco_simulation_engine.run_simulation(
        date=date,
        mode=mode,
        strategy=strategy,
        target_pct=target_pct,
        stop_loss_pct=stop_loss_pct,
        min_score=min_score,
        history_min_score=history_min_score,
        vision_min_score=vision_min_score
    )

@router.get("/simulation/trade-audit/{symbol}")
def get_trade_audit(
    symbol: str,
    price: Optional[float] = Query(0.0),
    time: Optional[str] = Query(""),
    date: Optional[str] = Query(""),
    score: Optional[int] = Query(None),
    raw_score: Optional[int] = Query(None),
    outcome: Optional[str] = Query("SUCCESS"),
    trigger_rvol: Optional[float] = Query(None)
):
    """
    Returns 1-pager popup audit data for a simulated trade:
    - Tab 1: Exact 19 Parameters with status and plain-English explanation of why/how system recommended it.
    - Tab 2: Tape Vault 12 Historical Parameters with 60-day empirical trend proof.
    """
    return reco_simulation_engine.get_trade_audit(
        symbol=symbol,
        entry_price=price or 0.0,
        signal_time=time or "",
        signal_date=date or "",
        score=score,
        raw_score=raw_score,
        outcome=outcome or "SUCCESS",
        trigger_rvol=trigger_rvol
    )

