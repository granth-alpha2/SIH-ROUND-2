# AgriProfit — Data Dictionary

**Package version:** 1.0.0 · **Schema version:** 1.0.0 · **Created:** 2026-08-29
**Data owner:** AgriProfit Data/ML team · **Designation:** All row-level data in this
package is **SYNTHETIC** (algorithmically generated to match realistic Indian
agricultural value ranges and to be internally consistent/referentially intact). It is
a *seed / development / demo* dataset, **not** a scrape or copy of any government or
commercial database. Reference tables (states/districts, agro-climatic zones,
approximate coordinates, crop agronomic ranges) are built from general public domain
knowledge and should be checked against the authoritative sources listed per-table
before production use. See `README.md` §11 for the real-source acquisition plan.

**Refresh frequency (production target, not this seed data):** see the `frequency`
row in each table below — this is how often the *real* production version of that
table should be refreshed.

**Quality checks applied to this seed package:** referential-integrity check (every
foreign key resolves to an existing parent row), range checks (no negative
areas/prices/yields), duplicate-key check on every primary key, and a z-score
outlier pass on `mandi_prices` → `mandi_prices_clean`.

---

## Reference / Master

### `reference/01_states_districts.csv`
| Column | Type | Description |
|---|---|---|
| district_id | string (PK) | Unique ID, e.g. `DIST001` |
| state | string | State name |
| state_code | string | 2-letter state code |
| district | string | District name |
| district_code | string | `STATE-DIST` short code |
| latitude, longitude | float | Approximate district HQ coordinates (WGS84) |
| agro_climatic_zone | string | One of ICAR's 15 agro-climatic zones |

- **Source (production):** Survey of India / Census of India district master + ICAR agro-climatic zone map.
- **Frequency:** Static (districts rarely change; review yearly for reorganizations).
- **Coverage:** Sample of 10 states / 28 districts (production needs all ~766 districts).

### `reference/02_climate_regions.csv`
One weather-grid region per district (1:1 in this MVP; production may use finer
grid cells, e.g. 0.25° × 0.25°, several per district).
| Column | Type | Description |
|---|---|---|
| region_id | string (PK) | e.g. `REG001` |
| district_id | string (FK → districts) | |
| koppen_climate_class | string | Köppen climate classification code |

- **Source (production):** Open-Meteo / NASA POWER grid metadata, IMD gridded data.
- **Frequency:** Static.

### `reference/03_crops_master.csv`
Core agronomic + economic attributes per crop — the backbone reference table
almost every other dataset joins against.
| Column | Type | Description |
|---|---|---|
| crop_id | string (PK) | e.g. `CROP001` |
| crop_name | string | Common English name |
| category | string | Cereal / Pulse / Oilseed / Cash Crop / Vegetable / Fruit / Spice |
| season | string | Kharif / Rabi / Zaid / Perennial |
| duration_days | int | Sowing-to-harvest duration |
| water_requirement_mm | int | Total seasonal water requirement (mm) |
| soil_type_suitable | string | Primary suitable soil type |
| min_temp_c / max_temp_c | float | Survivable temperature range |
| ideal_temp_min_c / ideal_temp_max_c | float | Optimal growth temperature band |
| avg_yield_kg_per_ha | float | Expected average yield |
| seed_cost_per_ha_inr … other_cost_per_ha_inr | float | Cost breakdown components (₹/ha) |
| total_input_cost_per_ha_inr | float | Sum of all cost components |
| msp_eligible | bool | Whether Government MSP applies |
| price_unit | string | Quintal or Tonne (matches mandi/MSP pricing unit) |
| fao_item_code | string | Link key into `trade_data` (FAOSTAT item code style) |

- **Source (production):** ICAR crop package-of-practices, state agri-university
  crop budgets, Cost of Cultivation Scheme (CACP) reports.
- **Frequency:** Annual review (costs/yields shift with input prices and technology).
- **Importance:** **Critical** — nearly every scoring/profit calculation depends on it.

### `reference/04_crop_lifecycle_calendar.csv`
5 generic stages per crop (Land Prep → Germination → Vegetative → Flowering →
Maturity), day-ranges scaled to that crop's `duration_days`, with irrigation/
fertilizer/pest guidance text used to drive the in-app lifecycle calendar and
notification triggers.
- **Source (production):** ICAR/state extension crop-stage guides.
- **Frequency:** Static, reviewed yearly.

---

## Raw / Transactional

### `raw/01_farmers.csv`
| Column | Description |
|---|---|
| farmer_id (PK) | User account ID |
| full_name, gender, age | Profile fields (synthetic names) |
| phone_number_masked | Partially masked (real system stores hashed, not plaintext) |
| district_id (FK) | Farmer's registered district |
| land_owned_hectares | Self-reported or derived from farms table |
| preferred_language | For localized UI/notifications |
| registration_date | Account creation date |

- **Source (production):** User-entered at signup (OTP-verified). **PII — must be
  encrypted at rest**; `phone_number_masked` here simulates the masked display value only.
- **Frequency:** Real-time (new rows on every signup).

### `raw/02_farms.csv` + `raw/03_farms.geojson`
| Column | Description |
|---|---|
| farm_id (PK) | |
| farmer_id (FK) | Owner |
| latitude, longitude | Centroid |
| area_hectares | Auto-calculated from drawn boundary (Google Maps polygon area) |
| boundary_type | `pin` (single point, area estimated) or `polygon` (drawn boundary) |
| soil_type, water_source, irrigation_type | Self-reported / soil-card derived |

`farms.geojson` is a `FeatureCollection` — one `Feature` per farm, `Polygon` geometry
for `boundary_type='polygon'` rows and `Point` geometry otherwise, with the same
`farm_id` in `properties` so it joins 1:1 back to `farms.csv`.
- **Source (production):** Google Maps Platform (drawn by farmer in-app).
- **Frequency:** Real-time (created/edited by farmer); low-volume updates thereafter.
- **Importance:** **Critical** — the anchor entity for weather, soil, and recommendation joins.

### `raw/04_land_sections.csv`
Sub-division of a farm for multi-crop allocation.
| Column | Description |
|---|---|
| section_id (PK), farm_id (FK) | |
| area_hectares | Section area (sections sum to ≈ farm area) |
| assigned_crop_id (FK, nullable) | Crop currently assigned to this section, if any |

- **Source (production):** Farmer-drawn sub-polygons or manual land-fraction split.
- **Frequency:** Real-time / seasonal (re-drawn each planting cycle).

### `raw/05_weather_climate_daily.csv`
90-day daily weather record per climate region — first ~10 days flagged
`observed`, remainder `forecast`, matching the README's "90-day climate forecast" feature.
| Column | Description |
|---|---|
| weather_id (PK), region_id (FK) | |
| temp_min_c, temp_max_c, rainfall_mm, humidity_pct, wind_speed_kmph | Daily values |
| forecast_type | `observed` or `forecast` |

- **Source (production):** Open-Meteo API, NASA POWER, IMD gridded forecast — **live, free/public**.
- **Frequency:** Daily refresh (rolling 90-day forecast window).
- **Importance:** **Critical** and **time-sensitive**; this table should never be treated as static.

### `raw/06_mandi_prices.csv`
Monthly modal/min/max mandi price sample, 3 crop-representative mandis × 3 years,
2024–2026, per crop.
- **Source (production):** Agmarknet, e-NAM daily price bulletins — **official, daily**.
- **Frequency:** Daily in production (this seed is monthly-granularity for size reasons).
- **Importance:** **Critical**.

### `raw/07_msp_data.csv`
Annual Minimum Support Price per MSP-eligible crop, 2023–2026.
- **Source (production):** Department of Agriculture & Farmers Welfare / CACP, data.gov.in.
- **Frequency:** 1–2× per year (Kharif/Rabi MSP announcements).

### `raw/08_trade_data.csv`
Export/import quantities and value for India's major agri-export crops vs. top
trading-partner countries, 2021–2025 — the international-demand signal.
- **Source (production):** FAOSTAT, UN Comtrade — **free, monthly/annual**.
- **Frequency:** Annual (FAOSTAT) / monthly (Comtrade, coarser).
- **Importance:** Medium — a directional signal, not a price predictor on its own.

### `raw/09_soil_health.csv`
One test record per farm (N/P/K, pH, organic carbon).
- **Source (production):** Soil Health Card scheme, data.gov.in, or a lab partner API.
- **Frequency:** Every 2–3 years per farm (soil test cycle).

### `raw/10_notifications.csv`
Generated irrigation/weather/price/disease/MSP alerts sent to farmers.
- **Source:** Generated internally by the notification service from the other tables.
- **Frequency:** Real-time / event-driven.

---

## Processed / Derived (output of the Data Integration Layer & Recommendation Engine)

### `processed/01_mandi_prices_clean.csv`
`mandi_prices` deduplicated to one row per (crop, state, month), z-score
outlier rows (|z|>3 within crop) dropped, aggregated with mean/min/max/arrivals.
Used directly by the pricing/market-opportunity scoring step.

### `processed/02_weather_features_seasonal.csv`
`weather_climate_daily` aggregated to one feature row per region: average
temperature band, total rainfall, rainy-day count, average humidity over the
90-day window — the exact feature vector the weather-suitability score consumes.

### `processed/03_crop_scores.csv`
Output of the **Phase-1 rule-based recommendation model** (README §8): for a
sample of (farm, candidate crop) pairs, four sub-scores (weather, market, MSP
safety, risk) combined into one explainable 0–100 `overall_score`, with a
human-readable `explanation` string and a `rank_within_farm`. This is the
literal shape of the `/api/recommendations` response payload.

### `processed/04_farm_plans.csv`
Accepted multi-crop allocation plan per sampled farm: each land section mapped
to its top-ranked crop, with `crop_allocation_json` (array of per-section
cost/revenue), and farm-level `expected_revenue_inr`, `expected_cost_inr`,
`expected_profit_inr`, `expected_roi_pct`. Mirrors the `/api/farm-plans` table.

---

## ML / Model-Ready

### `ml/01_yield_training_data_full.csv` (+ `02_train` / `03_validation` / `04_test`)
**Use case:** yield prediction regression.
| Column | Role |
|---|---|
| crop_id, region_id, year | Identifiers |
| avg_temp_c, total_rainfall_mm, soil_ph, nitrogen_kg_per_ha, irrigation_type, area_hectares | **Features** |
| actual_yield_kg_per_ha | **Label** |

- **Split:** time-based — train = 2015–2021 (4,900 rows), validation = 2022–2023
  (1,400 rows), test = 2024 (700 rows). Time-based (not random) split is
  deliberate: it prevents leakage from future years' weather/soil conditions
  influencing a model that will only ever see the past at inference time.
- **Class balance:** N/A (regression). **Recommended min size:** ~5k rows for a
  simple gradient-boosted tree baseline; **ideal:** 50k+ rows once real
  multi-year district-level yield data is available (e.g. from ICRISAT/ICAR
  district yield statistics) to cover more crop×region×year combinations.

### `ml/05_price_forecast_dataset_full.csv` (+ `06_train` / `07_validation` / `08_test`)
**Use case:** next-period mandi price forecasting.
| Column | Role |
|---|---|
| crop_id, state, year, month | Identifiers |
| price_lag1/2/3_inr, rainfall_anomaly_mm, trade_demand_index | **Features** |
| target_price_next_period_inr | **Label** |

- **Split:** time-based — train ≤2023 (9,900 rows), validation = 2024 (3,600
  rows), test ≥2025 (6,000 rows).
- **Leakage risk called out:** the label must always be the *next* period's
  price relative to the feature row's period — never include same-period or
  future lag features. `rainfall_anomaly_mm` must be computed only from data
  available *before* the forecasted period in production.

---

## Schema Files
- `schemas/database_schema.sql` — full PostgreSQL + PostGIS DDL for every table above, with primary/foreign keys, suggested indexes, and a partitioning note for the three highest-volume tables (`weather_climate_daily`, `mandi_prices`, the two `ml_*` tables).
