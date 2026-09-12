import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT, signJWT } from "@/lib/auth";
import { getFarmerById, getFarmerByPhone, saveFarmer } from "@/lib/farmer-repository";

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  let token = sessionToken;
  if (!token) {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) return null;
  return await verifyJWT(token);
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHENTICATED", message: "No active session." } },
      { status: 401 }
    );
  }

  // Fetch latest details from database repository
  const farmer = (await getFarmerById(user.sub)) || (await getFarmerByPhone(user.phone));

  return NextResponse.json({
    success: true,
    user: {
      id: user.sub,
      phone: user.phone,
      name: farmer?.name || user.name,
      state: farmer?.state || "Punjab",
      district: farmer?.district || "Ludhiana",
      village: farmer?.village || "",
      preferredLanguage: farmer?.preferredLanguage || "en",
      landOwnedHectares: farmer?.landOwnedHectares,
      role: user.role,
    },
  });
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHENTICATED", message: "No active session." } },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_BODY", message: "Request body is required." } },
      { status: 400 }
    );
  }

  const newName = body.name?.trim();
  if (newName && newName.length < 2) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_NAME", message: "Name must be at least 2 characters long." } },
      { status: 400 }
    );
  }

  // Save to database
  const updatedFarmer = await saveFarmer({
    id: user.sub,
    phone: user.phone,
    name: newName || user.name,
    state: body.state,
    district: body.district,
    village: body.village,
    preferredLanguage: body.preferredLanguage,
    landOwnedHectares: body.landOwnedHectares !== undefined ? Number(body.landOwnedHectares) : undefined,
  });

  // Re-sign JWT with updated name
  const updatedToken = await signJWT({
    sub: updatedFarmer.id,
    phone: updatedFarmer.phone,
    name: updatedFarmer.name,
    role: user.role,
  });

  const response = NextResponse.json({
    success: true,
    message: "Farmer profile and account details updated successfully.",
    user: {
      id: updatedFarmer.id,
      phone: updatedFarmer.phone,
      name: updatedFarmer.name,
      state: updatedFarmer.state,
      district: updatedFarmer.district,
      village: updatedFarmer.village,
      preferredLanguage: updatedFarmer.preferredLanguage,
      landOwnedHectares: updatedFarmer.landOwnedHectares,
      role: user.role,
    },
  });

  // Update session cookie with fresh JWT
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: updatedToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}
