-- =============================================================================
-- AgriProfit — Database Schema (PostgreSQL 14+ with PostGIS extension)
-- =============================================================================
-- Matches the CSV/GeoJSON datasets in reference/, raw/, processed/, ml/.
-- Naming, IDs and types are consistent with those files so seed data can be
-- loaded directly with `\copy` / COPY commands (see README.md §"Loading the
-- data package").
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- REFERENCE / MASTER TABLES
-- ---------------------------------------------------------------------------

CREATE TABLE districts (
    district_id         VARCHAR(10) PRIMARY KEY,
    state                VARCHAR(60) NOT NULL,
    state_code           VARCHAR(5)  NOT NULL,
    district             VARCHAR(60) NOT NULL,
    district_code        VARCHAR(15) NOT NULL,
    latitude              NUMERIC(9,6) NOT NULL,
    longitude             NUMERIC(9,6) NOT NULL,
    agro_climatic_zone    VARCHAR(60),
    geom                  GEOGRAPHY(POINT, 4326)
);

CREATE TABLE climate_regions (
    region_id             VARCHAR(10) PRIMARY KEY,
    district_id            VARCHAR(10) REFERENCES districts(district_id),
    state                   VARCHAR(60),
    district                VARCHAR(60),
    latitude                 NUMERIC(9,6),
    longitude                NUMERIC(9,6),
    agro_climatic_zone       VARCHAR(60),
    koppen_climate_class     VARCHAR(5)
);

CREATE TABLE crops_master (
    crop_id                    VARCHAR(10) PRIMARY KEY,
    crop_name                   VARCHAR(80) NOT NULL,
    category                    VARCHAR(30) NOT NULL,   -- Cereal/Pulse/Oilseed/Cash Crop/Vegetable/Fruit/Spice
    season                       VARCHAR(15) NOT NULL,   -- Kharif/Rabi/Zaid/Perennial
    duration_days                INT NOT NULL,
    water_requirement_mm         INT NOT NULL,
    soil_type_suitable            VARCHAR(40),
    min_temp_c                    NUMERIC(4,1),
    max_temp_c                    NUMERIC(4,1),
    ideal_temp_min_c              NUMERIC(4,1),
    ideal_temp_max_c              NUMERIC(4,1),
    avg_yield_kg_per_ha           NUMERIC(10,1),
    seed_cost_per_ha_inr          NUMERIC(10,2),
    fertilizer_cost_per_ha_inr    NUMERIC(10,2),
    labor_cost_per_ha_inr         NUMERIC(10,2),
    irrigation_cost_per_ha_inr    NUMERIC(10,2),
    other_cost_per_ha_inr         NUMERIC(10,2),
    total_input_cost_per_ha_inr   NUMERIC(10,2),
    msp_eligible                   BOOLEAN NOT NULL DEFAULT FALSE,
    price_unit                     VARCHAR(10) NOT NULL,   -- Quintal / Tonne
    fao_item_code                  VARCHAR(10)              -- links to trade_data via crop mapping
);

CREATE TABLE crop_lifecycle_calendar (
    calendar_id             VARCHAR(10) PRIMARY KEY,
    crop_id                  VARCHAR(10) NOT NULL REFERENCES crops_master(crop_id),
    stage_number              INT NOT NULL,
    stage_name                 VARCHAR(50) NOT NULL,
    start_day                  INT NOT NULL,
    end_day                    INT NOT NULL,
    irrigation_guidance         TEXT,
    fertilizer_guidance         TEXT,
    pest_disease_risk_note      TEXT,
    UNIQUE (crop_id, stage_number)
);

-- ---------------------------------------------------------------------------
-- USER / FARM TABLES
-- ---------------------------------------------------------------------------

CREATE TABLE farmers (
    farmer_id             VARCHAR(15) PRIMARY KEY,
    full_name              VARCHAR(100) NOT NULL,
    gender                   VARCHAR(10),
    age                       INT,
    phone_number_masked       VARCHAR(15),
    district_id               VARCHAR(10) REFERENCES districts(district_id),
    state                      VARCHAR(60),
    district                   VARCHAR(60),
    village                    VARCHAR(60),
    land_owned_hectares         NUMERIC(6,2),
    preferred_language          VARCHAR(20),
    registration_date            DATE NOT NULL
);

CREATE TABLE farms (
    farm_id                VARCHAR(10) PRIMARY KEY,
    farmer_id                VARCHAR(15) NOT NULL REFERENCES farmers(farmer_id),
    district_id                VARCHAR(10) REFERENCES districts(district_id),
    state                        VARCHAR(60),
    district                     VARCHAR(60),
    latitude                      NUMERIC(9,6) NOT NULL,
    longitude                     NUMERIC(9,6) NOT NULL,
    area_hectares                 NUMERIC(8,2) NOT NULL,
    boundary_type                  VARCHAR(10) NOT NULL,   -- 'pin' or 'polygon'
    boundary_geom                   GEOGRAPHY(POLYGON, 4326),  -- populated from farms.geojson when boundary_type='polygon'
    centroid_geom                    GEOGRAPHY(POINT, 4326),
    soil_type                        VARCHAR(30),
    water_source                     VARCHAR(30),
    irrigation_type                  VARCHAR(20),
    registration_date                  DATE NOT NULL
);

CREATE TABLE land_sections (
    section_id              VARCHAR(10) PRIMARY KEY,
    farm_id                   VARCHAR(10) NOT NULL REFERENCES farms(farm_id),
    section_number              INT NOT NULL,
    area_hectares                NUMERIC(8,2) NOT NULL,
    soil_type                      VARCHAR(30),
    irrigation_type                 VARCHAR(20),
    assigned_crop_id                 VARCHAR(10) REFERENCES crops_master(crop_id),
    UNIQUE (farm_id, section_number)
);

CREATE TABLE soil_health (
    soil_id                VARCHAR(10) PRIMARY KEY,
    farm_id                  VARCHAR(10) NOT NULL REFERENCES farms(farm_id),
    test_date                  DATE NOT NULL,
    nitrogen_kg_per_ha           NUMERIC(6,1),
    phosphorus_kg_per_ha          NUMERIC(6,1),
    potassium_kg_per_ha            NUMERIC(6,1),
    ph_value                        NUMERIC(3,2),
    organic_carbon_pct               NUMERIC(4,2),
    soil_type                         VARCHAR(30),
    source                             VARCHAR(80)
);

-- ---------------------------------------------------------------------------
-- LIVE / TIME-SERIES DATA
-- ---------------------------------------------------------------------------

CREATE TABLE weather_climate_daily (
    weather_id            VARCHAR(12) PRIMARY KEY,
    region_id               VARCHAR(10) NOT NULL REFERENCES climate_regions(region_id),
    date                       DATE NOT NULL,
    temp_min_c                  NUMERIC(4,1),
    temp_max_c                   NUMERIC(4,1),
    rainfall_mm                   NUMERIC(6,1),
    humidity_pct                   NUMERIC(4,1),
    wind_speed_kmph                 NUMERIC(4,1),
    forecast_type                    VARCHAR(15),   -- 'observed' or 'forecast'
    source                             VARCHAR(80),
    UNIQUE (region_id, date)
);
CREATE INDEX idx_weather_region_date ON weather_climate_daily(region_id, date);

CREATE TABLE mandi_prices (
    price_id                VARCHAR(12) PRIMARY KEY,
    crop_id                    VARCHAR(10) NOT NULL REFERENCES crops_master(crop_id),
    state                        VARCHAR(60),
    district                      VARCHAR(60),
    mandi_name                     VARCHAR(80),
    date                             DATE NOT NULL,
    min_price_per_unit_inr           NUMERIC(10,2),
    max_price_per_unit_inr            NUMERIC(10,2),
    modal_price_per_unit_inr           NUMERIC(10,2),
    unit                                 VARCHAR(10),
    arrivals_tonnes                       NUMERIC(10,1),
    source                                 VARCHAR(80)
);
CREATE INDEX idx_mandi_crop_date ON mandi_prices(crop_id, date);

CREATE TABLE msp_data (
    msp_id                VARCHAR(10) PRIMARY KEY,
    crop_id                  VARCHAR(10) NOT NULL REFERENCES crops_master(crop_id),
    season                     VARCHAR(15),
    year                        INT NOT NULL,
    msp_price_per_unit_inr        NUMERIC(10,2),
    unit                            VARCHAR(10),
    announced_date                  DATE,
    source                            VARCHAR(100),
    UNIQUE (crop_id, year)
);

CREATE TABLE trade_data (
    trade_id                VARCHAR(10) PRIMARY KEY,
    crop_id                    VARCHAR(10) NOT NULL REFERENCES crops_master(crop_id),
    country                       VARCHAR(50),
    year                            INT NOT NULL,
    export_qty_tonnes                NUMERIC(12,1),
    import_qty_tonnes                 NUMERIC(12,1),
    trade_value_usd                    NUMERIC(14,2),
    yoy_demand_change_pct                NUMERIC(6,2),
    source                                 VARCHAR(80)
);
CREATE INDEX idx_trade_crop_year ON trade_data(crop_id, year);

-- ---------------------------------------------------------------------------
-- DERIVED / MODEL-READY / OUTPUT TABLES
-- ---------------------------------------------------------------------------

CREATE TABLE mandi_prices_clean (
    clean_price_id        VARCHAR(12) PRIMARY KEY,
    crop_id                  VARCHAR(10) NOT NULL REFERENCES crops_master(crop_id),
    state                      VARCHAR(60),
    year_month                  VARCHAR(7),   -- 'YYYY-MM'
    avg_modal_price_inr           NUMERIC(10,2),
    min_price_inr                  NUMERIC(10,2),
    max_price_inr                   NUMERIC(10,2),
    total_arrivals_tonnes             NUMERIC(12,1),
    n_source_records                    INT
);

CREATE TABLE weather_features_seasonal (
    weather_feature_id     VARCHAR(10) PRIMARY KEY,
    region_id                 VARCHAR(10) NOT NULL REFERENCES climate_regions(region_id),
    avg_temp_min_c               NUMERIC(4,1),
    avg_temp_max_c                 NUMERIC(4,1),
    total_rainfall_mm                NUMERIC(7,1),
    rainy_days                         INT,
    avg_humidity_pct                     NUMERIC(4,1),
    window_start                          DATE,
    window_end                             DATE
);

CREATE TABLE crop_scores (
    score_id                VARCHAR(12) PRIMARY KEY,
    farm_id                    VARCHAR(10) NOT NULL REFERENCES farms(farm_id),
    crop_id                      VARCHAR(10) NOT NULL REFERENCES crops_master(crop_id),
    weather_suitability_score       NUMERIC(5,1),
    market_opportunity_score          NUMERIC(5,1),
    msp_safety_score                    NUMERIC(5,1),
    risk_score                            NUMERIC(5,1),
    overall_score                          NUMERIC(5,1),
    rank_within_farm                        INT,
    explanation                              TEXT,
    generated_date                            DATE
);
CREATE INDEX idx_scores_farm ON crop_scores(farm_id, overall_score DESC);

CREATE TABLE farm_plans (
    plan_id                VARCHAR(10) PRIMARY KEY,
    farm_id                   VARCHAR(10) NOT NULL REFERENCES farms(farm_id),
    farmer_id                    VARCHAR(15) NOT NULL REFERENCES farmers(farmer_id),
    plan_date                       DATE NOT NULL,
    crop_allocation_json                JSONB NOT NULL,  -- [{section_id, crop_id, area_hectares, expected_cost_inr, expected_revenue_inr}, ...]
    expected_revenue_inr                  NUMERIC(12,2),
    expected_cost_inr                       NUMERIC(12,2),
    expected_profit_inr                       NUMERIC(12,2),
    expected_roi_pct                            NUMERIC(6,1),
    status                                        VARCHAR(40)
);

CREATE TABLE notifications (
    notification_id        VARCHAR(12) PRIMARY KEY,
    farmer_id                 VARCHAR(15) NOT NULL REFERENCES farmers(farmer_id),
    farm_id                     VARCHAR(10) NOT NULL REFERENCES farms(farm_id),
    notification_type             VARCHAR(30),
    message                         TEXT,
    scheduled_date                    DATE,
    priority                            VARCHAR(10),
    status                                VARCHAR(15)
);

-- ---------------------------------------------------------------------------
-- ML TABLES (yield prediction + price forecasting)
-- ---------------------------------------------------------------------------

CREATE TABLE ml_yield_training_data (
    record_id                VARCHAR(12) PRIMARY KEY,
    crop_id                     VARCHAR(10) NOT NULL REFERENCES crops_master(crop_id),
    region_id                     VARCHAR(10) NOT NULL REFERENCES climate_regions(region_id),
    state                           VARCHAR(60),
    year                              INT NOT NULL,
    avg_temp_c                          NUMERIC(4,1),
    total_rainfall_mm                     NUMERIC(7,1),
    soil_ph                                 NUMERIC(3,2),
    nitrogen_kg_per_ha                        NUMERIC(6,1),
    irrigation_type                             VARCHAR(20),
    area_hectares                                 NUMERIC(6,2),
    actual_yield_kg_per_ha                          NUMERIC(10,1),  -- LABEL
    split                                              VARCHAR(10)   -- 'train' / 'validation' / 'test'
);

CREATE TABLE ml_price_forecast_data (
    record_id                VARCHAR(12) PRIMARY KEY,
    crop_id                     VARCHAR(10) NOT NULL REFERENCES crops_master(crop_id),
    state                         VARCHAR(60),
    year                            INT NOT NULL,
    month                             INT NOT NULL,
    price_lag1_inr                     NUMERIC(10,2),
    price_lag2_inr                       NUMERIC(10,2),
    price_lag3_inr                         NUMERIC(10,2),
    rainfall_anomaly_mm                       NUMERIC(6,1),
    trade_demand_index                          NUMERIC(5,1),
    target_price_next_period_inr                  NUMERIC(10,2),  -- LABEL
    split                                            VARCHAR(10)
);

-- =============================================================================
-- Suggested additional indexes for production scale
-- =============================================================================
CREATE INDEX idx_farms_farmer ON farms(farmer_id);
CREATE INDEX idx_sections_farm ON land_sections(farm_id);
CREATE INDEX idx_notif_farmer ON notifications(farmer_id, scheduled_date);
CREATE INDEX idx_farms_geom ON farms USING GIST (centroid_geom);

-- =============================================================================
-- Recommended PARTITIONING (production scale, not applied to this seed schema):
--   - weather_climate_daily: RANGE partition by date (monthly)
--   - mandi_prices:          RANGE partition by date (monthly/quarterly)
--   - ml_yield_training_data / ml_price_forecast_data: RANGE partition by year
-- =============================================================================

CREATE TABLE IF NOT EXISTS ncdex_futures_prices (
    record_id                   VARCHAR(36) PRIMARY KEY,
    crop_id                     VARCHAR(10) REFERENCES crops_master(crop_id),
    crop_slug                   VARCHAR(40),
    commodity_symbol            VARCHAR(30) NOT NULL,
    commodity_name              VARCHAR(80) NOT NULL,
    product_group               VARCHAR(40) NOT NULL,
    basis_center                VARCHAR(60) NOT NULL,
    contract_expiry             DATE NOT NULL,
    trade_date                  DATE NOT NULL,
    open_price                  NUMERIC(10,2),
    high_price                  NUMERIC(10,2),
    low_price                   NUMERIC(10,2),
    close_price                 NUMERIC(10,2),
    settlement_price            NUMERIC(10,2) NOT NULL,
    spot_price                  NUMERIC(10,2) NOT NULL,
    premium_discount_inr        NUMERIC(10,2),
    premium_discount_pct        NUMERIC(6,2),
    volume_contracts            INT DEFAULT 0,
    open_interest               INT DEFAULT 0,
    unit                        VARCHAR(20) DEFAULT 'Quintal',
    source                      VARCHAR(100) DEFAULT 'NCDEX Official Bhav Copy (End-of-Day Settlement)',
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ncdex_crop_trade ON ncdex_futures_prices(crop_slug, trade_date);
CREATE INDEX IF NOT EXISTS idx_ncdex_symbol_expiry ON ncdex_futures_prices(commodity_symbol, contract_expiry);

