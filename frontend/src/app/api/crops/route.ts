import { NextResponse } from "next/server";
import { CROP_DATABASE } from "@/lib/crop-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season");
  const category = searchParams.get("category");
  const query = searchParams.get("q")?.toLowerCase().trim();

  let filtered = [...CROP_DATABASE];

  if (season && season !== "All") {
    filtered = filtered.filter((c) => c.season.toLowerCase() === season.toLowerCase());
  }

  if (category && category !== "All") {
    filtered = filtered.filter((c) => c.category.toLowerCase() === category.toLowerCase());
  }

  if (query) {
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.hindiName.includes(query) ||
        c.slug.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({
    success: true,
    total: filtered.length,
    crops: filtered,
  });
}
