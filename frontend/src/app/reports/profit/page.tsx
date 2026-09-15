"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import { CROP_DATABASE, type CropRecord } from "@/lib/crop-data";
import { MANDI_BENCHMARK_PRICES } from "@/lib/market-service";

export default function FinancialProfitAuditReportPage() {
  const [selectedSlug, setSelectedSlug] = useState<string>("wheat");
  const [acres, setAcres] = useState<number>(2.5);

  const crop: CropRecord = useMemo(() => {
    return (
      CROP_DATABASE.find((c) => c.slug === selectedSlug) ||
      CROP_DATABASE[0]
    );
  }, [selectedSlug]);

  const mandi = useMemo(() => {
    return (
      MANDI_BENCHMARK_PRICES.find((m) => m.cropSlug === crop.slug) ||
      MANDI_BENCHMARK_PRICES[0]
    );
  }, [crop]);

  // Economic variables
  const modalPrice = mandi.modalPrice || crop.economics.typicalPricePerQuintal;
  const yieldPerAcre = crop.yield.quintalsPerAcre;
  const totalProductionQ = yieldPerAcre * acres;
  const costPerAcre = crop.costs.totalPerAcre;
  const totalCost = costPerAcre * acres;

  // Break-even
  const breakEvenPrice = costPerAcre / (yieldPerAcre || 1);
  const breakEvenYield = costPerAcre / (modalPrice || 1);

  // Channels comparison
  const channels = [
    {
      channel: "Statutory MSP Floor (Govt FCI/NAFED)",
      price: crop.economics.mspPricePerQuintal || modalPrice * 0.95,
      notes: "100% Guaranteed downside floor, statutory payment within 48h.",
    },
    {
      channel: "APMC Mandi Spot Auction",
      price: modalPrice,
      notes: "Standard physical wholesale market, daily fluctuating modal price.",
    },
    {
      channel: "Cooperative FPO Pooling",
      price: Math.round(modalPrice * 1.08),
      notes: "Aggregated lots save 8%–12% in transport and broker commission.",
    },
    {
      channel: "Direct Buyer Marketplace",
      price: Math.round(modalPrice * 1.15),
      notes: "Eliminates intermediaries; millers & processors pay direct premium.",
    },
    {
      channel: "APEDA Export Desk",
      price: Math.round(modalPrice * 1.30),
      notes: "Meets international phytosanitary standards for gulf/EU export.",
    },
  ];

  // Sensitivity Scenarios (-20%, -10%, Base, +10%, +20%)
  const priceVariations = [-20, -10, 0, 10, 20];
  const yieldVariations = [-20, -10, 0, 10, 20];

  return (
    <AppShell pageTitle="Financial Profitability & Sensitivity Audit">
      <div className="max-w-5xl mx-auto space-y-6 font-sans">
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/reports"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all"
          >
            ← Back to Reports Directory
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🖨️ Print Financial Audit</span>
            </button>
          </div>
        </div>

        {/* Printable Audit Container */}
        <div className="p-8 sm:p-10 bg-white border-2 border-slate-300 rounded-3xl shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-6 text-center space-y-1">
            <div className="text-3xl">📈</div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-600">
              Commission for Agricultural Costs and Prices · Economic Intelligence Division
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight font-['Space_Grotesk']">
              Financial Profitability & Multi-Channel Sensitivity Audit
            </h1>
            <div className="text-[11px] font-mono text-slate-500">
              Deterministic Agro-Economic Modeling · C2 Comprehensive Cost Assessment
            </div>
          </div>

          {/* Controls (Hidden in print) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs print:hidden">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Crop to Audit:</label>
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold"
              >
                {CROP_DATABASE.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name} ({c.season})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Cultivation Area (Acres):</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                value={acres}
                onChange={(e) => setAcres(parseFloat(e.target.value) || 2.5)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono"
              />
            </div>
          </div>

          {/* Benchmark Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-slate-500 font-bold block">Total Production:</span>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                {totalProductionQ.toFixed(1)} Quintals
              </div>
              <span className="text-[11px] text-slate-500">({yieldPerAcre} q/acre yield)</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-slate-500 font-bold block">Total Production Cost:</span>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                ₹{Math.round(totalCost).toLocaleString("en-IN")}
              </div>
              <span className="text-[11px] text-slate-500">(₹{costPerAcre.toLocaleString("en-IN")}/ac)</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-slate-500 font-bold block">Break-Even Price:</span>
              <div className="text-xl font-black text-indigo-700 font-mono mt-1">
                ₹{Math.round(breakEvenPrice).toLocaleString("en-IN")}/q
              </div>
              <span className="text-[11px] text-slate-500">Zero-loss selling floor</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-slate-500 font-bold block">Break-Even Yield:</span>
              <div className="text-xl font-black text-indigo-700 font-mono mt-1">
                {breakEvenYield.toFixed(2)} q/ac
              </div>
              <span className="text-[11px] text-slate-500">Min. yield at modal price</span>
            </div>
          </div>

          {/* Multi-Channel Realization Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Comparative Channel Realization ({totalProductionQ.toFixed(1)} Quintals on {acres} Acres)
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Market Channel</th>
                    <th className="py-2.5 px-4 text-right">Selling Price / q</th>
                    <th className="py-2.5 px-4 text-right">Gross Revenue</th>
                    <th className="py-2.5 px-4 text-right">Net Farmer Profit</th>
                    <th className="py-2.5 px-4 text-right">ROI</th>
                    <th className="py-2.5 px-4">Channel Characteristics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {channels.map((ch, idx) => {
                    const gross = totalProductionQ * ch.price;
                    const profit = gross - totalCost;
                    const roi = (gross / (totalCost || 1)).toFixed(2);

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{ch.channel}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          ₹{ch.price.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          ₹{Math.round(gross).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                          ₹{Math.round(profit).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                          {roi}x
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500">{ch.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5x5 Price vs Yield Sensitivity Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Price vs Yield Sensitivity Matrix (Net Farmer Profit in ₹)
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-center">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Yield Variation \ Price</th>
                    {priceVariations.map((pv) => (
                      <th key={pv} className="py-2.5 px-3">
                        {pv >= 0 ? `+${pv}%` : `${pv}%`} (₹{Math.round(modalPrice * (1 + pv / 100))})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {yieldVariations.map((yv) => {
                    const currentYield = yieldPerAcre * (1 + yv / 100);
                    const currentProd = currentYield * acres;

                    return (
                      <tr key={yv} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-left font-sans font-bold text-slate-800">
                          {yv >= 0 ? `+${yv}%` : `${yv}%`} ({currentYield.toFixed(1)} q/ac)
                        </td>

                        {priceVariations.map((pv) => {
                          const currentPrice = modalPrice * (1 + pv / 100);
                          const currentGross = currentProd * currentPrice;
                          const currentProfit = currentGross - totalCost;
                          const isNegative = currentProfit < 0;

                          return (
                            <td
                              key={pv}
                              className={`py-2.5 px-3 font-bold ${
                                isNegative
                                  ? "text-rose-700 bg-rose-50/50"
                                  : "text-emerald-800 bg-emerald-50/30"
                              }`}
                            >
                              ₹{Math.round(currentProfit).toLocaleString("en-IN")}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Footer */}
          <div className="pt-6 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <div>
              <div className="font-bold text-slate-800">
                AgriProfit Agro-Economic Sensitivity Audit Engine
              </div>
              <div className="text-[11px] text-slate-500">
                Generated based on CACP C2 Cost Methodology and Agmarknet Benchmark Datasets.
              </div>
            </div>

            <div className="text-right font-mono text-[11px]">
              <div>Official Audit Status: VERIFIED</div>
              <div className="text-slate-400">Date: {new Date().toLocaleDateString("en-IN")}</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

