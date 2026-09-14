/**
 * AgriProfit — Mathematical & Technical Entity Preserver
 * ========================================================
 * Prevents translation APIs from corrupting:
 * - Mathematical numbers, currency values (₹, INR, Rs., $)
 * - Agricultural units (quintal, kg, tonne, ha, acre, mm, °C)
 * - Dates and years (2024-25, 14-09-2026)
 * - Identifiers & Technical acronyms (MSP, FPO, APMC, ICAR, FCI, NAFED, GPS, DAS, CRI, JWT, etc.)
 */

export interface ProtectedPayload {
  maskedText: string;
  tokens: Map<string, string>;
}

// Technical acronyms that should be preserved or kept verbatim
const TECHNICAL_ACRONYMS = [
  "MSP",
  "APMC",
  "FPO",
  "ICAR",
  "FCI",
  "NAFED",
  "HAFED",
  "MARKFED",
  "APEDA",
  "PM-KISAN",
  "e-NAM",
  "CACP",
  "GPS",
  "API",
  "ML",
  "AI",
  "DAS",
  "CRI",
  "FYM",
  "NSKE",
  "EC",
  "WP",
  "JWT",
  "ID",
  "OTP",
];

// Patterns for currency and numeric values with units
const PRESERVE_PATTERNS = [
  // Currencies: ₹2,425, Rs. 2425, INR 2,425, $500
  /(?:₹|Rs\.?|INR|\$)\s*\d+(?:,\d+)*(?:\.\d+)?(?:\s*\/\s*[a-zA-Z\u0900-\u097F]+)?/gi,
  // Numbers with agricultural units: 35 quintals, 42.5 kg, 5.2 acres, 120 mm, 28.5°C
  /\b\d+(?:,\d+)*(?:\.\d+)?\s*(?:quintals?|tonnes?|kg|acres?|hectares?|ha|mm|°C|kmph|km\/h|%)\b/gi,
  // Standalone percentages: 94.8%, 15%
  /\b\d+(?:\.\d+)?\s*%/g,
  // Date ranges: 2024-25, 2024–2025
  /\b20\d{2}[-–]\d{2,4}\b/g,
  // 12-digit MSP verification codes or Transaction IDs
  /\b\d{12}\b/g,
  /\bTXN-[A-Z0-9-]+\b/gi,
  /\bGRP-[A-Z0-9-]+\b/gi,
];

/**
 * Mask protected entities with safe tokens: __AGRI_KEEP_0__, __AGRI_KEEP_1__, etc.
 */
export function maskEntities(text: string): ProtectedPayload {
  const tokens = new Map<string, string>();
  let tokenCounter = 0;
  let maskedText = text;

  // 1. Mask Technical Acronyms first
  for (const acronym of TECHNICAL_ACRONYMS) {
    const regex = new RegExp(`\\b${acronym}\\b`, "g");
    maskedText = maskedText.replace(regex, (match) => {
      const token = `__AGRI_KEEP_${tokenCounter++}__`;
      tokens.set(token, match);
      return token;
    });
  }

  // 2. Mask Numeric, Currency and Unit patterns
  for (const pattern of PRESERVE_PATTERNS) {
    maskedText = maskedText.replace(pattern, (match) => {
      // Don't re-mask existing tokens
      if (match.startsWith("__AGRI_KEEP_")) return match;
      const token = `__AGRI_KEEP_${tokenCounter++}__`;
      tokens.set(token, match);
      return token;
    });
  }

  return { maskedText, tokens };
}

/**
 * Unmask tokens back to their original mathematical / technical values
 */
export function unmaskEntities(text: string, tokens: Map<string, string>): string {
  let restored = text;
  tokens.forEach((originalValue, token) => {
    // Handle cases where translation APIs might have added spaces around underscores
    const fuzzyTokenRegex = new RegExp(
      token.replace(/_/g, "[_\\s]?"),
      "g"
    );
    restored = restored.replace(fuzzyTokenRegex, originalValue);
  });
  return restored;
}

/**
 * Normalizes translated unit labels while keeping the numeric values mathematically untouched.
 * e.g. "₹2,425 / quintal" -> Hindi: "₹2,425 / क्विंटल", Punjabi: "₹2,425 / ਕੁਇੰਟਲ", Tamil: "₹2,425 / குவிண்டால்"
 */
export function localizeUnitLabels(text: string, lang: string): string {
  const unitMap: Record<string, Record<string, string>> = {
    hi: {
      quintal: "क्विंटल",
      quintals: "क्विंटल",
      acre: "एकड़",
      acres: "एकड़",
      hectare: "हेक्टेयर",
      hectares: "हेक्टेयर",
      tonne: "टन",
      tonnes: "टन",
    },
    pa: {
      quintal: "ਕੁਇੰਟਲ",
      quintals: "ਕੁਇੰਟਲ",
      acre: "ਏਕੜ",
      acres: "ਏਕੜ",
      hectare: "ਹੈਕਟੇਅਰ",
      hectares: "ਹੈਕਟੇਅਰ",
      tonne: "ਟਨ",
      tonnes: "ਟਨ",
    },
    hny: {
      quintal: "क्विंटल",
      quintals: "क्विंटल",
      acre: "किल्ला/एकड़",
      acres: "किल्ले/एकड़",
      hectare: "हेक्टेयर",
      hectares: "हेक्टेयर",
      tonne: "टन",
      tonnes: "टन",
    },
    ta: {
      quintal: "குவிண்டால்",
      quintals: "குவிண்டால்",
      acre: "ஏக்கர்",
      acres: "ஏக்கர்",
      hectare: "ஹெக்டேர்",
      hectares: "ஹெக்டேர்",
      tonne: "டன்",
      tonnes: "டன்",
    },
  };

  const currentMap = unitMap[lang];
  if (!currentMap) return text;

  let result = text;
  for (const [enUnit, localizedUnit] of Object.entries(currentMap)) {
    const regex = new RegExp(`(\\d+(?:\\.\\d+)?\\s*(?:/\\s*)?)\\b${enUnit}\\b`, "gi");
    result = result.replace(regex, `$1${localizedUnit}`);
  }

  return result;
}
