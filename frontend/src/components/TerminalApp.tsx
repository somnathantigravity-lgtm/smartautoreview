"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { UniverseView } from "@/components/UniverseView";
import { ChartRuleStudio } from "@/components/ChartRuleStudio";
import { AdminSettingsView } from "@/components/AdminSettingsView";
import { TrendsDashboardView } from "@/components/TrendsDashboardView";
import { NewsFeedView } from "@/components/NewsFeedView";
import { RecommendationDashboardView } from "@/components/RecommendationDashboardView";
import { PortfolioView } from "@/components/PortfolioView";
import { RuleModal } from "@/components/RuleModal";
import { AuthModal } from "@/components/AuthModal";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { AuthUser } from "@/types";
import DataVaultView from "./DataVaultView";
import RecoSimulationView from "./RecoSimulationView";
import { RecoAuditView } from "./RecoAuditView";
import { RecoRulesView } from "./RecoRulesView";
import { NormalUserApp } from "@/components/NormalUserApp";
import { AdminPortalView } from "@/components/AdminPortalView";

interface TerminalAppProps {
  defaultTab?: string;
  initialStock?: string;
  initialSearch?: string;
  forceSpecial?: boolean;
}

const TAB_TO_PATH: Record<string, string> = {
  recommendations: "/",
  reco_audit: "/reco-audit",
  reco_rules: "/reco-rules",
  vault: "/vault",
  simulation: "/simulation",
  portfolio: "/portfolio",
  universe: "/stocks",
  watchlist: "/watchlist",
  trends: "/trends",
  news: "/news",
  chart: "/chart",
  settings: "/settings",
};

export function TerminalApp({
  defaultTab = "recommendations",
  initialStock = "RELIANCE",
  initialSearch = "",
  forceSpecial = false,
}: TerminalAppProps) {
  const [detectedPortal, setDetectedPortal] = useState<"special" | "normal" | "admin">(() => {
    if (typeof window !== "undefined" && !forceSpecial) {
      const port = window.location.port;
      const params = new URLSearchParams(window.location.search);
      const portalParam = params.get("portal");
      if (port === "3002" || portalParam === "admin") return "admin";
      if (port === "3000" || portalParam === "special") return "special";
      // Default website (port 3001, or default domain smartautoreviews.com)
      return "normal";
    }
    return forceSpecial ? "special" : "normal";
  });
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [selectedStock, setSelectedStock] = useState<string>(initialStock);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [triggerModalSymbol, setTriggerModalSymbol] = useState<string | null>(null);

  // Responsive Sidebar States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Auth & Market states
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !forceSpecial) {
      const port = window.location.port;
      const params = new URLSearchParams(window.location.search);
      const portalParam = params.get("portal");

      if (port === "3002" || portalParam === "admin") {
        setDetectedPortal("admin");
      } else if (port === "3000" || portalParam === "special") {
        setDetectedPortal("special");
      } else {
        setDetectedPortal("normal");
      }
    }
  }, [forceSpecial]);

  if (!forceSpecial && detectedPortal === "normal") {
    return <NormalUserApp />;
  }

  if (!forceSpecial && detectedPortal === "admin") {
    return <AdminPortalView />;
  }

  const checkAuth = useCallback(() => {
    try {
      const stored = localStorage.getItem("apex_user");
      setAuthUser(stored ? JSON.parse(stored) : null);
    } catch {
      setAuthUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("apex_user");
    setAuthUser(null);
    window.dispatchEvent(new Event("storage"));
  };

  // Restore sidebar state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCollapse = localStorage.getItem("apex_sidebar_collapsed");
      if (savedCollapse !== null) {
        setIsSidebarCollapsed(savedCollapse === "true");
      }
      checkAuth();
      window.addEventListener("storage", checkAuth);
    }
    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, [checkAuth]);

  // Sync with URL query params on initial load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      const urlSymbol = params.get("symbol") || params.get("search");

      if (urlTab && ["recommendations", "reco_audit", "reco_rules", "vault", "simulation", "universe", "watchlist", "trends", "news", "chart", "settings"].includes(urlTab)) {
        setActiveTab(urlTab);
      }
      if (urlSymbol) {
        setSelectedStock(urlSymbol.toUpperCase());
        setSearchQuery(urlSymbol.toUpperCase());
      }
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const targetPath = TAB_TO_PATH[tab] || "/";
      window.history.pushState(null, "", targetPath);
    }
  };

  const handleSelectStock = (sym: string) => {
    setSelectedStock(sym);
    setActiveTab("chart");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/chart?symbol=${encodeURIComponent(sym)}`);
    }
  };

  const handleOpenTriggerModal = (sym: string) => {
    setTriggerModalSymbol(sym);
  };

  const isSinglePage = activeTab === "universe" || activeTab === "watchlist" || activeTab === "trends";

  return (
    <div
      className={`min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 ${
        isSinglePage ? "h-screen overflow-hidden" : ""
      }`}
    >
      {/* 1. FULL-PAGE TOP DALAL STREET TICKER STRIP (100% Full Width across entire top of screen) */}
      <TopBar
        activeTab={activeTab}
        isMarketOpen={isMarketOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        authUser={authUser}
        onLogout={handleLogout}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSelectStock={handleSelectStock}
      />

      {/* 2. BODY BELOW TOPBAR: LEFT SIDEBAR + RIGHT CONTENT VIEWPORT */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Collapsible Modern Sidebar (Starts BELOW top ticker) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
          authUser={authUser}
          onLogout={handleLogout}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          isMarketOpen={isMarketOpen}
        />

        {/* Main Content Viewport (Fluid & Responsive, Auto-Adjusts with Sidebar) */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
          }`}
        >
          {/* Dynamic Responsive Screen Area (Maximum Screen Width Utilization) */}
          <main
            className={`flex-1 w-full px-3 sm:px-6 lg:px-8 ${
              isSinglePage ? "py-2 flex flex-col min-h-0 overflow-hidden" : "py-5"
            }`}
          >
          {activeTab === "recommendations" && (
            <RecommendationDashboardView onViewPortfolio={() => handleTabChange("portfolio")} />
          )}

          {activeTab === "reco_audit" && (
            <RecoAuditView onNavigateToRules={() => handleTabChange("reco_rules")} />
          )}

          {activeTab === "reco_rules" && (
            <RecoRulesView onNavigateToAudit={() => handleTabChange("reco_audit")} />
          )}

          {activeTab === "vault" && (
            <DataVaultView />
          )}

          {activeTab === "simulation" && (
            <RecoSimulationView />
          )}

          {activeTab === "portfolio" && (
            <PortfolioView
              onNavigateToRecommendations={() => handleTabChange("recommendations")}
              onOpenSettings={() => handleTabChange("settings")}
            />
          )}

          {activeTab === "universe" && (
            <UniverseView
              key={searchQuery || "all-stocks"}
              onSelectStock={handleSelectStock}
              onOpenTriggerModal={handleOpenTriggerModal}
              onNavigateToScreener={() => handleTabChange("watchlist")}
              initialSearch={searchQuery}
            />
          )}

          {activeTab === "watchlist" && (
            <UniverseView
              key={searchQuery ? `wl-${searchQuery}` : "watchlist"}
              isWatchlistOnly={true}
              onSelectStock={handleSelectStock}
              onOpenTriggerModal={handleOpenTriggerModal}
              onNavigateToScreener={() => handleTabChange("watchlist")}
              onNavigateToStocks={() => handleTabChange("universe")}
              initialSearch={searchQuery}
            />
          )}

          {activeTab === "trends" && <TrendsDashboardView onSelectStock={handleSelectStock} />}

          {activeTab === "news" && <NewsFeedView onSelectStock={handleSelectStock} initialSearch={searchQuery} />}

          {activeTab === "chart" && <ChartRuleStudio key={selectedStock} initialSymbol={selectedStock} />}

          {activeTab === "settings" && <AdminSettingsView />}
        </main>

        {/* Regulatory Footer */}
        {!isSinglePage && <FooterDisclaimer />}
      </div>
    </div>

      {/* Quick Dynamic Trigger Creation Modal */}
      {triggerModalSymbol && (
        <RuleModal
          isOpen={!!triggerModalSymbol}
          onClose={() => setTriggerModalSymbol(null)}
          symbol={triggerModalSymbol}
          onSuccess={() => {}}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setAuthUser(user);
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
