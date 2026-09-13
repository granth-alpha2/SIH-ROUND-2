import json
from pathlib import Path
import sys

_ml_service_dir = Path(__file__).resolve().parent.parent
if str(_ml_service_dir) not in sys.path:
    sys.path.insert(0, str(_ml_service_dir))

from app.models.model_registry import MODEL_REGISTRY


def test_model_registry_metadata_exists():
    assert isinstance(MODEL_REGISTRY, list)
    assert len(MODEL_REGISTRY) >= 2

    yield_model = next((m for m in MODEL_REGISTRY if m["model_id"] == "yield_prediction_v2_0_rf"), None)
    price_model = next((m for m in MODEL_REGISTRY if m["model_id"] == "price_forecast_ensemble_v2_0"), None)

    assert yield_model is not None
    assert yield_model["model_name"] == "AgriProfit Yield Prediction"
    assert yield_model["model_type"] == "Machine Learning Regression"
    assert yield_model["version"] == "v2.0-rf-trained"
    assert "Predict expected crop yield" in yield_model["purpose"]
    assert isinstance(yield_model["input_features"], list)
    assert isinstance(yield_model["output_features"], list)
    assert yield_model["status"] == "trained"

    assert price_model is not None
    assert price_model["model_name"] == "AgriProfit Mandi Price Forecast"
    assert price_model["model_type"] == "Machine Learning Regression"
    assert price_model["version"] == "v2.0-ensemble-trained"
    assert "Predict future mandi price" in price_model["purpose"]
    assert isinstance(price_model["input_features"], list)
    assert isinstance(price_model["output_features"], list)
    assert price_model["status"] == "trained"


def test_registry_file_is_persisted_json():
    registry_path = Path(__file__).resolve().parent.parent / "models_artifacts" / "model_registry.json"
    assert registry_path.exists()
    payload = json.loads(registry_path.read_text(encoding="utf-8"))
    assert isinstance(payload, list)
    assert any(item["model_id"] == "yield_prediction_v2_0_rf" for item in payload)
