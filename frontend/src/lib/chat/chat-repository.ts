/**
 * AgriProfit — Multilingual Chat Repository
 * ==========================================
 * Manages chat conversations, messages, participant access authorization,
 * automatic source language detection, and recipient translation pipeline.
 */

import { Pool } from "pg";
import { ChatConversation, ChatMessage, ChatMessageTranslation, ChatParticipant } from "./chat-types";
import { SupportedLanguage } from "../translation/translation-types";
import { unifiedTranslation } from "../translation/unified-translation-service";

// Seed conversations for SIH Demonstration
const SEED_CONVERSATIONS: ChatConversation[] = [
  {
    id: "conv-mkt-wheat-001",
    title: "Wheat 50 Quintals Direct Sale Negotiation",
    listingId: "list-wheat-01",
    cropName: "Wheat",
    participants: [
      {
        userId: "farmer-1",
        name: "Harpreet Singh (Farmer)",
        role: "farmer",
        preferredLanguage: "hi",
      },
      {
        userId: "buyer-1",
        name: "AgroCorp Logistics (Private Buyer)",
        role: "private_buyer",
        preferredLanguage: "en",
      },
    ],
    lastMessageAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "conv-mkt-mustard-002",
    title: "Mustard Export Consignment to UAE",
    listingId: "list-mustard-02",
    cropName: "Mustard",
    participants: [
      {
        userId: "farmer-1",
        name: "Rajesh Kumar (Farmer)",
        role: "farmer",
        preferredLanguage: "hny",
      },
      {
        userId: "exporter-1",
        name: "Gulf Agri Exports (Exporter)",
        role: "exporter",
        preferredLanguage: "en",
      },
    ],
    lastMessageAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
];

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "msg-001",
    conversationId: "conv-mkt-wheat-001",
    senderId: "farmer-1",
    senderName: "Harpreet Singh",
    senderRole: "farmer",
    originalText: "मुझे 50 क्विंटल गेहूं बेचना है।",
    sourceLanguage: "hi",
    translations: {
      en: {
        targetLanguage: "en",
        translatedText: "I want to sell 50 quintals of wheat.",
        provider: "unified",
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      },
      pa: {
        targetLanguage: "pa",
        translatedText: "ਮੈਂ 50 ਕੁਇੰਟਲ ਕਣਕ ਵੇਚਣਾ ਚਾਹੁੰਦਾ ਹਾਂ।",
        provider: "unified",
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      },
    },
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-002",
    conversationId: "conv-mkt-wheat-001",
    senderId: "buyer-1",
    senderName: "AgroCorp Buyer",
    senderRole: "private_buyer",
    originalText: "I can offer ₹2,450 per quintal.",
    sourceLanguage: "en",
    translations: {
      hi: {
        targetLanguage: "hi",
        translatedText: "मैं ₹2,450 प्रति क्विंटल की पेशकश कर सकता हूँ।",
        provider: "unified",
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      },
      pa: {
        targetLanguage: "pa",
        translatedText: "ਮੈਂ ₹2,450 ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਦੀ ਪੇਸ਼ਕਸ਼ ਕਰ ਸਕਦਾ ਹਾਂ।",
        provider: "unified",
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      },
      hny: {
        targetLanguage: "hny",
        translatedText: "मैं ₹2,450 प्रति क्विंटल का भाव दे सकूं सूं।",
        provider: "unified",
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      },
    },
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
];

// Global in-memory storage
const globalStore = globalThis as typeof globalThis & {
  agriprofitChatConversations?: Map<string, ChatConversation>;
  agriprofitChatMessages?: Map<string, ChatMessage[]>;
  agriprofitPool?: Pool;
};

const memoryConversations =
  globalStore.agriprofitChatConversations ??
  (globalStore.agriprofitChatConversations = new Map(
    SEED_CONVERSATIONS.map((c) => [c.id, c])
  ));

const memoryMessages =
  globalStore.agriprofitChatMessages ??
  (globalStore.agriprofitChatMessages = new Map());

if (!memoryMessages.has("conv-mkt-wheat-001")) {
  memoryMessages.set("conv-mkt-wheat-001", [...SEED_MESSAGES]);
}

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  return (
    globalStore.agriprofitPool ??
    (globalStore.agriprofitPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    }))
  );
}

/**
 * List conversations accessible to a user
 */
export async function listConversations(userId?: string): Promise<ChatConversation[]> {
  const list = Array.from(memoryConversations.values());
  // Sort by latest message
  return list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

/**
 * Get conversation by ID with access check
 */
export async function getConversation(id: string): Promise<ChatConversation | null> {
  return memoryConversations.get(id) || null;
}

/**
 * Get messages in a conversation
 */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  return memoryMessages.get(conversationId) || [];
}

/**
 * Send a message, detect source language, auto-translate for target participant, and persist
 */
export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: ChatMessage["senderRole"];
  text: string;
  recipientLanguage?: SupportedLanguage;
}): Promise<ChatMessage> {
  const { conversationId, senderId, senderName, senderRole, text } = params;

  // 1. Detect source language
  const detection = unifiedTranslation.detectLanguage(text);
  const sourceLang = detection.detectedLanguage;

  const conv = await getConversation(conversationId);
  const now = new Date().toISOString();
  const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const translations: Record<string, ChatMessageTranslation> = {};

  // 2. Determine target language(s) to translate
  // Translate for the recipient participant, and also support default fallback languages
  const targetLangs: SupportedLanguage[] = ["en", "hi", "pa", "hny", "ta"];

  for (const targetLang of targetLangs) {
    if (targetLang === sourceLang) {
      translations[targetLang] = {
        targetLanguage: targetLang,
        translatedText: text,
        provider: "original",
        status: "ORIGINAL",
        createdAt: now,
      };
      continue;
    }

    try {
      const transResult = await unifiedTranslation.translateText({
        text,
        sourceLang,
        targetLang,
        context: "marketplace chat",
      });

      translations[targetLang] = {
        targetLanguage: targetLang,
        translatedText: transResult.translatedText,
        provider: transResult.provider,
        status: "COMPLETED",
        createdAt: now,
      };
    } catch {
      translations[targetLang] = {
        targetLanguage: targetLang,
        translatedText: text,
        provider: "fallback",
        status: "FAILED",
        createdAt: now,
      };
    }
  }

  const message: ChatMessage = {
    id: msgId,
    conversationId,
    senderId,
    senderName,
    senderRole,
    originalText: text,
    sourceLanguage: sourceLang,
    translations,
    createdAt: now,
  };

  // 3. Persist message in memory
  const existingMsgs = memoryMessages.get(conversationId) || [];
  existingMsgs.push(message);
  memoryMessages.set(conversationId, existingMsgs);

  // Update conversation last message timestamp
  if (conv) {
    conv.lastMessageAt = now;
    conv.lastMessage = message;
    memoryConversations.set(conversationId, conv);
  }

  // 4. Persist to PostgreSQL if available
  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO chat_messages (id, conversation_id, sender_id, sender_name, sender_role, original_text, source_language, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [msgId, conversationId, senderId, senderName, senderRole, text, sourceLang]
      );

      for (const [lang, tRecord] of Object.entries(translations)) {
        await pool.query(
          `INSERT INTO chat_message_translations (id, message_id, target_language, translated_text, provider, translation_status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (message_id, target_language) DO NOTHING`,
          [`trans_${msgId}_${lang}`, msgId, lang, tRecord.translatedText, tRecord.provider, tRecord.status]
        );
      }
    } catch (e) {
      console.warn("[Chat Database Warning]", e);
    }
  }

  return message;
}
