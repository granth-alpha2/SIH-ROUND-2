import { NextResponse } from "next/server";
import { unifiedTranslation } from "@/lib/translation/unified-translation-service";
import { unifiedTTS } from "@/lib/translation/tts-service";

export async function GET() {
  const transStatus = unifiedTranslation.getProviderStatus();
  const ttsStatus = unifiedTTS.getProviderStatus();

  return NextResponse.json({
    success: true,
    translation: transStatus,
    tts: ttsStatus,
    timestamp: new Date().toISOString(),
  });
}
