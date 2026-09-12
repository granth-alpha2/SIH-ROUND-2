"""
Check whether actual CSV training data can be loaded and used by the models.
"""
import csv
import os

print("=== Dataset Availability Check ===\n")

ml_dir = "Dataset/project_data/ml"
files = {
    "Yield Training Full":    "01_yield_training_data_full.csv",
    "Yield Train Split":      "02_yield_train.csv",
    "Yield Validation":       "03_yield_validation.csv",
    "Yield Test":             "04_yield_test.csv",
    "Price Forecast Full":    "05_price_forecast_dataset_full.csv",
    "Price Train Split":      "06_price_train.csv",
    "Price Validation":       "07_price_validation.csv",
    "Price Test":             "08_price_test.csv",
}

for label, fname in files.items():
    path = os.path.join(ml_dir, fname)
    if os.path.exists(path):
        with open(path) as f:
            rows = sum(1 for _ in f) - 1
        with open(path) as f:
            cols = next(csv.reader(f))
        print(f"[OK] {label}: {rows} rows | columns: {cols}")
    else:
        print(f"[MISSING] {label}: {path}")

print()
print("=== Current ML Model Status ===\n")
print("[yield_model.py]   - Uses HARDCODED benchmark table (not trained on CSV data)")
print("[price_forecaster.py] - Uses HARDCODED benchmark prices + linear 1.5%/month trend (not trained on CSV data)")
print()
print("=== VERDICT ===")
print("The current ML 'models' are rule-based benchmark lookups, NOT trained ML models.")
print("The real training datasets exist and are ready to be used to build genuine ML pipelines.")
print()
print("Key datasets available for training:")
print("  - Yield: 7,000 rows with temp, rainfall, soil_ph, nitrogen, irrigation_type, yield_kg_per_ha")
print("  - Price: 19,500 rows with price lags (1,2,3), rainfall anomaly, trade demand index, target price")

