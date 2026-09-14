import { NextResponse } from "next/server";
import { marketplaceService } from "@/lib/marketplace-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = body?.code;
  const actualWeight = Number(body?.actualWeighedQuantityQuintals);
  const officerId = body?.officerId || "gov_officer_01";
  const officerName = body?.officerName || "Sh. Rajinder Verma (Procurement Officer)";
  const qualityGradeConfirmed = body?.qualityGradeConfirmed || "Fair Average Quality (FAQ) Grade-A";

  if (!code || !Number.isFinite(actualWeight) || actualWeight <= 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "A valid 12-digit authorization code and positive actual weighed quantity are required.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const result = await marketplaceService.completeMspProcurement({
      code: String(code),
      actualWeighedQuantityQuintals: actualWeight,
      officerId,
      officerName,
      qualityGradeConfirmed,
    });

    return NextResponse.json({
      success: true,
      message: "Government MSP Procurement completed successfully.",
      request: result.request,
      receipt: result.receipt,
      transaction: result.transaction,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Procurement completion failed.";
    return NextResponse.json(
      { success: false, error: { code: "PROCUREMENT_ERROR", message } },
      { status: 400 }
    );
  }
}

