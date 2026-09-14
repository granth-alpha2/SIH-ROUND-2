"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { SupportedLanguage } from "@/lib/translation/translation-types";

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export default function LanguageSelector({ compact = false, className = "" }: LanguageSelectorProps) {
  const { language, setLanguage, supportedLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = supportedLanguages[language] || supportedLanguages.en;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(code: SupportedLanguage) {
    setLanguage(code);
    setIsOpen(false);
  }

  if (compact) {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-amber-400/60 rounded px-2.5 py-1 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
          aria-label={`Current language: ${currentLang.nativeName}. Click to change.`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="text-sm">🌐</span>
          <span className="font-extrabold text-amber-300">{currentLang.nativeName}</span>
          <span className="text-[10px] text-slate-400">▼</span>
        </button>

        {isOpen && (
          <div
            role="listbox"
            className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              Select Language / भाषा चुनें
            </div>
            {Object.values(supportedLanguages).map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-amber-400/15 text-amber-300 font-black border-l-2 border-amber-400"
                      : "text-slate-200 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span className="font-bold">{lang.nativeName}</span>
                    <span className="text-[11px] text-slate-400">({lang.name})</span>
                  </div>
                  {isSelected && <span className="text-amber-400 text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span>🌐</span>
          <span>Portal Language / भाषा चयन</span>
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
          5 Languages Active
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Object.values(supportedLanguages).map((lang) => {
          const isSelected = lang.code === language;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                isSelected
                  ? "bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-600/30"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <span className="text-sm">{lang.flag}</span>
              <span className="text-sm font-black tracking-tight">{lang.nativeName}</span>
              <span className={`text-[10px] ${isSelected ? "text-emerald-100" : "text-slate-500 dark:text-slate-400"}`}>
                {lang.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
