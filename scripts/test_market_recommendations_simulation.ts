/// <reference types="node" />

/**
 * AgriProfit — Test Suite for Prompts 10, 11 & 12
 * ===============================================
 * Tests:
 * - Market & MSP Data Architecture (Prompt 10)
 * - Deterministic Rule-Based Recommendation Engine V1 (Prompt 11)
 * - Financial Profit Simulation Engine (Prompt 12)
 */


import {
  marketService,
  MANDI_BENCHMARK_PRICES,
  OFFICIAL_MSP_CATALOG,
} from "../frontend/src/lib/market-service";
import {
  generateRecommendations,
  type RecommendationInput,
} from "../frontend/src/lib/recommendation-engine";
import {
  simulateCropFinancials,
  type SimulationInput,
} from "../frontend/src/lib/simulation-engine";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("=== Testing Market & MSP Data Layer (Prompt 10) ===");

  // 1. Mandi prices retrieval
  const allMandiPrices = await marketService.getMandiPrices();
  assert(allMandiPrices.length >= 6, `Found ${allMandiPrices.length} mandi benchmark price feeds`);

  const wheatMandi = await marketService.getCropPriceDetail("wheat");
  assert(wheatMandi !== null, "Retrieved Wheat mandi price details");
  assert(wheatMandi?.modalPrice === 2380, "Wheat modal price is ₹2,380/q");
  assert(wheatMandi?.mspPrice === 2275, "Wheat MSP reference is ₹2,275/q");
  assert(wheatMandi?.trend30DayPct === 4.6, "Wheat 30-day price trend is +4.6%");
  assert(wheatMandi?.volatility === "Low", "Wheat volatility is rated Low");
  assert(wheatMandi?.historical6Months.length === 6, "Wheat has 6-month historical monthly series");
  assert(wheatMandi?.provenance.sourceType === "Official source", "Wheat market data provenance is Official source");

  const onionMandi = await marketService.getCropPriceDetail("onion");
  assert(onionMandi !== null, "Retrieved Onion mandi price details");
  assert(onionMandi?.mspPrice === null, "Onion correctly identified as free market with no MSP");
  assert(onionMandi?.volatility === "High", "Onion volatility correctly classified as High");
  assert(onionMandi?.procurementSafety === "Volatile (Free Market)", "Onion procurement safety marked Volatile");

  // 2. MSP Catalog
  const mspList = await marketService.getMspRecords();
  assert(mspList.length >= 7, `MSP catalog contains ${mspList.length} official floor rates`);
  const mustardMsp = mspList.find((m) => m.cropId === "CROP013");
  assert(mustardMsp?.mspPricePerQuintal === 5650, "Mustard MSP is ₹5,650/q");
  assert(mustardMsp?.provenance.sourceType === "Official source", "Mustard MSP provenance is Official source");

  console.log("\n=== Testing Recommendation Engine V1 (Prompt 11) ===");

  const defaultPreferences = {
    id: "pref_test",
    userId: "test-farmer",
    riskAppetite: "Balanced" as const,
    waterAvailability: "Medium" as const,
    investmentCapacity: "Medium" as const,
    preferredCrops: ["Wheat", "Mustard"],
    cropsToAvoid: [],
    farmingExperienceYears: 10,
    soilType: "Loam" as const,
    soilPh: 7.2,
    soilOrganicCarbon: "Medium" as const,
    updatedAt: new Date().toISOString(),
  };

  const recInput: RecommendationInput = {
    farmAreaAcres: 5.0,
    currentSeason: "Rabi",
    preferences: defaultPreferences,
  };

  const recommendation = generateRecommendations(recInput);
  assert(recommendation !== null, "Recommendation portfolio generated");
  assert(recommendation.overallScore >= 70 && recommendation.overallScore <= 100, `Overall score is ${recommendation.overallScore}/100`);
  assert(recommendation.allocations.length === 3, `Multi-crop portfolio allocated across ${recommendation.allocations.length} crops`);
  assert(recommendation.allocations.reduce((sum, a) => sum + a.percentage, 0) === 100, "Allocations sum to exactly 100%");
  assert(recommendation.allocations.reduce((sum, a) => sum + a.allocatedAcres, 0) <= 5.0, "Total allocated acres equal farm area");

  // Verify explainability
  const topCrop = recommendation.allocations[0];
  assert(typeof topCrop.crop.explanation === "string" && topCrop.crop.explanation.length > 20, "Top crop contains detailed explainability narrative");
  assert(typeof topCrop.crop.factors.weatherSuitability === "number", "Weather suitability factor score present");
  assert(typeof topCrop.crop.factors.mspSafety === "number", "MSP safety factor score present");

  // Verify Conservative vs Growth risk allocation behavior
  const conservativeRec = generateRecommendations({
    ...recInput,
    preferences: { ...defaultPreferences, riskAppetite: "Conservative" },
  });
  assert(conservativeRec.allocations[0].percentage === 60, "Conservative strategy allocates 60% to primary safe crop");

  const growthRec = generateRecommendations({
    ...recInput,
    preferences: { ...defaultPreferences, riskAppetite: "Growth" },
  });
  assert(growthRec.allocations[0].percentage === 45, "Growth strategy allocates 45% to primary crop for higher diversification");

  console.log("\n=== Testing Financial Profit Simulation Engine (Prompt 12) ===");

  // Simulation test: 2.5 acres of Wheat @ 14.5 q/ac, ₹2,380/q price, ₹11,500/ac cost
  const simInput: SimulationInput = {
    areaAcres: 2.5,
    expectedYieldQuintalsPerAcre: 14.5,
    expectedSellingPricePerQuintal: 2380,
    inputCostPerAcre: 11500,
  };

  const simResult = simulateCropFinancials(simInput);

  // Math verification:
  // Revenue = 2.5 * 14.5 * 2380 = ₹86,275
  // Cost = 2.5 * 11500 = ₹28,750
  // Profit = 86275 - 28750 = ₹57,525
  // ROI % = (57525 / 28750) * 100 = 200.1% (3.0x multiplier)
  // Break-even price = 11500 / 14.5 = ₹793/q
  // Break-even yield = 11500 / 2380 = 4.83 q/ac

  assert(simResult.expectedGrossRevenue === 86275, `Expected revenue matches formula: ₹${simResult.expectedGrossRevenue}`);
  assert(simResult.totalEstimatedCost === 28750, `Total cost matches formula: ₹${simResult.totalEstimatedCost}`);
  assert(simResult.expectedNetProfit === 57525, `Expected profit matches formula: ₹${simResult.expectedNetProfit}`);
  assert(simResult.breakEvenPricePerQuintal === 793, `Break-even price is ₹${simResult.breakEvenPricePerQuintal}/q`);
  assert(simResult.breakEvenYieldQuintalsPerAcre === 4.83, `Break-even yield is ${simResult.breakEvenYieldQuintalsPerAcre} q/ac`);
  assert(simResult.roiPercentage === 200.1, `ROI percentage is ${simResult.roiPercentage}%`);

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

