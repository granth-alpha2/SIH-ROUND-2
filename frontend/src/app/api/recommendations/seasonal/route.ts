import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";
import { getFarm } from "../../farms/repository";
import { getPreferences } from "../../preferences/repository";
import { getAgriWeather } from "@/lib/weather-service";
import { resolveDistrictFromCoords, DISTRICT_MASTER } from "@/lib/geo-service";
import {
  evaluateSeasonalCropPlanning,
  INDIAN_FESTIVALS_CATALOG,
  type SeasonalPlanningInput,
  type SeasonalPlanningType,
} from "@/lib/seasonal-crop-engine";

export async function GET() {
  return NextResponse.json({
    success: true,
    festivals: INDIAN_FESTIVALS_CATALOG,
    planningTypes: [
      { id: "short_duration", label: "⚡ Quick Harvest (30–75 Days)", description: "Rapid income crops with accelerated growth cycles" },
      { id: "festival_season", label: "🎉 Festival / Festive Demand Season", description: "Harvest timed precisely to capture festival market demand spikes" },
      { id: "interim_crop", label: "🔄 Interim Catch Crop Between Cycles", description: "Utilize vacant land gaps between two major seasonal crops (e.g. Zaid Summer Moong after Wheat)" },
      { id: "quick_income", label: "💰 Fast Cash Turnaround", description: "Lowest investment with fastest maturity to generate interim working capital" },
      { id: "custom_deadline", label: "⏱️ Custom Available Window", description: "Specify exact available days before land needs to be cleared" },
    ],
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const farmId = body.farmId;

  // Resolve authenticated user
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  let userId = "default-farmer";
  if (token) {
    const user = await verifyJWT(token);
    if (user?.sub) userId = user.sub;
  }

  // Load farmer preferences
  let preferences = await getPreferences(userId);
  if (body.preferences && typeof body.preferences === "object") {
    preferences = { ...preferences, ...body.preferences };
  }

  let farmAreaAcres = body.farmAreaAcres || 2.5;
  let lat = DISTRICT_MASTER[0].lat;
  let lng = DISTRICT_MASTER[0].lng;
  let locationName = `${DISTRICT_MASTER[0].district}, ${DISTRICT_MASTER[0].state}`;
  let farmSoil = preferences.soilType || "Alluvial";
  let farmWater = preferences.waterAvailability || "Medium";

  if (farmId) {
    try {
      const farm = await getFarm(farmId);
      if (farm) {
        farmAreaAcres = farm.areaAcres || farmAreaAcres;
        lat = farm.center.lat;
        lng = farm.center.lng;
        const dInfo = resolveDistrictFromCoords(lat, lng);
        locationName = `${farm.name} (${dInfo.district}, ${dInfo.state})`;
        if ((farm.preferences as any)?.soil) farmSoil = (farm.preferences as any).soil;
        if (farm.preferences?.water) farmWater = farm.preferences.water as any;
      }
    } catch {
      // fallback
    }
  } else if (body.lat && body.lng) {
    lat = Number(body.lat);
    lng = Number(body.lng);
    const dInfo = resolveDistrictFromCoords(lat, lng);
    locationName = `${dInfo.district}, ${dInfo.state}`;
  }

  if (body.soilType) farmSoil = body.soilType;
  if (body.waterAvailability) farmWater = body.waterAvailability;

  // Fetch real-time weather
  let weather;
  try {
    weather = await getAgriWeather(lat, lng, locationName);
  } catch {
    // Graceful fallback inside engine
  }

  const planningType: SeasonalPlanningType = body.planningType || "short_duration";
  const availableDays = body.availableDays ? Number(body.availableDays) : undefined;
  const targetDate = body.targetDate as string | undefined;
  const festivalId = body.festivalId as string | undefined;
  const mainCrop = body.mainCrop as string | undefined;
  const allocatedAcres = body.allocatedAcres ? Number(body.allocatedAcres) : undefined;

  const input: SeasonalPlanningInput = {
    planningType,
    farmAreaAcres,
    allocatedAcres,
    availableDays,
    targetDate,
    festivalId,
    mainCrop,
    lat,
    lng,
    soilType: farmSoil,
    soilPh: preferences.soilPh || 7.2,
    waterAvailability: farmWater,
    weather,
  };

  try {
    const result = evaluateSeasonalCropPlanning(input);
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SEASONAL_PLANNING_FAILED",
          message: err?.message || "Failed to compute seasonal crop recommendations.",
        },
      },
      { status: 500 }
    );
  }
}
