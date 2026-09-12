/**
 * AgriProfit — Test Suite for Authentication & Farm Mapping
 * ==========================================================
 */

import {
  signJWT,
  verifyJWT,
  isValidIndianPhone,
  cleanPhone,
  checkRateLimit,
  generateOtp,
  verifyOtp,
} from "../frontend/src/lib/auth.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("=== Testing Authentication (Prompt 5) ===");

  // 1. Phone validation
  assert(isValidIndianPhone("9876543210") === true, "Valid 10-digit Indian phone (starts with 9)");
  assert(isValidIndianPhone("6123456789") === true, "Valid 10-digit Indian phone (starts with 6)");
  assert(isValidIndianPhone("+91 98765 43210") === true, "Valid formatted Indian phone with +91");
  assert(isValidIndianPhone("1234567890") === false, "Invalid phone (starts with 1)");
  assert(isValidIndianPhone("98765") === false, "Invalid phone (too short)");
  assert(cleanPhone("+91 98765-43210") === "9876543210", "cleanPhone extracts 10 digits");

  // 2. Rate limiting
  const testPhone = "9999911111";
  for (let i = 0; i < 5; i++) {
    checkRateLimit(testPhone, 5, 60000);
  }
  assert(checkRateLimit(testPhone, 5, 60000) === false, "Rate limit kicks in after 5 requests/min");

  // 3. OTP generation and verification
  const userPhone = "9876500000";
  const generatedOtp = generateOtp(userPhone);
  assert(typeof generatedOtp === "string" && generatedOtp.length === 6, "Generates 6-digit OTP");

  // Bad OTP rejection
  const badAttempt = verifyOtp(userPhone, "000000");
  assert(badAttempt.success === false, "Rejects wrong OTP code");

  // Valid OTP acceptance
  const validAttempt = verifyOtp(userPhone, generatedOtp);
  assert(validAttempt.success === true, "Accepts correct OTP code");

  // 4. JWT Sign and Verify
  const userPayload = {
    sub: "usr_123456",
    phone: "9876500000",
    name: "Sardar Balwinder Singh",
    role: "farmer",
  };

  const token = await signJWT(userPayload, 3600);
  assert(typeof token === "string" && token.split(".").length === 3, "Generates standard 3-part JWT");

  const decoded = await verifyJWT(token);
  assert(decoded !== null, "JWT verifies successfully");
  assert(decoded?.sub === userPayload.sub, "Decoded sub matches user ID");
  assert(decoded?.phone === userPayload.phone, "Decoded phone matches");
  assert(decoded?.role === "farmer", "Decoded role is farmer");

  // 5. Tampered JWT rejection
  const tamperedToken = token.slice(0, -5) + "abcde";
  const tamperedDecoded = await verifyJWT(tamperedToken);
  assert(tamperedDecoded === null, "Rejects tampered JWT signature");

  // 6. Expired JWT rejection
  const expiredToken = await signJWT(userPayload, -10); // expired 10s ago
  const expiredDecoded = await verifyJWT(expiredToken);
  assert(expiredDecoded === null, "Rejects expired JWT token");

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

