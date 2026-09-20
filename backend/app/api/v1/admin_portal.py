import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

from app.engine.recommendation_engine import recommendation_engine

logger = logging.getLogger(__name__)

router = APIRouter()

ADMIN_EMAIL = "somnathdey269@gmail.com"
ADMIN_PASSWORD = "Deevarsh@190521"

class AdminLoginRequest(BaseModel):
    email: str
    password: str

class ManualInjectRequest(BaseModel):
    symbol: str
    bse_scrip: Optional[str] = "500000"
    company_name: Optional[str] = None
    sector: Optional[str] = "Diversified"
    market_cap_category: Optional[str] = "Large Cap"
    market_cap_cr: Optional[float] = 25000.0
    bse_price: float
    nse_price: Optional[float] = None
    entry_min: Optional[float] = None
    entry_max: Optional[float] = None
    target_price: float
    stop_loss: float
    invalidation_price: Optional[float] = None
    expected_horizon: Optional[str] = "2 to 4 weeks"
    opportunity_score: Optional[int] = 90
    reasons: Optional[List[str]] = None

class TogglePublishRequest(BaseModel):
    id: str
    publish: bool

class StrategyActivateRequest(BaseModel):
    version: str

class SettingsUpdateRequest(BaseModel):
    settings: Dict[str, Any]

@router.post("/admin-portal/login")
def admin_login(req: AdminLoginRequest):
    """Authenticates administrator credentials."""
    if req.email.strip().lower() == ADMIN_EMAIL.lower() and req.password == ADMIN_PASSWORD:
        return {
            "success": True,
            "token": "apex_admin_secure_token_somnath_2026",
            "user": {
                "email": ADMIN_EMAIL,
                "role": "SUPER_ADMIN",
                "name": "Somnath Dey"
            }
        }
    raise HTTPException(status_code=401, detail="Invalid administrator credentials.")

@router.get("/admin-portal/candidates")
def get_all_scored_candidates(filter_type: Optional[str] = "all"):
    """Returns all scored candidates from recent scans (all, published 96+, or shadow learning log) along with session quota metrics."""
    try:
        candidates = recommendation_engine.get_all_admin_candidates(filter_type=filter_type or "all")
        quota_stats = recommendation_engine.get_session_quota_stats()
        return {
            "status": "SUCCESS",
            "count": len(candidates),
            "filter": filter_type or "all",
            "quota_stats": quota_stats,
            "candidates": candidates
        }
    except Exception as e:
        logger.error(f"Error fetching admin candidates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin-portal/manual-inject")
def manual_inject(req: ManualInjectRequest):
    """Admin Manual Injector: Allows admin to add or force a recommendation."""
    try:
        res = recommendation_engine.manual_inject_recommendation(req.dict())
        return res
    except Exception as e:
        logger.error(f"Manual injection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin-portal/toggle-publish")
def toggle_publish(req: TogglePublishRequest):
    """Toggles recommendation visibility on the public user dashboard."""
    try:
        return recommendation_engine.toggle_publish_status(req.id, req.publish)
    except Exception as e:
        logger.error(f"Toggle publish failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin-portal/strategies")
def get_strategies():
    """Returns all strategy versions and performance metrics."""
    try:
        return {
            "status": "SUCCESS",
            "strategies": recommendation_engine.get_strategy_versions()
        }
    except Exception as e:
        logger.error(f"Get strategies failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin-portal/strategies/activate")
def activate_strategy(req: StrategyActivateRequest):
    """1-Click Strategy Promotion: Switches active Champion version."""
    try:
        return recommendation_engine.activate_strategy_version(req.version)
    except Exception as e:
        logger.error(f"Strategy activation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin-portal/eod-reports")
def get_eod_reports():
    """Returns daily post-mortem executive reports."""
    try:
        reports = recommendation_engine.get_daily_eod_reports()
        return {
            "status": "SUCCESS",
            "reports": reports
        }
    except Exception as e:
        logger.error(f"Get EOD reports failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin-portal/settings")
def get_settings():
    """Returns admin throttle and cadence settings."""
    try:
        return {
            "status": "SUCCESS",
            "settings": recommendation_engine.get_admin_settings()
        }
    except Exception as e:
        logger.error(f"Get settings failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin-portal/settings")
def update_settings(req: SettingsUpdateRequest):
    """Updates admin settings (throttle count, scan cadence)."""
    try:
        return recommendation_engine.update_admin_settings(req.settings)
    except Exception as e:
        logger.error(f"Update settings failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin-portal/run-scan-now")
def run_scan_now():
    """Triggers an immediate 30-minute candidate scan cycle."""
    try:
        return recommendation_engine.run_candidate_scan(force=True)
    except Exception as e:
        logger.error(f"Run scan failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin-portal/universe-inspector")
def get_universe_inspector(
    search: Optional[str] = "",
    sector: Optional[str] = "ALL",
    status: Optional[str] = "ALL",
    filter_status: Optional[str] = None,
    limit: Optional[int] = 50,
    offset: Optional[int] = 0,
    page: Optional[int] = None,
    page_size: Optional[int] = None
):
    """Returns every single stock from the universe with complete solvency, core kill-switches, and catalyst diagnostics."""
    try:
        eff_status = filter_status if filter_status is not None else status
        eff_limit = page_size if page_size is not None else (limit or 50)
        eff_offset = ((page - 1) * eff_limit) if (page is not None and page > 0) else (offset or 0)

        res = recommendation_engine.get_universe_inspector(
            search=search or "",
            sector=sector or "ALL",
            status=eff_status or "ALL",
            limit=eff_limit,
            offset=eff_offset
        )
        res["total_stocks"] = res["total_matches"]
        res["items"] = res["stocks"]
        res["page"] = page or (eff_offset // eff_limit + 1)
        res["page_size"] = eff_limit
        return res
    except Exception as e:
        logger.error(f"Universe inspector failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin-portal/solvency-status")
def get_solvency_status():
    """Returns today's Solvency Gate cache and execution timestamp."""
    try:
        return recommendation_engine.get_solvency_status()
    except Exception as e:
        logger.error(f"Solvency status failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin-portal/run-solvency-now")
def run_solvency_now():
    """Priority 1 Solvency Gate: Runs the fundamental and solvency gate across the entire universe immediately."""
    try:
        return recommendation_engine.ensure_solvency_gate_synced(force=True)
    except Exception as e:
        logger.error(f"Run solvency gate failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# QUANT COPILOT & 26-PARAMETER INSPECTOR ENDPOINTS
# ==============================================================================
class CopilotChatRequest(BaseModel):
    query: str
    active_symbol: Optional[str] = None

@router.post("/admin-portal/copilot/chat")
def copilot_chat(req: CopilotChatRequest):
    """Conversational Quant Copilot: Analyzes user query against 26-parameters and 60-day Dhan data."""
    try:
        from app.engine.quant_copilot_engine import quant_copilot_engine
        return quant_copilot_engine.chat_query(req.query, active_symbol=req.active_symbol)
    except Exception as e:
        logger.error(f"Copilot chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin-portal/copilot/stock/{symbol}")
def get_copilot_stock_profile(symbol: str):
    """Returns 26-parameter DNA scorecard, 60-day hit rates, and pass/fail metrics for a specific stock."""
    try:
        from app.engine.quant_copilot_engine import quant_copilot_engine
        profile = quant_copilot_engine.get_stock_profile(symbol)
        if not profile:
            raise HTTPException(status_code=404, detail=f"Stock profile for '{symbol}' not found.")
        return profile
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching stock profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin-portal/copilot/stocks-dna")
def list_stocks_dna(limit: int = 50, sort_by: str = "confluence_score"):
    """Returns top ranked liquid stocks with confluence scores, win rates, and 60-day expectancies."""
    try:
        from app.engine.quant_copilot_engine import quant_copilot_engine
        return {
            "status": "SUCCESS",
            "count": limit,
            "stocks": quant_copilot_engine.list_all_stocks_dna(limit=limit, sort_by=sort_by)
        }
    except Exception as e:
        logger.error(f"Error listing stocks DNA: {e}")
        raise HTTPException(status_code=500, detail=str(e))

