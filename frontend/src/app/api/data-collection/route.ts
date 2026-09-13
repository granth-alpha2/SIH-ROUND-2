import { NextResponse } from "next/server";
import { validateDataCollectionPayload, persistCollectedData, enqueueCsvExportJob } from "@/lib/data-collection";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = validateDataCollectionPayload(body ?? {});
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
  const csv = await enqueueCsvExportJob();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agri_data_collection_export.csv"',
    },
  });
}
