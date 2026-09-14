/**
 * AgriProfit — Secondary Marketplace Domain Types & Enums
 * ========================================================
 * Implements strict type safety for MSP Procurement, Direct Farm-to-Market,
 * Group Selling, and Export Marketplaces.
 */

export type QuantityUnit = "kg" | "quintal" | "tonne";

export type MspRequestStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "CODE_GENERATED"
  | "ARRIVED"
  | "CODE_VERIFIED"
  | "BIOMETRIC_VERIFIED"
  | "WEIGHED"
  | "COMPLETED"
  | "PAYMENT_INITIATED"
  | "PAID"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type DirectListingStatus =
  | "DRAFT"
  | "ACTIVE"
  | "OFFER_RECEIVED"
  | "NEGOTIATING"
  | "ACCEPTED"
  | "FULFILLMENT_PENDING"
  | "DELIVERED"
  | "PAYMENT_PENDING"
  | "COMPLETED"
  | "CANCELLED";

export type GroupSellingStatus =
  | "OPEN"
  | "TARGET_REACHED"
  | "OFFER_RECEIVED"
  | "ACCEPTED"
  | "FULFILLED"
  | "CANCELLED";

export type ExportMatchStatus =
  | "GROUP_OPEN"
  | "GROUP_FILLED"
  | "EXPORTER_MATCHED"
  | "OFFER_RECEIVED"
  | "OFFER_ACCEPTED"
  | "LOGISTICS_PENDING"
  | "FULFILLMENT"
  | "COMPLETED";

export type PaymentTransactionStatus =
  | "PAYMENT_INITIATED"
  | "PROCESSING"
  | "PAID_DEMO"
  | "FAILED";

export type MarketplaceUserRole =
  | "farmer"
  | "government_buyer"
  | "private_buyer"
  | "exporter"
  | "admin";

export interface ProcurementCenter {
  id: string;
  name: string;
  agency: string;
  district: string;
  state: string;
  address: string;
  contactPhone: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

export interface MspProcurementRequest {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmId?: string;
  farmName?: string;
  cropId: string;
  cropName: string;
  cropSlug: string;
  season: string;
  requestedQuantityQuintals: number;
  originalUnit: QuantityUnit;
  originalQuantity: number;
  cropGrade: string;
  expectedHarvestDate?: string;
  procurementCenterId: string;
  procurementCenterName: string;
  officialMspRateInr: number;
  mspSourceReference: string;
  mspLastVerifiedAt: string;
  mandiModalReferenceInr: number;
  mlExpectedPriceInr: number;
  estimatedGrossPayoutInr: number;
  status: MspRequestStatus;
  authorizationCode?: string;
  authorizationCodeExpiresAt?: string;
  rejectionReason?: string;
  reviewedByOfficerId?: string;
  reviewedByOfficerName?: string;
  reviewedAt?: string;
  actualWeighedQuantityQuintals?: number;
  finalPayoutInr?: number;
  paymentStatus: "UNPAID" | "PAYMENT_INITIATED" | "PROCESSING" | "PAID";
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MspAuthorizationCodeRecord {
  code: string; // Exactly 12 numeric digits
  requestId: string;
  farmerId: string;
  cropSlug: string;
  approvedQuantityQuintals: number;
  procurementCenterId: string;
  expiresAt: string;
  isConsumed: boolean;
  consumedAt?: string;
  consumedByOfficerId?: string;
  createdAt: string;
}

export interface BiometricVerificationEvent {
  id: string;
  requestId: string;
  farmerId: string;
  officerId: string;
  verificationMethod: string;
  providerName: string;
  providerReferenceId: string;
  verificationStatus: "SUCCESS" | "FAILED";
  verificationNote: string;
  verifiedAt: string;
}

export interface DirectMarketListing {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmId?: string;
  cropId: string;
  cropName: string;
  cropSlug: string;
  variety?: string;
  quantityQuintals: number;
  availableQuantityQuintals: number;
  askingPriceInrPerQuintal: number;
  minAcceptablePriceInr: number;
  qualityGrade: string;
  harvestDate?: string;
  availableDate: string;
  district: string;
  state: string;
  deliveryTerms: "FARM_PICKUP" | "MANDI_DELIVERY" | "BUYER_LOGISTICS";
  description?: string;
  status: DirectListingStatus;
  mspReferenceInr: number;
  mandiModalReferenceInr: number;
  mlExpectedPriceInr: number;
  createdAt: string;
  updatedAt: string;
}

export interface DirectMarketOffer {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerCompany?: string;
  offeredQuantityQuintals: number;
  offeredPriceInrPerQuintal: number;
  counterPriceInrPerQuintal?: number;
  message?: string;
  deliveryLocation?: string;
  status: "PENDING" | "COUNTERED" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

export interface GroupSellingGroup {
  id: string;
  groupCode: string; // e.g. GRP-WHEAT-2026-001
  cropName: string;
  cropSlug: string;
  targetQuantityQuintals: number;
  pooledQuantityQuintals: number;
  memberCount: number;
  district: string;
  state: string;
  minAcceptablePriceInr: number;
  status: GroupSellingStatus;
  compatibilityScore: number;
  createdByFarmerId: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  contributedQuantityQuintals: number;
  agreedPriceInrPerQuintal: number;
  village?: string;
  joinedAt: string;
}

export interface IndianExporter {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  locationCity: string;
  locationState: string;
  cropsHandled: string[];
  destinationCountries: string[];
  minOrderQuintals: number;
  isVerified: boolean;
  iecCode: string;
  apedaRegistration: string;
}

export interface ExportOpportunity {
  cropName: string;
  cropSlug: string;
  destinationCountry: string;
  countryCode: string;
  internationalReferencePriceInrPerKg: number;
  internationalReferencePriceInrPerQuintal: number;
  currency: string;
  unit: string;
  period: string;
  source: string;
  tradeVolumeTonnes: number;
  demandIndicator: "Expanding" | "Stable" | "High Demand";
  indicativeLogisticsCostInrPerQuintal: number;
  exporterMarginInrPerQuintal: number;
  indicativeFarmerRealizationInrPerQuintal: number;
  lastUpdated: string;
  availableExportersCount: number;
}

export interface ExportGroupMatch {
  id: string;
  groupId?: string;
  farmerId?: string;
  exporterId: string;
  exporterName: string;
  cropName: string;
  destinationCountry: string;
  totalQuantityQuintals: number;
  offeredPriceInrPerQuintal: number;
  internationalReferencePriceInrPerQuintal: number;
  estimatedLogisticsCostInr: number;
  exporterMarginInr: number;
  indicativeFarmerRealizationInr: number;
  matchScore: number;
  status: ExportMatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceTransaction {
  id: string;
  transactionType: "MSP_PROCUREMENT" | "DIRECT_MARKET" | "GROUP_SALE" | "EXPORT";
  referenceId: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  cropName: string;
  quantityQuintals: number;
  rateInrPerQuintal: number;
  grossAmountInr: number;
  netPayoutInr: number;
  paymentId: string;
  paymentStatus: PaymentTransactionStatus;
  paymentMethod: string;
  receiptDetails?: ProcurementReceipt;
  createdAt: string;
}

export interface ProcurementReceipt {
  receiptNumber: string;
  transactionId: string;
  farmerName: string;
  farmerId: string;
  cropName: string;
  grade: string;
  procurementCenter: string;
  officerName: string;
  requestedQuantityQuintals: number;
  actualWeighedQuantityQuintals: number;
  mspRatePerQuintal: number;
  grossAmountInr: number;
  authorizationCodeUsed: string;
  biometricVerificationStatus: string;
  paymentId: string;
  paymentStatus: string;
  timestamp: string;
  cryptographicSignature: string;
}

export interface RequestBasketItem {
  listingId: string;
  cropName: string;
  farmerName: string;
  availableQuantityQuintals: number;
  requestQuantityQuintals: number;
  pricePerQuintal: number;
  location: string;
}

export interface MarketplaceAuditLog {
  id: string;
  eventType: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

