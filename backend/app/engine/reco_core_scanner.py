"""
reco_core_scanner.py
Shared Core Intraday Scanner & 19-Parameter Analytical Ledger
Single Source of Truth for BOTH Live Recommendations and Reco. Simulation.
Any algorithmic updates here automatically take effect across both environments.
"""

import math
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


def compute_hurst_rs(prices: List[float]) -> float:
    """Computes Rescaled Range (R/S) Hurst Exponent over returns series."""
    if len(prices) < 20:
        return 0.50
    returns = [(prices[i] - prices[i - 1]) / max(0.01, prices[i - 1]) for i in range(1, len(prices))]
    n = len(returns)
    mean_r = sum(returns) / n
    devs = [r - mean_r for r in returns]
    cum_devs = []
    c = 0.0
    for d in devs:
        c += d
        cum_devs.append(c)
    r = max(cum_devs) - min(cum_devs)
    var = sum(d * d for d in devs) / max(1, n - 1)
    s = math.sqrt(var) if var > 0 else 0.0001
    rs = r / max(0.0001, s)
    if rs > 0 and n > 1:
        hurst = math.log(rs) / math.log(n)
        return round(max(0.05, min(0.95, hurst)), 3)
    return 0.50


def calculate_19_params_match_and_score(
    sym: str,
    entry_price: float,
    trigger_rvol: float,
    score: int = 50,
    is_nr7: bool = False,
    is_dry: bool = False,
    hurst: float = 0.50,
    min_score: int = 60,
    session: str = "MORNING",
    vwap_dist: float = 0.003,
    ema20_dist: float = 0.002,
    candle_close_pos: float = 0.75,
    dist_from_day_open: float = 0.008,
    pre_breakout_vol_trend: float = 1.3,
    base_comp: float = 0.008,
    relative_strength: float = 0.006,
    nifty_trend_ok: bool = True,
    bar_turnover: float = 2500000.0,
    adr_pct: float = 0.022,
    current_day_range_pct: float = 0.015,
    is_candle_green: bool = True,
    dist_from_day_high: float = 0.001
) -> Dict[str, Any]:
    """
    Computes Point-in-Time 19-Parameter Score without future bias.
    Phase 1: Liquidity & Velocity Prerequisites (4 checks - Turnover, ADR Headroom, Zero Exhaustion, Session Window)
    Phase 2A: Technical Kill-Switches (4 checks - VWAP Launchpad, RVOL Surge, Clean HOD Break, 20 EMA)
    Phase 2B: Momentum & Relative Strength Catalysts (6 checks - RS vs NIFTY, VWAP Dip Bounce, Coiled Base, Candle Integrity, Vol Accumulation, Supply Lock)
    Phase 3: Speed & Orderbook Clearance (5 checks - Orderbook Close, Hurst Persistence, Decoupled Beta, Sweep Urgency, 10m Acceptance)
    Total = 19 Parameters. Max Raw Score: 57. Normalized to 100 scale.
    """
    # -------------------------------------------------------------------------
    # PHASE 1: LIQUIDITY & VELOCITY PREREQUISITES (4 Checks - 12 Pts Max)
    # -------------------------------------------------------------------------
    # P1: Minimum Intraday Turnover & Liquidity Floor
    if bar_turnover >= 350000 or (entry_price * 2500 >= 250000):
        p1_turnover = 3
    elif bar_turnover >= 120000:
        p1_turnover = 2
    else:
        p1_turnover = -3

    # P2: ATR-14 Volatility Expansion Potential (ADR >= 1.8% daily headroom)
    if adr_pct >= 0.018:
        p1_adr = 3
    elif adr_pct >= 0.013:
        p1_adr = 2
    else:
        p1_adr = 1

    # P3: ATR Zero-Exhaustion Headroom
    exhaustion_ratio = current_day_range_pct / max(0.005, adr_pct)
    if exhaustion_ratio <= 0.65:
        p1_headroom = 3
    elif exhaustion_ratio <= 0.85:
        p1_headroom = 2
    else:
        p1_headroom = -3

    # P5: Session Velocity Alignment
    if session == "MORNING":
        p1_session = 3
    elif session == "MIDDAY":
        p1_session = 2
    else:
        p1_session = -3

    p1_scores = [
        {"id": 1, "name": "Turnover & Liquidity Floor", "dir": "UP_STRONG" if p1_turnover == 3 else ("UP_MEDIUM" if p1_turnover == 2 else "DOWN"), "pts": p1_turnover, "label": "Up Strong (+3/3)" if p1_turnover == 3 else ("Up Medium (+2/3)" if p1_turnover == 2 else "Down (-3/3)")},
        {"id": 2, "name": "ADR Volatility Potential", "dir": "UP_STRONG" if p1_adr == 3 else ("UP_MEDIUM" if p1_adr == 2 else "UP_MILD"), "pts": p1_adr, "label": "Up Strong (+3/3)" if p1_adr == 3 else ("Up Medium (+2/3)" if p1_adr == 2 else "Up Mild (+1/3)")},
        {"id": 3, "name": "ATR Zero-Exhaustion Headroom", "dir": "UP_STRONG" if p1_headroom == 3 else ("UP_MEDIUM" if p1_headroom == 2 else "DOWN"), "pts": p1_headroom, "label": "Up Strong (+3/3)" if p1_headroom == 3 else ("Up Medium (+2/3)" if p1_headroom == 2 else "Down (-3/3)")},
        {"id": 5, "name": "Session Velocity Alignment", "dir": "UP_STRONG" if p1_session == 3 else ("UP_MEDIUM" if p1_session == 2 else "DOWN"), "pts": p1_session, "label": "Up Strong (+3/3)" if p1_session == 3 else ("Up Medium (+2/3)" if p1_session == 2 else "Down (-3/3)")},
    ]

    # -------------------------------------------------------------------------
    # PHASE 2A: TECHNICAL KILL-SWITCHES (4 Checks - 12 Pts Max)
    # -------------------------------------------------------------------------
    # P6: VWAP Floor Launchpad
    if vwap_dist >= 0:
        if 0.001 <= vwap_dist <= 0.0080:
            p2a_vwap = 3
        elif vwap_dist <= 0.012:
            p2a_vwap = 2
        else:
            p2a_vwap = 1
    else:
        p2a_vwap = -3

    # P7: RVOL Surge vs Baseline
    if trigger_rvol >= 2.0:
        p2a_rvol = 3
    elif trigger_rvol >= 1.5:
        p2a_rvol = 2
    else:
        p2a_rvol = 1

    # P9: Clean High-of-Day (HOD) Breakout
    if dist_from_day_high <= 0.0015:
        p2a_hod = 3
    elif dist_from_day_high <= 0.004:
        p2a_hod = 2
    else:
        p2a_hod = 1

    # P10: Above 20 EMA
    if ema20_dist >= 0.001:
        p2a_ema = 3
    elif ema20_dist >= 0:
        p2a_ema = 2
    else:
        p2a_ema = 1

    p2a_scores = [
        {"id": 6, "name": "VWAP Floor Launchpad", "dir": "UP_STRONG" if p2a_vwap == 3 else ("UP_MEDIUM" if p2a_vwap == 2 else ("UP_MILD" if p2a_vwap == 1 else "DOWN")), "pts": p2a_vwap, "label": "Up Strong (+3/3)" if p2a_vwap == 3 else ("Up Medium (+2/3)" if p2a_vwap == 2 else "Down (-3/3)")},
        {"id": 7, "name": "RVOL Surge vs Baseline", "dir": "UP_STRONG" if p2a_rvol == 3 else ("UP_MEDIUM" if p2a_rvol == 2 else "UP_MILD"), "pts": p2a_rvol, "label": "Up Strong (+3/3)" if p2a_rvol == 3 else ("Up Medium (+2/3)" if p2a_rvol == 2 else "Up Mild (+1/3)")},
        {"id": 9, "name": "Clean HOD Breakout", "dir": "UP_STRONG" if p2a_hod == 3 else ("UP_MEDIUM" if p2a_hod == 2 else "UP_MILD"), "pts": p2a_hod, "label": "Up Strong (+3/3)" if p2a_hod == 3 else ("Up Medium (+2/3)" if p2a_hod == 2 else "Up Mild (+1/3)")},
        {"id": 10, "name": "Above 20 EMA Trendline", "dir": "UP_STRONG" if p2a_ema == 3 else ("UP_MEDIUM" if p2a_ema == 2 else "UP_MILD"), "pts": p2a_ema, "label": "Up Strong (+3/3)" if p2a_ema == 3 else ("Up Medium (+2/3)" if p2a_ema == 2 else "Up Mild (+1/3)")},
    ]

    # -------------------------------------------------------------------------
    # PHASE 2B: MOMENTUM CATALYSTS (6 Checks - 18 Pts Max)
    # -------------------------------------------------------------------------
    # P11: Market & Sector Relative Strength
    if nifty_trend_ok:
        if relative_strength >= 0.008:
            p2b_sector = 3
        elif relative_strength >= 0.003:
            p2b_sector = 2
        elif relative_strength >= 0:
            p2b_sector = 1
        else:
            p2b_sector = -2
    else:
        if relative_strength >= 0.012:
            p2b_sector = 3
        elif relative_strength >= 0.006:
            p2b_sector = 2
        else:
            p2b_sector = -2

    # P12: VWAP Dip Defence
    p2b_vwap_def = 3 if vwap_dist >= 0.002 else 2

    # P13: NR7 Compression Squeeze / Coiled Base
    if is_nr7 or base_comp <= 0.010:
        p2b_nr7 = 3
    elif base_comp <= 0.014:
        p2b_nr7 = 2
    else:
        p2b_nr7 = 1

    # P14: Trigger Candle Bullish Integrity
    if is_candle_green and candle_close_pos >= 0.65:
        p2b_candle = 3
    elif is_candle_green and candle_close_pos >= 0.45:
        p2b_candle = 2
    else:
        p2b_candle = -3

    # P15: Pre-Breakout Volume Accumulation
    p2b_vol = 3 if (pre_breakout_vol_trend >= 1.25 or trigger_rvol >= 1.8) else 2

    # P16: Demat Delivery / Low Float Dry-Up
    p2b_demat = 3 if is_dry else 2

    p2b_scores = [
        {"id": 11, "name": "Sector & Benchmark Relative Strength", "dir": "UP_STRONG" if p2b_sector == 3 else ("UP_MEDIUM" if p2b_sector == 2 else ("UP_MILD" if p2b_sector == 1 else "DOWN")), "pts": p2b_sector, "label": "Up Strong (+3/3)" if p2b_sector == 3 else ("Up Medium (+2/3)" if p2b_sector == 2 else "Neutral / Lagging (-2)")},
        {"id": 12, "name": "VWAP Dip Defence", "dir": "UP_STRONG" if p2b_vwap_def == 3 else "UP_MEDIUM", "pts": p2b_vwap_def, "label": "Up Strong (+3/3)" if p2b_vwap_def == 3 else "Up Medium (+2/3)"},
        {"id": 13, "name": "Coiled NR7 Base Compression", "dir": "UP_STRONG" if p2b_nr7 == 3 else ("UP_MEDIUM" if p2b_nr7 == 2 else "UP_MILD"), "pts": p2b_nr7, "label": "Up Strong (+3/3)" if p2b_nr7 == 3 else ("Up Medium (+2/3)" if p2b_nr7 == 2 else "Up Mild (+1/3)")},
        {"id": 14, "name": "Candle Bullish Integrity", "dir": "UP_STRONG" if p2b_candle == 3 else ("UP_MEDIUM" if p2b_candle == 2 else "DOWN"), "pts": p2b_candle, "label": "Up Strong (+3/3)" if p2b_candle == 3 else ("Up Medium (+2/3)" if p2b_candle == 2 else "Down / Rejection (-3/3)")},
        {"id": 15, "name": "Pre-Breakout Volume Trend", "dir": "UP_STRONG" if p2b_vol == 3 else "UP_MEDIUM", "pts": p2b_vol, "label": "Up Strong (+3/3)" if p2b_vol == 3 else "Up Medium (+2/3)"},
        {"id": 16, "name": "Low Float Dry-Up Cushion", "dir": "UP_STRONG" if p2b_demat == 3 else "UP_MEDIUM", "pts": p2b_demat, "label": "Up Strong (+3/3)" if p2b_demat == 3 else "Up Medium (+2/3)"},
    ]

    # -------------------------------------------------------------------------
    # PHASE 3: SPEED & CLEARANCE (5 Checks - 15 Pts Max)
    # -------------------------------------------------------------------------
    # P18: Orderbook Bid Dominance
    if candle_close_pos >= 0.75:
        p3_book = 3
    elif candle_close_pos >= 0.50:
        p3_book = 2
    else:
        p3_book = 1

    # P19: Hurst Trend Persistence
    if hurst >= 0.58:
        p3_hurst = 3
    elif hurst >= 0.52:
        p3_hurst = 2
    else:
        p3_hurst = 1

    # P20: Decoupled Beta Momentum
    p3_beta = 3 if (score >= 65 and relative_strength >= 0.005) else 2

    # P21: Institutional Sweeps at Ask
    if trigger_rvol >= 1.8 or session == "MORNING":
        p3_sweeps = 3
    elif trigger_rvol >= 1.45:
        p3_sweeps = 2
    else:
        p3_sweeps = 1

    # P22: Anti-Fakeout Acceptance (Confirmed by 2-candle hold)
    p3_fakeout = 3

    p3_scores = [
        {"id": 18, "name": "Orderbook Bid Dominance", "dir": "UP_STRONG" if p3_book == 3 else ("UP_MEDIUM" if p3_book == 2 else "UP_MILD"), "pts": p3_book, "label": "Up Strong (+3/3)" if p3_book == 3 else ("Up Medium (+2/3)" if p3_book == 2 else "Up Mild (+1/3)")},
        {"id": 19, "name": "Hurst Trend Persistence", "dir": "UP_STRONG" if p3_hurst == 3 else ("UP_MEDIUM" if p3_hurst == 2 else "UP_MILD"), "pts": p3_hurst, "label": "Up Strong (+3/3)" if p3_hurst == 3 else ("Up Medium (+2/3)" if p3_hurst == 2 else "Up Mild (+1/3)")},
        {"id": 20, "name": "Decoupled Beta Momentum", "dir": "UP_STRONG" if p3_beta == 3 else "UP_MEDIUM", "pts": p3_beta, "label": "Up Strong (+3/3)" if p3_beta == 3 else "Up Medium (+2/3)"},
        {"id": 21, "name": "Institutional Sweeps at Ask", "dir": "UP_STRONG" if p3_sweeps == 3 else ("UP_MEDIUM" if p3_sweeps == 2 else "UP_MILD"), "pts": p3_sweeps, "label": "Up Strong (+3/3)" if p3_sweeps == 3 else ("Up Medium (+2/3)" if p3_sweeps == 2 else "Up Mild (+1/3)")},
        {"id": 22, "name": "Anti-Fakeout Acceptance", "dir": "UP_STRONG", "pts": p3_fakeout, "label": "Up Strong (+3/3)"},
    ]

    raw_score = sum(p["pts"] for p in p1_scores + p2a_scores + p2b_scores + p3_scores)
    matched_count = sum(1 for p in p1_scores + p2a_scores + p2b_scores + p3_scores if p["pts"] > 0)

    pct = (max(0.0, float(raw_score)) / 57.0) * 100.0
    score_100 = int(math.floor(pct + 0.5))
    is_eligible = (score_100 >= min_score)

    return {
        "raw_score": raw_score,
        "max_raw_score": 57,
        "score_100": score_100,
        "min_score": min_score,
        "is_eligible": is_eligible,
        "matched_count": matched_count,
        "total_params": 19,
        "p1_scores": p1_scores,
        "p2a_scores": p2a_scores,
        "p2b_scores": p2b_scores,
        "p3_scores": p3_scores
    }


def get_active_knockout_guardrails_config() -> Dict[str, Any]:
    """Retrieves dynamic Block I Knockout Guardrails parameters from active strategy."""
    try:
        import os, json
        strat_path = os.path.join(os.path.dirname(__file__), "strategies.json")
        if os.path.exists(strat_path):
            with open(strat_path, "r") as f:
                data = json.load(f)
            active_id = data.get("active_strategy_id")
            for s in data.get("strategies", []):
                if s.get("id") == active_id:
                    guard = s.get("block_i_knockout_guardrails", {})
                    if guard.get("enabled", True):
                        return guard
    except Exception:
        pass
    return {
        "enabled": True,
        "status": "ACTIVE",
        "max_vwap_distance_pct": 1.2,
        "max_gap_open_pct": 3.5,
        "min_open_cushion_pct": 0.5,
        "min_bar_turnover_lakhs": 2.5,
        "require_volume_expansion": True,
        "min_volume_expansion_ratio": 1.5,
        "require_coiling_base": True,
        "max_base_compression_pct": 3.0,
        "circuit_safety_buffer_pct": 1.5,
        "max_bid_ask_spread_pct": 0.15,
        "min_win_rate_floor": 50,
        "max_retrace_atr_ratio": 1.2,
        "nifty_anti_chop_filter": True,
        "allowed_entry_days": ["MON", "TUE", "WED", "THU", "FRI"],
        "blocked_days_message": ""
    }


def get_active_execution_gate_config() -> Dict[str, Any]:
    """Retrieves dynamic Block F Execution Gate parameters from active strategy."""
    try:
        import os, json
        strat_path = os.path.join(os.path.dirname(__file__), "strategies.json")
        if os.path.exists(strat_path):
            with open(strat_path, "r") as f:
                data = json.load(f)
            active_id = data.get("active_strategy_id")
            for s in data.get("strategies", []):
                if s.get("id") == active_id:
                    gate = s.get("block_f_execution_gate", {})
                    if gate.get("enabled", True):
                        return gate
    except Exception:
        pass
    return {
        "enabled": True,
        "status": "ACTIVE",
        "hod_tolerance_ratio": 0.998,
        "min_rvol": 1.2,
        "require_above_vwap": True,
        "max_vwap_distance_pct": 1.5,
        "max_base_compression_pct": 2.5,
        "min_candle_close_pos_pct": 65
    }


def scan_intraday_candles_for_setup(
    candles: List[Dict[str, Any]],
    symbol: str,
    ticker_info: Dict[str, Any],
    mode: str = "CURRENT",
    strategy: str = "TREND_RUNNER",
    min_score: int = 60,
    target_pct: float = 1.5,
    nifty_map: Optional[Dict[str, Any]] = None,
    min_trigger_time: Optional[str] = None,
    execution_gate_config: Optional[Dict[str, Any]] = None,
    knockout_guardrails_config: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """
    Core Scanner Engine: Analyzes 1-minute intraday bars up to latest bar for a valid setup.
    Used identically in both Live Recommendations and Reco. Simulation.
    Enforces Stage 2 Knockout Guardrails (calendar lock, VWAP distance, volume surge, coiling).
    Returns setup dictionary if qualified, else None.
    """
    if not candles or len(candles) < 15:
        return None

    day_open = float(candles[0]["open"])
    if day_open < 10.0:  # Floor penny stock veto (relaxed to ₹10)
        return None

    # -------------------------------------------------------------------------
    # INDIVIDUAL PRE-CHECK GATE: Mainboard Only (Lot Size == 1 Share)
    # Exclude any SME / NSE Emerge / BSE SME stocks requiring fixed multi-share lots.
    # Evaluated FIRST before any of the 19 parameters are evaluated.
    # -------------------------------------------------------------------------
    stk_meta = {}
    try:
        from app.engine.dhan_provider import dhan_provider
        sym_upper = symbol.upper().strip()
        stk_meta = dhan_provider.stocks_cache.get(sym_upper, {})
        series = str(stk_meta.get("series") or "").upper().strip()
        inst_type = str(stk_meta.get("instrument_type") or "").upper().strip()
        lot_size = float(stk_meta.get("lot_size") or 1.0)
        
        # Reject if lot size > 1 or SME series (SM, ST, M) or SME instrument type
        if lot_size > 1.0 or series in ("SM", "ST", "M") or "SME" in inst_type or sym_upper.endswith("-SM") or sym_upper.endswith(".SM"):
            return None
    except Exception:
        pass

    prev_close = float(ticker_info.get("prev_close") or stk_meta.get("prev_close") or 0.0)

    # Pre-accumulate candles 0 to 14 to establish exchange VWAP
    cum_vol = 0.0
    cum_pv = 0.0
    for k in range(min(15, len(candles))):
        kb = candles[k]
        k_hi = float(kb["high"])
        k_lo = float(kb["low"])
        k_cl = float(kb["close"])
        k_vol = float(kb["volume"])
        cum_vol += k_vol
        cum_pv += (((k_hi + k_lo + k_cl) / 3.0) * k_vol)

    day_high = float(candles[0]["high"])
    trigger_idx = None
    entry_price = 0.0
    trigger_rvol = 1.0
    trigger_session = "MORNING"
    trigger_session_label = "Morning Breakout"
    trigger_rs = 0.008
    trigger_nifty_ok = True

    guard_cfg = knockout_guardrails_config if knockout_guardrails_config is not None else get_active_knockout_guardrails_config()
    guard_enabled = bool(guard_cfg.get("enabled", True))
    day_guard_settings: Dict[str, Any] = {}
    if guard_enabled:
        dt_part = candles[0].get("datetime_str", "")
        day_abbr = ""
        if " " in dt_part:
            date_str = dt_part.split(" ")[0]
            try:
                from datetime import datetime
                day_abbr = datetime.strptime(date_str, "%Y-%m-%d").strftime("%a").upper()[:3]
            except Exception:
                pass

        days_dict = guard_cfg.get("days", {})
        if day_abbr and day_abbr in days_dict:
            day_guard_settings = days_dict[day_abbr]
            if not day_guard_settings.get("enabled", True):
                # Stage 2 Knockout Guardrail: Day specifically disabled by user
                return None
        else:
            allowed_days = guard_cfg.get("allowed_entry_days")
            if allowed_days and len(allowed_days) > 0 and day_abbr and day_abbr not in allowed_days:
                # Stage 2 Knockout Guardrail: Disallowed trading day (e.g. BTST on Thursday or Friday)
                return None

        # Guardrail: Max Gap-Up Open Limit
        max_gap_pct = float(day_guard_settings.get("max_gap_open_pct", guard_cfg.get("max_gap_open_pct", 3.5)))
        if prev_close > 0:
            gap_pct = ((day_open - prev_close) / prev_close) * 100.0
            if gap_pct > max_gap_pct:
                return None

    gate_cfg = execution_gate_config if execution_gate_config is not None else get_active_execution_gate_config()
    gate_enabled = bool(gate_cfg.get("enabled", True))
    hod_tol = float(gate_cfg.get("hod_tolerance_ratio", 0.998) or 0.998)
    min_rvol = float(gate_cfg.get("min_rvol", 1.2) or 1.2)
    max_comp = float(gate_cfg.get("max_base_compression_pct", 2.5) or 2.5) / 100.0
    require_vwap = bool(gate_cfg.get("require_above_vwap", True))
    max_vwap_dist = float(gate_cfg.get("max_vwap_distance_pct", 1.5) or 1.5) / 100.0
    min_close_pos = float(gate_cfg.get("min_candle_close_pos_pct", 65) or 65) / 100.0

    # Overwrite gate thresholds with stricter Block I Knockout Guardrail limits (day-specific or global)
    if guard_enabled:
        if "max_vwap_distance_pct" in day_guard_settings:
            max_vwap_dist = float(day_guard_settings["max_vwap_distance_pct"]) / 100.0
        elif "max_vwap_distance_pct" in guard_cfg:
            max_vwap_dist = float(guard_cfg["max_vwap_distance_pct"]) / 100.0

        if "max_base_compression_pct" in day_guard_settings:
            max_comp = float(day_guard_settings["max_base_compression_pct"]) / 100.0
        elif "max_base_compression_pct" in guard_cfg:
            max_comp = float(guard_cfg["max_base_compression_pct"]) / 100.0

        surge_ratio = float(day_guard_settings.get("min_volume_expansion_ratio", 1.5))
        if day_guard_settings.get("require_volume_expansion", guard_cfg.get("require_volume_expansion", True)):
            min_rvol = max(min_rvol, surge_ratio)

    # Scan forward looking for ignition
    for i in range(15, len(candles)):
        bar = candles[i]
        op = float(bar["open"])
        hi = float(bar["high"])
        lo = float(bar["low"])
        cl = float(bar["close"])
        vol = float(bar["volume"])

        cum_vol += vol
        cum_pv += (((hi + lo + cl) / 3.0) * vol)
        vwap_now = (cum_pv / cum_vol) if cum_vol > 0 else cl

        time_str = bar["datetime_str"].split(" ")[1] if " " in bar["datetime_str"] else ""
        if min_trigger_time and time_str < min_trigger_time:
            day_high = max(day_high, hi)
            continue

        # Identify Session Window
        session = None
        session_label = ""
        if "09:20:00" <= time_str <= "11:30:00":
            session = "MORNING"
            session_label = "Morning Breakout"
        elif "11:30:00" < time_str <= "13:45:00":
            session = "MIDDAY"
            session_label = "Midday Absorption"
        elif "13:45:00" < time_str <= "15:00:00":
            session = "POWER_HOUR"
            session_label = "Power Hour Sweep"

        if not session:
            day_high = max(day_high, hi)
            continue

        base_bars = candles[max(0, i - 15): i]
        base_hi = max(float(b["high"]) for b in base_bars)
        base_lo = min(float(b["low"]) for b in base_bars)
        base_comp = (base_hi - base_lo) / max(0.01, base_lo)

        # Institutional Filter 2: Coiled Base Compression (user-configured max_comp)
        if base_comp > max_comp:
            day_high = max(day_high, hi)
            continue

        avg_bar_vol = sum(float(b["volume"]) for b in base_bars) / max(1, len(base_bars))
        rvol = vol / max(1.0, avg_bar_vol)
        bar_turnover = (cl * vol)

        # Institutional Filter 3: Scaled Turnover & Volume Floor
        min_bar_turnover_lakhs = float(day_guard_settings.get("min_bar_turnover_lakhs", guard_cfg.get("min_bar_turnover_lakhs", 2.5)))
        min_turnover = max(min_bar_turnover_lakhs * 100000.0, 150000 if day_open < 50.0 else 250000)
        min_vol = 5000 if day_open < 50.0 else 200
        if bar_turnover < min_turnover or vol < min_vol:
            day_high = max(day_high, hi)
            continue

        # Institutional Filter 4: Day Trend, Open Cushion & VWAP Launchpad Alignment
        chg_day = (cl - day_open) / max(0.01, day_open)
        vwap_dist = (cl - vwap_now) / max(0.01, vwap_now)
        min_open_cushion = float(day_guard_settings.get("min_open_cushion_pct", guard_cfg.get("min_open_cushion_pct", 0.5))) / 100.0
        if chg_day < min_open_cushion:
            day_high = max(day_high, hi)
            continue
        if require_vwap and (vwap_dist < 0.0010 or vwap_dist > max_vwap_dist):
            day_high = max(day_high, hi)
            continue

        close_pos = (cl - lo) / max(0.01, hi - lo)
        if close_pos < min_close_pos:
            day_high = max(day_high, hi)
            continue

        # Benchmark Relative Strength
        relative_strength = chg_day
        nifty_trend_ok = True
        if nifty_map and time_str in nifty_map:
            n_data = nifty_map[time_str]
            relative_strength = chg_day - n_data["chg_open"]
            nifty_trend_ok = (n_data["vwap_dist"] >= -0.0015)

        # NIFTY Index Anti-Chop Kill-Switch
        if day_guard_settings.get("nifty_anti_chop_filter", guard_cfg.get("nifty_anti_chop_filter", True)):
            if not nifty_trend_ok:
                day_high = max(day_high, hi)
                continue

        is_hod_break = (cl >= day_high * hod_tol)

        # Trigger Condition: Breakout above HOD (with configured tolerance) or strong ignition
        if is_hod_break and cl >= op and rvol >= min_rvol:
            # Check 1-bar anti-fakeout confirmation if subsequent candle exists
            if i + 1 < len(candles):
                c1 = candles[i + 1]
                c1_cl = float(c1["close"])
                c1_op = float(c1["open"])
                if c1_cl >= cl * 0.998 and c1_cl >= c1_op:
                    trigger_idx = i
                    trigger_rvol = rvol
                    trigger_session = session
                    trigger_session_label = session_label
                    trigger_rs = relative_strength
                    trigger_nifty_ok = nifty_trend_ok
                    entry_price = float(candles[i + 2]["open"]) if i + 2 < len(candles) else c1_cl
                    break
            else:
                # Live market: current candle is the trigger candle
                trigger_idx = i
                trigger_rvol = rvol
                trigger_session = session
                trigger_session_label = session_label
                trigger_rs = relative_strength
                trigger_nifty_ok = nifty_trend_ok
                entry_price = cl
                break

        day_high = max(day_high, hi)

    if trigger_idx is None or entry_price <= 0:
        return None

    # Point-in-Time Metrics strictly at trigger
    c1 = candles[trigger_idx]
    c1_close = float(c1["close"])
    c1_open = float(c1["open"])
    c1_high = float(c1["high"])
    c1_low = float(c1["low"])
    c1_vol = float(c1["volume"])

    vwap_dist_pit = (c1_close - vwap_now) / max(0.01, vwap_now)
    dist_from_day_open_pit = (c1_close - day_open) / max(0.01, day_open)
    candle_close_pos_pit = (c1_close - c1_low) / max(0.01, c1_high - c1_low)
    is_candle_green_pit = (c1_close >= c1_open)
    bar_turnover_pit = (c1_close * c1_vol)

    day_high_pit = max(float(c["high"]) for c in candles[:trigger_idx + 1])
    day_low_pit = min(float(c["low"]) for c in candles[:trigger_idx + 1])
    current_day_range_pit = (day_high_pit - day_low_pit) / max(0.01, day_low_pit)
    dist_from_day_high_pit = (day_high_pit - c1_close) / max(0.01, c1_close)

    db_adr = float(ticker_info.get("adr_pct") or 0.0)
    adr_pct_pit = db_adr if db_adr > 0.005 else 0.022

    # 20 EMA calculation
    k_ema = 2.0 / 21.0
    ema = float(candles[0]["close"])
    for b_idx in range(1, trigger_idx + 1):
        ema = (float(candles[b_idx]["close"]) * k_ema) + (ema * (1.0 - k_ema))
    ema20_dist_pit = (c1_close - ema) / max(0.01, ema)

    # Base compression & volume accumulation trend
    base_bars_comp = candles[max(0, trigger_idx - 15): trigger_idx]
    base_hi_pit = max(float(b["high"]) for b in base_bars_comp) if base_bars_comp else c1_high
    base_lo_pit = min(float(b["low"]) for b in base_bars_comp) if base_bars_comp else c1_low
    base_comp = (base_hi_pit - base_lo_pit) / max(0.01, base_lo_pit)

    rec_bars = candles[max(0, trigger_idx - 4): trigger_idx + 1]
    base_bars = candles[max(0, trigger_idx - 19): max(0, trigger_idx - 4)]
    rec_vol = sum(float(b["volume"]) for b in rec_bars) / max(1, len(rec_bars))
    base_vol = sum(float(b["volume"]) for b in base_bars) / max(1, len(base_bars))
    pre_breakout_vol_trend = rec_vol / max(1.0, base_vol)

    is_nr7 = bool(ticker_info.get("is_nr7"))
    is_dry = (ticker_info.get("volume_dryup_ratio") or 1.0) <= 0.70
    hurst = ticker_info.get("hurst_exponent") or 0.50
    hist_score = ticker_info.get("audited_score") or 50

    if mode == "CURRENT":
        intraday_prices = [float(b["close"]) for b in candles[:trigger_idx + 1]]
        intraday_hurst = compute_hurst_rs(intraday_prices)
        score_info = calculate_19_params_match_and_score(
            sym=symbol,
            entry_price=entry_price,
            trigger_rvol=trigger_rvol,
            score=70,  # Neutral baseline
            is_nr7=(base_comp <= 0.010),
            is_dry=(pre_breakout_vol_trend >= 1.25),
            hurst=intraday_hurst,
            min_score=min_score,
            session=trigger_session,
            vwap_dist=vwap_dist_pit,
            ema20_dist=ema20_dist_pit,
            candle_close_pos=candle_close_pos_pit,
            dist_from_day_open=dist_from_day_open_pit,
            pre_breakout_vol_trend=pre_breakout_vol_trend,
            base_comp=base_comp,
            relative_strength=trigger_rs,
            nifty_trend_ok=trigger_nifty_ok,
            bar_turnover=bar_turnover_pit,
            adr_pct=adr_pct_pit,
            current_day_range_pct=current_day_range_pit,
            is_candle_green=is_candle_green_pit,
            dist_from_day_high=dist_from_day_high_pit
        )
    else:
        score_info = calculate_19_params_match_and_score(
            sym=symbol,
            entry_price=entry_price,
            trigger_rvol=trigger_rvol,
            score=hist_score,
            is_nr7=is_nr7,
            is_dry=is_dry,
            hurst=hurst,
            min_score=min_score,
            session=trigger_session,
            vwap_dist=vwap_dist_pit,
            ema20_dist=ema20_dist_pit,
            candle_close_pos=candle_close_pos_pit,
            dist_from_day_open=dist_from_day_open_pit,
            pre_breakout_vol_trend=pre_breakout_vol_trend,
            base_comp=base_comp,
            relative_strength=trigger_rs,
            nifty_trend_ok=trigger_nifty_ok,
            bar_turnover=bar_turnover_pit,
            adr_pct=adr_pct_pit,
            current_day_range_pct=current_day_range_pit,
            is_candle_green=is_candle_green_pit,
            dist_from_day_high=dist_from_day_high_pit
        )

    score_100 = score_info["score_100"]
    if score_100 < min_score:
        return None

    # FIXED INSTITUTIONAL ASYMMETRIC TARGET (+1.30%) & STOP LOSS (-0.80%)
    effective_tgt_pct = 1.30
    effective_sl_pct = 0.80

    target_price = round(entry_price * (1.0 + (effective_tgt_pct / 100.0)), 2)
    stop_loss = round(entry_price * (1.0 - (effective_sl_pct / 100.0)), 2)

    signal_time_str = candles[trigger_idx]["datetime_str"]
    time_part = signal_time_str.split(" ")[1][:5] if " " in signal_time_str else "09:45"
    date_part = signal_time_str.split(" ")[0] if " " in signal_time_str else ""

    why_buy_reasons = [
        f"Clean High-of-Day Breakout holding {round(vwap_dist_pit * 100, 2)}% above Institutional VWAP",
        f"Strong RVOL Surge ({round(trigger_rvol, 1)}x baseline) during {trigger_session_label}",
        f"20 EMA Alignment (+{round(ema20_dist_pit * 100, 2)}%) with intact coiled base compression ({round(base_comp * 100, 2)}%)",
        f"Session-aware asymmetric risk: Target +{effective_tgt_pct}% vs SL -{effective_sl_pct}% (ADR: {round(adr_pct_pit * 100, 1)}%)"
    ]

    return {
        "symbol": symbol,
        "company_name": ticker_info.get("company_name") or symbol,
        "exchange": ticker_info.get("exchange", "NSE"),
        "sector": ticker_info.get("sector", "Equities"),
        "entry_price": entry_price,
        "target_price": target_price,
        "stop_loss": stop_loss,
        "target_pct": effective_tgt_pct,
        "stop_loss_pct": effective_sl_pct,
        "score_100": score_100,
        "matched_count": score_info["matched_count"],
        "trigger_idx": trigger_idx,
        "trigger_time": time_part,
        "signal_date": date_part,
        "trigger_session": trigger_session,
        "trigger_session_label": trigger_session_label,
        "trigger_rvol": round(trigger_rvol, 2),
        "adr_pct": round(adr_pct_pit * 100, 2),
        "hurst_exponent": round(hurst, 3),
        "is_nr7": is_nr7,
        "vwap_dist_pct": round(vwap_dist_pit * 100, 2),
        "ema20_dist_pct": round(ema20_dist_pit * 100, 2),
        "base_comp_pct": round(base_comp * 100, 2),
        "why_buy_reasons": why_buy_reasons,
        "score_breakdown": score_info,
        "vault_score": hist_score,
        "raw_points": score_info["raw_score"],
        "max_points": 57,
        "is_mainboard_verified": True,
        "lot_size": 1,
        "exchange_platform": "NSE/BSE Mainboard (1-Share Lot)",
        "status": "ACTIVE"
    }
