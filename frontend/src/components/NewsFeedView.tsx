"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Newspaper,
  Search,
  RefreshCw,
  ExternalLink,
  Flame,
  AlertTriangle,
  Info,
  Building2,
  Calendar,
  Zap,
  Radio,
  Layers,
  FileText,
  Activity,
  X,
  ChevronDown,
  ArrowUpRight,
  Home
} from "lucide-react";
import { fetchLiveNews, refreshLiveNews } from "@/services/api";
import { NewsArticle, NewsMetrics, NewsStockOption } from "@/types";

interface NewsFeedViewProps {
  onSelectStock?: (symbol: string) => void;
  initialSearch?: string;
  initialSector?: string;
  initialStock?: string;
}

const ALL_31_SECTORS = [
  "Agriculture & Irrigation",
  "Auto Components & Tyres",
  "Automobile & Electric Vehicles",
  "Aviation & Airlines",
  "Banking & Financial Services",
  "Beverages & Breweries",
  "Capital Markets & FinTech",
  "Cement & Building Materials",
  "Chemicals & Petrochemicals",
  "Consumer Durables & Electronics",
  "Defence & Aerospace",
  "Exchange Traded Funds (ETFs)",
  "FMCG & Food Products",
  "Fertilizers & Agro Chemicals",
  "Gems, Jewellery & Luxury",
  "Hotels, Hospitality & Tourism",
  "Information Technology",
  "Infrastructure & Capital Goods",
  "Logistics, Ports & Shipping",
  "Media & Entertainment",
  "Metals, Mining & Steel",
  "Oil, Gas & Petrochemicals",
  "Paper & Packaging",
  "Pharmaceuticals & Healthcare",
  "Power, Energy & CleanTech",
  "Railways & Mass Transit",
  "Real Estate & Urban Development",
  "Retail & Consumer E-Commerce",
  "Sugar & Distilleries",
  "Telecommunications",
  "Textiles & Apparel"
];

export const NewsFeedView: React.FC<NewsFeedViewProps> = ({
  onSelectStock,
  initialSearch = "",
  initialSector = "ALL",
  initialStock = "ALL"
}) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [metrics, setMetrics] = useState<NewsMetrics | null>(null);
  const [availableSectors, setAvailableSectors] = useState<string[]>(ALL_31_SECTORS);
  const [availableStocks, setAvailableStocks] = useState<NewsStockOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedSensitivity, setSelectedSensitivity] = useState<string>("ALL");
  const [selectedSector, setSelectedSector] = useState<string>(initialSector);
  const [selectedStock, setSelectedStock] = useState<string>(initialStock);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [autoRefreshCount, setAutoRefreshCount] = useState<number>(25);

  const loadNews = async (isSilent: boolean = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetchLiveNews({
        sector: selectedSector !== "ALL" ? selectedSector : undefined,
        symbol: selectedStock !== "ALL" ? selectedStock : undefined,
        sensitivity: selectedSensitivity !== "ALL" ? selectedSensitivity : undefined,
        search: searchQuery || undefined,
        limit: 100
      });
      setArticles(res.articles || []);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
      if (res.all_sectors && res.all_sectors.length > 0) {
        setAvailableSectors(res.all_sectors);
      }
      if (res.all_stocks && res.all_stocks.length > 0) {
        setAvailableStocks(res.all_stocks);
      }
      setLastUpdated(res.updated_at || new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Error loading news feed:", e);
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, [selectedSector, selectedStock, selectedSensitivity]);

  // Real-time automatic background polling every 25 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoRefreshCount((prev) => {
        if (prev <= 1) {
          loadNews(true);
          return 25;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSector, selectedStock, selectedSensitivity, searchQuery]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshLiveNews();
      await loadNews(true);
      setAutoRefreshCount(25);
    } catch (e) {
      console.error("Manual refresh error:", e);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadNews();
  };

  const handleResetFilters = () => {
    setSelectedSector("ALL");
    setSelectedStock("ALL");
    setSelectedSensitivity("ALL");
    setSearchQuery("");
  };

  const hasActiveFilters = Boolean(
    selectedSector !== "ALL" ||
    selectedStock !== "ALL" ||
    selectedSensitivity !== "ALL" ||
    searchQuery.trim().length > 0
  );

  return (
    <div className="space-y-3 w-full max-w-[1720px] mx-auto">
      {/* 1. Sleek Integrated Header: Title + Live Pulse + Home & Micro-Stats */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <button
          onClick={handleResetFilters}
          className="flex items-center gap-2.5 text-left cursor-pointer group"
          title="Click to go to Home (All News)"
        >
          <div className="p-2 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white shadow-2xs shrink-0 transition-colors">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                Live Market Wire
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                REAL-TIME
              </span>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">• Sync in {autoRefreshCount}s</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              SEBI Reg 30 Filings • Macro Catalysts • 31 Sector Intelligence
            </p>
          </div>
        </button>

        {/* Home & Interactive Micro-Stat Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {/* Explicit Home Button */}
          <button
            onClick={handleResetFilters}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
              !hasActiveFilters
                ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
            title="Return to Home (All News)"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1 text-slate-700 font-medium text-[11px]">
            <Zap className="w-3 h-3 text-indigo-500" />
            <span><strong>{metrics?.last_hour_streak ?? 16}</strong> in 1h</span>
          </div>

          <button
            onClick={() => setSelectedSensitivity(selectedSensitivity === "HIGH" ? "ALL" : "HIGH")}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
              selectedSensitivity === "HIGH"
                ? "bg-red-500 text-white border-red-500 shadow-2xs font-bold"
                : "bg-red-50/60 hover:bg-red-100 text-red-700 border-red-200 font-medium"
            }`}
            title={selectedSensitivity === "HIGH" ? "Click to toggle off" : "Click to view High Impact news"}
          >
            <Flame className="w-3 h-3" />
            <span><strong>{metrics?.high_sensitivity_count ?? 12}</strong> High Impact</span>
          </button>

          <button
            onClick={() => {
              if (metrics?.top_sector) {
                setSelectedSector(selectedSector === metrics.top_sector ? "ALL" : metrics.top_sector);
              }
            }}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] max-w-[170px] truncate ${
              selectedSector === metrics?.top_sector
                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold"
                : "bg-emerald-50/60 hover:bg-emerald-100 text-emerald-700 border-emerald-200 font-medium"
            }`}
            title={selectedSector === metrics?.top_sector ? "Click to toggle off" : "Click to filter top sector"}
          >
            <Activity className="w-3 h-3 shrink-0" />
            <span className="truncate">Top: <strong>{metrics?.top_sector ?? "IT"}</strong></span>
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
            title="Sync Live Wire"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. ONE Unified Clean Toolbar (Search + Sector + Stock + Sensitivity + Home Action) */}
      <div className="p-2.5 px-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center gap-2">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search company, ticker, order win, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400"
          />
        </form>

        {/* 31 Industry Sectors */}
        <div className="relative min-w-[175px]">
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer appearance-none pr-8"
          >
            <option value="ALL">All Sectors (31)</option>
            {availableSectors.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Stock Filter */}
        <div className="relative min-w-[175px]">
          <select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-purple-50/60 border border-purple-200 text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer appearance-none pr-8"
          >
            <option value="ALL">All Companies</option>
            {availableStocks.map((stk) => (
              <option key={stk.symbol} value={stk.symbol}>
                ${stk.symbol} · {stk.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-purple-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Sensitivity Segmented Buttons */}
        <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold shrink-0">
          <button
            onClick={() => setSelectedSensitivity("ALL")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              selectedSensitivity === "ALL" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
            title="View All News"
          >
            <Home className="w-3 h-3 text-slate-500" />
            <span>All (Home)</span>
          </button>
          <button
            onClick={() => setSelectedSensitivity("HIGH")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              selectedSensitivity === "HIGH" ? "bg-red-500 text-white shadow-2xs font-bold" : "text-red-700 hover:bg-red-50"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            High
          </button>
          <button
            onClick={() => setSelectedSensitivity("MODERATE")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              selectedSensitivity === "MODERATE" ? "bg-orange-500 text-white shadow-2xs font-bold" : "text-orange-700 hover:bg-orange-50"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Mod
          </button>
          <button
            onClick={() => setSelectedSensitivity("INFORMATIONAL")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              selectedSensitivity === "INFORMATIONAL" ? "bg-emerald-600 text-white shadow-2xs font-bold" : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Routine
          </button>
        </div>

        {/* Reset button if active */}
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-all cursor-pointer shrink-0 shadow-2xs"
            title="Reset to Home (All News)"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
        )}
      </div>

      {/* Active Filter Status & One-Click "Back to Home" Banner */}
      {hasActiveFilters && (
        <div className="p-2 px-3.5 rounded-xl bg-blue-50/90 border border-blue-200 flex items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-blue-950">Active Filter:</span>
            {selectedSensitivity !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-bold border border-red-200 text-[11px]">
                <Flame className="w-3 h-3 text-red-600" />
                {selectedSensitivity === "HIGH" ? "High Impact News" : selectedSensitivity}
              </span>
            )}
            {selectedSector !== "ALL" && (
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold border border-blue-200 text-[11px]">
                Sector: {selectedSector}
              </span>
            )}
            {selectedStock !== "ALL" && (
              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold border border-purple-200 text-[11px]">
                Stock: ${selectedStock}
              </span>
            )}
            {searchQuery && (
              <span className="px-2 py-0.5 rounded-md bg-white text-slate-800 font-medium border border-slate-200 text-[11px]">
                Search: "{searchQuery}"
              </span>
            )}
          </div>

          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Home (All News)</span>
          </button>
        </div>
      )}

      {/* 3. News Feed: 2 News in 1 Line with High Visual Breathing Room */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-2.5">
          <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading verified dispatches...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
          <Newspaper className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Dispatches Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No articles matched your active filters. Try resetting to view all news.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-2 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {articles.map((item) => {
            const isHigh = item.sensitivity === "HIGH";
            const isModerate = item.sensitivity === "MODERATE";

            // SUBTLE 3 COLORS WITH POLISHED LEFT ACCENT BORDER
            const cardTheme = isHigh
              ? {
                  bg: "bg-[#FFF5F5] border-[#FECDD3] border-l-4 border-l-red-500 hover:border-red-400",
                  tag: "bg-red-100 text-red-800 border-red-200",
                  icon: <Flame className="w-3 h-3 text-red-600" />,
                  label: "High Sensitivity",
                }
              : isModerate
              ? {
                  bg: "bg-[#FFF9F2] border-[#FED7AA] border-l-4 border-l-orange-500 hover:border-orange-400",
                  tag: "bg-orange-100 text-orange-800 border-orange-200",
                  icon: <AlertTriangle className="w-3 h-3 text-orange-600" />,
                  label: "Moderate",
                }
              : {
                  bg: "bg-[#F2FAF4] border-[#BBF7D0] border-l-4 border-l-emerald-500 hover:border-emerald-400",
                  tag: "bg-emerald-100 text-emerald-800 border-emerald-200",
                  icon: <Info className="w-3 h-3 text-emerald-600" />,
                  label: "Routine",
                };

            const primarySector = item.sector || (item.sectors && item.sectors[0]) || "General Equities";

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-2 ${cardTheme.bg}`}
              >
                <div className="space-y-1.5">
                  {/* Clean Top Header: Target Entity or Sector + Sensitivity + Time */}
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      {item.stock_name ? (
                        <button
                          onClick={() => setSelectedStock(item.symbol || "ALL")}
                          className="font-bold text-purple-900 bg-white/80 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200 transition-all truncate text-[11px]"
                          title="Filter for this stock"
                        >
                          🏢 {item.stock_name} {item.symbol ? `($${item.symbol})` : ""}
                        </button>
                      ) : (
                        <span
                          onClick={() => setSelectedSector(primarySector)}
                          className="font-semibold text-slate-700 bg-white/80 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 cursor-pointer transition-all truncate text-[11px]"
                        >
                          {primarySector}
                        </span>
                      )}

                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] border shrink-0 ${cardTheme.tag}`}>
                        {cardTheme.icon}
                        <span>{cardTheme.label}</span>
                      </span>
                    </div>

                    <span className="text-slate-400 font-mono text-[10px] shrink-0">
                      {item.published_at.split(",")[1]?.trim() || item.published_at}
                    </span>
                  </div>

                  {/* Headline */}
                  <h2 className="text-[14px] font-bold text-slate-900 leading-snug hover:text-blue-600 transition-colors">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start justify-between gap-1"
                    >
                      <span>{item.title}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    </a>
                  </h2>

                  {/* Excerpt / Summary */}
                  {item.summary && (
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed line-clamp-2">
                      {item.summary}
                    </p>
                  )}
                </div>

                {/* Footer: Publisher & Clean Action Link */}
                <div className="pt-1.5 border-t border-slate-200/50 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 truncate">
                    {item.publisher}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.symbol && onSelectStock && (
                      <button
                        onClick={() => onSelectStock(item.symbol!)}
                        className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200 transition-all cursor-pointer shadow-2xs"
                      >
                        Chart ${item.symbol}
                      </button>
                    )}

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 transition-all cursor-pointer shadow-2xs"
                    >
                      <span>Notice</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
