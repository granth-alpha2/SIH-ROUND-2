"""
Unit tests for AgriProfit ML Models
"""

import sys
from pathlib import Path

import pytest

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
    assert res["actual_yield_q_per_acre"] is None
    assert res["observed_yield_q_per_acre"] is None
    assert res["crop"].lower() == "wheat"
    assert len(res["confidence_interval_q_per_acre"]) == 2


def test_yield_prediction_keeps_actual_separate_from_prediction():
    res = yield_model.predict_yield(
        crop_slug="wheat",
        rainfall_mm=160.0,
        soil_ph=7.2,
        nitrogen_kg_per_ha=120.0,
        avg_temp_c=22.0,
        state="Punjab",
        irrigation_type="Sprinkler",
        actual_yield_q_per_acre=33.7,
    )
    assert res["predicted_yield_q_per_acre"] > 0
    assert res["actual_yield_q_per_acre"] == 33.7
    assert res["observed_yield_q_per_acre"] == 33.7
    assert res["predicted_yield_q_per_acre"] != res["actual_yield_q_per_acre"]


def test_price_forecast_basic():
    res = price_forecaster.forecast_price(
        crop_slug="wheat",
        months_ahead=3,
        current_price_inr=2380.0,
        state="Punjab",
    )
    assert res["forecasted_price_inr_per_quintal"] > 1000
    assert res["actual_price_inr_per_quintal"] is None
    assert res["observed_price_inr_per_quintal"] is None
    assert res["forecast_horizon_months"] == 3
    assert res["price_trend"] in ["bullish", "bearish", "neutral"]


def test_price_forecast_keeps_actual_separate_from_prediction():
    res = price_forecaster.forecast_price(
        crop_slug="wheat",
        months_ahead=3,
        current_price_inr=2380.0,
        state="Punjab",
        actual_price_inr_per_quintal=2425.0,
    )
    assert res["forecasted_price_inr_per_quintal"] > 1000
    assert res["actual_price_inr_per_quintal"] == 2425.0
    assert res["observed_price_inr_per_quintal"] == 2425.0
    assert res["forecasted_price_inr_per_quintal"] != res["actual_price_inr_per_quintal"]


def test_models_info_exposes_valid_performance_summary():
    from app.api.routes.health import get_models_info

    info = get_models_info()

    yield_summary = info["yield_model"]["model_performance"]
    assert yield_summary["dataset_observations"] == 700
    assert yield_summary["metrics"]["mae"] == pytest.approx(683.33)
    assert yield_summary["metrics"]["rmse"] == pytest.approx(1309.38)
    assert yield_summary["last_evaluated"]

    price_summary = info["price_model"]["model_performance"]
    assert price_summary["dataset_observations"] == 6000
    assert price_summary["metrics"]["mae"] == pytest.approx(167.63)
    assert price_summary["metrics"]["rmse"] == pytest.approx(219.36)
    assert price_summary["metrics"]["mape"] == pytest.approx(3.79)
    assert price_summary["last_evaluated"]


if __name__ == "__main__":
    test_yield_prediction_basic()
    test_price_forecast_basic()
    print("All ML tests passed successfully!")
