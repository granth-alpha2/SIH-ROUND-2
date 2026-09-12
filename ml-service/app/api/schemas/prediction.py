from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class YieldPredictionRequest(BaseModel):
    crop: str = Field(..., example="Wheat", description="Common crop name")
    rainfall_mm: float = Field(150.0, example=185.0, description="Seasonal rainfall in mm")
    soil_ph: float = Field(7.2, example=7.2, description="Soil pH value")
    nitrogen_kg_per_ha: float = Field(120.0, example=120.0, description="Soil nitrogen content in kg/ha")
    avg_temp_c: float = Field(24.0, example=24.5, description="Average temperature in Celsius")
    state: str = Field("Punjab", example="Punjab", description="State name")
    irrigation_type: str = Field("Rainfed", example="Sprinkler", description="Drip, Flood, Sprinkler, or Rainfed")


class YieldPredictionResponse(BaseModel):
    crop: str
    crop_slug: str
    predicted_yield_q_per_acre: float
    predicted_yield_q_per_ha: float
    confidence_interval_q_per_acre: List[float]
    model_version: str
    is_ml_predicted: bool
    r2_score: Optional[float] = None
    features_used: Optional[Dict[str, Any]] = None


class PriceForecastRequest(BaseModel):
    crop: str = Field(..., example="Wheat", description="Common crop name")
    months_ahead: int = Field(3, example=3, ge=1, le=6, description="Forecast horizon in months (1-6)")
    current_price_inr: Optional[float] = Field(None, example=2380.0, description="Latest APMC mandi price")
    price_lag2_inr: Optional[float] = Field(None, example=2350.0, description="Price 2 months ago")
    price_lag3_inr: Optional[float] = Field(None, example=2300.0, description="Price 3 months ago")
    rainfall_anomaly_mm: float = Field(0.0, example=12.5, description="Deviation from seasonal normal")
    trade_demand_index: float = Field(55.0, example=60.0, description="0-100 demand index")
    state: str = Field("Punjab", example="Punjab", description="State name")
    month: Optional[int] = Field(None, example=9, ge=1, le=12, description="Current month (1-12)")


class PriceForecastResponse(BaseModel):
    crop: str
    crop_slug: str
    current_price_inr_per_quintal: float
    forecasted_price_inr_per_quintal: float
    forecast_horizon_months: int
    price_change_pct: float
    price_trend: str
    confidence_interval: List[float]
    model_version: str
    is_ml_forecast: bool
    mape_error_pct: Optional[float] = None

