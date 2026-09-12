import { NextResponse } from "next/server";
import { cleanPhone, SESSION_COOKIE_NAME, signJWT, verifyOtp } from "@/lib/auth";
import { getFarmerByPhone, saveFarmer } from "@/lib/farmer-repository";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawPhone = body?.phone;
  const rawOtp = body?.otp;
  const rawName = body?.name?.trim();
  const rawState = body?.state;
  const rawDistrict = body?.district;

  if (!rawPhone || !rawOtp) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_FIELDS", message: "Both mobile number and OTP code are required." } },
      { status: 400 }
    );
  }

  const phone = cleanPhone(String(rawPhone));
  const otp = String(rawOtp).trim();

  const verification = verifyOtp(phone, otp);
  if (!verification.success) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_OTP", message: verification.error || "Invalid OTP code." } },
      { status: 401 }
    );
  }

  // Find or create farmer in database/repository
  const userId = `usr_${phone.slice(-6)}`;
  let farmer = await getFarmerByPhone(phone);

  if (!farmer) {
    const finalName = rawName && rawName.length >= 2 ? rawName : `Farmer (+91-${phone.slice(0, 5)}...)`;
    farmer = await saveFarmer({
      id: userId,
      phone,
      name: finalName,
      state: rawState || "Punjab",
      district: rawDistrict || "Ludhiana",
    });
  } else if (rawName && rawName.length >= 2 && (farmer.name.includes("(+91") || farmer.name.startsWith("Farmer ("))) {
    // If farmer was previously using a placeholder name, upgrade it to their real name
    farmer = await saveFarmer({
      id: farmer.id,
      phone: farmer.phone,
      name: rawName,
      state: rawState || farmer.state,
      district: rawDistrict || farmer.district,
    });
  }

  const token = await signJWT({
    sub: farmer.id,
    phone: farmer.phone,
    name: farmer.name,
    role: "farmer",
  });

  const response = NextResponse.json({
    success: true,
    message: "Authentication successful",
    token,
    user: {
      id: farmer.id,
      phone: farmer.phone,
      name: farmer.name,
      state: farmer.state,
      district: farmer.district,
      village: farmer.village,
      role: "farmer",
    },
  });

  // Set HTTP-only secure session cookie
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return response;
}
