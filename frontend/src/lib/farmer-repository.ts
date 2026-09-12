import { Pool } from "pg";

export type FarmerRecord = {
  id: string;
  phone: string;
  name: string;
  state?: string;
  district?: string;
  village?: string;
  preferredLanguage?: string;
  landOwnedHectares?: number;
  updatedAt: string;
};

type DbFarmerRow = {
  farmer_id: string;
  full_name: string;
  phone_number_masked: string;
  state: string | null;
  district: string | null;
  village: string | null;
  preferred_language: string | null;
  land_owned_hectares: number | string | null;
  registration_date: Date | string;
};

const globalStore = globalThis as typeof globalThis & {
  agriprofitFarmers?: Map<string, FarmerRecord>;
  agriprofitPool?: Pool;
};

const memoryFarmers =
  globalStore.agriprofitFarmers ??
  (globalStore.agriprofitFarmers = new Map<string, FarmerRecord>());

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
 * Ensures farmers table exists if PostgreSQL is available
 */
async function ensureTable(pool: Pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS farmers (
        farmer_id VARCHAR(32) PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        phone_number_masked VARCHAR(20),
        state VARCHAR(60),
        district VARCHAR(60),
        village VARCHAR(60),
        preferred_language VARCHAR(30) DEFAULT 'en',
        land_owned_hectares NUMERIC(8,2) DEFAULT 0,
        registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
  } catch (e) {
    console.warn("[Database] farmers table check warning:", e);
  }
}

export async function getFarmerByPhone(phone: string): Promise<FarmerRecord | null> {
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);

  // 1. Check in-memory store
  for (const farmer of memoryFarmers.values()) {
    if (farmer.phone === cleanPhone) {
      return farmer;
    }
  }

  // 2. Check PostgreSQL database
  const pool = getPool();
  if (pool) {
    try {
      await ensureTable(pool);
      const res = await pool.query<DbFarmerRow>(
        `SELECT * FROM farmers WHERE phone_number_masked = $1 OR phone_number_masked = $2 LIMIT 1`,
        [cleanPhone, `+91${cleanPhone}`]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        const record: FarmerRecord = {
          id: row.farmer_id,
          phone: cleanPhone,
          name: row.full_name,
          state: row.state ?? undefined,
          district: row.district ?? undefined,
          village: row.village ?? undefined,
          preferredLanguage: row.preferred_language ?? "en",
          landOwnedHectares: row.land_owned_hectares ? Number(row.land_owned_hectares) : undefined,
          updatedAt: new Date().toISOString(),
        };
        memoryFarmers.set(record.id, record);
        return record;
      }
    } catch (e) {
      console.warn("[Database] Failed to query farmer by phone:", e);
    }
  }

  return null;
}

export async function getFarmerById(id: string): Promise<FarmerRecord | null> {
  // 1. Check in-memory store
  if (memoryFarmers.has(id)) {
    return memoryFarmers.get(id)!;
  }

  // 2. Check PostgreSQL database
  const pool = getPool();
  if (pool) {
    try {
      await ensureTable(pool);
      const res = await pool.query<DbFarmerRow>(
        `SELECT * FROM farmers WHERE farmer_id = $1 LIMIT 1`,
        [id]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        const record: FarmerRecord = {
          id: row.farmer_id,
          phone: row.phone_number_masked ? row.phone_number_masked.replace(/\D/g, "").slice(-10) : "",
          name: row.full_name,
          state: row.state ?? undefined,
          district: row.district ?? undefined,
          village: row.village ?? undefined,
          preferredLanguage: row.preferred_language ?? "en",
          landOwnedHectares: row.land_owned_hectares ? Number(row.land_owned_hectares) : undefined,
          updatedAt: new Date().toISOString(),
        };
        memoryFarmers.set(record.id, record);
        return record;
      }
    } catch (e) {
      console.warn("[Database] Failed to query farmer by id:", e);
    }
  }

  return null;
}

export async function saveFarmer(data: {
  id: string;
  phone: string;
  name: string;
  state?: string;
  district?: string;
  village?: string;
  preferredLanguage?: string;
  landOwnedHectares?: number;
}): Promise<FarmerRecord> {
  const cleanPhone = data.phone.replace(/\D/g, "").slice(-10);
  const now = new Date().toISOString();

  const existing = await getFarmerById(data.id);

  const updated: FarmerRecord = {
    id: data.id,
    phone: cleanPhone,
    name: data.name.trim() || existing?.name || `Farmer (+91-${cleanPhone.slice(0, 5)}...)`,
    state: data.state ?? existing?.state ?? "Punjab",
    district: data.district ?? existing?.district ?? "Ludhiana",
    village: data.village ?? existing?.village ?? "",
    preferredLanguage: data.preferredLanguage ?? existing?.preferredLanguage ?? "en",
    landOwnedHectares: data.landOwnedHectares ?? existing?.landOwnedHectares,
    updatedAt: now,
  };

  // 1. Save in memory
  memoryFarmers.set(updated.id, updated);

  // 2. Save in PostgreSQL
  const pool = getPool();
  if (pool) {
    try {
      await ensureTable(pool);
      await pool.query(
        `INSERT INTO farmers (farmer_id, full_name, phone_number_masked, state, district, village, preferred_language, land_owned_hectares, registration_date, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (farmer_id) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           phone_number_masked = EXCLUDED.phone_number_masked,
           state = EXCLUDED.state,
           district = EXCLUDED.district,
           village = EXCLUDED.village,
           preferred_language = EXCLUDED.preferred_language,
           land_owned_hectares = COALESCE(EXCLUDED.land_owned_hectares, farmers.land_owned_hectares),
           updated_at = NOW()`,
        [
          updated.id,
          updated.name,
          updated.phone,
          updated.state,
          updated.district,
          updated.village,
          updated.preferredLanguage,
          updated.landOwnedHectares ?? null,
        ]
      );
    } catch (e) {
      console.warn("[Database] Failed to upsert farmer record:", e);
    }
  }

  return updated;
}

export async function getFarmerCount(): Promise<number> {
  const pool = getPool();
  if (pool) {
    try {
      await ensureTable(pool);
      const res = await pool.query<{ count: string }>("SELECT COUNT(*) AS count FROM farmers");
      if (res.rows.length > 0) {
        return parseInt(res.rows[0].count, 10) || 0;
      }
    } catch {
      // fallback
    }
  }
  return memoryFarmers.size;
}
