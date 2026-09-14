import { NextResponse } from "next/server";
import { marketplaceService } from "@/lib/marketplace-service";

export async function GET() {
  try {
    const centers = await marketplaceService.getProcurementCenters();
    return NextResponse.json({
      success: true,
      total: centers.length,
      centers,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "CENTERS_FETCH_FAILED", message: "Failed to retrieve procurement centers." } },
      { status: 500 }
    );
  }
}

