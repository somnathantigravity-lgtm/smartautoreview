import sqlite3
import time
from app.engine.historical_batch_engine import simulate_breakouts_on_candles

DB_PATH = "backend/app/engine/intraday_history.db"

def test_speed():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Check candles for a popular stock, say LUMINO or RELIANCE
    t0 = time.time()
    cur.execute("""
        SELECT timestamp, datetime_str, open, high, low, close, volume
        FROM historical_1min_candles
        WHERE symbol = 'LUMINO' AND substr(datetime_str, 1, 10) != '2026-09-11'
        ORDER BY timestamp ASC
    """)
    rows = cur.fetchall()
    fetch_time = time.time() - t0
    print(f"Fetched {len(rows)} candles in {fetch_time*1000:.1f}ms")
    
    candles = [
        {"timestamp": r[0], "datetime_str": r[1], "open": r[2], "high": r[3], "low": r[4], "close": r[5], "volume": r[6]}
        for r in rows
    ]
    
    t1 = time.time()
    res = simulate_breakouts_on_candles(candles, target_pct=1.0, stop_loss_pct=0.6)
    sim_time = time.time() - t1
    print(f"Simulated {res['total_trades']} trades in {sim_time*1000:.1f}ms: Win rate = {res['win_rate']}%")
    conn.close()

if __name__ == '__main__':
    test_speed()
