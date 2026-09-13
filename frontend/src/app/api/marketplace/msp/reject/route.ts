import { NextResponse } from "next/server";
import { marketplaceService } from "@/lib/marketplace-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const requestId = body?.requestId;
  const reason = body?.reason || "Quality grade below CACP fair average quality (FAQ) standard.";

  if (!requestId) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_REQUEST_ID", message: "requestId is required." } },
      { status: 400 }
    );
  }

  try {
    const updated = await marketplaceService.rejectMspRequest({
      requestId,
      officerId: body?.officerId || "gov_officer_01",
      officerName: body?.officerName || "Procurement Officer",
      reason,
    });

    return NextResponse.json({
      success: true,
      message: "MSP Request rejected.",
      request: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Rejection failed.";
    return NextResponse.json(
      { success: false, error: { code: "REJECT_ERROR", message } },
      { status: 400 }
    );
  }
}

