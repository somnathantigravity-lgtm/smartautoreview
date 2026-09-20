from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import logging
from app.engine.dhan_trade_service import dhan_trade_service

logger = logging.getLogger(__name__)
router = APIRouter()

class DhanCredentialsRequest(BaseModel):
    client_id: Optional[str] = None
    access_token: Optional[str] = None
    auto_sl2_breakeven: Optional[bool] = True

class BuyOrderRequest(BaseModel):
    symbol: str
    company_name: Optional[str] = ""
    bse_scrip: Optional[str] = ""
    quantity: int
    price: float
    stop_loss_1: Optional[float] = 0.0
    conditional_stop_2: Optional[float] = 0.0
    stop_loss_2: Optional[float] = 0.0
    target_price: Optional[float] = 0.0
    product_type: str = "INTRADAY"
    order_type: str = "LIMIT"
    has_target: Optional[bool] = True
    has_stop_loss: Optional[bool] = True

class SquareOffRequest(BaseModel):
    position_id: str
    symbol: Optional[str] = ""
    quantity: Optional[int] = None

class CancelOrderRequest(BaseModel):
    order_id: str

@router.get("/trade/status")
def get_trade_status():
    """Returns broker connectivity status, account balance, and margin."""
    return dhan_trade_service.verify_connection()

@router.post("/trade/settings")
def update_trade_settings(payload: DhanCredentialsRequest):
    """Updates and saves Dhan Client ID & Access Token, then tests connection."""
    return dhan_trade_service.save_credentials(payload.client_id, payload.access_token)

@router.post("/trade/order")
def place_order(payload: BuyOrderRequest):
    """Places Buy order with optional Target and Stop Loss."""
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1.")
    if payload.price <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than zero.")
    
    # Check opt-out flags
    effective_sl = (payload.stop_loss_1 or 0.0) if payload.has_stop_loss is not False else 0.0
    effective_tgt = (payload.target_price or 0.0) if payload.has_target is not False else 0.0
    
    try:
        res = dhan_trade_service.place_buy_order(
            symbol=payload.symbol,
            company_name=payload.company_name,
            bse_scrip=payload.bse_scrip,
            quantity=payload.quantity,
            price=payload.price,
            stop_loss_1=effective_sl,
            conditional_stop_2=payload.conditional_stop_2 or payload.stop_loss_2 or 0.0,
            target_price=effective_tgt,
            product_type=payload.product_type,
            order_type=payload.order_type
        )
        return res
    except RuntimeError as re:
        logger.error(f"Dhan order placement failed: {re}")
        raise HTTPException(status_code=400, detail=str(re))
    except Exception as ex:
        logger.error(f"Dhan order placement unexpected error: {ex}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Trading error: {str(ex)}")

@router.get("/trade/positions")
def get_positions():
    """Returns live open positions with real-time tentative P&L."""
    positions = dhan_trade_service.get_open_positions()
    total_unrealized_pnl = sum(p.get("unrealized_pnl", 0.0) for p in positions)
    total_invested = sum(p.get("invested_amount", 0.0) for p in positions)
    total_current_value = sum(p.get("current_value", 0.0) for p in positions)
    
    return {
        "status": "SUCCESS",
        "positions": positions,
        "summary": {
            "open_count": len(positions),
            "total_unrealized_pnl": round(total_unrealized_pnl, 2),
            "total_unrealized_pnl_pct": round((total_unrealized_pnl / total_invested * 100), 2) if total_invested > 0 else 0.0,
            "total_invested": round(total_invested, 2),
            "total_current_value": round(total_current_value, 2)
        }
    }

@router.post("/trade/squareoff")
def square_off(payload: SquareOffRequest):
    """Squares off/sells an active position."""
    res = dhan_trade_service.square_off_position(payload.position_id, payload.quantity)
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res

@router.get("/trade/orders")
def get_orders():
    """Returns all placed orders."""
    orders = dhan_trade_service.get_orders()
    return {
        "status": "SUCCESS",
        "orders": orders,
        "total_count": len(orders)
    }

@router.post("/trade/order/cancel")
def cancel_order(payload: CancelOrderRequest):
    """Cancels a pending order directly on Dhan exchange."""
    if not payload.order_id:
        raise HTTPException(status_code=400, detail="Order ID is required.")
    try:
        res = dhan_trade_service.cancel_order(payload.order_id)
        return res
    except RuntimeError as re:
        raise HTTPException(status_code=400, detail=str(re))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Failed to cancel order: {str(ex)}")

@router.get("/trade/holdings")
def get_holdings():
    """Returns demat holdings portfolio."""
    holdings = dhan_trade_service.get_holdings()
    total_invested = sum(h.get("invested_amount", 0.0) for h in holdings)
    total_current = sum(h.get("current_value", 0.0) for h in holdings)
    total_pnl = sum(h.get("total_pnl", 0.0) for h in holdings)
    total_day_pnl = sum(h.get("day_pnl", 0.0) for h in holdings)

    return {
        "status": "SUCCESS",
        "holdings": holdings,
        "summary": {
            "total_invested": round(total_invested, 2),
            "total_current_value": round(total_current, 2),
            "total_pnl": round(total_pnl, 2),
            "total_pnl_pct": round((total_pnl / total_invested * 100), 2) if total_invested > 0 else 0.0,
            "total_day_pnl": round(total_day_pnl, 2)
        }
    }

@router.get("/trade/ip-status")
def get_dhan_ip_status():
    """Returns current outbound public IP and Dhan IP match / ordersAllowed status."""
    try:
        from app.engine.dhan_ip_service import dhan_ip_service
        return dhan_ip_service.check_and_sync_ip(force=False)
    except Exception as e:
        logger.error(f"Error checking Dhan IP status: {e}")
        return {"status": "ERROR", "message": str(e), "ordersAllowed": False}

@router.post("/trade/sync-ip")
def force_sync_dhan_ip():
    """Forces an immediate check and auto-sync of current public IP to Dhan."""
    try:
        from app.engine.dhan_ip_service import dhan_ip_service
        return dhan_ip_service.check_and_sync_ip(force=True)
    except Exception as e:
        logger.error(f"Error syncing Dhan IP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

