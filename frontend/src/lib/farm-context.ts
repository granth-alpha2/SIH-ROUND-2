import type { FarmerPreferenceRecord, RiskAppetite, ResourceLevel, SoilType } from "../app/api/preferences/repository";
import type { RecommendationInput } from "./recommendation-engine";

export type SoilTestSummary = {
  pH?: number;
  organicCarbon?: string;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
};

export type FarmSpecificContextInput = {
  farmerId?: string;
  farmId?: string;
  areaAcres?: number;
  district?: string;
  state?: string;
  locationName?: string;
  crop?: string;
  cropVariety?: string;
  soilType?: string;
  soilTestResults?: SoilTestSummary;
  irrigation?: string;
  expectedYieldQuintalsPerAcre?: number;
  historicalYieldQuintalsPerAcre?: number;
  harvestDate?: string;
  cropLifecycleStage?: string;
  farmName?: string;
  sellingChannel?: string;
  destination?: string;
  date?: string;
  quantityQuintals?: number;
  marketConditions?: string;
};

function normalizeSoilType(value?: string): SoilType | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  const lower = normalized.toLowerCase();
  if (lower.includes("alluvial")) return "Alluvial";
  if (lower.includes("black")) return "Black";
  if (lower.includes("red")) return "Red";
  if (lower.includes("sandy")) return "Sandy";
  if (lower.includes("clay")) return "Clay";
  if (lower.includes("loam")) return "Loam";
  return undefined;
}

function normalizeWaterLevel(value?: string): ResourceLevel | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower.includes("tube") || lower.includes("drip") || lower.includes("borewell") || lower.includes("canal")) return "High";
  if (lower.includes("rainfed") || lower.includes("low")) return "Low";
  return "Medium";
}

export function prefillRecommendationContext(
  input: FarmSpecificContextInput,
  preferences: FarmerPreferenceRecord,
  extra: Partial<RecommendationInput["context"]> = {}
): { preferences: FarmerPreferenceRecord; context: NonNullable<RecommendationInput["context"]> } {
  const soilType = normalizeSoilType(input.soilType || preferences.soilType) || preferences.soilType;
  const soilPh = input.soilTestResults?.pH ?? preferences.soilPh;
  const irrigation = input.irrigation || extra.irrigation || preferences.waterAvailability;
  const waterAvailability = normalizeWaterLevel(irrigation) || preferences.waterAvailability;

  const mergedPreferences: FarmerPreferenceRecord = {
    ...preferences,
    soilType: soilType,
    soilPh,
    waterAvailability,
  };

  const context: NonNullable<RecommendationInput["context"]> = {
    farmerId: input.farmerId,
    farmId: input.farmId,
    farmerName: extra.farmerName,
    farmName: input.farmName || extra.farmName || "Farm",
    locationName: input.locationName || extra.locationName || `${input.district || extra.district || "Selected"}, ${input.state || extra.state || "India"}`,
    state: input.state || extra.state,
    district: input.district || extra.district,
    cropName: input.crop || extra.cropName,
    cropVariety: input.cropVariety || extra.cropVariety,
    soilType: soilType,
    irrigation: irrigation,
    expectedYieldQuintalsPerAcre: input.expectedYieldQuintalsPerAcre ?? extra.expectedYieldQuintalsPerAcre,
    historicalYieldQuintalsPerAcre: input.historicalYieldQuintalsPerAcre ?? extra.historicalYieldQuintalsPerAcre,
    harvestDate: input.harvestDate || extra.harvestDate,
    cropLifecycleStage: input.cropLifecycleStage || extra.cropLifecycleStage,
    sellingChannel: input.sellingChannel || extra.sellingChannel,
    destination: input.destination || extra.destination,
    date: input.date || extra.date,
    quantityQuintals: input.quantityQuintals ?? extra.quantityQuintals,
    marketConditions: input.marketConditions || extra.marketConditions,
  };

  return { preferences: mergedPreferences, context };
}
