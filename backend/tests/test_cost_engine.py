import pytest
from app.engine.cost_engine import CostEngine

def test_cost_engine_calculation():
    engine = CostEngine()
    res = engine.calculate(cash_vwap_ask=1002.0, futures_vwap_bid=1023.0, lot_size=250, estimated_slippage_pct=0.05)
    
    assert res.total_cost_rs > 0
    assert res.stt > 0
    assert res.total_cost_pct > 0.1
    assert res.brokerage == 80.0

def test_custom_cost_rule_addition():
    engine = CostEngine()
    initial_res = engine.calculate(cash_vwap_ask=1000.0, futures_vwap_bid=1025.0, lot_size=100)
    initial_cost = initial_res.total_cost_rs
    
    # Add custom rule: "Handling Surcharge" of 0.1%
    engine.add_custom_rule(
        name="Handling Surcharge",
        instrument_type="CASH",
        transaction_side="BUY",
        calculation_type="PERCENTAGE",
        rate=0.1,
        fixed_amount=0.0
    )
    
    new_res = engine.calculate(cash_vwap_ask=1000.0, futures_vwap_bid=1025.0, lot_size=100)
    # Cash notional = 100,000. 0.1% surcharge = Rs 100.
    assert new_res.total_cost_rs == pytest.approx(initial_cost + 100.0, 0.1)
    assert new_res.custom_charges == pytest.approx(100.0, 0.1)
