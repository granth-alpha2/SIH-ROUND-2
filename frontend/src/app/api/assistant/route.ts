import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { askCropAssistant, getFarmerContext } from "@/lib/ai-assistant-service";

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

  try {
    const result = await askCropAssistant(message.trim(), body.history || [], userId, imageUrl);
    return NextResponse.json({
      success: true,
      reply: result.reply,
      context: result.context,
      diagnosisCard: result.diagnosisCard,
    });
  } catch {

    return NextResponse.json(
      { success: false, error: { code: "ASSISTANT_FAILED", message: "Failed to generate agronomic response." } },
      { status: 500 }
    );
  }
}

