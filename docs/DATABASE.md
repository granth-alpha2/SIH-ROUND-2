# AgriProfit — PostgreSQL & PostGIS Database Specification

## 1. Relational & Spatial Schema

The database utilizes PostgreSQL 16 with the **PostGIS** extension for spatial polygon operations.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 2. Core Tables

### `districts` (28 District Master Reference)
```sql
CREATE TABLE districts (
    district_id         VARCHAR(10) PRIMARY KEY,
    state                VARCHAR(60) NOT NULL,
    state_code           VARCHAR(5) NOT NULL,
    district             VARCHAR(60) NOT NULL,
    district_code        VARCHAR(15) NOT NULL,
    latitude             NUMERIC(9,6) NOT NULL,
    longitude            NUMERIC(9,6) NOT NULL,
    agro_climatic_zone   VARCHAR(60),
    geom                 GEOGRAPHY(POINT, 4326)
);
```

### `crops_master` (Agronomic Catalog)
```sql
CREATE TABLE crops_master (
    crop_id                    VARCHAR(10) PRIMARY KEY,
    crop_name                  VARCHAR(80) NOT NULL,
    category                   VARCHAR(30) NOT NULL,
    season                     VARCHAR(15) NOT NULL,
    duration_days              INT NOT NULL,
    water_requirement_mm       INT NOT NULL,
    soil_type_suitable         VARCHAR(40),
    avg_yield_kg_per_ha        NUMERIC(10,1),
    total_input_cost_per_ha_inr NUMERIC(10,2),
    msp_eligible               BOOLEAN NOT NULL DEFAULT FALSE
);
```

### `farms` (Farmer Land Parcels)
```sql
CREATE TABLE farms (
    id           VARCHAR(36) PRIMARY KEY,
    farmer_id    VARCHAR(36),
    name         VARCHAR(100) NOT NULL,
    area_acres   NUMERIC(8,2) NOT NULL,
    center_lat   NUMERIC(9,6) NOT NULL,
    center_lng   NUMERIC(9,6) NOT NULL,
    boundary     GEOGRAPHY(POLYGON, 4326) NOT NULL,
    sections     JSONB DEFAULT '[]'::jsonb,
    preferences  JSONB DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_farms_boundary ON farms USING GIST(boundary);
```

