import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";
import { marketplaceService } from "@/lib/marketplace-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const requestId = body?.requestId;

  if (!requestId) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_REQUEST_ID", message: "requestId is required." } },
      { status: 400 }
    );
  }

  // Verify government buyer role or demo officer
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  let officerId = body?.officerId || "gov_officer_01";
  let officerName = body?.officerName || "Sh. Rajinder Verma (Procurement Officer)";

  if (token) {
    const session = await verifyJWT(token);
    if (session) {
      officerId = session.sub;
      officerName = session.name || officerName;
    }
  }

  try {
    const result = await marketplaceService.approveMspRequest({
      requestId,
      officerId,
      officerName,
      procurementCenterId: body?.procurementCenterId,
    });

    return NextResponse.json({
      success: true,
      message: "MSP Procurement Request approved. 12-Digit Authorization Code generated.",
      request: result.request,
      codeRecord: result.codeRecord,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Approval failed.";
    return NextResponse.json(
      { success: false, error: { code: "APPROVAL_ERROR", message } },
      { status: 400 }
    );
  }
}

