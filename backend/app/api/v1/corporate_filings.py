from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, Optional

from app.engine.corporate_filings_db import corporate_filings_db
from app.engine.corporate_filings_ingestion import corporate_filings_ingestion

router = APIRouter()

@router.get("/corporate-filings/status")
def get_filings_status() -> Dict[str, Any]:
    """Returns the operational status of the auto-update filings database and ingestion worker."""
    return corporate_filings_db.get_sync_status()

@router.post("/corporate-filings/sync")
def trigger_bulk_sync(
    days_back: int = Query(45, ge=1, le=120, description="Number of days of announcements to scan")
) -> Dict[str, Any]:
    """Manually triggers a sync against BSE India and NSE SEBI LODR announcements."""
    return corporate_filings_ingestion.sync_latest_filings(days_back=days_back)

@router.post("/corporate-filings/sync/{symbol}")
def trigger_symbol_sync(symbol: str) -> Dict[str, Any]:
    """Instantly syncs and guarantees the latest quarterly financial results for an individual company."""
    res = corporate_filings_ingestion.sync_symbol_filings(symbol)
    # Clear company financials cache for this symbol so new statements reflect immediately
    try:
        from app.engine.company_financials import company_financials_provider
        sym = symbol.upper().strip()
        keys_to_delete = [k for k in company_financials_provider._cache if k.startswith(sym)]
        for k in keys_to_delete:
            del company_financials_provider._cache[k]
    except Exception:
        pass
    return res
