import { Pool } from "pg";

export type FarmRecord = {
  id: string;
  name: string;
  areaAcres: number;
  center: { lat: number; lng: number };
  boundary: { lat: number; lng: number }[];
  createdAt: string;
  sections?: { crop: string; area: number }[];
  preferences?: { water: string; risk: string };
};

type DbFarmRow = {
  id: string;
  name: string;
  area_acres: string | number;
  center_lat: string | number;
  center_lng: string | number;
  boundary: { type: string; coordinates: [number, number][][] };
  sections: { crop: string; area: number }[];
  preferences: { water: string; risk: string };
  created_at: Date;
};

const globalStore = globalThis as typeof globalThis & { agriprofitFarms?: FarmRecord[]; agriprofitPool?: Pool };
const memoryFarms = globalStore.agriprofitFarms ?? (globalStore.agriprofitFarms = []);

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  return globalStore.agriprofitPool ?? (globalStore.agriprofitPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }));
}

export async function saveFarm(farm: FarmRecord): Promise<FarmRecord> {
  const pool = getPool();
  if (!pool) {
    // Add to memory store
    memoryFarms.unshift(farm);
    return farm;
  }
  const closedBoundary = [...farm.boundary, farm.boundary[0]].map((p) => `${p.lng} ${p.lat}`).join(",");
  await pool.query(
    `INSERT INTO farms (id, name, area_acres, center_lat, center_lng, boundary, sections, preferences)
     VALUES ($1, $2, $3, $4, $5, ST_GeogFromText($6), $7, $8)`,
    [
      farm.id,
      farm.name,
      farm.areaAcres,
      farm.center.lat,
      farm.center.lng,
      `POLYGON((${closedBoundary}))`,
      JSON.stringify(farm.sections ?? []),
      JSON.stringify(farm.preferences ?? {}),
    ]
  );
  return farm;
}

export async function listFarms(): Promise<FarmRecord[]> {
  const pool = getPool();
  if (!pool) return memoryFarms;
  const result = await pool.query<DbFarmRow>(
    `SELECT id, name, area_acres, center_lat, center_lng, sections, preferences, ST_AsGeoJSON(boundary::geometry)::json AS boundary, created_at FROM farms ORDER BY created_at DESC`
  );
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    areaAcres: Number(row.area_acres),
    center: { lat: Number(row.center_lat), lng: Number(row.center_lng) },
    boundary: (row.boundary?.coordinates?.[0] || []).map(([lng, lat]: [number, number]) => ({ lat, lng })).slice(0, -1),
    createdAt: row.created_at.toISOString(),
    sections: row.sections,
    preferences: row.preferences,
  }));
}

export async function getFarm(id: string): Promise<FarmRecord | null> {
  const pool = getPool();
  if (!pool) {
    const found = memoryFarms.find((f) => f.id === id);
    return found || null;
  }
  const result = await pool.query<DbFarmRow>(
    `SELECT id, name, area_acres, center_lat, center_lng, sections, preferences, ST_AsGeoJSON(boundary::geometry)::json AS boundary, created_at FROM farms WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    areaAcres: Number(row.area_acres),
    center: { lat: Number(row.center_lat), lng: Number(row.center_lng) },
    boundary: (row.boundary?.coordinates?.[0] || []).map(([lng, lat]: [number, number]) => ({ lat, lng })).slice(0, -1),
    createdAt: row.created_at.toISOString(),
    sections: row.sections,
    preferences: row.preferences,
  };
}

export async function updateFarm(id: string, updates: Partial<FarmRecord>): Promise<FarmRecord | null> {
  const pool = getPool();
  if (!pool) {
    const index = memoryFarms.findIndex((f) => f.id === id);
    if (index === -1) return null;
    memoryFarms[index] = { ...memoryFarms[index], ...updates };
    return memoryFarms[index];
  }

  const existing = await getFarm(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };
  const closedBoundary = [...merged.boundary, merged.boundary[0]].map((p) => `${p.lng} ${p.lat}`).join(",");

  await pool.query(
    `UPDATE farms
     SET name = $1, area_acres = $2, center_lat = $3, center_lng = $4, boundary = ST_GeogFromText($5), sections = $6, preferences = $7
     WHERE id = $8`,
    [
      merged.name,
      merged.areaAcres,
      merged.center.lat,
      merged.center.lng,
      `POLYGON((${closedBoundary}))`,
      JSON.stringify(merged.sections ?? []),
      JSON.stringify(merged.preferences ?? {}),
      id,
    ]
  );
  return merged;
}

export async function deleteFarm(id: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) {
    const index = memoryFarms.findIndex((f) => f.id === id);
    if (index === -1) return false;
    memoryFarms.splice(index, 1);
    return true;
  }
  const result = await pool.query(`DELETE FROM farms WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function recordFarmerWishComparison(
  farmId: string,
  cropSlug: string,
  comparisonSnapshot: unknown
): Promise<void> {
  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `UPDATE farm_plans
         SET farmer_wish_crop_slug = $1, farmer_wish_comparison_snapshot = $2
         WHERE farm_id = $3`,
        [cropSlug, JSON.stringify(comparisonSnapshot), farmId]
      );
    } catch {
      // Non-blocking telemetry update
    }
  }
}

