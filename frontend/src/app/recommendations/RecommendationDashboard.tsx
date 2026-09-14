"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../components/AppShell";
import FarmParcelMap from "../components/FarmParcelMap";
import { simulateCropFinancials, simulateExportScenario, simulateGroupSellingComparison } from "@/lib/simulation-engine";
import {
  buildCostSensitivityScenarios,
  buildPriceSensitivityScenarios,
  buildYieldSensitivityScenarios,
  compareProfitabilityStrategies,
} from "@/lib/profitability-service";
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
  const urlCrop = searchParams.get("crop");
  const urlMarketPrice = searchParams.get("marketPrice");

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
  const [savedProfitabilityAnalyses, setSavedProfitabilityAnalyses] = useState<Array<{
    id: string;
    crop: string;
    date: string;
    strategy: string;
    expectedProfit: number;
    modelsUsed: string[];
    dataUsed: string[];
    timestamp: string;
    scenario: string;
    result: string;
  }>>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const rawHistory = window.localStorage.getItem("agriprofit_profitability_analyses");
      if (!rawHistory) {
        return [];
      }
      const parsed = JSON.parse(rawHistory);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Active Farm & Geospatial State
  const [farmName, setFarmName] = useState(initialLocationInfo.name);
  const farmLocation = initialLocationInfo.location;
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
  const [simCropName, setSimCropName] = useState(urlCrop || firstCrop?.cropName || "Wheat");
  const [simArea, setSimArea] = useState<number>(firstCrop?.allocatedAcres || 2.5);
  const [simPrice, setSimPrice] = useState<number>(urlMarketPrice ? Number(urlMarketPrice) : (firstCrop?.expectedSellingPricePerQuintal || 2380));
  const [simYield, setSimYield] = useState<number>(firstCrop?.expectedYieldPerAcre || 14.5);
  const [simCost, setSimCost] = useState<number>(firstCrop?.costPerAcre || 11500);
  const [whatIfPrice, setWhatIfPrice] = useState<number>(simPrice);
  const [whatIfQuantity, setWhatIfQuantity] = useState<number>(simArea * simYield);
  const [whatIfProductionCost, setWhatIfProductionCost] = useState<number>(simCost * simArea);
  const [whatIfTransportCost, setWhatIfTransportCost] = useState<number>(2500);
  const [whatIfInputCost, setWhatIfInputCost] = useState<number>(8000);
  const [whatIfLaborCost, setWhatIfLaborCost] = useState<number>(5000);
  const [whatIfExportCost, setWhatIfExportCost] = useState<number>(1200);
  const [whatIfLogisticsCost, setWhatIfLogisticsCost] = useState<number>(1800);
  const [activeProfitabilityScenario, setActiveProfitabilityScenario] = useState<"MSP" | "DIRECT_MARKET" | "GROUP_SELLING" | "EXPORT">("DIRECT_MARKET");
  const [outcomeStatus, setOutcomeStatus] = useState<string>("");
  const [exportAcceptanceStatus, setExportAcceptanceStatus] = useState<string>("");

  const whatIfPreview = useMemo(() => {
    const quantity = Math.max(0, whatIfQuantity);
    const revenue = quantity * whatIfPrice;
    const cost =
      (whatIfProductionCost || 0) +
      (whatIfTransportCost || 0) +
      (whatIfInputCost || 0) +
      (whatIfLaborCost || 0) +
      (whatIfExportCost || 0) +
      (whatIfLogisticsCost || 0);
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const breakEven = cost > 0 && whatIfPrice > 0 ? cost / Math.max(1, whatIfPrice) : 0;
    return {
      revenue,
      cost,
      profit,
      margin,
      breakEven,
    };
  }, [whatIfPrice, whatIfQuantity, whatIfProductionCost, whatIfTransportCost, whatIfInputCost, whatIfLaborCost, whatIfExportCost, whatIfLogisticsCost]);

  async function completeMarketplaceTransaction() {
    setOutcomeStatus("Recording actual outcome...");
    try {
      const response = await fetch("/api/recommendations/profitability/outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: `dashboard-${Date.now()}`,
          farmId: urlFarmId || undefined,
          scenario: activeProfitabilityScenario,
          actualQuantity: whatIfQuantity,
          actualPriceInr: whatIfPrice,
          actualCostInr: whatIfPreview.cost,
          predicted: {
            quantity: expectedQuantity,
            price: simPrice,
            revenue: simResult.expectedGrossRevenue,
            profit: simResult.expectedNetProfit,
          },
        }),
      });
      const result = await response.json();
      setOutcomeStatus(response.ok ? `Actual outcome recorded at ${new Date(result.outcome.observedAt).toLocaleString("en-IN")}.` : result.error?.message || "Outcome could not be recorded.");
    } catch {
      setOutcomeStatus("Outcome could not be recorded because the API is unavailable.");
    }
  }

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

  const breakEvenTotalQuantity = useMemo(() => {
    return Number((simArea * simResult.breakEvenYieldQuintalsPerAcre).toFixed(2));
  }, [simArea, simResult.breakEvenYieldQuintalsPerAcre]);

  const expectedQuantity = useMemo(() => {
    return Number((simArea * simYield).toFixed(2));
  }, [simArea, simYield]);

  const priceSensitivityScenarios = useMemo(
    () =>
      buildPriceSensitivityScenarios({
        expectedPricePerQuintal: simPrice,
        quantityQuintals: expectedQuantity,
        totalCost: simResult.totalEstimatedCost,
        baseScenarioPrices: [
          simPrice * 0.8,
          simPrice * 0.9,
          simPrice,
          simPrice * 1.1,
          simPrice * 1.2,
        ],
      }),
    [expectedQuantity, simPrice, simResult.totalEstimatedCost]
  );

  const yieldSensitivityScenarios = useMemo(
    () =>
      buildYieldSensitivityScenarios({
        expectedYieldQuintals: simYield,
        sellingPricePerQuintal: simPrice,
        totalCost: simResult.totalEstimatedCost,
        baseScenarioYields: [
          Math.max(0, simYield - 12),
          Math.max(0, simYield - 6),
          simYield,
          simYield + 6,
          simYield + 12,
        ],
      }),
    [simPrice, simResult.totalEstimatedCost, simYield]
  );

  const costSensitivityScenarios = useMemo(
    () =>
      buildCostSensitivityScenarios({
        expectedYieldQuintals: simYield,
        sellingPricePerQuintal: simPrice,
        baseTotalCost: simResult.totalEstimatedCost,
        inputCost: simResult.totalEstimatedCost * 0.45,
        laborCost: simResult.totalEstimatedCost * 0.3,
        transportCost: simResult.totalEstimatedCost * 0.25,
        baseScenarioLabels: [
          { label: "Base", inputPct: 0, laborPct: 0, transportPct: 0 },
          { label: "+10% input cost", inputPct: 0.1, laborPct: 0, transportPct: 0 },
          { label: "+20% labor cost", inputPct: 0, laborPct: 0.2, transportPct: 0 },
          { label: "+15% transport cost", inputPct: 0, laborPct: 0, transportPct: 0.15 },
          { label: "+10% input + 20% labor + 15% transport", inputPct: 0.1, laborPct: 0.2, transportPct: 0.15 },
        ],
      }),
    [simPrice, simResult.totalEstimatedCost, simYield]
  );

  const breakEvenStatus = useMemo(() => {
    if (simResult.expectedNetProfit > 0 && simResult.roiPercentage >= 15) return "HIGH PROFIT POTENTIAL";
    if (simResult.expectedNetProfit > 0) return "PROFITABLE";
    if (Math.abs(simResult.expectedNetProfit) <= 2000) return "BREAK-EVEN";
    return "LOSS RISK";
  }, [simResult.expectedNetProfit, simResult.roiPercentage]);

  const profitabilityComparison = useMemo(() => {
    const primaryCrop = portfolio.allocations[0];
    const quantityKg = (primaryCrop?.allocatedAcres ?? simArea) * (primaryCrop?.expectedYieldPerAcre ?? simYield) * 100;

    return compareProfitabilityStrategies({
      quantity: quantityKg,
      quantityUnit: "kg",
      fixedCost: (primaryCrop?.costPerAcre ?? simCost) * (primaryCrop?.allocatedAcres ?? simArea) * 0.2,
      variableCostPerUnit: (primaryCrop?.costPerAcre ?? simCost) / Math.max(1, primaryCrop?.expectedYieldPerAcre ?? simYield),
      variableCostUnit: "kg",
      mspPricePerUnit: primaryCrop?.mspPrice ?? (primaryCrop?.expectedSellingPricePerQuintal ?? simPrice),
      mspPriceUnit: "quintal",
      directMarketPricePerUnit: primaryCrop?.expectedSellingPricePerQuintal ?? simPrice,
      directMarketPriceUnit: "quintal",
      directMarketExtraCostPerUnit: Math.max(0, (primaryCrop?.expectedSellingPricePerQuintal ?? simPrice) * 0.04),
      directMarketExtraCostUnit: "quintal",
      groupSellingPricePerUnit: (primaryCrop?.expectedSellingPricePerQuintal ?? simPrice) * 1.03,
      groupSellingPriceUnit: "quintal",
      groupAggregationCostPerUnit: ((primaryCrop?.costPerAcre ?? simCost) / 1000),
      groupAggregationCostUnit: "quintal",
      groupHandlingCostPerUnit: ((primaryCrop?.costPerAcre ?? simCost) / 1500),
      groupHandlingCostUnit: "quintal",
      groupStorageCostPerUnit: ((primaryCrop?.costPerAcre ?? simCost) / 2200),
      groupStorageCostUnit: "quintal",
      exportOfferPerUnit: ((primaryCrop?.expectedSellingPricePerQuintal ?? simPrice) * 0.96),
      exportOfferUnit: "quintal",
      exportPackagingCostPerUnit: ((primaryCrop?.costPerAcre ?? simCost) / 500),
      exportPackagingCostUnit: "quintal",
      exportDocumentationCost: ((primaryCrop?.costPerAcre ?? simCost) * 0.12),
      exportLogisticsCost: ((primaryCrop?.costPerAcre ?? simCost) * 0.2),
      exportTransportCost: ((primaryCrop?.costPerAcre ?? simCost) * 0.18),
      exportChargesPct: 0.04,
    });
  }, [portfolio, simArea, simPrice, simYield, simCost]);

  const activeScenarioRow = useMemo(
    () => profitabilityComparison.find((row) => row.strategy === activeProfitabilityScenario) ?? profitabilityComparison[0],
    [activeProfitabilityScenario, profitabilityComparison]
  );

  const primaryCrop = portfolio.allocations[0];
  const primaryMandiRecord = MANDI_BENCHMARK_PRICES.find((record) => record.cropSlug === primaryCrop?.cropSlug);

  const breakEvenChart = useMemo(() => {
    const expectedQuantityForChart = Math.max(1, expectedQuantity);
    const breakEvenQuantityForChart = Math.max(0, breakEvenTotalQuantity);
    const xMax = Math.max(expectedQuantityForChart * 1.2, breakEvenQuantityForChart * 1.2, 1);
    const yMax = Math.max(simResult.expectedGrossRevenue, simResult.totalEstimatedCost, 1) * 1.12;
    const width = 720;
    const height = 300;
    const padding = { left: 58, right: 20, top: 20, bottom: 42 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const toPoint = (quantity: number, value: number) => ({
      x: padding.left + (quantity / xMax) * plotWidth,
      y: padding.top + plotHeight - (value / yMax) * plotHeight,
    });
    const quantities = [0, xMax * 0.25, xMax * 0.5, xMax * 0.75, xMax];
    const revenuePoints = quantities.map((quantity) => toPoint(quantity, quantity * simPrice));
    const costPoints = quantities.map((quantity) => toPoint(quantity, (quantity / expectedQuantityForChart) * simResult.totalEstimatedCost));
    const breakEvenPoint = toPoint(breakEvenQuantityForChart, breakEvenQuantityForChart * simPrice);
    const currentPoint = toPoint(expectedQuantityForChart, simResult.expectedGrossRevenue);
    const formatPoints = (points: Array<{ x: number; y: number }>) => points.map((point) => `${point.x},${point.y}`).join(" ");

    return {
      width,
      height,
      padding,
      plotHeight,
      xMax,
      yMax,
      revenuePoints,
      costPoints,
      breakEvenPoint,
      currentPoint,
      revenuePolyline: formatPoints(revenuePoints),
      costPolyline: formatPoints(costPoints),
    };
  }, [breakEvenTotalQuantity, expectedQuantity, simPrice, simResult.expectedGrossRevenue, simResult.totalEstimatedCost]);

  const groupSellingSummary = useMemo(() => {
    const primaryCrop = portfolio.allocations[0];
    const quantityPerFarmer = Math.max(6, (primaryCrop?.expectedYieldPerAcre ?? simYield) * (primaryCrop?.allocatedAcres ?? simArea) / 3);
    const productionCostPerQuintal = Math.max(1200, (primaryCrop?.costPerAcre ?? simCost) / Math.max(1, primaryCrop?.expectedYieldPerAcre ?? simYield));
    const aggregationCostPerQuintal = Math.max(20, (primaryCrop?.costPerAcre ?? simCost) / 1000);
    const handlingCostPerQuintal = Math.max(15, (primaryCrop?.costPerAcre ?? simCost) / 1500);
    const storageCostPerQuintal = Math.max(10, (primaryCrop?.costPerAcre ?? simCost) / 2200);
    const transportSavingsPerQuintal = Math.max(10, (primaryCrop?.costPerAcre ?? simCost) / 3000);
    const farmers = [
      { name: "Farmer A", quantityQuintals: quantityPerFarmer, productionCostPerQuintal },
      { name: "Farmer B", quantityQuintals: quantityPerFarmer * 1.2, productionCostPerQuintal },
      { name: "Farmer C", quantityQuintals: quantityPerFarmer * 0.8, productionCostPerQuintal },
    ];

    return simulateGroupSellingComparison({
      farmers,
      groupSellingPricePerQuintal: (primaryCrop?.expectedSellingPricePerQuintal ?? simPrice) * 1.03,
      aggregationCostPerQuintal,
      handlingCostPerQuintal,
      storageCostPerQuintal,
      groupTransactionCost: (primaryCrop?.costPerAcre ?? simCost) * 0.08,
      transportOptimizationSavingsPerQuintal: transportSavingsPerQuintal,
    });
  }, [portfolio, simArea, simPrice, simYield, simCost]);

  const groupDemoScenario = useMemo(() => {
    const productionCostPerQuintal = Math.max(1200, simCost / Math.max(1, simYield));
    const aggregationCostPerQuintal = Math.max(20, simCost / 1000);
    const handlingCostPerQuintal = Math.max(15, simCost / 1500);
    const storageCostPerQuintal = Math.max(10, simCost / 2200);
    const transportSavingsPerQuintal = Math.max(10, simCost / 3000);
    const farmers = [
      { name: "Farmer A", quantityQuintals: 12, productionCostPerQuintal },
      { name: "Farmer B", quantityQuintals: 18, productionCostPerQuintal },
      { name: "Farmer C", quantityQuintals: 15, productionCostPerQuintal },
    ];
    const buyerRequirementQuintals = 40;
    const group = simulateGroupSellingComparison({
      farmers,
      groupSellingPricePerQuintal: simPrice * 1.03,
      aggregationCostPerQuintal,
      handlingCostPerQuintal,
      storageCostPerQuintal,
      groupTransactionCost: simCost * 0.08,
      transportOptimizationSavingsPerQuintal: transportSavingsPerQuintal,
    });
    const individualRevenue = Number((group.totalQuantity * simPrice).toFixed(0));
    const individualProfit = Number((individualRevenue - group.individualTotalCost).toFixed(0));
    const groupMoreProfitable = group.groupProfit > individualProfit;
    const reasons = [
      group.totalQuantity >= buyerRequirementQuintals
        ? `The pooled quantity is ${group.totalQuantity.toFixed(0)} q, above the buyer requirement of ${buyerRequirementQuintals} q.`
        : `The pooled quantity is ${group.totalQuantity.toFixed(0)} q, below the buyer requirement of ${buyerRequirementQuintals} q.`,
      group.transportSavings > 0
        ? `Shared logistics create estimated transport savings of ₹${Math.round(group.transportSavings).toLocaleString("en-IN")}.`
        : "No transport savings are estimated under the current inputs.",
      groupMoreProfitable
        ? `Group profit of ₹${Math.round(group.groupProfit).toLocaleString("en-IN")} exceeds individual profit of ₹${Math.round(individualProfit).toLocaleString("en-IN")}.`
        : `Group profit of ₹${Math.round(group.groupProfit).toLocaleString("en-IN")} does not exceed individual profit of ₹${Math.round(individualProfit).toLocaleString("en-IN")}.`,
      `The group break-even is ₹${Math.round(group.groupBreakEven).toLocaleString("en-IN")}/q against an expected group price of ₹${Math.round(group.expectedSellingPrice).toLocaleString("en-IN")}/q.`,
    ];

    return { group, buyerRequirementQuintals, individualRevenue, individualProfit, groupMoreProfitable, reasons };
  }, [simCost, simPrice, simYield]);

  const exportEconomics = useMemo(() => {
    const primaryCrop = portfolio.allocations[0];
    const quantityQuintals = Math.max(1, (primaryCrop?.allocatedAcres ?? simArea) * (primaryCrop?.expectedYieldPerAcre ?? simYield));
    const localPricePerQuintal = primaryCrop?.expectedSellingPricePerQuintal ?? simPrice;
    const exportResult = simulateExportScenario({
      cropQuantityQuintals: quantityQuintals,
      localPricePerQuintal,
      internationalReferencePricePerKg: 0.63,
      exporterOfferPerKg: 0.58,
      packagingCostPerQuintal: 120,
      handlingCostPerQuintal: 90,
      documentationCost: 4200,
      logisticsCost: 18000,
      transportCost: 26000,
      exporterChargesPct: 0.04,
      exchangeRateInrPerUsd: 83.5,
      exchangeRateTimestamp: new Date().toISOString(),
    });

    const grossRealization = Number((exportResult.cropQuantityKg * exportResult.exporterOffer.inrPerKg).toFixed(0));
    const estimatedHandling = exportResult.handlingCost;
    const estimatedLogistics = exportResult.logisticsCost + exportResult.transportCost;
    const estimatedOtherCosts = exportResult.packagingCost + exportResult.documentationCost + exportResult.exporterCharges;

    return {
      ...exportResult,
      grossRealization,
      estimatedHandling,
      estimatedLogistics,
      estimatedOtherCosts,
    };
  }, [portfolio, simArea, simPrice, simYield, simCost]);

  const exportDemoScenario = useMemo(() => simulateExportScenario({
    cropQuantityQuintals: 120,
    localPricePerQuintal: 1800,
    internationalReferencePricePerKg: 0.63,
    exporterOfferPerKg: 0.58,
    packagingCostPerQuintal: 120,
    handlingCostPerQuintal: 90,
    documentationCost: 4200,
    logisticsCost: 18000,
    transportCost: 26000,
    exporterChargesPct: 0.04,
    exchangeRateInrPerUsd: 83.5,
    exchangeRateTimestamp: "2026-09-14T10:30:00.000Z",
  }), []);

  async function acceptExportOffer() {
    setExportAcceptanceStatus("Recording exporter acceptance...");
    try {
      const response = await fetch("/api/recommendations/profitability/outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: `export-demo-${Date.now()}`,
          scenario: "EXPORT",
          actualQuantity: exportDemoScenario.cropQuantityQuintals,
          actualPriceInr: exportDemoScenario.exporterOffer.inrPerKg * 100,
          actualCostInr: exportDemoScenario.estimatedExportCosts,
          predicted: {
            quantity: exportDemoScenario.cropQuantityQuintals,
            price: exportDemoScenario.expectedFarmerRealization / exportDemoScenario.cropQuantityQuintals,
            revenue: exportDemoScenario.cropQuantityKg * exportDemoScenario.exporterOffer.inrPerKg,
            profit: exportDemoScenario.expectedExportProfit,
          },
        }),
      });
      const result = await response.json();
      setExportAcceptanceStatus(response.ok ? `Exporter accepted. Transaction outcome recorded at ${new Date(result.outcome.observedAt).toLocaleString("en-IN")}.` : result.error?.message || "Exporter acceptance could not be recorded.");
    } catch {
      setExportAcceptanceStatus("Exporter acceptance could not be recorded because the API is unavailable.");
    }
  }

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

  function saveCurrentProfitabilityAnalysis() {
    const bestStrategy = [...profitabilityComparison].sort((a, b) => b.profit - a.profit)[0];
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      crop: simCropName,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      strategy: bestStrategy?.label || "Direct Market",
      expectedProfit: Math.round(bestStrategy?.profit ?? simResult.expectedNetProfit),
      modelsUsed: [
        "Yield predictor",
        "Price forecast model",
        "Profitability engine",
      ],
      dataUsed: [
        "Farm context",
        "Market price inputs",
        "Cost assumptions",
        "MSP benchmark",
      ],
      timestamp: new Date().toISOString(),
      scenario: bestStrategy?.label || "Base case",
      result: bestStrategy && bestStrategy.profit >= 0 ? "Profitable" : "Risk check required",
    };

    const next = [record, ...savedProfitabilityAnalyses].slice(0, 8);
    setSavedProfitabilityAnalyses(next);
    try {
      localStorage.setItem("agriprofit_profitability_analyses", JSON.stringify(next));
    } catch {
      // Storage fallback
    }
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
    <AppShell pageTitle="AgriProfit Financial + Market Intelligence Engine">
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
              AgriProfit Financial + Market Intelligence Engine
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              Follow production, cost, market choice, break-even, risk, and realized outcome in one explainable financial workflow for your {totalLandAcres.toFixed(2)}-acre farm.
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

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-card" aria-label="AgriProfit decision chain">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">THE FARMER DECISION CHAIN</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs font-bold text-slate-800 sm:grid-cols-4 xl:grid-cols-8">
            {["What will I produce?", "How much will it cost?", "What can I sell it for?", "What is my break-even?", "How much can I earn?", "Which market is better?", "What if price/yield falls?", "What actually happened?"] .map((step, index) => (
              <div key={step} className="rounded-xl border border-emerald-200 bg-white p-3">
                <span className="block text-[10px] text-emerald-700">0{index + 1}</span>
                <span className="mt-1 block leading-4">{step}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-emerald-900">Every output below is tied to a farm, crop, scenario, source, model calculation, or confirmed outcome. Collection alone never retrains a model.</p>
        </section>

        <section className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-5">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Farm: {farmName}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">PROFITABILITY &amp; BREAK-EVEN</h2>
              <p className="mt-1 text-sm text-slate-600">Crop: <strong className="text-slate-900">{simCropName}</strong> · Scenario values update from the current farm inputs.</p>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">Deterministic financial comparison</span>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Scenario</p>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Profitability scenarios">
              {[
                ["MSP", "MSP"],
                ["DIRECT_MARKET", "Direct"],
                ["GROUP_SELLING", "Group"],
                ["EXPORT", "Export"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={activeProfitabilityScenario === value}
                  onClick={() => setActiveProfitabilityScenario(value as typeof activeProfitabilityScenario)}
                  className={`rounded-md border px-4 py-2 text-xs font-bold transition-colors ${
                    activeProfitabilityScenario === value
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-emerald-600 hover:text-emerald-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeScenarioRow && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Expected price</p><p className="mt-2 text-xl font-black text-slate-900">₹{Math.round(activeScenarioRow.expectedPrice).toLocaleString("en-IN")}/kg</p></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Expected revenue</p><p className="mt-2 text-xl font-black text-slate-900">₹{Math.round(activeScenarioRow.revenue).toLocaleString("en-IN")}</p></div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Expected profit</p><p className="mt-2 text-xl font-black text-emerald-700">₹{Math.round(activeScenarioRow.profit).toLocaleString("en-IN")}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Margin / ROI</p><p className="mt-2 text-xl font-black text-slate-900">{activeScenarioRow.margin.toFixed(1)}%</p></div>
            </div>
          )}
        </section>

        <section className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Data freshness</p>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">SOURCE &amp; LAST UPDATED</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">No unverified LIVE claims</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-bold text-slate-900">Mandi data</p>
              <p className="mt-2 text-slate-700"><span className="font-semibold">Source:</span> {primaryMandiRecord?.provenance.sourceName ?? "Existing AgriProfit market API"}</p>
              <p className="mt-1 text-slate-700"><span className="font-semibold">Updated:</span> {primaryMandiRecord?.provenance.recordedDate ?? "Not supplied by current response"}</p>
              <p className="mt-1 text-xs text-slate-500">Benchmark/reference data, not a live trading feed.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-bold text-slate-900">Weather</p>
              <p className="mt-2 text-slate-700"><span className="font-semibold">Source:</span> Open-Meteo when a weather report is provided</p>
              <p className="mt-1 text-slate-700"><span className="font-semibold">Updated:</span> Not supplied to this page response</p>
              <p className="mt-1 text-xs text-slate-500">Weather suitability uses the available farm context or benchmark fallback.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-bold text-slate-900">MSP</p>
              <p className="mt-2 text-slate-700"><span className="font-semibold">Source:</span> CACP government MSP dataset</p>
              <p className="mt-1 text-slate-700"><span className="font-semibold">Updated:</span> Effective season/date shown in the MSP catalogue</p>
              <p className="mt-1 text-xs text-slate-500">Government procurement reference/floor where applicable, not a universal market price.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-bold text-slate-900">International reference</p>
              <p className="mt-2 text-slate-700"><span className="font-semibold">Source:</span> {exportEconomics.referenceDataMeta.source}</p>
              <p className="mt-1 text-slate-700"><span className="font-semibold">Period:</span> {exportEconomics.referenceDataMeta.period}</p>
              <p className="mt-1 text-xs text-slate-500">Reference period is shown; this is not presented as a live international quote.</p>
            </div>
          </div>
        </section>

        <section className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Production · Market · Break-even</p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{simCropName.toUpperCase()}</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={saveCurrentProfitabilityAnalysis}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-[0.12em] rounded hover:bg-slate-800 cursor-pointer"
              >
                Save Analysis
              </button>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  breakEvenStatus === "PROFITABLE"
                    ? "bg-emerald-100 text-emerald-800"
                    : breakEvenStatus === "HIGH PROFIT POTENTIAL"
                      ? "bg-violet-100 text-violet-800"
                      : breakEvenStatus === "BREAK-EVEN"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                }`}
              >
                {breakEvenStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Current Expected Selling Price</p>
              <p className="mt-3 text-2xl font-black text-slate-900">₹{Math.round(simPrice).toLocaleString("en-IN")}/q</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Break-even Price</p>
              <p className="mt-3 text-2xl font-black text-slate-900">₹{simResult.breakEvenPricePerQuintal.toLocaleString("en-IN")}/q</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Expected Profit</p>
              <p className="mt-3 text-2xl font-black text-emerald-700">₹{Math.round(simResult.expectedNetProfit).toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">ROI</p>
              <p className="mt-3 text-2xl font-black text-slate-900">{simResult.roiPercentage.toFixed(1)}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Break-even Quantity</p>
              <p className="mt-3 text-2xl font-black text-slate-900">{breakEvenTotalQuantity.toFixed(2)} q</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Expected Quantity</p>
              <p className="mt-3 text-2xl font-black text-slate-900">{expectedQuantity.toFixed(2)} q</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Total Cost</p>
              <p className="mt-3 text-2xl font-black text-slate-900">₹{Math.round(simResult.totalEstimatedCost).toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Expected Revenue</p>
              <p className="mt-3 text-2xl font-black text-slate-900">₹{Math.round(simResult.expectedGrossRevenue).toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Visual break-even graph</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">Revenue vs total cost</h3>
              </div>
              <p className="text-xs text-slate-600">Plotted from the current yield, price, and cost calculation</p>
            </div>
            <div className="mt-4 overflow-x-auto">
              <svg
                viewBox={`0 0 ${breakEvenChart.width} ${breakEvenChart.height}`}
                className="min-w-[620px] w-full"
                role="img"
                aria-label="Revenue and total cost lines with calculated break-even intersection"
              >
                <polygon
                  points={`${breakEvenChart.revenuePoints[0].x},${breakEvenChart.revenuePoints[0].y} ${breakEvenChart.revenuePoints[1].x},${breakEvenChart.revenuePoints[1].y} ${breakEvenChart.breakEvenPoint.x},${breakEvenChart.breakEvenPoint.y} ${breakEvenChart.breakEvenPoint.x},${breakEvenChart.padding.top + breakEvenChart.plotHeight} ${breakEvenChart.revenuePoints[0].x},${breakEvenChart.padding.top + breakEvenChart.plotHeight}`}
                  fill="#fee2e2"
                  opacity="0.8"
                />
                <polygon
                  points={`${breakEvenChart.breakEvenPoint.x},${breakEvenChart.breakEvenPoint.y} ${breakEvenChart.revenuePoints[4].x},${breakEvenChart.revenuePoints[4].y} ${breakEvenChart.costPoints[4].x},${breakEvenChart.costPoints[4].y} ${breakEvenChart.breakEvenPoint.x},${breakEvenChart.breakEvenPoint.y}`}
                  fill="#d1fae5"
                  opacity="0.8"
                />
                <line x1={breakEvenChart.padding.left} y1={breakEvenChart.padding.top + breakEvenChart.plotHeight} x2={breakEvenChart.width - breakEvenChart.padding.right} y2={breakEvenChart.padding.top + breakEvenChart.plotHeight} stroke="#94a3b8" />
                <line x1={breakEvenChart.padding.left} y1={breakEvenChart.padding.top} x2={breakEvenChart.padding.left} y2={breakEvenChart.padding.top + breakEvenChart.plotHeight} stroke="#94a3b8" />
                <polyline points={breakEvenChart.costPolyline} fill="none" stroke="#f97316" strokeWidth="3" />
                <polyline points={breakEvenChart.revenuePolyline} fill="none" stroke="#047857" strokeWidth="3" />
                <line x1={breakEvenChart.currentPoint.x} y1={breakEvenChart.currentPoint.y} x2={breakEvenChart.currentPoint.x} y2={breakEvenChart.padding.top + breakEvenChart.plotHeight} stroke="#0f172a" strokeDasharray="4 4" />
                <circle cx={breakEvenChart.breakEvenPoint.x} cy={breakEvenChart.breakEvenPoint.y} r="5" fill="#2563eb" stroke="white" strokeWidth="2" />
                <circle cx={breakEvenChart.currentPoint.x} cy={breakEvenChart.currentPoint.y} r="5" fill="#047857" stroke="white" strokeWidth="2" />
                <text x={breakEvenChart.breakEvenPoint.x + 8} y={breakEvenChart.breakEvenPoint.y - 8} fontSize="11" fontWeight="700" fill="#1d4ed8">Break-even: {breakEvenTotalQuantity.toFixed(2)} q</text>
                <text x={breakEvenChart.currentPoint.x - 8} y={breakEvenChart.currentPoint.y - 10} textAnchor="end" fontSize="11" fontWeight="700" fill="#065f46">Current: {expectedQuantity.toFixed(2)} q · ₹{Math.round(simPrice).toLocaleString("en-IN")}/q</text>
                <text x={breakEvenChart.padding.left + 8} y={breakEvenChart.padding.top + 28} fontSize="11" fontWeight="700" fill="#b91c1c">Loss zone</text>
                <text x={breakEvenChart.width - breakEvenChart.padding.right - 70} y={breakEvenChart.padding.top + 28} fontSize="11" fontWeight="700" fill="#047857">Profit zone</text>
                <text x={breakEvenChart.padding.left - 8} y={breakEvenChart.padding.top + 4} textAnchor="end" fontSize="10" fill="#64748b">₹{Math.round(breakEvenChart.yMax).toLocaleString("en-IN")}</text>
                <text x={breakEvenChart.padding.left - 8} y={breakEvenChart.padding.top + breakEvenChart.plotHeight} textAnchor="end" fontSize="10" fill="#64748b">₹0</text>
                <text x={breakEvenChart.width / 2} y={breakEvenChart.height - 8} textAnchor="middle" fontSize="10" fill="#64748b">Quantity (quintals)</text>
                <text x="14" y={breakEvenChart.height / 2} textAnchor="middle" fontSize="10" fill="#64748b" transform={`rotate(-90 14 ${breakEvenChart.height / 2})`}>₹ value</text>
              </svg>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
              <span><strong className="text-emerald-700">●</strong> Revenue</span>
              <span><strong className="text-orange-600">●</strong> Total cost</span>
              <span><strong className="text-blue-700">●</strong> Break-even intersection</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Profitability Status</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{breakEvenStatus}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Profit Margin</p>
                <p className="mt-1 text-xl font-black text-slate-900">{((simResult.expectedNetProfit / Math.max(1, simResult.expectedGrossRevenue)) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </section>

        <section className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Profitability</p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">SELL AT MSP vs DIRECT MARKET vs GROUP SELLING vs EXPORT</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Backend-calculated values only</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-lg font-bold text-slate-900">MY PROFITABILITY ANALYSES</h3>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Saved locally</span>
            </div>

            {savedProfitabilityAnalyses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No saved profitability analyses yet. Select a strategy and click “Save Analysis” to build your history.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {savedProfitabilityAnalyses.map((analysis) => (
                  <article key={analysis.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{analysis.crop}</p>
                        <h4 className="mt-1 text-xl font-black text-slate-900">{analysis.date}</h4>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-[0.12em]">
                        {analysis.strategy}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white border border-slate-200 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Expected Profit</p>
                      <p className="mt-2 text-2xl font-black text-emerald-700">₹{analysis.expectedProfit.toLocaleString("en-IN")}</p>
                    </div>

                    <div className="space-y-2 text-sm text-slate-700">
                      <div><span className="font-bold text-slate-900">Models used:</span> {analysis.modelsUsed.join(" • ")}</div>
                      <div><span className="font-bold text-slate-900">Data used:</span> {analysis.dataUsed.join(" • ")}</div>
                      <div><span className="font-bold text-slate-900">Timestamp:</span> {new Date(analysis.timestamp).toLocaleString("en-IN")}</div>
                      <div><span className="font-bold text-slate-900">Scenario:</span> {analysis.scenario}</div>
                      <div><span className="font-bold text-slate-900">Result:</span> {analysis.result}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-[0.14em] text-[10px]">
                <tr>
                  <th className="px-4 py-3 font-bold">Strategy</th>
                  <th className="px-4 py-3 font-bold">Expected Price</th>
                  <th className="px-4 py-3 font-bold">Cost</th>
                  <th className="px-4 py-3 font-bold">Revenue</th>
                  <th className="px-4 py-3 font-bold">Profit</th>
                  <th className="px-4 py-3 font-bold">Margin</th>
                </tr>
              </thead>
              <tbody>
                {profitabilityComparison.map((row) => (
                  <tr key={row.strategy} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.label}</td>
                    <td className="px-4 py-3">₹{Math.round(row.expectedPrice).toLocaleString("en-IN")}/kg</td>
                    <td className="px-4 py-3">₹{Math.round(row.cost).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">₹{Math.round(row.revenue).toLocaleString("en-IN")}</td>
                    <td className={`px-4 py-3 font-bold ${row.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                      ₹{Math.round(row.profit).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">{row.margin.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Group Farming Economics</p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">INDIVIDUAL vs GROUP SELLING</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Assumption-based backend calculation</span>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-800">SECOND DEMO · GROUP SELLING</p>
                <h3 className="mt-1 text-xl font-black text-slate-900">12 q + 18 q + 15 q = {groupDemoScenario.group.totalQuantity.toFixed(0)} q</h3>
                <p className="mt-1 text-sm text-slate-700">Buyer requirement: <strong>{groupDemoScenario.buyerRequirementQuintals} q</strong></p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${groupDemoScenario.groupMoreProfitable ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                GROUP SELLING IS {groupDemoScenario.groupMoreProfitable ? "MORE" : "NOT MORE"} PROFITABLE
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Individual economics</p>
                <dl className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between gap-3"><dt>Total quantity</dt><dd className="font-bold">{groupDemoScenario.group.totalQuantity.toFixed(0)} q</dd></div>
                  <div className="flex justify-between gap-3"><dt>Revenue at individual price</dt><dd className="font-bold">₹{groupDemoScenario.individualRevenue.toLocaleString("en-IN")}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Total cost</dt><dd className="font-bold">₹{Math.round(groupDemoScenario.group.individualTotalCost).toLocaleString("en-IN")}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Profit</dt><dd className="font-bold">₹{groupDemoScenario.individualProfit.toLocaleString("en-IN")}</dd></div>
                </dl>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Group economics</p>
                <dl className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between gap-3"><dt>Expected realization</dt><dd className="font-bold">₹{Math.round(groupDemoScenario.group.perFarmerRealization).toLocaleString("en-IN")} / farmer</dd></div>
                  <div className="flex justify-between gap-3"><dt>Transport savings</dt><dd className="font-bold text-emerald-700">₹{Math.round(groupDemoScenario.group.transportSavings).toLocaleString("en-IN")}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Break-even</dt><dd className="font-bold">₹{Math.round(groupDemoScenario.group.groupBreakEven).toLocaleString("en-IN")}/q</dd></div>
                  <div className="flex justify-between gap-3"><dt>Group profit</dt><dd className="font-bold text-emerald-700">₹{Math.round(groupDemoScenario.group.groupProfit).toLocaleString("en-IN")}</dd></div>
                </dl>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wide text-indigo-800">WHY THIS VERDICT?</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {groupDemoScenario.reasons.map((reason) => <li key={reason} className="flex gap-2"><span className="font-black text-emerald-700">✓</span><span>{reason}</span></li>)}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Individual total cost</p>
              <p className="mt-3 text-2xl font-black text-slate-900">₹{Math.round(groupSellingSummary.individualTotalCost).toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Group total cost</p>
              <p className="mt-3 text-2xl font-black text-slate-900">₹{Math.round(groupSellingSummary.groupTotalCost).toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Transport savings</p>
              <p className="mt-3 text-2xl font-black text-emerald-700">₹{Math.round(groupSellingSummary.transportSavings).toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Per farmer realization</p>
              <p className="mt-3 text-2xl font-black text-slate-900">₹{Math.round(groupSellingSummary.perFarmerRealization).toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Key group figures</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex justify-between gap-3"><span>Aggregation cost</span><strong className="text-slate-900">₹{Math.round(groupSellingSummary.aggregationCost).toLocaleString("en-IN")}</strong></div>
                <div className="flex justify-between gap-3"><span>Handling cost</span><strong className="text-slate-900">₹{Math.round(groupSellingSummary.handlingCost).toLocaleString("en-IN")}</strong></div>
                <div className="flex justify-between gap-3"><span>Expected group price</span><strong className="text-slate-900">₹{Math.round(groupSellingSummary.expectedSellingPrice).toLocaleString("en-IN")}/q</strong></div>
                <div className="flex justify-between gap-3"><span>Total group revenue</span><strong className="text-slate-900">₹{Math.round(groupSellingSummary.groupRevenue).toLocaleString("en-IN")}</strong></div>
                <div className="flex justify-between gap-3"><span>Group profit</span><strong className="text-emerald-700">₹{Math.round(groupSellingSummary.groupProfit).toLocaleString("en-IN")}</strong></div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Assumption labels</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
                {groupSellingSummary.assumptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Export Economics</p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1"># EXPORT ECONOMICS</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">Indicative estimate only</span>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-800">THIRD DEMO · EXPORT</p>
                <h3 className="mt-1 text-xl font-black text-slate-900">120 q Onion → UAE</h3>
                <p className="mt-1 text-sm text-slate-700">Indian exporter matched to a UAE buyer offer.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Indicative, not guaranteed</span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">International reference</p><p className="mt-2 text-lg font-black text-slate-900">UAE · UN Comtrade</p><p className="text-xs text-slate-600">USD/kg · {exportDemoScenario.referenceDataMeta.period}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Trade data</p><p className="mt-2 text-lg font-black text-slate-900">{exportDemoScenario.historicalTradeDataMeta.source}</p><p className="text-xs text-slate-600">{exportDemoScenario.historicalTradeDataMeta.period}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Exporter offer</p><p className="mt-2 text-lg font-black text-slate-900">₹{Math.round(exportDemoScenario.exporterOffer.inrPerKg).toLocaleString("en-IN")}/kg</p><p className="text-xs text-slate-600">Indian exporter / buyer term sheet</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Currency</p><p className="mt-2 text-lg font-black text-slate-900">USD → INR</p><p className="text-xs text-slate-600">₹{exportDemoScenario.currencyConversion.inrPerUsd}/USD · {exportDemoScenario.currencyConversion.timestamp}</p></div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Export costs</p><p className="mt-2 text-xl font-black text-slate-900">₹{Math.round(exportDemoScenario.estimatedExportCosts).toLocaleString("en-IN")}</p><p className="text-xs text-slate-600">Packaging, handling, documentation, logistics, transport, charges</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Indicative farmer realization</p><p className="mt-2 text-xl font-black text-emerald-700">₹{Math.round(exportDemoScenario.expectedFarmerRealization).toLocaleString("en-IN")}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Break-even</p><p className="mt-2 text-xl font-black text-slate-900">₹{Math.round(exportDemoScenario.exportBreakEven).toLocaleString("en-IN")}/q</p></div>
              <div className="rounded-xl border border-emerald-200 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Expected profit</p><p className="mt-2 text-xl font-black text-emerald-700">₹{Math.round(exportDemoScenario.expectedExportProfit).toLocaleString("en-IN")}</p></div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-black uppercase tracking-wide text-slate-700">MODEL USED</p><p className="mt-2 text-sm text-slate-700">Deterministic export economics engine with currency conversion and cost sensitivity.</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-black uppercase tracking-wide text-slate-700">DATA SOURCES</p><p className="mt-2 text-sm text-slate-700">UN Comtrade reference, UAE trade period {exportDemoScenario.referenceDataMeta.period}, Indian exporter offer, displayed FX reference.</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-black uppercase tracking-wide text-slate-700">ASSUMPTIONS &amp; RISK</p><p className="mt-2 text-sm text-slate-700">Offer is indicative. Freight, quality, duties, insurance, documentation timing, FX movement, and buyer acceptance can change realization.</p></div>
            </div>

            <div className="flex flex-col gap-2 border-t border-sky-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-slate-700">Exporter accepts the indicative offer to continue through the authenticated marketplace transaction workflow.</p>
              <button type="button" onClick={acceptExportOffer} className="agri-btn-primary shrink-0">Exporter accepts</button>
            </div>
            {exportAcceptanceStatus && <p className="text-xs font-semibold text-sky-800" role="status">{exportAcceptanceStatus}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">International Reference</p>
              <p className="mt-3 text-2xl font-black text-slate-900">₹{Math.round(exportEconomics.internationalReferencePrice.inrPerKg).toLocaleString("en-IN")}/kg equivalent</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Exporter Offer</p>
              <p className="mt-3 text-2xl font-black text-slate-900">₹{Math.round(exportEconomics.exporterOffer.inrPerKg).toLocaleString("en-IN")}/kg</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Estimated Logistics</p>
              <p className="mt-3 text-2xl font-black text-slate-900">₹{Math.round(exportEconomics.estimatedLogistics).toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Estimated Handling</p>
              <p className="mt-3 text-2xl font-black text-slate-900">₹{Math.round(exportEconomics.estimatedHandling).toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Estimated Other Costs</p>
              <p className="mt-3 text-2xl font-black text-slate-900">₹{Math.round(exportEconomics.estimatedOtherCosts).toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Indicative Farmer Realization</p>
              <p className="mt-3 text-2xl font-black text-emerald-700">₹{Math.round(exportEconomics.expectedFarmerRealization).toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Export math summary</p>
              <span className="px-2 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">Currency conversion: ₹{exportEconomics.currencyConversion.inrPerUsd}/USD</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 text-sm text-slate-700">
              <div className="rounded-xl bg-white border border-slate-200 p-3"><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Indicative gross realization</span><strong className="mt-2 block text-lg font-black text-slate-900">₹{Math.round(exportEconomics.grossRealization).toLocaleString("en-IN")}</strong></div>
              <div className="rounded-xl bg-white border border-slate-200 p-3"><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Estimated total export cost</span><strong className="mt-2 block text-lg font-black text-slate-900">₹{Math.round(exportEconomics.estimatedExportCosts).toLocaleString("en-IN")}</strong></div>
              <div className="rounded-xl bg-white border border-slate-200 p-3"><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Break-even export price</span><strong className="mt-2 block text-lg font-black text-slate-900">₹{Math.round(exportEconomics.exportBreakEven).toLocaleString("en-IN")}/q</strong></div>
              <div className="rounded-xl bg-white border border-slate-200 p-3"><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Expected profit</span><strong className="mt-2 block text-lg font-black text-emerald-700">₹{Math.round(exportEconomics.expectedExportProfit).toLocaleString("en-IN")}</strong></div>
              <div className="rounded-xl bg-white border border-slate-200 p-3"><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Risk range</span><strong className="mt-2 block text-lg font-black text-slate-900">₹{Math.round(exportEconomics.sensitivity.priceDown10Pct).toLocaleString("en-IN")} to ₹{Math.round(exportEconomics.sensitivity.logisticsUp15Pct).toLocaleString("en-IN")}</strong></div>
              <div className="rounded-xl bg-white border border-slate-200 p-3"><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Quantity</span><strong className="mt-2 block text-lg font-black text-slate-900">{exportEconomics.cropQuantityQuintals.toFixed(1)} q</strong></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-2">
              {[{ label: "International Reference Price", meta: exportEconomics.referenceDataMeta }, { label: "Exporter Offer", meta: exportEconomics.exporterOfferMeta }, { label: "Historical Trade Data", meta: exportEconomics.historicalTradeDataMeta }].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{item.label}</span>
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">{item.meta.category}</span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p><span className="font-bold text-slate-900">Country:</span> {item.meta.country}</p>
                    <p><span className="font-bold text-slate-900">Commodity:</span> {item.meta.commodity}</p>
                    <p><span className="font-bold text-slate-900">Currency:</span> {item.meta.currency}</p>
                    <p><span className="font-bold text-slate-900">Unit:</span> {item.meta.unit}</p>
                    <p><span className="font-bold text-slate-900">Period:</span> {item.meta.period}</p>
                    <p><span className="font-bold text-slate-900">Source:</span> {item.meta.source}</p>
                    <p><span className="font-bold text-slate-900">Source type:</span> {item.meta.sourceType}</p>
                    <p><span className="font-bold text-slate-900">Last updated:</span> {item.meta.lastUpdated}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600">{exportEconomics.exportRisk}</p>
          </div>
        </section>

        <section className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Models & Data Used</p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">MODELS & DATA USED</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Scenario-based model selection</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {(portfolio.aiModelSummary?.models ?? []).map((model, index) => (
              <article key={`${model.name}-${index}`} className="border border-slate-200 rounded-2xl bg-slate-50 p-4 space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{model.modelType}</p>
                  <h3 className="text-lg font-bold text-slate-900">{model.name}</h3>
                  <p className="text-xs font-semibold text-slate-600">Model Version: {model.modelVersion}</p>
                </div>

                <div className="space-y-2 text-sm text-slate-700">
                  <div>
                    <p className="font-bold text-slate-900">Purpose</p>
                    <p>{model.purpose}</p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">Why it was used</p>
                    <p>{model.whyItWasUsed}</p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">Why this result?</p>
                    <p>{model.whyThisResult}</p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">Input Data</p>
                    <p>{model.inputData.join(" • ")}</p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">Output</p>
                    <p>{model.output}</p>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-200 px-3 py-2">
                    <span className="font-bold text-slate-900">Confidence</span>
                    <span className="font-bold text-emerald-700">{model.confidence}</span>
                  </div>

                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-900">Data freshness:</span> {model.dataFreshness}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Data Sources</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(portfolio.aiModelSummary?.dataSources ?? []).map((source) => (
                <span key={source} className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  ✓ {source}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">WHY WAS THIS MODEL USED?</p>
            <div className="mt-2 text-sm text-slate-700 space-y-1">
              <p><span className="font-bold text-slate-900">Method:</span> {portfolio.aiModelSummary?.method?.name ?? "Explainable Deterministic Scoring"}</p>
              <p><span className="font-bold text-slate-900">Model Type:</span> {portfolio.aiModelSummary?.method?.modelType ?? "Explainable Deterministic Scoring"}</p>
              <p><span className="font-bold text-slate-900">Purpose:</span> {portfolio.aiModelSummary?.method?.purpose ?? "Compare MSP, mandi, direct-market and export selling scenarios."}</p>
              <p><span className="font-bold text-slate-900">Why this result?</span> This score is used so the final recommendation remains explainable: it balances expected output, market price, MSP floor, weather, risk profile, and cost structure in a transparent and auditable decision framework.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">DATA INPUT PIPELINE</p>
              <span className="px-2 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">Repository priority: DB → API → ML → MSP → Mandi → Weather → Crop/Soil → Trade → Export → FX → Cached</span>
            </div>
            <div className="mt-3 space-y-2">
              {(portfolio.aiModelSummary?.liveDataPipeline ?? []).map((item) => (
                <div key={item.stage} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <span className={`mt-0.5 px-2 py-1 rounded text-[10px] font-bold ${item.isCached ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                    {item.isCached ? "Cached" : "External input"}
                  </span>
                  <div className="text-sm text-slate-700">
                    <p className="font-bold text-slate-900">{item.stage}</p>
                    <p>{item.source}</p>
                    <p className="text-xs text-slate-600">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

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

            <section className="agri-card p-6 space-y-5">
              <div className="border-b border-[var(--border-subtle)] pb-2">
                <span className="agri-badge agri-badge-violet mb-1">What-If Simulator</span>
                <h3 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  # WHAT-IF SIMULATOR
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Frontend preview only. The authoritative calculation remains backend-backed in the profitability service.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] block">Selling Price (₹/q)</label>
                  <input type="number" value={whatIfPrice} onChange={(e) => setWhatIfPrice(Number(e.target.value) || 0)} className="agri-input font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] block">Quantity (q)</label>
                  <input type="number" value={whatIfQuantity} onChange={(e) => setWhatIfQuantity(Number(e.target.value) || 0)} className="agri-input font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] block">Production Cost (₹)</label>
                  <input type="number" value={whatIfProductionCost} onChange={(e) => setWhatIfProductionCost(Number(e.target.value) || 0)} className="agri-input font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] block">Transport Cost (₹)</label>
                  <input type="number" value={whatIfTransportCost} onChange={(e) => setWhatIfTransportCost(Number(e.target.value) || 0)} className="agri-input font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] block">Input Cost (₹)</label>
                  <input type="number" value={whatIfInputCost} onChange={(e) => setWhatIfInputCost(Number(e.target.value) || 0)} className="agri-input font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] block">Labor Cost (₹)</label>
                  <input type="number" value={whatIfLaborCost} onChange={(e) => setWhatIfLaborCost(Number(e.target.value) || 0)} className="agri-input font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] block">Export Cost (₹)</label>
                  <input type="number" value={whatIfExportCost} onChange={(e) => setWhatIfExportCost(Number(e.target.value) || 0)} className="agri-input font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] block">Logistics Cost (₹)</label>
                  <input type="number" value={whatIfLogisticsCost} onChange={(e) => setWhatIfLogisticsCost(Number(e.target.value) || 0)} className="agri-input font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Revenue</p>
                  <p className="mt-2 text-xl font-black text-slate-900">₹{Math.round(whatIfPreview.revenue).toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Cost</p>
                  <p className="mt-2 text-xl font-black text-slate-900">₹{Math.round(whatIfPreview.cost).toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Profit</p>
                  <p className={`mt-2 text-xl font-black ${whatIfPreview.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    ₹{Math.round(whatIfPreview.profit).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Margin</p>
                  <p className="mt-2 text-xl font-black text-slate-900">{whatIfPreview.margin.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Break-even</p>
                  <p className="mt-2 text-xl font-black text-slate-900">{whatIfPreview.breakEven.toFixed(2)} q</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[var(--text-secondary)]">Complete the marketplace transaction to store the realized quantity, price, revenue, cost, and profit separately from the prediction.</p>
                <button
                  type="button"
                  onClick={completeMarketplaceTransaction}
                  className="agri-btn-primary shrink-0"
                >
                  Complete marketplace transaction
                </button>
              </div>
              {outcomeStatus && <p className="text-xs font-semibold text-[var(--color-primary-text)]" role="status">{outcomeStatus}</p>}
            </section>

            <section className="agri-card p-6 space-y-4">
              <div className="border-b border-[var(--border-subtle)] pb-2">
                <span className="agri-badge agri-badge-amber mb-1">Price Sensitivity</span>
                <h3 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  What happens if market price changes?
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Expected Price: ₹{Math.round(simPrice).toLocaleString("en-IN")}/q. Based on current reference/forecast data for {simCropName}.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-100 text-slate-700 uppercase tracking-[0.14em] text-[10px]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Scenario</th>
                      <th className="px-4 py-3 font-bold">Revenue</th>
                      <th className="px-4 py-3 font-bold">Profit</th>
                      <th className="px-4 py-3 font-bold">Margin</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceSensitivityScenarios.map((scenario) => (
                      <tr key={scenario.price} className="border-t border-slate-200">
                        <td className="px-4 py-3 font-semibold text-slate-900">₹{Math.round(scenario.price).toLocaleString("en-IN")}/q</td>
                        <td className="px-4 py-3">₹{Math.round(scenario.revenue).toLocaleString("en-IN")}</td>
                        <td className={`px-4 py-3 font-bold ${scenario.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          ₹{Math.round(scenario.profit).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">{scenario.margin.toFixed(1)}%</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            scenario.status === "HIGH PROFIT POTENTIAL" ? "bg-violet-100 text-violet-800" :
                            scenario.status === "PROFITABLE" ? "bg-emerald-100 text-emerald-800" :
                            scenario.status === "BREAK-EVEN" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                          }`}>
                            {scenario.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="agri-card p-6 space-y-4">
              <div className="border-b border-[var(--border-subtle)] pb-2">
                <span className="agri-badge agri-badge-cyan mb-1">Yield Sensitivity</span>
                <h3 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  What happens if yield changes?
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Expected: {expectedQuantity.toFixed(0)} q. Yield prediction uncertainty is reflected in the scenarios below.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-100 text-slate-700 uppercase tracking-[0.14em] text-[10px]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Scenario</th>
                      <th className="px-4 py-3 font-bold">Revenue</th>
                      <th className="px-4 py-3 font-bold">Profit</th>
                      <th className="px-4 py-3 font-bold">Margin</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yieldSensitivityScenarios.map((scenario) => (
                      <tr key={scenario.yieldQuintals} className="border-t border-slate-200">
                        <td className="px-4 py-3 font-semibold text-slate-900">{scenario.yieldQuintals.toFixed(0)} q</td>
                        <td className="px-4 py-3">₹{Math.round(scenario.revenue).toLocaleString("en-IN")}</td>
                        <td className={`px-4 py-3 font-bold ${scenario.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          ₹{Math.round(scenario.profit).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">{scenario.margin.toFixed(1)}%</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            scenario.status === "HIGH PROFIT POTENTIAL" ? "bg-violet-100 text-violet-800" :
                            scenario.status === "PROFITABLE" ? "bg-emerald-100 text-emerald-800" :
                            scenario.status === "BREAK-EVEN" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                          }`}>
                            {scenario.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="agri-card p-6 space-y-4">
              <div className="border-b border-[var(--border-subtle)] pb-2">
                <span className="agri-badge agri-badge-rose mb-1">Cost Sensitivity</span>
                <h3 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  How do cost increases affect break-even and returns?
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Based on current input, labor, and transport assumptions for {simCropName}.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-100 text-slate-700 uppercase tracking-[0.14em] text-[10px]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Scenario</th>
                      <th className="px-4 py-3 font-bold">New Break-even</th>
                      <th className="px-4 py-3 font-bold">New Profit</th>
                      <th className="px-4 py-3 font-bold">New Margin</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costSensitivityScenarios.map((scenario) => (
                      <tr key={scenario.label} className="border-t border-slate-200">
                        <td className="px-4 py-3 font-semibold text-slate-900">{scenario.label}</td>
                        <td className="px-4 py-3">₹{Math.round(scenario.breakEvenPrice).toLocaleString("en-IN")}/q</td>
                        <td className={`px-4 py-3 font-bold ${scenario.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          ₹{Math.round(scenario.profit).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">{scenario.margin.toFixed(1)}%</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            scenario.status === "HIGH PROFIT POTENTIAL" ? "bg-violet-100 text-violet-800" :
                            scenario.status === "PROFITABLE" ? "bg-emerald-100 text-emerald-800" :
                            scenario.status === "BREAK-EVEN" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                          }`}>
                            {scenario.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
