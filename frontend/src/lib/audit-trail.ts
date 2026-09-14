import { Pool } from "pg";

export type AuditEventName =
  | "PROFITABILITY_ANALYSIS_CREATED"
  | "MODEL_PREDICTION_USED"
  | "MARKET_DATA_USED"
  | "SCENARIO_CALCULATED"
  | "PROFITABILITY_RESULT_GENERATED"
  | "ACTUAL_OUTCOME_RECORDED"
  | "DATASET_EXPORT_CREATED";

type AuditMetadataValue = string | number | boolean | null;

export type AuditEventInput = {
  event: AuditEventName;
  actor?: string;
  analysisId?: string;
  modelVersion?: string;
  dataSource?: string;
  metadata?: Record<string, AuditMetadataValue>;
};

const globalStore = globalThis as typeof globalThis & {
  agriprofitAuditPool?: Pool;
  agriprofitAuditMemory?: Array<AuditEventInput & { occurredAt: string }>;
};

const memoryAuditEvents =
  globalStore.agriprofitAuditMemory ??
  (globalStore.agriprofitAuditMemory = []);

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  return (
    globalStore.agriprofitAuditPool ??
    (globalStore.agriprofitAuditPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    }))
  );
}

function sanitizeMetadata(metadata: Record<string, AuditMetadataValue> = {}) {
  const safeEntries = Object.entries(metadata).filter(([key, value]) => {
    const unsafeKey = /(password|secret|token|api[_-]?key|authorization|credential)/i.test(key);
    return !unsafeKey && (value === null || ["string", "number", "boolean"].includes(typeof value));
  });
  return Object.fromEntries(safeEntries);
}

function safeActor(actor?: string) {
  return actor && /^[a-zA-Z0-9._:@-]{1,128}$/.test(actor) ? actor : "system";
}

export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  const record = {
    ...input,
    actor: safeActor(input.actor),
    metadata: sanitizeMetadata(input.metadata),
    occurredAt: new Date().toISOString(),
  };
  const pool = getPool();

  if (!pool) {
    memoryAuditEvents.push(record);
    return;
  }

  try {
    await pool.query(
      `INSERT INTO audit_events
        (event, actor, occurred_at, analysis_id, model_version, data_source, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        record.event,
        record.actor,
        record.occurredAt,
        record.analysisId ?? null,
        record.modelVersion ?? null,
        record.dataSource ?? null,
        JSON.stringify(record.metadata),
      ]
    );
  } catch (error) {
    console.warn("[AuditTrail] Database write failed; retaining event in memory:", error);
    memoryAuditEvents.push(record);
  }
}
