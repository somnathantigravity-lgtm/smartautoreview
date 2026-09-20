from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
import uuid
import time

class UniverseConfig(BaseModel):
    base: str = "NIFTY_50"  # "NIFTY_50", "NIFTY_500", "ALL_EQUITIES", "CUSTOM"
    custom_symbols: Optional[List[str]] = Field(default_factory=list)
    min_volume: Optional[int] = 100000
    min_price: Optional[float] = 10.0
    max_price: Optional[float] = 50000.0

class RuleCondition(BaseModel):
    id: str = Field(default_factory=lambda: f"cond_{uuid.uuid4().hex[:6]}")
    field: str  # e.g., "rsi", "ltp", "volume", "ema_20", "ema_50", "vwap", "change_pct"
    operator: str  # ">", "<", ">=", "<=", "==", "CROSSES_ABOVE", "CROSSES_BELOW"
    value: Union[float, int, str]  # 30, "ema_50", 1.5
    timeframe: str = "15m"  # "1m", "5m", "15m", "1h", "1d"
    multiplier: Optional[float] = 1.0  # e.g., volume > 2.0 * avg_volume_20d
    description: Optional[str] = None

class EntryRules(BaseModel):
    logic: str = "AND"  # "AND" | "OR"
    conditions: List[RuleCondition] = Field(default_factory=list)
    time_filter_start: Optional[str] = "09:20"
    time_filter_end: Optional[str] = "15:00"

class ExitRules(BaseModel):
    target_pct: Optional[float] = 3.0  # e.g. 3.0%
    stop_loss_pct: Optional[float] = 1.5  # e.g. 1.5%
    trailing_stop_pct: Optional[float] = None  # e.g. 1.0%
    indicator_exit: Optional[RuleCondition] = None
    max_holding_bars: Optional[int] = 60  # auto exit after N bars
    eod_square_off: bool = True  # square off at 15:15 IST for intraday

class PositionSizing(BaseModel):
    method: str = "RISK_BASED"  # "FIXED_QTY", "PERCENT_CAPITAL", "RISK_BASED"
    fixed_quantity: Optional[int] = 10
    capital_allocation: Optional[float] = 50000.0
    risk_per_trade_pct: Optional[float] = 1.0  # 1% risk per trade

class RiskLimits(BaseModel):
    max_daily_loss: Optional[float] = 10000.0
    max_open_positions: int = 5
    max_trades_per_day: int = 15
    require_stop_loss: bool = True

class StrategyDefinition(BaseModel):
    id: str = Field(default_factory=lambda: f"strat_{uuid.uuid4().hex[:8]}")
    name: str = "Custom Bot Strategy"
    description: str = ""
    version: int = 1
    status: str = "DRAFT"  # "DRAFT", "BACKTESTED", "READY_FOR_PAPER", "ACTIVE_PAPER", "ACTIVE_LIVE"
    created_by: str = "ai_copilot"  # "ai_copilot", "template", "manual_builder"
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    
    universe: UniverseConfig = Field(default_factory=UniverseConfig)
    entry: EntryRules = Field(default_factory=EntryRules)
    exit: ExitRules = Field(default_factory=ExitRules)
    position_sizing: PositionSizing = Field(default_factory=PositionSizing)
    risk_limits: RiskLimits = Field(default_factory=RiskLimits)

    # Risk Assessment
    risk_score: str = "MODERATE"  # "LOW", "MODERATE", "HIGH"
    risk_notes: List[str] = Field(default_factory=list)

def validate_strategy_dsl(strategy: StrategyDefinition) -> List[str]:
    """Validates the strategy DSL for logical coherence and safety."""
    errors = []
    if not strategy.name or not strategy.name.strip():
        errors.append("Strategy name cannot be empty.")
    
    if not strategy.entry.conditions:
        errors.append("At least one entry condition is required.")

    if strategy.risk_limits.require_stop_loss and not strategy.exit.stop_loss_pct:
        errors.append("Stop-loss is required by risk configuration but none was defined.")

    if strategy.exit.stop_loss_pct and strategy.exit.stop_loss_pct <= 0:
        errors.append("Stop loss percentage must be strictly positive.")

    if strategy.exit.target_pct and strategy.exit.target_pct <= 0:
        errors.append("Target percentage must be strictly positive.")

    if strategy.exit.stop_loss_pct and strategy.exit.target_pct:
        rr = strategy.exit.target_pct / strategy.exit.stop_loss_pct
        if rr < 0.5:
            errors.append(f"Risk-Reward ratio is unfavorable ({rr:.2f}:1). Target should be larger than stop loss.")

    return errors
