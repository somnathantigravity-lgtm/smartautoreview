import sqlite3
import json
import os
import time
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "recommendations.db")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA busy_timeout=30000;")
    except Exception:
        pass
    return conn

def init_recommendations_db():
    """Initializes schema for production-grade recommendations, lifecycle, failure attribution, and strategy versioning."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Strategy Versions Table (Champion / Challenger)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS strategy_versions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        status TEXT NOT NULL, -- 'CHAMPION_ACTIVE', 'CHALLENGER_SHADOW', 'ARCHIVED'
        description TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        win_rate REAL DEFAULT 0.0,
        total_trades INTEGER DEFAULT 0,
        successful_trades INTEGER DEFAULT 0,
        failed_trades INTEGER DEFAULT 0,
        profit_factor REAL DEFAULT 1.0,
        created_at REAL NOT NULL,
        updated_at REAL NOT NULL
    );
    """)

    # 2. Recommendations Immutable Audit Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recommendations (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        bse_scrip TEXT NOT NULL,
        company_name TEXT NOT NULL,
        sector TEXT NOT NULL,
        market_cap_category TEXT NOT NULL, -- 'Large Cap', 'Mid Cap'
        market_cap_cr REAL NOT NULL,
        bse_price REAL NOT NULL,
        nse_price REAL NOT NULL,
        recommendation TEXT NOT NULL DEFAULT 'BUY',
        entry_min REAL NOT NULL,
        entry_max REAL NOT NULL,
        target_price REAL NOT NULL,
        stop_loss REAL NOT NULL,
        invalidation_price REAL NOT NULL,
        expected_horizon TEXT NOT NULL, -- e.g. '2-5 weeks'
        risk_reward_ratio REAL NOT NULL,
        opportunity_score INTEGER NOT NULL,
        status TEXT NOT NULL, -- 'WAITING_FOR_ENTRY', 'OPEN', 'CLOSED_SUCCESS', 'CLOSED_FAILURE', 'INVALIDATED', 'MISSED'
        status_label TEXT NOT NULL,
        reasons_json TEXT NOT NULL,
        evidence_json TEXT NOT NULL,
        strategy_version TEXT NOT NULL,
        model_version TEXT NOT NULL DEFAULT 'Apex-AI-v1.0',
        created_at REAL NOT NULL,
        created_at_str TEXT NOT NULL,
        entry_timestamp REAL,
        closed_at REAL,
        closed_at_str TEXT,
        exit_price REAL,
        return_pct REAL DEFAULT 0.0,
        max_favourable_pct REAL DEFAULT 0.0,
        max_adverse_pct REAL DEFAULT 0.0,
        failure_tag TEXT, -- 'FALSE_BREAKOUT', 'TIGHT_STOP', 'SECTOR_REGIME_CHANGE', 'MARKET_PULLBACK', 'ADVERSE_FILING'
        failure_reason TEXT,
        is_admin_manual INTEGER DEFAULT 0,
        is_published INTEGER DEFAULT 1,
        FOREIGN KEY (strategy_version) REFERENCES strategy_versions(version)
    );
    """)

    # 3. Rejected Candidates Log ("Why Not?" Negative Screening)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rejected_candidates (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        company_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        primary_rejection_reason TEXT NOT NULL,
        rejection_factors_json TEXT NOT NULL,
        created_at REAL NOT NULL
    );
    """)

    # 4. Daily EOD Executive Reports Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_eod_reports (
        date_str TEXT PRIMARY KEY, -- 'YYYY-MM-DD'
        total_generated INTEGER NOT NULL,
        total_entered INTEGER NOT NULL,
        successful_count INTEGER NOT NULL,
        failed_count INTEGER NOT NULL,
        active_open_count INTEGER NOT NULL,
        win_rate REAL NOT NULL,
        net_return_pct REAL NOT NULL,
        what_went_right TEXT NOT NULL,
        what_went_wrong TEXT NOT NULL,
        actionable_recommendation TEXT NOT NULL,
        proposed_strategy_update TEXT,
        active_champion_version TEXT NOT NULL,
        created_at REAL NOT NULL
    );
    """)

    # 5. System Configuration Settings (Admin Control)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admin_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at REAL NOT NULL
    );
    """)

    # 6. Persistent 30-Minute Market Day Pulses Archive Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS market_day_pulses (
        id TEXT PRIMARY KEY,
        date_str TEXT NOT NULL,
        slot_time TEXT NOT NULL,
        timestamp REAL NOT NULL,
        sentiment TEXT NOT NULL,
        badge_label TEXT NOT NULL,
        headline TEXT NOT NULL,
        story TEXT NOT NULL,
        leading_sector TEXT NOT NULL,
        lagging_sector TEXT NOT NULL,
        advances INTEGER NOT NULL DEFAULT 0,
        declines INTEGER NOT NULL DEFAULT 0,
        unchanged INTEGER NOT NULL DEFAULT 0,
        total_tracked INTEGER NOT NULL DEFAULT 5092,
        top_gainers_json TEXT NOT NULL DEFAULT '[]',
        top_losers_json TEXT NOT NULL DEFAULT '[]',
        created_at REAL NOT NULL
    );
    """)

    # 7. Daily Solvency Gate Cache Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_solvency_cache (
        date_str TEXT PRIMARY KEY,
        approved_count INTEGER NOT NULL,
        rejected_count INTEGER NOT NULL,
        approved_symbols_json TEXT NOT NULL,
        rejected_reasons_json TEXT NOT NULL,
        executed_at REAL NOT NULL,
        executed_at_str TEXT NOT NULL
    );
    """)

    # 8. Real-time Universe Stock Evaluations Ledger (For Admin & Diagnostics)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS universe_evaluations (
        symbol TEXT PRIMARY KEY,
        bse_scrip TEXT,
        company_name TEXT NOT NULL,
        sector TEXT NOT NULL,
        price REAL NOT NULL,
        solvency_passed INTEGER NOT NULL DEFAULT 1,
        solvency_reason TEXT,
        core_passed INTEGER NOT NULL DEFAULT 0,
        core_details_json TEXT NOT NULL DEFAULT '{}',
        catalysts_count INTEGER NOT NULL DEFAULT 0,
        catalysts_active_json TEXT NOT NULL DEFAULT '[]',
        opportunity_score INTEGER NOT NULL DEFAULT 0,
        current_status TEXT NOT NULL DEFAULT 'WATCHLIST_PENDING',
        diagnostic_summary TEXT NOT NULL,
        updated_at REAL NOT NULL,
        updated_at_str TEXT NOT NULL
    );
    """)

    # Safe Schema Migrations for existing database
    existing_cols = [r[1] for r in cursor.execute("PRAGMA table_info(recommendations)").fetchall()]
    if "recommendation_type" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN recommendation_type TEXT NOT NULL DEFAULT 'SHORT_TERM'")
        except Exception:
            pass
    if "strategy_name" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN strategy_name TEXT NOT NULL DEFAULT 'Institutional VCP Breakout'")
        except Exception:
            pass
    if "trailing_stop_loss" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN trailing_stop_loss REAL")
        except Exception:
            pass
    if "trailing_active" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN trailing_active INTEGER DEFAULT 0")
        except Exception:
            pass
    if "target_profit_pct" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN target_profit_pct REAL DEFAULT 0.0")
        except Exception:
            pass
    if "stop_loss_risk_pct" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN stop_loss_risk_pct REAL DEFAULT 0.0")
        except Exception:
            pass
    if "trimmed_at" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN trimmed_at REAL")
        except Exception:
            pass
    if "trimmed_price" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN trimmed_price REAL")
        except Exception:
            pass
    if "trimmed_return_pct" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN trimmed_return_pct REAL DEFAULT 0.0")
        except Exception:
            pass
    if "invalidation_trigger" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN invalidation_trigger TEXT")
        except Exception:
            pass
    if "solvency_status" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN solvency_status TEXT DEFAULT 'PASSED'")
        except Exception:
            pass
    if "phase2_passed" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN phase2_passed INTEGER DEFAULT 1")
        except Exception:
            pass
    if "phase3_passed" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN phase3_passed INTEGER DEFAULT 0")
        except Exception:
            pass
    if "phase3_score" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN phase3_score INTEGER DEFAULT 0")
        except Exception:
            pass
    if "phase3_details_json" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN phase3_details_json TEXT DEFAULT '{}'")
        except Exception:
            pass
    if "session_name" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN session_name TEXT DEFAULT 'MORNING'")
        except Exception:
            pass
    if "conviction_tier" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN conviction_tier TEXT DEFAULT 'TIER_1'")
        except Exception:
            pass
    if "conviction_tier_label" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN conviction_tier_label TEXT DEFAULT '🔥 Tier 1: High Conviction Rocket'")
        except Exception:
            pass
    if "historical_memory_score" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN historical_memory_score INTEGER DEFAULT 75")
        except Exception:
            pass
    if "historical_hit_rate" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN historical_hit_rate REAL DEFAULT 70.0")
        except Exception:
            pass
    if "historical_adr_pct" not in existing_cols:
        try:
            cursor.execute("ALTER TABLE recommendations ADD COLUMN historical_adr_pct REAL DEFAULT 2.2")
        except Exception:
            pass

    # Safe Schema Migrations for universe_evaluations table
    existing_univ_cols = [r[1] for r in cursor.execute("PRAGMA table_info(universe_evaluations)").fetchall()]
    if "phase3_passed" not in existing_univ_cols:
        try:
            cursor.execute("ALTER TABLE universe_evaluations ADD COLUMN phase3_passed INTEGER DEFAULT 0")
        except Exception:
            pass
    if "phase3_score" not in existing_univ_cols:
        try:
            cursor.execute("ALTER TABLE universe_evaluations ADD COLUMN phase3_score INTEGER DEFAULT 0")
        except Exception:
            pass
    if "phase3_details_json" not in existing_univ_cols:
        try:
            cursor.execute("ALTER TABLE universe_evaluations ADD COLUMN phase3_details_json TEXT DEFAULT '{}'")
        except Exception:
            pass
    if "session_name" not in existing_univ_cols:
        try:
            cursor.execute("ALTER TABLE universe_evaluations ADD COLUMN session_name TEXT DEFAULT 'MORNING'")
        except Exception:
            pass
    if "conviction_tier" not in existing_univ_cols:
        try:
            cursor.execute("ALTER TABLE universe_evaluations ADD COLUMN conviction_tier TEXT DEFAULT 'TIER_1'")
        except Exception:
            pass
    if "conviction_tier_label" not in existing_univ_cols:
        try:
            cursor.execute("ALTER TABLE universe_evaluations ADD COLUMN conviction_tier_label TEXT DEFAULT ''")
        except Exception:
            pass
    if "historical_memory_score" not in existing_univ_cols:
        try:
            cursor.execute("ALTER TABLE universe_evaluations ADD COLUMN historical_memory_score INTEGER DEFAULT 70")
        except Exception:
            pass
    if "historical_hit_rate" not in existing_univ_cols:
        try:
            cursor.execute("ALTER TABLE universe_evaluations ADD COLUMN historical_hit_rate REAL DEFAULT 70.0")
        except Exception:
            pass

    # Safe Schema Migrations for strategy_versions table
    existing_strat_cols = [r[1] for r in cursor.execute("PRAGMA table_info(strategy_versions)").fetchall()]
    if "inclusion_status" not in existing_strat_cols:
        try:
            cursor.execute("ALTER TABLE strategy_versions ADD COLUMN inclusion_status TEXT DEFAULT 'INCLUDED_IN_LIVE_PRODUCTION'")
        except Exception:
            pass
    if "changelog_json" not in existing_strat_cols:
        try:
            cursor.execute("ALTER TABLE strategy_versions ADD COLUMN changelog_json TEXT DEFAULT '[]'")
        except Exception:
            pass
    if "gaps_addressed_json" not in existing_strat_cols:
        try:
            cursor.execute("ALTER TABLE strategy_versions ADD COLUMN gaps_addressed_json TEXT DEFAULT '[]'")
        except Exception:
            pass

    conn.commit()
    conn.close()
    logger.info("Recommendations database initialized successfully.")

# Initialize database schema immediately
init_recommendations_db()

