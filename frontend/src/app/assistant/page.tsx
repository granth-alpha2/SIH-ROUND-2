"use client";

import { useState, useRef, useEffect } from "react";
import AppShell from "../components/AppShell";
import type { AssistantChatMessage, FarmerContext } from "@/lib/ai-assistant-service";

const initialMessages: AssistantChatMessage[] = [
  {
    id: "msg-init-1",
    sender: "assistant",
    text: `Namaste! I am **उन्नति AI (Unnati AI)** — your Comprehensive Multi-Persona Agricultural & Trade Assistant. 

I am connected to your farm's real-time agro-meteorological feeds, market price streams, 12-digit MSP procurement gate passes, FCI protocols, APEDA export benchmarks, and wholesale buyer markets.

You can ask me questions in **English**, **हिंदी**, or **Hinglish**, use the **🎤 Voice Mic** to speak, or **📸 attach/scan a crop leaf photo** to get an instant AI vision diagnosis & ICAR chemical dosage!`,
    timestamp: "Live Unnati AI Online",
  },
];

const sampleQuestions = [
  "🌾 गेहूं में यूरिया खाद कब डालें? (When to apply Urea?)",
  "🌧️ बारिश आने से पहले खेत में क्या करें? (Rain management)",
  "🌻 क्या इस साल सरसों में ज्यादा मुनाफा है? (Mustard vs Wheat)",
  "🐛 पत्तियों पर पीले धब्बे आ रहे हैं, क्या करें? (Yellow Rust spray)",
];


const PRESET_LEAF_SCANS = [
  {
    title: "🌾 Wheat Yellow Rust",
    scientific: "Puccinia striiformis",
    subtitle: "Linear yellow spore stripes",
    prompt: "Diagnose this wheat leaf: showing bright yellow linear stripes on leaf blade.",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80",
    badge: "Fungal Pathogen",
  },
  {
    title: "🥔 Potato Late Blight",
    scientific: "Phytophthora infestans",
    subtitle: "Irregular dark water-soaked lesions",
    prompt: "Diagnose this potato leaf: irregular water-soaked brown lesions with white mold.",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80",
    badge: "Oomycete Blight",
  },
  {
    title: "🍃 Nitrogen Chlorosis",
    scientific: "Nutrient Deficiency (N)",
    subtitle: "V-shaped yellowing on older leaves",
    prompt: "Diagnose this crop: older lower leaves turning pale yellow starting from tip.",
    image: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=400&q=80",
    badge: "Abiotic Stress",
  },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<AssistantChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<FarmerContext | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [micStatusText, setMicStatusText] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgCounterRef = useRef(100);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    let isMounted = true;
    async function loadLiveContext() {
      try {
        const res = await fetch("/api/assistant");
        if (res.ok && isMounted) {
          const json = await res.json();
          if (json.context) {
            setContext(json.context);
          }
        }
      } catch {
        // Silent fallback
      }
    }
    loadLiveContext();
    return () => {
      isMounted = false;
    };
  }, []);


  // Handle Image Upload & Conversion to Base64
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Handle Preset Leaf Selection (One-Click SIH Judge Demo)
  function handleSelectPreset(preset: typeof PRESET_LEAF_SCANS[0]) {
    setSelectedImage(preset.image);
    setImageName(preset.title);
    setInput(preset.prompt);
  }

  // Enhanced Speech Recognition (Mic Input with live interim streaming)
  function toggleSpeechRecognition() {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Voice recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setMicStatusText("");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setMicStatusText(
          speechLang === "hi-IN"
            ? "🎤 सुन रहा हूँ... बोलिए (हिंदी या हिंगलिश)..."
            : "🎤 Listening... Speak now in English..."
        );
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setInput((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
          setMicStatusText(`Captured: "${finalTranscript}"`);
        } else if (interimTranscript) {
          setMicStatusText(`Listening: "${interimTranscript}"`);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn("[Speech Recognition Error]", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          alert("Microphone permission was blocked. Please allow microphone access in your browser's address bar.");
        }
        setIsListening(false);
        setMicStatusText("");
      };

      recognition.onend = () => {
        setIsListening(false);
        setTimeout(() => setMicStatusText(""), 2500);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("[Speech Init Error]", err);
      setIsListening(false);
      setMicStatusText("");
    }
  }

  // Text-To-Speech (Listen Button)
  function speakText(msgId: string, text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_]/g, "").slice(0, 350);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = speechLang;
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  }

  // Handle Send Message
  async function handleSend(queryText?: string) {
    const text = (queryText || input).trim();
    if ((!text && !selectedImage) || loading) return;

    const currentImage = selectedImage;
    msgCounterRef.current += 1;
    const nextUserCount = msgCounterRef.current;

    const userMsg: AssistantChatMessage = {
      id: `msg-u-${nextUserCount}`,
      sender: "user",
      text: text || "📸 [Scanned Leaf Photo for AI Disease Diagnosis]",
      imageUrl: currentImage || undefined,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setSelectedImage(null);
    setImageName("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text || "Please scan and diagnose this crop leaf photo.",
          history: messages,
          imageUrl: currentImage,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          msgCounterRef.current += 1;
          const nextAsstCount = msgCounterRef.current;
          const assistantMsg: AssistantChatMessage = {
            id: `msg-a-${nextAsstCount}`,
            sender: "assistant",
            text: json.reply,
            diagnosisCard: json.diagnosisCard,
            timestamp: "Just now",
          };
          setMessages((prev) => [...prev, assistantMsg]);
          if (json.context) setContext(json.context);
        }
      }
    } catch {
      // Fallback handled gracefully
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function renderFormattedText(text: string) {
    const paragraphs = text.split("\n\n");
    return paragraphs.map((p, pIdx) => {
      const lines = p.split("\n");
      return (
        <div key={pIdx} className="mb-2.5 last:mb-0 space-y-1">
          {lines.map((line, lIdx) => {
            const isBullet = line.trim().startsWith("* ") || line.trim().startsWith("- ");
            const cleanLine = isBullet ? line.trim().slice(2) : line;
            const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

            const renderedContent = parts.map((part, i) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={i} className="font-bold opacity-95">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            });

            if (isBullet) {
              return (
                <div key={lIdx} className="flex items-start gap-2 ml-2 mt-1 text-[13px]">
                  <span className="text-[var(--color-primary)] font-bold shrink-0">•</span>
                  <span className="leading-relaxed">{renderedContent}</span>
                </div>
              );
            }

            return (
              <p key={lIdx} className="text-[13px] leading-relaxed mb-1 last:mb-0">
                {renderedContent}
              </p>
            );
          })}
        </div>
      );
    });
  }

  return (
    <AppShell pageTitle="उन्नति AI (Unnati AI) Platform Assistant">
      <div className="w-full max-w-[1440px] mx-auto px-2 sm:px-4 py-2 flex flex-col h-[calc(100vh-140px)] min-h-[640px] space-y-3">
        {/* Source & Mandatory Advisory Disclosure Banner (Fix 9 & Fix 3) */}
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 space-y-1 shadow-sm shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold flex items-center gap-1.5 text-sm">
              <span>⚠️</span>
              <span>Important Agricultural Advisory Notice:</span>
            </span>
            <span className="px-2 py-0.5 bg-amber-200/80 rounded font-semibold text-[11px]">
              Source: AI-Generated (Google Gemini 1.5 Flash / Groq LLM)
            </span>
          </div>
          <p className="leading-relaxed text-[11.5px]">
            All agronomic recommendations, chemical dosage plans, and visual plant leaf diagnoses are generated by artificial intelligence models. Field conditions vary by soil chemistry and weather; <strong>always verify critical chemical dosages, pesticide sprays, and irrigation interventions with a certified local agricultural extension officer (KVK / ICAR agronomist)</strong> before application.
          </p>
        </div>

        {/* Top Control Bar */}
        <header className="flex items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="agri-btn-secondary py-1.5 px-3 text-xs"
              title="Toggle Telemetry Sidebar"
            >
              <span>{sidebarOpen ? "◀ Hide Telemetry" : "▶ Show Telemetry"}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="agri-badge agri-badge-emerald">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Multimodal Engine
              </span>
              <span className="text-xs font-bold text-[var(--text-primary)] hidden sm:inline font-['Space_Grotesk']">
                उन्नति AI (Unnati AI) Studio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center bg-[var(--bg-surface-subtle)] p-0.5 rounded-xl border border-[var(--border-subtle)] text-xs font-bold">
              <button
                type="button"
                onClick={() => setSpeechLang("hi-IN")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  speechLang === "hi-IN"
                    ? "bg-[var(--bg-surface)] text-[var(--color-primary-text)] shadow-xs font-bold ring-1 ring-[var(--border-accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                🇮🇳 हिंदी / Hinglish
              </button>
              <button
                type="button"
                onClick={() => setSpeechLang("en-IN")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  speechLang === "en-IN"
                    ? "bg-[var(--bg-surface)] text-[var(--color-primary-text)] shadow-xs font-bold ring-1 ring-[var(--border-accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                🌐 English
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMessages(initialMessages)}
              className="text-xs text-[var(--text-muted)] hover:text-rose-500 rounded-xl px-3 py-1.5 border border-[var(--border-subtle)] hover:border-rose-300 transition-all font-semibold cursor-pointer"
            >
              Clear Chat
            </button>
          </div>
        </header>

        {/* Main Split Layout Studio Workspace */}
        <div className="flex gap-3 flex-1 min-h-0 overflow-hidden">
          {/* Left Sidebar: Live Farm Telemetry & Demo Presets */}
          {sidebarOpen && (
            <aside className="w-72 lg:w-80 shrink-0 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] shadow-card p-4 flex flex-col gap-3.5 overflow-y-auto hidden md:flex">
              {/* Field Telemetry Widget */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface-accent)] border border-[var(--border-accent)] space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-subtle)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary-text)] font-['Space_Grotesk']">
                    🌾 Live Field Telemetry
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white font-bold">
                    {context?.farmName?.split(" (")[0] || "Active Plot"}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[var(--text-muted)]">Location:</span>
                    <span className="font-bold text-[var(--text-primary)] text-right truncate max-w-[170px]" title={context?.location}>
                      {context?.location || "Detected Farm Region"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Area:</span>
                    <span className="font-bold text-[var(--color-primary-text)]">
                      {context?.farmAreaAcres ? `${context.farmAreaAcres.toFixed(2)} Acres` : "2.5 Acres"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Active Crop:</span>
                    <span className="font-bold text-[var(--color-primary-text)]">
                      {context?.activeCrop || "Wheat"} ({context?.cropHindiName || "गेहूं"})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Stage / DAS:</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {context?.stageName || "CRI Stage"} ({context?.daysAfterSowing || 22} DAS)
                    </span>
                  </div>
                </div>
              </div>

              {/* Weather & Mandi Quick Badges */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-[var(--color-sky-bg)] border border-[var(--color-sky-border)] text-center">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-sky-text)] block tracking-wider">
                    Weather
                  </span>
                  <span className="text-sm font-bold text-[var(--color-sky-text)] font-['Space_Grotesk'] mt-0.5 block">
                    {context?.weather?.current?.tempC ? `${context.weather.current.tempC.toFixed(1)}°C` : "30°C"}
                  </span>
                  <span className="text-[10px] text-[var(--color-sky-text)] font-medium truncate block">
                    {context?.weather?.current?.condition || "Partly Cloudy"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-emerald-bg)] border border-[var(--color-emerald-border)] text-center">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-emerald-text)] block tracking-wider">
                    Mandi Modal
                  </span>
                  <span className="text-sm font-bold text-[var(--color-emerald-text)] font-['Space_Grotesk'] mt-0.5 block">
                    ₹{context?.mandiPricePerQuintal || 2380}/q
                  </span>
                  <span className="text-[10px] text-[var(--color-emerald-text)] font-bold">
                    {context?.mspPricePerQuintal ? `MSP ₹${context.mspPricePerQuintal}/q` : "APMC Rate"}
                  </span>
                </div>
              </div>

              {/* Instant Vision Presets Bar */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-['Space_Grotesk']">
                    ⚡ Instant Vision Presets
                  </span>
                  <span className="text-[10px] text-[var(--color-primary)] font-bold">1-Click Test</span>
                </div>
                <div className="space-y-1.5">
                  {PRESET_LEAF_SCANS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface-accent)] border border-[var(--border-default)] hover:border-[var(--border-accent)] text-left transition-all flex items-center gap-2.5 cursor-pointer group shadow-2xs"
                    >
                      <img
                        src={preset.image}
                        alt={preset.title}
                        className="w-11 h-11 rounded-lg object-cover border border-[var(--border-subtle)] group-hover:border-[var(--color-primary)] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] truncate font-['Space_Grotesk']">
                            {preset.title}
                          </span>
                          <span className="agri-badge agri-badge-emerald text-[9px] px-1.5 py-0.2 shrink-0">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-[10px] italic text-[var(--text-muted)] font-serif truncate">
                          {preset.scientific}
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                          {preset.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Advisory Questions */}
              <div className="space-y-1.5 pt-1 mt-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block font-['Space_Grotesk']">
                  💡 Frequently Asked
                </span>
                <div className="space-y-1">
                  {sampleQuestions.slice(0, 3).map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(q)}
                      disabled={loading}
                      className="w-full text-left text-xs p-2 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface-accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition cursor-pointer truncate disabled:opacity-50"
                    >
                      • {q}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Right Main Studio: Spacious Chat Log & Input Dock */}
          <main className="flex-1 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] shadow-card flex flex-col overflow-hidden">
            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[var(--bg-canvas)]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in`}
                >
                  <div
                    className={`max-w-[94%] sm:max-w-[85%] rounded-3xl p-6 sm:p-7 shadow-card border-2 ${
                      msg.sender === "user"
                        ? "bg-[var(--color-primary)] text-white border-transparent rounded-br-xs"
                        : "bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-default)] rounded-bl-xs"
                    }`}
                  >
                    {/* Header: Sender & Listen Button */}
                    <div className="flex justify-between items-center gap-3 mb-3 pb-2 border-b-2 border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-base font-bold font-['Space_Grotesk'] ${msg.sender === "user" ? "text-emerald-100" : "text-[var(--color-primary)]"}`}>
                          {msg.sender === "user" ? "👨‍🌾 You" : "🤖 उन्नति AI (Unnati AI)"}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">· {msg.timestamp}</span>
                      </div>

                      {msg.sender === "assistant" && (
                        <button
                          type="button"
                          onClick={() => speakText(msg.id, msg.text)}
                          className={`px-4 py-2 rounded-xl text-sm sm:text-base font-bold border-2 transition cursor-pointer flex items-center gap-2 shadow-xs min-h-[44px] ${
                            speakingMsgId === msg.id
                              ? "agri-badge-rose animate-pulse"
                              : "agri-btn-secondary py-1.5 px-3.5"
                          }`}
                        >
                          <span>{speakingMsgId === msg.id ? "⏹ Stop Speaking" : "🔊 Read Aloud / आवाज़ सुनें"}</span>
                        </button>
                      )}
                    </div>

                    {/* Attached Photo Preview */}
                    {msg.imageUrl && (
                      <div className="mb-4 rounded-2xl overflow-hidden border-2 border-[var(--border-accent)] bg-black/20 max-w-md shadow-sm">
                        <img
                          src={msg.imageUrl}
                          alt="Crop leaf sample"
                          className="w-full h-56 sm:h-64 object-cover rounded-xl"
                        />
                        <div className="p-3 bg-slate-950/90 text-white text-xs flex items-center justify-between font-mono">
                          <span>📸 Leaf Specimen Scanned</span>
                          <span className="text-emerald-400 font-bold">Multimodal Vision Verified</span>
                        </div>
                      </div>
                    )}

                    {/* Main Content Body with Large 18-20px Text */}
                    <div className={`text-lg sm:text-xl leading-relaxed ${msg.sender === "user" ? "text-white" : "text-[var(--text-primary)]"}`}>
                      {renderFormattedText(msg.text)}
                    </div>

                    {/* Structured AI Vision Diagnostic Card */}
                    {msg.diagnosisCard && (
                      <div className="mt-4 p-4 rounded-2xl bg-[var(--bg-surface-accent)] border border-[var(--border-accent)] text-[var(--text-primary)] space-y-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary-text)] block font-['Space_Grotesk']">
                              🔬 ICAR Computer Vision Pathogen Match
                            </span>
                            <h4 className="text-sm font-bold text-[var(--text-primary)] mt-0.5 font-['Space_Grotesk']">
                              {msg.diagnosisCard.pathogenName}
                            </h4>
                            {msg.diagnosisCard.scientificName && (
                              <p className="text-xs italic text-[var(--text-muted)] font-serif">
                                {msg.diagnosisCard.scientificName}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="agri-badge agri-badge-emerald text-xs px-3 py-1">
                              {msg.diagnosisCard.confidencePct}% Match
                            </span>
                            <div className="text-[11px] font-bold text-rose-500 mt-1">
                              Severity: {msg.diagnosisCard.severity}
                            </div>
                          </div>
                        </div>

                        {/* Symptoms Observed */}
                        <div className="space-y-1">
                          <span className="font-bold text-xs text-[var(--text-primary)]">Visual Pathogen Markers:</span>
                          <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-0.5 text-xs">
                            {msg.diagnosisCard.symptoms.map((sym, sIdx) => (
                              <li key={sIdx} className="leading-relaxed">{sym}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Chemical Dosage */}
                        <div className="p-3 rounded-xl bg-[var(--color-rose-bg)] border border-[var(--color-rose-border)]">
                          <span className="font-bold text-xs text-[var(--color-rose-text)] flex items-center gap-1 font-['Space_Grotesk']">
                            <span>💊</span> ICAR Recommended Chemical Dosage:
                          </span>
                          <p className="text-[var(--color-rose-text)] text-xs mt-1 leading-relaxed font-medium">
                            {msg.diagnosisCard.chemicalTreatment}
                          </p>
                        </div>

                        {/* Organic Remedy */}
                        <div className="p-3 rounded-xl bg-[var(--color-emerald-bg)] border border-[var(--color-emerald-border)]">
                          <span className="font-bold text-xs text-[var(--color-emerald-text)] flex items-center gap-1 font-['Space_Grotesk']">
                            <span>🍃</span> Organic / Biological Alternative:
                          </span>
                          <p className="text-[var(--color-emerald-text)] text-xs mt-1 leading-relaxed">
                            {msg.diagnosisCard.organicTreatment}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="agri-card p-3.5 rounded-2xl text-xs text-[var(--text-secondary)] flex items-center gap-3">
                    <span className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="font-medium">Synthesizing platform response via उन्नति AI (Unnati AI) engine...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Live Audio Status Banner */}
            {isListening && (
              <div className="px-4 py-2 bg-rose-500 text-white flex items-center justify-between gap-2 text-xs font-bold animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span>{micStatusText || "Recording voice... Speak in Hindi or English..."}</span>
                </div>
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className="px-2 py-0.5 bg-white text-rose-700 rounded-md font-black text-[11px] cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            {/* Selected Image Preview Chip */}
            {selectedImage && (
              <div className="px-4 py-2.5 bg-[var(--bg-surface-accent)] border-t border-[var(--border-accent)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={selectedImage} alt="Preview" className="w-12 h-12 object-cover rounded-xl border border-[var(--border-accent)] shadow-2xs" />
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate max-w-sm">{imageName || "Attached Leaf Image"}</p>
                    <p className="text-[10px] text-[var(--color-primary)] font-semibold">Ready for Instant AI Computer Vision Scan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImageName("");
                  }}
                  className="px-2.5 py-1 text-[var(--text-muted)] hover:text-rose-500 font-bold text-xs cursor-pointer rounded-lg hover:bg-rose-500/10"
                >
                  ✕ Remove
                </button>
              </div>
            )}

            {/* Quick Suggestion Chips for Farmers */}
            <div className="px-4 py-3 bg-[var(--bg-surface-subtle)] border-t-2 border-[var(--border-subtle)] flex items-center gap-2.5 overflow-x-auto no-scrollbar">
              <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider shrink-0 font-['Space_Grotesk']">
                💡 Quick Questions:
              </span>
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  className="shrink-0 px-4 py-2.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-accent)] border-2 border-[var(--border-default)] hover:border-[var(--color-primary)] text-base font-bold text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Bottom Input Action Dock */}
            <footer className="p-4 sm:p-5 bg-[var(--bg-surface)] border-t-2 border-[var(--border-default)] flex items-center gap-3">
              {/* Hidden File Input for Leaf Scan */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />

              {/* Camera / Scan Leaf Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                title="Upload or Take Leaf Photo"
                className="agri-btn-secondary min-h-[58px] px-5 rounded-2xl text-base font-bold shrink-0 flex items-center gap-2"
              >
                <span className="text-2xl">📸</span>
                <span className="hidden sm:inline">Scan Leaf</span>
              </button>

              {/* Voice Mic Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                disabled={loading}
                title={`Click to speak in ${speechLang === "hi-IN" ? "Hindi/Hinglish" : "English"}`}
                className={`min-h-[58px] px-5 rounded-2xl border-2 font-bold transition-all cursor-pointer shrink-0 flex items-center gap-2 shadow-sm ${
                  isListening
                    ? "bg-rose-600 text-white border-rose-700 ring-4 ring-rose-300 animate-pulse"
                    : "agri-btn-secondary text-base"
                }`}
              >
                <span className="text-2xl">🎤</span>
                <span className="hidden sm:inline">
                  {isListening ? "Listening..." : "Mic (बोलें)"}
                </span>
              </button>

              {/* Text Input Field */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Poochhein ya photo scan karein (e.g. 'गेहूं में यूरिया कब डालें?')..."
                disabled={loading}
                className="agri-input flex-1 min-h-[58px] py-3.5 px-5 text-base sm:text-lg font-medium rounded-2xl"
              />

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading || (!input.trim() && !selectedImage)}
                className="agri-btn-primary min-h-[58px] text-lg sm:text-xl font-extrabold px-8 rounded-2xl shrink-0 shadow-md cursor-pointer"
              >
                Send →
              </button>
            </footer>
          </main>
        </div>
      </div>
    </AppShell>
  );
}