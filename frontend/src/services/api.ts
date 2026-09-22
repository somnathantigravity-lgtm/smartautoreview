const API_BASE = typeof window !== "undefined"
  ? "/api/v1"
  : (process.env.INTERNAL_API_URL || "http://127.0.0.1:8000/api/v1");

export function getWebSocketUrl(path: string = "/ws/terminal"): string {
  if (typeof window === "undefined") return `ws://127.0.0.1:8000${path}`;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return `${protocol}//${host}:8000${path}`;
  }
  return `${protocol}//${window.location.host}${path}`;
}

// --- BSE & NSE Universe ---
export async function fetchStockUniverse(params?: {
  search?: string;
  sector?: string;
  exchange?: string;
  instrument?: string;
  mcap?: string;
  sort_by?: string;
  symbols?: string;
  sort_dir?: string;
  page?: number;
  page_size?: number;
  price_diff_only?: boolean;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.symbols) query.append("symbols", params.symbols);
  if (params?.sector) query.append("sector", params.sector);
  if (params?.exchange) query.append("exchange", params.exchange);
  if (params?.instrument && params.instrument !== "ALL") query.append("instrument", params.instrument);
  if (params?.mcap) query.append("mcap", params.mcap);
  if (params?.sort_by) query.append("sort_by", params.sort_by);
  if (params?.sort_dir) query.append("sort_dir", params.sort_dir);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.page_size) query.append("page_size", params.page_size.toString());
  if (params?.price_diff_only) query.append("price_diff_only", "true");

  const res = await fetch(`${API_BASE}/universe/stocks?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch stock universe");
  return res.json();
}

export async function fetchStockChart(symbol: string, timeframe: string = "15m", bars: number = 50) {
  const res = await fetch(`${API_BASE}/universe/stocks/${symbol}/chart?timeframe=${timeframe}&bars=${bars}`);
  if (!res.ok) throw new Error(`Failed to fetch chart for ${symbol}`);
  return res.json();
}

export async function fetchMarketIndices() {
  const res = await fetch(`${API_BASE}/universe/indices`);
  if (!res.ok) throw new Error("Failed to fetch indices");
  return res.json();
}

export async function fetchSectors(): Promise<{ sectors: string[] }> {
  try {
    const res = await fetch(`${API_BASE}/universe/sectors`);
    if (!res.ok) return { sectors: [] };
    return res.json();
  } catch {
    return { sectors: [] };
  }
}

export async function fetchCompanyDetails(symbol: string, exchange: string = "NSE") {
  const res = await fetch(`${API_BASE}/universe/stocks/${symbol}/details?exchange=${exchange}`);
  if (!res.ok) throw new Error("Failed to fetch company details");
  return res.json();
}

// --- Live Real-Time Recommendations (Audited 19-Parameter Core Scanner) ---
export async function fetchLiveRecommendations(mode: string = "CURRENT", forceScan: boolean = false, sessionDate?: string) {
  const query = new URLSearchParams();
  query.append("mode", mode);
  if (forceScan) query.append("force_scan", "true");
  if (sessionDate) query.append("session_date", sessionDate);

  const res = await fetch(`${API_BASE}/recommendations/live?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch live recommendations");
  return res.json();
}

// --- Dynamic Rules & Triggers ---
export async function fetchRules() {
  const res = await fetch(`${API_BASE}/rules`);
  if (!res.ok) throw new Error("Failed to fetch rules");
  return res.json();
}

export async function createRule(ruleData: any) {
  const res = await fetch(`${API_BASE}/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ruleData)
  });
  if (!res.ok) throw new Error("Failed to create rule");
  return res.json();
}

export async function deleteRule(ruleId: string) {
  const res = await fetch(`${API_BASE}/rules/${ruleId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete rule");
  return res.json();
}

export async function toggleRule(ruleId: string, isActive: boolean) {
  const res = await fetch(`${API_BASE}/rules/${ruleId}/toggle?is_active=${isActive}`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to toggle rule");
  return res.json();
}

export async function testRule(testData: any) {
  const res = await fetch(`${API_BASE}/rules/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testData)
  });
  if (!res.ok) throw new Error("Failed to test rule");
  return res.json();
}

// --- Autonomous Agents ---
export async function fetchAgents() {
  const res = await fetch(`${API_BASE}/agents`);
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

export async function createAgent(agentData: any) {
  const res = await fetch(`${API_BASE}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(agentData)
  });
  if (!res.ok) throw new Error("Failed to create agent");
  return res.json();
}

export async function toggleAgent(agentId: string, status: "RUNNING" | "PAUSED") {
  const res = await fetch(`${API_BASE}/agents/${agentId}/toggle`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error("Failed to toggle agent");
  return res.json();
}

export async function runAgentManual(agentId: string, symbol?: string) {
  const url = symbol ? `${API_BASE}/agents/${agentId}/run?symbol=${symbol}` : `${API_BASE}/agents/${agentId}/run`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Agent run failed" }));
    throw new Error(err.detail || "Agent execution failed");
  }
  return res.json();
}

export async function deleteAgent(agentId: string) {
  const res = await fetch(`${API_BASE}/agents/${agentId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete agent");
  return res.json();
}

export async function fetchAgentLogs(limit: number = 50) {
  const res = await fetch(`${API_BASE}/agents/logs?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch agent activity logs");
  return res.json();
}

// --- Paper Trading Portfolio ---
export async function fetchPaperPositions(status?: string) {
  const url = status ? `${API_BASE}/paper-trading/positions?status=${status}` : `${API_BASE}/paper-trading/positions`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch paper positions");
  return res.json();
}

export async function executePaperOrder(orderData: {
  symbol: string;
  side: string;
  quantity: number;
  price?: number;
  exchange?: string;
  stop_loss?: number;
  take_profit?: number;
  agent_id?: string;
  agent_name?: string;
}) {
  const res = await fetch(`${API_BASE}/paper-trading/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData)
  });
  if (!res.ok) throw new Error("Failed to execute paper order");
  return res.json();
}

export async function closePaperPosition(positionId: string, exitPrice?: number) {
  const res = await fetch(`${API_BASE}/paper-trading/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ position_id: positionId, exit_price: exitPrice })
  });
  if (!res.ok) throw new Error("Failed to close position");
  return res.json();
}

// --- xKiro.com AI Gateway Settings ---
export async function fetchXKiroStatus() {
  const res = await fetch(`${API_BASE}/admin/xkiro/status`);
  if (!res.ok) throw new Error("Failed to fetch xKiro status");
  return res.json();
}

export async function connectXKiro(apiKey: string, model: string = "anthropic/claude-sonnet-5", customBaseUrl?: string) {
  const res = await fetch(`${API_BASE}/admin/xkiro/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, model, custom_base_url: customBaseUrl })
  });
  if (!res.ok) throw new Error("Failed to connect to xKiro");
  return res.json();
}

export async function disconnectXKiro() {
  const res = await fetch(`${API_BASE}/admin/xkiro/disconnect`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to disconnect xKiro");
  return res.json();
}

export async function fetchXKiroModels() {
  const res = await fetch(`${API_BASE}/admin/xkiro/models`);
  if (!res.ok) throw new Error("Failed to fetch xKiro models");
  return res.json();
}

export async function testXKiro(apiKey: string, model: string = "anthropic/claude-sonnet-5", customBaseUrl?: string) {
  const res = await fetch(`${API_BASE}/admin/xkiro/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, model, custom_base_url: customBaseUrl })
  });
  if (!res.ok) throw new Error("Failed to test xKiro connection");
  return res.json();
}

// --- Direct Market Feed Status & Connect ---
export async function fetchDhanStatus() {
  const res = await fetch(`${API_BASE}/admin/dhan/status`);
  if (!res.ok) throw new Error("Failed to fetch market feed status");
  return res.json();
}

export async function connectDhan(accessToken: string, clientId?: string) {
  const res = await fetch(`${API_BASE}/admin/dhan/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: accessToken, client_id: clientId || "" })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || data.error || "Failed to connect to market feed");
  }
  return res.json();
}

export async function disconnectDhan() {
  const res = await fetch(`${API_BASE}/admin/dhan/disconnect`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to disconnect market feed");
  return res.json();
}

// --- DhanHQ Automated Daily TOTP Login ---
export async function fetchDhanTOTPStatus() {
  const res = await fetch(`${API_BASE}/admin/dhan/totp/status`);
  if (!res.ok) throw new Error("Failed to fetch TOTP auto-login status");
  return res.json();
}

export async function configureDhanTOTP(data: { client_id: string; pin: string; totp_secret: string }) {
  const res = await fetch(`${API_BASE}/admin/dhan/totp/configure`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.detail || "Failed to configure TOTP login");
  }
  return json;
}

export async function refreshDhanTOTPNow() {
  const res = await fetch(`${API_BASE}/admin/dhan/totp/refresh-now`, { method: "POST" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.detail || "Failed to renew token with TOTP");
  }
  return json;
}


export async function fetchCostRules() {
  const res = await fetch(`${API_BASE}/admin/cost-rules`);
  if (!res.ok) throw new Error("Failed to fetch cost rules");
  return res.json();
}

// --- Authentication (3-Step Email OTP & Password) ---
export async function requestOtp(email: string) {
  const res = await fetch(`${API_BASE}/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to request OTP");
  return data;
}

export async function verifyOtpAndPassword(payload: {
  email: string;
  otp: string;
  password: string;
  confirm_password: string;
}) {
  const res = await fetch(`${API_BASE}/auth/verify-otp-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to verify credentials");
  return data;
}

// --- Triggered Alerts Log ---
export async function fetchTriggeredAlerts() {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error("Failed to fetch alerts log");
  return res.json();
}

export async function clearTriggeredAlerts() {
  const res = await fetch(`${API_BASE}/alerts/clear`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to clear alerts");
  return res.json();
}

// --- Screener & Custom Portfolios ---
export async function fetchApexStrategies() {
  const res = await fetch(`${API_BASE}/screener/apex-strategies`);
  if (!res.ok) throw new Error("Failed to fetch Apex screener strategies");
  return res.json();
}

export async function fetchScreenerMetrics() {
  const res = await fetch(`${API_BASE}/screener/metrics`);
  if (!res.ok) throw new Error("Failed to fetch screener metrics");
  return res.json();
}


export async function fetchCustomFormulas() {
  const res = await fetch(`${API_BASE}/screener/custom-formulas`);
  if (!res.ok) throw new Error("Failed to fetch custom formulas");
  return res.json();
}

export async function saveCustomFormula(data: {
  name: string;
  expression: string;
  description?: string;
  unit?: string;
}) {
  const res = await fetch(`${API_BASE}/screener/custom-formulas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save custom formula");
  }
  return res.json();
}

export async function deleteCustomFormula(formulaId: string) {
  const res = await fetch(`${API_BASE}/screener/custom-formulas/${formulaId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete custom formula");
  return res.json();
}


export async function evaluateScreenerQuery(
  query: string,
  page: number = 1,
  pageSize: number = 25,
  sortBy?: string,
  sortDir: string = "desc"
) {
  const res = await fetch(`${API_BASE}/screener/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      page,
      page_size: pageSize,
      sort_by: sortBy,
      sort_dir: sortDir,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const detail = errData.detail;
    const message = typeof detail === "string" 
      ? detail 
      : (detail?.message || "Failed to evaluate screener query");
    const err: any = new Error(message);
    err.detail = detail;
    err.diagnostic = typeof detail === "object" ? detail.diagnostic : undefined;
    throw err;
  }
  return res.json();
}

export async function fetchCustomPortfolios() {
  const res = await fetch(`${API_BASE}/portfolios`);
  if (!res.ok) throw new Error("Failed to fetch custom portfolios");
  return res.json();
}

export async function createCustomPortfolio(data: {
  name: string;
  formula: string;
  description?: string;
  tags?: string[];
}) {
  const res = await fetch(`${API_BASE}/portfolios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create portfolio");
  }
  return res.json();
}

export async function fetchPortfolioDetails(
  portfolioId: string,
  page: number = 1,
  pageSize: number = 25,
  sortBy?: string,
  sortDir: string = "desc"
) {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    sort_dir: sortDir,
  });
  if (sortBy) params.set("sort_by", sortBy);

  const res = await fetch(`${API_BASE}/portfolios/${portfolioId}?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch portfolio details");
  }
  return res.json();
}

export async function updateCustomPortfolio(
  portfolioId: string,
  updates: { name?: string; formula?: string; description?: string; tags?: string[] }
) {
  const res = await fetch(`${API_BASE}/portfolios/${portfolioId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update portfolio");
  }
  return res.json();
}

export async function deleteCustomPortfolio(portfolioId: string) {
  const res = await fetch(`${API_BASE}/portfolios/${portfolioId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete portfolio");
  return res.json();
}

// --- BSE/NSE Corporate Filings & LODR Auto-Update ---
export async function syncStockFilings(symbol: string) {
  const res = await fetch(`${API_BASE}/corporate-filings/sync/${symbol}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to sync filings for ${symbol}`);
  return res.json();
}

export async function fetchCorporateFilingsStatus() {
  const res = await fetch(`${API_BASE}/corporate-filings/status`);
  if (!res.ok) throw new Error("Failed to fetch corporate filings status");
  return res.json();
}

// --- Live Market Trends ---
export async function fetchTrends(tab: string = "breadth", exchange: string = "ALL") {
  const res = await fetch(`${API_BASE}/universe/trends?tab=${encodeURIComponent(tab)}&exchange=${encodeURIComponent(exchange)}`);
  if (!res.ok) throw new Error("Failed to fetch market trends");
  return res.json();
}

export async function fetchTrendsPulses(dateStr?: string) {
  const url = dateStr
    ? `${API_BASE}/universe/trends/pulses?date_str=${encodeURIComponent(dateStr)}`
    : `${API_BASE}/universe/trends/pulses`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch market pulses");
  return res.json();
}

// --- Dynamic Bot Studio & AI Co-Pilot ---
export async function fetchBotTemplates() {
  const res = await fetch(`${API_BASE}/bots/templates`);
  if (!res.ok) throw new Error("Failed to load bot templates");
  return res.json();
}

export async function chatWithBotAi(
  message: string,
  history?: { role: string; content: string }[],
  currentStrategy?: any,
  model?: string
) {
  const res = await fetch(`${API_BASE}/bots/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history,
      current_strategy: currentStrategy,
      model,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to communicate with Bot AI Co-Pilot");
  }
  return res.json();
}

export async function runBotBacktest(
  strategy: any,
  testSymbol?: string,
  initialCapital: number = 100000.0
) {
  const res = await fetch(`${API_BASE}/bots/backtest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      strategy,
      test_symbol: testSymbol || undefined,
      initial_capital: initialCapital,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.detail?.validation_errors?.join(", ") || err.detail || "Backtest execution failed";
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchSavedBots() {
  const res = await fetch(`${API_BASE}/bots`);
  if (!res.ok) throw new Error("Failed to fetch saved bots");
  return res.json();
}

export async function fetchBotById(botId: string) {
  const res = await fetch(`${API_BASE}/bots/${botId}`);
  if (!res.ok) throw new Error(`Failed to fetch bot ${botId}`);
  return res.json();
}

export async function saveBotRecord(
  strategy: any,
  backtest?: any,
  status?: string
) {
  const res = await fetch(`${API_BASE}/bots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ strategy, backtest, status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save bot");
  }
  return res.json();
}

export async function deleteBotRecord(botId: string) {
  const res = await fetch(`${API_BASE}/bots/${botId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to delete bot ${botId}`);
  return res.json();
}

// --- Live Market & Macro News ---
export async function fetchLiveNews(params?: {
  category?: string;
  sector?: string;
  symbol?: string;
  sensitivity?: string;
  sentiment?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "ALL") query.append("category", params.category);
  if (params?.sector && params.sector !== "ALL") query.append("sector", params.sector);
  if (params?.symbol && params.symbol !== "ALL") query.append("symbol", params.symbol);
  if (params?.sensitivity && params.sensitivity !== "ALL") query.append("sensitivity", params.sensitivity);
  if (params?.sentiment && params.sentiment !== "ALL") query.append("sentiment", params.sentiment);
  if (params?.search) query.append("search", params.search);
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.offset) query.append("offset", params.offset.toString());

  const res = await fetch(`${API_BASE}/news?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch live news feed");
  return res.json();
}

export async function refreshLiveNews() {
  const res = await fetch(`${API_BASE}/news/refresh`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to refresh live news feed");
  return res.json();
}

// --- Dhan Broker Trade Execution & Portfolio API ---
export async function updateTradeSettings(data: {
  client_id?: string;
  access_token?: string;
  auto_sl2_breakeven?: boolean;
}) {
  const res = await fetch(`${API_BASE}/trade/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getTradeAuthHeaders()
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update Dhan trade settings");
  return res.json();
}

export async function fetchDhanIPStatus() {
  const res = await fetch(`${API_BASE}/trade/ip-status`);
  if (!res.ok) throw new Error("Failed to fetch Dhan IP status");
  return res.json();
}

export async function syncDhanIP() {
  const res = await fetch(`${API_BASE}/trade/sync-ip`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to sync Dhan IP");
  }
  return res.json();
}

function getTradeAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const normalToken = localStorage.getItem("apex_normal_token");
  if (normalToken) {
    return { "Authorization": `Bearer ${normalToken}` };
  }
  const adminToken = localStorage.getItem("admin_token") || localStorage.getItem("apex_user_token");
  if (adminToken) {
    return { "Authorization": `Bearer ${adminToken}` };
  }
  return {};
}

export async function fetchTradeStatus() {
  const res = await fetch(`${API_BASE}/trade/status`, {
    headers: getTradeAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch trade status");
  return res.json();
}

export async function placeTradeOrder(order: {
  symbol: string;
  security_id?: string;
  exchange_segment?: string;
  transaction_type?: string;
  quantity: number;
  order_type?: string;
  price?: number;
  target_price?: number;
  stop_loss_1?: number;
  stop_loss_2?: number;
  has_target?: boolean;
  has_stop_loss?: boolean;
  recommendation_id?: string;
}) {
  const res = await fetch(`${API_BASE}/trade/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getTradeAuthHeaders()
    },
    body: JSON.stringify(order),
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // response was not valid json
  }
  if (!res.ok) {
    const errorMsg = data?.detail || data?.message || `Order failed (${res.status}: ${res.statusText})`;
    throw new Error(errorMsg);
  }
  return data;
}

export async function fetchTradePositions() {
  const res = await fetch(`${API_BASE}/trade/positions`, {
    headers: getTradeAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch open positions");
  return res.json();
}

export async function squareOffTradePosition(data: {
  position_id: string;
  symbol: string;
  quantity: number;
}) {
  const res = await fetch(`${API_BASE}/trade/squareoff`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getTradeAuthHeaders()
    },
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.detail || "Failed to square off position");
  }
  return resData;
}

export async function fetchTradeOrders() {
  const res = await fetch(`${API_BASE}/trade/orders`, {
    headers: getTradeAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export async function cancelTradeOrder(orderId: string) {
  const res = await fetch(`${API_BASE}/trade/order/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getTradeAuthHeaders()
    },
    body: JSON.stringify({ order_id: orderId }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.detail || data?.message || `Failed to cancel order ${orderId}`);
  }
  return data;
}

export async function fetchTradeHoldings() {
  const res = await fetch(`${API_BASE}/trade/holdings`, {
    headers: getTradeAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch holdings");
  return res.json();
}

// --- xKiro & Gemini AI Vision Engine API ---
export interface VisionModelOption {
  id: string;
  name: string;
  vendor: string;
  tag: string;
  description: string;
}

export interface GeminiStatusResponse {
  configured: boolean;
  connected: boolean;
  provider?: string;
  model: string;
  masked_key: string;
  supported_models?: VisionModelOption[];
  message?: string;
}

export async function fetchGeminiStatus(): Promise<GeminiStatusResponse> {
  const res = await fetch(`${API_BASE}/gemini/status`);
  if (!res.ok) throw new Error("Failed to fetch AI Vision status");
  return res.json();
}

export async function updateGeminiSettings(data: { api_key: string; model?: string; provider?: string }) {
  const res = await fetch(`${API_BASE}/gemini/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.detail || "Failed to update AI Vision settings");
  }
  return resData;
}

export async function testGeminiConnection() {
  const res = await fetch(`${API_BASE}/gemini/test`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to test Gemini connection");
  return res.json();
}

export async function fetchTradeVisionAudit(symbol: string, tradeParams: {
  date?: string;
  time?: string;
  price?: number;
  target?: number;
  sl?: number;
  company_name?: string;
  score_100?: number;
  vault_score?: number;
  hurst_exponent?: number;
  is_nr7?: boolean;
}) {
  const res = await fetch(`${API_BASE}/simulation/trade-vision-audit/${encodeURIComponent(symbol)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tradeParams),
  });
  if (!res.ok) throw new Error("Failed to fetch trade vision audit");
  return res.json();
}

// =========================================================================
// Resend.com Email Delivery Gateway (SpecialUser 3rd API)
// =========================================================================
export async function fetchResendStatus() {
  const res = await fetch(`${API_BASE}/admin/resend/status`);
  if (!res.ok) throw new Error("Failed to fetch Resend status");
  return res.json();
}

export async function updateResendSettings(data: { api_key: string; from_email?: string }) {
  const res = await fetch(`${API_BASE}/admin/resend/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.detail || "Failed to update Resend settings");
  return json;
}

export async function testResendEmail(toEmail: string) {
  const res = await fetch(`${API_BASE}/admin/resend/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to_email: toEmail }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.detail || "Failed to send test email");
  return json;
}

// =========================================================================
// NormalUser Dedicated Registration & Auth Flow
// =========================================================================
export async function requestNormalOtp(email: string) {
  const res = await fetch(`${API_BASE}/auth/normal/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.detail || "Failed to send verification code");
  return json;
}

export async function verifyNormalOtp(email: string, otp: string) {
  const res = await fetch(`${API_BASE}/auth/normal/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.detail || "Failed to verify code");
  return json;
}

export async function setNormalPassword(data: { email: string; password: string; confirm_password: string }) {
  const res = await fetch(`${API_BASE}/auth/normal/set-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.detail || "Failed to set password");
  return json;
}

export async function loginNormalUser(data: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/normal/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.detail || "Failed to sign in");
  return json;
}

export async function fetchNormalMe(token: string) {
  const res = await fetch(`${API_BASE}/auth/normal/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

export async function configureNormalDhan(token: string, data: { client_id: string; pin: string; totp_secret: string }) {
  const res = await fetch(`${API_BASE}/auth/normal/dhan/configure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.detail || "Failed to configure Dhan account");
  return json;
}

export async function fetchNormalPortfolio(token: string) {
  const res = await fetch(`${API_BASE}/auth/normal/portfolio`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch personal portfolio");
  return res.json();
}

// =========================================================================
// Admin User Management & Lockout Endpoints
// =========================================================================
export async function fetchAdminUsers() {
  const res = await fetch(`${API_BASE}/admin/users`);
  if (!res.ok) throw new Error("Failed to fetch registered users");
  return res.json();
}

export async function unlockAdminUser(email: string) {
  const res = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(email)}/unlock`, {
    method: "POST",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.detail || "Failed to unlock user");
  return json;
}


