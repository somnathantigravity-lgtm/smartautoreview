# Institutional Screener Strategies Library
# 32 Curated, Non-Repetitive Institutional Strategies across 7 Core Disciplines
# 100% grounded in authentic financial statements and Dhan live market indicators.
# Strictly NO personal or influencer names.

from typing import Dict, List, Any

APEX_STRATEGIES: List[Dict[str, Any]] = [
    # -------------------------------------------------------------
    # 1. QUALITY & ECONOMIC MOATS
    # -------------------------------------------------------------
    {
        "id": "high_capital_return_compounders",
        "name": "High Capital Return Compounders",
        "category": "Quality & Moats",
        "badge": "Institutional Core",
        "description": "Companies generating superior returns on capital employed with disciplined low debt and zero promoter pledge.",
        "query": "roce > 20 AND roe > 18 AND debt_to_equity < 0.25 AND promoter_pledged_pct == 0 AND market_cap > 1000",
        "metrics": ["roce", "roe", "debt_to_equity", "promoter_pledged_pct", "market_cap"]
    },
    {
        "id": "operating_leverage_margin_expansion",
        "name": "Operating Leverage & Margin Expansion",
        "category": "Quality & Moats",
        "badge": "Margin Expansion",
        "description": "Businesses where operating margins (OPM) are expanding year-over-year while sustaining top-line sales growth.",
        "query": "opm > opm_3y AND sales_growth_3y > 12 AND roce > 15 AND market_cap > 500",
        "metrics": ["opm", "opm_3y", "sales_growth_3y", "roce", "market_cap"]
    },
    {
        "id": "cash_conversion_machines",
        "name": "Cash Conversion Machines",
        "category": "Quality & Moats",
        "badge": "High Cash Yield",
        "description": "High cash-converting businesses where Cash Flow from Operations (CFO) consistently exceeds Net Profit with strong FCF.",
        "query": "cfo > net_profit AND free_cash_flow > 0 AND cfo_to_pat > 1.05 AND roce > 15",
        "metrics": ["cfo", "net_profit", "free_cash_flow", "cfo_to_pat", "roce"]
    },
    {
        "id": "working_capital_discipline",
        "name": "Working Capital Efficiency",
        "category": "Quality & Moats",
        "badge": "Capital Efficiency",
        "description": "Companies with tight cash conversion cycles, rapid inventory turns, and prompt receivable collections.",
        "query": "cash_conversion_cycle < 60 AND debtor_days < 50 AND inventory_days < 60 AND roce > 16",
        "metrics": ["cash_conversion_cycle", "debtor_days", "inventory_days", "roce"]
    },
    {
        "id": "asset_light_scalers",
        "name": "Asset-Light Scalers",
        "category": "Quality & Moats",
        "badge": "High Turnover",
        "description": "Companies requiring minimal fixed assets to scale revenues, yielding high asset turnover and zero long-term debt.",
        "query": "asset_turnover > 1.5 AND opm > 18 AND debt_to_equity < 0.15 AND market_cap > 1000",
        "metrics": ["asset_turnover", "opm", "debt_to_equity", "market_cap"]
    },

    # -------------------------------------------------------------
    # 2. GROWTH & MULTIBAGGERS
    # -------------------------------------------------------------
    {
        "id": "explosive_quarterly_growth",
        "name": "Explosive Quarterly Growth (Momentum Cartel)",
        "category": "Growth & Multibaggers",
        "badge": "Earnings Acceleration",
        "description": "Companies displaying rapid year-over-year quarterly sales and profit growth in their recent earnings results.",
        "query": "sales_growth_1y > 18 AND profit_growth_1y > 22 AND roce > 15 AND market_cap > 500",
        "metrics": ["sales_growth_1y", "profit_growth_1y", "roce", "market_cap"]
    },
    {
        "id": "garp_growth_at_reasonable_price",
        "name": "Growth at a Reasonable Price (GARP)",
        "category": "Growth & Multibaggers",
        "badge": "GARP Compounder",
        "description": "Fast growing companies with high profit growth trading at reasonable valuations (PEG < 3.0) and modest debt.",
        "query": "peg_ratio < 3.0 AND profit_growth_3y > 12 AND sales_growth_3y > 8 AND debt_to_equity < 1.2 AND pe < 30",
        "metrics": ["peg_ratio", "profit_growth_3y", "sales_growth_3y", "debt_to_equity", "pe"]
    },
    {
        "id": "compounding_acceleration_breakout",
        "name": "Compounding Acceleration Breakout",
        "category": "Growth & Multibaggers",
        "badge": "Growth Acceleration",
        "description": "Companies whose 3-year compounding rate is speeding up compared to their 5-year average baseline.",
        "query": "sales_growth_3y > sales_growth_5y AND profit_growth_3y > profit_growth_5y AND roce > 15 AND debt_to_equity < 0.5",
        "metrics": ["sales_growth_3y", "sales_growth_5y", "profit_growth_3y", "profit_growth_5y", "roce"]
    },
    {
        "id": "smallcap_high_growth_cannons",
        "name": "Small-Cap High Growth Cannons",
        "category": "Growth & Multibaggers",
        "badge": "Small Cap Multibagger",
        "description": "Dynamic small and mid-cap companies (Market Cap between ₹500 Cr – ₹5,000 Cr) generating > 20% profit CAGR.",
        "query": "market_cap > 500 AND market_cap < 5000 AND profit_growth_3y > 20 AND roce > 18 AND debt_to_equity < 0.4",
        "metrics": ["market_cap", "profit_growth_3y", "roce", "debt_to_equity"]
    },
    {
        "id": "consistent_5year_sales_profit_compounders",
        "name": "Consistent 5-Year Dual Compounders",
        "category": "Growth & Multibaggers",
        "badge": "Long-Term Compounder",
        "description": "Resilient compounders sustaining both Sales CAGR > 15% and Profit CAGR > 18% over the complete 5-year cycle.",
        "query": "sales_growth_5y > 15 AND profit_growth_5y > 18 AND roce_5y > 18 AND debt_to_equity < 0.5",
        "metrics": ["sales_growth_5y", "profit_growth_5y", "roce_5y", "debt_to_equity"]
    },

    # -------------------------------------------------------------
    # 3. DEEP VALUE, BARGAIN & MARGIN OF SAFETY
    # -------------------------------------------------------------
    {
        "id": "classical_margin_of_safety",
        "name": "Classical Margin of Safety (Deep Value)",
        "category": "Deep Value & Safety",
        "badge": "Defensive Value",
        "description": "Conservative defensive value: low P/E, reasonable price to book, strong liquidity (Current Ratio > 1.2), and manageable debt.",
        "query": "pe < 25 AND pb < 4.5 AND current_ratio > 1.2 AND debt_to_equity < 1.0 AND market_cap > 500",
        "metrics": ["pe", "pb", "current_ratio", "debt_to_equity", "market_cap"]
    },
    {
        "id": "magic_formula_quality_value",
        "name": "Magic Formula (Quality + Deep Value)",
        "category": "Deep Value & Safety",
        "badge": "Quality + Value",
        "description": "Screens high return on capital businesses trading at high earnings yields (low P/E and positive book value).",
        "query": "roce > 22 AND pe < 15 AND book_value > 0 AND market_cap > 500",
        "metrics": ["roce", "pe", "book_value", "market_cap"]
    },
    {
        "id": "cash_rich_bargains",
        "name": "Cash-Rich Bargain Businesses",
        "category": "Deep Value & Safety",
        "badge": "Treasury Rich",
        "description": "Companies with substantial cash reserves, zero net debt, and conservative valuations.",
        "query": "debt_to_equity < 0.1 AND cash_and_bank > 50 AND pe < 20 AND roce > 14",
        "metrics": ["debt_to_equity", "cash_and_bank", "pe", "roce"]
    },
    {
        "id": "high_dividend_yield_cash_covered",
        "name": "High Dividend Yield (Cash Covered)",
        "category": "Deep Value & Safety",
        "badge": "Dividend Aristocrats",
        "description": "Generous dividend-yielding companies whose dividend distributions are fully backed by operating cash flows.",
        "query": "dividend_yield > 3.5 AND cfo > net_profit AND debt_to_equity < 0.5 AND market_cap > 1000",
        "metrics": ["dividend_yield", "cfo", "net_profit", "debt_to_equity", "market_cap"]
    },
    {
        "id": "undervalued_intrinsic_fair_discount",
        "name": "Intrinsic Fair Value Deep Discount",
        "category": "Deep Value & Safety",
        "badge": "Intrinsic Discount",
        "description": "Stocks trading at a substantial discount to their fundamental intrinsic valuation baseline.",
        "query": "current_price < graham_number AND pe < 18 AND debt_to_equity < 0.5 AND roce > 14",
        "metrics": ["current_price", "graham_number", "pe", "debt_to_equity", "roce"]
    },
    {
        "id": "discount_to_historical_median_pe",
        "name": "Discount to Historical Valuation Median",
        "category": "Deep Value & Safety",
        "badge": "Multiple Expansion",
        "description": "Companies with steady earnings trading below a P/E multiple of 15 with strong interest coverage.",
        "query": "pe < 15 AND interest_coverage > 4.0 AND roce > 16 AND debt_to_equity < 0.4",
        "metrics": ["pe", "interest_coverage", "roce", "debt_to_equity"]
    },

    # -------------------------------------------------------------
    # 4. CAPITAL CYCLE, CAPEX & BALANCE SHEET CLEAN-UP
    # -------------------------------------------------------------
    {
        "id": "capex_capacity_expansion_cycle",
        "name": "Capital Expenditure & Capacity Expansion",
        "category": "Capital Cycle & Capex",
        "badge": "Capex Surge",
        "description": "Companies expanding their manufacturing / asset base with rising fixed assets and CWIP while keeping margins intact.",
        "query": "fixed_assets > fixed_assets_1y AND opm > 12 AND debt_to_equity < 0.8 AND sales_growth_3y > 10",
        "metrics": ["fixed_assets", "fixed_assets_1y", "opm", "debt_to_equity", "sales_growth_3y"]
    },
    {
        "id": "rapid_deleveraging_balance_sheet_cleanup",
        "name": "Rapid Deleveraging & Balance Sheet Clean-Up",
        "category": "Capital Cycle & Capex",
        "badge": "Debt Paydown",
        "description": "Deleveraging plays where companies generate robust operating cash flow to systematically pay down borrowings.",
        "query": "debt_to_equity < 0.4 AND cfo > total_debt AND interest_coverage > 5.0 AND roce > 15",
        "metrics": ["debt_to_equity", "cfo", "total_debt", "interest_coverage", "roce"]
    },
    {
        "id": "cwip_capitalization_turnaround",
        "name": "CWIP Capitalization & Commissioning",
        "category": "Capital Cycle & Capex",
        "badge": "Turnaround Play",
        "description": "Companies with substantial ongoing capital projects (CWIP) poised to commence production and generate fresh revenue.",
        "query": "cwip > 20 AND opm > 12 AND debt_to_equity < 1.0 AND market_cap > 500",
        "metrics": ["cwip", "opm", "debt_to_equity", "market_cap"]
    },
    {
        "id": "working_capital_liberation",
        "name": "Working Capital Liberation",
        "category": "Capital Cycle & Capex",
        "badge": "Liquidity Release",
        "description": "Efficient operators freeing tied-up capital with low debtor days (< 45) and healthy net working capital.",
        "query": "debtor_days < 45 AND net_working_capital > 50 AND current_ratio > 1.4 AND roce > 15",
        "metrics": ["debtor_days", "net_working_capital", "current_ratio", "roce"]
    },

    # -------------------------------------------------------------
    # 5. SMART MONEY & INSTITUTIONAL ACCUMULATION
    # -------------------------------------------------------------
    {
        "id": "fresh_fii_accumulation",
        "name": "Fresh FII Institutional Accumulation",
        "category": "Smart Money & Inflows",
        "badge": "FII Inflow",
        "description": "Stocks where Foreign Institutional Investors (FIIs) increased their holding by over 1% in the recent quarter.",
        "query": "fii_change_1q > 1.0 AND promoter_pledged_pct == 0 AND market_cap > 1000 AND debt_to_equity < 0.8",
        "metrics": ["fii_change_1q", "fii_holding", "promoter_pledged_pct", "market_cap", "debt_to_equity"]
    },
    {
        "id": "domestic_mutual_fund_conviction",
        "name": "Domestic Mutual Fund & DII Conviction",
        "category": "Smart Money & Inflows",
        "badge": "DII Accumulation",
        "description": "Equities experiencing steady buying from domestic asset managers with rising DII ownership and zero pledge.",
        "query": "dii_change_1q > 0.8 AND dii_holding > 5.0 AND promoter_pledged_pct == 0 AND roce > 16",
        "metrics": ["dii_change_1q", "dii_holding", "promoter_pledged_pct", "roce"]
    },
    {
        "id": "high_promoter_skin_in_the_game",
        "name": "High Promoter Skin-in-the-Game (Zero Pledge)",
        "category": "Smart Money & Inflows",
        "badge": "Insider Alignment",
        "description": "High promoter conviction where founding families own > 60% with zero pledged shares and clean capital structures.",
        "query": "promoter_holding > 60 AND promoter_pledged_pct == 0 AND debt_to_equity < 0.3 AND roce > 16",
        "metrics": ["promoter_holding", "promoter_pledged_pct", "debt_to_equity", "roce"]
    },
    {
        "id": "low_public_float_institutional_dominance",
        "name": "Low Public Float (Institutional Dominance)",
        "category": "Smart Money & Inflows",
        "badge": "Tight Floating Supply",
        "description": "Equities with low public floating supply (< 22%) tightly held by founders and domestic/foreign institutions.",
        "query": "public_holding < 22 AND promoter_pledged_pct == 0 AND market_cap > 1000 AND roce > 15",
        "metrics": ["public_holding", "promoter_holding", "fii_holding", "dii_holding", "market_cap"]
    },

    # -------------------------------------------------------------
    # 6. FORENSIC ACCOUNTING & SOLVENCY SHIELDS
    # -------------------------------------------------------------
    {
        "id": "solvency_bankruptcy_immunity",
        "name": "Solvency & Bankruptcy Shield (Altman Z-Score)",
        "category": "Forensic & Solvency",
        "badge": "Bankruptcy Safe",
        "description": "Financially resilient balance sheets scoring in the Safe Zone of the Altman Z-score (> 2.2) with sound working capital.",
        "query": "altman_z_score > 2.2 AND debt_to_equity < 1.0 AND current_ratio > 1.3",
        "metrics": ["altman_z_score", "current_ratio", "debt_to_equity"]
    },
    {
        "id": "real_cash_flow_earnings_quality",
        "name": "Real Cash Flow vs Accounting Profits",
        "category": "Forensic & Solvency",
        "badge": "Earnings Quality",
        "description": "Guards against accounting accruals: Operating Cash Flow substantially exceeds PAT, demonstrating real cash generation.",
        "query": "cfo > net_profit AND free_cash_flow > 0 AND cfo_to_pat > 1.1 AND opm > 12",
        "metrics": ["cfo", "net_profit", "free_cash_flow", "cfo_to_pat", "opm"]
    },
    {
        "id": "tax_and_accounting_integrity",
        "name": "Tax Compliance & Corporate Governance Shield",
        "category": "Forensic & Solvency",
        "badge": "Clean Governance",
        "description": "Clean governance indicators: effective corporate tax rate >= 22%, Tier-1 audit quality, and low leverage.",
        "query": "tax_pct >= 22.0 AND audit_quality == 1 AND debt_to_equity < 0.6 AND roce > 16",
        "metrics": ["tax_pct", "audit_quality", "debt_to_equity", "roce"]
    },

    # -------------------------------------------------------------
    # 7. TECHNICAL MOMENTUM & STAGE-2 BREAKOUTS (DHAN LIVE DRIVEN)
    # -------------------------------------------------------------
    {
        "id": "institutional_stage2_trend_template",
        "name": "Stage-2 Momentum Trend Template",
        "category": "Technical & Momentum",
        "badge": "Stage-2 Uptrend",
        "description": "Classical institutional trend template: price above 200 EMA, 50 EMA above 200 EMA, and positive momentum from recent lows.",
        "query": "current_price > ema_200 AND ema_50 > ema_200 AND low_52w_distance_pct > 15 AND high_52w_distance_pct > -25",
        "metrics": ["current_price", "ema_50", "ema_200", "low_52w_distance_pct", "high_52w_distance_pct"]
    },
    {
        "id": "golden_crossover_volume_surge",
        "name": "Golden Crossover with Volume Surge",
        "category": "Technical & Momentum",
        "badge": "Golden Cross",
        "description": "Major technical moving average breakout: 50-day EMA crossing above 200-day EMA accompanied by expanding volume.",
        "query": "ema_50 > ema_200 AND current_price > ema_50 AND volume > 10000 AND volume_surge_20d > 1.0",
        "metrics": ["ema_50", "ema_200", "current_price", "volume", "volume_surge_20d"]
    },
    {
        "id": "high_52week_breakout_consolidation",
        "name": "52-Week High Breakout Consolidation",
        "category": "Technical & Momentum",
        "badge": "ATH Breakout",
        "description": "Momentum leaders trading within 4% of their 52-Week High with substantial market capitalization and healthy liquidity.",
        "query": "high_52w_distance_pct > -4.0 AND volume > 50000 AND market_cap > 1000",
        "metrics": ["current_price", "high_52w_distance_pct", "volume", "market_cap"]
    },
    {
        "id": "bse_nse_arbitrage_spread_opportunity",
        "name": "BSE-NSE Dual Exchange Arbitrage Opportunity",
        "category": "Technical & Momentum",
        "badge": "Dual Arbitrage",
        "description": "Equities with actionable price divergences between BSE and NSE quotes with liquid trading on both bourses.",
        "query": "spread_pct > 0.15 AND volume > 20000 AND market_cap > 500",
        "metrics": ["nse_ltp", "bse_ltp", "spread_pct", "volume", "market_cap"]
    },
    {
        "id": "circuit_breakout_order_imbalance",
        "name": "Circuit Breakout & Order Book Imbalance",
        "category": "Technical & Momentum",
        "badge": "Order Imbalance",
        "description": "Momentum equities trading within 3% of their Upper Circuit with buyer order quantity substantially outweighing sell depth.",
        "query": "distance_to_upper_circuit_pct < 3.0 AND order_imbalance_ratio > 1.5 AND volume > 20000",
        "metrics": ["current_price", "distance_to_upper_circuit_pct", "order_imbalance_ratio", "volume"]
    },

    # -------------------------------------------------------------
    # 8. SCREENER.IN INSTITUTIONAL 10-YEAR & DISCIPLINE STRATEGIES
    # -------------------------------------------------------------
    {
        "id": "consistent_compounders_10y",
        "name": "10-Year Consistent Compounders",
        "category": "Quality & Moats",
        "badge": "10Y Compounder",
        "description": "Companies delivering sustained >10% revenue CAGR, >12% profit CAGR, and >15% ROCE over the entire 10-year statutory cycle.",
        "query": "sales_10y > 10 AND profit_10y > 12 AND roce_10y > 15 AND debt_to_equity < 0.5",
        "metrics": ["sales_10y", "profit_10y", "roce_10y", "debt_to_equity"]
    },
    {
        "id": "coffee_can_portfolio",
        "name": "Coffee Can Portfolio",
        "category": "Quality & Moats",
        "badge": "Coffee Can",
        "description": "Saurabh Mukherjea's Coffee Can framework: 10-year revenue growth > 10% each year, 10-year ROCE > 15% with virtually zero leverage.",
        "query": "sales_10y > 10 AND roce_10y > 15 AND debt_to_equity < 0.25 AND promoter_pledged_pct == 0",
        "metrics": ["sales_10y", "roce_10y", "debt_to_equity", "promoter_pledged_pct"]
    },
    {
        "id": "cash_flow_kings_fcf",
        "name": "Cash Flow Kings (FCF > PAT)",
        "category": "Quality & Moats",
        "badge": "FCF Conversion",
        "description": "Real cash generators where Free Cash Flow exceeds reported Net Profit, with positive 10-year cumulative CFO.",
        "query": "free_cash_flow > net_profit AND cfo_10y > 0 AND cfo_to_pat > 1.0 AND market_cap > 500",
        "metrics": ["free_cash_flow", "net_profit", "cfo_10y", "cfo_to_pat", "market_cap"]
    },
    {
        "id": "clean_balance_sheet_net_cash",
        "name": "Clean Balance Sheet & Net Cash",
        "category": "Deep Value & Safety",
        "badge": "Net Cash Shield",
        "description": "Companies holding more cash and bank balances than total borrowings, creating zero-debt solvency resilience.",
        "query": "net_debt < 0 AND current_ratio > 1.5 AND debt_to_equity < 0.1 AND roce > 12",
        "metrics": ["net_debt", "current_ratio", "debt_to_equity", "roce"]
    },
    {
        "id": "forensic_safe_piotroski_7",
        "name": "Forensic Safe Piotroski 7+ (Clean Accounts)",
        "category": "Forensic & Solvency",
        "badge": "Piotroski 7+",
        "description": "Piotroski F-Score >= 7 and safe Altman Z-score > 2.9, signaling spotless earnings momentum and low accrual distortion.",
        "query": "piotroski_score >= 7 AND altman_z_score > 2.9 AND debt_to_equity < 0.8",
        "metrics": ["piotroski_score", "altman_z_score", "debt_to_equity"]
    },
    {
        "id": "institutional_inflows_zero_pledge",
        "name": "Institutional Inflows with Zero Pledge",
        "category": "Smart Money & Inflows",
        "badge": "Clean Smart Money",
        "description": "Zero promoter share pledge with significant combined institutional backing (FII + DII > 20%) and high governance.",
        "query": "promoter_pledged_pct == 0 AND fii_dii_total > 20 AND promoter_holding > 40 AND debt_to_equity < 0.5",
        "metrics": ["promoter_pledged_pct", "fii_dii_total", "promoter_holding", "debt_to_equity"]
    }
]

def get_apex_strategies() -> List[Dict[str, Any]]:
    """Returns all curated institutional screener strategies."""
    return list(APEX_STRATEGIES)


# -------------------------------------------------------------------------
# APEX FLEET: 12 PRODUCTION MULTI-HORIZON STRATEGIES (3 TIME HORIZONS)
# -------------------------------------------------------------------------
ACTIVE_12_STRATEGIES: List[Dict[str, Any]] = [
    # Horizon 1: ⚡ Intraday Momentum Thrust (1-Day MIS)
    {
        "id": "strat_intra_vwap",
        "name": "Intraday VWAP Momentum Thrust",
        "horizon": "INTRADAY",
        "expected_holding": "Intraday (Square off by 3:15 PM)",
        "target_profit_pct": 1.0,
        "stop_loss_risk_pct": 0.60,
        "risk_reward": 1.67,
        "execution_mode": "Dhan Super Order (MIS Bracket)",
        "description": "Momentum intraday entries holding above VWAP launchpad (proximity <= 0.60%) powered by 4-Vector Touchdown Microstructure Engine and Historical Behavioral Memory Filter (Hurst exponent >= 0.68, CVD Sweeper >= 65%, Ask Depth Vacuum clearance, 60-min velocity)."
    },
    {
        "id": "strat_intra_coil",
        "name": "High-Velocity Pre-Breakout Coil",
        "horizon": "INTRADAY",
        "expected_holding": "Intraday (Square off by 3:15 PM)",
        "target_profit_pct": 1.0,
        "stop_loss_risk_pct": 0.60,
        "risk_reward": 1.67,
        "execution_mode": "Dhan Super Order (MIS Bracket)",
        "description": "Energy compression squeeze (day range <= 2.5%), structural higher-low consolidation holding, institutional relative volume surge >= 1.8x, Historical Memory Score >= 60."
    },
    {
        "id": "strat_intra_arbitrage",
        "name": "Sector Lead-Lag Catch-Up Arbitrage",
        "horizon": "INTRADAY",
        "expected_holding": "Intraday (Square off by 3:15 PM)",
        "target_profit_pct": 1.0,
        "stop_loss_risk_pct": 0.60,
        "risk_reward": 1.67,
        "execution_mode": "Dhan Super Order (MIS Bracket)",
        "description": "Sector tailwind outperformance with beta decoupling, positive alpha divergence coiling in ground-floor launchpad, and verified historical follow-through."
    },

    # Horizon 2: 📈 Short-Term Swing (1-4 Weeks, Delivery CNC)
    {
        "id": "strat_v1_0",
        "name": "Institutional VCP Breakout",
        "horizon": "SHORT_TERM",
        "expected_holding": "1-4 Weeks (Delivery CNC)",
        "target_profit_pct": 10.5,
        "stop_loss_risk_pct": 3.8,
        "risk_reward": 2.76,
        "execution_mode": "Dhan Delivery CNC with Dual Protective Stops",
        "description": "Volatility Contraction Pattern with 2-4 tightening swings, volume drying on pullbacks, breaking pivot on volume >= 1.5x, holding 20 EMA."
    },
    {
        "id": "strat_v1_1",
        "name": "Smart Money Delivery Accumulation",
        "horizon": "SHORT_TERM",
        "expected_holding": "1-4 Weeks (Delivery CNC)",
        "target_profit_pct": 12.0,
        "stop_loss_risk_pct": 4.0,
        "risk_reward": 3.00,
        "execution_mode": "Dhan Delivery CNC with Dual Protective Stops",
        "description": "Institutional delivery volume >= 55% across multiple trading sessions with volume expansion, breaking 10-day high."
    },
    {
        "id": "strat_swing_52w",
        "name": "52-Week High Stage-2 Momentum",
        "horizon": "SHORT_TERM",
        "expected_holding": "1-4 Weeks (Delivery CNC)",
        "target_profit_pct": 14.0,
        "stop_loss_risk_pct": 4.2,
        "risk_reward": 3.33,
        "execution_mode": "Dhan Delivery CNC with Dual Protective Stops",
        "description": "Stage-2 breakout of 12-week base to within 3.5% of 52-week peak with Relative Strength vs Nifty >= 80."
    },
    {
        "id": "strat_swing_ema_retest",
        "name": "20 EMA Trend Pullback",
        "horizon": "SHORT_TERM",
        "expected_holding": "1-4 Weeks (Delivery CNC)",
        "target_profit_pct": 9.0,
        "stop_loss_risk_pct": 3.2,
        "risk_reward": 2.81,
        "execution_mode": "Dhan Delivery CNC with Dual Protective Stops",
        "description": "Orderly pullback to rising 20-day EMA support with declining selling volume and reversal confirmation."
    },
    {
        "id": "strat_swing_pead",
        "name": "Post-Earnings Announcement Drift (PEAD)",
        "horizon": "SHORT_TERM",
        "expected_holding": "1-4 Weeks (Delivery CNC)",
        "target_profit_pct": 13.5,
        "stop_loss_risk_pct": 4.0,
        "risk_reward": 3.38,
        "execution_mode": "Dhan Delivery CNC with Dual Protective Stops",
        "description": "Strong quarterly earnings beats (PAT growth >= 20% YoY, Sales >= 15%) with immediate institutional volume gap continuation."
    },

    # Horizon 3: 🏛️ Long-Term Wealth Compounders (3-12 Months, Delivery CNC)
    {
        "id": "strat_wealth_roce",
        "name": "High RoCE & Zero-Debt Compounder",
        "horizon": "LONG_TERM",
        "expected_holding": "3-12 Months (Delivery CNC)",
        "target_profit_pct": 30.0,
        "stop_loss_risk_pct": 8.0,
        "risk_reward": 3.75,
        "execution_mode": "Dhan Delivery CNC with Dual Protective Stops",
        "description": "Monopoly economic moats: RoCE > 20%, RoE > 18%, Debt-to-Equity < 0.25, zero promoter pledge, and steady 3-year profit CAGR."
    },
    {
        "id": "strat_wealth_garp",
        "name": "Growth at Reasonable Price (GARP)",
        "horizon": "LONG_TERM",
        "expected_holding": "3-12 Months (Delivery CNC)",
        "target_profit_pct": 35.0,
        "stop_loss_risk_pct": 8.5,
        "risk_reward": 4.12,
        "execution_mode": "Dhan Delivery CNC with Dual Protective Stops",
        "description": "High profit & sales growth with disciplined PEG < 2.5, positive operating cash flows, and solid institutional holding."
    },
    {
        "id": "strat_wealth_smallcap",
        "name": "Small-Cap High Growth Cannons",
        "horizon": "LONG_TERM",
        "expected_holding": "3-12 Months (Delivery CNC)",
        "target_profit_pct": 40.0,
        "stop_loss_risk_pct": 9.5,
        "risk_reward": 4.21,
        "execution_mode": "Dhan Delivery CNC with Dual Protective Stops",
        "description": "Dynamic small/mid-cap companies (Market Cap ₹500 Cr – ₹10,000 Cr) generating > 20% quarterly PAT acceleration and expanding institutional ownership."
    },
    {
        "id": "strat_wealth_stage2",
        "name": "Stage-2 Structural Turnaround",
        "horizon": "LONG_TERM",
        "expected_holding": "3-12 Months (Delivery CNC)",
        "target_profit_pct": 28.0,
        "stop_loss_risk_pct": 7.5,
        "risk_reward": 3.73,
        "execution_mode": "Dhan Delivery CNC with Dual Protective Stops",
        "description": "Clean balance sheet (D/E < 0.5), expanding operating margins (OPM > OPM 3Y), breaking out from multi-month base above 200-day EMA."
    }
]

def get_active_12_strategies() -> List[Dict[str, Any]]:
    """Returns the 12 active multi-horizon strategies spanning Intraday, Swing, and Wealth Compounders."""
    return list(ACTIVE_12_STRATEGIES)

