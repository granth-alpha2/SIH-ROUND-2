"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppShell from "../components/AppShell";
import FarmParcelMap from "../components/FarmParcelMap";
import { simulateCropFinancials } from "@/lib/simulation-engine";
import {
  optimizePortfolio,
  type OptimizedPortfolio,
  type AllocatedCropItem,
  type RiskAppetite,
  type ResourceLevel,
} from "@/lib/portfolio-optimizer";
import { type CropSeason, type CropRecord } from "@/lib/crop-data";
import { resolveDistrictFromCoords } from "@/lib/geo-service";
import CropCompareCard from "@/features/recommendations/CropCompareCard";

function formatCurrency(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export default function RecommendationDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Synchronously resolve query parameters for immediate 0ms initial render
  const urlFarmId = searchParams.get("farmId");
  const urlAcres = searchParams.get("acres");
  const urlName = searchParams.get("name");
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");
  const urlRisk = searchParams.get("risk");
  const urlWater = searchParams.get("water");
  const urlSoil = searchParams.get("soil");
  const urlSeason = searchParams.get("season");

  const initialAcres = useMemo(() => {
    const val = urlAcres ? parseFloat(urlAcres) : 2.5;
    return !isNaN(val) && val > 0 ? Number(val.toFixed(2)) : 2.5;
  }, [urlAcres]);

  const initialRisk: RiskAppetite = useMemo(() => {
    return urlRisk === "Conservative" || urlRisk === "Balanced" || urlRisk === "Growth"
      ? (urlRisk as RiskAppetite)
      : "Balanced";
  }, [urlRisk]);

  const initialWater: ResourceLevel = useMemo(() => {
    return urlWater === "Low" || urlWater === "Medium" || urlWater === "High"
      ? (urlWater as ResourceLevel)
      : "Medium";
  }, [urlWater]);

  const initialSeason: CropSeason = useMemo(() => {
    return urlSeason === "Kharif" || urlSeason === "Zaid" || urlSeason === "Rabi"
      ? (urlSeason as CropSeason)
      : "Rabi";
  }, [urlSeason]);

  const initialLocationInfo = useMemo(() => {
    const lat = urlLat ? parseFloat(urlLat) : 30.211;
    const lng = urlLng ? parseFloat(urlLng) : 74.9455;
    const dInfo = resolveDistrictFromCoords(lat, lng);
    let defaultSoil = "Alluvial";
    if (["Maharashtra", "Madhya Pradesh", "Gujarat"].includes(dInfo.state)) {
      defaultSoil = "Black soil";
    } else if (["Rajasthan"].includes(dInfo.state)) {
      defaultSoil = "Sandy loam";
    } else if (["Karnataka", "Andhra Pradesh", "Telangana"].includes(dInfo.state)) {
      defaultSoil = "Clay loam";
    }
    return {
      location: `${dInfo.district}, ${dInfo.state} (${dInfo.agroClimaticZone})`,
      soil: urlSoil || defaultSoil,
      name: urlName ? decodeURIComponent(urlName) : `${dInfo.district} Farm Plot`,
    };
  }, [urlLat, urlLng, urlSoil, urlName]);

  const [openExplanation, setOpenExplanation] = useState<number | null>(null);

  // Active Farm & Geospatial State
  const [farmName, setFarmName] = useState(initialLocationInfo.name);
  const [farmLocation, setFarmLocation] = useState(initialLocationInfo.location);
  const [totalLandAcres, setTotalLandAcres] = useState<number>(initialAcres);
  const [farmBoundary, setFarmBoundary] = useState<{ lat: number; lng: number }[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);

  // Strategy, Water, Soil & Season state
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>(initialRisk);
  const [waterAvailability, setWaterAvailability] = useState<ResourceLevel>(initialWater);
  const [soilType, setSoilType] = useState<string>(initialLocationInfo.soil);
  const [season, setSeason] = useState<CropSeason>(initialSeason);

  // Synchronously compute initial portfolio with zero network latency (runs in <2ms)
  const initialPortfolio = useMemo(() => {
    return optimizePortfolio({
      totalLandAcres: initialAcres,
      season: initialSeason,
      riskAppetite: initialRisk,
      waterAvailability: initialWater,
      investmentCapacity: "Medium",
      userSoilType: initialLocationInfo.soil,
    });
  }, [initialAcres, initialSeason, initialRisk, initialWater, initialLocationInfo.soil]);

  const [portfolio, setPortfolio] = useState<OptimizedPortfolio>(initialPortfolio);

  const [customAcres, setCustomAcres] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const item of initialPortfolio.allocations) {
      map[item.cropId] = item.allocatedAcres;
    }
    return map;
  });

  // Sensitivity Simulator state
  const firstCrop = initialPortfolio.allocations[0];
  const [simCropName, setSimCropName] = useState(firstCrop?.cropName || "Wheat");
  const [simArea, setSimArea] = useState<number>(firstCrop?.allocatedAcres || 2.5);
  const [simPrice, setSimPrice] = useState<number>(firstCrop?.expectedSellingPricePerQuintal || 2380);
  const [simYield, setSimYield] = useState<number>(firstCrop?.expectedYieldPerAcre || 14.5);
  const [simCost, setSimCost] = useState<number>(firstCrop?.costPerAcre || 11500);

  // Background hydration: Loads boundary polygon & farm name asynchronously without blocking the UI
  useEffect(() => {
    let isCancelled = false;

    async function loadSavedFarmData() {
      try {
        const farmId = searchParams.get("farmId");
        let boundary: { lat: number; lng: number }[] = [];
        let fetchedAcres: number | null = null;
        let fetchedName: string | null = null;
        let fetchedRisk: RiskAppetite | null = null;
        let fetchedWater: ResourceLevel | null = null;

        if (farmId) {
          const fRes = await fetch(`/api/farms/${farmId}`);
          if (fRes.ok) {
            const fJson = await fRes.json();
            if (fJson.farm) {
              if (fJson.farm.boundary && Array.isArray(fJson.farm.boundary) && fJson.farm.boundary.length >= 3) {
                boundary = fJson.farm.boundary;
              }
              if (fJson.farm.areaAcres) fetchedAcres = fJson.farm.areaAcres;
              if (fJson.farm.name) fetchedName = fJson.farm.name;
              if (fJson.farm.preferences?.risk) fetchedRisk = fJson.farm.preferences.risk;
              if (fJson.farm.preferences?.water) fetchedWater = fJson.farm.preferences.water;
            }
          }
        }

        if (boundary.length === 0) {
          const savedRaw = localStorage.getItem("agriprofit_active_farm");
          if (savedRaw) {
            const parsed = JSON.parse(savedRaw);
            if (parsed.boundary && Array.isArray(parsed.boundary) && parsed.boundary.length >= 3) {
              boundary = parsed.boundary;
            }
            if (!fetchedAcres && parsed.areaAcres) fetchedAcres = parsed.areaAcres;
            if (!fetchedName && parsed.name) fetchedName = parsed.name;
            if (!fetchedRisk && parsed.preferences?.risk) fetchedRisk = parsed.preferences.risk;
            if (!fetchedWater && parsed.preferences?.water) fetchedWater = parsed.preferences.water;
          }
        }

        if (isCancelled) return;

        if (boundary.length >= 3) {
          setFarmBoundary(boundary);
        }
        if (fetchedName && !urlName) {
          setFarmName(fetchedName);
        }

        // Only update acreage/risk/water if NOT specified in URL and different from current
        const needsUpdate =
          (!urlAcres && fetchedAcres && fetchedAcres !== totalLandAcres) ||
          (!urlRisk && fetchedRisk && fetchedRisk !== riskAppetite) ||
          (!urlWater && fetchedWater && fetchedWater !== waterAvailability);

        if (needsUpdate) {
          handleStrategyChange({
            newAcres: !urlAcres && fetchedAcres ? fetchedAcres : undefined,
            newRisk: !urlRisk && fetchedRisk ? fetchedRisk : undefined,
            newWater: !urlWater && fetchedWater ? fetchedWater : undefined,
          });
        }
      } catch (err) {
        console.warn("[Saved Farm Hydration]", err);
      }
    }

    loadSavedFarmData();

    return () => {
      isCancelled = true;
    };
  }, []);

  function handleStrategyChange(opts: {
    newRisk?: RiskAppetite;
    newWater?: ResourceLevel;
    newSoil?: string;
    newSeason?: CropSeason;
    newAcres?: number;
  }) {
    const r = opts.newRisk !== undefined ? opts.newRisk : riskAppetite;
    const w = opts.newWater !== undefined ? opts.newWater : waterAvailability;
    const s = opts.newSoil !== undefined ? opts.newSoil : soilType;
    const se = opts.newSeason !== undefined ? opts.newSeason : season;
    const ac = Math.max(0.2, Number((opts.newAcres !== undefined ? opts.newAcres : totalLandAcres).toFixed(2)));

    setRiskAppetite(r);
    setWaterAvailability(w);
    setSoilType(s);
    setSeason(se);
    setTotalLandAcres(ac);

    const updated = optimizePortfolio({
      totalLandAcres: ac,
      season: se,
      riskAppetite: r,
      waterAvailability: w,
      investmentCapacity: "Medium",
      userSoilType: s,
    });
    setPortfolio(updated);

    const initAcres: Record<string, number> = {};
    for (const item of updated.allocations) {
      initAcres[item.cropId] = item.allocatedAcres;
    }
    setCustomAcres(initAcres);

    if (updated.allocations.length > 0) {
      const first = updated.allocations[0];
      setSimCropName(first.cropName);
      setSimArea(first.allocatedAcres);
      setSimPrice(first.expectedSellingPricePerQuintal);
      setSimYield(first.expectedYieldPerAcre);
      setSimCost(first.costPerAcre);
    }

    try {
      const url = new URL(window.location.href);
      url.searchParams.set("acres", ac.toString());
      url.searchParams.set("risk", r);
      url.searchParams.set("water", w);
      url.searchParams.set("soil", s);
      url.searchParams.set("season", se);
      window.history.replaceState(window.history.state, "", url.toString());

      const savedRaw = localStorage.getItem("agriprofit_active_farm");
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        parsed.areaAcres = ac;
        parsed.preferences = {
          ...(parsed.preferences || {}),
          risk: r,
          water: w,
          soil: s,
          season: se,
        };
        localStorage.setItem("agriprofit_active_farm", JSON.stringify(parsed));
      }
    } catch {
      // ignore history error
    }
  }

  const editedAllocations = useMemo(() => {
    if (!portfolio) return [];
    return portfolio.allocations.map((alloc) => {
      const liveAcres = customAcres[alloc.cropId] !== undefined ? customAcres[alloc.cropId] : alloc.allocatedAcres;
      const sim = simulateCropFinancials({
        areaAcres: liveAcres,
        expectedSellingPricePerQuintal: alloc.expectedSellingPricePerQuintal,
        expectedYieldQuintalsPerAcre: alloc.expectedYieldPerAcre,
        inputCostPerAcre: alloc.costPerAcre,
      });

      return {
        ...alloc,
        allocatedAcres: liveAcres,
        allocatedRevenue: sim.expectedGrossRevenue,
        allocatedCost: sim.totalEstimatedCost,
        allocatedProfit: sim.expectedNetProfit,
        breakEvenYield: sim.breakEvenYieldQuintalsPerAcre,
        breakEvenPrice: sim.breakEvenPricePerQuintal,
      };
    });
  }, [portfolio, customAcres]);

  const totalEditedAcres = useMemo(() => {
    return editedAllocations.reduce((sum, a) => sum + a.allocatedAcres, 0);
  }, [editedAllocations]);

  const totalEditedRevenue = useMemo(() => {
    return editedAllocations.reduce((sum, a) => sum + a.allocatedRevenue, 0);
  }, [editedAllocations]);

  const totalEditedCost = useMemo(() => {
    return editedAllocations.reduce((sum, a) => sum + a.allocatedCost, 0);
  }, [editedAllocations]);

  const totalEditedProfit = useMemo(() => {
    return totalEditedRevenue - totalEditedCost;
  }, [totalEditedRevenue, totalEditedCost]);

  const totalEditedRoi = useMemo(() => {
    return totalEditedCost > 0 ? Number((totalEditedRevenue / totalEditedCost).toFixed(2)) : 0;
  }, [totalEditedRevenue, totalEditedCost]);

  const simResult = useMemo(() => {
    return simulateCropFinancials({
      areaAcres: simArea,
      expectedSellingPricePerQuintal: simPrice,
      expectedYieldQuintalsPerAcre: simYield,
      inputCostPerAcre: simCost,
    });
  }, [simArea, simPrice, simYield, simCost]);

  function handleAcreChange(cropId: string, value: number) {
    setCustomAcres((prev) => ({
      ...prev,
      [cropId]: Math.max(0, Number(value.toFixed(2))),
    }));
  }

  function handleKeepFarmerCrop(farmerCrop: CropRecord) {
    const isAlreadyInPortfolio = portfolio.allocations.some(
      (a) => a.cropId === farmerCrop.id || a.cropSlug === farmerCrop.slug
    );

    if (isAlreadyInPortfolio) {
      const dominantAcres = Number((totalLandAcres * 0.6).toFixed(2));
      const remainingAcres = Math.max(0.1, Number((totalLandAcres - dominantAcres).toFixed(2)));
      const otherCrops = portfolio.allocations.filter(
        (a) => a.cropId !== farmerCrop.id && a.cropSlug !== farmerCrop.slug
      );
      const perOther = Number((remainingAcres / Math.max(1, otherCrops.length)).toFixed(2));

      const newMap: Record<string, number> = {
        [farmerCrop.id]: dominantAcres,
      };
      otherCrops.forEach((c) => {
        newMap[c.cropId] = perOther;
      });
      setCustomAcres(newMap);
      setSelectedCropId(farmerCrop.id);
    } else {
      const updated = optimizePortfolio({
        totalLandAcres,
        season,
        riskAppetite,
        waterAvailability,
        investmentCapacity: "Medium",
        userSoilType: soilType,
        preferredCrops: [farmerCrop.name, farmerCrop.slug],
      });
      setPortfolio(updated);
      setSelectedCropId(farmerCrop.id);
      const newMap: Record<string, number> = {};
      for (const item of updated.allocations) {
        newMap[item.cropId] = item.allocatedAcres;
      }
      setCustomAcres(newMap);
    }

    setTimeout(() => {
      const el = document.getElementById(`crop-card-${farmerCrop.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }

  function acceptRecommendation() {
    if (!portfolio) return;
    const payload = {
      overall: {
        title: portfolio.title,
        explanation: portfolio.diversificationExplanation,
      },
      allocations: editedAllocations.map((a: AllocatedCropItem) => ({
        name: a.cropName,
        percent: Math.round((a.allocatedAcres / (totalEditedAcres || 1)) * 100),
        score: a.score,
        expectedRevenue: a.allocatedRevenue,
        estimatedCost: a.allocatedCost,
        explanation: a.reasonsForAllocation.join(". "),
      })),
      acceptedAt: new Date().toISOString(),
      sowingDate: new Date().toISOString(),
      region: farmLocation,
      farmName,
      totalAcres: totalEditedAcres,
    };
    try {
      localStorage.setItem("acceptedRecommendation", JSON.stringify(payload));
    } catch {
      // Storage fallback
    }
    router.push("/crop-plan");
  }

  return (
    <AppShell pageTitle="Crop Suitability & Land Allocation">
      <div className="space-y-6">
        {/* Source & Freshness Metadata Bar (Fix 3) */}
        <section className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900">Scoring Engine:</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
              FastAPI Random Forest Yield Predictor (R²=0.9601)
            </span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
              5-Factor Bounded Agronomic Formula
            </span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
              CACP 2024-25 MSP Floors
            </span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-slate-500">Last Calculated: Dynamic on client input</span>
          </div>
        </section>

        {/* 1. Dashboard Header Banner */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 bg-emerald-700 text-white text-xs font-bold rounded">
                🌾 {farmName} ({totalLandAcres.toFixed(2)} Acres / {(totalLandAcres / 2.47105).toFixed(2)} ha)
              </span>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                📍 {farmLocation}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Crop Suitability Scoring & Land Division
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              Tailored for your {totalLandAcres.toFixed(2)}-acre land holding, balancing expected margins, agro-climatic water availability, and government MSP floor price protection.
            </p>
          </div>

          <button
            type="button"
            onClick={acceptRecommendation}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-base shrink-0 shadow-sm cursor-pointer"
          >
            <span>✓ Accept & View Farm Plan →</span>
          </button>
        </header>

        {/* 1. Real-Time Farm Strategy & Land Division Studio */}
        <section className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-6">
          {/* Studio Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                  📐 Interactive Land Partition & Scoring
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Evaluates Agronomic Suitability & Projected Returns
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                <span>⚙️</span>
                <span>Farm Land Division & Resource Settings</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
                Adjust farm acreage, risk tolerance, water availability, soil type, or season below. The suitability score, multi-crop land partition, and financial projections recompute automatically.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 self-start sm:self-auto">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-sm font-bold rounded">
                Suitability Score: {portfolio.overallScore}/100 *
              </span>
              <span className="text-[10px] text-slate-500">* Derived from 5-factor weighted formula</span>
            </div>
          </div>


              {/* 2-Column Responsive Layout: Left = Interactive Controls, Right = Live Land Diagram + Financial KPIs */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Left Column: All 5 Interactive Controls (xl:col-span-6) */}
                <div className="xl:col-span-6 space-y-5">
                  {/* 1. Total Farm Land Acreage Quick Adjuster */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)] space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wider block font-['Space_Grotesk']">
                        📐 Farm Land Size (Total Acres):
                      </label>
                      <span className="text-xs font-bold text-[var(--color-primary)] font-['Space_Grotesk']">
                        {(totalLandAcres / 2.47105).toFixed(2)} Hectares
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStrategyChange({ newAcres: Math.max(0.5, totalLandAcres - 1) })}
                        className="agri-btn-secondary px-4 py-2 min-h-[48px] text-lg font-black shrink-0 cursor-pointer"
                        title="Decrease 1 acre"
                      >
                        − 1 ac
                      </button>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0.2"
                          max="500"
                          value={totalLandAcres}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              handleStrategyChange({ newAcres: val });
                            }
                          }}
                          className="w-full text-center font-black text-2xl font-['Space_Grotesk'] py-2 px-3 rounded-xl border-2 border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)] pointer-events-none">
                          acres
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStrategyChange({ newAcres: totalLandAcres + 1 })}
                        className="agri-btn-secondary px-4 py-2 min-h-[48px] text-lg font-black shrink-0 cursor-pointer"
                        title="Increase 1 acre"
                      >
                        + 1 ac
                      </button>
                    </div>
                    {/* Quick Preset Acreage Buttons */}
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <span className="text-xs font-bold text-[var(--text-muted)]">Quick Presets:</span>
                      {[1.0, 2.5, 5.0, 10.0, 15.0].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleStrategyChange({ newAcres: preset })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            Math.abs(totalLandAcres - preset) < 0.05
                              ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] font-black shadow-xs"
                              : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--color-primary)]"
                          }`}
                        >
                          {preset} ac
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Risk Strategy Profile */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wider block font-['Space_Grotesk']">
                        🛡️ Risk Strategy Profile:
                      </label>
                      <span className="text-xs font-bold text-[var(--text-muted)]">
                        Affects land safety ratio
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleStrategyChange({ newRisk: "Conservative" })}
                        className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[72px] ${
                          riskAppetite === "Conservative"
                            ? "border-emerald-800 bg-emerald-700 text-white font-black ring-4 ring-emerald-500/30 shadow-md"
                            : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-emerald-600 hover:bg-emerald-50/40 font-bold"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-base sm:text-lg">🛡️</span>
                          <span className="text-xs sm:text-sm font-black">Conservative</span>
                        </div>
                        <span className={`text-[11px] leading-tight ${riskAppetite === "Conservative" ? "text-emerald-100" : "text-[var(--text-muted)]"}`}>
                          MSP Floor Guarantee
                        </span>
                        {riskAppetite === "Conservative" && (
                          <span className="mt-0.5 px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-black uppercase tracking-wider">
                            ✓ ACTIVE
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStrategyChange({ newRisk: "Balanced" })}
                        className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[72px] ${
                          riskAppetite === "Balanced"
                            ? "border-amber-700 bg-amber-600 text-white font-black ring-4 ring-amber-500/30 shadow-md"
                            : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-amber-600 hover:bg-amber-50/40 font-bold"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-base sm:text-lg">⚖️</span>
                          <span className="text-xs sm:text-sm font-black">Balanced</span>
                        </div>
                        <span className={`text-[11px] leading-tight ${riskAppetite === "Balanced" ? "text-amber-100" : "text-[var(--text-muted)]"}`}>
                          Multi-Crop Diversified
                        </span>
                        {riskAppetite === "Balanced" && (
                          <span className="mt-0.5 px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-black uppercase tracking-wider">
                            ✓ ACTIVE
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStrategyChange({ newRisk: "Growth" })}
                        className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[72px] ${
                          riskAppetite === "Growth"
                            ? "border-rose-800 bg-rose-700 text-white font-black ring-4 ring-rose-500/30 shadow-md"
                            : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-rose-600 hover:bg-rose-50/40 font-bold"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-base sm:text-lg">🚀</span>
                          <span className="text-xs sm:text-sm font-black">Growth</span>
                        </div>
                        <span className={`text-[11px] leading-tight ${riskAppetite === "Growth" ? "text-rose-100" : "text-[var(--text-muted)]"}`}>
                          High Market Upside
                        </span>
                        {riskAppetite === "Growth" && (
                          <span className="mt-0.5 px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-black uppercase tracking-wider">
                            ✓ ACTIVE
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 3. Water Source Availability */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wider block font-['Space_Grotesk']">
                        💧 Water Source Availability:
                      </label>
                      <span className="text-xs font-bold text-[var(--text-muted)]">
                        Filters drought-resilient crops
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleStrategyChange({ newWater: "Low" })}
                        className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[72px] ${
                          waterAvailability === "Low"
                            ? "border-sky-800 bg-sky-700 text-white font-black ring-4 ring-sky-500/30 shadow-md"
                            : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-sky-600 hover:bg-sky-50/40 font-bold"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-base sm:text-lg">💧</span>
                          <span className="text-xs sm:text-sm font-black">Low</span>
                        </div>
                        <span className={`text-[11px] leading-tight ${waterAvailability === "Low" ? "text-sky-100" : "text-[var(--text-muted)]"}`}>
                          Rainfed / Tanker
                        </span>
                        {waterAvailability === "Low" && (
                          <span className="mt-0.5 px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-black uppercase tracking-wider">
                            ✓ ACTIVE
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStrategyChange({ newWater: "Medium" })}
                        className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[72px] ${
                          waterAvailability === "Medium"
                            ? "border-teal-800 bg-teal-700 text-white font-black ring-4 ring-teal-500/30 shadow-md"
                            : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-teal-600 hover:bg-teal-50/40 font-bold"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-base sm:text-lg">💧💧</span>
                          <span className="text-xs sm:text-sm font-black">Medium</span>
                        </div>
                        <span className={`text-[11px] leading-tight ${waterAvailability === "Medium" ? "text-teal-100" : "text-[var(--text-muted)]"}`}>
                          Canal / Tube-Well
                        </span>
                        {waterAvailability === "Medium" && (
                          <span className="mt-0.5 px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-black uppercase tracking-wider">
                            ✓ ACTIVE
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStrategyChange({ newWater: "High" })}
                        className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[72px] ${
                          waterAvailability === "High"
                            ? "border-blue-800 bg-blue-700 text-white font-black ring-4 ring-blue-500/30 shadow-md"
                            : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-blue-600 hover:bg-blue-50/40 font-bold"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-base sm:text-lg">💧💧💧</span>
                          <span className="text-xs sm:text-sm font-black">High</span>
                        </div>
                        <span className={`text-[11px] leading-tight ${waterAvailability === "High" ? "text-blue-100" : "text-[var(--text-muted)]"}`}>
                          Borewell / Drip
                        </span>
                        {waterAvailability === "High" && (
                          <span className="mt-0.5 px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-black uppercase tracking-wider">
                            ✓ ACTIVE
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 4. Soil Classification Toggle */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wider block font-['Space_Grotesk']">
                        🌱 Soil Texture & Type:
                      </label>
                      <span className="text-xs font-bold text-[var(--text-muted)]">
                        Matches soil health card
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: "Alluvial", label: "Alluvial (Indo-Gangetic)", icon: "🌾" },
                        { key: "Black soil", label: "Black Soil (Regur/Deccan)", icon: "🪨" },
                        { key: "Sandy loam", label: "Sandy Loam (Arid/North)", icon: "🏜️" },
                        { key: "Clay loam", label: "Clay Loam (Plateau)", icon: "🧱" },
                      ].map((s) => {
                        const isMatch = soilType.toLowerCase() === s.key.toLowerCase();
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => handleStrategyChange({ newSoil: s.key })}
                            className={`p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[64px] ${
                              isMatch
                                ? "border-emerald-800 bg-emerald-800 text-white font-black ring-4 ring-emerald-500/30 shadow-md"
                                : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-emerald-700 hover:bg-emerald-50/40 font-bold"
                            }`}
                          >
                            <span className="text-base">{s.icon}</span>
                            <span className="text-xs leading-tight font-black">{s.label}</span>
                            {isMatch && (
                              <span className="px-1.5 py-0.5 rounded-full bg-white/25 text-white text-[9px] font-black uppercase tracking-wider">
                                ✓ ACTIVE
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Cropping Season Toggle */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wider block font-['Space_Grotesk']">
                        🗓️ Cropping Season:
                      </label>
                      <span className="text-xs font-bold text-[var(--text-muted)]">
                        Switches candidate crop pool
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleStrategyChange({ newSeason: "Rabi" })}
                        className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[64px] ${
                          season === "Rabi"
                            ? "border-indigo-800 bg-indigo-700 text-white font-black ring-4 ring-indigo-500/30 shadow-md"
                            : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-indigo-600 hover:bg-indigo-50/40 font-bold"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-base sm:text-lg">❄️</span>
                          <span className="text-xs sm:text-sm font-black">Rabi (Winter · Oct–Mar)</span>
                        </div>
                        {season === "Rabi" && (
                          <span className="px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-black uppercase tracking-wider">
                            ✓ ACTIVE
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStrategyChange({ newSeason: "Kharif" })}
                        className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[64px] ${
                          season === "Kharif"
                            ? "border-indigo-800 bg-indigo-700 text-white font-black ring-4 ring-indigo-500/30 shadow-md"
                            : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-indigo-600 hover:bg-indigo-50/40 font-bold"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-base sm:text-lg">🌧️</span>
                          <span className="text-xs sm:text-sm font-black">Kharif (Monsoon · Jun–Oct)</span>
                        </div>
                        {season === "Kharif" && (
                          <span className="px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-black uppercase tracking-wider">
                            ✓ ACTIVE
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Real-Time Land Partition Diagram + Financial KPIs (xl:col-span-6) */}
                <div className="xl:col-span-6 space-y-4">
                  {/* Land Partition Map Component */}
                  <FarmParcelMap
                    boundary={farmBoundary}
                    allocations={editedAllocations.map((a: AllocatedCropItem) => ({
                      cropId: a.cropId,
                      cropName: a.cropName,
                      hindiName: a.hindiName,
                      allocatedAcres: a.allocatedAcres,
                      allocatedProfit: a.allocatedProfit,
                      percentage: Math.round((a.allocatedAcres / (totalEditedAcres || 1)) * 100),
                      strategyRole: a.strategyRole,
                    }))}
                    totalAcres={totalEditedAcres}
                    farmName={farmName}
                    selectedCropId={selectedCropId}
                    onSelectCrop={(cropId) => {
                      setSelectedCropId(cropId);
                      const el = document.getElementById(`crop-card-${cropId}`);
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  />

                  {/* 4 Financial KPI Chips right below the map */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[var(--color-emerald-bg)] border-2 border-[var(--color-emerald-border)] space-y-0.5">
                      <span className="text-xs text-[var(--color-emerald-text)] font-bold uppercase block tracking-wider">
                        Expected Net Profit
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold font-['Space_Grotesk'] text-[var(--color-emerald-text)] block">
                        {formatCurrency(totalEditedProfit)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)] space-y-0.5">
                      <span className="text-xs text-[var(--text-muted)] font-bold uppercase block tracking-wider">
                        Gross Revenue
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                        {formatCurrency(totalEditedRevenue)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)] space-y-0.5">
                      <span className="text-xs text-[var(--text-muted)] font-bold uppercase block tracking-wider">
                        Input Seed Cost
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                        {formatCurrency(totalEditedCost)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[var(--color-sky-bg)] border-2 border-[var(--color-sky-border)] space-y-0.5">
                      <span className="text-xs text-[var(--color-sky-text)] font-bold uppercase block tracking-wider">
                        Profit Return (ROI)
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold font-['Space_Grotesk'] text-[var(--color-sky-text)] block">
                        {totalEditedRoi}x
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Apni Fasal vs AI Fasal (Your Crop vs Our Recommendation) Comparison Module */}
            <CropCompareCard
              farmId={urlFarmId || undefined}
              farmAreaAcres={totalLandAcres}
              currentSeason={season}
              riskAppetite={riskAppetite}
              waterAvailability={waterAvailability}
              onSelectAiCrop={(cropId) => {
                setSelectedCropId(cropId);
                const el = document.getElementById(`crop-card-${cropId}`);
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              onKeepFarmerCrop={handleKeepFarmerCrop}
            />

            {/* 4. Single-Column Stack of Large Crop Cards */}
            <section className="agri-card p-6 sm:p-8 rounded-3xl border-2 space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-2 pb-4 border-b-2 border-[var(--border-subtle)]">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                    Recommended Crops & Land Division (Total: {totalEditedAcres.toFixed(2)} / {totalLandAcres.toFixed(2)} Acres)
                  </h3>
                  <p className="text-base text-[var(--text-secondary)] mt-1">
                    You can adjust the acres for each crop below. Earnings & farm map recalculate automatically.
                  </p>
                </div>
                {Math.abs(totalEditedAcres - totalLandAcres) > 0.05 && (
                  <span className="agri-badge agri-badge-amber text-sm px-3.5 py-1.5 font-bold">
                    ⚠️ Total acres ({totalEditedAcres.toFixed(2)} ac) differs from boundary ({totalLandAcres.toFixed(2)} ac)
                  </span>
                )}
              </div>

              <div className="space-y-5">
                {editedAllocations.map((alloc: AllocatedCropItem, idx: number) => (
                  <div
                    key={alloc.cropId}
                    id={`crop-card-${alloc.cropId}`}
                    className={`p-6 rounded-3xl bg-[var(--bg-surface-subtle)] border-2 transition-all space-y-4 ${
                      selectedCropId === alloc.cropId
                        ? "border-[var(--color-primary)] ring-4 ring-[var(--color-primary-light)] shadow-md"
                        : "border-[var(--border-default)] hover:border-[var(--color-primary)]"
                    }`}
                  >
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <strong className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] font-['Space_Grotesk']">
                            {alloc.cropName} ({alloc.hindiName})
                          </strong>
                          <span className="agri-badge agri-badge-emerald text-sm font-bold">
                            Score: {alloc.score}/100
                          </span>
                          {alloc.mspSafety && (
                            <span className="agri-badge agri-badge-sky text-sm font-bold">
                              ✓ Govt MSP ₹{alloc.mspPrice}/q
                            </span>
                          )}
                        </div>
                        <p className="text-base font-semibold text-[var(--text-secondary)]">
                          Role: {alloc.strategyRole} · Season: {alloc.season} ({alloc.category})
                        </p>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <label htmlFor={`acres-input-${alloc.cropId}`} className="text-base font-bold text-[var(--text-secondary)]">
                            Acres:
                          </label>
                          <input
                            id={`acres-input-${alloc.cropId}`}
                            type="number"
                            step="0.25"
                            min="0"
                            max={totalLandAcres * 2}
                            value={alloc.allocatedAcres}
                            onChange={(e) => handleAcreChange(alloc.cropId, parseFloat(e.target.value) || 0)}
                            className="agri-input w-28 text-center font-extrabold text-xl min-h-[54px] p-2"
                          />
                        </div>
                        <div className="text-right min-w-[120px]">
                          <span className="text-2xl sm:text-3xl font-extrabold font-['Space_Grotesk'] text-[var(--color-primary)] block">
                            {formatCurrency(alloc.allocatedProfit)}
                          </span>
                          <span className="text-sm text-[var(--text-secondary)] font-bold block">Net Profit</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[var(--bg-canvas)] h-3 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                      <div
                        className="bg-[var(--color-primary)] h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (alloc.allocatedAcres / (totalLandAcres || 1)) * 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-base text-[var(--text-secondary)] pt-1 flex-wrap gap-3">
                      <span>
                        Break-even: <strong className="text-[var(--text-primary)] font-bold">{alloc.breakEvenYield} q/ac</strong> @ ₹{alloc.breakEvenPrice}/q · Seed/Fertilizer Cost: {formatCurrency(alloc.costPerAcre)}/ac
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenExplanation(openExplanation === idx ? null : idx)}
                        className="text-base font-bold text-[var(--color-primary)] hover:underline cursor-pointer flex items-center gap-1.5"
                      >
                        {openExplanation === idx ? "Hide Explanation ▲" : "Why Grow This Crop? ▼"}
                      </button>
                    </div>

                    {openExplanation === idx && (
                      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-default)] text-base text-[var(--text-secondary)] space-y-2 animate-in fade-in duration-150">
                        <p className="font-bold text-[var(--text-primary)] font-['Space_Grotesk'] text-lg">
                          🌾 Agronomist Reason:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-base leading-relaxed">
                          {alloc.reasonsForAllocation.map((r, rIdx) => (
                            <li key={rIdx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Interactive Financial Sensitivity Simulator */}
            <section className="agri-card p-6 space-y-4">
              <div className="border-b border-[var(--border-subtle)] pb-2">
                <span className="agri-badge agri-badge-amber mb-1">Interactive Sandbox</span>
                <h3 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  📈 Profit & Volatility Sensitivity Simulator
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Simulate price volatility, yield swings, and cost inflation for your active crops.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label htmlFor="sim-crop-select" className="text-xs font-bold text-[var(--text-secondary)] block">
                    Select Crop:
                  </label>
                  <select
                    id="sim-crop-select"
                    value={simCropName}
                    onChange={(e) => {
                      const selected = portfolio.allocations.find((a) => a.cropName === e.target.value);
                      if (selected) {
                        setSimCropName(selected.cropName);
                        setSimArea(selected.allocatedAcres);
                        setSimPrice(selected.expectedSellingPricePerQuintal);
                        setSimYield(selected.expectedYieldPerAcre);
                        setSimCost(selected.costPerAcre);
                      }
                    }}
                    className="agri-select"
                  >
                    {portfolio.allocations.map((a) => (
                      <option key={a.cropId} value={a.cropName}>
                        {a.cropName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="sim-price-input" className="text-xs font-bold text-[var(--text-secondary)] block">
                    Mandi Price (₹/q):
                  </label>
                  <input
                    id="sim-price-input"
                    type="number"
                    value={simPrice}
                    onChange={(e) => setSimPrice(Number(e.target.value) || 0)}
                    className="agri-input font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="sim-yield-input" className="text-xs font-bold text-[var(--text-secondary)] block">
                    Expected Yield (q/ac):
                  </label>
                  <input
                    id="sim-yield-input"
                    type="number"
                    step="0.5"
                    value={simYield}
                    onChange={(e) => setSimYield(Number(e.target.value) || 0)}
                    className="agri-input font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="sim-cost-input" className="text-xs font-bold text-[var(--text-secondary)] block">
                    Input Cost (₹/ac):
                  </label>
                  <input
                    id="sim-cost-input"
                    type="number"
                    value={simCost}
                    onChange={(e) => setSimCost(Number(e.target.value) || 0)}
                    className="agri-input font-bold"
                  />
                </div>
              </div>

              {/* Simulation Output Card */}
              <div className="p-4 rounded-xl bg-[var(--color-emerald-bg)] border border-[var(--color-emerald-border)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-[var(--color-emerald-text)] uppercase font-semibold block">Simulated Revenue</span>
                  <strong className="text-sm font-bold font-['Space_Grotesk'] text-[var(--color-emerald-text)]">
                    {formatCurrency(simResult.expectedGrossRevenue)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-emerald-text)] uppercase font-semibold block">Simulated Cost</span>
                  <strong className="text-sm font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                    {formatCurrency(simResult.totalEstimatedCost)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-emerald-text)] uppercase font-semibold block">Simulated Net Profit</span>
                  <strong className="text-base font-black font-['Space_Grotesk'] text-[var(--color-emerald-text)]">
                    {formatCurrency(simResult.expectedNetProfit)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-emerald-text)] uppercase font-semibold block">Break-Even Price</span>
                  <strong className="text-sm font-bold font-['Space_Grotesk'] text-[var(--color-sky-text)]">
                    ₹{simResult.breakEvenPricePerQuintal}/q
                  </strong>
                </div>
              </div>
            </section>

            {/* 5. 7-Scenario Stress Testing Matrix */}
            <section className="agri-card p-6 space-y-4">
              <div className="border-b border-[var(--border-subtle)] pb-2">
                <span className="agri-badge agri-badge-sky mb-1">Monte-Carlo Climate Sim</span>
                <h3 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  🛡️ 7-Scenario Stress Testing & Climate Resilience Matrix
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Simulated multi-scenario impact on your {totalLandAcres.toFixed(2)}-acre farm portfolio.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {portfolio.scenarioSimulations.map((scenario) => (
                  <div
                    key={scenario.scenarioId}
                    className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-2"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <strong className="font-bold text-xs font-['Space_Grotesk'] text-[var(--text-primary)]">
                        {scenario.scenarioName}
                      </strong>
                      <span
                        className={`agri-badge ${
                          scenario.resilienceRating === "High"
                            ? "agri-badge-emerald"
                            : scenario.resilienceRating === "Moderate"
                            ? "agri-badge-amber"
                            : "agri-badge-rose"
                        }`}
                      >
                        {scenario.resilienceRating}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {scenario.description}
                    </p>
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)]">Simulated Profit:</span>
                      <span className={`font-bold font-['Space_Grotesk'] ${scenario.simulatedProfitInr >= 0 ? "text-[var(--color-emerald-text)]" : "text-rose-500"}`}>
                        {formatCurrency(scenario.simulatedProfitInr)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
      </div>
    </AppShell>
  );
}
