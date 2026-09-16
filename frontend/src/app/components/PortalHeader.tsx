"use client";

import React, { useState, useEffect } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    try {
      const savedMode =
        localStorage.getItem("agriprofit_mode") ||
        (localStorage.getItem("agriprofit_theme") === "night" ? "night" : "day");
      setIsNight(savedMode === "night");
      if (savedMode === "night") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }, []);

  function toggleTheme() {
    const nextMode = isNight ? "day" : "night";
    setIsNight(!isNight);
    try {
      localStorage.setItem("agriprofit_mode", nextMode);
      localStorage.setItem("agriprofit_theme", nextMode);
      document.documentElement.setAttribute("data-mode", nextMode);
      document.documentElement.setAttribute("data-theme", nextMode);
      if (nextMode === "night") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }

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
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs font-sans">
      {/* 1. Official Government Top Tricolor Strip & Accessibility Banner */}
      <div className="bg-[#0b3b59] text-white px-4 py-1 text-[11px] font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-300">भारत सरकार | Government of India</span>
          <span className="text-slate-300 hidden sm:inline">· Ministry of Agriculture & Farmers Welfare</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-slate-200 hidden md:inline">24x7 Kisan Call Center: 1800-180-1551</span>
          
          {/* Day / Night Theme Mode Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isNight ? "Switch to Day Mode (Crisp Daylight)" : "Switch to Night Mode (Calm OLED Dark)"}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-all cursor-pointer border border-white/20"
            aria-label="Toggle Day or Night theme"
          >
            <span>{isNight ? "🌙 Night" : "☀️ Day"}</span>
          </button>

          <PageAudioTranslator compact />
          <LanguageSelector compact />
        </div>
      </div>

      {/* 2. Main Portal Title & National Portal Emblem */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-emerald-800 dark:bg-emerald-700 text-white flex items-center justify-center font-bold text-xl shadow-xs group-hover:bg-emerald-900 transition-colors shrink-0">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
                AgriProfit
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded font-semibold text-[10px] tracking-wider uppercase border border-emerald-300 dark:border-emerald-800/60">
                National Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-none mt-0.5">
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
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <span className="w-7 h-7 rounded-md bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                {userName.charAt(0).toUpperCase()}
              </span>
              <div className="text-left hidden sm:block">
                <span className="block font-semibold text-slate-900 dark:text-slate-100 leading-tight">{userName}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal capitalize">{userRole?.replace("_", " ") || "Farmer"}</span>
              </div>
            </button>
          ) : (
            <Link
              href="/login"
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
            >
              Kisan Sign In
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <span className="text-lg leading-none">☰</span>
          </button>
        </div>
      </div>

      {/* 3. Primary Service Directory Navigation Bar */}
      <nav className="bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href, item.matchPrefix);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 text-xs font-semibold transition-all flex items-center gap-1.5 border-b-2 ${
                    active
                      ? "border-emerald-800 dark:border-emerald-500 text-emerald-900 dark:text-emerald-300 bg-white dark:bg-slate-800 shadow-2xs font-bold"
                      : "border-transparent text-slate-600 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
              className="px-3 py-1 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-[#0b4d75] dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-md text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <span>🔬</span>
              <span>AI Kisan Agronomist</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 4. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                  isActive(item.href, item.matchPrefix)
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            <Link
              href="/assistant"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 bg-sky-50 dark:bg-sky-950/40 text-[#0b4d75] dark:text-sky-300 border border-sky-200 dark:border-sky-800 mt-2"
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
