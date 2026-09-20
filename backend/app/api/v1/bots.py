from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.engine.strategy_dsl import StrategyDefinition, validate_strategy_dsl
from app.engine.bot_conversation import process_user_conversation, STARTER_TEMPLATES
from app.engine.backtest_engine import backtest_engine
from app.engine.bot_store import bot_store

router = APIRouter(prefix="/bots", tags=["Dynamic Bot Studio"])

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = None
    current_strategy: Optional[Dict[str, Any]] = None
    model: Optional[str] = None

class BacktestRequest(BaseModel):
    strategy: StrategyDefinition
    test_symbol: Optional[str] = None
    initial_capital: Optional[float] = 100000.0

class SaveBotRequest(BaseModel):
    strategy: Dict[str, Any]
    backtest: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

@router.get("/templates")
def get_templates():
    """Returns curated starter strategy templates."""
    return {"templates": STARTER_TEMPLATES}

@router.post("/chat")
def chat_copilot(req: ChatRequest):
    """
    Conversational AI Co-Pilot for Bot Generation.
    Translates user trading ideas into an explanation + structured Strategy DSL.
    """
    msg = req.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="User message cannot be empty.")

    explanation, strategy = process_user_conversation(
        user_message=msg,
        history=req.history,
        current_strategy=req.current_strategy,
        model=req.model
    )

    return {
        "success": True,
        "explanation": explanation,
        "strategy": strategy.model_dump()
    }

@router.post("/backtest")
def run_backtest(req: BacktestRequest):
    """
    Executes historical backtest against stock bars with Indian statutory costs.
    """
    errors = validate_strategy_dsl(req.strategy)
    if errors:
        raise HTTPException(status_code=422, detail={"validation_errors": errors})

    results = backtest_engine.run_backtest(
        strategy=req.strategy,
        test_symbol=req.test_symbol,
        initial_capital=req.initial_capital or 100000.0
    )
    return results

@router.get("")
def list_bots():
    """Lists all user-saved bots and their backtest history."""
    bots = bot_store.list_bots()
    return {"bots": bots, "count": len(bots)}

@router.get("/{bot_id}")
def get_bot(bot_id: str):
    """Fetches a specific bot record."""
    bot = bot_store.get_bot(bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail=f"Bot {bot_id} not found.")
    return bot

@router.post("")
def save_bot(req: SaveBotRequest):
    """Saves or updates a bot in SQLite persistent store."""
    saved = bot_store.save_bot(
        strategy_dict=req.strategy,
        backtest_dict=req.backtest,
        status=req.status
    )
    return {"success": True, "bot": saved}

@router.delete("/{bot_id}")
def delete_bot(bot_id: str):
    """Deletes a bot from the persistent store."""
    ok = bot_store.delete_bot(bot_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Bot {bot_id} not found.")
    return {"success": True, "message": f"Bot {bot_id} deleted."}
