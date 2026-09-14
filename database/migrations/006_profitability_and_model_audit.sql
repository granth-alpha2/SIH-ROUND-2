BEGIN;

-- Profitability persistence uses the existing farms, users, and crops entities.
-- Market/MSP/forecast values remain source references or snapshots so historical
-- analyses are reproducible even when provider records change.

CREATE TABLE IF NOT EXISTS profitability_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  scenario TEXT NOT NULL DEFAULT 'base_case',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'failed', 'archived')),
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profitability_analyses_farm_created_idx
  ON profitability_analyses (farm_id, created_at DESC);

CREATE TABLE IF NOT EXISTS profitability_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES profitability_analyses(id) ON DELETE CASCADE,
  strategy TEXT NOT NULL CHECK (strategy IN ('MSP', 'DIRECT_MARKET', 'GROUP_SELLING', 'EXPORT')),
  scenario_input JSONB NOT NULL DEFAULT '{}'::jsonb,
  assumptions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (analysis_id, strategy)
);

CREATE TABLE IF NOT EXISTS profitability_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES profitability_scenarios(id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL,
  amount_inr NUMERIC(14, 2) NOT NULL CHECK (amount_inr >= 0),
  unit TEXT NOT NULL DEFAULT 'total',
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profitability_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL UNIQUE REFERENCES profitability_scenarios(id) ON DELETE CASCADE,
  quantity NUMERIC(14, 4) NOT NULL CHECK (quantity >= 0),
  quantity_unit TEXT NOT NULL,
  expected_price_inr NUMERIC(14, 2),
  expected_revenue_inr NUMERIC(14, 2),
  total_cost_inr NUMERIC(14, 2),
  break_even_quantity NUMERIC(14, 4),
  break_even_price_inr NUMERIC(14, 2),
  expected_profit_inr NUMERIC(14, 2),
  profit_margin_pct NUMERIC(8, 3),
  roi_pct NUMERIC(8, 3),
  risk_classification TEXT CHECK (risk_classification IN ('LOW RISK', 'MODERATE RISK', 'HIGH RISK')),
  recommendation TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profitability_sensitivity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES profitability_scenarios(id) ON DELETE CASCADE,
  sensitivity_type TEXT NOT NULL CHECK (sensitivity_type IN ('price', 'yield', 'cost', 'logistics', 'quantity')),
  input_value NUMERIC(14, 4),
  input_unit TEXT,
  revenue_inr NUMERIC(14, 2),
  cost_inr NUMERIC(14, 2),
  profit_inr NUMERIC(14, 2),
  margin_pct NUMERIC(8, 3),
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key TEXT NOT NULL UNIQUE,
  model_type TEXT NOT NULL CHECK (model_type IN ('ML_MODEL', 'RULE_BASED_ENGINE', 'DETERMINISTIC_CALCULATION', 'LIVE_API_DATA')),
  version TEXT,
  purpose TEXT NOT NULL,
  artifact_uri TEXT,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES model_registry(id) ON DELETE RESTRICT,
  farmer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('yield', 'price', 'risk', 'recommendation')),
  predicted_value NUMERIC(14, 4),
  value_unit TEXT,
  prediction_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS model_predictions_context_idx
  ON model_predictions (farm_id, crop_id, predicted_at DESC);

CREATE TABLE IF NOT EXISTS actual_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id TEXT,
  scenario_id TEXT,
  transaction_id UUID,
  actual_quantity NUMERIC(14, 4),
  quantity_unit TEXT,
  actual_price_inr NUMERIC(14, 2),
  actual_revenue_inr NUMERIC(14, 2),
  actual_cost_inr NUMERIC(14, 2),
  actual_profit_inr NUMERIC(14, 2),
  predicted_quantity NUMERIC(14, 4),
  predicted_price_inr NUMERIC(14, 2),
  predicted_revenue_inr NUMERIC(14, 2),
  predicted_profit_inr NUMERIC(14, 2),
  observed_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS actual_outcomes_analysis_idx
  ON actual_outcomes (analysis_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS dataset_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  dataset_name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('csv', 'json', 'parquet')),
  filter_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  storage_uri TEXT,
  row_count BIGINT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS data_collection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  farmer_id VARCHAR(64) NOT NULL,
  farm_id VARCHAR(64),
  crop VARCHAR(80),
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  state VARCHAR(80),
  district VARCHAR(80),
  season VARCHAR(20),
  quantity_quintals NUMERIC(12, 2),
  selling_channel VARCHAR(40),
  destination VARCHAR(80),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT,
  data_origin TEXT CHECK (data_origin IS NULL OR data_origin IN ('LIVE', 'DEMO')),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS data_collection_events_created_idx
  ON data_collection_events (created_at DESC);

DROP TRIGGER IF EXISTS profitability_analyses_set_updated_at ON profitability_analyses;
CREATE TRIGGER profitability_analyses_set_updated_at
  BEFORE UPDATE ON profitability_analyses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS model_registry_set_updated_at ON model_registry;
CREATE TRIGGER model_registry_set_updated_at
  BEFORE UPDATE ON model_registry
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
