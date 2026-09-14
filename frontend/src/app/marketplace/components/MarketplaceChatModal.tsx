"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { ChatMessage, ChatConversation } from "@/lib/chat/chat-types";
import { MarketplaceUserRole } from "@/lib/marketplace-types";

interface MarketplaceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
}

export default function MarketplaceChatModal({
  isOpen,
  onClose,
  conversationId = "conv-mkt-wheat-001",
}: MarketplaceChatModalProps) {
  const { language, supportedLanguages } = useTranslation();

  // Active persona in demo mode (allows judge/evaluator to test Farmer vs Buyer vs Exporter vs Govt Officer)
  const [activePersona, setActivePersona] = useState<MarketplaceUserRole>("farmer");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  // Track which messages have "View Original" toggled ON
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation messages
  useEffect(() => {
    if (!isOpen) return;

    async function loadMessages() {
      setLoading(true);
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.messages) {
            setMessages(json.messages);
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [isOpen, conversationId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Toggle view original for a specific message
  function toggleViewOriginal(msgId: string) {
    setShowOriginalMap((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  }

  // Speak individual message via Web Speech
  function handleSpeakMessage(text: string, langCode: string) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const langTags: Record<string, string> = {
        en: "en-IN",
        hi: "hi-IN",
        pa: "pa-IN",
        hny: "hi-IN",
        ta: "ta-IN",
      };
      u.lang = langTags[langCode] || "hi-IN";
      window.speechSynthesis.speak(u);
    }
  }

  // Handle Send Message
  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setSending(true);

    const senderNames: Record<MarketplaceUserRole, string> = {
      farmer: "Harpreet Singh (Farmer)",
      private_buyer: "AgroCorp Logistics (Buyer)",
      exporter: "Gulf Agri Exports (Exporter)",
      government_buyer: "FCI Officer S. Sharma",
    };

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          senderId: `${activePersona}-1`,
          senderName: senderNames[activePersona],
          senderRole: activePersona,
          text: textToSend,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.message) {
          setMessages((prev) => [...prev, json.message]);
        }
      }
    } catch {
      // Fallback
    } finally {
      setSending(false);
    }
  }

  // Sample quick reply prompts for one-click SIH Demo 3
  const demoQuickPrompts = [
    {
      role: "farmer",
      text: "मुझे 50 क्विंटल गेहूं बेचना है।",
      label: "🌾 Farmer (Hindi): मुझे 50 क्विंटल गेहूं बेचना है।",
    },
    {
      role: "private_buyer",
      text: "I can offer ₹2,450 per quintal.",
      label: "🏢 Buyer (English): I can offer ₹2,450 per quintal.",
    },
    {
      role: "farmer",
      text: "मन्ने 50 क्विंटल गेहूँ बेचना सै।",
      label: "🚜 Farmer (Haryanvi): मन्ने 50 क्विंटल गेहूँ बेचना सै।",
    },
    {
      role: "government_buyer",
      text: "Your MSP request has been approved.",
      label: "🏛️ Govt (English): Your MSP request has been approved.",
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[640px] max-h-[92vh] overflow-hidden text-slate-900 dark:text-slate-100">
        {/* 1. Header with Persona Switcher */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg font-bold">
              💬
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight">
                  Multilingual Trade Chat & Negotiation
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] tracking-wider uppercase">
                  Real-time Translation Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Viewing in: <span className="font-bold text-amber-600 dark:text-amber-400">{supportedLanguages[language]?.nativeName} ({language})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Persona Switcher for SIH Demonstration */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-0.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 px-1.5 hidden sm:inline">Role:</span>
              {(["farmer", "private_buyer", "government_buyer"] as MarketplaceUserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setActivePersona(r)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    activePersona === r
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {r === "farmer" ? "👨‍🌾 Farmer" : r === "private_buyer" ? "🏢 Buyer" : "🏛️ Govt"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center text-lg font-bold cursor-pointer"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2. Chat Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Loading multilingual messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <span className="text-3xl">💬</span>
              <p className="text-sm font-semibold">No messages yet. Send an offer or inquiry in any language!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderRole === activePersona;
              const isOriginalShown = showOriginalMap[msg.id];
              const sourceLangInfo = supportedLanguages[msg.sourceLanguage as keyof typeof supportedLanguages];

              // Pick translated text for viewer's current language preference
              const translationRecord = msg.translations?.[language];
              const hasTranslation = translationRecord && translationRecord.status === "COMPLETED";
              const displayText =
                isOriginalShown || !hasTranslation
                  ? msg.originalText
                  : translationRecord.translatedText;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
                >
                  {/* Sender & Timestamp */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 px-1">
                    <span className="font-bold">{msg.senderName}</span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-sm space-y-2 text-sm leading-relaxed ${
                      isMe
                        ? "bg-emerald-700 text-white rounded-br-xs"
                        : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs"
                    }`}
                  >
                    {/* Message Body */}
                    <div className="font-medium">{displayText}</div>

                    {/* Translation Metadata Bar */}
                    <div
                      className={`pt-1.5 border-t text-[11px] flex flex-wrap items-center justify-between gap-2 ${
                        isMe ? "border-emerald-600/60 text-emerald-100" : "border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {/* Detected Source Language indicator */}
                      <span className="flex items-center gap-1">
                        {hasTranslation && !isOriginalShown ? (
                          <>
                            <span>🌐</span>
                            <span>
                              Translated from <strong className="underline">{sourceLangInfo?.nativeName || msg.sourceLanguage}</strong>
                            </span>
                          </>
                        ) : (
                          <>
                            <span>✍️</span>
                            <span>
                              Original in <strong className="underline">{sourceLangInfo?.nativeName || msg.sourceLanguage}</strong>
                            </span>
                          </>
                        )}
                      </span>

                      {/* Action buttons: Toggle Original & Read Aloud */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSpeakMessage(displayText, language)}
                          className="hover:scale-110 transition-transform cursor-pointer"
                          title="Listen to this message"
                        >
                          🔊
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleViewOriginal(msg.id)}
                          className={`font-bold underline cursor-pointer hover:opacity-80 transition-opacity`}
                        >
                          {isOriginalShown ? "[View Translated]" : "[View Original]"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 3. Demo One-Click Prompt Chips */}
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700 overflow-x-auto flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            SIH Demo:
          </span>
          {demoQuickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setActivePersona(p.role as MarketplaceUserRole);
                setInputText(p.text);
              }}
              className="text-xs bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full px-3 py-1 font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 4. Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type message in any language as ${activePersona === "farmer" ? "Farmer" : activePersona === "private_buyer" ? "Buyer" : "Govt"}...`}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-black text-sm rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            {sending ? "Sending..." : "Send ➔"}
          </button>
        </form>
      </div>
    </div>
  );
}
