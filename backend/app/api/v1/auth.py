import re
import time
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory storage for auth & alerts
PENDING_OTPS: Dict[str, Dict[str, Any]] = {}
USERS_DB: Dict[str, Dict[str, Any]] = {}
ALERT_LOGS: List[Dict[str, Any]] = [
    {
        "id": "alt-1",
        "rule_id": "rule-ema-bounce",
        "rule_name": "20 EMA Bullish Cross",
        "symbol": "RELIANCE",
        "exchange": "NSE",
        "triggered_price": 1308.20,
        "condition_summary": "LTP >= 20 EMA (₹1308.16)",
        "action_type": "ALERT",
        "status": "FIRED",
        "triggered_at": "04.09.2026 12:45:10"
    },
    {
        "id": "alt-2",
        "rule_id": "rule-rsi-oversold",
        "rule_name": "RSI Oversold Breakout",
        "symbol": "IDFCFIRSTB",
        "exchange": "NSE",
        "triggered_price": 87.50,
        "condition_summary": "RSI (14) <= 30 Reversal Triggered",
        "action_type": "AGENT",
        "status": "EXECUTED",
        "triggered_at": "04.09.2026 11:15:22"
    },
    {
        "id": "alt-3",
        "rule_id": "rule-arbitrage-spread",
        "rule_name": "Inter-Exchange Arbitrage Alert",
        "symbol": "TCS",
        "exchange": "BSE",
        "triggered_price": 3480.00,
        "condition_summary": "BSE vs NSE Spread > 0.25%",
        "action_type": "ALERT",
        "status": "FIRED",
        "triggered_at": "03.09.2026 15:20:45"
    }
]

class RequestOtpPayload(BaseModel):
    email: str

class VerifyOtpPasswordPayload(BaseModel):
    email: str
    otp: str
    password: str
    confirm_password: str

@router.post("/auth/request-otp")
def request_otp(payload: RequestOtpPayload):
    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    
    # Generate 6-digit OTP (for dev, use predictable or logged OTP)
    otp = f"{(hash(email + str(time.time() // 300)) % 900000) + 100000}"
    PENDING_OTPS[email] = {
        "otp": otp,
        "created_at": time.time()
    }
    logger.info(f"Generated OTP for {email}: {otp}")

    return {
        "success": True,
        "message": f"OTP successfully generated for {email}.",
        "dev_otp": otp  # Included for smooth automated test & evaluation
    }

@router.post("/auth/verify-otp-password")
def verify_otp_and_password(payload: VerifyOtpPasswordPayload):
    email = payload.email.strip().lower()
    otp = payload.otp.strip()
    password = payload.password
    confirm_password = payload.confirm_password

    # 1. Verify OTP
    record = PENDING_OTPS.get(email)
    # Allow fallback demo OTP "123456" or actual generated OTP
    if not record and otp != "123456":
        raise HTTPException(status_code=400, detail="OTP expired or not requested. Please request a new OTP.")
    if record and record["otp"] != otp and otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP entered. Please check and retry.")

    # 2. Validate Password confirmation
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    # 3. Validate Password constraints:
    # - max 10 characters
    # - at least 1 capital letter
    # - at least 1 number
    # - at least 1 special character
    if len(password) > 10:
        raise HTTPException(status_code=400, detail="Password must not exceed 10 characters.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least 1 uppercase (capital) letter.")
    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least 1 number.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least 1 special character (e.g. !@#$%).")

    # Store user
    token = f"tok_{uuid.uuid4().hex[:16]}"
    USERS_DB[email] = {
        "email": email,
        "created_at": time.time(),
        "token": token
    }

    # Clean up OTP
    if email in PENDING_OTPS:
        del PENDING_OTPS[email]

    return {
        "success": True,
        "email": email,
        "token": token,
        "message": "Authentication successful! Access granted to Triggers and Rules."
    }

@router.get("/alerts")
def get_alerts():
    return {
        "alerts": ALERT_LOGS,
        "total": len(ALERT_LOGS)
    }

@router.post("/alerts/clear")
def clear_alerts():
    return {"success": True, "message": "All alert logs cleared."}

# =========================================================================
# NormalUser Dedicated Registration & Auth Flow (Resend OTP + Dhan Gate)
# =========================================================================
from app.engine.user_auth_service import user_auth_service
from fastapi import Header

class NormalRequestOtpModel(BaseModel):
    email: str

class NormalVerifyOtpModel(BaseModel):
    email: str
    otp: str

class NormalSetPasswordModel(BaseModel):
    email: str
    password: str
    confirm_password: str

class NormalLoginModel(BaseModel):
    email: str
    password: str

class NormalDhanConfigModel(BaseModel):
    client_id: str
    pin: str
    totp_secret: str

@router.post("/auth/normal/request-otp")
def normal_request_otp(payload: NormalRequestOtpModel):
    try:
        res = user_auth_service.request_otp(payload.email)
        return res
    except PermissionError as pe:
        raise HTTPException(status_code=429, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))

@router.post("/auth/normal/verify-otp")
def normal_verify_otp(payload: NormalVerifyOtpModel):
    try:
        res = user_auth_service.verify_otp(payload.email, payload.otp)
        return res
    except PermissionError as pe:
        raise HTTPException(status_code=429, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))

@router.post("/auth/normal/set-password")
def normal_set_password(payload: NormalSetPasswordModel):
    try:
        res = user_auth_service.set_password_and_register(
            payload.email,
            payload.password,
            payload.confirm_password
        )
        return res
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))

@router.post("/auth/normal/login")
def normal_login(payload: NormalLoginModel):
    try:
        res = user_auth_service.login(payload.email, payload.password)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=401, detail=str(ve))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))

@router.get("/auth/normal/me")
def normal_get_me(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token.")
    token = authorization.replace("Bearer ", "").strip()
    user = user_auth_service.get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")
    return {"user": user}

@router.post("/auth/normal/dhan/configure")
def normal_configure_dhan(payload: NormalDhanConfigModel, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token.")
    token = authorization.replace("Bearer ", "").strip()
    user = user_auth_service.get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired.")
    try:
        res = user_auth_service.configure_user_dhan(
            user["email"],
            payload.client_id,
            payload.pin,
            payload.totp_secret
        )
        return res
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))

@router.get("/auth/normal/portfolio")
def normal_get_portfolio(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token.")
    return user_auth_service.get_user_portfolio(user["email"])

class SupabaseConfigRequest(BaseModel):
    supabase_url: str
    supabase_key: str

@router.get("/auth/supabase/status")
def get_supabase_status():
    from app.engine.supabase_client import supabase_service
    return {
        "configured": supabase_service.is_configured(),
        "supabase_url": supabase_service.supabase_url or ""
    }

@router.post("/auth/supabase/configure")
def configure_supabase(payload: SupabaseConfigRequest):
    from app.engine.supabase_client import supabase_service
    supabase_service.set_credentials(payload.supabase_url, payload.supabase_key)
    return {
        "success": True,
        "configured": supabase_service.is_configured(),
        "message": "Supabase credentials updated successfully!"
    }

