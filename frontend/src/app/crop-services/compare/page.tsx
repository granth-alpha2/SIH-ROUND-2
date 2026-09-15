"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import CropCompareCard from "@/features/recommendations/CropCompareCard";
import type { FarmRecord } from "@/app/api/farms/repository";

export default function CropCompareStudioPage() {
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<FarmRecord | null>(null);
  const [acres, setAcres] = useState<number>(2.5);
  const [season, setSeason] = useState<"Kharif" | "Rabi" | "Zaid">("Rabi");
  const [risk, setRisk] = useState<string>("Balanced");
  const [water, setWater] = useState<string>("Medium");

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
        // Fallback to default
      }
    }
    loadFarms();
  }, []);

  return (
    <AppShell pageTitle="Crop Compare Studio">
      <div className="max-w-5xl mx-auto space-y-6 font-sans">
        {/* Header Banner */}
        <header className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">⚖️</span>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-xs uppercase tracking-wider border border-emerald-200">
                Layer 3 · Specialized Evaluation Service
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
            Crop Compare Studio & Agronomic Head-to-Head
          </h1>
          <p className="text-sm text-slate-600">
            Compare any crop against algorithmic high-yield recommendations. Inspect profit delta, water requirement variance, input cost differences, and MSP safety floors.
          </p>
        </header>

        {/* Configuration Bar */}
        <div className="p-5 bg-white border-2 border-slate-200 rounded-3xl shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-black uppercase tracking-wider text-slate-700 block mb-1">
              Select Farm Plot:
            </label>
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.areaAcres.toFixed(1)} ac)
                </option>
              ))}
              <option value="custom">Manual Acreage Input</option>
            </select>
          </div>

          <div>
            <label className="font-black uppercase tracking-wider text-slate-700 block mb-1">
              Acreage:
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="50"
              value={acres}
              onChange={(e) => setAcres(parseFloat(e.target.value) || 2.5)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            />
          </div>

          <div>
            <label className="font-black uppercase tracking-wider text-slate-700 block mb-1">
              Season:
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="Rabi">Rabi (Winter)</option>
              <option value="Kharif">Kharif (Monsoon)</option>
              <option value="Zaid">Zaid (Summer)</option>
            </select>
          </div>

          <div>
            <label className="font-black uppercase tracking-wider text-slate-700 block mb-1">
              Risk Appetite:
            </label>
            <select
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="Conservative">Conservative (MSP Floor)</option>
              <option value="Balanced">Balanced (Standard)</option>
              <option value="Growth">Growth (High Upside)</option>
            </select>
          </div>
        </div>

        {/* CropCompareCard Component Integration */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
          <CropCompareCard
            farmId={selectedFarm?.id}
            farmAreaAcres={acres}
            currentSeason={season}
            userSoilType={selectedFarm?.preferences?.soilType || "Alluvial"}
            riskAppetite={risk}
            waterAvailability={water}
          />
        </div>
      </div>
    </AppShell>
  );
}
