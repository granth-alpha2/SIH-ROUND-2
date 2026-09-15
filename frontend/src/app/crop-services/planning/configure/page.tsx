"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../../components/AppShell";
import { CROP_DATABASE } from "@/lib/crop-data";
import type { RiskAppetite, ResourceLevel } from "@/lib/portfolio-optimizer";

function ConfigureConstraintsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read state from Step 1
  const farmId = searchParams.get("farmId") || "custom";
  const acres = searchParams.get("acres") || "2.5";
  const plotName = decodeURIComponent(searchParams.get("name") || "Agricultural Plot");
  const district = searchParams.get("district") || "Bathinda";
  const state = searchParams.get("state") || "Punjab";
  const initialSoil = searchParams.get("soil") || "Alluvial";
  const lat = searchParams.get("lat") || "30.211";
  const lng = searchParams.get("lng") || "74.9455";

  // Step 2 Configuration State
  const [season, setSeason] = useState<"Kharif" | "Rabi" | "Zaid">("Rabi");
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>("Balanced");
  const [waterAvailability, setWaterAvailability] = useState<ResourceLevel>("Medium");
  const [investmentCapacity, setInvestmentCapacity] = useState<ResourceLevel>("Medium");
  const [soilType, setSoilType] = useState<string>(initialSoil);
  const [soilPh, setSoilPh] = useState<number>(7.2);
  const [excludedCrops, setExcludedCrops] = useState<string[]>([]);

  const toggleExclude = (cropSlug: string) => {
    setExcludedCrops((prev) =>
      prev.includes(cropSlug) ? prev.filter((c) => c !== cropSlug) : [...prev, cropSlug]
    );
  };

  const handleRunOptimization = () => {
    const params = new URLSearchParams({
      farmId,
      acres,
      name: plotName,
      district,
      state,
      lat,
      lng,
      season,
      riskAppetite,
      waterAvailability,
      investmentCapacity,
      soilType,
      soilPh: String(soilPh),
      excluded: excludedCrops.join(","),
    });

    router.push(`/crop-services/planning/results?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Government 3-Step Stepper Progress Bar */}
      <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span className="text-emerald-700 font-medium">✓ Step 1: Select Farm Plot</span>
          <span className="text-emerald-800 font-extrabold">● Step 2 of 3: Configure Constraints</span>
          <span>○ Step 3: Analysis Results</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div className="bg-emerald-600 h-2 rounded-full w-2/3 transition-all" />
        </div>
      </div>

      {/* Plot Summary Banner */}
      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
            📍
          </span>
          <div>
            <div className="font-black text-slate-900 text-sm">{plotName}</div>
            <div className="text-slate-600">
              {acres} Acres · {district}, {state} · Base Soil: {initialSoil}
            </div>
          </div>
        </div>
        <Link
          href="/crop-services/planning"
          className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
        >
          Change Selected Plot
        </Link>
      </div>

      {/* Page Header */}
      <header className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">⚙️</span>
          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-xs uppercase tracking-wider border border-emerald-200">
            Layer 4 · Input & Constraints
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
          Configure Farm Agronomic & Financial Constraints
        </h1>
        <p className="text-sm text-slate-600">
          Tailor season, irrigation access, risk posture, and capital limits to feed the 4-part multi-crop mathematical portfolio optimizer.
        </p>
      </header>

      {/* Form Grid */}
      <div className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-8">
        {/* 1. Cropping Season */}
        <section className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
            1. Target Cropping Season
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "Rabi", title: "Rabi (Winter)", months: "Oct – Apr", desc: "Wheat, Mustard, Gram, Barley, Potato" },
              { id: "Kharif", title: "Kharif (Monsoon)", months: "Jun – Nov", desc: "Paddy, Cotton, Maize, Soy, Groundnut" },
              { id: "Zaid", title: "Zaid (Summer)", months: "Mar – Jun", desc: "Moong, Watermelon, Cucumber, Fodder" },
            ].map((s) => {
              const active = season === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeason(s.id as any)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    active
                      ? "bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-300 shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-sm font-black text-slate-900">{s.title}</strong>
                    <span className="text-[11px] font-mono font-bold text-slate-500">{s.months}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{s.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Water Availability */}
        <section className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
            2. Irrigation & Water Access
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "Low", title: "Low / Rainfed", desc: "Dependent on precipitation, dryland or sparse tubewell supply" },
              { id: "Medium", title: "Medium / Canal Supply", desc: "Assured rotational canal irrigation or moderate aquifer borewell" },
              { id: "High", title: "High / Abundant Irrigation", desc: "Perennial tubewell, drip or pressurized micro-irrigation systems" },
            ].map((w) => {
              const active = waterAvailability === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWaterAvailability(w.id as ResourceLevel)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    active
                      ? "bg-sky-50/80 border-sky-600 ring-2 ring-sky-300 shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <strong className="text-sm font-black text-slate-900 block mb-1">{w.title}</strong>
                  <p className="text-xs text-slate-600">{w.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Risk Posture */}
        <section className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
            3. Risk Appetite & Downside Tolerance
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "Conservative",
                title: "Conservative (Floor First)",
                desc: "Maximizes government MSP coverage, minimal capital exposure, low price volatility.",
              },
              {
                id: "Balanced",
                title: "Balanced (Hybrid Safety)",
                desc: "Recommended 40% MSP staple floor combined with 60% high-margin market crops.",
              },
              {
                id: "Growth",
                title: "Growth (Commercial Maximizer)",
                desc: "Targets high-value horticulture, export varieties, and futures pricing momentum.",
              },
            ].map((r) => {
              const active = riskAppetite === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRiskAppetite(r.id as RiskAppetite)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    active
                      ? "bg-amber-50/80 border-amber-600 ring-2 ring-amber-300 shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <strong className="text-sm font-black text-slate-900 block mb-1">{r.title}</strong>
                  <p className="text-xs text-slate-600">{r.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Capital & Soil Settings */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Investment Capacity / Working Capital
            </label>
            <select
              value={investmentCapacity}
              onChange={(e) => setInvestmentCapacity(e.target.value as ResourceLevel)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
            >
              <option value="Low">Low Capacity (Cap: ~₹18,000 / acre)</option>
              <option value="Medium">Medium Capacity (Cap: ~₹35,000 / acre)</option>
              <option value="High">High Commercial Capacity (Cap: ~₹75,000 / acre)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Predominant Soil Texture & pH
            </label>
            <div className="flex gap-2">
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              >
                <option value="Alluvial">Alluvial Loam</option>
                <option value="Black">Black Cotton (Regur)</option>
                <option value="Red">Red / Laterite</option>
                <option value="Sandy Loam">Sandy Loam</option>
                <option value="Clay">Clay Loam</option>
              </select>
              <input
                type="number"
                step="0.1"
                min="4.5"
                max="9.5"
                value={soilPh}
                onChange={(e) => setSoilPh(parseFloat(e.target.value) || 7.2)}
                className="w-24 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-center"
                title="Soil pH"
              />
            </div>
          </div>
        </section>

        {/* 5. Excluded Crops Filter */}
        <section className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              5. Optional Exclusions (Do not recommend these crops)
            </label>
            {excludedCrops.length > 0 && (
              <button
                type="button"
                onClick={() => setExcludedCrops([])}
                className="text-xs text-rose-600 hover:underline font-bold"
              >
                Clear Exclusions ({excludedCrops.length})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {CROP_DATABASE.slice(0, 10).map((crop) => {
              const isExcluded = excludedCrops.includes(crop.slug);
              return (
                <button
                  key={crop.slug}
                  type="button"
                  onClick={() => toggleExclude(crop.slug)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isExcluded
                      ? "bg-rose-100 text-rose-800 border-rose-300 line-through"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {crop.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Stepper Navigation Buttons */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            ← Back to Step 1: Farm Plot
          </button>

          <button
            type="button"
            onClick={handleRunOptimization}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Run 4-Part Portfolio Optimizer (Step 3)</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CropPlanningConfigurePage() {
  return (
    <AppShell pageTitle="Crop Planning — Step 2: Configure Constraints">
      <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Loading configuration parameters...</div>}>
        <ConfigureConstraintsContent />
      </Suspense>
    </AppShell>
  );
}

