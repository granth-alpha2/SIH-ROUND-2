/**
 * AgriProfit — Biometric Verification Adapter & Providers
 * ========================================================
 * Architectural interface for identity verification at Government MSP Centers.
 * Complies with strict data protection guidelines:
 * - NEVER stores raw biometric images, iris scans, or templates.
 * - Stores ONLY cryptographic provider references, timestamps, and verification status.
 * - Clearly labeled as "Biometric Verification — Demo" for SIH2026.
 */

export type BiometricMethod = "EYE_IRIS_DEMO" | "AADHAAR_OTP_DEMO" | "FINGERPRINT_DEMO";

export type BiometricVerifyResult = {
  success: boolean;
  status: "VERIFIED" | "FAILED" | "REJECTED";
  providerName: string;
  providerReferenceId: string;
  verificationMethod: BiometricMethod;
  timestamp: string;
  isDemoSimulation: true;
  label: string;
  message: string;
};

export interface IBiometricProvider {
  getProviderName(): string;
  verify(params: {
    farmerId: string;
    farmerName: string;
    procurementCenterId: string;
    officerId: string;
    method?: BiometricMethod;
  }): Promise<BiometricVerifyResult>;
  getVerificationStatus(providerReferenceId: string): Promise<{
    verified: boolean;
    timestamp: string;
    method: BiometricMethod;
  }>;
}

/**
 * DemoBiometricProvider simulates government iris/biometric scanner
 * without capturing or storing real biometric identifiers.
 */
export class DemoBiometricProvider implements IBiometricProvider {
  private static verifiedRegistry: Map<string, { verified: boolean; timestamp: string; method: BiometricMethod }> = new Map();

  getProviderName(): string {
    return "DemoBiometricProvider (UIDAI Iris Emulation v1.2)";
  }

  async verify(params: {
    farmerId: string;
    farmerName: string;
    procurementCenterId: string;
    officerId: string;
    method?: BiometricMethod;
  }): Promise<BiometricVerifyResult> {
    const method: BiometricMethod = params.method || "EYE_IRIS_DEMO";
    const timestamp = new Date().toISOString();

    // Generate cryptographic provider reference (never contains raw biometric data)
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const referenceHex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const providerReferenceId = `BIO-REF-${referenceHex.toUpperCase()}`;

    // Record verified status
    DemoBiometricProvider.verifiedRegistry.set(providerReferenceId, {
      verified: true,
      timestamp,
      method,
    });

    return {
      success: true,
      status: "VERIFIED",
      providerName: this.getProviderName(),
      providerReferenceId,
      verificationMethod: method,
      timestamp,
      isDemoSimulation: true,
      label: "Biometric Verification — Demo",
      message: `Eye biometric verified successfully for farmer ${params.farmerName} (Demo Mode).`,
    };
  }

  async getVerificationStatus(providerReferenceId: string): Promise<{
    verified: boolean;
    timestamp: string;
    method: BiometricMethod;
  }> {
    const found = DemoBiometricProvider.verifiedRegistry.get(providerReferenceId);
    if (found) {
      return found;
    }
    return {
      verified: false,
      timestamp: new Date().toISOString(),
      method: "EYE_IRIS_DEMO",
    };
  }
}

export const defaultBiometricProvider: IBiometricProvider = new DemoBiometricProvider();

