import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/notification-service";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  let userId = "default-farmer";
  if (token) {
    const user = await verifyJWT(token);
    if (user?.sub) userId = user.sub;
  }

  const body = await request.json().catch(() => ({}));

  try {
    if (body.all) {
      const count = await markAllNotificationsAsRead(userId);
      return NextResponse.json({
        success: true,
        markedAll: true,
        count,
      });
    }

    if (body.id) {
      const success = await markNotificationAsRead(body.id, userId);
      return NextResponse.json({
        success,
        id: body.id,
      });
    }

    return NextResponse.json(
      { success: false, error: { code: "MISSING_PARAMS", message: "Provide id or set all=true." } },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_FAILED", message: "Could not update notification read status." } },
      { status: 500 }
    );
  }
}

