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
    actual_yield_q_per_acre: Optional[float] = Field(None, example=33.7, description="Observed or actual harvest yield; kept separate from predicted value for evaluation.")
    observed_yield_q_per_acre: Optional[float] = Field(None, example=33.7, description="Alias for actual yield; stored separately from predicted output.")


class YieldPredictionResponse(BaseModel):
    crop: str
    crop_slug: str
    predicted_yield_q_per_acre: float
    predicted_yield_q_per_ha: float
    actual_yield_q_per_acre: Optional[float] = None
    observed_yield_q_per_acre: Optional[float] = None
    actual_yield_kg_per_ha: Optional[float] = None
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
    actual_price_inr_per_quintal: Optional[float] = Field(None, example=2425.0, description="Observed actual selling price; never overwrites the forecasted value.")
    observed_price_inr_per_quintal: Optional[float] = Field(None, example=2425.0, description="Alias for actual selling price; kept separate from predicted value.")


class PriceForecastResponse(BaseModel):
    crop: str
    crop_slug: str
    current_price_inr_per_quintal: float
    forecasted_price_inr_per_quintal: float
    actual_price_inr_per_quintal: Optional[float] = None
    observed_price_inr_per_quintal: Optional[float] = None
    forecast_horizon_months: int
    price_change_pct: float
    price_trend: str
    confidence_interval: List[float]
    model_version: str
    is_ml_forecast: bool
    mape_error_pct: Optional[float] = None


class FertilizerPredictionRequest(BaseModel):
    crop: str = Field("Wheat", example="Wheat")
    ph: float = Field(7.2, example=7.2)
    ec_ds_m: float = Field(0.8, example=0.8)
    organic_carbon_pct: float = Field(0.55, example=0.55)
    available_n_kg_ha: float = Field(240.0, example=240.0)
    available_p_kg_ha: float = Field(14.0, example=14.0)
    available_k_kg_ha: float = Field(180.0, example=180.0)
    sulphur_ppm: float = Field(12.0, example=12.0)
    zinc_ppm: float = Field(0.8, example=0.8)
    iron_ppm: float = Field(6.0, example=6.0)
    soil_texture: str = Field("Loam", example="Loam")
    layer_number: int = Field(1, example=1)


class FertilizerPredictionResponse(BaseModel):
    crop: str
    is_ml_predicted: bool
    model_version: str
    provenance: str
    n_status: str
    p_status: str
    k_status: str
    priority_nutrient: str
    recommended_dosages_kg_per_acre: Dict[str, float]
    advisory_flags: Dict[str, bool]


