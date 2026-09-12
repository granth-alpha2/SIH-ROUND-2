import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR / "models_artifacts"

YIELD_MODEL_PATH = MODELS_DIR / "yield_model.pkl"
PRICE_MODEL_PATH = MODELS_DIR / "price_model.pkl"
YIELD_REPORT_PATH = MODELS_DIR / "yield_report.json"
PRICE_REPORT_PATH = MODELS_DIR / "price_report.json"

PORT = int(os.environ.get("ML_PORT", 8000))
HOST = os.environ.get("ML_HOST", "0.0.0.0")
DEBUG = os.environ.get("ML_DEBUG", "false").lower() == "true"

