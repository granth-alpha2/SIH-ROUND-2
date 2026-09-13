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
  resolveContextAwareMarketRecords,
} from "../../frontend/src/lib/market-service";
import {
  generateRecommendations,
  type RecommendationInput,
} from "../../frontend/src/lib/recommendation-engine";
import {
  buildCostSensitivityScenarios,
  buildPriceSensitivityScenarios,
  buildYieldSensitivityScenarios,
  calculateProfitabilitySnapshot,
  compareProfitabilityStrategies,
  normalizeWeight,
  toCanonicalWeight,
} from "../../frontend/src/lib/profitability-service";
import { prefillRecommendationContext } from "../../frontend/src/lib/farm-context";
import {
  selectRelevantModelSources,
  simulateCropFinancials,
  simulateExportScenario,
  simulateGroupSellingComparison,
  type SimulationInput,
} from "../../frontend/src/lib/simulation-engine";


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

  const upPotato = resolveContextAwareMarketRecords({ crop: "potato", state: "Uttar Pradesh", sellingChannel: "Mandi" });
  const punjabWheat = resolveContextAwareMarketRecords({ crop: "wheat", state: "Punjab", sellingChannel: "Mandi" });
  assert(upPotato.length > 0 && upPotato.every((m) => m.state === "Uttar Pradesh"), "Potato farmer in Uttar Pradesh is mapped to Uttar Pradesh mandi data");
  assert(punjabWheat.length > 0 && punjabWheat.every((m) => m.state === "Punjab"), "Wheat farmer in Punjab is mapped to Punjab mandi data");
  assert(
    upPotato[0]?.cropSlug !== punjabWheat[0]?.cropSlug || upPotato[0]?.state !== punjabWheat[0]?.state,
    "Different farmer, crop, and location contexts produce different market candidates"
  );

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

  assert(normalizeWeight(1, "kg") === 1, "1 kg remains 1 kg in canonical units");
  assert(normalizeWeight(1, "quintal") === 100, "1 quintal converts to 100 kg");
  assert(normalizeWeight(1, "tonne") === 1000, "1 tonne converts to 1000 kg");

  const profitability = calculateProfitabilitySnapshot({
    quantity: 250,
    quantityUnit: "kg",
    sellingPricePerUnit: 24,
    sellingPriceUnit: "kg",
    totalCost: 5000,
    fixedCost: 1200,
    variableCostPerUnit: 15,
    variableCostUnit: "kg",
  });

  assert(profitability.totalCost === 5000, "Canonical backend engine preserves total cost");
  assert(profitability.revenue === 6000, "Canonical backend engine calculates revenue correctly");
  assert(profitability.profit === 1000, "Canonical backend engine calculates profit correctly");
  assert(profitability.breakEvenQuantity === 133.33, "Break-even quantity uses fixed cost over contribution margin");
  assert(profitability.breakEvenPrice === 19.8, "Break-even price includes variable cost and fixed cost per unit");
  assert(profitability.profitMargin === 16.67, "Profit margin is computed as a percentage");
  assert(profitability.roi === 20, "ROI is calculated correctly");
  assert(toCanonicalWeight(1, "quintal") === 100, "Canonical mass conversion is explicit and reusable");

  const strategyComparison = compareProfitabilityStrategies({
    quantity: 250,
    quantityUnit: "kg",
    fixedCost: 1200,
    variableCostPerUnit: 15,
    variableCostUnit: "kg",
    mspPricePerUnit: 22,
    mspPriceUnit: "kg",
    directMarketPricePerUnit: 25,
    directMarketPriceUnit: "kg",
    directMarketExtraCostPerUnit: 1.5,
    directMarketExtraCostUnit: "kg",
    groupSellingPricePerUnit: 27,
    groupSellingPriceUnit: "kg",
    groupAggregationCostPerUnit: 1.2,
    groupAggregationCostUnit: "kg",
    groupHandlingCostPerUnit: 0.8,
    groupHandlingCostUnit: "kg",
    groupStorageCostPerUnit: 0.5,
    groupStorageCostUnit: "kg",
    exportOfferPerUnit: 28,
    exportOfferUnit: "kg",
    exportPackagingCostPerUnit: 1.0,
    exportPackagingCostUnit: "kg",
    exportDocumentationCost: 400,
    exportLogisticsCost: 600,
    exportTransportCost: 500,
    exportChargesPct: 0.04,
  });

  assert(strategyComparison.some((row) => row.strategy === "MSP" && row.profit > 0), "MSP strategy returns positive backend profit");
  assert(strategyComparison.some((row) => row.strategy === "DIRECT_MARKET" && row.profit > 0), "Direct market strategy returns positive backend profit");
  assert(strategyComparison.some((row) => row.strategy === "GROUP_SELLING" && row.profit > 0), "Group selling strategy returns positive backend profit");
  assert(strategyComparison.some((row) => row.strategy === "EXPORT" && row.profit > 0), "Export strategy returns positive backend profit");
  assert(strategyComparison.every((row) => row.expectedPrice > 0), "Each strategy row is backend-calculated with a positive expected price");

  const priceSensitivity = buildPriceSensitivityScenarios({
    expectedPricePerQuintal: 2400,
    quantityQuintals: 35,
    totalCost: 58000,
    baseScenarioPrices: [2000, 2200, 2400, 2600, 2800],
  });

  assert(priceSensitivity.length === 5, "Five price scenarios are generated for sensitivity analysis");
  assert(priceSensitivity[2].price === 2400, "Expected price scenario uses the actual reference price");
  assert(priceSensitivity[2].profit === 26000, "Profit calculation at the reference price is backend-backed");
  assert(priceSensitivity[0].status === "HIGH PROFIT POTENTIAL", "Lower market price still clears the profit threshold and is classified as high profit potential");
  assert(priceSensitivity[4].status === "HIGH PROFIT POTENTIAL", "Higher market price is categorized as high profit potential");

  const yieldSensitivity = buildYieldSensitivityScenarios({
    expectedYieldQuintals: 35,
    sellingPricePerQuintal: 2400,
    totalCost: 58000,
    baseScenarioYields: [25, 30, 35, 40, 45],
  });

  assert(yieldSensitivity.length === 5, "Five yield scenarios are generated for yield uncertainty analysis");
  assert(yieldSensitivity[2].yieldQuintals === 35, "Expected yield scenario uses the actual reference yield");
  assert(yieldSensitivity[2].revenue === 84000, "Revenue at the expected yield is backend-calculated from real yield * price");
  assert(yieldSensitivity[0].status === "PROFITABLE", "Lower yield still remains profitable under the actual cost structure");
  assert(yieldSensitivity[4].status === "HIGH PROFIT POTENTIAL", "Higher yield is categorized as high profit potential");

  const costSensitivity = buildCostSensitivityScenarios({
    expectedYieldQuintals: 35,
    sellingPricePerQuintal: 2400,
    baseTotalCost: 58000,
    inputCost: 16000,
    laborCost: 12000,
    transportCost: 8000,
  });

  assert(costSensitivity.length === 5, "Five cost scenarios are generated for cost-risk analysis");
  assert(costSensitivity[1].label === "+10% input cost", "Input-cost shock scenario is labeled correctly");
  assert(costSensitivity[2].label === "+20% labor cost", "Labor-cost shock scenario is labeled correctly");
  assert(costSensitivity[3].label === "+15% transport cost", "Transport-cost shock scenario is labeled correctly");
  assert(costSensitivity[4].profit < costSensitivity[0].profit, "Combined cost shock reduces profit relative to the base case");
  assert(costSensitivity[4].breakEvenPrice > costSensitivity[0].breakEvenPrice, "Combined cost shock raises the break-even price");

  const prefixedFarmContext = prefillRecommendationContext(
    {
      farmerId: "farmer-1001",
      farmId: "farm-5001",
      district: "Ludhiana",
      state: "Punjab",
      crop: "Wheat",
      cropVariety: "PBW 343",
      soilType: "Loam",
      soilTestResults: { pH: 7.2, organicCarbon: "Medium" },
      irrigation: "Tube-well",
      expectedYieldQuintalsPerAcre: 18.5,
      historicalYieldQuintalsPerAcre: 17.2,
      harvestDate: "2026-04-15",
      cropLifecycleStage: "Grain filling",
      farmName: "Ludhiana Farm",
      sellingChannel: "Mandi",
      destination: "Local market",
    },
    {
      id: "pref_test",
      userId: "test-farmer",
      riskAppetite: "Balanced",
      waterAvailability: "Medium",
      investmentCapacity: "Medium",
      preferredCrops: ["Wheat"],
      cropsToAvoid: [],
      farmingExperienceYears: 10,
      soilType: "Loam",
      soilPh: 7.2,
      soilOrganicCarbon: "Medium",
      updatedAt: new Date().toISOString(),
    }
  );

  assert(prefixedFarmContext.preferences.soilType === "Loam", "Farm soil type is prefilled from saved farm context");
  assert(prefixedFarmContext.context.cropName === "Wheat", "Farm crop is prefilled into recommendation context");
  assert(prefixedFarmContext.context.harvestDate === "2026-04-15", "Farm harvest date is prefilled into recommendation context");
  assert(prefixedFarmContext.context.irrigation === "Tube-well", "Farm irrigation source is prefilled into recommendation context");

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
  assert(!recommendation.aiModelSummary.models.some((model) => /\d+%/.test(model.confidence)), "AI model summary does not invent percentage-based confidence scores");
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

  const groupSelection = selectRelevantModelSources("GROUP_SELLING");
  assert(groupSelection.usesYieldPrediction === true, "Group scenario selects yield prediction");
  assert(groupSelection.usesMandiPriceForecast === true, "Group scenario selects mandi price forecast");
  assert(groupSelection.usesGroupAggregation === true, "Group scenario includes aggregation data");
  assert(groupSelection.usesInternationalReference === false, "Group scenario does not use export benchmark data");

  const exportSelection = selectRelevantModelSources("EXPORT");
  assert(exportSelection.usesYieldPrediction === true, "Export scenario selects yield prediction");
  assert(exportSelection.usesMandiPriceForecast === false, "Export scenario excludes mandi price forecast");
  assert(exportSelection.usesInternationalReference === true, "Export scenario includes international reference data");
  assert(exportSelection.usesCurrency === true, "Export scenario includes currency conversion");

  // Scenario B — Group Farming / Group Selling
  const groupComparison = simulateGroupSellingComparison({
    farmers: [
      { name: "Farmer A", quantityQuintals: 12, productionCostPerQuintal: 1850 },
      { name: "Farmer B", quantityQuintals: 18, productionCostPerQuintal: 1925 },
      { name: "Farmer C", quantityQuintals: 15, productionCostPerQuintal: 1900 },
    ],
    groupSellingPricePerQuintal: 2200,
    aggregationCostPerQuintal: 45,
    handlingCostPerQuintal: 28,
    storageCostPerQuintal: 18,
    groupTransactionCost: 1200,
    transportOptimizationSavingsPerQuintal: 32,
  });

  assert(groupComparison.totalQuantity === 45, "Group scenario total quantity is 45 q");
  assert(groupComparison.groupRevenue === 99000, "Group revenue is ₹99,000");
  assert(groupComparison.groupTotalCost === 90645, "Group total cost includes production + aggregation + handling + storage + transaction costs");
  assert(groupComparison.individualTotalCost === 90885, "Individual total cost includes unaggregated logistics and handling");
  assert(groupComparison.transportSavings === 1440, "Transport savings are derived from configured logistics assumptions");
  assert(groupComparison.groupProfit === 8355, "Group profit is computed from actual configured cost and revenue");
  assert(groupComparison.perFarmerRealization === 2785, "Per-farmer realization is calculated from group net profit");
  assert(groupComparison.assumptions.length >= 5, "Group assumptions are explicitly labelled for transparency");
  assert(groupComparison.groupProfit > 0, "Group selling is profitable");
  assert(groupComparison.additionalProfitFromAggregation > 0, "Aggregation adds profit over individual sales");

  // Scenario C — Export (Indicative estimate only)
  const exportEstimate = simulateExportScenario({
    cropQuantityQuintals: 200,
    localPricePerQuintal: 2200,
    internationalReferencePricePerKg: 0.63,
    exporterOfferPerKg: 0.58,
    packagingCostPerQuintal: 120,
    handlingCostPerQuintal: 90,
    documentationCost: 4200,
    logisticsCost: 18000,
    transportCost: 26000,
    exporterChargesPct: 0.04,
    exchangeRateInrPerUsd: 83.5,
    exchangeRateTimestamp: "2026-09-13T10:30:00Z",
  });

  assert(exportEstimate.indicative === true, "Export estimate is marked as indicative");
  assert(exportEstimate.expectedFarmerRealization > 0, "Export scenario returns a farmer realization");
  assert(exportEstimate.exportBreakEven > 0, "Export break-even is computed");
  assert(exportEstimate.exportRisk !== "Guaranteed export price", "Export risk is labelled correctly");
  assert(exportEstimate.currencyConversion.inrPerUsd === 83.5, "Exchange rate is preserved in export estimate");

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

