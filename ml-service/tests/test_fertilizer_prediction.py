"""
Unit tests for AgriProfit ML Fertilizer Recommendation Model
"""

import sys
from pathlib import Path

# Ensure ml-service root is in sys.path
_ml_service_dir = Path(__file__).resolve().parent.parent
if str(_ml_service_dir) not in sys.path:
    sys.path.insert(0, str(_ml_service_dir))

try:
    from app.models.fertilizer_model import fertilizer_model
except ImportError:
    from ml_service.app.models.fertilizer_model import fertilizer_model


def test_fertilizer_prediction_basic():
    res = fertilizer_model.predict_fertilizer(
        crop_name="Wheat",
        ph=7.2,
        ec_ds_m=0.8,
        organic_carbon_pct=0.55,
        available_n_kg_ha=210.0, # Low N
        available_p_kg_ha=14.0,  # Medium P
        available_k_kg_ha=180.0, # Medium K
        soil_texture="Loam",
        layer_number=1,
    )

    assert res["crop"] == "Wheat"
    assert res["n_status"] == "Low"
    assert res["recommended_dosages_kg_per_acre"]["urea"] > 0
    assert "priority_nutrient" in res
    assert "advisory_flags" in res
    print(f"[PASS] Basic Wheat prediction: N status={res['n_status']}, Priority={res['priority_nutrient']}, Urea={res['recommended_dosages_kg_per_acre']['urea']} kg/acre")


def test_no_overfertilization_high_nutrients():
    # If P and K are very high, recommended DAP and MOP should be 0.0
    res = fertilizer_model.predict_fertilizer(
        crop_name="Wheat",
        ph=7.4,
        ec_ds_m=0.7,
        organic_carbon_pct=0.85,
        available_n_kg_ha=450.0, # Medium N
        available_p_kg_ha=55.0,  # High P
        available_k_kg_ha=380.0, # High K
        soil_texture="Clay loam",
        layer_number=1,
    )

    assert res["p_status"] == "High"
    assert res["k_status"] == "High"
    assert res["recommended_dosages_kg_per_acre"]["dap"] == 0.0
    assert res["recommended_dosages_kg_per_acre"]["mop"] == 0.0
    print("[PASS] Strict No Over-Fertilization verified: High P & K yielded 0 kg DAP and 0 kg MOP.")


def test_salinity_and_alkalinity_flags():
    res = fertilizer_model.predict_fertilizer(
        crop_name="Mustard",
        ph=8.4,    # Alkaline
        ec_ds_m=2.4, # High salinity
        organic_carbon_pct=0.35, # Low OC
        available_n_kg_ha=180.0,
        available_p_kg_ha=8.0,
        available_k_kg_ha=120.0,
        soil_texture="Sandy loam",
        layer_number=1,
    )

    assert res["advisory_flags"]["high_salinity"] is True
    assert res["advisory_flags"]["alkaline_ph"] is True
    assert res["advisory_flags"]["low_organic_carbon"] is True
    print("[PASS] Salinity and alkalinity flags correctly detected.")


if __name__ == "__main__":
    test_fertilizer_prediction_basic()
    test_no_overfertilization_high_nutrients()
    test_salinity_and_alkalinity_flags()
    print("All fertilizer ML unit tests passed successfully!")
