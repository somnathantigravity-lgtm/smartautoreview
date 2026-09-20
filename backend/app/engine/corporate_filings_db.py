import os
import sqlite3
import logging
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "corporate_filings.db")

class CorporateFilingsDB:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=15)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cur = conn.cursor()
            # 1. P&L / Financial Results (Quarterly & Yearly)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS corporate_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                scrip_cd TEXT,
                period TEXT NOT NULL,
                period_type TEXT NOT NULL, -- quarterly, half_yearly, yearly
                filing_date TEXT,
                sales REAL,
                expenses REAL,
                operating_profit REAL,
                opm_pct REAL,
                other_income REAL,
                interest REAL,
                depreciation REAL,
                pbt REAL,
                tax REAL,
                tax_pct REAL,
                net_profit REAL,
                eps REAL,
                dividend_payout_pct REAL,
                yoy_sales_growth REAL,
                yoy_profit_growth REAL,
                qoq_sales_growth REAL,
                qoq_profit_growth REAL,
                source TEXT DEFAULT 'BSE/NSE LODR Reg 33',
                announcement_id TEXT,
                updated_at REAL,
                UNIQUE(symbol, period, period_type)
            )
            """)

            # 2. Balance Sheet Statements
            cur.execute("""
            CREATE TABLE IF NOT EXISTS corporate_balance_sheet (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                scrip_cd TEXT,
                period TEXT NOT NULL,
                filing_date TEXT,
                equity_capital REAL,
                reserves REAL,
                borrowings REAL,
                long_term_borrowings REAL,
                short_term_borrowings REAL,
                other_liabilities REAL,
                current_liabilities REAL,
                total_liabilities REAL,
                fixed_assets REAL,
                cwip REAL,
                investments REAL,
                current_assets REAL,
                cash_and_bank REAL,
                net_working_capital REAL,
                other_assets REAL,
                total_assets REAL,
                updated_at REAL,
                UNIQUE(symbol, period)
            )
            """)

            # 3. Cash Flow Statements
            cur.execute("""
            CREATE TABLE IF NOT EXISTS corporate_cash_flow (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                scrip_cd TEXT,
                period TEXT NOT NULL,
                filing_date TEXT,
                operating_cash_flow REAL,
                cfo_before_wc REAL,
                working_capital_changes REAL,
                direct_taxes_paid REAL,
                investing_cash_flow REAL,
                financing_cash_flow REAL,
                net_cash_flow REAL,
                capex REAL,
                free_cash_flow REAL,
                updated_at REAL,
                UNIQUE(symbol, period)
            )
            """)

            # 4. Shareholding Patterns (SEBI Clause 31)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS corporate_shareholding (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                scrip_cd TEXT,
                quarter TEXT NOT NULL,
                filing_date TEXT,
                promoter REAL,
                fii REAL,
                dii REAL,
                public REAL,
                pledged REAL DEFAULT 0.0,
                number_of_shareholders INTEGER,
                updated_at REAL,
                UNIQUE(symbol, quarter)
            )
            """)

            # 5. Ingestion Sync Audit Log
            cur.execute("""
            CREATE TABLE IF NOT EXISTS ingestion_sync_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sync_type TEXT NOT NULL,
                started_at REAL,
                completed_at REAL,
                status TEXT,
                records_fetched INTEGER DEFAULT 0,
                new_quarters_added INTEGER DEFAULT 0,
                notes TEXT
            )
            """)

            # Create Indexes for lightning lookup
            cur.execute("CREATE INDEX IF NOT EXISTS idx_results_sym ON corporate_results(symbol)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_bs_sym ON corporate_balance_sheet(symbol)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_cf_sym ON corporate_cash_flow(symbol)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_sh_sym ON corporate_shareholding(symbol)")
            conn.commit()

    def upsert_result(self, record: Dict[str, Any]):
        sql = """
        INSERT INTO corporate_results (
            symbol, scrip_cd, period, period_type, filing_date,
            sales, expenses, operating_profit, opm_pct, other_income,
            interest, depreciation, pbt, tax, tax_pct, net_profit,
            eps, dividend_payout_pct, yoy_sales_growth, yoy_profit_growth,
            qoq_sales_growth, qoq_profit_growth, source, announcement_id, updated_at
        ) VALUES (
            :symbol, :scrip_cd, :period, :period_type, :filing_date,
            :sales, :expenses, :operating_profit, :opm_pct, :other_income,
            :interest, :depreciation, :pbt, :tax, :tax_pct, :net_profit,
            :eps, :dividend_payout_pct, :yoy_sales_growth, :yoy_profit_growth,
            :qoq_sales_growth, :qoq_profit_growth, :source, :announcement_id, :updated_at
        )
        ON CONFLICT(symbol, period, period_type) DO UPDATE SET
            sales=excluded.sales,
            expenses=excluded.expenses,
            operating_profit=excluded.operating_profit,
            opm_pct=excluded.opm_pct,
            other_income=excluded.other_income,
            interest=excluded.interest,
            depreciation=excluded.depreciation,
            pbt=excluded.pbt,
            tax=excluded.tax,
            tax_pct=excluded.tax_pct,
            net_profit=excluded.net_profit,
            eps=excluded.eps,
            dividend_payout_pct=excluded.dividend_payout_pct,
            updated_at=excluded.updated_at
        """
        with self._get_connection() as conn:
            conn.execute(sql, {
                "symbol": record.get("symbol", "").upper(),
                "scrip_cd": str(record.get("scrip_cd", "")),
                "period": record.get("period", ""),
                "period_type": record.get("period_type", "quarterly"),
                "filing_date": record.get("filing_date", datetime.now().strftime("%Y-%m-%d")),
                "sales": record.get("sales", 0.0),
                "expenses": record.get("expenses", 0.0),
                "operating_profit": record.get("operating_profit", 0.0),
                "opm_pct": record.get("opm_pct", 0.0),
                "other_income": record.get("other_income", 0.0),
                "interest": record.get("interest", 0.0),
                "depreciation": record.get("depreciation", 0.0),
                "pbt": record.get("pbt", 0.0),
                "tax": record.get("tax", 0.0),
                "tax_pct": record.get("tax_pct", 25.17),
                "net_profit": record.get("net_profit", 0.0),
                "eps": record.get("eps", 0.0),
                "dividend_payout_pct": record.get("dividend_payout_pct", 0.0),
                "yoy_sales_growth": record.get("yoy_sales_growth"),
                "yoy_profit_growth": record.get("yoy_profit_growth"),
                "qoq_sales_growth": record.get("qoq_sales_growth"),
                "qoq_profit_growth": record.get("qoq_profit_growth"),
                "source": record.get("source", "BSE/NSE LODR Reg 33"),
                "announcement_id": record.get("announcement_id", ""),
                "updated_at": time.time()
            })
            conn.commit()

    def upsert_shareholding(self, record: Dict[str, Any]):
        sql = """
        INSERT INTO corporate_shareholding (
            symbol, scrip_cd, quarter, filing_date,
            promoter, fii, dii, public, pledged, number_of_shareholders, updated_at
        ) VALUES (
            :symbol, :scrip_cd, :quarter, :filing_date,
            :promoter, :fii, :dii, :public, :pledged, :number_of_shareholders, :updated_at
        )
        ON CONFLICT(symbol, quarter) DO UPDATE SET
            promoter=excluded.promoter,
            fii=excluded.fii,
            dii=excluded.dii,
            public=excluded.public,
            pledged=excluded.pledged,
            number_of_shareholders=excluded.number_of_shareholders,
            updated_at=excluded.updated_at
        """
        with self._get_connection() as conn:
            conn.execute(sql, {
                "symbol": record.get("symbol", "").upper(),
                "scrip_cd": str(record.get("scrip_cd", "")),
                "quarter": record.get("quarter", ""),
                "filing_date": record.get("filing_date", datetime.now().strftime("%Y-%m-%d")),
                "promoter": record.get("promoter", 0.0),
                "fii": record.get("fii", 0.0),
                "dii": record.get("dii", 0.0),
                "public": record.get("public", 0.0),
                "pledged": record.get("pledged", 0.0),
                "number_of_shareholders": record.get("number_of_shareholders", 0),
                "updated_at": time.time()
            })
            conn.commit()

    def get_results(self, symbol: str, period_type: Optional[str] = None) -> List[Dict[str, Any]]:
        sym = symbol.upper().strip()
        with self._get_connection() as conn:
            cur = conn.cursor()
            if period_type:
                cur.execute(
                    "SELECT * FROM corporate_results WHERE symbol = ? AND period_type = ? ORDER BY id ASC",
                    (sym, period_type)
                )
            else:
                cur.execute(
                    "SELECT * FROM corporate_results WHERE symbol = ? ORDER BY id ASC",
                    (sym,)
                )
            return [dict(row) for row in cur.fetchall()]

    def get_shareholding(self, symbol: str) -> List[Dict[str, Any]]:
        sym = symbol.upper().strip()
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                "SELECT * FROM corporate_shareholding WHERE symbol = ? ORDER BY id ASC",
                (sym,)
            )
            return [dict(row) for row in cur.fetchall()]

    def log_sync(self, sync_type: str, started_at: float, completed_at: float, status: str, count: int, new_quarters: int, notes: str):
        with self._get_connection() as conn:
            conn.execute("""
            INSERT INTO ingestion_sync_log (sync_type, started_at, completed_at, status, records_fetched, new_quarters_added, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (sync_type, started_at, completed_at, status, count, new_quarters, notes))
            conn.commit()

    def get_sync_status(self) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) as cnt FROM corporate_results")
            total_results = cur.fetchone()["cnt"]
            cur.execute("SELECT COUNT(DISTINCT symbol) as cnt FROM corporate_results")
            total_companies = cur.fetchone()["cnt"]
            cur.execute("SELECT COUNT(*) as cnt FROM corporate_shareholding")
            total_shareholdings = cur.fetchone()["cnt"]
            cur.execute("SELECT * FROM ingestion_sync_log ORDER BY id DESC LIMIT 1")
            last_log = cur.fetchone()

            return {
                "total_financial_results": total_results,
                "total_companies_tracked": total_companies,
                "total_shareholding_patterns": total_shareholdings,
                "last_sync": dict(last_log) if last_log else None,
                "status": "OPERATIONAL",
                "feed": "BSE & NSE SEBI LODR Announcements"
            }

corporate_filings_db = CorporateFilingsDB()
