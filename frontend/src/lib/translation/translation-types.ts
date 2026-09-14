/**
 * AgriProfit — Multilingual Translation, Detection & TTS Types
 * =============================================================
 * Supported languages: exactly English (en), Hindi (hi), Punjabi (pa), Haryanvi (hny), Tamil (ta).
 */

export type SupportedLanguage = "en" | "hi" | "pa" | "hny" | "ta";

export interface SupportedLanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  script: string;
  flag: string;
  direction: "ltr";
  isNativeSupported: boolean; // false for hny if standard APIs treat as dialect
  dialectNote?: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, SupportedLanguageInfo> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    script: "Latin",
    flag: "🌐",
    direction: "ltr",
    isNativeSupported: true,
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "Devanagari",
    flag: "🇮🇳",
    direction: "ltr",
    isNativeSupported: true,
  },
  pa: {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    script: "Gurmukhi",
    flag: "🌾",
    direction: "ltr",
    isNativeSupported: true,
  },
  hny: {
    code: "hny",
    name: "Haryanvi",
    nativeName: "हरियाणवी",
    script: "Devanagari",
    flag: "🚜",
    direction: "ltr",
    isNativeSupported: false, // Explicitly false for standard commercial APIs; powered by specialized dialect LLM/rule engine
    dialectNote: "Bangru / Deshwali rural dialect of Western Hindi",
  },
  ta: {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    script: "Tamil",
    flag: "🌱",
    direction: "ltr",
    isNativeSupported: true,
  },
};

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: SupportedLanguage | string;
  targetLanguage: SupportedLanguage;
  provider: "dictionary" | "cache" | "gemini" | "openai" | "haryanvi_dialect" | "fallback";
  cached: boolean;
  timestamp: string;
  confidence?: number;
  dialectEngineUsed?: boolean;
}

export interface BatchTranslationResult {
  translations: Record<string, string>;
  sourceLanguage: SupportedLanguage | string;
  targetLanguage: SupportedLanguage;
  provider: string;
  cachedCount: number;
  timestamp: string;
}

export interface LanguageDetectionResult {
  detectedLanguage: SupportedLanguage;
  confidence: number;
  provider: string;
  isReliable: boolean;
}

export interface TranslationProviderStatus {
  activeProvider: string;
  supportedLanguages: SupportedLanguage[];
  isOperational: boolean;
  cacheHitRatio: number;
  totalRequests: number;
  cachedRequests: number;
  haryanviStrategy: "llm_dialect" | "morphological_rule_engine" | "verified_glossary";
  averageLatencyMs: number;
}

export interface AudioSynthesisResult {
  audioDataUri?: string;
  audioUrl?: string;
  language: SupportedLanguage;
  voice: string;
  durationSeconds?: number;
  provider: "server_tts" | "browser_speech_synthesis" | "cache";
  cached: boolean;
  statusDisclosure?: string; // Honest voice capability note, e.g. for Haryanvi
}

export interface AudioVoiceInfo {
  id: string;
  name: string;
  language: SupportedLanguage;
  gender: "female" | "male" | "neutral";
  isNative: boolean;
  sampleRate?: number;
}

export interface AudioProviderStatus {
  activeTTSProvider: string;
  serverSynthesisAvailable: boolean;
  clientSpeechSupported: boolean;
  cachedAudioCount: number;
  supportedLanguages: SupportedLanguage[];
}

export interface PageAudioSection {
  heading: string;
  text: string;
  priority?: "high" | "medium" | "low";
}

export interface PageAudioPayload {
  title: string;
  pagePath: string;
  summary: string;
  sections: PageAudioSection[];
}
