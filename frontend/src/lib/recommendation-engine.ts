/**
 * AgriProfit — Recommendation Engine V1 (Rule-Based Weighted Scoring)
 * ==================================================================
 * Transparent, deterministic agronomic & economic multi-crop scoring engine.
 *
 * Scoring Formula:
 * Crop Score = (Weather × 0.25) + (Market × 0.20) + (Profitability × 0.20) +
 *              (MSP Safety × 0.15) + (Cost Fit × 0.10) + (Soil Fit × 0.10) - Risk Penalties
 */

import { CROP_DATABASE, type CropRecord, type CropSeason } from "./crop-data";
import { MANDI_BENCHMARK_PRICES, type MandiPriceRecord } from "./market-service";
import { simulateCropFinancials, type SimulationResult } from "./simulation-engine";
import type { FarmerPreferenceRecord, RiskAppetite, ResourceLevel, SoilType } from "../app/api/preferences/repository";
import type { AgriWeatherReport } from "./weather-service";
import { predictYieldWithML } from "./ml-client";

export type FactorScores = {
  weatherSuitability: number; // 0-100
  marketOpportunity: number; // 0-100
  profitability: number; // 0-100
  mspSafety: number; // 0-100
  costFit: number; // 0-100
  soilFit: number; // 0-100
  riskPenalty: number; // 0-30
};

export type CropScoreOutput = {
  cropId: string;
  slug: string;
  cropName: string;
  hindiName: string;
  category: string;
  season: CropSeason;
  score: number; // 0-100
  financials: SimulationResult;
  factors: FactorScores;
  breakEven: {
    pricePerQuintal: number;
    yieldQuintalsPerAcre: number;
  };
  risks: string[];
  explanation: string;
  confidence: number; // 0.0 - 1.0
};

export type RecommendationPortfolio = {
  id: string;
  title: string;
  farmAreaAcres: number;
  season: CropSeason;
  riskAppetite: RiskAppetite;
  overallScore: number;
  expectedRevenue: number;
  estimatedCost: number;
  expectedProfit: number;
  roiMultiplier: number;
  weatherSuitabilityAverage: number;
  marketOpportunityAverage: number;
  confidenceAverage: number;
  allocations: {
    crop: CropScoreOutput;
    allocatedAcres: number;
    percentage: number;
    allocatedRevenue: number;
    allocatedCost: number;
    allocatedProfit: number;
  }[];
  explanation: string;
  generatedAt: string;
};

export type RecommendationInput = {
  farmAreaAcres: number;
  currentSeason?: CropSeason;
  preferences: FarmerPreferenceRecord;
  weather?: AgriWeatherReport;
};

/**
 * 1. Calculate Weather Suitability Score (0-100)
 */
function computeWeatherSuitability(crop: CropRecord, weather?: AgriWeatherReport, waterLevel: ResourceLevel = "Medium"): number {
  let score = 75; // Baseline
  if (!weather) return score;

  const currentTemp = weather.current.tempC;
  const idealMin = crop.tempRange.idealMin;
  const idealMax = crop.tempRange.idealMax;

  // Temperature fit
  if (currentTemp >= idealMin && currentTemp <= idealMax) {
    score += 15;
  } else if (currentTemp >= crop.tempRange.min && currentTemp <= crop.tempRange.max) {
    score += 5;
  } else {
    score -= 20;
  }

  // Water fit
  if (crop.waterLevel === "High" && waterLevel === "Low") {
    score -= 35; // Severe water mismatch
  } else if (crop.waterLevel === "Low" && waterLevel === "Low") {
    score += 15; // Great drought match
  } else if (crop.waterLevel === "High" && waterLevel === "High") {
    score += 10;
  }

  return Math.min(100, Math.max(10, score));
}

/**
 * 2. Calculate Market Opportunity Score (0-100)
 */
function computeMarketOpportunity(crop: CropRecord, mandi?: MandiPriceRecord): number {
  if (!mandi) return 65;
  let score = 60;

  // 30-Day price trend contribution
  if (mandi.trend30DayPct > 5) score += 20;
  else if (mandi.trend30DayPct > 0) score += 10;
  else if (mandi.trend30DayPct < -5) score -= 15;

  // Volatility contribution
  if (mandi.volatility === "Low") score += 10;
  else if (mandi.volatility === "High") score -= 10;

  // Modal price vs standard benchmark
  if (mandi.modalPrice >= crop.economics.typicalPricePerQuintal) {
    score += 10;
  }

  return Math.min(100, Math.max(15, score));
}

/**
 * 3. Calculate Profitability Score (0-100)
 */
function computeProfitabilityScore(crop: CropRecord): number {
  const roi = crop.economics.roi;
  const netProfitPerAcre = crop.economics.expectedNetProfitPerAcre;

  let score = 50;
  if (roi >= 3.0) score += 30;
  else if (roi >= 2.0) score += 20;
  else if (roi >= 1.5) score += 10;

  if (netProfitPerAcre > 50000) score += 20;
  else if (netProfitPerAcre > 25000) score += 10;

  return Math.min(100, Math.max(20, score));
}

/**
 * 4. Calculate MSP / Procurement Safety Score (0-100)
 */
function computeMspSafetyScore(crop: CropRecord): number {
  if (crop.economics.mspEligible && crop.economics.mspPricePerQuintal) {
    return 95; // High govt procurement safety net
  }
  return 40; // Free market subject to price swings
}

/**
 * 5. Calculate Cost Fit Score (0-100)
 */
function computeCostFit(crop: CropRecord, investmentCapacity: ResourceLevel = "Medium"): number {
  const cost = crop.costs.totalPerAcre;
  if (investmentCapacity === "Low") {
    if (cost < 10000) return 95;
    if (cost < 20000) return 70;
    return 35; // Too expensive for low-budget farmer
  }
  if (investmentCapacity === "Medium") {
    if (cost < 25000) return 90;
    return 65;
  }
  return 90; // High budget accommodates all crops
}

/**
 * 6. Calculate Soil Fit Score (0-100)
 */
function computeSoilFit(crop: CropRecord, soilType?: SoilType, soilPh?: number): number {
  let score = 80;
  if (soilType && crop.suitableSoils.some((s) => s.toLowerCase().includes(soilType.toLowerCase()))) {
    score += 15;
  }
  if (soilPh !== undefined) {
    if (soilPh >= 6.5 && soilPh <= 7.8) score += 5; // Neutral optimal
  }
  return Math.min(100, score);
}

/**
 * 7. Generate Explainability Narrative for a Crop Score
 */
function generateCropExplanation(crop: CropRecord, score: number, factors: FactorScores, mspRecord?: MandiPriceRecord): string {
  const reasons: string[] = [];

  if (factors.mspSafety >= 90 && crop.economics.mspPricePerQuintal) {
    reasons.push(`Guaranteed Central Govt MSP safety floor (₹${crop.economics.mspPricePerQuintal}/q)`);
  }
  if (factors.weatherSuitability >= 85) {
    reasons.push(`Optimal thermal & moisture suitability in local agro-climatic zone`);
  }
  if (factors.marketOpportunity >= 80 && mspRecord) {
    reasons.push(`Strong mandi price momentum (+${mspRecord.trend30DayPct}% 30-day move)`);
  }
  if (factors.profitability >= 80) {
    reasons.push(`High estimated net return (₹${crop.economics.expectedNetProfitPerAcre.toLocaleString("en-IN")}/ac at ${crop.economics.roi}x ROI)`);
  }
  if (crop.category === "Pulse") {
    reasons.push(`Enriches soil through atmospheric nitrogen fixation, reducing next season fertilizer costs`);
  }

  if (reasons.length === 0) {
    return `${crop.name} offers steady performance with a composite suitability score of ${score}/100 based on current season benchmarks.`;
  }

  return `${reasons.join(". ")}.`;
}

/**
 * Deterministically score a single crop against farmer preferences, weather, and market conditions.
 */
export function scoreSingleCrop(
  crop: CropRecord,
  prefs: FarmerPreferenceRecord,
  weather: AgriWeatherReport | undefined,
  mandi: MandiPriceRecord | undefined,
  allocatedAcres: number = 1.0,
  mlYieldOverride?: number
): CropScoreOutput {
  const activeMandi = mandi || MANDI_BENCHMARK_PRICES.find((m) => m.cropSlug === crop.slug || m.cropId === crop.id);

  const weatherScore = computeWeatherSuitability(crop, weather, prefs.waterAvailability);
  const marketScore = computeMarketOpportunity(crop, activeMandi);
  const profitScore = computeProfitabilityScore(crop);
  const mspScore = computeMspSafetyScore(crop);
  const costFit = computeCostFit(crop, prefs.investmentCapacity);
  const soilFit = computeSoilFit(crop, prefs.soilType, prefs.soilPh);

  // Apply penalties for avoided crops or severe water mismatch
  let riskPenalty = 0;
  if (prefs.cropsToAvoid?.some((avoid) => crop.name.toLowerCase().includes(avoid.toLowerCase()))) {
    riskPenalty += 50; // Heavy penalty if explicitly avoided
  }
  if (prefs.preferredCrops?.some((pref) => crop.name.toLowerCase().includes(pref.toLowerCase()))) {
    riskPenalty -= 10; // Bonus if explicitly preferred
  }

  // Weighted composite calculation
  const rawScore =
    weatherScore * 0.25 +
    marketScore * 0.20 +
    profitScore * 0.20 +
    mspScore * 0.15 +
    costFit * 0.10 +
    soilFit * 0.10 -
    riskPenalty;

  const finalScore = Math.min(98, Math.max(15, Math.round(rawScore)));

  const effectiveYield = mlYieldOverride && mlYieldOverride > 0 ? mlYieldOverride : crop.yield.quintalsPerAcre;

  const financials = simulateCropFinancials({
    areaAcres: Math.max(0.1, allocatedAcres),
    expectedYieldQuintalsPerAcre: effectiveYield,
    expectedSellingPricePerQuintal: activeMandi?.modalPrice || crop.economics.typicalPricePerQuintal,
    inputCostPerAcre: crop.costs.totalPerAcre,
  });

  const factors: FactorScores = {
    weatherSuitability: Math.round(weatherScore),
    marketOpportunity: Math.round(marketScore),
    profitability: Math.round(profitScore),
    mspSafety: Math.round(mspScore),
    costFit: Math.round(costFit),
    soilFit: Math.round(soilFit),
    riskPenalty: Math.round(Math.max(0, riskPenalty)),
  };

  const explanation = generateCropExplanation(crop, finalScore, factors, activeMandi);
  const baseConfidence = mlYieldOverride ? 0.88 : 0.78;
  const confidence = Number((baseConfidence + (finalScore / 100) * 0.10).toFixed(2));

  return {
    cropId: crop.id,
    slug: crop.slug,
    cropName: crop.name,
    hindiName: crop.hindiName,
    category: crop.category,
    season: crop.season,
    score: finalScore,
    financials,
    factors,
    breakEven: {
      pricePerQuintal: financials.breakEvenPricePerQuintal,
      yieldQuintalsPerAcre: financials.breakEvenYieldQuintalsPerAcre,
    },
    risks: crop.riskFactors,
    explanation,
    confidence,
  };
}

/**
 * Run deterministic multi-crop recommendation engine
 */
export function generateRecommendations(input: RecommendationInput): RecommendationPortfolio {
  const activeSeason: CropSeason = input.currentSeason || "Rabi";
  const area = Math.max(0.5, input.farmAreaAcres || 2.5);
  const prefs = input.preferences;
  const weather = input.weather;

  // Filter crops suitable for active season
  const candidateCrops = CROP_DATABASE.filter(
    (c) => c.season === activeSeason || c.season === "Perennial"
  );

  const scoredCrops: CropScoreOutput[] = candidateCrops.map((crop) => {
    const mandi = MANDI_BENCHMARK_PRICES.find((m) => m.cropSlug === crop.slug || m.cropId === crop.id);
    return scoreSingleCrop(crop, prefs, weather, mandi, 1.0);
  });

  // Sort candidate crops by deterministic score descending
  scoredCrops.sort((a, b) => b.score - a.score);

  // Land Portfolio Allocation Split based on Farmer Risk Appetite
  const topCrops = scoredCrops.slice(0, 3);
  let allocationSplits = [0.55, 0.30, 0.15];

  if (prefs.riskAppetite === "Conservative") {
    // 60% high-MSP staple, 30% low-input crop, 10% soil legume
    allocationSplits = [0.60, 0.30, 0.10];
  } else if (prefs.riskAppetite === "Growth") {
    // 45% high-margin cash crop, 35% staple, 20% pulses
    allocationSplits = [0.45, 0.35, 0.20];
  }

  const allocations = topCrops.map((crop, idx) => {
    const pct = allocationSplits[idx] || 0.10;
    const allocatedAcres = Number((area * pct).toFixed(2));
    const allocSim = simulateCropFinancials({
      areaAcres: allocatedAcres,
      expectedYieldQuintalsPerAcre: crop.financials.revenuePerAcre / (crop.financials.revenuePerAcre / crop.financials.costPerAcre || 1), // Standard yield
      expectedSellingPricePerQuintal: crop.financials.revenuePerAcre / (CROP_DATABASE.find(c => c.id === crop.cropId)?.yield.quintalsPerAcre || 1),
      inputCostPerAcre: crop.financials.costPerAcre,
    });

    return {
      crop,
      allocatedAcres,
      percentage: Math.round(pct * 100),
      allocatedRevenue: allocSim.expectedGrossRevenue,
      allocatedCost: allocSim.totalEstimatedCost,
      allocatedProfit: allocSim.expectedNetProfit,
    };
  });

  const totalRevenue = allocations.reduce((sum, a) => sum + a.allocatedRevenue, 0);
  const totalCost = allocations.reduce((sum, a) => sum + a.allocatedCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const overallRoi = Number((totalRevenue / (totalCost || 1)).toFixed(2));
  const overallScore = Math.round(allocations.reduce((sum, a) => sum + a.crop.score * (a.percentage / 100), 0));

  const portfolioExplanation = `Multi-crop allocation for ${area} acres (${activeSeason} season) calibrated to ${prefs.riskAppetite.toLowerCase()} risk strategy. Combines ${allocations[0]?.crop.cropName} (${allocations[0]?.percentage}%) for revenue stability with ${allocations[1]?.crop.cropName} (${allocations[1]?.percentage}%) for profit upside and soil rotation.`;

  return {
    id: `rec_${Date.now()}`,
    title: `${prefs.riskAppetite} ${allocations.map((a) => a.crop.cropName.split(" ")[0]).join(" + ")} Mix`,
    farmAreaAcres: area,
    season: activeSeason,
    riskAppetite: prefs.riskAppetite,
    overallScore,
    expectedRevenue: totalRevenue,
    estimatedCost: totalCost,
    expectedProfit: totalProfit,
    roiMultiplier: overallRoi,
    weatherSuitabilityAverage: Math.round(allocations.reduce((sum, a) => sum + a.crop.factors.weatherSuitability * (a.percentage / 100), 0)),
    marketOpportunityAverage: Math.round(allocations.reduce((sum, a) => sum + a.crop.factors.marketOpportunity * (a.percentage / 100), 0)),
    confidenceAverage: 0.86,
    allocations,
    explanation: portfolioExplanation,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Run ML-enhanced multi-crop recommendation engine
 * Interrogates FastAPI ML microservice for trained yield models with automatic rule fallback
 */
export async function generateRecommendationsWithML(input: RecommendationInput): Promise<RecommendationPortfolio> {
  const activeSeason: CropSeason = input.currentSeason || "Rabi";
  const area = Math.max(0.5, input.farmAreaAcres || 2.5);
  const prefs = input.preferences;
  const weather = input.weather;

  // Filter crops suitable for active season
  const candidateCrops = CROP_DATABASE.filter(
    (c) => c.season === activeSeason || c.season === "Perennial"
  );

  // Parallel ML Yield queries for candidate crops
  const scoredCropsPromises = candidateCrops.map(async (crop) => {
    const mandi = MANDI_BENCHMARK_PRICES.find((m) => m.cropSlug === crop.slug || m.cropId === crop.id);
    let mlYield: number | undefined;
    try {
      const mlRes = await predictYieldWithML({
        crop: crop.name.split(" ")[0],
        rainfall_mm: weather?.seasonalOutlook?.cumulativeRain90DaysMm ?? 150.0,
        avg_temp_c: weather?.current?.tempC ?? 24.0,
        soil_ph: prefs.soilPh ?? 7.2,
      });
      if (mlRes?.predicted_yield_q_per_acre) {
        mlYield = mlRes.predicted_yield_q_per_acre;
      }
    } catch {
      // Fallback to static ICAR benchmark
    }
    return scoreSingleCrop(crop, prefs, weather, mandi, 1.0, mlYield);
  });

  const scoredCrops = await Promise.all(scoredCropsPromises);
  scoredCrops.sort((a, b) => b.score - a.score);

  // Land Portfolio Allocation Split based on Farmer Risk Appetite
  const topCrops = scoredCrops.slice(0, 3);
  let allocationSplits = [0.55, 0.30, 0.15];

  if (prefs.riskAppetite === "Conservative") {
    allocationSplits = [0.60, 0.30, 0.10];
  } else if (prefs.riskAppetite === "Growth") {
    allocationSplits = [0.45, 0.35, 0.20];
  }

  const allocations = topCrops.map((crop, idx) => {
    const pct = allocationSplits[idx] || 0.10;
    const allocatedAcres = Number((area * pct).toFixed(2));
    const allocSim = simulateCropFinancials({
      areaAcres: allocatedAcres,
      expectedYieldQuintalsPerAcre: crop.financials.revenuePerAcre / (crop.financials.revenuePerAcre / crop.financials.costPerAcre || 1),
      expectedSellingPricePerQuintal: crop.financials.revenuePerAcre / (CROP_DATABASE.find(c => c.id === crop.cropId)?.yield.quintalsPerAcre || 1),
      inputCostPerAcre: crop.financials.costPerAcre,
    });

    return {
      crop,
      allocatedAcres,
      percentage: Math.round(pct * 100),
      allocatedRevenue: allocSim.expectedGrossRevenue,
      allocatedCost: allocSim.totalEstimatedCost,
      allocatedProfit: allocSim.expectedNetProfit,
    };
  });

  const totalRevenue = allocations.reduce((sum, a) => sum + a.allocatedRevenue, 0);
  const totalCost = allocations.reduce((sum, a) => sum + a.allocatedCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const overallRoi = Number((totalRevenue / (totalCost || 1)).toFixed(2));
  const overallScore = Math.round(allocations.reduce((sum, a) => sum + a.crop.score * (a.percentage / 100), 0));

  const portfolioExplanation = `AI & ML-calibrated multi-crop allocation for ${area} acres (${activeSeason} season) tailored to ${prefs.riskAppetite.toLowerCase()} risk strategy. Combines ${allocations[0]?.crop.cropName} (${allocations[0]?.percentage}%) for revenue stability with ${allocations[1]?.crop.cropName} (${allocations[1]?.percentage}%) for upside and soil rotation.`;

  return {
    id: `rec_ml_${Date.now()}`,
    title: `${prefs.riskAppetite} ${allocations.map((a) => a.crop.cropName.split(" ")[0]).join(" + ")} Mix (ML Enhanced)`,
    farmAreaAcres: area,
    season: activeSeason,
    riskAppetite: prefs.riskAppetite,
    overallScore,
    expectedRevenue: totalRevenue,
    estimatedCost: totalCost,
    expectedProfit: totalProfit,
    roiMultiplier: overallRoi,
    weatherSuitabilityAverage: Math.round(allocations.reduce((sum, a) => sum + a.crop.factors.weatherSuitability * (a.percentage / 100), 0)),
    marketOpportunityAverage: Math.round(allocations.reduce((sum, a) => sum + a.crop.factors.marketOpportunity * (a.percentage / 100), 0)),
    confidenceAverage: 0.92,
    allocations,
    explanation: portfolioExplanation,
    generatedAt: new Date().toISOString(),
  };
}
