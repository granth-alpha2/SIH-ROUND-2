"use client";

import React from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";

export default function MarketServicesDirectoryPage() {
  const services = [
    {
      id: "prices",
      title: "APMC Mandi Daily Prices",
      tag: "Live Mandi Benchmarks",
      icon: "📊",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description: "Real-time modal prices, daily arrivals in tonnes, and 6-month historical volatility trends across 15+ major Agricultural Produce Market Committees.",
      link: "/markets",
      actionText: "View Mandi Prices",
      stats: "15+ APMC Mandis Monitored",
    },
    {
      id: "msp",
      title: "National MSP Policy Catalog",
      tag: "CACP Official Gazette",
      icon: "📜",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
      description: "Official Minimum Support Price (MSP) rate cards determined by the Commission for Agricultural Costs and Prices (CACP) for the 2024–25 season.",
      link: "/market-services/msp",
      actionText: "Open MSP Catalog",
      stats: "24 Notified Commodities",
    },
    {
      id: "ncdex",
      title: "NCDEX Commodity Derivatives",
      tag: "Real-Time Exchange",
      icon: "📈",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      description: "Official National Commodity & Derivatives Exchange futures curves, basis spreads (settlement vs spot), and backwardation / contango market signals.",
      link: "/market-services/ncdex",
      actionText: "Explore NCDEX Curves",
      stats: "Live Futures & Basis Spreads",
    },
    {
      id: "marketplace",
      title: "Secondary Produce Marketplace",
      tag: "5-Channel Trading Desk",
      icon: "🏪",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
      description: "Integrated trade ecosystem: Sell at MSP with 12-digit authorization codes, trade directly with verified agribusiness buyers, aggregate in cooperative farmer groups, or access APEDA export corridors.",
      link: "/marketplace",
      actionText: "Open Marketplace",
      stats: "Direct · MSP · Groups · Export",
    },
  ];

  return (
    <AppShell pageTitle="Market Services Directory">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Service Header */}
        <header className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">💰</span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-black text-xs uppercase tracking-wider">
              Service Directory · Layer 1
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
              Market Intelligence, MSP & Commodity Trading Services
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              Official price discovery tools, regulatory MSP safety nets, exchange-traded futures analytics, and transparent multi-channel selling for Indian agricultural producers.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 font-bold">
              Benchmark Mandis: <strong className="text-slate-900">Agmarknet Verified</strong>
            </span>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-bold">
              Procurement Season: Rabi 2024–25
            </span>
          </div>
        </header>

        {/* 4 Progressive Service Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="p-6 bg-white border-2 border-slate-200 hover:border-emerald-600 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    {svc.icon}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${svc.badgeColor}`}>
                    {svc.tag}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {svc.title}
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {svc.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-500">
                  {svc.stats}
                </span>

                <Link
                  href={svc.link}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{svc.actionText}</span>
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

