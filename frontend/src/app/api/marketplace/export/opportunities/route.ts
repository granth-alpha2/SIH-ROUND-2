import { NextResponse } from "next/server";
import { marketplaceService } from "@/lib/marketplace-service";

export async function GET() {
  try {
    const opportunities = await marketplaceService.getExportOpportunities();
    return NextResponse.json({
      success: true,
      total: opportunities.length,
      opportunities,
      note: "International reference prices are derived from verified trade datasets (FAOSTAT / UN Comtrade) and reflect normalized CIF/FOB benchmark estimates. They do not constitute guaranteed overseas payment.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to retrieve export opportunities." } },
      { status: 500 }
    );
  }
}

