CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS farms (
  id UUID PRIMARY KEY,
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
