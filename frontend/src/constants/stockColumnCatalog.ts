export interface StockColumnDefinition {
  key: string;
  header: string;
  shortHeader?: string;
  category: string;
  format: "currency" | "currency_cr" | "pct" | "ratio" | "number" | "text" | "days";
  align: "right" | "left" | "center";
  description?: string;
  isDefault?: boolean;
}

export const STOCK_COLUMN_CATEGORIES = [
  "Profit & Loss",
  "Balance Sheet",
  "Cash Flows",
  "Return Ratios",
  "Working Capital & Cycle",
  "Solvency & Forensics",
  "Multi-Year & 10Y Horizons",
  "Valuation & Multiples",
  "Market & Quotes",
  "Shareholding Pattern"
] as const;

export const CORE_PERMANENT_COLUMNS = [
  { key: "symbol", header: "Instrument" },
  { key: "nse_ltp", header: "NSE (₹)" },
  { key: "bse_ltp", header: "BSE (₹)" },
  { key: "price_diff_pct", header: "Spread (%)" },
  { key: "change_pct", header: "Change (%)" },
  { key: "volume", header: "Volume" },
];

export const DEFAULT_COLUMN_KEYS: string[] = [];

export interface ColumnPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  columns: string[];
}

export const COLUMN_PRESETS: ColumnPreset[] = [
  {
    id: "default",
    name: "Default",
    icon: "🌟",
    description: "Default: Instrument, NSE, BSE, Spread (%), Change (%) & Volume",
    columns: []
  },
  {
    id: "fundamentals",
    name: "Fundamentals",
    icon: "📊",
    description: "Sales 10Y, ROCE 10Y, Net Profit, EBITDA, OPM %, Debt/Eq",
    columns: ["sales_10y", "roce_10y", "net_profit", "ebitda", "opm", "debt_to_equity", "sector"]
  },
  {
    id: "pnl_focus",
    name: "P&L Statement",
    icon: "📑",
    description: "Sales, Operating Exp, EBITDA, PBT, Net Profit, EPS, OPM %",
    columns: ["sales", "expenses", "ebitda", "pbt", "net_profit", "eps", "opm", "npm"]
  },
  {
    id: "balance_sheet_focus",
    name: "Balance Sheet",
    icon: "🏛️",
    description: "Net Worth, Fixed Assets, Total Debt, Cash & Bank, Working Capital",
    columns: ["net_worth", "fixed_assets", "total_debt", "cash_and_bank", "net_working_capital", "current_ratio"]
  },
  {
    id: "momentum",
    name: "Momentum & Technicals",
    icon: "📈",
    description: "Volume, Day High/Low, 52W High/Low, 20D Surge, RSI, VWAP",
    columns: ["volume", "high_52w", "low_52w", "high_52w_distance_pct", "volume_surge_20d", "rsi", "vwap"]
  },
  {
    id: "cash_flow",
    name: "Cash Flow & Yield",
    icon: "💰",
    description: "Operating Cash Flow, Free Cash Flow, Capex, Div Yield, P/FCF",
    columns: ["cfo", "free_cash_flow", "capex", "dividend_yield", "p_fcf", "cfo_to_pat"]
  },
  {
    id: "valuation",
    name: "Valuation",
    icon: "⚖️",
    description: "Market Cap, P/E, P/B, EV/EBITDA, Book Value, PEG Ratio",
    columns: ["market_cap", "pe", "pb", "ev_ebitda", "book_value", "peg_ratio"]
  },
  {
    id: "forensics",
    name: "Forensic & Quality",
    icon: "🛡️",
    description: "Altman Z, Piotroski, Promoter %, ROCE, Interest Coverage",
    columns: ["altman_z_score", "piotroski_score", "promoter_holding", "roce", "interest_coverage"]
  }
];

export const STOCK_COLUMNS_CATALOG: StockColumnDefinition[] = [
  // ==========================================
  // 1. PROFIT & LOSS STATEMENT (26 METRICS - TTM)
  // ==========================================
  { key: "sales", header: "Revenue / Sales (TTM)", shortHeader: "Sales (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Statutory Topline Net Sales / Revenue over Trailing 12 Months (₹ Cr)" },
  { key: "revenue", header: "Gross Revenue (TTM)", shortHeader: "Revenue (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Gross Revenue from core business operations (TTM) (₹ Cr)" },
  { key: "expenses", header: "Operating Expenses (TTM)", shortHeader: "Expenses (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Total Operating Expenses excluding Depr & Fin Costs (TTM) (₹ Cr)" },
  { key: "material_cost", header: "Material Cost (COGS) (TTM)", shortHeader: "COGS (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Cost of Materials Consumed / Direct Production Cost (TTM) (₹ Cr)" },
  { key: "employee_cost", header: "Employee Cost (TTM)", shortHeader: "Emp Cost (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Staff & Employee Benefit Expenses (TTM) (₹ Cr)" },
  { key: "ebitda", header: "EBITDA (TTM)", shortHeader: "EBITDA (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Operating Profit before Interest, Tax, Depr & Amort (TTM) (₹ Cr)" },
  { key: "operating_profit", header: "Operating Profit (TTM)", shortHeader: "Op Profit (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Core Operating Earnings (EBITDA) over Trailing 12 Months (₹ Cr)" },
  { key: "opm", header: "OPM % (TTM)", shortHeader: "OPM %", category: "Profit & Loss", format: "pct", align: "right", description: "Operating Profit Margin % (EBITDA / Sales) (TTM)" },
  { key: "ebitda_margin", header: "EBITDA Margin % (TTM)", shortHeader: "EBITDA %", category: "Profit & Loss", format: "pct", align: "right", description: "EBITDA as a percentage of Total Revenue (TTM)" },
  { key: "other_income", header: "Other Income (TTM)", shortHeader: "Oth Inc (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Non-operating treasury, dividend and interest income (TTM) (₹ Cr)" },
  { key: "ebit", header: "EBIT (TTM)", shortHeader: "EBIT (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Earnings Before Interest & Taxes (TTM) (₹ Cr)" },
  { key: "depreciation", header: "Depreciation (TTM)", shortHeader: "Depr (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Depreciation & Amortization Expense (TTM) (₹ Cr)" },
  { key: "finance_costs", header: "Finance Costs (Interest) (TTM)", shortHeader: "Interest (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Total Interest & Borrowing Finance Costs (TTM) (₹ Cr)" },
  { key: "interest", header: "Interest Expense (TTM)", shortHeader: "Interest (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Interest Paid on Short & Long Term Debt (TTM) (₹ Cr)" },
  { key: "pbt", header: "Profit Before Tax (PBT) (TTM)", shortHeader: "PBT (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Earnings Before Tax over Trailing 12 Months (₹ Cr)" },
  { key: "tax_expense", header: "Tax Expense (TTM)", shortHeader: "Tax Exp (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Total Current & Deferred Corporate Taxes (TTM) (₹ Cr)" },
  { key: "tax_pct", header: "Effective Tax % (TTM)", shortHeader: "Tax %", category: "Profit & Loss", format: "pct", align: "right", description: "Effective Corporate Tax Rate % (TTM)" },
  { key: "net_profit", header: "Net Profit (PAT) (TTM)", shortHeader: "PAT (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Statutory Profit After Tax attributable to owners (TTM) (₹ Cr)" },
  { key: "exceptional_items", header: "Exceptional Items (TTM)", shortHeader: "Exceptional", category: "Profit & Loss", format: "currency_cr", align: "right", description: "One-off exceptional or extraordinary items (TTM) (₹ Cr)" },
  { key: "npm", header: "NPM % (TTM)", shortHeader: "NPM %", category: "Profit & Loss", format: "pct", align: "right", description: "Net Profit Margin % (PAT / Revenue) (TTM)" },
  { key: "eps", header: "Diluted EPS (₹) (TTM)", shortHeader: "EPS (TTM)", category: "Profit & Loss", format: "currency", align: "right", description: "Earnings Per Share diluted basis (TTM)" },
  { key: "gross_profit", header: "Gross Profit (TTM)", shortHeader: "Gross Profit (TTM)", category: "Profit & Loss", format: "currency_cr", align: "right", description: "Revenue minus Direct Cost of Goods Sold (TTM) (₹ Cr)" },
  { key: "gross_margin", header: "Gross Margin % (TTM)", shortHeader: "Gross %", category: "Profit & Loss", format: "pct", align: "right", description: "Gross Profit as a percentage of Revenue (TTM)" },
  { key: "dividend_payout", header: "Dividend Payout %", shortHeader: "Div Payout", category: "Profit & Loss", format: "pct", align: "right", description: "Percentage of Net Profit distributed as Dividends" },
  { key: "yoy_sales_growth", header: "YoY Sales Growth %", shortHeader: "YoY Sales", category: "Profit & Loss", format: "pct", align: "right", description: "Year-over-Year Revenue Growth %" },
  { key: "yoy_profit_growth", header: "YoY PAT Growth %", shortHeader: "YoY PAT", category: "Profit & Loss", format: "pct", align: "right", description: "Year-over-Year Net Profit Growth %" },
  { key: "qoq_sales_growth", header: "QoQ Sales Growth %", shortHeader: "QoQ Sales", category: "Profit & Loss", format: "pct", align: "right", description: "Quarter-over-Quarter Revenue Growth %" },
  { key: "qoq_profit_growth", header: "QoQ PAT Growth %", shortHeader: "QoQ PAT", category: "Profit & Loss", format: "pct", align: "right", description: "Quarter-over-Quarter Net Profit Growth %" },

  // ==========================================
  // 2. BALANCE SHEET (22 METRICS - FY25)
  // ==========================================
  { key: "equity_capital", header: "Equity Capital (FY25)", shortHeader: "Eq Capital (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Paid-up Equity Share Capital as of FY25 (₹ Cr)" },
  { key: "reserves", header: "Reserves & Surplus (FY25)", shortHeader: "Reserves (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Retained Earnings & General Reserves as of FY25 (₹ Cr)" },
  { key: "net_worth", header: "Net Worth (FY25)", shortHeader: "Net Worth (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Total Shareholders Equity as of FY25 (₹ Cr)" },
  { key: "tangible_net_worth", header: "Tangible Net Worth (FY25)", shortHeader: "Tangible NW (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Net Worth minus Intangibles & Goodwill as of FY25 (₹ Cr)" },
  { key: "total_debt", header: "Total Debt (FY25)", shortHeader: "Total Debt (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Total Borrowings (Long-Term + Short-Term) as of FY25 (₹ Cr)" },
  { key: "trade_payables", header: "Trade Payables (FY25)", shortHeader: "Payables (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Amounts owed to suppliers for goods/services as of FY25 (₹ Cr)" },
  { key: "long_term_borrowings", header: "Long-Term Debt (FY25)", shortHeader: "LT Debt (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Non-current term debt as of FY25 (₹ Cr)" },
  { key: "short_term_borrowings", header: "Short-Term Debt (FY25)", shortHeader: "ST Debt (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Working capital loans as of FY25 (₹ Cr)" },
  { key: "current_liabilities", header: "Current Liabilities (FY25)", shortHeader: "Curr Liab (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Obligations payable within 12 months as of FY25 (₹ Cr)" },
  { key: "other_liabilities", header: "Other Liabilities (FY25)", shortHeader: "Oth Liab (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Non-current provisions and liabilities as of FY25 (₹ Cr)" },
  { key: "total_liabilities", header: "Total Liabilities (FY25)", shortHeader: "Tot Liab (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Total Balance Sheet Liabilities & Equity as of FY25 (₹ Cr)" },
  { key: "fixed_assets", header: "Gross Fixed Assets (FY25)", shortHeader: "Fixed Assets (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Property, Plant & Equipment / Gross Block as of FY25 (₹ Cr)" },
  { key: "cwip", header: "Capital WIP (CWIP) (FY25)", shortHeader: "CWIP (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Capital Work In Progress as of FY25 (₹ Cr)" },
  { key: "total_fixed_assets", header: "Total Fixed Assets (FY25)", shortHeader: "Tot FA (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Net Fixed Assets + CWIP as of FY25 (₹ Cr)" },
  { key: "investments", header: "Non-Current Investments (FY25)", shortHeader: "Investments (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Non-Current Strategic & Mutual Fund Investments as of FY25 (₹ Cr)" },
  { key: "inventories", header: "Inventories (FY25)", shortHeader: "Inventories (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Raw material, WIP and finished goods as of FY25 (₹ Cr)" },
  { key: "trade_receivables", header: "Trade Receivables (FY25)", shortHeader: "Receivables (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Customer Receivables (Debtors) as of FY25 (₹ Cr)" },
  { key: "cash_and_bank", header: "Cash & Bank Balances (FY25)", shortHeader: "Cash & Bank (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Cash on hand and bank balances as of FY25 (₹ Cr)" },
  { key: "cash_equivalents", header: "Cash & Equivalents (FY25)", shortHeader: "Cash Equiv (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Highly liquid short-term treasury assets as of FY25 (₹ Cr)" },
  { key: "current_assets", header: "Current Assets (FY25)", shortHeader: "Curr Assets (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Total Short-Term Assets as of FY25 (₹ Cr)" },
  { key: "net_working_capital", header: "Net Working Capital (FY25)", shortHeader: "NWC (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Current Assets minus Current Liabilities as of FY25 (₹ Cr)" },
  { key: "total_assets", header: "Total Assets (FY25)", shortHeader: "Tot Assets (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Total Balance Sheet Assets as of FY25 (₹ Cr)" },
  { key: "net_debt", header: "Net Debt (FY25)", shortHeader: "Net Debt (FY25)", category: "Balance Sheet", format: "currency_cr", align: "right", description: "Total Debt minus Cash & Bank as of FY25 (₹ Cr)" },
  { key: "bvps", header: "Book Value Per Share (₹) (FY25)", shortHeader: "BVPS (FY25)", category: "Balance Sheet", format: "currency", align: "right", description: "Net Worth divided by Total Equity Shares as of FY25 (₹)" },

  // ==========================================
  // 3. CASH FLOW STATEMENT (17 METRICS - FY25)
  // ==========================================
  { key: "cfo", header: "Operating Cash Flow (CFO) (FY25)", shortHeader: "CFO (FY25)", category: "Cash Flows", format: "currency_cr", align: "right", description: "Cash Flow generated from core Operating Activities in FY25 (₹ Cr)" },
  { key: "cfo_before_wc", header: "CFO Before Working Capital (FY25)", shortHeader: "CFO Pre-WC (FY25)", category: "Cash Flows", format: "currency_cr", align: "right", description: "Operating cash before working capital changes (FY25) (₹ Cr)" },
  { key: "working_capital_changes", header: "Working Capital Changes (FY25)", shortHeader: "WC Changes (FY25)", category: "Cash Flows", format: "currency_cr", align: "right", description: "Cash impact of inventory, debtor & creditor changes (FY25) (₹ Cr)" },
  { key: "direct_taxes_paid", header: "Direct Taxes Paid (FY25)", shortHeader: "Taxes Paid (FY25)", category: "Cash Flows", format: "currency_cr", align: "right", description: "Cash corporate income taxes paid during FY25 (₹ Cr)" },
  { key: "capex", header: "Capital Expenditure (Capex) (FY25)", shortHeader: "Capex (FY25)", category: "Cash Flows", format: "currency_cr", align: "right", description: "Cash spent purchasing property, plant & equipment in FY25 (₹ Cr)" },
  { key: "free_cash_flow", header: "Free Cash Flow (FCF) (FY25)", shortHeader: "FCF (FY25)", category: "Cash Flows", format: "currency_cr", align: "right", description: "Operating Cash Flow (CFO) minus Capex in FY25 (₹ Cr)" },
  { key: "investing_cash_flow", header: "Investing Cash Flow (CFI) (FY25)", shortHeader: "CFI (FY25)", category: "Cash Flows", format: "currency_cr", align: "right", description: "Cash used in investments and capital projects in FY25 (₹ Cr)" },
  { key: "financing_cash_flow", header: "Financing Cash Flow (CFF) (FY25)", shortHeader: "CFF (FY25)", category: "Cash Flows", format: "currency_cr", align: "right", description: "Cash from debt issuance/repayment and dividends in FY25 (₹ Cr)" },
  { key: "net_cash_flow", header: "Net Cash Flow (FY25)", shortHeader: "Net CF (FY25)", category: "Cash Flows", format: "currency_cr", align: "right", description: "Net Change in Cash (CFO + CFI + CFF) in FY25 (₹ Cr)" },
  { key: "cfo_to_pat", header: "CFO to PAT %", shortHeader: "CFO / PAT", category: "Cash Flows", format: "pct", align: "right", description: "Cash quality ratio: Operating Cash Flow / Net Profit" },
  { key: "cfo_to_ebitda", header: "CFO to EBITDA %", shortHeader: "CFO/EBITDA", category: "Cash Flows", format: "pct", align: "right", description: "Conversion of operating profit into actual cash %" },
  { key: "cfo_to_sales", header: "CFO to Sales %", shortHeader: "CFO/Sales", category: "Cash Flows", format: "pct", align: "right", description: "Operating cash generated per ₹100 of revenue %" },
  { key: "fcf_yield", header: "Free Cash Flow Yield %", shortHeader: "FCF Yield", category: "Cash Flows", format: "pct", align: "right", description: "Free Cash Flow divided by Market Capitalization %" },
  { key: "fcf_per_share", header: "FCF Per Share (₹)", shortHeader: "FCF/Share", category: "Cash Flows", format: "currency", align: "right", description: "Free Cash Flow per outstanding equity share" },
  { key: "capex_to_sales", header: "Capex to Sales %", shortHeader: "Capex/Sales", category: "Cash Flows", format: "pct", align: "right", description: "Reinvestment rate as % of Revenue" },
  { key: "capex_to_cfo", header: "Capex as % of CFO", shortHeader: "Capex/CFO", category: "Cash Flows", format: "pct", align: "right", description: "Percentage of operating cash consumed by capital outlays" },
  { key: "dividends_paid", header: "Dividends Paid", shortHeader: "Div Paid", category: "Cash Flows", format: "currency_cr", align: "right", description: "Total cash outflow for shareholder dividends (₹ Cr)" },

  // ==========================================
  // 4. RETURN RATIOS & EFFICIENCY (13 METRICS)
  // ==========================================
  { key: "roce", header: "ROCE %", shortHeader: "ROCE %", category: "Return Ratios", format: "pct", align: "right", description: "Return on Capital Employed: EBIT / Total Capital Employed %" },
  { key: "roe", header: "ROE %", shortHeader: "ROE %", category: "Return Ratios", format: "pct", align: "right", description: "Return on Equity: Net Profit / Net Worth %" },
  { key: "roic", header: "ROIC %", shortHeader: "ROIC %", category: "Return Ratios", format: "pct", align: "right", description: "Return on Invested Capital: NOPAT / Invested Capital %" },
  { key: "roa", header: "ROA %", shortHeader: "ROA %", category: "Return Ratios", format: "pct", align: "right", description: "Return on Total Assets: Net Profit / Total Assets %" },
  { key: "capital_employed", header: "Capital Employed", shortHeader: "Cap Employed", category: "Return Ratios", format: "currency_cr", align: "right", description: "Total Net Worth + Long-Term Borrowings (₹ Cr)" },
  { key: "invested_capital", header: "Invested Capital", shortHeader: "Inv Capital", category: "Return Ratios", format: "currency_cr", align: "right", description: "Operating Capital invested in the business (₹ Cr)" },
  { key: "asset_turnover", header: "Asset Turnover", shortHeader: "Asset Turn", category: "Return Ratios", format: "ratio", align: "right", description: "Revenue / Total Assets multiple" },
  { key: "working_capital_turnover", header: "WC Turnover", shortHeader: "WC Turn", category: "Return Ratios", format: "ratio", align: "right", description: "Revenue / Net Working Capital multiple" },
  { key: "ebit_margin", header: "EBIT Margin %", shortHeader: "EBIT %", category: "Return Ratios", format: "pct", align: "right", description: "Operating Earnings EBIT divided by Total Revenue %" },
  { key: "pre_tax_margin", header: "Pre-Tax Margin %", shortHeader: "PBT %", category: "Return Ratios", format: "pct", align: "right", description: "Profit Before Tax divided by Total Revenue %" },
  { key: "croic", header: "CROIC %", shortHeader: "CROIC %", category: "Return Ratios", format: "pct", align: "right", description: "Cash Return on Invested Capital: Free Cash Flow / Invested Capital %" },
  { key: "return_on_net_worth", header: "Return on Net Worth (RONW)", shortHeader: "RONW %", category: "Return Ratios", format: "pct", align: "right", description: "Net Profit divided by Tangible Net Worth %" },

  // ==========================================
  // 5. WORKING CAPITAL & OPERATING CYCLE (11 METRICS)
  // ==========================================
  { key: "cash_conversion_cycle", header: "Cash Conversion Cycle (CCC)", shortHeader: "CCC (Days)", category: "Working Capital & Cycle", format: "days", align: "right", description: "Debtor Days + Inventory Days - Payable Days" },
  { key: "debtor_days", header: "Debtor Days (DSO)", shortHeader: "Debtor Days", category: "Working Capital & Cycle", format: "days", align: "right", description: "Average collection period for customer receivables (days)" },
  { key: "inventory_days", header: "Inventory Days (DSI)", shortHeader: "Inv Days", category: "Working Capital & Cycle", format: "days", align: "right", description: "Days of inventory held before sale" },
  { key: "payable_days", header: "Payable Days (DPO)", shortHeader: "Payable Days", category: "Working Capital & Cycle", format: "days", align: "right", description: "Average credit period taken to settle suppliers (days)" },
  { key: "working_capital_days", header: "Working Capital Days", shortHeader: "WC Days", category: "Working Capital & Cycle", format: "days", align: "right", description: "Working Capital as days of Sales" },
  { key: "current_ratio", header: "Current Ratio", shortHeader: "Curr Ratio", category: "Working Capital & Cycle", format: "ratio", align: "right", description: "Current Assets / Current Liabilities" },
  { key: "quick_ratio", header: "Quick Ratio (Acid Test)", shortHeader: "Quick Ratio", category: "Working Capital & Cycle", format: "ratio", align: "right", description: "(Cash + Receivables) / Current Liabilities" },
  { key: "working_capital_to_sales", header: "Working Capital to Sales %", shortHeader: "WC / Sales", category: "Working Capital & Cycle", format: "pct", align: "right", description: "Working Capital required per ₹100 of revenue %" },

  // ==========================================
  // 6. SOLVENCY, QUALITY & FORENSICS (12 METRICS)
  // ==========================================
  { key: "debt_to_equity", header: "Debt to Equity", shortHeader: "Debt/Eq", category: "Solvency & Forensics", format: "ratio", align: "right", description: "Total Debt / Shareholders Equity" },
  { key: "debt_to_ebitda", header: "Debt to EBITDA", shortHeader: "Debt/EBITDA", category: "Solvency & Forensics", format: "ratio", align: "right", description: "Years of EBITDA required to repay total debt" },
  { key: "net_debt_to_equity", header: "Net Debt to Equity", shortHeader: "NetDebt/Eq", category: "Solvency & Forensics", format: "ratio", align: "right", description: "(Total Debt - Cash) / Shareholders Equity" },
  { key: "net_debt_ebitda", header: "Net Debt to EBITDA", shortHeader: "NetDebt/EBITDA", category: "Solvency & Forensics", format: "ratio", align: "right", description: "Net Debt divided by EBITDA" },
  { key: "interest_coverage", header: "Interest Coverage", shortHeader: "Int Coverage", category: "Solvency & Forensics", format: "ratio", align: "right", description: "EBIT / Finance Costs coverage multiple" },
  { key: "altman_z_score", header: "Altman Z-Score", shortHeader: "Altman Z", category: "Solvency & Forensics", format: "ratio", align: "right", description: "Financial Safety & Distress Score (>2.99 Safe Zone)" },
  { key: "piotroski_score", header: "Piotroski F-Score", shortHeader: "Piotroski", category: "Solvency & Forensics", format: "number", align: "right", description: "9-Point fundamental quality score (8-9 High Quality)" },
  { key: "sloan_accrual_ratio", header: "Sloan Accrual Ratio %", shortHeader: "Sloan Ratio", category: "Solvency & Forensics", format: "pct", align: "right", description: "Earnings Quality metric measuring non-cash accounting accruals" },

  // ==========================================
  // 7. MULTI-YEAR & 10Y HORIZONS (18 METRICS)
  // ==========================================
  { key: "sales_10y", header: "Sales 10Y CAGR %", shortHeader: "Sales 10Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "10-Year Compounded Annual Revenue Growth Rate %" },
  { key: "profit_10y", header: "Profit 10Y CAGR %", shortHeader: "PAT 10Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "10-Year Compounded Annual Net Profit Growth %" },
  { key: "roce_10y", header: "ROCE 10Y Avg %", shortHeader: "ROCE 10Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "10-Year Average Return on Capital Employed %" },
  { key: "roe_10y", header: "ROE 10Y Avg %", shortHeader: "ROE 10Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "10-Year Average Return on Equity %" },
  { key: "opm_10y", header: "OPM 10Y Avg %", shortHeader: "OPM 10Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "10-Year Average Operating Profit Margin %" },
  { key: "ebitda_10y", header: "EBITDA 10Y CAGR %", shortHeader: "EBITDA 10Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "10-Year Compounded Annual EBITDA Growth %" },
  { key: "free_cash_flow_10y", header: "10Y Cumulative FCF", shortHeader: "FCF 10Y", category: "Multi-Year & 10Y Horizons", format: "currency_cr", align: "right", description: "Cumulative 10-Year Free Cash Flow generated (₹ Cr)" },
  { key: "cfo_10y", header: "10Y Cumulative CFO", shortHeader: "CFO 10Y", category: "Multi-Year & 10Y Horizons", format: "currency_cr", align: "right", description: "Cumulative 10-Year Operating Cash Flow (₹ Cr)" },
  { key: "sales_5y", header: "Sales 5Y CAGR %", shortHeader: "Sales 5Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "5-Year Compounded Annual Revenue Growth %" },
  { key: "profit_5y", header: "Profit 5Y CAGR %", shortHeader: "PAT 5Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "5-Year Compounded Annual Net Profit Growth %" },
  { key: "roce_5y", header: "ROCE 5Y Avg %", shortHeader: "ROCE 5Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "5-Year Average Return on Capital Employed %" },
  { key: "roe_5y", header: "ROE 5Y Avg %", shortHeader: "ROE 5Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "5-Year Average Return on Equity %" },
  { key: "sales_3y", header: "Sales 3Y CAGR %", shortHeader: "Sales 3Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "3-Year Compounded Annual Revenue Growth %" },
  { key: "profit_3y", header: "Profit 3Y CAGR %", shortHeader: "PAT 3Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "3-Year Compounded Annual Net Profit Growth %" },
  { key: "roce_3y", header: "ROCE 3Y Avg %", shortHeader: "ROCE 3Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "3-Year Average Return on Capital Employed %" },
  { key: "roe_3y", header: "ROE 3Y Avg %", shortHeader: "ROE 3Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "3-Year Average Return on Equity %" },
  { key: "sales_1y", header: "Sales 1Y Growth %", shortHeader: "Sales 1Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "1-Year Topline Revenue Growth %" },
  { key: "profit_1y", header: "Profit 1Y Growth %", shortHeader: "PAT 1Y", category: "Multi-Year & 10Y Horizons", format: "pct", align: "right", description: "1-Year Net Profit After Tax Growth %" },

  // ==========================================
  // 8. VALUATION & MULTIPLES (12 METRICS)
  // ==========================================
  { key: "market_cap", header: "Market Cap (₹ Cr)", shortHeader: "Mkt Cap", category: "Valuation & Multiples", format: "currency_cr", align: "right", description: "Total Market Capitalization in ₹ Crores" },
  { key: "pe", header: "P/E Ratio", shortHeader: "P/E", category: "Valuation & Multiples", format: "ratio", align: "right", description: "Price to Earnings ratio (LTP / EPS)" },
  { key: "pb", header: "P/B Ratio", shortHeader: "P/B", category: "Valuation & Multiples", format: "ratio", align: "right", description: "Price to Book Value ratio (LTP / BVPS)" },
  { key: "ev_ebitda", header: "EV/EBITDA", shortHeader: "EV/EBITDA", category: "Valuation & Multiples", format: "ratio", align: "right", description: "Enterprise Value to Operating EBITDA multiple" },
  { key: "ps_ratio", header: "Price to Sales (P/S)", shortHeader: "P/S", category: "Valuation & Multiples", format: "ratio", align: "right", description: "Market Capitalization to Annual Sales ratio" },
  { key: "p_fcf", header: "Price / Free Cash Flow", shortHeader: "P/FCF", category: "Valuation & Multiples", format: "ratio", align: "right", description: "Market Cap divided by Free Cash Flow" },
  { key: "dividend_yield", header: "Dividend Yield %", shortHeader: "Div Yield", category: "Valuation & Multiples", format: "pct", align: "right", description: "Annual Dividend Yield percentage" },
  { key: "peg_ratio", header: "PEG Ratio", shortHeader: "PEG", category: "Valuation & Multiples", format: "ratio", align: "right", description: "PE Ratio divided by Compounded Growth Rate" },
  { key: "enterprise_value", header: "Enterprise Value (EV)", shortHeader: "EV", category: "Valuation & Multiples", format: "currency_cr", align: "right", description: "Market Cap + Total Debt - Cash & Equivalents (₹ Cr)" },
  { key: "graham_number", header: "Graham Number (₹)", shortHeader: "Graham No", category: "Valuation & Multiples", format: "currency", align: "right", description: "Benjamin Graham Fair Value benchmark: √(22.5 * EPS * BVPS)" },
  { key: "ev_sales", header: "EV / Sales", shortHeader: "EV/Sales", category: "Valuation & Multiples", format: "ratio", align: "right", description: "Enterprise Value divided by Annual Sales" },

  // ==========================================
  // 9. SHAREHOLDING PATTERN (11 METRICS)
  // ==========================================
  { key: "promoter_holding", header: "Promoter Holding %", shortHeader: "Promoter %", category: "Shareholding Pattern", format: "pct", align: "right", description: "Total equity shares held by company promoters & founders" },
  { key: "promoter_pledged_pct", header: "Promoter Pledged %", shortHeader: "Pledge %", category: "Shareholding Pattern", format: "pct", align: "right", description: "Percentage of promoter shares pledged as collateral" },
  { key: "promoter_holding_unpledged", header: "Unpledged Promoter %", shortHeader: "Clean Prom %", category: "Shareholding Pattern", format: "pct", align: "right", description: "Promoter stake unencumbered by any pledges %" },
  { key: "promoter_change_1y", header: "Promoter Change (1Y) %", shortHeader: "Prom Chg 1Y", category: "Shareholding Pattern", format: "pct", align: "right", description: "Net change in promoter holding over past 1 year" },
  { key: "fii_holding", header: "FII / FPI Holding %", shortHeader: "FII %", category: "Shareholding Pattern", format: "pct", align: "right", description: "Foreign Institutional Investors shareholding %" },
  { key: "fii_change_1q", header: "FII Change (QoQ) %", shortHeader: "FII QoQ", category: "Shareholding Pattern", format: "pct", align: "right", description: "Net change in FII holding in the latest quarter" },
  { key: "dii_holding", header: "DII / Mutual Funds %", shortHeader: "DII %", category: "Shareholding Pattern", format: "pct", align: "right", description: "Domestic Institutional Investors & Mutual Funds holding %" },
  { key: "dii_change_1q", header: "DII Change (QoQ) %", shortHeader: "DII QoQ", category: "Shareholding Pattern", format: "pct", align: "right", description: "Net change in DII holding in the latest quarter" },
  { key: "fii_dii_total", header: "Institutional Holding (FII+DII) %", shortHeader: "Inst %", category: "Shareholding Pattern", format: "pct", align: "right", description: "Total Combined Institutional Ownership %" },
  { key: "public_holding", header: "Public / Retail Holding %", shortHeader: "Public %", category: "Shareholding Pattern", format: "pct", align: "right", description: "Non-institutional retail & individual shareholder float %" },
  { key: "number_of_shareholders", header: "Total Shareholders", shortHeader: "Shareholders", category: "Shareholding Pattern", format: "number", align: "right", description: "Total count of registered equity shareholders" },

  // ==========================================
  // 10. MARKET & LIVE DIRECT QUOTES (18 METRICS)
  // ==========================================
  { key: "sector", header: "Sector", shortHeader: "Sector", category: "Market & Quotes", format: "text", align: "left", isDefault: true, description: "Industry sector classification" },
  { key: "price_diff_pct", header: "BSE vs NSE Diff %", shortHeader: "Spread %", category: "Market & Quotes", format: "pct", align: "right", isDefault: true, description: "Price spread divergence between BSE and NSE" },
  { key: "volume", header: "Volume", shortHeader: "Volume", category: "Market & Quotes", format: "number", align: "right", isDefault: true, description: "Total traded volume across today's sessions" },
  { key: "day_high", header: "Day High (₹)", shortHeader: "Day High", category: "Market & Quotes", format: "currency", align: "right", description: "Today's intraday highest executed price" },
  { key: "day_low", header: "Day Low (₹)", shortHeader: "Day Low", category: "Market & Quotes", format: "currency", align: "right", description: "Today's intraday lowest executed price" },
  { key: "high_52w", header: "52-Week High (₹)", shortHeader: "52W High", category: "Market & Quotes", format: "currency", align: "right", description: "52-Week High price" },
  { key: "low_52w", header: "52-Week Low (₹)", shortHeader: "52W Low", category: "Market & Quotes", format: "currency", align: "right", description: "52-Week Low price" },
  { key: "high_52w_distance_pct", header: "52W High Distance %", shortHeader: "52W High Dist", category: "Market & Quotes", format: "pct", align: "right", description: "% Distance from 52-Week High level" },
  { key: "low_52w_distance_pct", header: "52W Low Distance %", shortHeader: "52W Low Dist", category: "Market & Quotes", format: "pct", align: "right", description: "% Distance above 52-Week Low level" },
  { key: "volume_surge_20d", header: "20D Volume Surge", shortHeader: "Vol Surge", category: "Market & Quotes", format: "ratio", align: "right", description: "Volume multiplier vs 20-day daily average" },
  { key: "distance_to_upper_circuit_pct", header: "Upper Circuit Distance %", shortHeader: "UC Dist %", category: "Market & Quotes", format: "pct", align: "right", description: "Distance to Upper Circuit price band %" },
  { key: "order_imbalance_ratio", header: "Order Book Imbalance", shortHeader: "Imbalance", category: "Market & Quotes", format: "ratio", align: "right", description: "5-Level Bid/Ask Quantity Ratio" },
  { key: "vwap", header: "VWAP (₹)", shortHeader: "VWAP", category: "Market & Quotes", format: "currency", align: "right", description: "Volume-Weighted Average Price" },
  { key: "rsi", header: "RSI (14)", shortHeader: "RSI", category: "Market & Quotes", format: "number", align: "right", description: "14-Period Relative Strength Index" },
  { key: "ema_20", header: "20 EMA (₹)", shortHeader: "20 EMA", category: "Market & Quotes", format: "currency", align: "right", description: "20-Day Exponential Moving Average" },
  { key: "ema_50", header: "50 EMA (₹)", shortHeader: "50 EMA", category: "Market & Quotes", format: "currency", align: "right", description: "50-Day Exponential Moving Average" },
  { key: "ema_200", header: "200 EMA (₹)", shortHeader: "200 EMA", category: "Market & Quotes", format: "currency", align: "right", description: "200-Day Exponential Moving Average" },
  { key: "beta", header: "Beta", shortHeader: "Beta", category: "Market & Quotes", format: "ratio", align: "right", description: "Historical volatility vs Nifty 50 benchmark" }
];

export function formatColumnCell(value: any, format: StockColumnDefinition["format"]): { text: string; className?: string } {
  if (value === null || value === undefined || value === "") {
    return { text: "—", className: "text-slate-300 font-mono" };
  }

  const num = Number(value);
  const isNumeric = !isNaN(num);

  switch (format) {
    case "currency":
      if (!isNumeric) return { text: String(value) };
      return {
        text: `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        className: "font-mono font-semibold text-slate-800"
      };

    case "currency_cr":
      if (!isNumeric) return { text: String(value) };
      return {
        text: `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr`,
        className: "font-mono font-semibold text-slate-800"
      };

    case "pct":
      if (!isNumeric) return { text: String(value) };
      const pctColor = num > 0 ? "text-emerald-700 font-bold" : num < 0 ? "text-rose-600 font-bold" : "text-slate-600";
      return {
        text: `${num > 0 ? "+" : ""}${num.toFixed(2)}%`,
        className: `font-mono ${pctColor}`
      };

    case "ratio":
      if (!isNumeric) return { text: String(value) };
      return {
        text: `${num.toFixed(2)}x`,
        className: "font-mono font-medium text-slate-800"
      };

    case "days":
      if (!isNumeric) return { text: String(value) };
      return {
        text: `${Math.round(num)} d`,
        className: "font-mono text-slate-700 font-semibold"
      };

    case "number":
      if (!isNumeric) return { text: String(value) };
      if (num >= 10000000) {
        return { text: `${(num / 10000000).toFixed(2)} Cr`, className: "font-mono text-slate-700" };
      } else if (num >= 100000) {
        return { text: `${(num / 100000).toFixed(2)} L`, className: "font-mono text-slate-700" };
      }
      return { text: num.toLocaleString("en-IN"), className: "font-mono text-slate-700 font-medium" };

    case "text":
    default:
      return { text: String(value), className: "text-slate-700" };
  }
}
