"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MarketplaceUserRole } from "@/lib/marketplace-types";

type MarketplaceNavHeaderProps = {
  currentRole: MarketplaceUserRole;
  onRoleChange: (role: MarketplaceUserRole) => void;
  basketCount?: number;
  onOpenBasket?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
};

const FARMER_TABS = [
  { label: "Overview", href: "/marketplace", icon: "🏬" },
  { label: "Sell at MSP", href: "/marketplace/msp", icon: "🌾" },
  { label: "Direct Market", href: "/marketplace/direct", icon: "🛒" },
  { label: "Group Selling", href: "/marketplace/groups", icon: "👥" },
  { label: "Transactions", href: "/marketplace/transactions", icon: "📑" },
];

const RESTRICTED_TABS = [
  { label: "Govt Procurement Console", href: "/marketplace/government", icon: "🏛️", badge: "MANDI STATION" },
  { label: "APEDA Exporter Gateway", href: "/marketplace/export", icon: "🚢", badge: "TRADE DESK" },
];

export default function MarketplaceNavHeader({
  currentRole,
  onRoleChange,
  basketCount = 0,
  onOpenBasket,
  searchQuery = "",
  onSearchChange,
}: MarketplaceNavHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSwitchPersona(targetRole: MarketplaceUserRole) {
    onRoleChange(targetRole);

    if (targetRole === "government_buyer") {
      try {
        await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: "9876500001",
            otp: "123456",
            name: "Officer S. Sharma",
            role: "government_buyer",
          }),
        });
      } catch {}
      window.location.href = "/marketplace/government";
      return;
    } else if (targetRole === "exporter") {
      try {
        await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: "9876500005",
            otp: "123456",
            name: "Sun Agri Exports",
            role: "exporter",
          }),
        });
      } catch {}
      window.location.href = "/marketplace/export";
      return;
    } else if (targetRole === "private_buyer") {
      try {
        await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: "9876500003",
            otp: "123456",
            name: "AgroCorp Sourcing Desk",
            role: "private_buyer",
          }),
        });
      } catch {}
      window.location.href = "/marketplace/direct";
      return;
    } else {
      try {
        await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: "9876543210",
            otp: "123456",
            name: "Ramesh Kumar",
            role: "farmer",
          }),
        });
      } catch {}
      window.location.href = "/marketplace";
      return;
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Top Persona Switcher & National Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                AgriProfit Secondary Marketplace
              </h1>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] tracking-wide uppercase">
                Direct Farm-to-Market
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Transparent MSP procurement, direct buyer trading, group selling aggregation & export intelligence
            </p>
          </div>
        </div>

        {/* SIH Judge Demo Persona Switcher */}
        <div className="flex items-center gap-2 ml-auto flex-wrap bg-slate-50 border border-slate-200 rounded-lg p-1.5">
          <span className="text-[11px] font-bold text-slate-600 px-1">
            Demo Persona:
          </span>
          <button
            type="button"
            onClick={() => handleSwitchPersona("farmer")}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              currentRole === "farmer"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            🌾 Farmer
          </button>
          <button
            type="button"
            onClick={() => handleSwitchPersona("government_buyer")}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              currentRole === "government_buyer"
                ? "bg-[#0b4d75] text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            🏛️ Govt Officer
          </button>
          <button
            type="button"
            onClick={() => handleSwitchPersona("private_buyer")}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              currentRole === "private_buyer"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            🛒 Private Buyer
          </button>
          <button
            type="button"
            onClick={() => handleSwitchPersona("exporter")}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              currentRole === "exporter"
                ? "bg-indigo-700 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            🌍 Exporter
          </button>
        </div>
      </div>

      {/* 2. Search Bar + Wholesale Request Basket (Inspired by UI prompt) */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search crop, buyer, mandi, exporter, procurement center, or group code..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-sm"
          />
        </div>

        {onOpenBasket && (
          <button
            type="button"
            onClick={onOpenBasket}
            className="relative px-4 py-2.5 bg-[#0b4d75] hover:bg-[#083754] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <span className="text-base">🧺</span>
            <span className="hidden sm:inline">Request Basket</span>
            {basketCount > 0 && (
              <span className="bg-amber-400 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {basketCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* 3. Bilateral Channel Navigation: Farmer Produce Portals & Restricted Institutional Desks */}
      <div className="overflow-x-auto pb-1 scrollbar-thin">
        <nav className="flex items-center gap-2 min-w-max">
          {/* Public Farmer Produce Portals */}
          {FARMER_TABS.map((tab) => {
            const isActive = tab.href === "/marketplace" ? pathname === "/marketplace" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            );
          })}

          {/* Institutional Window Divider */}
          <div className="h-6 w-px bg-slate-300 mx-1" />

          {/* Restricted Bilateral Windows */}
          {RESTRICTED_TABS.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? "bg-[#0b4d75] text-white border-[#0b4d75] shadow-sm ring-2 ring-sky-300"
                    : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-900"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black rounded text-[9px] uppercase tracking-wider">
                  {tab.badge}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

