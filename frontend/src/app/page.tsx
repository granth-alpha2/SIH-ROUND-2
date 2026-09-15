"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "./components/AppShell";
import type { FarmRecord } from "./api/farms/repository";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { usePageAudioContent } from "@/lib/i18n/PageAudioRegistry";
import LanguageSelector from "./components/LanguageSelector";
import PageAudioTranslator from "./components/PageAudioTranslator";

export default function Home() {
  const { t } = useTranslation();
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSourceModal, setShowSourceModal] = useState(false);

  // Register clean readable audio summary for screen readers & TTS
  usePageAudioContent({
    title: t("dashboard.title", "AgriProfit — National Agriculture Digital Services Portal"),
    summary: t(
      "dashboard.subtitle",
      "Official government digital service portal for land mapping, crop planning, mandi market prices, and official agricultural records."
    ),
    sections: [
      {
        heading: t("dashboard.servicePillars", "Primary Service Pillars"),
        text: "Farm Services for land boundaries and soil. Crop Services for crop suitability and planning. Market Services for APMC prices and marketplace. Reports for official dossiers.",
      },
    ],
    dependencies: [farms.length],
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/farms");
        if (res.ok) {
          const json = await res.json();
          setFarms(json.farms || []);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalAcres = farms.reduce((sum, f) => sum + f.areaAcres, 0);
  const displayAcres = totalAcres > 0 ? totalAcres : 2.5;

  const servicePillars = [
    {
      id: "farm-services",
      title: "Farm Services",
      hindiTitle: "खेत और भूमि सेवाएं",
      tag: "Land · Soil · Climate",
      icon: "🌾",
      themeColor: "from-emerald-800 to-emerald-950",
      accentBg: "bg-emerald-50 text-emerald-900 border-emerald-300",
      description: "Manage registered land plots, outline field boundaries using satellite polygon tools, test 3-layer soil health, and monitor agro-weather.",
      link: "/farm",
      buttonText: "Open Farm Services",
      quickLinks: [
        { label: "My Farm Plots", href: "/farms" },
        { label: "Map Field Boundary", href: "/farms/new" },
        { label: "Soil Testing & Health", href: "/farm/soil" },
        { label: "Weather Advisory", href: "/weather" },
      ],
    },
    {
      id: "crop-services",
      title: "Crop Services",
      hindiTitle: "फसल चयन और प्रबंधन",
      tag: "Planning · Agronomy · Advisory",
      icon: "🌱",
      themeColor: "from-sky-900 to-slate-900",
      accentBg: "bg-sky-50 text-sky-900 border-sky-300",
      description: "Discover suitable crops for your farm conditions with the progressive planning wizard, compare alternative crops, and access ICAR package-of-practices.",
      link: "/crop-services",
      buttonText: "Open Crop Services",
      quickLinks: [
        { label: "Crop Planning Wizard", href: "/crop-services/planning" },
        { label: "Compare Crops", href: "/crop-services/compare" },
        { label: "Short-Duration Crops", href: "/crop-services/seasonal" },
        { label: "AI Agronomist Chat", href: "/assistant" },
      ],
    },
    {
      id: "market-services",
      title: "Market Services",
      hindiTitle: "मंडी भाव और ई-बाजार",
      tag: "APMC · MSP · Derivatives · Trade",
      icon: "💰",
      themeColor: "from-amber-900 to-slate-950",
      accentBg: "bg-amber-50 text-amber-900 border-amber-300",
      description: "Track live APMC mandi prices and arrivals, review official CACP MSP floors, inspect NCDEX futures curves, or trade produce via the 5-channel marketplace.",
      link: "/market-services",
      buttonText: "Open Market Services",
      quickLinks: [
        { label: "APMC Daily Prices", href: "/markets" },
        { label: "Official MSP Catalog", href: "/market-services/msp" },
        { label: "NCDEX Commodity Curves", href: "/market-services/ncdex" },
        { label: "Sell Produce / Marketplace", href: "/marketplace" },
      ],
    },
    {
      id: "reports-services",
      title: "Reports & Records",
      hindiTitle: "सरकारी रिपोर्ट और दस्तावेज",
      tag: "Cadastral · Soil Cards · Schemes",
      icon: "📑",
      themeColor: "from-indigo-950 to-slate-900",
      accentBg: "bg-indigo-50 text-indigo-900 border-indigo-300",
      description: "Generate and download cadastral land boundary dossiers, official 3-layer Soil Health Cards, 120-day action schedules, and apply for government welfare schemes.",
      link: "/reports",
      buttonText: "Open Reports & Records",
      quickLinks: [
        { label: "Cadastral Land Dossier", href: "/reports/farm" },
        { label: "Soil Health Card", href: "/reports/soil" },
        { label: "Seasonal Action Plan", href: "/recommendations/plan" },
        { label: "Government Schemes", href: "/schemes" },
      ],
    },
  ];

  return (
    <AppShell pageTitle="National Agricultural Services Portal">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 1. Official Government Header Banner & Language Controls */}
        <header className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-emerald-700 text-white rounded-lg font-black text-xs uppercase tracking-wider">
                🏛️ किसान सेवा केंद्र · National Farmer Service Portal
              </span>
              <span className="text-xs font-bold text-slate-500">
                कृषि वर्ष 2024–25 · Rabi Season Active
              </span>
            </div>

            <div className="flex items-center gap-2">
              <PageAudioTranslator compact />
              <LanguageSelector compact />
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
              Agriculture Services Portal | कृषि सेवा पोर्टल
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              Unified digital gateway for Indian farmers: Select a service below to begin your progressive workflow.
            </p>
          </div>

          {/* Active Farmer & Land Context Pill */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3.5 py-1.5 bg-slate-100 rounded-xl border border-slate-200 font-bold text-slate-800 flex items-center gap-1.5">
              <span>📍</span>
              <span>Registered Land: <strong className="text-slate-900">{loading ? "..." : `${displayAcres.toFixed(2)} Acres (${farms.length} Plot${farms.length === 1 ? "" : "s"})`}</strong></span>
            </span>
            <span className="px-3.5 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 font-bold text-emerald-800 flex items-center gap-1.5">
              <span>🌾</span>
              <span>Primary Agro-Zone: Punjab / Trans-Gangetic Plains</span>
            </span>
            <span className="px-3.5 py-1.5 bg-sky-50 rounded-xl border border-sky-200 font-bold text-[#0b4d75] flex items-center gap-1.5">
              <span>☁️</span>
              <span>Weather: Clear Sky, 26°C · Spray Window Open</span>
            </span>
          </div>
        </header>

        {/* 2. Main Question: What would you like to do? (4 Primary Service Pillars) */}
        <section aria-labelledby="portal-pillars-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="portal-pillars-heading" className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 font-['Space_Grotesk']">
              <span>📌</span>
              <span>What would you like to do? / मुख्य सेवाएं</span>
            </h2>
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              Progressive Service Directory · Layer 0
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {servicePillars.map((pillar) => (
              <div
                key={pillar.id}
                className="bg-white border-2 border-slate-200 hover:border-emerald-600 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Pillar Header with Gradient Accent */}
                <div className="p-6 sm:p-7 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 text-3xl flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      {pillar.icon}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${pillar.accentBg}`}>
                      {pillar.tag}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-emerald-800 transition-colors font-['Space_Grotesk']">
                      {pillar.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-400">
                      {pillar.hindiTitle}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                      {pillar.description}
                    </p>
                  </div>

                  {/* Sub-Service Quick Links */}
                  <div className="pt-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      Sub-Services inside:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {pillar.quickLinks.map((ql) => (
                        <Link
                          key={ql.href}
                          href={ql.href}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-800 border border-slate-200 transition-colors flex items-center justify-between"
                        >
                          <span className="truncate">{ql.label}</span>
                          <span className="text-slate-400 text-[10px]">›</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pillar Bottom Action CTA */}
                <div className="p-4 sm:px-7 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-500">
                    Progressive Service Hierarchy
                  </span>

                  <Link
                    href={pillar.link}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-2 cursor-pointer group-hover:bg-emerald-800"
                  >
                    <span>{pillar.buttonText}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Quick Kisan Seva Fast-Access Row */}
        <section aria-labelledby="quick-services-heading" className="p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 id="quick-services-heading" className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>⚡</span>
                <span>त्वरित सेवाएं | Kisan Fast-Access Services</span>
              </h2>
              <p className="text-xs text-slate-500">
                Direct access to high-priority agricultural welfare, vision diagnosis, and market operations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/schemes"
              className="p-4 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-600 rounded-2xl text-center space-y-2 transition-all shadow-2xs group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 text-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                🏛️
              </div>
              <strong className="block text-xs font-black text-slate-900 group-hover:text-emerald-800">
                Government Schemes
              </strong>
              <p className="text-[11px] text-slate-500 leading-tight">
                PM-KISAN, PMFBY & Subsidies
              </p>
            </Link>

            <Link
              href="/assistant"
              className="p-4 bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-600 rounded-2xl text-center space-y-2 transition-all shadow-2xs group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 text-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                🔬
              </div>
              <strong className="block text-xs font-black text-slate-900 group-hover:text-sky-800">
                AI Leaf Disease Scan
              </strong>
              <p className="text-[11px] text-slate-500 leading-tight">
                Computer-vision leaf inspection
              </p>
            </Link>

            <Link
              href="/marketplace/msp"
              className="p-4 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-600 rounded-2xl text-center space-y-2 transition-all shadow-2xs group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 text-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                🌾
              </div>
              <strong className="block text-xs font-black text-slate-900 group-hover:text-amber-800">
                Sell Produce at MSP
              </strong>
              <p className="text-[11px] text-slate-500 leading-tight">
                Get 12-digit Mandi gate code
              </p>
            </Link>

            <Link
              href="/weather"
              className="p-4 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-600 rounded-2xl text-center space-y-2 transition-all shadow-2xs group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 text-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                ☁️
              </div>
              <strong className="block text-xs font-black text-slate-900 group-hover:text-indigo-800">
                Rain & Spray Window
              </strong>
              <p className="text-[11px] text-slate-500 leading-tight">
                7-day meteorological forecast
              </p>
            </Link>
          </div>
        </section>

        {/* 4. Mandatory Data Source & Freshness Metadata Bar */}
        <section className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900">Official Data Sources:</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
              Live Open-Meteo Weather
            </span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
              Static Agmarknet Mandi Benchmarks
            </span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
              CACP 2024-25 MSP Floors
            </span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold">
              NCDEX Bhav Copy
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-slate-500">Last Synced: Today, 08:30 AM IST</span>
            <button
              type="button"
              onClick={() => setShowSourceModal(true)}
              className="text-[#0b4d75] font-bold underline hover:text-[#083754] cursor-pointer"
            >
              [View Source Provenance]
            </button>
          </div>
        </section>

        {/* Data Provenance Modal */}
        {showSourceModal && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSourceModal(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="space-y-0.5">
                  <h3 className="font-black text-slate-900 text-lg">Official Data Provenance Notice</h3>
                  <p className="text-xs text-slate-500">Regulatory standards & data verification architecture</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSourceModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block">1. Minimum Support Prices (MSP)</strong>
                  <p>Derived strictly from the official Gazette notifications issued by the Commission for Agricultural Costs and Prices (CACP), Ministry of Agriculture and Farmers Welfare, Government of India.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block">2. Daily APMC Mandi Modal Prices</strong>
                  <p>Indexed against Directorate of Marketing & Inspection (DMI) / Agmarknet benchmark arrivals across northern grain mandis.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block">3. Meteorological Data</strong>
                  <p>Sourced from high-resolution Open-Meteo European Centre for Medium-Range Weather Forecasts (ECMWF) agro-climatic APIs.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block">4. NCDEX Commodity Derivatives</strong>
                  <p>Settlement and spot contract data calibrated against National Commodity & Derivatives Exchange public trading disclosures.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSourceModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Provenance Notice
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
