"""
AgriProfit ML — Mandi Price Forecaster (Ensemble Ridge+GBR v2.0)
==================================================================
Loads the trained Ridge+GradientBoosting ensemble artifact and serves
real price forecasts from the 19,500-row APMC/mandi time-series dataset.
"""

import os
import pickle
import math
import warnings
import datetime
from ..utils.config import PRICE_MODEL_PATH

warnings.filterwarnings("ignore")

_BENCHMARK_PRICES = {
    "rice (paddy)": 2200.0, "wheat": 2380.0, "mustard": 5650.0,
    "chickpea (gram)": 5800.0, "maize": 2150.0, "cotton": 6900.0,
    "soybean": 4650.0, "onion": 1850.0, "potato": 1250.0,
    "chickpea": 5800.0, "paddy": 2200.0, "groundnut": 5500.0,
    "barley": 1900.0,
}


class PriceForecaster:
    def __init__(self):
        self._artifact = None
        self._model_version = "v1.0-fallback-trend"
        self._load_artifact()

    def _load_artifact(self):
        path = str(PRICE_MODEL_PATH)
        if os.path.exists(path):
            try:
                with open(path, "rb") as f:
                    self._artifact = pickle.load(f)
                self._model_version = self._artifact.get("model_version", "v2.0-ensemble-trained")
            except Exception as e:
                print(f"[PriceForecaster] WARNING: Failed to load artifact ({e}).")
                self._artifact = None

    @property
    def is_trained(self) -> bool:
        return self._artifact is not None

    def forecast_price(
        self,
        crop_slug: str,
        months_ahead: int = 3,
        current_price_inr: float | None = None,
        price_lag2_inr: float | None = None,
        price_lag3_inr: float | None = None,
        rainfall_anomaly_mm: float = 0.0,
        trade_demand_index: float = 55.0,
        state: str = "Punjab",
        month: int | None = None,
    ) -> dict:
        if month is None:
            month = datetime.datetime.now().month

        slug_lower = crop_slug.lower().strip()
        base_price = current_price_inr if current_price_inr is not None \
            else _BENCHMARK_PRICES.get(slug_lower, 2200.0)

        lag2 = price_lag2_inr if price_lag2_inr is not None else round(base_price * 0.98, 2)
        lag3 = price_lag3_inr if price_lag3_inr is not None else round(base_price * 0.96, 2)

        if self._artifact is not None:
            return self._forecast_trained(
                crop_slug, base_price, lag2, lag3,
                months_ahead, month, rainfall_anomaly_mm,
                trade_demand_index, state
            )
        return self._forecast_fallback(crop_slug, base_price, months_ahead)

    def _forecast_trained(
        self, crop_slug, base_price, lag2, lag3,
        months_ahead, current_month, rainfall_anomaly,
        demand_index, state
    ) -> dict:
        import numpy as np

        artifact = self._artifact
        encoders = artifact.get("encoders", {})

        crop_le = encoders.get("crop_name")
        crop_classes = list(crop_le.classes_) if crop_le else []
        matched_crop = next(
            (c for c in crop_classes if c.lower() == crop_slug.lower().strip()),
            crop_classes[0] if crop_classes else crop_slug.title()
        )

        def encode_safe(le, val):
            if not le:
                return 0
            classes = list(le.classes_)
            if val in classes:
                return int(le.transform([val])[0])
            for c in classes:
                if str(c).lower() == str(val).lower():
                    return int(le.transform([c])[0])
            return 0

        crop_enc = encode_safe(encoders.get("crop_name"), matched_crop)
        state_enc = encode_safe(encoders.get("state"), state)

        future_month = ((current_month - 1 + months_ahead) % 12) + 1
        month_sin = math.sin(2 * math.pi * future_month / 12)
        month_cos = math.cos(2 * math.pi * future_month / 12)

        p_change_1m = (base_price - lag2) / lag2 if lag2 > 0 else 0.0

        feature_values = {
            "price_lag1_inr": float(base_price),
            "price_lag2_inr": float(lag2),
            "price_lag3_inr": float(lag3),
            "rainfall_anomaly_mm": float(rainfall_anomaly),
            "trade_demand_index": float(demand_index),
            "month_sin": float(month_sin),
            "month_cos": float(month_cos),
            "price_momentum": float(p_change_1m),
            "log_lag1": float(math.log(max(1.0, base_price))),
            "log_lag2": float(math.log(max(1.0, lag2))),
            "log_lag3": float(math.log(max(1.0, lag3))),
            "crop_name_enc": crop_enc,
            "state_enc": state_enc,
        }

        cols = artifact.get("feature_names", list(feature_values.keys()))
        X_vec = np.array([[feature_values.get(c, 0.0) for c in cols]])

        ridge_pred = float(artifact["ridge"].predict(X_vec)[0]) if "ridge" in artifact else float(base_price)
        gbr_pred = float(artifact["gbr"].predict(X_vec)[0]) if "gbr" in artifact else float(base_price)

        w_ridge = artifact.get("ridge_weight", 0.5)
        w_gbr = artifact.get("gbr_weight", 0.5)
        ensemble_pred = float(w_ridge * ridge_pred + w_gbr * gbr_pred)

        predicted_price = round(max(100.0, ensemble_pred), 2)
        change_pct = round(((predicted_price - base_price) / base_price) * 100, 2)
        trend = "bullish" if change_pct > 3.0 else "bearish" if change_pct < -3.0 else "neutral"

        ci_pct = 0.05
        ci_lower = round(predicted_price * (1 - ci_pct), 2)
        ci_upper = round(predicted_price * (1 + ci_pct), 2)

        series = [round(base_price + (predicted_price - base_price) * (i / max(1, months_ahead)), 2) for i in range(1, months_ahead + 1)]

        return {
            "crop": matched_crop,
            "crop_slug": crop_slug.lower().strip(),
            "current_price_inr_per_quintal": base_price,
            "current_modal_price_inr_per_q": base_price,
            "forecasted_price_inr_per_quintal": predicted_price,
            "forecast_price_inr_per_q": predicted_price,
            "forecast_horizon_months": months_ahead,
            "forecast_month": future_month,
            "forecast_series_inr_per_q": series,
            "price_change_pct": change_pct,
            "price_trend": trend,
            "trend_direction": trend,
            "confidence_interval": [ci_lower, ci_upper],
            "model_version": self._model_version,
            "is_ml_forecast": True,
            "data_source": "trained",
            "sub_model_preds": {
                "ridge_pred": round(float(ridge_pred), 2),
                "gbr_pred": round(float(gbr_pred), 2),
            },
        }

    def _forecast_fallback(self, crop_slug, base_price, months_ahead) -> dict:
        monthly_growth = 0.008
        future = round(base_price * ((1 + monthly_growth) ** months_ahead), 2)
        change = round(((future - base_price) / base_price) * 100, 2)
        series = [round(base_price * ((1 + monthly_growth) ** i), 2) for i in range(1, months_ahead + 1)]
        return {
            "crop": crop_slug.title(),
            "crop_slug": crop_slug.lower().strip(),
            "current_price_inr_per_quintal": base_price,
            "current_modal_price_inr_per_q": base_price,
            "forecasted_price_inr_per_quintal": future,
            "forecast_price_inr_per_q": future,
            "forecast_horizon_months": months_ahead,
            "forecast_series_inr_per_q": series,
            "price_change_pct": change,
            "price_trend": "neutral",
            "trend_direction": "neutral",
            "confidence_interval": [round(future * 0.93, 2), round(future * 1.07, 2)],
            "model_version": "v1.0-trend-fallback",
            "is_ml_forecast": False,
            "data_source": "fallback",
        }


price_forecaster = PriceForecaster()
