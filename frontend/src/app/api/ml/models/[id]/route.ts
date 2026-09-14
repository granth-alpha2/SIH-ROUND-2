import { NextResponse } from "next/server";

const ML_BASE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

function mapModelId(id: string) {
  const normalized = id.toLowerCase();
  if (normalized.includes("yield")) return "yield_model";
  if (normalized.includes("price")) return "price_model";
  return null;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const res = await fetch(`${ML_BASE_URL}/models/info`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`ML service responded with status ${res.status}`);
    }

    const payload = await res.json();
    const modelKey = mapModelId(params.id) || params.id;
    const model = payload[modelKey] || payload?.yield_model || payload?.price_model;

    if (!model) {
      return NextResponse.json(
        { success: false, error: { code: "MODEL_NOT_FOUND", message: `No model metadata found for ${params.id}.` } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      model: { id: params.id, ...model },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ML_MODEL_FETCH_FAILED",
          message: error instanceof Error ? error.message : "Unable to fetch model metadata from the ML service.",
        },
      },
      { status: 502 }
    );
  }
}
