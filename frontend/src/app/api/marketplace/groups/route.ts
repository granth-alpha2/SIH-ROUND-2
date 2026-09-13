import { NextResponse } from "next/server";
import { marketplaceService } from "@/lib/marketplace-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const crop = searchParams.get("crop") || undefined;
  const status = searchParams.get("status") || undefined;

  try {
    const groups = await marketplaceService.listGroups({ crop, status });
    return NextResponse.json({
      success: true,
      total: groups.length,
      groups,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to retrieve groups." } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const action = body?.action || "CREATE"; // 'CREATE' or 'JOIN'

  if (action === "JOIN") {
    const { groupId, farmerId, farmerName, farmerPhone, quantityQuintals, agreedPriceInr, village } = body;
    if (!groupId || !quantityQuintals || Number(quantityQuintals) <= 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "groupId and quantityQuintals are required." } },
        { status: 400 }
      );
    }

    try {
      const updatedGroup = await marketplaceService.joinGroup({
        groupId,
        farmerId: farmerId || "usr_farmer_demo",
        farmerName: farmerName || "Gurpreet Singh",
        farmerPhone: farmerPhone || "9876543210",
        contributedQuantityQuintals: Number(quantityQuintals),
        agreedPriceInrPerQuintal: agreedPriceInr ? Number(agreedPriceInr) : undefined,
        village,
      });

      return NextResponse.json({
        success: true,
        message: "Successfully joined selling group.",
        group: updatedGroup,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to join group.";
      return NextResponse.json(
        { success: false, error: { code: "JOIN_FAILED", message } },
        { status: 400 }
      );
    }
  }

  // CREATE Group
  const {
    cropName,
    cropSlug,
    targetQuantityQuintals,
    initialQuantityQuintals,
    minAcceptablePriceInr,
    farmerId,
    farmerName,
    farmerPhone,
    district,
    state,
  } = body;

  if (!cropName || !targetQuantityQuintals || !initialQuantityQuintals || !minAcceptablePriceInr) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Crop name, target quantity, initial quantity, and min acceptable price are required." } },
      { status: 400 }
    );
  }

  try {
    const group = await marketplaceService.createGroup({
      cropName,
      cropSlug: cropSlug || cropName.toLowerCase().split(" ")[0],
      targetQuantityQuintals: Number(targetQuantityQuintals),
      initialQuantityQuintals: Number(initialQuantityQuintals),
      minAcceptablePriceInr: Number(minAcceptablePriceInr),
      farmerId: farmerId || "usr_farmer_demo",
      farmerName: farmerName || "Gurpreet Singh",
      farmerPhone: farmerPhone || "9876543210",
      district,
      state,
    });

    return NextResponse.json({
      success: true,
      message: "Farmer selling group created successfully.",
      group,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create group.";
    return NextResponse.json(
      { success: false, error: { code: "CREATE_GROUP_FAILED", message } },
      { status: 500 }
    );
  }
}

