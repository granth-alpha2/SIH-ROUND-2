/// <reference types="node" />

/**
 * Integration Test: "Apni Fasal vs AI Fasal" (Crop Comparison Engine)
 * ==================================================================
 * Validates deterministic scoring parity, multilingual crop resolution,
 * graceful fallback with suggestions, and factor-driven verdict generation.
 */

import {
  compareFarmerCropChoice,
  resolveCropByQuery,
  CropNotFoundError,
} from "../../frontend/src/lib/crop-comparison-engine";
import {
  scoreSingleCrop,
  generateRecommendations,
} from "../../frontend/src/lib/recommendation-engine";
import { CROP_DATABASE } from "../../frontend/src/lib/crop-data";
import { MANDI_BENCHMARK_PRICES } from "../../frontend/src/lib/market-service";
import type { FarmerPreferenceRecord } from "../../frontend/src/app/api/preferences/repository";

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
  console.log("=== 1. Testing Scoring Engine Parity & Extracted scoreSingleCrop ===");

  const defaultPrefs: FarmerPreferenceRecord = {
    id: "pref-test",
    userId: "user-test",
    riskAppetite: "Balanced",
    waterAvailability: "Medium",
    investmentCapacity: "Medium",
    soilType: "Alluvial",
    soilPh: 7.2,
    preferredCrops: [],
    cropsToAvoid: [],
    updatedAt: new Date().toISOString(),
  };

  const wheatCrop = CROP_DATABASE.find((c) => c.slug === "wheat")!;
  const mandi = MANDI_BENCHMARK_PRICES.find((m) => m.cropSlug === "wheat");

  const singleScore = scoreSingleCrop(wheatCrop, defaultPrefs, undefined, mandi, 1.0);
  const fullRec = generateRecommendations({
    farmAreaAcres: 2.5,
    currentSeason: "Rabi",
    preferences: defaultPrefs,
  });

  const wheatInRec = fullRec.allocations.find((a) => a.crop.slug === "wheat");
  assert(Boolean(wheatInRec), "Wheat exists in candidate recommendations");
  if (wheatInRec) {
    assert(
      singleScore.score === wheatInRec.crop.score,
      `scoreSingleCrop score matches generateRecommendations (${singleScore.score} vs ${wheatInRec.crop.score})`
    );
    assert(
      singleScore.factors.weatherSuitability === wheatInRec.crop.factors.weatherSuitability,
      "Factor weatherSuitability matches exactly"
    );
    assert(
      singleScore.factors.mspSafety === wheatInRec.crop.factors.mspSafety,
      "Factor mspSafety matches exactly"
    );
  }

  console.log("\n=== 2. Testing Multilingual & Fuzzy Crop Resolution ===");

  const resSlug = resolveCropByQuery("mustard");
  assert(resSlug.crop?.slug === "mustard", "Resolved exact slug 'mustard'");

  const resHindi = resolveCropByQuery("सरसों");
  assert(resHindi.crop?.slug === "mustard", "Resolved Hindi script 'सरसों' -> mustard");

  const resTranslit = resolveCropByQuery("gehun");
  assert(resTranslit.crop?.slug === "wheat", "Resolved transliteration 'gehun' -> wheat");

  const resAlias = resolveCropByQuery("pyaz");
  assert(resAlias.crop?.slug === "onion", "Resolved alias 'pyaz' -> onion");

  const resChana = resolveCropByQuery("चना");
  assert(resChana.crop?.slug === "chickpea", "Resolved Hindi 'चना' -> chickpea");

  console.log("\n=== 3. Testing Graceful Handling for Unsupported / Unknown Crops ===");

  const resUnknown = resolveCropByQuery("dragonfruit");
  assert(resUnknown.crop === null, "Unknown crop 'dragonfruit' returned null crop");
  assert(
    resUnknown.suggestions.length >= 3,
    `Returned at least 3 fallback suggestions (got ${resUnknown.suggestions.length})`
  );

  let caughtError: CropNotFoundError | null = null;
  try {
    compareFarmerCropChoice({
      farmAreaAcres: 3.0,
      currentSeason: "Rabi",
      preferences: defaultPrefs,
      farmerChosenCropSlug: "avocado",
    });
  } catch (err: any) {
    caughtError = err;
  }
  assert(caughtError !== null, "Throws CropNotFoundError on unknown crop");
  assert(
    caughtError?.suggestions !== undefined && caughtError.suggestions.length >= 3,
    "CropNotFoundError includes helpful suggestions array"
  );

  console.log("\n=== 4. Testing Fair Head-to-Head Comparison Math ===");

  const farmArea = 4.5;
  const comp = compareFarmerCropChoice({
    farmAreaAcres: farmArea,
    currentSeason: "Rabi",
    preferences: defaultPrefs,
    farmerChosenCropSlug: "wheat",
  });

  assert(comp.areaAcres === farmArea, `Comparison evaluated on full farm area (${comp.areaAcres} ac)`);
  assert(
    comp.farmerChoice.financials.areaAcres === farmArea,
    `Farmer choice scored on 100% land (${comp.farmerChoice.financials.areaAcres} ac)`
  );
  assert(
    comp.aiTopPick.financials.areaAcres === farmArea,
    `AI top pick scored on 100% land (${comp.aiTopPick.financials.areaAcres} ac)`
  );

  const expectedProfitGap =
    comp.aiTopPick.financials.expectedNetProfit - comp.farmerChoice.financials.expectedNetProfit;
  assert(
    comp.profitGap === expectedProfitGap,
    `profitGap matches net profit delta (got ₹${comp.profitGap})`
  );

  assert(
    comp.verdict === "ai_better" || comp.verdict === "farmer_choice_good" || comp.verdict === "comparable",
    `Verdict is valid category (${comp.verdict})`
  );

  assert(
    Boolean(comp.verdictSentence.hi && comp.verdictSentence.en),
    "Verdict sentence provided in both Hindi and English"
  );

  console.log("\n=== 5. Testing Factor-Driven Reasons Generation ===");

  assert(
    comp.reasonsAiIsBetter.length <= 3,
    `Reasons for AI <= 3 (got ${comp.reasonsAiIsBetter.length})`
  );
  assert(
    comp.reasonsToStickWithFarmerChoice.length <= 3,
    `Reasons for Farmer <= 3 (got ${comp.reasonsToStickWithFarmerChoice.length})`
  );
  assert(
    comp.reasonsToStickWithFarmerChoice.length > 0,
    "Generated respectful positive reasons for farmer choice (autonomy preserved)"
  );

  console.log("\n=== 6. Testing Farmer Choice Matches AI Top Pick ===");

  // When farmer chooses the exact top AI pick
  const topAiSlug = comp.aiTopPick.slug;
  const sameComp = compareFarmerCropChoice({
    farmAreaAcres: 3.0,
    currentSeason: "Rabi",
    preferences: defaultPrefs,
    farmerChosenCropSlug: topAiSlug,
  });

  assert(sameComp.verdict === "comparable", `Same crop verdict is 'comparable' (got ${sameComp.verdict})`);
  assert(sameComp.profitGap === 0, "Profit gap is exactly 0 when crops are identical");

  console.log("\n========================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
