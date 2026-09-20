import pytest
from app.engine.vwap_calculator import OrderBookVWAPCalculator

def test_vwap_ask_calculation():
    asks = [(1000.0, 50), (1001.0, 100), (1002.0, 200)]
    # Buy 100 qty: 50 @ 1000 + 50 @ 1001 = (50000 + 50050) / 100 = 1000.5
    vwap, l1_ask, total_qty = OrderBookVWAPCalculator.calculate_vwap_ask(asks, 100)
    assert vwap == 1000.5
    assert l1_ask == 1000.0
    assert total_qty == 350

def test_vwap_bid_calculation():
    bids = [(1030.0, 50), (1029.0, 100)]
    # Sell 100 qty: 50 @ 1030 + 50 @ 1029 = (51500 + 51450) / 100 = 1029.5
    vwap, l1_bid, total_qty = OrderBookVWAPCalculator.calculate_vwap_bid(bids, 100)
    assert vwap == 1029.5
    assert l1_bid == 1030.0
    assert total_qty == 150

def test_gross_executable_premium():
    cash_asks = [(1000.0, 100)]
    fut_bids = [(1030.0, 100)]
    res = OrderBookVWAPCalculator.process_orderbook(cash_asks, fut_bids, 100)
    # Executable spread: (1030 - 1000) / 1000 * 100 = 3.0%
    assert res.gross_premium_pct == 3.0
    assert res.is_liquidity_sufficient == True
