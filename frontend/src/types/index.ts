export interface StockQuote {
  symbol: string;
  name: string;
  exchange?: "NSE" | "BSE" | string;
  exchanges: string[];
  is_dual_listed: boolean;
  sector: string;
  mcap_category: "Large Cap" | "Mid Cap" | "Small Cap";
  ltp: number;
  prev_close: number;
  change: number;
  change_pct: number;
  day_high: number;
  day_low: number;
  high_52w: number;
  low_52w: number;
  volume: number;
  vwap: number;
  sparkline: number[];
  nse_ltp?: number | null;
  bse_ltp?: number | null;
  price_diff?: number;
  price_diff_pct?: number;
  buy_exchange?: "NSE" | "BSE" | null;
  sell_exchange?: "NSE" | "BSE" | null;
  series?: string;
  nse_series?: string;
  bse_series?: string;
  is_etf?: boolean;
  instrument_type?: string;
  updated_at: number;
}

export interface MarketIndex {
  symbol: string;
  exchange: string;
  value: number;
  change: number;
  change_pct: number;
}

export interface TickerMover {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  change_pct: number;
  volume: number;
}

export interface MarketTickerResponse {
  indices: MarketIndex[];
  top_gainers?: TickerMover[];
  top_losers?: TickerMover[];
  market_status?: string;
  is_market_open?: boolean;
  status_label?: string;
  current_ist?: string;
  last_trading_date?: string;
  last_trading_time?: string;
  last_trading_datetime_str?: string;
  timestamp?: number;
}

export interface StockUniverseResponse {
  stocks: StockQuote[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  dhan_connected: boolean;
  is_market_open?: boolean;
  market_status?: string;
  status_label?: string;
  current_ist?: string;
  last_trading_date?: string;
  last_trading_time?: string;
  last_trading_datetime_str?: string;
}

export interface TrendStockChip {
  symbol: string;
  name?: string;
  ltp?: number;
  change_pct?: number;
  volume?: number;
  rsi?: number;
  dist_pct?: number;
}

export interface TrendMetricCardData {
  id: string;
  title: string;
  badge: string;
  signal?: "green" | "orange" | "red";
  badge_type?: "bullish" | "bearish" | "neutral";
  hero_val: string;
  sub_stat: string;
  progress_ratio?: number;
  insight?: string;
  chips?: TrendStockChip[];
}

export interface TrendsApiResponse {
  tab: string;
  exchange: string;
  total_tracked: number;
  interval_label?: string;
  market_summary_30m?: string;
  timestamp: number;
  cards: TrendMetricCardData[];
}

export interface MarketPulse {
  id: string;
  date_str: string;
  slot_time: string;
  timestamp: number;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  badge_label: string;
  headline: string;
  story: string;
  leading_sector: string;
  lagging_sector: string;
  advances: number;
  declines: number;
  unchanged: number;
  total_tracked: number;
  top_gainers?: TrendStockChip[];
  top_losers?: TrendStockChip[];
}

export interface TrendsPulsesResponse {
  status: string;
  date_str: string;
  today_str?: string;
  is_today?: boolean;
  available_dates?: string[];
  is_market_open?: boolean;
  market_status?: string;
  count: number;
  latest: MarketPulse | null;
  pulses: MarketPulse[];
}

export interface DynamicCondition {
  field: string;
  operator: string;
  value: number | string;
  timeframe?: string;
  extra_params?: Record<string, any>;
}

export interface DynamicRule {
  id: string;
  name: string;
  symbol: string;
  exchange: string;
  description: string;
  logic_operator: "AND" | "OR";
  conditions: DynamicCondition[];
  action_type: "ALERT";
  is_active: boolean;
  created_at: number;
  last_triggered_at?: number | null;
  trigger_count: number;
}

export interface AutonomousAgent {
  id: string;
  name: string;
  description: string;
  symbol_or_scope: string;
  trigger_rule_id?: string | null;
  ai_model: string;
  strategy_prompt: string;
  task_actions: string[];
  risk_reward_ratio: number;
  capital_allocation: number;
  status: "RUNNING" | "PAUSED" | "TRIGGERED";
  created_at: number;
  last_run_time?: number | null;
  total_runs: number;
  last_action_summary: string;
}

export interface AgentActivityLog {
  id: string;
  timestamp: number;
  time_str: string;
  agent_id: string;
  agent_name: string;
  action_type: string;
  title: string;
  details: string;
  extra_data?: {
    symbol?: string;
    signal?: string;
    conviction?: number;
    ai_output?: {
      signal?: string;
      conviction_pct?: number;
      summary?: string;
      suggested_entry?: number;
      stop_loss?: number;
      target_price?: number;
      risk_reward_ratio?: string;
      key_catalysts?: string[];
      source?: string;
    };
    order_placed?: string | null;
  };
}

export interface PaperPosition {
  id: string;
  symbol: string;
  exchange: string;
  side: "BUY" | "SELL";
  quantity: number;
  entry_price: number;
  current_price: number;
  entry_time: string;
  exit_time?: string | null;
  exit_price?: number | null;
  order_value: number;
  entry_costs: {
    total_cost_rs: number;
    total_cost_pct: number;
    itemized: Record<string, number>;
  };
  exit_costs?: {
    total_cost_rs: number;
    total_cost_pct: number;
    itemized: Record<string, number>;
  } | null;
  total_costs_rs: number;
  stop_loss: number;
  take_profit: number;
  gross_pnl: number;
  net_pnl: number;
  net_pnl_pct: number;
  status: "OPEN" | "CLOSED";
  agent_id?: string | null;
  agent_name: string;
  close_reason?: string;
}

export interface PortfolioSummary {
  starting_capital: number;
  available_capital: number;
  open_positions_count: number;
  closed_positions_count: number;
  unrealized_pnl: number;
  realized_pnl: number;
  total_net_pnl: number;
  total_statutory_taxes_paid: number;
}

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartDataResponse {
  symbol: string;
  exchange: string;
  timeframe: string;
  ltp: number;
  change?: number;
  change_pct?: number;
  volume?: number;
  day_high?: number;
  day_low?: number;
  candles: ChartCandle[];
  technicals: {
    rsi: number;
    ema_20: number;
    ema_50: number;
    ema_200: number;
    vwap: number;
    bb_upper: number;
    bb_lower: number;
    bb_middle: number;
    supertrend: "BULLISH" | "BEARISH";
  };
}

export interface XKiroStatus {
  is_connected: boolean;
  api_key_masked: string;
  model: string;
  base_url: string;
  last_test_time: number;
  last_error: string;
}

export interface BusinessNewsItem {
  id: string;
  title: string;
  summary: string;
  publisher: string;
  link: string;
  published_at: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  website?: string;
  summary: string;
  market_cap?: number;
  pe_ratio?: number;
  dividend_yield?: number;
  high_52w?: number;
  low_52w?: number;
  vwap?: number;
  employees?: number;
  headquarters?: string;
}

export interface FinancialQuarter {
  quarter: string;
  revenue: number;
  net_profit: number;
  margin_pct: number;
}

export interface ShareholdingPattern {
  promoter: number;
  fii: number;
  dii: number;
  public: number;
  pledged?: number;
  promoter_pledged_pct?: number;
  promoter_change_1y?: number;
  fii_change_1q?: number;
  dii_change_1q?: number;
  number_of_shareholders?: number;
  audit_quality?: string;
  credit_rating?: string;
  board_independence_pct?: number;
  rpt_to_revenue_pct?: number;
}

export interface ValuationRatios {
  pe_ratio: number;
  pb_ratio: number;
  ev_ebitda: number;
  roe_pct: number;
  roce_pct: number;
  debt_to_equity: number;
  dividend_yield: number;
  book_value: number;
  face_value?: number;
  market_cap_cr?: number;
  enterprise_value_cr?: number;
  eps_ttm?: number;
  sales_ttm_cr?: number;
  pat_ttm_cr?: number;
  opm_ttm_pct?: number;
  piotroski_score?: number;
  piotroski_f_score?: number;
  altman_z?: number;
  altman_z_score?: number;
  peg_ratio?: number;
  free_cash_flow_cr?: number;
  promoter_holding_pct?: number;
  pledged_pct?: number;
  working_capital_days?: number;
  cash_conversion_cycle?: number;
}

export interface PeerCompany {
  symbol: string;
  name: string;
  ltp: number;
  change_pct: number;
  pe_ratio: number;
  market_cap: number;
  is_dual_listed: boolean;
}

export interface TechnicalMeter {
  rating: "BULLISH" | "NEUTRAL" | "BEARISH";
  score: number;
  moving_averages: { bullish: number; neutral: number; bearish: number };
  oscillators: { bullish: number; neutral: number; bearish: number };
  summary: string;
}

export interface PivotLevels {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface DeliveryStats {
  delivery_pct: number;
  delivery_volume: number;
  trading_status: string;
}

export interface CorporateEvents {
  last_dividend: string;
  dividend_date: string;
  board_meeting: string;
  agm_status: string;
}

export interface SwotInsights {
  strengths: string[];
  watchouts: string[];
}

export interface CompanyDetailsResponse {
  symbol: string;
  profile: CompanyProfile;
  ratios?: ValuationRatios;
  financials?: FinancialQuarter[];
  shareholding?: ShareholdingPattern;
  peers?: PeerCompany[];
  technical_meter?: TechnicalMeter;
  pivot_levels?: PivotLevels;
  delivery_stats?: DeliveryStats;
  corporate_events?: CorporateEvents;
  swot_insights?: SwotInsights;
  news: BusinessNewsItem[];
  exchanges: string[];
  is_dual_listed: boolean;
  ltp: number;
  nse_ltp?: number | null;
  bse_ltp?: number | null;
  cagr_growth?: CagrGrowthSummary;
  consolidated?: CompanyFinancialStatements;
  standalone?: CompanyFinancialStatements;
  statements?: CompanyFinancialStatements;
  price_diff?: number;
  price_diff_pct?: number;
  buy_exchange?: "NSE" | "BSE" | null;
  sell_exchange?: "NSE" | "BSE" | null;
  upper_circuit?: number;
  lower_circuit?: number;
  distance_to_upper_circuit_pct?: number;
  distance_to_lower_circuit_pct?: number;
  order_imbalance_ratio?: number;
  total_buy_qty?: number;
  total_sell_qty?: number;
  volume_surge_20d?: number;
  avg_volume_20d?: number;
  ema_20?: number;
  ema_50?: number;
  ema_200?: number;
  vwap?: number;
  spread_pct?: number;
  market_microstructure?: {
    upper_circuit: number;
    lower_circuit: number;
    distance_to_upper_circuit_pct: number;
    distance_to_lower_circuit_pct: number;
    order_imbalance_ratio: number;
    total_buy_qty: number;
    total_sell_qty: number;
    volume_surge_20d: number;
    avg_volume_20d: number;
    ema_20: number;
    ema_50: number;
    ema_200: number;
    vwap: number;
    spread_pct: number;
    price_diff: number;
    nse_ltp: number;
    bse_ltp: number;
  };
  shareholding_history?: Array<{
    quarter: string;
    promoter: number;
    fii: number;
    dii: number;
    public: number;
    pledged?: number;
  }>;
}

export interface CagrGrowthQuadrant {
  "10y"?: number;
  "5y"?: number;
  "3y"?: number;
  "1y"?: number;
  ttm?: number;
  last_year?: number;
  [key: string]: number | undefined;
}

export interface CagrGrowthSummary {
  sales_growth: CagrGrowthQuadrant;
  profit_growth: CagrGrowthQuadrant;
  stock_price_cagr: CagrGrowthQuadrant;
  return_on_equity: CagrGrowthQuadrant;
}

export type DenominationUnit = "cr" | "lakhs" | "millions" | "billions";
export type StatementViewMode = "consolidated" | "standalone";

export interface StatementQuarterItem {
  period: string;
  sales: number;
  expenses: number;
  operating_profit: number;
  opm_pct: number;
  other_income: number;
  interest: number;
  depreciation: number;
  pbt: number;
  tax_pct: number;
  net_profit: number;
  eps: number;
  yoy_sales_growth?: number | null;
  yoy_profit_growth?: number | null;
  qoq_sales_growth?: number | null;
  qoq_profit_growth?: number | null;
}

export interface StatementYearlyPnLItem extends StatementQuarterItem {
  dividend_payout_pct: number;
}

export interface StatementBalanceSheetItem {
  period: string;
  equity_capital: number;
  reserves: number;
  borrowings: number;
  long_term_borrowings?: number;
  short_term_borrowings?: number;
  other_liabilities: number;
  current_liabilities?: number;
  total_liabilities: number;
  fixed_assets: number;
  cwip: number;
  investments: number;
  current_assets?: number;
  cash_and_bank?: number;
  net_working_capital?: number;
  other_assets: number;
  total_assets: number;
}

export interface StatementCashFlowItem {
  period: string;
  operating_cash_flow: number;
  cfo_before_wc?: number;
  working_capital_changes?: number;
  direct_taxes_paid?: number;
  investing_cash_flow: number;
  financing_cash_flow: number;
  net_cash_flow: number;
  capex: number;
  free_cash_flow: number;
}

export interface StatementRatioItem {
  period: string;
  roce_pct: number;
  roe_pct: number;
  debt_to_equity: number;
  interest_coverage: number;
  debtor_days: number;
  inventory_days: number;
  days_payable: number;
  cash_conversion_cycle: number;
  working_capital_days: number;
  cfo_to_pat: number;
}

export interface StatementChartPoint {
  period: string;
  revenue: number;
  net_profit: number;
  margin_pct: number;
}

export interface CompanyFinancialStatements {
  yearly?: {
    periods: string[];
    pnl: StatementYearlyPnLItem[];
    balance_sheet: StatementBalanceSheetItem[];
    cash_flow: StatementCashFlowItem[];
    ratios: StatementRatioItem[];
    chart: StatementChartPoint[];
  };
  half_yearly?: {
    periods: string[];
    pnl: StatementQuarterItem[];
    chart: StatementChartPoint[];
  };
  quarterly?: {
    periods: string[];
    pnl: StatementQuarterItem[];
    chart: StatementChartPoint[];
  };
}

export interface AuthUser {
  email: string;
  token: string;
  logged_in_at: number;
  role?: string;
  name?: string;
}

export interface TriggeredAlert {
  id: string;
  rule_id: string;
  rule_name: string;
  symbol: string;
  exchange: string;
  triggered_price: number;
  condition_summary: string;
  action_type: "ALERT";
  status: "FIRED" | "EXECUTED" | "ACKNOWLEDGED";
  triggered_at: string;
}

export interface ScreenerMetric {
  key: string;
  name: string;
  label?: string;
  category: string;
  unit: string;
  supports_timeframe: boolean;
  timeframes: string[];
  default_timeframe?: string;
  description?: string;
  min_history?: number;
}

export interface ScreenerCondition {
  id: string;
  metric: string;
  timeframe?: string;
  operator: ">" | "<" | ">=" | "<=" | "==" | "!=";
  value: string;
  connector?: "AND" | "OR";
  compare_type?: "number" | "metric";
}

export interface ScreenerQueryResponse {
  success: boolean;
  query: string;
  cleaned_query?: string;
  total: number;
  page: number;
  page_size: number;
  execution_ms: number;
  metrics_used: string[];
  stocks: any[];
  error?: string;
}

export interface CustomPortfolio {
  id: string;
  name: string;
  description: string;
  formula: string;
  tags: string[];
  created_at: number;
  updated_at: number;
  stock_count?: number;
  avg_pe?: number;
  avg_roce?: number;
  day_change_pct?: number;
  top_symbols?: string[];
}

// --- Dynamic Trading Bot Studio Types ---
export interface BotRuleCondition {
  id?: string;
  field: string;
  operator: string;
  value: number | string;
  timeframe?: string;
  multiplier?: number;
  description?: string;
}

export interface BotUniverseConfig {
  base: "NIFTY_50" | "NIFTY_500" | "ALL_EQUITIES" | "CUSTOM" | string;
  custom_symbols?: string[];
  min_volume?: number;
  min_price?: number;
  max_price?: number;
}

export interface BotEntryRules {
  logic: "AND" | "OR";
  conditions: BotRuleCondition[];
  time_filter_start?: string;
  time_filter_end?: string;
}

export interface BotExitRules {
  target_pct?: number;
  stop_loss_pct?: number;
  trailing_stop_pct?: number;
  max_holding_bars?: number;
  eod_square_off?: boolean;
}

export interface BotPositionSizing {
  method: "FIXED_QTY" | "PERCENT_CAPITAL" | "RISK_BASED" | string;
  fixed_quantity?: number;
  capital_allocation?: number;
  risk_per_trade_pct?: number;
}

export interface BotRiskLimits {
  max_daily_loss?: number;
  max_open_positions?: number;
  max_trades_per_day?: number;
  require_stop_loss?: boolean;
}

export interface BotStrategyDefinition {
  id?: string;
  name: string;
  description?: string;
  version?: number;
  status?: "DRAFT" | "BACKTESTED" | "READY_FOR_PAPER" | "ACTIVE_PAPER" | "ACTIVE_LIVE" | string;
  created_by?: string;
  created_at?: number;
  updated_at?: number;
  universe: BotUniverseConfig;
  entry: BotEntryRules;
  exit: BotExitRules;
  position_sizing: BotPositionSizing;
  risk_limits: BotRiskLimits;
  risk_score?: "LOW" | "MODERATE" | "HIGH" | string;
  risk_notes?: string[];
}

export interface BacktestTrade {
  symbol: string;
  entry_time: number;
  exit_time: number;
  entry_date_str: string;
  exit_date_str: string;
  entry_price: number;
  exit_price: number;
  quantity: number;
  turnover: number;
  gross_pnl: number;
  statutory_costs: number;
  net_pnl: number;
  return_pct: number;
  exit_reason: string;
  holding_bars: number;
}

export interface BacktestResult {
  strategy_id: string;
  strategy_name: string;
  backtest_run_at: string;
  initial_capital: number;
  ending_capital: number;
  total_net_pnl: number;
  total_gross_pnl: number;
  total_statutory_costs: number;
  return_pct: number;
  win_rate_pct: number;
  profit_factor: number;
  max_drawdown_pct: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  symbols_tested: string[];
  trade_log: BacktestTrade[];
  equity_curve?: { time: number; equity: number; drawdown_pct: number }[];
}

export interface BotRecord {
  id: string;
  name: string;
  description: string;
  status: string;
  risk_score: string;
  strategy: BotStrategyDefinition;
  backtest?: BacktestResult | null;
  created_at: number;
  updated_at: number;
}

export interface BotTemplate {
  id: string;
  name: string;
  description: string;
  badge: string;
  strategy: BotStrategyDefinition;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  publisher: string;
  published_at: string;
  published_timestamp: number;
  url: string;
  category: "ALL" | "ECONOMY" | "SECTOR" | "CORPORATE_FILING" | "STOCKS" | string;
  sector?: string;
  sectors?: string[];
  symbol?: string;
  stock_name?: string;
  sensitivity: "HIGH" | "MODERATE" | "INFORMATIONAL" | string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" | string;
  key_takeaways: string[];
  source_feed: string;
}

export interface NewsMetrics {
  last_hour_streak: number;
  high_sensitivity_count: number;
  top_sector: string;
  top_sector_count: number;
  reg30_filings_count: number;
}

export interface NewsStockOption {
  symbol: string;
  name: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
  count: number;
  total: number;
  all_sectors?: string[];
  all_stocks?: NewsStockOption[];
  metrics?: NewsMetrics;
  updated_at: string;
}


