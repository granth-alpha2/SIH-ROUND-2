import { NextResponse } from "next/server";
import { getSoilReportByFarmId, saveSoilReport } from "@/lib/soil-repository";
import { analyzeSoilProfile, SoilLayerRecord } from "@/lib/soil-service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const existing = await getSoilReportByFarmId(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: "Soil report not found." } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updatedLayers: SoilLayerRecord[] = body.layers;

    if (!updatedLayers || !Array.isArray(updatedLayers) || updatedLayers.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid layers payload provided." } },
        { status: 400 }
      );
    }

    // Re-run cross-layer analysis on verified/edited values
    const newAnalysis = analyzeSoilProfile(updatedLayers);

    const verifiedReport = {
      ...existing,
      layers: updatedLayers,
      analysis: newAnalysis,
      verificationStatus: "manually_edited" as const,
      updatedAt: new Date().toISOString(),
    };

    await saveSoilReport(verifiedReport);

    return NextResponse.json({
      success: true,
      report: verifiedReport,
      message: "Soil profile verified and re-analyzed successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: "Failed to verify soil report." } },
      { status: 500 }
    );
  }
}
