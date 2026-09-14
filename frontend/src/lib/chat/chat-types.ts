/**
 * AgriProfit — Multilingual Real-Time Chat Types
 * ===============================================
 * Facilitates translated communication across personas:
 * Farmer ↕ Private Buyer ↕ Exporter ↕ Government Procurement Officer
 */

import { SupportedLanguage } from "../translation/translation-types";
import { MarketplaceUserRole } from "../marketplace-types";

export interface ChatParticipant {
  userId: string;
  name: string;
  role: MarketplaceUserRole | "admin" | "farmer";
  preferredLanguage: SupportedLanguage;
}

export interface ChatMessageTranslation {
  targetLanguage: SupportedLanguage;
  translatedText: string;
  provider: string;
  status: "COMPLETED" | "FAILED" | "ORIGINAL";
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: MarketplaceUserRole | "admin" | "farmer";
  originalText: string;
  sourceLanguage: SupportedLanguage | string;
  translations: Record<string, ChatMessageTranslation>; // keyed by targetLanguage code
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  listingId?: string;
  cropName?: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  lastMessageAt: string;
  createdAt: string;
}
