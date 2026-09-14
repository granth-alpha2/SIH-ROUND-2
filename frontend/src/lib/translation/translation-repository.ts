/**
 * AgriProfit — Translation, Audio Cache & Telemetry Repository
 * =============================================================
 * Implements multi-tier caching (In-Memory + PostgreSQL) for translations and TTS audio.
 * Prevents redundant external API calls and uncontrolled latency/costs.
 */

import { Pool } from "pg";
import { SupportedLanguage } from "./translation-types";

export interface TranslationCacheRecord {
  cacheKey: string;
  sourceLang: string;
  targetLang: SupportedLanguage;
  sourceText: string;
  translatedText: string;
  provider: string;
  hitCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AudioCacheRecord {
  cacheKey: string;
  language: SupportedLanguage;
  voice: string;
  contentHash: string;
  audioData: string; // Base64 Data URI or URL
  durationSeconds?: number;
  provider: string;
  hitCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UsageMetricRecord {
  id: string;
  serviceType: "translation" | "tts" | "detection";
  provider: string;
  sourceLang?: string;
  targetLang?: string;
  characterCount: number;
  latencyMs: number;
  isCached: boolean;
  status: "SUCCESS" | "FAILED";
  createdAt: string;
}

// Global in-memory cache stores
const globalStore = globalThis as typeof globalThis & {
  agriprofitTranslationCache?: Map<string, TranslationCacheRecord>;
  agriprofitAudioCache?: Map<string, AudioCacheRecord>;
  agriprofitUsageLogs?: UsageMetricRecord[];
  agriprofitPool?: Pool;
};

const memoryTranslations =
  globalStore.agriprofitTranslationCache ??
  (globalStore.agriprofitTranslationCache = new Map<string, TranslationCacheRecord>());

const memoryAudio =
  globalStore.agriprofitAudioCache ??
  (globalStore.agriprofitAudioCache = new Map<string, AudioCacheRecord>());

const memoryUsageLogs =
  globalStore.agriprofitUsageLogs ??
  (globalStore.agriprofitUsageLogs = []);

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
 * Generate a deterministic cache key for text translation: sourceLang:targetLang:contentHash
 */
export function buildTranslationCacheKey(sourceLang: string, targetLang: string, text: string): string {
  // Simple fast hash
  let hash = 0;
  const clean = `${sourceLang}:${targetLang}:${text.trim()}`;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return `trans_${Math.abs(hash).toString(16)}`;
}

/**
 * Generate a deterministic cache key for audio TTS: lang:voice:contentHash
 */
export function buildAudioCacheKey(lang: string, voice: string, text: string): string {
  let hash = 0;
  const clean = `${lang}:${voice}:${text.trim()}`;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return `audio_${Math.abs(hash).toString(16)}`;
}

/**
 * Get cached translation if present
 */
export async function getCachedTranslation(
  sourceLang: string,
  targetLang: SupportedLanguage,
  sourceText: string
): Promise<TranslationCacheRecord | null> {
  const key = buildTranslationCacheKey(sourceLang, targetLang, sourceText);

  // 1. Check in-memory store
  if (memoryTranslations.has(key)) {
    const record = memoryTranslations.get(key)!;
    record.hitCount++;
    return record;
  }

  // 2. Check PostgreSQL
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT cache_key, source_lang, target_lang, source_text, translated_text, provider, hit_count, created_at, updated_at
         FROM translation_cache WHERE cache_key = $1 LIMIT 1`,
        [key]
      );
      if (res.rows.length > 0) {
        const r = res.rows[0];
        const record: TranslationCacheRecord = {
          cacheKey: r.cache_key,
          sourceLang: r.source_lang,
          targetLang: r.target_lang as SupportedLanguage,
          sourceText: r.source_text,
          translatedText: r.translated_text,
          provider: r.provider,
          hitCount: (r.hit_count || 1) + 1,
          createdAt: r.created_at.toISOString(),
          updatedAt: new Date().toISOString(),
        };
        memoryTranslations.set(key, record);
        // Async increment hit count in DB
        pool.query(`UPDATE translation_cache SET hit_count = hit_count + 1, updated_at = NOW() WHERE cache_key = $1`, [key]).catch(() => {});
        return record;
      }
    } catch {
      // Fallback
    }
  }

  return null;
}

/**
 * Save translation into multi-tier cache
 */
export async function saveTranslationCache(
  sourceLang: string,
  targetLang: SupportedLanguage,
  sourceText: string,
  translatedText: string,
  provider: string
): Promise<TranslationCacheRecord> {
  const key = buildTranslationCacheKey(sourceLang, targetLang, sourceText);
  const now = new Date().toISOString();

  const record: TranslationCacheRecord = {
    cacheKey: key,
    sourceLang,
    targetLang,
    sourceText,
    translatedText,
    provider,
    hitCount: 1,
    createdAt: now,
    updatedAt: now,
  };

  // 1. In-memory
  memoryTranslations.set(key, record);

  // 2. PostgreSQL
  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO translation_cache (cache_key, source_lang, target_lang, source_text, translated_text, provider, hit_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 1, NOW(), NOW())
         ON CONFLICT (cache_key) DO UPDATE SET
           translated_text = EXCLUDED.translated_text,
           hit_count = translation_cache.hit_count + 1,
           updated_at = NOW()`,
        [key, sourceLang, targetLang, sourceText, translatedText, provider]
      );
    } catch {
      // Database optional
    }
  }

  return record;
}

/**
 * Get cached audio if present
 */
export async function getCachedAudio(
  lang: SupportedLanguage,
  voice: string,
  text: string
): Promise<AudioCacheRecord | null> {
  const key = buildAudioCacheKey(lang, voice, text);

  // 1. In-memory
  if (memoryAudio.has(key)) {
    const record = memoryAudio.get(key)!;
    record.hitCount++;
    return record;
  }

  // 2. PostgreSQL
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT cache_key, language, voice, content_hash, audio_data, duration_seconds, provider, hit_count, created_at, updated_at
         FROM audio_cache WHERE cache_key = $1 LIMIT 1`,
        [key]
      );
      if (res.rows.length > 0) {
        const r = res.rows[0];
        const record: AudioCacheRecord = {
          cacheKey: r.cache_key,
          language: r.language as SupportedLanguage,
          voice: r.voice,
          contentHash: r.content_hash,
          audioData: r.audio_data,
          durationSeconds: r.duration_seconds ? Number(r.duration_seconds) : undefined,
          provider: r.provider,
          hitCount: (r.hit_count || 1) + 1,
          createdAt: r.created_at.toISOString(),
          updatedAt: new Date().toISOString(),
        };
        memoryAudio.set(key, record);
        pool.query(`UPDATE audio_cache SET hit_count = hit_count + 1, updated_at = NOW() WHERE cache_key = $1`, [key]).catch(() => {});
        return record;
      }
    } catch {
      // Fallback
    }
  }

  return null;
}

/**
 * Save audio to cache
 */
export async function saveAudioCache(
  lang: SupportedLanguage,
  voice: string,
  text: string,
  audioData: string,
  provider: string,
  durationSeconds?: number
): Promise<AudioCacheRecord> {
  const key = buildAudioCacheKey(lang, voice, text);
  const now = new Date().toISOString();

  const record: AudioCacheRecord = {
    cacheKey: key,
    language: lang,
    voice,
    contentHash: key,
    audioData,
    durationSeconds,
    provider,
    hitCount: 1,
    createdAt: now,
    updatedAt: now,
  };

  memoryAudio.set(key, record);

  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO audio_cache (cache_key, language, voice, content_hash, audio_data, duration_seconds, provider, hit_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW(), NOW())
         ON CONFLICT (cache_key) DO UPDATE SET
           audio_data = EXCLUDED.audio_data,
           hit_count = audio_cache.hit_count + 1,
           updated_at = NOW()`,
        [key, lang, voice, key, audioData, durationSeconds ?? null, provider]
      );
    } catch {
      // DB optional
    }
  }

  return record;
}

/**
 * Record translation / TTS telemetry
 */
export function recordUsageMetric(metric: Omit<UsageMetricRecord, "id" | "createdAt">): void {
  const id = `usage_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const record: UsageMetricRecord = {
    ...metric,
    id,
    createdAt: new Date().toISOString(),
  };

  memoryUsageLogs.push(record);
  if (memoryUsageLogs.length > 500) {
    memoryUsageLogs.shift();
  }

  const pool = getPool();
  if (pool) {
    pool.query(
      `INSERT INTO translation_usage_logs (id, service_type, provider, source_lang, target_lang, character_count, latency_ms, is_cached, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        record.id,
        record.serviceType,
        record.provider,
        record.sourceLang || null,
        record.targetLang || null,
        record.characterCount,
        record.latencyMs,
        record.isCached,
        record.status,
      ]
    ).catch(() => {});
  }
}

/**
 * Get telemetry overview for admin status
 */
export function getTelemetrySummary(): {
  totalRequests: number;
  cachedRequests: number;
  cacheHitRatio: number;
  totalCharacters: number;
  avgLatencyMs: number;
} {
  const total = memoryUsageLogs.length;
  if (total === 0) {
    return { totalRequests: 0, cachedRequests: 0, cacheHitRatio: 0, totalCharacters: 0, avgLatencyMs: 0 };
  }

  let cached = 0;
  let chars = 0;
  let totalLatency = 0;

  for (const log of memoryUsageLogs) {
    if (log.isCached) cached++;
    chars += log.characterCount;
    totalLatency += log.latencyMs;
  }

  return {
    totalRequests: total,
    cachedRequests: cached,
    cacheHitRatio: Number(((cached / total) * 100).toFixed(1)),
    totalCharacters: chars,
    avgLatencyMs: Math.round(totalLatency / total),
  };
}
