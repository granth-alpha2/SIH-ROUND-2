"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import type { FarmRecord } from "../../api/farms/repository";
import { DISTRICT_MASTER } from "@/lib/geo-service";

export default function CropPlanningSelectFarmPage() {
  const router = useRouter();
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual fallback inputs
  const [selectedFarmId, setSelectedFarmId] = useState<string>("custom");
  const [customName, setCustomName] = useState("My Punjab Farm Plot");
  const [customAcres, setCustomAcres] = useState<number>(2.5);
  const [selectedDistrict, setSelectedDistrict] = useState(DISTRICT_MASTER[0]);

  useEffect(() => {
    async function loadFarms() {
      try {
        const res = await fetch("/api/farms");
        if (res.ok) {
          const json = await res.json();
          const list: FarmRecord[] = json.farms || [];
          setFarms(list);
          if (list.length > 0) {
            setSelectedFarmId(list[0].id);
          }
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadFarms();
  }, []);

  function handleContinue() {
    let queryParams: Record<string, string> = {};

    if (selectedFarmId !== "custom") {
      const found = farms.find((f) => f.id === selectedFarmId);
      if (found) {
        queryParams = {
          farmId: found.id,
          acres: String(found.areaAcres || 2.5),
          name: encodeURIComponent(found.name),
          lat: String(found.center?.lat || 30.211),
          lng: String(found.center?.lng || 74.9455),
          soil: found.preferences?.soilType || "Alluvial",
        };
      }
    } else {
      queryParams = {
        farmId: "custom",
        acres: String(customAcres),
        name: encodeURIComponent(customName),
        lat: String(selectedDistrict.lat),
        lng: String(selectedDistrict.lng),
        district: selectedDistrict.district,
        state: selectedDistrict.state,
      };
    }

    const searchStr = new URLSearchParams(queryParams).toString();
    router.push(`/crop-services/planning/configure?${searchStr}`);
  }

  return (
    <AppShell pageTitle="Crop Planning — Step 1: Select Farm Plot">
      <div className="max-w-4xl mx-auto space-y-6 font-sans">
        {/* Government 4-Step Stepper Progress Bar */}
        <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span className="text-emerald-800 font-extrabold">● Step 1 of 3: Select Farm Plot</span>
            <span>○ Step 2: Configure Constraints</span>
            <span>○ Step 3: Analysis Results</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-600 h-2 rounded-full w-1/3 transition-all" />
          </div>
        </div>

        {/* Page Header */}
        <header className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌾</span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-xs uppercase tracking-wider border border-emerald-200">
              Layer 3 · Input & Selection
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
            Select Farm Plot for Crop Planning
          </h1>
          <p className="text-sm text-slate-600">
            Choose a georeferenced farm plot from your registered land holdings, or specify custom acreage and location coordinates.
          </p>
        </header>

        {/* Form Container */}
        <div className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-6">
          {/* Method A: Registered Farm Plots */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Registered PostGIS Farm Plots ({farms.length})
            </label>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs font-bold">
                Loading your registered farm parcels...
              </div>
            ) : farms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {farms.map((f) => {
                  const isSelected = selectedFarmId === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFarmId(f.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? "bg-emerald-50/70 border-emerald-600 shadow-xs ring-2 ring-emerald-300"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-sm font-black text-slate-900">{f.name}</strong>
                          <span className="text-xs font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {f.areaAcres.toFixed(2)} Acres
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {f.preferences?.soilType || "Alluvial soil"} · PostGIS Polygon Verified
                        </p>
                      </div>

                      <span className={`text-[11px] font-bold ${isSelected ? "text-emerald-800" : "text-slate-400"}`}>
                        {isSelected ? "✓ Active Selected Plot" : "Tap to Select"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
                <p>No registered farm parcels found in your account yet.</p>
                <Link href="/farms/new" className="font-bold underline text-amber-950">
                  + Map a new field boundary in the Satellite Boundary Studio
                </Link>
              </div>
            )}
          </div>

          {/* Option B: Custom / Manual Land Input */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                Or Configure Custom / Temporary Land Area:
              </label>
              <button
                type="button"
                onClick={() => setSelectedFarmId("custom")}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedFarmId === "custom"
                    ? "bg-sky-100 text-[#0b4d75] border-sky-300 font-extrabold"
                    : "text-slate-600 border-slate-300 hover:bg-slate-100"
                }`}
              >
                {selectedFarmId === "custom" ? "✓ Using Custom Input" : "Select Custom Input"}
              </button>
            </div>

            {selectedFarmId === "custom" && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Plot Reference Name:</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Total Cultivable Land (Acres):</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="100"
                      value={customAcres}
                      onChange={(e) => setCustomAcres(parseFloat(e.target.value) || 2.5)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Agro-Climatic District & Region:</label>
                  <select
                    value={selectedDistrict.district}
                    onChange={(e) => {
                      const found = DISTRICT_MASTER.find((d) => d.district === e.target.value);
                      if (found) setSelectedDistrict(found);
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold"
                  >
                    {DISTRICT_MASTER.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.district}, {d.state} ({d.zone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <Link
              href="/crop-services"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              ← Back to Crop Services
            </Link>

            <button
              type="button"
              onClick={handleContinue}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Step 2: Configure Constraints</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
