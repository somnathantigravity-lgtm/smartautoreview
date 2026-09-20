"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Briefcase,
  Layers,
  Bookmark,
  Flame,
  Newspaper,
  TrendingUp,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  LogOut,
  X,
  Database,
  FlaskConical,
  ShieldCheck,
  SlidersHorizontal
} from "lucide-react";
import { AuthUser } from "@/types";
import { SignoutConfirmModal } from "@/components/SignoutConfirmModal";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  description?: string;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  authUser: AuthUser | null;
  onLogout: () => void;
  onOpenAuthModal: () => void;
  isMarketOpen: boolean;
  marketStatusLabel?: string;
  allowedTabs?: string[];
  portalBadge?: string;
}

export const navItems: NavItem[] = [
  {
    id: "recommendations",
    label: "Recommendations",
    icon: Sparkles,
    badge: "17",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    description: "Smart Conviction Bracket"
  },
  {
    id: "reco_audit",
    label: "Reco Audit",
    icon: ShieldCheck,
    badge: "LIVE",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "Live Real-Time Setup & Policy Audit"
  },
  {
    id: "reco_rules",
    label: "Reco Rules",
    icon: SlidersHorizontal,
    badge: "RULES",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    description: "Strategy & Universe Rules"
  },
  {
    id: "vault",
    label: "Data Vault",
    icon: Database,
    badge: "60D",
    badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    description: "60-Day Tick Vault & Matrix"
  },
  /*
  // PRESERVED FOR FUTURE RECALL: Reco. Simulation (Hidden from UI per user request)
  {
    id: "simulation",
    label: "Reco. Simulation",
    icon: FlaskConical,
    badge: "NEW",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    description: "Historical 26-P Simulation"
  },
  */
  {
    id: "portfolio",
    label: "My Portfolio",
    icon: Briefcase,
    badge: "Dhan",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "Live Positions & Orders"
  },
  {
    id: "universe",
    label: "Stocks Universe",
    icon: Layers,
    description: "BSE / NSE Live Screener"
  },
  {
    id: "watchlist",
    label: "My Watchlist",
    icon: Bookmark,
    description: "Custom Portfolios"
  },
  {
    id: "trends",
    label: "Market Trends",
    icon: Flame,
    description: "Momentum & Sector Movers"
  },
  {
    id: "news",
    label: "Dalal Street News",
    icon: Newspaper,
    description: "Live Financial Intelligence"
  },
  {
    id: "chart",
    label: "Chart & Rules",
    icon: TrendingUp,
    description: "Dynamic Trigger Studio"
  },
  {
    id: "settings",
    label: "Settings",
    icon: SettingsIcon,
    description: "Engine & Broker Integrations"
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  authUser,
  onLogout,
  onOpenAuthModal,
  isMarketOpen,
  marketStatusLabel,
  allowedTabs,
  portalBadge
}) => {
  const [vaultDays, setVaultDays] = useState<number>(61);
  const [showSignoutModal, setShowSignoutModal] = useState<boolean>(false);

  const displayItems = allowedTabs && allowedTabs.length > 0
    ? navItems.filter((item) => allowedTabs.includes(item.id))
    : navItems;

  useEffect(() => {
    fetch("/api/v1/historical-data/tape-metrics")
      .then((r) => r.json())
      .then((d) => {
        if (d && d.max_days_available) setVaultDays(d.max_days_available);
      })
      .catch(() => {});
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("apex_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 md:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Element (Starts BELOW the top ticker tape on desktop: top-9) */}
      <aside
        className={`fixed left-0 z-40 bg-white border-r border-slate-200/90 shadow-sm flex flex-col justify-between transition-all duration-300 ease-in-out font-sans ${
          /* Mobile Drawer: starts at top-0 or top-[80px] */
          isMobileOpen
            ? "translate-x-0 w-72 top-0 bottom-0"
            : "-translate-x-full md:translate-x-0 md:top-9 md:bottom-0 md:h-[calc(100vh-36px)]"
        } ${
          /* Desktop Width */
          isCollapsed ? "md:w-20" : "md:w-64"
        }`}
      >
        {/* TOP SECTION: BRAND LOGO & TOGGLE */}
        <div className="flex flex-col">
          {/* Header Row */}
          <div
            className={`h-14 flex items-center border-b border-slate-100 px-3.5 ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            {/* Expanded: Logo + Brand Title + Collapse Button */}
            {!isCollapsed ? (
              <>
                <div
                  onClick={() => handleNavClick("universe")}
                  className="flex items-center gap-2.5 cursor-pointer group min-w-0"
                  title="APEX EQUITIES Dalal Street Market Terminal"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-black text-sm tracking-tight text-slate-900">APEX</span>
                      <span className="font-extrabold text-xs text-blue-600 tracking-wider">EQUITIES</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-none truncate">
                      {portalBadge || "Dalal Street Terminal"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={toggleCollapse}
                  title="Collapse Sidebar"
                  className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Collapsed: The APEX Logo itself serves as the expand trigger with hover effect */
              <div
                onClick={toggleCollapse}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 hover:scale-110 hover:shadow-blue-500/40 transition-all cursor-pointer group relative"
                title="APEX EQUITIES • Click to Expand Sidebar"
              >
                <TrendingUp className="w-5 h-5" />
                <div className="hidden md:flex absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                  Expand Sidebar
                </div>
              </div>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MARKET STATUS PILL */}
          <div className="px-3 pt-2.5 pb-1">
            {!isCollapsed ? (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    {isMarketOpen && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isMarketOpen
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                          : "bg-amber-500"
                      }`}
                    ></span>
                  </span>
                  <span className="font-bold text-slate-700 text-[11px]">
                    {isMarketOpen ? "Market Live" : "Market Closed"}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-400">
                  {isMarketOpen ? "09:15-15:30" : "Dalal Street"}
                </span>
              </div>
            ) : (
              <div
                className="flex justify-center py-1 cursor-pointer"
                onClick={toggleCollapse}
                title={isMarketOpen ? "Market Live • Click to expand" : "Market Closed • Click to expand"}
              >
                <span className="relative flex h-2.5 w-2.5">
                  {isMarketOpen && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isMarketOpen
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                        : "bg-amber-500"
                    }`}
                  ></span>
                </span>
              </div>
            )}
          </div>

          {/* NAVIGATION ITEMS LIST */}
          <nav className="px-3 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)] no-scrollbar">
            {displayItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`group relative w-full flex items-center rounded-xl transition-all cursor-pointer ${
                    isCollapsed
                      ? "justify-center p-2.5"
                      : "justify-between px-3.5 py-2.5 text-left"
                  } ${
                    isActive
                      ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                      }`}
                    />
                    {!isCollapsed && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs truncate tracking-tight">{item.label}</span>
                        {item.description && !isActive && (
                          <span className="text-[10px] text-slate-400 font-normal truncate">
                            {item.description}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Badge */}
                  {!isCollapsed && (item.badge || item.id === "vault") && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                        isActive
                          ? "bg-white/20 text-white border-white/30"
                          : item.badgeColor || "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {item.id === "vault" ? `${vaultDays}D` : item.badge}
                    </span>
                  )}

                  {/* Hover Floating Tooltip on Collapsed Mode */}
                  {isCollapsed && (
                    <div className="hidden md:flex absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 items-center gap-2">
                      <span>{item.label}</span>
                      {(item.badge || item.id === "vault") && (
                        <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">
                          {item.id === "vault" ? `${vaultDays}D` : item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM SECTION: USER ACCOUNT & EXPAND TOGGLE */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          {/* User Account Tile */}
          {authUser ? (
            <div
              className={`flex items-center rounded-xl bg-white border border-slate-200/80 shadow-2xs p-2 ${
                isCollapsed ? "justify-center" : "justify-between"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                  {authUser.email ? authUser.email[0].toUpperCase() : "U"}
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {authUser.email.split("@")[0]}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {authUser.email}
                    </span>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <button
                  onClick={() => setShowSignoutModal(true)}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              title={isCollapsed ? "Sign In" : undefined}
              className={`w-full flex items-center rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition-all cursor-pointer ${
                isCollapsed ? "justify-center p-2.5" : "justify-center px-3.5 py-2.5 gap-2"
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Sign In</span>}
            </button>
          )}

          {/* Collapsed Mode: Bottom Expand Action Button */}
          {isCollapsed && (
            <button
              onClick={toggleCollapse}
              title="Expand Sidebar"
              className="hidden md:flex w-full items-center justify-center py-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          {/* Expanded Mode: Bottom Collapse Link */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex w-full items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Collapse Sidebar</span>
            </button>
          )}
        </div>
      </aside>

      {/* Signout Confirmation Modal */}
      <SignoutConfirmModal
        isOpen={showSignoutModal}
        onClose={() => setShowSignoutModal(false)}
        onConfirm={() => {
          setShowSignoutModal(false);
          onLogout();
        }}
        userEmail={authUser?.email}
      />
    </>
  );
};
