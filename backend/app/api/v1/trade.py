from fastapi import APIRouter, HTTPException, Query, Header
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import logging
from app.engine.dhan_trade_service import dhan_trade_service, get_user_trade_service
from app.engine.user_auth_service import user_auth_service

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

def _get_active_trade_service(authorization: Optional[str] = None):
    """
    Strict security resolver:
    1. If user provides a Bearer token (NormalUser), strictly use THEIR Dhan credentials.
       If their Dhan account is not configured, raise 400 immediately. Never bleed into Admin account.
    2. If no token (SuperUser Terminal on localhost) or admin token, use the Admin/System trade service.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        user = user_auth_service.get_user_from_token(token)
        if user and user.get("email"):
            email = user["email"].strip().lower()
            try:
                return get_user_trade_service(email)
            except RuntimeError as re:
                raise HTTPException(status_code=400, detail=str(re))
    return dhan_trade_service

@router.get("/trade/status")
def get_trade_status(authorization: Optional[str] = Header(None)):
    """Returns broker connectivity status, account balance, and margin."""
    svc = _get_active_trade_service(authorization)
    return svc.verify_connection()

@router.post("/trade/settings")
def update_trade_settings(payload: DhanCredentialsRequest, authorization: Optional[str] = Header(None)):
    """Updates and saves Dhan Client ID & Access Token, then tests connection."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        user = user_auth_service.get_user_from_token(token)
        if user and user.get("email") and payload.client_id and payload.access_token:
            email = user["email"].strip().lower()
            user_auth_service.users.setdefault(email, {})
            user_auth_service.users[email].setdefault("dhan", {})
            user_auth_service.users[email]["dhan"]["configured"] = True
            user_auth_service.users[email]["dhan"]["client_id"] = payload.client_id.strip()
            user_auth_service.users[email]["dhan"]["access_token"] = payload.access_token.strip()
            user_auth_service._save_users()
            svc = get_user_trade_service(email)
            return svc.verify_connection()

    return dhan_trade_service.save_credentials(payload.client_id, payload.access_token)

@router.post("/trade/order")
def place_order(payload: BuyOrderRequest, authorization: Optional[str] = Header(None)):
    """Places Buy order with optional Target and Stop Loss on user's own Dhan account."""
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1.")
    if payload.price <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than zero.")
    
    svc = _get_active_trade_service(authorization)

    # Check opt-out flags
    effective_sl = (payload.stop_loss_1 or 0.0) if payload.has_stop_loss is not False else 0.0
    effective_tgt = (payload.target_price or 0.0) if payload.has_target is not False else 0.0
    
    try:
        res = svc.place_buy_order(
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
def get_positions(authorization: Optional[str] = Header(None)):
    """Returns live open positions with real-time tentative P&L."""
    svc = _get_active_trade_service(authorization)
    positions = svc.get_open_positions()
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
def square_off(payload: SquareOffRequest, authorization: Optional[str] = Header(None)):
    """Squares off/sells an active position."""
    svc = _get_active_trade_service(authorization)
    res = svc.square_off_position(payload.position_id, payload.quantity)
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res

@router.get("/trade/orders")
def get_orders(authorization: Optional[str] = Header(None)):
    """Returns all placed orders."""
    svc = _get_active_trade_service(authorization)
    orders = svc.get_orders()
    return {
        "status": "SUCCESS",
        "orders": orders,
        "total_count": len(orders)
    }

@router.post("/trade/order/cancel")
def cancel_order(payload: CancelOrderRequest, authorization: Optional[str] = Header(None)):
    """Cancels a pending order directly on Dhan exchange."""
    if not payload.order_id:
        raise HTTPException(status_code=400, detail="Order ID is required.")
    svc = _get_active_trade_service(authorization)
    try:
        res = svc.cancel_order(payload.order_id)
        return res
    except RuntimeError as re:
        raise HTTPException(status_code=400, detail=str(re))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Failed to cancel order: {str(ex)}")

@router.get("/trade/holdings")
def get_holdings(authorization: Optional[str] = Header(None)):
    """Returns demat holdings portfolio."""
    svc = _get_active_trade_service(authorization)
    holdings = svc.get_holdings()
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

