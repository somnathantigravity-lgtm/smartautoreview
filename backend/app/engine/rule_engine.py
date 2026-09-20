import time
import uuid
import logging
from typing import Dict, Any, List, Tuple, Optional
from app.models.schemas import RuleCreateModel, DynamicCondition

logger = logging.getLogger(__name__)

class RuleEngine:
    def __init__(self):
        self.rules: Dict[str, Dict[str, Any]] = {}
        self.trigger_history: List[Dict[str, Any]] = []
        self._seed_default_rules()

    def _seed_default_rules(self):
        """Initializes a couple of popular dynamic templates so the user immediately has working examples."""
        self.create_rule(RuleCreateModel(
            name="RSI Oversold Momentum Reversal",
            symbol="ALL_NIFTY50",
            exchange="NSE",
            description="Fires when RSI(14) drops below 35 and price holds above 200 EMA.",
            logic_operator="AND",
            conditions=[
                DynamicCondition(field="rsi", operator="<", value=35.0, timeframe="15m"),
                DynamicCondition(field="ltp", operator=">=", value="ema_200", timeframe="15m")
            ],
            action_type="ALERT"
        ))
        self.create_rule(RuleCreateModel(
            name="Golden Cross 20/50 EMA Breakout",
            symbol="TATASTEEL",
            exchange="NSE",
            description="Triggers when 20 EMA is above 50 EMA and Volume is surging.",
            logic_operator="AND",
            conditions=[
                DynamicCondition(field="ema_20", operator=">", value="ema_50", timeframe="15m"),
                DynamicCondition(field="change_pct", operator=">=", value=1.5, timeframe="15m")
            ],
            action_type="ALERT"
        ))

    def create_rule(self, rule_input: RuleCreateModel) -> Dict[str, Any]:
        rule_id = f"RULE-{uuid.uuid4().hex[:8].upper()}"
        rule_record = {
            "id": rule_id,
            "name": rule_input.name,
            "symbol": rule_input.symbol.upper(),
            "exchange": rule_input.exchange or "NSE",
            "description": rule_input.description or "",
            "logic_operator": rule_input.logic_operator.upper(),
            "conditions": [c.model_dump() for c in rule_input.conditions],
            "action_type": rule_input.action_type,
            "is_active": True,
            "created_at": time.time(),
            "last_triggered_at": None,
            "trigger_count": 0
        }
        self.rules[rule_id] = rule_record
        return rule_record

    def get_rules(self) -> List[Dict[str, Any]]:
        return list(self.rules.values())

    def get_rule(self, rule_id: str) -> Optional[Dict[str, Any]]:
        return self.rules.get(rule_id)

    def delete_rule(self, rule_id: str) -> bool:
        if rule_id in self.rules:
            del self.rules[rule_id]
            return True
        return False

    def toggle_rule(self, rule_id: str, is_active: bool) -> Optional[Dict[str, Any]]:
        if rule_id in self.rules:
            self.rules[rule_id]["is_active"] = is_active
            return self.rules[rule_id]
        return None

    def evaluate_condition(
        self,
        cond: Dict[str, Any],
        stock_data: Dict[str, Any],
        technicals: Dict[str, Any]
    ) -> Tuple[bool, str]:
        """Evaluates a single dynamic condition against live stock + technical metrics."""
        field = cond.get("field", "").lower()
        operator = cond.get("operator", "")
        raw_val = cond.get("value")

        # Extract left-hand value
        left_val = None
        if field in stock_data:
            left_val = stock_data[field]
        elif field in technicals:
            left_val = technicals[field]
        else:
            return False, f"Unknown field '{field}'"

        # Resolve right-hand value (can be a literal number or another field like 'ema_50')
        right_val = None
        if isinstance(raw_val, str) and (raw_val in stock_data or raw_val in technicals):
            right_val = stock_data.get(raw_val) if raw_val in stock_data else technicals.get(raw_val)
        else:
            try:
                right_val = float(raw_val)
            except (ValueError, TypeError):
                right_val = str(raw_val)

        # Comparative evaluation
        passed = False
        try:
            if operator == ">":
                passed = float(left_val) > float(right_val)
            elif operator == "<":
                passed = float(left_val) < float(right_val)
            elif operator in [">=", "crosses_above"]:
                passed = float(left_val) >= float(right_val)
            elif operator in ["<=", "crosses_below"]:
                passed = float(left_val) <= float(right_val)
            elif operator == "==":
                passed = (left_val == right_val)
            elif operator == "!=":
                passed = (left_val != right_val)
            elif operator == "touches":
                # within 0.25% threshold
                diff_pct = abs(float(left_val) - float(right_val)) / max(0.0001, float(right_val)) * 100
                passed = diff_pct <= 0.25
        except Exception as e:
            logger.debug(f"Condition comparison error: {e}")
            return False, str(e)

        desc = f"{field} ({left_val}) {operator} {raw_val} ({right_val}) -> {'PASS' if passed else 'FAIL'}"
        return passed, desc

    def evaluate_rule(
        self,
        rule: Dict[str, Any],
        stock_data: Dict[str, Any],
        technicals: Dict[str, Any]
    ) -> Tuple[bool, List[str]]:
        """Evaluates all conditions of a rule according to its logic operator (AND / OR)."""
        conditions = rule.get("conditions", [])
        if not conditions:
            return False, []

        logic = rule.get("logic_operator", "AND").upper()
        details = []
        eval_results = []

        for c in conditions:
            passed, desc = self.evaluate_condition(c, stock_data, technicals)
            eval_results.append(passed)
            details.append(desc)

        is_triggered = all(eval_results) if logic == "AND" else any(eval_results)
        return is_triggered, details

rule_engine = RuleEngine()
