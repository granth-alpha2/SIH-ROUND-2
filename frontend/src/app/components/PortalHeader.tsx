"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSelector from "./LanguageSelector";
import PageAudioTranslator from "./PageAudioTranslator";

interface PortalHeaderProps {
  userName?: string;
  userRole?: string;
  onOpenProfile?: () => void;
}

export default function PortalHeader({
  userName,
  userRole,
  onOpenProfile,
}: PortalHeaderProps) {
  const pathname = usePathname();
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/", icon: "🏠" },
    { label: "Farm Services", href: "/farm", icon: "🌾", matchPrefix: "/farm" },
    { label: "Crop Services", href: "/crop-services", icon: "🌱", matchPrefix: "/crop" },
    { label: "Market Services", href: "/market-services", icon: "💰", matchPrefix: "/market" },
    { label: "Reports & Records", href: "/reports", icon: "📑", matchPrefix: "/reports" },
    { label: "Schemes", href: "/schemes", icon: "🏛️" },
  ];

  function isActive(href: string, matchPrefix?: string) {
    if (href === "/") return pathname === "/";
    if (matchPrefix) return pathname.startsWith(matchPrefix);
    return pathname.startsWith(href);
  }

  return (
    <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-40 shadow-xs font-sans">
      {/* 1. Official Government Top Tricolor Strip & Accessibility Banner */}
      <div className="bg-[#0b3b59] text-white px-4 py-1 text-[11px] font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-300">भारत सरकार | Government of India</span>
          <span className="text-slate-300 hidden sm:inline">· Ministry of Agriculture & Farmers Welfare</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-200 hidden md:inline">24x7 Kisan Call Center: 1800-180-1551</span>
          <PageAudioTranslator compact />
          <LanguageSelector compact />
        </div>
      </div>

      {/* 2. Main Portal Title & National Portal Emblem */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-2xl shadow-sm group-hover:bg-emerald-800 transition-colors shrink-0">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-['Space_Grotesk']">
                AgriProfit
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] tracking-wider uppercase border border-emerald-300">
                National Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
              Integrated Digital Agriculture & Farm Decision Support Service
            </p>
          </div>
        </Link>

        {/* User Identity & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {userName ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
            >
              <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-xs">
                {userName.charAt(0).toUpperCase()}
              </span>
              <div className="text-left hidden sm:block">
                <span className="block font-bold text-slate-900 leading-tight">{userName}</span>
                <span className="text-[10px] text-slate-500 font-normal capitalize">{userRole?.replace("_", " ") || "Farmer"}</span>
              </div>
            </button>
          ) : (
            <Link
              href="/login"
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              Kisan Sign In
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <span className="text-lg leading-none">☰</span>
          </button>
        </div>
      </div>

      {/* 3. Primary Service Directory Navigation Bar */}
      <nav className="bg-slate-50 border-t border-slate-200 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href, item.matchPrefix);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
                    active
                      ? "border-emerald-700 text-emerald-900 bg-white shadow-2xs font-extrabold"
                      : "border-transparent text-slate-700 hover:text-emerald-800 hover:bg-slate-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/assistant"
              className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-[#0b4d75] border border-sky-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
            >
              <span>🔬</span>
              <span>AI Kisan Agronomist</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 4. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 p-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                  isActive(item.href, item.matchPrefix)
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            <Link
              href="/assistant"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl text-xs font-bold flex items-center gap-2 bg-sky-50 text-[#0b4d75] border border-sky-200 mt-2"
            >
              <span className="text-base">🔬</span>
              <span>AI Kisan Agronomist & Vision</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

