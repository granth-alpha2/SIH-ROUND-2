"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "../../../components/AppShell";
import {
  SoilLayerRecord,
  createDemoThreeLayerReport,
  analyzeSoilProfile,
  rateNutrientStatus,
} from "@/lib/soil-service";
import type { FarmRecord } from "@/app/api/farms/repository";

function SoilAnalysisContent() {
  const searchParams = useSearchParams();
  const initialFarmId = searchParams.get("farmId") || "default-farm";

  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>(initialFarmId);

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
          }
        }
      } catch {
        // Fallback
      }
    }
    loadFarms();
  }, [initialFarmId]);

  // Generate 3-layer report for selected farm
  const report = useMemo(() => {
    return createDemoThreeLayerReport(selectedFarmId);
  }, [selectedFarmId]);

  const analysis = useMemo(() => {
    return analyzeSoilProfile(report.layers);
  }, [report]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <header className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🔬</span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-xs uppercase tracking-wider border border-emerald-200">
              Layer 5 · 3-Layer Agronomic Analysis
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/farm/soil"
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all"
            >
              ← Back to Soil Services
            </Link>
            <Link
              href={`/farm/soil/upload?farmId=${selectedFarmId}`}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all"
            >
              📄 Upload New Report
            </Link>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
          3-Layer Vertical Chemical Profile & Subsoil Health
        </h1>
        <p className="text-sm text-slate-600">
          Evaluates soil stratification across 0-15cm (Surface plow layer), 15-30cm (Subsurface rootzone), and 30-60cm (Deep subsoil). Detects hardpans, salinity gradients, and nutrient exhaustion.
        </p>

        {/* Farm Selector */}
        <div className="pt-2 flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">Active Farm Parcel:</span>
          <select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.areaAcres.toFixed(1)} ac - {f.preferences?.soilType || "Alluvial"})
              </option>
            ))}
            <option value="default-farm">Bathinda Plot 01 (2.5 Acres)</option>
          </select>
        </div>
      </header>

      {/* Cross-Layer Health Score Summary */}
      <div className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              Overall Vertical Health Rating
            </span>
            <div className="text-2xl font-black text-emerald-800 font-['Space_Grotesk'] mt-0.5">
              {analysis.overallHealthRating.replace(/_/g, " ")}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              Confidence & Depth
            </span>
            <span className="text-sm font-mono font-black text-slate-800">
              {Math.round(analysis.confidenceScore * 100)}% Confidence · {analysis.effectiveProfileDepthCm} cm Depth
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed">
          {analysis.verticalSummary}
        </p>

        {/* Limitations & Strengths */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
            <strong className="text-amber-900 font-bold block">⚠️ Subsoil Constraints Detected:</strong>
            {analysis.limitations.map((lim, idx) => (
              <div key={idx} className="text-amber-950">
                • {lim.title}: {lim.description}
              </div>
            ))}
          </div>
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
            <strong className="text-emerald-900 font-bold block">✓ Agronomic Strengths:</strong>
            {analysis.strengths.map((str, idx) => (
              <div key={idx} className="text-emerald-950">
                • {str}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Vertical Depth Layers Visual Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
          Layer-by-Layer Chemical & Physical Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.layers.map((layer) => {
            const ph = layer.parameters["ph"]?.normalizedValue ?? 7.2;
            const ec = layer.parameters["ec"]?.normalizedValue ?? 0.7;
            const oc = layer.parameters["organic_carbon"]?.normalizedValue ?? 0.55;
            const n = layer.parameters["nitrogen"]?.normalizedValue ?? 260;
            const p = layer.parameters["phosphorus"]?.normalizedValue ?? 16;
            const k = layer.parameters["potassium"]?.normalizedValue ?? 190;
            const zn = layer.parameters["zinc"]?.normalizedValue ?? 0.75;
            const s = layer.parameters["sulphur"]?.normalizedValue ?? 12.0;

            const layerTitle =
              layer.layerNumber === 1
                ? "Layer 1: Topsoil / Plow Layer"
                : layer.layerNumber === 2
                ? "Layer 2: Subsurface Rootzone"
                : "Layer 3: Deep Subsoil Bed";

            return (
              <div
                key={layer.layerNumber}
                className="p-5 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-sm font-black text-slate-900 block">{layerTitle}</strong>
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        {layer.depthStartCm} – {layer.depthEndCm} cm Depth
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        layer.condition === "Good"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {layer.condition}
                    </span>
                  </div>

                  {/* Chemical Parameters Table */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between p-2 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Soil pH (Reaction):</span>
                      <span className="font-mono font-bold text-slate-900">{ph}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Salinity EC (dS/m):</span>
                      <span className="font-mono font-bold text-slate-900">{ec}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Organic Carbon (%):</span>
                      <span className="font-mono font-bold text-slate-900">{oc}%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Available N (kg/ha):</span>
                      <span className="font-mono font-bold text-slate-900">{n} ({rateNutrientStatus("nitrogen", n)})</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Available P (kg/ha):</span>
                      <span className="font-mono font-bold text-slate-900">{p} ({rateNutrientStatus("phosphorus", p)})</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Available K (kg/ha):</span>
                      <span className="font-mono font-bold text-slate-900">{k} ({rateNutrientStatus("potassium", k)})</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Available Zn (ppm):</span>
                      <span className="font-mono font-bold text-slate-900">{zn} ppm</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Available S (ppm):</span>
                      <span className="font-mono font-bold text-slate-900">{s} ppm</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  {layer.strengths.length > 0 && <div>✓ {layer.strengths[0]}</div>}
                  {layer.limitations.length > 0 && <div className="text-amber-700">⚠️ {layer.limitations[0]}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation CTA */}
      <div className="pt-2 flex items-center justify-between gap-3">
        <Link
          href="/farm/soil"
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
        >
          ← Back to Soil Services
        </Link>

        <Link
          href={`/farm/soil/fertilizer?farmId=${selectedFarmId}`}
          className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2"
        >
          <span>Calculate Precision Fertilizer Plan (Level 6)</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}

export default function SoilAnalysisPage() {
  return (
    <AppShell pageTitle="3-Layer Soil Chemical Analysis">
      <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Analyzing 3-layer vertical soil profile...</div>}>
        <SoilAnalysisContent />
      </Suspense>
    </AppShell>
  );
}
