-- ==============================================================================
-- AgriProfit — Consolidated Production & Development Database Initialization
-- ==============================================================================
-- Reconciles PostGIS extensions, UUID generation, core spatial farms tables,
-- normalized MVP entities (users, crops, market_prices, notifications), and
-- farmer preferences so Next.js runtime repositories and queries succeed.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Farms Table (Matching frontend/src/app/api/farms/repository.ts)
CREATE TABLE IF NOT EXISTS farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  area_acres NUMERIC(12, 2) NOT NULL CHECK (area_acres > 0),
  center_lat DOUBLE PRECISION NOT NULL CHECK (center_lat BETWEEN -90 AND 90),
  center_lng DOUBLE PRECISION NOT NULL CHECK (center_lng BETWEEN -180 AND 180),
  boundary GEOGRAPHY(POLYGON, 4326) NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS farms_boundary_gist_idx ON farms USING GIST (boundary);
CREATE INDEX IF NOT EXISTS farms_created_at_idx ON farms (created_at DESC);

-- 2. Users Table
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

-- 3. Crops & Parameters
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

-- 4. Farm Sections
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

-- 5. Farmer Preferences
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

-- 6. Weather Observations
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

-- 7. Market Prices & MSP
CREATE TABLE IF NOT EXISTS market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  market_center TEXT NOT NULL,
  price_date DATE NOT NULL,
  modal_price NUMERIC(12, 2) NOT NULL CHECK (modal_price >= 0),
  min_price NUMERIC(12, 2) CHECK (min_price IS NULL OR min_price >= 0),
  max_price NUMERIC(12, 2) CHECK (max_price IS NULL OR max_price >= 0),
  arrivals_tonnes NUMERIC(12, 2) CHECK (arrivals_tonnes IS NULL OR arrivals_tonnes >= 0),
  unit TEXT NOT NULL DEFAULT 'quintal',
  source_type TEXT NOT NULL DEFAULT 'official' CHECK (source_type IN ('official', 'estimated', 'demo', 'cached')),
  source_reference TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (crop_id, state, district, market_center, price_date),
  CHECK (max_price IS NULL OR min_price IS NULL OR max_price >= min_price)
);

CREATE TABLE IF NOT EXISTS msp_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  marketing_year INTEGER NOT NULL CHECK (marketing_year >= 2000),
  msp_price NUMERIC(12, 2) NOT NULL CHECK (msp_price >= 0),
  cost_a2_fl NUMERIC(12, 2) CHECK (cost_a2_fl IS NULL OR cost_a2_fl >= 0),
  cost_c2 NUMERIC(12, 2) CHECK (cost_c2 IS NULL OR cost_c2 >= 0),
  return_over_cost_pct NUMERIC(6, 2),
  procuring_agency TEXT,
  effective_date DATE NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'official' CHECK (source_type IN ('official', 'estimated', 'demo')),
  source_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (crop_id, season, marketing_year)
);

-- 8. Recommendations & Farm Plans
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'applied', 'archived')),
  summary JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS crop_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE RESTRICT,
  allocated_acres NUMERIC(12, 2) NOT NULL CHECK (allocated_acres > 0),
  percentage NUMERIC(5, 2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  rank INTEGER NOT NULL CHECK (rank > 0),
  reasoning TEXT,
  expected_revenue NUMERIC(14, 2) CHECK (expected_revenue IS NULL OR expected_revenue >= 0),
  estimated_cost NUMERIC(14, 2) CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  expected_profit NUMERIC(14, 2),
  risk_score NUMERIC(5, 2) CHECK (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (recommendation_id, crop_id)
);

CREATE TABLE IF NOT EXISTS farm_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL UNIQUE REFERENCES recommendations(id) ON DELETE CASCADE,
  plan_status TEXT NOT NULL DEFAULT 'planned' CHECK (plan_status IN ('planned', 'in_progress', 'completed', 'abandoned')),
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  farmer_wish_crop_slug TEXT,
  farmer_wish_comparison_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  level TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (read);

-- 10. NCDEX Commodity Futures & Daily Settlement Table (Bhav Copy)
CREATE TABLE IF NOT EXISTS ncdex_futures_prices (
  record_id VARCHAR(36) PRIMARY KEY,
  crop_slug VARCHAR(40),
  commodity_symbol VARCHAR(30) NOT NULL,
  commodity_name VARCHAR(80) NOT NULL,
  product_group VARCHAR(40) NOT NULL,
  basis_center VARCHAR(60) NOT NULL,
  contract_expiry DATE NOT NULL,
  trade_date DATE NOT NULL,
  open_price NUMERIC(10,2),
  high_price NUMERIC(10,2),
  low_price NUMERIC(10,2),
  close_price NUMERIC(10,2),
  settlement_price NUMERIC(10,2) NOT NULL,
  spot_price NUMERIC(10,2) NOT NULL,
  premium_discount_inr NUMERIC(10,2),
  premium_discount_pct NUMERIC(6,2),
  volume_contracts INT DEFAULT 0,
  open_interest INT DEFAULT 0,
  unit VARCHAR(20) DEFAULT '₹/Quintal',
  source VARCHAR(100) DEFAULT 'NCDEX Official Bhav Copy (End-of-Day Settlement)',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ncdex_crop_slug ON ncdex_futures_prices(crop_slug);
CREATE INDEX IF NOT EXISTS idx_ncdex_product_group ON ncdex_futures_prices(product_group);
CREATE INDEX IF NOT EXISTS idx_ncdex_trade_date ON ncdex_futures_prices(trade_date DESC);

