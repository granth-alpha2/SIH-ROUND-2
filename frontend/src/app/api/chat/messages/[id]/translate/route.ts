import { NextResponse } from "next/server";
import { unifiedTranslation } from "@/lib/translation/unified-translation-service";
import { SupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/translation/translation-types";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => null);

    if (!body || !body.text || !body.targetLang) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: "text and targetLang are required." } },
        { status: 400 }
      );
    }

    const { text, sourceLang, targetLang } = body;

    if (!SUPPORTED_LANGUAGES[targetLang as SupportedLanguage]) {
      return NextResponse.json(
        { success: false, error: { code: "UNSUPPORTED_LANGUAGE", message: "Language not supported." } },
        { status: 400 }
      );
    }

    // Translate on demand
    const result = await unifiedTranslation.translateText({
      text,
      sourceLang,
      targetLang: targetLang as SupportedLanguage,
      context: "chat message retry",
    });

    return NextResponse.json({
      success: true,
      messageId: id,
      translation: result,
    });
  } catch (err: unknown) {
    console.error("[Message Translation Retry Error]", err);
    return NextResponse.json(
      { success: false, error: { code: "TRANSLATION_FAILED", message: "Failed to translate message." } },
      { status: 500 }
    );
  }
}
