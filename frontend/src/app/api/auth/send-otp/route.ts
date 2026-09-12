import { NextResponse } from "next/server";
import { checkRateLimit, cleanPhone, generateOtp, isValidIndianPhone, sendSmsOtp } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawPhone = body?.phone;

  if (!rawPhone || typeof rawPhone !== "string") {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_PHONE", message: "Mobile number is required." } },
      { status: 400 }
    );
  }

  const phone = cleanPhone(rawPhone);
  if (!isValidIndianPhone(phone)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_PHONE_FORMAT", message: "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)." } },
      { status: 400 }
    );
  }

  if (!checkRateLimit(phone)) {
    return NextResponse.json(
      { success: false, error: { code: "RATE_LIMITED", message: "Too many OTP requests. Please wait a minute before trying again." } },
      { status: 429 }
    );
  }

  const otp = generateOtp(phone);

  // Dispatch via configured SMS Gateway or live simulated carrier
  const dispatchResult = await sendSmsOtp(phone, otp);


  const maskedPhone = `+91 ******${phone.slice(-4)}`;
  const isLiveCarrier = dispatchResult.provider !== "simulated";

  return NextResponse.json({
    success: true,
    message: isLiveCarrier
      ? `Verification code delivered via SMS to ${maskedPhone}`
      : `Verification code dispatched to ${maskedPhone}`,
    otpLength: 6,
    expiresInSeconds: 300,
    provider: dispatchResult.provider,
    isLiveCarrier,
  });
}



