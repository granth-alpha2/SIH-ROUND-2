import { NextResponse } from "next/server";
import { validateDataCollectionPayload, persistCollectedData, enqueueCsvExportJob } from "@/lib/data-collection";
import { getRequestUser, isAdminRole } from "@/lib/request-auth";
import { recordAuditEvent } from "@/lib/audit-trail";

export async function POST(request: Request) {
  try {
    const user = await getRequestUser();
    if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, { status: 401 });
    const body = await request.json();
    const requestedFarmerId = body?.farmerId ?? body?.userId;
    if (!isAdminRole(user.role) && requestedFarmerId && String(requestedFarmerId) !== user.sub) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "You may only submit data for your own account." } }, { status: 403 });
    }
    const validated = validateDataCollectionPayload({ ...(body ?? {}), farmerId: isAdminRole(user.role) ? requestedFarmerId : user.sub });
    const stored = await persistCollectedData(validated);

    return NextResponse.json({
      success: true,
      message: "Data stored in database as the source of truth.",
      record: stored,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DATA_COLLECTION_INVALID",
          message: error instanceof Error ? error.message : "Invalid data collection payload.",
        },
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, { status: 401 });
  if (!isAdminRole(user.role)) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Only administrators may export aggregate data." } }, { status: 403 });
  const csv = await enqueueCsvExportJob();
  await recordAuditEvent({ event: "DATASET_EXPORT_CREATED", actor: user.sub, dataSource: "Data collection export", metadata: { format: "csv", scope: "aggregated" } });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agri_data_collection_export.csv"',
    },
  });
}
