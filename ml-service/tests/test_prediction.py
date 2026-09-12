"""
Unit tests for AgriProfit ML Models
"""

import sys
from pathlib import Path

# Ensure ml-service root is in sys.path
_ml_service_dir = Path(__file__).resolve().parent.parent
if str(_ml_service_dir) not in sys.path:
    sys.path.insert(0, str(_ml_service_dir))

try:
    from app.models.yield_model import yield_model
    from app.models.price_model import price_forecaster
except ImportError:
    from ml_service.app.models.yield_model import yield_model
    from ml_service.app.models.price_model import price_forecaster


def test_yield_prediction_basic():
    res = yield_model.predict_yield(
        crop_slug="wheat",
        rainfall_mm=160.0,
        soil_ph=7.2,
        nitrogen_kg_per_ha=120.0,
        avg_temp_c=22.0,
        state="Punjab",
        irrigation_type="Sprinkler",
    )
    assert res["predicted_yield_q_per_acre"] > 0
    assert res["predicted_yield_q_per_ha"] > 0
    assert res["crop"].lower() == "wheat"
    assert len(res["confidence_interval_q_per_acre"]) == 2


def test_price_forecast_basic():
    res = price_forecaster.forecast_price(
        crop_slug="wheat",
        months_ahead=3,
        current_price_inr=2380.0,
        state="Punjab",
    )
    assert res["forecasted_price_inr_per_quintal"] > 1000
    assert res["forecast_horizon_months"] == 3
    assert res["price_trend"] in ["bullish", "bearish", "neutral"]


if __name__ == "__main__":
    test_yield_prediction_basic()
    test_price_forecast_basic()
    print("All ML tests passed successfully!")
