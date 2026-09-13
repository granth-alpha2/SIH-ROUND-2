import { NextResponse } from "next/server";
import { getSoilReportByFarmId, saveFertilizerPlan } from "@/lib/soil-repository";
import { generateFertilizerPlan } from "@/lib/fertilizer-engine";
import { getFarm } from "@/app/api/farms/repository";
import { predictFertilizerWithML } from "@/lib/ml-client";
import { fetchAgriWeather } from "@/lib/weather-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const crop = url.searchParams.get("crop") || "Wheat";

  try {
    const farm = await getFarm(id);
    const areaAcres = farm?.areaAcres || 2.5;
    const soilReport = await getSoilReportByFarmId(id);

    let weather;
    if (farm?.center) {
      try {
        weather = await fetchAgriWeather(farm.center.lat, farm.center.lng);
      } catch {
        // Fallback
      }
    }

    const plan = generateFertilizerPlan(soilReport.layers, crop, areaAcres, weather);

    // Call ML prediction service to augment recommendation
    const l1 = soilReport.layers.find((l) => l.layerNumber === 1);
    const mlRes = await predictFertilizerWithML({
      crop,
      ph: l1?.parameters["ph"]?.normalizedValue ?? 7.2,
      ec_ds_m: l1?.parameters["ec"]?.normalizedValue ?? 0.8,
      organic_carbon_pct: l1?.parameters["organic_carbon"]?.normalizedValue ?? 0.55,
      available_n_kg_ha: l1?.parameters["nitrogen"]?.normalizedValue ?? 260.0,
      available_p_kg_ha: l1?.parameters["phosphorus"]?.normalizedValue ?? 16.0,
      available_k_kg_ha: l1?.parameters["potassium"]?.normalizedValue ?? 180.0,
      sulphur_ppm: l1?.parameters["sulphur"]?.normalizedValue ?? 12.0,
      zinc_ppm: l1?.parameters["zinc"]?.normalizedValue ?? 0.8,
      soil_texture: l1?.parameters["texture"]?.originalUnit || "Loam",
      layer_number: 1,
    });

    await saveFertilizerPlan(id, plan);

    return NextResponse.json({
      success: true,
      plan,
      mlAugmentation: mlRes || { is_ml_predicted: false, note: "Rule-based ICAR STCR formulation active" },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: "Failed to generate fertilizer recommendation." } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const crop = body.crop || "Wheat";

  try {
    const farm = await getFarm(id);
    const areaAcres = farm?.areaAcres || body.acres || 2.5;
    const soilReport = await getSoilReportByFarmId(id);

    let weather;
    if (farm?.center) {
      try {
        weather = await fetchAgriWeather(farm.center.lat, farm.center.lng);
      } catch {
        // Fallback
      }
    }

    const plan = generateFertilizerPlan(soilReport.layers, crop, areaAcres, weather);
    await saveFertilizerPlan(id, plan);

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: "Failed to generate fertilizer recommendation." } },
      { status: 500 }
    );
  }
}
