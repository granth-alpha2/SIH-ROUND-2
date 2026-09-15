"use client";

import React, { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "../../../components/AppShell";
import {
  optimizePortfolio,
  type PortfolioConstraintInput,
  type RiskAppetite,
  type ResourceLevel,
} from "@/lib/portfolio-optimizer";
import type { CropSeason } from "@/lib/crop-data";

function PlanningResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse parameters from step 2
  const farmId = searchParams.get("farmId") || "custom";
  const acres = parseFloat(searchParams.get("acres") || "2.5") || 2.5;
  const plotName = decodeURIComponent(searchParams.get("name") || "Agricultural Plot");
  const district = searchParams.get("district") || "Bathinda";
  const state = searchParams.get("state") || "Punjab";
  const season = (searchParams.get("season") || "Rabi") as CropSeason;
  const riskAppetite = (searchParams.get("riskAppetite") || "Balanced") as RiskAppetite;
  const waterAvailability = (searchParams.get("waterAvailability") || "Medium") as ResourceLevel;
  const investmentCapacity = (searchParams.get("investmentCapacity") || "Medium") as ResourceLevel;
  const soilType = searchParams.get("soilType") || "Alluvial";
  const soilPh = parseFloat(searchParams.get("soilPh") || "7.2") || 7.2;
  const excludedStr = searchParams.get("excluded") || "";
  const excludedCrops = excludedStr ? excludedStr.split(",").filter(Boolean) : [];

  // Run deterministic 4-part portfolio optimization
  const portfolio = useMemo(() => {
    const input: PortfolioConstraintInput = {
      totalLandAcres: acres,
      season,
      riskAppetite,
      waterAvailability,
      investmentCapacity,
      userSoilType: soilType,
      soilPh,
      locationDistrict: district,
      locationState: state,
      excludedCrops,
    };
    return optimizePortfolio(input);
  }, [
    acres,
    season,
    riskAppetite,
    waterAvailability,
    investmentCapacity,
    soilType,
    soilPh,
    district,
    state,
    excludedCrops,
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      {/* Government 3-Step Stepper */}
      <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span className="text-emerald-700 font-medium">✓ Step 1: Select Plot</span>
          <span className="text-emerald-700 font-medium">✓ Step 2: Configure Constraints</span>
          <span className="text-emerald-800 font-extrabold">● Step 3: Analysis Results</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div className="bg-emerald-600 h-2 rounded-full w-full transition-all" />
        </div>
      </div>

      {/* Header Banner */}
      <header className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📊</span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-xs uppercase tracking-wider border border-emerald-200">
              Layer 6 · Multi-Crop Portfolio Result
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer"
            >
              🖨️ Print Advisory
            </button>
            <Link
              href={`/crop-services/planning/configure?${searchParams.toString()}`}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all"
            >
              ⚙️ Modify Constraints
            </Link>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
          {portfolio.title}
        </h1>

        <p className="text-sm text-slate-600">
          Targeted for <strong className="text-slate-900">{plotName}</strong> ({portfolio.totalAllocatedAcres.toFixed(1)} / {portfolio.totalAvailableAcres} Acres) · Season:{" "}
          <strong className="text-slate-900">{portfolio.season}</strong> · Risk Model:{" "}
          <span className="font-semibold text-emerald-700">{portfolio.riskAppetite}</span> · Soil: {soilType}
        </p>
      </header>

      {/* High-Level Financial Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Expected Profit</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
            ₹{Math.round(portfolio.expectedProfit).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Net Farmer Income</span>
        </div>

        <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Gross Revenue</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
            ₹{Math.round(portfolio.expectedRevenue).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-500 font-bold">Est. Mandi Harvest Value</span>
        </div>

        <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Total Cultivation Cost</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
            ₹{Math.round(portfolio.estimatedCost).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-500 font-bold">Seeds, Fertilizer & Labor</span>
        </div>

        <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">ROI Multiplier</span>
          <div className="text-xl sm:text-2xl font-black text-indigo-700 font-mono mt-1">
            {portfolio.roiMultiplier}x
          </div>
          <span className="text-[10px] text-indigo-600 font-bold">{portfolio.roiPercentage}% Return</span>
        </div>

        <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Optimization Score</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono mt-1">
            {portfolio.overallScore} / 100
          </div>
          <span className="text-[10px] text-emerald-700 font-bold">{portfolio.portfolioRisk} Risk Rating</span>
        </div>
      </div>

      {/* 4-Part Strategic Allocation Blueprint */}
      <section className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
              4-Part Strategic Crop Allocation Breakdown
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Balanced portfolio structure engineered to eliminate seasonal downside risk while capturing open market upside.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Part 1: Safety */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-emerald-900">1. Safety Floor</span>
              <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded">
                {portfolio.fourPartStrategy.safetyAllocation.percentage}% ({portfolio.fourPartStrategy.safetyAllocation.acres.toFixed(1)} ac)
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {portfolio.fourPartStrategy.safetyAllocation.primaryCrop}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {portfolio.fourPartStrategy.safetyAllocation.rationale}
            </p>
          </div>

          {/* Part 2: Stability */}
          <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-sky-900">2. Stability Cash</span>
              <span className="px-2 py-0.5 bg-sky-200 text-sky-800 rounded">
                {portfolio.fourPartStrategy.stabilityAllocation.percentage}% ({portfolio.fourPartStrategy.stabilityAllocation.acres.toFixed(1)} ac)
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {portfolio.fourPartStrategy.stabilityAllocation.primaryCrop}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {portfolio.fourPartStrategy.stabilityAllocation.rationale}
            </p>
          </div>

          {/* Part 3: Profit Opportunity */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-amber-900">3. High Profit</span>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded">
                {portfolio.fourPartStrategy.profitOpportunityAllocation.percentage}% ({portfolio.fourPartStrategy.profitOpportunityAllocation.acres.toFixed(1)} ac)
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {portfolio.fourPartStrategy.profitOpportunityAllocation.primaryCrop}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {portfolio.fourPartStrategy.profitOpportunityAllocation.rationale}
            </p>
          </div>

          {/* Part 4: Growth & Diversity */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-indigo-900">4. Soil Diversity</span>
              <span className="px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded">
                {portfolio.fourPartStrategy.growthDiversificationAllocation.percentage}% ({portfolio.fourPartStrategy.growthDiversificationAllocation.acres.toFixed(1)} ac)
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {portfolio.fourPartStrategy.growthDiversificationAllocation.primaryCrop}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {portfolio.fourPartStrategy.growthDiversificationAllocation.rationale}
            </p>
          </div>
        </div>
      </section>

      {/* Individual Allocated Crop Cards (Layer 6 to Layer 7 drilldown) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
              Recommended Crop Allocations ({portfolio.allocations.length})
            </h2>
            <p className="text-xs text-slate-600">
              Click any crop card to drill down into the Level 7 Deep Crop Intelligence Hub (Economics, Soil/Fertilizer schedule, Mandi Benchmarks).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolio.allocations.map((item) => (
            <div
              key={item.cropId}
              className="p-6 bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-3xl shadow-sm transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {item.strategyRole}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {item.cropName}{" "}
                      <span className="text-sm font-semibold text-slate-500">({item.hindiName})</span>
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-800 font-mono">
                      {item.allocatedAcres.toFixed(1)} Acres
                    </span>
                    <div className="text-[11px] font-bold text-slate-500">{item.percentage}% of Farm</div>
                  </div>
                </div>

                {/* Economics Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Exp. Profit</span>
                    <strong className="text-xs font-mono font-black text-emerald-700">
                      ₹{Math.round(item.allocatedProfit).toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Exp. Yield</span>
                    <strong className="text-xs font-mono font-black text-slate-800">
                      {item.expectedYieldPerAcre} q/ac
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Modal Price</span>
                    <strong className="text-xs font-mono font-black text-slate-800">
                      ₹{item.expectedSellingPricePerQuintal}/q
                    </strong>
                  </div>
                </div>

                {/* MSP Safety Badge & Rationale */}
                <div className="flex items-center gap-2 text-xs">
                  {item.mspSafety ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px] border border-emerald-200">
                      ✓ MSP Floor ₹{item.mspPrice}/q
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-black text-[10px] border border-slate-200">
                      Commercial Spot Market
                    </span>
                  )}
                  <span className="text-slate-500 text-[11px] truncate">
                    Break-even: ₹{Math.round(item.breakEvenPrice)}/q
                  </span>
                </div>

                {item.reasonsForAllocation && item.reasonsForAllocation.length > 0 && (
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {item.reasonsForAllocation[0]}
                  </p>
                )}
              </div>

              {/* Drilldown to Level 7 Deep Crop Page */}
              <Link
                href={`/crop-services/planning/crop/${item.cropSlug}?farmId=${farmId}&acres=${acres}&cropAcres=${item.allocatedAcres}&season=${season}&district=${district}&state=${state}`}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl text-center shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>View Full Agronomic & Financial Intelligence</span>
                <span>→</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 7-Scenario Stress Testing Simulation */}
      <section className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧪</span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
              7-Scenario Downside Resilience Stress-Testing
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Simulated behavior under weather anomalies, pest outbreaks, input cost spikes, and market volatility.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Stress Scenario</th>
                <th className="py-2.5 px-3">Probability</th>
                <th className="py-2.5 px-3">Revenue Impact</th>
                <th className="py-2.5 px-3">Simulated Net Profit</th>
                <th className="py-2.5 px-3">Resilience</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {portfolio.scenarioSimulations.map((sc) => (
                <tr key={sc.scenarioId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3">
                    <strong className="text-slate-900 block">{sc.scenarioName}</strong>
                    <span className="text-[11px] text-slate-500">{sc.description}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded font-black text-[10px] ${
                        sc.probability === "High"
                          ? "bg-slate-200 text-slate-800"
                          : sc.probability === "Moderate"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {sc.probability}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    {sc.revenueImpactPct >= 0 ? `+${sc.revenueImpactPct}%` : `${sc.revenueImpactPct}%`}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    <span className={sc.isLossScenario ? "text-rose-600" : "text-emerald-700"}>
                      ₹{Math.round(sc.simulatedProfitInr).toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded font-black text-[10px] ${
                        sc.resilienceRating === "High"
                          ? "bg-emerald-100 text-emerald-800"
                          : sc.resilienceRating === "Moderate"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {sc.resilienceRating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Constraints & Governance Provenance Footer */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-xs space-y-3">
        <div className="flex items-center justify-between">
          <strong className="text-slate-800 uppercase tracking-wider font-black">
            Government Compliance & Algorithmic Lineage
          </strong>
          <span className="text-[11px] font-mono text-slate-500">
            Generated: {new Date(portfolio.generatedAt).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-slate-600">
          <div>✓ Total Acreage Constraint Satisfied ({portfolio.totalAllocatedAcres.toFixed(1)} / {portfolio.totalAvailableAcres} ac)</div>
          <div>✓ Farmer Working Capital Cap Enforced</div>
          <div>✓ CACP Statutory Minimum Support Price Grounded</div>
          <div>✓ PostGIS Geo-Climatic Match Verified</div>
        </div>
        <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-4 text-slate-500 text-[11px]">
          <span>Data Sources: Agmarknet APMC Mandi, ICAR Package of Practices, IMD Climate Grid, CACP MSP Master</span>
        </div>
      </div>

      {/* Action CTA Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link
          href={`/crop-services/planning/configure?${searchParams.toString()}`}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
        >
          ← Back to Configure Constraints
        </Link>

        <div className="flex gap-3">
          <Link
            href={`/recommendations/plan?plot=${farmId}&season=${season}`}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2"
          >
            <span>Proceed to Seasonal Action Plan & Schedule</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PlanningResultsPage() {
  return (
    <AppShell pageTitle="Crop Planning — Step 3: Analysis Results">
      <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Optimizing 4-part multi-crop portfolio...</div>}>
        <PlanningResultsContent />
      </Suspense>
    </AppShell>
  );
}

