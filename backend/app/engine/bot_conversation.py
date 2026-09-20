import json
import logging
import re
import uuid
from typing import Dict, Any, List, Optional, Tuple
from app.engine.xkiro_client import xkiro_client
from app.engine.strategy_dsl import (
    StrategyDefinition,
    UniverseConfig,
    EntryRules,
    RuleCondition,
    ExitRules,
    PositionSizing,
    RiskLimits
)

logger = logging.getLogger(__name__)

STARTER_TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "tpl_rsi_dip",
        "name": "RSI Oversold Dip Buyer",
        "description": "Buys high-quality NIFTY 50 stocks when RSI(14) drops below 30 and price sits near 200 EMA support.",
        "badge": "Mean Reversion",
        "strategy": {
            "name": "RSI Oversold Dip Buyer",
            "description": "Buys high-quality NIFTY 50 stocks when RSI(14) drops below 30 and price sits near 200 EMA support.",
            "universe": {"base": "NIFTY_50", "min_volume": 500000, "min_price": 50.0},
            "entry": {
                "logic": "AND",
                "conditions": [
                    {"field": "rsi", "operator": "<", "value": 30.0, "timeframe": "15m", "description": "RSI(14) < 30"},
                    {"field": "ltp", "operator": ">=", "value": "ema_200", "timeframe": "15m", "description": "Price >= 200 EMA"}
                ],
                "time_filter_start": "09:30",
                "time_filter_end": "14:30"
            },
            "exit": {
                "target_pct": 3.5,
                "stop_loss_pct": 1.5,
                "trailing_stop_pct": 1.0,
                "eod_square_off": True
            },
            "position_sizing": {"method": "RISK_BASED", "capital_allocation": 50000.0, "risk_per_trade_pct": 1.0},
            "risk_limits": {"max_daily_loss": 5000.0, "max_open_positions": 3, "max_trades_per_day": 8, "require_stop_loss": True}
        }
    },
    {
        "id": "tpl_momentum_breakout",
        "name": "Intraday Volume Breakout",
        "description": "Catches aggressive breakouts when volume spikes > 2.5x the 20-day average and price crosses above intraday VWAP.",
        "badge": "Momentum",
        "strategy": {
            "name": "Intraday Volume Breakout",
            "description": "Catches aggressive breakouts when volume spikes > 2.5x the 20-day average and price crosses above intraday VWAP.",
            "universe": {"base": "NIFTY_500", "min_volume": 200000, "min_price": 20.0},
            "entry": {
                "logic": "AND",
                "conditions": [
                    {"field": "ltp", "operator": "CROSSES_ABOVE", "value": "vwap", "timeframe": "5m", "description": "Price crosses above VWAP"},
                    {"field": "volume", "operator": ">", "value": "avg_volume_20d", "multiplier": 2.5, "timeframe": "5m", "description": "Volume > 2.5x 20D Avg Vol"},
                    {"field": "change_pct", "operator": ">", "value": 1.0, "timeframe": "5m", "description": "Intraday Gain > 1%"}
                ],
                "time_filter_start": "09:45",
                "time_filter_end": "13:30"
            },
            "exit": {
                "target_pct": 4.0,
                "stop_loss_pct": 1.8,
                "trailing_stop_pct": 1.2,
                "eod_square_off": True
            },
            "position_sizing": {"method": "RISK_BASED", "capital_allocation": 75000.0, "risk_per_trade_pct": 1.5},
            "risk_limits": {"max_daily_loss": 10000.0, "max_open_positions": 4, "max_trades_per_day": 10, "require_stop_loss": True}
        }
    },
    {
        "id": "tpl_golden_cross",
        "name": "Dual EMA Trend Follower",
        "description": "Rides sustained trends when 20 EMA is above 50 EMA and RSI maintains bullish momentum between 55 and 70.",
        "badge": "Trend Following",
        "strategy": {
            "name": "Dual EMA Trend Follower",
            "description": "Rides sustained trends when 20 EMA is above 50 EMA and RSI maintains bullish momentum between 55 and 70.",
            "universe": {"base": "NIFTY_50", "min_volume": 100000, "min_price": 50.0},
            "entry": {
                "logic": "AND",
                "conditions": [
                    {"field": "ema_20", "operator": ">", "value": "ema_50", "timeframe": "15m", "description": "20 EMA > 50 EMA"},
                    {"field": "rsi", "operator": ">", "value": 55.0, "timeframe": "15m", "description": "RSI(14) > 55"},
                    {"field": "rsi", "operator": "<", "value": 70.0, "timeframe": "15m", "description": "RSI(14) < 70 (Not Overbought)"}
                ],
                "time_filter_start": "09:30",
                "time_filter_end": "14:30"
            },
            "exit": {
                "target_pct": 5.0,
                "stop_loss_pct": 2.0,
                "trailing_stop_pct": 1.5,
                "eod_square_off": True
            },
            "position_sizing": {"method": "PERCENT_CAPITAL", "capital_allocation": 100000.0, "risk_per_trade_pct": 1.0},
            "risk_limits": {"max_daily_loss": 8000.0, "max_open_positions": 5, "max_trades_per_day": 6, "require_stop_loss": True}
        }
    },
    {
        "id": "tpl_vwap_bounce",
        "name": "VWAP Mean Reversion Bounce",
        "description": "Buys pullbacks into VWAP support when intraday RSI is below 45 and price starts ticking back up.",
        "badge": "Intraday Pullback",
        "strategy": {
            "name": "VWAP Mean Reversion Bounce",
            "description": "Buys pullbacks into VWAP support when intraday RSI is below 45 and price starts ticking back up.",
            "universe": {"base": "NIFTY_50", "min_volume": 250000, "min_price": 100.0},
            "entry": {
                "logic": "AND",
                "conditions": [
                    {"field": "ltp", "operator": ">=", "value": "vwap", "timeframe": "5m", "description": "Price holding at or above VWAP"},
                    {"field": "rsi", "operator": "<", "value": 45.0, "timeframe": "5m", "description": "RSI(14) < 45 Pullback"},
                    {"field": "change_pct", "operator": ">=", "value": 0.0, "timeframe": "5m", "description": "Stock is green today"}
                ],
                "time_filter_start": "10:00",
                "time_filter_end": "14:00"
            },
            "exit": {
                "target_pct": 2.5,
                "stop_loss_pct": 1.2,
                "trailing_stop_pct": 0.8,
                "eod_square_off": True
            },
            "position_sizing": {"method": "RISK_BASED", "capital_allocation": 50000.0, "risk_per_trade_pct": 1.0},
            "risk_limits": {"max_daily_loss": 5000.0, "max_open_positions": 3, "max_trades_per_day": 10, "require_stop_loss": True}
        }
    }
]

def assess_strategy_risk(strategy: StrategyDefinition) -> Tuple[str, List[str]]:
    """Evaluates risk indicators for the compiled strategy."""
    notes = []
    risk_level = "LOW"

    # Stop-loss checks
    if not strategy.exit.stop_loss_pct or strategy.exit.stop_loss_pct <= 0:
        notes.append("CRITICAL: No stop loss defined. Unlimited downside exposure.")
        risk_level = "HIGH"
    elif strategy.exit.stop_loss_pct > 3.0:
        notes.append(f"Wide stop loss ({strategy.exit.stop_loss_pct}%). Potential for large drawdowns per trade.")
        if risk_level != "HIGH":
            risk_level = "MODERATE"
    else:
        notes.append(f"Disciplined {strategy.exit.stop_loss_pct}% stop-loss protects capital.")

    # Target & Risk-to-Reward
    if strategy.exit.target_pct and strategy.exit.stop_loss_pct:
        rr = strategy.exit.target_pct / strategy.exit.stop_loss_pct
        if rr < 1.0:
            notes.append(f"Warning: Risk-Reward ratio is {rr:.2f}:1 (<1:1). Needs high win rate to stay profitable.")
            if risk_level != "HIGH":
                risk_level = "MODERATE"
        else:
            notes.append(f"Favorable Risk-to-Reward ratio of {rr:.2f}:1.")

    # Universe liquidity
    if strategy.universe.base == "ALL_EQUITIES":
        notes.append("Warning: Broad universe includes illiquid small/micro-caps. Watch out for slippage.")
        if risk_level != "HIGH":
            risk_level = "MODERATE"
    else:
        notes.append(f"Targeting liquid {strategy.universe.base} universe.")

    # Time filter
    if strategy.entry.time_filter_start and strategy.entry.time_filter_start <= "09:20":
        notes.append("Entry before 09:20 AM carries high morning volatility risk.")
        if risk_level != "HIGH":
            risk_level = "MODERATE"

    return risk_level, notes

def fallback_nlp_extractor(user_prompt: str) -> StrategyDefinition:
    """
    Intelligent local rule extractor for Indian equities trading strategies.
    Parses conversational phrases into valid StrategyDefinition without requiring external LLM.
    """
    lower = user_prompt.lower()
    conditions: List[RuleCondition] = []

    # 1. Detect RSI
    rsi_match = re.search(r'rsi\s*(?:\(14\))?\s*(<|>|<=|>=|below|above|under|over|less than|greater than)\s*(\d+)', lower)
    if rsi_match:
        raw_op, val = rsi_match.groups()
        op = "<" if any(x in raw_op for x in ["<", "below", "under", "less"]) else ">"
        conditions.append(RuleCondition(
            field="rsi",
            operator=op,
            value=float(val),
            timeframe="15m",
            description=f"RSI(14) {op} {val}"
        ))

    # 2. Detect Volume spike
    vol_match = re.search(r'volume\s*(?:is\s*)?(?:>|above|spike|higher than|at least)?\s*(\d+(?:\.\d+)?)\s*x', lower)
    if vol_match:
        mult = float(vol_match.group(1))
        conditions.append(RuleCondition(
            field="volume",
            operator=">",
            value="avg_volume_20d",
            multiplier=mult,
            timeframe="15m",
            description=f"Volume > {mult}x 20-Day Average"
        ))
    elif "volume spike" in lower or "heavy volume" in lower or "surge" in lower:
        conditions.append(RuleCondition(
            field="volume",
            operator=">",
            value="avg_volume_20d",
            multiplier=2.0,
            timeframe="15m",
            description="Volume > 2.0x 20-Day Average"
        ))

    # 3. Detect EMA / Moving Average Crosses
    if "20 ema" in lower and ("above" in lower or "cross" in lower) and "50 ema" in lower:
        conditions.append(RuleCondition(
            field="ema_20",
            operator=">",
            value="ema_50",
            timeframe="15m",
            description="20 EMA > 50 EMA"
        ))
    elif "above 200 ema" in lower or "holds 200 ema" in lower:
        conditions.append(RuleCondition(
            field="ltp",
            operator=">=",
            value="ema_200",
            timeframe="15m",
            description="Price >= 200 EMA"
        ))
    elif "above 20 ema" in lower:
        conditions.append(RuleCondition(
            field="ltp",
            operator=">=",
            value="ema_20",
            timeframe="15m",
            description="Price >= 20 EMA"
        ))

    # 4. Detect VWAP
    if "above vwap" in lower or "crosses vwap" in lower or "vwap bounce" in lower:
        conditions.append(RuleCondition(
            field="ltp",
            operator=">=",
            value="vwap",
            timeframe="5m",
            description="Price >= VWAP"
        ))

    # 5. Detect Change % / Breakout
    change_match = re.search(r'gain\s*(?:>|above)?\s*(\d+(?:\.\d+)?)%', lower)
    if change_match:
        gain = float(change_match.group(1))
        conditions.append(RuleCondition(
            field="change_pct",
            operator=">=",
            value=gain,
            timeframe="5m",
            description=f"Day Gain >= +{gain}%"
        ))

    # If no conditions matched, seed a sensible default
    if not conditions:
        conditions = [
            RuleCondition(field="rsi", operator="<", value=35.0, timeframe="15m", description="RSI(14) < 35"),
            RuleCondition(field="ltp", operator=">=", value="ema_200", timeframe="15m", description="Price >= 200 EMA")
        ]

    # Detect Target & Stop Loss
    target = 3.0
    sl = 1.5
    target_match = re.search(r'(?:target|profit|take profit|tp)\s*(?:of|is|=)?\s*(\d+(?:\.\d+)?)%', lower)
    if target_match:
        target = float(target_match.group(1))

    sl_match = re.search(r'(?:stop|stop loss|sl|risk)\s*(?:of|is|=)?\s*(\d+(?:\.\d+)?)%', lower)
    if sl_match:
        sl = float(sl_match.group(1))

    # Detect Universe
    universe_base = "NIFTY_50"
    if "nifty 500" in lower or "500" in lower:
        universe_base = "NIFTY_500"
    elif "all" in lower or "bse" in lower or "broad" in lower:
        universe_base = "ALL_EQUITIES"

    # Name generation
    name = "Custom Bot Setup"
    if "momentum" in lower:
        name = "Momentum Breakout Bot"
    elif "rsi" in lower:
        name = "RSI Dip Buyer Bot"
    elif "vwap" in lower:
        name = "VWAP Trend Rider Bot"
    elif "breakout" in lower:
        name = "Intraday Breakout Bot"

    strategy = StrategyDefinition(
        id=f"strat_{uuid.uuid4().hex[:8]}",
        name=name,
        description=f"Generated from trading idea: '{user_prompt[:80]}...'",
        universe=UniverseConfig(base=universe_base, min_volume=200000, min_price=20.0),
        entry=EntryRules(logic="AND", conditions=conditions, time_filter_start="09:30", time_filter_end="14:30"),
        exit=ExitRules(target_pct=target, stop_loss_pct=sl, trailing_stop_pct=round(sl * 0.75, 2), eod_square_off=True),
        position_sizing=PositionSizing(method="RISK_BASED", capital_allocation=50000.0, risk_per_trade_pct=1.0),
        risk_limits=RiskLimits(max_daily_loss=5000.0, max_open_positions=4, max_trades_per_day=10, require_stop_loss=True)
    )

    risk_score, risk_notes = assess_strategy_risk(strategy)
    strategy.risk_score = risk_score
    strategy.risk_notes = risk_notes

    return strategy

def process_user_conversation(
    user_message: str,
    history: Optional[List[Dict[str, str]]] = None,
    current_strategy: Optional[Dict[str, Any]] = None,
    model: Optional[str] = None
) -> Tuple[str, StrategyDefinition]:
    """
    Processes user conversation via xKiro AI (or local quantitative fallback)
    and returns a conversational explanation along with a structured StrategyDefinition.
    """
    system_prompt = """
You are an elite quantitative algorithm architect and trading safety officer for Indian stock markets (NSE & BSE).
Your task is to converse with the trader, interpret their strategy concept, and output BOTH a friendly, structured explanation AND a deterministic Strategy DSL JSON object.

Indian Market Rules:
- Trading hours: 09:15 to 15:30 IST.
- Common indicators: RSI(14), 20 EMA, 50 EMA, 200 EMA, VWAP, 20-Day Average Volume, Intraday Change %.
- Risk principles: Always require a stop-loss. Aim for minimum 1.5:1 to 2:1 Risk-Reward ratio.

You MUST respond strictly in the following JSON format:
{
  "explanation": "Clear, concise 2-3 sentence overview of the strategy and its key parameters.",
  "risk_assessment": "Short commentary on risks attached to this bot.",
  "strategy": {
    "name": "Concise Name",
    "description": "Detailed description of rules",
    "universe": {
      "base": "NIFTY_50" | "NIFTY_500" | "ALL_EQUITIES",
      "min_volume": 200000,
      "min_price": 20.0
    },
    "entry": {
      "logic": "AND" | "OR",
      "conditions": [
        {
          "field": "rsi" | "ltp" | "volume" | "ema_20" | "ema_50" | "ema_200" | "vwap" | "change_pct",
          "operator": ">" | "<" | ">=" | "<=" | "CROSSES_ABOVE" | "CROSSES_BELOW",
          "value": 30.0 | "ema_50" | "vwap" | "avg_volume_20d",
          "multiplier": 1.0,
          "timeframe": "15m",
          "description": "Short human label"
        }
      ],
      "time_filter_start": "09:30",
      "time_filter_end": "14:30"
    },
    "exit": {
      "target_pct": 3.0,
      "stop_loss_pct": 1.5,
      "trailing_stop_pct": 1.0,
      "eod_square_off": true
    },
    "position_sizing": {
      "method": "RISK_BASED",
      "capital_allocation": 50000.0,
      "risk_per_trade_pct": 1.0
    },
    "risk_limits": {
      "max_daily_loss": 5000.0,
      "max_open_positions": 4,
      "max_trades_per_day": 10,
      "require_stop_loss": true
    }
  }
}
"""

    if xkiro_client.api_key:
        chosen_model = model or xkiro_client.default_model
        prompt_with_context = f"User idea: '{user_message}'"
        if current_strategy:
            prompt_with_context += f"\nCurrent active strategy: {json.dumps(current_strategy)}"

        # Prepare messages in official Claude SDK format
        sdk_messages: List[Dict[str, str]] = []
        if history:
            for item in history[-4:]:
                role = "assistant" if item.get("role") in ["assistant", "bot"] else "user"
                content = item.get("content", "")
                if content:
                    sdk_messages.append({"role": role, "content": content})
        sdk_messages.append({"role": "user", "content": prompt_with_context})

        raw = ""
        used_sdk = False
        client = xkiro_client.get_anthropic_client()

        if client:
            try:
                logger.info(f"[Claude SDK] Sending request via Anthropic SDK: model={chosen_model}")
                response = client.messages.create(
                    model=chosen_model,
                    system=system_prompt,
                    max_tokens=2500,
                    messages=sdk_messages
                )
                if response.content and len(response.content) > 0:
                    raw = response.content[0].text.strip()
                    used_sdk = True
                    logger.info(f"[Claude SDK] Successfully received message ({len(raw)} chars, usage={response.usage})")
            except Exception as sdk_err:
                logger.warning(f"[Claude SDK] Anthropic SDK call failed ({type(sdk_err).__name__}: {sdk_err}). Trying OpenAI-compatible fallback...")

        # Fallback to OpenAI-compatible /chat/completions if Claude SDK format isn't supported by this model
        if not raw:
            import httpx
            headers = {
                "Authorization": f"Bearer {xkiro_client.api_key}",
                "Content-Type": "application/json"
            }
            chat_messages = [{"role": "system", "content": system_prompt}] + sdk_messages
            payload = {
                "model": chosen_model,
                "messages": chat_messages,
                "temperature": 0.2,
                "max_tokens": 2000
            }
            try:
                with httpx.Client(timeout=45.0) as http_client:
                    res = http_client.post(f"{xkiro_client.base_url}/chat/completions", headers=headers, json=payload)
                    if res.status_code == 200:
                        raw = res.json()["choices"][0]["message"]["content"].strip()
                    else:
                        error_body = res.text[:500]
                        logger.error(f"[xKiro Fallback] API error {res.status_code}: {error_body}")
                        strategy = fallback_nlp_extractor(user_message)
                        explanation = (
                            f"⚠️ **xKiro API Error** (model: `{chosen_model}`): {error_body}\n\n"
                            f"I've used the **local rule parser** as a fallback.\n\n"
                            f"**{strategy.name}** — {len(strategy.entry.conditions)} condition(s) on **{strategy.universe.base}**."
                        )
                        return explanation, strategy
            except Exception as http_err:
                logger.error(f"[xKiro Fallback] Connection error: {http_err}")
                strategy = fallback_nlp_extractor(user_message)
                explanation = (
                    f"⚠️ **Connection error** to AI model: {str(http_err)}\n\n"
                    f"I've used the **local rule parser** as a fallback."
                )
                return explanation, strategy
                
        if raw:
            try:
                # Robust JSON extraction
                json_str = raw
                if "```json" in json_str:
                    json_match = re.search(r'```json\s*([\s\S]*?)```', json_str)
                    if json_match:
                        json_str = json_match.group(1).strip()
                elif "```" in json_str:
                    json_match = re.search(r'```\s*([\s\S]*?)```', json_str)
                    if json_match:
                        json_str = json_match.group(1).strip()
                
                # Try to find JSON object if still not clean
                if not json_str.startswith("{"):
                    brace_match = re.search(r'\{[\s\S]*\}', json_str)
                    if brace_match:
                        json_str = brace_match.group(0)
                
                data = json.loads(json_str)
                strat_data = data.get("strategy", {})
                strat_obj = StrategyDefinition(**strat_data)
                risk_score, risk_notes = assess_strategy_risk(strat_obj)
                strat_obj.risk_score = risk_score
                strat_obj.risk_notes = risk_notes
                explanation = data.get("explanation", "I have structured your strategy into deterministic rules.")
                risk_text = data.get("risk_assessment", "")
                if risk_text:
                    explanation += f"\n\n**Risk Assessment:** {risk_text}"
                footer = f"*Powered by Claude SDK via xKiro — {chosen_model}*" if used_sdk else f"*Powered by xKiro Gateway — {chosen_model}*"
                explanation += f"\n\n{footer}"
                logger.info(f"[Bot Chat] Successfully parsed strategy via {'Claude SDK' if used_sdk else 'HTTP'}: {strat_obj.name}")
                return explanation, strat_obj
                
            except json.JSONDecodeError as e:
                logger.error(f"[xKiro Chat] JSON parsing failed: {e}. Raw response: {raw[:300]}")
                strategy = fallback_nlp_extractor(user_message)
                explanation = (
                    f"⚠️ The AI model (`{chosen_model}`) returned a response that couldn't be parsed as a valid strategy. "
                    f"I've used the **local rule parser** as a fallback.\n\n"
                    f"**{strategy.name}** — {len(strategy.entry.conditions)} condition(s) on **{strategy.universe.base}**."
                )
                return explanation, strategy
            except Exception as parse_ex:
                logger.error(f"[xKiro Chat] Error handling response: {parse_ex}")
                strategy = fallback_nlp_extractor(user_message)
                return f"⚠️ Strategy generated using local parser due to: {parse_ex}", strategy
    else:
        logger.warning(f"[xKiro Chat] Not connected (is_connected={xkiro_client.is_connected}, has_key={bool(xkiro_client.api_key)}). Using local parser.")

    # Local fallback (when xKiro is not connected at all)
    strategy = fallback_nlp_extractor(user_message)
    explanation = (
        f"I've compiled your concept into **{strategy.name}**! "
        f"It evaluates {len(strategy.entry.conditions)} entry condition(s) on the **{strategy.universe.base}** universe, "
        f"locking in profits at **+{strategy.exit.target_pct}%** with strict risk management via a **{strategy.exit.stop_loss_pct}% stop-loss**.\n\n"
        f"⚠️ *xKiro AI is not connected. Connect your API key in the chat header for AI-powered strategy generation.*"
    )
    return explanation, strategy

