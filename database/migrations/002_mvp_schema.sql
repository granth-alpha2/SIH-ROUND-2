BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'fpo_admin', 'platform_admin')),
  language_code TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE farms ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crop_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  temperature_min_c NUMERIC(5, 2) CHECK (temperature_min_c IS NULL OR temperature_min_c >= -50),
  temperature_max_c NUMERIC(5, 2) CHECK (temperature_max_c IS NULL OR temperature_max_c <= 70),
  rainfall_min_mm NUMERIC(10, 2) CHECK (rainfall_min_mm IS NULL OR rainfall_min_mm >= 0),
  rainfall_max_mm NUMERIC(10, 2) CHECK (rainfall_max_mm IS NULL OR rainfall_max_mm >= 0),
  water_requirement TEXT CHECK (water_requirement IS NULL OR water_requirement IN ('low', 'medium', 'high')),
  duration_days INTEGER CHECK (duration_days IS NULL OR duration_days > 0),
  expected_yield_per_acre NUMERIC(12, 2) CHECK (expected_yield_per_acre IS NULL OR expected_yield_per_acre >= 0),
  input_cost_per_acre NUMERIC(12, 2) CHECK (input_cost_per_acre IS NULL OR input_cost_per_acre >= 0),
  typical_price_per_unit NUMERIC(12, 2) CHECK (typical_price_per_unit IS NULL OR typical_price_per_unit >= 0),
  risk_notes TEXT,
  disease_pest_notes TEXT,
  source_type TEXT NOT NULL DEFAULT 'estimated' CHECK (source_type IN ('official', 'estimated', 'demo')),
  source_reference TEXT,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (crop_id, season),
  CHECK (temperature_max_c IS NULL OR temperature_min_c IS NULL OR temperature_max_c >= temperature_min_c),
  CHECK (rainfall_max_mm IS NULL OR rainfall_min_mm IS NULL OR rainfall_max_mm >= rainfall_min_mm)
);

CREATE TABLE IF NOT EXISTS farm_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  area_acres NUMERIC(12, 2) NOT NULL CHECK (area_acres > 0),
  percentage NUMERIC(5, 2) CHECK (percentage IS NULL OR (percentage > 0 AND percentage <= 100)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farmer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  risk_appetite TEXT CHECK (risk_appetite IS NULL OR risk_appetite IN ('conservative', 'balanced', 'growth')),
  water_availability TEXT CHECK (water_availability IS NULL OR water_availability IN ('low', 'medium', 'high')),
  investment_capacity NUMERIC(14, 2) CHECK (investment_capacity IS NULL OR investment_capacity >= 0),
  labor_availability TEXT CHECK (labor_availability IS NULL OR labor_availability IN ('low', 'medium', 'high')),
  farming_experience_years INTEGER CHECK (farming_experience_years IS NULL OR farming_experience_years >= 0),
  soil_information JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farmer_preference_crops (
  preference_id UUID NOT NULL REFERENCES farmer_preferences(id) ON DELETE CASCADE,
  crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL CHECK (preference_type IN ('preferred', 'excluded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (preference_id, crop_id)
);

CREATE TABLE IF NOT EXISTS weather_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  observed_at TIMESTAMPTZ NOT NULL,
  temperature_min_c NUMERIC(6, 2),
  temperature_max_c NUMERIC(6, 2),
  rainfall_mm NUMERIC(10, 2) CHECK (rainfall_mm IS NULL OR rainfall_mm >= 0),
  humidity_percent NUMERIC(5, 2) CHECK (humidity_percent IS NULL OR humidity_percent BETWEEN 0 AND 100),
  wind_speed_kmh NUMERIC(8, 2) CHECK (wind_speed_kmh IS NULL OR wind_speed_kmh >= 0),
  extreme_weather JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'official' CHECK (source_type IN ('official', 'estimated', 'demo', 'cached')),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (latitude, longitude, observed_at, provider)
);

CREATE TABLE IF NOT EXISTS weather_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  forecast_for DATE NOT NULL,
  temperature_min_c NUMERIC(6, 2),
  temperature_max_c NUMERIC(6, 2),
  rainfall_mm NUMERIC(10, 2) CHECK (rainfall_mm IS NULL OR rainfall_mm >= 0),
  humidity_percent NUMERIC(5, 2) CHECK (humidity_percent IS NULL OR humidity_percent BETWEEN 0 AND 100),
  wind_speed_kmh NUMERIC(8, 2) CHECK (wind_speed_kmh IS NULL OR wind_speed_kmh >= 0),
  extreme_weather JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'official' CHECK (source_type IN ('official', 'estimated', 'demo', 'cached')),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (latitude, longitude, forecast_for, provider)
);

CREATE TABLE IF NOT EXISTS market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  market_name TEXT NOT NULL,
  state TEXT,
  district TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  unit TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('official', 'estimated', 'demo', 'cached')),
  source_reference TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS msp_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  value NUMERIC(12, 2) NOT NULL CHECK (value >= 0),
  unit TEXT NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  source_type TEXT NOT NULL DEFAULT 'official' CHECK (source_type IN ('official', 'estimated', 'demo')),
  source_reference TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (crop_id, season, effective_from)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  input_snapshot JSONB NOT NULL,
  result_snapshot JSONB,
  confidence NUMERIC(5, 2) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crop_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  farm_section_id UUID REFERENCES farm_sections(id) ON DELETE SET NULL,
  crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE RESTRICT,
  area_acres NUMERIC(12, 2) NOT NULL CHECK (area_acres > 0),
  expected_revenue NUMERIC(14, 2) CHECK (expected_revenue IS NULL OR expected_revenue >= 0),
  estimated_cost NUMERIC(14, 2) CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  expected_profit NUMERIC(14, 2),
  roi_percent NUMERIC(8, 2),
  risk_score NUMERIC(5, 2) CHECK (risk_score IS NULL OR risk_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farm_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL UNIQUE REFERENCES recommendations(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'accepted', 'archived')),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('irrigation', 'weather', 'disease', 'market', 'crop_stage', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'estimated' CHECK (source_type IN ('official', 'estimated', 'demo', 'cached')),
  source_reference TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
  language_code TEXT NOT NULL DEFAULT 'en',
  context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL CHECK (length(trim(content)) > 0),
  context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS farms_owner_idx ON farms (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS farm_sections_farm_idx ON farm_sections (farm_id);
CREATE INDEX IF NOT EXISTS farmer_preference_crops_crop_idx ON farmer_preference_crops (crop_id, preference_type);
CREATE INDEX IF NOT EXISTS crop_parameters_crop_season_idx ON crop_parameters (crop_id, season);
CREATE INDEX IF NOT EXISTS weather_observations_location_time_idx ON weather_observations (latitude, longitude, observed_at DESC);
CREATE INDEX IF NOT EXISTS weather_forecasts_location_date_idx ON weather_forecasts (latitude, longitude, forecast_for);
CREATE INDEX IF NOT EXISTS market_prices_crop_region_time_idx ON market_prices (crop_id, state, district, recorded_at DESC);
CREATE INDEX IF NOT EXISTS msp_records_crop_effective_idx ON msp_records (crop_id, effective_from DESC);
CREATE INDEX IF NOT EXISTS recommendations_farm_created_idx ON recommendations (farm_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crop_allocations_recommendation_idx ON crop_allocations (recommendation_id);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications (user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS assistant_conversations_user_idx ON assistant_conversations (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS assistant_messages_conversation_idx ON assistant_messages (conversation_id, created_at);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS farms_set_updated_at ON farms;
CREATE TRIGGER farms_set_updated_at BEFORE UPDATE ON farms FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS crops_set_updated_at ON crops;
CREATE TRIGGER crops_set_updated_at BEFORE UPDATE ON crops FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS crop_parameters_set_updated_at ON crop_parameters;
CREATE TRIGGER crop_parameters_set_updated_at BEFORE UPDATE ON crop_parameters FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS farm_sections_set_updated_at ON farm_sections;
CREATE TRIGGER farm_sections_set_updated_at BEFORE UPDATE ON farm_sections FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS farmer_preferences_set_updated_at ON farmer_preferences;
CREATE TRIGGER farmer_preferences_set_updated_at BEFORE UPDATE ON farmer_preferences FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS recommendations_set_updated_at ON recommendations;
CREATE TRIGGER recommendations_set_updated_at BEFORE UPDATE ON recommendations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS crop_allocations_set_updated_at ON crop_allocations;
CREATE TRIGGER crop_allocations_set_updated_at BEFORE UPDATE ON crop_allocations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS farm_plans_set_updated_at ON farm_plans;
CREATE TRIGGER farm_plans_set_updated_at BEFORE UPDATE ON farm_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS assistant_conversations_set_updated_at ON assistant_conversations;
CREATE TRIGGER assistant_conversations_set_updated_at BEFORE UPDATE ON assistant_conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;