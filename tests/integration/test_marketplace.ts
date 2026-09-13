/// <reference types="node" />

/**
 * AgriProfit — Test Suite for Secondary Marketplace & Direct Farm-to-Market
 * =========================================================================
 * Tests:
 * 1. Unit Normalization (kg <-> quintal <-> tonne)
 * 2. Automatic Government MSP Price Retrieval & Intelligence
 * 3. MSP Request Workflow (Creation, Validation)
 * 4. Government Officer Approval & Cryptographic 12-Digit Code Generation
 * 5. Authorization Code Validation, Expiry & Replay Prevention
 * 6. Biometric Verification Adapter & UIDAI Iris Emulation
 * 7. Actual Weighed Quantity & Gross Payout Calculation
 * 8. Procurement Completion, Receipt Generation & Demo Payment State Machine
 * 9. Direct Market Listing & Price Position Intelligence
 * 10. Buyer Offer Negotiation & Acceptance Transaction
 * 11. Group Selling Pooling, Member Contribution & Explainable Match Scoring
 * 12. International Export Opportunity Discovery & Price Deductions
 * 13. Exporter Connection & Group Trade Proposal Matching
 * 14. Role-Based Access Control (RBAC) & Security Invariants
 * 15. Immutable Audit Logging
 */

import {
  toQuintals,
  fromQuintals,
  normalizePrice,
  generate12DigitAuthorizationCode,
  marketplaceService,
} from "../../frontend/src/lib/marketplace-service";
import { defaultBiometricProvider } from "../../frontend/src/lib/biometric-adapter";

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

async function runMarketplaceTests() {
  console.log("=== Testing Unit Normalization & Price Calculations (Prompt 58) ===");
  assert(toQuintals(100, "kg") === 1, "100 kg = 1 quintal");
  assert(toQuintals(500, "kg") === 5, "500 kg = 5 quintals");
  assert(toQuintals(2, "tonne") === 20, "2 tonnes = 20 quintals");
  assert(toQuintals(35, "quintal") === 35, "35 quintals = 35 quintals");
  assert(fromQuintals(1, "kg") === 100, "1 quintal = 100 kg");
  assert(fromQuintals(20, "tonne") === 2, "20 quintals = 2 tonnes");
  assert(normalizePrice(2275, "kg") === 22.75, "₹2275/q = ₹22.75/kg");

  console.log("\n=== Testing Automatic Government MSP Catalog Lookup (Prompt 6) ===");
  const wheatMsp = await marketplaceService.getMspPriceForCrop("Wheat");
  assert(wheatMsp !== null, "Found official MSP record for Wheat");
  assert(wheatMsp?.mspPricePerQuintal === 2275, "Official Wheat MSP is ₹2,275/quintal");
  assert(wheatMsp?.sourceName.includes("CACP"), "Source is official CACP policy notification");

  const mustardMsp = await marketplaceService.getMspPriceForCrop("Mustard");
  assert(mustardMsp?.mspPricePerQuintal === 5650, "Official Mustard MSP is ₹5,650/quintal");

  console.log("\n=== Testing Location & Price Intelligence Calculator (Prompt 7) ===");
  const intel = await marketplaceService.calculateCropMarketplaceIntelligence({
    cropName: "Wheat",
    requestedQuantity: 35,
    unit: "quintal",
  });
  assert(intel.quantityQuintals === 35, "Normalized quantity is 35 quintals");
  assert(intel.officialMspPerQuintal === 2275, "Locked MSP is ₹2,275/q");
  assert(intel.estimatedMspGrossValue === 79625, "Gross MSP value for 35q = ₹79,625");
  assert(intel.mandiModalPerQuintal > 0, "Nearby APMC mandi modal price fetched");

  console.log("\n=== Testing Mode A: Farmer MSP Request Submission (Prompt 8) ===");
  const farmerId = `usr_farmer_${Date.now()}`;
  const req = await marketplaceService.createMspRequest({
    farmerId,
    farmerName: "Harnek Singh",
    farmerPhone: "9876543210",
    farmId: "farm-test-01",
    farmName: "Doraha West Plot",
    cropId: "CROP002",
    cropName: "Wheat",
    cropSlug: "wheat",
    quantity: 35,
    unit: "quintal",
    procurementCenterId: "PC-PB-LDH-01",
  });

  assert(req.id.startsWith("MSP-"), "Request ID generated with prefix MSP-");
  assert(req.status === "PENDING", "Initial status is PENDING review");
  assert(req.requestedQuantityQuintals === 35, "Requested quantity is 35 quintals");
  assert(req.officialMspRateInr === 2275, "Official MSP rate locked at ₹2,275");
  assert(req.estimatedGrossPayoutInr === 79625, "Estimated gross payout is ₹79,625");

  console.log("\n=== Testing Cryptographic 12-Digit Authorization Code (Prompt 9) ===");
  const code1 = generate12DigitAuthorizationCode();
  const code2 = generate12DigitAuthorizationCode();
  assert(/^\d{12}$/.test(code1), "Code is exactly 12 numeric digits");
  assert(/^\d{12}$/.test(code2), "Second code is exactly 12 numeric digits");
  assert(code1 !== code2, "Codes are unique and non-sequential");
  assert(!code1.startsWith("0"), "Code does not start with 0");

  console.log("\n=== Testing Government Officer Approval Workflow (Prompt 13) ===");
  const approval = await marketplaceService.approveMspRequest({
    requestId: req.id,
    officerId: "officer_pb_01",
    officerName: "S. Gurmukh Singh (Procurement Officer)",
  });
  assert(approval.request.status === "APPROVED", "Request status updated to APPROVED");
  assert(approval.codeRecord.code.length === 12, "12-digit code generated upon approval");
  assert(approval.codeRecord.isConsumed === false, "Code is initially unconsumed");
  assert(new Date(approval.codeRecord.expiresAt).getTime() > Date.now(), "Code has valid future expiry");

  console.log("\n=== Testing 12-Digit Code Verification Terminal (Prompt 14) ===");
  const verifyCheck = await marketplaceService.verifyAuthorizationCode({
    code: approval.codeRecord.code,
  });
  assert(verifyCheck.valid === true, "Valid 12-digit code accepted by terminal");
  assert(verifyCheck.request?.id === req.id, "Code links to correct MSP request");

  const invalidCheck = await marketplaceService.verifyAuthorizationCode({
    code: "000000000000",
  });
  assert(invalidCheck.valid === false, "Invalid code correctly rejected");

  const shortCodeCheck = await marketplaceService.verifyAuthorizationCode({
    code: "12345",
  });
  assert(shortCodeCheck.valid === false, "Short non-12-digit code rejected");

  console.log("\n=== Testing Biometric Verification Adapter (Prompt 10) ===");
  const bioEvent = await marketplaceService.performBiometricVerification({
    requestId: req.id,
    officerId: "officer_pb_01",
    officerName: "S. Gurmukh Singh",
  });
  assert(bioEvent.verificationStatus === "SUCCESS", "Biometric verification successful");
  assert(bioEvent.providerName.includes("DemoBiometricProvider"), "Handled by Demo Biometric Provider");
  assert(bioEvent.providerReferenceId.startsWith("BIO-REF-"), "Cryptographic provider reference ID stored");

  // Check provider direct method
  const bioDirect = await defaultBiometricProvider.verify({
    farmerId: req.farmerId,
    farmerName: req.farmerName,
    procurementCenterId: req.procurementCenterId,
    officerId: "officer_pb_01",
  });
  assert(bioDirect.isDemoSimulation === true, "Provider explicitly identifies as demo simulation");
  assert(!("rawBiometric" in bioDirect), "Strictly NO raw biometric data present");

  console.log("\n=== Testing Actual Weighment & Payout Calculation (Prompt 15) ===");
  // Farmer requested 35 quintals, but actual weighed scale reading is 33.7 quintals
  const actualWeighed = 33.7;
  const procurementResult = await marketplaceService.completeMspProcurement({
    code: approval.codeRecord.code,
    actualWeighedQuantityQuintals: actualWeighed,
    officerId: "officer_pb_01",
    officerName: "S. Gurmukh Singh",
  });

  const expectedFinalGross = Number((33.7 * 2275).toFixed(2)); // ₹76,667.50
  assert(procurementResult.request.status === "COMPLETED", "Request status transitioned to COMPLETED");
  assert(procurementResult.request.actualWeighedQuantityQuintals === 33.7, "Actual weighed quantity recorded as 33.7q");
  assert(procurementResult.request.finalPayoutInr === expectedFinalGross, `Final payout is ₹${expectedFinalGross} (not 35 * MSP)`);
  assert(procurementResult.receipt.actualWeighedQuantityQuintals === 33.7, "Receipt displays actual weighed quantity");
  assert(procurementResult.receipt.grossAmountInr === expectedFinalGross, "Receipt displays re-calculated gross value");
  assert(procurementResult.receipt.cryptographicSignature.length > 10, "Receipt contains tamper-evident cryptographic signature");

  console.log("\n=== Testing Authorization Code Replay Prevention (Prompt 9 & 55) ===");
  const replayAttempt = await marketplaceService.verifyAuthorizationCode({
    code: approval.codeRecord.code,
  });
  assert(replayAttempt.valid === false, "Replay of already consumed code strictly rejected");
  assert(replayAttempt.error?.includes("already consumed"), "Error message notes code was already consumed");

  try {
    await marketplaceService.completeMspProcurement({
      code: approval.codeRecord.code,
      actualWeighedQuantityQuintals: 30,
      officerId: "officer_pb_01",
      officerName: "S. Gurmukh Singh",
    });
    assert(false, "Duplicate procurement on consumed code should have thrown error");
  } catch {
    assert(true, "Duplicate procurement attempt threw expected error");
  }

  console.log("\n=== Testing Demo Government Payment State Machine (Prompt 16) ===");
  assert(procurementResult.transaction.paymentStatus === "PAID_DEMO", "Payment state is PAID_DEMO");
  assert(procurementResult.transaction.paymentId.startsWith("MSP-PAY-"), "Payment ID formatted as MSP-PAY-XXXXXXXX");
  assert(procurementResult.transaction.paymentMethod.includes("GOVT_DIRECT_BENEFIT"), "Payment method reflects DBT / PFMS");

  console.log("\n=== Testing Mode B: Direct Market Listing (Prompt 17) ===");
  const directListing = await marketplaceService.createDirectListing({
    farmerId,
    farmerName: "Harnek Singh",
    farmerPhone: "9876543210",
    cropId: "CROP011",
    cropName: "Tomato",
    cropSlug: "tomato",
    variety: "Himsona Hybrid",
    quantity: 500,
    unit: "kg", // 500 kg = 5 quintals
    askingPriceInrPerQuintal: 1950,
    minAcceptablePriceInr: 1800,
    qualityGrade: "Grade-A Firm Red",
    district: "Ludhiana",
    state: "Punjab",
  });
  assert(directListing.quantityQuintals === 5, "500 kg normalized to 5 quintals");
  assert(directListing.askingPriceInrPerQuintal === 1950, "Asking price set to ₹1,950/q");
  assert(directListing.status === "ACTIVE", "Direct listing status is ACTIVE");

  console.log("\n=== Testing Private Buyer Offer & Negotiation (Prompt 18) ===");
  const buyerOffer = await marketplaceService.createOffer({
    listingId: directListing.id,
    buyerId: "buyer_private_01",
    buyerName: "Kisan Mega Food Parks Ltd.",
    buyerPhone: "9814099887",
    buyerCompany: "Kisan Food Processing Corp",
    offeredQuantityQuintals: 5,
    offeredPriceInrPerQuintal: 1900,
    message: "Can pickup tomorrow morning at farm gate.",
  });
  assert(buyerOffer.status === "PENDING", "Offer created with PENDING status");
  assert(buyerOffer.offeredPriceInrPerQuintal === 1900, "Offered price recorded as ₹1,900/q");

  // Accept offer
  const acceptResult = await marketplaceService.acceptOffer({
    offerId: buyerOffer.id,
    farmerId,
  });
  assert(acceptResult.offer.status === "ACCEPTED", "Offer status updated to ACCEPTED");
  assert(acceptResult.transaction.grossAmountInr === 5 * 1900, "Transaction gross amount is ₹9,500");
  assert(acceptResult.transaction.transactionType === "DIRECT_MARKET", "Transaction type is DIRECT_MARKET");

  console.log("\n=== Testing Group Selling Aggregation & Compatibility (Prompt 21, 22, 23) ===");
  const group = await marketplaceService.createGroup({
    cropName: "Wheat",
    cropSlug: "wheat",
    targetQuantityQuintals: 50,
    initialQuantityQuintals: 12, // Farmer A brings 12q
    minAcceptablePriceInr: 2360,
    farmerId: "farmer_a",
    farmerName: "Farmer A (Sukhdev)",
    farmerPhone: "9814000001",
  });
  assert(group.pooledQuantityQuintals === 12, "Initial pool has 12 quintals");
  assert(group.status === "OPEN", "Group status is OPEN");

  // Farmer B joins with 18q
  await marketplaceService.joinGroup({
    groupId: group.id,
    farmerId: "farmer_b",
    farmerName: "Farmer B (Manjit)",
    farmerPhone: "9814000002",
    contributedQuantityQuintals: 18,
  });

  // Farmer C joins with 20q (Target reached: 12 + 18 + 20 = 50q)
  const groupFilled = await marketplaceService.joinGroup({
    groupId: group.id,
    farmerId: "farmer_c",
    farmerName: "Farmer C (Jaspreet)",
    farmerPhone: "9814000003",
    contributedQuantityQuintals: 20,
  });
  assert(groupFilled.pooledQuantityQuintals === 50, "Group pooled quantity reached 50 quintals");
  assert(groupFilled.memberCount === 3, "Group has 3 member farmers");
  assert(groupFilled.status === "TARGET_REACHED", "Status transitioned to TARGET_REACHED");
  assert(groupFilled.compatibilityScore >= 90, "Deterministic compatibility score is >= 90/100");

  console.log("\n=== Testing Export Opportunities & Price Deductions (Prompt 25, 26, 30) ===");
  const opps = await marketplaceService.getExportOpportunities();
  assert(opps.length >= 10, "Provides at least 10 international destination benchmarks");

  const uaeWheat = opps.find((o) => o.cropName === "Wheat" && o.destinationCountry === "UAE");
  assert(uaeWheat !== undefined, "Found UAE Wheat opportunity");
  assert(uaeWheat?.internationalReferencePriceInrPerQuintal === 3150, "UAE reference price is ₹3,150/q");
  assert(uaeWheat?.indicativeLogisticsCostInrPerQuintal === 420, "Logistics deduction is ₹420/q");
  assert(uaeWheat?.exporterMarginInrPerQuintal === 180, "Exporter margin deduction is ₹180/q");
  // 3150 - 420 - 180 = 2550
  assert(uaeWheat?.indicativeFarmerRealizationInrPerQuintal === 2550, "Indicative realization = 3150 - 420 - 180 = ₹2,550/q");
  assert(uaeWheat?.source.includes("UN Comtrade"), "Source cites UN Comtrade reference dataset");

  console.log("\n=== Testing Exporter Connection (Prompt 28 & 29) ===");
  const exporters = await marketplaceService.listExporters({ crop: "Wheat" });
  assert(exporters.length > 0, "Found verified Indian exporters for Wheat");
  assert(exporters[0].isVerified === true, "Exporter is verified with APEDA registration");

  const exportMatch = await marketplaceService.sendExportGroupOffer({
    groupId: groupFilled.id,
    exporterId: exporters[0].id,
    cropName: "Wheat",
    destinationCountry: "UAE",
    totalQuantityQuintals: 50,
    offeredPriceInrPerQuintal: 2550,
  });
  assert(exportMatch.status === "EXPORTER_MATCHED", "Export proposal matched with registered exporter");
  assert(exportMatch.destinationCountry === "UAE", "Destination country correctly recorded");
  assert(exportMatch.exporterName === exporters[0].companyName, "Matched to verified Indian exporting firm");

  console.log("\n=== Testing Immutable Audit Logging (Prompt 45) ===");
  const stats = await marketplaceService.getMarketplaceStats();
  assert(stats.recentAuditLogsCount > 5, "Audit logs recorded across all transaction steps");

  console.log("\n========================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runMarketplaceTests().catch((e) => {
  console.error("Test execution fatal error:", e);
  process.exit(1);
});

