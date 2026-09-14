"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  INDIAN_FESTIVALS_CATALOG,
  evaluateSeasonalCropPlanning,
  type SeasonalPlanningType,
  type SeasonalPlanningResult,
  type SeasonalCropEvaluation,
  type IndianFestival,
} from "@/lib/seasonal-crop-engine";
import type { AgriWeatherReport } from "@/lib/weather-service";

export type AllocatedSeasonalCrop = {
  cropId: string;
  cropSlug?: string;
  cropName: string;
  hindiName?: string;
  allocatedAcres: number;
  expectedProfitPerAcre: number;
  expectedGrossRevenuePerAcre: number;
  costPerAcre: number;
  durationDays: number;
  harvestDate?: string;
  festivalMatch?: string;
  reason?: string;
};

export type SeasonalCropPlanningPanelProps = {
  farmBoundary?: { lat: number; lng: number }[];
  farmAcres?: number;
  farmAreaAcres?: number;
  lat?: number;
  lng?: number;
  soilType?: string;
  season?: string;
  waterAvailability?: "Low" | "Medium" | "High";
  weather?: AgriWeatherReport;
  onAllocateSeasonalCrop?: (crop: AllocatedSeasonalCrop | null) => void;
  onAllocateCropToMap?: (crop: {
    cropId: string;
    cropSlug: string;
    cropName: string;
    hindiName: string;
    acres: number;
    expectedProfit: number;
    roi: number;
  }) => void;
  allocatedSeasonalCropId?: string | null;
};

export default function SeasonalCropPlanningPanel({
  farmBoundary,
  farmAcres,
  farmAreaAcres = 2.5,
  lat = 30.211,
  lng = 74.9455,
  soilType = "Alluvial",
  season,
  waterAvailability = "Medium",
  weather,
  onAllocateSeasonalCrop,
  onAllocateCropToMap,
  allocatedSeasonalCropId,
}: SeasonalCropPlanningPanelProps) {
  const activeArea = farmAcres !== undefined ? farmAcres : farmAreaAcres;
  const activeLat = farmBoundary && farmBoundary.length > 0 ? farmBoundary[0].lat : lat;
  const activeLng = farmBoundary && farmBoundary.length > 0 ? farmBoundary[0].lng : lng;

  // Master Feature Switch: strictly optional, default is false
  const [isEnabled, setIsEnabled] = useState(false);

  // Local allocated state tracking
  const [internalAllocatedCropId, setInternalAllocatedCropId] = useState<string | null>(allocatedSeasonalCropId || null);

  // Planning Controls
  const [planningType, setPlanningType] = useState<SeasonalPlanningType>("short_duration");
  const [selectedFestivalId, setSelectedFestivalId] = useState<string>("diwali");
  const selectedFestival = INDIAN_FESTIVALS_CATALOG.find((f) => f.id === selectedFestivalId);
  const [mainCrop, setMainCrop] = useState<string>("Wheat");
  const [customDays, setCustomDays] = useState<number>(65);
  const [shortDurationAcres, setShortDurationAcres] = useState<number>(() =>
    Math.min(1.0, Math.max(0.2, Number((activeArea * 0.25).toFixed(2))))
  );

  // Active expanded timeline tab
  const [expandedCropId, setExpandedCropId] = useState<string | null>(null);

  // Compute recommendation results dynamically using client engine
  const planningResult: SeasonalPlanningResult = useMemo(() => {
    return evaluateSeasonalCropPlanning({
      planningType,
      farmAreaAcres: activeArea,
      allocatedAcres: shortDurationAcres,
      availableDays: customDays,
      festivalId: selectedFestivalId,
      mainCrop,
      lat: activeLat,
      lng: activeLng,
      soilType,
      waterAvailability,
      weather,
    });
  }, [
    planningType,
    activeArea,
    shortDurationAcres,
    customDays,
    selectedFestivalId,
    mainCrop,
    activeLat,
    activeLng,
    soilType,
    waterAvailability,
    weather,
  ]);

  // Sync default expanded crop on evaluation update
  useEffect(() => {
    if (planningResult.recommendedCrops.length > 0 && !expandedCropId) {
      setExpandedCropId(planningResult.recommendedCrops[0].cropId);
    }
  }, [planningResult, expandedCropId]);

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-md space-y-6 transition-all">
      {/* 1. Header & Optional Master Activation Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-black text-[10px] uppercase tracking-wider">
              🌾 Optional Intelligence Layer
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Agro-Climatic · Duration · Festival Timing
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>🌱</span>
            <span>Seasonal & Short-Duration Crop Planning</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Optionally plan a high-velocity short-duration crop (30–75 days) or festival-timed harvest alongside or between your major crop cycles without replacing your base plan.
          </p>
        </div>

        {/* Master Toggle Pill Button */}
        <button
          type="button"
          onClick={() => {
            const next = !isEnabled;
            setIsEnabled(next);
            if (!next) {
              setInternalAllocatedCropId(null);
              onAllocateSeasonalCrop?.(null);
            }
          }}
          className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md flex items-center gap-2.5 cursor-pointer shrink-0 border-2 ${
            isEnabled
              ? "bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-900 ring-4 ring-emerald-500/20"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
          }`}
        >
          <span className="text-base">{isEnabled ? "✓" : "○"}</span>
          <span>{isEnabled ? "Seasonal Planning: ENABLED" : "Enable Seasonal Planning"}</span>
        </button>
      </div>

      {/* 2. Content Revealed ONLY when enabled */}
      {!isEnabled ? (
        <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-1 text-xs text-slate-500">
          <p className="font-bold text-slate-700">
            Seasonal & Short-Duration Planning is currently OFF.
          </p>
          <p>
            Your farm is using the standard 4-part multi-crop portfolio. Click <strong>Enable Seasonal Planning</strong> above to evaluate catch crops, festival demand spikes, and quick turnaround produce for your location.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* A. Planning Intent Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              What are you planning for?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                {
                  id: "short_duration" as SeasonalPlanningType,
                  icon: "⚡",
                  title: "Short-Duration Crop",
                  subtitle: "30–75 day accelerated crops",
                },
                {
                  id: "festival_season" as SeasonalPlanningType,
                  icon: "🎉",
                  title: "Festival Season",
                  subtitle: "Harvest timed for festive demand",
                },
                {
                  id: "interim_crop" as SeasonalPlanningType,
                  icon: "🔄",
                  title: "Interim Catch Crop",
                  subtitle: "Fill vacant gap between cycles",
                },
                {
                  id: "custom_deadline" as SeasonalPlanningType,
                  icon: "⏱️",
                  title: "Custom Deadline",
                  subtitle: "Specific days window",
                },
              ].map((tab) => {
                const isSelected = planningType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setPlanningType(tab.id);
                      if (tab.id === "short_duration") setCustomDays(65);
                      if (tab.id === "festival_season") setCustomDays(60);
                      if (tab.id === "interim_crop") setCustomDays(70);
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "border-emerald-700 bg-emerald-50 text-slate-900 ring-2 ring-emerald-500/20 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{tab.icon}</span>
                    <div className="space-y-0.5">
                      <strong className="text-xs font-black block text-slate-900">
                        {tab.title}
                      </strong>
                      <span className="text-[11px] text-slate-500 block leading-tight">
                        {tab.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* B. Contextual Configuration Bar */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Context 1: Festival Selector if festival mode */}
            {planningType === "festival_season" && (
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-black uppercase text-slate-600">
                  Select Target Upcoming Festival / Season:
                </label>
                <select
                  value={selectedFestivalId}
                  onChange={(e) => setSelectedFestivalId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {INDIAN_FESTIVALS_CATALOG.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.hindiName}) · {f.targetWindowDescription}
                    </option>
                  ))}
                </select>
                {planningResult.festival && (
                  <p className="text-[11px] text-emerald-800 font-medium pt-0.5">
                    💡 {planningResult.festival.marketContext}
                  </p>
                )}
              </div>
            )}

            {/* Context 2: Interim Crop Selector if interim mode */}
            {planningType === "interim_crop" && (
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-black uppercase text-slate-600">
                  Select Primary Crop You Are Rotating Around:
                </label>
                <select
                  value={mainCrop}
                  onChange={(e) => setMainCrop(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Wheat">Wheat (Rabi harvested in April ➔ Zaid gap before Rice)</option>
                  <option value="Paddy / Rice (Dhan)">Paddy / Rice (Harvested in Oct ➔ Catch gap before Wheat)</option>
                  <option value="Cotton (Kapas)">Cotton (Harvested late ➔ Spring gap)</option>
                  <option value="Potato (Aloo)">Potato (Harvested in Feb ➔ Zaid gap before Kharif)</option>
                  <option value="Mustard">Mustard (Harvested in Feb ➔ Summer gap before Monsoon)</option>
                </select>
                <p className="text-[11px] text-slate-500 font-medium pt-0.5">
                  AgriProfit checks planting window gaps, soil prep time, and nutrient compatibility.
                </p>
              </div>
            )}

            {/* Context 3: Duration Slider if custom or short_duration */}
            {(planningType === "short_duration" || planningType === "custom_deadline") && (
              <div className="space-y-1 md:col-span-2">
                <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-600">
                  <span>Available Growing Window:</span>
                  <span className="text-emerald-700 font-mono font-bold text-xs">{customDays} Days</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="90"
                  step="5"
                  value={customDays}
                  onChange={(e) => setCustomDays(Number(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>25d (Ultra-fast greens)</span>
                  <span>50d (Vegetables)</span>
                  <span>75d (Pulses)</span>
                  <span>90d (Catch oilseeds)</span>
                </div>
              </div>
            )}

            {/* Allocation Acreage Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-600">
                Land Parcel to Allocate:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={farmAreaAcres}
                  value={shortDurationAcres}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v > 0) {
                      setShortDurationAcres(Math.min(farmAreaAcres, v));
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 font-mono"
                />
                <span className="text-xs font-bold text-slate-500">ac</span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                {Math.round((shortDurationAcres / (farmAreaAcres || 1)) * 100)}% of your {farmAreaAcres} ac farm
              </span>
            </div>
          </div>

          {/* C. Location & Agro-Climatic Intelligence Strip */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-emerald-950">📍 Field Location:</span>
              <span className="text-emerald-800 font-semibold">
                {planningResult.location.district}, {planningResult.location.state}
              </span>
              <span className="px-2 py-0.5 bg-emerald-200/70 text-emerald-900 rounded font-mono font-bold text-[10px]">
                Zone: {planningResult.location.agroClimaticZone} ({planningResult.location.region} Region)
              </span>
            </div>
            <div className="flex items-center gap-3 ml-auto text-emerald-900 font-medium">
              <span>Soil: <strong>{soilType}</strong></span>
              <span>•</span>
              <span>Window: <strong>{planningResult.availableDays} Days</strong></span>
            </div>
          </div>

          {/* D. Evaluated Seasonal Opportunities Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">
                🌱 Top Agronomically Feasible Candidates ({planningResult.recommendedCrops.length} Found)
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                Ranked by 10-factor composite viability
              </span>
            </div>

            {planningResult.recommendedCrops.length === 0 ? (
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2 text-xs text-rose-800">
                <p className="font-bold text-sm">
                  ⚠️ No suitable short-duration crop was found for this planning window under the current soil, weather, and location conditions.
                </p>
                <p className="text-slate-600 max-w-lg mx-auto">
                  Try extending your available window to 60+ days, or check another cropping season.
                </p>
                {planningResult.disqualifiedCrops.length > 0 && (
                  <div className="text-left max-w-md mx-auto pt-2 space-y-1 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700">Disqualified candidates:</span>
                    {planningResult.disqualifiedCrops.slice(0, 3).map((d) => (
                      <div key={d.cropName}>• {d.cropName}: {d.reason}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {planningResult.recommendedCrops.map((crop, idx) => {
                  const isAllocated = (internalAllocatedCropId || allocatedSeasonalCropId) === crop.cropId;
                  const isExpanded = expandedCropId === crop.cropId;
                  const rankMedal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🌱";

                  return (
                    <div
                      key={crop.cropId}
                      className={`p-5 rounded-2xl border-2 transition-all space-y-4 ${
                        isAllocated
                          ? "border-emerald-700 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      {/* Top Row: Crop Details, Badges & Allocate CTA */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg">{rankMedal}</span>
                            <h5 className="text-base font-black text-slate-900">
                              {crop.cropName}
                            </h5>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono font-bold text-[11px]">
                              ⏱️ {crop.durationRange}
                            </span>
                            {crop.mspSupported ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[10px]">
                                🏛️ MSP ₹{crop.mspPrice?.toLocaleString("en-IN")}/q
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold text-[10px]">
                                🛒 Market-Driven Cash
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-sky-100 text-sky-900 rounded font-bold text-[10px]">
                              Outlook: {crop.marketOutlook}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Expected Harvest: <strong>{new Date(crop.expectedHarvestDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</strong> (Margin: +{crop.daysMargin} days before window closes)
                          </p>
                        </div>

                        {/* Allocate to Map Action */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {(onAllocateCropToMap || onAllocateSeasonalCrop) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isAllocated) {
                                  setInternalAllocatedCropId(null);
                                  onAllocateSeasonalCrop?.(null);
                                } else {
                                  setInternalAllocatedCropId(crop.cropId);
                                  onAllocateSeasonalCrop?.({
                                    cropId: crop.cropId,
                                    cropSlug: crop.slug,
                                    cropName: crop.cropName,
                                    hindiName: crop.hindiName,
                                    allocatedAcres: shortDurationAcres,
                                    expectedProfitPerAcre: Math.round(crop.financials.expectedNetProfit / (shortDurationAcres || 1)),
                                    expectedGrossRevenuePerAcre: Math.round(crop.financials.expectedGrossRevenue / (shortDurationAcres || 1)),
                                    costPerAcre: Math.round(crop.financials.totalEstimatedCost / (shortDurationAcres || 1)),
                                    durationDays: crop.durationDays,
                                    harvestDate: new Date(crop.expectedHarvestDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
                                    festivalMatch: planningType === "festival_season" ? selectedFestival?.name : undefined,
                                    reason: crop.whyRecommended[0],
                                  });
                                  onAllocateCropToMap?.({
                                    cropId: crop.cropId,
                                    cropSlug: crop.slug,
                                    cropName: crop.cropName,
                                    hindiName: crop.hindiName,
                                    acres: shortDurationAcres,
                                    expectedProfit: crop.financials.expectedNetProfit,
                                    roi: crop.financials.roiMultiplier,
                                  });
                                }
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                                isAllocated
                                  ? "bg-emerald-800 text-white shadow-md ring-2 ring-emerald-400"
                                  : "bg-[#0b4d75] hover:bg-[#083754] text-white"
                              }`}
                            >
                              <span>{isAllocated ? "✓ Allocated on Farm Map" : "📐 Allocate on Land Graph"}</span>
                            </button>
                          )}
                          <Link
                            href={crop.mspSupported ? `/marketplace/msp?crop=${encodeURIComponent(crop.cropName)}` : `/marketplace/direct`}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200"
                          >
                            Marketplace ➔
                          </Link>
                        </div>
                      </div>

                      {/* Financial Projection Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-xl text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Net Profit ({shortDurationAcres} ac)</span>
                          <strong className="text-sm font-black text-emerald-700">
                            ₹{crop.financials.expectedNetProfit.toLocaleString("en-IN")}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Gross Revenue</span>
                          <strong className="text-sm font-black text-slate-900">
                            ₹{crop.financials.expectedGrossRevenue.toLocaleString("en-IN")}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Estimated Seed/Input Cost</span>
                          <strong className="text-sm font-black text-slate-700">
                            ₹{crop.financials.totalEstimatedCost.toLocaleString("en-IN")}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Return on Capital</span>
                          <strong className="text-sm font-black text-blue-700">
                            {crop.financials.roiMultiplier}x ROI
                          </strong>
                        </div>
                      </div>

                      {/* Why Recommended Rationale */}
                      <div className="space-y-1.5 text-xs text-slate-700">
                        <strong className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                          Why Recommended for Your Farm:
                        </strong>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          {crop.whyRecommended.map((r, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-700 mt-0.5">✓</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Expandable Visual Timeline Stepper */}
                      <div className="border-t border-slate-200 pt-3">
                        <button
                          type="button"
                          onClick={() => setExpandedCropId(isExpanded ? null : crop.cropId)}
                          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{isExpanded ? "▾ Hide Harvest Timeline" : "▸ View Sowing to Market Timeline"}</span>
                        </button>

                        {isExpanded && (
                          <div className="pt-3 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                              {crop.timeline.map((phase, pIdx) => (
                                <div
                                  key={pIdx}
                                  className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                                    phase.status === "target"
                                      ? "bg-amber-50 border-amber-300 text-amber-950"
                                      : phase.status === "active"
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                                      : "bg-slate-50 border-slate-200 text-slate-700"
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span>Step {pIdx + 1}</span>
                                    <span className="font-mono">{phase.daySpan}</span>
                                  </div>
                                  <strong className="text-xs font-black block leading-tight">
                                    {phase.phase}
                                  </strong>
                                  <p className="text-[10px] text-slate-500 leading-tight">
                                    {phase.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
