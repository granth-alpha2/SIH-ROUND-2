# AgriProfit — Data Package

A production-shaped, referentially-consistent **synthetic** dataset ecosystem
reverse-engineered from `AgriProfit_README.md` (the project brief), covering every
data need called out by its features: farm mapping, 90-day climate scoring, mandi/MSP
market analysis, international trade demand, profit calculation, risk-adjusted
recommendation, multi-crop allocation, lifecycle calendars, notifications, and the
Phase-2 ML models (yield & price forecasting).

> ⚠️ **Everything in `raw/`, `processed/`, and `ml/` is synthetic seed/development
> data**, generated to match realistic Indian agricultural value ranges and to be
> internally consistent (IDs, dates, geography, units all line up across files). It is
> **not** a copy of Agmarknet, FAOSTAT, IMD, or any other real dataset. Use it to build
> and test the platform; replace each table with the real source in §11 before
> production launch. `reference/` tables (districts, coordinates, agro-climatic zones,
> crop agronomic ranges) are built from general public-domain knowledge and should be
> validated against the cited authoritative sources.

---

## 1. Package Contents

```
project_data/
├── reference/     # static / slow-changing master data
├── raw/           # per-source, mostly-unprocessed data (as ingested)
├── processed/     # cleaned / aggregated / model-ready outputs
├── ml/            # AI/ML training, validation, and test sets
├── schemas/       # database_schema.sql + data_dictionary.md
└── README.md      # this file
```

| File | Rows | Category |
|---|---:|---|
| reference/01_states_districts.csv | 28 | Reference · Geospatial |
| reference/02_climate_regions.csv | 28 | Reference · Geospatial |
| reference/03_crops_master.csv | 25 | Reference · **Core/Essential** |
| reference/04_crop_lifecycle_calendar.csv | 125 | Reference |
| raw/01_farmers.csv | 60 | Core/Essential |
| raw/02_farms.csv + 03_farms.geojson | 71 | Core/Essential · Geospatial |
| raw/04_land_sections.csv | 111 | Core/Essential |
| raw/05_weather_climate_daily.csv | 2,520 | **Real-time/live** · Accuracy-critical |
| raw/06_mandi_prices.csv | 3,200 | **Real-time/live** · Accuracy-critical |
| raw/07_msp_data.csv | 68 | Core/Essential |
| raw/08_trade_data.csv | 200 | External/contextual |
| raw/09_soil_health.csv | 71 | Accuracy-critical |
| raw/10_notifications.csv | 200 | Derived/operational |
| processed/01_mandi_prices_clean.csv | 3,072 | Historical (cleaned) |
| processed/02_weather_features_seasonal.csv | 28 | Model-ready feature set |
| processed/03_crop_scores.csv | 125 | Recommendation output |
| processed/04_farm_plans.csv | 25 | Application output |
| ml/01–04 (yield full/train/val/test) | 7,000 / 4,900 / 1,400 / 700 | AI/ML training |
| ml/05–08 (price full/train/val/test) | 19,500 / 9,900 / 3,600 / 6,000 | AI/ML training |

---

## 2. Dataset Categorization

**Core/Essential (system cannot function without these):** crops_master, farmers,
farms, land_sections, weather_climate_daily, mandi_prices, msp_data.

**Accuracy-critical (needed for *good*, not just working, recommendations):**
soil_health, weather_features_seasonal, mandi_prices_clean, crop_lifecycle_calendar.

**AI/ML training / validation / testing:** ml/01–08 (yield + price), split
time-based as documented in `schemas/data_dictionary.md`.

**Real-time/live:** weather_climate_daily (daily), mandi_prices (daily in
production), notifications (event-driven).

**Historical:** ml/01_yield_training_data_full (2015–2024), ml/05_price_forecast
(2021–2026), msp_data (2023–2026), trade_data (2021–2025).

**Reference/master:** states_districts, climate_regions, crops_master,
crop_lifecycle_calendar.

**Geospatial:** states_districts, climate_regions, farms/farms.geojson.

**External/contextual:** trade_data (FAOSTAT/UN Comtrade demand signal).

**Optional/enrichment (not built here — see §12 Future Roadmap in the project
brief):** satellite NDVI imagery, IoT soil-sensor streams, pest-image datasets,
crop-insurance/loan product data.

**MVP minimum vs. world-class production:**
- **MVP** = crops_master + farms + land_sections + weather_climate_daily +
  mandi_prices + msp_data + crop_lifecycle_calendar. Enough to run the Phase-1
  rule-based scoring engine end-to-end.
- **World-class production** additionally needs: soil_health at scale, multi-year
  yield/price history across *all* districts (not a 10-state sample), trade_data
  refreshed monthly, and the ML tables at 10–50× this sample's size (see §7).

---

## 3. Entity Relationship Diagram (description)

```
farmers 1───* farms 1───* land_sections *───1 crops_master 1───* crop_lifecycle_calendar
   │             │                                  │
   │             ├──1 soil_health                   ├──* mandi_prices ──> mandi_prices_clean
   │             │                                  ├──* msp_data
   │             └──* farm_plans (crop_allocation_json → land_sections + crops_master)
   │             └──* crop_scores (farm_id, crop_id)
   └──* notifications (farm_id, farmer_id)

districts 1───1 climate_regions 1───* weather_climate_daily ──> weather_features_seasonal
                                              │
crops_master ──* trade_data (via fao_item_code)
crops_master ──* ml_yield_training_data (via crop_id, region_id)
crops_master ──* ml_price_forecast_data (via crop_id)
```

**Key connective tissue across files:**
- `crop_id` (format `CROPnnn`) is the single join key threading crops_master,
  crop_lifecycle_calendar, mandi_prices, msp_data, trade_data, crop_scores,
  farm_plans, and both ML tables.
- `farm_id` / `farmer_id` thread farmers → farms → land_sections → soil_health →
  crop_scores → farm_plans → notifications.
- `district_id` → `region_id` (1:1 in this sample; `REGnnn` = `DISTnnn` with the
  prefix swapped) threads geography → climate_regions → weather data → the ML
  yield table.
- All dates are ISO-8601 (`YYYY-MM-DD`); all money is INR unless a table says
  `_usd`; all coordinates are WGS84 decimal degrees.

Full column-by-column definitions: **`schemas/data_dictionary.md`**.
Full DDL with actual FK constraints: **`schemas/database_schema.sql`**.

---

## 4. Recommended Database Architecture

**PostgreSQL 14+ with the PostGIS extension** — chosen because:
- Farm boundaries are genuinely geospatial (polygons/points) and need `ST_Area`,
  `ST_Contains`, `ST_DWithin` style queries (e.g. "which weather grid cell contains
  this farm centroid") — PostGIS is the natural fit, not MongoDB or a plain
  relational store.
- The data is highly relational (farmers→farms→sections→crops→prices) with real
  foreign-key integrity requirements — a documented weakness of MongoDB for this
  shape of data.
- Volumes at MVP/production scale (low millions of price/weather rows per year)
  are comfortably within PostgreSQL's range; **Snowflake/BigQuery/Databricks are
  overkill** until the platform is ingesting satellite/IoT streams at national
  scale (Phase 4).
- **Redis** (already in the brief's stack) should front the read-hot tables —
  latest mandi price per crop, latest weather forecast per region — as a cache
  layer in front of Postgres, not as a source of truth.
- **Recommended partitioning:** RANGE-partition `weather_climate_daily` and
  `mandi_prices` by month, and `ml_yield_training_data` / `ml_price_forecast_data`
  by year — all are append-mostly, time-ordered, and queried by recent range far
  more often than full-table scans.
- **Object storage** (S3/GCS) for the *raw* CSV/GeoJSON drops before they're
  loaded into Postgres, and for ML model artifacts — not for the operational
  tables themselves.

---

## 5. Data Pipeline

```
Data Sources (IMD/Open-Meteo, Agmarknet/e-NAM, data.gov.in, FAOSTAT, Google Maps,
              farmer app input, Soil Health Card)
    ↓
Data Collection      — scheduled pullers per source (cron/Airflow), farmer-app writes
    ↓
Raw                  — raw/*.csv, raw/*.geojson — stored as-ingested, source + timestamp kept
    ↓
Validation           — schema check, required-field check, range check, FK check
    ↓
Cleaning             — dedupe, outlier removal (z-score on prices), unit normalization
    ↓
Normalization        — currency→INR, units→per-quintal / per-hectare, geo→WGS84
    ↓
Transformation        — join district↔region↔farm, resample weather to 90-day window
    ↓
Feature Engineering    — weather_features_seasonal, price lags, trade-demand index
    ↓
Master/Unified Dataset  — processed/* tables (Data Integration Layer output)
    ↓
AI/ML Models             — ml/* train/validation/test → yield & price models (Phase 2),
                             portfolio optimizer (Phase 3)
    ↓
Predictions / Analytics   — processed/03_crop_scores.csv (per farm×crop recommendation)
    ↓
Application                — processed/04_farm_plans.csv, notifications → farmer app
```

**Stage → dataset mapping:**
| Stage | Datasets |
|---|---|
| Raw | everything in `raw/` |
| Cleaned | `processed/01_mandi_prices_clean.csv` |
| Feature-engineered | `processed/02_weather_features_seasonal.csv`, ML lag/feature columns in `ml/05_price_forecast_dataset_full.csv` |
| Model-ready | all of `ml/` |
| Output/generated | `processed/03_crop_scores.csv`, `processed/04_farm_plans.csv`, `raw/10_notifications.csv` |

---

## 6. Loading the Data Package

```bash
# 1) Create schema
psql "$DATABASE_URL" -f schemas/database_schema.sql

# 2) Load reference tables first (FK dependencies), then raw, then processed, then ml
psql "$DATABASE_URL" -c "\copy districts FROM 'reference/01_states_districts.csv' CSV HEADER"
psql "$DATABASE_URL" -c "\copy climate_regions FROM 'reference/02_climate_regions.csv' CSV HEADER"
psql "$DATABASE_URL" -c "\copy crops_master FROM 'reference/03_crops_master.csv' CSV HEADER"
psql "$DATABASE_URL" -c "\copy crop_lifecycle_calendar FROM 'reference/04_crop_lifecycle_calendar.csv' CSV HEADER"
psql "$DATABASE_URL" -c "\copy farmers FROM 'raw/01_farmers.csv' CSV HEADER"
psql "$DATABASE_URL" -c "\copy farms(farm_id,farmer_id,district_id,state,district,latitude,longitude,area_hectares,boundary_type,soil_type,water_source,irrigation_type,registration_date) FROM 'raw/02_farms.csv' CSV HEADER"
# ... continue for land_sections, soil_health, weather_climate_daily, mandi_prices,
#     msp_data, trade_data, notifications, then the processed/ and ml/ tables.
# farms.geojson boundary polygons: load separately via ogr2ogr or a small script using
# ST_GeomFromGeoJSON, matched back to farms.farm_id.
```

`ogr2ogr` example for the GeoJSON boundaries:
```bash
ogr2ogr -f PostgreSQL PG:"$DATABASE_URL" raw/03_farms.geojson \
  -nln farms_boundaries -append
# then: UPDATE farms f SET boundary_geom = b.wkb_geometry
#       FROM farms_boundaries b WHERE b.farm_id = f.farm_id;
```

---

## 7. AI/ML Notes

- **Yield model** (`ml/01–04`): features = weather + soil + irrigation + area;
  label = `actual_yield_kg_per_ha`. Time-based split (train ≤2021, val 2022–23,
  test 2024) prevents the model from ever "seeing the future" during training —
  the same constraint it will face in production.
- **Price forecast model** (`ml/05–08`): features = 3 lagged prices + rainfall
  anomaly + trade-demand index; label = next period's price. Same time-based
  split logic (train ≤2023, val 2024, test ≥2025).
- **Minimum viable size:** ~5k rows per model for a gradient-boosted-tree
  baseline (this package meets that for both). **Ideal production size:** 50k+
  rows per model once real multi-year, all-district government yield/price
  series replace this sample.
- **Class balance:** N/A — both are regression tasks, not classification.
- **Leakage risks to guard against in production:** (1) using same-season
  weather to predict that season's price before the season closes; (2) using a
  crop's *current* MSP announcement date if it falls after the prediction date;
  (3) region/crop combinations present in test but never in train (cold-start —
  handle with a fallback to crop-level or state-level priors, not by silently
  dropping rows).
- **Bias risks:** the district sample here (10 states) skews toward major
  grain-belt states; a production model trained only on this shape of data would
  under-serve southern/coastal/hill-state farmers — geographic coverage must be
  expanded before training a model that will serve the whole country.

---

## 8. Data Requirements Matrix

| # | Dataset | Purpose | Key Fields | Source | Format | Historical Period | Frequency | Coverage | MVP | Production | Importance |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | crops_master | Agronomic+cost reference | crop_id, yield, cost, temp/water | ICAR / CACP | CSV | N/A (current) | Annual review | National | ✅ | ✅ | Critical |
| 2 | farmers | User accounts | farmer_id, district | App signup | CSV | N/A | Real-time | National | ✅ | ✅ | Critical |
| 3 | farms | Farm boundary/location | farm_id, geom, area | Google Maps API | CSV+GeoJSON | N/A | Real-time | National | ✅ | ✅ | Critical |
| 4 | land_sections | Multi-crop land split | section_id, area | App | CSV | N/A | Seasonal | National | ✅ | ✅ | High |
| 5 | weather_climate_daily | 90-day forecast scoring | region_id, date, temp, rain | Open-Meteo/IMD | CSV | Rolling 90d | Daily | National grid | ✅ | ✅ | Critical |
| 6 | mandi_prices | Market price scoring | crop_id, date, modal_price | Agmarknet/e-NAM | CSV | 3+ yrs | Daily | Per-mandi | ✅ | ✅ | Critical |
| 7 | msp_data | Price-floor safety scoring | crop_id, year, msp | data.gov.in | CSV | 3+ yrs | 1–2×/yr | National | ✅ | ✅ | Critical |
| 8 | trade_data | Export demand signal | crop_id, country, year | FAOSTAT/Comtrade | CSV | 5 yrs | Annual | Top partners | ⬜ | ✅ | Medium |
| 9 | soil_health | Soil-fit scoring | farm_id, N/P/K, pH | Soil Health Card | CSV | Per test cycle | 2–3 yrs | Per farm | ⬜ | ✅ | High |
| 10 | crop_lifecycle_calendar | In-app crop calendar | crop_id, stage, day | ICAR extension | CSV | N/A | Annual review | National | ✅ | ✅ | High |
| 11 | mandi_prices_clean | Cleaned pricing input | crop_id, year_month | Derived | CSV | Rolling | Daily→monthly agg | National | ⬜ | ✅ | High |
| 12 | weather_features_seasonal | Scoring engine input | region_id, features | Derived | CSV | Rolling 90d | Daily | National grid | ✅ | ✅ | Critical |
| 13 | crop_scores | Recommendation output | farm_id, crop_id, score | Derived (model) | CSV | N/A | On-demand | Per farm | ✅ | ✅ | Critical |
| 14 | farm_plans | Accepted plan output | plan_id, allocation | Derived | CSV | N/A | On-demand | Per farm | ✅ | ✅ | Critical |
| 15 | ml_yield_training_data | Yield model training | features, label | Derived + historical stats | CSV | 10 yrs | Annual | Sample districts | ⬜ | ✅ | High (Phase 2) |
| 16 | ml_price_forecast_data | Price model training | features, label | Derived | CSV | 6 yrs | Monthly | Sample states | ⬜ | ✅ | High (Phase 2) |
| 17 | notifications | Farmer alerts | farmer_id, type, message | Derived (rules engine) | CSV | N/A | Real-time | Per farmer | ⬜ | ✅ | Medium |

---

## 9. Data Acquisition Plan (per real-world source)

| Source | Reliability | Coverage | Update freq. | Cost | API? | Licensing | Limitation | Fit |
|---|---|---|---|---|---|---|---|---|
| Google Maps Platform | High | Global | N/A (live draw) | Paid, free tier | Yes | Commercial ToS | Cost scales with usage | Farm mapping — required |
| Open-Meteo | High | Global grid | Hourly/daily | Free | Yes, no key | Open (CC-style) | Forecast accuracy drops >7–10 days | Primary weather source |
| NASA POWER | High | Global grid | Daily (lag ~1-2 days) | Free | Yes | Public domain | Coarser resolution | Weather fallback/validation |
| IMD | High (official) | India | Daily | Free/public | Limited API | Government | Bulk API access can be restrictive | Authoritative validation |
| Agmarknet | Official | India, mandi-level | Daily | Free | Scrape/portal | Government open data | No formal REST API; needs a scraper/ETL job | Primary price source |
| e-NAM | Official | India, e-NAM mandis only | Daily | Free | Portal | Government | Covers only e-NAM-integrated mandis | Price cross-check |
| data.gov.in (MSP, Soil Health) | Official | National | Periodic | Free | Yes (API keys) | Open Government Data License | Batch, not always real-time | MSP + soil source |
| FAOSTAT | Official (UN) | Global | Annual | Free | Yes | CC BY-NC-SA / FAO terms | Item-code mapping to Indian crop names needs manual curation | Trade demand signal |
| UN Comtrade | Official (UN) | Global | Monthly (lag) | Free tier + paid bulk | Yes | UN data license | Rate limits on free tier | Trade demand signal (finer granularity) |
| ICAR / state agri-universities | High | National/regional | Periodic publications | Free (often PDF, not API) | No | Institutional | Needs manual digitization into crops_master | Crop agronomic reference |

---

## 10. Data Quality & Validation Approach

- **Accuracy:** cross-check MSP/mandi prices against a second source (Agmarknet vs
  e-NAM) before trusting a single-source spike.
- **Completeness:** flag any district/crop/month combination missing from
  `mandi_prices` rather than silently interpolating — surface it as "insufficient
  data, confidence lowered" in the recommendation explanation.
- **Consistency:** enforce the shared `crop_id`/`region_id`/`farm_id` keys via the
  FK constraints in `database_schema.sql`; reject ingestion rows that don't resolve.
- **Uniqueness/duplicate detection:** unique constraint on natural keys, e.g.
  `(region_id, date)` on weather, `(crop_id, year)` on MSP.
- **Outliers:** z-score filter per crop on `mandi_prices` (already applied to
  produce `mandi_prices_clean`), sanity-bound checks (no negative price/area/yield).
- **Timeliness:** weather and prices are the two tables that must never be served
  stale beyond their SLA (24h for prices, 6–12h for weather forecast refresh).
- **Bias:** monitor geographic coverage (state/district representation) and crop
  coverage (major grains vs. minor/local crops) each time the model is retrained;
  this sample intentionally over-represents major grain-belt states and should
  not be used as-is to judge model fairness.
- **Lineage & versioning:** every raw row carries a `source` field; every derived
  table's generation logic lives in this package's generator scripts (available on
  request) so any table can be regenerated and diffed against a prior version.

---

## 11. Explicitly Missing / Needs Clarification

Per the project brief, the following could **not** be determined and are flagged
rather than assumed:

- **Exact pricing/quota terms for the Google Maps Platform tier** the project will
  use at scale — *Needs clarification.*
  I don't have current information on this; the person should check
  https://developers.google.com/maps or Google's current pricing page for what's
  in effect today.
- **Which specific weather API** (Open-Meteo vs. a paid IMD feed vs. a private
  weather vendor) will be the system of record — the brief lists multiple
  candidates without picking one. *Needs clarification.*
- **LLM provider/model for the AI crop assistant** (Phase 3) — brief only says
  "LLM-based," no vendor chosen. *Needs clarification.*
- **FPO/cooperative data model** — the brief mentions FPOs as a secondary user but
  gives no schema for organizations, multi-farmer grouping, or advisor roles.
  *Needs clarification — not modeled in this package.*
- **Actual historical yield/price ground truth** for model training — this
  package's `ml/` tables are synthetic stand-ins; real historical series must be
  sourced from ICAR/ICRISAT district-level yield statistics and Agmarknet's full
  price history before training a model that will be trusted with real farmer
  decisions.
- **Regulatory/licensing terms** for each third-party dataset (FAOSTAT's CC
  BY-NC-SA, Agmarknet's open-data terms, IMD's data policy) — flagged in §9 but
  needs formal legal review before commercial production use, per the project
  brief's own §19 License note.

---

## 12. Phased Implementation Plan

**Phase 1 — Must Have (MVP):** load `reference/*`, `raw/01_farmers.csv` through
`raw/07_msp_data.csv`, and `raw/04_land_sections.csv`. Wire up the Phase-1
rule-based scorer using `processed/02_weather_features_seasonal.csv` and
`processed/01_mandi_prices_clean.csv` as its two main feature inputs, producing
`processed/03_crop_scores.csv`-shaped output. *Why:* this is the smallest dataset
set that lets a farmer mark a farm and get an explainable, ranked crop
recommendation end-to-end.

**Phase 2 — Accuracy:** add `raw/09_soil_health.csv` (soil-fit scoring),
`raw/08_trade_data.csv` (demand-trend signal), and expand `mandi_prices` to daily
granularity across all mandis serving a region, not just 3–4 representative ones.
*Why:* these are the datasets that move the score from "plausible" to "backed by
farm-specific and demand-side evidence." *Where:* Soil Health Card portal,
FAOSTAT/Comtrade, Agmarknet's full daily feed.

**Phase 3 — Production:** stand up the full pipeline in §5 on a schedule
(Airflow/cron), partition `weather_climate_daily` and `mandi_prices` as noted in
§4, add the `ml/` yield and price models trained on **real**, full-country
historical data (not this sample), and connect `processed/04_farm_plans.csv`-shaped
output to real notification delivery (SMS/push). *Why:* this is what turns a
working prototype into something reliable at national scale with daily-fresh data.

**Phase 4 — Advanced:** NDVI satellite layers, IoT soil-sensor streams, pest/
disease image datasets for computer-vision detection, crop-insurance/loan product
data, and a portfolio-optimization (LP/constraint-programming) layer on top of
`land_sections` + `crop_scores` for true multi-crop allocation optimization (the
brief's Phase 3 AI roadmap). *Why:* these require new data modalities (imagery,
sensor streams) not present in this tabular package, and are correctly sequenced
last since they depend on Phases 1–3 being stable first.

---

## 13. Limitations of This Package

- Sample covers **10 states / 28 districts**, not all of India — production needs
  full national coverage.
- Crop economics (yields, costs) are **representative approximations**, not
  official CACP Cost-of-Cultivation figures — validate before using in a farmer-
  facing profit number.
- `mandi_prices` here is monthly-granularity for file-size reasons; production
  Agmarknet/e-NAM data is daily.
- ML datasets are synthetic and demonstrate the correct **shape, split
  methodology, and leakage-avoidance approach** — they are not a substitute for
  training on real historical yield/price series before launch.
