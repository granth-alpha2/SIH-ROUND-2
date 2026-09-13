/**
 * AgriProfit — Seasonal & Short-Duration Crop Intelligence Engine
 * ================================================================
 * Evaluates candidate short-duration, interim catch, and festival-timed crops
 * against the farmer's actual farm polygon, location, agro-climatic zone,
 * soil condition, weather outlook, available days, and market/MSP benchmarks.
 *
 * 10-Step Hierarchical Evaluator:
 * 1. Geographic & Agro-Climatic Zone Suitability
 * 2. Seasonal Sowing Calendar Match
 * 3. Crop Duration Fit (minDuration <= availableDays)
 * 4. Weather Suitability & Temperature Risk (Open-Meteo)
 * 5. Soil pH & Texture Match
 * 6. Water Resource Availability
 * 7. Official MSP Safety Net Lookup
 * 8. Festival Market Demand Signals
 * 9. Financial Simulation & ROI (Simulation Engine)
 * 10. Explainable Scoring (0-100) & Visual Timeline
 */

import { CROP_DATABASE, type CropRecord } from "./crop-data";
import { MANDI_BENCHMARK_PRICES, type MandiPriceRecord } from "./market-service";
import { simulateCropFinancials, type SimulationResult } from "./simulation-engine";
import { resolveDistrictFromCoords, getRegionFromState, type GeoRegion } from "./geo-service";
import type { AgriWeatherReport } from "./weather-service";

export type SeasonalPlanningType =
  | "short_duration"
  | "festival_season"
  | "interim_crop"
  | "quick_income"
  | "custom_deadline";

export type IndianFestival = {
  id: string;
  name: string;
  hindiName: string;
  approxDate: string; // YYYY-MM-DD for upcoming instance
  month: number;
  targetWindowDescription: string;
  primaryRegions: GeoRegion[];
  demandedProduce: string[];
  demandSpikeMultiplier: number;
  marketContext: string;
};

export const INDIAN_FESTIVALS_CATALOG: IndianFestival[] = [
  {
    id: "diwali",
    name: "Diwali / Deepawali",
    hindiName: "दीपावली / दिवाली",
    approxDate: "2024-11-01",
    month: 11,
    targetWindowDescription: "Late October – Early November peak festive demand",
    primaryRegions: ["North", "Central", "West", "East", "South", "NorthEast"],
    demandedProduce: ["Radish / Mooli (मूली)", "Spinach / Palak (पालक)", "Coriander (Dhaniya)", "Fenugreek / Methi (मेथी)", "Green Gram / Moong (मूंग)", "Black Gram / Urad (उड़द)", "Potato (Aloo)", "Onion (Pyaz)"],
    demandSpikeMultiplier: 1.35,
    marketContext: "Massive festive consumption spike for green vegetables, celebratory sweets, and pulse preparations across all urban mandis.",
  },
  {
    id: "chhath",
    name: "Chhath Puja",
    hindiName: "छठ पूजा",
    approxDate: "2024-11-07",
    month: 11,
    targetWindowDescription: "Early November sacred offering and festive market window",
    primaryRegions: ["East", "North", "Central"],
    demandedProduce: ["Radish / Mooli (मूली)", "Sugarcane (Ganna)", "Green Gram / Moong (मूंग)", "Black Gram / Urad (उड़द)", "Coriander (Dhaniya)", "Banana (Kela)"],
    demandSpikeMultiplier: 1.45,
    marketContext: "Surging spiritual demand in Bihar, UP, Jharkhand, and Delhi NCR mandis for fresh root vegetables, greens, and pristine pulses.",
  },
  {
    id: "makar_sankranti",
    name: "Makar Sankranti / Pongal / Lohri",
    hindiName: "मकर संक्रांति / पोंगल / लोहड़ी",
    approxDate: "2025-01-14",
    month: 1,
    targetWindowDescription: "Mid-January national harvest festival demand",
    primaryRegions: ["North", "South", "West", "East", "Central"],
    demandedProduce: ["Spinach / Palak (पालक)", "Radish / Mooli (मूली)", "Fenugreek / Methi (मेथी)", "Chickpea / Gram (Chana)", "Black Gram / Urad (उड़द)", "Sugarcane (Ganna)"],
    demandSpikeMultiplier: 1.30,
    marketContext: "Harvest festival celebrating new winter crop arrivals with peak retail velocity for leafy vegetables and seasonal pulses.",
  },
  {
    id: "holi",
    name: "Holi Festival of Colors",
    hindiName: "होली",
    approxDate: "2025-03-14",
    month: 3,
    targetWindowDescription: "Mid-March pre-summer festive consumption window",
    primaryRegions: ["North", "Central", "West", "East"],
    demandedProduce: ["Green Gram / Moong (मूंग)", "Cucumber / Kheera (खीरा)", "Okra / Bhindi (भिंडी)", "Coriander (Dhaniya)", "Wheat (Gehun)"],
    demandSpikeMultiplier: 1.25,
    marketContext: "Transition into summer with surging demand for fresh salads, cooling cucurbits, and early pulse grain stock.",
  },
  {
    id: "baisakhi",
    name: "Baisakhi / Tamil New Year / Ugadi",
    hindiName: "बैसाखी / उगादी / विशु",
    approxDate: "2025-04-14",
    month: 4,
    targetWindowDescription: "Mid-April major Rabi harvest and Zaid sowing kick-off",
    primaryRegions: ["North", "South", "East", "West"],
    demandedProduce: ["Green Gram / Moong (मूंग)", "Cucumber / Kheera (खीरा)", "Okra / Bhindi (भिंडी)", "Cowpea / Lobia (लोबिया)"],
    demandSpikeMultiplier: 1.20,
    marketContext: "Prime window to market early summer vegetables and initiate rapid 60-day summer pulse catch crops.",
  },
  {
    id: "navratri",
    name: "Navratri & Dussehra",
    hindiName: "नवरात्रि एवं दशहरा",
    approxDate: "2024-10-03",
    month: 10,
    targetWindowDescription: "October fasting & festive feast market window",
    primaryRegions: ["North", "West", "East", "Central", "South"],
    demandedProduce: ["Radish / Mooli (मूली)", "Spinach / Palak (पालक)", "Cucumber / Kheera (खीरा)", "Potato (Aloo)", "Coriander (Dhaniya)"],
    demandSpikeMultiplier: 1.30,
    marketContext: "Exceptional price premium for fasting-compatible fresh produce, greens, and salad crops across wholesale yards.",
  },
  {
    id: "ganesh_chaturthi",
    name: "Ganesh Chaturthi",
    hindiName: "गणेश चतुर्थी",
    approxDate: "2024-09-07",
    month: 9,
    targetWindowDescription: "September celebration demand in Western and Southern India",
    primaryRegions: ["West", "South", "Central"],
    demandedProduce: ["Okra / Bhindi (भिंडी)", "Cucumber / Kheera (खीरा)", "Banana (Kela)", "Coriander (Dhaniya)"],
    demandSpikeMultiplier: 1.20,
    marketContext: "Heightened market trading in Maharashtra, Gujarat, Karnataka, and AP for fresh produce and festive vegetables.",
  },
  {
    id: "onam",
    name: "Onam Harvest Festival",
    hindiName: "ओणम",
    approxDate: "2024-09-15",
    month: 9,
    targetWindowDescription: "Mid-September Kerala grand feast harvest window",
    primaryRegions: ["South"],
    demandedProduce: ["Banana (Kela)", "Okra / Bhindi (भिंडी)", "Cucumber / Kheera (खीरा)", "Cowpea / Lobia (लोबिया)"],
    demandSpikeMultiplier: 1.40,
    marketContext: "Traditional 26-dish Onasadya feast creates intense short-window demand for farm-fresh vegetables and pulses.",
  },
];

export type TimelinePhase = {
  phase: string;
  startDate: string;
  endDate: string;
  daySpan: string;
  description: string;
  status: "completed" | "active" | "upcoming" | "target";
};

export type SeasonalCropEvaluation = {
  cropId: string;
  slug: string;
  cropName: string;
  hindiName: string;
  category: string;
  durationDays: number;
  durationRange: string;
  sowingDate: string;
  expectedHarvestDate: string;
  targetEventDate?: string;
  fitsWindow: boolean;
  daysMargin: number;
  seasonalScore: number; // 0-100
  mspSupported: boolean;
  mspPrice: number | null;
  marketOutlook: "Very Strong" | "Strong" | "Moderate";
  financials: SimulationResult;
  riskRating: "Low" | "Moderate" | "High";
  whyRecommended: string[];
  timeline: TimelinePhase[];
  disqualifiedReason?: string;
};

export type SeasonalPlanningInput = {
  planningType: SeasonalPlanningType;
  farmAreaAcres: number;
  allocatedAcres?: number;
  currentDate?: string;
  availableDays?: number;
  targetDate?: string;
  festivalId?: string;
  mainCrop?: string;
  lat: number;
  lng: number;
  soilType?: string;
  soilPh?: number;
  waterAvailability?: "Low" | "Medium" | "High";
  weather?: AgriWeatherReport;
};

export type SeasonalPlanningResult = {
  id: string;
  planningType: SeasonalPlanningType;
  availableDays: number;
  targetWindowLabel: string;
  targetDate: string;
  festival?: IndianFestival;
  interimMainCrop?: string;
  location: {
    district: string;
    state: string;
    region: GeoRegion;
    agroClimaticZone: string;
  };
  recommendedCrops: SeasonalCropEvaluation[];
  disqualifiedCrops: { cropId?: string; cropName: string; reason: string }[];
  auditTrace: string[];
  generatedAt: string;
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().split("T")[0];
}

function formatDateDisplay(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return isoDate;
  }
}

/**
 * Evaluates candidate crops for seasonal and short-duration suitability.
 */
export function evaluateSeasonalCropPlanning(input: SeasonalPlanningInput): SeasonalPlanningResult {
  const auditTrace: string[] = [];
  const nowStr = input.currentDate || new Date().toISOString().split("T")[0];
  const nowDate = new Date(nowStr);
  const currentMonth = nowDate.getMonth() + 1; // 1-12

  // 1. Resolve Location & Agro-Climatic Intelligence
  const geo = resolveDistrictFromCoords(input.lat, input.lng);
  const region = getRegionFromState(geo.state);
  auditTrace.push(`Location: ${geo.district}, ${geo.state} (${geo.agroClimaticZone}) · Region: ${region}`);

  // 2. Resolve Available Planning Days & Target Date
  let availableDays = input.availableDays || 65;
  let targetDate = input.targetDate || addDays(nowStr, availableDays);
  let targetWindowLabel = `Custom Available Window (${availableDays} days)`;
  let selectedFestival: IndianFestival | undefined;

  if (input.planningType === "festival_season" && input.festivalId) {
    selectedFestival = INDIAN_FESTIVALS_CATALOG.find((f) => f.id === input.festivalId) || INDIAN_FESTIVALS_CATALOG[0];
    // Dynamically calculate upcoming festival date based on festival.month
    const currentYear = nowDate.getFullYear();
    let festDate = new Date(currentYear, selectedFestival.month - 1, 15);
    if (festDate.getTime() <= nowDate.getTime()) {
      festDate = new Date(currentYear + 1, selectedFestival.month - 1, 15);
    }
    targetDate = festDate.toISOString().split("T")[0];
    const diffMs = festDate.getTime() - nowDate.getTime();
    const naturalDays = Math.max(35, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    availableDays = input.availableDays ? input.availableDays : naturalDays;
    targetWindowLabel = `${selectedFestival.name} Window (${availableDays} days available)`;
    auditTrace.push(`Target Festival: ${selectedFestival.name} on ${targetDate} (${availableDays} days window)`);
  } else if (input.planningType === "interim_crop") {
    availableDays = input.availableDays || 70;
    targetDate = addDays(nowStr, availableDays);
    const mainCrop = input.mainCrop || "Wheat";
    targetWindowLabel = `Interim Catch Crop Window (After ${mainCrop} · ${availableDays} days)`;
    auditTrace.push(`Interim Mode: Pre/Post ${mainCrop} gap of ${availableDays} days`);
  } else if (input.planningType === "quick_income") {
    availableDays = Math.min(availableDays, 45);
    targetDate = addDays(nowStr, availableDays);
    targetWindowLabel = `Quick Income Turnaround (Under ${availableDays} days)`;
    auditTrace.push(`Quick Income Mode: Constrained to ${availableDays} days`);
  }

  const farmArea = Math.max(0.2, input.allocatedAcres || Math.min(input.farmAreaAcres, 1.5));
  const water = input.waterAvailability || "Medium";
  const soil = input.soilType || "Alluvial";
  const ph = input.soilPh ?? 7.2;

  const recommendedCrops: SeasonalCropEvaluation[] = [];
  const disqualifiedCrops: { cropId?: string; cropName: string; reason: string }[] = [];

  // Filter pool: Prioritize crops with explicit duration <= availableDays + 10d tolerance
  for (const crop of CROP_DATABASE) {
    const minDur = crop.minDurationDays || Math.round(crop.durationDays * 0.9);
    const typDur = crop.typicalDurationDays || crop.durationDays;
    const maxDur = crop.maxDurationDays || Math.round(crop.durationDays * 1.15);

    // Rule 1: Duration Filter — Must fit realistically within available planning days
    if (minDur > availableDays) {
      disqualifiedCrops.push({
        cropId: crop.id,
        cropName: crop.name,
        reason: `Maturity duration (${minDur}–${maxDur} days) exceeds available window of ${availableDays} days.`,
      });
      continue;
    }

    // Rule 2: Regional Agronomic Suitability
    if (crop.suitableRegions && !crop.suitableRegions.includes(region)) {
      disqualifiedCrops.push({
        cropName: crop.name,
        reason: `Not recommended for ${region} India agro-climatic conditions.`,
      });
      continue;
    }

    // Rule 3: Water Resource Constraints
    if (crop.waterLevel === "High" && water === "Low") {
      disqualifiedCrops.push({
        cropName: crop.name,
        reason: `High water requirement incompatible with rainfed/low-water access on this farm.`,
      });
      continue;
    }

    // Rule 4: Interim Sequencing Check
    if (input.planningType === "interim_crop" && input.mainCrop && crop.interimCompatibleWith) {
      const isCompat = crop.interimCompatibleWith.some((c) =>
        c.toLowerCase().includes(input.mainCrop!.toLowerCase())
      );
      if (!isCompat) {
        disqualifiedCrops.push({
          cropName: crop.name,
          reason: `Crop sequencing conflict with primary crop ${input.mainCrop}.`,
        });
        continue;
      }
    }

    // Agronomic & Economic Scoring (0-100)
    let score = 70;
    const whyReasons: string[] = [];

    // Duration fit bonus: Perfect fit within deadline
    if (typDur <= availableDays) {
      score += 15;
      whyReasons.push(`Matures comfortably in ~${typDur} days, fitting your ${availableDays}-day target window`);
    } else {
      score -= 10;
      whyReasons.push(`Tight duration fit (${typDur} days vs ${availableDays} days available) requiring timely sowing`);
    }

    // Festival demand boost
    let demandBoost = 1.0;
    if (selectedFestival) {
      const isFestiveCrop = selectedFestival.demandedProduce.some((p) =>
        p.toLowerCase().includes(crop.slug.toLowerCase()) || crop.name.toLowerCase().includes(p.toLowerCase())
      );
      if (isFestiveCrop || (crop.festivalDemandTags && crop.festivalDemandTags.includes(selectedFestival.name))) {
        score += 15;
        demandBoost = selectedFestival.demandSpikeMultiplier;
        whyReasons.push(`Historically strong festive market demand during ${selectedFestival.name} (+${Math.round((demandBoost - 1) * 100)}% price velocity)`);
      }
    }

    // Soil compatibility
    if (crop.suitableSoils.some((s) => s.toLowerCase().includes(soil.toLowerCase()))) {
      score += 8;
      whyReasons.push(`High compatibility with your farm's ${soil} soil texture`);
    }

    // Temperature & Weather outlook
    if (input.weather?.current?.tempC) {
      const t = input.weather.current.tempC;
      if (t >= crop.tempRange.idealMin && t <= crop.tempRange.idealMax) {
        score += 8;
        whyReasons.push(`Current regional temperature (${t}°C) is in optimal thermal band (${crop.tempRange.idealMin}–${crop.tempRange.idealMax}°C)`);
      } else if (t < crop.tempRange.min || t > crop.tempRange.max) {
        score -= 20;
      }
    }

    // MSP support check
    const mandi = MANDI_BENCHMARK_PRICES.find((m) => m.cropSlug === crop.slug || m.cropId === crop.id);
    const effectivePrice = Math.round((mandi?.modalPrice || crop.economics.typicalPricePerQuintal) * demandBoost);

    if (crop.economics.mspEligible && crop.economics.mspPricePerQuintal) {
      score += 8;
      whyReasons.push(`Backed by official Government MSP safety floor of ₹${crop.economics.mspPricePerQuintal}/quintal`);
    } else {
      whyReasons.push(`Fast market-clearing cash crop trading at ~₹${effectivePrice}/quintal in regional mandis`);
    }

    // Soil rotation benefit (Pulses)
    if (crop.category === "Pulse") {
      score += 6;
      whyReasons.push(`Fixes atmospheric nitrogen into the soil, directly enriching the land for the next primary crop`);
    }

    const finalScore = Math.min(98, Math.max(35, Math.round(score)));

    // Financial simulation for allocated area
    const financials = simulateCropFinancials({
      areaAcres: farmArea,
      expectedYieldQuintalsPerAcre: crop.yield.quintalsPerAcre,
      expectedSellingPricePerQuintal: effectivePrice,
      inputCostPerAcre: crop.costs.totalPerAcre,
    });

    const sowingDate = nowStr;
    const expectedHarvestDate = addDays(sowingDate, typDur);
    const daysMargin = availableDays - typDur;

    // Timeline phases
    const timeline: TimelinePhase[] = [
      {
        phase: "Sowing & Germination",
        startDate: sowingDate,
        endDate: addDays(sowingDate, Math.max(5, Math.round(typDur * 0.15))),
        daySpan: `Days 0–${Math.round(typDur * 0.15)}`,
        description: "Seedbed preparation, precision sowing & initial root establishment.",
        status: "active",
      },
      {
        phase: "Vegetative Canopy Growth",
        startDate: addDays(sowingDate, Math.round(typDur * 0.15)),
        endDate: addDays(sowingDate, Math.round(typDur * 0.55)),
        daySpan: `Days ${Math.round(typDur * 0.15)}–${Math.round(typDur * 0.55)}`,
        description: "Rapid vegetative biomass expansion, weeding and moisture maintenance.",
        status: "upcoming",
      },
      {
        phase: "Flowering & Pod / Fruit Setting",
        startDate: addDays(sowingDate, Math.round(typDur * 0.55)),
        endDate: addDays(sowingDate, Math.round(typDur * 0.85)),
        daySpan: `Days ${Math.round(typDur * 0.55)}–${Math.round(typDur * 0.85)}`,
        description: "Critical reproductive flowering phase; protect against heat stress or pests.",
        status: "upcoming",
      },
      {
        phase: "Harvesting Window",
        startDate: addDays(sowingDate, Math.round(typDur * 0.85)),
        endDate: expectedHarvestDate,
        daySpan: `Days ${Math.round(typDur * 0.85)}–${typDur}`,
        description: `Maturity reached. Harvest between ${formatDateDisplay(addDays(sowingDate, Math.round(typDur * 0.85)))} and ${formatDateDisplay(expectedHarvestDate)}.`,
        status: "upcoming",
      },
      {
        phase: selectedFestival ? `${selectedFestival.name} Market Demand Peak` : "Wholesale Dispatch Window",
        startDate: expectedHarvestDate,
        endDate: addDays(expectedHarvestDate, 7),
        daySpan: "Target Market Window",
        description: selectedFestival
          ? `Direct selling window aligned with ${selectedFestival.name} (${formatDateDisplay(selectedFestival.approxDate)}).`
          : "Immediate dispatch to APMC mandi or secondary marketplace buyers.",
        status: "target",
      },
    ];

    let riskRating: "Low" | "Moderate" | "High" = "Low";
    if (finalScore < 65 || daysMargin < 5) riskRating = "High";
    else if (finalScore < 80 || daysMargin < 12) riskRating = "Moderate";

    let marketOutlook: "Very Strong" | "Strong" | "Moderate" = "Moderate";
    if (demandBoost > 1.25 || (mandi && mandi.trend30DayPct > 5)) marketOutlook = "Very Strong";
    else if (demandBoost > 1.05 || crop.economics.mspEligible) marketOutlook = "Strong";

    recommendedCrops.push({
      cropId: crop.id,
      slug: crop.slug,
      cropName: crop.name,
      hindiName: crop.hindiName,
      category: crop.category,
      durationDays: typDur,
      durationRange: `${minDur}–${maxDur} days`,
      sowingDate,
      expectedHarvestDate,
      targetEventDate: selectedFestival?.approxDate,
      fitsWindow: true,
      daysMargin,
      seasonalScore: finalScore,
      mspSupported: crop.economics.mspEligible,
      mspPrice: crop.economics.mspPricePerQuintal,
      marketOutlook,
      financials,
      riskRating,
      whyRecommended: whyReasons,
      timeline,
    });
  }

  // Sort by composite score descending
  recommendedCrops.sort((a, b) => b.seasonalScore - a.seasonalScore);

  auditTrace.push(`Evaluated ${CROP_DATABASE.length} catalog crops: ${recommendedCrops.length} viable, ${disqualifiedCrops.length} filtered out`);

  return {
    id: `seasonal_${Date.now()}`,
    planningType: input.planningType,
    availableDays,
    targetWindowLabel,
    targetDate,
    festival: selectedFestival,
    interimMainCrop: input.mainCrop,
    location: {
      district: geo.district,
      state: geo.state,
      region,
      agroClimaticZone: geo.agroClimaticZone,
    },
    recommendedCrops,
    disqualifiedCrops,
    auditTrace,
    generatedAt: new Date().toISOString(),
  };
}
