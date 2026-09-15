"use client";

import React from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";

export default function ReportsDirectoryPage() {
  const reports = [
    {
      id: "farm-report",
      title: "Cadastral Farm Land & Boundary Dossier",
      tag: "PostGIS WGS-84",
      icon: "🗺️",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description: "Official land parcel summary containing verified geodesic acreage in Acres and Hectares, GPS boundary coordinates, and agro-climatic zone classification.",
      link: "/reports/farm",
      actionText: "View Land Dossier",
      stats: "Georeferenced Land Record",
    },
    {
      id: "soil-report",
      title: "Multi-Layer Soil Health Card",
      tag: "Soil Health Card Scheme",
      icon: "🧪",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
      description: "Government-standard Soil Health Card covering 0–15cm (surface), 15–30cm (subsurface), and 30–60cm (rootzone) Nitrogen, Phosphorus, Potassium, pH, and Organic Carbon indices.",
      link: "/reports/soil",
      actionText: "Open Soil Health Card",
      stats: "3-Layer Diagnostic Card",
    },
    {
      id: "crop-plan",
      title: "Seasonal Crop Lifecycle Advisory Dossier",
      tag: "120-Day ICAR Roadmap",
      icon: "📑",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      description: "Comprehensive printable farm roadmap with accepted 4-part crop allocation, chronological sowing and fertilizer split timelines, and risk mitigation advice.",
      link: "/recommendations/plan",
      actionText: "View Advisory Dossier",
      stats: "Printable / PDF Ready",
    },
    {
      id: "profit-report",
      title: "Financial Profitability & Sensitivity Audit",
      tag: "Agro-Economic Audit",
      icon: "📈",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
      description: "Deterministic economic assessment comparing baseline Mandi earnings, CACP MSP floors, cooperative group pooling benefits, and export realizations with break-even curves.",
      link: "/reports/profit",
      actionText: "Audit Profit Scenarios",
      stats: "Break-Even & Sensitivity Analysis",
    },
    {
      id: "schemes",
      title: "Central & State Welfare Schemes Directory",
      tag: "Direct Benefit Transfer",
      icon: "🏛️",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
      description: "Official directory of government assistance programs including PM-KISAN (₹6,000/yr), PMFBY crop insurance, Kisan Credit Card, and Agriculture Infrastructure Fund with step-by-step application guidance.",
      link: "/schemes",
      actionText: "Explore Schemes",
      stats: "PM-KISAN · PMFBY · AIF",
    },
  ];

  return (
    <AppShell pageTitle="Reports & Official Records">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Service Header */}
        <header className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📑</span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-black text-xs uppercase tracking-wider">
              Service Directory · Layer 1
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
              Official Agricultural Reports & Farm Records
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              Generate, print, and audit verifiable government-standard farm dossiers, soil health cards, seasonal crop calendars, and welfare scheme eligibility records.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 font-bold">
              Format: <strong className="text-slate-900">National Government Standard</strong>
            </span>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-bold">
              Verification: Cryptographically Timestamped
            </span>
          </div>
        </header>

        {/* 5 Progressive Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((rpt) => (
            <div
              key={rpt.id}
              className="p-6 bg-white border-2 border-slate-200 hover:border-emerald-600 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    {rpt.icon}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${rpt.badgeColor}`}>
                    {rpt.tag}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {rpt.title}
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {rpt.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-500">
                  {rpt.stats}
                </span>

                <Link
                  href={rpt.link}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{rpt.actionText}</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

