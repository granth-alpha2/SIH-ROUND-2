from datetime import datetime, timezone
import json
from typing import Any

from fastapi import APIRouter

from ...models.yield_model import yield_model
from ...models.price_model import price_forecaster
from ...models.model_registry import MODEL_REGISTRY
from ...utils.config import YIELD_REPORT_PATH, PRICE_REPORT_PATH, PORT

router = APIRouter(tags=["Health & Status"])


def _safe_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        converted = float(value)
        if converted != converted or converted in (float("inf"), float("-inf")):
            return None
        return converted
    except (TypeError, ValueError):
        return None


def _resolve_model_performance(report: dict[str, Any]) -> dict[str, Any]:
    metrics = report.get("metrics") or []
    candidates = []
    if isinstance(metrics, list):
        candidates = [m for m in metrics if isinstance(m, dict)]

    test_metric = None
    for metric in candidates:
        split_name = str(metric.get("split", "")).upper()
        if split_name == "TEST":
            test_metric = metric
            break
    if test_metric is None and candidates:
        test_metric = candidates[0]

    dataset_observations = report.get("test_rows")
    if dataset_observations is None:
        dataset_observations = report.get("validation_rows")
    if dataset_observations is None:
        dataset_observations = report.get("training_rows")
    dataset_observations = int(dataset_observations) if str(dataset_observations).strip() not in ("", "None") else 0

    metric_values: dict[str, float] = {}
    for metric_name in ("mae_kg_per_ha", "rmse_kg_per_ha", "mape_pct", "mae_inr_per_q", "rmse_inr_per_q", "mae", "rmse", "mape"):
        value = _safe_float(test_metric.get(metric_name)) if test_metric else None
        if value is None:
            continue

        if metric_name in {"mae_kg_per_ha", "mae_inr_per_q", "mae"}:
            metric_values["mae"] = round(value, 2)
        elif metric_name in {"rmse_kg_per_ha", "rmse_inr_per_q", "rmse"}:
            metric_values["rmse"] = round(value, 2)
        elif metric_name in {"mape_pct", "mape"}:
            metric_values["mape"] = round(value, 2)

    if dataset_observations > 0:
        effective_metrics = dict(metric_values)
    else:
        effective_metrics = {}

    last_evaluated = report.get("last_evaluated") or report.get("updated_at") or report.get("generated_at") or datetime.now(timezone.utc).isoformat()

    return {
        "dataset_observations": dataset_observations,
        "metrics": effective_metrics,
        "last_evaluated": last_evaluated,
        "split": (test_metric or {}).get("split", "TEST"),
        "has_valid_metrics": bool(effective_metrics),
    }


@router.get("/health")
def get_health():
    return {
        "status": "HEALTHY",
        "service": "AgriProfit ML Microservice v2.0.0",
        "models": {
            "yield_model": {
                "trained": yield_model.is_trained,
                "version": yield_model._model_version,
                "artifact": "models_artifacts/yield_model.pkl",
                "registry": next((m for m in MODEL_REGISTRY if m["model_id"] == "yield_prediction_v2_0_rf"), None),
            },
            "price_forecaster": {
                "trained": price_forecaster.is_trained,
                "version": price_forecaster._model_version,
                "artifact": "models_artifacts/price_model.pkl",
                "registry": next((m for m in MODEL_REGISTRY if m["model_id"] == "price_forecast_ensemble_v2_0"), None),
            },
        },
        "model_registry": MODEL_REGISTRY,
        "port": PORT,
    }


@router.get("/models/info")
def get_models_info():
    yield_info = {}
    price_info = {}

    if YIELD_REPORT_PATH.exists():
        with open(YIELD_REPORT_PATH) as f:
            yield_info = json.load(f)

    if PRICE_REPORT_PATH.exists():
        with open(PRICE_REPORT_PATH) as f:
            price_info = json.load(f)

    return {
        "service": "AgriProfit ML Microservice",
        "yield_model": {**yield_info, "model_performance": _resolve_model_performance(yield_info)},
        "price_model": {**price_info, "model_performance": _resolve_model_performance(price_info)},
    }

