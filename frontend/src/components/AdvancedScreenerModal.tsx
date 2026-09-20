"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Sparkles,
  Play,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Code,
  Search,
  ArrowLeft,
  Filter,
  Copy,
  Check,
  Zap,
  Layers
} from "lucide-react";
import {
  fetchScreenerMetrics,
  fetchCustomFormulas,
  saveCustomFormula,
  deleteCustomFormula,
  evaluateScreenerQuery,
  createCustomPortfolio,
  updateCustomPortfolio
} from "@/services/api";
import { ScreenerMetric } from "@/types";
import { PRESET_STRATEGIES, APEX_DISCIPLINES } from "@/constants/presetStrategies";

interface AdvancedScreenerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToUniverse?: (formula: string) => void;
  onSelectStock?: (symbol: string) => void;
  onPortfolioCreated?: (portfolioId: string) => void;
  initialFormula?: string;
  editPortfolioId?: string;
  editPortfolioName?: string;
  editPortfolioDesc?: string;
  totalStocks?: number;
}

const QUICK_STARTER_FILTERS = [
  { label: "Market Cap > ₹1,000 Cr", expression: "Market capitalization > 1000", metric: "Market capitalization" },
  { label: "ROCE > 15%", expression: "Return on capital employed > 15", metric: "Return on capital employed" },
  { label: "Low Debt (D/E < 0.5)", expression: "Debt to equity < 0.5", metric: "Debt to equity" },
  { label: "3Y Sales CAGR > 15%", expression: "Sales growth 3Years > 15", metric: "Sales growth 3Years" },
  { label: "Positive Free Cash Flow", expression: "Free cash flow > 0", metric: "Free cash flow" },
  { label: "P/E < 25", expression: "Price to earnings < 25", metric: "Price to earnings" }
];

const CATEGORY_TABS = [
  { id: "ALL", label: "All Indicators" },
  { id: "CUSTOM", label: "⭐ My Formulas" },
  { id: "Valuation", label: "Valuation" },
  { id: "Profitability", label: "Profitability" },
  { id: "Growth", label: "Growth" },
  { id: "Balance Sheet", label: "Balance Sheet" },
  { id: "Cash Flows", label: "Cash Flows" },
  { id: "Microstructure", label: "Microstructure" },
  { id: "Momentum", label: "Momentum & Trend" },
  { id: "Institutional", label: "Institutional & Float" },
  { id: "Solvency", label: "Solvency & Coverage" },
  { id: "Dividends", label: "Dividends" }
];

export interface CustomFormulaItem {
  id: string;
  name: string;
  expression: string;
  description?: string;
  unit?: string;
  created_at?: string;
}

export const AdvancedScreenerModal: React.FC<AdvancedScreenerModalProps> = ({
  isOpen,
  onClose,
  onApplyToUniverse,
  onPortfolioCreated,
  initialFormula = "",
  editPortfolioId,
  editPortfolioName = "",
  editPortfolioDesc = "",
  totalStocks = 5092
}) => {
  const [query, setQuery] = useState<string>(initialFormula || "");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [metricsCatalog, setMetricsCatalog] = useState<ScreenerMetric[]>([]);
  const [customFormulas, setCustomFormulas] = useState<CustomFormulaItem[]>([]);
  const [running, setRunning] = useState<boolean>(false);
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [portfolioName, setPortfolioName] = useState<string>(editPortfolioName || "");
  const [portfolioDesc, setPortfolioDesc] = useState<string>(editPortfolioDesc || "");
  const [savingPortfolio, setSavingPortfolio] = useState<boolean>(false);

  // Auxiliary Drawer Mode: null (closed, clean/minimal single-column view), "palette", "create_formula", or "presets"
  const [drawerMode, setDrawerMode] = useState<"palette" | "create_formula" | "presets" | null>(null);
  const [presetCategory, setPresetCategory] = useState<string>("ALL");
  const [newFormulaName, setNewFormulaName] = useState<string>("");
  const [newFormulaExpression, setNewFormulaExpression] = useState<string>("");
  const [formulaMetricSearch, setFormulaMetricSearch] = useState<string>("");
  const [formulaValidationMsg, setFormulaValidationMsg] = useState<{ status: "success" | "error"; text: string } | null>(null);
  const [savingCustomFormula, setSavingCustomFormula] = useState<boolean>(false);

  // Palette State
  const [paletteCategory, setPaletteCategory] = useState<string>("ALL");
  const [paletteSearch, setPaletteSearch] = useState<string>("");
  const [copiedFormula, setCopiedFormula] = useState<boolean>(false);
  const [customYearMetric, setCustomYearMetric] = useState<string | null>(null);
  const [customYearInput, setCustomYearInput] = useState<string>("");

  // Error Diagnostic State
  interface ScreenerErrorDetails {
    message: string;
    type?: string;
    problem_token?: string;
    suggestion?: string;
    suggestion_key?: string;
    hint?: string;
  }
  const [errorDetails, setErrorDetails] = useState<ScreenerErrorDetails | null>(null);

  // Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState<Array<{
    label: string;
    token: string;
    category?: string;
    unit?: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number>(0);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Formula Studio Autocomplete State
  const [formulaSuggestions, setFormulaSuggestions] = useState<Array<{
    label: string;
    token: string;
    category?: string;
    unit?: string;
  }>>([]);
  const [showFormulaSuggestions, setShowFormulaSuggestions] = useState<boolean>(false);
  const [activeFormulaSuggestionIdx, setActiveFormulaSuggestionIdx] = useState<number>(0);
  const formulaTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset or initialize query when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery(initialFormula?.trim() || "");
      setErrorDetails(null);
      setShowSuggestions(false);
      setDrawerMode(null); // Clean and minimal single view by default
    }
  }, [isOpen, initialFormula]);

  // Global Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (drawerMode !== null) {
          setDrawerMode(null); // First escape collapses drawer
        } else if (isOpen) {
          onClose(); // Second escape closes modal
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, drawerMode, onClose]);

  // Fetch metrics catalog & saved custom formulas
  useEffect(() => {
    fetchScreenerMetrics()
      .then((res) => {
        if (res?.metrics) {
          setMetricsCatalog(res.metrics);
        }
      })
      .catch((err) => console.error("Failed to fetch screener catalog", err));

    fetchCustomFormulas()
      .then((res) => {
        if (res?.formulas) {
          setCustomFormulas(res.formulas);
        }
      })
      .catch((err) => console.error("Failed to fetch custom formulas", err));
  }, []);

  // Sets Insertion Operations (AND / OR logic provided between sets)
  const handleInsertSetBlock = (connector?: "AND" | "OR") => {
    const trimmed = query.trim();
    if (!trimmed) {
      setQuery("( )");
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(2, 2);
        }
      }, 10);
      return;
    }

    const conn = connector || "AND";
    const endsWithConn = /(AND|OR)$/i.test(trimmed);
    let newQuery = "";

    if (endsWithConn) {
      newQuery = `${trimmed} ( )`;
    } else {
      if (!trimmed.startsWith("(") && trimmed.includes(" AND ")) {
        newQuery = `(${trimmed}) ${conn} ( )`;
      } else {
        newQuery = `${trimmed} ${conn} ( )`;
      }
    }

    setQuery(newQuery);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorTarget = newQuery.length - 2;
        textareaRef.current.setSelectionRange(cursorTarget, cursorTarget);
      }
    }, 10);
  };

  const handleWrapSelectionInSet = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    if (start !== end) {
      const selected = query.slice(start, end);
      const newQuery = `${query.slice(0, start)}(${selected})${query.slice(end)}`;
      setQuery(newQuery);
    } else if (query.trim()) {
      setQuery(`(${query.trim()})`);
    }
  };

  // Add quick starter filter
  const handleAddStarterFilter = (starter: { expression: string; metric: string }) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setQuery(starter.expression);
    } else {
      const regex = new RegExp(starter.metric.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (!regex.test(trimmed)) {
        setQuery(`${trimmed} AND ${starter.expression}`);
      }
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Add metric from palette directly into active query
  const handleAddMetricToQuery = (metricName: string, timeframe?: string, defaultVal = "15") => {
    const token = timeframe ? `${metricName} ${timeframe}` : metricName;
    const ruleExpr = `${token} > ${defaultVal}`;
    const trimmed = query.trim();
    if (!trimmed) {
      setQuery(ruleExpr);
    } else {
      const endsWithOp = /([><=+\-*/]|AND|OR|\()$/i.test(trimmed);
      if (endsWithOp) {
        setQuery(`${trimmed} ${ruleExpr}`);
      } else {
        setQuery(`${trimmed} AND ${ruleExpr}`);
      }
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Insert token in textarea
  const handleInsertToken = (token: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setQuery(token);
    } else {
      setQuery(`${trimmed} ${token} `);
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleInsertCustomYear = (metricName: string, year: string) => {
    const cleanYear = year.trim().replace(/^FY/i, "");
    if (!cleanYear) return;
    handleAddMetricToQuery(metricName, `FY${cleanYear}`);
    setCustomYearMetric(null);
    setCustomYearInput("");
  };

  // Execute query and apply to universe
  const handleRunAndApply = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setErrorDetails({
        message: "Please enter a filter condition or pick a starter criteria.",
        hint: "Try an expression like: (Return on capital employed > 15) AND (Debt to equity < 0.5)"
      });
      return;
    }

    setRunning(true);
    setErrorDetails(null);

    try {
      const res = await evaluateScreenerQuery(trimmed, 1, 10);
      if (res.success) {
        if (onApplyToUniverse) {
          onApplyToUniverse(trimmed);
        }
        onClose();
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

  // Autocomplete token extraction
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart || 0;
    setQuery(val);
    setCursorPosition(pos);

    const textBeforeCursor = val.slice(0, pos);
    const words = textBeforeCursor.split(/[\s,()><=+\-*/]+/);
    const currentWord = words[words.length - 1]?.trim().toLowerCase() || "";

    if (currentWord.length >= 1) {
      const matches: Array<{
        label: string;
        token: string;
        category?: string;
        unit?: string;
      }> = [];

      metricsCatalog.forEach((m) => {
        const nameMatch = m.name.toLowerCase().includes(currentWord);
        const keyMatch = m.key.toLowerCase().includes(currentWord);
        if (nameMatch || keyMatch) {
          matches.push({
            label: m.name,
            token: m.name,
            category: m.category,
            unit: m.unit
          });
        }
      });

      customFormulas.forEach((f) => {
        if (f.name.toLowerCase().includes(currentWord)) {
          matches.unshift({
            label: `⭐ ${f.name} (Custom Formula)`,
            token: f.name,
            category: "Custom Formula"
          });
        }
      });

      setSuggestions(matches.slice(0, 8));
      setShowSuggestions(matches.length > 0);
      setActiveSuggestionIdx(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunAndApply();
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIdx((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      handleInsertSuggestion(suggestions[activeSuggestionIdx].token);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleInsertSuggestion = (token: string) => {
    const textBeforeCursor = query.slice(0, cursorPosition);
    const textAfterCursor = query.slice(cursorPosition);
    const words = textBeforeCursor.split(/[\s,()><=+\-*/]+/);
    const lastWord = words[words.length - 1] || "";
    const prefix = textBeforeCursor.slice(0, textBeforeCursor.length - lastWord.length);

    const newQuery = `${prefix}${token} ${textAfterCursor}`;
    setQuery(newQuery);
    setShowSuggestions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = prefix.length + token.length + 1;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  // Filter metrics in palette
  const filteredPaletteMetrics = useMemo(() => {
    return metricsCatalog.filter((m) => {
      const matchCat = paletteCategory === "ALL" || m.category === paletteCategory;
      const matchSearch =
        !paletteSearch.trim() ||
        m.name.toLowerCase().includes(paletteSearch.toLowerCase()) ||
        m.key.toLowerCase().includes(paletteSearch.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(paletteSearch.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [metricsCatalog, paletteCategory, paletteSearch]);

  const filteredCustomFormulas = useMemo(() => {
    return customFormulas.filter((f) => {
      if (!paletteSearch.trim()) return true;
      return (
        f.name.toLowerCase().includes(paletteSearch.toLowerCase()) ||
        f.expression.toLowerCase().includes(paletteSearch.toLowerCase())
      );
    });
  }, [customFormulas, paletteSearch]);

  // Statement line items for formula studio
  const statementLineItems = useMemo(() => {
    return metricsCatalog.filter(
      (m) =>
        m.category === "Profit & Loss" ||
        m.category === "Balance Sheet" ||
        m.category === "Cash Flows" ||
        m.category === "Operating Efficiency" ||
        m.category === "Solvency" ||
        m.category === "Working Capital & Cycle"
    );
  }, [metricsCatalog]);

  const matchingFormulaMetrics = useMemo(() => {
    if (!formulaMetricSearch.trim()) return statementLineItems;
    const q = formulaMetricSearch.toLowerCase();
    return statementLineItems.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.key.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
    );
  }, [statementLineItems, formulaMetricSearch]);

  // Save custom formula
  const handleSaveCustomFormula = async () => {
    if (!newFormulaName.trim() || !newFormulaExpression.trim()) {
      setFormulaValidationMsg({
        status: "error",
        text: "Both Formula Name and Mathematical Expression are required."
      });
      return;
    }
    setSavingCustomFormula(true);
    setFormulaValidationMsg(null);
    try {
      const res = await saveCustomFormula({
        name: newFormulaName.trim(),
        expression: newFormulaExpression.trim()
      });
      if (res?.formula) {
        const savedFormula = res.formula;
        setCustomFormulas((prev) => [savedFormula, ...prev.filter((f) => f.id !== savedFormula.id)]);

        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
          setQuery(savedFormula.name);
        } else {
          setQuery(`${trimmedQuery} AND ${savedFormula.name}`);
        }

        setDrawerMode("palette");
        setPaletteCategory("CUSTOM");
        setPaletteSearch("");
        setNewFormulaName("");
        setNewFormulaExpression("");
        setFormulaMetricSearch("");
      }
    } catch (e: any) {
      setFormulaValidationMsg({
        status: "error",
        text: e.message || "Failed to save formula"
      });
    } finally {
      setSavingCustomFormula(false);
    }
  };

  const handleDeleteCustomFormula = async (formulaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this custom formula?")) return;
    try {
      await deleteCustomFormula(formulaId);
      setCustomFormulas((prev) => prev.filter((f) => f.id !== formulaId));
    } catch (err: any) {
      alert("Error deleting formula: " + err.message);
    }
  };

  // Save Portfolio
  const handleSavePortfolio = async () => {
    if (!portfolioName.trim()) {
      alert("Please provide a name for this portfolio.");
      return;
    }
    setSavingPortfolio(true);
    try {
      if (editPortfolioId) {
        await updateCustomPortfolio(editPortfolioId, {
          name: portfolioName.trim(),
          description: portfolioDesc.trim(),
          formula: query.trim()
        });
      } else {
        const res = await createCustomPortfolio({
          name: portfolioName.trim(),
          description: portfolioDesc.trim() || `Automated screener: ${query.slice(0, 60)}...`,
          formula: query.trim()
        });
        if (onPortfolioCreated && res?.portfolio?.id) {
          onPortfolioCreated(res.portfolio.id);
        }
      }
      setSaveModalOpen(false);
      alert("Portfolio saved successfully!");
    } catch (e: any) {
      alert("Failed to save portfolio: " + e.message);
    } finally {
      setSavingPortfolio(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full ${
          drawerMode ? "max-w-7xl h-[90vh]" : "max-w-4xl h-[84vh]"
        } flex flex-col overflow-hidden text-slate-900 transition-all duration-300`}
      >
        {/* HEADER BAR */}
        <div className="h-16 px-5 sm:px-6 border-b border-slate-200/80 bg-white flex items-center justify-between gap-4 shrink-0">
          {/* Left: Brand / Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                  Financial Screener Studio
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {(totalStocks || 5092).toLocaleString()} Equities
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Ind-AS XBRL corporate filings & live order book quantitative engine
              </p>
            </div>
          </div>

          {/* Right: Drawer Navigation Segmented Control + Clear Single View Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Prominent Back to Single View Toggle (when drawer is open) */}
            {drawerMode && (
              <button
                type="button"
                onClick={() => setDrawerMode(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Return to Single View (Screenshot 1)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Single View</span>
              </button>
            )}

            <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 shadow-xs">
              <button
                type="button"
                onClick={() => setDrawerMode(drawerMode === "palette" ? null : "palette")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  drawerMode === "palette"
                    ? "bg-white text-blue-700 shadow-xs font-bold ring-1 ring-blue-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Browse 192+ fundamental & microstructure metrics"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Ratio Palette</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-700 font-mono font-bold">
                  {metricsCatalog.length || 192}
                </span>
                {drawerMode === "palette" && (
                  <X className="w-3 h-3 text-slate-400 hover:text-slate-700 ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setDrawerMode(drawerMode === "presets" ? null : "presets")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  drawerMode === "presets"
                    ? "bg-white text-indigo-700 shadow-xs font-bold ring-1 ring-indigo-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Browse institutional preset strategies"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Presets</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-700 font-mono font-bold">
                  {PRESET_STRATEGIES.length}
                </span>
                {drawerMode === "presets" && (
                  <X className="w-3 h-3 text-slate-400 hover:text-slate-700 ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setDrawerMode(drawerMode === "create_formula" ? null : "create_formula")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  drawerMode === "create_formula"
                    ? "bg-white text-purple-700 shadow-xs font-bold ring-1 ring-purple-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Build custom mathematical formula"
              >
                <Plus className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Custom Formula</span>
                {drawerMode === "create_formula" && (
                  <X className="w-3 h-3 text-slate-400 hover:text-slate-700 ml-0.5" />
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 border border-transparent hover:border-slate-200"
              title="Close Modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* WORKSPACE CONTENT */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 bg-slate-50/70 overflow-hidden">
          <div className={`grid gap-5 h-full min-h-0 ${drawerMode ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
            
            {/* LEFT COLUMN: SCREENER WORKSPACE (Visual rules removed, no "formula mode" label) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col h-full min-h-0 overflow-hidden shadow-xs">
              
              {/* TOP HEADER ROW: Clean Filter Criteria Subheader & Quick Add */}
              <div className="shrink-0 mb-2.5 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-blue-600" />
                      Filter Criteria
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      — Combine fundamental metrics, financial ratios, and condition sets
                    </span>
                  </div>
                </div>

                {/* Quick Add Inspiration Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-0.5 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Quick Add:
                  </span>
                  {QUICK_STARTER_FILTERS.map((f) => (
                    <button
                      key={f.label}
                      type="button"
                      onClick={() => handleAddStarterFilter(f)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200/80 hover:border-blue-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs group"
                    >
                      <Plus className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* MAIN SCREENER EDITOR SURFACE */}
              <div className="flex-1 min-h-[240px] flex flex-col rounded-xl overflow-hidden border border-slate-800 bg-[#0B0F19] shadow-xl relative focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 transition-all my-1">
                
                {/* Top Chrome Header: query file tab & live parser status */}
                <div className="h-9 px-3.5 bg-[#101726] border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0 select-none">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 font-mono text-[11px] font-medium flex items-center gap-1.5 border border-slate-700/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      query.indas
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                      Parser Ready
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    {query.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(query);
                          setCopiedFormula(true);
                          setTimeout(() => setCopiedFormula(false), 1500);
                        }}
                        className="px-2 py-0.5 rounded hover:bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                        title="Copy expression"
                      >
                        {copiedFormula ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedFormula ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                    {query.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          setSelectedPreset("");
                          setErrorDetails(null);
                        }}
                        className="px-2 py-0.5 rounded hover:bg-slate-800 text-[11px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Clear expression"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* CONDITION SETS TOOLBAR (AND / OR logic between 2 sets, add sets) */}
                <div className="px-3 py-1.5 bg-[#0F1624] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3 text-blue-400" />
                      Condition Sets:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleInsertSetBlock()}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                      title="Insert a new condition set: ( ... )"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Set ( ... )</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertSetBlock("AND")}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-indigo-950 hover:bg-indigo-700 text-indigo-300 hover:text-white border border-indigo-800/80 shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                      title="Append AND ( ... ) between sets"
                    >
                      <span>+ AND ( ... )</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertSetBlock("OR")}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-purple-950 hover:bg-purple-700 text-purple-300 hover:text-white border border-purple-800/80 shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                      title="Append OR ( ... ) between sets"
                    >
                      <span>+ OR ( ... )</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleWrapSelectionInSet}
                      className="px-2 py-1 rounded-md text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                      title="Wrap selection in ( ... )"
                    >
                      <span>( ) Wrap</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono hidden md:block">
                    <span>Group with <strong>( ... )</strong> &amp; connect sets with <strong>AND / OR</strong></span>
                  </div>
                </div>

                {/* Textarea with Line Numbers */}
                <div className="flex-1 flex min-h-0 relative">
                  <div className="w-10 py-3 bg-[#0B0F19] text-right pr-3 select-none font-mono text-xs text-slate-600 leading-relaxed border-r border-slate-800/50 shrink-0">
                    <div>1</div>
                    {query.includes("\n") &&
                      query.split("\n").slice(1).map((_, i) => (
                        <div key={i}>{i + 2}</div>
                      ))}
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type screening conditions like: (Return on capital employed > 15 AND Return on equity > 15) AND (Debt to equity < 0.5)..."
                    className="flex-1 p-3 bg-transparent text-emerald-300 font-mono text-xs sm:text-sm outline-none resize-none leading-relaxed placeholder:text-slate-600 selection:bg-blue-600/30 selection:text-white"
                    spellCheck={false}
                  />

                  {/* Autocomplete Suggestions Popup */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-12 top-10 z-40 w-80 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-100">
                      <div className="p-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Suggested Indicators</span>
                        <span className="text-[9px] text-slate-400 font-mono">Tab / Enter</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {suggestions.map((s, idx) => (
                          <div
                            key={s.token + idx}
                            onClick={() => handleInsertSuggestion(s.token)}
                            className={`p-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                              idx === activeSuggestionIdx ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span className="font-mono text-xs">{s.label}</span>
                            {s.unit && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono ml-2 shrink-0">
                                {s.unit}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* FULLY RESPONSIVE DOCKED OPERATOR RIBBON (Wraps properly without clipping in 2-column mode) */}
                <div className="min-h-12 py-2 px-3 bg-[#0E1524] border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Logic Group */}
                    <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 shrink-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Logic:</span>
                      {["AND", "OR", "NOT"].map((op) => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => handleInsertToken(op)}
                          className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-950/80 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-800/60 transition-colors cursor-pointer shadow-2xs"
                        >
                          {op}
                        </button>
                      ))}
                    </div>

                    {/* Sets / Parentheses Group */}
                    <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 shrink-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Sets:</span>
                      {["(", ")"].map((sym) => (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => handleInsertToken(sym)}
                          className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800/90 hover:bg-blue-600 text-blue-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer shadow-2xs"
                        >
                          {sym}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleInsertSetBlock()}
                        className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-950/80 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-800/60 transition-colors cursor-pointer shadow-2xs"
                        title="Insert empty set ( )"
                      >
                        ( )
                      </button>
                    </div>

                    {/* Compare Group */}
                    <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 shrink-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Compare:</span>
                      {[">", "<", ">=", "<=", "=="].map((sym) => (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => handleInsertToken(sym)}
                          className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800/90 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer shadow-2xs"
                        >
                          {sym}
                        </button>
                      ))}
                    </div>

                    {/* Math Group */}
                    <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 shrink-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Math:</span>
                      {["+", "-", "*", "/"].map((sym) => (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => handleInsertToken(sym)}
                          className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800/90 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer shadow-2xs"
                        >
                          {sym}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                    <span>Type metric name for autocomplete</span>
                  </div>
                </div>
              </div>

              {/* ERROR ALERT BOX */}
              {errorDetails && (
                <div className="shrink-0 mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-rose-950 text-xs">
                          {errorDetails.message}
                        </p>
                        {errorDetails.hint && (
                          <p className="text-[11px] text-rose-800 italic mt-0.5">
                            💡 Hint: {errorDetails.hint}
                          </p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setErrorDetails(null)} className="text-rose-400 hover:text-rose-700 p-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* BOTTOM ACTIONS BAR */}
              <div className="shrink-0 pt-3 mt-auto border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 text-slate-400 text-xs">
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-600 font-semibold shadow-2xs">
                      ⌘ / Ctrl + Enter
                    </kbd>
                    <span>to execute</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-600 font-semibold shadow-2xs">
                      Esc
                    </kbd>
                    <span>to close</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setSaveModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-all cursor-pointer hover:border-slate-300 active:scale-98"
                  >
                    <Save className="w-3.5 h-3.5 text-blue-600" />
                    <span>Save as Portfolio</span>
                  </button>

                  <button
                    onClick={handleRunAndApply}
                    disabled={running}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:opacity-95 shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                  >
                    <Play className={`w-3.5 h-3.5 ${running ? "animate-spin" : "fill-current"}`} />
                    <span>{running ? "Scanning Equities..." : "Run Screener & Apply Table"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: AUXILIARY DRAWER (Ratio Palette, Presets, Custom Formula) */}
            {drawerMode && (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col h-full min-h-0 overflow-hidden shadow-xs animate-in slide-in-from-right-4 duration-200">
                {drawerMode === "presets" ? (
                  /* 1. INSTITUTIONAL PRESETS DRAWER */
                  <div className="flex flex-col h-full min-h-0 overflow-hidden">
                    <div className="pb-3 border-b border-slate-100 shrink-0 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          Institutional Presets
                        </h3>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                          {PRESET_STRATEGIES.length} Presets
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDrawerMode(null)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Close drawer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Presets Categories */}
                    <div className="flex items-center gap-1.5 flex-wrap py-2.5 shrink-0 border-b border-slate-100">
                      {APEX_DISCIPLINES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setPresetCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                            presetCategory === cat
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Presets Cards List */}
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-3 py-3 pr-1">
                      {PRESET_STRATEGIES.filter((p) => presetCategory === "ALL" || p.category === presetCategory).map((strategy) => {
                        const isCurrentlyActive = query.trim() === strategy.query.trim();
                        return (
                          <div
                            key={strategy.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isCurrentlyActive
                                ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs"
                                : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">{strategy.name}</h4>
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                  {strategy.badge}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuery(strategy.query);
                                  setSelectedPreset(strategy.name);
                                  setErrorDetails(null);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                  isCurrentlyActive
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                                }`}
                              >
                                {isCurrentlyActive ? "✓ Loaded" : "Load Strategy"}
                              </button>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
                              {strategy.desc}
                            </p>
                            <div className="p-2.5 bg-slate-950 rounded-lg text-emerald-400 font-mono text-[11px] break-words leading-relaxed select-all">
                              {strategy.query}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : drawerMode === "create_formula" ? (
                  /* 2. CUSTOM FORMULA STUDIO */
                  <div className="flex flex-col h-full min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-purple-600" />
                          Custom Formula Studio
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDrawerMode(null)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Close drawer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Form fields */}
                    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto space-y-3 py-3 pr-1">
                      <div className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-xl shrink-0">
                        <p className="text-xs text-purple-900 leading-relaxed">
                          Build your own custom financial ratio. Once saved, it will be immediately available in your <strong>⭐ My Formulas</strong> palette and can be queried across all <strong>{(totalStocks || 5092).toLocaleString()} equities</strong>.
                        </p>
                      </div>

                      <div className="shrink-0">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Formula Name *
                        </label>
                        <input
                          type="text"
                          value={newFormulaName}
                          onChange={(e) => setNewFormulaName(e.target.value)}
                          placeholder="e.g. Owner Earnings Yield, CROCI, or Real Return"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden bg-white font-medium"
                        />
                      </div>

                      <div className="shrink-0 relative">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            Mathematical Expression *
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">Type metrics & operators</span>
                        </div>
                        <textarea
                          ref={formulaTextareaRef}
                          value={newFormulaExpression}
                          onChange={(e) => setNewFormulaExpression(e.target.value)}
                          placeholder="e.g. (Operating cash flow - Capex) / Market capitalization * 100"
                          rows={4}
                          className="w-full h-32 sm:h-36 px-3 py-2.5 text-xs font-mono border border-slate-800 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden bg-[#0B0F19] text-emerald-300 shadow-inner resize-none leading-relaxed"
                        />

                        {/* Quick Operator Insert Pills */}
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Insert:</span>
                          {["+", "-", "*", "/", "(", ")", ">", "<", ">=", "<=", "==", "AND", "OR"].map((op) => (
                            <button
                              key={op}
                              type="button"
                              onClick={() => setNewFormulaExpression((prev) => `${prev.trim()} ${op} `)}
                              className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 rounded border border-slate-200 transition-colors cursor-pointer"
                            >
                              {op}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Line Items Palette */}
                      <div className="flex-1 min-h-[140px] flex flex-col border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 shrink-0">
                          <span className="text-xs font-bold text-slate-700">Available Base Metrics</span>
                          <input
                            type="text"
                            value={formulaMetricSearch}
                            onChange={(e) => setFormulaMetricSearch(e.target.value)}
                            placeholder="Filter line items..."
                            className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-purple-500 outline-hidden w-44"
                          />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1 pt-1.5 max-h-36">
                          {matchingFormulaMetrics.map((item) => (
                            <div
                              key={item.key}
                              onClick={() => setNewFormulaExpression((prev) => `${prev.trim()} ${item.name} `)}
                              className="px-2.5 py-1.5 bg-white hover:bg-purple-50 border border-slate-200/80 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors group"
                            >
                              <div className="min-w-0 flex-1 truncate">
                                <span className="font-medium text-slate-800 group-hover:text-purple-700">{item.name}</span>
                                <span className="text-[10px] text-slate-400 ml-1.5">({item.category})</span>
                              </div>
                              <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {formulaValidationMsg && (
                        <div
                          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                            formulaValidationMsg.status === "success"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {formulaValidationMsg.status === "success" ? (
                            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          )}
                          <span>{formulaValidationMsg.text}</span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerMode(null);
                          setFormulaValidationMsg(null);
                        }}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingCustomFormula}
                        onClick={handleSaveCustomFormula}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-95 transition-all shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {savingCustomFormula ? "Saving..." : "Save & Add to Screener"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 3. RATIO PALETTE VIEW */
                  <div className="flex flex-col h-full min-h-0 overflow-hidden">
                    <div className="pb-3 border-b border-slate-100 shrink-0 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-blue-600" />
                          Ratio Palette
                        </h3>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                          {metricsCatalog.length || 192} Metrics
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDrawerMode(null)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                        title="Close drawer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Search & Category Filter */}
                    <div className="space-y-2 py-2.5 shrink-0">
                      <div className="relative flex items-center">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={paletteSearch}
                          onChange={(e) => setPaletteSearch(e.target.value)}
                          placeholder="Search across all financial & microstructure metrics..."
                          className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                        />
                        {paletteSearch && (
                          <button
                            onClick={() => setPaletteSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setPaletteCategory("ALL");
                            setPaletteSearch("");
                          }}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                            paletteCategory === "ALL" && !paletteSearch
                              ? "bg-slate-900 text-white shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Available ({metricsCatalog.length || "192"})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaletteCategory(paletteCategory === "CUSTOM" ? "ALL" : "CUSTOM")}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                            paletteCategory === "CUSTOM"
                              ? "bg-amber-500 text-white shadow-xs font-bold"
                              : "bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100/80"
                          }`}
                        >
                          ⭐ Saved ({customFormulas.length})
                        </button>
                        <div className="flex-1 min-w-[140px]">
                          <select
                            value={["ALL", "CUSTOM"].includes(paletteCategory) ? "" : paletteCategory}
                            onChange={(e) => {
                              if (e.target.value) {
                                setPaletteCategory(e.target.value);
                              }
                            }}
                            className="w-full text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                          >
                            <option value="">📂 More Categories...</option>
                            {CATEGORY_TABS.filter((c) => c.id !== "ALL" && c.id !== "CUSTOM").map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {!["ALL", "CUSTOM"].includes(paletteCategory) && (
                          <button
                            type="button"
                            onClick={() => setPaletteCategory("ALL")}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-600 hover:bg-slate-300 font-medium"
                          >
                            Reset Category
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metrics List Container */}
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2 py-1 pr-1">
                      {paletteCategory === "CUSTOM" ? (
                        filteredCustomFormulas.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            <Code className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p>No custom formulas saved yet.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setDrawerMode("create_formula");
                              }}
                              className="mt-2 text-blue-600 hover:underline font-semibold"
                            >
                              + Create your first custom formula
                            </button>
                          </div>
                        ) : (
                          filteredCustomFormulas.map((f) => (
                            <div
                              key={f.id}
                              className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 transition-colors flex items-center justify-between gap-2 group"
                            >
                              <div
                                className="min-w-0 flex-1 cursor-pointer"
                                onClick={() => handleAddMetricToQuery(f.name)}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-xs text-amber-950">
                                    {f.name}
                                  </span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">
                                    FORMULA
                                  </span>
                                </div>
                                <p className="text-[11px] font-mono text-slate-500 break-all mt-0.5">
                                  {f.expression}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleAddMetricToQuery(f.name)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer"
                                >
                                  + Add
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteCustomFormula(f.id, e)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                  title="Delete formula"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )
                      ) : (
                        filteredPaletteMetrics.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p>No metrics match &ldquo;{paletteSearch}&rdquo;</p>
                            <button
                              type="button"
                              onClick={() => {
                                setPaletteSearch("");
                                setPaletteCategory("ALL");
                              }}
                              className="mt-2 text-blue-600 hover:underline font-semibold"
                            >
                              Reset filters
                            </button>
                          </div>
                        ) : (
                          filteredPaletteMetrics.map((ind) => (
                            <div
                              key={ind.key}
                              className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/30 transition-all flex flex-col gap-1.5 group shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div
                                  className="min-w-0 flex-1 cursor-pointer"
                                  onClick={() => handleAddMetricToQuery(ind.name)}
                                >
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-xs text-slate-800 group-hover:text-blue-900">
                                      {ind.name}
                                    </span>
                                    {ind.category && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                                        {ind.category}
                                      </span>
                                    )}
                                    {ind.unit && (
                                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-blue-50 text-blue-600">
                                        {ind.unit}
                                      </span>
                                    )}
                                  </div>
                                  {ind.description && (
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                      {ind.description}
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddMetricToQuery(ind.name)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer shrink-0"
                                >
                                  + Add
                                </button>
                              </div>

                              {/* Multi-Year / Horizon Quick Chips */}
                              {ind.timeframes && ind.timeframes.length > 0 && (
                                <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100/60 flex-wrap">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase mr-0.5">Horizons:</span>
                                  {ind.timeframes.map((h) => (
                                    <button
                                      key={h}
                                      type="button"
                                      onClick={() => handleAddMetricToQuery(ind.name, h)}
                                      className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-slate-50 hover:bg-blue-100 text-slate-600 hover:text-blue-800 border border-slate-200 transition-colors cursor-pointer"
                                      title={`Insert ${ind.name} ${h}`}
                                    >
                                      {h}
                                    </button>
                                  ))}

                                  {customYearMetric !== ind.name ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCustomYearMetric(ind.name);
                                        setCustomYearInput("");
                                      }}
                                      className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-slate-50 hover:bg-purple-100 text-slate-500 hover:text-purple-800 border border-slate-200 transition-colors cursor-pointer"
                                      title="Insert custom financial year like FY2023 or FY2021"
                                    >
                                      + FY...
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-1 bg-purple-50 p-0.5 rounded-lg border border-purple-200">
                                      <input
                                        type="text"
                                        value={customYearInput}
                                        onChange={(e) => setCustomYearInput(e.target.value)}
                                        placeholder="e.g. 2023"
                                        className="w-16 px-1.5 py-0.5 text-[10px] font-mono bg-white border border-purple-300 rounded outline-hidden"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && customYearInput.trim()) {
                                            handleInsertCustomYear(ind.name, customYearInput);
                                          } else if (e.key === "Escape") {
                                            setCustomYearMetric(null);
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleInsertCustomYear(ind.name, customYearInput)}
                                        disabled={!customYearInput.trim()}
                                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer"
                                      >
                                        Insert
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCustomYearMetric(null);
                                          setCustomYearInput("");
                                        }}
                                        className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                                        title="Cancel"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Save Portfolio Modal Overlay */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Save className="w-4 h-4 text-blue-600" />
                {editPortfolioId ? "Update Portfolio" : "Save as Tracking Portfolio"}
              </h3>
              <button
                onClick={() => setSaveModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Portfolio Name *
                </label>
                <input
                  type="text"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  placeholder="e.g. Quality Moat Compounders"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={portfolioDesc}
                  onChange={(e) => setPortfolioDesc(e.target.value)}
                  rows={2}
                  placeholder="Brief summary of investment thesis..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 break-words max-h-24 overflow-y-auto">
                {query}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePortfolio}
                disabled={savingPortfolio}
                className="px-4.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingPortfolio ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
