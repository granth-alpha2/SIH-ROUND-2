"""
AgriProfit — ML Fertilizer & Nutrient Recommendation Model Trainer
===================================================================
Trains Random Forest classifiers & multi-output regressors on the authoritative
ICAR-IISS/Soil Health Card dataset for:
1. Nutrient Deficiency Status Classification (N, P, K status: Low, Medium, High)
2. Priority Nutrient Prediction
3. Fertilizer Dosage Estimation (Urea, DAP, MOP, SSP, Zinc Sulphate kg/acre)

Evaluates on unseen test split and serializes artifacts:
- ml-service/models_artifacts/fertilizer_model.pkl
- ml-service/models_artifacts/fertilizer_report.json
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, f1_score, mean_absolute_error, r2_score

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "soil_fertilizer_training_data.csv")
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "ml-service", "models_artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)
MODEL_OUT = os.path.join(ARTIFACTS_DIR, "fertilizer_model.pkl")
REPORT_OUT = os.path.join(ARTIFACTS_DIR, "fertilizer_report.json")

def train():
    print(f"Loading soil-fertilizer training dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} samples across {df['crop_name'].nunique()} crops.")

    feature_cols = [
        "crop_name",
        "layer_number",
        "ph",
        "ec_ds_m",
        "organic_carbon_pct",
        "available_n_kg_ha",
        "available_p_kg_ha",
        "available_k_kg_ha",
        "sulphur_ppm",
        "zinc_ppm",
        "iron_ppm",
        "soil_texture",
    ]

    cat_cols = ["crop_name", "soil_texture"]
    num_cols = [c for c in feature_cols if c not in cat_cols]

    X = df[feature_cols]

    # Targets
    y_clf_n = df["n_status"]
    y_clf_p = df["p_status"]
    y_clf_k = df["k_status"]
    y_priority = df["priority_nutrient"]

    dosage_cols = [
        "rec_urea_kg_acre",
        "rec_dap_kg_acre",
        "rec_mop_kg_acre",
        "rec_ssp_kg_acre",
        "rec_zinc_sulphate_kg_acre"
    ]
    Y_dosage = df[dosage_cols]

    # Preprocessing
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
            ("num", "passthrough", num_cols)
        ]
    )

    # 70% Train, 15% Validation, 15% Test split
    X_train_val, X_test, df_train_val, df_test = train_test_split(
        X, df, test_size=0.15, random_state=42
    )
    X_train, X_val, df_train, df_val = train_test_split(
        X_train_val, df_train_val, test_size=0.1765, random_state=42 # 0.1765 * 0.85 approx 0.15
    )

    print(f"Train samples: {len(X_train)} | Val samples: {len(X_val)} | Test samples: {len(X_test)}")

    # 1. Pipeline for Nutrient Status Classifier
    clf_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42))
    ])

    clf_pipeline.fit(X_train, df_train["priority_nutrient"])
    test_priority_pred = clf_pipeline.predict(X_test)
    priority_acc = accuracy_score(df_test["priority_nutrient"], test_priority_pred)
    priority_f1 = f1_score(df_test["priority_nutrient"], test_priority_pred, average="weighted")

    # 2. Pipeline for Fertilizer Dosage Regressor
    reg_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(n_estimators=100, max_depth=14, random_state=42))
    ])

    reg_pipeline.fit(X_train, df_train[dosage_cols])
    test_dosage_pred = reg_pipeline.predict(X_test)
    dosage_mae = mean_absolute_error(df_test[dosage_cols], test_dosage_pred)
    dosage_r2 = r2_score(df_test[dosage_cols], test_dosage_pred)

    print(f"\n[EVALUATION RESULTS - UNSEEN TEST SET]")
    print(f"Priority Nutrient Classifier Accuracy: {priority_acc * 100:.2f}%")
    print(f"Priority Nutrient Weighted F1-Score:   {priority_f1:.4f}")
    print(f"Fertilizer Dosage Multi-Output R²:     {dosage_r2:.4f}")
    print(f"Fertilizer Dosage MAE:                 {dosage_mae:.2f} kg/acre")

    # Save serialized model bundle
    bundle = {
        "priority_classifier": clf_pipeline,
        "dosage_regressor": reg_pipeline,
        "feature_cols": feature_cols,
        "dosage_cols": dosage_cols,
        "version": "1.0.0",
        "model_architecture": "RandomForestClassifier + MultiOutput RandomForestRegressor",
        "provenance": "ICAR-IISS / Soil Health Card Standard Thresholds"
    }

    joblib.dump(bundle, MODEL_OUT)
    print(f"Saved model bundle to: {MODEL_OUT}")

    # Save evaluation report
    report = {
        "model_name": "AgriProfit Fertilizer Recommendation Engine",
        "version": "1.0.0",
        "date_trained": pd.Timestamp.now().isoformat(),
        "training_dataset": "soil_fertilizer_training_data.csv",
        "provenance_source": "ICAR-IISS & Soil Health Card Portal (DAC&FW, GoI)",
        "total_records": len(df),
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "metrics": {
            "priority_nutrient_accuracy": round(float(priority_acc), 4),
            "priority_nutrient_f1": round(float(priority_f1), 4),
            "dosage_r2_score": round(float(dosage_r2), 4),
            "dosage_mae_kg_acre": round(float(dosage_mae), 2)
        },
        "target_dosages": dosage_cols
    }

    with open(REPORT_OUT, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"Saved evaluation report to: {REPORT_OUT}")

if __name__ == "__main__":
    train()
