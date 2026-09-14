/// <reference types="node" />

import { strict as assert } from "node:assert";
import {
  buildCostSensitivityScenarios,
  buildPriceSensitivityScenarios,
  buildYieldSensitivityScenarios,
  calculateProfitabilitySnapshot,
  compareProfitabilityStrategies,
  normalizeWeight,
  recordCompletedProfitabilityOutcome,
} from "../../frontend/src/lib/profitability-service";
import { simulateExportScenario, selectRelevantModelSources } from "../../frontend/src/lib/simulation-engine";
import { generateRecommendations } from "../../frontend/src/lib/recommendation-engine";
import { MANDI_BENCHMARK_PRICES } from "../../frontend/src/lib/market-service";
import { getAgriWeather } from "../../frontend/src/lib/weather-service";
import { serializeForCsv, validateDataCollectionPayload, enqueueCsvExportJob } from "../../frontend/src/lib/data-collection";
import { canAccessOwner, isAdminRole } from "../../frontend/src/lib/request-auth";
import type { UserSession } from "../../frontend/src/lib/auth";

let passed = 0;

function check(condition: boolean, message: string) {
  assert.equal(condition, true, message);
  passed++;
  console.log(`[PASS] ${message}`);
}

function makeUser(sub: string, role: UserSession["role"] = "farmer"): UserSession {
  return { sub, phone: "", name: "Test", role, iat: 1, exp: 9999999999 };
}

async function runTests() {
  const snapshot = calculateProfitabilitySnapshot({
    quantity: 250,
    quantityUnit: "kg",
    sellingPricePerUnit: 24,
    sellingPriceUnit: "kg",
    fixedCost: 1200,
    variableCostPerUnit: 15,
    variableCostUnit: "kg",
    totalCost: 5000,
  });

  check(snapshot.breakEvenQuantity === 133.33, "Break-even quantity is calculated");
  check(snapshot.breakEvenPrice === 19.8, "Break-even price is calculated");
  check(snapshot.revenue === 6000, "Revenue calculation is correct");
  check(snapshot.totalCost === 5000, "Cost calculation is correct");
  check(snapshot.profit === 1000, "Profit calculation is correct");
  check(snapshot.profitMargin === 16.67, "Margin calculation is correct");
  check(snapshot.roi === 20, "ROI calculation is correct");
  check(normalizeWeight(1, "quintal") === 100 && normalizeWeight(1, "tonne") === 1000, "Unit conversion is explicit");

  const strategies = compareProfitabilityStrategies({
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
    groupHandlingCostPerUnit: 0.8,
    groupStorageCostPerUnit: 0.5,
    exportOfferPerUnit: 28,
    exportOfferUnit: "kg",
    exportPackagingCostPerUnit: 1,
    exportPackagingCostUnit: "kg",
    exportDocumentationCost: 400,
    exportLogisticsCost: 600,
    exportTransportCost: 500,
    exportChargesPct: 4,
  });
  for (const strategy of ["MSP", "DIRECT_MARKET", "GROUP_SELLING", "EXPORT"] as const) {
    check(strategies.some((row) => row.strategy === strategy && Number.isFinite(row.profit)), `${strategy} profitability is calculated`);
  }

  const actual = recordCompletedProfitabilityOutcome(snapshot, { revenue: 6200, profit: 1100, quantity: 250, price: 24.8 });
  check(actual.predictedProfit === 1000 && actual.actualProfit === 1100, "Predicted and actual outcomes remain separate");
  check(actual.predictedRevenue === 6000 && actual.actualRevenue === 6200, "Predicted and actual revenue remain separate");

  const exportResult = simulateExportScenario({
    cropQuantityQuintals: 35,
    localPricePerQuintal: 1800,
    internationalReferencePricePerKg: 0.35,
    exporterOfferPerKg: 0.4,
    packagingCostPerQuintal: 30,
    handlingCostPerQuintal: 20,
    documentationCost: 500,
    logisticsCost: 1000,
    transportCost: 700,
    exporterChargesPct: 0.04,
    exchangeRateInrPerUsd: 83,
    exchangeRateTimestamp: "2026-09-12T10:30:00.000Z",
  });
  check(Number.isFinite(exportResult.expectedFarmerRealization) && exportResult.expectedFarmerRealization > 0, "Export realization is finite and calculated");
  check(Number.isFinite(exportResult.expectedExportProfit) && exportResult.referenceDataMeta.source === "UN Comtrade", "Export profitability and source metadata are present");

  const priceScenarios = buildPriceSensitivityScenarios({ expectedPricePerQuintal: 2400, quantityQuintals: 35, totalCost: 58000, baseScenarioPrices: [2000, 2400, 2800] });
  const yieldScenarios = buildYieldSensitivityScenarios({ expectedYieldQuintals: 35, sellingPricePerQuintal: 2400, totalCost: 58000, baseScenarioYields: [25, 35, 45] });
  const costScenarios = buildCostSensitivityScenarios({ expectedYieldQuintals: 35, sellingPricePerQuintal: 2400, baseTotalCost: 58000, inputCost: 16000, laborCost: 12000, transportCost: 8000 });
  check(priceScenarios.length === 3 && priceScenarios[1].profit === 26000, "Price sensitivity uses calculated revenue and profit");
  check(yieldScenarios.length === 3 && yieldScenarios[1].revenue === 84000, "Yield sensitivity uses calculated revenue");
  check(costScenarios.length === 5 && costScenarios[4].breakEvenPrice > costScenarios[0].breakEvenPrice, "Cost sensitivity raises break-even under cost shock");

  check(selectRelevantModelSources("EXPORT").usesCurrency === true, "Model selection includes currency for export");
  check(selectRelevantModelSources("GROUP_SELLING").usesGroupAggregation === true, "Model selection includes aggregation for groups");
  const recommendation = generateRecommendations({
    farmAreaAcres: 5,
    currentSeason: "Rabi",
    preferences: {
      id: "test-pref",
      userId: "test-user",
      riskAppetite: "Balanced",
      waterAvailability: "Medium",
      investmentCapacity: "Medium",
      preferredCrops: ["Wheat"],
      cropsToAvoid: [],
      farmingExperienceYears: 5,
      soilType: "Loam",
      soilPh: 7.2,
      soilOrganicCarbon: "Medium",
      updatedAt: new Date().toISOString(),
    },
  });
  check(recommendation.aiModelSummary.models.every((model) => model.modelVersion && model.modelType), "Model metadata includes version and type");
  check(recommendation.aiModelSummary.dataSources.length > 0, "Model metadata includes data sources");

  check(MANDI_BENCHMARK_PRICES.every((record) => record.provenance.sourceType), "Mandi records declare provenance");
  const weather = await getAgriWeather(30.211, 74.9455, "Test location");
  check(Boolean(weather.provenance.provider && weather.provenance.fetchedAt), "Weather data includes provider freshness metadata");
  check(validateDataCollectionPayload({ eventType: "market", farmerId: "farmer-1", crop: "Wheat", state: "Punjab", quantity: 1, dataOrigin: "LIVE" }).dataOrigin === "LIVE", "LIVE data origin is preserved");
  check(validateDataCollectionPayload({ eventType: "market", farmerId: "farmer-1", crop: "Wheat", state: "Punjab" }).dataOrigin === "DEMO", "Missing data origin defaults to DEMO");
  let missingDataRejected = false;
  try {
    validateDataCollectionPayload({ eventType: "market", farmerId: "farmer-1", crop: "Wheat" });
  } catch (error) {
    missingDataRejected = error instanceof Error && /location is required/.test(error.message);
  }
  check(missingDataRejected, "Missing required data is rejected safely");

  const csv = serializeForCsv([{
    id: "event-1",
    eventType: "market",
    farmerId: "private-farmer-id",
    farmId: "private-farm-id",
    crop: "Wheat",
    state: "Punjab",
    district: "Bathinda",
    quantityQuintals: 10,
    createdAt: "2026-09-12T10:45:00.000Z",
    payload: { phone: "9876543210", otp: "123456", cost: 1000, safe: "ok" },
  }]);
  check(csv.includes("farmer_ref") && csv.includes("farm_ref"), "CSV uses pseudonymous reference columns");
  check(!csv.includes("private-farmer-id") && !csv.includes("9876543210") && !csv.includes("123456"), "CSV excludes raw identifiers and authentication data");
  const exports = await Promise.all([enqueueCsvExportJob(), enqueueCsvExportJob(), enqueueCsvExportJob()]);
  check(exports.every((value) => typeof value === "string"), "Concurrent CSV exports resolve safely");

  check(!isAdminRole("farmer") && isAdminRole("fpo_admin") && isAdminRole("platform_admin"), "RBAC distinguishes farmer and admin roles");
  check(canAccessOwner(makeUser("farmer-a"), "farmer-a"), "Farmer can access owned resource");
  check(!canAccessOwner(makeUser("farmer-a"), "farmer-b"), "Farmer cannot access another farmer resource");
  check(canAccessOwner(makeUser("admin", "platform_admin"), "farmer-b"), "Platform admin can access aggregated resource");

  console.log(`\nResults: ${passed} passed`);
}

runTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
