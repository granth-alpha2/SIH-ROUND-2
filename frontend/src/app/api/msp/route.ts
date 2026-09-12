import { NextResponse } from "next/server";
import { marketService } from "@/lib/market-service";

export async function GET() {
  try {
    const mspRecords = await marketService.getMspRecords();
    return NextResponse.json({
      success: true,
      total: mspRecords.length,
      mspRecords,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "MSP_FETCH_FAILED", message: "Failed to retrieve MSP catalog." } },
      { status: 500 }
    );
  }
}

