/**
 * AgriProfit — Test Suite for Prompts 7, 8 & 9
 * =============================================
 * Tests:
 * - Farmer Preferences (Prompt 7)
 * - Crop Database & Agronomic/Economic Profiles (Prompt 8)
 * - Weather Integration & Extreme Alerts (Prompt 9)
 */

import {
  savePreferences,
  getPreferences,
  type FarmerPreferenceRecord,
} from "../frontend/src/app/api/preferences/repository";
import { CROP_DATABASE, type CropRecord } from "../frontend/src/lib/crop-data";
import { getAgriWeather, type AgriWeatherReport } from "../frontend/src/lib/weather-service";

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
  console.log("=== Testing Farmer Preferences (Prompt 7) ===");

  const testUserId = "farmer-test-user-001";
  const initialPrefs: FarmerPreferenceRecord = {
    id: `pref_${testUserId}`,
    userId: testUserId,
    riskAppetite: "Growth",
    waterAvailability: "High",
    investmentCapacity: "High",
    preferredCrops: ["Mustard", "Onion", "Cotton"],
    cropsToAvoid: ["Paddy (Rice)"],
    farmingExperienceYears: 15,
    soilType: "Alluvial",
    soilPh: 7.4,
    soilOrganicCarbon: "High",
    updatedAt: new Date().toISOString(),
  };

  const saved = await savePreferences(initialPrefs);
  assert(saved.userId === testUserId, "Preferences saved with correct user binding");

  const retrieved = await getPreferences(testUserId);
  assert(retrieved.riskAppetite === "Growth", "Risk appetite correctly persisted");
  assert(retrieved.waterAvailability === "High", "Water availability correctly persisted");
  assert(retrieved.preferredCrops.includes("Mustard"), "Preferred crops list persisted");
  assert(retrieved.cropsToAvoid.includes("Paddy (Rice)"), "Avoided crops list persisted");
  assert(retrieved.soilPh === 7.4, "Soil pH persisted");
  assert(retrieved.soilType === "Alluvial", "Soil type persisted");

  console.log("\n=== Testing Crop Database (Prompt 8) ===");

  assert(CROP_DATABASE.length >= 10, `CROP_DATABASE contains ${CROP_DATABASE.length} curated crops`);

  const wheat = CROP_DATABASE.find((c) => c.slug === "wheat");
  assert(wheat !== undefined, "Wheat is present in catalog");
  assert(wheat?.category === "Cereal" && wheat?.season === "Rabi", "Wheat categorized as Rabi Cereal");
  assert(wheat?.economics.mspEligible === true && wheat?.economics.mspPricePerQuintal === 2275, "Wheat has valid MSP 2275 INR/q");
  assert(wheat?.costs.totalPerAcre === 11500, "Wheat cost per acre matches ICAR standard (₹11,500)");
  assert(wheat?.yield.quintalsPerAcre === 14.5, "Wheat yield is 14.5 q/acre");
  assert(wheat?.provenance.sourceType === "official", "Wheat data provenance is marked official");

  const mustard = CROP_DATABASE.find((c) => c.slug === "mustard");
  assert(mustard !== undefined, "Mustard is present in catalog");
  assert(mustard?.economics.typicalPricePerQuintal === 5650, "Mustard mandi benchmark price verified (₹5,650/q)");
  assert(mustard?.waterLevel === "Low", "Mustard water requirement is marked Low");

  const rabiCrops = CROP_DATABASE.filter((c) => c.season === "Rabi");
  assert(rabiCrops.length >= 4, `Found ${rabiCrops.length} Rabi season crops`);

  const oilseeds = CROP_DATABASE.filter((c) => c.category === "Oilseed");
  assert(oilseeds.length >= 3, `Found ${oilseeds.length} Oilseed crops (Mustard, Soybean, Groundnut)`);

  console.log("\n=== Testing Weather Integration (Prompt 9) ===");

  // 1. Fetch live or baseline weather
  const weather: AgriWeatherReport = await getAgriWeather(30.2110, 74.9455, "Bathinda, Punjab");
  assert(weather !== null && typeof weather === "object", "Weather report generated");
  assert(typeof weather.current.tempC === "number", `Current temperature is ${weather.current.tempC}°C`);
  assert(weather.dailyForecast.length === 7, `7-day daily forecast has ${weather.dailyForecast.length} days`);
  assert(typeof weather.seasonalOutlook.cumulativeRain90DaysMm === "number", "90-day rainfall calculation present");
  assert(weather.seasonalOutlook.weatherSuitabilityScore >= 0 && weather.seasonalOutlook.weatherSuitabilityScore <= 100, "Suitability score bounded between 0-100");
  assert(Array.isArray(weather.extremeAlerts), "Extreme weather alerts array exists");

  // 2. Cache check
  const cachedWeather = await getAgriWeather(30.2110, 74.9455, "Bathinda, Punjab");
  assert(cachedWeather.provenance.cached === true, "Subsequent query hits in-memory cache within TTL");

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

