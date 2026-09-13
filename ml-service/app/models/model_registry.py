from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from ..utils.config import MODELS_DIR

REGISTRY_PATH = MODELS_DIR / "model_registry.json"

MODEL_REGISTRY = [
    {
        "model_id": "yield_prediction_v2_0_rf",
        "model_name": "AgriProfit Yield Prediction",
        "model_type": "Machine Learning Regression",
        "version": "v2.0-rf-trained",
        "purpose": "Predict expected crop yield from crop, soil, climate, and agronomic conditions.",
        "input_features": [
            "avg_temp_c",
            "total_rainfall_mm",
            "soil_ph",
            "nitrogen_kg_per_ha",
            "crop_name_enc",
            "state_enc",
            "irrigation_type_enc",
        ],
        "output_features": [
            "predicted_yield_q_per_acre",
            "predicted_yield_q_per_ha",
            "confidence_interval_q_per_acre",
        ],
        "training_dataset": "ICAR crop yield dataset (7,000 rows)",
        "training_period": "Not explicitly recorded in artifact",
        "evaluation_metric": "R² = 0.9601 on held-out test split",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "status": "trained",
        "retraining_policy": {
            "auto_retrain_on_farmer_submission": False,
            "data_origin_filter": "LIVE",
            "quality_gate_required": True,
            "trigger": "manual_approval_or_scheduled_batch",
            "pipeline": [
                "REAL FARM DATA",
                "VALIDATION",
                "DATABASE",
                "DATASET EXPORT",
                "DATA QUALITY CHECK",
                "TRAINING DATASET",
                "MODEL TRAINING",
                "MODEL EVALUATION",
                "MODEL VERSION",
                "MODEL REGISTRY",
                "DEPLOYMENT",
                "INFERENCE",
            ],
            "notes": "Production models are not retrained automatically on every farmer submission. The system prepares a controlled retraining queue with validation, data-quality checks, and model evaluation before any deployment.",
        },
    },
    {
        "model_id": "price_forecast_ensemble_v2_0",
        "model_name": "AgriProfit Mandi Price Forecast",
        "model_type": "Machine Learning Regression",
        "version": "v2.0-ensemble-trained",
        "purpose": "Predict future mandi price using recent price history, rainfall anomaly, and demand signals.",
        "input_features": [
            "price_lag1_inr",
            "price_lag2_inr",
            "price_lag3_inr",
            "rainfall_anomaly_mm",
            "trade_demand_index",
            "month_sin",
            "month_cos",
            "price_momentum",
            "log_lag1",
            "log_lag2",
            "log_lag3",
            "crop_name_enc",
            "state_enc",
        ],
        "output_features": [
            "forecasted_price_inr_per_quintal",
            "forecast_series_inr_per_q",
            "confidence_interval",
            "price_change_pct",
        ],
        "training_dataset": "APMC/mandi time-series dataset (19,500 rows)",
        "training_period": "Not explicitly recorded in artifact",
        "evaluation_metric": "R² = 0.9733 on held-out test split; MAPE = 3.79%",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "status": "trained",
        "retraining_policy": {
            "auto_retrain_on_farmer_submission": False,
            "data_origin_filter": "LIVE",
            "quality_gate_required": True,
            "trigger": "manual_approval_or_scheduled_batch",
            "pipeline": [
                "REAL FARM DATA",
                "VALIDATION",
                "DATABASE",
                "DATASET EXPORT",
                "DATA QUALITY CHECK",
                "TRAINING DATASET",
                "MODEL TRAINING",
                "MODEL EVALUATION",
                "MODEL VERSION",
                "MODEL REGISTRY",
                "DEPLOYMENT",
                "INFERENCE",
            ],
            "notes": "Production models are not retrained automatically on every farmer submission. The system prepares a controlled retraining queue with validation, data-quality checks, and model evaluation before any deployment.",
        },
    },
]


def ensure_registry_file() -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REGISTRY_PATH.write_text(json.dumps(MODEL_REGISTRY, indent=2), encoding="utf-8")


ensure_registry_file()
