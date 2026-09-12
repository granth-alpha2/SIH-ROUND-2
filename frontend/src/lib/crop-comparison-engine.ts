/**
 * AgriProfit — Crop Comparison Engine ("Apni Fasal vs AI Fasal")
 * =============================================================
 * Enables farmers to test their intuitive / traditional crop choice head-to-head
 * against the top AI recommended crop under identical weather, soil, and financial rules.
 */

import { CROP_DATABASE, type CropRecord, type CropSeason } from "./crop-data";
import { MANDI_BENCHMARK_PRICES } from "./market-service";
import {
  scoreSingleCrop,
  generateRecommendations,
  type CropScoreOutput,
} from "./recommendation-engine";
import type { FarmerPreferenceRecord } from "../app/api/preferences/repository";
import type { AgriWeatherReport } from "./weather-service";

export type CropComparisonResult = {
  farmerChoice: CropScoreOutput;
  aiTopPick: CropScoreOutput;
  areaAcres: number;
  profitGap: number; // aiTopPick.financials.expectedNetProfit - farmerChoice.financials.expectedNetProfit
  profitGapPercent: number;
  roiGap: number;
  verdict: "ai_better" | "farmer_choice_good" | "comparable";
  verdictSentence: {
    en: string;
    hi: string;
  };
  reasonsAiIsBetter: string[];
  reasonsToStickWithFarmerChoice: string[];
  generatedAt: string;
};

// Common aliases and phonetic transliterations in Hindi/English
const CROP_ALIASES: Record<string, string[]> = {
  wheat: ["gehun", "gehu", "wheat", "गेंहू", "गेहूं", "godhumai", "kanak"],
  mustard: ["sarson", "sarso", "rai", "mustard", "सरसों", "राई", "kadugu"],
  chickpea: ["chana", "chane", "chickpea", "gram", "चना", "छोले", "kadalai"],
  maize: ["makka", "makai", "corn", "maize", "मक्का", "मकई", "cholam"],
  soybean: ["soya", "soyabean", "soybean", "सोयाबीन"],
  cotton: ["kapas", "rui", "cotton", "कपास", "रूई", "paruthi"],
  onion: ["pyaz", "pyaaz", "kanda", "onion", "प्याज़", "प्याज", "कांदा", "vengayam"],
  potato: ["aloo", "aalu", "potato", "आलू", "batata", "urulaikizhangu"],
  paddy: ["dhan", "chawal", "rice", "paddy", "धान", "चावल", "arisi", "nellu"],
  groundnut: ["moongfali", "mungfali", "groundnut", "peanut", "मूंगफली", "shengdana"],
  sugarcane: ["ganna", "sugarcane", "गन्ना", "karumbu"],
  barley: ["jau", "barley", "जौ"],
  lentil: ["masoor", "masur", "lentil", "मसूर", "मसूर दाल", "paruppu"],
  tomato: ["tamatar", "tomato", "टमाटर", "thakkali"],
  sunflower: ["surajmukhi", "sunflower", "सूरजमुखी"],
  "pearl-millet": ["bajra", "pearl millet", "बाजरा", "kambu"],
  sorghum: ["jowar", "sorghum", "ज्वार", "cholam"],
  "pigeon-pea": ["arhar", "tur", "toor", "pigeon pea", "अरहर", "तुअर", "तूर दाल"],
  chili: ["mirch", "mirchi", "chilli", "chili", "मिर्च", "लाल मिर्च"],
  turmeric: ["haldi", "turmeric", "हल्दी", "manjal"],
  banana: ["kela", "banana", "केला", "vazhaipazham"],
  mango: ["aam", "mango", "आम", "mambazham"],
};

/**
 * Fuzzy & Multilingual resolver for crop query
 */
export function resolveCropByQuery(query: string): {
  crop: CropRecord | null;
  suggestions: string[];
} {
  if (!query || typeof query !== "string") {
    return {
      crop: null,
      suggestions: CROP_DATABASE.slice(0, 3).map((c) => `${c.name} (${c.hindiName})`),
    };
  }

  const clean = query.trim().toLowerCase();

  // 1. Direct match on slug
  let matched = CROP_DATABASE.find(
    (c) => c.slug.toLowerCase() === clean || c.id.toLowerCase() === clean
  );
  if (matched) return { crop: matched, suggestions: [] };

  // 2. Direct match on English or Hindi name
  matched = CROP_DATABASE.find(
    (c) =>
      c.name.toLowerCase() === clean ||
      c.hindiName.trim() === clean ||
      c.name.toLowerCase().includes(clean) ||
      clean.includes(c.name.toLowerCase())
  );
  if (matched) return { crop: matched, suggestions: [] };

  // 3. Match via Alias table (exact match or word-level token match)
  for (const [slug, aliases] of Object.entries(CROP_ALIASES)) {
    if (
      aliases.some((a) => {
        const aLow = a.toLowerCase();
        if (aLow === clean) return true;
        const words = clean.split(/[\s,/-]+/);
        return words.includes(aLow);
      })
    ) {
      const found = CROP_DATABASE.find((c) => c.slug === slug);
      if (found) return { crop: found, suggestions: [] };
    }
  }

  // 4. Substring / Token matching (require min length 4 to prevent spurious false positives)
  matched = CROP_DATABASE.find((c) => {
    const tokens = [c.name.toLowerCase(), c.hindiName.toLowerCase(), c.slug.toLowerCase()];
    return tokens.some((t) => {
      if (t === clean) return true;
      if (clean.length >= 4 && t.includes(clean)) return true;
      const cleanWords = clean.split(/[\s,/-]+/);
      return cleanWords.some((w) => w.length >= 4 && t.includes(w));
    });
  });
  if (matched) return { crop: matched, suggestions: [] };

  // 5. No match found -> Return top 3 suggestions
  const suggestions = CROP_DATABASE.slice(0, 3).map((c) => `${c.name} (${c.hindiName})`);
  return { crop: null, suggestions };
}

export class CropNotFoundError extends Error {
  suggestions: string[];
  constructor(query: string, suggestions: string[]) {
    super(`Crop "${query}" not found in agronomic catalog.`);
    this.name = "CropNotFoundError";
    this.suggestions = suggestions;
  }
}

/**
 * Compare a farmer's intuitive crop choice against the top AI recommendation
 */
export function compareFarmerCropChoice(input: {
  farmAreaAcres: number;
  currentSeason?: CropSeason;
  preferences: FarmerPreferenceRecord;
  weather?: AgriWeatherReport;
  farmerChosenCropSlug: string;
}): CropComparisonResult {
  const area = Math.max(0.5, input.farmAreaAcres || 2.5);
  const season: CropSeason = input.currentSeason || "Rabi";
  const prefs = input.preferences;
  const weather = input.weather;

  // 1. Resolve Farmer Crop
  const { crop: farmerCrop, suggestions } = resolveCropByQuery(input.farmerChosenCropSlug);
  if (!farmerCrop) {
    throw new CropNotFoundError(input.farmerChosenCropSlug, suggestions);
  }

  // 2. Generate AI Recommendations Portfolio
  const aiPortfolio = generateRecommendations({
    farmAreaAcres: area,
    currentSeason: season,
    preferences: prefs,
    weather,
  });

  // Top AI crop pick
  const topAllocation = aiPortfolio.allocations[0];
  const aiTopCrop =
    CROP_DATABASE.find((c) => c.id === topAllocation?.crop?.cropId || c.slug === topAllocation?.crop?.slug) ||
    CROP_DATABASE[0];

  // 3. Score Both Crops with Identical Acreage for Fair Comparison (100% of Land)
  const farmerMandi = MANDI_BENCHMARK_PRICES.find(
    (m) => m.cropSlug === farmerCrop.slug || m.cropId === farmerCrop.id
  );
  const aiMandi = MANDI_BENCHMARK_PRICES.find(
    (m) => m.cropSlug === aiTopCrop.slug || m.cropId === aiTopCrop.id
  );

  const farmerChoiceScored = scoreSingleCrop(farmerCrop, prefs, weather, farmerMandi, area);
  const aiTopPickScored = scoreSingleCrop(aiTopCrop, prefs, weather, aiMandi, area);

  // 4. Compute Deltas & Financial Gap
  const farmerNetProfit = farmerChoiceScored.financials.expectedNetProfit;
  const aiNetProfit = aiTopPickScored.financials.expectedNetProfit;
  const profitGap = aiNetProfit - farmerNetProfit;

  const baseProfit = Math.max(1, Math.abs(farmerNetProfit));
  const profitGapPercent = Number(((profitGap / baseProfit) * 100).toFixed(1));
  const roiGap = Number(
    (aiTopPickScored.financials.roiMultiplier - farmerChoiceScored.financials.roiMultiplier).toFixed(2)
  );

  // 5. Determine Verdict
  // If difference is within 8% of profit, or farmer choice is identical crop, consider comparable
  let verdict: "ai_better" | "farmer_choice_good" | "comparable" = "comparable";
  if (farmerCrop.id === aiTopCrop.id || Math.abs(profitGapPercent) < 8) {
    verdict = "comparable";
  } else if (profitGap > 0) {
    verdict = "ai_better";
  } else {
    verdict = "farmer_choice_good";
  }

  // 6. Generate Plain-Language Verdict Sentences (Hi & En)
  const formattedProfitGap = Math.abs(profitGap).toLocaleString("en-IN");
  let verdictEn = "";
  let verdictHi = "";

  if (farmerCrop.id === aiTopCrop.id) {
    verdictEn = `Great choice! Your crop (${farmerCrop.name}) is also our top AI recommendation!`;
    verdictHi = `शानदार पसंद! आपकी फसल (${farmerCrop.hindiName}) ही AI की नंबर-1 पसंद है!`;
  } else if (verdict === "ai_better") {
    verdictEn = `You could earn ₹${formattedProfitGap} more with the AI recommended crop (${aiTopCrop.name}).`;
    verdictHi = `AI की फसल (${aiTopCrop.hindiName}) से आपको लगभग ₹${formattedProfitGap} ज़्यादा मुनाफा हो सकता है।`;
  } else if (verdict === "farmer_choice_good") {
    verdictEn = `Your choice (${farmerCrop.name}) is profitable and earns ₹${formattedProfitGap} more!`;
    verdictHi = `आपकी फसल (${farmerCrop.hindiName}) बहुत बढ़िया है और ₹${formattedProfitGap} ज़्यादा मुनाफा दे सकती है!`;
  } else {
    verdictEn = `Your choice (${farmerCrop.name}) is solid and compares closely to the AI recommendation.`;
    verdictHi = `आपकी पसंद (${farmerCrop.hindiName}) भी बहुत अच्छी है और AI फसल के बिल्कुल बराबर है!`;
  }

  // 7. Generate Reasons from Actual Factor Deltas (Max 3 each)
  const reasonsAiIsBetter: string[] = [];
  const reasonsToStickWithFarmerChoice: string[] = [];

  // A. Profit delta
  if (profitGap > 1000) {
    reasonsAiIsBetter.push(
      `₹${formattedProfitGap} zyada munafa milne ki sambhavna hai (Potential extra profit)`
    );
  }

  // B. MSP Safety
  if (aiTopPickScored.factors.mspSafety >= 80 && farmerChoiceScored.factors.mspSafety < 60) {
    reasonsAiIsBetter.push(
      `Sarkar dwara MSP kharid sunishchit hai (Guaranteed Government MSP purchase floor)`
    );
  } else if (farmerChoiceScored.factors.mspSafety >= 80) {
    reasonsToStickWithFarmerChoice.push(
      `Aapki fasal par Sarkar ki MSP suraksha uplabdh hai (MSP floor price safety guaranteed)`
    );
  }

  // C. Weather & Water Fit
  if (aiTopPickScored.factors.weatherSuitability - farmerChoiceScored.factors.weatherSuitability >= 15) {
    reasonsAiIsBetter.push(
      `Aapke ilake ke paani aur mausam ke liye zyada anukool hai (Better weather & water suitability)`
    );
  } else if (farmerChoiceScored.factors.weatherSuitability >= 80) {
    reasonsToStickWithFarmerChoice.push(
      `Aapke khet ke mausam aur mitti ke bilkul anukool hai (Naturally suited for your climate & soil)`
    );
  }

  // D. Input Cost comparison
  const farmerCost = farmerChoiceScored.financials.totalEstimatedCost;
  const aiCost = aiTopPickScored.financials.totalEstimatedCost;
  if (farmerCost < aiCost) {
    const costSavings = Math.round(aiCost - farmerCost).toLocaleString("en-IN");
    reasonsToStickWithFarmerChoice.push(
      `Kam laagat: ₹${costSavings} kam kharch me kheti ho jayegi (Lower input cost & less capital needed)`
    );
  } else if (aiCost < farmerCost) {
    const costSavings = Math.round(farmerCost - aiCost).toLocaleString("en-IN");
    reasonsAiIsBetter.push(
      `Kam beej aur khad kharch: ₹${costSavings} ki bachat (Lower seed & fertilizer cost)`
    );
  }

  // E. Market Opportunity
  if (aiTopPickScored.factors.marketOpportunity - farmerChoiceScored.factors.marketOpportunity >= 15) {
    reasonsAiIsBetter.push(
      `Mandi me mang zyada hai aur bhav tezi se milne ki umeed hai (Higher market demand & active buyers)`
    );
  }

  // F. Familiarity & Home seeds fallback
  if (reasonsToStickWithFarmerChoice.length < 3) {
    reasonsToStickWithFarmerChoice.push(
      `Purana anubhav: Beej aur kheti ki jaankari pehle se hai (Prior experience & familiarity)`
    );
  }

  return {
    farmerChoice: farmerChoiceScored,
    aiTopPick: aiTopPickScored,
    areaAcres: area,
    profitGap,
    profitGapPercent,
    roiGap,
    verdict,
    verdictSentence: {
      en: verdictEn,
      hi: verdictHi,
    },
    reasonsAiIsBetter: reasonsAiIsBetter.slice(0, 3),
    reasonsToStickWithFarmerChoice: reasonsToStickWithFarmerChoice.slice(0, 3),
    generatedAt: new Date().toISOString(),
  };
}
