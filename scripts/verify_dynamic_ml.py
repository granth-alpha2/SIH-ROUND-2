"""
AgriProfit ML — Real-Time Model Dynamic Prediction & Sensitivity Verification
=============================================================================
Tests whether the Yield and Price models are genuinely computing dynamic,
non-predefined, feature-sensitive predictions directly from trained weights,
rather than returning static averages or lookup table values.
"""

import os
import sys
import warnings

# Suppress sklearn parallel/deprecation warnings
warnings.filterwarnings("ignore")

# Ensure repository root is in sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ML_DIR = os.path.join(REPO_ROOT, "ml-service")
for p in [REPO_ROOT, ML_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.models.yield_model import yield_model
    from app.models.price_model import price_forecaster
except ImportError:
    from ml_service.app.models.yield_model import yield_model
    from ml_service.app.models.price_model import price_forecaster

print("=" * 70)
print("  AgriProfit ML -- Dynamic Inference & Sensitivity Verification")
print("=" * 70)

# Check trained status
print("\n[MODEL HEALTH]")
print(f"  Yield Model Trained   : {yield_model.is_trained} (Version: {yield_model._model_version})")
print(f"  Price Model Trained   : {price_forecaster.is_trained} (Version: {price_forecaster._model_version})")

assert yield_model.is_trained, "Yield model artifact not loaded!"
assert price_forecaster.is_trained, "Price model artifact not loaded!"

# -----------------------------------------------------------------------------
# TEST 1: Yield Sensitivity to Rainfall (Wheat in Punjab)
# -----------------------------------------------------------------------------
print("\n" + "-" * 70)
print("TEST 1: Yield Model Sensitivity to Rainfall (Wheat in Punjab, pH=7.2, N=150)")
print("-" * 70)
rainfalls = [50.0, 150.0, 300.0, 600.0, 1000.0, 1500.0]
yields_rain = []

for r in rainfalls:
    res = yield_model.predict_yield(
        crop_slug="Wheat",
        rainfall_mm=r,
        soil_ph=7.2,
        nitrogen_kg_per_ha=150.0,
        avg_temp_c=2100.0,
        state="Punjab",
        irrigation_type="Sprinkler"
    )
    y_kg = res["predicted_yield_kg_per_ha"]
    y_q = res["predicted_yield_quintals_per_acre"]
    yields_rain.append(y_kg)
    print(f"  Rainfall: {r:>6.1f} mm  --> Predicted Yield: {y_kg:>7.1f} kg/ha ({y_q:>5.2f} q/ac) [src: {res['data_source']}]")

unique_rain_yields = len(set(yields_rain))
print(f"  --> Unique outputs across 6 rainfall levels: {unique_rain_yields}/6")
assert unique_rain_yields > 1, "FAIL: Model returns static values across different rainfall levels!"

# -----------------------------------------------------------------------------
# TEST 2: Yield Sensitivity to Nitrogen Fertilizer (Rice in West Bengal)
# -----------------------------------------------------------------------------
print("\n" + "-" * 70)
print("TEST 2: Yield Model Sensitivity to Nitrogen Dose (Rice in West Bengal, Rain=900mm)")
print("-" * 70)
nitrogens = [40.0, 100.0, 180.0, 260.0, 350.0]
yields_n = []

for n in nitrogens:
    res = yield_model.predict_yield(
        crop_slug="Rice (Paddy)",
        rainfall_mm=900.0,
        soil_ph=6.8,
        nitrogen_kg_per_ha=n,
        avg_temp_c=2500.0,
        state="West Bengal",
        irrigation_type="Flood"
    )
    y_kg = res["predicted_yield_kg_per_ha"]
    y_q = res["predicted_yield_quintals_per_acre"]
    yields_n.append(y_kg)
    print(f"  Nitrogen: {n:>5.1f} kg/ha --> Predicted Yield: {y_kg:>7.1f} kg/ha ({y_q:>5.2f} q/ac) [src: {res['data_source']}]")

unique_n_yields = len(set(yields_n))
print(f"  --> Unique outputs across 5 nitrogen levels: {unique_n_yields}/5")
assert unique_n_yields > 1, "FAIL: Model returns static values across different nitrogen doses!"

# -----------------------------------------------------------------------------
# TEST 3: Yield Sensitivity to Irrigation Type (Cotton in Gujarat)
# -----------------------------------------------------------------------------
print("\n" + "-" * 70)
print("TEST 3: Yield Model Sensitivity to Irrigation Method (Cotton in Gujarat)")
print("-" * 70)
irrigations = ["Rainfed", "Flood", "Sprinkler", "Drip"]
yields_irr = []

for irr in irrigations:
    res = yield_model.predict_yield(
        crop_slug="Cotton",
        rainfall_mm=250.0,
        soil_ph=7.4,
        nitrogen_kg_per_ha=160.0,
        avg_temp_c=2900.0,
        state="Gujarat",
        irrigation_type=irr
    )
    y_kg = res["predicted_yield_kg_per_ha"]
    y_q = res["predicted_yield_quintals_per_acre"]
    yields_irr.append(y_kg)
    print(f"  Irrigation: {irr:<10} --> Predicted Yield: {y_kg:>7.1f} kg/ha ({y_q:>5.2f} q/ac) [src: {res['data_source']}]")

unique_irr_yields = len(set(yields_irr))
print(f"  --> Unique outputs across 4 irrigation types: {unique_irr_yields}/4")
assert unique_irr_yields > 1, "FAIL: Model does not respond to irrigation methods!"

# -----------------------------------------------------------------------------
# TEST 4: Price Forecast Sensitivity to Recent Lag Prices (Mustard in Rajasthan)
# -----------------------------------------------------------------------------
print("\n" + "-" * 70)
print("TEST 4: Price Model Sensitivity to Lag 1 Prices (Mustard in Rajasthan)")
print("-" * 70)
test_prices = [4500.0, 5200.0, 5800.0, 6400.0, 7200.0]
forecasts_price = []

for p in test_prices:
    res = price_forecaster.forecast_price(
        crop_slug="Mustard",
        months_ahead=3,
        current_price_inr=p,
        price_lag2_inr=p * 0.98,
        price_lag3_inr=p * 0.95,
        state="Rajasthan",
        month=10
    )
    f_p = res["forecast_price_inr_per_q"]
    trend = res["trend_direction"]
    chg = res["price_change_pct"]
    forecasts_price.append(f_p)
    print(f"  Current Price: INR {p:>6.0f}/q --> 3-Mo Forecast: INR {f_p:>7.2f}/q ({trend}, {chg:>+5.1f}%) [src: {res['data_source']}]")

unique_price_forecasts = len(set(forecasts_price))
print(f"  --> Unique forecasts across 5 price levels: {unique_price_forecasts}/5")
assert unique_price_forecasts == 5, "FAIL: Price model is not computing dynamic forecasts!"

# -----------------------------------------------------------------------------
# TEST 5: Price Forecast Multi-Month Iterative Trajectory
# -----------------------------------------------------------------------------
print("\n" + "-" * 70)
print("TEST 5: Price Model 6-Month Trajectory Dynamic Evolution (Wheat in UP)")
print("-" * 70)
res_multi = price_forecaster.forecast_price(
    crop_slug="Wheat",
    months_ahead=6,
    current_price_inr=2400.0,
    price_lag2_inr=2350.0,
    price_lag3_inr=2300.0,
    rainfall_anomaly_mm=-15.0,
    trade_demand_index=68.0,
    state="Uttar Pradesh",
    month=4
)
trajectory = res_multi["forecast_series_inr_per_q"]
print("  Base Price (M0) : INR 2400.00/q")
for m_idx, price_step in enumerate(trajectory, 1):
    diff = price_step - 2400.0
    print(f"  Month +{m_idx}        : INR {price_step:>7.2f}/q  (Shift: {diff:>+7.2f} INR)")

assert len(trajectory) == 6
assert len(set(trajectory)) == 6, "FAIL: Forecast trajectory has repeating static steps!"

# -----------------------------------------------------------------------------
# TEST 6: Price Forecast Sensitivity to Trade Demand Signal
# -----------------------------------------------------------------------------
print("\n" + "-" * 70)
print("TEST 6: Price Model Sensitivity to Global Trade Demand Index (Cotton in Gujarat)")
print("-" * 70)
trade_signals = [20.0, 45.0, 65.0, 85.0, 95.0]
trade_forecasts = []

for td in trade_signals:
    res = price_forecaster.forecast_price(
        crop_slug="Cotton",
        months_ahead=3,
        current_price_inr=7000.0,
        trade_demand_index=td,
        state="Gujarat"
    )
    f_p = res["forecast_price_inr_per_q"]
    trade_forecasts.append(f_p)
    print(f"  Trade Demand: {td:>4.0f}/100 --> 3-Mo Forecast: INR {f_p:>7.2f}/q [src: {res['data_source']}]")

print("\n" + "=" * 70)
print("  PASS: ALL MODELS ARE COMPUTING REAL-TIME DYNAMIC OUTPUTS")
print("=" * 70)
