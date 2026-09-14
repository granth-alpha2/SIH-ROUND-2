import { NextResponse } from "next/server";
import { unifiedTTS } from "@/lib/translation/tts-service";
import { SupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/translation/translation-types";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.text) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: "Text is required for TTS." } },
        { status: 400 }
      );
    }

    const { text, language = "en", voice, speed = 1.0 } = body;

    if (!SUPPORTED_LANGUAGES[language as SupportedLanguage]) {
      return NextResponse.json(
        { success: false, error: { code: "UNSUPPORTED_LANGUAGE", message: `Language ${language} not supported for TTS.` } },
        { status: 400 }
      );
    }

    const result = await unifiedTTS.synthesize({
      text: String(text),
      language: language as SupportedLanguage,
      voice,
      speed: Number(speed),
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    console.error("[TTS API Error]", err);
    return NextResponse.json(
      { success: false, error: { code: "TTS_ERROR", message: "Audio synthesis failed." } },
      { status: 500 }
    );
  }
}
