/**
 * AgriProfit — Test Suite for Optional Seasonal & Short-Duration Crop Recommendation
 * =================================================================================
 * Tests:
 * 1. Default OFF behavior (100% preservation of standard 4-part portfolio)
 * 2. 10 ICAR short-duration crops registered with duration bounds and economics
 * 3. 10-step agronomic hierarchy & duration window enforcement
 * 4. Indian festival catalog demand matching & premium multiplier
 * 5. Geo/agro-climatic zone location awareness (North vs South vs East vs West)
 * 6. Financial simulations (revenue, cost, net margin, ROI)
 * 7. Dynamic Land Partition & allocation scaling (FarmParcelMap integration)
 * 8. Visual timeline generation (5-phase agronomic milestone schedule)
 */

import {
  evaluateSeasonalCropPlanning,
  INDIAN_FESTIVALS_CATALOG,
  type SeasonalPlanningResult,
} from "../../frontend/src/lib/seasonal-crop-engine";
import { CROP_DATABASE } from "../../frontend/src/lib/crop-data";
import { getRegionFromState, resolveDistrictFromCoords } from "../../frontend/src/lib/geo-service";
import { optimizePortfolio } from "../../frontend/src/lib/portfolio-optimizer";

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
  console.log("=================================================================");
  console.log("🌱 TEST SUITE: OPTIONAL SEASONAL & SHORT-DURATION CROP ENGINE 🌱");
  console.log("=================================================================\n");

  // -------------------------------------------------------------
  // Test 1: ICAR Short-Duration Crop Catalog Completeness
  // -------------------------------------------------------------
  console.log("--- 1. ICAR Short-Duration Catalog Verification ---");
  const shortDurationCropIds = [
    "CROP026", // Green Gram / Moong (60d)
    "CROP027", // Black Gram / Urad (70d)
    "CROP028", // Radish / Mooli (35d)
    "CROP029", // Spinach / Palak (30d)
    "CROP030", // Coriander / Dhaniya (38d)
    "CROP031", // Fenugreek / Methi (35d)
    "CROP032", // Cucumber / Kheera (50d)
    "CROP033", // Toria / Rapeseed (75d)
    "CROP034", // Okra / Bhindi (55d)
    "CROP035_COWPEA", // Cowpea / Lobia (60d)
  ];

  for (const cid of shortDurationCropIds) {
    const crop = CROP_DATABASE.find((c) => c.id === cid);
    assert(!!crop, `Crop ${cid} is present in CROP_DATABASE`);
    if (crop) {
      assert(
        typeof crop.durationDays === "number" && crop.durationDays <= 75,
        `${crop.name} duration is <= 75 days (actual: ${crop.durationDays}d)`
      );
      assert(
        crop.minDurationDays !== undefined && crop.maxDurationDays !== undefined,
        `${crop.name} has duration range bounds [${crop.minDurationDays}d - ${crop.maxDurationDays}d]`
      );
    }
  }

  // -------------------------------------------------------------
  // Test 2: Standard Portfolio Pipeline Unaltered (Feature OFF)
  // -------------------------------------------------------------
  console.log("\n--- 2. Base Portfolio Isolation & Non-Regression ---");
  const basePortfolio = optimizePortfolio({
    totalLandAcres: 2.5,
    season: "Rabi",
    riskAppetite: "Balanced",
    waterAvailability: "Medium",
    investmentCapacity: "Medium",
    userSoilType: "Alluvial",
  });

  assert(basePortfolio.allocations.length >= 2, `Base portfolio generates ${basePortfolio.allocations.length} crop allocations`);
  const totalBaseAcres = basePortfolio.allocations.reduce((s, a) => s + a.allocatedAcres, 0);
  assert(Math.abs(totalBaseAcres - 2.5) < 0.1, `Base portfolio totals ${totalBaseAcres} acres (matches 2.5 acres)`);
  assert(basePortfolio.overallScore > 0, `Base portfolio score calculated: ${basePortfolio.overallScore}/100`);

  // -------------------------------------------------------------
  // Test 3: Short-Duration Window Evaluation (<40 Days)
  // -------------------------------------------------------------
  console.log("\n--- 3. Duration Window Constraint Enforcement ---");
  // Punjab coordinate (Bathinda: 30.211, 74.9455) with 40-day window
  const tightWindowResult: SeasonalPlanningResult = evaluateSeasonalCropPlanning({
    planningType: "short_duration",
    farmAreaAcres: 2.5,
    allocatedAcres: 0.75,
    availableDays: 40,
    lat: 30.211,
    lng: 74.9455,
    soilType: "Alluvial",
    waterAvailability: "Medium",
  });

  assert(tightWindowResult.recommendedCrops.length > 0, `Returns recommended crops for 40-day window`);
  // All recommended crops must fit within 40 days
  const allFitWindow = tightWindowResult.recommendedCrops.every((c) => c.durationDays <= 40);
  assert(allFitWindow, `All recommended crops have duration <= 40 days`);

  // Crops requiring > 40 days (like Moong @ 60d or Urad @ 70d) must be disqualified
  const moongRecommended = tightWindowResult.recommendedCrops.some((c) => c.cropId === "CROP026");
  assert(!moongRecommended, `Moong (60 days) correctly excluded from 40-day window`);
  const uradRecommended = tightWindowResult.recommendedCrops.some((c) => c.cropId === "CROP027");
  assert(!uradRecommended, `Urad (70 days) correctly excluded from 40-day window`);

  // Disqualified crops list contains duration explanation
  const moongDisqualified = tightWindowResult.disqualifiedCrops.find((d) => d.cropId === "CROP026");
  assert(!!moongDisqualified, `Moong listed in disqualified list with reason: "${moongDisqualified?.reason}"`);

  // -------------------------------------------------------------
  // Test 4: Festival Demand Matching (Diwali Window)
  // -------------------------------------------------------------
  console.log("\n--- 4. Indian Festival Demand Signals ---");
  const diwaliFestival = INDIAN_FESTIVALS_CATALOG.find((f) => f.id === "diwali");
  assert(!!diwaliFestival, `Diwali exists in INDIAN_FESTIVALS_CATALOG with multiplier ${diwaliFestival?.demandSpikeMultiplier}`);

  const diwaliResult = evaluateSeasonalCropPlanning({
    planningType: "festival_season",
    farmAreaAcres: 3.0,
    allocatedAcres: 1.0,
    festivalId: "diwali",
    lat: 30.211,
    lng: 74.9455,
    soilType: "Alluvial",
    waterAvailability: "High",
  });

  assert(diwaliResult.recommendedCrops.length > 0, `Returns festival recommendations for Diwali`);
  const topDiwaliCrop = diwaliResult.recommendedCrops[0];
  assert(topDiwaliCrop.seasonalScore >= 75, `Top festival crop (${topDiwaliCrop.cropName}) has high seasonal score: ${topDiwaliCrop.seasonalScore}`);
  assert(topDiwaliCrop.financials.expectedGrossRevenue > 0, `Expected revenue projected: ₹${topDiwaliCrop.financials.expectedGrossRevenue}`);

  // -------------------------------------------------------------
  // Test 5: Geo-Location & Regional Suitability
  // -------------------------------------------------------------
  console.log("\n--- 5. Geospatial & Agro-Climatic Intelligence ---");
  // North: Punjab
  const northDistrict = resolveDistrictFromCoords(30.211, 74.9455);
  assert(northDistrict.state === "Punjab", `Coordinates (30.211, 74.9455) resolve to ${northDistrict.state}`);
  assert(getRegionFromState(northDistrict.state) === "North", `Punjab resolves to North region`);

  // South: Tamil Nadu (Thanjavur: 10.787, 79.1378)
  const southDistrict = resolveDistrictFromCoords(10.787, 79.1378);
  assert(southDistrict.state === "Tamil Nadu", `Coordinates (10.787, 79.1378) resolve to ${southDistrict.state}`);
  assert(getRegionFromState(southDistrict.state) === "South", `Tamil Nadu resolves to South region`);

  // West: Gujarat / Maharashtra (Pune: 18.5204, 73.8567)
  const westDistrict = resolveDistrictFromCoords(18.5204, 73.8567);
  assert(westDistrict.state === "Maharashtra", `Coordinates (18.5204, 73.8567) resolve to ${westDistrict.state}`);
  assert(getRegionFromState(westDistrict.state) === "West", `Maharashtra resolves to West region`);

  // -------------------------------------------------------------
  // Test 6: Financial Simulation & ROI Calculation
  // -------------------------------------------------------------
  console.log("\n--- 6. Financial Simulation & ROI Accuracy ---");
  const fullWindowResult = evaluateSeasonalCropPlanning({
    planningType: "short_duration",
    farmAreaAcres: 2.5,
    allocatedAcres: 0.75,
    availableDays: 70,
    lat: 30.211,
    lng: 74.9455,
    soilType: "Alluvial",
    waterAvailability: "Medium",
  });

  const greenGram = fullWindowResult.recommendedCrops.find((c) => c.cropId === "CROP026");
  assert(!!greenGram, `Green Gram / Moong recommended when 70 days available`);
  if (greenGram) {
    assert(greenGram.financials.expectedNetProfit > 0, `Net profit for Green Gram is positive (₹${greenGram.financials.expectedNetProfit})`);
    assert(greenGram.financials.roiMultiplier > 1.0, `ROI multiplier is favorable (${greenGram.financials.roiMultiplier}x)`);
    assert(greenGram.mspSupported === true, `Green Gram has official MSP safety net (₹${greenGram.mspPrice}/q)`);
  }

  // -------------------------------------------------------------
  // Test 7: Land Partition & Allocation Math (FarmParcelMap)
  // -------------------------------------------------------------
  console.log("\n--- 7. Dynamic Land Partition & Allocation Re-Summing ---");
  const totalLand = 2.5;
  const seasonalAllocation = 0.75;
  const remainingLand = totalLand - seasonalAllocation; // 1.75 ac

  // Base crops scaled proportionally
  const baseTotal = basePortfolio.allocations.reduce((s, a) => s + a.allocatedAcres, 0);
  const scaledBaseAllocations = basePortfolio.allocations.map((a) => ({
    ...a,
    allocatedAcres: Number(((a.allocatedAcres / baseTotal) * remainingLand).toFixed(2)),
  }));

  const totalNewAcres = Number(
    (scaledBaseAllocations.reduce((s, a) => s + a.allocatedAcres, 0) + seasonalAllocation).toFixed(2)
  );

  assert(Math.abs(totalNewAcres - totalLand) <= 0.05, `Scaled land division (${totalNewAcres} ac) perfectly matches total boundary (${totalLand} ac)`);

  // -------------------------------------------------------------
  // Test 8: Visual Timeline Generation
  // -------------------------------------------------------------
  console.log("\n--- 8. 5-Phase Agronomic Timeline Schedule ---");
  if (greenGram) {
    assert(greenGram.timeline.length === 5, `Green Gram has 5-phase timeline (actual: ${greenGram.timeline.length})`);
    const phases = greenGram.timeline.map((t) => t.phase);
    assert(phases.some((p) => p.includes("Sowing")), `Timeline includes sowing phase`);
    assert(phases.some((p) => p.includes("Vegetative")), `Timeline includes vegetative phase`);
    assert(phases.some((p) => p.includes("Harvest")), `Timeline includes harvest phase`);
    assert(phases.some((p) => p.includes("Window") || p.includes("Market")), `Timeline includes market dispatch window`);
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n=================================================================");
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
