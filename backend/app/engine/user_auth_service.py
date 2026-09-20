import os
import json
import time
import uuid
import re
import hashlib
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from app.engine.resend_service import resend_service
from app.engine.supabase_client import supabase_service

logger = logging.getLogger(__name__)
IST = timezone(timedelta(hours=5, minutes=30))

USERS_DB_FILE = os.path.join(os.path.dirname(__file__), "..", "..", ".users_db.json")

def hash_password(password: str, salt: Optional[str] = None) -> str:
    if not salt:
        salt = uuid.uuid4().hex
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return f"{salt}${pwd_hash}"

def verify_password(stored_password: str, provided_password: str) -> bool:
    try:
        salt, expected_hash = stored_password.split("$", 1)
        actual_hash = hashlib.pbkdf2_hmac(
            'sha256',
            provided_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()
        return actual_hash == expected_hash
    except Exception:
        return False

class UserAuthService:
    def __init__(self):
        self.users: Dict[str, Dict[str, Any]] = {}
        self.pending_otps: Dict[str, Dict[str, Any]] = {}
        self.sessions: Dict[str, str] = {}  # token -> email
        self._load_users()

    def _load_users(self):
        if os.path.exists(USERS_DB_FILE):
            try:
                with open(USERS_DB_FILE, "r") as f:
                    data = json.load(f)
                    self.users = data.get("users", {})
            except Exception as e:
                logger.error(f"Error loading users DB: {e}")

    def _save_users(self):
        try:
            with open(USERS_DB_FILE, "w") as f:
                json.dump({"users": self.users}, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving users DB: {e}")

    def request_otp(self, email: str) -> Dict[str, Any]:
        email = email.strip().lower()
        if not email or "@" not in email:
            raise ValueError("Please provide a valid email address.")

        now = time.time()
        record = self.pending_otps.get(email, {})

        # Check if currently locked out (3 failed attempts -> 1 hour lockout)
        locked_until = record.get("locked_until", 0)
        if locked_until > now:
            remaining_sec = int(locked_until - now)
            rem_min = remaining_sec // 60
            rem_sec = remaining_sec % 60
            raise PermissionError(
                f"Too many failed OTP attempts. Account is temporarily locked for 1 hour. "
                f"Please try again in {rem_min}m {rem_sec}s."
            )

        # Generate secure 6-digit OTP
        import secrets
        otp = f"{secrets.randbelow(900000) + 100000}"

        # Save pending OTP state preserving attempt count if under limit
        attempts = record.get("attempts", 0) if record.get("locked_until", 0) <= now else 0
        self.pending_otps[email] = {
            "otp": otp,
            "created_at": now,
            "attempts": attempts,
            "locked_until": 0,
            "verified": False
        }

        # Send via Resend.com
        try:
            send_res = resend_service.send_otp_email(email, otp)
        except Exception as e_send:
            logger.error(f"Failed to send email via Resend to {email}: {e_send}")
            raise RuntimeError(str(e_send))

        logger.info(f"Generated OTP for NormalUser {email} and dispatched via Resend.")
        return {
            "success": True,
            "message": f"6-digit verification code sent to {email}. Please check your inbox."
        }

    def verify_otp(self, email: str, otp: str) -> Dict[str, Any]:
        email = email.strip().lower()
        otp = otp.strip()
        now = time.time()

        record = self.pending_otps.get(email)
        if not record:
            raise ValueError("No active verification code found for this email. Please request a code first.")

        # Check lockout
        locked_until = record.get("locked_until", 0)
        if locked_until > now:
            remaining_sec = int(locked_until - now)
            rem_min = remaining_sec // 60
            rem_sec = remaining_sec % 60
            raise PermissionError(
                f"Account locked due to 3 failed attempts. Please retry in {rem_min}m {rem_sec}s."
            )

        # Check expiration (10 minutes)
        if now - record.get("created_at", 0) > 600:
            raise ValueError("Verification code has expired (10-minute limit). Please request a new code.")

        # Validate code strictly against generated OTP
        if record["otp"] != otp:
            attempts = record.get("attempts", 0) + 1
            record["attempts"] = attempts
            remaining_attempts = max(0, 3 - attempts)

            if attempts >= 3:
                # Lock out for 1 hour (3600 seconds)
                record["locked_until"] = now + 3600
                raise PermissionError(
                    "3 failed verification attempts. Account is locked for 1 hour for your security."
                )

            raise ValueError(
                f"Invalid verification code. {remaining_attempts} attempt(s) remaining before a 1-hour account lockout."
            )

        # Successful verification
        record["verified"] = True
        record["attempts"] = 0
        record["locked_until"] = 0

        # Check if user already exists
        user_exists = email in self.users

        return {
            "success": True,
            "email": email,
            "user_exists": user_exists,
            "message": "Verification code verified successfully."
        }

    def set_password_and_register(self, email: str, password: str, confirm_password: str) -> Dict[str, Any]:
        email = email.strip().lower()
        record = self.pending_otps.get(email)
        if not record or not record.get("verified"):
            raise PermissionError("Please verify your email code first before setting a password.")

        # Password rules validation:
        # 1. Passwords must match
        if password != confirm_password:
            raise ValueError("Passwords do not match. Please re-enter identical passwords.")

        # 2. Max 10 characters
        if len(password) > 10:
            raise ValueError("Password exceeds maximum allowed length of 10 characters.")
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long.")

        # 3. At least 1 capital letter (A-Z)
        if not re.search(r"[A-Z]", password):
            raise ValueError("Password must contain at least 1 uppercase (capital) letter.")

        # 4. At least 1 number (0-9)
        if not re.search(r"[0-9]", password):
            raise ValueError("Password must contain at least 1 number.")

        # 5. At least 1 special character
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_]", password):
            raise ValueError("Password must contain at least 1 special character (e.g. !@#$%).")

        pwd_hash = hash_password(password)
        now_iso = datetime.now(IST).strftime("%d.%m.%Y %H:%M:%S IST")

        # Save or update user
        user_id = self.users.get(email, {}).get("id") or f"usr_{uuid.uuid4().hex[:10]}"
        existing_dhan = self.users.get(email, {}).get("dhan", {})

        self.users[email] = {
            "id": user_id,
            "email": email,
            "password_hash": pwd_hash,
            "role": "normal_user",
            "created_at": self.users.get(email, {}).get("created_at") or now_iso,
            "dhan": existing_dhan
        }
        self._save_users()

        # Clear OTP verification state
        self.pending_otps.pop(email, None)

        # Issue session token
        token = f"tok_norm_{uuid.uuid4().hex}"
        self.sessions[token] = email

        return {
            "success": True,
            "token": token,
            "user": {
                "id": user_id,
                "email": email,
                "role": "normal_user",
                "dhan_configured": bool(existing_dhan.get("configured"))
            },
            "message": "Account registered and password saved successfully!"
        }

    def login(self, email: str, password: str) -> Dict[str, Any]:
        email = email.strip().lower()
        user = self.users.get(email)
        if not user:
            raise ValueError("Account not found. Please register first with your email.")

        if not verify_password(user["password_hash"], password):
            raise ValueError("Incorrect password. Please verify your credentials.")

        token = f"tok_norm_{uuid.uuid4().hex}"
        self.sessions[token] = email

        dhan_info = user.get("dhan", {})
        return {
            "success": True,
            "token": token,
            "user": {
                "id": user["id"],
                "email": email,
                "role": "normal_user",
                "dhan_configured": bool(dhan_info.get("configured"))
            },
            "message": "Signed in successfully!"
        }

    def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        email = self.sessions.get(token)
        if not email or email not in self.users:
            return None
        user = self.users[email]
        return {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "created_at": user.get("created_at", ""),
            "dhan": {
                "configured": bool(user.get("dhan", {}).get("configured")),
                "client_id": user.get("dhan", {}).get("client_id", ""),
                "last_renewed": user.get("dhan", {}).get("last_renewed", "")
            }
        }

    def configure_user_dhan(self, email: str, client_id: str, pin: str, totp_secret: str) -> Dict[str, Any]:
        email = email.strip().lower()
        if email not in self.users:
            raise ValueError("User not found.")

        from app.engine.dhan_totp_auth import dhan_totp_service
        # Generate token using user credentials
        res = dhan_totp_service.request_access_token(client_id, pin, totp_secret)
        if not res.get("success"):
            raise RuntimeError(res.get("error", "Failed to authenticate with Dhan using provided credentials."))

        access_token = res["access_token"]
        cid = res["client_id"]

        # Automatically register outbound IP with Dhan for this user's token
        ip_status = {}
        try:
            from app.engine.dhan_ip_service import dhan_ip_service
            from dhanhq.auth import DhanLogin
            login = DhanLogin(cid)
            detected_ip = dhan_ip_service.get_public_ip()
            try:
                login.set_ip(access_token, detected_ip, "PRIMARY")
            except Exception:
                try:
                    login.set_ip(access_token, detected_ip, "SECONDARY")
                except Exception:
                    pass
            ip_info = login.get_ip(access_token)
            ip_status = ip_info.get("data", {})
        except Exception as e_ip:
            logger.warning(f"Could not auto-sync IP for user {email}: {e_ip}")

        # Store in user profile
        self.users[email]["dhan"] = {
            "configured": True,
            "client_id": cid,
            "pin": pin.strip(),
            "totp_secret": totp_secret.strip(),
            "access_token": access_token,
            "last_renewed": datetime.now(IST).strftime("%d.%m.%Y %H:%M:%S IST")
        }
        self._save_users()

        return {
            "success": True,
            "message": "Dhan broker account connected successfully! Recommendations and Portfolio unlocked.",
            "client_id": cid,
            "orders_allowed": ip_status.get("ordersAllowed", True)
        }

    def get_user_portfolio(self, email: str) -> Dict[str, Any]:
        email = email.strip().lower()
        user = self.users.get(email)
        if not user or not user.get("dhan", {}).get("configured"):
            return {
                "configured": False,
                "cash_balance": 0.0,
                "holdings": [],
                "positions": [],
                "orders": []
            }

        dhan_cfg = user["dhan"]
        cid = dhan_cfg.get("client_id")
        token = dhan_cfg.get("access_token")

        try:
            from dhanhq import dhanhq, DhanContext
            try:
                ctx = DhanContext(cid, token)
                client = dhanhq(ctx)
            except Exception:
                client = dhanhq(cid, token)

            fund_data = client.get_fund_limits()
            funds = fund_data.get("data", {}) if fund_data.get("status") == "success" else {}
            cash_balance = float(funds.get("availabelBalance") or funds.get("cashBalance") or funds.get("sodLimit") or 0.0)

            holdings_res = client.get_holdings()
            holdings = holdings_res.get("data", []) if holdings_res.get("status") == "success" else []

            positions_res = client.get_positions()
            positions = positions_res.get("data", []) if positions_res.get("status") == "success" else []

            orders_res = client.get_order_list()
            orders = orders_res.get("data", []) if orders_res.get("status") == "success" else []

            return {
                "configured": True,
                "client_id": cid,
                "cash_balance": cash_balance,
                "holdings": holdings if isinstance(holdings, list) else [],
                "positions": positions if isinstance(positions, list) else [],
                "orders": orders if isinstance(orders, list) else []
            }
        except Exception as e:
            logger.error(f"Error fetching portfolio for {email}: {e}")
            return {
                "configured": True,
                "client_id": cid,
                "cash_balance": 0.0,
                "holdings": [],
                "positions": [],
                "orders": [],
                "error": str(e)
            }

    # Admin Management Methods
    def list_all_users_for_admin(self) -> List[Dict[str, Any]]:
        res = []
        now = time.time()
        for email, u in self.users.items():
            otp_record = self.pending_otps.get(email, {})
            locked_until = otp_record.get("locked_until", 0)
            is_locked = locked_until > now
            lock_remaining_sec = max(0, int(locked_until - now)) if is_locked else 0

            res.append({
                "id": u.get("id"),
                "email": email,
                "role": u.get("role", "normal_user"),
                "created_at": u.get("created_at", ""),
                "dhan_configured": bool(u.get("dhan", {}).get("configured")),
                "dhan_client_id": u.get("dhan", {}).get("client_id", ""),
                "is_locked": is_locked,
                "lock_remaining_sec": lock_remaining_sec,
                "failed_attempts": otp_record.get("attempts", 0)
            })
        return res

    def unlock_user(self, email: str) -> Dict[str, Any]:
        email = email.strip().lower()
        if email in self.pending_otps:
            self.pending_otps[email]["locked_until"] = 0
            self.pending_otps[email]["attempts"] = 0
            return {"success": True, "message": f"Lockout cleared for {email}. User can now request OTP and sign in."}
        return {"success": True, "message": f"User {email} was not locked out."}

user_auth_service = UserAuthService()
