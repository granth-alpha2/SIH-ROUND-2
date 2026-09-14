import { NextResponse } from "next/server";
import { unifiedTranslation } from "@/lib/translation/unified-translation-service";
import { SupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/translation/translation-types";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.texts)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: "An array of texts is required." } },
        { status: 400 }
      );
    }

    const { texts, sourceLang, targetLang, context } = body;

    if (!targetLang || !SUPPORTED_LANGUAGES[targetLang as SupportedLanguage]) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNSUPPORTED_LANGUAGE",
            message: `Target language '${targetLang}' is not supported. Must be one of: en, hi, pa, hny, ta.`,
          },
        },
        { status: 400 }
      );
    }

    // Cap batch size at 100 strings
    const safeTexts = texts.slice(0, 100).map((t: unknown) => String(t || ""));

    const result = await unifiedTranslation.translateBatch({
      texts: safeTexts,
      sourceLang,
      targetLang: targetLang as SupportedLanguage,
      context,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    console.error("[Batch Translation API Error]", err);
    return NextResponse.json(
      { success: false, error: { code: "BATCH_TRANSLATION_ERROR", message: "Failed to batch translate." } },
      { status: 500 }
    );
  }
}
