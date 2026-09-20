from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union

# --- xKiro AI Integration Schemas ---
class XKiroConnectModel(BaseModel):
    api_key: str
    model: Optional[str] = "gpt-4o"
    custom_base_url: Optional[str] = "https://api.xkiro.com/v1"

# --- Cost Rules Schemas ---
class CostRuleUpdateModel(BaseModel):
    rule_id: str
    rate: Optional[float] = None
    fixed_amount: Optional[float] = None
    is_active: Optional[bool] = None

class CustomCostRuleAddModel(BaseModel):
    name: str
    instrument_type: str # 'CASH', 'FUTURES', 'BOTH'
    transaction_side: str # 'BUY', 'SELL', 'BOTH'
    calculation_type: str # 'PERCENTAGE', 'FLAT'
    rate: float = 0.0
    fixed_amount: float = 0.0

# --- DhanHQ Connection ---
class DhanConnectModel(BaseModel):
    access_token: str
    client_id: Optional[str] = ""

class DhanTOTPConfigureModel(BaseModel):
    client_id: str
    pin: str
    totp_secret: str


# --- Dynamic Rule & Trigger Schemas ---
class DynamicCondition(BaseModel):
    field: str # 'ltp', 'rsi', 'ema_20', 'ema_50', 'ema_200', 'vwap', 'volume', 'volume_ma', 'change_pct', 'supertrend'
    operator: str # '>', '<', '>=', '<=', '==', 'crosses_above', 'crosses_below', 'touches'
    value: Union[float, str] # e.g. 50.0 or 'ema_50'
    timeframe: Optional[str] = "15m"
    extra_params: Optional[Dict[str, Any]] = None

class RuleCreateModel(BaseModel):
    name: str
    symbol: str # e.g. 'RELIANCE' or 'ALL_NIFTY50' or 'ALL_BSE'
    exchange: Optional[str] = "NSE"
    description: Optional[str] = ""
    logic_operator: str = "AND" # 'AND' | 'OR'
    conditions: List[DynamicCondition]
    action_type: str = "ALERT" # 'ALERT' | 'AGENT' | 'PAPER_TRADE'

class RuleTestModel(BaseModel):
    symbol: str
    conditions: List[DynamicCondition]
    logic_operator: str = "AND"

# --- Dynamic Agent Schemas ---
class AgentCreateModel(BaseModel):
    name: str
    description: Optional[str] = ""
    symbol_or_scope: str # e.g. 'NIFTY 50', 'TATASTEEL', 'BANKING', 'ALL'
    trigger_rule_id: Optional[str] = None
    ai_model: Optional[str] = "gpt-4o"
    strategy_prompt: Optional[str] = "Identify high momentum breakout setups with tight risk-reward ratio."
    task_actions: List[str] = Field(default_factory=lambda: ["AI_ANALYSIS", "PAPER_ORDER", "ALERT"])
    risk_reward_ratio: float = 2.0
    capital_allocation: float = 50000.0

class AgentToggleModel(BaseModel):
    status: str # 'RUNNING' | 'PAUSED'

# --- Universal Paper Trading Schemas ---
class PaperTradeRequest(BaseModel):
    symbol: str
    exchange: Optional[str] = "NSE"
    side: str = "BUY" # 'BUY' | 'SELL'
    quantity: int = 1
    price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None

class PaperCloseRequest(BaseModel):
    position_id: str
    exit_price: Optional[float] = None
