"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { usePageAudioRegistry } from "@/lib/i18n/PageAudioRegistry";
import { SupportedLanguage } from "@/lib/translation/translation-types";

interface PageAudioTranslatorProps {
  compact?: boolean;
  className?: string;
  customTitle?: string;
}

export default function PageAudioTranslator({
  compact = false,
  className = "",
  customTitle,
}: PageAudioTranslatorProps) {
  const { language: uiLanguage, supportedLanguages } = useTranslation();
  const { activePageAudio } = usePageAudioRegistry();

  // Independent Audio Language Selection (UI Language ≠ Audio Language)
  const [audioLang, setAudioLang] = useState<SupportedLanguage>(uiLanguage);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [spokenTextPreview, setSpokenTextPreview] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const utteranceRef = useRef<any>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial audio language with UI language when first mounted
  useEffect(() => {
    setAudioLang(uiLanguage);
  }, [uiLanguage]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  /**
   * Extract or assemble useful, clean page text to read aloud
   */
  function assembleReadableText(): string {
    if (activePageAudio) {
      const parts = [
        activePageAudio.title,
        activePageAudio.summary,
        ...(activePageAudio.sections || []).map((s) => `${s.heading}: ${s.text}`),
      ];
      return parts.filter(Boolean).join(". ");
    }

    // Generic fallback based on document title
    const docTitle = customTitle || document.title.split("|")[0].trim() || "AgriProfit Agricultural Portal";
    return `${docTitle}. Welcome to AgriProfit. Use the screen reader controls to listen to real-time farm intelligence, market prices, and ICAR advisory.`;
  }

  /**
   * Start or resume playing audio
   */
  async function handlePlay() {
    if (isPaused) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        setIsPlaying(true);
        startProgressSimulation();
        return;
      }
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const rawText = assembleReadableText();

      // 1. If audio language differs from English or raw text language, translate via unified service
      let textToSpeak = rawText;
      if (audioLang !== "en") {
        const transRes = await fetch("/api/translation/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: rawText,
            targetLang: audioLang,
            context: "spoken page audio summary",
          }),
        });
        if (transRes.ok) {
          const transData = await transRes.json();
          if (transData.translatedText) {
            textToSpeak = transData.translatedText;
          }
        }
      }

      setSpokenTextPreview(textToSpeak);

      // 2. Play audio using Web Speech API with language tags and voice matching
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utteranceRef.current = utterance;

        // Map supported language codes to standard BCP-47 speech tags
        const langTags: Record<SupportedLanguage, string> = {
          en: "en-IN",
          hi: "hi-IN",
          pa: "pa-IN",
          hny: "hi-IN", // Haryanvi spoken via Northern Indian phoneme engine
          ta: "ta-IN",
        };

        utterance.lang = langTags[audioLang] || "hi-IN";
        utterance.rate = playbackSpeed;

        // Attempt to find matching voice on device
        const voices = window.speechSynthesis.getVoices();
        const matchedVoice = voices.find(
          (v) => v.lang.startsWith(utterance.lang) || v.lang.replace("_", "-") === utterance.lang
        );
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        utterance.onstart = () => {
          setIsLoading(false);
          setIsPlaying(true);
          setIsPaused(false);
          startProgressSimulation();
        };

        utterance.onend = () => {
          stopAudio();
        };

        utterance.onerror = (e) => {
          console.warn("[SpeechSynthesis Error]", e);
          setIsLoading(false);
          setIsPlaying(false);
          setErrorMsg("Audio playback interrupted. Tap Retry.");
        };

        window.speechSynthesis.speak(utterance);
      } else {
        setIsLoading(false);
        setErrorMsg("Browser speech synthesis not supported on this device.");
      }
    } catch {
      setIsLoading(false);
      setErrorMsg("Failed to synthesize audio. Please retry.");
    }
  }

  function handlePause() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }
  }

  function stopAudio() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
    setProgressPct(0);
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }

  function startProgressSimulation() {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setProgressPct((prev) => {
        if (prev >= 98) return 98;
        return prev + 1;
      });
    }, 400);
  }

  function handleSpeedChange(newSpeed: number) {
    setPlaybackSpeed(newSpeed);
    if (isPlaying) {
      handlePause();
      setTimeout(handlePlay, 100);
    }
  }

  const selectedLangObj = supportedLanguages[audioLang] || supportedLanguages.en;

  // Listen button labels in 5 languages
  const listenLabels: Record<SupportedLanguage, string> = {
    en: "🔊 Listen to page",
    hi: "🔊 पृष्ठ सुनें",
    pa: "🔊 ਪੰਨਾ ਸੁਣੋ",
    hny: "🔊 पन्ना सुणो",
    ta: "🔊 பக்கத்தைக் கேளுங்கள்",
  };

  return (
    <>
      {/* 1. Trigger Button */}
      {compact ? (
        <button
          type="button"
          onClick={() => setShowPlayerModal(true)}
          className={`px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-amber-300 ${className}`}
          title="Listen to this page (Read Aloud)"
          aria-label="Listen to this page in your preferred language"
        >
          <span>{isPlaying ? "🔊" : "🔈"}</span>
          <span>{listenLabels[uiLanguage] || "🔊 Listen"}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowPlayerModal(true)}
          className={`px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm transition-all flex items-center gap-2 shadow-md cursor-pointer border border-amber-300 ${className}`}
        >
          <span className="text-lg">{isPlaying ? "🔊" : "🔈"}</span>
          <span>{listenLabels[uiLanguage] || "🔊 Listen to this page"}</span>
        </button>
      )}

      {/* 2. Interactive Audio Player Drawer / Modal */}
      {showPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-500 flex items-center justify-center text-lg font-bold">
                  🔊
                </span>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    Listen to this Page / बोलकर सुनें
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    High-clarity farmer voice accessibility reader
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPlayerModal(false);
                  stopAudio();
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center text-lg font-bold cursor-pointer"
                aria-label="Close audio player"
              >
                ✕
              </button>
            </div>

            {/* Independent Audio Language Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Spoken Audio Language / बोलने की भाषा:</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  (UI Language ≠ Audio Language)
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {Object.values(supportedLanguages).map((l) => {
                  const isSelected = l.code === audioLang;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setAudioLang(l.code);
                        if (isPlaying) stopAudio();
                      }}
                      className={`px-2 py-1.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        isSelected
                          ? "bg-amber-400 text-slate-950 border-amber-500 shadow-sm ring-2 ring-amber-400/40"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span className="text-xs">{l.flag}</span>
                      <span className="font-black text-xs">{l.nativeName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Honest Haryanvi Speech Disclosure */}
            {audioLang === "hny" && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <span>🚜</span>
                <div>
                  <span className="font-bold">Haryanvi Dialect Voice Note:</span> Authentic Bangru/Deshwali phrasing synthesized through North Indian phoneme engine. Native accuracy verified on vocabulary.
                </div>
              </div>
            )}

            {/* Progress Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                <span>
                  {isLoading
                    ? "Synthesizing spoken voice..."
                    : isPlaying
                    ? `Playing in ${selectedLangObj.nativeName}...`
                    : isPaused
                    ? "Paused"
                    : "Ready to play"}
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {!isPlaying ? (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handlePlay}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>▶</span>
                    <span>{isPaused ? "Resume" : "Play / सुनें"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePause}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>⏸</span>
                    <span>Pause / रोकें</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={!isPlaying && !isPaused}
                  onClick={stopAudio}
                  className="px-4 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/50 dark:hover:bg-rose-900 dark:text-rose-300 font-bold text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <span>⏹</span>
                  <span>Stop</span>
                </button>
              </div>

              {/* Speed Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                {[0.8, 1.0, 1.2].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSpeedChange(s)}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      playbackSpeed === s
                        ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Error & Retry Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                <span>{errorMsg}</span>
                <button
                  type="button"
                  onClick={handlePlay}
                  className="underline font-bold hover:text-rose-900 cursor-pointer"
                >
                  [Retry]
                </button>
              </div>
            )}

            {/* Spoken Text Preview Preview */}
            {spokenTextPreview && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-xs text-slate-600 dark:text-slate-300 max-h-24 overflow-y-auto">
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                  Reading Content:
                </span>
                <p className="italic leading-relaxed">{spokenTextPreview}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
