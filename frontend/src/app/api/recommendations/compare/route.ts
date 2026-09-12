import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";
import { getPreferences } from "../../preferences/repository";
import { getFarm, recordFarmerWishComparison } from "../../farms/repository";
import { getAgriWeather } from "@/lib/weather-service";
import {
  compareFarmerCropChoice,
  CropNotFoundError,
} from "@/lib/crop-comparison-engine";
import { resolveDistrictFromCoords, DISTRICT_MASTER } from "@/lib/geo-service";
import type { CropSeason } from "@/lib/crop-data";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const chosenCrop = body.chosenCrop || body.crop || "";
  const farmId = body.farmId;

  if (!chosenCrop || typeof chosenCrop !== "string" || !chosenCrop.trim()) {
    return NextResponse.json(
      {
        success: false,
        error: "crop_not_found",
        message: "Please provide a crop name to compare.",
        suggestions: ["Wheat (गेहूं)", "Mustard (सरसों)", "Chickpea (चना)"],
      },
      { status: 200 }
    );
  }

  // Resolve authenticated user
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  let userId = "default-farmer";
  if (token) {
    const user = await verifyJWT(token);
    if (user?.sub) userId = user.sub;
  }

  // Load preferences
  let preferences = await getPreferences(userId);
  if (body.preferences && typeof body.preferences === "object") {
    preferences = { ...preferences, ...body.preferences };
  }

  let farmAreaAcres = Number(body.farmAreaAcres) || 2.5;
  let lat = DISTRICT_MASTER[0].lat;
  let lng = DISTRICT_MASTER[0].lng;
  let locationName = `${DISTRICT_MASTER[0].district}, ${DISTRICT_MASTER[0].state}`;

  if (farmId) {
    try {
      const farm = await getFarm(farmId);
      if (farm) {
        farmAreaAcres = farm.areaAcres || farmAreaAcres;
        lat = farm.center.lat;
        lng = farm.center.lng;
        const dInfo = resolveDistrictFromCoords(lat, lng);
        locationName = `${farm.name} (${dInfo.district}, ${dInfo.state})`;
        if (farm.preferences) {
          const water =
            farm.preferences.water === "Low" ||
            farm.preferences.water === "Medium" ||
            farm.preferences.water === "High"
              ? farm.preferences.water
              : undefined;
          const risk =
            farm.preferences.risk === "Conservative" ||
            farm.preferences.risk === "Balanced" ||
            farm.preferences.risk === "Growth"
              ? farm.preferences.risk
              : undefined;
          preferences = {
            ...preferences,
            ...(water ? { waterAvailability: water } : {}),
            ...(risk ? { riskAppetite: risk } : {}),
          };
        }
      }
    } catch {
      // Fallback to defaults
    }
  } else if (body.lat && body.lng) {
    lat = Number(body.lat);
    lng = Number(body.lng);
    const dInfo = resolveDistrictFromCoords(lat, lng);
    locationName = `${dInfo.district}, ${dInfo.state}`;
  }

  // Fetch weather report for farm centroid
  const weather = await getAgriWeather(lat, lng, locationName);
  const season: CropSeason = body.season || "Rabi";

  try {
    const comparison = compareFarmerCropChoice({
      farmAreaAcres,
      currentSeason: season,
      preferences,
      weather,
      farmerChosenCropSlug: chosenCrop,
    });

    // Optional snapshot telemetry for SIH pitch metrics
    if (farmId) {
      await recordFarmerWishComparison(farmId, comparison.farmerChoice.slug, comparison);
    }

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (err: unknown) {
    if (err instanceof CropNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: "crop_not_found",
          message: err.message,
          suggestions: err.suggestions,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "COMPARE_FAILED",
        message: "Unable to compare crops at this moment. Please try again.",
      },
      { status: 500 }
    );
  }
}

