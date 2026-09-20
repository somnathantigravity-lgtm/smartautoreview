from typing import List, Tuple, Dict, Any
from dataclasses import dataclass

@dataclass
class OrderBookLevel:
    price: float
    quantity: int

@dataclass
class VWAPExecutionResult:
    cash_vwap_ask: float
    futures_vwap_bid: float
    cash_l1_ask: float
    futures_l1_bid: float
    gross_premium_pct: float
    slippage_pct: float
    available_cash_qty: int
    available_futures_qty: int
    is_liquidity_sufficient: bool

class OrderBookVWAPCalculator:
    @staticmethod
    def calculate_vwap_ask(asks: List[Tuple[float, int]], required_qty: int) -> Tuple[float, float, int]:
        """
        Calculates VWAP price to BUY required_qty from cash ask levels.
        Returns: (vwap_ask, l1_ask, total_available_qty)
        """
        if not asks:
            return 0.0, 0.0, 0
            
        l1_ask = asks[0][0]
        remaining = required_qty
        accumulated_cost = 0.0
        total_available = sum(qty for _, qty in asks)
        
        for price, qty in asks:
            filled = min(remaining, qty)
            accumulated_cost += price * filled
            remaining -= filled
            if remaining <= 0:
                break
                
        if required_qty - remaining > 0:
            vwap = accumulated_cost / (required_qty - remaining)
        else:
            vwap = l1_ask
            
        return round(vwap, 2), round(l1_ask, 2), total_available

    @staticmethod
    def calculate_vwap_bid(bids: List[Tuple[float, int]], required_qty: int) -> Tuple[float, float, int]:
        """
        Calculates VWAP price to SELL required_qty into futures bid levels.
        Returns: (vwap_bid, l1_bid, total_available_qty)
        """
        if not bids:
            return 0.0, 0.0, 0
            
        l1_bid = bids[0][0]
        remaining = required_qty
        accumulated_value = 0.0
        total_available = sum(qty for _, qty in bids)
        
        for price, qty in bids:
            filled = min(remaining, qty)
            accumulated_value += price * filled
            remaining -= filled
            if remaining <= 0:
                break
                
        if required_qty - remaining > 0:
            vwap = accumulated_value / (required_qty - remaining)
        else:
            vwap = l1_bid
            
        return round(vwap, 2), round(l1_bid, 2), total_available

    @classmethod
    def process_orderbook(
        cls, 
        cash_asks: List[Tuple[float, int]], 
        futures_bids: List[Tuple[float, int]], 
        lot_size: int
    ) -> VWAPExecutionResult:
        cash_vwap_ask, cash_l1_ask, avail_cash_qty = cls.calculate_vwap_ask(cash_asks, lot_size)
        futures_vwap_bid, futures_l1_bid, avail_fut_qty = cls.calculate_vwap_bid(futures_bids, lot_size)
        
        is_liquidity_sufficient = (avail_cash_qty >= lot_size) and (avail_fut_qty >= lot_size)
        
        # Calculate Executable Gross Premium % using VWAP prices
        if cash_vwap_ask > 0:
            gross_premium_pct = ((futures_vwap_bid - cash_vwap_ask) / cash_vwap_ask) * 100.0
        else:
            gross_premium_pct = 0.0
            
        # Slippage: Difference between executable VWAP and initial L1 top-of-book
        cash_slippage = ((cash_vwap_ask - cash_l1_ask) / cash_l1_ask * 100.0) if cash_l1_ask > 0 else 0.0
        fut_slippage = ((futures_l1_bid - futures_vwap_bid) / futures_l1_bid * 100.0) if futures_l1_bid > 0 else 0.0
        total_slippage_pct = max(0.0, cash_slippage + fut_slippage)
        
        return VWAPExecutionResult(
            cash_vwap_ask=cash_vwap_ask,
            futures_vwap_bid=futures_vwap_bid,
            cash_l1_ask=cash_l1_ask,
            futures_l1_bid=futures_l1_bid,
            gross_premium_pct=round(gross_premium_pct, 4),
            slippage_pct=round(total_slippage_pct, 4),
            available_cash_qty=avail_cash_qty,
            available_futures_qty=avail_fut_qty,
            is_liquidity_sufficient=is_liquidity_sufficient
        )
