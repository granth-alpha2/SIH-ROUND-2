"""
Live HTTP Endpoint Test for AgriProfit ML Microservice
======================================================
Tests the live HTTP endpoints:
  - GET  /health
  - GET  /models/info
  - POST /predict/yield
  - POST /predict/price
"""

import sys
import time
import json
import urllib.request
import urllib.parse
import subprocess
import os

PORT = 8011
BASE_URL = f"http://127.0.0.1:{PORT}"

print("=" * 70)
print(f"Starting ML Microservice on port {PORT}...")
print("=" * 70)

env = os.environ.copy()
env["ML_PORT"] = str(PORT)
env["PYTHONIOENCODING"] = "utf-8"

proc = subprocess.Popen(
    [sys.executable, "apps/ml/serve.py"],
    cwd=os.path.abspath("."),
    env=env,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
)

# Wait up to 10 seconds for server to respond
server_ready = False
for attempt in range(20):
    time.sleep(0.5)
    try:
        req = urllib.request.Request(f"{BASE_URL}/health")
        with urllib.request.urlopen(req, timeout=1) as resp:
            if resp.status == 200:
                server_ready = True
                break
    except Exception:
        pass

if not server_ready:
    stdout, stderr = proc.communicate(timeout=2)
    print("FAILED TO START SERVER:")
    print("STDOUT:", stdout)
    print("STDERR:", stderr)
    sys.exit(1)

print("Server is ready and accepting requests!\n")

def http_get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read().decode("utf-8"))

def http_post(path, body):
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read().decode("utf-8"))

try:
    # 1. Health Check
    health = http_get("/health")
    print(f"[GET /health] Status: {health.get('status')}")
    print(f"  Service: {health.get('service')} v{health.get('version')}")
    print(f"  Yield Model Trained: {health.get('models', {}).get('yield_model', {}).get('trained')}")
    print(f"  Price Model Trained: {health.get('models', {}).get('price_forecaster', {}).get('trained')}")
    assert health.get("status") == "HEALTHY"

    # 2. Models Info Check
    info = http_get("/models/info")
    print(f"\n[GET /models/info] Yield Model: {info.get('yield_model', {}).get('model_type')} ({info.get('yield_model', {}).get('model_version')})")
    print(f"  Yield Test R2: {info.get('yield_model', {}).get('metrics', [{}, {}, {}])[2].get('r2_score')}")
    print(f"  Price Ensemble: {info.get('price_model', {}).get('model_type')} ({info.get('price_model', {}).get('model_version')})")
    print(f"  Price Val R2: {info.get('price_model', {}).get('metrics', [{}, {}])[1].get('r2_score')}")

    # 3. Dynamic Yield Predictions over HTTP
    print("\n[POST /predict/yield] Dynamic HTTP Inferences:")
    cases = [
        {"crop": "Wheat", "rainfall_mm": 120.0, "soil_ph": 7.2, "state": "Punjab", "irrigation_type": "Sprinkler"},
        {"crop": "Wheat", "rainfall_mm": 800.0, "soil_ph": 7.2, "state": "Punjab", "irrigation_type": "Sprinkler"},
        {"crop": "Rice (Paddy)", "rainfall_mm": 1100.0, "soil_ph": 6.8, "state": "West Bengal", "irrigation_type": "Flood"},
        {"crop": "Cotton", "rainfall_mm": 350.0, "soil_ph": 7.5, "state": "Gujarat", "irrigation_type": "Drip"},
        {"crop": "Sugarcane", "rainfall_mm": 1400.0, "soil_ph": 7.0, "state": "Maharashtra", "irrigation_type": "Flood"},
    ]

    for c in cases:
        resp = http_post("/predict/yield", c)
        assert resp.get("success") is True
        pred = resp["prediction"]
        print(f"  {c['crop']:<15} | Rain: {c['rainfall_mm']:>6.1f} mm | State: {c['state']:<14} --> Yield: {pred['predicted_yield_quintals_per_acre']:>5.2f} q/ac ({pred['predicted_yield_kg_per_ha']} kg/ha) [src: {pred['data_source']}]")

    # 4. Dynamic Price Forecasts over HTTP
    print("\n[POST /predict/price] Dynamic HTTP Forecasts:")
    price_cases = [
        {"crop": "Wheat", "current_price_inr": 2350.0, "months_ahead": 3, "state": "Punjab"},
        {"crop": "Mustard", "current_price_inr": 5600.0, "months_ahead": 3, "state": "Rajasthan"},
        {"crop": "Cotton", "current_price_inr": 6900.0, "months_ahead": 6, "state": "Gujarat"},
        {"crop": "Chickpea (Gram)", "current_price_inr": 5800.0, "months_ahead": 3, "state": "Madhya Pradesh"},
    ]

    for pc in price_cases:
        resp = http_post("/predict/price", pc)
        assert resp.get("success") is True
        fc = resp["forecast"]
        print(f"  {pc['crop']:<17} | Current: INR {fc['current_modal_price_inr_per_q']:>6.0f}/q --> +{pc['months_ahead']}Mo Forecast: INR {fc['forecast_price_inr_per_q']:>7.2f}/q ({fc['trend_direction']}) [src: {fc['data_source']}]")

    print("\n" + "=" * 70)
    print("  PASS: LIVE HTTP MICROSERVICE INFERENCE FULLY VERIFIED AND OPERATIONAL")
    print("=" * 70)

finally:
    proc.terminate()
    try:
        proc.wait(timeout=2)
    except Exception:
        proc.kill()

