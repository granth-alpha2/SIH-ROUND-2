from fastapi import APIRouter, HTTPException
from ..schemas.prediction import YieldPredictionRequest, YieldPredictionResponse
from ...models.yield_model import yield_model

router = APIRouter(prefix="/predict", tags=["Yield Prediction"])


@router.post("/yield", response_model=YieldPredictionResponse)
def predict_crop_yield(req: YieldPredictionRequest):
    try:
        result = yield_model.predict_yield(
            crop_slug=req.crop,
            rainfall_mm=req.rainfall_mm,
            soil_ph=req.soil_ph,
            nitrogen_kg_per_ha=req.nitrogen_kg_per_ha,
            avg_temp_c=req.avg_temp_c,
            state=req.state,
            irrigation_type=req.irrigation_type,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Yield prediction error: {str(e)}")

