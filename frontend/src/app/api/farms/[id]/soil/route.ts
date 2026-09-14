import { NextResponse } from "next/server";
import { getSoilReportByFarmId, saveSoilReport } from "@/lib/soil-repository";
import { parseSoilReportDocument, analyzeSoilProfile, SoilReportRecord } from "@/lib/soil-service";
import { getFarm } from "@/app/api/farms/repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const report = await getSoilReportByFarmId(id);
    return NextResponse.json({ success: true, report });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch soil test report." } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const farm = await getFarm(id);
    if (!farm) {
      return NextResponse.json(
        { success: false, error: { message: "Farm not found." } },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawContent = body.rawText || body.fileName || "Standard Soil Test Report";
    const fileName = body.fileName || "uploaded_soil_report.pdf";

    // Parse report text / base64 payload into 3-layer parameters
    const parsed = parseSoilReportDocument(rawContent, fileName);
    const analysis = analyzeSoilProfile(parsed.layers);

    const newReport: SoilReportRecord = {
      id: `soil_${id}_${Date.now()}`,
      farmId: id,
      reportDate: body.reportDate || new Date().toISOString().slice(0, 10),
      laboratoryName: parsed.laboratoryName,
      sampleId: parsed.sampleId,
      fileName,
      verificationStatus: "pending_verification",
      layers: parsed.layers,
      analysis,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveSoilReport(newReport);

    return NextResponse.json({
      success: true,
      report: newReport,
      message: "Soil report parsed successfully. Please verify extracted layer values.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: "Failed to process soil report upload." } },
      { status: 500 }
    );
  }
}
