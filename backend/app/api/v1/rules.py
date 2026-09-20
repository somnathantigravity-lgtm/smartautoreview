from fastapi import APIRouter, HTTPException
from app.models.schemas import RuleCreateModel, RuleTestModel
from app.engine.rule_engine import rule_engine
from app.engine.universe_provider import universe_provider

router = APIRouter()

@router.get("/rules")
def list_rules():
    return {
        "rules": rule_engine.get_rules()
    }

@router.post("/rules")
def create_rule(body: RuleCreateModel):
    new_rule = rule_engine.create_rule(body)
    return {
        "message": f"Rule '{new_rule['name']}' created successfully",
        "rule": new_rule
    }

@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: str):
    success = rule_engine.delete_rule(rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"message": f"Rule '{rule_id}' deleted successfully"}

@router.patch("/rules/{rule_id}/toggle")
def toggle_rule(rule_id: str, is_active: bool):
    rule = rule_engine.toggle_rule(rule_id, is_active)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"message": "Rule state updated", "rule": rule}

@router.post("/rules/test")
def test_rule(body: RuleTestModel):
    stock = universe_provider.get_stock(body.symbol)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock '{body.symbol}' not found")
    chart_info = universe_provider.get_chart_data(body.symbol, timeframe="15m", bars=50)
    technicals = chart_info["technicals"]

    temp_rule = {
        "conditions": [c.model_dump() for c in body.conditions],
        "logic_operator": body.logic_operator
    }
    is_triggered, details = rule_engine.evaluate_rule(temp_rule, stock, technicals)

    return {
        "symbol": body.symbol,
        "is_triggered": is_triggered,
        "details": details,
        "stock_data": stock,
        "technicals": technicals
    }
