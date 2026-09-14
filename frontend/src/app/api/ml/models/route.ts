import { NextResponse } from "next/server";

const ML_BASE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${ML_BASE_URL}/models/info`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`ML service responded with status ${res.status}`);
    }

    const payload = await res.json();
    return NextResponse.json({
      success: true,
      models: payload,
      registry: payload?.yield_model && payload?.price_model ? [payload.yield_model, payload.price_model] : [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ML_MODELS_FETCH_FAILED",
          message: error instanceof Error ? error.message : "Unable to fetch model metadata from the ML service.",
        },
      },
      { status: 502 }
    );
  }
}
