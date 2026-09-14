/// <reference types="node" />

import { strict as assert } from "node:assert";
import { forecastPriceWithML, predictYieldWithML } from "../../frontend/src/lib/ml-client";

type FetchCall = { url: string; init?: RequestInit };
const calls: FetchCall[] = [];
const originalFetch = globalThis.fetch;

function response(body: unknown, ok = true, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function runTests() {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    if (String(input).endsWith("/predict/yield")) {
      return response({
        crop: "Wheat",
        crop_slug: "wheat",
        predicted_yield_q_per_acre: 14.2,
        predicted_yield_q_per_ha: 35.1,
        confidence_interval_q_per_acre: [12.1, 16.3],
        model_version: "yield-rf-v2.0.0",
        is_ml_predicted: true,
      });
    }
    return response({
      crop: "Wheat",
      crop_slug: "wheat",
      current_price_inr_per_quintal: 2380,
      forecasted_price_inr_per_quintal: 2440,
      forecast_horizon_months: 3,
      price_change_pct: 2.52,
      price_trend: "rising",
      confidence_interval: [2350, 2530],
      model_version: "price-ensemble-v2.0.0",
      is_ml_forecast: true,
    });
  }) as typeof fetch;

  const yieldResult = await predictYieldWithML({
    crop: "Wheat",
    rainfall_mm: 180,
    soil_ph: 7.1,
    nitrogen_kg_per_ha: 125,
    avg_temp_c: 23,
    state: "Punjab",
    irrigation_type: "Sprinkler",
  });
  assert.equal(yieldResult?.model_version, "yield-rf-v2.0.0");
  assert.equal(yieldResult?.is_ml_predicted, true);
  assert.equal(calls[0].url, "http://127.0.0.1:8000/predict/yield");
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
    crop: "Wheat",
    rainfall_mm: 180,
    soil_ph: 7.1,
    nitrogen_kg_per_ha: 125,
    avg_temp_c: 23,
    state: "Punjab",
    irrigation_type: "Sprinkler",
  });
  console.log("[PASS] Yield endpoint, feature preparation, output parsing, and model version verified");

  const priceResult = await forecastPriceWithML({ crop: "Wheat", current_price_inr: 2380, months_ahead: 3, state: "Punjab", month: 9 });
  assert.equal(priceResult?.forecasted_price_inr_per_quintal, 2440);
  assert.equal(priceResult?.model_version, "price-ensemble-v2.0.0");
  assert.equal(calls[1].url, "http://127.0.0.1:8000/predict/price");
  const priceBody = JSON.parse(String(calls[1].init?.body));
  assert.equal(priceBody.crop, "Wheat");
  assert.equal(priceBody.current_price_inr, 2380);
  assert.equal(priceBody.months_ahead, 3);
  assert.equal(priceBody.rainfall_anomaly_mm, 0);
  assert.equal(priceBody.trade_demand_index, 55);
  console.log("[PASS] Price endpoint, feature preparation, output parsing, and model version verified");

  globalThis.fetch = (async () => response({ error: "service unavailable" }, false, 503)) as typeof fetch;
  assert.equal(await predictYieldWithML({ crop: "Wheat" }), null);
  assert.equal(await forecastPriceWithML({ crop: "Wheat" }), null);
  console.log("[PASS] Non-2xx ML service responses return explicit null fallback signals");

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).endsWith("/predict/yield")) {
      return response({ crop: "Wheat", predicted_yield_q_per_acre: 99 });
    }
    return response({ crop: "Wheat", forecasted_price_inr_per_quintal: 999 });
  }) as typeof fetch;
  assert.equal(await predictYieldWithML({ crop: "Wheat" }), null);
  assert.equal(await forecastPriceWithML({ crop: "Wheat" }), null);
  console.log("[PASS] Malformed ML output is rejected instead of becoming a fake prediction");

  globalThis.fetch = originalFetch;
  console.log("Results: 4 ML integration contracts passed");
}

runTests().catch((error) => {
  globalThis.fetch = originalFetch;
  console.error(error);
  process.exit(1);
});
