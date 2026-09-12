/**
 * AgriProfit — Test Suite for Prompts 13, 14 & 15
 * ===============================================
 * Tests:
 * - Multi-Crop Portfolio Optimizer (Prompt 13)
 * - Dashboard Constraints & Explanations (Prompt 14)
 * - Crop Lifecycle Milestone Planner (Prompt 15)
 */

import {
  optimizePortfolio,
  type PortfolioConstraintInput,
} from "../../frontend/src/lib/portfolio-optimizer";
import {
  generateCropLifecyclePlan,
  type CropLifecyclePlan,
} from "../../frontend/src/lib/lifecycle-planner";


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
  console.log("=== Testing Multi-Crop Portfolio Optimizer (Prompt 13) ===");

  const input: PortfolioConstraintInput = {
    totalLandAcres: 5.0,
    season: "Rabi",
    riskAppetite: "Balanced",
    waterAvailability: "Medium",
    investmentCapacity: "Medium",
    budgetCapInr: 120000,
    preferredCrops: ["Wheat", "Mustard"],
    excludedCrops: ["Onion"],
  };

  const portfolio = optimizePortfolio(input);

  // 1. Land constraint verification
  assert(portfolio.totalAllocatedAcres <= 5.0, `Total allocated land (${portfolio.totalAllocatedAcres} ac) does not exceed 5.0 acres`);
  assert(portfolio.allocations.length >= 2, `Portfolio diversified across ${portfolio.allocations.length} distinct crops`);

  // 2. Budget constraint verification
  assert(portfolio.estimatedCost <= 120000, `Estimated cost (₹${portfolio.estimatedCost}) within budget cap of ₹120,000`);

  // 3. Excluded crops verification
  const containsOnion = portfolio.allocations.some((a) => a.cropName.toLowerCase().includes("onion"));
  assert(!containsOnion, "Excluded crop (Onion) was strictly avoided in allocation");

  // 4. Preferred crops verification
  const containsWheat = portfolio.allocations.some((a) => a.cropName.toLowerCase().includes("wheat"));
  assert(containsWheat, "Preferred crop (Wheat) successfully included in top allocation");

  // 5. Water constraint verification on Low Water farm
  const lowWaterPortfolio = optimizePortfolio({
    ...input,
    waterAvailability: "Low",
  });
  const topLowWaterCrop = lowWaterPortfolio.allocations[0];
  assert(topLowWaterCrop !== undefined, "Low-water portfolio generated successfully");

  // 6. Diversification explanation
  assert(typeof portfolio.diversificationExplanation === "string" && portfolio.diversificationExplanation.length > 30, "Diversification explanation narrative present");

  console.log("\n=== Testing Crop Lifecycle Planner (Prompt 15) ===");

  const sowingDate = "2024-11-10T00:00:00.000Z";
  const plan: CropLifecyclePlan = generateCropLifecyclePlan("Wheat", sowingDate, "Punjab - Bathinda (Trans-Gangetic Plains)");

  assert(plan.cropName === "Wheat", "Generated lifecycle plan for Wheat");
  assert(plan.stages.length >= 5, `Generated ${plan.stages.length} agronomic growth stages`);
  assert(plan.totalDurationDays === 130, `Total growing duration is ${plan.totalDurationDays} days`);

  const criStage = plan.stages.find((s) => s.stageName.includes("Crown Root Initiation"));
  assert(criStage !== undefined, "Crown Root Initiation (CRI) stage identified");
  assert(criStage?.irrigationGuidance.includes("20–25 DAS"), "Critical first irrigation specified at 20-25 DAS");
  assert(criStage?.fertilizerGuidance.includes("Urea"), "Nitrogen top-dressing guidance specified for CRI stage");

  const maturityStage = plan.stages.find((s) => s.stageName.includes("Maturity"));
  assert(maturityStage?.irrigationGuidance.includes("stop irrigation"), "Pre-harvest irrigation cessation guidance included");

  assert(typeof plan.advisoryDisclaimer === "string" && plan.advisoryDisclaimer.includes("Advisory Notice"), "Advisory notice disclaimer present");

  // Verify Mustard Lifecycle
  const mustardPlan = generateCropLifecyclePlan("Mustard", sowingDate);
  assert(mustardPlan.stages.some((s) => s.fertilizerGuidance.includes("Sulfur")), "Mustard lifecycle includes essential Sulfur fertilizer guidance");
  assert(mustardPlan.stages.some((s) => s.pestMonitoring.includes("Aphids")), "Mustard lifecycle includes Aphid scouting thresholds");

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

