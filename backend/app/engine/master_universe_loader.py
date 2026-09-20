import os
import csv
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

BSE_NSE_CACHE_FILE = os.path.join(os.path.dirname(__file__), "bse_nse_master.csv")

def load_or_fetch_all_masters() -> List[Dict[str, Any]]:
    """
    Loads all active equities listed on both BSE and NSE (7,693+ active equities).
    """
    stocks = []
    
    if os.path.exists(BSE_NSE_CACHE_FILE):
        try:
            with open(BSE_NSE_CACHE_FILE, "r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sym = row.get("symbol", "").strip().upper()
                    name = row.get("name", "").strip()
                    exch = row.get("exchange", "NSE").strip().upper()
                    sec_id = row.get("security_id", "").strip()
                    series = row.get("series", "").strip()

                    if sym:
                        stocks.append({
                            "symbol": sym,
                            "name": name or f"{sym} Ltd",
                            "exchange": exch,
                            "security_id": sec_id,
                            "series": series,
                            "sector": _infer_sector(name, sym),
                            "mcap_category": "Large Cap" if sym in [
                                "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIARTL",
                                "SBIN", "LT", "ITC", "HINDUNILVR", "TATAMOTORS", "MARUTI",
                                "SUNPHARMA", "BAJFINANCE", "TITAN", "AXISBANK", "KOTAKBANK"
                            ] else "Mid/Small Cap"
                        })
            logger.info(f"Loaded {len(stocks)} active equities across BSE and NSE.")
            return stocks
        except Exception as e:
            logger.error(f"Failed to read bse_nse_master.csv: {e}")

    return []

def _infer_sector(name: str, symbol: str) -> str:
    try:
        from app.engine.dhan_provider import dhan_engine
        return dhan_engine._infer_sector(name, symbol)
    except Exception:
        return "Diversified / General"

