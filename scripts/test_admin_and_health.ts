/// <reference types="node" />

/**
 * AgriProfit — Test Suite for Prompts 18, 19 & 20
 * ===============================================
 * Tests:
 * - Admin Monitoring & Data Quality Matrix (Prompt 18)
 * - SIH Demo Mode Telemetry (Prompt 19)
 * - Production Health Endpoint (Prompt 20)
 */


import { getSystemAdminMetrics } from "../frontend/src/lib/admin-service";

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
  console.log("=== Testing Admin & Data Quality Telemetry (Prompt 18 & 19) ===");

  const metrics = await getSystemAdminMetrics();

  // 1. KPI Counters
  assert(metrics.totalRegisteredFarmers > 0, `Registered farmers count: ${metrics.totalRegisteredFarmers}`);
  assert(metrics.totalFarmsMapped > 0, `Mapped farms count: ${metrics.totalFarmsMapped}`);
  assert(metrics.totalMappedAcres > 0, `Total mapped acreage: ${metrics.totalMappedAcres} acres`);
  assert(metrics.totalCropsCataloged >= 10, `Curated crop catalog count: ${metrics.totalCropsCataloged}`);
  assert(metrics.recommendationsGenerated > 0, `Recommendations generated: ${metrics.recommendationsGenerated}`);
  assert(metrics.activeNotificationsSent > 0, `Dispatched alerts: ${metrics.activeNotificationsSent}`);
  assert(metrics.aiAssistantQueriesProcessed > 0, `AI queries processed: ${metrics.aiAssistantQueriesProcessed}`);

  // 2. Data Quality & Provenance Matrix
  assert(metrics.dataQualityMatrix.length >= 5, `Data quality matrix tracks ${metrics.dataQualityMatrix.length} core feeds`);

  const weatherFeed = metrics.dataQualityMatrix.find((f) => f.feedName.includes("Open-Meteo"));
  assert(weatherFeed !== undefined, "Agro-meteorological feed tracked in matrix");
  assert(weatherFeed?.status === "LIVE / HEALTHY", "Weather feed status marked LIVE / HEALTHY");

  const mspFeed = metrics.dataQualityMatrix.find((f) => f.feedName.includes("Central MSP"));
  assert(mspFeed !== undefined, "Central MSP price floor tracked in matrix");
  assert(mspFeed?.sourceType === "Official Government Gazette", "MSP source confirmed as Official Government Gazette");

  const postgisFeed = metrics.dataQualityMatrix.find((f) => f.feedName.includes("PostGIS"));
  assert(postgisFeed !== undefined, "PostGIS spatial engine tracked in matrix");
  assert(postgisFeed?.status === "OPERATIONAL", "PostGIS status marked OPERATIONAL");

  // 3. API Health Checks Table
  assert(metrics.apiHealthChecks.length >= 7, `API telemetry tracks ${metrics.apiHealthChecks.length} REST endpoints`);
  assert(metrics.apiHealthChecks.every((api) => api.status === "200 OK"), "All monitored REST endpoints report 200 OK");
  assert(metrics.apiHealthChecks.every((api) => api.latencyMs < 500), "All endpoint latencies within 500ms benchmark");

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

