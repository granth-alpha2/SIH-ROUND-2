"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import { OFFICIAL_MSP_CATALOG, type MspRecord } from "@/lib/market-service";

export default function MspCatalogPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filtered = OFFICIAL_MSP_CATALOG.filter((item) => {
    if (selectedSeason !== "All" && item.season !== selectedSeason) return false;
    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.cropName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.procurementAgencies.some((a) => a.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <AppShell pageTitle="National Minimum Support Price (MSP) Catalog">
      <div className="max-w-6xl mx-auto space-y-8 font-sans">
        {/* Header Banner */}
        <header className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🏛️</span>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-xs uppercase tracking-wider border border-emerald-200">
                Statutory Procurement Floor
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer"
              >
                🖨️ Print Catalog
              </button>
              <Link
                href="/market-services"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all"
              >
                ← Back to Market Services
              </Link>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
            National Minimum Support Price (MSP) Master Catalog
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            Statutory MSP rates approved by the Cabinet Committee on Economic Affairs (CCEA) following recommendations of the Commission for Agricultural Costs and Prices (CACP). Guarantees a minimum return of 50% to 60% over all-India weighted average cost of production (A2+FL).
          </p>
        </header>

        {/* Filter Controls Bar */}
        <div className="p-5 bg-white border-2 border-slate-200 rounded-3xl shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-black text-slate-700 uppercase tracking-wider block mb-1">
              Search Crop or Agency:
            </label>
            <input
              type="text"
              placeholder="Search wheat, mustard, FCI, NAFED..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            />
          </div>

          <div>
            <label className="font-black text-slate-700 uppercase tracking-wider block mb-1">
              Cropping Season:
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="All">All Seasons (Kharif, Rabi, Commercial)</option>
              <option value="Kharif">Kharif Season</option>
              <option value="Rabi">Rabi Season</option>
              <option value="Commercial">Commercial Crops</option>
            </select>
          </div>

          <div>
            <label className="font-black text-slate-700 uppercase tracking-wider block mb-1">
              Commodity Category:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="All">All Categories</option>
              <option value="Cereal">Cereals</option>
              <option value="Pulse">Pulses</option>
              <option value="Oilseed">Oilseeds</option>
              <option value="Cash Crop">Commercial / Cash Crops</option>
            </select>
          </div>
        </div>

        {/* MSP Master Table */}
        <section className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
              Official CCEA Statutory MSP Notified Rates ({filtered.length} Commodities)
            </h2>
            <span className="text-xs font-mono font-bold text-slate-500">
              Crop Marketing Year: 2024–25
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Commodity</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Season</th>
                  <th className="py-3 px-3 text-right">Statutory MSP</th>
                  <th className="py-3 px-3 text-right">Cost A2+FL</th>
                  <th className="py-3 px-3 text-right">Return Margin</th>
                  <th className="py-3 px-3">Nodal Procurement Agencies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3">
                      <strong className="text-sm font-black text-slate-900 block">
                        {item.cropName}
                      </strong>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.provenance.notificationNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-bold text-[10px]">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-black text-[10px] ${
                          item.season === "Rabi"
                            ? "bg-sky-100 text-sky-800"
                            : item.season === "Kharif"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.season}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono">
                      <div className="text-sm font-black text-emerald-800">
                        ₹{item.mspPricePerQuintal.toLocaleString("en-IN")}
                      </div>
                      <span className="text-[10px] text-slate-500">per quintal</span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-600">
                      ₹{item.c2CostEstimatePerQuintal.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[11px]">
                        +{item.returnOverCostPct}%
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {item.procurementAgencies.map((agency, aIdx) => (
                          <span
                            key={aIdx}
                            className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-800"
                          >
                            {agency}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Procurement Assistance Callout */}
        <div className="p-6 bg-emerald-50/80 border-2 border-emerald-200 rounded-3xl flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <strong className="text-emerald-950 font-black text-sm block">
              Government Mandi FCI & NAFED Procurement Center Booking
            </strong>
            <p className="text-emerald-900">
              Farmers can register lot deliveries directly to local government procurement centers via the Government Procurement Console.
            </p>
          </div>
          <Link
            href="/marketplace/government"
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black shadow-xs transition-all"
          >
            Access FCI Procurement Console →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

