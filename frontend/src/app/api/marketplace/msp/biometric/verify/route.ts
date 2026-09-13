import { NextResponse } from "next/server";
import { marketplaceService } from "@/lib/marketplace-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const requestId = body?.requestId;

  if (!requestId) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_REQUEST_ID", message: "requestId is required for biometric verification." } },
      { status: 400 }
    );
  }

  try {
    const event = await marketplaceService.performBiometricVerification({
      requestId,
      officerId: body?.officerId || "gov_officer_01",
      officerName: body?.officerName || "Sh. Rajinder Verma (Procurement Officer)",
    });

    return NextResponse.json({
      success: true,
      label: "Biometric Verification — Demo",
      message: "Eye biometric verified successfully (Demo Provider).",
      verificationEvent: event,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Biometric verification failed.";
    return NextResponse.json(
      { success: false, error: { code: "BIOMETRIC_ERROR", message } },
      { status: 400 }
    );
  }
}

