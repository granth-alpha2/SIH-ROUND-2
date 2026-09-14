import { NextResponse } from "next/server";
import { marketplaceService } from "@/lib/marketplace-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const {
    groupId,
    farmerId,
    exporterId,
    cropName,
    destinationCountry,
    totalQuantityQuintals,
    offeredPriceInrPerQuintal,
  } = body || {};

  if (!exporterId || !cropName || !destinationCountry || !totalQuantityQuintals || !offeredPriceInrPerQuintal) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "exporterId, cropName, destinationCountry, totalQuantityQuintals, and offeredPriceInrPerQuintal are required." } },
      { status: 400 }
    );
  }

  try {
    const match = await marketplaceService.sendExportGroupOffer({
      groupId,
      farmerId: farmerId || "usr_farmer_demo",
      exporterId,
      cropName,
      destinationCountry,
      totalQuantityQuintals: Number(totalQuantityQuintals),
      offeredPriceInrPerQuintal: Number(offeredPriceInrPerQuintal),
    });

    return NextResponse.json({
      success: true,
      message: "Export group offer sent successfully to verified Indian exporter.",
      match,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to connect with exporter.";
    return NextResponse.json(
      { success: false, error: { code: "MATCH_ERROR", message } },
      { status: 400 }
    );
  }
}

