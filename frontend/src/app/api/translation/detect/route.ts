import { NextResponse } from "next/server";
import { unifiedTranslation } from "@/lib/translation/unified-translation-service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.text !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: "Text string is required." } },
        { status: 400 }
      );
    }

    const detection = unifiedTranslation.detectLanguage(body.text);

    return NextResponse.json({
      success: true,
      ...detection,
    });
  } catch (err: unknown) {
    console.error("[Language Detection Error]", err);
    return NextResponse.json(
      { success: false, error: { code: "DETECTION_ERROR", message: "Language detection failed." } },
      { status: 500 }
    );
  }
}
