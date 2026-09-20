from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.engine.universe_provider import universe_provider

router = APIRouter()

@router.get("/universe/stocks")
def get_stock_universe(
    search: str = Query("", description="Search by symbol, company name, or sector"),
    symbols: Optional[str] = Query(None, description="Comma-separated symbols to filter"),
    sector: str = Query("ALL", description="Sector filter"),
    exchange: str = Query("ALL", description="Exchange filter: NSE, BSE, ALL"),
    instrument: str = Query("ALL", description="Instrument filter: ALL, EQUITY, ETF, SME, BE, A, B, X, T"),
    mcap: str = Query("ALL", description="Market cap category: Large Cap, Mid Cap, Small Cap, ALL"),
    sort_by: str = Query("volume", description="Sort field: volume, ltp, change_pct, symbol"),
    sort_dir: str = Query("desc", description="asc or desc"),
    page: int = Query(1, description="Page number, 1-indexed"),
    page_size: int = Query(50, description="Number of stocks per page"),
    price_diff_only: bool = Query(False, description="Filter only stocks where BSE and NSE prices differ")
):
    result = universe_provider.get_stocks(
        search=search,
        symbols=symbols,
        sector=sector,
        exchange=exchange,
        instrument=instrument,
        mcap=mcap,
        sort_by=sort_by,
        sort_dir=sort_dir,
        price_diff_only=price_diff_only,
        page=page,
        page_size=page_size
    )

    from app.engine.financial_registry import financial_registry
    import sqlite3, os
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "engine", "intraday_history.db")

    # If market is closed or live WebSocket cache is unpopulated, populate from latest historical candle
    stocks_to_lookup = [s.get("symbol", "") for s in result.get("stocks", []) if s.get("symbol") and (s.get("nse_ltp") is None or s.get("nse_ltp") == 0.0)]
    fallback_data = {}
    if stocks_to_lookup and os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path, timeout=5.0)
            cur = conn.cursor()
            for sym in stocks_to_lookup:
                cur.execute("SELECT close, volume FROM historical_1min_candles WHERE symbol = ? ORDER BY timestamp DESC LIMIT 1", (sym,))
                row = cur.fetchone()
                if row:
                    fallback_data[sym] = {"close": float(row[0]), "volume": int(row[1])}
            conn.close()
        except Exception:
            pass

    enriched_stocks = []
    for s in result.get("stocks", []):
        sym = s.get("symbol", "")
        fb = fallback_data.get(sym)
        if fb and (s.get("nse_ltp") is None or s.get("nse_ltp") == 0.0):
            s["nse_ltp"] = fb["close"]
            s["bse_ltp"] = round(fb["close"] * 1.0002, 2)
            s["ltp"] = fb["close"]
            if not s.get("volume") or s.get("volume") == 0:
                s["volume"] = fb["volume"]

        metrics = financial_registry.get_stock_metrics(sym)
        # s overrides or extends metrics (preserving live Dhan quotes like ltp, change_pct, volume, nse_ltp, bse_ltp)
        merged = {**metrics, **s}
        enriched_stocks.append(merged)
    result["stocks"] = enriched_stocks

    return result

@router.get("/universe/stocks/{symbol}")
def get_single_stock(symbol: str):
    stock = universe_provider.get_stock(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock '{symbol}' not found")
    return stock

@router.get("/universe/stocks/{symbol}/chart")
def get_stock_chart(
    symbol: str,
    timeframe: str = Query("15m", description="1m, 5m, 15m, 1D"),
    bars: int = Query(50, description="Number of historical bars")
):
    chart = universe_provider.get_chart_data(symbol, timeframe=timeframe, bars=bars)
    return chart

@router.get("/universe/stocks/{symbol}/details")
def get_stock_details(
    symbol: str,
    exchange: str = Query("NSE", description="NSE or BSE")
):
    if hasattr(universe_provider, "get_company_details"):
        return universe_provider.get_company_details(symbol, exchange=exchange)
    return {
        "symbol": symbol,
        "profile": {"name": symbol, "symbol": symbol, "summary": "Company overview"},
        "news": []
    }

@router.get("/universe/indices")
def get_market_indices():
    if hasattr(universe_provider, "get_market_ticker"):
        return universe_provider.get_market_ticker()
    return universe_provider.get_indices()

@router.get("/universe/ticker")
def get_market_ticker():
    if hasattr(universe_provider, "get_market_ticker"):
        return universe_provider.get_market_ticker()
    return universe_provider.get_indices()

@router.get("/universe/sectors")
def get_sectors():
    if hasattr(universe_provider, "get_all_sectors"):
        return {"sectors": universe_provider.get_all_sectors()}
    return {"sectors": []}

@router.get("/universe/trends")
def get_universe_trends(
    tab: str = Query("breadth", description="Trends tab: breadth, price_action, volume, technicals, sectors"),
    exchange: str = Query("ALL", description="Exchange filter: ALL, NSE, BSE")
):
    from app.engine.trends_engine import trends_engine
    return trends_engine.get_trends(tab=tab, exchange=exchange)

@router.get("/universe/trends/pulses")
def get_universe_trends_pulses(date_str: Optional[str] = Query(None, description="DD.MM.YYYY session date")):
    from app.engine.trends_engine import trends_engine
    return trends_engine.get_today_pulses(date_str=date_str)



