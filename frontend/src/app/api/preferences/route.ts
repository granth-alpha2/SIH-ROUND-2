import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";
import {
  getPreferences,
  savePreferences,
  type FarmerPreferenceRecord,
  type RiskAppetite,
  type ResourceLevel,
  type SoilType,
} from "./repository";

async function getUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const user = await verifyJWT(token);
    if (user?.sub) return user.sub;
  }
  return "default-farmer";
}

export async function GET() {
  const userId = await getUserId();
  try {
    const prefs = await getPreferences(userId);
    return NextResponse.json({ success: true, preferences: prefs });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Could not retrieve preferences." } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const userId = await getUserId();
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_BODY", message: "Missing preferences payload." } },
      { status: 400 }
    );
  }

  const validRisk: RiskAppetite[] = ["Conservative", "Balanced", "Growth"];
  const validResource: ResourceLevel[] = ["Low", "Medium", "High"];
  const validSoils: SoilType[] = ["Alluvial", "Black", "Red", "Sandy", "Clay", "Loam"];

  const riskAppetite: RiskAppetite = validRisk.includes(body.riskAppetite) ? body.riskAppetite : "Balanced";
  const waterAvailability: ResourceLevel = validResource.includes(body.waterAvailability) ? body.waterAvailability : "Medium";
  const investmentCapacity: ResourceLevel = validResource.includes(body.investmentCapacity) ? body.investmentCapacity : "Medium";

  const preferredCrops = Array.isArray(body.preferredCrops)
    ? body.preferredCrops.filter((c: unknown) => typeof c === "string" && c.trim())
    : [];

  const cropsToAvoid = Array.isArray(body.cropsToAvoid)
    ? body.cropsToAvoid.filter((c: unknown) => typeof c === "string" && c.trim())
    : [];

  let farmingExperienceYears: number | undefined = undefined;
  if (typeof body.farmingExperienceYears === "number" && !isNaN(body.farmingExperienceYears)) {
    farmingExperienceYears = Math.min(60, Math.max(0, body.farmingExperienceYears));
  }

  let soilType: SoilType | undefined = undefined;
  if (validSoils.includes(body.soilType)) {
    soilType = body.soilType;
  }

  let soilPh: number | undefined = undefined;
  if (typeof body.soilPh === "number" && !isNaN(body.soilPh)) {
    soilPh = Math.min(10.0, Math.max(4.0, Number(body.soilPh.toFixed(1))));
  }

  let soilOrganicCarbon: ResourceLevel | undefined = undefined;
  if (validResource.includes(body.soilOrganicCarbon)) {
    soilOrganicCarbon = body.soilOrganicCarbon;
  }

  const record: FarmerPreferenceRecord = {
    id: body.id || `pref_${userId}`,
    userId,
    riskAppetite,
    waterAvailability,
    investmentCapacity,
    preferredCrops,
    cropsToAvoid,
    farmingExperienceYears,
    soilType,
    soilPh,
    soilOrganicCarbon,
    updatedAt: new Date().toISOString(),
  };

  try {
    const saved = await savePreferences(record);
    return NextResponse.json({ success: true, preferences: saved });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "SAVE_FAILED", message: "Failed to store farmer preferences." } },
      { status: 500 }
    );
  }
}

