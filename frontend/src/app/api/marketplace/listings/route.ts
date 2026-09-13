import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";
import { marketplaceService } from "@/lib/marketplace-service";
import { QuantityUnit } from "@/lib/marketplace-types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const crop = searchParams.get("crop") || undefined;
  const district = searchParams.get("district") || undefined;
  const state = searchParams.get("state") || undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const minQuantity = searchParams.get("minQuantity") ? Number(searchParams.get("minQuantity")) : undefined;
  const status = searchParams.get("status") || undefined;

  try {
    const listings = await marketplaceService.listDirectListings({
      crop,
      district,
      state,
      maxPrice,
      minQuantity,
      status,
    });
    return NextResponse.json({
      success: true,
      total: listings.length,
      listings,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to retrieve marketplace listings." } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_JSON", message: "Invalid request body." } },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  let farmerId = body.farmerId || "usr_farmer_demo";
  let farmerName = body.farmerName || "Gurpreet Singh";
  let farmerPhone = body.farmerPhone || "9876543210";

  if (token) {
    const session = await verifyJWT(token);
    if (session) {
      farmerId = session.sub;
      farmerName = session.name || farmerName;
      farmerPhone = session.phone || farmerPhone;
    }
  }

  const {
    cropId,
    cropName,
    cropSlug,
    variety,
    quantity,
    unit,
    askingPriceInrPerQuintal,
    minAcceptablePriceInr,
    qualityGrade,
    availableDate,
    district,
    state,
    deliveryTerms,
    description,
    farmId,
  } = body;

  if (!cropName || !quantity || Number(quantity) <= 0 || !askingPriceInrPerQuintal || Number(askingPriceInrPerQuintal) <= 0) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Crop name, quantity, and asking price per quintal are required." },
      },
      { status: 400 }
    );
  }

  const normalizedUnit: QuantityUnit = unit === "kg" || unit === "tonne" ? unit : "quintal";

  try {
    const listing = await marketplaceService.createDirectListing({
      farmerId,
      farmerName,
      farmerPhone,
      farmId,
      cropId: cropId || "CROP002",
      cropName,
      cropSlug: cropSlug || cropName.toLowerCase().split(" ")[0],
      variety,
      quantity: Number(quantity),
      unit: normalizedUnit,
      askingPriceInrPerQuintal: Number(askingPriceInrPerQuintal),
      minAcceptablePriceInr: minAcceptablePriceInr ? Number(minAcceptablePriceInr) : undefined,
      qualityGrade,
      availableDate,
      district: district || "Ludhiana",
      state: state || "Punjab",
      deliveryTerms,
      description,
    });

    return NextResponse.json({
      success: true,
      message: "Crop listed successfully on Direct Farm-to-Market board.",
      listing,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create listing.";
    return NextResponse.json(
      { success: false, error: { code: "CREATE_LISTING_FAILED", message } },
      { status: 500 }
    );
  }
}

