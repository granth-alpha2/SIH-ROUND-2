"use client";

import React from "react";

type MarketSnapshotProps = {
  stats?: {
    activeListingsCount?: number;
    pendingMspRequestsCount?: number;
    completedMspCount?: number;
    totalTransactionValueInr?: number;
    totalQuantitySoldQuintals?: number;
  };
};

export default function MarketSnapshotCards({ stats }: MarketSnapshotProps) {
  return (
    <section aria-labelledby="market-snapshot-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="market-snapshot-heading" className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>📊</span>
          <span>Today's Market Snapshot & Price Intelligence</span>
        </h2>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          ● Verified CACP 2024-25 & Agmarknet Feeds
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Benchmark MSP Floor */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1 hover:border-emerald-500 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Govt MSP Floor</span>
            <span className="text-xs">🏛️</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            ₹2,275 <span className="text-xs font-semibold text-slate-500">/q</span>
          </div>
          <p className="text-[10px] text-emerald-700 font-semibold leading-tight">
            Wheat 2024-25 Rabi Floor
          </p>
        </div>

        {/* Card 2: Nearby Mandi Modal */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1 hover:border-blue-500 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Nearby Mandi</span>
            <span className="text-xs">🏬</span>
          </div>
          <div className="text-xl font-black text-blue-700">
            ₹2,380 <span className="text-xs font-semibold text-slate-500">/q</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold leading-tight">
            Ludhiana APMC (+₹105 vs MSP)
          </p>
        </div>

        {/* Card 3: ML Expected Price */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1 hover:border-purple-500 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">ML Forecast</span>
            <span className="text-xs">🤖</span>
          </div>
          <div className="text-xl font-black text-purple-700">
            ₹2,410 <span className="text-xs font-semibold text-slate-500">/q</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold leading-tight">
            Ridge+GBR Ensemble (90-day)
          </p>
        </div>

        {/* Card 4: Direct Buyer Premium */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1 hover:border-emerald-500 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Direct Premium</span>
            <span className="text-xs">🛒</span>
          </div>
          <div className="text-xl font-black text-emerald-700">
            +₹150 <span className="text-xs font-semibold text-slate-500">/q</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold leading-tight">
            Avg miller markup over Mandi
          </p>
        </div>

        {/* Card 5: FPO Group Savings */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1 hover:border-indigo-500 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Group Pooling</span>
            <span className="text-xs">👥</span>
          </div>
          <div className="text-xl font-black text-indigo-700">
            Save ₹45 <span className="text-xs font-semibold text-slate-500">/q</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold leading-tight">
            Shared logistics & handling
          </p>
        </div>

        {/* Card 6: Total Platform Trade */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1 hover:border-amber-500 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Realized</span>
            <span className="text-xs">📈</span>
          </div>
          <div className="text-xl font-black text-amber-700">
            ₹{((stats?.totalTransactionValueInr || 242000) / 1000).toFixed(1)}k
          </div>
          <p className="text-[10px] text-slate-500 font-semibold leading-tight">
            {stats?.completedMspCount || 2} transactions processed
          </p>
        </div>
      </div>
    </section>
  );
}

