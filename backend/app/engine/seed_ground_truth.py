import sys
import os
import time
import logging

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.engine.financial_ground_truth import financial_ground_truth

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# List of high-priority benchmark stocks and all active screen stocks
SEED_SYMBOLS = [
    # Prominent Stocks in Active Screen & User Test Cases
    "QUICKHEAL", "VENKEYS", "PCJEWELLER", "OLECTRA", "WELENT", "LTFOODS", "NETWORK18",
    "EDELWEISS", "SHALPAINTS", "IDEA", "IFCI", "UTKARSHBNK", "IDBI", "BCG",
    "JINDWORLD", "AGL", "FCL", "BLSE", "ABSMARINE", "NATIONSTD",

    # Nifty 50 Mega-Caps & Core Equities
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIARTL", "SBIN", "LICI",
    "ITC", "HINDUNILVR", "LT", "BAJFINANCE", "HCLTECH", "MARUTI", "SUNPHARMA", "ADANIENT",
    "TATAMOTORS", "KOTAKBANK", "NTPC", "TITAN", "ONGC", "POWERGRID", "AXISBANK", "DMART",
    "ADANIGREEN", "ADANIPORTS", "ULTRACEMCO", "BAJAJFINSV", "COALINDIA", "ASIANPAINT",
    "NESTLEIND", "WIPRO", "JSWSTEEL", "M&M", "GRASIM", "TECHM", "DIVISLAB", "CIPLA",
    "TATASTEEL", "IOC", "BPCL", "HEROMOTOCO", "EICHERMOT", "HINDALCO", "DRREDDY",
    "APOLLOHOSP", "TATACONSUM", "BRITANNIA", "BAJAJ-AUTO", "SHRIRAMFIN", "VEDL", "BEL",
    "HAL", "TRENT", "ZOMATO", "JIOFIN", "INDIGO", "VARUN", "TVSMOTOR", "CHOLAFIN", "DLF",

    # Key Capital Goods, Power & Energy
    "SIEMENS", "ABB", "BHEL", "CUMMINSIND", "POLYCAB", "KEI", "HAVELLS", "VOLTAS", "BLUESTARCO",
    "TATAPOWER", "ADANIPOWER", "ADANIENSOL", "JSWENERGY", "NHPC", "SJVN", "TORNTPOWER", "SUZLON",
    "IREDA", "PFC", "REC", "INOXWIND",

    # Automotive & Ancillaries
    "ASHOKLEY", "BHARATFORG", "BOSCHLTD", "MOTHERSON", "EXIDEIND", "MRF", "APOLLOTYRE", "CEATLTD",

    # Banking, NBFCs & Financials
    "BANKBARODA", "PNB", "CANBK", "IDFCFIRSTB", "FEDERALBNK", "AUBANK", "YESBANK", "BANDHANBNK",
    "MUTHOOTFIN", "MANAPPURAM", "M&MFIN", "POONAWALLA", "SBICARD",

    # Pharma & Healthcare
    "LUPIN", "AUROPHARMA", "TORNTPHARM", "ALKEM", "BIOCON", "GLENMARK", "APLLTD", "FORTIS", "MAXHEALTH",

    # Metals & Mining
    "JINDALSTEL", "NMDC", "SAIL", "NATIONALUM",

    # Chemicals & Fertilizers
    "PIDILITIND", "SRF", "GUJFLUORO", "DEEPAKNTR", "AARTIIND", "TATACHEM", "ATUL", "NAVINFLUOR", "UPL", "PIIND", "COROMANDEL",

    # FMCG & Consumption
    "DABUR", "MARICO", "GODREJCP", "COLPAL", "PAGEIND", "BATAINDIA",

    # Information Technology
    "LTIM", "PERSISTENT", "COFORGE", "MPHASIS", "KPITTECH", "TATAELXSI", "CYIENT", "BSOFT", "ZENSARTECH",

    # Oil, Gas & Petrochemicals
    "HPCL", "GAIL", "PETRONET", "IGL", "MGL", "GUJGASLTD",

    # Real Estate & Infra
    "GODREJPROP", "LODHA", "OBEROIRLTY", "PRESTIGE",

    # Railways & Defence
    "RVNL", "IRFC", "IRCON", "RAILTEL", "RITES", "TITAGARH", "JWL", "BDL", "MAZDOCK", "COCHINSHIP",

    # New-Age & Consumer Tech
    "PAYTM", "NYKAA", "POLICYBZR", "DELHIVERY"
]

def seed_all():
    logger.info(f"Starting ground-truth seeding for {len(SEED_SYMBOLS)} stocks...")
    success_count = 0
    fail_count = 0

    for idx, sym in enumerate(SEED_SYMBOLS):
        try:
            logger.info(f"[{idx+1}/{len(SEED_SYMBOLS)}] Fetching true audited financials for {sym}...")
            res = financial_ground_truth.fetch_and_save_from_source(sym)
            if res:
                mcap = res.get("market_cap", 0)
                sales = res.get("sales", 0)
                ebitda = res.get("ebitda", 0)
                logger.info(f"  ✓ {sym}: Mcap ₹{mcap:,.1f} Cr | Sales (TTM) ₹{sales:,.1f} Cr | EBITDA ₹{ebitda:,.1f} Cr")
                success_count += 1
            else:
                logger.warning(f"  ✗ {sym}: No data returned")
                fail_count += 1
        except Exception as e:
            logger.error(f"  ✗ Error for {sym}: {e}")
            fail_count += 1
        # Gentle rate limit
        time.sleep(0.1)

    logger.info(f"Seeding completed. Success: {success_count}, Failed: {fail_count}")

if __name__ == "__main__":
    seed_all()
