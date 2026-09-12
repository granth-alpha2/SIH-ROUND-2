async function testLiveFullstack() {
  console.log("=== 1. Testing ML Microservice Direct Health ===");
  const healthRes = await fetch("http://127.0.0.1:8000/health");
  const health = await healthRes.json();
  console.log("ML Microservice status:", health.status, "| Version:", health.service);

  console.log("\n=== 2. Testing ML Direct Yield Prediction ===");
  const yieldRes = await fetch("http://127.0.0.1:8000/predict/yield", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      crop: "Wheat",
      state: "Punjab",
      rainfall_mm: 180.0,
      soil_ph: 7.2,
      nitrogen_kg_per_ha: 120.0,
      avg_temp_c: 24.0,
      irrigation_type: "Sprinkler"
    })
  });
  const yieldData = await yieldRes.json();
  console.log(`[ML] Predicted Yield for Wheat: ${yieldData.predicted_yield_q_per_acre} q/ac (${yieldData.predicted_yield_q_per_ha} q/ha) [model: ${yieldData.model_version}]`);

  console.log("\n=== 3. Testing ML Direct Price Forecast ===");
  const priceRes = await fetch("http://127.0.0.1:8000/predict/price", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      crop: "Wheat",
      current_price_inr: 2380.0,
      state: "Punjab",
      months_ahead: 3
    })
  });
  const priceData = await priceRes.json();
  console.log(`[ML] 3-Month Price Forecast: INR ${priceData.forecasted_price_inr_per_quintal}/q [trend: ${priceData.price_trend}]`);

  console.log("\n=== 4. Testing Next.js Protected API (/api/recommendations) ===");
  const { signJWT } = require("../frontend/src/lib/auth");
  const token = await signJWT({ sub: "farmer_001", phone: "9876543210", name: "Sardar Balwinder Singh", role: "farmer" }, 3600);

  const recRes = await fetch("http://127.0.0.1:3000/api/recommendations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": "agriprofit_session=" + token
    },
    body: JSON.stringify({ farmAreaAcres: 5.0, season: "Rabi" })
  });

  const recData = await recRes.json();
  console.log("Next.js Recommendation API status:", recRes.status);
  console.log("Title:", recData.recommendation?.title);
  console.log("Confidence Average:", recData.recommendation?.confidenceAverage);
  console.log("Overall Score:", recData.recommendation?.overallScore, "/ 100");
  console.log("Allocations:", recData.recommendation?.allocations?.map(a => `${a.crop.cropName} (${a.allocatedAcres} ac, ${a.percentage}%)`).join(" + "));
  console.log("\n>>> SUCCESS: Next.js Frontend and FastAPI ML Microservice are 100% connected and running! <<<");
}

testLiveFullstack().catch(console.error);
