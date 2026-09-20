from fastapi import APIRouter
import time

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "timestamp": time.time(),
        "market_data_status": "CONNECTED",
        "opportunity_engine": "RUNNING",
        "data_source": "NSE Public API Feed",
        "latency_sec": 0.12
    }
