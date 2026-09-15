/// <reference types="node" />

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
} from "../../frontend/src/lib/auth";
import {
  saveFarm,
  listFarms,
  getFarm,
  updateFarm,
  deleteFarm,
} from "../../frontend/src/app/api/farms/repository";
import {
  verifyOfficerCredentials,
  verifyExporterCredentials,
  REGISTERED_GOVERNMENT_OFFICERS,
  REGISTERED_EXPORTERS,
} from "../../frontend/src/lib/official-credentials";


let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
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

  // Verify master backdoor '123456' is strictly rejected
  const unrequestedAttempt = verifyOtp("9876599999", "123456");
  assert(unrequestedAttempt.success === false, "Strictly rejects backdoor master OTP 123456");

  // Valid OTP acceptance
  const validAttempt = verifyOtp(userPhone, generatedOtp);
  assert(validAttempt.success === true, "Accepts correct OTP code");

  // 4. JWT Sign and Verify
  const userPayload = {
    sub: "usr_123456",
    phone: "9876500000",
    name: "Sardar Balwinder Singh",
    role: "farmer" as const,
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

  console.log("\n=== Testing Farm Mapping & PostGIS CRUD (Prompt 6) ===");

  // 7. Save farm
  const farmId = "farm-test-uuid-001";
  const newFarm = {
    id: farmId,
    name: "Bathinda Canal Plot A",
    areaAcres: 4.85,
    center: { lat: 30.2110, lng: 74.9455 },
    boundary: [
      { lat: 30.2110, lng: 74.9455 },
      { lat: 30.2150, lng: 74.9455 },
      { lat: 30.2150, lng: 74.9500 },
      { lat: 30.2110, lng: 74.9500 },
    ],
    createdAt: new Date().toISOString(),
    sections: [
      { crop: "Wheat", area: 3.0 },
      { crop: "Mustard", area: 1.85 },
    ],
    preferences: { water: "High", risk: "Balanced" },
  };

  const saved = await saveFarm(newFarm);
  assert(saved.id === farmId, "Farm saved successfully with boundary points");

  // 8. List farms
  const allFarms = await listFarms();
  assert(allFarms.length >= 1, "listFarms returns saved farms");
  const found = allFarms.find((f) => f.id === farmId);
  assert(found !== undefined, "Saved farm is present in list");
  assert(found?.areaAcres === 4.85, "Farm area matches in acres");

  // 9. Get single farm
  const single = await getFarm(farmId);
  assert(single !== null && single.name === "Bathinda Canal Plot A", "getFarm returns correct record");

  // 10. Update farm
  const updated = await updateFarm(farmId, {
    name: "Bathinda Canal Plot A (Updated)",
    areaAcres: 5.20,
    sections: [
      { crop: "Wheat", area: 3.20 },
      { crop: "Mustard", area: 2.00 },
    ],
  });
  assert(updated !== null && updated.name === "Bathinda Canal Plot A (Updated)", "updateFarm updates name");
  assert(updated?.areaAcres === 5.20, "updateFarm updates area");

  // 11. Delete farm
  const deleted = await deleteFarm(farmId);
  assert(deleted === true, "deleteFarm returns true");
  // 12. Official Government Procurement Officer Authentication
  console.log("\n=== Testing Government Officer & Exporter Authentication ===");
  const validOfficer = verifyOfficerCredentials("FCI-PB-994", "FCI@Govt#2026");
  assert(validOfficer !== null, "Valid FCI Officer ID and Password authenticates successfully");
  assert(validOfficer?.role === "government_buyer", "Officer has role 'government_buyer'");
  assert(validOfficer?.name === "Officer S. Sharma", "Officer name resolved correctly");

  const caseInsensitiveOfficer = verifyOfficerCredentials("fci-pb-994", "FCI@Govt#2026");
  assert(caseInsensitiveOfficer !== null, "Officer ID authentication is case-insensitive");

  const wrongPasswordOfficer = verifyOfficerCredentials("FCI-PB-994", "wrong-password-123");
  assert(wrongPasswordOfficer === null, "Rejects officer authentication with incorrect password");

  const nonExistentOfficer = verifyOfficerCredentials("FAKE-OFFICER-999", "FCI@Govt#2026");
  assert(nonExistentOfficer === null, "Rejects non-existent officer ID");

  // 13. Official APEDA / DGFT Exporter Authentication
  const validExporter = verifyExporterCredentials("IEC-0519928341", "Export@Sun#2026");
  assert(validExporter !== null, "Valid DGFT IEC Code and Password authenticates successfully");
  assert(validExporter?.role === "exporter", "Exporter has role 'exporter'");
  assert(validExporter?.name === "Sun Agri Exports Pvt Ltd", "Exporter company name resolved correctly");

  const caseInsensitiveExporter = verifyExporterCredentials("iec-0519928341", "Export@Sun#2026");
  assert(caseInsensitiveExporter !== null, "Exporter IEC authentication is case-insensitive");

  const wrongPasswordExporter = verifyExporterCredentials("IEC-0519928341", "invalid-pass");
  assert(wrongPasswordExporter === null, "Rejects exporter authentication with incorrect password");

  const nonExistentExporter = verifyExporterCredentials("IEC-0000000000", "Export@Sun#2026");
  assert(nonExistentExporter === null, "Rejects non-existent exporter IEC code");

  // 14. JWT token generation & verification for official roles
  const govtToken = await signJWT({
    sub: `usr_gov_${validOfficer!.id}`,
    phone: validOfficer!.phone,
    name: validOfficer!.name,
    role: validOfficer!.role,
  });
  const decodedGovt = await verifyJWT(govtToken);
  assert(decodedGovt !== null && decodedGovt.role === "government_buyer", "JWT session for government_buyer correctly verified");

  const exporterToken = await signJWT({
    sub: `usr_exp_${validExporter!.id}`,
    phone: validExporter!.phone,
    name: validExporter!.name,
    role: validExporter!.role,
  });
  const decodedExporter = await verifyJWT(exporterToken);
  assert(decodedExporter !== null && decodedExporter.role === "exporter", "JWT session for exporter correctly verified");

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

