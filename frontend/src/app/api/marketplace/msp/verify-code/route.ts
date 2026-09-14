import { NextResponse } from "next/server";
import { marketplaceService } from "@/lib/marketplace-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = body?.code;

  if (!code) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_CODE", message: "12-digit authorization code is required." } },
      { status: 400 }
    );
  }

  const result = await marketplaceService.verifyAuthorizationCode({
    code: String(code),
    procurementCenterId: body?.procurementCenterId,
  });

  if (!result.valid) {
    return NextResponse.json(
      { success: false, error: { code: "CODE_VERIFICATION_FAILED", message: result.error || "Invalid code." } },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "12-digit authorization code verified successfully.",
    codeRecord: result.codeRecord,
    request: result.request,
  });
}

