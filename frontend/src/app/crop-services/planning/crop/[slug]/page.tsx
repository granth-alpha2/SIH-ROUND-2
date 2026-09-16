"use client";

import React, { use, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "../../../../components/AppShell";
import { CROP_DATABASE, type CropRecord } from "@/lib/crop-data";
import { MANDI_BENCHMARK_PRICES } from "@/lib/market-service";
import { parseSoilReportDocument } from "@/lib/soil-service";
import { generateFertilizerPlan } from "@/lib/fertilizer-engine";

interface CropDetailPageProps {
  params: Promise<{ slug: string }>;
}

function CropDetailInner({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const farmId = searchParams.get("farmId") || "custom";
  const totalAcres = parseFloat(searchParams.get("acres") || "2.5") || 2.5;
  const cropAcres = parseFloat(searchParams.get("cropAcres") || "1.0") || 1.0;
  const season = searchParams.get("season") || "Rabi";
  const district = searchParams.get("district") || "Bathinda";
  const state = searchParams.get("state") || "Punjab";

  // Find crop from catalog
  const crop: CropRecord | undefined = useMemo(() => {
    return (
      CROP_DATABASE.find((c) => c.slug.toLowerCase() === slug.toLowerCase()) ||
      CROP_DATABASE.find((c) => c.id.toLowerCase() === slug.toLowerCase()) ||
      CROP_DATABASE[0]
    );
  }, [slug]);

  // Mandi market benchmark
  const mandi = useMemo(() => {
    return (
      MANDI_BENCHMARK_PRICES.find((m) => m.cropSlug.toLowerCase() === crop.slug.toLowerCase()) ||
      MANDI_BENCHMARK_PRICES.find((m) => m.cropId === crop.id)
    );
  }, [crop]);

  // Generate Fertilizer Plan using 3-layer soil engine
  const fertilizerPlan = useMemo(() => {
    const defaultLayers = parseSoilReportDocument("").layers;
    return generateFertilizerPlan(defaultLayers, crop.slug, cropAcres);
  }, [crop, cropAcres]);

  const modalPrice = mandi?.modalPrice || crop.economics.typicalPricePerQuintal;
  const grossRevPerAcre = crop.yield.quintalsPerAcre * modalPrice;
  const netProfitPerAcre = grossRevPerAcre - crop.costs.totalPerAcre;
  const totalNetProfit = netProfitPerAcre * cropAcres;
  const totalGrossRev = grossRevPerAcre * cropAcres;
  const totalCost = crop.costs.totalPerAcre * cropAcres;
  const breakEvenPrice = crop.costs.totalPerAcre / (crop.yield.quintalsPerAcre || 1);

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans">
      {/* Header Profile */}
      <header className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌾</span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-xs uppercase tracking-wider border border-emerald-200">
              Layer 7 · Deep Crop Intelligence Hub
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer"
            >
              ← Back to Results
            </button>
            <Link
              href={`/assistant?q=Provide+detailed+agronomic+management+for+${encodeURIComponent(crop.name)}`}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              Ask उन्नति AI 🤖
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
              {crop.name}{" "}
              <span className="text-xl sm:text-2xl font-semibold text-slate-500 font-sans">
                ({crop.hindiName})
              </span>
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Category: <strong className="text-slate-800">{crop.category}</strong> · Suitable Season:{" "}
              <strong className="text-slate-800">{crop.season}</strong> · Maturity Duration:{" "}
              <strong className="text-slate-800">{crop.durationDays} Days</strong>
            </p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-right">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
              Allocated Land
            </span>
            <div className="text-2xl font-black text-emerald-900 font-mono">
              {cropAcres.toFixed(1)} Acres
            </div>
            <span className="text-[10px] text-slate-500">
              of {totalAcres} acres total farm plot
            </span>
          </div>
        </div>
      </header>

      {/* Economics & Profit Breakdown Cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
          Financial & Profit Audit ({cropAcres.toFixed(1)} Acres)
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              Projected Net Profit
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
              ₹{Math.round(totalNetProfit).toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold">
              ₹{Math.round(netProfitPerAcre).toLocaleString("en-IN")} / acre
            </span>
          </div>

          <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              Gross Mandi Revenue
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
              ₹{Math.round(totalGrossRev).toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-slate-500 font-bold">
              @ ₹{modalPrice}/q modal price
            </span>
          </div>

          <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              Total Cultivation Cost
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
              ₹{Math.round(totalCost).toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-slate-500 font-bold">
              ₹{crop.costs.totalPerAcre.toLocaleString("en-IN")} / acre
            </span>
          </div>

          <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              Break-Even Price
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-700 font-mono mt-1">
              ₹{Math.round(breakEvenPrice).toLocaleString("en-IN")}/q
            </div>
            <span className="text-[10px] text-indigo-600 font-bold">
              Yield: {crop.yield.quintalsPerAcre} q/ac
            </span>
          </div>
        </div>
      </section>

      {/* Itemized Cost Sheet & Mandi Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Sheet */}
        <section className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">
              Itemized Cost of Cultivation (per acre)
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">
              Total: ₹{crop.costs.totalPerAcre.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { label: "Certified Seed / Planting Material", cost: crop.costs.seed },
              { label: "Fertilizers & Soil Amendments", cost: crop.costs.fertilizer },
              { label: "Field Labor, Weeding & Harvesting", cost: crop.costs.labor },
              { label: "Irrigation & Power Charges", cost: crop.costs.irrigation },
              { label: "Crop Protection Chemicals & Misc", cost: crop.costs.other },
            ].map((c) => {
              const pct = Math.round((c.cost / (crop.costs.totalPerAcre || 1)) * 100);
              return (
                <div key={c.label} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{c.label}</span>
                    <span className="text-[11px] text-slate-500 ml-2">({pct}%)</span>
                  </div>
                  <span className="font-mono font-black text-slate-900">
                    ₹{c.cost.toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Mandi & MSP Benchmark */}
        <section className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">
              APMC Mandi & MSP Benchmark
            </h3>
            {crop.economics.mspEligible ? (
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px] border border-emerald-200">
                MSP Protected
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded font-black text-[10px] border border-amber-200">
                Commercial Crop
              </span>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Spot APMC Modal Price:</span>
              <strong className="font-mono font-black text-sm text-slate-900">
                ₹{modalPrice.toLocaleString("en-IN")} / quintal
              </strong>
            </div>

            {crop.economics.mspPricePerQuintal && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">CACP Statutory MSP Floor:</span>
                <strong className="font-mono font-black text-sm text-emerald-700">
                  ₹{crop.economics.mspPricePerQuintal.toLocaleString("en-IN")} / quintal
                </strong>
              </div>
            )}

            {mandi && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">30-Day APMC Price Momentum:</span>
                  <strong className={`font-mono font-black ${mandi.trend30DayPct >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                    {mandi.trend30DayPct >= 0 ? `+${mandi.trend30DayPct}%` : `${mandi.trend30DayPct}%`}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Historical Price Volatility:</span>
                  <strong className="text-slate-800">
                    {mandi.volatility} ({mandi.volatilityPct}%)
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Benchmark Mandi Location:</span>
                  <span className="text-slate-800 font-semibold">
                    {mandi.mandiName} APMC ({mandi.district}, {mandi.state})
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Link
              href="/markets"
              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl text-center border border-slate-300 transition-all"
            >
              Open Live APMC Mandi Board →
            </Link>
            <Link
              href="/marketplace"
              className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl text-center shadow-xs transition-all"
            >
              List Produce on Marketplace →
            </Link>
          </div>
        </section>
      </div>

      {/* 3-Layer Stage-Wise Fertilizer Plan */}
      <section className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧪</span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
              Stage-Wise Fertilizer Split Application Roadmap
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Formulated strictly using ICAR STCR recommendations. Accounts for subsurface nutrient availability to eliminate costly chemical over-fertilization.
          </p>
        </div>

        {/* Commercial Products Needed */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
            Commercial Fertilizer Products Required for {cropAcres.toFixed(1)} Acres
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {fertilizerPlan.recommendedFertilizerSources.map((source, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-900">{source.fertilizerName}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                    {source.gradeFormula}
                  </span>
                </div>
                <div className="text-lg font-mono font-black text-emerald-800">
                  {(source.recommendedKgPerAcre * cropAcres).toFixed(1)} kg
                </div>
                <div className="text-xs text-slate-600">
                  {(parseFloat(source.bagsPerAcre) * cropAcres || 1).toFixed(1)} Bags · Approx ₹
                  {(source.estimatedCostInr * cropAcres).toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {source.selectionRationale}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Stage Splits */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
            Timing & Application Splits
          </label>
          <div className="space-y-3">
            {fertilizerPlan.stageWiseSplitSchedule.map((stage) => (
              <div key={stage.stageNumber} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs">
                      {stage.stageNumber}
                    </span>
                    <strong className="text-sm font-black text-slate-900">{stage.stageName}</strong>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      ({stage.daysAfterSowingRange})
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-600">
                    N: {stage.nPercent}% · P: {stage.pPercent}% · K: {stage.kPercent}%
                  </div>
                </div>

                <p className="text-xs text-slate-600">{stage.timingDescription}</p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {stage.productsToApply.map((p, pIdx) => (
                    <span
                      key={pIdx}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                    >
                      {p.productName}: {(p.quantityKgPerAcre * cropAcres).toFixed(1)} kg ({p.method})
                    </span>
                  ))}
                </div>

                <p className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  ⚠️ {stage.criticalInstructions}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plant Protection & Agronomic Specifications */}
      <section className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-4">
        <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">
          Agronomic Specifications & Pest Management
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-bold block">Water Requirement</span>
            <div className="text-sm font-black text-slate-900">
              {crop.waterRequirementMm} mm ({crop.waterLevel} requirement)
            </div>
            <p className="text-[11px] text-slate-500">
              Ideal temperature: {crop.tempRange.idealMin}°C – {crop.tempRange.idealMax}°C
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-bold block">Suitable Soils</span>
            <div className="text-sm font-black text-slate-900">
              {crop.suitableSoils.join(", ")}
            </div>
            <p className="text-[11px] text-slate-500">
              Optimal rainfall: {crop.rainfallMm.optimal} mm
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-bold block">Official Lineage</span>
            <div className="text-sm font-black text-slate-900 truncate">
              {crop.provenance.benchmarkSource}
            </div>
            <p className="text-[11px] text-slate-500">
              Verified: {crop.provenance.lastUpdated}
            </p>
          </div>
        </div>

        {crop.pestsAndDiseases && crop.pestsAndDiseases.length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-700 block mb-2">
              Common Regional Pests & Pathologies to Monitor:
            </span>
            <div className="flex flex-wrap gap-2">
              {crop.pestsAndDiseases.map((pest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold"
                >
                  🦠 {pest}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          ← Back to Portfolio Results
        </button>

        <div className="flex gap-3">
          <Link
            href="/crops"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            All Crops Encyclopedia
          </Link>
          <Link
            href={`/recommendations/plan?plot=${farmId}&season=${season}`}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2"
          >
            <span>Proceed to Seasonal Plan</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CropDetailPage({ params }: CropDetailPageProps) {
  const unwrappedParams = use(params);
  return (
    <AppShell pageTitle={`Crop Intelligence — ${unwrappedParams.slug}`}>
      <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Loading crop agronomic profile...</div>}>
        <CropDetailInner slug={unwrappedParams.slug} />
      </Suspense>
    </AppShell>
  );
}
