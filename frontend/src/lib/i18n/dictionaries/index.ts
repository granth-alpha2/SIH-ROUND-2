/**
 * AgriProfit — Centralized Localization Dictionaries Aggregator
 */

import { dictionaryEn } from "./en";
import { dictionaryHi } from "./hi";
import { dictionaryPa } from "./pa";
import { dictionaryHny } from "./hny";
import { dictionaryTa } from "./ta";
import { SupportedLanguage } from "../../translation/translation-types";

export type DictionaryKeys = keyof typeof dictionaryEn;

export const DICTIONARIES: Record<SupportedLanguage, Record<string, string>> = {
  en: dictionaryEn,
  hi: dictionaryHi,
  pa: dictionaryPa,
  hny: dictionaryHny,
  ta: dictionaryTa,
};

/**
 * Fast synchronous dictionary lookup
 */
export function getDictionaryString(lang: SupportedLanguage, key: string, fallback?: string): string {
  const dict = DICTIONARIES[lang] || DICTIONARIES.en;
  if (dict[key]) {
    return dict[key];
  }
  // Fallback to English dictionary if key missing in target language
  if (DICTIONARIES.en[key]) {
    return DICTIONARIES.en[key];
  }
  return fallback || key;
}
