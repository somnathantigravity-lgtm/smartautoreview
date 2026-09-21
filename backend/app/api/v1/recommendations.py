import logging
from fastapi import APIRouter, HTTPException, Query, Body, Request
from typing import Dict, List, Any, Optional

from app.engine.recommendation_engine import recommendation_engine
from app.engine.recommendations_db import get_db_connection

logger = logging.getLogger(__name__)

router = APIRouter()

from typing import Dict, List, Any, Optional

@router.get("/recommendations/metrics")
def get_recommendation_metrics():
    """Returns today's live metric scorecard: total picks, success count & win rate %, stopped out count, and top working strategy."""
    try:
        data = recommendation_engine.get_daily_performance_metrics()
        return {
            "status": "SUCCESS",
            "metrics": data
        }
    except Exception as e:
        logger.error(f"Error fetching recommendation metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/sessions")
def get_recommendation_sessions():
    """Returns available market session dates for historical audit & review."""
    try:
        return {
            "status": "SUCCESS",
            "sessions": recommendation_engine.get_available_sessions()
        }
    except Exception as e:
        logger.error(f"Error fetching sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/live")
def get_live_simulation_recommendations(
    mode: str = Query("CURRENT", description="CURRENT | VALIDATED | AI_VISION | FULL_STEP"),
    force_scan: bool = Query(False, description="Whether to trigger an immediate fresh scan"),
    session_date: Optional[str] = Query(None, description="Optional date (YYYY-MM-DD) for historical replay")
):
    """
    Returns real-time intraday recommendations powered by the audited 19-Parameter Core Scanner.
    Provides progressive hydration across Current, Validated History, AI Vision (Gemini 3.6 Flash), and Full 3-Step.
    """
    try:
        import time as _t
        _t0 = _t.time()
        res = recommendation_engine.get_live_simulation_style_recommendations(
            mode=mode,
            force_scan=force_scan,
            session_date=session_date
        )
        _dt = (_t.time() - _t0) * 1000
        res["_api_elapsed_ms"] = round(_dt, 1)
        return res
    except Exception as e:
        logger.error(f"Error fetching live recommendations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommendations/clear-live")
def clear_live_recommendations(start_fresh_from_now: bool = True):
    """Clears test recommendations from live memory and starts fresh from current time."""
    recommendation_engine.clear_live_recommendations(start_fresh_from_now=start_fresh_from_now)
    cutoff = recommendation_engine._live_cutoff_time or "09:30:00"
    return {"status": "SUCCESS", "message": f"Live recommendations memory cleared. Starting fresh from {cutoff} IST.", "cutoff_time": cutoff}

@router.get("/recommendations/active")
def get_active_recommendations(horizon: Optional[str] = None, date: Optional[str] = None):
    """Returns published recommendations for the public dashboard, optionally filtered by horizon and session date."""
    try:
        data = recommendation_engine.get_public_recommendations(horizon=horizon, session_date=date)
        return {
            "status": "SUCCESS",
            "count": len(data),
            "recommendations": data
        }
    except Exception as e:
        logger.error(f"Error fetching active recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/intraday/active")
def get_intraday_active():
    """Returns only actively running intraday recommendations that meet the 5+2 momentum criteria."""
    try:
        data = recommendation_engine.get_public_recommendations(horizon="INTRADAY")
        return {
            "status": "SUCCESS",
            "count": len(data),
            "recommendations": data
        }
    except Exception as e:
        logger.error(f"Error fetching active intraday recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/intraday/trimmed")
def get_intraday_trimmed():
    """Returns intraday recommendations exited early by System 2 Trade Health Guardian with reasons and trimmed P&L."""
    try:
        data = recommendation_engine.get_public_recommendations(horizon="TRIMMED")
        return {
            "status": "SUCCESS",
            "count": len(data),
            "recommendations": data
        }
    except Exception as e:
        logger.error(f"Error fetching trimmed intraday recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/history")
def get_historical_recommendations(limit: int = 1000, date: Optional[str] = None):
    """Returns completed historical recommendations with returns, holding period, and outcome, optionally filtered by session date."""
    try:
        data = recommendation_engine.get_historical_recommendations(limit=limit, session_date=date)
        return {
            "status": "SUCCESS",
            "count": len(data),
            "history": data
        }
    except Exception as e:
        logger.error(f"Error fetching historical recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/{rec_id}/reason")
def get_recommendation_reason(rec_id: str):
    """Returns grounded evidentiary reasoning and trade setup for a specific recommendation."""
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM recommendations WHERE id = ?", (rec_id,))
        row = c.fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Recommendation not found")

        d = dict(row)
        import json
        return {
            "status": "SUCCESS",
            "id": d["id"],
            "symbol": d["symbol"],
            "name": d["company_name"],
            "recommendation": d["recommendation"],
            "entry_range": f"₹{d['entry_min']:,.2f} – ₹{d['entry_max']:,.2f}",
            "target": f"₹{d['target_price']:,.2f}",
            "stop_loss": f"₹{d['stop_loss']:,.2f}",
            "invalidation": f"₹{d['invalidation_price']:,.2f}",
            "expected_horizon": d["expected_horizon"],
            "risk_reward_ratio": f"1 : {d['risk_reward_ratio']}",
            "opportunity_score": d["opportunity_score"],
            "reasons": json.loads(d["reasons_json"]) if d.get("reasons_json") else [],
            "evidence": json.loads(d["evidence_json"]) if d.get("evidence_json") else {},
            "strategy_version": d["strategy_version"],
            "created_at_str": d["created_at_str"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching reason: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommendations/scan")
def trigger_recommendations_scan(force: bool = Query(False)):
    """Triggers an on-demand scan of the live universe to score and surface real recommendations."""
    try:
        res = recommendation_engine.run_candidate_scan(force=force)
        return res
    except Exception as e:
        logger.error(f"Error executing on-demand scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommendations/reset")
def reset_all_recommendations():
    """Wipes all recommendations from database and generates a 100% fresh batch."""
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("DELETE FROM recommendations")
        c.execute("DELETE FROM universe_evaluations")
        conn.commit()
        conn.close()
        recommendation_engine.incubation_pipeline.clear()
        res = recommendation_engine.run_candidate_scan(force=True)
        return {
            "status": "SUCCESS",
            "message": "All existing recommendations deleted and fresh scan completed.",
            "scan_result": res
        }
    except Exception as e:
        logger.error(f"Error resetting recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/audit-dates")
def get_recommendations_audit_dates():
    """Returns available trading session dates for post-market audit review."""
    try:
        from app.engine.reco_audit_service import reco_audit_service
        return {
            "status": "SUCCESS",
            "dates": reco_audit_service.get_audit_available_dates()
        }
    except Exception as e:
        logger.error(f"Error fetching audit dates: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/audit-matrix")
def get_recommendations_audit_matrix(
    search: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    policy: Optional[str] = Query(None),
    gate: Optional[str] = Query(None, description="Execution gate filter (ALL, GO, WAITING)"),
    min_hit_pct: Optional[float] = Query(None, description="Minimum target hit percentage (0-100)"),
    max_hit_pct: Optional[float] = Query(None, description="Maximum target hit percentage (0-100)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=1000),
    date: Optional[str] = Query(None, description="Session date (YYYY-MM-DD) for after-market audit")
):
    """Returns high-speed real-time audit matrix with live LTP, depth, WA/C/H/A scores, and policy compliance."""
    try:
        from app.engine.reco_audit_service import reco_audit_service
        return reco_audit_service.get_audit_matrix(
            search=search,
            sector=sector,
            policy=policy,
            execution_gate=gate,
            min_hit_pct=min_hit_pct,
            max_hit_pct=max_hit_pct,
            page=page,
            page_size=page_size,
            date=date
        )
    except Exception as e:
        logger.error(f"Error fetching audit matrix: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/audit-cadence")
def get_audit_cadence():
    """Returns live audit health: status, interval, last 1m and 10m audits count."""
    try:
        from app.engine.reco_audit_service import reco_audit_service
        status = reco_audit_service.get_screening_status()
        eligible = status.get("eligible_count") or 1119
        return {
            "status": "SUCCESS",
            **reco_audit_service.get_cadence_counts(eligible_count=eligible)
        }
    except Exception as e:
        logger.error(f"Error fetching audit cadence: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommendations/audit-cadence/toggle")
def toggle_audit_active(payload: Dict[str, Any]):
    """Enables or pauses the live continuous auditing of stocks."""
    try:
        from app.engine.reco_audit_service import reco_audit_service
        active = bool(payload.get("active", True))
        reco_audit_service.set_audit_active(active)
        return {
            "status": "SUCCESS",
            "is_audit_active": reco_audit_service.is_audit_active
        }
    except Exception as e:
        logger.error(f"Error toggling audit active state: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommendations/audit-cadence/interval")
def set_audit_interval(payload: Dict[str, Any]):
    """Changes audit interval (e.g. 5 seconds vs 60 seconds)."""
    try:
        from app.engine.reco_audit_service import reco_audit_service
        seconds = int(payload.get("seconds", 5))
        new_interval = reco_audit_service.set_audit_interval(seconds)
        return {
            "status": "SUCCESS",
            "interval_seconds": new_interval
        }
    except Exception as e:
        logger.error(f"Error setting audit interval: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/audit-history/{symbol}")
def get_stock_audit_history(symbol: str):
    """Returns chronological audit history and reasoning for why a stock was recommended across historical setups."""
    try:
        from app.engine.reco_audit_service import reco_audit_service
        return reco_audit_service.get_stock_audit_history(symbol=symbol)
    except Exception as e:
        logger.error(f"Error fetching audit history for {symbol}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/recommendations/screening-status")
def get_screening_status():
    """Returns today's morning universe screening status, active rules, and inclusion counts."""
    try:
        from app.engine.reco_audit_service import reco_audit_service
        return reco_audit_service.get_screening_status()
    except Exception as e:
        logger.error(f"Error fetching screening status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations/preview-exclusions")
def preview_exclusion_rules(rules: Dict[str, Any]):
    """Live (<100ms) recalculation of inclusion/exclusion tallies for custom negative rules."""
    try:
        from app.engine.reco_audit_service import reco_audit_service
        return reco_audit_service.preview_exclusion_rules(rules)
    except Exception as e:
        logger.error(f"Error previewing exclusion rules: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations/apply-exclusions")
def apply_exclusion_rules(rules: Dict[str, Any]):
    """Applies negative exclusion rules for today, locks the eligible universe, and activates the live engine."""
    try:
        from app.engine.reco_audit_service import reco_audit_service
        return reco_audit_service.apply_exclusion_rules(rules)
    except Exception as e:
        logger.error(f"Error applying exclusion rules: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/ineligible-stocks")
def get_ineligible_stocks(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    rule_id: Optional[str] = Query(None),
    rules_json: Optional[str] = Query(None)
):
    """Returns paginated, searchable list of ineligible / excluded stocks with failure diagnostics and real metrics."""
    try:
        from app.engine.reco_audit_service import reco_audit_service
        override_rules = None
        if rules_json:
            try:
                override_rules = json.loads(rules_json)
            except Exception:
                pass
        return reco_audit_service.get_ineligible_stocks(
            page=page,
            page_size=page_size,
            search=search,
            reason_category=category,
            rule_id=rule_id,
            rules_override=override_rules
        )
    except Exception as e:
        logger.error(f"Error fetching ineligible stocks: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------
# STRATEGY & RECO RULES ENDPOINTS
# ---------------------------------------------------------
@router.get("/recommendations/strategies")
def get_strategies():
    """Returns list of strategies and the currently active strategy."""
    try:
        from app.engine.reco_audit_service import reco_audit_service
        data = reco_audit_service.get_strategies_data()
        screening_st = reco_audit_service.get_screening_status()
        active_id = data.get("active_strategy_id")
        strategies = data.get("strategies", [])
        for strat in strategies:
            if strat.get("id") == active_id:
                strat["eligible_count"] = screening_st.get("eligible_count", 586)
            elif "eligible_count" not in strat or not strat.get("eligible_count"):
                strat["eligible_count"] = screening_st.get("eligible_count", 586)
        return {
            "status": "SUCCESS",
            "active_strategy_id": active_id,
            "strategies": strategies,
            "active_strategy": reco_audit_service.get_active_strategy(),
            "eligible_count": screening_st.get("eligible_count", 586)
        }
    except Exception as e:
        logger.error(f"Error fetching strategies: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations/strategies")
def save_strategy(strat: Dict[str, Any]):
    """Creates or updates a strategy."""
    try:
        from app.engine.reco_audit_service import reco_audit_service
        saved = reco_audit_service.save_strategy(strat)
        return {
            "status": "SUCCESS",
            "message": f"Strategy '{saved.get('name')}' saved successfully.",
            "strategy": saved
        }
    except Exception as e:
        logger.error(f"Error saving strategy: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations/strategies/active")
def set_active_strategy(
    strategy_id: Optional[str] = Query(None),
    payload: Optional[Dict[str, Any]] = Body(None)
):
    """Sets the active strategy, or deactivates if empty."""
    try:
        strat_id = strategy_id or (payload.get("strategy_id") if payload else None)
        from app.engine.reco_audit_service import reco_audit_service
        active = reco_audit_service.set_active_strategy(strat_id)
        return {
            "status": "SUCCESS",
            "message": f"Active strategy set to '{active.get('name')}'.",
            "active_strategy": active
        }
    except Exception as e:
        logger.error(f"Error setting active strategy: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations/strategies/deactivate")
def deactivate_strategy():
    """Deactivates whatever strategy is currently active."""
    try:
        from app.engine.reco_audit_service import reco_audit_service
        res = reco_audit_service.deactivate_active_strategy()
        return {
            "status": "SUCCESS",
            "message": "Strategy successfully deactivated.",
            "active_strategy": res
        }
    except Exception as e:
        logger.error(f"Error deactivating strategy: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations/strategies/toggle-active")
def toggle_strategy_active(payload: Dict[str, Any]):
    """Toggles a strategy between active and inactive. When inactive, audit does not run."""
    try:
        strat_id = payload.get("strategy_id")
        is_active = payload.get("is_active")
        if not strat_id:
            raise HTTPException(status_code=400, detail="strategy_id is required")
        from app.engine.reco_audit_service import reco_audit_service
        res = reco_audit_service.toggle_strategy_active(strategy_id=strat_id, is_active=is_active)
        return {
            "status": "SUCCESS",
            "message": f"Strategy active status updated.",
            "data": res
        }
    except Exception as e:
        logger.error(f"Error toggling strategy active state: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations/audit-dates/record")
def record_audit_date(payload: Dict[str, Any]):
    """Records a date for which reco audit was tested into tested dates store."""
    try:
        dt = payload.get("date")
        if not dt:
            raise HTTPException(status_code=400, detail="date is required")
        from app.engine.reco_audit_service import reco_audit_service
        reco_audit_service.record_tested_date(dt)
        return {
            "status": "SUCCESS",
            "available_dates": reco_audit_service.get_audit_available_dates()
        }
    except Exception as e:
        logger.error(f"Error recording audit date: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/recommendations/strategies/{strategy_id}")
def delete_strategy(strategy_id: str):
    """Deletes a custom strategy."""
    try:
        from app.engine.reco_audit_service import reco_audit_service
        ok = reco_audit_service.delete_strategy(strategy_id)
        if not ok:
            raise HTTPException(status_code=400, detail="Cannot delete default or non-existent strategy.")
        return {
            "status": "SUCCESS",
            "message": f"Strategy '{strategy_id}' deleted successfully."
        }
    except Exception as e:
        logger.error(f"Error deleting strategy: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations/sync-strategy")
def sync_strategy_universe(payload: Optional[Dict[str, Any]] = None):
    """
    Manually triggers universe screening & activates recommendations for the chosen (or active) strategy.
    Runs strictly on user demand (not on laptop boot or automatic timer).
    """
    try:
        strat_id = payload.get("strategy_id") if payload else None
        from app.engine.reco_audit_service import reco_audit_service
        return reco_audit_service.sync_strategy_universe(strategy_id=strat_id)
    except Exception as e:
        logger.error(f"Error syncing strategy universe: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/stock-range-history/{symbol}")
def get_stock_range_history(symbol: str, default_price: float = Query(0.0)):
    """Returns the authentic 5-day and 52-week min/max across the last 5 open market sessions."""
    res = recommendation_engine.get_5d_high_low(symbol, default_price=default_price)
    return {
        "status": "SUCCESS",
        "data": res
    }




