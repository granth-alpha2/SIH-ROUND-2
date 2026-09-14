BEGIN;

-- Append-only operational audit trail. Metadata must contain identifiers and
-- provenance only; secrets, tokens, credentials, and raw request headers are
-- intentionally outside this table's contract.
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL CHECK (event IN (
    'PROFITABILITY_ANALYSIS_CREATED',
    'MODEL_PREDICTION_USED',
    'MARKET_DATA_USED',
    'SCENARIO_CALCULATED',
    'PROFITABILITY_RESULT_GENERATED',
    'ACTUAL_OUTCOME_RECORDED',
    'DATASET_EXPORT_CREATED'
  )),
  actor TEXT NOT NULL DEFAULT 'system',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analysis_id TEXT,
  model_version TEXT,
  data_source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK (metadata::text !~* '(password|secret|token|api[_-]?key|authorization|credential)')
);

CREATE INDEX IF NOT EXISTS audit_events_analysis_idx
  ON audit_events (analysis_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_event_time_idx
  ON audit_events (event, occurred_at DESC);

COMMENT ON TABLE audit_events IS 'Append-only audit trail for explainable profitability and data actions; never store secrets.';
COMMENT ON COLUMN audit_events.actor IS 'Authenticated actor ID or system/service name, never a credential.';
COMMENT ON COLUMN audit_events.metadata IS 'Non-sensitive audit context only: IDs, units, status, and provenance.';

COMMIT;
