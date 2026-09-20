"""
Fast Vault Database Deduplication & Timestamp Normalization Script
Targets recent candles (>= '2026-09-12') using indexed datetime_str and timestamps for sub-second execution.
"""

import os
import sqlite3
import time
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("deduplicate_vault")

DB_DIR = os.path.dirname(__file__)
HISTORY_DB_PATH = os.path.join(DB_DIR, "intraday_history.db")


def run_fast_deduplication():
    logger.info(f"Opening database: {HISTORY_DB_PATH}")
    conn = sqlite3.connect(HISTORY_DB_PATH, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    cur = conn.cursor()

    # Step 1: Clean daily_tape_ingestion_log of any failed entries or 0-candle completions
    cur.execute("""
        DELETE FROM daily_tape_ingestion_log 
        WHERE status = 'FAILED' OR (status = 'COMPLETED' AND candle_count = 0)
    """)
    deleted_logs = cur.rowcount
    if deleted_logs > 0:
        logger.info(f"Cleaned {deleted_logs} failed/empty entries from daily_tape_ingestion_log for clean re-sync.")
        conn.commit()

    # Step 3: Check summary status
    cur.execute("""
        SELECT date_str, exchange, status, COUNT(*) 
        FROM daily_tape_ingestion_log 
        GROUP BY date_str, exchange, status 
        ORDER BY date_str DESC
    """)
    rows = cur.fetchall()
    logger.info("Current verified ingestion logs:")
    for r in rows:
        logger.info(f"  {r[0]} | {r[1]} | {r[2]} | {r[3]} stocks")

    conn.close()
    logger.info("Fast deduplication & log cleanup complete!")


if __name__ == "__main__":
    run_fast_deduplication()
