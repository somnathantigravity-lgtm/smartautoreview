"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  Check,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  Sparkles,
  Trash2,
  Lock,
  Plus
} from "lucide-react";
import {
  STOCK_COLUMNS_CATALOG,
  STOCK_COLUMN_CATEGORIES,
  COLUMN_PRESETS,
  DEFAULT_COLUMN_KEYS,
  CORE_PERMANENT_COLUMNS,
  StockColumnDefinition
} from "@/constants/stockColumnCatalog";

interface ColumnCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColumns: string[];
  onChangeColumns: (newCols: string[]) => void;
  onResetDefaults: () => void;
}

const CORE_KEYS = new Set(CORE_PERMANENT_COLUMNS.map((c) => c.key));

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  "Profit & Loss": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "📑" },
  "Balance Sheet": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "🏛️" },
  "Cash Flows": { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", icon: "💰" },
  "Return Ratios": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", icon: "📊" },
  "Working Capital & Cycle": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", icon: "🔄" },
  "Solvency & Forensics": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: "🛡️" },
  "Multi-Year & 10Y Horizons": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: "📈" },
  "Valuation & Multiples": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "⚖️" },
  "Market & Quotes": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: "⚡" },
  "Shareholding Pattern": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: "👥" }
};

export const ColumnCustomizerModal: React.FC<ColumnCustomizerModalProps> = ({
  isOpen,
  onClose,
  selectedColumns,
  onChangeColumns,
  onResetDefaults
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Calculate count of items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STOCK_COLUMN_CATEGORIES.forEach((cat) => {
      counts[cat] = STOCK_COLUMNS_CATALOG.filter((c) => c.category === cat).length;
    });
    return counts;
  }, []);

  const filteredColumns = useMemo(() => {
    return STOCK_COLUMNS_CATALOG.filter((col) => {
      const matchCat = selectedCategory === "ALL" || col.category === selectedCategory;
      const matchSearch =
        !search ||
        col.header.toLowerCase().includes(search.toLowerCase()) ||
        (col.shortHeader && col.shortHeader.toLowerCase().includes(search.toLowerCase())) ||
        col.key.toLowerCase().includes(search.toLowerCase()) ||
        (col.description && col.description.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  if (!isOpen) return null;

  const toggleColumn = (key: string) => {
    if (CORE_KEYS.has(key)) return;
    if (selectedColumns.includes(key)) {
      onChangeColumns(selectedColumns.filter((k) => k !== key && !CORE_KEYS.has(k)));
    } else {
      onChangeColumns([...selectedColumns.filter((k) => !CORE_KEYS.has(k)), key]);
    }
  };

  const removeColumn = (key: string) => {
    if (CORE_KEYS.has(key)) return;
    onChangeColumns(selectedColumns.filter((k) => k !== key));
  };

  const selectAllFiltered = () => {
    const keysToAdd = filteredColumns.filter((c) => !CORE_KEYS.has(c.key)).map((c) => c.key);
    const combined = Array.from(new Set([...selectedColumns.filter((k) => !CORE_KEYS.has(k)), ...keysToAdd]));
    onChangeColumns(combined);
  };

  // Only the custom additional columns selected by user (excluding the 6 locked core columns)
  const activeColumnDefs = selectedColumns
    .filter((k) => !CORE_KEYS.has(k))
    .map((k) => STOCK_COLUMNS_CATALOG.find((c) => c.key === k))
    .filter(Boolean) as StockColumnDefinition[];

  // Find matching preset if any
  const currentPreset = COLUMN_PRESETS.find(
    (p) =>
      p.columns.length === selectedColumns.length &&
      p.columns.every((c) => selectedColumns.includes(c))
  );

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-slate-50 via-white to-blue-50/40">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Customize Additional Columns
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-50 text-blue-700 font-bold border border-blue-200/80">
                  {selectedColumns.length} Active Selected
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Default Core Columns: <strong className="text-slate-800 font-semibold">Instrument · NSE (₹) · BSE (₹) · Spread (%) · Change (%) · Volume</strong> (permanently locked in table)
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Quick View Presets Strip */}
        <div className="px-6 py-2.5 bg-slate-50/70 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>1-Click View Bundles:</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Instant workflow presets with one click
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {COLUMN_PRESETS.map((preset) => {
              const isMatch = currentPreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChangeColumns(preset.columns)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                    isMatch
                      ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/20 font-bold"
                      : "bg-white hover:bg-blue-50/50 hover:border-blue-300 text-slate-700 border-slate-200/90"
                  }`}
                  title={preset.description}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isMatch ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {preset.columns.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Core Permanent Default Columns (Cannot be removed) */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200/80 shrink-0 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Default Permanent Columns (Cannot be removed):
            </span>
            {CORE_PERMANENT_COLUMNS.map((col) => (
              <span
                key={col.key}
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 flex items-center gap-1 shadow-2xs"
              >
                <span>{col.header}</span>
                <Lock className="w-2.5 h-2.5 text-slate-400" />
              </span>
            ))}
          </div>
        </div>

        {/* Active Additional Columns Strip */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Active Additional Columns ({activeColumnDefs.length}):
            </span>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onResetDefaults}
                className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Defaults</span>
              </button>
              {selectedColumns.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChangeColumns([])}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All ({selectedColumns.length})</span>
                </button>
              )}
            </div>
          </div>
          {activeColumnDefs.length === 0 ? (
            <div className="py-1 text-xs text-slate-400 italic">
              No additional columns added. The table displays the 6 core permanent columns (Instrument, NSE (₹), BSE (₹), Spread (%), Change (%), Volume). Select any metrics below to add them.
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto py-1">
              {activeColumnDefs.map((col, idx) => (
                <span
                  key={`active_${col.key}_${idx}`}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center gap-1.5 shadow-2xs group hover:bg-blue-100/70 transition-colors"
                >
                  <span>{col.header}</span>
                  <button
                    type="button"
                    onClick={() => removeColumn(col.key)}
                    className="text-blue-400 hover:text-rose-600 hover:bg-blue-200/50 p-0.5 rounded-full cursor-pointer transition-colors"
                    title={`Remove ${col.header}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Filter Controls: Search & Category Tabs with Metric Counts */}
        <div className="px-6 py-3 border-b border-slate-100 shrink-0 space-y-2.5 bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-blue-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across all financial & microstructure metrics..."
              className="w-full pl-10 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all shadow-2xs placeholder:text-slate-400 font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Main Category Tabs with Rich Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white shadow-2xs font-bold"
                  : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80"
              }`}
            >
              <span>🌟 All Metrics</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedCategory === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}>
                {STOCK_COLUMNS_CATALOG.length}
              </span>
            </button>
            {STOCK_COLUMN_CATEGORIES.map((cat) => {
              const catStyle = CATEGORY_STYLES[cat] || { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", icon: "📊" };
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-bold"
                      : `bg-white hover:bg-slate-50 text-slate-600 border-slate-200/80`
                  }`}
                >
                  <span>{catStyle.icon}</span>
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid of Columns to Add/Remove */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 bg-slate-50/30">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-slate-600">
              Showing <span className="text-blue-600 font-bold">{filteredColumns.length}</span> metrics in this view
            </span>
            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer text-xs flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Select All Visible ({filteredColumns.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredColumns.map((col, idx) => {
              const isCoreDefault = CORE_KEYS.has(col.key);
              const isSelected = isCoreDefault || selectedColumns.includes(col.key);
              const catStyle = CATEGORY_STYLES[col.category] || { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", icon: "📊" };

              return (
                <div
                  key={`${col.category}_${col.key}_${idx}`}
                  onClick={() => !isCoreDefault && toggleColumn(col.key)}
                  className={`p-3 rounded-xl border transition-all select-none ${
                    isCoreDefault
                      ? "bg-slate-50 border-slate-200/80 opacity-80 cursor-not-allowed"
                      : isSelected
                      ? "bg-gradient-to-r from-blue-50/95 to-indigo-50/60 border-blue-400 ring-1 ring-blue-500/25 shadow-xs cursor-pointer"
                      : "bg-white hover:bg-slate-50/90 border-slate-200/90 hover:border-slate-300 shadow-2xs cursor-pointer"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md mt-0.5 shrink-0 flex items-center justify-center border transition-all ${
                      isCoreDefault
                        ? "bg-slate-200 border-slate-300 text-slate-600"
                        : isSelected
                        ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isCoreDefault ? (
                      <Lock className="w-2.5 h-2.5 text-slate-600" />
                    ) : isSelected ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <span className={`text-xs font-bold leading-snug ${isCoreDefault ? "text-slate-700" : isSelected ? "text-blue-900" : "text-slate-800"}`}>
                        {col.header}
                      </span>
                      {isCoreDefault ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-200/80 text-slate-600 flex items-center gap-0.5 shrink-0">
                          <Lock className="w-2 h-2" /> Default
                        </span>
                      ) : (
                        <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded-md shrink-0 border flex items-center gap-1 ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          <span>{catStyle.icon}</span>
                          <span>{col.category}</span>
                        </span>
                      )}
                    </div>
                    {col.description && (
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {col.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            Selected: <span className="font-bold text-slate-900">{selectedColumns.length}</span> additional metrics + <span className="font-semibold text-slate-700">4 permanent core columns</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2 active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Columns & View Table</span>
          </button>
        </div>
      </div>
    </div>
  );
};
