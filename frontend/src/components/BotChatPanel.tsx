"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Layers,
  Key,
  Check,
  Play,
  ExternalLink,
  Sliders,
  Maximize2,
  X,
  Radio,
  Search,
  Cpu
} from "lucide-react";
import { BotStrategyDefinition, BotTemplate } from "@/types";
import { fetchXKiroStatus, connectXKiro, fetchXKiroModels } from "@/services/api";

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  strategySnapshot?: BotStrategyDefinition;
}

import { MASTER_XKIRO_MODELS, ModelItem } from "../constants/xkiroModels";
export type { ModelItem };

interface BotChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string, model: string) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onOpenSidePanel: () => void;
  isSidePanelOpen: boolean;
  currentStrategy?: BotStrategyDefinition;
  templates: BotTemplate[];
  onSelectTemplate: (template: BotTemplate) => void;
}

const STARTER_PROMPTS = [
  {
    title: "RSI Oversold Dip Buyer",
    desc: "Buy high-quality NIFTY 50 pullbacks holding 200 EMA, target 3.5%, SL 1.5%",
    prompt: "Buy NIFTY 50 stocks when RSI < 30 and price holds above 200 EMA. Exit at 3.5% target or 1.5% stop loss."
  },
  {
    title: "Intraday Volume Breakout",
    desc: "Catch momentum surges > 2.5x volume crossing above VWAP",
    prompt: "Create a breakout bot that buys when volume is 2.5x average and price crosses above intraday VWAP. Target 4% and stop loss 1.5%."
  },
  {
    title: "Dual EMA Trend Follower",
    desc: "Ride momentum when 20 EMA is above 50 EMA and RSI is healthy",
    prompt: "Buy when 20 EMA crosses above 50 EMA with RSI between 55 and 70. Target 5% and stop loss 2%."
  },
  {
    title: "VWAP Pullback Bounce",
    desc: "Enter green stocks dipping into VWAP with tight 1% risk",
    prompt: "Buy pullbacks touching VWAP support with intraday RSI < 45 and tight 1.2% stop loss, target 2.5%."
  }
];

export const BotChatPanel: React.FC<BotChatPanelProps> = ({
  messages,
  isLoading,
  onSendMessage,
  selectedModel,
  onSelectModel,
  onOpenSidePanel,
  isSidePanelOpen,
  currentStrategy,
  templates,
  onSelectTemplate
}) => {
  const [inputText, setInputText] = useState("");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [selectedProviderFilter, setSelectedProviderFilter] = useState("ALL");
  const [customModelInput, setCustomModelInput] = useState("");

  // Start with complete 117+ master catalog immediately
  const [allModels, setAllModels] = useState<ModelItem[]>(MASTER_XKIRO_MODELS);
  const [xkiroStatus, setXkiroStatus] = useState<any>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isConnectingKey, setIsConnectingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load status and live models from backend (merging with master catalog)
  useEffect(() => {
    fetchXKiroStatus()
      .then((data) => setXkiroStatus(data))
      .catch(() => {});

    fetchXKiroModels()
      .then((data) => {
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          const masterMap = new Map(MASTER_XKIRO_MODELS.map((m) => [m.id, m]));
          const merged: ModelItem[] = [...MASTER_XKIRO_MODELS];
          data.models.forEach((m: ModelItem) => {
            if (!masterMap.has(m.id)) {
              merged.push(m);
            }
          });
          setAllModels(merged);
        }
      })
      .catch(() => {});
  }, []);

  // Close model dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim(), selectedModel);
    setInputText("");
  };

  const handleConnectKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setIsConnectingKey(true);
    setKeyFeedback(null);
    try {
      const res = await connectXKiro(apiKeyInput.trim(), selectedModel);
      if (res.success) {
        const verifiedModel = res.model || res.verified_model || selectedModel;
        onSelectModel(verifiedModel);
        setXkiroStatus({ is_connected: true, model: verifiedModel, api_key_masked: `${apiKeyInput.slice(0, 4)}...` });
        setKeyFeedback(res.message || `Connected! Active model: ${verifiedModel}`);

        // Refresh models list
        fetchXKiroModels()
          .then((mRes) => {
            if (mRes.models && mRes.models.length > 0) setAllModels(mRes.models);
          })
          .catch(() => {});

        setTimeout(() => setIsApiKeyModalOpen(false), 1500);
      } else {
        setKeyFeedback(res.error || "Failed to connect");
      }
    } catch (err: any) {
      setKeyFeedback(err.message || "Connection error");
    } finally {
      setIsConnectingKey(false);
    }
  };

  const handleApplyCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    const mid = customModelInput.trim();
    if (!mid) return;
    onSelectModel(mid);
    setIsModelDropdownOpen(false);
    setCustomModelInput("");
  };

  // Filter models based on search query and provider
  const filteredModels = allModels.filter((m) => {
    const matchesProvider =
      selectedProviderFilter === "ALL" ||
      m.provider.toLowerCase() === selectedProviderFilter.toLowerCase();

    if (!matchesProvider) return false;

    if (!modelSearchQuery.trim()) return true;

    const q = modelSearchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      (m.badge && m.badge.toLowerCase().includes(q))
    );
  });

  const activeModelObj = allModels.find((m) => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel.split("/").pop()?.replace(/-/g, " ") || selectedModel,
    provider: "Selected Model",
    badge: "Active"
  };

  const providers = [
    "ALL",
    "Anthropic",
    "DeepSeek",
    "Google",
    "Meta",
    "MiniMax",
    "Mistral",
    "Moonshot",
    "NVIDIA",
    "OpenAI",
    "Qwen",
    "SenseNova",
    "Tencent",
    "xAI",
    "Xiaomi",
    "Zhipu AI"
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden relative font-sans">
      {/* 1. Sleek Top Bar (ChatGPT / Claude Style with 110+ Models Selector) */}
      <div className="px-4 py-2.5 border-b border-slate-100 bg-white/95 backdrop-blur-xs flex items-center justify-between shrink-0 z-30">
        {/* Left: Model Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs group"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="max-w-[140px] sm:max-w-[200px] truncate">{activeModelObj.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono font-medium shrink-0">
              {activeModelObj.provider}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 ml-0.5 shrink-0" />
          </button>

          {/* 110+ Models Searchable Dropdown Modal/Popover */}
          {isModelDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-[380px] sm:w-[440px] bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              {/* Dropdown Header & Count */}
              <div className="px-3.5 pb-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>xKiro AI Models</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {allModels.length} Models
                  </span>
                </div>
                <button
                  onClick={() => setIsModelDropdownOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-2.5 border-b border-slate-100 bg-slate-50/50">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                  <input
                    type="text"
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    placeholder="Search 110+ models (e.g. claude, gpt, deepseek, llama, qwen)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                    autoFocus
                  />
                  {modelSearchQuery && (
                    <button
                      onClick={() => setModelSearchQuery("")}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Provider Category Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2">
                  {providers.map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedProviderFilter(p)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedProviderFilter === p
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Models Scrollable List */}
              <div className="max-h-64 overflow-y-auto p-1 divide-y divide-slate-50">
                {filteredModels.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 italic">
                    No models found matching "{modelSearchQuery}".
                  </div>
                ) : (
                  filteredModels.map((m) => {
                    const isSelected = selectedModel === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          onSelectModel(m.id);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between rounded-lg hover:bg-blue-50/60 transition-colors cursor-pointer group ${
                          isSelected ? "bg-blue-50 text-blue-900 font-bold" : "text-slate-800"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-semibold">{m.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{m.id}</div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {m.provider}
                          </span>
                          {m.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium hidden sm:inline">
                              {m.badge}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Custom Model ID Entry */}
              <div className="px-3 pt-2 pb-1 border-t border-slate-100 bg-slate-50/70">
                <form onSubmit={handleApplyCustomModel} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.target.value)}
                    placeholder="Or enter custom model ID..."
                    className="flex-1 px-2.5 py-1 text-[11px] font-mono bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!customModelInput.trim()}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Center/Right: xKiro Live Status & Drawer Toggle */}
        <div className="flex items-center gap-2">
          {/* xKiro Connection Pill */}
          {xkiroStatus?.is_connected ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-pointer hover:bg-emerald-100/70 transition-colors shadow-2xs"
              onClick={() => setIsApiKeyModalOpen(true)}
              title="xKiro connected! Click to view details"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>xKiro Live</span>
              <span className="text-[10px] text-emerald-600 font-mono hidden sm:inline">
                ({allModels.length} models)
              </span>
            </div>
          ) : (
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
              title="Click to connect xKiro API key"
            >
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>Connect xKiro</span>
            </button>
          )}

          {/* Drawer Toggle (Claude Code / Antigravity Style) */}
          {currentStrategy && (
            <button
              onClick={onOpenSidePanel}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isSidePanelOpen
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
              title={isSidePanelOpen ? "Close side details panel" : "Open strategy details on right"}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Strategy Details</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Chat Stream (Centered, Clean, Distraction-Free) */}
      <div className="flex-1 overflow-y-auto px-4 py-6 text-xs">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* If only welcome message, show Hero Starters */}
          {messages.length <= 1 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  What trading bot do you want to build?
                </h1>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Describe any idea in natural English. Powered by {allModels.length}+ models across Anthropic, OpenAI, Google, DeepSeek, Meta, and Qwen via xKiro.
                </p>
              </div>

              {/* Starter Prompt Cards (ChatGPT style) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-left">
                {STARTER_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(p.prompt, selectedModel)}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 text-left transition-all group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 group-hover:text-blue-700">
                      <span>{p.title}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((m) => {
            const isUser = m.sender === "user";
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white font-bold shadow-2xs ${
                    isUser ? "bg-slate-800" : "bg-blue-600"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Content Box */}
                <div className={`space-y-2.5 max-w-[85%] ${isUser ? "text-right" : "text-left"}`}>
                  <div
                    className={`inline-block rounded-2xl px-4 py-3 leading-relaxed shadow-2xs text-xs ${
                      isUser
                        ? "bg-blue-600 text-white font-medium text-left"
                        : "bg-slate-50 text-slate-800 border border-slate-200/80"
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>
                    <div className={`text-[9px] mt-1 font-mono ${isUser ? "text-blue-200" : "text-slate-400"}`}>
                      {m.timestamp}
                    </div>
                  </div>

                  {/* Claude / Antigravity Style Artifact Pill inside message */}
                  {m.strategySnapshot && (
                    <div className="rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 p-3 shadow-xs text-left">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">📐</span>
                          <span className="text-xs font-extrabold text-blue-950">
                            {m.strategySnapshot.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-white text-blue-700 border border-blue-200">
                            v{m.strategySnapshot.version || 1}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Risk: {m.strategySnapshot.risk_score || "LOW"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 font-mono py-1">
                        <span className="bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                          🎯 Target: +{m.strategySnapshot.exit.target_pct}%
                        </span>
                        <span className="bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                          🛑 Stop Loss: -{m.strategySnapshot.exit.stop_loss_pct}%
                        </span>
                        <span className="bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                          🌐 {m.strategySnapshot.universe.base}
                        </span>
                      </div>

                      <button
                        onClick={onOpenSidePanel}
                        className="mt-2 w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <span>Inspect Strategy &amp; Run Backtest</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Animation */}
          {isLoading && (
            <div className="flex items-center gap-3 text-slate-500 italic text-xs py-2">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
                <span>Reasoning with {activeModelObj.name}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 3. Floating Rounded-2xl Input Bar (ChatGPT Style) */}
      <div className="p-4 bg-white/95 border-t border-slate-100 shrink-0">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-200/90 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-2xl px-3 py-2 shadow-xs transition-all"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask anything or describe strategy using ${activeModelObj.name}...`}
              className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden font-medium px-1"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs shrink-0"
              title="Send prompt"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400 font-medium">
            <span>Model: {activeModelObj.name} ({activeModelObj.provider})</span>
            <span>Deterministic Strategy Engine • Indian Statutory Taxes Included</span>
          </div>
        </div>
      </div>

      {/* 4. Quick API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">xKiro AI Credentials</h3>
                  <p className="text-[11px] text-slate-500">Access to 110+ frontier & open models</p>
                </div>
              </div>
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnectKey} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  xKiro API Key
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-xkiro-..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {keyFeedback && (
                <div className="text-[11px] font-semibold text-blue-600 bg-blue-50 p-2 rounded-lg">
                  {keyFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!apiKeyInput.trim() || isConnectingKey}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isConnectingKey ? "Verifying..." : "Save Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
