const fs = require("fs");
const path = require("path");

async function testLive() {
  const report = {};
  const reportPath = path.join(__dirname, "live_report.json");

  try {
    const yieldRes = await fetch("http://127.0.0.1:8000/predict/yield", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crop: "Wheat",
        rainfall_mm: 185.0,
        soil_ph: 7.2,
        nitrogen_kg_per_ha: 120.0,
        avg_temp_c: 24.5,
        state: "Punjab",
        irrigation_type: "Sprinkler",
      }),
    });
    report.yieldPrediction = {
      status: yieldRes.status,
      data: await yieldRes.json(),
    };

    const priceRes = await fetch("http://127.0.0.1:8000/predict/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crop: "Mustard",
        months_ahead: 3,
        current_price_inr: 5650.0,
        state: "Punjab",
      }),
    });
    report.priceForecast = {
      status: priceRes.status,
      data: await priceRes.json(),
    };

    const healthRes = await fetch("http://127.0.0.1:3000/api/health");
    report.nextjsHealth = {
      status: healthRes.status,
      data: await healthRes.json(),
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  } catch (e) {
    fs.writeFileSync(reportPath, JSON.stringify({ error: e.message, stack: e.stack }, null, 2), "utf8");
  }
}

testLive().catch(console.error);

