import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { askCropAssistant, getFarmerContext } from "@/lib/ai-assistant-service";
import { unifiedTranslation } from "@/lib/translation/unified-translation-service";
import { SupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/translation/translation-types";

export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, { status: 401 });
  const userId = user.sub;

  try {
    const context = await getFarmerContext(userId);
    return NextResponse.json({ success: true, context });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, { status: 401 });
  const userId = user.sub;

  const body = await request.json().catch(() => null);
  const message = body?.message;

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_MESSAGE", message: "A non-empty message is required." } },
      { status: 400 }
    );
  }

  const imageUrl = body?.imageUrl;
  const userLang = body?.language && SUPPORTED_LANGUAGES[body.language as SupportedLanguage] ? body.language : "en";

  try {
    const result = await askCropAssistant(message.trim(), body.history || [], userId, imageUrl);

    let finalReply = result.reply;
    let card = result.diagnosisCard;

    // Multilingual Translation Pipeline for AI Response
    if (userLang !== "en") {
      try {
        const trans = await unifiedTranslation.translateText({
          text: result.reply,
          targetLang: userLang,
          context: "AI agronomist advisory reply",
        });
        if (trans.translatedText) {
          finalReply = trans.translatedText;
        }

        if (card) {
          const chemicalTrans = await unifiedTranslation.translateText({
            text: card.chemicalTreatment,
            targetLang: userLang,
            context: "chemical dosage",
          });
          const organicTrans = await unifiedTranslation.translateText({
            text: card.organicTreatment,
            targetLang: userLang,
            context: "organic treatment",
          });
          const preventionTrans = await unifiedTranslation.translateText({
            text: card.preventionTips,
            targetLang: userLang,
            context: "prevention tips",
          });

          card = {
            ...card,
            chemicalTreatment: chemicalTrans.translatedText || card.chemicalTreatment,
            organicTreatment: organicTrans.translatedText || card.organicTreatment,
            preventionTips: preventionTrans.translatedText || card.preventionTips,
          };
        }
      } catch (e) {
        console.warn("[AI Translation Fallback]", e);
      }
    }

    return NextResponse.json({
      success: true,
      reply: finalReply,
      context: result.context,
      diagnosisCard: card,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "ASSISTANT_FAILED", message: "Failed to generate agronomic response." } },
      { status: 500 }
    );
  }
}

