import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";
import { marketplaceService } from "@/lib/marketplace-service";
import { QuantityUnit } from "@/lib/marketplace-types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const farmerId = searchParams.get("farmerId") || undefined;
  const status = searchParams.get("status") || undefined;
  const centerId = searchParams.get("centerId") || undefined;

  try {
    const requests = await marketplaceService.listMspRequests({
      farmerId,
      status,
      procurementCenterId: centerId,
    });
    return NextResponse.json({
      success: true,
      total: requests.length,
      requests,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to list MSP requests." } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_JSON", message: "Invalid JSON request body." } },
      { status: 400 }
    );
  }

  // Resolve authenticated user or allow demo request
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  let userSub = body.farmerId || "usr_farmer_demo";
  let userName = body.farmerName || "Gurpreet Singh";
  let userPhone = body.farmerPhone || "9876543210";

  if (token) {
    const session = await verifyJWT(token);
    if (session) {
      userSub = session.sub;
      userName = session.name || userName;
      userPhone = session.phone || userPhone;
    }
  }

  const {
    cropId,
    cropName,
    cropSlug,
    quantity,
    unit,
    farmId,
    farmName,
    cropGrade,
    expectedHarvestDate,
    procurementCenterId,
  } = body;

  if (!cropName || !quantity || Number(quantity) <= 0) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Crop name and a valid quantity greater than 0 are required." } },
      { status: 400 }
    );
  }

  const normalizedUnit: QuantityUnit = unit === "kg" || unit === "tonne" ? unit : "quintal";

  try {
    const mspReq = await marketplaceService.createMspRequest({
      farmerId: userSub,
      farmerName: userName,
      farmerPhone: userPhone,
      farmId,
      farmName,
      cropId: cropId || "CROP002",
      cropName,
      cropSlug: cropSlug || cropName.toLowerCase().split(" ")[0],
      quantity: Number(quantity),
      unit: normalizedUnit,
      cropGrade,
      expectedHarvestDate,
      procurementCenterId: procurementCenterId || "PC-PB-LDH-01",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Government MSP procurement request submitted successfully.",
        request: mspReq,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to create MSP request.";
    return NextResponse.json(
      { success: false, error: { code: "MSP_CREATION_FAILED", message: errMessage } },
      { status: 500 }
    );
  }
}

