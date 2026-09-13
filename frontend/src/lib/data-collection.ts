import { Pool } from "pg";

export type DataCollectionEventType = "recommendation" | "market" | "farm" | "yield" | "export";

export type DataCollectionValidationResult = {
  id: string;
  eventType: DataCollectionEventType;
  farmerId: string;
  farmId?: string;
  crop?: string;
  state?: string;
  district?: string;
  season?: string;
  quantityQuintals?: number;
  sellingChannel?: string;
  destination?: string;
  dataOrigin?: "LIVE" | "DEMO";
  createdAt: string;
  payload: Record<string, unknown>;
};

const globalStore = globalThis as typeof globalThis & {
  agriprofitDataCollection?: Map<string, DataCollectionValidationResult>;
  agriprofitDataCollectionPool?: Pool;
};

const memoryStore =
  globalStore.agriprofitDataCollection ??
  (globalStore.agriprofitDataCollection = new Map<string, DataCollectionValidationResult>());

let csvExportQueue: Promise<void> = Promise.resolve();

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  return (
    globalStore.agriprofitDataCollectionPool ??
    (globalStore.agriprofitDataCollectionPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    }))
  );
}

async function ensureTable(pool: Pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS data_collection_events (
        id UUID PRIMARY KEY,
        event_type VARCHAR(32) NOT NULL,
        farmer_id VARCHAR(64) NOT NULL,
        farm_id VARCHAR(64),
        crop VARCHAR(80),
        state VARCHAR(80),
        district VARCHAR(80),
        season VARCHAR(20),
        quantity_quintals NUMERIC(12,2),
        selling_channel VARCHAR(40),
        destination VARCHAR(80),
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } catch (error) {
    console.warn("[DataCollection] Table check warning:", error);
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizeString(value: unknown, fallback?: string): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return fallback;
}

function isMissing(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function parseOptionalNumber(value: unknown, fieldName: string): number | undefined {
  if (isMissing(value)) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new Error(`${fieldName} must be a finite number`);
}

function parseOptionalDate(value: unknown, fieldName: string): string | undefined {
  if (isMissing(value)) return undefined;
  const text = String(value).trim();
  if (!text) return undefined;
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(`${fieldName} must be a valid ISO date or timestamp`);
  }
  return new Date(text).toISOString();
}

function parseOptionalDataOrigin(value: unknown): "LIVE" | "DEMO" | undefined {
  const origin = sanitizeString(value)?.toUpperCase();
  if (!origin) return undefined;
  if (origin !== "LIVE" && origin !== "DEMO") {
    throw new Error(`dataOrigin must be either LIVE or DEMO; received ${origin}`);
  }
  return origin as "LIVE" | "DEMO";
}

function validateRequiredText(value: unknown, fieldName: string, minLength = 2): string | undefined {
  if (isMissing(value)) return undefined;
  const text = String(value).trim();
  if (text.length < minLength) {
    throw new Error(`${fieldName} is invalid`);
  }
  return text;
}

export function validateDataCollectionPayload(input: Record<string, unknown>): DataCollectionValidationResult {
  const eventType = (input.eventType ?? input.type ?? "recommendation") as DataCollectionEventType;
  const allowedTypes: DataCollectionEventType[] = ["recommendation", "market", "farm", "yield", "export"];

  if (!allowedTypes.includes(eventType)) {
    throw new Error(`Invalid eventType: ${String(eventType)}`);
  }

  const farmerId = sanitizeString(input.farmerId ?? input.userId, "anonymous-farmer");
  if (!farmerId) {
    throw new Error("farmerId is required");
  }

  const payloadSource = (input.payload as Record<string, unknown>) ?? {};
  const rawCrop = sanitizeString(payloadSource.crop ?? payloadSource.crop_name ?? input.crop ?? input.cropName);
  const crop = rawCrop ? validateRequiredText(rawCrop, "crop") : undefined;
  const state = sanitizeString(payloadSource.state ?? input.state);
  const district = sanitizeString(payloadSource.district ?? input.district);
  const season = sanitizeString(payloadSource.season ?? input.season);
  const unit = sanitizeString(payloadSource.unit ?? input.unit ?? input.quantityUnit ?? input.unitOfMeasure);
  const modelVersion = sanitizeString(payloadSource.modelVersion ?? input.modelVersion ?? input.model_version);
  const timestamp = parseOptionalDate(payloadSource.timestamp ?? input.timestamp ?? input.createdAt ?? input.recordedAt ?? input.date, "timestamp");
  const quantityQuintals = parseOptionalNumber(payloadSource.quantityQuintals ?? input.quantityQuintals ?? input.quantity, "quantityQuintals");
  const pricePerQuintal = parseOptionalNumber(payloadSource.pricePerQuintal ?? input.pricePerQuintal ?? input.price ?? payloadSource.price, "pricePerQuintal");
  const cost = parseOptionalNumber(payloadSource.cost ?? input.cost, "cost");
  const revenue = parseOptionalNumber(payloadSource.revenue ?? input.revenue, "revenue");
  const yieldValue = parseOptionalNumber(payloadSource.yield ?? input.yield ?? input.yieldQuintalsPerAcre, "yield");

  if (crop !== undefined && crop.length < 2) {
    throw new Error("Invalid crop value");
  }

  if (state !== undefined && state.length < 2) {
    throw new Error("Invalid state value");
  }

  if (district !== undefined && district.length < 2) {
    throw new Error("Invalid district value");
  }

  if (quantityQuintals !== undefined && quantityQuintals < 0) {
    throw new Error("quantityQuintals cannot be negative");
  }

  if (pricePerQuintal !== undefined && pricePerQuintal < 0) {
    throw new Error("price cannot be negative");
  }

  if (cost !== undefined && cost < 0) {
    throw new Error("cost cannot be negative");
  }

  if (revenue !== undefined && revenue < 0) {
    throw new Error("revenue cannot be negative");
  }

  if (yieldValue !== undefined && yieldValue < 0) {
    throw new Error("yield cannot be negative");
  }

  if (unit) {
    const normalizedUnit = unit.toLowerCase();
    const validUnits = ["quintal", "quintals", "q", "kg", "tonne", "tonnes", "t", "rupee", "rs", "inr"];
    if (!validUnits.includes(normalizedUnit)) {
      throw new Error(`Invalid unit: ${unit}`);
    }
  }

  if (modelVersion !== undefined && modelVersion.length < 2) {
    throw new Error("Invalid model version");
  }

  const dataOrigin = parseOptionalDataOrigin(payloadSource.dataOrigin ?? input.dataOrigin ?? input.data_origin) ?? "DEMO";

  if (eventType === "market" || eventType === "yield" || eventType === "export") {
    if (!crop) throw new Error("crop is required for this event type");
    if (!state && !district) throw new Error("location is required for this event type");
  }

  const payload: Record<string, unknown> = {
    ...payloadSource,
    source: sanitizeString(input.source, "backend-api"),
    eventType,
    createdAt: timestamp ?? new Date().toISOString(),
    dataOrigin,
    details: input.details ?? payloadSource.details ?? {},
  };

  if (quantityQuintals !== undefined) payload.quantityQuintals = quantityQuintals;
  if (pricePerQuintal !== undefined) payload.pricePerQuintal = pricePerQuintal;
  if (cost !== undefined) payload.cost = cost;
  if (revenue !== undefined) payload.revenue = revenue;
  if (yieldValue !== undefined) payload.yield = yieldValue;
  if (crop) payload.crop = crop;
  if (state) payload.state = state;
  if (district) payload.district = district;
  if (season) payload.season = season;
  if (unit) payload.unit = unit;
  if (modelVersion) payload.modelVersion = modelVersion;

  const record: DataCollectionValidationResult = {
    id: typeof input.id === "string" ? input.id : crypto.randomUUID(),
    eventType,
    farmerId,
    farmId: sanitizeString(input.farmId ?? payloadSource.farmId),
    crop,
    state,
    district,
    season,
    quantityQuintals,
    sellingChannel: sanitizeString(input.sellingChannel ?? input.channel ?? payloadSource.sellingChannel),
    destination: sanitizeString(input.destination ?? payloadSource.destination),
    dataOrigin,
    createdAt: timestamp ?? new Date().toISOString(),
    payload,
  };

  // Keep only a validated subset of fields and reject arbitrary frontend-only payloads.
  return record;
}

export async function persistCollectedData(record: DataCollectionValidationResult): Promise<DataCollectionValidationResult> {
  const pool = getPool();

  if (pool) {
    try {
      await ensureTable(pool);
      await pool.query(
        `INSERT INTO data_collection_events (
          id, event_type, farmer_id, farm_id, crop, state, district, season,
          quantity_quintals, selling_channel, destination, payload, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET
          event_type = EXCLUDED.event_type,
          farmer_id = EXCLUDED.farmer_id,
          farm_id = EXCLUDED.farm_id,
          crop = EXCLUDED.crop,
          state = EXCLUDED.state,
          district = EXCLUDED.district,
          season = EXCLUDED.season,
          quantity_quintals = EXCLUDED.quantity_quintals,
          selling_channel = EXCLUDED.selling_channel,
          destination = EXCLUDED.destination,
          payload = EXCLUDED.payload,
          created_at = EXCLUDED.created_at`,
        [
          record.id,
          record.eventType,
          record.farmerId,
          record.farmId ?? null,
          record.crop ?? null,
          record.state ?? null,
          record.district ?? null,
          record.season ?? null,
          record.quantityQuintals ?? null,
          record.sellingChannel ?? null,
          record.destination ?? null,
          JSON.stringify(record.payload),
        ]
      );
    } catch (error) {
      console.warn("[DataCollection] Database persistence failed, using memory fallback:", error);
    }
  }

  memoryStore.set(record.id, record);
  return record;
}

export function serializeForCsv(rows: DataCollectionValidationResult[]): string {
  const headers = [
    "id",
    "event_type",
    "farmer_id",
    "farm_id",
    "crop",
    "state",
    "district",
    "season",
    "quantity_quintals",
    "selling_channel",
    "destination",
    "created_at",
    "payload",
  ];

  const escapeCell = (value: unknown) => {
    const text = value == null ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push([
      row.id,
      row.eventType,
      row.farmerId,
      row.farmId ?? "",
      row.crop ?? "",
      row.state ?? "",
      row.district ?? "",
      row.season ?? "",
      row.quantityQuintals ?? "",
      row.sellingChannel ?? "",
      row.destination ?? "",
      row.createdAt,
      JSON.stringify(row.payload),
    ].map(escapeCell).join(","));
  }

  return lines.join("\n");
}

export async function exportCollectedDataAsCsv(): Promise<string> {
  const pool = getPool();
  const rows: DataCollectionValidationResult[] = [];

  if (pool) {
    try {
      await ensureTable(pool);
      const result = await pool.query(
        `SELECT id, event_type, farmer_id, farm_id, crop, state, district, season, quantity_quintals, selling_channel, destination, payload, created_at
         FROM data_collection_events ORDER BY created_at DESC`
      );

      for (const row of result.rows) {
        rows.push({
          id: row.id,
          eventType: row.event_type,
          farmerId: row.farmer_id,
          farmId: row.farm_id ?? undefined,
          crop: row.crop ?? undefined,
          state: row.state ?? undefined,
          district: row.district ?? undefined,
          season: row.season ?? undefined,
          quantityQuintals: row.quantity_quintals == null ? undefined : Number(row.quantity_quintals),
          sellingChannel: row.selling_channel ?? undefined,
          destination: row.destination ?? undefined,
          createdAt: new Date(row.created_at).toISOString(),
          payload: row.payload ?? {},
        });
      }
    } catch (error) {
      console.warn("[DataCollection] CSV query failed, falling back to memory store:", error);
    }
  }

  if (rows.length === 0) {
    for (const record of memoryStore.values()) {
      rows.push(record);
    }
  }

  return serializeForCsv(rows);
}

export async function enqueueCsvExportJob(): Promise<string> {
  const previous = csvExportQueue;
  let release: (() => void) | undefined;

  csvExportQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;

  try {
    return await exportCollectedDataAsCsv();
  } finally {
    release?.();
  }
}
