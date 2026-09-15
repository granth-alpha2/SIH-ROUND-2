"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import NcdexCommodityCharts from "../../components/NcdexCommodityCharts";

export default function NcdexCommodityMarketPage() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("KAPAS");

  return (
    <AppShell pageTitle="NCDEX Commodity Futures & Derivatives">
      <div className="max-w-6xl mx-auto space-y-8 font-sans">
        {/* Header Banner */}
        <header className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">📈</span>
              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-black text-xs uppercase tracking-wider border border-indigo-200">
                Institutional Financial Exchange
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/market-services"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all"
              >
                ← Back to Market Services
              </Link>
              <Link
                href="/markets"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all"
              >
                APMC Mandi Board
              </Link>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
            NCDEX Agricultural Commodity Derivatives & Forward Curves
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            Real-time futures contracts, forward delivery price curves, and spot-futures basis tracking from the National Commodity & Derivatives Exchange (NCDEX). Designed for farmers and FPOs to lock in harvest prices and hedge against post-harvest market crashes.
          </p>
        </header>

        {/* NcdexCommodityCharts Live Component */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <NcdexCommodityCharts
            selectedSymbol={selectedSymbol}
            onSelectCommodity={(sym) => setSelectedSymbol(sym)}
          />
        </div>

        {/* Hedging & FPO Advisory Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <h3 className="font-black text-slate-900 text-sm tracking-tight font-['Space_Grotesk']">
                How Farmers & FPOs Can Lock Harvest Prices
              </h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              When forward futures prices are higher than spot prices (contango market), farmers can sell futures contracts on NCDEX matching their anticipated harvest volume. This guarantees a predetermined selling price regardless of how low spot mandi prices may plunge at harvest time.
            </p>
          </div>

          <div className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <h3 className="font-black text-slate-900 text-sm tracking-tight font-['Space_Grotesk']">
                Understanding Basis Spread (Spot – Futures)
              </h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Basis represents the numerical difference between the local physical APMC spot price and the near-month NCDEX futures contract price. A narrowing basis indicates strong spot demand, whereas an expanding negative basis signals impending supply gluts in physical mandis.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

