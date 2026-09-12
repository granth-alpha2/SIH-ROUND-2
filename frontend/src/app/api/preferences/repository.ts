import { Pool } from "pg";

export type RiskAppetite = "Conservative" | "Balanced" | "Growth";
export type ResourceLevel = "Low" | "Medium" | "High";
export type SoilType = "Alluvial" | "Black" | "Red" | "Sandy" | "Clay" | "Loam";

export type FarmerPreferenceRecord = {
  id: string;
  userId: string;
  riskAppetite: RiskAppetite;
  waterAvailability: ResourceLevel;
  investmentCapacity: ResourceLevel;
  preferredCrops: string[];
  cropsToAvoid: string[];
  farmingExperienceYears?: number;
  soilType?: SoilType;
  soilPh?: number;
  soilOrganicCarbon?: ResourceLevel;
  updatedAt: string;
};

type DbPreferenceRow = {
  id: string;
  user_id: string;
  risk_appetite: string;
  water_availability: string;
  investment_capacity: string;
  preferred_crops: string[];
  crops_to_avoid: string[];
  farming_experience_years: number | null;
  soil_type: string | null;
  soil_ph: number | null;
  soil_organic_carbon: string | null;
  updated_at: Date;
};

const defaultPreferences: FarmerPreferenceRecord = {
  id: "pref-default",
  userId: "default-farmer",
  riskAppetite: "Balanced",
  waterAvailability: "Medium",
  investmentCapacity: "Medium",
  preferredCrops: ["Wheat", "Mustard", "Chickpea"],
  cropsToAvoid: [],
  farmingExperienceYears: 12,
  soilType: "Loam",
  soilPh: 7.2,
  soilOrganicCarbon: "Medium",
  updatedAt: new Date().toISOString(),
};

const globalStore = globalThis as typeof globalThis & {
  agriprofitPreferences?: Map<string, FarmerPreferenceRecord>;
  agriprofitPool?: Pool;
};

const memoryPreferences =
  globalStore.agriprofitPreferences ?? (globalStore.agriprofitPreferences = new Map<string, FarmerPreferenceRecord>());

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  return globalStore.agriprofitPool ?? (globalStore.agriprofitPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }));
}

export async function getPreferences(userId: string): Promise<FarmerPreferenceRecord> {
  const pool = getPool();
  if (!pool) {
    const existing = memoryPreferences.get(userId);
    return existing || { ...defaultPreferences, userId };
  }

  const result = await pool.query<DbPreferenceRow>(
    `SELECT id, user_id, risk_appetite, water_availability, investment_capacity, preferred_crops, crops_to_avoid,
            farming_experience_years, soil_type, soil_ph, soil_organic_carbon, updated_at
     FROM farmer_preferences WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return { ...defaultPreferences, userId };
  }

  const r = result.rows[0];
  return {
    id: r.id,
    userId: r.user_id,
    riskAppetite: (r.risk_appetite as RiskAppetite) || "Balanced",
    waterAvailability: (r.water_availability as ResourceLevel) || "Medium",
    investmentCapacity: (r.investment_capacity as ResourceLevel) || "Medium",
    preferredCrops: r.preferred_crops || [],
    cropsToAvoid: r.crops_to_avoid || [],
    farmingExperienceYears: r.farming_experience_years ?? undefined,
    soilType: (r.soil_type as SoilType) ?? undefined,
    soilPh: r.soil_ph ?? undefined,
    soilOrganicCarbon: (r.soil_organic_carbon as ResourceLevel) ?? undefined,
    updatedAt: r.updated_at.toISOString(),
  };
}

export async function savePreferences(prefs: FarmerPreferenceRecord): Promise<FarmerPreferenceRecord> {
  const pool = getPool();
  if (!pool) {
    memoryPreferences.set(prefs.userId, prefs);
    return prefs;
  }

  await pool.query(
    `INSERT INTO farmer_preferences (
       id, user_id, risk_appetite, water_availability, investment_capacity,
       preferred_crops, crops_to_avoid, farming_experience_years, soil_type,
       soil_ph, soil_organic_carbon, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (user_id) DO UPDATE SET
       risk_appetite = EXCLUDED.risk_appetite,
       water_availability = EXCLUDED.water_availability,
       investment_capacity = EXCLUDED.investment_capacity,
       preferred_crops = EXCLUDED.preferred_crops,
       crops_to_avoid = EXCLUDED.crops_to_avoid,
       farming_experience_years = EXCLUDED.farming_experience_years,
       soil_type = EXCLUDED.soil_type,
       soil_ph = EXCLUDED.soil_ph,
       soil_organic_carbon = EXCLUDED.soil_organic_carbon,
       updated_at = EXCLUDED.updated_at`,
    [
      prefs.id,
      prefs.userId,
      prefs.riskAppetite,
      prefs.waterAvailability,
      prefs.investmentCapacity,
      prefs.preferredCrops,
      prefs.cropsToAvoid,
      prefs.farmingExperienceYears ?? null,
      prefs.soilType ?? null,
      prefs.soilPh ?? null,
      prefs.soilOrganicCarbon ?? null,
      prefs.updatedAt,
    ]
  );

  return prefs;
}

