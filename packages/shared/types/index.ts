/**
 * @agriprofit/shared — Core TypeScript Interfaces & Types
 * =======================================================
 * Monorepo shared domain models for farmers, spatial farms, crops,
 * weather feeds, mandi prices, recommendations, and notifications.
 */

// 1. User & Authentication Types
export type UserRole = "farmer" | "fpo_admin" | "admin";

export type UserProfile = {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

// 2. Spatial Farm & Boundaries Types
export type LatLngPoint = {
  lat: number;
  lng: number;
};

export type FarmSection = {
  id: string;
  name: string;
  areaAcres: number;
  cropAssigned?: string;
  soilType?: string;
};

export type FarmRecord = {
  id: string;
  userId: string;
  name: string;
  areaAcres: number;
  areaHectares: number;
  center: LatLngPoint;
  boundary: LatLngPoint[];
  sections: FarmSection[];
  preferences?: {
    risk?: "Conservative" | "Balanced" | "Growth";
    water?: "Low" | "Medium" | "High";
  };
  createdAt: string;
  updatedAt: string;
};

// 3. Farmer Preferences Types
export type RiskAppetite = "Conservative" | "Balanced" | "Growth";
export type ResourceLevel = "Low" | "Medium" | "High";
export type SoilType = "Alluvial" | "Black" | "Red" | "Laterite" | "Loam" | "Sandy";

export type FarmerPreferences = {
  id: string;
  userId: string;
  riskAppetite: RiskAppetite;
  waterAvailability: ResourceLevel;
  investmentCapacity: ResourceLevel;
  preferredCrops: string[];
  cropsToAvoid: string[];
  farmingExperienceYears: number;
  soilType: SoilType;
  soilPh: number;
  soilOrganicCarbon: ResourceLevel;
  updatedAt: string;
};

// 4. Crop Database Types
export type CropSeason = "Kharif" | "Rabi" | "Zaid" | "Perennial";
export type CropCategory = "Cereal" | "Pulse" | "Oilseed" | "Cash Crop" | "Vegetable";

export type CropRecord = {
  id: string;
  name: string;
  hindiName: string;
  slug: string;
  category: CropCategory;
  season: CropSeason;
  durationDays: number;
  waterLevel: ResourceLevel;
  waterRequirementMm: number;
  tempRange: { min: number; max: number; idealMin: number; idealMax: number };
  rainfallMm: { min: number; max: number; optimal: number };
  suitableSoils: string[];
  yield: { quintalsPerAcre: number; potentialMax: number };
  costs: { seed: number; fertilizer: number; labor: number; irrigation: number; totalPerAcre: number };
  economics: { typicalPricePerQuintal: number; mspEligible: boolean; mspPricePerQuintal: number | null; expectedNetProfitPerAcre: number; roi: number };
  riskFactors: string[];
  pestsAndDiseases: string[];
  provenance: { benchmarkSource: string; sourceType: "official" | "estimated"; verifiedAt: string };
};

// 5. Agro-Meteorological Weather Types
export type DailyForecastDay = {
  date: string;
  dayName: string;
  tempMinC: number;
  tempMaxC: number;
  rainfallMm: number;
  rainProbabilityPct: number;
  humidityPct: number;
  windSpeedKmh: number;
  condition: string;
  icon: string;
};

export type ExtremeWeatherAlert = {
  type: "frost" | "heatwave" | "heavy_rain" | "high_winds" | "dry_spell";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  advisoryAction: string;
};

export type AgriWeatherReport = {
  location: { name: string; lat: number; lng: number };
  current: { tempC: number; feelsLikeC: number; humidityPct: number; rainfallMm: number; windSpeedKmh: number; condition: string; icon: string; uvIndex: number; recordedAt: string };
  dailyForecast: DailyForecastDay[];
  seasonalOutlook: { cumulativeRain90DaysMm: number; rainyDaysSeason: number; avgRelativeHumidityPct: number; weatherSuitabilityScore: number; riskLevel: "Low" | "Moderate" | "High" };
  extremeAlerts: ExtremeWeatherAlert[];
  provenance: { provider: "open-meteo" | "regional_baseline"; cached: boolean; fetchedAt: string };
};

// 6. Market & MSP Types
export type VolatilityRating = "Low" | "Medium" | "High";
export type MandiPriceRecord = {
  cropId: string;
  cropSlug: string;
  cropName: string;
  hindiName: string;
  mandiName: string;
  district: string;
  state: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  arrivalsTonnes: number;
  unit: string;
  trend30DayPct: number;
  volatility: VolatilityRating;
  volatilityPct: number;
  mspPrice: number | null;
  mspDifferencePct: number | null;
  procurementSafety: string;
  historical6Months: { month: string; modalPrice: number; minPrice: number; maxPrice: number; arrivalsTonnes: number }[];
  provenance: { sourceType: string; sourceName: string; recordedDate: string; verifiedOfficial: boolean };
};

export type MspRecord = {
  id: string;
  cropId: string;
  cropName: string;
  category: string;
  season: "Kharif" | "Rabi" | "Commercial";
  year: number;
  mspPricePerQuintal: number;
  unit: string;
  c2CostEstimatePerQuintal: number;
  returnOverCostPct: number;
  procurementAgencies: string[];
  effectiveDate: string;
  provenance: { sourceType: string; sourceName: string; notificationNumber: string };
};

// 7. Recommendation & Portfolio Types
export type StrategyAllocationRole = 
  | "Part 1: Safety (Downside Floor)"
  | "Part 2: Stability & Profit (Dependable Income)"
  | "Part 3: High-Profit Opportunity (Upside Capture)"
  | "Part 4: Intelligent Growth & Diversity (Soil & Rotation)";

export type AllocatedCropItem = {
  cropId: string;
  cropSlug: string;
  cropName: string;
  hindiName: string;
  category: string;
  season: string;
  strategyRole: StrategyAllocationRole;
  allocatedAcres: number;
  percentage: number;
  score: number;
  expectedYieldPerAcre: number;
  expectedSellingPricePerQuintal: number;
  costPerAcre: number;
  allocatedRevenue: number;
  allocatedCost: number;
  allocatedProfit: number;
  breakEvenPrice: number;
  breakEvenYield: number;
  mspSafety: boolean;
  mspPrice: number | null;
  reasonsForAllocation: string[];
  dataLineageSources: string[];
};

export type PortfolioScenarioSimulation = {
  scenarioId: string;
  scenarioName: string;
  description: string;
  probability: "High" | "Moderate" | "Low";
  revenueImpactPct: number;
  costImpactPct: number;
  simulatedRevenueInr: number;
  simulatedCostInr: number;
  simulatedProfitInr: number;
  isLossScenario: boolean;
  resilienceRating: "High" | "Moderate" | "Vulnerable";
};

export type FourPartStrategySummary = {
  safetyAllocation: { acres: number; percentage: number; primaryCrop: string; rationale: string };
  stabilityAllocation: { acres: number; percentage: number; primaryCrop: string; rationale: string };
  profitOpportunityAllocation: { acres: number; percentage: number; primaryCrop: string; rationale: string };
  growthDiversificationAllocation: { acres: number; percentage: number; primaryCrop: string; rationale: string };
};

export type OptimizedPortfolio = {
  id: string;
  title: string;
  totalAvailableAcres: number;
  totalAllocatedAcres: number;
  unallocatedAcres: number;
  season: CropSeason;
  riskAppetite: RiskAppetite;
  portfolioRisk: "Low" | "Moderate" | "High";
  overallScore: number;
  expectedRevenue: number;
  estimatedCost: number;
  expectedProfit: number;
  roiMultiplier: number;
  roiPercentage: number;
  budgetCapInr: number;
  budgetUtilizedPercentage: number;
  allocations: AllocatedCropItem[];
  fourPartStrategy: FourPartStrategySummary;
  scenarioSimulations: PortfolioScenarioSimulation[];
  diversificationExplanation: string;
  constraintsChecked: {
    landConstraintSatisfied: boolean;
    budgetConstraintSatisfied: boolean;
    waterConstraintSatisfied: boolean;
    excludedCropsRespected: boolean;
  };
  dataLineage: {
    datasetsUsed: string[];
    modelsUsed: string[];
    generatedAt: string;
  };
  generatedAt: string;
};


// 8. Notifications Types
export type NotificationType = "irrigation" | "weather_alert" | "disease_risk" | "market_price" | "crop_stage";
export type NotificationSeverity = "info" | "warning" | "critical";

export type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  severity: NotificationSeverity;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, unknown>;
  createdAt: string;
};

