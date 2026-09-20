# Database-grounded Financial & Technical Indicators Catalog (185+ Metrics)
# 100% grounded in company_financials.py, financial_registry.py, and dhan_provider.py
# Full 10-Year Historical Depth (1Y, 3Y, 5Y, 7Y, 10Y) + 75+ Statutory Line Items.
from typing import Dict, List, Any

METRIC_CATALOG_500: List[Dict[str, Any]] = [
    {
        "key": "sales",
        "name": "Net Sales / Revenue",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Total top-line net sales revenue from company operations.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "raw_materials",
        "name": "Raw Material Expenses",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Direct cost of raw materials and inputs consumed.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "employee_cost",
        "name": "Employee Benefit Expenses",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Salaries, wages, PF, and staff welfare expenses.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "other_expenses",
        "name": "Other Operating Expenses",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Power, fuel, rent, admin, sales and distribution expenses.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "expenses",
        "name": "Operating Expenses",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Total cost of raw materials, staff, operating, and overhead expenses.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "operating_profit",
        "name": "Operating Profit (EBITDA)",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Earnings before interest, taxes, depreciation and amortization.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "opm",
        "name": "Operating Profit Margin (OPM %)",
        "category": "Profit & Loss",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Operating profit (EBITDA) divided by Net Sales as a percentage.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "other_income",
        "name": "Other Non-Operating Income",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Non-core income from treasury deposits, dividends, and interest.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "ebit",
        "name": "EBIT / Operating Earnings",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Earnings before interest and corporate taxes (Operating Profit - Depreciation).",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "interest",
        "name": "Finance Costs / Interest",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Interest charges and borrowing servicing costs paid on total debt.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "depreciation",
        "name": "Depreciation & Amortization",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Annual non-cash write-down on tangible and intangible fixed assets.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "pbt",
        "name": "Profit Before Tax (PBT)",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Gross pre-tax operating and other earnings before corporate income taxes.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "tax_expense",
        "name": "Tax Provision / Expense",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Corporate income tax provisions for the period.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "tax_pct",
        "name": "Effective Tax Rate %",
        "category": "Profit & Loss",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Tax provision divided by Profit Before Tax.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "net_profit",
        "name": "Net Profit / PAT",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Final bottom-line net profit after all taxes, interest, and depreciation.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "npm",
        "name": "Net Profit Margin (NPM %)",
        "category": "Profit & Loss",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Net profit (PAT) divided by Net Sales as a percentage.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "nopat",
        "name": "NOPAT (Net Operating Profit After Tax)",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "EBIT multiplied by (1 - Tax Rate); pure unleveraged operating profit.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "eps",
        "name": "Earnings Per Share (EPS)",
        "category": "Profit & Loss",
        "unit": "\u20b9",
        "supports_timeframe": True,
        "description": "Net profit divided by total outstanding equity shares.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "cash_eps",
        "name": "Cash Earnings Per Share (Cash EPS)",
        "category": "Profit & Loss",
        "unit": "\u20b9",
        "supports_timeframe": True,
        "description": "(Net profit + Depreciation) divided by total equity shares.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "dividend_payout_pct",
        "name": "Dividend Payout Ratio",
        "category": "Profit & Loss",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Percentage of net profits distributed to shareholders as dividends.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "dividend_per_share",
        "name": "Dividend Per Share (DPS)",
        "category": "Profit & Loss",
        "unit": "\u20b9",
        "supports_timeframe": True,
        "description": "Total dividends declared per equity share.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "retention_ratio",
        "name": "Retention Ratio %",
        "category": "Profit & Loss",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Percentage of earnings retained in the business (100 - Dividend Payout %).",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "gross_profit",
        "name": "Gross Profit",
        "category": "Profit & Loss",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Net sales minus cost of raw materials and direct manufacturing expenses.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "gross_margin",
        "name": "Gross Profit Margin %",
        "category": "Profit & Loss",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Gross profit divided by net sales as a percentage.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "ebitda_margin",
        "name": "EBITDA Margin %",
        "category": "Profit & Loss",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Operating EBITDA divided by net sales as a percentage.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "equity_capital",
        "name": "Equity Share Capital",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Nominal face value of common equity shares issued by the company."
    },
    {
        "key": "reserves",
        "name": "Reserves & Surplus",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Accumulated retained earnings, securities premium, and statutory reserves."
    },
    {
        "key": "net_worth",
        "name": "Net Worth / Shareholders Equity",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Total equity capital plus reserves and surplus (book value of equity)."
    },
    {
        "key": "long_term_borrowings",
        "name": "Long-Term Borrowings",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Non-current loans, bonds, debentures, and term borrowings (>1 year)."
    },
    {
        "key": "short_term_borrowings",
        "name": "Short-Term Borrowings",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Working capital loans, overdrafts, and commercial paper (<1 year)."
    },
    {
        "key": "total_debt",
        "name": "Total Debt / Borrowings",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Sum of long-term borrowings and short-term debt obligations."
    },
    {
        "key": "trade_payables",
        "name": "Trade Payables / Creditors",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Statutory liabilities owed to vendors and suppliers for goods received."
    },
    {
        "key": "other_current_liabilities",
        "name": "Other Current Liabilities",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Accrued expenses, advances from customers, and statutory dues."
    },
    {
        "key": "current_liabilities",
        "name": "Total Current Liabilities",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Total obligations due within twelve months."
    },
    {
        "key": "other_long_term_liabilities",
        "name": "Other Long-Term Liabilities",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Deferred tax liabilities, long-term provisions, and lease obligations."
    },
    {
        "key": "total_liabilities",
        "name": "Total Liabilities & Equity",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Aggregate sum of all equity, debt, and liabilities."
    },
    {
        "key": "gross_block",
        "name": "Gross Block / Tangible Assets",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Historical purchase cost of all property, plant, equipment, and land."
    },
    {
        "key": "accumulated_depreciation",
        "name": "Accumulated Depreciation",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Cumulative depreciation charged against fixed assets since inception."
    },
    {
        "key": "fixed_assets",
        "name": "Net Fixed Assets (Net Block)",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Gross block minus accumulated depreciation."
    },
    {
        "key": "cwip",
        "name": "Capital Work in Progress (CWIP)",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Under-construction industrial facilities, machinery, and expansion projects."
    },
    {
        "key": "total_fixed_assets",
        "name": "Total Fixed Assets & CWIP",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Sum of net fixed assets and capital work in progress."
    },
    {
        "key": "non_current_investments",
        "name": "Non-Current Investments",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Strategic equity stakes, subsidiary holdings, and long-term securities."
    },
    {
        "key": "current_investments",
        "name": "Current Investments",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Liquid mutual funds, treasury bills, and short-term market instruments."
    },
    {
        "key": "total_investments",
        "name": "Total Investments",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Sum of non-current investments and short-term liquid investments."
    },
    {
        "key": "inventories",
        "name": "Inventories",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Raw materials, work-in-progress, and finished goods held in stock."
    },
    {
        "key": "trade_receivables",
        "name": "Trade Receivables / Debtors",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Monies owed by customers for goods and services billed."
    },
    {
        "key": "cash_and_bank",
        "name": "Cash & Bank Balances",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Unrestricted physical cash, bank deposits, and liquid equivalents."
    },
    {
        "key": "other_current_assets",
        "name": "Other Current Assets",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Prepaid expenses, GST input credits, and operational advances."
    },
    {
        "key": "current_assets",
        "name": "Total Current Assets",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Sum of inventories, trade receivables, cash, and short-term assets."
    },
    {
        "key": "other_non_current_assets",
        "name": "Other Non-Current Assets",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Long-term tax assets, capital advances, and security deposits."
    },
    {
        "key": "net_working_capital",
        "name": "Net Working Capital",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Total current assets minus total current liabilities."
    },
    {
        "key": "total_assets",
        "name": "Total Assets",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Aggregate balance sheet size of all assets."
    },
    {
        "key": "capital_employed",
        "name": "Capital Employed",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Total Net Worth plus Total Debt (long-term funds utilized in business)."
    },
    {
        "key": "invested_capital",
        "name": "Invested Capital",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Operating capital actively generating core returns."
    },
    {
        "key": "net_debt",
        "name": "Net Debt",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Total Borrowings minus Cash and Liquid Bank Balances."
    },
    {
        "key": "contingent_liabilities",
        "name": "Contingent Liabilities",
        "category": "Balance Sheet",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Off-balance sheet potential obligations and legal tax disputes."
    },
    {
        "key": "net_fixed_assets_to_total_assets",
        "name": "Net Fixed Assets to Total Assets %",
        "category": "Balance Sheet",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Proportion of company balance sheet tied up in physical operating assets."
    },
    {
        "key": "cfo",
        "name": "Operating Cash Flow (CFO)",
        "category": "Cash Flows",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Cash generated from core business operational activities.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "cfo_before_wc",
        "name": "CFO Before Working Capital",
        "category": "Cash Flows",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Operating profit adjusted for non-cash items before working capital changes.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "working_capital_changes",
        "name": "Working Capital Adjustments",
        "category": "Cash Flows",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Cash absorption or release from changes in debtors, inventory, and payables.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "direct_taxes_paid",
        "name": "Direct Taxes Paid",
        "category": "Cash Flows",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Actual cash corporate income taxes paid during the fiscal year.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "capex",
        "name": "Capital Expenditure (Capex)",
        "category": "Cash Flows",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Cash outflow for purchase of property, plant, machinery, and equipment.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "free_cash_flow",
        "name": "Free Cash Flow (FCF)",
        "category": "Cash Flows",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Operating cash flow minus capital expenditure (CFO - Capex).",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "fcfe",
        "name": "Free Cash Flow to Equity (FCFE)",
        "category": "Cash Flows",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "FCF minus net debt repayments (cash distributable to shareholders).",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "fcff",
        "name": "Free Cash Flow to Firm (FCFF)",
        "category": "Cash Flows",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Operating cash flow adjusted for tax-shielded interest minus capex.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "cfi",
        "name": "Investing Cash Flow (CFI)",
        "category": "Cash Flows",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Net cash used in capex, investments, and acquisitions.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "cff",
        "name": "Financing Cash Flow (CFF)",
        "category": "Cash Flows",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Net cash from loans raised/repaid, share capital, and dividends paid.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "net_cash_flow",
        "name": "Net Cash Inflow / Outflow",
        "category": "Cash Flows",
        "unit": "\u20b9 Cr",
        "supports_timeframe": True,
        "description": "Overall net change in company cash and bank balances.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "cfo_to_pat",
        "name": "CFO to PAT Ratio %",
        "category": "Cash Flows",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Operating cash flow divided by net profit (earnings quality check).",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "cfo_to_ebitda",
        "name": "CFO to EBITDA Ratio %",
        "category": "Cash Flows",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Conversion efficiency of operating earnings into real hard cash.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "fcf_to_pat",
        "name": "FCF to Net Profit Ratio %",
        "category": "Cash Flows",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Free cash flow divided by reported net profits.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "fcf_yield",
        "name": "Free Cash Flow Yield %",
        "category": "Cash Flows",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Free Cash Flow divided by Market Capitalization as a percentage."
    },
    {
        "key": "capex_to_sales",
        "name": "Capex to Sales Ratio %",
        "category": "Cash Flows",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Reinvestment intensity in fixed assets as a percentage of revenue.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "cfo_to_sales",
        "name": "CFO to Sales Ratio %",
        "category": "Cash Flows",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Operating cash generation per rupee of top-line revenue.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "fcf_to_sales",
        "name": "FCF to Sales Ratio %",
        "category": "Cash Flows",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Free cash flow conversion margin per rupee of revenue.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "cfo_3y_avg",
        "name": "CFO 3-Year Average",
        "category": "Cash Flows",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "3-year average annual Operating Cash Flow."
    },
    {
        "key": "fcf_3y_avg",
        "name": "FCF 3-Year Average",
        "category": "Cash Flows",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "3-year average annual Free Cash Flow."
    },
    {
        "key": "debtor_days",
        "name": "Debtor Days (Receivable Days)",
        "category": "Operating Efficiency",
        "unit": "days",
        "supports_timeframe": True,
        "description": "Average number of days taken to collect cash from customers.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "inventory_days",
        "name": "Inventory Days (DIO)",
        "category": "Operating Efficiency",
        "unit": "days",
        "supports_timeframe": True,
        "description": "Average number of days stock sits in warehouses before being sold.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "payable_days",
        "name": "Payable Days (DPO)",
        "category": "Operating Efficiency",
        "unit": "days",
        "supports_timeframe": True,
        "description": "Average days taken to pay vendors and suppliers.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "cash_conversion_cycle",
        "name": "Cash Conversion Cycle (CCC)",
        "category": "Operating Efficiency",
        "unit": "days",
        "supports_timeframe": True,
        "description": "Net days required to convert cash outflows for inputs back into cash collections.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "working_capital_days",
        "name": "Working Capital Days",
        "category": "Operating Efficiency",
        "unit": "days",
        "supports_timeframe": True,
        "description": "Net working capital divided by daily sales revenue.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "asset_turnover",
        "name": "Asset Turnover Ratio",
        "category": "Operating Efficiency",
        "unit": "x",
        "supports_timeframe": True,
        "description": "Net sales divided by average total assets.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "fixed_asset_turnover",
        "name": "Fixed Asset Turnover Ratio",
        "category": "Operating Efficiency",
        "unit": "x",
        "supports_timeframe": True,
        "description": "Net sales divided by net fixed assets.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "working_capital_turnover",
        "name": "Working Capital Turnover",
        "category": "Operating Efficiency",
        "unit": "x",
        "supports_timeframe": True,
        "description": "Net sales divided by net working capital.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "inventory_turnover",
        "name": "Inventory Turnover Ratio",
        "category": "Operating Efficiency",
        "unit": "x",
        "supports_timeframe": True,
        "description": "Cost of sales divided by average inventory.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "sales_to_capital_employed",
        "name": "Sales to Capital Employed",
        "category": "Operating Efficiency",
        "unit": "x",
        "supports_timeframe": True,
        "description": "Revenue generated per rupee of long-term capital employed.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "working_capital_to_sales",
        "name": "Working Capital to Sales %",
        "category": "Operating Efficiency",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Working capital requirement as a percentage of annual sales.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "debtor_to_sales",
        "name": "Debtors to Sales %",
        "category": "Operating Efficiency",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Trade receivables as a percentage of annual sales.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "roce",
        "name": "Return on Capital Employed (ROCE %)",
        "category": "Profitability & Returns",
        "unit": "%",
        "supports_timeframe": True,
        "description": "EBIT divided by total Capital Employed (Net Worth + Debt).",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "roe",
        "name": "Return on Equity (ROE %)",
        "category": "Profitability & Returns",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Net profit divided by average Shareholders Equity.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "roic",
        "name": "Return on Invested Capital (ROIC %)",
        "category": "Profitability & Returns",
        "unit": "%",
        "supports_timeframe": True,
        "description": "NOPAT divided by net operating invested capital.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "roa",
        "name": "Return on Assets (ROA %)",
        "category": "Profitability & Returns",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Net profit divided by total balance sheet assets.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "core_roce",
        "name": "Core Operating ROCE %",
        "category": "Profitability & Returns",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Core operating profit divided by operating capital employed.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "croci",
        "name": "Cash Return on Capital Invested (CROCI %)",
        "category": "Profitability & Returns",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Operating cash flow divided by total capital invested.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "sustainable_growth_rate",
        "name": "Sustainable Growth Rate %",
        "category": "Profitability & Returns",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Maximum rate of growth without raising additional equity (ROE * Retention Ratio).",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "roce_3y_avg",
        "name": "ROCE 3-Year Average %",
        "category": "Profitability & Returns",
        "unit": "%",
        "supports_timeframe": False,
        "description": "3-year average Return on Capital Employed."
    },
    {
        "key": "roce_5y_avg",
        "name": "ROCE 5-Year Average %",
        "category": "Profitability & Returns",
        "unit": "%",
        "supports_timeframe": False,
        "description": "5-year average Return on Capital Employed."
    },
    {
        "key": "roce_10y_avg",
        "name": "ROCE 10-Year Average %",
        "category": "Profitability & Returns",
        "unit": "%",
        "supports_timeframe": False,
        "description": "10-year arithmetic average Return on Capital Employed."
    },
    {
        "key": "roe_3y_avg",
        "name": "ROE 3-Year Average %",
        "category": "Profitability & Returns",
        "unit": "%",
        "supports_timeframe": False,
        "description": "3-year average Return on Equity."
    },
    {
        "key": "roe_10y_avg",
        "name": "ROE 10-Year Average %",
        "category": "Profitability & Returns",
        "unit": "%",
        "supports_timeframe": False,
        "description": "10-year arithmetic average Return on Equity."
    },
    {
        "key": "debt_to_equity",
        "name": "Debt to Equity Ratio",
        "category": "Solvency",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Total debt divided by total shareholders equity."
    },
    {
        "key": "net_debt_to_equity",
        "name": "Net Debt to Equity Ratio",
        "category": "Solvency",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Net debt (Debt - Cash) divided by total shareholders equity."
    },
    {
        "key": "debt_to_ebitda",
        "name": "Debt to EBITDA Ratio",
        "category": "Solvency",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Total borrowings divided by operating EBITDA."
    },
    {
        "key": "net_debt_ebitda",
        "name": "Net Debt to EBITDA Ratio",
        "category": "Solvency",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Net debt divided by operating EBITDA (deleveraging speed)."
    },
    {
        "key": "interest_coverage",
        "name": "Interest Coverage Ratio",
        "category": "Solvency",
        "unit": "x",
        "supports_timeframe": True,
        "description": "EBIT divided by annual interest/finance costs.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "current_ratio",
        "name": "Current Ratio",
        "category": "Solvency",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Total current assets divided by total current liabilities."
    },
    {
        "key": "quick_ratio",
        "name": "Quick Ratio (Acid-Test)",
        "category": "Solvency",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Liquid assets (excluding inventory) divided by current liabilities."
    },
    {
        "key": "dscr",
        "name": "Debt Service Coverage Ratio (DSCR)",
        "category": "Solvency",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Cash flow available to service principal and interest debt payments."
    },
    {
        "key": "financial_leverage",
        "name": "Financial Leverage / Equity Multiplier",
        "category": "Solvency",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Total assets divided by total shareholders equity."
    },
    {
        "key": "debt_to_assets",
        "name": "Debt to Total Assets Ratio",
        "category": "Solvency",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Total debt divided by total balance sheet assets."
    },
    {
        "key": "cash_to_debt",
        "name": "Cash to Debt Ratio",
        "category": "Solvency",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Cash & liquid bank balances divided by total borrowings."
    },
    {
        "key": "sales_growth",
        "name": "Sales / Revenue Growth",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Compounded annual growth rate (CAGR) of top-line revenues over selected horizon.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "profit_growth",
        "name": "Net Profit (PAT) Growth",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Compounded annual growth rate (CAGR) of net profits over selected horizon.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "ebitda_growth",
        "name": "Operating EBITDA Growth",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Compounded annual growth rate of core operating EBITDA.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "eps_growth",
        "name": "Earnings Per Share Growth",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Diluted earnings per share compounding rate.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "fcf_growth",
        "name": "Free Cash Flow Growth",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Compounded growth rate of free cash flows.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "cfo_growth",
        "name": "Operating Cash Flow Growth",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Compounded growth rate of operating cash flows.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "dividend_growth",
        "name": "Dividend Growth Rate",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Compounded annual growth rate of dividend payments.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "price_cagr",
        "name": "Stock Price CAGR",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": True,
        "description": "Historical compounded annual price return over selected horizon.",
        "timeframes": [
            "1y",
            "3y",
            "5y",
            "7y",
            "10y"
        ],
        "default_timeframe": "1y"
    },
    {
        "key": "sales_3y_cagr",
        "name": "Sales 3-Year CAGR %",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": False,
        "description": "3-year compounded annual growth rate of top-line sales."
    },
    {
        "key": "sales_5y_cagr",
        "name": "Sales 5-Year CAGR %",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": False,
        "description": "5-year compounded annual growth rate of top-line sales."
    },
    {
        "key": "sales_10y_cagr",
        "name": "Sales 10-Year CAGR %",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": False,
        "description": "10-year compounded annual growth rate of top-line revenues."
    },
    {
        "key": "profit_3y_cagr",
        "name": "Net Profit 3-Year CAGR %",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": False,
        "description": "3-year compounded annual growth rate of net profit."
    },
    {
        "key": "profit_5y_cagr",
        "name": "Net Profit 5-Year CAGR %",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": False,
        "description": "5-year compounded annual growth rate of net profit."
    },
    {
        "key": "profit_10y_cagr",
        "name": "Net Profit 10-Year CAGR %",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": False,
        "description": "10-year compounded annual growth rate of net profits."
    },
    {
        "key": "ebitda_3y_cagr",
        "name": "EBITDA 3-Year CAGR %",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": False,
        "description": "3-year compounded annual growth rate of EBITDA."
    },
    {
        "key": "ebitda_5y_cagr",
        "name": "EBITDA 5-Year CAGR %",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": False,
        "description": "5-year compounded annual growth rate of EBITDA."
    },
    {
        "key": "ebitda_10y_cagr",
        "name": "EBITDA 10-Year CAGR %",
        "category": "Growth",
        "unit": "%",
        "supports_timeframe": False,
        "description": "10-year compounded annual growth rate of operating EBITDA."
    },
    {
        "key": "opm_10y_avg",
        "name": "OPM 10-Year Average %",
        "category": "Profitability & Returns",
        "unit": "%",
        "supports_timeframe": False,
        "description": "10-year arithmetic average Operating Profit Margin."
    },
    {
        "key": "market_cap",
        "name": "Market Capitalization",
        "category": "Valuation",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Total market value of all outstanding company shares."
    },
    {
        "key": "pe",
        "name": "Price to Earnings (P/E)",
        "category": "Valuation",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Current market price divided by trailing 12-month EPS."
    },
    {
        "key": "pb",
        "name": "Price to Book (P/B)",
        "category": "Valuation",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Current market price divided by Book Value per share."
    },
    {
        "key": "ps_ratio",
        "name": "Price to Sales (P/S)",
        "category": "Valuation",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Market capitalization divided by annual net sales."
    },
    {
        "key": "ev_ebitda",
        "name": "EV / EBITDA",
        "category": "Valuation",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Enterprise Value divided by operating profit (EBITDA)."
    },
    {
        "key": "ev_sales",
        "name": "EV / Sales",
        "category": "Valuation",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Enterprise Value divided by annual net revenue."
    },
    {
        "key": "ev_ebit",
        "name": "EV / EBIT",
        "category": "Valuation",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Enterprise Value divided by operating EBIT."
    },
    {
        "key": "p_fcf",
        "name": "Price to Free Cash Flow (P/FCF)",
        "category": "Valuation",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Market capitalization divided by annual free cash flow."
    },
    {
        "key": "enterprise_value",
        "name": "Enterprise Value (EV)",
        "category": "Valuation",
        "unit": "\u20b9 Cr",
        "supports_timeframe": False,
        "description": "Market Cap plus Total Debt minus Cash and Bank Balances."
    },
    {
        "key": "peg_ratio",
        "name": "PEG Ratio",
        "category": "Valuation",
        "unit": "x",
        "supports_timeframe": False,
        "description": "P/E ratio divided by 3-year compounded net profit growth."
    },
    {
        "key": "earnings_yield",
        "name": "Earnings Yield %",
        "category": "Valuation",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Annual EPS divided by current market price as a percentage."
    },
    {
        "key": "dividend_yield",
        "name": "Dividend Yield %",
        "category": "Valuation",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Annual dividend per share divided by current market price."
    },
    {
        "key": "graham_number",
        "name": "Graham Number",
        "category": "Valuation",
        "unit": "\u20b9",
        "supports_timeframe": False,
        "description": "Theoretical upper bound fair value based on Benjamin Graham formula."
    },
    {
        "key": "book_value",
        "name": "Book Value Per Share (BVPS)",
        "category": "Valuation",
        "unit": "\u20b9",
        "supports_timeframe": False,
        "description": "Net worth divided by total equity shares outstanding."
    },
    {
        "key": "market_cap_to_cfo",
        "name": "Market Cap to Operating Cash Flow",
        "category": "Valuation",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Market Capitalization divided by Operating Cash Flow."
    },
    {
        "key": "price_to_operating_profit",
        "name": "Price to Operating Profit",
        "category": "Valuation",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Market capitalization divided by operating profit."
    },
    {
        "key": "piotroski_score",
        "name": "Piotroski F-Score",
        "category": "Forensic & Quality",
        "unit": "score",
        "supports_timeframe": False,
        "description": "9-point financial health score assessing profitability, leverage, and efficiency."
    },
    {
        "key": "altman_z_score",
        "name": "Altman Z-Score",
        "category": "Forensic & Quality",
        "unit": "score",
        "supports_timeframe": False,
        "description": "Predictive bankruptcy formula (>2.9 Safe, 1.8-2.9 Grey, <1.8 Distress)."
    },
    {
        "key": "sloan_accrual_ratio",
        "name": "Modified Sloan Accrual Ratio %",
        "category": "Forensic & Quality",
        "unit": "%",
        "supports_timeframe": False,
        "description": "(Net Income - CFO) / Total Assets; lower indicates higher quality cash earnings."
    },
    {
        "key": "cash_realization_ratio",
        "name": "Cash Realization Ratio %",
        "category": "Forensic & Quality",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Percentage of reported accounting profits backed by actual cash inflows."
    },
    {
        "key": "beneish_m_score",
        "name": "Beneish M-Score",
        "category": "Forensic & Quality",
        "unit": "score",
        "supports_timeframe": False,
        "description": "Forensic probability model determining if company manipulated financial earnings."
    },
    {
        "key": "earnings_quality_score",
        "name": "Earnings Quality Score",
        "category": "Forensic & Quality",
        "unit": "score",
        "supports_timeframe": False,
        "description": "Composite index measuring cash backing of accrual operating income."
    },
    {
        "key": "promoter_holding",
        "name": "Promoter Shareholding %",
        "category": "Shareholding",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Percentage equity stake held by promoter and promoter group."
    },
    {
        "key": "promoter_pledged_pct",
        "name": "Promoter Pledged %",
        "category": "Shareholding",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Percentage of promoter-owned shares pledged as collateral for debt."
    },
    {
        "key": "promoter_holding_unpledged",
        "name": "Promoter Unpledged Stake %",
        "category": "Shareholding",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Net unencumbered equity stake held by promoters."
    },
    {
        "key": "promoter_change_1y",
        "name": "Promoter Stake 1Y Change %",
        "category": "Shareholding",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Net change in promoter shareholding over the past four quarters."
    },
    {
        "key": "promoter_change_qoq",
        "name": "Promoter Stake QoQ Change %",
        "category": "Shareholding",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Net change in promoter shareholding from previous quarter."
    },
    {
        "key": "fii_holding",
        "name": "FII / FPI Holding %",
        "category": "Shareholding",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Percentage equity stake held by Foreign Institutional Investors."
    },
    {
        "key": "fii_change_1q",
        "name": "FII Stake QoQ Change %",
        "category": "Shareholding",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Net foreign institutional inflows or outflows over the last quarter."
    },
    {
        "key": "dii_holding",
        "name": "DII Holding %",
        "category": "Shareholding",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Percentage equity stake held by Domestic Mutual Funds and Insurers."
    },
    {
        "key": "dii_change_1q",
        "name": "DII Stake QoQ Change %",
        "category": "Shareholding",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Net domestic institutional inflows or outflows over the last quarter."
    },
    {
        "key": "fii_dii_total",
        "name": "Total Institutional Holding (FII + DII) %",
        "category": "Shareholding",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Aggregate equity ownership held by foreign and domestic institutions."
    },
    {
        "key": "public_holding",
        "name": "Public Non-Institutional Holding %",
        "category": "Shareholding",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Equity shares held by individual retail investors and non-promoters."
    },
    {
        "key": "number_of_shareholders",
        "name": "Total Retail Shareholders Count",
        "category": "Shareholding",
        "unit": "count",
        "supports_timeframe": False,
        "description": "Total distinct individual shareholder count from SEBI Clause 31."
    },
    {
        "key": "audit_quality",
        "name": "Auditor Opinion Tier",
        "category": "Shareholding",
        "unit": "tier",
        "supports_timeframe": False,
        "description": "1=Unmodified Clean, 2=Qualified with Explanatory, 3=Adverse/Disclaimer."
    },
    {
        "key": "credit_rating",
        "name": "Credit Rating Tier",
        "category": "Shareholding",
        "unit": "tier",
        "supports_timeframe": False,
        "description": "1=AAA, 2=AA, 3=A, 4=BBB or lower."
    },
    {
        "key": "board_independence_pct",
        "name": "Board Independence %",
        "category": "Shareholding",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Percentage of independent directors on the Board."
    },
    {
        "key": "rpt_to_revenue_pct",
        "name": "Related Party Transactions to Sales %",
        "category": "Shareholding",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Transactions with promoters or promoter entities as a percentage of revenue."
    },
    {
        "key": "distance_to_upper_circuit_pct",
        "name": "Distance to Upper Circuit %",
        "category": "Technicals & Volume",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Percentage distance between CMP and daily Upper Circuit limit."
    },
    {
        "key": "distance_to_lower_circuit_pct",
        "name": "Distance to Lower Circuit %",
        "category": "Technicals & Volume",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Percentage distance between CMP and daily Lower Circuit limit."
    },
    {
        "key": "upper_circuit",
        "name": "Upper Circuit Limit Price",
        "category": "Technicals & Volume",
        "unit": "\u20b9",
        "supports_timeframe": False,
        "description": "Exchange mandated maximum trading price for the day."
    },
    {
        "key": "lower_circuit",
        "name": "Lower Circuit Limit Price",
        "category": "Technicals & Volume",
        "unit": "\u20b9",
        "supports_timeframe": False,
        "description": "Exchange mandated minimum trading price for the day."
    },
    {
        "key": "order_imbalance_ratio",
        "name": "Order Book Imbalance Ratio",
        "category": "Technicals & Volume",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Total 5-level buy depth volume divided by total sell depth volume."
    },
    {
        "key": "volume_surge_20d",
        "name": "20-Day Volume Surge Multiplier",
        "category": "Technicals & Volume",
        "unit": "x",
        "supports_timeframe": False,
        "description": "Today volume divided by 20-day rolling average traded volume."
    },
    {
        "key": "avg_volume_20d",
        "name": "20-Day Average Traded Volume",
        "category": "Technicals & Volume",
        "unit": "shares",
        "supports_timeframe": False,
        "description": "Rolling 20-day average daily traded shares."
    },
    {
        "key": "ema_20",
        "name": "20-Day EMA",
        "category": "Technicals & Volume",
        "unit": "\u20b9",
        "supports_timeframe": False,
        "description": "20-day Exponential Moving Average price."
    },
    {
        "key": "ema_50",
        "name": "50-Day EMA",
        "category": "Technicals & Volume",
        "unit": "\u20b9",
        "supports_timeframe": False,
        "description": "50-day Exponential Moving Average price."
    },
    {
        "key": "ema_200",
        "name": "200-Day EMA",
        "category": "Technicals & Volume",
        "unit": "\u20b9",
        "supports_timeframe": False,
        "description": "200-day Exponential Moving Average price."
    },
    {
        "key": "vwap",
        "name": "Intraday VWAP",
        "category": "Technicals & Volume",
        "unit": "\u20b9",
        "supports_timeframe": False,
        "description": "Volume Weighted Average Price for the current trading session."
    },
    {
        "key": "dma_20_dist_pct",
        "name": "Distance from 20 Day Moving Average %",
        "category": "Technicals & Volume",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Percentage distance of CMP relative to 20-day moving average."
    },
    {
        "key": "dma_50_dist_pct",
        "name": "Distance from 50 Day Moving Average %",
        "category": "Technicals & Volume",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Percentage distance of CMP relative to 50-day moving average."
    },
    {
        "key": "dma_200_dist_pct",
        "name": "Distance from 200 Day Moving Average %",
        "category": "Technicals & Volume",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Percentage distance of CMP relative to 200-day moving average."
    },
    {
        "key": "high_52w",
        "name": "52-Week High Price",
        "category": "Technicals & Volume",
        "unit": "\u20b9",
        "supports_timeframe": False,
        "description": "Highest traded price over the trailing 52 weeks."
    },
    {
        "key": "low_52w",
        "name": "52-Week Low Price",
        "category": "Technicals & Volume",
        "unit": "\u20b9",
        "supports_timeframe": False,
        "description": "Lowest traded price over the trailing 52 weeks."
    },
    {
        "key": "high_52w_distance_pct",
        "name": "Distance from 52-Week High %",
        "category": "Technicals & Volume",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Percentage discount of current price from trailing 52-week peak."
    },
    {
        "key": "low_52w_distance_pct",
        "name": "Distance from 52-Week Low %",
        "category": "Technicals & Volume",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Percentage premium of current price over trailing 52-week bottom."
    },
    {
        "key": "rsi",
        "name": "14-Day Relative Strength Index (RSI)",
        "category": "Technicals & Volume",
        "unit": "pts",
        "supports_timeframe": False,
        "description": "14-day momentum oscillator measuring overbought (>70) or oversold (<30) status."
    },
    {
        "key": "delivery_pct",
        "name": "Delivery Percentage",
        "category": "Technicals & Volume",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Percentage of total traded volume resulting in actual depository transfer."
    },
    {
        "key": "spread_pct",
        "name": "BSE vs NSE Arbitrage Spread %",
        "category": "Technicals & Volume",
        "unit": "%",
        "supports_timeframe": False,
        "description": "Absolute percentage price differential between BSE and NSE quotes."
    }
]
