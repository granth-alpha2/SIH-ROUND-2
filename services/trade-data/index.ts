/**
 * @agriprofit/services/trade-data — International Trade Signal Service (FAOSTAT / UN Comtrade)
 * ============================================================================================
 */

export type InternationalTradeSignal = {
  cropName: string;
  globalDemandTrend: "Expanding" | "Stable" | "Contracting";
  exportVolumeTonnes: number;
  topImportingCountries: string[];
  tradeMomentumScore: number; // 0-100
  lastUpdated: string;
};

export const INTERNATIONAL_TRADE_SIGNALS: Record<string, InternationalTradeSignal> = {
  Wheat: {
    cropName: "Wheat",
    globalDemandTrend: "Stable",
    exportVolumeTonnes: 5400000,
    topImportingCountries: ["Bangladesh", "Middle East", "Southeast Asia"],
    tradeMomentumScore: 78,
    lastUpdated: "2024-08-01",
  },
  Mustard: {
    cropName: "Mustard",
    globalDemandTrend: "Expanding",
    exportVolumeTonnes: 1200000,
    topImportingCountries: ["South Korea", "Vietnam", "Europe (Meal)"],
    tradeMomentumScore: 88,
    lastUpdated: "2024-08-01",
  },
  Cotton: {
    cropName: "Cotton",
    globalDemandTrend: "Expanding",
    exportVolumeTonnes: 2800000,
    topImportingCountries: ["Bangladesh", "Vietnam", "China"],
    tradeMomentumScore: 84,
    lastUpdated: "2024-08-01",
  },
  Chickpea: {
    cropName: "Chickpea",
    globalDemandTrend: "Stable",
    exportVolumeTonnes: 850000,
    topImportingCountries: ["UAE", "Saudi Arabia", "Algeria"],
    tradeMomentumScore: 72,
    lastUpdated: "2024-08-01",
  },
};

export function getTradeSignal(cropName: string): InternationalTradeSignal | null {
  const clean = cropName.split(" ")[0];
  return INTERNATIONAL_TRADE_SIGNALS[clean] || null;
}

