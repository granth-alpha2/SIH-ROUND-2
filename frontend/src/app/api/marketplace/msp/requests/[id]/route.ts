import { NextResponse } from "next/server";
import { marketplaceService } from "@/lib/marketplace-service";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    const req = await marketplaceService.getMspRequestById(id);
    if (!req) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: `MSP Request ${id} not found.` } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, request: req });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to fetch MSP request." } },
      { status: 500 }
    );
  }
}

