"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { CROP_DATABASE, type CropRecord, type CropSeason } from "@/lib/crop-data";
import type { CropComparisonResult } from "@/lib/crop-comparison-engine";

const CROP_ICONS: Record<string, string> = {
  wheat: "🌾",
  mustard: "🌼",
  chickpea: "🌱",
  maize: "🌽",
  soybean: "🌿",
  cotton: "☁️",
  onion: "🧅",
  potato: "🥔",
  paddy: "🌾",
  groundnut: "🥜",
  sugarcane: "🎋",
  barley: "🌾",
  lentil: "🥣",
  tomato: "🍅",
  sunflower: "🌻",
  "pearl-millet": "🌾",
  sorghum: "🌾",
  "pigeon-pea": "🌿",
  chili: "🌶️",
  turmeric: "🟡",
  banana: "🍌",
  mango: "🥭",
};

export type CropCompareCardProps = {
  farmId?: string;
  farmAreaAcres: number;
  currentSeason?: CropSeason;
  userSoilType?: string;
  riskAppetite?: string;
  waterAvailability?: string;
  onKeepFarmerCrop?: (crop: CropRecord) => void;
  onSelectAiCrop?: (cropId: string) => void;
};

export default function CropCompareCard({
  farmId,
  farmAreaAcres = 2.5,
  currentSeason = "Rabi",
  riskAppetite = "Balanced",
  waterAvailability = "Medium",
  onKeepFarmerCrop,
  onSelectAiCrop,
}: CropCompareCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllCrops, setShowAllCrops] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Comparison State
  const [selectedCrop, setSelectedCrop] = useState<CropRecord | null>(null);
  const [comparison, setComparison] = useState<CropComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<{ message: string; suggestions: string[] } | null>(null);

  // Audio / Speech Synthesis State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Filter crops based on season and search query
  const displayedCrops = useMemo(() => {
    let list = CROP_DATABASE;
    if (!showAllCrops) {
      list = list.filter((c) => c.season === currentSeason || c.season === "Perennial");
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.hindiName.includes(q) ||
          c.slug.toLowerCase().includes(q)
      );
    }
    return list;
  }, [showAllCrops, currentSeason, searchQuery]);

  // Clean up speech synthesis and recognition on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Voice Input Handler (Hindi & English)
  function toggleVoiceInput() {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecClass) {
      setMicError("आवाज़ पहचान इस ब्राउज़र में उपलब्ध नहीं है (Voice not supported)");
      setTimeout(() => setMicError(null), 4000);
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecClass();
      recognition.lang = "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const spoken = event.results?.[0]?.[0]?.transcript || "";
        if (spoken) {
          setSearchQuery(spoken);
          // Try to auto-pick if there's a strong match
          const clean = spoken.toLowerCase().trim();
          const match = CROP_DATABASE.find(
            (c) =>
              c.name.toLowerCase().includes(clean) ||
              c.hindiName.includes(clean) ||
              clean.includes(c.slug)
          );
          if (match) {
            handleCompareCrop(match);
          }
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setMicError("माइक से आवाज़ नहीं मिली (No speech detected)");
        setTimeout(() => setMicError(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  // Text-To-Speech (🔊 "Suno" button)
  function toggleSpeakVerdict(textToSpeak: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "hi-IN";
    utterance.rate = 0.9;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  // Trigger Comparison API
  async function handleCompareCrop(crop: CropRecord) {
    setSelectedCrop(crop);
    setLoading(true);
    setErrorNotice(null);

    // Stop speaking previous comparison if any
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const res = await fetch("/api/recommendations/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmId,
          chosenCrop: crop.slug,
          farmAreaAcres,
          season: currentSeason,
          preferences: {
            riskAppetite,
            waterAvailability,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.comparison) {
        setComparison(data.comparison);
      } else if (data.error === "crop_not_found") {
        setErrorNotice({
          message: data.message || "फसल नहीं मिली",
          suggestions: data.suggestions || [],
        });
      } else {
        throw new Error(data.message || "Failed to compare");
      }
    } catch {
      setErrorNotice({
        message: "तुलना करने में समस्या आई। कृपया पुनः प्रयास करें।",
        suggestions: ["Wheat (गेहूं)", "Mustard (सरसों)", "Chickpea (चना)"],
      });
    } finally {
      setLoading(false);
    }
  }

  // Format Indian Currency
  function formatInr(val: number) {
    return "₹" + Math.round(val).toLocaleString("en-IN");
  }

  // Calculate thermometer bar percentages
  const maxProfit = comparison
    ? Math.max(
        1000,
        Math.max(
          comparison.farmerChoice.financials.expectedNetProfit,
          comparison.aiTopPick.financials.expectedNetProfit
        )
      )
    : 1000;

  const farmerBarPercent = comparison
    ? Math.max(12, Math.min(100, Math.round((Math.max(0, comparison.farmerChoice.financials.expectedNetProfit) / maxProfit) * 100)))
    : 50;

  const aiBarPercent = comparison
    ? Math.max(12, Math.min(100, Math.round((Math.max(0, comparison.aiTopPick.financials.expectedNetProfit) / maxProfit) * 100)))
    : 50;

  return (
    <div className="w-full">
      {/* Big Entry Button: Prominently displayed to invite farmer's own intuition */}
      {!isOpen && (
        <div className="p-4 sm:p-6 rounded-3xl border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 transition-all flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="text-3xl sm:text-4xl p-2.5 rounded-2xl bg-white dark:bg-slate-800 shadow-xs">
              🌾
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--color-primary)]">
                <span>Apni Fasal vs AI Fasal</span>
                <span>•</span>
                <span>अपनी पसंद की फसल</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] font-['Space_Grotesk']">
                मन में कोई दूसरी फसल है? (Test Your Crop)
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                अपनी पसंदीदा फसल चुनें और देखें कि AI की फसल के मुकाबले आपको कितना मुनाफा मिलेगा।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[var(--color-primary)] text-white font-extrabold text-base shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🌾 अपनी फसल आज़माएँ</span>
            <span className="text-xs opacity-80">(Try Your Own Crop)</span>
          </button>
        </div>
      )}

      {/* Full Expanded Comparison Card */}
      {isOpen && (
        <div className="rounded-3xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in duration-200">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-2 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
                ⚖️
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] font-['Space_Grotesk']">
                  Apni Fasal vs AI Fasal (आपकी फसल vs AI की पसंद)
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  {farmAreaAcres.toFixed(1)} एकड़ जमीन पर दोनों फसलों की निष्पक्ष तुलना (Same Land & Rules)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (typeof window !== "undefined" && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] text-xs sm:text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              ✕ बंद करें (Close)
            </button>
          </div>

          {/* Step A: Visual Crop Selector (Always large icons, touch target >= 64px) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <label className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wide flex items-center gap-2">
                <span>1. अपनी पसंद की फसल चुनें</span>
                <span className="text-xs text-[var(--text-muted)] font-bold">(Tap Any Crop Below)</span>
              </label>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isListening
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--color-primary)]"
                  }`}
                  title="Speak crop name in Hindi or English"
                >
                  <span>{isListening ? "🔴 सुन रहा हूँ..." : "🎤 बोलकर चुनें"}</span>
                </button>

                {/* Season Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAllCrops(!showAllCrops)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {showAllCrops ? `केवल ${currentSeason} फसलें` : "सभी फसलें देखें (All)"}
                </button>
              </div>
            </div>

            {micError && (
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200">
                ⚠️ {micError}
              </div>
            )}

            {/* Quick Filter Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 फसल का नाम लिखें या बोलें (उदा. गेहूं, सरसों, आलू, धान)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm sm:text-base font-bold py-2.5 pl-3.5 pr-10 rounded-2xl border-2 border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Large Visual Grid of Crop Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-[220px] overflow-y-auto p-1">
              {displayedCrops.map((crop) => {
                const isSelected = selectedCrop?.id === crop.id;
                const icon = CROP_ICONS[crop.slug] || "🌱";

                return (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => handleCompareCrop(crop)}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1 min-h-[72px] active:scale-95 ${
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15 ring-2 ring-[var(--color-primary)]"
                        : "border-[var(--border-default)] bg-[var(--bg-surface-subtle)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-surface)]"
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl">{icon}</span>
                    <span className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] truncate max-w-full leading-tight font-['Space_Grotesk']">
                      {crop.hindiName}
                    </span>
                    <span className="text-[10px] sm:text-xs text-[var(--text-muted)] truncate max-w-full">
                      {crop.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="py-8 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-[var(--text-secondary)]">
                आपकी फसल और AI फसल का विश्लेषण हो रहा है... (Calculating...)
              </p>
            </div>
          )}

          {/* Error / Suggestions State */}
          {errorNotice && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 space-y-2">
              <p className="text-sm font-bold">⚠️ {errorNotice.message}</p>
              {errorNotice.suggestions.length > 0 && (
                <div className="text-xs">
                  <span>सुझाव (Suggested): </span>
                  <div className="flex gap-1.5 pt-1 flex-wrap">
                    {errorNotice.suggestions.map((s, idx) => (
                      <span key={idx} className="px-2 py-1 rounded-lg bg-white/70 dark:bg-black/40 font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step B: Comparison Visuals (Rendered when comparison is ready) */}
          {comparison && !loading && (
            <div className="space-y-6 pt-2">
              {/* Verdict Banner with "🔊 Suno" Button */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                  comparison.verdict === "ai_better"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100"
                    : comparison.verdict === "farmer_choice_good"
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100"
                    : "bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-100"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl">
                      {comparison.verdict === "ai_better" ? "💡" : "👏"}
                    </span>
                    <strong className="text-base sm:text-lg font-black font-['Space_Grotesk'] leading-snug">
                      {comparison.verdictSentence.hi}
                    </strong>
                  </div>
                  <p className="text-xs sm:text-sm opacity-85 font-medium pl-6">
                    {comparison.verdictSentence.en}
                  </p>
                </div>

                {/* 🔊 Suno (Listen) TTS Button */}
                <button
                  type="button"
                  onClick={() => toggleSpeakVerdict(comparison.verdictSentence.hi)}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs ${
                    isSpeaking
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-white dark:bg-slate-800 text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--color-primary)]"
                  }`}
                  title="Listen to verdict in Hindi"
                >
                  <span className="text-base">{isSpeaking ? "⏹️" : "🔊"}</span>
                  <span>{isSpeaking ? "आवाज़ रोकें (Stop)" : "सुनें (Suno)"}</span>
                </button>
              </div>

              {/* Visual Thermometer Horizontal Bar Comparison */}
              <div className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
                  <span>💰 कुल मुनाफे की तुलना (Expected Total Net Profit on {farmAreaAcres.toFixed(1)} Acres)</span>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">लंबी पट्टी = ज़्यादा मुनाफा</span>
                </div>

                {/* Farmer Crop Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs sm:text-sm font-extrabold text-[var(--text-primary)]">
                    <span>
                      {CROP_ICONS[comparison.farmerChoice.slug] || "🌱"} आपकी पसंद ({comparison.farmerChoice.hindiName})
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 font-['Space_Grotesk'] font-black">
                      {formatInr(comparison.farmerChoice.financials.expectedNetProfit)}
                    </span>
                  </div>
                  <div className="h-6 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-black text-amber-950"
                      style={{ width: `${farmerBarPercent}%` }}
                    >
                      {farmerBarPercent > 25 && formatInr(comparison.farmerChoice.financials.expectedNetProfit)}
                    </div>
                  </div>
                </div>

                {/* AI Top Pick Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs sm:text-sm font-extrabold text-[var(--text-primary)]">
                    <span>
                      {CROP_ICONS[comparison.aiTopPick.slug] || "⭐"} AI की पसंद ({comparison.aiTopPick.hindiName}) ⭐
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-['Space_Grotesk'] font-black">
                      {formatInr(comparison.aiTopPick.financials.expectedNetProfit)}
                    </span>
                  </div>
                  <div className="h-6 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-black text-white"
                      style={{ width: `${aiBarPercent}%` }}
                    >
                      {aiBarPercent > 25 && formatInr(comparison.aiTopPick.financials.expectedNetProfit)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Cards (Max 3 Key Numbers: Profit, Return per ₹100, Safety) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left Card: Farmer's Choice */}
                <div className="p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{CROP_ICONS[comparison.farmerChoice.slug] || "🌱"}</span>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800 dark:text-amber-300 block">
                          आपकी फसल (Your Choice)
                        </span>
                        <h4 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] font-['Space_Grotesk']">
                          {comparison.farmerChoice.hindiName} ({comparison.farmerChoice.cropName.split(" ")[0]})
                        </h4>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 text-xs font-black">
                      Score: {comparison.farmerChoice.score}/100
                    </span>
                  </div>

                  {/* 3 Large Visual Numbers */}
                  <div className="space-y-2.5 pt-1">
                    {/* 1. Net Profit */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 flex justify-between items-center">
                      <span className="text-xs font-bold text-[var(--text-secondary)]">💰 कुल मुनाफा (Profit)</span>
                      <strong className="text-lg sm:text-xl font-extrabold font-['Space_Grotesk'] text-[var(--text-primary)]">
                        {formatInr(comparison.farmerChoice.financials.expectedNetProfit)}
                      </strong>
                    </div>

                    {/* 2. Return per ₹100 */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 flex justify-between items-center">
                      <span className="text-xs font-bold text-[var(--text-secondary)]">📈 ₹100 लगाने पर वापसी</span>
                      <strong className="text-base sm:text-lg font-extrabold font-['Space_Grotesk'] text-[var(--text-primary)]">
                        ₹{Math.round(comparison.farmerChoice.financials.roiMultiplier * 100)} वापस
                      </strong>
                    </div>

                    {/* 3. Safety MSP */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 flex justify-between items-center">
                      <span className="text-xs font-bold text-[var(--text-secondary)]">🛡️ सुरक्षा (Safety)</span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                          comparison.farmerChoice.factors.mspSafety >= 80
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                        }`}
                      >
                        {comparison.farmerChoice.factors.mspSafety >= 80
                          ? "✓ सरकार खरीदेगी (MSP)"
                          : "बाजार भाव पर निर्भर (Market)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Card: AI Top Pick */}
                <div className="p-5 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/20 border-2 border-emerald-400 dark:border-emerald-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{CROP_ICONS[comparison.aiTopPick.slug] || "⭐"}</span>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 dark:text-emerald-300 block">
                          AI की नंबर-1 पसंद (AI Top Pick) ⭐
                        </span>
                        <h4 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] font-['Space_Grotesk']">
                          {comparison.aiTopPick.hindiName} ({comparison.aiTopPick.cropName.split(" ")[0]})
                        </h4>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 text-xs font-black">
                      Score: {comparison.aiTopPick.score}/100
                    </span>
                  </div>

                  {/* 3 Large Visual Numbers */}
                  <div className="space-y-2.5 pt-1">
                    {/* 1. Net Profit */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 flex justify-between items-center">
                      <span className="text-xs font-bold text-[var(--text-secondary)]">💰 कुल मुनाफा (Profit)</span>
                      <strong className="text-lg sm:text-xl font-extrabold font-['Space_Grotesk'] text-emerald-700 dark:text-emerald-300">
                        {formatInr(comparison.aiTopPick.financials.expectedNetProfit)}
                      </strong>
                    </div>

                    {/* 2. Return per ₹100 */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 flex justify-between items-center">
                      <span className="text-xs font-bold text-[var(--text-secondary)]">📈 ₹100 लगाने पर वापसी</span>
                      <strong className="text-base sm:text-lg font-extrabold font-['Space_Grotesk'] text-emerald-700 dark:text-emerald-300">
                        ₹{Math.round(comparison.aiTopPick.financials.roiMultiplier * 100)} वापस
                      </strong>
                    </div>

                    {/* 3. Safety MSP */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 flex justify-between items-center">
                      <span className="text-xs font-bold text-[var(--text-secondary)]">🛡️ सुरक्षा (Safety)</span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                          comparison.aiTopPick.factors.mspSafety >= 80
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                        }`}
                      >
                        {comparison.aiTopPick.factors.mspSafety >= 80
                          ? "✓ सरकार खरीदेगी (MSP)"
                          : "बाजार भाव पर निर्भर (Market)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional "Why? / क्यों?" Expandable Drawer (Collapsed by default) */}
              <div className="border border-[var(--border-subtle)] rounded-2xl overflow-hidden bg-[var(--bg-surface-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full p-3.5 flex items-center justify-between text-xs sm:text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span>ℹ️ ऐसा क्यों? (Why this recommendation?)</span>
                  </span>
                  <span>{showDetails ? "▲ छुपाएँ (Hide)" : "▼ कारण देखें (View Reasons)"}</span>
                </button>

                {showDetails && (
                  <div className="p-4 pt-1 border-t border-[var(--border-subtle)] space-y-3 text-xs sm:text-sm">
                    {comparison.reasonsAiIsBetter.length > 0 && (
                      <div className="space-y-1">
                        <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold block">
                          AI फसल के मुख्य फायदे (Why AI pick is recommended):
                        </strong>
                        <ul className="list-disc pl-5 space-y-0.5 text-[var(--text-secondary)]">
                          {comparison.reasonsAiIsBetter.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {comparison.reasonsToStickWithFarmerChoice.length > 0 && (
                      <div className="space-y-1">
                        <strong className="text-amber-700 dark:text-amber-400 font-extrabold block">
                          आपकी पसंद के मुख्य फायदे (Good reasons for your choice):
                        </strong>
                        <ul className="list-disc pl-5 space-y-0.5 text-[var(--text-secondary)]">
                          {comparison.reasonsToStickWithFarmerChoice.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Two Clear Bottom Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {/* 1. Keep Farmer's Crop */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCrop) {
                      onKeepFarmerCrop?.(selectedCrop);
                      setIsOpen(false);
                    }
                  }}
                  className="flex-1 py-4 px-5 rounded-2xl border-2 border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 font-extrabold text-sm sm:text-base hover:bg-amber-100 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>🌾 अपनी फसल रखें</span>
                  <span className="text-xs opacity-75 font-normal">(Keep My Crop: {comparison.farmerChoice.hindiName})</span>
                </button>

                {/* 2. Switch to AI's Top Pick */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectAiCrop?.(comparison.aiTopPick.cropId);
                    setIsOpen(false);
                  }}
                  className="flex-1 py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>⭐ AI फसल अपनाएँ</span>
                  <span className="text-xs opacity-85 font-normal">(Switch to AI: {comparison.aiTopPick.hindiName})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

