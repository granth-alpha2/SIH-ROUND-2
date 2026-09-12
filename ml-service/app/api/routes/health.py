from fastapi import APIRouter
import json
from ...models.yield_model import yield_model
from ...models.price_model import price_forecaster
from ...utils.config import YIELD_REPORT_PATH, PRICE_REPORT_PATH, PORT

router = APIRouter(tags=["Health & Status"])


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
            },
            "price_forecaster": {
                "trained": price_forecaster.is_trained,
                "version": price_forecaster._model_version,
                "artifact": "models_artifacts/price_model.pkl",
            },
        },
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
        "yield_model": yield_info,
        "price_model": price_info,
    }

