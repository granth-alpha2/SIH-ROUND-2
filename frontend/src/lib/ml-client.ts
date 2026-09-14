/**
 * AgriProfit — Machine Learning Inference Bridge Client
 * ======================================================
 * Connects the Next.js runtime to the Python FastAPI ML microservice (port 8000).
 * Queries trained Random Forest yield models and Ridge+GBR ensemble price forecasters
 * with high-resilience fallback to deterministic ICAR baselines if the ML service is offline.
 */

export type MLPredictYieldParams = {
  crop: string;
  rainfall_mm?: number;
  soil_ph?: number;
  nitrogen_kg_per_ha?: number;
  avg_temp_c?: number;
  state?: string;
  irrigation_type?: string;
};

export type MLYieldResult = {
  crop: string;
  crop_slug: string;
  predicted_yield_q_per_acre: number;
  predicted_yield_q_per_ha: number;
  confidence_interval_q_per_acre: number[];
  model_version: string;
  is_ml_predicted: boolean;
  r2_score?: number;
};

export type MLForecastPriceParams = {
  crop: string;
  months_ahead?: number;
  current_price_inr?: number;
  price_lag2_inr?: number;
  price_lag3_inr?: number;
  rainfall_anomaly_mm?: number;
  trade_demand_index?: number;
  state?: string;
  month?: number;
};

export type MLPriceResult = {
  crop: string;
  crop_slug: string;
  current_price_inr_per_quintal: number;
  forecasted_price_inr_per_quintal: number;
  forecast_horizon_months: number;
  price_change_pct: number;
  price_trend: "RISING" | "STABLE" | "FALLING";
  confidence_interval: number[];
  model_version: string;
  is_ml_forecast: boolean;
  mape_error_pct?: number;
};

const ML_BASE_URL = (
  process.env.ML_SERVICE_URL ||
  process.env.NEXT_PUBLIC_ML_SERVICE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isFiniteNumber);
}

function parseYieldResult(value: unknown): MLYieldResult | null {
  if (!value || typeof value !== "object") return null;
  const result = value as Record<string, unknown>;
  if (
    typeof result.crop !== "string" ||
    typeof result.crop_slug !== "string" ||
    !isFiniteNumber(result.predicted_yield_q_per_acre) ||
    !isFiniteNumber(result.predicted_yield_q_per_ha) ||
    !isNumberArray(result.confidence_interval_q_per_acre) ||
    typeof result.model_version !== "string" ||
    typeof result.is_ml_predicted !== "boolean"
  ) return null;
  return result as unknown as MLYieldResult;
}

function parsePriceResult(value: unknown): MLPriceResult | null {
  if (!value || typeof value !== "object") return null;
  const result = value as Record<string, unknown>;
  if (
    typeof result.crop !== "string" ||
    typeof result.crop_slug !== "string" ||
    !isFiniteNumber(result.current_price_inr_per_quintal) ||
    !isFiniteNumber(result.forecasted_price_inr_per_quintal) ||
    !isFiniteNumber(result.forecast_horizon_months) ||
    !isFiniteNumber(result.price_change_pct) ||
    typeof result.price_trend !== "string" ||
    !isNumberArray(result.confidence_interval) ||
    typeof result.model_version !== "string" ||
    typeof result.is_ml_forecast !== "boolean"
  ) return null;
  return result as unknown as MLPriceResult;
}

/**
 * Check if the FastAPI ML microservice is online
 */
export async function checkMlServiceHealth(): Promise<{ online: boolean; version?: string }> {
  try {
    const res = await fetch(`${ML_BASE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const data = await res.json();
      return { online: true, version: data?.version || "2.0.0" };
    }
  } catch {
    // Offline or unreachable
  }
  return { online: false };
}

/**
 * Predict crop yield using trained Random Forest regressor (R2 = 0.9601)
 */
export async function predictYieldWithML(
  params: MLPredictYieldParams
): Promise<MLYieldResult | null> {
  try {
    const res = await fetch(`${ML_BASE_URL}/predict/yield`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(2000),
      body: JSON.stringify({
        crop: params.crop,
        rainfall_mm: params.rainfall_mm ?? 150.0,
        soil_ph: params.soil_ph ?? 7.2,
        nitrogen_kg_per_ha: params.nitrogen_kg_per_ha ?? 120.0,
        avg_temp_c: params.avg_temp_c ?? 24.0,
        state: params.state ?? "Punjab",
        irrigation_type: params.irrigation_type ?? "Rainfed",
      }),
    });

    if (res.ok) {
      return parseYieldResult(await res.json());
    }
  } catch {
    // Graceful fallback to deterministic ICAR benchmark
  }
  return null;
}

/**
 * Forecast mandi price using trained Ensemble Ridge + GBR forecaster (R2 = 0.9733)
 */
export async function forecastPriceWithML(
  params: MLForecastPriceParams
): Promise<MLPriceResult | null> {
  try {
    const res = await fetch(`${ML_BASE_URL}/predict/price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(2000),
      body: JSON.stringify({
        crop: params.crop,
        months_ahead: params.months_ahead ?? 3,
        current_price_inr: params.current_price_inr,
        price_lag2_inr: params.price_lag2_inr,
        price_lag3_inr: params.price_lag3_inr,
        rainfall_anomaly_mm: params.rainfall_anomaly_mm ?? 0.0,
        trade_demand_index: params.trade_demand_index ?? 55.0,
        state: params.state ?? "Punjab",
        month: params.month ?? new Date().getMonth() + 1,
      }),
    });

    if (res.ok) {
      return parsePriceResult(await res.json());
    }
  } catch {
    // Graceful fallback to static mandi benchmark
  }
  return null;
}

export type MLPredictFertilizerParams = {
  crop: string;
  ph?: number;
  ec_ds_m?: number;
  organic_carbon_pct?: number;
  available_n_kg_ha?: number;
  available_p_kg_ha?: number;
  available_k_kg_ha?: number;
  sulphur_ppm?: number;
  zinc_ppm?: number;
  iron_ppm?: number;
  soil_texture?: string;
  layer_number?: number;
};

export type MLFertilizerResult = {
  crop: string;
  is_ml_predicted: boolean;
  model_version: string;
  provenance: string;
  n_status: string;
  p_status: string;
  k_status: string;
  priority_nutrient: string;
  recommended_dosages_kg_per_acre: {
    urea: number;
    dap: number;
    mop: number;
    ssp: number;
    zinc_sulphate: number;
  };
  advisory_flags: {
    high_salinity: boolean;
    alkaline_ph: boolean;
    acidic_ph: boolean;
    low_organic_carbon: boolean;
  };
};

/**
 * Predict fertilizer dosage and nutrient status using trained Random Forest models
 */
export async function predictFertilizerWithML(
  params: MLPredictFertilizerParams
): Promise<MLFertilizerResult | null> {
  try {
    const res = await fetch(`${ML_BASE_URL}/predict/fertilizer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(2000),
      body: JSON.stringify({
        crop: params.crop,
        ph: params.ph ?? 7.2,
        ec_ds_m: params.ec_ds_m ?? 0.8,
        organic_carbon_pct: params.organic_carbon_pct ?? 0.55,
        available_n_kg_ha: params.available_n_kg_ha ?? 240.0,
        available_p_kg_ha: params.available_p_kg_ha ?? 14.0,
        available_k_kg_ha: params.available_k_kg_ha ?? 180.0,
        sulphur_ppm: params.sulphur_ppm ?? 12.0,
        zinc_ppm: params.zinc_ppm ?? 0.8,
        iron_ppm: params.iron_ppm ?? 6.0,
        soil_texture: params.soil_texture ?? "Loam",
        layer_number: params.layer_number ?? 1,
      }),
    });

    if (res.ok) {
      return (await res.json()) as MLFertilizerResult;
    }
  } catch {
    // Graceful fallback
  }
  return null;
}


