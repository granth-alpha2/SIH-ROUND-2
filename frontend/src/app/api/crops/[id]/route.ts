import { NextResponse } from "next/server";
import { CROP_DATABASE } from "@/lib/crop-data";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const normalized = id.toLowerCase().trim();

  const crop = CROP_DATABASE.find(
    (c) => c.id.toLowerCase() === normalized || c.slug.toLowerCase() === normalized
  );

  if (!crop) {
    return NextResponse.json(
      { success: false, error: { code: "CROP_NOT_FOUND", message: `Crop '${id}' not found.` } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    crop,
  });
}

