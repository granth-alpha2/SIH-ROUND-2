/**
 * AgriProfit — Unified Translation Service
 * ==========================================
 * Implements the master TranslationProvider abstraction:
 * 1. Entity and number preservation (₹2,425, 35 quintals, MSP, FPO)
 * 2. Multi-tier caching (Memory + PostgreSQL)
 * 3. Haryanvi dedicated provider (LLM + Bangru/Deshwali dialect rules)
 * 4. Multi-model LLM integration (Gemini 2.0 / OpenAI / Local Fallback)
 * 5. Robust language detection (pa, ta, hi, hny, en)
 * 6. Batch translation & zero-failure error boundaries
 */

import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  TranslationResult,
  BatchTranslationResult,
  LanguageDetectionResult,
  TranslationProviderStatus,
} from "./translation-types";
import { maskEntities, unmaskEntities, localizeUnitLabels } from "./entity-preserver";
import { transformToHaryanvi, HARYANVI_SYSTEM_PROMPT } from "./haryanvi-dialect-engine";
import {
  getCachedTranslation,
  saveTranslationCache,
  recordUsageMetric,
  getTelemetrySummary,
} from "./translation-repository";
import { getDictionaryString } from "../i18n/dictionaries";

export class UnifiedTranslationService {
  private geminiKey?: string;
  private openAiKey?: string;

  constructor() {
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.openAiKey = process.env.OPENAI_API_KEY;
  }

  /**
   * Fast character-script and pattern-based language detection
   */
  public detectLanguage(text: string): LanguageDetectionResult {
    if (!text || !text.trim()) {
      return { detectedLanguage: "en", confidence: 1.0, provider: "script_analyzer", isReliable: true };
    }

    const trimmed = text.trim();

    // 1. Gurmukhi script -> Punjabi (U+0A00 - U+0A7F)
    if (/[\u0A00-\u0A7F]/.test(trimmed)) {
      return { detectedLanguage: "pa", confidence: 0.99, provider: "script_analyzer", isReliable: true };
    }

    // 2. Tamil script -> Tamil (U+0B80 - U+0BFF)
    if (/[\u0B80-\u0BFF]/.test(trimmed)) {
      return { detectedLanguage: "ta", confidence: 0.99, provider: "script_analyzer", isReliable: true };
    }

    // 3. Devanagari script -> Check Haryanvi dialect markers vs standard Hindi
    if (/[\u0900-\u097F]/.test(trimmed)) {
      const haryanviMarkers = /\b(सै|सैं|कोन्या|म्हारा|म्हारी|म्हारे|थ्हारा|थ्हारी|थ्हारे|मन्ने|तन्ने|कुकर|क्यूंकर|घणा|कती|किम्मे|हम्मे|ईड़े|ओड़े)\b/;
      if (haryanviMarkers.test(trimmed)) {
        return { detectedLanguage: "hny", confidence: 0.95, provider: "dialect_analyzer", isReliable: true };
      }
      return { detectedLanguage: "hi", confidence: 0.98, provider: "script_analyzer", isReliable: true };
    }

    // 4. Default Latin / English
    return { detectedLanguage: "en", confidence: 0.95, provider: "script_analyzer", isReliable: true };
  }

  /**
   * Translate a single text string
   */
  public async translateText(params: {
    text: string;
    sourceLang?: string;
    targetLang: SupportedLanguage;
    context?: string;
  }): Promise<TranslationResult> {
    const startTime = Date.now();
    const { text, targetLang, context } = params;
    const now = new Date().toISOString();

    if (!text || !text.trim()) {
      return {
        translatedText: text || "",
        sourceLanguage: params.sourceLang || "en",
        targetLanguage: targetLang,
        provider: "fallback",
        cached: false,
        timestamp: now,
      };
    }

    // Auto-detect source if not specified
    const detected = params.sourceLang || this.detectLanguage(text).detectedLanguage;
    const sourceLang = detected as SupportedLanguage;

    // Same language return
    if (sourceLang === targetLang) {
      return {
        translatedText: text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        provider: "cache",
        cached: true,
        timestamp: now,
      };
    }

    // 1. Check Multi-tier Cache
    const cached = await getCachedTranslation(sourceLang, targetLang, text);
    if (cached) {
      recordUsageMetric({
        serviceType: "translation",
        provider: cached.provider,
        sourceLang,
        targetLang,
        characterCount: text.length,
        latencyMs: Date.now() - startTime,
        isCached: true,
        status: "SUCCESS",
      });

      return {
        translatedText: cached.translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        provider: "cache",
        cached: true,
        timestamp: cached.updatedAt,
      };
    }

    // 2. Protect mathematical numbers, currencies, dates, and technical terms
    const { maskedText, tokens } = maskEntities(text);

    let translatedOutput = "";
    let providerUsed: TranslationResult["provider"] = "fallback";
    let isDialectUsed = false;

    // 3. Specialized Haryanvi Routing
    if (targetLang === "hny") {
      isDialectUsed = true;
      // Try LLM with authentic Haryanvi prompt first if keys available
      if (this.geminiKey || this.openAiKey) {
        try {
          const llmResult = await this.callLLMTranslation(maskedText, sourceLang, "hny", context);
          if (llmResult) {
            translatedOutput = llmResult;
            providerUsed = this.geminiKey ? "gemini" : "openai";
          }
        } catch {
          // Fall back to rule transformer
        }
      }

      // If LLM unavailable or failed, use dedicated dialect transformer
      if (!translatedOutput) {
        // First get Hindi baseline if source is English
        let intermediateHindi = maskedText;
        if (sourceLang === "en") {
          intermediateHindi = await this.translateViaDictionaryOrFallback(maskedText, "hi");
        }
        const hnyResult = transformToHaryanvi(intermediateHindi);
        translatedOutput = hnyResult.text;
        providerUsed = "haryanvi_dialect";
      }
    } else {
      // 4. Standard Target Languages (hi, pa, ta, en)
      // Try LLM primary
      if (this.geminiKey || this.openAiKey) {
        try {
          const llmResult = await this.callLLMTranslation(maskedText, sourceLang, targetLang, context);
          if (llmResult) {
            translatedOutput = llmResult;
            providerUsed = this.geminiKey ? "gemini" : "openai";
          }
        } catch {
          // Fallback to local dictionary / heuristic
        }
      }

      // If LLM unavailable, use dictionary and domain glossary
      if (!translatedOutput) {
        translatedOutput = await this.translateViaDictionaryOrFallback(maskedText, targetLang);
        providerUsed = "dictionary";
      }
    }

    // 5. Unmask protected tokens (retains exact mathematical values and IDs)
    const unmasked = unmaskEntities(translatedOutput || text, tokens);

    // 6. Localize agricultural unit words around numbers
    const finalTranslatedText = localizeUnitLabels(unmasked, targetLang);

    // 7. Save into Multi-tier Cache
    await saveTranslationCache(sourceLang, targetLang, text, finalTranslatedText, providerUsed);

    // 8. Record telemetry
    recordUsageMetric({
      serviceType: "translation",
      provider: providerUsed,
      sourceLang,
      targetLang,
      characterCount: text.length,
      latencyMs: Date.now() - startTime,
      isCached: false,
      status: "SUCCESS",
    });

    return {
      translatedText: finalTranslatedText,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      provider: providerUsed,
      cached: false,
      timestamp: now,
      dialectEngineUsed: isDialectUsed,
    };
  }

  /**
   * Batch translate multiple text strings efficiently
   */
  public async translateBatch(params: {
    texts: string[];
    sourceLang?: string;
    targetLang: SupportedLanguage;
    context?: string;
  }): Promise<BatchTranslationResult> {
    const { texts, targetLang, context } = params;
    const uniqueTexts = Array.from(new Set(texts.filter((t) => t && t.trim())));
    const translations: Record<string, string> = {};
    let cachedCount = 0;

    await Promise.all(
      uniqueTexts.map(async (str) => {
        const res = await this.translateText({
          text: str,
          sourceLang: params.sourceLang,
          targetLang,
          context,
        });
        translations[str] = res.translatedText;
        if (res.cached) cachedCount++;
      })
    );

    return {
      translations,
      sourceLanguage: params.sourceLang || "auto",
      targetLanguage: targetLang,
      provider: "unified_batch",
      cachedCount,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Translates using dictionary lookup or verified domain glossary
   */
  private async translateViaDictionaryOrFallback(text: string, targetLang: SupportedLanguage): Promise<string> {
    const trimmed = text.trim();

    // Check direct dictionary string
    const direct = getDictionaryString(targetLang, trimmed);
    if (direct !== trimmed) {
      return direct;
    }

    // Common agricultural phrase mappings for demo/fallback
    const domainGlossary: Record<string, Record<SupportedLanguage, string>> = {
      "Wheat": { en: "Wheat", hi: "गेहूं", pa: "ਕਣਕ", hny: "गेहूँ", ta: "கோதுமை" },
      "Mustard": { en: "Mustard", hi: "सरसों", pa: "ਸਰ੍ਹੋਂ", hny: "सरसों", ta: "கடுகு" },
      "Paddy": { en: "Paddy", hi: "धान / चावल", pa: "ਝੋਨਾ / ਧਾਨ", hny: "जीरी / धान", ta: "நெல்" },
      "Cotton": { en: "Cotton", hi: "कपास", pa: "ਕਪਾਹ / ਨਰਮਾ", hny: "नरमा / कपास", ta: "பருத்தி" },
      "Government MSP": { en: "Government MSP", hi: "सरकारी MSP", pa: "ਸਰਕਾਰੀ MSP", hny: "सरकारी MSP", ta: "அரசு MSP" },
      "Nearby Mandi": { en: "Nearby Mandi", hi: "नजदीकी मंडी", pa: "ਨੇੜਲੀ ਮੰਡੀ", hny: "धोरै की मंडी", ta: "அருகிலுள்ள மண்டி" },
      "Expected Price": { en: "Expected Price", hi: "अनुमानित कीमत", pa: "ਅੰਦਾਜ਼ਨ ਭਾਅ", hny: "अनुमानित भाव", ta: "எதிர்பார்க்கப்படும் விலை" },
      "Available Quantity": { en: "Available Quantity", hi: "उपलब्ध मात्रा", pa: "ਬਾਕੀ ਮਾਤਰਾ", hny: "बच रही मात्रा", ta: "கிடைக்கும் அளவு" },
      "Sell at MSP": { en: "Sell at MSP", hi: "MSP पर बेचें", pa: "MSP ਤੇ ਵੇਚੋ", hny: "सरकारी MSP पै बेचो", ta: "MSP விலையில் விற்கவும்" },
      "Find Buyers": { en: "Find Buyers", hi: "खरीदार खोजें", pa: "ਖਰੀਦਦਾਰ ਲੱਭੋ", hny: "खरीदार टटोलो", ta: "வாங்குபவர்களைக் கண்டறியவும்" },
      "Create Group": { en: "Create Group", hi: "समूह बनाएं", pa: "ਗਰੁੱਪ ਬਣਾਓ", hny: "समूह बणाओ", ta: "குழுவை உருவாக்குங்கள்" },
      "I want to sell 50 quintals of wheat.": {
        en: "I want to sell 50 quintals of wheat.",
        hi: "मुझे 50 क्विंटल गेहूं बेचना है।",
        pa: "ਮੈਂ 50 ਕੁਇੰਟਲ ਕਣਕ ਵੇਚਣਾ ਚਾਹੁੰਦਾ ਹਾਂ।",
        hny: "मन्ने 50 क्विंटल गेहूँ बेचना सै।",
        ta: "நான் 50 குவிண்டால் கோதுமையை விற்க விரும்புகிறேன்.",
      },
      "I can offer ₹2,450 per quintal.": {
        en: "I can offer ₹2,450 per quintal.",
        hi: "मैं ₹2,450 प्रति क्विंटल की पेशकश कर सकता हूँ।",
        pa: "ਮੈਂ ₹2,450 ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਦੀ ਪੇਸ਼ਕਸ਼ ਕਰ ਸਕਦਾ ਹਾਂ।",
        hny: "मैं ₹2,450 प्रति क्विंटल का भाव दे सकूं सूं।",
        ta: "நான் குவிண்டாலுக்கு ₹2,450 வழங்க முடியும்.",
      },
      "Your MSP request has been approved.": {
        en: "Your MSP request has been approved.",
        hi: "आपका MSP अनुरोध स्वीकृत हो गया है।",
        pa: "ਤੁਹਾਡੀ MSP ਬੇਨਤੀ ਮਨਜ਼ੂਰ ਹੋ ਗਈ ਹੈ।",
        hny: "थ्हारी सरकारी MSP अरजी मंजूर हो गी सै।",
        ta: "உங்கள் MSP கோரிக்கை அங்கீகரிக்கப்பட்டது.",
      },
    };

    if (domainGlossary[trimmed] && domainGlossary[trimmed][targetLang]) {
      return domainGlossary[trimmed][targetLang];
    }

    return text;
  }

  /**
   * Call LLM (Gemini or OpenAI) with strict preservation instructions
   */
  private async callLLMTranslation(
    text: string,
    sourceLang: string,
    targetLang: SupportedLanguage,
    context?: string
  ): Promise<string | null> {
    const targetLangName = SUPPORTED_LANGUAGES[targetLang]?.name || targetLang;

    // 1. If Gemini direct key is available
    if (this.geminiKey) {
      try {
        const systemPrompt = targetLang === "hny"
          ? HARYANVI_SYSTEM_PROMPT
          : `You are an accurate, professional agricultural translator. Translate the given text from ${sourceLang} to ${targetLangName}. 
CRITICAL RULES:
- Preserve all tokens in the format __AGRI_KEEP_n__ exactly as they are without modification.
- Preserve all numbers, currency signs, and technical acronyms verbatim.
- Output ONLY the translated text, no preamble or explanation.`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
          method: "POST",
          signal: AbortSignal.timeout(6000),
          headers: {
            Authorization: `Bearer ${this.geminiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Context: ${context || "agricultural portal"}\nText: ${text}` },
            ],
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const translated = data.choices?.[0]?.message?.content?.trim();
          if (translated) return translated;
        }
      } catch {
        // Fallback to next provider
      }
    }

    // 2. If OpenAI key is available
    if (this.openAiKey) {
      try {
        const res = await fetch(`https://api.openai.com/v1/chat/completions`, {
          method: "POST",
          signal: AbortSignal.timeout(6000),
          headers: {
            Authorization: `Bearer ${this.openAiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: targetLang === "hny"
                  ? HARYANVI_SYSTEM_PROMPT
                  : `Translate from ${sourceLang} to ${targetLangName}. Keep all __AGRI_KEEP_n__ tokens intact. Return only translated text.`,
              },
              { role: "user", content: text },
            ],
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const translated = data.choices?.[0]?.message?.content?.trim();
          if (translated) return translated;
        }
      } catch {
        // Fallback
      }
    }

    return null;
  }

  /**
   * Return supported languages metadata
   */
  public supportedLanguages() {
    return Object.values(SUPPORTED_LANGUAGES);
  }

  /**
   * Return current provider health and telemetry status
   */
  public getProviderStatus(): TranslationProviderStatus {
    const telemetry = getTelemetrySummary();
    const activeProvider = this.geminiKey ? "Google Gemini 2.0 Flash" : this.openAiKey ? "OpenAI GPT-4o-mini" : "AgriProfit Integrated Dialect & Domain Engine";

    return {
      activeProvider,
      supportedLanguages: ["en", "hi", "pa", "hny", "ta"],
      isOperational: true,
      cacheHitRatio: telemetry.cacheHitRatio,
      totalRequests: telemetry.totalRequests,
      cachedRequests: telemetry.cachedRequests,
      haryanviStrategy: this.geminiKey ? "llm_dialect" : "morphological_rule_engine",
      averageLatencyMs: telemetry.avgLatencyMs,
    };
  }
}

// Global singleton instance
const globalStore = globalThis as typeof globalThis & {
  agriprofitUnifiedTranslation?: UnifiedTranslationService;
};

export const unifiedTranslation =
  globalStore.agriprofitUnifiedTranslation ??
  (globalStore.agriprofitUnifiedTranslation = new UnifiedTranslationService());
