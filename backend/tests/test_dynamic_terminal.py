import pytest
from app.engine.universe_provider import universe_provider
from app.engine.rule_engine import rule_engine
from app.engine.agent_engine import agent_engine
from app.engine.paper_engine import paper_engine
from app.engine.xkiro_client import xkiro_client
from app.models.schemas import RuleCreateModel, DynamicCondition, AgentCreateModel

def test_universe_provider():
    res = universe_provider.get_stocks()
    stocks = res["stocks"] if isinstance(res, dict) else res
    assert res["total"] >= 2000, "Expected at least 2000 stocks in master universe"
    assert len(stocks) >= 30, "Expected at least 30 stocks in page"
    
    # Test search filter
    tcs_res = universe_provider.get_stocks(search="TCS")
    tcs_stocks = tcs_res["stocks"] if isinstance(tcs_res, dict) else tcs_res
    assert len(tcs_stocks) >= 1
    assert tcs_stocks[0]["symbol"] == "TCS"
    
    # Test chart data and technical indicators
    chart = universe_provider.get_chart_data("RELIANCE", timeframe="15m", bars=30)
    assert len(chart["candles"]) == 30
    assert "rsi" in chart["technicals"]
    assert "ema_20" in chart["technicals"]
    assert "ema_50" in chart["technicals"]
    assert "vwap" in chart["technicals"]
    assert chart["technicals"]["rsi"] >= 0 and chart["technicals"]["rsi"] <= 100

def test_rule_engine():
    rule = rule_engine.create_rule(RuleCreateModel(
        name="Test RSI Trigger",
        symbol="INFY",
        exchange="NSE",
        description="Test RSI condition",
        logic_operator="AND",
        conditions=[
            DynamicCondition(field="rsi", operator="<", value=99.0, timeframe="15m"),
            DynamicCondition(field="ltp", operator=">", value=100.0, timeframe="15m")
        ],
        action_type="ALERT"
    ))
    assert rule["id"].startswith("RULE-")
    
    stock = {"ltp": 1500.0, "symbol": "INFY"}
    technicals = {"rsi": 45.0, "ema_20": 1490.0}
    
    triggered, details = rule_engine.evaluate_rule(rule, stock, technicals)
    assert triggered is True
    assert len(details) == 2

def test_agent_engine_and_paper_order():
    agent = agent_engine.create_agent(AgentCreateModel(
        name="Unit Test Scout",
        description="Automated test agent",
        symbol_or_scope="TATASTEEL",
        ai_model="gpt-4o",
        strategy_prompt="Confirm test setup",
        task_actions=["AI_ANALYSIS", "PAPER_ORDER", "ALERT"],
        capital_allocation=20000.0
    ))
    assert agent["id"].startswith("AGT-")
    
    # Execute agent run
    result = agent_engine.run_agent(agent["id"], force_symbol="TATASTEEL")
    assert result["success"] is True
    assert "signal" in result
    assert "conviction" in result
    assert result["conviction"] > 0
    
    # Check logs
    logs = agent_engine.get_activity_logs(limit=5)
    assert len(logs) > 0

def test_paper_trading_statutory_taxes():
    pos = paper_engine.create_order(
        symbol="SBIN",
        side="BUY",
        quantity=50,
        price=800.0,
        exchange="NSE"
    )
    assert pos["id"].startswith("POS-")
    assert pos["order_value"] == 40000.0
    # Must have non-zero statutory taxes
    assert pos["total_costs_rs"] > 0
    assert "stt" in pos["entry_costs"]["itemized"]
    assert "gst" in pos["entry_costs"]["itemized"]
    assert "exchange_charges" in pos["entry_costs"]["itemized"]

    # Close position
    closed = paper_engine.close_position(pos["id"], exit_price=820.0)
    assert closed["status"] == "CLOSED"
    assert closed["gross_pnl"] == 1000.0
    # Net PnL must be gross PnL minus real statutory transaction taxes
    assert closed["net_pnl"] < closed["gross_pnl"]

def test_xkiro_client_status():
    status = xkiro_client.get_status()
    assert "is_connected" in status
    assert "base_url" in status
