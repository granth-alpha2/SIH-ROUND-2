"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import SeasonalCropPlanningPanel from "@/features/recommendations/SeasonalCropPlanningPanel";
import type { FarmRecord } from "@/app/api/farms/repository";

export default function SeasonalCatchCropsPage() {
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<FarmRecord | null>(null);
  const [acres, setAcres] = useState<number>(2.5);

  useEffect(() => {
    async function loadFarms() {
      try {
        const res = await fetch("/api/farms");
        if (res.ok) {
          const json = await res.json();
          const list: FarmRecord[] = json.farms || [];
          setFarms(list);
          if (list.length > 0) {
            setSelectedFarm(list[0]);
            setAcres(list[0].areaAcres || 2.5);
          }
        }
      } catch {
        // Fallback
      }
    }
    loadFarms();
  }, []);

  return (
    <AppShell pageTitle="Seasonal Catch Crops & Interim Window Planning">
      <div className="max-w-5xl mx-auto space-y-6 font-sans">
        {/* Header Banner */}
        <header className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">⏱️</span>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-xs uppercase tracking-wider border border-emerald-200">
                Layer 3 · Specialized Seasonal Service
              </span>
            </div>
            <Link
              href="/crop-services"
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all"
            >
              ← Back to Crop Services
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
            Seasonal Catch Crops & Interim Window Studio
          </h1>
          <p className="text-sm text-slate-600">
            Monetize 60–90 day fallow gaps between major Kharif and Rabi harvest cycles. Target festive price surges (Diwali, Holi, Eid) with fast-maturing cash crops.
          </p>
        </header>

        {/* Farm Plot Selector */}
        <div className="p-5 bg-white border-2 border-slate-200 rounded-3xl shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-bold">Selected Farm Parcel:</span>
            <select
              value={selectedFarm?.id || "custom"}
              onChange={(e) => {
                const found = farms.find((f) => f.id === e.target.value);
                if (found) {
                  setSelectedFarm(found);
                  setAcres(found.areaAcres || 2.5);
                } else {
                  setSelectedFarm(null);
                }
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.areaAcres.toFixed(1)} ac - {f.preferences?.soilType || "Alluvial"})
                </option>
              ))}
              <option value="custom">Standard Test Plot (2.5 Acres)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">Acreage:</span>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="50"
              value={acres}
              onChange={(e) => setAcres(parseFloat(e.target.value) || 2.5)}
              className="w-24 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            />
          </div>
        </div>

        {/* SeasonalCropPlanningPanel Integration */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
          <SeasonalCropPlanningPanel
            farmAcres={acres}
            farmBoundary={selectedFarm?.boundary}
            lat={selectedFarm?.center?.lat || 30.211}
            lng={selectedFarm?.center?.lng || 74.9455}
            soilType={selectedFarm?.preferences?.soilType || "Alluvial"}
          />
        </div>
      </div>
    </AppShell>
  );
}
