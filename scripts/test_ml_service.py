import sys
sys.path.insert(0, 'apps/ml')
from src.models.yield_model import yield_model
from src.forecasting.price_forecaster import price_forecaster

print("=== Testing ML Microservice Imports & Predictions ===\n")
print("YieldModel (wheat, 180mm rain, pH 7.2):")
print(yield_model.predict_yield('wheat', 180.0, 7.2))

print("\nPriceForecaster (mustard, 4 months ahead):")
print(price_forecaster.forecast_price('mustard', 4))

print("\n--- Predictions for all crops ---")
crops = ['wheat', 'mustard', 'chickpea', 'maize', 'cotton', 'paddy', 'soybean', 'potato', 'onion']
for crop in crops:
    y = yield_model.predict_yield(crop)
    p = price_forecaster.forecast_price(crop, 3)
    yield_val = y["predicted_yield_quintals_per_acre"]
    price_val = p["forecast_price_inr_per_q"]
    print(f"[{crop}]  yield={yield_val} q/ac  price=INR {price_val}/q")

print("\n[PASS] All ML imports and predictions completed successfully.")

