from fastapi import APIRouter, Query
from app.engine.news_engine import news_engine, fetch_live_public_rss

router = APIRouter()

@router.get("/news")
def get_news_feed(
    category: str = Query(None, description="Category filter: ALL, ECONOMY, SECTOR, CORPORATE_FILING, STOCKS"),
    sector: str = Query(None, description="Sector name filter"),
    symbol: str = Query(None, description="Stock ticker symbol filter"),
    sensitivity: str = Query(None, description="Sensitivity rating: ALL, HIGH, MODERATE, INFORMATIONAL"),
    sentiment: str = Query(None, description="Sentiment: ALL, BULLISH, BEARISH, NEUTRAL"),
    search: str = Query(None, description="Search keyword in title, summary, sector"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    return news_engine.get_articles(
        category=category,
        sector=sector,
        symbol=symbol,
        sensitivity=sensitivity,
        sentiment=sentiment,
        search=search,
        limit=limit,
        offset=offset
    )

@router.get("/news/match")
def match_news_for_stock(
    symbol: str = Query(None, description="Stock ticker"),
    sector: str = Query(None, description="Sector name")
):
    article = news_engine.get_article_for_recommendation(symbol=symbol, sector=sector)
    return {"article": article}

@router.post("/news/refresh")
def refresh_news():
    new_count = fetch_live_public_rss()
    return {"status": "ok", "new_articles_ingested": new_count}
