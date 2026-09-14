from fastapi import APIRouter, HTTPException
from ..schemas.prediction import FertilizerPredictionRequest, FertilizerPredictionResponse
from ...models.fertilizer_model import fertilizer_model

router = APIRouter(prefix="/predict", tags=["Fertilizer Prediction"])


@router.post("/fertilizer", response_model=FertilizerPredictionResponse)
def predict_crop_fertilizer(req: FertilizerPredictionRequest):
    try:
        result = fertilizer_model.predict_fertilizer(
            crop_name=req.crop,
            ph=req.ph,
            ec_ds_m=req.ec_ds_m,
            organic_carbon_pct=req.organic_carbon_pct,
            available_n_kg_ha=req.available_n_kg_ha,
            available_p_kg_ha=req.available_p_kg_ha,
            available_k_kg_ha=req.available_k_kg_ha,
            sulphur_ppm=req.sulphur_ppm,
            zinc_ppm=req.zinc_ppm,
            iron_ppm=req.iron_ppm,
            soil_texture=req.soil_texture,
            layer_number=req.layer_number,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fertilizer prediction error: {str(e)}")
