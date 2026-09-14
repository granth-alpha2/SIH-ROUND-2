-- Migration 005: Three-Layer Soil Test & Fertilizer Recommendation Engine
-- Supports 3-layer variable depth soil profiles, physical & chemical parameters,
-- farmer verification status, cross-layer limitations, and crop-specific fertilizer plans.

BEGIN;

CREATE TABLE IF NOT EXISTS soil_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  laboratory_name TEXT,
  sample_id TEXT,
  file_name TEXT,
  file_url TEXT,
  total_layers_analyzed INTEGER NOT NULL DEFAULT 1 CHECK (total_layers_analyzed BETWEEN 1 AND 3),
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('pending_verification', 'verified', 'manually_edited')),
  overall_health_rating TEXT NOT NULL DEFAULT 'Moderate' CHECK (overall_health_rating IN ('Optimal', 'Moderate', 'Constraint_Detected', 'Severely_Constrained')),
  limitations_detected JSONB NOT NULL DEFAULT '[]'::jsonb,
  strengths_detected JSONB NOT NULL DEFAULT '[]'::jsonb,
  cross_layer_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS soil_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soil_report_id UUID NOT NULL REFERENCES soil_reports(id) ON DELETE CASCADE,
  layer_number INTEGER NOT NULL CHECK (layer_number BETWEEN 1 AND 3),
  depth_start_cm NUMERIC(5, 1) NOT NULL CHECK (depth_start_cm >= 0),
  depth_end_cm NUMERIC(5, 1) NOT NULL CHECK (depth_end_cm > depth_start_cm),
  layer_condition TEXT NOT NULL DEFAULT 'Good' CHECK (layer_condition IN ('Good', 'Moderate', 'Constraint')),
  limitation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(soil_report_id, layer_number)
);

CREATE TABLE IF NOT EXISTS soil_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soil_layer_id UUID NOT NULL REFERENCES soil_layers(id) ON DELETE CASCADE,
  parameter_name TEXT NOT NULL,
  parameter_category TEXT NOT NULL CHECK (parameter_category IN ('physical', 'chemical', 'secondary', 'micronutrient')),
  original_value NUMERIC(10, 3),
  original_unit TEXT NOT NULL,
  normalized_value NUMERIC(10, 3),
  normalized_unit TEXT NOT NULL,
  confidence NUMERIC(3, 2) NOT NULL DEFAULT 1.0 CHECK (confidence BETWEEN 0.0 AND 1.0),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('ocr', 'manual', 'lab_api', 'sensor')),
  status_rating TEXT NOT NULL DEFAULT 'Adequate' CHECK (status_rating IN ('Very_Low', 'Low', 'Medium', 'Adequate', 'High', 'Very_High', 'Unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(soil_layer_id, parameter_name)
);

CREATE TABLE IF NOT EXISTS fertilizer_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  soil_report_id UUID REFERENCES soil_reports(id) ON DELETE SET NULL,
  crop_slug TEXT NOT NULL,
  crop_name TEXT NOT NULL,
  target_yield_q_per_acre NUMERIC(8, 2),
  n_requirement_kg_acre NUMERIC(8, 2) NOT NULL DEFAULT 0,
  p_requirement_kg_acre NUMERIC(8, 2) NOT NULL DEFAULT 0,
  k_requirement_kg_acre NUMERIC(8, 2) NOT NULL DEFAULT 0,
  recommended_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  split_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  ph_advisory TEXT,
  ec_advisory TEXT,
  texture_advisory TEXT,
  weather_advisory TEXT,
  estimated_cost_inr NUMERIC(10, 2),
  confidence_level TEXT NOT NULL DEFAULT 'HIGH' CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW')),
  explainability_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS soil_reports_farm_idx ON soil_reports (farm_id, created_at DESC);
CREATE INDEX IF NOT EXISTS soil_layers_report_idx ON soil_layers (soil_report_id, layer_number);
CREATE INDEX IF NOT EXISTS soil_params_layer_idx ON soil_parameters (soil_layer_id, parameter_name);
CREATE INDEX IF NOT EXISTS fert_rec_farm_crop_idx ON fertilizer_recommendations (farm_id, crop_slug, created_at DESC);

DROP TRIGGER IF EXISTS soil_reports_set_updated_at ON soil_reports;
CREATE TRIGGER soil_reports_set_updated_at BEFORE UPDATE ON soil_reports FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
