import os
import sys
import warnings

warnings.filterwarnings("ignore")

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from apps.ml.src.models.yield_model import yield_model

cases = [
    ("Wheat",            180.0, 7.2, 120.0, 2100.0, "Punjab",         "Sprinkler"),
    ("Rice (Paddy)",     800.0, 6.8, 200.0, 2500.0, "West Bengal",    "Flood"),
    ("Sugarcane",       1200.0, 7.0, 250.0, 2800.0, "Maharashtra",    "Drip"),
    ("Potato",           250.0, 6.5, 150.0, 2200.0, "Uttar Pradesh",  "Sprinkler"),
    ("Cotton",           200.0, 7.0, 180.0, 2900.0, "Gujarat",        "Drip"),
    ("Mustard",          120.0, 7.5, 100.0, 2100.0, "Rajasthan",      "Rainfed"),
    ("Onion",            400.0, 6.8, 160.0, 2700.0, "Maharashtra",    "Drip"),
    ("Chickpea (Gram)",  100.0, 7.2,  80.0, 2300.0, "Madhya Pradesh", "Rainfed"),
    ("Maize",            350.0, 6.9, 160.0, 2600.0, "Karnataka",      "Rainfed"),
]

print("CROP                   | YIELD (q/ac) | YIELD (kg/ha) | SOURCE")
print("-" * 72)
for crop, rain, ph, nitro, temp, state, irr in cases:
    r = yield_model.predict_yield(crop, rain, ph, nitro, temp, state, irr)
    qac = r["predicted_yield_quintals_per_acre"]
    kha = r["predicted_yield_kg_per_ha"]
    src = r["data_source"]
    matched = r.get("matched_crop_name", "?")
    print(f"{crop:<23}| {qac:>12.2f} | {kha:>13.1f} | {src} ({matched})")

print()
print("All yield predictions use TRAINED model data_source =", all(
    yield_model.predict_yield(c, 180, 7.2)["data_source"] == "trained"
    for c, *_ in cases
))
