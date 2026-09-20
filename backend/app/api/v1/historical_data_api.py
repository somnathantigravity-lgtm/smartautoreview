from fastapi import APIRouter, Query, HTTPException, Body
from typing import Optional, List, Dict, Any
from app.engine.historical_batch_engine import historical_batch_engine
from app.engine.auditable_parameters_engine import auditable_params_worker
from app.engine.incremental_tape_engine import incremental_tape_engine

router = APIRouter()

@router.get("/historical-data/tape-metrics")
def get_tape_metrics():
    """Returns verified metrics for the self-sustaining, auto-expanding tape."""
    return incremental_tape_engine.get_tape_metrics()

@router.post("/historical-data/incremental-audit")
def run_incremental_audit():
    """Runs a 100% local incremental audit on newly added candles. Zero Dhan REST API hits."""
    return incremental_tape_engine.run_local_incremental_audit()

@router.get("/historical-data/compute-parameters/status")
def get_compute_parameters_status():
    """Returns status and progress of the 12 Auditable Parameters computation worker."""
    return auditable_params_worker.get_status()

@router.post("/historical-data/compute-parameters/start")
def start_compute_parameters():
    """Starts background computation of the 12 Auditable Parameters for all synced stocks."""
    return auditable_params_worker.start()

@router.post("/historical-data/compute-parameters/pause")
def pause_compute_parameters():
    """Pauses background computation of auditable parameters."""
    return auditable_params_worker.pause()

@router.post("/historical-data/compute-parameters/resume")
def resume_compute_parameters():
    """Resumes background computation of auditable parameters."""
    return auditable_params_worker.resume()

@router.get("/historical-data/status")
def get_sync_status():
    """Returns real-time background worker status, progress %, candle counts, and ETA."""
    return historical_batch_engine.get_status()

@router.post("/historical-data/start")
def start_sync(payload: Dict[str, Any] = Body(default={})):
    """Starts the 60-day historical data ingestion daemon (mode: 'TOP_100', 'BSE', 'FULL')."""
    mode = payload.get("mode", "FULL")
    return historical_batch_engine.start(mode=mode)

@router.post("/historical-data/start-bse")
def start_bse_sync():
    """Starts the 60-day historical data ingestion daemon specifically for BSE equities."""
    return historical_batch_engine.start(mode="BSE")

@router.post("/historical-data/pause")
def pause_sync():
    """Safely pauses background ingestion queue."""
    return historical_batch_engine.pause()

@router.post("/historical-data/resume")
def resume_sync():
    """Resumes background ingestion from current checkpoint."""
    return historical_batch_engine.resume()

@router.post("/historical-data/sync-remaining-32")
def sync_remaining_32():
    """Immediately completes the 32 dual-listed equities on NSE & BSE."""
    return historical_batch_engine.sync_remaining_32()

@router.post("/historical-data/sync-stock/{symbol}")
def sync_individual_stock(symbol: str):
    """Immediately synchronizes 60 days of 1-minute candles for a specific stock."""
    res = historical_batch_engine.sync_single_stock(symbol)
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=400, detail=res.get("message", "Sync failed"))
    return res

@router.get("/historical-data/universe")
def get_universe(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: str = Query("", description="Symbol, Company Name or Sector"),
    status: str = Query("ALL", description="ALL, SYNCED, PENDING, IN_PROGRESS, FAILED"),
    exchange: str = Query("ALL", description="ALL, NSE, BSE, or BOTH"),
    target_pct: float = Query(1.0, ge=0.1, le=10.0, description="Dynamic Target %"),
    stop_loss_pct: float = Query(0.5, ge=0.1, le=10.0, description="Dynamic Stop Loss %"),
    trend: str = Query("ALL", description="ALL, STRONG, BALANCED, CHOP"),
    squeeze: str = Query("ALL", description="ALL, YES, NO"),
    volume_dryup: str = Query("ALL", description="ALL, HIGH_DROP, NORMAL"),
    setup_quality: str = Query("ALL", description="ALL, PRIME, MID, LOW")
):
    """
    Returns paginated universe equities with server-side filtering for
    movement style (trend persistence), 7-day squeeze (NR7), volume dry-up,
    and audited setup quality score.
    """
    return historical_batch_engine.get_universe(
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        exchange=exchange,
        target_pct=target_pct,
        stop_loss_pct=stop_loss_pct,
        trend=trend,
        squeeze=squeeze,
        volume_dryup=volume_dryup,
        setup_quality=setup_quality
    )

@router.get("/historical-data/candles/{symbol}")
def get_candles(
    symbol: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=10, le=500),
    date_filter: Optional[str] = Query(None, description="Optional DD.MM.YYYY or YYYY-MM-DD filter"),
    exchange: Optional[str] = Query(None, description="Optional NSE or BSE candle filter"),
    fetch_all: bool = Query(False, description="Set true to export all candles")
):
    """Returns raw 1-minute OHLCV candles with complete pagination, exchange filter, or full export."""
    res = historical_batch_engine.get_stock_candles(
        symbol,
        page=page,
        page_size=page_size,
        date_filter=date_filter,
        exchange=exchange,
        fetch_all=fetch_all
    )
    return {
        "symbol": symbol.upper(),
        "total": res["total"],
        "page": res["page"],
        "page_size": res["page_size"],
        "total_pages": res["total_pages"],
        "date_filter": date_filter,
        "exchange": exchange,
        "candles": res["candles"]
    }


@router.get("/historical-data/daily-ingest/status")
def get_daily_ingest_status(date_str: Optional[str] = Query(None)):
    """Returns post-4pm unlock status, completion %, and resume status for today's market tape."""
    from app.engine.daily_tape_ingest_service import daily_tape_service
    return daily_tape_service.get_ingest_status(target_date=date_str)


@router.post("/historical-data/daily-ingest/start")
def start_daily_ingest(payload: Dict[str, Any] = Body(default={})):
    """Starts or resumes daily market tape ingestion via Dhan API for remaining uncollected stocks."""
    from app.engine.daily_tape_ingest_service import daily_tape_service
    date_str = payload.get("date_str")
    return daily_tape_service.start_ingest(target_date=date_str)


@router.post("/historical-data/daily-ingest/pause")
def pause_daily_ingest(payload: Dict[str, Any] = Body(default={})):
    """Pauses daily tape ingestion."""
    from app.engine.daily_tape_ingest_service import daily_tape_service
    return daily_tape_service.pause_ingest()


@router.post("/historical-data/daily-ingest/clean-today")
def clean_today_tape(payload: Dict[str, Any] = Body(default={})):
    """Cleans test candles for today before fresh Dhan API ingestion."""
    from app.engine.daily_tape_ingest_service import daily_tape_service
    from datetime import datetime, timezone, timedelta
    ist = timezone(timedelta(hours=5, minutes=30))
    date_str = payload.get("date_str") or datetime.now(ist).strftime("%Y-%m-%d")
    deleted = daily_tape_service.clean_test_candles(date_str)
    return {"success": True, "deleted": deleted, "date_str": date_str}


@router.get("/historical-data/daily-ingest/pending-dates")
def get_pending_trading_dates():
    """Returns list of past un-ingested weekdays that need historical tape catchup."""
    from app.engine.daily_tape_ingest_service import daily_tape_service
    pending = daily_tape_service.get_pending_trading_dates()
    return {"pending_dates": pending, "count": len(pending)}


@router.post("/historical-data/daily-ingest/catchup")
def start_catchup_ingest():
    """Sequentially backfills all pending missing dates and triggers auditable parameter re-computation."""
    from app.engine.daily_tape_ingest_service import daily_tape_service
    return daily_tape_service.start_catchup()


@router.get("/historical-data/daily-ingest/daemon-status")
def get_auto_daemon_status():
    """Returns the operational status of the autonomous 16:15 IST background daemon."""
    from app.engine.auto_tape_daemon import auto_tape_daemon
    return auto_tape_daemon.get_status()



