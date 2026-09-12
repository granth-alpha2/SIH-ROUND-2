import { NextResponse } from "next/server";
import { getAgriWeather } from "@/lib/weather-service";
import { getFarm } from "../farms/repository";
import { resolveDistrictFromCoords, DISTRICT_MASTER } from "@/lib/geo-service";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const farmId = searchParams.get("farmId");
  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");
  const nameParam = searchParams.get("locationName");

  let lat = DISTRICT_MASTER[0].lat;
  let lng = DISTRICT_MASTER[0].lng;
  let locationName = nameParam || `${DISTRICT_MASTER[0].district}, ${DISTRICT_MASTER[0].state} (${DISTRICT_MASTER[0].zone})`;

  if (farmId) {
    try {
      const farm = await getFarm(farmId);
      if (farm && farm.center) {
        lat = farm.center.lat;
        lng = farm.center.lng;
        const dInfo = resolveDistrictFromCoords(lat, lng);
        locationName = `${farm.name} (${dInfo.district}, ${dInfo.state})`;
      }
    } catch {
      // Fallback to coordinates
    }
  } else if (rawLat && rawLng) {
    const parsedLat = parseFloat(rawLat);
    const parsedLng = parseFloat(rawLng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      lat = parsedLat;
      lng = parsedLng;
      const dInfo = resolveDistrictFromCoords(lat, lng);
      locationName = nameParam || `${dInfo.district}, ${dInfo.state} (${dInfo.agroClimaticZone})`;
    }
  }


  try {
    const weather = await getAgriWeather(lat, lng, locationName);
    return NextResponse.json({
      success: true,
      weather,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "WEATHER_FAILED", message: "Weather data temporarily unavailable." } },
      { status: 503 }
    );
  }
}

