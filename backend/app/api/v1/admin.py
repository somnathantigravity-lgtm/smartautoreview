from fastapi import APIRouter, HTTPException
from app.models.schemas import CostRuleUpdateModel, CustomCostRuleAddModel, DhanConnectModel, XKiroConnectModel, DhanTOTPConfigureModel
from app.engine.cost_engine import cost_engine
from app.engine.dhan_provider import dhan_provider
from app.engine.xkiro_client import xkiro_client

router = APIRouter()

# --- xKiro.com AI Gateway Endpoints ---
@router.get("/admin/xkiro/status")
def get_xkiro_status():
    return xkiro_client.get_status()

@router.get("/admin/xkiro/models")
def get_xkiro_models():
    models = xkiro_client.get_available_models()
    return {"models": models, "count": len(models)}

@router.post("/admin/xkiro/connect")
def connect_xkiro(body: XKiroConnectModel):
    res = xkiro_client.set_credentials(
        api_key=body.api_key,
        model=body.model or "gpt-4o",
        base_url=body.custom_base_url or "https://api.xkiro.com/v1"
    )
    return res

@router.post("/admin/xkiro/disconnect")
def disconnect_xkiro():
    return xkiro_client.disconnect()

@router.post("/admin/xkiro/test")
def test_xkiro(body: XKiroConnectModel):
    res = xkiro_client.test_connection(
        api_key=body.api_key,
        model=body.model or "gpt-4o",
        base_url=body.custom_base_url or "https://api.xkiro.com/v1"
    )
    return res

# --- DhanHQ Broker Endpoints ---
@router.get("/admin/dhan/status")
def get_dhan_status():
    return dhan_provider.get_connection_status()

@router.post("/admin/dhan/connect")
def connect_dhan(body: DhanConnectModel):
    result = dhan_provider.connect(body.client_id, body.access_token)
    return result

@router.post("/admin/dhan/disconnect")
def disconnect_dhan():
    dhan_provider.disconnect()
    return {"success": True, "message": "Disconnected from direct market feed. Switched to offline demo mode."}

# --- DhanHQ Automated Daily TOTP Login ---
@router.get("/admin/dhan/totp/status")
def get_dhan_totp_status():
    from app.engine.dhan_totp_auth import dhan_totp_service
    return dhan_totp_service.get_status()

@router.post("/admin/dhan/totp/configure")
def configure_dhan_totp(body: DhanTOTPConfigureModel):
    from app.engine.dhan_totp_auth import dhan_totp_service
    # 1. Test token generation immediately
    res = dhan_totp_service.request_access_token(body.client_id, body.pin, body.totp_secret)
    if not res.get("success"):
        return {
            "success": False,
            "error": res.get("error", "Failed to generate token with provided credentials.")
        }

    # 2. Save credentials since test succeeded
    dhan_totp_service.save_config(body.client_id, body.pin, body.totp_secret)

    # 3. Connect live feed with the newly generated token
    token = res["access_token"]
    cid = res["client_id"]
    conn_res = dhan_provider.connect(cid, token)

    # 4. Connect and save trading execution service with the same token
    trading_connected = False
    try:
        from app.engine.dhan_trade_service import dhan_trade_service
        trade_res = dhan_trade_service.save_credentials(cid, token)
        trading_connected = trade_res.get("connected", False)
    except Exception as e_trade:
        logger.warning(f"Could not connect trade service: {e_trade}")

    # 5. Automatically register and sync outbound public IP to Dhan
    ip_res = {}
    try:
        from app.engine.dhan_ip_service import dhan_ip_service
        ip_res = dhan_ip_service.check_and_sync_ip(force=True)
    except Exception as e_ip:
        logger.warning(f"Could not auto-sync IP: {e_ip}")

    # 6. Ensure background morning scheduler is running
    dhan_totp_service.start_morning_scheduler()

    return {
        "success": True,
        "message": f"Dhan TOTP Auto-Login enabled! Live Feed & Trading Connected, IP Registered ({ip_res.get('currentIP', '')}).",
        "client_id": cid,
        "live_feed_connected": conn_res.get("success", False),
        "trading_connected": trading_connected,
        "ip_status": ip_res
    }

@router.post("/admin/dhan/totp/refresh-now")
def refresh_dhan_totp_now():
    from app.engine.dhan_totp_auth import dhan_totp_service
    if not dhan_totp_service.is_configured():
        raise HTTPException(status_code=400, detail="TOTP credentials not configured. Please save your Client ID, PIN, and TOTP Secret first.")
    
    res = dhan_totp_service.renew_and_connect()
    return res


# --- Indian Market Statutory Cost Rules Endpoints ---
@router.get("/admin/cost-rules")
def get_cost_rules():
    return {
        "rules": cost_engine.get_all_rules()
    }

@router.post("/admin/cost-rules/update")
def update_cost_rule(body: CostRuleUpdateModel):
    updates = {}
    if body.rate is not None: updates["rate"] = body.rate
    if body.fixed_amount is not None: updates["fixed_amount"] = body.fixed_amount
    if body.is_active is not None: updates["is_active"] = body.is_active
    
    cost_engine.update_rule(body.rule_id, updates)
    return {
        "message": f"Cost rule '{body.rule_id}' updated successfully",
        "rules": cost_engine.get_all_rules()
    }

@router.post("/admin/cost-rules/add")
def add_custom_cost_rule(body: CustomCostRuleAddModel):
    new_rule = cost_engine.add_custom_rule(
        name=body.name,
        instrument_type=body.instrument_type,
        transaction_side=body.transaction_side,
        calculation_type=body.calculation_type,
        rate=body.rate,
        fixed_amount=body.fixed_amount
    )
    return {
        "message": f"Custom cost item '{new_rule.name}' added successfully",
        "rule": new_rule.__dict__,
        "rules": cost_engine.get_all_rules()
    }

@router.delete("/admin/cost-rules/{rule_id}")
def delete_custom_cost_rule(rule_id: str):
    cost_engine.delete_rule(rule_id)
    return {
        "message": f"Cost rule '{rule_id}' deleted successfully",
        "rules": cost_engine.get_all_rules()
    }

# --- Resend.com Email Delivery API Gateway Endpoints ---
from pydantic import BaseModel
from typing import Optional

class ResendUpdateModel(BaseModel):
    api_key: str
    from_email: Optional[str] = "onboarding@resend.dev"

class ResendTestModel(BaseModel):
    to_email: str

@router.get("/admin/resend/status")
def get_resend_status():
    from app.engine.resend_service import resend_service
    return resend_service.get_status()

@router.post("/admin/resend/update")
def update_resend_settings(body: ResendUpdateModel):
    from app.engine.resend_service import resend_service
    if not body.api_key.strip():
        raise HTTPException(status_code=400, detail="Resend API key cannot be empty.")
    status = resend_service.save_config(body.api_key.strip(), body.from_email.strip() if body.from_email else None)
    return {
        "success": True,
        "message": "Resend API key configured successfully!",
        "status": status
    }

@router.post("/admin/resend/test")
def test_resend_connection(body: ResendTestModel):
    from app.engine.resend_service import resend_service
    if not body.to_email.strip() or "@" not in body.to_email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    try:
        res = resend_service.send_otp_email(body.to_email.strip(), "987654")
        return {
            "success": True,
            "message": f"Test verification email dispatched to {body.to_email} successfully!",
            "details": res
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Admin User Management & Lockout Endpoints ---
@router.get("/admin/users")
def get_all_users_for_admin():
    from app.engine.user_auth_service import user_auth_service
    users = user_auth_service.list_all_users_for_admin()
    return {
        "users": users,
        "total": len(users)
    }

@router.post("/admin/users/{email}/unlock")
def unlock_user_account(email: str):
    from app.engine.user_auth_service import user_auth_service
    res = user_auth_service.unlock_user(email)
    return res

