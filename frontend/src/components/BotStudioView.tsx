"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Sparkles,
  Layers,
  FolderKanban,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Bookmark,
  MessageSquare,
  Sliders,
  PanelRightClose,
  PanelRightOpen,
  X
} from "lucide-react";
import {
  BotStrategyDefinition,
  BacktestResult,
  BotRecord,
  BotTemplate
} from "@/types";
import {
  fetchBotTemplates,
  chatWithBotAi,
  runBotBacktest,
  fetchSavedBots,
  saveBotRecord,
  deleteBotRecord,
  fetchXKiroStatus
} from "@/services/api";
import { BotChatPanel, ChatMessage } from "@/components/BotChatPanel";
import { StrategyVisualizerCard } from "@/components/StrategyVisualizerCard";
import { BacktestResultsView } from "@/components/BacktestResultsView";

interface BotStudioViewProps {
  onSelectStock?: (symbol: string) => void;
}

const DEFAULT_STRATEGY: BotStrategyDefinition = {
  id: "strat_default",
  name: "RSI Oversold Dip Buyer",
  description: "Buys high-quality NIFTY 50 stocks when RSI(14) drops below 30 and price sits near 200 EMA support.",
  version: 1,
  status: "DRAFT",
  universe: {
    base: "NIFTY_50",
    min_volume: 500000,
    min_price: 50.0,
  },
  entry: {
    logic: "AND",
    conditions: [
      {
        id: "cond_1",
        field: "rsi",
        operator: "<",
        value: 30.0,
        timeframe: "15m",
        description: "RSI(14) < 30",
      },
      {
        id: "cond_2",
        field: "ltp",
        operator: ">=",
        value: "ema_200",
        timeframe: "15m",
        description: "Price >= 200 EMA",
      },
    ],
    time_filter_start: "09:30",
    time_filter_end: "14:30",
  },
  exit: {
    target_pct: 3.5,
    stop_loss_pct: 1.5,
    trailing_stop_pct: 1.0,
    eod_square_off: true,
  },
  position_sizing: {
    method: "RISK_BASED",
    capital_allocation: 50000.0,
    risk_per_trade_pct: 1.0,
  },
  risk_limits: {
    max_daily_loss: 5000.0,
    max_open_positions: 3,
    max_trades_per_day: 8,
    require_stop_loss: true,
  },
  risk_score: "LOW",
  risk_notes: [
    "Disciplined 1.5% stop-loss protects capital.",
    "Favorable Risk-to-Reward ratio of 2.3:1.",
    "Targeting liquid NIFTY_50 universe."
  ],
};

export const BotStudioView: React.FC<BotStudioViewProps> = ({ onSelectStock }) => {
  const [activeTab, setActiveTab] = useState<"chat" | "saved">("chat");
  const [strategy, setStrategy] = useState<BotStrategyDefinition>(DEFAULT_STRATEGY);
  const [templates, setTemplates] = useState<BotTemplate[]>([]);
  const [savedBots, setSavedBots] = useState<BotRecord[]>([]);
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null);

  // Side Drawer state: FALSE by default so it's a pure chatbot like ChatGPT/Claude!
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(false);

  // Model selection state: defaults to Claude Sonnet 5 on xKiro
  const [selectedModel, setSelectedModel] = useState<string>("anthropic/claude-sonnet-5");

  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_welcome",
      sender: "bot",
      text: "👋 Welcome to Dalal Street Bot Studio!\nDescribe your trading strategy idea (e.g. *'Buy NIFTY 50 when RSI is below 35 and volume surges, target 4%, stop loss 1.5%'*) or pick one of the starters below.",
      timestamp: "Just now",
      strategySnapshot: DEFAULT_STRATEGY,
    },
  ]);

  // Load starter templates, saved bots, and sync active model from xKiro
  useEffect(() => {
    fetchBotTemplates()
      .then((data) => {
        if (data.templates) setTemplates(data.templates);
      })
      .catch((err) => console.error("Error loading templates:", err));

    fetchXKiroStatus()
      .then((status) => {
        if (status?.model) {
          setSelectedModel(status.model);
        }
      })
      .catch((err) => console.error("Error fetching xKiro status:", err));

    loadSavedBots();
  }, []);

  const loadSavedBots = () => {
    fetchSavedBots()
      .then((data) => {
        if (data.bots) setSavedBots(data.bots);
      })
      .catch((err) => console.error("Error loading saved bots:", err));
  };

  const handleSendMessage = async (text: string, model: string) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoadingChat(true);
    setErrorMessage(null);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const res = await chatWithBotAi(text, historyPayload, strategy, model);
      if (res.strategy) {
        setStrategy(res.strategy);
        setBacktestResults(null);
      }

      const botMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: "bot",
        text: res.explanation || "I've structured your trading strategy into deterministic rules.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        strategySnapshot: res.strategy,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to communicate with AI Co-Pilot");
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSelectTemplate = (tpl: BotTemplate) => {
    setStrategy(tpl.strategy);
    setBacktestResults(null);
    const botMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "bot",
      text: `Loaded **${tpl.name}**! ${tpl.description}\n\nClick **Inspect Strategy & Run Backtest** below to review rules or simulate performance.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      strategySnapshot: tpl.strategy,
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  const handleRunBacktest = async () => {
    setIsBacktesting(true);
    setErrorMessage(null);
    try {
      const res = await runBotBacktest(strategy, undefined, 100000.0);
      setBacktestResults(res);
      setStatusMessage(`Backtest finished: ${res.total_trades} trades. Net Return: ${res.return_pct}%`);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Backtest failed");
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleSaveBot = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await saveBotRecord(strategy, backtestResults);
      setStatusMessage(`✅ Bot "${strategy.name}" saved to library successfully!`);
      loadSavedBots();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save bot");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBot = async (botId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete bot "${name}"?`)) return;
    try {
      await deleteBotRecord(botId);
      loadSavedBots();
      setStatusMessage(`Deleted bot "${name}".`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete bot");
    }
  };

  const handleLoadBotIntoStudio = (bot: BotRecord) => {
    setStrategy(bot.strategy);
    if (bot.backtest) {
      setBacktestResults(bot.backtest);
    } else {
      setBacktestResults(null);
    }
    setActiveTab("chat");
    setIsSidePanelOpen(true);
    setStatusMessage(`Loaded "${bot.name}" into studio.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden font-sans">
      {/* 1. Header Navigation */}
      <div className="flex items-center justify-between pb-2 shrink-0 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-2xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Bot Studio
              </h1>
              <span className="text-[10px] text-slate-500">• Natural Language Trading Bot Builder</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "chat"
                  ? "bg-white text-blue-700 shadow-2xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat Co-Pilot</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("saved");
                loadSavedBots();
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "saved"
                  ? "bg-white text-blue-700 shadow-2xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>My Saved Bots ({savedBots.length})</span>
            </button>
          </div>

          {/* If on chat tab, allow toggling the side drawer */}
          {activeTab === "chat" && (
            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isSidePanelOpen
                  ? "bg-blue-50 text-blue-700 border-blue-300"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
              title={isSidePanelOpen ? "Close side drawer" : "Open strategy details on right"}
            >
              {isSidePanelOpen ? (
                <>
                  <PanelRightClose className="w-3.5 h-3.5" />
                  <span>Hide Details</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Strategy &amp; Backtest</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Toast Banners */}
      {statusMessage && (
        <div className="mt-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-600 font-bold ml-2 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mt-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 font-bold ml-2 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* 2. Main Workspace Body */}
      <div className="flex-1 min-h-0 pt-2 flex overflow-hidden">
        {activeTab === "chat" ? (
          <div className="flex-1 min-h-0 flex gap-3 h-full overflow-hidden">
            {/* Left Pane: Simple Chatbot (Full-Width by default, half-width when drawer is open) */}
            <div
              className={`h-full min-h-0 transition-all duration-200 flex flex-col ${
                isSidePanelOpen ? "w-full lg:w-1/2" : "w-full"
              }`}
            >
              <BotChatPanel
                messages={messages}
                isLoading={isLoadingChat}
                onSendMessage={handleSendMessage}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                onOpenSidePanel={() => setIsSidePanelOpen(true)}
                isSidePanelOpen={isSidePanelOpen}
                currentStrategy={strategy}
                templates={templates}
                onSelectTemplate={handleSelectTemplate}
              />
            </div>

            {/* Right Pane: Claude Code / Antigravity Style Drawer (ONLY opens if user clicks) */}
            {isSidePanelOpen && (
              <div className="w-full lg:w-1/2 h-full min-h-0 flex flex-col animate-in slide-in-from-right-4 duration-200">
                {backtestResults ? (
                  <div className="flex-1 min-h-0 flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1 shrink-0">
                      <button
                        onClick={() => setBacktestResults(null)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        ← Back to Rule Parameters
                      </button>
                      <button
                        onClick={() => setIsSidePanelOpen(false)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Close details"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 min-h-0">
                      <BacktestResultsView
                        results={backtestResults}
                        onSelectStock={onSelectStock}
                        onClose={() => setBacktestResults(null)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <StrategyVisualizerCard
                      strategy={strategy}
                      onChangeStrategy={setStrategy}
                      onRunBacktest={handleRunBacktest}
                      onSaveBot={handleSaveBot}
                      isBacktesting={isBacktesting}
                      isSaving={isSaving}
                      onClose={() => setIsSidePanelOpen(false)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* 3. My Saved Bots Library */
          <div className="h-full w-full overflow-y-auto pr-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Saved Strategy Bots</h2>
                <p className="text-xs text-slate-500">
                  Inspect, backtest, and manage your algorithmic trading strategies
                </p>
              </div>
              <button
                onClick={() => {
                  setStrategy(DEFAULT_STRATEGY);
                  setBacktestResults(null);
                  setActiveTab("chat");
                  setIsSidePanelOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Strategy in Chat</span>
              </button>
            </div>

            {savedBots.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white border border-slate-200">
                <Bot className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No saved bots yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Create a bot in the Chat Co-Pilot and click "Save Bot" to store it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                {savedBots.map((b) => {
                  const hasBacktest = !!b.backtest;
                  const isPos = b.backtest && b.backtest.return_pct >= 0;

                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{b.name}</h3>
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            {b.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                          {b.description || "Quantitative trading strategy"}
                        </p>

                        {/* Rules Summary Pills */}
                        <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 mb-3 text-[11px]">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-semibold">Universe:</span>
                            <span className="font-mono font-bold text-slate-800">{b.strategy.universe.base}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-semibold">Conditions:</span>
                            <span className="font-mono text-slate-800">
                              {b.strategy.entry.conditions.length} rule(s) ({b.strategy.entry.logic})
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-semibold">Target / SL:</span>
                            <span className="font-mono font-bold text-slate-800">
                              +{b.strategy.exit.target_pct}% / -{b.strategy.exit.stop_loss_pct}%
                            </span>
                          </div>
                        </div>

                        {/* Backtest Snapshot (if exists) */}
                        {hasBacktest && b.backtest && (
                          <div className="p-2.5 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50/30 border border-blue-200/50 mb-3 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-slate-500 font-semibold uppercase">Backtest Return</div>
                              <div
                                className={`text-sm font-black font-mono ${
                                  isPos ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {b.backtest.return_pct >= 0 ? "+" : ""}
                                {b.backtest.return_pct.toFixed(2)}%
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-slate-500 font-semibold uppercase">Win Rate</div>
                              <div className="text-sm font-bold font-mono text-blue-600">
                                {b.backtest.win_rate_pct.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleDeleteBot(b.id, b.name)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Bot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleLoadBotIntoStudio(b)}
                          className="px-3 py-1.5 rounded-md text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open in Studio</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
