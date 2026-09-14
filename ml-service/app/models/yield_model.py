"""
AgriProfit ML — Crop Yield Prediction Model (Trained RF v2.0)
================================================================
Loads the trained RandomForestRegressor artifact and serves
real predictions based on the 7,000-row ICAR training dataset.
"""

import os
import pickle
import warnings
from ..utils.config import YIELD_MODEL_PATH

warnings.filterwarnings("ignore")

_BENCHMARK_YIELDS = {
    "rice (paddy)": 19.5, "wheat": 14.5, "mustard": 7.8, "chickpea": 6.8,
    "maize": 18.0, "cotton": 8.5, "soybean": 9.2, "onion": 85.0,
    "potato": 95.0, "sugarcane": 320.0, "groundnut": 11.0,
}


class YieldPredictionModel:
    def __init__(self):
        self._artifact = None
        self._model_version = "v1.0-fallback-benchmark"
        self._load_artifact()

    def _load_artifact(self):
        path = str(YIELD_MODEL_PATH)
        if os.path.exists(path):
            try:
                with open(path, "rb") as f:
                    self._artifact = pickle.load(f)
                self._model_version = self._artifact.get("model_version", "v2.0-rf-trained")
            except Exception as e:
                print(f"[YieldModel] WARNING: Failed to load artifact ({e}).")
                self._artifact = None

    @property
    def is_trained(self) -> bool:
        return self._artifact is not None

    def predict_yield(
        self,
        crop_slug: str,
        rainfall_mm: float = 150.0,
        soil_ph: float = 7.2,
        nitrogen_kg_per_ha: float = 120.0,
        avg_temp_c: float = 24.0,
        state: str = "Punjab",
        irrigation_type: str = "Rainfed",
        actual_yield_q_per_acre: float | None = None,
        observed_yield_q_per_acre: float | None = None,
    ) -> dict:
        actual_value = actual_yield_q_per_acre if actual_yield_q_per_acre is not None else observed_yield_q_per_acre
        if self._artifact is not None:
            return self._predict_trained(
                crop_slug, rainfall_mm, soil_ph,
                nitrogen_kg_per_ha, avg_temp_c, state, irrigation_type,
                actual_value
            )
        return self._predict_fallback(crop_slug, rainfall_mm, soil_ph, actual_value)

    def _predict_trained(
        self, crop_slug, rainfall_mm, soil_ph,
        nitrogen_kg_per_ha, avg_temp_c, state, irrigation_type,
        actual_value: float | None = None,
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
        irrig_enc = encode_safe(encoders.get("irrigation_type"), irrigation_type)

        feature_values = {
            "avg_temp_c": float(avg_temp_c),
            "total_rainfall_mm": float(rainfall_mm),
            "soil_ph": float(soil_ph),
            "nitrogen_kg_per_ha": float(nitrogen_kg_per_ha),
            "crop_name_enc": crop_enc,
            "state_enc": state_enc,
            "irrigation_type_enc": irrig_enc,
        }

        cols = artifact.get("feature_names", artifact.get("feature_columns", list(feature_values.keys())))
        X_vec = np.array([[feature_values.get(c, 0.0) for c in cols]])

        model = artifact["model"]
        pred_kg_ha = float(model.predict(X_vec)[0])
        pred_kg_ha = max(50.0, pred_kg_ha)

        q_per_ha = round(pred_kg_ha / 100.0, 2)
        q_per_acre = round(q_per_ha / 2.47105, 2)

        ci_lower = round(max(0.1, q_per_acre * 0.88), 2)
        ci_upper = round(q_per_acre * 1.12, 2)

        return {
            "crop": matched_crop,
            "crop_slug": crop_slug.lower().strip(),
            "predicted_yield_q_per_acre": q_per_acre,
            "predicted_yield_quintals_per_acre": q_per_acre,
            "predicted_yield_q_per_ha": q_per_ha,
            "predicted_yield_kg_per_ha": pred_kg_ha,
            "actual_yield_q_per_acre": actual_value,
            "observed_yield_q_per_acre": actual_value,
            "actual_yield_kg_per_ha": round(actual_value * 100.0, 2) if actual_value is not None else None,
            "confidence_interval_q_per_acre": [ci_lower, ci_upper],
            "model_version": self._model_version,
            "is_ml_predicted": True,
            "data_source": "trained",
            "features_used": feature_values,
        }

    def _predict_fallback(self, crop_slug, rainfall_mm, soil_ph, actual_value: float | None = None) -> dict:
        base = _BENCHMARK_YIELDS.get(crop_slug.lower().strip(), 12.0)
        mult = 1.0
        if rainfall_mm < 100:
            mult *= 0.85
        elif rainfall_mm > 400:
            mult *= 0.92
        if soil_ph < 6.0 or soil_ph > 8.2:
            mult *= 0.90

        est_acre = round(base * mult, 2)
        return {
            "crop": crop_slug.title(),
            "crop_slug": crop_slug.lower().strip(),
            "predicted_yield_q_per_acre": est_acre,
            "predicted_yield_quintals_per_acre": est_acre,
            "predicted_yield_q_per_ha": round(est_acre * 2.47105, 2),
            "predicted_yield_kg_per_ha": round(est_acre * 247.105, 2),
            "actual_yield_q_per_acre": actual_value,
            "observed_yield_q_per_acre": actual_value,
            "actual_yield_kg_per_ha": round(actual_value * 100.0, 2) if actual_value is not None else None,
            "confidence_interval_q_per_acre": [round(est_acre * 0.82, 2), round(est_acre * 1.18, 2)],
            "model_version": "v1.0-benchmark-fallback",
            "is_ml_predicted": False,
            "data_source": "fallback",
        }


yield_model = YieldPredictionModel()
