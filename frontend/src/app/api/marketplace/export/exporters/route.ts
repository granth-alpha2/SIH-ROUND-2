import { NextResponse } from "next/server";
import { marketplaceService } from "@/lib/marketplace-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const crop = searchParams.get("crop") || undefined;
  const country = searchParams.get("country") || undefined;

  try {
    const exporters = await marketplaceService.listExporters({ crop, country });
    return NextResponse.json({
      success: true,
      total: exporters.length,
      exporters,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to list exporters." } },
      { status: 500 }
    );
  }
}

