"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Sparkles,
  Play,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  HelpCircle,
  TrendingUp,
  Sliders,
  Code,
  ShieldCheck,
  Building2,
  DollarSign,
  BarChart3,
  Search,
  ChevronDown,
  ArrowRight,
  Filter,
  Copy,
  ChevronRight,
  ChevronLeft,
  Download,
  Info,
  ExternalLink,
  RefreshCw,
  X
} from "lucide-react";
import {
  fetchScreenerMetrics,
  evaluateScreenerQuery,
  createCustomPortfolio
} from "@/services/api";
import { ScreenerMetric, ScreenerQueryResponse } from "@/types";

interface FinancialScreenerViewProps {
  onSelectStock?: (symbol: string) => void;
  onNavigateToPortfolios?: () => void;
}

const PRESET_STRATEGIES = [
  {
    name: "Quality Compounders (5Y)",
    desc: "Strict 5Y sales & profit CAGR >15%, ROCE >18%, unpledged",
    query: "Sales growth 5Years > 15 AND Profit growth 5Years > 15 AND Return on capital employed > 18 AND Promoter pledged shares == 0"
  },
  {
    name: "Warren Buffett Moat",
    desc: "3Y ROCE >20%, low debt (D/E <0.5), clean audit opinion",
    query: "Return on capital employed 3Years > 20 AND Debt to equity < 0.5 AND Promoter holding > 50 AND Audit quality == 1"
  },
  {
    name: "Deep Value Graham Moat",
    desc: "Current price below Graham fair value with low P/E & zero distress",
    query: "Current price < Graham number AND Price to earnings < 18 AND Altman Z-Score > 3.0"
  },
  {
    name: "BSE ≠ NSE Arbitrage Spreads",
    desc: "Exchange price spread >0.25% with high traded volume",
    query: "Spread percentage > 0.25 AND Traded volume > 50000"
  },
  {
    name: "Cash Fortress Compounders",
    desc: "Zero debt, positive 3Y Free Cash Flow, high CFO to PAT",
    query: "Debt to equity < 0.1 AND Free cash flow 3Years > 50 AND CFO PAT Quality > 1.0"
  },
  {
    name: "FII & DII Institutional Accumulation",
    desc: "Positive quarterly institutional buying in profitable companies",
    query: "FII Holding Change > 0.5 AND DII Holding Change > 0.5 AND Return on capital employed > 15"
  }
];

const CATEGORY_TABS = [
  { id: "ALL", label: "All Indicators", icon: Layers },
  { id: "Growth", label: "Growth (1Y–5Y)", icon: TrendingUp },
  { id: "Profitability", label: "Profitability & ROCE", icon: BarChart3 },
  { id: "Valuation", label: "Valuation & Multiples", icon: DollarSign },
  { id: "Solvency & Debt", label: "Debt & Solvency", icon: ShieldCheck },
  { id: "Cash Flows", label: "Cash Flows & Capex", icon: DollarSign },
  { id: "Shareholding", label: "Shareholding & Promoters", icon: Building2 },
  { id: "Technicals & Real-Time", label: "BSE≠NSE & Real-Time", icon: Sparkles }
];

export const FinancialScreenerView: React.FC<FinancialScreenerViewProps> = ({
  onSelectStock,
  onNavigateToPortfolios
}) => {
  const [metrics, setMetrics] = useState<ScreenerMetric[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [query, setQuery] = useState<string>(
    "Market capitalization > 1000 AND Return on capital employed > 15 AND Debt to equity < 1"
  );
  const [running, setRunning] = useState<boolean>(false);
  const [queryResponse, setQueryResponse] = useState<ScreenerQueryResponse | null>(null);
  interface ScreenerErrorDetails {
    message: string;
    type?: string;
    problem_token?: string;
    suggestion?: string;
    suggestion_key?: string;
    hint?: string;
  }
  const [errorDetails, setErrorDetails] = useState<ScreenerErrorDetails | null>(null);

  // Pagination & Sorting
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [sortBy, setSortBy] = useState<string>("market_cap");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Palette State
  const [paletteCategory, setPaletteCategory] = useState<string>("ALL");
  const [paletteSearch, setPaletteSearch] = useState<string>("");

  // Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState<Array<{
    label: string;
    token: string;
    category: string;
    unit: string;
    desc: string;
    timeframes?: string[];
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number>(0);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Save Portfolio Modal State
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [portfolioName, setPortfolioName] = useState<string>("");
  const [portfolioDesc, setPortfolioDesc] = useState<string>("");
  const [savingPortfolio, setSavingPortfolio] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // Real-time WebSocket Feed for Screener Results
  const wsRef = useRef<WebSocket | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());
  const [rowFlash, setRowFlash] = useState<Record<string, "up" | "down">>({});

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;
    let isMounted = true;

    const connectWs = () => {
      if (!isMounted) return;
      try {
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = window.location.hostname || "localhost";
        const wsUrl = `${wsProtocol}//${wsHost}:8000/ws/terminal`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          subscribedSymbolsRef.current.clear();
          const currentStocks = queryResponse?.stocks || [];
          if (currentStocks.length > 0) {
            currentStocks.forEach((s: any) => subscribedSymbolsRef.current.add(s.symbol));
            ws?.send(
              JSON.stringify({
                action: "SUBSCRIBE_UNIVERSE",
                symbols: currentStocks.map((s: any) => s.symbol)
              })
            );
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "STOCK_TICK" && data.symbol) {
              setQueryResponse((prev) => {
                if (!prev || !prev.stocks) return prev;
                return {
                  ...prev,
                  stocks: prev.stocks.map((item: any) => {
                    if (item.symbol !== data.symbol) return item;
                    const oldLtp = item.nse_ltp ?? item.ltp ?? 0;
                    const newLtp = data.ltp ?? oldLtp;

                    const hasPriceChanged = (oldLtp > 0 && newLtp !== oldLtp) ||
                      (data.nse_ltp !== undefined && item.nse_ltp !== undefined && data.nse_ltp !== item.nse_ltp) ||
                      (data.bse_ltp !== undefined && item.bse_ltp !== undefined && data.bse_ltp !== item.bse_ltp);

                    if (hasPriceChanged) {
                      setRowFlash((f) => ({ ...f, [data.symbol]: newLtp >= oldLtp ? "up" : "down" }));
                      setTimeout(() => {
                        setRowFlash((f) => {
                          const n = { ...f };
                          delete n[data.symbol];
                          return n;
                        });
                      }, 450);
                    }

                    const nse = data.nse_ltp ?? (data.ltp ?? item.nse_ltp);
                    const bse = data.bse_ltp ?? (data.ltp ?? item.bse_ltp);
                    const diffPct = (nse && bse && Math.min(nse, bse) > 0)
                      ? parseFloat(((Math.abs(nse - bse) / Math.min(nse, bse)) * 100).toFixed(2))
                      : item.spread_pct;

                    return {
                      ...item,
                      ltp: newLtp,
                      nse_ltp: nse,
                      bse_ltp: bse,
                      change: data.change !== undefined ? data.change : item.change,
                      change_pct: data.change_pct !== undefined ? data.change_pct : item.change_pct,
                      spread_pct: diffPct,
                      volume: data.volume || item.volume
                    };
                  })
                };
              });
            }
          } catch {}
        };

        ws.onclose = () => {
          if (isMounted) reconnectTimer = setTimeout(connectWs, 3000);
        };
      } catch {
        if (isMounted) reconnectTimer = setTimeout(connectWs, 5000);
      }
    };

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  // Subscribe newly visible stocks whenever queryResponse updates
  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const currentStocks = queryResponse?.stocks || [];
    const newSymbols = currentStocks
      .map((s: any) => s.symbol)
      .filter((sym: string) => !subscribedSymbolsRef.current.has(sym));

    if (newSymbols.length > 0) {
      newSymbols.forEach((s: string) => subscribedSymbolsRef.current.add(s));
      wsRef.current.send(
        JSON.stringify({
          action: "SUBSCRIBE_UNIVERSE",
          symbols: newSymbols
        })
      );
    }
  }, [queryResponse]);

  const scrollTable = (direction: "left" | "right") => {
    if (tableContainerRef.current) {
      const scrollAmount = 350;
      tableContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  // Load catalog on mount
  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const res = await fetchScreenerMetrics();
      if (res && res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      console.error("Failed to load screener metrics", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Run initial query once metrics are loaded
  useEffect(() => {
    handleRunQuery(query, 1, sortBy, sortDir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortDir]);

  // Execute Screener Query
  const handleRunQuery = async (
    queryStr: string = query,
    targetPage: number = page,
    currentSortBy: string = sortBy,
    currentSortDir: "asc" | "desc" = sortDir
  ) => {
    const trimmed = queryStr.trim();
    if (!trimmed) {
      setErrorDetails({
        message: "Please enter a filter condition or choose a preset strategy.",
        hint: "Try an expression like: Market cap > 1000 AND ROCE > 15"
      });
      return;
    }

    setRunning(true);
    setErrorDetails(null);

    try {
      const res = await evaluateScreenerQuery(
        trimmed,
        targetPage,
        pageSize,
        currentSortBy,
        currentSortDir
      );

      if (res.success) {
        setQueryResponse(res);
        setPage(targetPage);
        setErrorDetails(null);
      } else {
        setErrorDetails({
          message: res.error || "Query evaluation failed. Check expression syntax.",
          ...res.diagnostic
        });
      }
    } catch (err: any) {
      const diag = err?.diagnostic || (typeof err?.detail === "object" ? err?.detail?.diagnostic : undefined);
      const msg = err?.message || (typeof err?.detail === "string" ? err.detail : err?.detail?.message) || "Failed to evaluate query. Check expression syntax.";
      setErrorDetails({
        message: msg,
        ...diag
      });
    } finally {
      setRunning(false);
    }
  };

  // 1-Click fix for typos and recommendations
  const handleApplySuggestion = (
    problemToken?: string,
    suggestionText?: string,
    suggestionKey?: string
  ) => {
    // If the suggestion text is identical to problem token, use suggestionKey
    let targetReplacement = suggestionText;
    if (
      problemToken &&
      suggestionText &&
      problemToken.trim().toLowerCase() === suggestionText.trim().toLowerCase()
    ) {
      targetReplacement = suggestionKey || suggestionText;
    } else if (!targetReplacement && suggestionKey) {
      targetReplacement = suggestionKey;
    }

    if (!targetReplacement) return;
    let updated = query;
    if (problemToken && query.includes(problemToken)) {
      updated = query.replace(problemToken, targetReplacement);
    } else if (problemToken) {
      const regex = new RegExp(problemToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (regex.test(query)) {
        updated = query.replace(regex, targetReplacement);
      } else {
        updated = `${query.trim()} AND ${targetReplacement}`;
      }
    } else {
      updated = `${query.trim()} AND ${targetReplacement}`;
    }
    setQuery(updated);
    setErrorDetails(null);
    handleRunQuery(updated);
  };

  // Autocomplete token extraction
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart || 0;
    setQuery(val);
    setCursorPosition(pos);

    // Extract word currently being typed before the cursor
    const textBeforeCursor = val.slice(0, pos);
    const words = textBeforeCursor.split(/[\s,()><=+\-*/]+/);
    const currentWord = words[words.length - 1]?.trim().toLowerCase() || "";

    if (currentWord.length >= 1) {
      // Find matching metrics or aliases
      const matches: Array<{
        label: string;
        token: string;
        category: string;
        unit: string;
        desc: string;
        timeframes?: string[];
      }> = [];

      // Check against base metrics
      metrics.forEach((m) => {
        const nameMatch = m.name.toLowerCase().includes(currentWord);
        const keyMatch = m.key.toLowerCase().includes(currentWord);
        const catMatch = m.category.toLowerCase().includes(currentWord);

        if (nameMatch || keyMatch || catMatch) {
          if (m.supports_timeframe) {
            matches.push({
              label: `${m.name} (3Y CAGR / Avg)`,
              token: `${m.name} 3Years`,
              category: m.category,
              unit: m.unit,
              desc: m.description || "",
              timeframes: m.timeframes
            });
            matches.push({
              label: `${m.name} (5Y CAGR / Avg)`,
              token: `${m.name} 5Years`,
              category: m.category,
              unit: m.unit,
              desc: m.description || "",
              timeframes: m.timeframes
            });
            matches.push({
              label: `${m.name} (Latest / 1Y)`,
              token: m.name,
              category: m.category,
              unit: m.unit,
              desc: m.description || "",
              timeframes: m.timeframes
            });
          } else {
            matches.push({
              label: m.name,
              token: m.name,
              category: m.category,
              unit: m.unit,
              desc: m.description || ""
            });
          }
        }
      });

      // Also add common Screener shortcuts if matched
      const commonShortcuts = [
        { label: "Market Capitalization (₹ Cr)", token: "Market capitalization", category: "Valuation", unit: "₹ Cr", desc: "Total market value of the company" },
        { label: "Current Market Price (CMP)", token: "Current price", category: "Technicals & Real-Time", unit: "₹", desc: "Latest trading price on exchange" },
        { label: "Book Value Per Share (BVPS)", token: "Book value", category: "Valuation", unit: "₹", desc: "Net equity book value per share" },
        { label: "Price to Earnings (P/E)", token: "Price to earning", category: "Valuation", unit: "x", desc: "Price per share divided by EPS" },
        { label: "Price to Book (P/B)", token: "Price to book", category: "Valuation", unit: "x", desc: "Price per share divided by BVPS" },
        { label: "Debt to Equity Ratio", token: "Debt to equity", category: "Solvency & Debt", unit: "x", desc: "Total borrowings divided by Net Worth" },
        { label: "Return on Capital Employed (ROCE)", token: "Return on capital employed", category: "Profitability", unit: "%", desc: "Operating profit divided by capital employed" },
        { label: "Return on Equity (ROE)", token: "Return on equity", category: "Profitability", unit: "%", desc: "Net profit divided by equity" },
        { label: "Sales Growth 5Years (%)", token: "Sales growth 5Years", category: "Growth", unit: "%", desc: "5-Year top-line compounding rate" },
        { label: "Profit Growth 5Years (%)", token: "Profit growth 5Years", category: "Growth", unit: "%", desc: "5-Year PAT compounding rate" },
        { label: "BSE ≠ NSE Arbitrage Spread (%)", token: "Spread percentage", category: "Technicals & Real-Time", unit: "%", desc: "Real-time spread between BSE and NSE" }
      ];

      commonShortcuts.forEach((sc) => {
        if (
          sc.label.toLowerCase().includes(currentWord) ||
          sc.token.toLowerCase().includes(currentWord)
        ) {
          if (!matches.some((m) => m.token === sc.token)) {
            matches.unshift(sc);
          }
        }
      });

      if (matches.length > 0) {
        setSuggestions(matches.slice(0, 8));
        setShowSuggestions(true);
        setActiveSuggestionIdx(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Insert selected suggestion into query at cursor
  const handleInsertSuggestion = (tokenToInsert: string) => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart || cursorPosition;
    const textBefore = query.slice(0, pos);
    const textAfter = query.slice(pos);

    // Find the word boundary before cursor to replace
    const lastWordMatch = textBefore.match(/[\w_]+$/);
    const wordStart = lastWordMatch ? pos - lastWordMatch[0].length : pos;

    const newQuery = query.slice(0, wordStart) + tokenToInsert + " " + textAfter;
    setQuery(newQuery);
    setShowSuggestions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        const nextPos = wordStart + tokenToInsert.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 10);
  };

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunQuery();
      return;
    }

    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIdx((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleInsertSuggestion(suggestions[activeSuggestionIdx].token);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }
  };

  // Insert operator / connector pill
  const handleInsertOperator = (op: string) => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart || query.length;
    const textBefore = query.slice(0, pos).trimEnd();
    const textAfter = query.slice(pos).trimStart();

    const insertText = ` ${op} `;
    const updated = (textBefore + insertText + textAfter).trim();
    setQuery(updated);

    setTimeout(() => {
      if (textareaRef.current) {
        const nextPos = textBefore.length + insertText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 10);
  };

  // Insert ratio from the right-hand palette
  const handleInsertPaletteMetric = (metric: ScreenerMetric, timeframe?: string) => {
    let token = metric.name;
    if (timeframe && timeframe !== "latest") {
      const tfLabel = timeframe.toUpperCase();
      token = `${metric.name} ${tfLabel === "3Y" ? "3Years" : tfLabel === "5Y" ? "5Years" : timeframe}`;
    }

    const trimmed = query.trim();
    const prefix = trimmed.length > 0 && !trimmed.endsWith("AND") && !trimmed.endsWith("OR") ? " AND " : " ";
    const defaultOperator = " > ";
    const newQuery = trimmed + prefix + token + defaultOperator;
    setQuery(newQuery);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newQuery.length, newQuery.length);
      }
    }, 10);
  };

  // Synchronized Condition Pills Parsing (for visual clarity)
  const conditionPills = useMemo(() => {
    if (!query) return [];
    const parts = query.split(/\s+(AND|OR)\s+/i);
    const pills: Array<{ id: number; text: string; connector?: string }> = [];
    let currentConnector: string | undefined = undefined;

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i].trim();
      if (p.toUpperCase() === "AND" || p.toUpperCase() === "OR") {
        currentConnector = p.toUpperCase();
      } else if (p) {
        pills.push({
          id: i,
          text: p,
          connector: currentConnector
        });
        currentConnector = undefined;
      }
    }
    return pills;
  }, [query]);

  // Remove a condition pill and update query string
  const handleRemovePill = (indexToRemove: number) => {
    const updatedPills = conditionPills.filter((_, idx) => idx !== indexToRemove);
    if (updatedPills.length === 0) {
      setQuery("");
      return;
    }
    const newQueryStr = updatedPills
      .map((p, idx) => (idx === 0 ? p.text : `${p.connector || "AND"} ${p.text}`))
      .join(" ");
    setQuery(newQueryStr);
    handleRunQuery(newQueryStr, 1, sortBy, sortDir);
  };

  // Filter metrics in the right palette
  const filteredPaletteMetrics = useMemo(() => {
    return metrics.filter((m) => {
      const matchesCategory = paletteCategory === "ALL" || m.category === paletteCategory;
      const matchesSearch =
        !paletteSearch ||
        m.name.toLowerCase().includes(paletteSearch.toLowerCase()) ||
        m.key.toLowerCase().includes(paletteSearch.toLowerCase()) ||
        m.category.toLowerCase().includes(paletteSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [metrics, paletteCategory, paletteSearch]);

  // Handle Sort in Results Table
  const handleSort = (colKey: string) => {
    if (sortBy === colKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(colKey);
      setSortDir("desc");
    }
  };

  // Save as Custom Portfolio
  const handleSavePortfolio = async () => {
    if (!portfolioName.trim()) return;
    setSavingPortfolio(true);
    setSaveSuccessMsg(null);

    try {
      const res = await createCustomPortfolio({
        name: portfolioName.trim(),
        description: portfolioDesc.trim() || `Generated from Screener: ${query}`,
        formula: query.trim(),
        tags: ["screener", "compounders"]
      });

      if (res && res.id) {
        setSaveSuccessMsg(`Portfolio "${portfolioName}" successfully created!`);
        setTimeout(() => {
          setSaveModalOpen(false);
          setSaveSuccessMsg(null);
          setPortfolioName("");
          setPortfolioDesc("");
          onNavigateToPortfolios?.();
        }, 1200);
      }
    } catch (err: any) {
      alert("Failed to save portfolio: " + (err?.response?.data?.detail || err.message));
    } finally {
      setSavingPortfolio(false);
    }
  };

  // Dynamic Additional Columns based on query and metrics_used
  const activeDynamicColumns = useMemo<Array<{
    key: string;
    header: string;
    render: (stock: any) => React.ReactNode;
    getValue: (stock: any) => any;
  }>>(() => {
    const rawMetrics = queryResponse?.metrics_used || [];
    const qLower = query.toLowerCase();

    const cols: Array<{
      key: string;
      header: string;
      render: (stock: any) => React.ReactNode;
      getValue: (stock: any) => any;
    }> = [];
    const addedKeys = new Set<string>();

    const addCol = (
      key: string,
      header: string,
      render: (stock: any) => React.ReactNode,
      getValue: (stock: any) => any
    ) => {
      if (!addedKeys.has(key)) {
        addedKeys.add(key);
        cols.push({ key, header, render, getValue });
      }
    };

    // Check if multi-year net profit is requested
    const wants5YProfit = rawMetrics.some(m => m.includes("profit_growth") && m.includes("5y")) ||
      (qLower.includes("profit") && (qLower.includes("5year") || qLower.includes("5 year") || qLower.includes("5y")));

    const wants5YSales = rawMetrics.some(m => m.includes("sales_growth") && m.includes("5y")) ||
      (qLower.includes("sales") && (qLower.includes("5year") || qLower.includes("5 year") || qLower.includes("5y")));

    const wants5YRoce = rawMetrics.some(m => m.includes("roce") && m.includes("5y")) ||
      (qLower.includes("roce") && (qLower.includes("5year") || qLower.includes("5 year") || qLower.includes("5y")));

    const wants5YFcf = rawMetrics.some(m => m.includes("free_cash_flow") && m.includes("5y")) ||
      (qLower.includes("free cash flow") && (qLower.includes("5year") || qLower.includes("5 year") || qLower.includes("5y")));

    // 1. Multi-year Net Profit expansion
    if (wants5YProfit) {
      addCol("profit_growth_1y", "PAT 1Y", (s) => (
        <span className="font-mono text-slate-700">{s.profit_growth_1y != null ? `${s.profit_growth_1y}%` : "—"}</span>
      ), (s) => s.profit_growth_1y ?? "");
      addCol("profit_growth_2y", "PAT 2Y", (s) => (
        <span className="font-mono text-slate-700">{s.profit_growth_2y != null ? `${s.profit_growth_2y}%` : "—"}</span>
      ), (s) => s.profit_growth_2y ?? "");
      addCol("profit_growth_3y", "PAT 3Y", (s) => (
        <span className="font-mono text-slate-700 font-semibold">{s.profit_growth_3y != null ? `${s.profit_growth_3y}%` : "—"}</span>
      ), (s) => s.profit_growth_3y ?? "");
      addCol("profit_growth_5y", "PAT 5Y CAGR", (s) => (
        <span className="font-mono text-blue-700 font-bold">{s.profit_growth_5y != null ? `${s.profit_growth_5y}%` : "—"}</span>
      ), (s) => s.profit_growth_5y ?? "");
    }

    // 2. Multi-year Sales CAGR expansion
    if (wants5YSales) {
      addCol("sales_growth_1y", "Sales 1Y", (s) => (
        <span className="font-mono text-slate-700">{s.sales_growth_1y != null ? `${s.sales_growth_1y}%` : "—"}</span>
      ), (s) => s.sales_growth_1y ?? "");
      addCol("sales_growth_2y", "Sales 2Y", (s) => (
        <span className="font-mono text-slate-700">{s.sales_growth_2y != null ? `${s.sales_growth_2y}%` : "—"}</span>
      ), (s) => s.sales_growth_2y ?? "");
      addCol("sales_growth_3y", "Sales 3Y", (s) => (
        <span className="font-mono text-slate-700 font-semibold">{s.sales_growth_3y != null ? `${s.sales_growth_3y}%` : "—"}</span>
      ), (s) => s.sales_growth_3y ?? "");
      addCol("sales_growth_5y", "Sales 5Y CAGR", (s) => (
        <span className="font-mono text-blue-700 font-bold">{s.sales_growth_5y != null ? `${s.sales_growth_5y}%` : "—"}</span>
      ), (s) => s.sales_growth_5y ?? "");
    }

    // 3. Multi-year ROCE expansion
    if (wants5YRoce) {
      addCol("roce", "ROCE Latest", (s) => (
        <span className="font-mono text-slate-800 font-semibold">{s.roce != null ? `${s.roce}%` : "—"}</span>
      ), (s) => s.roce ?? "");
      addCol("roce_3y", "ROCE 3Y Avg", (s) => (
        <span className="font-mono text-slate-800 font-semibold">{s.roce_3y != null ? `${s.roce_3y}%` : "—"}</span>
      ), (s) => s.roce_3y ?? "");
      addCol("roce_5y", "ROCE 5Y Avg", (s) => (
        <span className="font-mono text-indigo-700 font-bold">{s.roce_5y != null ? `${s.roce_5y}%` : "—"}</span>
      ), (s) => s.roce_5y ?? "");
    }

    // 4. Multi-year FCF expansion
    if (wants5YFcf) {
      addCol("free_cash_flow", "FCF Latest", (s) => (
        <span className="font-mono text-slate-800">{s.free_cash_flow != null ? `₹${s.free_cash_flow} Cr` : "—"}</span>
      ), (s) => s.free_cash_flow ?? "");
      addCol("free_cash_flow_3y", "FCF 3Y", (s) => (
        <span className="font-mono text-slate-800 font-semibold">{s.free_cash_flow_3y != null ? `₹${s.free_cash_flow_3y} Cr` : "—"}</span>
      ), (s) => s.free_cash_flow_3y ?? "");
      addCol("free_cash_flow_5y", "FCF 5Y", (s) => (
        <span className="font-mono text-indigo-700 font-bold">{s.free_cash_flow_5y != null ? `₹${s.free_cash_flow_5y} Cr` : "—"}</span>
      ), (s) => s.free_cash_flow_5y ?? "");
    }

    // Process all other metrics used
    const keysToProcess = rawMetrics.length > 0 ? rawMetrics : ["market_cap", "roce", "debt_to_equity"];

    keysToProcess.forEach((mKey) => {
      const k = mKey.toLowerCase();
      // Skip fixed common columns or already added multi-year groups
      if (
        k === "symbol" || k === "name" || k === "sector" ||
        k === "ltp" || k === "nse_ltp" || k === "bse_ltp" || k === "current_price" || k === "cmp" || k === "price" ||
        (wants5YProfit && k.startsWith("profit_growth")) ||
        (wants5YSales && k.startsWith("sales_growth")) ||
        (wants5YRoce && k.startsWith("roce")) ||
        (wants5YFcf && k.startsWith("free_cash_flow"))
      ) {
        return;
      }

      if (k === "market_cap") {
        addCol("market_cap", "Mkt. Cap", (s) => (
          <span className="font-mono text-slate-800">
            ₹{Number(s.market_cap || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr
          </span>
        ), (s) => s.market_cap ?? "");
      } else if (k === "roce" || k === "roce_latest") {
        addCol("roce", "ROCE", (s) => (
          <span className="font-mono font-semibold text-slate-900">{s.roce != null ? `${s.roce}%` : "—"}</span>
        ), (s) => s.roce ?? "");
      } else if (k === "roe" || k === "roe_latest") {
        addCol("roe", "ROE", (s) => (
          <span className="font-mono font-semibold text-slate-900">{s.roe != null ? `${s.roe}%` : "—"}</span>
        ), (s) => s.roe ?? "");
      } else if (k === "debt_to_equity") {
        addCol("debt_to_equity", "D/E Ratio", (s) => (
          <span className={`font-mono font-semibold ${Number(s.debt_to_equity) > 1 ? "text-amber-700" : "text-emerald-700"}`}>
            {s.debt_to_equity != null ? s.debt_to_equity : "—"}
          </span>
        ), (s) => s.debt_to_equity ?? "");
      } else if (k === "pe" || k === "pe_ratio") {
        addCol("pe", "P/E", (s) => (
          <span className="font-mono text-slate-800">{s.pe != null ? `${s.pe}x` : "—"}</span>
        ), (s) => s.pe ?? "");
      } else if (k === "pb" || k === "pb_ratio") {
        addCol("pb", "P/B", (s) => (
          <span className="font-mono text-slate-800">{s.pb != null ? `${s.pb}x` : "—"}</span>
        ), (s) => s.pb ?? "");
      } else if (k === "book_value" || k === "bvps") {
        addCol("book_value", "Book Value", (s) => (
          <span className="font-mono text-slate-800">₹{s.book_value != null ? s.book_value : "—"}</span>
        ), (s) => s.book_value ?? "");
      } else if (k === "eps") {
        addCol("eps", "EPS", (s) => (
          <span className="font-mono text-slate-800">₹{s.eps != null ? s.eps : "—"}</span>
        ), (s) => s.eps ?? "");
      } else if (k === "graham_number") {
        addCol("graham_number", "Graham Value", (s) => (
          <span className="font-mono text-purple-700 font-semibold">₹{s.graham_number != null ? s.graham_number : "—"}</span>
        ), (s) => s.graham_number ?? "");
      } else if (k === "promoter_holding") {
        addCol("promoter_holding", "Promoter", (s) => (
          <span className="font-mono text-slate-800">{s.promoter_holding != null ? `${s.promoter_holding}%` : "—"}</span>
        ), (s) => s.promoter_holding ?? "");
      } else if (k === "promoter_pledged_pct") {
        addCol("promoter_pledged_pct", "Pledge", (s) => (
          <span className={`font-mono text-xs font-semibold ${s.promoter_pledged_pct === 0 ? "text-emerald-700" : "text-rose-600"}`}>
            {s.promoter_pledged_pct != null ? `${s.promoter_pledged_pct}%` : "—"}
          </span>
        ), (s) => s.promoter_pledged_pct ?? "");
      } else if (k === "fii_holding") {
        addCol("fii_holding", "FII", (s) => (
          <span className="font-mono text-slate-800">{s.fii_holding != null ? `${s.fii_holding}%` : "—"}</span>
        ), (s) => s.fii_holding ?? "");
      } else if (k === "dii_holding") {
        addCol("dii_holding", "DII", (s) => (
          <span className="font-mono text-slate-800">{s.dii_holding != null ? `${s.dii_holding}%` : "—"}</span>
        ), (s) => s.dii_holding ?? "");
      } else if (k === "current_ratio") {
        addCol("current_ratio", "Current Ratio", (s) => (
          <span className="font-mono text-slate-800">{s.current_ratio != null ? s.current_ratio : "—"}</span>
        ), (s) => s.current_ratio ?? "");
      } else if (k === "quick_ratio") {
        addCol("quick_ratio", "Quick Ratio", (s) => (
          <span className="font-mono text-slate-800">{s.quick_ratio != null ? s.quick_ratio : "—"}</span>
        ), (s) => s.quick_ratio ?? "");
      } else if (k === "dividend_yield") {
        addCol("dividend_yield", "Div Yield", (s) => (
          <span className="font-mono text-slate-800">{s.dividend_yield != null ? `${s.dividend_yield}%` : "—"}</span>
        ), (s) => s.dividend_yield ?? "");
      } else if (k === "altman_z_score") {
        addCol("altman_z_score", "Altman Z", (s) => (
          <span className="font-mono font-semibold text-slate-800">{s.altman_z_score != null ? s.altman_z_score : "—"}</span>
        ), (s) => s.altman_z_score ?? "");
      } else if (k === "spread_pct") {
        addCol("spread_pct", "BSE≠NSE", (s) => (
          <span className="font-mono font-bold text-purple-700">+{s.spread_pct ? s.spread_pct.toFixed(2) : "0.00"}%</span>
        ), (s) => s.spread_pct ?? "");
      } else if (k === "volume") {
        addCol("volume", "Volume", (s) => (
          <span className="font-mono text-slate-700">{s.volume ? Number(s.volume).toLocaleString("en-IN") : "—"}</span>
        ), (s) => s.volume ?? "");
      } else {
        const title = k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        addCol(k, title, (s) => (
          <span className="font-mono text-slate-800">{s[k] != null ? `${s[k]}` : "—"}</span>
        ), (s) => s[k] ?? "");
      }
    });

    if (cols.length === 0) {
      addCol("market_cap", "Mkt. Cap", (s) => (
        <span className="font-mono text-slate-800">
          ₹{Number(s.market_cap || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr
        </span>
      ), (s) => s.market_cap ?? "");
      addCol("roce", "ROCE", (s) => (
        <span className="font-mono font-semibold text-slate-900">{s.roce != null ? `${s.roce}%` : "—"}</span>
      ), (s) => s.roce ?? "");
      addCol("debt_to_equity", "D/E Ratio", (s) => (
        <span className={`font-mono font-semibold ${Number(s.debt_to_equity) > 1 ? "text-amber-700" : "text-emerald-700"}`}>
          {s.debt_to_equity != null ? s.debt_to_equity : "—"}
        </span>
      ), (s) => s.debt_to_equity ?? "");
    }

    return cols;
  }, [queryResponse, query]);

  // Export Results to CSV
  const handleExportCSV = () => {
    if (!queryResponse || !queryResponse.stocks || queryResponse.stocks.length === 0) return;
    const baseHeaders = ["Instrument", "Name", "Sector", "NSE (₹)", "BSE (₹)", "Change (%)"];
    const dynamicHeaders = activeDynamicColumns.map(c => c.header);
    const headers = [...baseHeaders, ...dynamicHeaders];

    const rows = queryResponse.stocks.map((s) => {
      const baseRow = [
        s.symbol,
        `"${s.name || s.symbol}"`,
        `"${s.sector || 'General'}"`,
        s.nse_ltp ?? s.ltp ?? 0,
        s.bse_ltp ?? s.ltp ?? 0,
        s.change_pct ?? 0
      ];
      const dynRow = activeDynamicColumns.map(c => c.getValue(s));
      return [...baseRow, ...dynRow];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `apex_screener_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Page Header & Info Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-50/60 via-indigo-50/30 to-transparent pointer-events-none rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  Financial Screener
                </h1>
                <p className="text-xs md:text-sm text-slate-500 font-medium">
                  Institutional-grade 5-Year fundamental & real-time AST screening engine across all 5,092 BSE/NSE equities.
                </p>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px]">
              5,092 BSE/NSE Equities
            </span>
          </div>
        </div>

        {/* Preset Strategies Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-blue-500" />
            Presets:
          </span>
          {PRESET_STRATEGIES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setQuery(preset.query);
                handleRunQuery(preset.query, 1, sortBy, sortDir);
              }}
              className="shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50/80 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-slate-700 transition-all cursor-pointer shadow-2xs group flex items-center gap-1.5"
              title={preset.desc}
            >
              <span className="font-semibold">{preset.name}</span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Screener Workshop: Query Terminal (Left 2/3) + Ratio Palette (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left 8 Cols: Unified Code Terminal & Visual Sync */}
        <div className="lg:col-span-8 flex flex-col h-full">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full relative">
            <div className="space-y-3 flex-1 flex flex-col">
              {/* Terminal Header Bar */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-800">Screener.in Query Terminal</span>
                  <span className="text-slate-400 text-[11px]">• Type any ratio, operator, or metric comparison</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuery("")}
                    className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors font-medium cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Synchronized Condition Pills */}
              {conditionPills.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200/60 rounded-xl shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Active Clauses:
                  </span>
                  {conditionPills.map((pill, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-800 shadow-2xs"
                    >
                      {pill.connector && (
                        <span className="text-[10px] font-black text-indigo-600 mr-0.5 uppercase">
                          {pill.connector}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-slate-700">{pill.text}</span>
                      <button
                        onClick={() => handleRemovePill(idx)}
                        className="text-slate-400 hover:text-rose-500 transition-colors ml-1 p-0.5 rounded cursor-pointer"
                        title="Remove condition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Screener.in Interactive Textarea with Type-Ahead Dropdown */}
              <div className="relative flex-1 flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  rows={6}
                  placeholder="Type query here, e.g. Market capitalization > 1000 AND Return on capital employed > 15 AND Current price < Book value * 2..."
                  className="w-full flex-1 min-h-[165px] font-mono text-xs md:text-sm bg-slate-900 text-emerald-400 p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all leading-relaxed tracking-wide selection:bg-blue-600 selection:text-white resize-y"
                  spellCheck={false}
                />

              {/* Floating Autocomplete Suggestions Dropdown (Screener.in Style) */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-4 top-full mt-1 w-96 max-w-[90vw] bg-slate-900/98 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-2 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Suggestions (↑↓ to select, Enter/Tab to insert)</span>
                    <kbd className="px-1 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-mono">
                      ESC to dismiss
                    </kbd>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 no-scrollbar">
                    {suggestions.map((s, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleInsertSuggestion(s.token)}
                        className={`p-2.5 cursor-pointer transition-colors text-left ${
                          idx === activeSuggestionIdx
                            ? "bg-blue-600/30 text-white border-l-2 border-blue-400"
                            : "hover:bg-slate-800/60 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-white">
                            {s.label}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold shrink-0">
                            {s.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="truncate">{s.desc}</span>
                          <span className="text-[9px] uppercase px-1 rounded bg-slate-800/80 text-slate-400 font-bold shrink-0">
                            {s.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Operator Insertion Bar */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Quick Insert:
              </span>
              {["AND", "OR", ">", "<", ">=", "<=", "==", "+", "-", "*", "/", "(", ")"].map((op) => (
                <button
                  key={op}
                  onClick={() => handleInsertOperator(op)}
                  className={`px-2 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs ${
                    op === "AND" || op === "OR"
                      ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  }`}
                >
                  {op}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => handleInsertOperator("Current price < Book value")}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                  title="Formula comparing two fundamental metrics"
                >
                  CMP &lt; Book Value
                </button>
                <button
                  onClick={() => handleInsertOperator("Sales growth 5Years > 15")}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="5-Year growth filter"
                >
                  5Y Growth &gt; 15%
                </button>
              </div>
            </div>
          </div>

            {/* Action Bar Directly Below Formula Builder */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-600">
                    ⌘ / Ctrl + Enter
                  </kbd>
                  <span className="text-slate-400">to run query</span>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSaveModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all cursor-pointer"
                  title="Save current formula as an automated tracking portfolio"
                >
                  <Save className="w-3.5 h-3.5 text-blue-600" />
                  <span>Save Portfolio</span>
                </button>

                <button
                  onClick={() => handleRunQuery()}
                  disabled={running}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs md:text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                  title="Execute screener formula across entire universe"
                >
                  <Play className={`w-3.5 h-3.5 ${running ? "animate-spin" : "fill-current"}`} />
                  <span>{running ? "Scanning 5,092 Equities..." : "Run Scanner"}</span>
                </button>
              </div>
            </div>

            {/* Dynamic Error & Syntax Diagnostic Alert */}
            {errorDetails && (
              <div className="mt-3 p-3.5 bg-gradient-to-r from-rose-50 via-rose-50/80 to-amber-50/60 border border-rose-200/90 rounded-xl shadow-xs text-xs animate-in fade-in slide-in-from-top-1 shrink-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded-md bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-900 uppercase tracking-wider text-[10px] px-1.5 py-0.2 rounded bg-rose-200/60">
                          {errorDetails.type ? errorDetails.type.replace(/_/g, " ") : "Query Syntax Issue"}
                        </span>
                      </div>
                      <p className="font-semibold text-rose-950 text-xs leading-relaxed">
                        {errorDetails.message}
                      </p>
                      {errorDetails.hint && (
                        <p className="text-[11px] text-rose-700/90 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-rose-500 shrink-0 inline" />
                          <span>{errorDetails.hint}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setErrorDetails(null)}
                    className="p-1 text-rose-400 hover:text-rose-700 rounded-md hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
                    title="Dismiss alert"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 1-Click Actionable Suggestion */}
                {errorDetails.suggestion && (
                  <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-[11px] text-rose-800">
                      Suggested correction: <span className="font-mono font-bold text-rose-900 bg-white/80 px-1.5 py-0.5 rounded border border-rose-200">{errorDetails.suggestion}</span>
                    </div>
                    <button
                      onClick={() => handleApplySuggestion(errorDetails.problem_token, errorDetails.suggestion, errorDetails.suggestion_key)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Apply Fix & Re-scan</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Ratio & Horizon Palette (Factor 1 + Factor 2 up to 5Y) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full space-y-3">
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  Ratio Palette
                </h2>
                <p className="text-[11px] text-slate-400">Click any metric to append to query</p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {filteredPaletteMetrics.length} metrics
              </span>
            </div>

            {/* Search Palette */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={paletteSearch}
                onChange={(e) => setPaletteSearch(e.target.value)}
                placeholder="Search ratios (e.g. roce, sales, debt)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1 shrink-0">
              {CATEGORY_TABS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setPaletteCategory(cat.id)}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    paletteCategory === cat.id
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Metric Catalog Items with Horizon Chips (Capped to 5Y max) */}
            <div className="flex-1 min-h-0 max-h-[290px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 no-scrollbar">
            {loadingMetrics ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-blue-500" />
                Loading authentic metrics catalog...
              </div>
            ) : filteredPaletteMetrics.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No ratios matching your search.
              </div>
            ) : (
              filteredPaletteMetrics.map((metric) => (
                <div key={metric.key} className="pt-2 group/metric">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleInsertPaletteMetric(metric, "latest")}
                      className="text-left font-semibold text-xs text-slate-800 hover:text-blue-600 transition-colors cursor-pointer flex-1"
                    >
                      {metric.name}
                    </button>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold shrink-0">
                      {metric.unit}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {metric.description}
                  </p>

                  {/* 2-Factor Horizon Options (Strictly 1Y, 3Y, 5Y - authentic DhanHQ depth) */}
                  {metric.supports_timeframe && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Horizon:</span>
                      {metric.timeframes.map((tf) => (
                        <button
                          key={tf}
                          onClick={() => handleInsertPaletteMetric(metric, tf)}
                          className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 transition-colors cursor-pointer"
                          title={`Insert ${metric.name} (${tf.toUpperCase()})`}
                        >
                          {tf.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>

      {/* 3. Live Results Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Results Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 font-bold">
              <BarChart3 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                Matching Equities
                {queryResponse && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {queryResponse.total.toLocaleString()} Qualified
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {queryResponse
                  ? `Evaluated in ${queryResponse.execution_ms} ms across 5,092 BSE/NSE stocks with strict data depth.`
                  : "Execute a query to view qualified stocks."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Horizontal Scroll Navigation Buttons */}
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50 shadow-2xs">
              <button
                onClick={() => scrollTable("left")}
                className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                title="Scroll Table Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold text-slate-400 px-1 select-none">
                Scroll
              </span>
              <button
                onClick={() => scrollTable("right")}
                className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                title="Scroll Table Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {queryResponse && queryResponse.stocks.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer"
                title="Download CSV export of qualified stocks"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Results Table View with Horizontal Scroll & Sticky Instrument Column */}
        <div ref={tableContainerRef} className="overflow-x-auto scroll-smooth">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {/* 1. Common: Instrument (Sticky Left) */}
                <th
                  onClick={() => handleSort("symbol")}
                  className="py-2.5 px-3 whitespace-nowrap cursor-pointer hover:text-slate-800 select-none sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                >
                  Instrument {sortBy === "symbol" && (sortDir === "asc" ? "↑" : "↓")}
                </th>

                {/* 2. Common: Sector */}
                <th className="py-2.5 px-3 whitespace-nowrap">Sector</th>

                {/* 3. Common: NSE (₹) */}
                <th
                  onClick={() => handleSort("nse_ltp")}
                  className="py-2.5 px-3 text-right whitespace-nowrap cursor-pointer hover:text-slate-800 select-none"
                >
                  NSE (₹) {sortBy === "nse_ltp" && (sortDir === "asc" ? "↑" : "↓")}
                </th>

                {/* 4. Common: BSE (₹) */}
                <th
                  onClick={() => handleSort("bse_ltp")}
                  className="py-2.5 px-3 text-right whitespace-nowrap cursor-pointer hover:text-slate-800 select-none"
                >
                  BSE (₹) {sortBy === "bse_ltp" && (sortDir === "asc" ? "↑" : "↓")}
                </th>

                {/* Dynamic Additional Columns based on query selection */}
                {activeDynamicColumns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="py-2.5 px-3 text-right whitespace-nowrap cursor-pointer hover:text-slate-800 select-none transition-colors"
                  >
                    {col.header} {sortBy === col.key && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                ))}

                {/* Final Action Column */}
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {running ? (
                <tr>
                  <td
                    colSpan={5 + activeDynamicColumns.length}
                    className="py-16 text-center text-slate-400"
                  >
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span className="font-semibold text-slate-600">
                      Evaluating query across 5,092 equities...
                    </span>
                  </td>
                </tr>
              ) : !queryResponse || queryResponse.stocks.length === 0 ? (
                <tr>
                  <td
                    colSpan={5 + activeDynamicColumns.length}
                    className="py-16 text-center text-slate-400"
                  >
                    <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No matching equities found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Try relaxing your criteria or testing one of the preset strategies above.
                    </p>
                  </td>
                </tr>
              ) : (
                queryResponse.stocks.map((stock) => {
                  const nseVal = stock.nse_ltp ?? stock.ltp ?? 0;
                  const bseVal = stock.bse_ltp ?? stock.ltp ?? 0;
                  const chg = stock.change_pct ?? 0;
                  const isPos = chg >= 0;

                  return (
                    <tr
                      key={stock.symbol}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onSelectStock?.(stock.symbol)}
                    >
                      {/* 1. Common: Instrument (Sticky Left) */}
                      <td className="py-2 px-3 sticky left-0 bg-white group-hover:bg-slate-50/95 transition-colors z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                            {stock.symbol.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                {stock.symbol}
                              </span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 shrink-0">
                                {stock.bse_ltp && stock.nse_ltp ? "NSE+BSE" : "NSE"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium whitespace-normal leading-tight">
                              {stock.name || stock.symbol}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Common: Sector */}
                      <td className="py-2 px-3 whitespace-nowrap min-w-[180px]">
                        <span className="text-[11px] text-slate-700 font-medium">
                          {stock.sector || "General"}
                        </span>
                      </td>

                      {/* 3. Common: NSE (₹) */}
                      <td className="py-2 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        {nseVal > 0 ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-semibold text-slate-900">
                              ₹{nseVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1 py-0.2 rounded font-mono ${
                                isPos ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {isPos ? "+" : ""}
                              {chg.toFixed(2)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-normal">NA</span>
                        )}
                      </td>

                      {/* 4. Common: BSE (₹) */}
                      <td className="py-2 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        {bseVal > 0 ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-semibold text-slate-900">
                              ₹{bseVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {stock.spread_pct && Math.abs(stock.spread_pct) > 0 ? (
                              <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1 py-0.2 rounded">
                                +{stock.spread_pct.toFixed(2)}%
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-normal">NA</span>
                        )}
                      </td>

                      {/* Dynamic Additional Columns based on selection */}
                      {activeDynamicColumns.map((col) => (
                        <td
                          key={col.key}
                          className="py-2 px-3 text-right font-mono tabular-nums whitespace-nowrap text-xs"
                        >
                          {col.render(stock)}
                        </td>
                      ))}

                      {/* Final Action Column */}
                      <td className="py-2 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectStock?.(stock.symbol)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                        >
                          <span>Analyze</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {queryResponse && queryResponse.total > pageSize && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, queryResponse.total)} of {queryResponse.total.toLocaleString()} stocks
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRunQuery(query, page - 1, sortBy, sortDir)}
                disabled={page <= 1 || running}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700">
                Page {page} of {Math.ceil(queryResponse.total / pageSize)}
              </span>
              <button
                onClick={() => handleRunQuery(query, page + 1, sortBy, sortDir)}
                disabled={page >= Math.ceil(queryResponse.total / pageSize) || running}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Save Custom Portfolio Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Save className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">Save as Custom Portfolio</h3>
              </div>
              <button
                onClick={() => setSaveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Portfolio Name
                </label>
                <input
                  type="text"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  placeholder="e.g. 5Y Quality Moats, Low PE Compounders"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={portfolioDesc}
                  onChange={(e) => setPortfolioDesc(e.target.value)}
                  rows={2}
                  placeholder="Describe the thesis or strategy behind this screener..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-mono text-slate-700 break-words">
                <span className="font-bold font-sans text-slate-500 block mb-1 text-[10px] uppercase">
                  Saved Screener Formula:
                </span>
                {query}
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePortfolio}
                disabled={savingPortfolio || !portfolioName.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {savingPortfolio ? "Saving..." : "Create Portfolio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
