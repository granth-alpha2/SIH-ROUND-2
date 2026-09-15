"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "../../../components/AppShell";
import {
  createDemoThreeLayerReport,
} from "@/lib/soil-service";
import {
  generateFertilizerPlan,
  FertilizerPlanResult,
} from "@/lib/fertilizer-engine";
import { CROP_DATABASE } from "@/lib/crop-data";
import type { FarmRecord } from "@/app/api/farms/repository";

function FertilizerCalculatorContent() {
  const searchParams = useSearchParams();
  const initialFarmId = searchParams.get("farmId") || "default-farm";
  const initialCrop = searchParams.get("crop") || "Wheat";

  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>(initialFarmId);
  const [selectedCrop, setSelectedCrop] = useState<string>(initialCrop);
  const [acres, setAcres] = useState<number>(2.5);

  useEffect(() => {
    async function loadFarms() {
      try {
        const res = await fetch("/api/farms");
        if (res.ok) {
          const json = await res.json();
          const list: FarmRecord[] = json.farms || [];
          setFarms(list);
          if (list.length > 0 && initialFarmId === "default-farm") {
            setSelectedFarmId(list[0].id);
            setAcres(list[0].areaAcres || 2.5);
          }
        }
      } catch {
        // Fallback
      }
    }
    loadFarms();
  }, [initialFarmId]);

  // Load soil report
  const soilReport = useMemo(() => {
    return createDemoThreeLayerReport(selectedFarmId);
  }, [selectedFarmId]);

  // Generate precision plan
  const plan: FertilizerPlanResult = useMemo(() => {
    return generateFertilizerPlan(soilReport.layers, selectedCrop, acres);
  }, [soilReport, selectedCrop, acres]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <header className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🧪</span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-xs uppercase tracking-wider border border-emerald-200">
              Layer 6 · STCR Precision Fertilizer Advisory
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer"
            >
              🖨️ Print Slip
            </button>
            <Link
              href={`/farm/soil/analysis?farmId=${selectedFarmId}`}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all"
            >
              ← Back to Soil Analysis
            </Link>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
          Targeted Fertilizer Split Calculator & Nutrition Plan
        </h1>
        <p className="text-sm text-slate-600">
          Formulated using ICAR STCR equations. Protects farm margins by preventing chemical over-application when soil fertility reserves are already adequate.
        </p>

        {/* Input Controls Bar */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-black text-slate-700 uppercase tracking-wider block mb-1">
              Select Farm Parcel:
            </label>
            <select
              value={selectedFarmId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedFarmId(val);
                const found = farms.find((f) => f.id === val);
                if (found) setAcres(found.areaAcres || 2.5);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.areaAcres.toFixed(1)} ac)
                </option>
              ))}
              <option value="default-farm">Bathinda Plot 01 (2.5 Acres)</option>
            </select>
          </div>

          <div>
            <label className="font-black text-slate-700 uppercase tracking-wider block mb-1">
              Target Crop to Cultivate:
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
            >
              {CROP_DATABASE.map((c) => (
                <option key={c.slug} value={c.name}>
                  {c.name} ({c.season})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-black text-slate-700 uppercase tracking-wider block mb-1">
              Cultivated Area (Acres):
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="50"
              value={acres}
              onChange={(e) => setAcres(parseFloat(e.target.value) || 2.5)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
            />
          </div>
        </div>
      </header>

      {/* Strict Anti-Overfertilization Rationale */}
      {plan.noOverfertilizationGuarantees && plan.noOverfertilizationGuarantees.length > 0 && (
        <div className="p-5 bg-emerald-50/80 border-2 border-emerald-300 rounded-3xl space-y-2 text-xs">
          <strong className="text-emerald-950 font-black block text-sm">
            🌿 ICAR Soil-Test STCR Savings & Over-Fertilization Safeguards
          </strong>
          <ul className="space-y-1 text-emerald-900 list-disc list-inside">
            {plan.noOverfertilizationGuarantees.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Commercial Bags Required Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
            Commercial Fertilizer Products Required for {acres.toFixed(1)} Acres
          </h2>
          <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            Est. Total Cost: ₹{Math.round(plan.recommendedFertilizerSources.reduce((acc: number, s) => acc + s.estimatedCostInr * acres, 0)).toLocaleString("en-IN")}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plan.recommendedFertilizerSources.map((source, idx) => {
            const totalKg = Number((source.recommendedKgPerAcre * acres).toFixed(1));
            const totalCost = Math.round(source.estimatedCostInr * acres);
            const bagsCount = (parseFloat(source.bagsPerAcre) * acres || 1).toFixed(1);

            return (
              <div
                key={idx}
                className="p-5 bg-white border-2 border-slate-200 rounded-3xl shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-sm font-black text-slate-900">{source.fertilizerName}</strong>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono font-bold text-[10px]">
                      {source.gradeFormula}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-black text-emerald-800 font-mono">
                        {totalKg} kg
                      </div>
                      <span className="text-[11px] text-slate-500 font-bold">{bagsCount} Bags (50kg)</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900 font-mono">
                        ₹{totalCost.toLocaleString("en-IN")}
                      </div>
                      <span className="text-[10px] text-slate-500">Total Purchase</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {source.selectionRationale}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                  Method: <strong className="text-slate-800">{source.applicationMethod}</strong> · {source.targetStage}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Growth Stage Split Roadmap */}
      <section className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
            Stage-Wise Split Application Roadmap
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Split nitrogen into multiple applications synchronized with physiological root nutrient uptake peaks to prevent leaching losses.
          </p>
        </div>

        <div className="space-y-4">
          {plan.stageWiseSplitSchedule.map((stage) => (
            <div key={stage.stageNumber} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs">
                    {stage.stageNumber}
                  </span>
                  <strong className="text-sm font-black text-slate-900">{stage.stageName}</strong>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    ({stage.daysAfterSowingRange})
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-600">
                  N Split: {stage.nPercent}% · P Split: {stage.pPercent}% · K Split: {stage.kPercent}%
                </div>
              </div>

              <p className="text-xs text-slate-700">{stage.timingDescription}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                {stage.productsToApply.map((p, pIdx) => (
                  <span
                    key={pIdx}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
                  >
                    {p.productName}: {(p.quantityKgPerAcre * acres).toFixed(1)} kg ({p.method})
                  </span>
                ))}
              </div>

              <div className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                ⚠️ {stage.criticalInstructions}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link
          href={`/farm/soil/analysis?farmId=${selectedFarmId}`}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
        >
          ← Back to Soil Analysis
        </Link>

        <Link
          href={`/crop-services/planning?farmId=${selectedFarmId}`}
          className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2"
        >
          <span>Feed into Crop Planning Wizard</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}

export default function FertilizerCalculatorPage() {
  return (
    <AppShell pageTitle="Targeted Fertilizer Calculator">
      <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Calculating targeted STCR fertilizer plan...</div>}>
        <FertilizerCalculatorContent />
      </Suspense>
    </AppShell>
  );
}
