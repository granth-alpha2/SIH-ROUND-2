import { NextResponse } from "next/server";
import { getSystemAdminMetrics } from "@/lib/admin-service";

export async function GET() {
  try {
    const metrics = await getSystemAdminMetrics();
    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "METRICS_FAILED", message: "Failed to load admin metrics." } },
      { status: 500 }
    );
  }
}

