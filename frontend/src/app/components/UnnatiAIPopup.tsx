"use client";

import React, { useState, useRef, useEffect } from "react";
import type { AssistantChatMessage, FarmerContext } from "@/lib/ai-assistant-service";

type PersonaRole = "farmer" | "government_officer" | "exporter" | "export_buyer";

const PERSONA_CONFIGS: Record<
  PersonaRole,
  {
    label: string;
    icon: string;
    badge: string;
    greeting: string;
    quickPrompts: string[];
    color: string;
    accent: string;
  }
> = {
  farmer: {
    label: "Farmer Desk",
    icon: "🌾",
    badge: "Open Access",
    greeting:
      "Namaste! I am **उन्नति AI (Unnati AI)** for Farmers. Ask me about crop diseases, ICAR fertilizer dosages (Urea/DAP), 12-digit MSP gate pass generation, or scan a leaf photo for instant AI vision diagnosis!",
    quickPrompts: [
      "🌾 गेहूं में यूरिया और सिंचाई का सही समय क्या है?",
      "📜 MSP पर बेचने के लिए 12-अंकों का टोकन/पास कैसे लें?",
      "🍂 पत्तियों पर पीले धब्बे आ रहे हैं (Yellow Rust) - क्या स्प्रे करें?",
      "💰 इस साल सरसों लगाना गेहूं से ज्यादा फायदेमंद है?",
    ],
    color: "from-emerald-800 to-teal-950",
    accent: "bg-emerald-600 text-white",
  },
  government_officer: {
    label: "Govt Officer",
    icon: "🏛️",
    badge: "FCI Station Mandi",
    greeting:
      "Welcome, Officer. I am **उन्नति AI (Unnati AI)** for Mandi Procurement. I can assist with 12-digit gate pass validation, UIDAI Iris biometric protocol, weighbridge intake formulas, and PFMS / DBT treasury sanctions.",
    quickPrompts: [
      "🏛️ 12-अंकों के MSP गेट पास को कैसे verify करें?",
      "👁️ UIDAI Iris बायोमेट्रिक और वेइब्रिज का क्या नियम है?",
      "💳 PFMS / DBT के जरिए किसान के खाते में भुगतान कैसे होगा?",
      "⚖️ FCI गुणवत्ता मानक (Moisture < 12%) की जांच कैसे करें?",
    ],
    color: "from-[#0b3b59] to-[#082a40]",
    accent: "bg-[#0b4d75] text-white",
  },
  exporter: {
    label: "APEDA Exporter",
    icon: "🚢",
    badge: "Trade Desk",
    greeting:
      "Welcome to APEDA Export Desk. I am **उन्नति AI (Unnati AI)**. Query 10-country international FOB parity benchmarks, container aggregation (120q+ lots), customs port logistics, and bilateral export term sheets.",
    quickPrompts: [
      "🚢 UAE और खाड़ी देशों के लिए गेहूँ/प्याज का FOB parity रेट क्या है?",
      "📦 FPO से 120 क्विंटल कंटेनर एग्रीगेशन और कस्टम्स डॉक्युमेंट्स कैसे बनाएं?",
      "🌍 UN Comtrade डेटा के अनुसार किन देशों में सबसे ज्यादा मांग है?",
      "🚚 पोर्ट लॉजिस्टिक्स, पैकेजिंग और फ्रेट का खर्च कैसे कैलकुलेट करें?",
    ],
    color: "from-indigo-950 to-slate-900",
    accent: "bg-indigo-700 text-white",
  },
  export_buyer: {
    label: "Wholesale Buyer",
    icon: "🛒",
    badge: "Commercial Desk",
    greeting:
      "Hello! I am **उन्नति AI (Unnati AI)** for Wholesale Buyers & Millers. Inquire about browsing direct farmer harvests, FPO group aggregation discounts, electronic moisture assaying, and digital escrow contracts.",
    quickPrompts: [
      "🛒 किसानों से सीधे थोक माल (Direct Market) कैसे खरीदें?",
      "👥 FPO किसान समूह से बल्क डिस्काउंट कैसे पाएं?",
      "🔍 इलेक्ट्रॉनिक क्वालिटी ग्रेडिंग और नमी रिपोर्ट कैसे देखें?",
      "🤝 डिजिटल एस्क्रो और पेमेंट सेटलमेंट कैसे होता है?",
    ],
    color: "from-amber-950 to-slate-900",
    accent: "bg-amber-600 text-white",
  },
};

const PRESET_LEAF_SCANS = [
  {
    title: "🌾 Wheat Yellow Rust",
    subtitle: "Puccinia striiformis · Yellow pustule stripes",
    prompt: "Diagnose this wheat leaf: showing bright yellow linear stripes on leaf blade.",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80",
    badge: "Fungal",
  },
  {
    title: "🥔 Potato Late Blight",
    subtitle: "Phytophthora infestans · Water-soaked lesions",
    prompt: "Diagnose this potato leaf: irregular water-soaked brown lesions with white mold.",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80",
    badge: "Blight",
  },
  {
    title: "🍃 Nitrogen Chlorosis",
    subtitle: "Nutrient Deficiency (N) · V-shaped pale leaf",
    prompt: "Diagnose this crop: older lower leaves turning pale yellow starting from tip.",
    image: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=400&q=80",
    badge: "Abiotic",
  },
];

export function openUnnatiAI(role?: PersonaRole) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-unnati-ai", { detail: { role } }));
  }
}

export default function UnnatiAIPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeRole, setActiveRole] = useState<PersonaRole>("farmer");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<FarmerContext | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [micStatusText, setMicStatusText] = useState("");
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    const handleOpen = (e?: Event) => {
      setIsOpen(true);
      setIsMinimized(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customRole = (e as any)?.detail?.role as PersonaRole | undefined;
      if (customRole && PERSONA_CONFIGS[customRole]) {
        setActiveRole(customRole);
      }
    };
    window.addEventListener("open-unnati-ai", handleOpen);
    return () => window.removeEventListener("open-unnati-ai", handleOpen);
  }, []);

  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    {
      id: "init-1",
      sender: "assistant",
      text: PERSONA_CONFIGS.farmer.greeting,
      timestamp: "Live Online",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const msgCounterRef = useRef(10);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    async function loadLiveContext() {
      try {
        const res = await fetch("/api/assistant");
        if (res.ok) {
          const json = await res.json();
          if (json.context) {
            setContext(json.context);
          }
        }
      } catch {}
    }
    loadLiveContext();
  }, []);

  // Update greeting message when persona switches
  function handlePersonaSwitch(role: PersonaRole) {
    setActiveRole(role);
    setMessages((prev) => [
      ...prev,
      {
        id: `switch-${Date.now()}`,
        sender: "assistant",
        text: PERSONA_CONFIGS[role].greeting,
        timestamp: "Persona Switched",
      },
    ]);
  }

  // Handle Image Upload & Conversion to Base64
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Voice Recognition (STT via Web Speech API)
  function toggleVoiceInput() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setMicStatusText("");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setMicStatusText("Listening... (बोलें)");
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((r: any) => r[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setMicStatusText("");
      };

      recognition.onend = () => {
        setIsListening(false);
        setMicStatusText("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setMicStatusText("");
    }
  }

  // Text to Speech (TTS)
  function speakMessage(msgId: string, text: string) {
    if (speakingMsgId === msgId) {
      window.speechSynthesis?.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis?.cancel();
    if (!window.speechSynthesis) return;

    const plain = text.replace(/[*_#`[\]()]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.lang = /[ऀ-ॿ]/.test(plain) ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  }

  // Send query to /api/assistant
  async function handleSend(customText?: string) {
    const textToSend = (customText || input).trim();
    if (!textToSend && !selectedImage) return;

    const userMsgId = `user-${msgCounterRef.current++}`;
    const newMessages: AssistantChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: "user",
        text: textToSend || "📸 Scanned crop leaf for analysis",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        imageUrl: selectedImage || undefined,
      },
    ];

    setMessages(newMessages);
    setInput("");
    const imgPayload = selectedImage;
    setSelectedImage(null);
    setImageName("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend || "Please scan and diagnose this leaf.",
          history: newMessages.slice(-6),
          imageUrl: imgPayload || undefined,
          role: activeRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${msgCounterRef.current++}`,
            sender: "assistant",
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            diagnosisCard: data.diagnosisCard,
            contextSnapshot: data.context
              ? {
                  farmName: data.context.farmName,
                  crop: data.context.activeCrop,
                  stage: data.context.stageName,
                  temperatureC: data.context.weather.current.tempC,
                  rainfallForecast: data.context.weather.current.condition,
                }
              : undefined,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "assistant",
            text: "उन्नति AI is momentarily reconnecting. Please check your query or retry in a few seconds.",
            timestamp: "System",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: "Connection to उन्नति AI engine timed out. Reconnecting...",
          timestamp: "System",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function renderMessageContent(text: string) {
    const segments = text.split(/(```[\s\S]*?```)/g);
    return segments.map((seg, idx) => {
      if (seg.startsWith("```") && seg.endsWith("```")) {
        const firstLineEnd = seg.indexOf("\n");
        const lang = firstLineEnd !== -1 ? seg.slice(3, firstLineEnd).trim() : "";
        const code = firstLineEnd !== -1 ? seg.slice(firstLineEnd + 1, -3) : seg.slice(3, -3);
        return (
          <div key={idx} className="my-2 rounded-xl overflow-hidden bg-slate-950 text-slate-100 border border-slate-700 shadow-md">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400">
              <span className="uppercase tracking-wider font-bold">{lang || "code"}</span>
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(code);
                  }
                }}
                className="hover:text-emerald-400 transition-colors cursor-pointer text-[10px] font-sans"
              >
                📋 Copy
              </button>
            </div>
            <pre className="p-3 overflow-x-auto font-mono text-[11px] leading-relaxed select-text">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      return (
        <div key={idx} className="space-y-1">
          {seg.split("\n").map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={lIdx} className="h-1" />;
            const isHeading = trimmed.startsWith("### ") || trimmed.startsWith("## ") || trimmed.startsWith("# ");
            const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ") || /^\d+\.\s/.test(trimmed);
            const cleanLine = isHeading
              ? trimmed.replace(/^#+\s/, "")
              : isBullet
              ? trimmed.replace(/^([*-]|\d+\.)\s/, "")
              : line;

            const parts = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g);
            const rendered = parts.map((p, pI) => {
              if (p.startsWith("**") && p.endsWith("**")) {
                return <strong key={pI} className="font-bold text-slate-900 dark:text-emerald-200">{p.slice(2, -2)}</strong>;
              }
              if (p.startsWith("`") && p.endsWith("`")) {
                return <code key={pI} className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] text-pink-700 dark:text-pink-400">{p.slice(1, -1)}</code>;
              }
              return p;
            });

            if (isHeading) {
              return (
                <h4 key={lIdx} className="font-bold text-xs text-slate-900 dark:text-white mt-2 mb-1 border-b border-slate-200 dark:border-slate-700 pb-0.5">
                  {rendered}
                </h4>
              );
            }

            if (isBullet) {
              return (
                <div key={lIdx} className="flex items-start gap-1.5 ml-1 text-xs">
                  <span className="text-emerald-600 font-black shrink-0">•</span>
                  <span className="leading-relaxed flex-1">{rendered}</span>
                </div>
              );
            }

            return (
              <p key={lIdx} className="text-xs leading-relaxed">
                {rendered}
              </p>
            );
          })}
        </div>
      );
    });
  }

  const currentConfig = PERSONA_CONFIGS[activeRole];

  return (
    <>
      {/* 1. Persistent Floating Launcher Button (Bottom Right) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50">
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full shadow-2xl hover:shadow-emerald-700/40 border-2 border-amber-400 hover:scale-105 transition-all cursor-pointer ring-4 ring-black/20"
            aria-label="Open Unnati AI Assistant"
          >
            <div className="relative">
              <span className="text-2xl block group-hover:scale-110 transition-transform">🤖</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>

            <div className="text-left leading-tight hidden sm:block pr-1">
              <span className="block text-xs font-black tracking-wider text-amber-300 uppercase">
                उन्नति AI · Unnati AI
              </span>
              <span className="block text-[10px] text-emerald-100 font-semibold">
                Ask Me Anything · 24/7
              </span>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
              AI HELP
            </span>
          </button>
        </div>
      )}

      {/* 2. Floating Popup Window (When Open) */}
      {isOpen && (
        <aside
          aria-label="Unnati AI Chatbot Window"
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[490px] md:w-[530px] bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isMinimized ? "h-16" : "h-[640px] max-h-[88vh]"
          }`}
        >
          {/* Header Bar */}
          <div
            className={`p-3.5 bg-gradient-to-r ${currentConfig.color} text-white flex items-center justify-between gap-2 shadow-md shrink-0 select-none`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl shrink-0">
                🤖
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-sm font-black tracking-tight truncate">
                    उन्नति AI (Unnati AI)
                  </h2>
                  <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black rounded text-[9px] uppercase tracking-wider">
                    NATIONAL AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-200 truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {currentConfig.label} · Telemetry Connected
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                title={isMinimized ? "Expand window" : "Minimize window"}
              >
                {isMinimized ? "□" : "−"}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                title="Close Unnati AI"
              >
                ✕
              </button>
            </div>
          </div>

          {/* If Minimized, don't show body */}
          {!isMinimized && (
            <>
              {/* Persona Role Switcher Strip */}
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
                  {(Object.keys(PERSONA_CONFIGS) as PersonaRole[]).map((roleKey) => {
                    const cfg = PERSONA_CONFIGS[roleKey];
                    const isActive = activeRole === roleKey;
                    return (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => handlePersonaSwitch(roleKey)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 border cursor-pointer ${
                          isActive
                            ? `${cfg.accent} shadow-xs font-black border-transparent`
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        <span>{cfg.icon}</span>
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat Conversation Scroll Area */}
              <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto bg-slate-50/60 dark:bg-slate-900/60 text-xs">
                {/* Live Field Telemetry Micro-Bar */}
                {context && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2 shadow-xs">
                    <span className="font-bold truncate">
                      📍 {context.location} ({context.farmAreaAcres} ac)
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                      🌾 {context.activeCrop} (CRI)
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      ₹{context.mandiPricePerQuintal}/q
                    </span>
                  </div>
                )}

                {/* Messages Stream */}
                {messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
                    >
                      <div
                        className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed shadow-xs text-xs sm:text-sm ${
                          isUser
                            ? "bg-emerald-700 text-white rounded-br-none"
                            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none"
                        }`}
                      >
                        {/* Attached Image Preview */}
                        {msg.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={msg.imageUrl}
                            alt="Scanned crop"
                            className="max-h-36 rounded-lg mb-2 object-cover border border-white/20"
                          />
                        )}

                        {/* Rich formatted text with code block and bold support */}
                        <div className="space-y-1">
                          {renderMessageContent(msg.text)}
                        </div>

                        {/* Disease Card if generated */}
                        {msg.diagnosisCard && (
                          <div className="mt-2.5 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-1.5 text-slate-900 dark:text-slate-100 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-amber-900 dark:text-amber-300">
                                🔬 {msg.diagnosisCard.pathogenName}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                                {msg.diagnosisCard.confidencePct}% match
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300">
                              <strong>ICAR Dosage:</strong> {msg.diagnosisCard.chemicalTreatment}
                            </p>
                            <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                              <strong>Organic:</strong> {msg.diagnosisCard.organicTreatment}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Message Footer with Speech Readout */}
                      <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400">
                        <span>{msg.timestamp}</span>
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => speakMessage(msg.id, msg.text)}
                            className="text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-bold cursor-pointer"
                          >
                            <span>{speakingMsgId === msg.id ? "⏹️ Stop" : "🔊 आवाज सुनें"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>उन्नति AI is synthesizing answer...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Persona Suggestions Carousel */}
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">
                    Suggestions:
                  </span>
                  {currentConfig.quickPrompts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSend(q)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-200 hover:text-emerald-800 text-[11px] font-medium border border-slate-200 dark:border-slate-600 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Leaf Scan Presets Drawer Toggle */}
              {showPresets && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border-t border-amber-200 dark:border-amber-900 grid grid-cols-3 gap-2 shrink-0">
                  {PRESET_LEAF_SCANS.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => {
                        setSelectedImage(preset.image);
                        setImageName(preset.title);
                        setShowPresets(false);
                      }}
                      className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-left hover:border-emerald-600 transition-all cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.image}
                        alt={preset.title}
                        className="w-full h-12 rounded object-cover mb-1"
                      />
                      <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 truncate">
                        {preset.title}
                      </p>
                      <span className="text-[9px] text-amber-700 dark:text-amber-300 block">
                        {preset.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Image Banner */}
              {selectedImage && (
                <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/80 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 shrink-0">
                  <div className="flex items-center gap-2 truncate">
                    <span>📸 Attached:</span>
                    <strong className="truncate">{imageName || "Leaf photo"}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Remove ✕
                  </button>
                </div>
              )}

              {/* Voice Listening Banner */}
              {isListening && (
                <div className="px-3 py-1.5 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-800 shrink-0 animate-pulse font-bold">
                  <span>🎙️ {micStatusText}</span>
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className="text-xs text-rose-700 underline cursor-pointer"
                  >
                    Stop
                  </button>
                </div>
              )}

              {/* Bottom Input Area */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 shrink-0">
                {/* Scan Leaf Button */}
                <button
                  type="button"
                  onClick={() => setShowPresets(!showPresets)}
                  className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  title="Scan crop leaf for diagnosis"
                >
                  <span>📸</span>
                  <span className="hidden sm:inline">Leaf</span>
                </button>

                {/* Real File Input for device camera / file upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Voice Mic Button */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                    isListening
                      ? "bg-rose-600 text-white border-rose-600 animate-pulse"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200"
                  }`}
                  title="Voice input in Hindi / English"
                >
                  <span>🎤</span>
                  <span className="hidden sm:inline">बोलें</span>
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask उन्नति AI (English, हिंदी, Hinglish)..."
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />

                {/* Send button */}
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={loading || (!input.trim() && !selectedImage)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>Send</span>
                  <span>➔</span>
                </button>
              </div>
            </>
          )}
        </aside>
      )}
    </>
  );
}
