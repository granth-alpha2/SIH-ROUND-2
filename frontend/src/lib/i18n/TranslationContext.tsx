"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { SupportedLanguage, SUPPORTED_LANGUAGES } from "../translation/translation-types";
import { getDictionaryString } from "./dictionaries";

export interface TranslationContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
  translateDynamic: (text: string, context?: string) => Promise<string>;
  translateBatch: (texts: string[], context?: string) => Promise<Record<string, string>>;
  isTranslating: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export const LANGUAGE_STORAGE_KEY = "agriprofit_lang";
export const LANGUAGE_EVENT_NAME = "agriprofit_language_change";

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const clientCacheRef = useRef<Map<string, string>>(new Map());

  // 1. Initialize language preference from localStorage & user session
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage;
      if (savedLang && SUPPORTED_LANGUAGES[savedLang]) {
        setLanguageState(savedLang);
        document.documentElement.lang = savedLang;
      }
    } catch {}

    // Synchronize with server user preference if logged in
    async function syncUserPref() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.user?.preferredLanguage) {
            const userLang = json.user.preferredLanguage as SupportedLanguage;
            if (SUPPORTED_LANGUAGES[userLang]) {
              setLanguageState(userLang);
              try {
                localStorage.setItem(LANGUAGE_STORAGE_KEY, userLang);
                document.documentElement.lang = userLang;
              } catch {}
            }
          }
        }
      } catch {}
    }

    syncUserPref();

    // Listen for custom event from other components / tabs
    function handleLanguageChange(event: Event) {
      const customEvt = event as CustomEvent<{ language: SupportedLanguage }>;
      if (customEvt.detail?.language && SUPPORTED_LANGUAGES[customEvt.detail.language]) {
        setLanguageState(customEvt.detail.language);
      }
    }

    window.addEventListener(LANGUAGE_EVENT_NAME, handleLanguageChange);
    return () => {
      window.removeEventListener(LANGUAGE_EVENT_NAME, handleLanguageChange);
    };
  }, []);

  // 2. Change language handler with storage & server persistence
  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    if (!SUPPORTED_LANGUAGES[newLang]) return;
    setLanguageState(newLang);

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
      // Dispatch event to sync any open tabs or detached UI modules
      window.dispatchEvent(
        new CustomEvent(LANGUAGE_EVENT_NAME, { detail: { language: newLang } })
      );
    } catch {}

    // Asynchronously save to user profile if session exists
    fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredLanguage: newLang }),
    }).catch(() => {});
  }, []);

  // 3. Fast synchronous translation using localization dictionaries
  const t = useCallback(
    (key: string, fallback?: string): string => {
      return getDictionaryString(language, key, fallback);
    },
    [language]
  );

  // 4. Dynamic translation for user-generated strings, descriptions, AI outputs
  const translateDynamic = useCallback(
    async (text: string, context?: string): Promise<string> => {
      if (!text || !text.trim()) return text;
      if (language === "en" && !context) return text;

      const cacheKey = `${language}:${text.trim()}`;
      if (clientCacheRef.current.has(cacheKey)) {
        return clientCacheRef.current.get(cacheKey)!;
      }

      try {
        setIsTranslating(true);
        const res = await fetch("/api/translation/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            targetLang: language,
            context,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.translatedText) {
            clientCacheRef.current.set(cacheKey, data.translatedText);
            return data.translatedText;
          }
        }
      } catch {
        // Fallback to original text on failure
      } finally {
        setIsTranslating(false);
      }

      return text;
    },
    [language]
  );

  // 5. Batch translation for bulk page data
  const translateBatch = useCallback(
    async (texts: string[], context?: string): Promise<Record<string, string>> => {
      if (!texts || texts.length === 0) return {};
      const results: Record<string, string> = {};
      const missing: string[] = [];

      for (const t of texts) {
        const cacheKey = `${language}:${t.trim()}`;
        if (clientCacheRef.current.has(cacheKey)) {
          results[t] = clientCacheRef.current.get(cacheKey)!;
        } else {
          missing.push(t);
        }
      }

      if (missing.length === 0) return results;

      try {
        setIsTranslating(true);
        const res = await fetch("/api/translation/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            texts: missing,
            targetLang: language,
            context,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.translations) {
            for (const [orig, trans] of Object.entries(data.translations as Record<string, string>)) {
              results[orig] = trans;
              clientCacheRef.current.set(`${language}:${orig.trim()}`, trans);
            }
          }
        }
      } catch {
        for (const m of missing) {
          if (!results[m]) results[m] = m;
        }
      } finally {
        setIsTranslating(false);
      }

      return results;
    },
    [language]
  );

  return (
    <TranslationContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translateDynamic,
        translateBatch,
        isTranslating,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
