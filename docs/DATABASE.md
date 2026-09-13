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

---

## 3. Secondary Marketplace Tables (Migration 005)

### `procurement_centers`
Official government procurement depots (FCI, PUNGRAIN, HAFED, NAFED) with contact, coordinates, and district linkage.

### `msp_procurement_requests`
Farmer MSP selling declarations with locked statutory MSP rates, requested quantities, and lifecycle states (`PENDING` -> `APPROVED` -> `ARRIVED` -> `BIOMETRIC_VERIFIED` -> `COMPLETED`).

### `msp_authorization_codes`
Cryptographic 12-digit numeric one-time transaction codes (`^[0-9]{12}$`) tied to request, farmer, and center, with expiry and single-use consumption flags.

### `msp_verification_events`
Audit logs of biometric verification events storing provider references, timestamps, and status without raw biometric data.

### `marketplace_listings`
Direct farmer-to-buyer produce listings with asking prices, quality grades, delivery terms, and real-time comparison vs MSP and ML expected prices.

### `marketplace_offers`
Private buyer purchase offers, counter-offers, and acceptance status.

### `marketplace_groups` & `marketplace_group_members`
Farmer cooperative aggregation groups pooling smallholder quantities with explainable compatibility scores.

### `marketplace_exporters` & `marketplace_export_matches`
Registered Indian exporter directory (APEDA & IEC validated) and group export proposals.

### `marketplace_transactions`
Unified ledger of completed MSP and direct marketplace transactions, digital receipts, and demo DBT payment records.

### `marketplace_audit_logs`
Immutable compliance and security audit logs tracking every event, actor, role, and metadata snapshot.


