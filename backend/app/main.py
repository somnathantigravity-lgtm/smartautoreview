import asyncio
import json
import logging
import socket

# Force IPv4 globally for Dhan API whitelisting compatibility
try:
    from urllib3.util import connection
    def _force_ipv4():
        return socket.AF_INET
    connection.allowed_gai_family = _force_ipv4
except Exception:
    pass

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.health import router as health_router
from app.api.v1.universe import router as universe_router
from app.api.v1.rules import router as rules_router
from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router
from app.api.v1.portfolios import router as portfolios_router
from app.api.v1.corporate_filings import router as corporate_filings_router
from app.api.v1.bots import router as bots_router
from app.engine.universe_provider import universe_provider

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bse_nse_terminal")

app = FastAPI(
    title="Apex Indian Equities Terminal & Screener Studio",
    description="Live BSE/NSE Market Terminal, Open Financial Screener, and Dynamic Technical Trigger Studio.",
    version="2.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.admin_portal import router as admin_portal_router
from app.api.v1.news import router as news_router
from app.api.v1.trade import router as trade_router
from app.api.v1.historical_data_api import router as historical_data_router
from app.api.v1.reco_simulation_api import router as reco_simulation_router
from app.api.v1.gemini_settings_api import router as gemini_settings_router

# Include Modern Routers
app.include_router(health_router, prefix="/api/v1", tags=["Health"])
app.include_router(gemini_settings_router, prefix="/api/v1", tags=["Gemini Vision AI Engine"])
app.include_router(trade_router, prefix="/api/v1", tags=["Dhan Live Trading & Orders"])
app.include_router(news_router, prefix="/api/v1", tags=["Live News & Market Wire"])
app.include_router(recommendations_router, prefix="/api/v1", tags=["AI Recommendations"])
app.include_router(reco_simulation_router, prefix="/api/v1", tags=["Recommendation Simulation"])
app.include_router(admin_portal_router, prefix="/api/v1", tags=["Admin Intelligence Portal"])
app.include_router(historical_data_router, prefix="/api/v1", tags=["Historical Data & Quant Matrix"])
app.include_router(universe_router, prefix="/api/v1", tags=["BSE & NSE Universe"])
app.include_router(rules_router, prefix="/api/v1", tags=["Dynamic Rules & Triggers"])
app.include_router(admin_router, prefix="/api/v1", tags=["Admin & Integrations"])
app.include_router(auth_router, prefix="/api/v1", tags=["Authentication & Alerts"])
app.include_router(portfolios_router, prefix="/api/v1", tags=["Open Screener & Portfolios"])
app.include_router(corporate_filings_router, prefix="/api/v1", tags=["Corporate Filings & Results"])
app.include_router(bots_router, prefix="/api/v1", tags=["Dynamic Bot Studio"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.loop = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        try:
            self.loop = asyncio.get_running_loop()
        except Exception:
            pass

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

    def threadsafe_broadcast(self, message: dict):
        """Allows threads (like DhanHQ WebSocket thread) to broadcast safely to connected async WebSockets."""
        if self.active_connections and self.loop and self.loop.is_running():
            asyncio.run_coroutine_threadsafe(self.broadcast(message), self.loop)

ws_manager = ConnectionManager()

# Hook tick listener into universe_provider
if hasattr(universe_provider, "tick_listeners"):
    universe_provider.tick_listeners.append(ws_manager.threadsafe_broadcast)

# Hook recommendation real-time events into ws_manager
from app.engine.recommendation_engine import recommendation_engine
if hasattr(recommendation_engine, "broadcast_callbacks"):
    recommendation_engine.broadcast_callbacks.append(ws_manager.threadsafe_broadcast)

@app.websocket("/ws/terminal")
async def websocket_terminal_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)

    async def sender():
        while True:
            ticker_data = universe_provider.get_market_ticker() if hasattr(universe_provider, "get_market_ticker") else universe_provider.get_indices()
            
            await websocket.send_json({
                "type": "MARKET_PULSE",
                "indices": ticker_data.get("indices", []),
                "top_gainers": ticker_data.get("top_gainers", []),
                "top_losers": ticker_data.get("top_losers", []),
                "summary": ticker_data.get("summary"),
                "market_status": ticker_data.get("market_status", "OPEN"),
                "is_market_open": ticker_data.get("is_market_open", False),
                "status_label": ticker_data.get("status_label", "Market Closed"),
                "last_trading_date": ticker_data.get("last_trading_date", ""),
                "last_trading_time": ticker_data.get("last_trading_time", ""),
                "last_trading_datetime_str": ticker_data.get("last_trading_datetime_str", ""),
                "timestamp": ticker_data.get("timestamp")
            })
            await asyncio.sleep(1.5)

    async def receiver():
        try:
            while True:
                data_text = await websocket.receive_text()
                try:
                    msg = json.loads(data_text)
                    action = msg.get("action")
                    if action == "SUBSCRIBE_STOCK":
                        sym = msg.get("symbol")
                        if sym:
                            if hasattr(universe_provider, "subscribe_symbols"):
                                universe_provider.subscribe_symbols([sym])
                            tick = universe_provider.get_stock_quote_tick(sym) if hasattr(universe_provider, "get_stock_quote_tick") else None
                            if tick:
                                await websocket.send_json(tick)
                    elif action == "SUBSCRIBE_UNIVERSE":
                        symbols = msg.get("symbols", [])
                        if symbols and hasattr(universe_provider, "subscribe_symbols"):
                            universe_provider.subscribe_symbols(symbols)
                            # Immediately send existing live ticks so newly visible stocks populate real-time values instantly
                            for s_sym in symbols:
                                t_tick = universe_provider.get_stock_quote_tick(s_sym) if hasattr(universe_provider, "get_stock_quote_tick") else None
                                if t_tick:
                                    eff_ltp = t_tick.get("ltp") or t_tick.get("nse_ltp") or t_tick.get("bse_ltp") or 0.0
                                    if eff_ltp > 0:
                                        await websocket.send_json(t_tick)
                except Exception as ex:
                    logger.debug(f"WS receiver parse exception: {ex}")
        except WebSocketDisconnect:
            pass
        except Exception as ex:
            logger.debug(f"WS receiver loop exception: {ex}")

    try:
        sender_task = asyncio.create_task(sender())
        receiver_task = asyncio.create_task(receiver())
        done, pending = await asyncio.wait(
            [sender_task, receiver_task],
            return_when=asyncio.FIRST_COMPLETED
        )
        for task in pending:
            task.cancel()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket terminal error: {e}")
        ws_manager.disconnect(websocket)

@app.on_event("startup")
def startup_totp_service():
    try:
        from app.engine.dhan_totp_auth import dhan_totp_service
        dhan_totp_service.start_morning_scheduler()
        dhan_totp_service.auto_refresh_if_needed()
    except Exception as e:
        logger.error(f"Startup Dhan TOTP init failed: {e}")

    try:
        from app.engine.dhan_provider import dhan_provider
        if dhan_provider.client_id and dhan_provider.access_token and not dhan_provider.is_connected:
            logger.info("Auto-initiating DhanHQ Live WebSocket connection from stored session...")
            import threading
            threading.Thread(target=lambda: dhan_provider.connect(dhan_provider.client_id, dhan_provider.access_token), daemon=True).start()
    except Exception as e:
        logger.error(f"Startup Dhan connection check failed: {e}")

    try:
        from app.engine.corporate_filings_ingestion import corporate_filings_ingestion
        corporate_filings_ingestion.start_background_scheduler(interval_minutes=5)
    except Exception as e:
        logger.error(f"Startup Corporate Filings Scheduler failed: {e}")

    try:
        from app.engine.recommendation_engine import recommendation_engine
        recommendation_engine.start_background_workers()
    except Exception as e:
        logger.error(f"Startup Recommendation Engine background workers failed: {e}")

    try:
        from app.engine.trends_engine import trends_engine
        trends_engine.start_background_scheduler()
    except Exception as e:
        logger.error(f"Startup Trends Engine background scheduler failed: {e}")

    try:
        from app.engine.incremental_tape_engine import incremental_tape_engine
        incremental_tape_engine.start()
    except Exception as e:
        logger.error(f"Startup Incremental Tape Engine failed: {e}")

    try:
        from app.engine.reco_audit_service import reco_audit_service
        reco_audit_service.start_audit_worker()
    except Exception as e:
        logger.error(f"Startup Continuous Reco Audit Worker failed: {e}")

    try:
        from app.engine.auto_tape_daemon import auto_tape_daemon
        auto_tape_daemon.start()
    except Exception as e:
        logger.error(f"Startup Auto Tape Daemon failed: {e}")


@app.get("/")
def root():
    return {
        "name": "Apex Indian Equities Terminal",
        "status": "ONLINE",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

