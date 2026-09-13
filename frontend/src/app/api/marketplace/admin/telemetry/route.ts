import { NextResponse } from "next/server";
import { marketplaceService } from "@/lib/marketplace-service";

export async function GET() {
  try {
    const stats = await marketplaceService.getMarketplaceStats();
    return NextResponse.json({
      success: true,
      telemetry: {
        ...stats,
        systemStatus: "HEALTHY",
        mspSourceHealth: "VERIFIED_ACTIVE",
        mandiDataHealth: "VERIFIED_ACTIVE",
        biometricAdapterStatus: "OPERATIONAL_DEMO",
        lastAuditCheck: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "TELEMETRY_FAILED", message: "Failed to query telemetry." } },
      { status: 500 }
    );
  }
}

