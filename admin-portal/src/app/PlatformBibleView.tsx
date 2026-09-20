"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Download,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Database,
  Cpu,
  Bot,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Code2,
  FileCode2,
  Radio,
  Server,
  Terminal,
  Activity,
  Zap,
  Globe,
  Lock,
  ChevronDown,
  ChevronUp,
  Sliders,
  DollarSign,
  FileText,
  AlertTriangle,
  Flame,
  LineChart,
  HelpCircle,
  Copy,
  Check,
  FolderTree,
  Boxes
} from "lucide-react";

type ModuleCategory =
  | "ALL"
  | "BROKER_DHAN"
  | "AI_QUANT"
  | "MARKET_UNIVERSE"
  | "PORTFOLIO_VAULT"
  | "STUDIO_BOTS"
  | "REGULATORY"
  | "INFRA_DB"
  | "API_EXPLORER"
  | "ROADMAP";

interface ApiEndpointItem {
  id: string;
  category: string;
  method: "GET" | "POST" | "DELETE" | "PATCH";
  path: string;
  summary: string;
  inputs?: string;
  outputs?: string;
  storage?: string;
  caller?: string;
}

interface ModuleSection {
  id: number;
  title: string;
  tag: string;
  category: ModuleCategory;
  icon: React.ElementType;
  summaryPlainEnglish: string;
  primaryFiles: string[];
  keyDataStructures?: string[];
  dataFlow?: string[];
  inputOutput?: { inputs: string; outputs: string; storage: string };
  frontendComponents?: string[];
  deepDetails?: string[];
  codeSample?: string;
}

const MODULES_DATA: ModuleSection[] = [
  {
    id: 1,
    title: "Project Overview & Three-Tier Architecture",
    tag: "CORE ARCHITECTURE",
    category: "INFRA_DB",
    icon: Boxes,
    summaryPlainEnglish:
      "A high-speed Indian stock market terminal monitoring 5,092+ BSE & NSE equities in real time. It combines sub-second DhanHQ WebSocket price feeds, autonomous AI stock recommendations, automated Dhan order execution with dual stop-losses, AST-based financial screening, and a 60-day 1-minute historical tick vault (~17 GB).",
    primaryFiles: [
      "frontend/ (Next.js 16, Port 3000)",
      "backend/ (FastAPI + Python, Port 8000)",
      "admin-portal/ (Next.js 16, Port 3001)"
    ],
    dataFlow: [
      "DhanHQ WebSocket / REST API → DhanProvider in-memory cache (`stocks_cache`)",
      "Background workers calculate 26-vector confluence & AI recommendations every 30 mins",
      "FastAPI delivers live JSON & WebSocket broadcasts (`/ws/market`) to Port 3000 & 3001",
      "Orders executed directly through DhanTradeService with dual stop-loss management"
    ],
    frontendComponents: ["All 9 Next.js App Router pages + 26 React components"],
    deepDetails: [
      "Next.js 16.3.4 with React 19 and TailwindCSS v4",
      "FastAPI with Uvicorn ASGI server and Pydantic v2 schemas",
      "7 embedded SQLite databases with zero cloud dependencies for local-first speed",
      "Safe AST parsing for all user-defined screening math (zero python eval risk)"
    ]
  },
  {
    id: 2,
    title: "Dhan API Integration & Core Market Feed",
    tag: "BROKER & FEED",
    category: "BROKER_DHAN",
    icon: Radio,
    summaryPlainEnglish:
      "The direct digital phone line to the Indian stock exchanges (BSE & NSE). Connects via DhanHQ SDK and custom WebSockets to maintain real-time tick data for 5,092+ stocks, manage token renewal, calculate OHLCV candles, and execute live orders.",
    primaryFiles: [
      "backend/app/engine/dhan_provider.py (2,411 lines, 117 KB)",
      "backend/app/engine/dhan_totp_auth.py (290 lines)",
      "backend/app/engine/dhan_trade_service.py (697 lines, 33 KB)"
    ],
    keyDataStructures: [
      "KNOWN_DHAN_SCRIP_IDS: Maps Reliance (2885), TCS (11536), HDFCBANK (1333), etc.",
      "stocks_cache: In-memory dictionary holding 30+ metrics per stock (LTP, VWAP, 52W, volume, dual-listing spread)"
    ],
    dataFlow: [
      "DhanHQ MarketFeed patched with `safe_is_ws_closed()` to avoid Python crash bugs",
      "WebSocket ticks trigger in-memory cache update & compute 1-min sparklines",
      "Dual-listing arbitrage engine compares NSE LTP vs BSE LTP in real time",
      "Automated daily TOTP login at 7:30 AM IST generates 24-hour token automatically"
    ],
    inputOutput: {
      inputs: "Dhan Client ID, Trading PIN, TOTP Base32 secret",
      outputs: "Live ticker quotes, candles, indices, positions, order IDs",
      storage: ".dhan_session.json (auto-token) & .dhan_totp_config.json"
    },
    frontendComponents: ["PortfolioView.tsx", "OrderPlacementModal.tsx", "UniverseView.tsx"]
  },
  {
    id: 3,
    title: "AI Recommendation Engine (Apex 18-Parameter v1.2)",
    tag: "AI STRATEGY",
    category: "AI_QUANT",
    icon: Sparkles,
    summaryPlainEnglish:
      "The automated intelligence engine that scans 5,092+ stocks every 30 minutes to discover high-conviction trade setups. Scores stocks against 18 multi-factor gates across 3 horizons (Intraday, Swing, Wealth) and enforces a strict 96+/100 score threshold before recommending.",
    primaryFiles: [
      "backend/app/engine/recommendation_engine.py (2,724 lines, 138 KB)",
      "backend/app/api/v1/recommendations.py"
    ],
    keyDataStructures: [
      "12-Strategy Library: VWAP Volume Spike, ORB, VCP Breakout, Smart Money Delivery, High RoCE Compounder",
      "18 Gate Parameters: Solvency, RoCE, Sales Growth, Delivery %, Base Structure, Risk-Reward ≥2x, VIX safety"
    ],
    dataFlow: [
      "Solvency gate filters out loss-making & negative net worth companies first",
      "Technical & quant engines calculate Volatility Contraction Pattern (VCP) and volume spikes",
      "Qualifying candidates must pass ≥10 of 18 parameters with total score ≥96/100",
      "Recommendations saved to `recommendations.db` with immutable audit log and SL/TP levels"
    ],
    inputOutput: {
      inputs: "LTP, financial fundamentals, delivery percentages, moving averages",
      outputs: "Recommended stock, entry range, Stop Loss 1, Stop Loss 2, Target Price, 18-vector evidence report",
      storage: "recommendations.db (`recommendations` and `rejected_candidates` tables)"
    },
    frontendComponents: ["RecommendationDashboardView.tsx (172 KB)", "StrategyVisualizerCard.tsx"]
  },
  {
    id: 4,
    title: "Stocks Universe Module (5,092+ Equities)",
    tag: "MARKET DATA",
    category: "MARKET_UNIVERSE",
    icon: Globe,
    summaryPlainEnglish:
      "The central catalog of all tradable companies listed on NSE and BSE. Provides instant multi-attribute search, sector categorization, market-cap classification, dual-listing arbitrage spreads, and micro-sparklines without database query overhead.",
    primaryFiles: [
      "backend/app/api/v1/universe.py",
      "backend/app/engine/dhan_provider.py"
    ],
    dataFlow: [
      "All 5,092+ stocks loaded into memory on server startup (~80 MB RAM footprint)",
      "Instant filtering by Sector, Market Cap (Large/Mid/Small/Micro), Exchange, or Dual-Listing status",
      "Computes real-time price gaps between NSE and BSE for arbitrage opportunities",
      "Returns paginated payloads with 10-point mini sparkline arrays for zero-lag rendering"
    ],
    inputOutput: {
      inputs: "page, limit, search query, sector, mcap, exchange, sort_by",
      outputs: "Stock list with 32 fields per stock + pagination metadata",
      storage: "In-memory `stocks_cache` refreshed continuously via WebSocket ticks"
    },
    frontendComponents: ["UniverseView.tsx (152 KB)"]
  },
  {
    id: 5,
    title: "Financial Screener & Open Screener Studio",
    tag: "SCREENING",
    category: "MARKET_UNIVERSE",
    icon: Filter,
    summaryPlainEnglish:
      "An institutional-grade stock screener that lets you evaluate custom financial and technical expressions across all 5,092 stocks. Built using Python's Abstract Syntax Tree (AST) engine to ensure 100% security without using dangerous `eval()`.",
    primaryFiles: [
      "backend/app/engine/screener_engine.py",
      "backend/app/api/v1/portfolios.py"
    ],
    deepDetails: [
      "Supports mathematical queries like: `pe < 25 and roce > 18 and debt_to_equity < 0.5`",
      "Supports dynamic comparison: `ltp > ema_200 and volume > 2 * avg_vol_20d`",
      "AST Parser tokenizes syntax safely, blocking code injection or system call attempts",
      "Pre-built preset screens: Deep Value, Momentum Breakout, Debt-Free Growth, High Dividend"
    ],
    frontendComponents: ["AdvancedScreenerModal.tsx (80 KB)", "FinancialScreenerView.tsx (76 KB)"]
  },
  {
    id: 6,
    title: "Company Financials & BSE Ground Truth Master",
    tag: "FUNDAMENTALS",
    category: "REGULATORY",
    icon: FileText,
    summaryPlainEnglish:
      "The fundamental foundation of the terminal. Aggregates balance sheets, P&L statements, quarterly filings, shareholding patterns, and promoter pledge ratios directly from official BSE SEBI LODR corporate disclosures.",
    primaryFiles: [
      "backend/app/engine/corporate_filings_db.py",
      "backend/app/engine/corporate_results_extractor.py",
      "backend/app/api/v1/corporate_filings.py"
    ],
    inputOutput: {
      inputs: "Stock Symbol or BSE Scrip Code",
      outputs: "Revenue, EBITDA, Net Profit, EPS, Debt, RoCE, RoE, Pledging %, Cash Flow",
      storage: "corporate_filings.db (`company_financials_master`, `corporate_results`)"
    },
    frontendComponents: ["CompanyFinancialsModal.tsx", "StockDetailDrawer.tsx"]
  },
  {
    id: 7,
    title: "My Portfolio & Live Order Execution",
    tag: "ORDER EXECUTION",
    category: "PORTFOLIO_VAULT",
    icon: DollarSign,
    summaryPlainEnglish:
      "Direct live integration with your Dhan demat account. View real-time position P&L, demat holdings, order books, and execute market/limit orders equipped with automated dual stop-loss rules (SL1 for initial safety, SL2 auto-moved to breakeven).",
    primaryFiles: [
      "backend/app/engine/dhan_trade_service.py",
      "backend/app/api/v1/trade.py"
    ],
    dataFlow: [
      "Fetches live positions & holdings from Dhan broker REST APIs",
      "Background SL Tracker (`order_sl_tracker.json`) monitors price movement against SL1/SL2",
      "One-click square-off sends cancellation and market sell requests simultaneously"
    ],
    inputOutput: {
      inputs: "Symbol, Quantity, Price, SL1, SL2, Target, Product (CNC/INTRADAY)",
      outputs: "Order ID, Exchange Order ID, Order status, Execution price",
      storage: "Dhan broker servers + local `order_sl_tracker.json`"
    },
    frontendComponents: ["PortfolioView.tsx (45 KB)", "OrderPlacementModal.tsx (35 KB)"]
  },
  {
    id: 8,
    title: "My Watchlist & Custom Portfolio Manager",
    tag: "WATCHLIST",
    category: "PORTFOLIO_VAULT",
    icon: Layers,
    summaryPlainEnglish:
      "Create, categorize, and track custom baskets of stocks. Synchronizes real-time prices, day's gains, technical indicators, and news alerts for every stock in your custom watchlists.",
    primaryFiles: [
      "backend/app/api/v1/portfolios.py",
      "backend/app/engine/portfolio_manager.py"
    ],
    inputOutput: {
      inputs: "Portfolio Name, Description, Symbol list",
      outputs: "Portfolio metrics, aggregate P&L, stock quotes, allocation breakdown",
      storage: "stock_screener.db (`custom_portfolios`, `watchlist_items`)"
    },
    frontendComponents: ["FinancialScreenerView.tsx", "WatchlistSidebar.tsx"]
  },
  {
    id: 9,
    title: "Data Vault (60-Day Tick Vault & Quant Matrix)",
    tag: "QUANT VAULT",
    category: "PORTFOLIO_VAULT",
    icon: Database,
    summaryPlainEnglish:
      "A massive local quantitative historical storage facility holding 60 consecutive days of 1-minute OHLCV candles for all 5,092 stocks (~17 GB). Enables millisecond-level backtesting and calculating historical win rates across market regimes.",
    primaryFiles: [
      "backend/app/engine/historical_data_service.py",
      "backend/app/api/v1/historical_data_api.py"
    ],
    deepDetails: [
      "Download pipeline with rate-limiting, pause, resume, and single-stock sync",
      "Indexed SQLite database `intraday_history.db` optimized for time-series range queries",
      "Quant matrix calculates 60-day historical strategy win-rate per individual stock",
      "Provides granular candles for testing custom bots without live broker queries"
    ],
    inputOutput: {
      inputs: "Symbol, Start Date, End Date, Interval (1m, 5m, 15m, 1d)",
      outputs: "Candle arrays [timestamp, open, high, low, close, volume]",
      storage: "intraday_history.db (`historical_1min_candles` table, ~17 GB)"
    },
    frontendComponents: ["DataVaultView.tsx (46 KB)"]
  },
  {
    id: 10,
    title: "Market Trends & Sector Breadth Engine",
    tag: "MARKET PULSE",
    category: "MARKET_UNIVERSE",
    icon: TrendingUp,
    summaryPlainEnglish:
      "Monitors macro market health across all Indian sectors. Calculates advance/decline ratios, stocks above 20/50/200 EMAs, fresh 52-week highs vs lows, and top outperforming sectors relative to Nifty 50 and Sensex.",
    primaryFiles: [
      "backend/app/engine/trends_engine.py",
      "backend/app/api/v1/universe.py"
    ],
    dataFlow: [
      "Aggregates full `stocks_cache` every 60 seconds",
      "Computes market breadth: Total Advances vs Declines across BSE & NSE",
      "Ranks 18 market sectors by relative momentum strength",
      "Issues Market Regime alerts: 'BULLISH CONTINUATION', 'CAUTION / TOPPING', 'PANIC PULLBACK'"
    ],
    frontendComponents: ["TrendsDashboardView.tsx", "TrendsMetricCard.tsx"]
  },
  {
    id: 11,
    title: "Dalal Street News & Live Financial Intelligence",
    tag: "NEWS WIRE",
    category: "MARKET_UNIVERSE",
    icon: Activity,
    summaryPlainEnglish:
      "A real-time financial wire that ingests RSS news feeds from Economic Times, Moneycontrol, and Livemint, parses sentiment, and maps breaking news directly to relevant stock symbols and sectors.",
    primaryFiles: [
      "backend/app/engine/news_service.py",
      "backend/app/api/v1/news.py"
    ],
    inputOutput: {
      inputs: "Filter query, Sector, Symbol, Sentiment (BULLISH / BEARISH / NEUTRAL)",
      outputs: "Ranked news articles with headline, timestamp, source link, and affected stocks",
      storage: "news_feed.db (`news_articles` table)"
    },
    frontendComponents: ["NewsFeedView.tsx", "NewsMatchingBadge.tsx"]
  },
  {
    id: 12,
    title: "Chart & Rules Studio (Dynamic Trigger Studio)",
    tag: "STUDIO & CHARTS",
    category: "STUDIO_BOTS",
    icon: LineChart,
    summaryPlainEnglish:
      "A powerhouse charting workspace (242 KB component) featuring TradingView-style interactive candlestick charts, multi-indicator overlays (RSI, Supertrend, Bollinger, EMA 20/50/200, VWAP), and a visual rule builder to trigger custom buy/sell alerts.",
    primaryFiles: [
      "frontend/src/app/chart/ChartRuleStudio.tsx (242 KB, largest component)",
      "backend/app/engine/rule_engine.py",
      "backend/app/engine/strategy_dsl.py"
    ],
    deepDetails: [
      "Multi-timeframe switching: 1m, 5m, 15m, 1h, 1D",
      "Strategy DSL with UniverseConfig, EntryRules, ExitRules, PositionSizing, RiskLimits",
      "Condition builder supporting operators: `CROSSES_ABOVE`, `GREATER_THAN`, `LESS_THAN`, `BETWEEN`"
    ],
    frontendComponents: ["ChartRuleStudio.tsx"]
  },
  {
    id: 13,
    title: "Bot Studio & Quant Copilot Strategy Builder",
    tag: "AI BOTS",
    category: "STUDIO_BOTS",
    icon: Bot,
    summaryPlainEnglish:
      "Build, test, and deploy algorithmic trading bots by conversing with an AI Copilot in plain English. Includes 6 built-in templates (RSI Oversold, VWAP Reclaim, NR7 Breakout, Golden Cross) and a deterministic historical backtester with full Indian regulatory costs.",
    primaryFiles: [
      "backend/app/engine/bot_conversation.py",
      "backend/app/engine/backtest_engine.py",
      "backend/app/engine/cost_engine.py",
      "backend/app/api/v1/bots.py"
    ],
    deepDetails: [
      "Backtest engine models exact bar-by-bar execution, slippage, and maximum drawdown",
      "Indian cost calculator deducts STT (0.1% buy / 0.025% sell), Brokerage (₹20 flat), GST (18%), and SEBI turnover fees",
      "Outputs equity curves, win/loss ratios, Sharpe ratio, and profit factor"
    ],
    inputOutput: {
      inputs: "Natural language strategy prompt or structured strategy JSON",
      outputs: "Backtest performance: trades list, equity curve, gross/net P&L, fees paid",
      storage: "bot_studio.db (`saved_bots`, `backtest_runs`)"
    },
    frontendComponents: ["BotStudioView.tsx", "StrategyBacktestModal.tsx"]
  },
  {
    id: 14,
    title: "xKiro AI Gateway Integration",
    tag: "AI GATEWAY",
    category: "AI_QUANT",
    icon: Cpu,
    summaryPlainEnglish:
      "The multi-model AI routing gateway connecting the terminal to Claude 3.5 Sonnet, GPT-4o, and specialized reasoning models. Provides OpenAI-compatible API abstraction, prompt caching, token usage tracking, and automated fallback.",
    primaryFiles: [
      "backend/app/engine/xkiro_client.py",
      "backend/app/engine/xkiro_models_catalog.py",
      "backend/app/api/v1/admin.py"
    ],
    inputOutput: {
      inputs: "Prompt, system prompt, temperature, selected model ID",
      outputs: "Streaming or block completion response, tokens used, latency",
      storage: "Encrypted API keys in `xkiro_config.json`"
    },
    frontendComponents: ["QuantCopilotView.tsx", "AdminSettingsView.tsx"]
  },
  {
    id: 15,
    title: "Corporate Filings (BSE SEBI LODR Auto-Extractor)",
    tag: "COMPLIANCE",
    category: "REGULATORY",
    icon: FileCode2,
    summaryPlainEnglish:
      "Automated scraper and extractor for official BSE corporate filings. Captures financial results, board meeting announcements, dividend declarations, and credit rating revisions in structured format.",
    primaryFiles: [
      "backend/app/engine/corporate_filings_db.py",
      "backend/app/api/v1/corporate_filings.py"
    ],
    inputOutput: {
      inputs: "BSE Symbol or Category Filter (Financial Results, Board Meeting, Dividend)",
      outputs: "Structured filing record with headline, PDF download link, timestamp, and parsed metrics",
      storage: "corporate_filings.db (`corporate_filings` table)"
    },
    frontendComponents: ["CorporateFilingsDrawer.tsx"]
  },
  {
    id: 16,
    title: "Authentication & Alert Dispatcher",
    tag: "SECURITY",
    category: "INFRA_DB",
    icon: Lock,
    summaryPlainEnglish:
      "Handles user session management, email OTP generation, and real-time trading notifications. Dispatches instant notifications when target prices are hit, stop-losses are triggered, or new recommendations are published.",
    primaryFiles: [
      "backend/app/api/v1/auth.py",
      "backend/app/core/config.py"
    ],
    inputOutput: {
      inputs: "Email address, OTP code, Alert rules",
      outputs: "JWT token, active alert list, alert dismissal status",
      storage: "Session token memory cache"
    },
    frontendComponents: ["AuthModal.tsx", "NotificationCenter.tsx"]
  },
  {
    id: 17,
    title: "Admin Portal & Strategy Governance (Port 3001)",
    tag: "ADMIN CONTROL",
    category: "INFRA_DB",
    icon: ShieldCheck,
    summaryPlainEnglish:
      "The command center for system administrators. Controls Champion vs Challenger strategy models, inspects universe solvency, reviews negative screening ('Why Not?' rejected candidates), triggers on-demand scans, and chats with Quant Copilot.",
    primaryFiles: [
      "admin-portal/src/app/page.tsx (113 KB)",
      "admin-portal/src/app/QuantCopilotView.tsx (26 KB)",
      "admin-portal/src/app/PlatformBibleView.tsx"
    ],
    deepDetails: [
      "Universe Solvency Inspector: Audits 5,092 stocks for positive net worth & profitability",
      "Candidate Archive: Review all-time preserved and rejected recommendation candidates",
      "Strategy Version Manager: Promote challenger strategies (v1.2 Champion active)",
      "Manual Stock Injector: Force-add a recommendation with customized entry/SL/TP parameters"
    ],
    frontendComponents: ["AdminPortalPage (Port 3001)"]
  },
  {
    id: 18,
    title: "System Settings & Dynamic Cost Rules",
    tag: "CONFIG",
    category: "INFRA_DB",
    icon: Sliders,
    summaryPlainEnglish:
      "Centralized settings dashboard allowing operators to configure broker credentials, AI models, scanning frequency, and custom Indian regulatory cost rules (brokerage, STT, exchange fees, GST) without server restarts.",
    primaryFiles: [
      "backend/app/api/v1/admin.py",
      "backend/app/engine/cost_engine.py"
    ],
    frontendComponents: ["AdminSettingsView.tsx"]
  },
  {
    id: 19,
    title: "WebSocket Real-Time Broadcast Engine",
    tag: "REAL-TIME",
    category: "INFRA_DB",
    icon: Zap,
    summaryPlainEnglish:
      "Sub-second market data distributor. Bridges DhanHQ's binary tick feeds to frontend browser clients via `/ws/market`. Manages connection pooling, heartbeat pings, symbol subscriptions, and automatic reconnection.",
    primaryFiles: [
      "backend/app/main.py",
      "backend/app/engine/dhan_provider.py"
    ],
    deepDetails: [
      "Client Action `SUBSCRIBE_STOCK`: Streams real-time tick quotes for individual equity",
      "Client Action `SUBSCRIBE_UNIVERSE`: Batch-streams tick updates for multi-stock watchlists",
      "Heartbeat ping-pong every 30 seconds to prevent NAT timeout on cellular or Wi-Fi"
    ],
    frontendComponents: ["useWebSocket.ts", "MarketTickerBar.tsx"]
  },
  {
    id: 20,
    title: "Frontend Architecture & Component Matrix",
    tag: "FRONTEND",
    category: "INFRA_DB",
    icon: Code2,
    summaryPlainEnglish:
      "Next.js 16 App Router architecture with 9 primary routes, 26 modular React 19 components, centralized API client (`api.ts`, 733 lines), and strict TypeScript definitions (`index.ts`, 853 lines).",
    primaryFiles: [
      "frontend/src/app/ (9 routes)",
      "frontend/src/components/ (26 TSX files)",
      "frontend/src/services/api.ts (733 lines)",
      "frontend/src/types/index.ts (853 lines)"
    ],
    frontendComponents: ["ChartRuleStudio (242 KB)", "RecommendationDashboard (172 KB)", "UniverseView (152 KB)"]
  },
  {
    id: 21,
    title: "7 Embedded SQLite Databases Blueprint",
    tag: "PERSISTENCE",
    category: "INFRA_DB",
    icon: Database,
    summaryPlainEnglish:
      "High-performance, zero-maintenance data persistence using 7 distinct SQLite database files. Separating concerns prevents lock contention between high-volume 1-minute historical tick writes (~17 GB) and fast recommendation queries.",
    primaryFiles: [
      "recommendations.db (~109 MB, 8 tables)",
      "intraday_history.db (~17 GB, 2 tables)",
      "quant_copilot.db (~19 MB, 26-param DNA)",
      "news_feed.db (~799 KB, RSS articles)",
      "corporate_filings.db (~451 KB, BSE LODR)",
      "bot_studio.db (~20 KB, saved strategies)",
      "stock_screener.db (custom portfolios & screens)"
    ],
    deepDetails: [
      "`recommendations`: Stores symbol, horizon, entry, SL1, SL2, target, 18-parameter score",
      "`historical_1min_candles`: Indexed on `(symbol, timestamp)` for rapid OHLCV backtests",
      "`corporate_results`: Quarterly and annual P&L, balance sheets, and audit notes"
    ]
  },
  {
    id: 22,
    title: "Startup Lifecycle & Background Workers",
    tag: "BACKGROUND CRON",
    category: "INFRA_DB",
    icon: Server,
    summaryPlainEnglish:
      "Orchestrates background tasks on server boot. Starts Dhan WebSocket feed, schedules daily 7:30 AM TOTP token refresh, runs 30-minute AI recommendation scans, syncs market trends, and refreshes RSS news wires.",
    primaryFiles: [
      "backend/app/main.py (@app.on_event('startup'))",
      "backend/app/engine/dhan_totp_auth.py",
      "backend/app/engine/recommendation_engine.py"
    ]
  }
];

const API_ENDPOINTS: ApiEndpointItem[] = [
  // Universe & Market
  { id: "u1", category: "Universe", method: "GET", path: "/api/v1/universe/stocks", summary: "Paginated stock universe with 32 fields per stock, search & filters", inputs: "page, limit, search, sector, mcap, exchange", outputs: "{stocks[], total, page, total_pages}", storage: "In-memory stocks_cache", caller: "UniverseView.tsx" },
  { id: "u2", category: "Universe", method: "GET", path: "/api/v1/universe/stock/{symbol}", summary: "Comprehensive quote, indicators, 52W range, and dual-listing info", inputs: "symbol (path)", outputs: "Complete StockQuote object", storage: "stocks_cache + historical candles", caller: "StockDetailDrawer.tsx" },
  { id: "u3", category: "Universe", method: "GET", path: "/api/v1/universe/indices", summary: "Real-time index quotes (Nifty 50, Sensex, Bank Nifty, Midcap)", inputs: "None", outputs: "{indices[], timestamp}", storage: "stocks_cache", caller: "MarketTickerBar.tsx" },
  { id: "u4", category: "Universe", method: "GET", path: "/api/v1/universe/chart/{symbol}", summary: "OHLCV candlestick chart data with RSI, EMA, and VWAP overlays", inputs: "symbol, interval (1m, 5m, 15m, 1d), range", outputs: "{candles[], indicators{}}", storage: "intraday_history.db", caller: "ChartRuleStudio.tsx" },
  { id: "u5", category: "Universe", method: "GET", path: "/api/v1/universe/trends", summary: "Market breadth, advances/declines, and top sector momentum rankings", inputs: "None", outputs: "{breadth{}, sector_rankings[], regime}", storage: "Computed from stocks_cache", caller: "TrendsDashboardView.tsx" },
  
  // Recommendations
  { id: "r1", category: "Recommendations", method: "GET", path: "/api/v1/recommendations/active", summary: "Live AI recommendations across Intraday, Swing, and Wealth horizons", inputs: "horizon?, min_score?", outputs: "{recommendations[], count, last_scan_time}", storage: "recommendations.db (`recommendations`)", caller: "RecommendationDashboardView.tsx" },
  { id: "r2", category: "Recommendations", method: "GET", path: "/api/v1/recommendations/history", summary: "Historical recommendations archive with win/loss outcomes", inputs: "page, limit, status", outputs: "{history[], total_count, win_rate}", storage: "recommendations.db", caller: "RecommendationDashboardView.tsx" },
  { id: "r3", category: "Recommendations", method: "POST", path: "/api/v1/recommendations/trigger-scan", summary: "Trigger immediate 5,092-stock AI recommendation scan cycle", inputs: "None", outputs: "{status: 'SCAN_STARTED', job_id}", storage: "Background task", caller: "Admin portal & Recs page" },
  { id: "r4", category: "Recommendations", method: "GET", path: "/api/v1/recommendations/{id}/audit", summary: "Detailed 18-parameter scoring breakdown & evidence card for a recommendation", inputs: "id (path)", outputs: "{parameter_scores[], evidence_text, chart_url}", storage: "recommendations.db", caller: "StrategyVisualizerCard.tsx" },
  
  // Dhan Trading
  { id: "t1", category: "Trading", method: "GET", path: "/api/v1/trade/status", summary: "Verify broker connection, account name, cash balance, and margin", inputs: "None", outputs: "{is_connected, client_id, cash_balance, margin_available}", storage: "Dhan API live query", caller: "PortfolioView.tsx" },
  { id: "t2", category: "Trading", method: "POST", path: "/api/v1/trade/order", summary: "Place buy/sell order with dual stop-losses (SL1 + SL2 breakeven)", inputs: "{symbol, quantity, price, stop_loss_1, stop_loss_2?, target_price?, product_type}", outputs: "{order_id, status, exchange_order_id}", storage: "Dhan broker + order_sl_tracker.json", caller: "OrderPlacementModal.tsx" },
  { id: "t3", category: "Trading", method: "GET", path: "/api/v1/trade/positions", summary: "Fetch live open positions with real-time unrealized P&L", inputs: "None", outputs: "{positions[], summary{total_pnl, invested}}", storage: "Dhan API live query", caller: "PortfolioView.tsx" },
  { id: "t4", category: "Trading", method: "POST", path: "/api/v1/trade/squareoff", summary: "Instantly sell/close an open position at current market price", inputs: "{position_id, symbol?, quantity?}", outputs: "{success, message, exit_price}", storage: "Dhan broker", caller: "PortfolioView.tsx" },
  { id: "t5", category: "Trading", method: "GET", path: "/api/v1/trade/holdings", summary: "Demat portfolio holdings with day P&L and total investment", inputs: "None", outputs: "{holdings[], summary{total_invested, current_value}}", storage: "Dhan API live query", caller: "PortfolioView.tsx" },
  { id: "t6", category: "Trading", method: "GET", path: "/api/v1/trade/orders", summary: "List of all orders placed during the current trading session", inputs: "None", outputs: "{orders[], total_count}", storage: "Dhan broker query", caller: "PortfolioView.tsx" },
  { id: "t7", category: "Trading", method: "POST", path: "/api/v1/trade/order/cancel", summary: "Cancel an unexecuted limit or pending stop order", inputs: "{order_id}", outputs: "{success, message}", storage: "Dhan broker", caller: "PortfolioView.tsx" },

  // Screener & Portfolios
  { id: "p1", category: "Screener", method: "POST", path: "/api/v1/portfolios/screen", summary: "Execute custom AST formula screen across all 5,092 stocks", inputs: "{query_expression, sort_by?, limit?}", outputs: "{matched_stocks[], count, execution_time_ms}", storage: "In-memory AST filter", caller: "AdvancedScreenerModal.tsx" },
  { id: "p2", category: "Screener", method: "GET", path: "/api/v1/portfolios/custom", summary: "List user-created watchlists and custom stock portfolios", inputs: "None", outputs: "{portfolios[], total}", storage: "stock_screener.db", caller: "FinancialScreenerView.tsx" },
  { id: "p3", category: "Screener", method: "POST", path: "/api/v1/portfolios/custom", summary: "Create new custom watchlist with selected stock symbols", inputs: "{name, description?, symbols[]}", outputs: "{id, name, symbols_count}", storage: "stock_screener.db", caller: "FinancialScreenerView.tsx" },
  { id: "p4", category: "Screener", method: "DELETE", path: "/api/v1/portfolios/custom/{id}", summary: "Delete a custom watchlist basket", inputs: "id (path)", outputs: "{success, message}", storage: "stock_screener.db", caller: "FinancialScreenerView.tsx" },

  // Bot Studio & Backtesting
  { id: "b1", category: "Bots", method: "GET", path: "/api/v1/bots/templates", summary: "Get 6 starter strategy templates (RSI Oversold, VWAP Reclaim, NR7)", inputs: "None", outputs: "{templates[]}", storage: "Memory constants", caller: "BotStudioView.tsx" },
  { id: "b2", category: "Bots", method: "POST", path: "/api/v1/bots/chat", summary: "Conversational AI strategy generation via xKiro / Claude", inputs: "{message, history[], current_strategy?}", outputs: "{explanation, strategy_json}", storage: "bot_studio.db", caller: "BotStudioView.tsx" },
  { id: "b3", category: "Bots", method: "POST", path: "/api/v1/bots/backtest", summary: "Run historical simulation on 1-min candles with Indian transaction costs", inputs: "{strategy{}, test_symbol, initial_capital}", outputs: "{trades[], equity_curve[], win_rate, net_pnl, fees}", storage: "Computed from intraday_history.db", caller: "StrategyBacktestModal.tsx" },
  { id: "b4", category: "Bots", method: "GET", path: "/api/v1/bots", summary: "List saved and deployed trading bots with running status", inputs: "None", outputs: "{bots[], count}", storage: "bot_studio.db", caller: "BotStudioView.tsx" },

  // News Wire
  { id: "n1", category: "News", method: "GET", path: "/api/v1/news", summary: "Filter news wire by symbol, sector, sentiment, or search term", inputs: "symbol?, sector?, sentiment?, limit?", outputs: "{articles[], total}", storage: "news_feed.db", caller: "NewsFeedView.tsx" },
  { id: "n2", category: "News", method: "GET", path: "/api/v1/news/match", summary: "Get highest-relevance breaking news article for a specific stock", inputs: "symbol (query)", outputs: "{matched_article, relevance_score}", storage: "news_feed.db", caller: "StockDetailDrawer.tsx" },
  { id: "n3", category: "News", method: "POST", path: "/api/v1/news/refresh", summary: "Trigger immediate RSS feed pull from Economic Times & Moneycontrol", inputs: "None", outputs: "{new_articles_count, status}", storage: "news_feed.db", caller: "NewsFeedView.tsx" },

  // Historical Data Vault
  { id: "h1", category: "Data Vault", method: "GET", path: "/api/v1/historical-data/status", summary: "Download pipeline status, progress percentage, and active sync thread", inputs: "None", outputs: "{is_syncing, total_synced_stocks, progress_pct, db_size}", storage: "intraday_history.db", caller: "DataVaultView.tsx" },
  { id: "h2", category: "Data Vault", method: "POST", path: "/api/v1/historical-data/start", summary: "Start or resume 60-day 1-minute historical candle ingestion pipeline", inputs: "None", outputs: "{status: 'STARTED', message}", storage: "Background thread", caller: "DataVaultView.tsx" },
  { id: "h3", category: "Data Vault", method: "POST", path: "/api/v1/historical-data/pause", summary: "Pause ongoing historical candle download gracefully", inputs: "None", outputs: "{status: 'PAUSED'}", storage: "Background thread", caller: "DataVaultView.tsx" },
  { id: "h4", category: "Data Vault", method: "GET", path: "/api/v1/historical-data/candles/{symbol}", summary: "Export raw 1-minute historical candles for a specific equity", inputs: "symbol (path), limit?", outputs: "{candles[]: [time, o, h, l, c, v]}", storage: "intraday_history.db", caller: "ChartRuleStudio.tsx" },

  // Admin & Governance
  { id: "a1", category: "Admin", method: "POST", path: "/api/v1/admin-portal/login", summary: "Authenticate administrator credentials for portal access", inputs: "{email, password}", outputs: "{token, user{email, role}}", storage: "admin_settings table", caller: "Admin portal login" },
  { id: "a2", category: "Admin", method: "GET", path: "/api/v1/admin-portal/universe-inspector", summary: "Inspect solvency status, net worth, and profitability across all 5,092 stocks", inputs: "page, limit, filter_solvency", outputs: "{stocks[], total_solvent, total_insolvent}", storage: "recommendations.db (`daily_solvency_cache`)", caller: "page.tsx (Inspector)" },
  { id: "a3", category: "Admin", method: "GET", path: "/api/v1/admin-portal/copilot/stock/{symbol}", summary: "Inspect 26-parameter quant vector DNA for a specific equity", inputs: "symbol (path)", outputs: "{symbol, parameters[26], confluence_score, verdict}", storage: "quant_copilot.db", caller: "QuantCopilotView.tsx" },
  { id: "a4", category: "Admin", method: "POST", path: "/api/v1/admin-portal/copilot/chat", summary: "Multi-turn quant reasoning chat regarding stock confluence vectors", inputs: "{message, history[], symbol?}", outputs: "{reply, structured_vectors{}}", storage: "quant_copilot.db", caller: "QuantCopilotView.tsx" },
  { id: "a5", category: "Admin", method: "POST", path: "/api/v1/admin-portal/manual-inject", summary: "Force-inject custom recommendation directly into the active feed", inputs: "{symbol, horizon, entry_low, entry_high, sl1, sl2, target, score, notes}", outputs: "{recommendation_id, status: 'INJECTED'}", storage: "recommendations.db", caller: "page.tsx (Injector)" },
  { id: "a6", category: "Admin", method: "POST", path: "/api/v1/admin/dhan/totp/configure", summary: "Configure automated daily 7:30 AM TOTP login credentials", inputs: "{client_id, pin, totp_secret}", outputs: "{success, message, live_feed_connected}", storage: ".dhan_totp_config.json", caller: "AdminSettingsView.tsx" },
  { id: "a7", category: "Admin", method: "POST", path: "/api/v1/admin/dhan/totp/refresh-now", summary: "Force immediate TOTP token generation and WebSocket reconnect", inputs: "None", outputs: "{success, access_token, expires_at}", storage: ".dhan_session.json", caller: "AdminSettingsView.tsx" }
];

export default function PlatformBibleView() {
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [apiMethodFilter, setApiMethodFilter] = useState<"ALL" | "GET" | "POST" | "DELETE">("ALL");
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  // Filter modules based on search and category
  const filteredModules = useMemo(() => {
    return MODULES_DATA.filter((mod) => {
      const matchesCategory =
        selectedCategory === "ALL" ||
        selectedCategory === "API_EXPLORER" ||
        selectedCategory === "ROADMAP" ||
        mod.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inTitle = mod.title.toLowerCase().includes(q);
      const inSummary = mod.summaryPlainEnglish.toLowerCase().includes(q);
      const inTag = mod.tag.toLowerCase().includes(q);
      const inFiles = mod.primaryFiles.some((f) => f.toLowerCase().includes(q));
      const inDetails = mod.deepDetails?.some((d) => d.toLowerCase().includes(q)) ?? false;

      return inTitle || inSummary || inTag || inFiles || inDetails;
    });
  }, [selectedCategory, searchQuery]);

  // Filter API endpoints
  const filteredApis = useMemo(() => {
    return API_ENDPOINTS.filter((api) => {
      const matchesMethod = apiMethodFilter === "ALL" || api.method === apiMethodFilter;
      if (!matchesMethod) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        api.path.toLowerCase().includes(q) ||
        api.summary.toLowerCase().includes(q) ||
        api.category.toLowerCase().includes(q) ||
        (api.inputs && api.inputs.toLowerCase().includes(q)) ||
        (api.outputs && api.outputs.toLowerCase().includes(q))
      );
    });
  }, [apiMethodFilter, searchQuery]);

  const toggleExpand = (id: number) => {
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const next: Record<number, boolean> = {};
    MODULES_DATA.forEach((m) => {
      next[m.id] = true;
    });
    setExpandedModules(next);
  };

  const collapseAll = () => {
    setExpandedModules({});
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(text);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border border-indigo-500/20 shadow-2xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Platform Bible &amp; Architecture Matrix · Single Source of Truth</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Apex Indian Equities Terminal
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Every single module, database schema, data flow, and 72 REST APIs explained in plain English with interactive visual breakdowns.
            </p>
          </div>

          {/* ACTION BUTTONS: Download PDF & Open Raw HTML */}
          <div className="flex items-center gap-3 flex-wrap">
            <a
              href="/PLATFORM_BIBLE.pdf"
              download="Apex_Platform_Bible.pdf"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </a>

            <a
              href="/PLATFORM_BIBLE.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 font-bold text-xs transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span>Open Styled Web View</span>
            </a>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Core Modules</div>
            <div className="text-xl font-black text-white mt-0.5">28 Modules</div>
            <div className="text-emerald-400 text-[10px] font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Fully Mapped
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-[10px] font-bold uppercase">REST Endpoints</div>
            <div className="text-xl font-black text-white mt-0.5">72 APIs</div>
            <div className="text-blue-400 text-[10px] font-medium flex items-center gap-1 mt-0.5">
              <Terminal className="w-3 h-3" /> FastAPI Async
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Equities Tracked</div>
            <div className="text-xl font-black text-white mt-0.5">5,092+</div>
            <div className="text-indigo-400 text-[10px] font-medium flex items-center gap-1 mt-0.5">
              <Radio className="w-3 h-3" /> BSE &amp; NSE Ticks
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Databases</div>
            <div className="text-xl font-black text-white mt-0.5">7 SQLite</div>
            <div className="text-amber-400 text-[10px] font-medium flex items-center gap-1 mt-0.5">
              <Database className="w-3 h-3" /> Zero Cloud Dependency
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Quant Tick Vault</div>
            <div className="text-xl font-black text-white mt-0.5">60 Days</div>
            <div className="text-purple-400 text-[10px] font-medium flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> 1-Min Granularity (~17GB)
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-[10px] font-bold uppercase">AI Confluence</div>
            <div className="text-xl font-black text-white mt-0.5">18 Parameters</div>
            <div className="text-emerald-400 text-[10px] font-medium flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3" /> v1.2 Active Champion
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR: SEARCH, CATEGORY PILLS, EXPAND/COLLAPSE */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* SEARCH INPUT */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search any module, API, parameter, database table, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* EXPAND / COLLAPSE BUTTONS */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Expand All</span>
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Collapse All</span>
          </button>
        </div>
      </div>

      {/* CATEGORY NAV TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {[
          { key: "ALL", label: "All Modules (28)", icon: Boxes },
          { key: "BROKER_DHAN", label: "Dhan API & Broker", icon: Radio },
          { key: "AI_QUANT", label: "AI & Quant Engines", icon: Sparkles },
          { key: "MARKET_UNIVERSE", label: "Universe & Screener", icon: Globe },
          { key: "PORTFOLIO_VAULT", label: "Portfolio & Tick Vault", icon: Database },
          { key: "STUDIO_BOTS", label: "Chart Studio & Bots", icon: LineChart },
          { key: "REGULATORY", label: "BSE LODR Filings", icon: FileText },
          { key: "INFRA_DB", label: "Databases & Core", icon: Server },
          { key: "API_EXPLORER", label: "72 REST API Explorer", icon: Terminal },
          { key: "ROADMAP", label: "Roadmap & Gotchas", icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key as ModuleCategory)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* VIEW MODE 1: MODULES DIRECTORY */}
      {selectedCategory !== "API_EXPLORER" && selectedCategory !== "ROADMAP" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Showing {filteredModules.length} of {MODULES_DATA.length} modules</span>
            {searchQuery && <span>Filter: &quot;{searchQuery}&quot;</span>}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredModules.map((module) => {
              const Icon = module.icon;
              const isExpanded = !!expandedModules[module.id];

              return (
                <div
                  key={module.id}
                  className={`rounded-2xl border transition-all ${
                    isExpanded
                      ? "bg-slate-900/90 border-indigo-500/40 shadow-xl"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* CARD HEADER */}
                  <div
                    onClick={() => toggleExpand(module.id)}
                    className="p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mt-0.5">
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                            SECTION {module.id}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {module.tag}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                          {module.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                          {module.summaryPlainEnglish}
                        </p>
                      </div>
                    </div>

                    <button
                      className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all shrink-0 mt-1"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* QUICK INFO PILLS (VISIBLE ALWAYS) */}
                  <div className="px-5 pb-4 flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-500">Core Files:</span>
                    {module.primaryFiles.map((file, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-slate-300 text-[10px]"
                      >
                        {file}
                      </span>
                    ))}
                  </div>

                  {/* EXPANDED DEEP DIVE SECTION */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 p-5 space-y-5 bg-slate-950/40 rounded-b-2xl animate-in fade-in-50 duration-200">
                      {/* HOW DATA FLOWS */}
                      {module.dataFlow && module.dataFlow.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5" />
                            <span>Architecture &amp; Data Pipeline</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {module.dataFlow.map((step, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 text-slate-300"
                              >
                                <span className="font-mono text-indigo-400 font-bold shrink-0">{idx + 1}.</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* INPUTS, OUTPUTS & STORAGE */}
                      {module.inputOutput && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Input Parameters</div>
                            <div className="text-xs text-slate-200 font-mono leading-relaxed">
                              {module.inputOutput.inputs}
                            </div>
                          </div>

                          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Output Schema / Return</div>
                            <div className="text-xs text-emerald-300 font-mono leading-relaxed">
                              {module.inputOutput.outputs}
                            </div>
                          </div>

                          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Storage &amp; Persistence</div>
                            <div className="text-xs text-amber-300 font-mono leading-relaxed">
                              {module.inputOutput.storage}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* KEY DATA STRUCTURES */}
                      {module.keyDataStructures && module.keyDataStructures.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Key Data Structures &amp; Lookups</span>
                          </h4>
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                            {module.keyDataStructures.map((ds, idx) => (
                              <div key={idx} className="text-xs font-mono text-slate-300">
                                • {ds}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* DEEP DETAILS */}
                      {module.deepDetails && module.deepDetails.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Critical Mechanics &amp; Safeguards</span>
                          </h4>
                          <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-300">
                            {module.deepDetails.map((detail, idx) => (
                              <li key={idx} className="leading-relaxed">
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* CONNECTED FRONTEND */}
                      {module.frontendComponents && (
                        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400 pt-1">
                          <span className="font-semibold text-slate-500">Rendered by Frontend:</span>
                          {module.frontendComponents.map((comp, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-mono text-[11px]"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: 72 REST API EXPLORER */}
      {selectedCategory === "API_EXPLORER" && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <span>REST API Specification Explorer</span>
                <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                  {filteredApis.length} Endpoints
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Every backend endpoint with HTTP methods, route paths, request arguments, outputs, and storage tables.
              </p>
            </div>

            {/* METHOD FILTER PILLS */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(["ALL", "GET", "POST", "DELETE"] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setApiMethodFilter(method)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    apiMethodFilter === method
                      ? method === "GET"
                        ? "bg-emerald-600 text-white"
                        : method === "POST"
                        ? "bg-blue-600 text-white"
                        : method === "DELETE"
                        ? "bg-rose-600 text-white"
                        : "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredApis.map((api) => {
              const isCopied = copiedEndpoint === api.path;

              return (
                <div
                  key={api.id}
                  className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`text-[10px] font-black font-mono px-2 py-0.5 rounded ${
                          api.method === "GET"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : api.method === "POST"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                            : api.method === "DELETE"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {api.method}
                      </span>
                      <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-tight">
                        {api.path}
                      </span>
                      <button
                        onClick={() => copyToClipboard(api.path)}
                        className="text-slate-500 hover:text-slate-300 p-1"
                        title="Copy route"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {api.category}
                      </span>
                      {api.caller && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-500/20">
                          {api.caller}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">{api.summary}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] pt-1">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 font-bold block mb-0.5">Inputs:</span>
                      <span className="font-mono text-slate-300">{api.inputs || "None"}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 font-bold block mb-0.5">Outputs:</span>
                      <span className="font-mono text-emerald-300">{api.outputs || "Standard JSON response"}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 font-bold block mb-0.5">Storage:</span>
                      <span className="font-mono text-amber-300">{api.storage || "In-memory cache"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: STRATEGIC ROADMAP, GOTCHAS & ARCHITECTURAL DECISIONS */}
      {selectedCategory === "ROADMAP" && (
        <div className="space-y-6">
          {/* KNOWN GOTCHAS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Critical Production Gotchas &amp; Workarounds</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">DhanHQ WebSocket Method Crash</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    RESOLVED
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  DhanHQ&apos;s default `_is_ws_closed()` method crashes on certain Python versions. We monkey-patch it at startup with `safe_is_ws_closed()` to prevent disconnections.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">17 GB Tick Database Storage</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    MONITORED
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Full 60-day 1-minute historical candle downloads for 5,092 stocks expand `intraday_history.db` to ~17 GB. Partitioned indexing keeps read latency under 15ms.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Daily 7:30 AM Auto-Authentication</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    AUTOMATED
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dhan access tokens expire every 24 hours. `dhan_totp_auth.py` automatically generates TOTP codes and fetches fresh tokens every morning without human intervention.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Safe AST Screener (No Eval)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    HARDENED
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  User screening formulas are parsed using Python&apos;s AST grammar trees instead of `eval()`, preventing remote code execution or injection risks.
                </p>
              </div>
            </div>
          </div>

          {/* DESIGN DECISIONS ARCHIVE */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-indigo-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Architectural Design Decisions</span>
            </h3>

            <div className="space-y-3">
              {[
                {
                  title: "Why 7 SQLite Databases Instead of PostgreSQL?",
                  desc: "Zero infrastructure setup, embedded zero-network latency, and independent file locks. Separating the massive 17 GB historical candle database from fast recommendation tables ensures zero write contention."
                },
                {
                  title: "Why In-Memory Stock Cache for 5,092 Equities?",
                  desc: "Holding 5,092 equities × 30 metrics consumes ~80 MB of RAM. This eliminates disk I/O entirely for universe filtering, sorting, and websocket tick updates, enabling instant sub-10ms response times."
                },
                {
                  title: "Why Multi-Horizon 18-Vector Confluence?",
                  desc: "Single-indicator signals generate excessive false breakouts in volatile markets. Requiring 10 of 18 gates (Solvency, RoCE, Base Structure, Delivery %, VIX) ensures only institutional-grade setups trigger alerts."
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
