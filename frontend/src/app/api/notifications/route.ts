import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";
import {
  getFarmerNotifications,
  createFarmerNotification,
} from "@/lib/notification-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || undefined;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  let userId = "default-farmer";
  if (token) {
    const user = await verifyJWT(token);
    if (user?.sub) userId = user.sub;
  }

  try {
    const data = await getFarmerNotifications(userId, type);
    return NextResponse.json({
      success: true,
      unreadCount: data.unreadCount,
      notifications: data.notifications,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "NOTIFICATIONS_FAILED", message: "Failed to retrieve notifications." } },
      { status: 500 }
    );
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
  if (!body || !body.title || !body.body || !body.type) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_BODY", message: "title, body, and type are required." } },
      { status: 400 }
    );
  }

  try {
    const created = await createFarmerNotification(
      {
        userId,
        type: body.type,
        title: body.title,
        body: body.body,
        severity: body.severity || "info",
        actionUrl: body.actionUrl,
        actionLabel: body.actionLabel,
        data: body.data,
      },
      userId
    );

    return NextResponse.json({
      success: true,
      notification: created,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "CREATE_FAILED", message: "Failed to create notification." } },
      { status: 500 }
    );
  }
}
