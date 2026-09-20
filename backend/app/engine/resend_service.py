import os
import json
import time
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "resend_config.json")

class ResendService:
    def __init__(self):
        self.api_key: str = ""
        self.from_email: str = "onboarding@resend.dev"
        self._load_config()

    def _load_config(self):
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r") as f:
                    data = json.load(f)
                    self.api_key = str(data.get("api_key", "")).strip()
                    self.from_email = str(data.get("from_email", "onboarding@resend.dev")).strip()
            except Exception as e:
                logger.error(f"Error loading Resend config: {e}")

    def save_config(self, api_key: str, from_email: Optional[str] = None) -> Dict[str, Any]:
        self.api_key = api_key.strip()
        if from_email:
            self.from_email = from_email.strip()
        try:
            with open(CONFIG_FILE, "w") as f:
                json.dump({
                    "api_key": self.api_key,
                    "from_email": self.from_email,
                    "updated_at": time.time()
                }, f, indent=2)
            logger.info("Resend API config saved successfully.")
        except Exception as e:
            logger.error(f"Error saving Resend config: {e}")
            raise e
        return self.get_status()

    def get_status(self) -> Dict[str, Any]:
        masked = ""
        if self.api_key:
            if len(self.api_key) > 8:
                masked = f"{self.api_key[:5]}...{self.api_key[-4:]}"
            else:
                masked = "••••••••"
        return {
            "configured": bool(self.api_key),
            "masked_key": masked,
            "from_email": self.from_email
        }

    def send_email(self, to_email: str, subject: str, html_content: str) -> Dict[str, Any]:
        """
        Sends an email using Resend.com API (POST https://api.resend.com/emails).
        Falls back to logged OTP in dev mode if API key is not configured.
        """
        if not self.api_key:
            logger.warning(f"Resend API key not configured. Mock sending email to {to_email}: {subject}")
            return {
                "success": True,
                "mock": True,
                "message": f"Resend API key not configured. Email logged in server console for {to_email}."
            }

        payload = {
            "from": f"APEX Equities <{self.from_email}>",
            "to": [to_email.strip().lower()],
            "subject": subject,
            "html": html_content
        }

        try:
            data_bytes = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                "https://api.resend.com/emails",
                data=data_bytes,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                resp_data = json.loads(response.read().decode("utf-8"))
                logger.info(f"Resend email sent successfully to {to_email}. ID: {resp_data.get('id')}")
                return {
                    "success": True,
                    "id": resp_data.get("id"),
                    "message": f"Verification email sent to {to_email}."
                }
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            logger.error(f"Resend API HTTP error {e.code}: {err_body}")
            try:
                err_json = json.loads(err_body)
                err_msg = err_json.get("message") or err_body
            except Exception:
                err_msg = err_body
            if "domain is not verified" in err_msg.lower():
                raise RuntimeError(
                    f"Resend Error: The sender domain '{self.from_email.split('@')[-1]}' is not verified in Resend. "
                    f"Please either use 'onboarding@resend.dev' (pre-verified test sender) or add & verify your custom domain on https://resend.com/domains."
                )
            raise RuntimeError(f"Resend Error: {err_msg}")
        except Exception as ex:
            logger.error(f"Resend email exception: {ex}")
            raise RuntimeError(f"Failed to send email: {ex}")

    def send_otp_email(self, to_email: str, otp: str) -> Dict[str, Any]:
        subject = f"{otp} is your APEX Equities Verification Code"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 30px; }}
            .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
            .logo {{ font-size: 20px; font-weight: 800; color: #1e293b; margin-bottom: 24px; letter-spacing: -0.5px; }}
            .logo span {{ color: #2563eb; }}
            .heading {{ font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }}
            .text {{ font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }}
            .otp-box {{ background: #f1f5f9; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; }}
            .otp-code {{ font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #0f172a; font-family: monospace; }}
            .footer {{ font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 18px; margin-top: 24px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">APEX <span>EQUITIES</span></div>
            <div class="heading">Verify Your Account</div>
            <p class="text">Please enter the following 6-digit verification code to complete your registration or login on APEX Equities Terminal.</p>
            <div class="otp-box">
              <div class="otp-code">{otp}</div>
            </div>
            <p class="text" style="font-size: 12px; color: #64748b;">This code is valid for 10 minutes. If you did not request this verification code, please ignore this email.</p>
            <div class="footer">
              &copy; 2026 APEX Equities Dalal Street Terminal. All rights reserved.
            </div>
          </div>
        </body>
        </html>
        """
        return self.send_email(to_email, subject, html)

resend_service = ResendService()
