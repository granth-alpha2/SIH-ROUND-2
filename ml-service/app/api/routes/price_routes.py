from fastapi import APIRouter, HTTPException
from ..schemas.prediction import PriceForecastRequest, PriceForecastResponse
from ...models.price_model import price_forecaster

router = APIRouter(prefix="/predict", tags=["Price Forecasting"])


@router.post("/price", response_model=PriceForecastResponse)
def forecast_crop_price(req: PriceForecastRequest):
    try:
        result = price_forecaster.forecast_price(
            crop_slug=req.crop,
            months_ahead=req.months_ahead,
            current_price_inr=req.current_price_inr,
            price_lag2_inr=req.price_lag2_inr,
            price_lag3_inr=req.price_lag3_inr,
            rainfall_anomaly_mm=req.rainfall_anomaly_mm,
            trade_demand_index=req.trade_demand_index,
            state=req.state,
            month=req.month,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price forecast error: {str(e)}")

