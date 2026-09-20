export interface PresetStrategy {
  id: string;
  name: string;
  category: string;
  badge: string;
  desc: string;
  query: string;
}

export const APEX_DISCIPLINES = [
  "ALL",
  "Quality & Moats",
  "Growth & Multibaggers",
  "Deep Value & Safety",
  "Capital Cycle & Capex",
  "Smart Money & Inflows",
  "Forensic & Solvency",
  "Technical & Momentum"
] as const;

export const PRESET_STRATEGIES: PresetStrategy[] = [
  // 1. QUALITY & ECONOMIC MOATS
  {
    id: "high_capital_return_compounders",
    name: "High Capital Return Compounders",
    category: "Quality & Moats",
    badge: "Institutional Core",
    desc: "Companies generating superior returns on capital employed with disciplined low debt and zero promoter pledge.",
    query: "roce > 20 AND roe > 18 AND debt_to_equity < 0.25 AND promoter_pledged_pct == 0 AND market_cap > 1000"
  },
  {
    id: "operating_leverage_margin_expansion",
    name: "Operating Leverage & Margin Expansion",
    category: "Quality & Moats",
    badge: "Margin Expansion",
    desc: "Businesses where operating margins (OPM) are expanding year-over-year while sustaining top-line sales growth.",
    query: "opm > opm_3y AND sales_growth_3y > 12 AND roce > 15 AND market_cap > 500"
  },
  {
    id: "cash_conversion_machines",
    name: "Cash Conversion Machines",
    category: "Quality & Moats",
    badge: "High Cash Yield",
    desc: "High cash-converting businesses where Cash Flow from Operations (CFO) consistently exceeds Net Profit with strong FCF.",
    query: "cfo > net_profit AND free_cash_flow > 0 AND cfo_to_pat > 1.05 AND roce > 15"
  },
  {
    id: "working_capital_discipline",
    name: "Working Capital Efficiency",
    category: "Quality & Moats",
    badge: "Capital Efficiency",
    desc: "Companies with tight cash conversion cycles, rapid inventory turns, and prompt receivable collections.",
    query: "cash_conversion_cycle < 60 AND debtor_days < 50 AND inventory_days < 60 AND roce > 16"
  },
  {
    id: "asset_light_scalers",
    name: "Asset-Light Scalers",
    category: "Quality & Moats",
    badge: "High Turnover",
    desc: "Companies requiring minimal fixed assets to scale revenues, yielding high asset turnover and zero long-term debt.",
    query: "asset_turnover > 1.5 AND opm > 18 AND debt_to_equity < 0.15 AND market_cap > 1000"
  },

  // 2. GROWTH & MULTIBAGGERS
  {
    id: "explosive_quarterly_growth",
    name: "Explosive Quarterly Growth (Momentum Cartel)",
    category: "Growth & Multibaggers",
    badge: "Earnings Acceleration",
    desc: "Companies displaying rapid year-over-year quarterly sales and profit growth in their recent earnings results.",
    query: "sales_growth_1y > 18 AND profit_growth_1y > 22 AND roce > 15 AND market_cap > 500"
  },
  {
    id: "garp_growth_at_reasonable_price",
    name: "Growth at a Reasonable Price (GARP)",
    category: "Growth & Multibaggers",
    badge: "GARP Compounder",
    desc: "Fast growing companies with high profit growth trading at reasonable valuations (PEG < 3.0) and modest debt.",
    query: "peg_ratio < 3.0 AND profit_growth_3y > 12 AND sales_growth_3y > 8 AND debt_to_equity < 1.2 AND pe < 30"
  },
  {
    id: "compounding_acceleration_breakout",
    name: "Compounding Acceleration Breakout",
    category: "Growth & Multibaggers",
    badge: "Growth Acceleration",
    desc: "Companies whose 3-year compounding rate is speeding up compared to their 5-year average baseline.",
    query: "sales_growth_3y > sales_growth_5y AND profit_growth_3y > profit_growth_5y AND roce > 15 AND debt_to_equity < 0.5"
  },
  {
    id: "smallcap_high_growth_cannons",
    name: "Small-Cap High Growth Cannons",
    category: "Growth & Multibaggers",
    badge: "Small Cap Multibagger",
    desc: "Dynamic small and mid-cap companies (Market Cap between ₹500 Cr – ₹5,000 Cr) generating > 20% profit CAGR.",
    query: "market_cap > 500 AND market_cap < 5000 AND profit_growth_3y > 20 AND roce > 18 AND debt_to_equity < 0.4"
  },
  {
    id: "consistent_5year_sales_profit_compounders",
    name: "Consistent 5-Year Dual Compounders",
    category: "Growth & Multibaggers",
    badge: "Long-Term Compounder",
    desc: "Resilient compounders sustaining both Sales CAGR > 15% and Profit CAGR > 18% over the complete 5-year cycle.",
    query: "sales_growth_5y > 15 AND profit_growth_5y > 18 AND roce_5y > 18 AND debt_to_equity < 0.5"
  },

  // 3. DEEP VALUE, BARGAIN & MARGIN OF SAFETY
  {
    id: "classical_margin_of_safety",
    name: "Classical Margin of Safety (Deep Value)",
    category: "Deep Value & Safety",
    badge: "Defensive Value",
    desc: "Conservative defensive value: low P/E, reasonable price to book, strong liquidity (Current Ratio > 1.2), and manageable debt.",
    query: "pe < 25 AND pb < 4.5 AND current_ratio > 1.2 AND debt_to_equity < 1.0 AND market_cap > 500"
  },
  {
    id: "magic_formula_quality_value",
    name: "Magic Formula (Quality + Deep Value)",
    category: "Deep Value & Safety",
    badge: "Quality + Value",
    desc: "Screens high return on capital businesses trading at high earnings yields (low P/E and positive book value).",
    query: "roce > 22 AND pe < 15 AND book_value > 0 AND market_cap > 500"
  },
  {
    id: "cash_rich_bargains",
    name: "Cash-Rich Bargain Businesses",
    category: "Deep Value & Safety",
    badge: "Treasury Rich",
    desc: "Companies with substantial cash reserves, zero net debt, and conservative valuations.",
    query: "debt_to_equity < 0.1 AND cash_and_bank > 50 AND pe < 20 AND roce > 14"
  },
  {
    id: "high_dividend_yield_cash_covered",
    name: "High Dividend Yield (Cash Covered)",
    category: "Deep Value & Safety",
    badge: "Dividend Aristocrats",
    desc: "Generous dividend-yielding companies whose dividend distributions are fully backed by operating cash flows.",
    query: "dividend_yield > 3.5 AND cfo > net_profit AND debt_to_equity < 0.5 AND market_cap > 1000"
  },
  {
    id: "undervalued_intrinsic_fair_discount",
    name: "Intrinsic Fair Value Deep Discount",
    category: "Deep Value & Safety",
    badge: "Intrinsic Discount",
    desc: "Stocks trading at a substantial discount to their fundamental intrinsic valuation baseline.",
    query: "current_price < graham_number AND pe < 18 AND debt_to_equity < 0.5 AND roce > 14"
  },
  {
    id: "discount_to_historical_median_pe",
    name: "Discount to Historical Valuation Median",
    category: "Deep Value & Safety",
    badge: "Multiple Expansion",
    desc: "Companies with steady earnings trading below a P/E multiple of 15 with strong interest coverage.",
    query: "pe < 15 AND interest_coverage > 4.0 AND roce > 16 AND debt_to_equity < 0.4"
  },

  // 4. CAPITAL EXPENDITURE & CAPITAL CYCLE
  {
    id: "capex_capacity_expansion_cycle",
    name: "Capital Expenditure & Capacity Expansion",
    category: "Capital Cycle & Capex",
    badge: "Capex Surge",
    desc: "Companies expanding their manufacturing / asset base with rising fixed assets and CWIP while keeping margins intact.",
    query: "fixed_assets > fixed_assets_1y AND opm > 12 AND debt_to_equity < 0.8 AND sales_growth_3y > 10"
  },
  {
    id: "rapid_deleveraging_balance_sheet_cleanup",
    name: "Rapid Deleveraging & Balance Sheet Clean-Up",
    category: "Capital Cycle & Capex",
    badge: "Debt Paydown",
    desc: "Deleveraging plays where companies generate robust operating cash flow to systematically pay down borrowings.",
    query: "debt_to_equity < 0.4 AND cfo > total_debt AND interest_coverage > 5.0 AND roce > 15"
  },
  {
    id: "cwip_capitalization_turnaround",
    name: "CWIP Capitalization & Commissioning",
    category: "Capital Cycle & Capex",
    badge: "Turnaround Play",
    desc: "Companies with substantial ongoing capital projects (CWIP) poised to commence production and generate fresh revenue.",
    query: "cwip > 20 AND opm > 12 AND debt_to_equity < 1.0 AND market_cap > 500"
  },
  {
    id: "working_capital_liberation",
    name: "Working Capital Liberation",
    category: "Capital Cycle & Capex",
    badge: "Liquidity Release",
    desc: "Efficient operators freeing tied-up capital with low debtor days (< 45) and healthy net working capital.",
    query: "debtor_days < 45 AND net_working_capital > 50 AND current_ratio > 1.4 AND roce > 15"
  },

  // 5. SMART MONEY & INSTITUTIONAL INFLOWS
  {
    id: "fresh_fii_accumulation",
    name: "Fresh FII Institutional Accumulation",
    category: "Smart Money & Inflows",
    badge: "FII Inflow",
    desc: "Stocks where Foreign Institutional Investors (FIIs) increased their holding by over 1% in the recent quarter.",
    query: "fii_change_1q > 1.0 AND promoter_pledged_pct == 0 AND market_cap > 1000 AND debt_to_equity < 0.8"
  },
  {
    id: "domestic_mutual_fund_conviction",
    name: "Domestic Mutual Fund & DII Conviction",
    category: "Smart Money & Inflows",
    badge: "DII Accumulation",
    desc: "Equities experiencing steady buying from domestic asset managers with rising DII ownership and zero pledge.",
    query: "dii_change_1q > 0.8 AND dii_holding > 5.0 AND promoter_pledged_pct == 0 AND roce > 16"
  },
  {
    id: "high_promoter_skin_in_the_game",
    name: "High Promoter Skin-in-the-Game (Zero Pledge)",
    category: "Smart Money & Inflows",
    badge: "Insider Alignment",
    desc: "High promoter conviction where founding families own > 60% with zero pledged shares and clean capital structures.",
    query: "promoter_holding > 60 AND promoter_pledged_pct == 0 AND debt_to_equity < 0.3 AND roce > 16"
  },
  {
    id: "low_public_float_institutional_dominance",
    name: "Low Public Float (Institutional Dominance)",
    category: "Smart Money & Inflows",
    badge: "Tight Floating Supply",
    desc: "Equities with low public floating supply (< 22%) tightly held by founders and domestic/foreign institutions.",
    query: "public_holding < 22 AND promoter_pledged_pct == 0 AND market_cap > 1000 AND roce > 15"
  },

  // 6. FORENSIC ACCOUNTING & SOLVENCY SHIELDS
  {
    id: "solvency_bankruptcy_immunity",
    name: "Solvency & Bankruptcy Shield (Altman Z-Score)",
    category: "Forensic & Solvency",
    badge: "Bankruptcy Safe",
    desc: "Financially resilient balance sheets scoring in the Safe Zone of the Altman Z-score (> 2.2) with sound working capital.",
    query: "altman_z_score > 2.2 AND debt_to_equity < 1.0 AND current_ratio > 1.3"
  },
  {
    id: "real_cash_flow_earnings_quality",
    name: "Real Cash Flow vs Accounting Profits",
    category: "Forensic & Solvency",
    badge: "Earnings Quality",
    desc: "Guards against accounting accruals: Operating Cash Flow substantially exceeds PAT, demonstrating real cash generation.",
    query: "cfo > net_profit AND free_cash_flow > 0 AND cfo_to_pat > 1.1 AND opm > 12"
  },
  {
    id: "tax_and_accounting_integrity",
    name: "Tax Compliance & Corporate Governance Shield",
    category: "Forensic & Solvency",
    badge: "Clean Governance",
    desc: "Clean governance indicators: effective corporate tax rate >= 22%, Tier-1 audit quality, and low leverage.",
    query: "tax_pct >= 22.0 AND audit_quality == 1 AND debt_to_equity < 0.6 AND roce > 16"
  },

  // 7. TECHNICAL MOMENTUM & BREAKOUTS (REAL-TIME LIVE DRIVEN)
  {
    id: "institutional_stage2_trend_template",
    name: "Stage-2 Momentum Trend Template",
    category: "Technical & Momentum",
    badge: "Stage-2 Uptrend",
    desc: "Classical institutional trend template: price above 200 EMA, 50 EMA above 200 EMA, and positive momentum from recent lows.",
    query: "current_price > ema_200 AND ema_50 > ema_200 AND low_52w_distance_pct > 15 AND high_52w_distance_pct > -25"
  },
  {
    id: "golden_crossover_volume_surge",
    name: "Golden Crossover with Volume Surge",
    category: "Technical & Momentum",
    badge: "Golden Cross",
    desc: "Major technical moving average breakout: 50-day EMA crossing above 200-day EMA accompanied by expanding volume.",
    query: "ema_50 > ema_200 AND current_price > ema_50 AND volume > 10000 AND volume_surge_20d > 1.0"
  },
  {
    id: "high_52week_breakout_consolidation",
    name: "52-Week High Breakout Consolidation",
    category: "Technical & Momentum",
    badge: "ATH Breakout",
    desc: "Momentum leaders trading within 4% of their 52-Week High with substantial market capitalization and healthy liquidity.",
    query: "high_52w_distance_pct > -4.0 AND volume > 50000 AND market_cap > 1000"
  },
  {
    id: "bse_nse_arbitrage_spread_opportunity",
    name: "BSE-NSE Dual Exchange Arbitrage Opportunity",
    category: "Technical & Momentum",
    badge: "Dual Arbitrage",
    desc: "Equities with actionable price divergences between BSE and NSE quotes with liquid trading on both bourses.",
    query: "spread_pct > 0.15 AND volume > 20000 AND market_cap > 500"
  },
  {
    id: "circuit_breakout_order_imbalance",
    name: "Circuit Breakout & Order Book Imbalance",
    category: "Technical & Momentum",
    badge: "Order Imbalance",
    desc: "Momentum equities trading within 3% of their Upper Circuit with buyer order quantity substantially outweighing sell depth.",
    query: "distance_to_upper_circuit_pct < 3.0 AND order_imbalance_ratio > 1.5 AND volume > 20000"
  },

  // 8. SCREENER.IN INSTITUTIONAL 10-YEAR & DISCIPLINE STRATEGIES
  {
    id: "consistent_compounders_10y",
    name: "10-Year Consistent Compounders",
    category: "Quality & Moats",
    badge: "10Y Compounder",
    desc: "Companies delivering sustained >10% revenue CAGR, >12% profit CAGR, and >15% ROCE over the entire 10-year statutory cycle.",
    query: "sales_10y > 10 AND profit_10y > 12 AND roce_10y > 15 AND debt_to_equity < 0.5"
  },
  {
    id: "coffee_can_portfolio",
    name: "Coffee Can Portfolio",
    category: "Quality & Moats",
    badge: "Coffee Can",
    desc: "Saurabh Mukherjea's Coffee Can framework: 10-year revenue growth > 10% each year, 10-year ROCE > 15% with virtually zero leverage.",
    query: "sales_10y > 10 AND roce_10y > 15 AND debt_to_equity < 0.25 AND promoter_pledged_pct == 0"
  },
  {
    id: "cash_flow_kings_fcf",
    name: "Cash Flow Kings (FCF > PAT)",
    category: "Quality & Moats",
    badge: "FCF Conversion",
    desc: "Real cash generators where Free Cash Flow exceeds reported Net Profit, with positive 10-year cumulative CFO.",
    query: "free_cash_flow > net_profit AND cfo_10y > 0 AND cfo_to_pat > 1.0 AND market_cap > 500"
  },
  {
    id: "clean_balance_sheet_net_cash",
    name: "Clean Balance Sheet & Net Cash",
    category: "Deep Value & Safety",
    badge: "Net Cash Shield",
    desc: "Companies holding more cash and bank balances than total borrowings, creating zero-debt solvency resilience.",
    query: "net_debt < 0 AND current_ratio > 1.5 AND debt_to_equity < 0.1 AND roce > 12"
  },
  {
    id: "forensic_safe_piotroski_7",
    name: "Forensic Safe Piotroski 7+ (Clean Accounts)",
    category: "Forensic & Solvency",
    badge: "Piotroski 7+",
    desc: "Piotroski F-Score >= 7 and safe Altman Z-score > 2.9, signaling spotless earnings momentum and low accrual distortion.",
    query: "piotroski_score >= 7 AND altman_z_score > 2.9 AND debt_to_equity < 0.8"
  },
  {
    id: "institutional_inflows_zero_pledge",
    name: "Institutional Inflows with Zero Pledge",
    category: "Smart Money & Inflows",
    badge: "Clean Smart Money",
    desc: "Zero promoter share pledge with significant combined institutional backing (FII + DII > 20%) and high governance.",
    query: "promoter_pledged_pct == 0 AND fii_dii_total > 20 AND promoter_holding > 40 AND debt_to_equity < 0.5"
  }
];
