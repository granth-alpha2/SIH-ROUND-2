import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";
import { askCropAssistant, getFarmerContext } from "@/lib/ai-assistant-service";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  let userId = "default-farmer";
  if (token) {
    const user = await verifyJWT(token);
    if (user?.sub) userId = user.sub;
  }

  try {
    const context = await getFarmerContext(userId);
    return NextResponse.json({ success: true, context });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}


export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  let userId = "default-farmer";
  if (token) {
    const user = await verifyJWT(token);
    if (user?.sub) userId = user.sub;
  }

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

