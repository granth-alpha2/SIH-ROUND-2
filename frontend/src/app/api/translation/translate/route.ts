import { NextResponse } from "next/server";
import { unifiedTranslation } from "@/lib/translation/unified-translation-service";
import { SupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/translation/translation-types";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.text) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: "Text is required." } },
        { status: 400 }
      );
    }

    const { text, sourceLang, targetLang, context } = body;

    // Validate target language
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

    // Safety check: max length
    if (typeof text === "string" && text.length > 5000) {
      return NextResponse.json(
        { success: false, error: { code: "TEXT_TOO_LONG", message: "Text exceeds max length of 5000 chars." } },
        { status: 400 }
      );
    }

    const result = await unifiedTranslation.translateText({
      text: String(text),
      sourceLang,
      targetLang: targetLang as SupportedLanguage,
      context: typeof context === "string" ? context : undefined,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    console.error("[Translation API Error]", err);
    return NextResponse.json(
      { success: false, error: { code: "TRANSLATION_ERROR", message: "Failed to translate text." } },
      { status: 500 }
    );
  }
}
