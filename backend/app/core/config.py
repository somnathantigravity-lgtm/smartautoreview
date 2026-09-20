from pydantic_settings import BaseSettings
from typing import Dict, Any, Optional

class Settings:
    PROJECT_NAME: str = "Indian Equity Arbitrage Scanner"
    API_V1_STR: str = "/api/v1"
    
    # Strategy Defaults
    MIN_NET_PREMIUM_PCT: float = 1.0
    MAX_EXPIRY_DAYS: float = 30.0
    MAX_DATA_AGE_SECONDS: float = 5.0
    MIN_CASH_VOLUME: int = 5000
    MIN_FUTURES_VOLUME: int = 1000
    MIN_OPEN_INTEREST: int = 500
    MAX_ACCEPTABLE_SLIPPAGE_PCT: float = 0.25
    
    # Universe of top liquid F&O Indian equity stocks with default lot sizes
    FO_STOCKS: Dict[str, Dict[str, Any]] = {
        "RELIANCE": {"company": "Reliance Industries Ltd", "lot_size": 250, "isin": "INE002A01018"},
        "TCS": {"company": "Tata Consultancy Services Ltd", "lot_size": 175, "isin": "INE467B01029"},
        "INFY": {"company": "Infosys Ltd", "lot_size": 400, "isin": "INE009A01021"},
        "HDFCBANK": {"company": "HDFC Bank Ltd", "lot_size": 550, "isin": "INE040A01034"},
        "ICICIBANK": {"company": "ICICI Bank Ltd", "lot_size": 700, "isin": "INE090A01021"},
        "TATASTEEL": {"company": "Tata Steel Ltd", "lot_size": 5500, "isin": "INE081A01020"},
        "SBIN": {"company": "State Bank of India", "lot_size": 1500, "isin": "INE062A01020"},
        "BHARTIARTL": {"company": "Bharti Airtel Ltd", "lot_size": 475, "isin": "INE397D01024"},
        "LT": {"company": "Larsen & Toubro Ltd", "lot_size": 150, "isin": "INE018A01030"},
        "AXISBANK": {"company": "Axis Bank Ltd", "lot_size": 625, "isin": "INE238A01034"},
        "TATAMOTORS": {"company": "Tata Motors Ltd", "lot_size": 1400, "isin": "INE155A01022"},
        "MARUTI": {"company": "Maruti Suzuki India Ltd", "lot_size": 100, "isin": "INE585B01010"},
    }

settings = Settings()
