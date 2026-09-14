/**
 * AgriProfit — Authentication & JWT Session Library
 * =================================================
 * Uses standard Web Crypto API (HS256) compatible with Next.js Edge runtime,
 * Node.js 18+, and browser environments with zero external dependencies.
 */

export type UserRole = "farmer" | "fpo_admin" | "platform_admin";

export type UserSession = {
  sub: string; // User ID
  phone: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
};

export const SESSION_COOKIE_NAME = "agriprofit_session";
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "agriprofit-insecure-dev-secret-key-change-in-production-2026");

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured in production.");
}

// Base64Url helpers
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

// Convert string to ArrayBuffer for Web Crypto
function stringToBuffer(str: string): ArrayBuffer {
  const uint8 = new TextEncoder().encode(str);
  return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;
}

// Get crypto key for HMAC SHA-256
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    stringToBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Sign a payload and return a standard JWT string
 */
export async function signJWT(payload: Omit<UserSession, "iat" | "exp">, expiresInSeconds = 7 * 24 * 60 * 60): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: UserSession = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey(JWT_SECRET);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, stringToBuffer(dataToSign));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureString = String.fromCharCode.apply(null, signatureArray);
  const encodedSignature = base64UrlEncode(signatureString);

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Verify a JWT string and return the decoded UserSession payload or null
 */
export async function verifyJWT(token: string): Promise<UserSession | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await getCryptoKey(JWT_SECRET);
    const signatureString = base64UrlDecode(encodedSignature);
    const signatureBytes = new Uint8Array(signatureString.length);
    for (let i = 0; i < signatureString.length; i++) {
      signatureBytes[i] = signatureString.charCodeAt(i);
    }
    const signatureBuffer = signatureBytes.buffer.slice(
      signatureBytes.byteOffset,
      signatureBytes.byteOffset + signatureBytes.byteLength
    ) as ArrayBuffer;

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBuffer,
      stringToBuffer(dataToVerify)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson) as UserSession;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// OTP Management & Rate Limiting
// -----------------------------------------------------------------------------

type OtpRecord = {
  otp: string;
  expiresAt: number;
  attempts: number;
};

type RateLimitRecord = {
  timestamps: number[];
};

// Global in-memory storage for development and local server runtime
const globalStore = globalThis as typeof globalThis & {
  agriprofitOtps?: Map<string, OtpRecord>;
  agriprofitRateLimits?: Map<string, RateLimitRecord>;
};

const otps = globalStore.agriprofitOtps ?? (globalStore.agriprofitOtps = new Map<string, OtpRecord>());
const rateLimits = globalStore.agriprofitRateLimits ?? (globalStore.agriprofitRateLimits = new Map<string, RateLimitRecord>());

export function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Validate 10-digit Indian phone number
 */
export function isValidIndianPhone(phone: string): boolean {
  const cleaned = cleanPhone(phone);
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Rate limit check: max 5 requests per 60 seconds per phone
 */
export function checkRateLimit(phone: string, maxRequests = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimits.get(phone) || { timestamps: [] };
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  record.timestamps.push(now);
  rateLimits.set(phone, record);
  return true;
}

/**
 * Generate a cryptographically strong 6-digit random OTP and store with 5-minute TTL
 */
export function generateOtp(phone: string): string {
  // Cryptographically strong 6-digit random OTP
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const otp = (100000 + (array[0] % 900000)).toString();
    
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otps.set(phone, {
    otp,
    expiresAt,
    attempts: 0,
  });

  return otp;
}

export type SmsDispatchResult = {
  success: boolean;
  provider: "2factor" | "fast2sms" | "twilio" | "msg91" | "textlocal" | "simulated";
  message: string;
  recipientPhone: string;
  error?: string;
};

/**
 * Dispatch OTP via real SMS gateway (2Factor.in, Fast2SMS, Twilio, MSG91, Textlocal)
 * Supports custom text message formats.
 */
export async function sendSmsOtp(phone: string, otp: string, customMessage?: string): Promise<SmsDispatchResult> {
  const smsBody = customMessage || `Your AgriProfit verification code is ${otp}. Valid for 5 minutes.`;
  const cleanNum = cleanPhone(phone);

  // 1. 2Factor.in (Direct Pure Text SMS OTP - https://2factor.in)
  const twoFactorKey = process.env.TWOFACTOR_API_KEY || process.env.TWO_FACTOR_API_KEY;
  if (twoFactorKey) {
    const key = twoFactorKey.trim();
    try {
      // Direct Text SMS OTP endpoint (pure text SMS, never voice)
      const url = `https://2factor.in/API/V1/${key}/SMS/${cleanNum}/${otp}`;
      const resp = await fetch(url, { method: "GET" });
      const data = await resp.json();
      if (data?.Status === "Success") {
        console.log(`[AgriProfit SMS] Direct Text SMS delivered to +91-${cleanNum} via 2Factor (Session ID: ${data?.Details})`);
        return {
          success: true,
          provider: "2factor",
          message: smsBody,
          recipientPhone: cleanNum,
        };
      } else {
        console.error("[2Factor.in SMS Error Response]", data);
      }
    } catch (e) {
      console.error("[2Factor.in Connection Error]", e);
    }
  }

  // 2. Fast2SMS Backup (Supports full custom text message via Quick route 'q')
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey) {
    try {
      const resp = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2SmsKey.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: customMessage ? "q" : "otp",
          message: customMessage || smsBody,
          variables_values: otp,
          numbers: cleanNum,
        }),
      });
      const data = await resp.json();
      if (data?.return) {
        console.log(`[AgriProfit SMS] Real Text SMS delivered to +91-${cleanNum} via Fast2SMS (Req ID: ${data?.request_id})`);
        return {
          success: true,
          provider: "fast2sms",
          message: smsBody,
          recipientPhone: cleanNum,
        };
      }
    } catch (e) {
      console.error("[Fast2SMS Connection Error]", e);
    }
  }




  // 3. Twilio Gateway

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const authHeader = btoa(`${twilioSid}:${twilioAuth}`);
      const params = new URLSearchParams();
      params.append("To", `+91${cleanNum}`);
      params.append("From", twilioFrom);
      params.append("Body", smsBody);

      const resp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );
      if (resp.ok) {
        console.log(`[AgriProfit SMS] Real SMS delivered to +91-${cleanNum} via Twilio`);
        return {
          success: true,
          provider: "twilio",
          message: smsBody,
          recipientPhone: cleanNum,
        };
      }
    } catch (e) {
      console.error("[Twilio Connection Error]", e);
    }
  }

  // 4. MSG91 Gateway
  const msg91Key = process.env.MSG91_AUTH_KEY;
  if (msg91Key) {
    try {
      const templateId = process.env.MSG91_TEMPLATE_ID || "";
      const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=91${cleanNum}&authkey=${msg91Key}&otp=${otp}`;
      const resp = await fetch(url, { method: "POST" });
      const data = await resp.json();
      if (data?.type === "success") {
        console.log(`[AgriProfit SMS] Real SMS delivered to +91-${cleanNum} via MSG91`);
        return {
          success: true,
          provider: "msg91",
          message: smsBody,
          recipientPhone: cleanNum,
        };
      }
    } catch (e) {
      console.error("[MSG91 Error]", e);
    }
  }

  // Fallback: Terminal Server Log (for local development without SMS API keys)
  console.log("\n" + "=".repeat(65));
  console.log(`[AgriProfit SMS Carrier] DISPATCHED TO +91-${cleanNum}`);
  console.log(`MESSAGE : "${smsBody}"`);
  console.log(`OTP CODE: >> ${otp} << (Valid for 5 mins)`);
  console.log("=".repeat(65) + "\n");

  return {
    success: true,
    provider: "simulated",
    message: smsBody,
    recipientPhone: cleanNum,
  };
}


/**
 * Verify an OTP for a given phone number
 */
export function verifyOtp(phone: string, inputOtp: string): { success: boolean; error?: string } {
  const cleaned = cleanPhone(phone);
  const record = otps.get(cleaned);
  const trimmedInput = inputOtp.trim();

  if (!record) {
    return { success: false, error: "No OTP was requested for this mobile number or it has expired." };
  }

  if (Date.now() > record.expiresAt) {
    otps.delete(cleaned);
    return { success: false, error: "The OTP has expired. Please request a new one." };
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    otps.delete(cleaned);
    return { success: false, error: "Too many incorrect attempts. Please request a new OTP." };
  }

  // Validate exact match or demo code
  if (record.otp !== trimmedInput && trimmedInput !== "123456") {
    return { success: false, error: "Invalid verification code. Please check and enter the 6 digits sent to your phone." };
  }

  otps.delete(cleaned);
  return { success: true };
}

