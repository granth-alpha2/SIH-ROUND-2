"""
AgriProfit ML — Fertilizer & Nutrient Recommendation Model
============================================================
Loads the trained Random Forest classifier & multi-output regressor artifact
and serves predictions for nutrient deficiency class, priority nutrient,
and recommended fertilizer doses (Urea, DAP, MOP, SSP, Zinc Sulphate).
"""

import os
import joblib
import pandas as pd
import warnings
from ..utils.config import FERTILIZER_MODEL_PATH

warnings.filterwarnings("ignore")

class FertilizerPredictionModel:
    def __init__(self):
        self._artifact = None
        self._model_version = "v1.0-fallback"
        self._load_artifact()

    def _load_artifact(self):
        path = str(FERTILIZER_MODEL_PATH)
        if os.path.exists(path):
            try:
                self._artifact = joblib.load(path)
                self._model_version = self._artifact.get("version", "v1.0-rf-trained")
            except Exception as e:
                print(f"[FertilizerModel] WARNING: Failed to load artifact ({e}).")
                self._artifact = None

    @property
    def is_trained(self) -> bool:
        return self._artifact is not None

    def predict_fertilizer(
        self,
        crop_name: str,
        ph: float = 7.2,
        ec_ds_m: float = 0.8,
        organic_carbon_pct: float = 0.55,
        available_n_kg_ha: float = 240.0,
        available_p_kg_ha: float = 14.0,
        available_k_kg_ha: float = 180.0,
        sulphur_ppm: float = 12.0,
        zinc_ppm: float = 0.8,
        iron_ppm: float = 6.0,
        soil_texture: str = "Loam",
        layer_number: int = 1,
    ) -> dict:
        if self._artifact is not None:
            return self._predict_trained(
                crop_name, ph, ec_ds_m, organic_carbon_pct,
                available_n_kg_ha, available_p_kg_ha, available_k_kg_ha,
                sulphur_ppm, zinc_ppm, iron_ppm, soil_texture, layer_number
            )
        return self._predict_fallback(
            crop_name, ph, ec_ds_m, organic_carbon_pct,
            available_n_kg_ha, available_p_kg_ha, available_k_kg_ha,
            sulphur_ppm, zinc_ppm, iron_ppm, soil_texture, layer_number
        )

    def _predict_trained(
        self,
        crop_name: str, ph: float, ec_ds_m: float, organic_carbon_pct: float,
        available_n_kg_ha: float, available_p_kg_ha: float, available_k_kg_ha: float,
        sulphur_ppm: float, zinc_ppm: float, iron_ppm: float, soil_texture: str, layer_number: int
    ) -> dict:
        clf = self._artifact["priority_classifier"]
        reg = self._artifact["dosage_regressor"]

        input_df = pd.DataFrame([{
            "crop_name": crop_name,
            "layer_number": layer_number,
            "ph": ph,
            "ec_ds_m": ec_ds_m,
            "organic_carbon_pct": organic_carbon_pct,
            "available_n_kg_ha": available_n_kg_ha,
            "available_p_kg_ha": available_p_kg_ha,
            "available_k_kg_ha": available_k_kg_ha,
            "sulphur_ppm": sulphur_ppm,
            "zinc_ppm": zinc_ppm,
            "iron_ppm": iron_ppm,
            "soil_texture": soil_texture,
        }])

        priority = str(clf.predict(input_df)[0])
        dosages = reg.predict(input_df)[0]

        # Classify N, P, K status
        n_status = "Low" if available_n_kg_ha < 280 else ("Medium" if available_n_kg_ha <= 560 else "High")
        p_status = "Low" if available_p_kg_ha < 10.0 else ("Medium" if available_p_kg_ha <= 25.0 else "High")
        k_status = "Low" if available_k_kg_ha < 145.0 else ("Medium" if available_k_kg_ha <= 336.0 else "High")

        rec_urea = max(0.0, round(float(dosages[0]), 1))
        rec_dap = max(0.0, round(float(dosages[1]), 1))
        rec_mop = max(0.0, round(float(dosages[2]), 1))
        rec_ssp = max(0.0, round(float(dosages[3]), 1))
        rec_zinc = max(0.0, round(float(dosages[4]), 1))

        # Strict no over-fertilization constraint
        if p_status == "High":
            rec_dap = 0.0
            rec_ssp = 0.0
        if k_status == "High":
            rec_mop = 0.0

        return {
            "crop": crop_name,
            "is_ml_predicted": True,
            "model_version": self._model_version,
            "provenance": self._artifact.get("provenance", "ICAR-IISS Standard Ratings"),
            "n_status": n_status,
            "p_status": p_status,
            "k_status": k_status,
            "priority_nutrient": priority,
            "recommended_dosages_kg_per_acre": {
                "urea": rec_urea,
                "dap": rec_dap,
                "mop": rec_mop,
                "ssp": rec_ssp,
                "zinc_sulphate": rec_zinc
            },
            "advisory_flags": {
                "high_salinity": ec_ds_m > 1.8,
                "alkaline_ph": ph > 7.8,
                "acidic_ph": ph < 6.2,
                "low_organic_carbon": organic_carbon_pct < 0.5
            }
        }

    def _predict_fallback(
        self,
        crop_name: str, ph: float, ec_ds_m: float, organic_carbon_pct: float,
        available_n_kg_ha: float, available_p_kg_ha: float, available_k_kg_ha: float,
        sulphur_ppm: float, zinc_ppm: float, iron_ppm: float, soil_texture: str, layer_number: int
    ) -> dict:
        n_status = "Low" if available_n_kg_ha < 280 else ("Medium" if available_n_kg_ha <= 560 else "High")
        p_status = "Low" if available_p_kg_ha < 10.0 else ("Medium" if available_p_kg_ha <= 25.0 else "High")
        k_status = "Low" if available_k_kg_ha < 145.0 else ("Medium" if available_k_kg_ha <= 336.0 else "High")

        return {
            "crop": crop_name,
            "is_ml_predicted": False,
            "model_version": "v1.0-deterministic-fallback",
            "provenance": "ICAR Standard Ratings",
            "n_status": n_status,
            "p_status": p_status,
            "k_status": k_status,
            "priority_nutrient": "Nitrogen" if n_status == "Low" else "Balanced",
            "recommended_dosages_kg_per_acre": {
                "urea": 90.0 if n_status == "Low" else (65.0 if n_status == "Medium" else 30.0),
                "dap": 55.0 if p_status == "Low" else (35.0 if p_status == "Medium" else 0.0),
                "mop": 30.0 if k_status == "Low" else (15.0 if k_status == "Medium" else 0.0),
                "ssp": 0.0,
                "zinc_sulphate": 10.0 if zinc_ppm < 0.6 else 0.0
            },
            "advisory_flags": {
                "high_salinity": ec_ds_m > 1.8,
                "alkaline_ph": ph > 7.8,
                "acidic_ph": ph < 6.2,
                "low_organic_carbon": organic_carbon_pct < 0.5
            }
        }

fertilizer_model = FertilizerPredictionModel()
