/// <reference types="node" />

/**
 * AgriProfit — Test Suite for Land Area, Geolocation & Dynamic ML Integration
 * ===========================================================================
 * Validates:
 * 1. Geospatial Area & Coordinate Conversions (34.85 & 38.0 acres)
 * 2. Reverse Geocoding & Agro-Climatic Zone Resolution
 * 3. Dynamic Multi-Crop 4-Part Portfolio Optimizer (No hardcoded 5-acre clamping)
 * 4. Dynamic Context-Aware AI Agronomist
 */

import { resolveDistrictFromCoords, calculateDistanceKm, DISTRICT_MASTER } from "../frontend/src/lib/geo-service";
import { optimizePortfolio } from "../frontend/src/lib/portfolio-optimizer";
import { getFarmerContext } from "../frontend/src/lib/ai-assistant-service";
import { simulateCropFinancials } from "../frontend/src/lib/simulation-engine";

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`[PASS] ${msg}`);
    passed++;
  } else {
    console.error(`[FAIL] ${msg}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log("=== 1. Testing Geolocation & District Resolution ===");
  
  // Test Meerut, UP coords (28.9845, 77.7064)
  const meerut = resolveDistrictFromCoords(28.9845, 77.7064);
  assert(meerut.district === "Meerut", `Resolved Meerut coordinates correctly (got ${meerut.district})`);
  assert(meerut.state === "Uttar Pradesh", `Resolved UP state correctly (got ${meerut.state})`);
  assert(meerut.agroClimaticZone === "Upper Gangetic Plains", `Resolved Upper Gangetic Plains zone (got ${meerut.agroClimaticZone})`);

  // Test Nashik, Maharashtra coords (19.9975, 73.7898)
  const nashik = resolveDistrictFromCoords(19.9975, 73.7898);
  assert(nashik.district === "Nashik", `Resolved Nashik coordinates correctly (got ${nashik.district})`);
  assert(nashik.state === "Maharashtra", `Resolved Maharashtra correctly (got ${nashik.state})`);

  // Test Distance Calculation
  const dist = calculateDistanceKm(30.211, 74.9455, 30.901, 75.8573);
  assert(dist > 100 && dist < 120, `Distance between Bathinda and Ludhiana is realistic (~${dist} km)`);

  console.log("\n=== 2. Testing Dynamic 34.85 & 38.0 Acre Portfolio Optimization ===");

  // Test 34.85-Acre Farm Allocation
  const opt34 = optimizePortfolio({
    totalLandAcres: 34.85,
    season: "Rabi",
    riskAppetite: "Balanced",
    waterAvailability: "Medium",
    investmentCapacity: "Medium",
    preferredCrops: ["Wheat", "Mustard"],
  });

  assert(opt34.totalAvailableAcres === 34.85, `Total available acres equals 34.85 (got ${opt34.totalAvailableAcres})`);
  assert(opt34.totalAllocatedAcres === 34.85, `Total allocated acres equals exactly 34.85 (got ${opt34.totalAllocatedAcres})`);
  assert(opt34.allocations.length >= 3, `Allocated at least 3 multi-crop strategies (got ${opt34.allocations.length})`);
  
  const sumAcres34 = Number(opt34.allocations.reduce((sum, a) => sum + a.allocatedAcres, 0).toFixed(2));
  assert(sumAcres34 === 34.85, `Sum of individual crop allocations equals 34.85 acres (got ${sumAcres34})`);
  assert(opt34.expectedRevenue > 500000, `34.85 acre expected gross revenue scales proportionally (got ₹${opt34.expectedRevenue.toLocaleString()})`);

  // Test 38.0-Acre Farm Allocation
  const opt38 = optimizePortfolio({
    totalLandAcres: 38.0,
    season: "Rabi",
    riskAppetite: "Growth",
    waterAvailability: "High",
    investmentCapacity: "High",
  });

  assert(opt38.totalAllocatedAcres === 38.0, `Total allocated acres equals exactly 38.0 (got ${opt38.totalAllocatedAcres})`);
  const sumAcres38 = Number(opt38.allocations.reduce((sum, a) => sum + a.allocatedAcres, 0).toFixed(2));
  assert(sumAcres38 === 38.0, `Sum of crop sections for 38 acres equals 38.0 (got ${sumAcres38})`);

  console.log("\n=== 3. Testing Financial Sensitivity Simulation for Exact Acreage ===");

  const sim34 = simulateCropFinancials({
    areaAcres: 34.85,
    expectedSellingPricePerQuintal: 2380,
    expectedYieldQuintalsPerAcre: 15.0,
    inputCostPerAcre: 11500,
  });

  const expectedRev = 34.85 * 15 * 2380;
  assert(sim34.expectedGrossRevenue === expectedRev, `Expected gross revenue scales with 34.85 acres (₹${sim34.expectedGrossRevenue.toLocaleString()})`);
  assert(sim34.totalEstimatedCost === 34.85 * 11500, `Input cost scales with 34.85 acres (₹${sim34.totalEstimatedCost.toLocaleString()})`);
  assert(sim34.expectedNetProfit > 0, `Expected net profit is positive (₹${sim34.expectedNetProfit.toLocaleString()})`);


  console.log("\n=== 4. Testing Dynamic Context-Aware Assistant Telemetry ===");

  const ctx = await getFarmerContext("usr_test_999");
  assert(Boolean(ctx.location), `Farmer context contains resolved location (${ctx.location})`);
  assert(ctx.farmAreaAcres > 0, `Farmer context contains dynamic farm area (${ctx.farmAreaAcres} ac)`);
  assert(Boolean(ctx.activeCrop), `Farmer context contains active crop (${ctx.activeCrop})`);
  assert(ctx.mandiPricePerQuintal > 0, `Farmer context contains mandi price (₹${ctx.mandiPricePerQuintal}/q)`);

  console.log("\n========================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((e) => {
  console.error(e);
  process.exit(1);
});
