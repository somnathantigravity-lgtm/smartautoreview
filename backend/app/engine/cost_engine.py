from typing import Dict, Any, List
from dataclasses import dataclass, field

@dataclass
class CostRuleItem:
    id: str
    name: str
    instrument_type: str # 'CASH', 'FUTURES', 'BOTH'
    transaction_side: str # 'BUY', 'SELL', 'BOTH'
    calculation_type: str # 'PERCENTAGE', 'FLAT'
    rate: float = 0.0 # Percentage expressed as float (e.g. 0.1 for 0.1%)
    fixed_amount: float = 0.0 # Flat amount in INR
    is_active: bool = True
    is_custom: bool = False

@dataclass
class CostBreakdown:
    brokerage: float
    stt: float
    exchange_charges: float
    sebi_charges: float
    gst: float
    stamp_duty: float
    slippage: float
    custom_charges: float
    itemized_details: List[Dict[str, Any]]
    total_cost_rs: float
    total_cost_pct: float
    cost_version: str = "v2.0.0"

class CostEngine:
    def __init__(self):
        # Default Indian Regulatory & Transaction Costs
        self.rules: Dict[str, CostRuleItem] = {
            "brokerage": CostRuleItem(
                id="brokerage",
                name="Brokerage (Per Order Capped)",
                instrument_type="BOTH",
                transaction_side="BOTH",
                calculation_type="FLAT",
                fixed_amount=20.0, # Rs 20 per executed order (4 orders total)
                rate=0.03 # 0.03% capped at Rs 20
            ),
            "stt_cash_buy": CostRuleItem(
                id="stt_cash_buy",
                name="STT (Cash Delivery Buy)",
                instrument_type="CASH",
                transaction_side="BUY",
                calculation_type="PERCENTAGE",
                rate=0.1 # 0.1% on buy value
            ),
            "stt_cash_sell": CostRuleItem(
                id="stt_cash_sell",
                name="STT (Cash Delivery Sell Exit)",
                instrument_type="CASH",
                transaction_side="SELL",
                calculation_type="PERCENTAGE",
                rate=0.1 # 0.1% on sell value
            ),
            "stt_futures_sell": CostRuleItem(
                id="stt_futures_sell",
                name="STT (Futures Sell Turnover)",
                instrument_type="FUTURES",
                transaction_side="SELL",
                calculation_type="PERCENTAGE",
                rate=0.0125 # 0.0125% on futures sell turnover
            ),
            "exchange_cash": CostRuleItem(
                id="exchange_cash",
                name="NSE Exchange Fee (Cash)",
                instrument_type="CASH",
                transaction_side="BOTH",
                calculation_type="PERCENTAGE",
                rate=0.00297 # 0.00297%
            ),
            "exchange_futures": CostRuleItem(
                id="exchange_futures",
                name="NSE Exchange Fee (Futures)",
                instrument_type="FUTURES",
                transaction_side="BOTH",
                calculation_type="PERCENTAGE",
                rate=0.00173 # 0.00173%
            ),
            "sebi_turnover": CostRuleItem(
                id="sebi_turnover",
                name="SEBI Turnover Charge",
                instrument_type="BOTH",
                transaction_side="BOTH",
                calculation_type="PERCENTAGE",
                rate=0.0001 # Rs 10 per crore (0.0001%)
            ),
            "gst": CostRuleItem(
                id="gst",
                name="GST (18% on Brokerage & Exchange)",
                instrument_type="BOTH",
                transaction_side="BOTH",
                calculation_type="PERCENTAGE",
                rate=18.0 # 18% on (Brokerage + Exchange + SEBI)
            ),
            "stamp_duty_cash": CostRuleItem(
                id="stamp_duty_cash",
                name="Stamp Duty (Cash Buy)",
                instrument_type="CASH",
                transaction_side="BUY",
                calculation_type="PERCENTAGE",
                rate=0.015 # 0.015%
            ),
            "stamp_duty_futures": CostRuleItem(
                id="stamp_duty_futures",
                name="Stamp Duty (Futures Sell)",
                instrument_type="FUTURES",
                transaction_side="SELL",
                calculation_type="PERCENTAGE",
                rate=0.003 # 0.003%
            ),
            "ipft": CostRuleItem(
                id="ipft",
                name="IPFT Charge",
                instrument_type="BOTH",
                transaction_side="BOTH",
                calculation_type="PERCENTAGE",
                rate=0.0001 # Investor protection fund
            )
        }

    def get_all_rules(self) -> List[Dict[str, Any]]:
        return [rule.__dict__ for rule in self.rules.values()]

    def update_rule(self, rule_id: str, updates: Dict[str, Any]):
        if rule_id in self.rules:
            rule = self.rules[rule_id]
            for k, v in updates.items():
                if hasattr(rule, k):
                    setattr(rule, k, v)

    def add_custom_rule(
        self,
        name: str,
        instrument_type: str,
        transaction_side: str,
        calculation_type: str,
        rate: float,
        fixed_amount: float
    ) -> CostRuleItem:
        rule_id = f"custom_{name.lower().replace(' ', '_')}_{len(self.rules)+1}"
        new_rule = CostRuleItem(
            id=rule_id,
            name=name,
            instrument_type=instrument_type,
            transaction_side=transaction_side,
            calculation_type=calculation_type,
            rate=rate,
            fixed_amount=fixed_amount,
            is_active=True,
            is_custom=True
        )
        self.rules[rule_id] = new_rule
        return new_rule

    def delete_rule(self, rule_id: str):
        if rule_id in self.rules and self.rules[rule_id].is_custom:
            del self.rules[rule_id]

    def calculate(
        self,
        cash_vwap_ask: float,
        futures_vwap_bid: float,
        lot_size: int,
        estimated_slippage_pct: float = 0.05
    ) -> CostBreakdown:
        cash_notional = cash_vwap_ask * lot_size
        futures_notional = futures_vwap_bid * lot_size
        
        itemized = []
        total_brokerage = 0.0
        total_stt = 0.0
        total_exchange = 0.0
        total_sebi = 0.0
        total_stamp_duty = 0.0
        total_custom = 0.0
        
        # 1. Brokerage (4 orders: Cash Buy, Fut Sell, Cash Sell exit, Fut Buy exit)
        brok_rule = self.rules.get("brokerage")
        if brok_rule and brok_rule.is_active:
            b_cash_entry = min(brok_rule.fixed_amount, cash_notional * (brok_rule.rate / 100.0))
            b_fut_entry = min(brok_rule.fixed_amount, futures_notional * (brok_rule.rate / 100.0))
            b_cash_exit = b_cash_entry
            b_fut_exit = b_fut_entry
            total_brokerage = b_cash_entry + b_fut_entry + b_cash_exit + b_fut_exit
            itemized.append({"id": "brokerage", "name": brok_rule.name, "amount": round(total_brokerage, 2)})

        # 2. STT
        stt_cb = self.rules.get("stt_cash_buy")
        stt_cs = self.rules.get("stt_cash_sell")
        stt_fs = self.rules.get("stt_futures_sell")
        
        stt_cb_val = (cash_notional * (stt_cb.rate / 100.0)) if (stt_cb and stt_cb.is_active) else 0.0
        stt_cs_val = (cash_notional * (stt_cs.rate / 100.0)) if (stt_cs and stt_cs.is_active) else 0.0
        stt_fs_val = (futures_notional * (stt_fs.rate / 100.0)) if (stt_fs and stt_fs.is_active) else 0.0
        
        total_stt = stt_cb_val + stt_cs_val + stt_fs_val
        itemized.append({"id": "stt", "name": "Securities Transaction Tax (STT)", "amount": round(total_stt, 2)})

        # 3. Exchange Charges
        ex_cash = self.rules.get("exchange_cash")
        ex_fut = self.rules.get("exchange_futures")
        ex_c_val = (cash_notional * 2 * (ex_cash.rate / 100.0)) if (ex_cash and ex_cash.is_active) else 0.0
        ex_f_val = (futures_notional * 2 * (ex_fut.rate / 100.0)) if (ex_fut and ex_fut.is_active) else 0.0
        total_exchange = ex_c_val + ex_f_val
        itemized.append({"id": "exchange", "name": "Exchange Transaction Fees", "amount": round(total_exchange, 2)})

        # 4. SEBI Charges
        sebi_rule = self.rules.get("sebi_turnover")
        total_sebi = ((cash_notional * 2 + futures_notional * 2) * (sebi_rule.rate / 100.0)) if (sebi_rule and sebi_rule.is_active) else 0.0
        itemized.append({"id": "sebi", "name": "SEBI Turnover Fees", "amount": round(total_sebi, 2)})

        # 5. GST (18% on Brokerage + Exchange + SEBI)
        gst_rule = self.rules.get("gst")
        total_gst = ((total_brokerage + total_exchange + total_sebi) * (gst_rule.rate / 100.0)) if (gst_rule and gst_rule.is_active) else 0.0
        itemized.append({"id": "gst", "name": f"GST ({gst_rule.rate if gst_rule else 18}%)", "amount": round(total_gst, 2)})

        # 6. Stamp Duty
        stamp_c = self.rules.get("stamp_duty_cash")
        stamp_f = self.rules.get("stamp_duty_futures")
        sd_c_val = (cash_notional * (stamp_c.rate / 100.0)) if (stamp_c and stamp_c.is_active) else 0.0
        sd_f_val = (futures_notional * (stamp_f.rate / 100.0)) if (stamp_f and stamp_f.is_active) else 0.0
        total_stamp_duty = sd_c_val + sd_f_val
        itemized.append({"id": "stamp_duty", "name": "Stamp Duty", "amount": round(total_stamp_duty, 2)})

        # 7. Slippage Cost
        slippage_cost = cash_notional * (estimated_slippage_pct / 100.0)
        itemized.append({"id": "slippage", "name": "Orderbook Depth Slippage", "amount": round(slippage_cost, 2)})

        # 8. User-Defined Custom Cost Rules
        for rule in self.rules.values():
            if rule.is_custom and rule.is_active:
                cost_val = 0.0
                base_val = cash_notional if rule.instrument_type == "CASH" else (futures_notional if rule.instrument_type == "FUTURES" else cash_notional + futures_notional)
                if rule.calculation_type == "PERCENTAGE":
                    cost_val = base_val * (rule.rate / 100.0)
                else:
                    cost_val = rule.fixed_amount
                total_custom += cost_val
                itemized.append({"id": rule.id, "name": rule.name, "amount": round(cost_val, 2)})

        # Total Cost Sum
        total_cost_rs = (
            total_brokerage +
            total_stt +
            total_exchange +
            total_sebi +
            total_gst +
            total_stamp_duty +
            slippage_cost +
            total_custom
        )

        total_cost_pct = (total_cost_rs / cash_notional * 100.0) if cash_notional > 0 else 0.0

        return CostBreakdown(
            brokerage=round(total_brokerage, 2),
            stt=round(total_stt, 2),
            exchange_charges=round(total_exchange, 2),
            sebi_charges=round(total_sebi, 2),
            gst=round(total_gst, 2),
            stamp_duty=round(total_stamp_duty, 2),
            slippage=round(slippage_cost, 2),
            custom_charges=round(total_custom, 2),
            itemized_details=itemized,
            total_cost_rs=round(total_cost_rs, 2),
            total_cost_pct=round(total_cost_pct, 4)
        )

    def calculate_total_costs(
        self,
        instrument_type: str = "CASH",
        transaction_side: str = "BUY",
        turnover: float = 10000.0
    ) -> Dict[str, Any]:
        """Calculates exact statutory Indian transaction costs for a single stock trade."""
        # Brokerage (e.g. ₹20 flat or 0.03%)
        brok_rule = self.rules.get("brokerage")
        brokerage = min(brok_rule.fixed_amount if brok_rule else 20.0, turnover * 0.0003)

        # STT (0.1% on delivery cash buy/sell)
        stt_rule = self.rules.get("stt_cash_buy" if transaction_side.upper() == "BUY" else "stt_cash_sell")
        rate_stt = (stt_rule.rate / 100.0) if (stt_rule and stt_rule.is_active) else 0.001
        stt = turnover * rate_stt

        # Exchange charges (~0.00297%)
        ex_rule = self.rules.get("exchange_cash")
        rate_ex = (ex_rule.rate / 100.0) if (ex_rule and ex_rule.is_active) else 0.0000297
        exchange_charges = turnover * rate_ex

        # SEBI charges (₹10 per crore = 0.0001%)
        sebi_rule = self.rules.get("sebi_turnover")
        rate_sebi = (sebi_rule.rate / 100.0) if (sebi_rule and sebi_rule.is_active) else 0.000001
        sebi = turnover * rate_sebi

        # Stamp duty (0.015% on BUY only)
        stamp_duty = 0.0
        if transaction_side.upper() == "BUY":
            sd_rule = self.rules.get("stamp_duty_cash")
            rate_sd = (sd_rule.rate / 100.0) if (sd_rule and sd_rule.is_active) else 0.00015
            stamp_duty = turnover * rate_sd

        # GST 18% on (brokerage + exchange + sebi)
        gst = (brokerage + exchange_charges + sebi) * 0.18

        total = round(brokerage + stt + exchange_charges + sebi + stamp_duty + gst, 2)
        return {
            "total_cost_rs": total,
            "total_cost_pct": round((total / max(1.0, turnover)) * 100, 4),
            "itemized": {
                "brokerage": round(brokerage, 2),
                "stt": round(stt, 2),
                "exchange_charges": round(exchange_charges, 2),
                "sebi": round(sebi, 2),
                "stamp_duty": round(stamp_duty, 2),
                "gst": round(gst, 2)
            }
        }

cost_engine = CostEngine()
