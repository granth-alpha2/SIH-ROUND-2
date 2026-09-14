import { NextResponse } from "next/server";
import { listFarms, saveFarm, type FarmRecord } from "./repository";
import { getRequestUser, isAdminRole } from "@/lib/request-auth";

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, { status: 401 });
  const body = await request.json().catch(() => null);
  const areaAcres = Number(body?.areaAcres);
  const center = body?.center;
  const boundary = body?.boundary;

  if (!Number.isFinite(areaAcres) || areaAcres <= 0 || !center || !Array.isArray(boundary) || boundary.length < 3) {
    return NextResponse.json({ success: false, error: { code: "INVALID_FARM_BOUNDARY", message: "Select a pin and draw a boundary with at least three points." } }, { status: 400 });
  }

  const farm: FarmRecord = {
    id: crypto.randomUUID(),
    ownerId: user.sub,
    name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : "My farm",
    areaAcres: Number(areaAcres.toFixed(2)),
    center: { lat: Number(center.lat), lng: Number(center.lng) },
    boundary: boundary.map((point: { lat: number; lng: number }) => ({ lat: Number(point.lat), lng: Number(point.lng) })),
    createdAt: new Date().toISOString(),
    sections: Array.isArray(body.sections) ? body.sections : [],
    preferences: body.preferences && typeof body.preferences === "object" ? body.preferences : {},
  };
  try {
    await saveFarm(farm);
  } catch {
    return NextResponse.json({ success: false, error: { code: "FARM_STORAGE_UNAVAILABLE", message: "The farm could not be saved right now." } }, { status: 503 });
  }
  return NextResponse.json({
    success: true,
    farm,
    isPersistent: Boolean(process.env.DATABASE_URL),
    storageMode: process.env.DATABASE_URL ? "DATABASE_POSTGIS" : "IN_MEMORY",
  }, { status: 201 });
}

export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, { status: 401 });
  try {
    return NextResponse.json({
      success: true,
      farms: await listFarms(isAdminRole(user.role) ? undefined : user.sub),
      isPersistent: Boolean(process.env.DATABASE_URL),
      storageMode: process.env.DATABASE_URL ? "DATABASE_POSTGIS" : "IN_MEMORY",
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: "FARM_STORAGE_UNAVAILABLE", message: "Farm data is temporarily unavailable." } }, { status: 503 });
  }
}
