-- =============================================================================
-- AgriProfit Migration 006 — Multilingual Translation, Cache & Real-Time Chat
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Translation Cache Table
CREATE TABLE IF NOT EXISTS translation_cache (
    cache_key VARCHAR(128) PRIMARY KEY,
    source_lang VARCHAR(10) NOT NULL,
    target_lang VARCHAR(10) NOT NULL,
    source_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'unified',
    hit_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trans_cache_lookup ON translation_cache(source_lang, target_lang);

-- 2. Audio/TTS Cache Table
CREATE TABLE IF NOT EXISTS audio_cache (
    cache_key VARCHAR(128) PRIMARY KEY,
    language VARCHAR(10) NOT NULL,
    voice VARCHAR(60) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    audio_data TEXT, -- Base64 Data URI or storage URL
    duration_seconds NUMERIC(6,2),
    provider VARCHAR(50) NOT NULL DEFAULT 'tts_unified',
    hit_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audio_cache_lang ON audio_cache(language, content_hash);

-- 3. Chat Conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150),
    listing_id VARCHAR(36) REFERENCES marketplace_listings(id) ON DELETE SET NULL,
    created_by_user_id VARCHAR(36) NOT NULL,
    participant_ids TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conv_active ON chat_conversations(is_active, last_message_at DESC);

-- 4. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(36) NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    sender_role VARCHAR(30) NOT NULL DEFAULT 'farmer',
    original_text TEXT NOT NULL,
    source_language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages(conversation_id, created_at ASC);

-- 5. Chat Message Translations
CREATE TABLE IF NOT EXISTS chat_message_translations (
    id VARCHAR(36) PRIMARY KEY,
    message_id VARCHAR(36) NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    target_language VARCHAR(10) NOT NULL,
    translated_text TEXT NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'unified',
    translation_status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED', -- 'COMPLETED', 'FAILED', 'ORIGINAL'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (message_id, target_language)
);

CREATE INDEX IF NOT EXISTS idx_chat_msg_trans ON chat_message_translations(message_id, target_language);

-- 6. Translation Usage & Cost Telemetry
CREATE TABLE IF NOT EXISTS translation_usage_logs (
    id VARCHAR(36) PRIMARY KEY,
    service_type VARCHAR(20) NOT NULL, -- 'translation', 'tts', 'detection'
    provider VARCHAR(50) NOT NULL,
    source_lang VARCHAR(10),
    target_lang VARCHAR(10),
    character_count INT NOT NULL DEFAULT 0,
    latency_ms INT NOT NULL DEFAULT 0,
    is_cached BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trans_telemetry ON translation_usage_logs(service_type, created_at DESC);

COMMIT;
