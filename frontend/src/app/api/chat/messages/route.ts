import { NextResponse } from "next/server";
import { getMessages, sendMessage, getConversation } from "@/lib/chat/chat-repository";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: "conversationId is required." } },
        { status: 400 }
      );
    }

    const messages = await getMessages(conversationId);
    return NextResponse.json({ success: true, messages });
  } catch (err: unknown) {
    console.error("[Chat Messages API Error]", err);
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to fetch messages." } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.conversationId || !body.text) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: "conversationId and text are required." } },
        { status: 400 }
      );
    }

    const { conversationId, text, senderRole = "farmer" } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? await verifyJWT(token) : null;

    const senderId = user?.sub || body.senderId || "demo-user";
    const senderName = user?.name || body.senderName || "Marketplace Participant";

    const conv = await getConversation(conversationId);
    if (!conv) {
      return NextResponse.json(
        { success: false, error: { code: "CONVERSATION_NOT_FOUND", message: "Conversation does not exist." } },
        { status: 404 }
      );
    }

    // Send, auto-detect language, translate for recipient, and persist
    const message = await sendMessage({
      conversationId,
      senderId,
      senderName,
      senderRole,
      text: String(text).trim(),
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (err: unknown) {
    console.error("[Send Message API Error]", err);
    return NextResponse.json(
      { success: false, error: { code: "SEND_FAILED", message: "Failed to send message." } },
      { status: 500 }
    );
  }
}
