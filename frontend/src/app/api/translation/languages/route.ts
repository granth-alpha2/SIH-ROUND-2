import { NextResponse } from "next/server";
import { SUPPORTED_LANGUAGES } from "@/lib/translation/translation-types";

export async function GET() {
  return NextResponse.json({
    success: true,
    languages: Object.values(SUPPORTED_LANGUAGES),
  });
}
