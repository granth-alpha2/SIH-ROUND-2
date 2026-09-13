import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";
import { getPreferences } from "../preferences/repository";
import { getFarm } from "../farms/repository";
import { getAgriWeather } from "@/lib/weather-service";
import { generateRecommendations, generateRecommendationsWithML, type RecommendationInput } from "@/lib/recommendation-engine";
import { prefillRecommendationContext } from "@/lib/farm-context";
import { resolveDistrictFromCoords, DISTRICT_MASTER } from "@/lib/geo-service";
import type { CropSeason } from "@/lib/crop-data";
import type { SoilType } from "../preferences/repository";


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

  // Load preferences
  let preferences = await getPreferences(userId);
  if (body.preferences && typeof body.preferences === "object") {
    preferences = { ...preferences, ...body.preferences };
  }

  let farmAreaAcres = body.farmAreaAcres || 2.5;
  let lat = DISTRICT_MASTER[0].lat;
  let lng = DISTRICT_MASTER[0].lng;
  let locationName = `${DISTRICT_MASTER[0].district}, ${DISTRICT_MASTER[0].state}`;
  let resolvedFarm: Awaited<ReturnType<typeof getFarm>> | null = null;

  if (farmId) {
    try {
      const farm = await getFarm(farmId);
      if (farm) {
        resolvedFarm = farm;
        farmAreaAcres = farm.areaAcres || farmAreaAcres;
        lat = farm.center.lat;
        lng = farm.center.lng;
        const dInfo = resolveDistrictFromCoords(lat, lng);
        locationName = `${farm.name} (${dInfo.district}, ${dInfo.state})`;
        if (farm.preferences) {
          const water = farm.preferences.water === "Low" || farm.preferences.water === "Medium" || farm.preferences.water === "High" ? farm.preferences.water : undefined;
          const risk = farm.preferences.risk === "Conservative" || farm.preferences.risk === "Balanced" || farm.preferences.risk === "Growth" ? farm.preferences.risk : undefined;
          const soilType = (
            farm.preferences.soilType === "Alluvial" ||
            farm.preferences.soilType === "Black" ||
            farm.preferences.soilType === "Red" ||
            farm.preferences.soilType === "Sandy" ||
            farm.preferences.soilType === "Clay" ||
            farm.preferences.soilType === "Loam"
              ? farm.preferences.soilType
              : undefined
          ) as SoilType | undefined;
          const crop = farm.preferences.crop;
          const cropVariety = farm.preferences.cropVariety;
          const irrigation = farm.preferences.irrigation;
          const soilTestResults = farm.preferences.soilTestResults;
          const expectedYield = farm.preferences.expectedYieldQuintalsPerAcre;
          const historicalYield = farm.preferences.historicalYieldQuintalsPerAcre;
          const harvestDate = farm.preferences.harvestDate;
          const cropLifecycleStage = farm.preferences.cropLifecycleStage;

          preferences = {
            ...preferences,
            ...(water ? { waterAvailability: water } : {}),
            ...(risk ? { riskAppetite: risk } : {}),
            ...(soilType ? { soilType } : {}),
            ...(preferences.soilPh === undefined && soilTestResults?.pH ? { soilPh: soilTestResults.pH } : {}),
            ...(crop ? { preferredCrops: Array.from(new Set([...(preferences.preferredCrops || []), crop])) } : {}),
          };

          if (cropVariety || irrigation || soilTestResults || expectedYield !== undefined || historicalYield !== undefined || harvestDate || cropLifecycleStage) {
            preferences = {
              ...preferences,
              ...(cropVariety ? { preferredCrops: Array.from(new Set([...(preferences.preferredCrops || []), cropVariety])) } : {}),
            };
          }
        }
      }
    } catch {
      // Fallback to coordinates
    }
  } else if (body.lat && body.lng) {
    lat = Number(body.lat);
    lng = Number(body.lng);
    const dInfo = resolveDistrictFromCoords(lat, lng);
    locationName = `${dInfo.district}, ${dInfo.state}`;
  }


  // Fetch weather report for centroid
  const weather = await getAgriWeather(lat, lng, locationName, {
    crop: body.crop || body.chosenCrop,
    season: body.season || "Rabi",
    sellingChannel: body.sellingChannel || body.channel || "Mandi",
    destination: body.destination,
    quantityQuintals: body.quantityQuintals,
    marketConditions: body.marketConditions,
  });

  const season: CropSeason = body.season || "Rabi";
  const dInfo = resolveDistrictFromCoords(lat, lng);
  const farmSpecificContext = prefillRecommendationContext(
    {
      farmerId: body.farmerId || userId,
      farmId: farmId || resolvedFarm?.id,
      areaAcres: farmAreaAcres,
      district: body.district || dInfo.district,
      state: body.state || dInfo.state,
      locationName,
      crop: body.crop || body.chosenCrop || resolvedFarm?.preferences?.crop,
      cropVariety: body.cropVariety || resolvedFarm?.preferences?.cropVariety,
      soilType: body.soilType || resolvedFarm?.preferences?.soilType || preferences.soilType,
      soilTestResults: body.soilTestResults || resolvedFarm?.preferences?.soilTestResults || { pH: preferences.soilPh, organicCarbon: preferences.soilOrganicCarbon },
      irrigation: body.irrigation || resolvedFarm?.preferences?.irrigation || preferences.waterAvailability,
      expectedYieldQuintalsPerAcre: body.expectedYieldQuintalsPerAcre ?? resolvedFarm?.preferences?.expectedYieldQuintalsPerAcre,
      historicalYieldQuintalsPerAcre: body.historicalYieldQuintalsPerAcre ?? resolvedFarm?.preferences?.historicalYieldQuintalsPerAcre,
      harvestDate: body.harvestDate || resolvedFarm?.preferences?.harvestDate,
      cropLifecycleStage: body.cropLifecycleStage || resolvedFarm?.preferences?.cropLifecycleStage,
      farmName: body.farmName || resolvedFarm?.name || "Farm",
      sellingChannel: body.sellingChannel || body.channel || "Mandi",
      destination: body.destination,
      date: body.date || new Date().toISOString(),
      quantityQuintals: body.quantityQuintals,
      marketConditions: body.marketConditions,
    },
    preferences,
    {
      farmerName: body.farmerName || userId,
      farmName: body.farmName || resolvedFarm?.name || "Farm",
      locationName,
      state: body.state || dInfo.state,
      district: body.district || dInfo.district,
      cropName: body.crop || body.chosenCrop,
      sellingChannel: body.sellingChannel || body.channel || "Mandi",
      destination: body.destination,
      date: body.date || new Date().toISOString(),
      quantityQuintals: body.quantityQuintals,
      marketConditions: body.marketConditions,
    }
  );

  const recInput: RecommendationInput = {
    farmAreaAcres,
    currentSeason: season,
    preferences: farmSpecificContext.preferences,
    weather,
    context: farmSpecificContext.context,
  };

  try {
    let portfolio;
    try {
      portfolio = await generateRecommendationsWithML(recInput);
    } catch {
      portfolio = generateRecommendations(recInput);
    }
    return NextResponse.json({
      success: true,
      recommendation: portfolio,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "RECOMMENDATION_FAILED", message: "Failed to generate crop recommendations." } },
      { status: 500 }
    );
  }
}
