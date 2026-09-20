import os
import sqlite3
import json
import time
import logging
from typing import Dict, Any, List, Optional
from app.engine.bot_conversation import STARTER_TEMPLATES

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "bot_studio.db")

class BotStore:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = os.path.abspath(db_path)
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS bots (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'DRAFT',
                    risk_score TEXT DEFAULT 'MODERATE',
                    strategy_json TEXT NOT NULL,
                    backtest_json TEXT,
                    created_at REAL NOT NULL,
                    updated_at REAL NOT NULL
                )
            """)
            conn.commit()
            self._seed_default_bots(conn)

    def _seed_default_bots(self, conn: sqlite3.Connection):
        """Seeds standard starter bots so user immediately has live examples."""
        cursor = conn.execute("SELECT COUNT(*) FROM bots")
        count = cursor.fetchone()[0]
        if count == 0:
            now = time.time()
            for tpl in STARTER_TEMPLATES:
                strat = tpl["strategy"]
                strat_id = f"bot_{tpl['id'].replace('tpl_', '')}"
                strat["id"] = strat_id
                conn.execute("""
                    INSERT OR REPLACE INTO bots (id, name, description, status, risk_score, strategy_json, backtest_json, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    strat_id,
                    tpl["name"],
                    tpl["description"],
                    "READY_FOR_PAPER",
                    "LOW" if "RSI" in tpl["name"] else "MODERATE",
                    json.dumps(strat),
                    None,
                    now,
                    now
                ))
            conn.commit()

    def list_bots(self) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.execute("SELECT * FROM bots ORDER BY updated_at DESC")
            rows = cursor.fetchall()
            bots = []
            for r in rows:
                bots.append({
                    "id": r["id"],
                    "name": r["name"],
                    "description": r["description"],
                    "status": r["status"],
                    "risk_score": r["risk_score"],
                    "strategy": json.loads(r["strategy_json"]),
                    "backtest": json.loads(r["backtest_json"]) if r["backtest_json"] else None,
                    "created_at": r["created_at"],
                    "updated_at": r["updated_at"]
                })
            return bots

    def get_bot(self, bot_id: str) -> Optional[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.execute("SELECT * FROM bots WHERE id = ?", (bot_id,))
            r = cursor.fetchone()
            if not r:
                return None
            return {
                "id": r["id"],
                "name": r["name"],
                "description": r["description"],
                "status": r["status"],
                "risk_score": r["risk_score"],
                "strategy": json.loads(r["strategy_json"]),
                "backtest": json.loads(r["backtest_json"]) if r["backtest_json"] else None,
                "created_at": r["created_at"],
                "updated_at": r["updated_at"]
            }

    def save_bot(
        self,
        strategy_dict: Dict[str, Any],
        backtest_dict: Optional[Dict[str, Any]] = None,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        bot_id = strategy_dict.get("id") or f"bot_{int(time.time()*1000)}"
        strategy_dict["id"] = bot_id
        name = strategy_dict.get("name", "Custom Bot")
        desc = strategy_dict.get("description", "")
        risk_score = strategy_dict.get("risk_score", "MODERATE")
        bot_status = status or strategy_dict.get("status", "DRAFT")
        if backtest_dict and bot_status == "DRAFT":
            bot_status = "BACKTESTED"

        now = time.time()
        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO bots (id, name, description, status, risk_score, strategy_json, backtest_json, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name=excluded.name,
                    description=excluded.description,
                    status=excluded.status,
                    risk_score=excluded.risk_score,
                    strategy_json=excluded.strategy_json,
                    backtest_json=COALESCE(excluded.backtest_json, bots.backtest_json),
                    updated_at=excluded.updated_at
            """, (
                bot_id,
                name,
                desc,
                bot_status,
                risk_score,
                json.dumps(strategy_dict),
                json.dumps(backtest_dict) if backtest_dict else None,
                now,
                now
            ))
            conn.commit()

        return self.get_bot(bot_id)

    def delete_bot(self, bot_id: str) -> bool:
        with self._get_conn() as conn:
            cursor = conn.execute("DELETE FROM bots WHERE id = ?", (bot_id,))
            conn.commit()
            return cursor.rowcount > 0

bot_store = BotStore()
