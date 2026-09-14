import { NextResponse } from "next/server";
import { listConversations, getConversation } from "@/lib/chat/chat-repository";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const conv = await getConversation(id);
      if (!conv) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Conversation not found." } },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, conversation: conv });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? await verifyJWT(token) : null;

    const conversations = await listConversations(user?.sub);
    return NextResponse.json({ success: true, conversations });
  } catch (err: unknown) {
    console.error("[Chat Conversations API Error]", err);
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Could not fetch conversations." } },
      { status: 500 }
    );
  }
}
