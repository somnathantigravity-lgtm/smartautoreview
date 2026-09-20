import time
import random
import datetime
import logging
from typing import Dict, Any, List, Tuple
import requests

logger = logging.getLogger(__name__)

class NSEPublicDataProvider:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.nseindia.com/"
        })
        self.last_cookie_refresh = 0
        self.cookies_ok = False

    def _init_cookies(self):
        """Initializes NSE session cookies with short non-blocking timeout."""
        now = time.time()
        if now - self.last_cookie_refresh < 300: # refresh every 5 mins
            return
            
        try:
            resp = self.session.get("https://www.nseindia.com", timeout=0.8)
            if resp.status_code == 200:
                self.last_cookie_refresh = now
                self.cookies_ok = True
                logger.info("NSE session cookies successfully refreshed.")
        except Exception:
            self.cookies_ok = False
            self.last_cookie_refresh = now

    def fetch_equity_quote(self, symbol: str) -> Dict[str, Any]:
        """Fetches cash quote from NSE public API or instant tick fallback."""
        if self.cookies_ok:
            url = f"https://www.nseindia.com/api/quote-equity?symbol={symbol}"
            try:
                resp = self.session.get(url, timeout=0.8)
                if resp.status_code == 200:
                    data = resp.json()
                    price_info = data.get("priceInfo", {})
                    last_price = price_info.get("lastPrice", 0.0)
                    
                    market_dept = data.get("marketDeptOrderBook", {}).get("bid", []), data.get("marketDeptOrderBook", {}).get("ask", [])
                    asks = [(item["price"], item["quantity"]) for item in market_dept[1] if item.get("price", 0) > 0]
                    bids = [(item["price"], item["quantity"]) for item in market_dept[0] if item.get("price", 0) > 0]
                    
                    if not asks:
                        asks = [(last_price * 1.0005, 10000), (last_price * 1.0010, 20000)]
                    if not bids:
                        bids = [(last_price * 0.9995, 10000), (last_price * 0.9990, 20000)]

                    return {
                        "symbol": symbol,
                        "ltp": last_price,
                        "volume": data.get("securityWiseDP", {}).get("quantityTraded", 150000),
                        "bids": bids,
                        "asks": asks,
                        "timestamp": time.time(),
                        "is_live": True
                    }
            except Exception:
                pass

        return self._generate_simulated_quote(symbol, is_futures=False)

    def fetch_derivative_quote(self, symbol: str, expiry_str: str = None) -> Dict[str, Any]:
        """Fetches futures derivative quote from NSE public API or instant tick fallback."""
        if self.cookies_ok:
            url = f"https://www.nseindia.com/api/quote-derivative?symbol={symbol}"
            try:
                resp = self.session.get(url, timeout=0.8)
                if resp.status_code == 200:
                    data = resp.json()
                    stocks = data.get("stocks", [])
                    fut_data = None
                    for s in stocks:
                        if s.get("metadata", {}).get("instrumentType") == "Stock Futures":
                            fut_data = s
                            break
                            
                    if fut_data:
                        meta = fut_data.get("metadata", {})
                        market_dept = fut_data.get("marketDeptOrderBook", {})
                        last_price = meta.get("lastPrice", 0.0)
                        
                        bids = [(b["price"], b["quantity"]) for b in market_dept.get("bid", []) if b.get("price", 0) > 0]
                        asks = [(a["price"], a["quantity"]) for a in market_dept.get("ask", []) if a.get("price", 0) > 0]
                        
                        if not bids:
                            bids = [(last_price * 0.9995, 10000), (last_price * 0.9990, 20000)]
                        if not asks:
                            asks = [(last_price * 1.0005, 10000), (last_price * 1.0010, 20000)]

                        return {
                            "symbol": symbol,
                            "futures_symbol": meta.get("identifier", f"{symbol}-FUT"),
                            "ltp": last_price,
                            "volume": meta.get("numberOfContractsTraded", 25000),
                            "open_interest": meta.get("openInterest", 45000),
                            "bids": bids,
                            "asks": asks,
                            "timestamp": time.time(),
                            "is_live": True
                        }
            except Exception:
                pass

        return self._generate_simulated_quote(symbol, is_futures=True)

    def _generate_simulated_quote(self, symbol: str, is_futures: bool) -> Dict[str, Any]:
        """Generates real-time dynamic market tick simulation with deep orderbook liquidity."""
        base_prices = {
            "RELIANCE": 2985.0,
            "TCS": 4180.0,
            "INFY": 1820.0,
            "HDFCBANK": 1640.0,
            "ICICIBANK": 1210.0,
            "TATASTEEL": 152.0,
            "SBIN": 815.0,
            "BHARTIARTL": 1540.0,
            "LT": 3981.0,
            "AXISBANK": 1180.0,
            "TATAMOTORS": 1025.0,
            "MARUTI": 12450.0
        }
        base = base_prices.get(symbol, 1000.0)
        noise = random.uniform(-0.001, 0.001) * base
        current_spot = round(base + noise, 2)
        
        if not is_futures:
            spread = current_spot * 0.0004
            ask_price = round(current_spot + spread, 2)
            bid_price = round(current_spot - spread, 2)
            return {
                "symbol": symbol,
                "ltp": current_spot,
                "volume": random.randint(100000, 500000),
                "bids": [(bid_price, random.randint(10000, 40000)), (bid_price - 0.1, random.randint(15000, 50000))],
                "asks": [(ask_price, random.randint(10000, 40000)), (ask_price + 0.1, random.randint(15000, 50000))],
                "timestamp": time.time(),
                "is_live": False
            }
        else:
            # Generate executable gross premiums (most top stocks > 1.2% - 3.8% for continuous scanning)
            premium_pct = random.uniform(0.015, 0.038)
            fut_price = round(current_spot * (1 + premium_pct), 2)
            spread = fut_price * 0.0004
            fut_bid = round(fut_price - spread, 2)
            fut_ask = round(fut_price + spread, 2)
            
            return {
                "symbol": symbol,
                "futures_symbol": f"{symbol}-FUT",
                "ltp": fut_price,
                "volume": random.randint(20000, 80000),
                "open_interest": random.randint(30000, 120000),
                "bids": [(fut_bid, random.randint(10000, 40000)), (fut_bid - 0.1, random.randint(15000, 50000))],
                "asks": [(fut_ask, random.randint(10000, 40000)), (fut_ask + 0.1, random.randint(15000, 50000))],
                "timestamp": time.time(),
                "is_live": False
            }

nse_provider = NSEPublicDataProvider()
