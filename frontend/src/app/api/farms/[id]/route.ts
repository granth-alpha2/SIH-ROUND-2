import { NextResponse } from "next/server";
import { getFarm, updateFarm, deleteFarm } from "../repository";
import { canAccessOwner, getRequestUser } from "@/lib/request-auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, { status: 401 });
  try {
    const farm = await getFarm(id);
    if (!farm) {
      return NextResponse.json(
        { success: false, error: { code: "FARM_NOT_FOUND", message: "Farm record not found." } },
        { status: 404 }
      );
    }
    if (!canAccessOwner(user, farm.ownerId)) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "You do not own this farm." } }, { status: 403 });
    }
    return NextResponse.json({ success: true, farm });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "FARM_FETCH_FAILED", message: "Could not retrieve farm details." } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, { status: 401 });
  const existing = await getFarm(id);
  if (!existing) return NextResponse.json({ success: false, error: { code: "FARM_NOT_FOUND", message: "Farm not found for update." } }, { status: 404 });
  if (!canAccessOwner(user, existing.ownerId)) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "You do not own this farm." } }, { status: 403 });
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_BODY", message: "Missing update payload." } },
      { status: 400 }
    );
  }

  try {
    const updated = await updateFarm(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: "FARM_NOT_FOUND", message: "Farm not found for update." } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, farm: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "FARM_UPDATE_FAILED", message: "Could not update farm record." } },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, { status: 401 });
  const existing = await getFarm(id);
  if (!existing) return NextResponse.json({ success: false, error: { code: "FARM_NOT_FOUND", message: "Farm not found to delete." } }, { status: 404 });
  if (!canAccessOwner(user, existing.ownerId)) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "You do not own this farm." } }, { status: 403 });
  try {
    const success = await deleteFarm(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: { code: "FARM_NOT_FOUND", message: "Farm not found to delete." } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Farm deleted successfully." });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "FARM_DELETE_FAILED", message: "Could not delete farm." } },
      { status: 500 }
    );
  }
}

