import os
import time
import json
import logging
import urllib.request
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)
IST = timezone(timedelta(hours=5, minutes=30))

class DhanIPService:
    def __init__(self):
        self.last_check_time = 0
        self.cached_status: Dict[str, Any] = {}

    def get_public_ip(self) -> str:
        """Fetches the current outbound public IPv4 of this machine."""
        services = [
            "https://api.ipify.org",
            "https://ipv4.icanhazip.com",
            "https://checkip.amazonaws.com"
        ]
        for url in services:
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "curl/7.68.0"})
                with urllib.request.urlopen(req, timeout=3) as resp:
                    ip = resp.read().decode("utf-8").strip()
                    if ip and len(ip.split(".")) == 4:
                        return ip
            except Exception:
                continue
        return ""

    def check_and_sync_ip(self, force: bool = False) -> Dict[str, Any]:
        """
        Queries Dhan IP status. If an IP mismatch is detected, automatically
        invokes Dhan's native modify_ip endpoint on the eligible slot (PRIMARY or SECONDARY)
        so that ordersAllowed becomes True.
        """
        now = time.time()
        # Cache for 60 seconds unless forced
        if not force and self.cached_status and (now - self.last_check_time < 60):
            return self.cached_status

        from app.engine.dhan_trade_service import dhan_trade_service
        client_id = dhan_trade_service.client_id
        access_token = dhan_trade_service.access_token

        if not client_id or not access_token:
            return {
                "status": "SKIPPED",
                "message": "Dhan credentials not configured yet.",
                "ordersAllowed": False
            }

        try:
            from dhanhq.auth import DhanLogin
            login = DhanLogin(client_id)
            ip_info = login.get_ip(access_token)

            if not ip_info or ip_info.get("status") != "success":
                logger.warning(f"Failed to fetch Dhan IP status: {ip_info}")
                return {
                    "status": "ERROR",
                    "message": "Could not retrieve IP status from Dhan.",
                    "raw": ip_info
                }

            data = ip_info.get("data", {})
            orders_allowed = bool(data.get("ordersAllowed"))
            ip_match_status = data.get("ipMatchStatus", "")
            detected_ip = data.get("detectedIP") or self.get_public_ip()
            primary_ip = data.get("primaryIP", "")
            secondary_ip = data.get("secondaryIP", "")
            modify_primary = data.get("modifyDatePrimary", "")
            modify_secondary = data.get("modifyDateSecondary", "")

            # If already matched and orders allowed, return success
            if orders_allowed and (ip_match_status in ["PRIMARY_MATCH", "SECONDARY_MATCH"]):
                result = {
                    "status": "SUCCESS",
                    "ipMatchStatus": ip_match_status,
                    "ordersAllowed": True,
                    "currentIP": detected_ip,
                    "primaryIP": primary_ip,
                    "secondaryIP": secondary_ip,
                    "message": f"IP {detected_ip} is active and verified on Dhan."
                }
                self.cached_status = result
                self.last_check_time = now
                return result

            # IP Mismatch! Attempt to auto-sync using set_ip first (which bypasses 6-day cooldown), then modify_ip
            logger.info(f"Dhan IP Mismatch detected! Detected: {detected_ip}, Primary: {primary_ip}, Secondary: {secondary_ip}. Auto-updating...")

            update_success = False
            update_msg = ""

            # Attempt 1: set_ip PRIMARY
            try:
                res_set_p = login.set_ip(access_token, detected_ip, "PRIMARY")
                if res_set_p and res_set_p.get("data", {}).get("status") == "SUCCESS":
                    update_success = True
                    update_msg = f"Successfully registered PRIMARY IP ({detected_ip}) on Dhan."
                    logger.info(update_msg)
            except Exception as e_sp:
                logger.warning(f"Error set_ip PRIMARY: {e_sp}")

            # Attempt 2: set_ip SECONDARY if PRIMARY not set
            if not update_success:
                try:
                    res_set_s = login.set_ip(access_token, detected_ip, "SECONDARY")
                    if res_set_s and res_set_s.get("data", {}).get("status") == "SUCCESS":
                        update_success = True
                        update_msg = f"Successfully registered SECONDARY IP ({detected_ip}) on Dhan."
                        logger.info(update_msg)
                except Exception as e_ss:
                    logger.warning(f"Error set_ip SECONDARY: {e_ss}")

            # Attempt 3: modify_ip PRIMARY
            if not update_success:
                try:
                    res_p = login.modify_ip(access_token, detected_ip, "PRIMARY")
                    if res_p and res_p.get("data", {}).get("status") == "SUCCESS":
                        update_success = True
                        update_msg = f"Successfully modified PRIMARY IP to {detected_ip} on Dhan."
                        logger.info(update_msg)
                except Exception as ep:
                    logger.warning(f"Error modifying PRIMARY IP: {ep}")

            # Attempt 4: modify_ip SECONDARY
            if not update_success:
                try:
                    res_s = login.modify_ip(access_token, detected_ip, "SECONDARY")
                    if res_s and res_s.get("data", {}).get("status") == "SUCCESS":
                        update_success = True
                        update_msg = f"Successfully modified SECONDARY IP to {detected_ip} on Dhan."
                        logger.info(update_msg)
                except Exception as es:
                    logger.warning(f"Error modifying SECONDARY IP: {es}")

            # Re-fetch after modification
            ip_info_after = login.get_ip(access_token)
            data_after = ip_info_after.get("data", {})
            orders_allowed_after = bool(data_after.get("ordersAllowed"))

            result = {
                "status": "SUCCESS" if orders_allowed_after else "WARNING",
                "ipMatchStatus": data_after.get("ipMatchStatus", ""),
                "ordersAllowed": orders_allowed_after,
                "currentIP": detected_ip,
                "primaryIP": data_after.get("primaryIP", ""),
                "secondaryIP": data_after.get("secondaryIP", ""),
                "message": update_msg or ("Orders allowed on Dhan" if orders_allowed_after else "IP registration requires attention on Dhan portal")
            }
            self.cached_status = result
            self.last_check_time = now
            return result

        except Exception as e:
            logger.error(f"Dhan IP sync exception: {e}", exc_info=True)
            return {
                "status": "ERROR",
                "message": str(e),
                "ordersAllowed": False
            }

dhan_ip_service = DhanIPService()
