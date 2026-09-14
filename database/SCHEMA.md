# AgriProfit MVP Database Schema

## Migration Order

1. `migrations/001_create_farms.sql` enables PostGIS and creates the original farm table.
2. `migrations/002_mvp_schema.sql` adds users, normalized MVP entities, ownership linkage,
   indexes, and update timestamp triggers.

Run migrations in filename order. Each migration is transactional and uses idempotent
creation statements where PostgreSQL supports them.

## Ownership and Compatibility

`farms.owner_id` references `users.id` with `ON DELETE CASCADE`. It is nullable only as
a transition for the current pre-auth farm API. Once authentication is implemented,
new farms must require an owner and every farm query must filter by the authenticated
user. The original `farms.sections` and `farms.preferences` JSONB columns remain for
backward compatibility and should not be used by new domain code; normalized data
belongs in `farm_sections` and `farmer_preferences`. Preferred and excluded crops
are stored in `farmer_preference_crops` so each relationship has a foreign key.

## Entity Relationships

```text
users 1---N farms 1---N farm_sections N---1 crops
users 1---1 farmer_preferences 1---N farmer_preference_crops N---1 crops
crops 1---N crop_parameters
crops 1---N market_prices
crops 1---N msp_records
farms 1---N recommendations 1---N crop_allocations N---1 crops
recommendations 1---1 farm_plans
users 1---N notifications
users 1---N assistant_conversations 1---N assistant_messages
farms 1---N profitability_analyses 1---N profitability_scenarios 1---N profitability_results
profitability_scenarios 1---N profitability_costs
profitability_scenarios 1---N profitability_sensitivity
profitability_analyses 1---N actual_outcomes
model_registry 1---N model_predictions
users 1---N dataset_exports
users 1---N data_collection_events
audit_events records profitability, model, data, outcome, and export actions
```

## Profitability and Model Audit Layer

Migration `006_profitability_and_model_audit.sql` adds only entities that were
not already present. Profitability analyses reuse `farms`, `users`, and `crops`;
market, MSP, weather, and forecast inputs are retained as source snapshots so a
historical result remains reproducible without duplicating provider tables.


CSV exports use stable pseudonymous `farmer_ref` and `farm_ref` values rather than
raw identity identifiers. Export payloads remove phone numbers, authentication
tokens, credentials, OTPs, biometric fields, and government-ID fields. Private
identity and contact fields remain restricted to the authenticated owner or an
authorized administrator and are not included in aggregate dataset exports.
The migration adds `profitability_analyses`, `profitability_scenarios`,
`profitability_costs`, `profitability_results`, `profitability_sensitivity`,
`model_registry`, `model_predictions`, `actual_outcomes`, `dataset_exports`,
and the normalized `data_collection_events` contract used by the collection API.
There is no new `transactions` or generic `forecast` table because those entities
are not present in the current schema; `transaction_id` remains an optional
external reference on `actual_outcomes`, and existing weather/ML forecast tables
remain the forecast sources.

The append-only `audit_events` table records `event`, `actor`, `occurred_at`,
`analysis_id`, `model_version`, `data_source`, and non-sensitive metadata for
`PROFITABILITY_ANALYSIS_CREATED`, `MODEL_PREDICTION_USED`,
`MARKET_DATA_USED`, `SCENARIO_CALCULATED`, `PROFITABILITY_RESULT_GENERATED`,
`ACTUAL_OUTCOME_RECORDED`, and `DATASET_EXPORT_CREATED`. Secrets, tokens,
credentials, authorization headers, and raw request secrets must never be placed
in `metadata`.

## Data Provenance

Provider-backed tables use `source_type` values such as `official`, `cached`,
`estimated`, or `demo`. Every row must also carry `data_origin`, which is one of
`LIVE` or `DEMO`. Application responses should expose both values and the relevant
fetch/effective timestamp. Demo or estimated values must not be presented as live
data. Training pipelines should filter with `WHERE data_origin = 'LIVE'` and exclude
all `DEMO` records by default.

## Geospatial Storage

`farms.boundary` remains `GEOGRAPHY(POLYGON, 4326)` from migration 001, with its
existing GiST index. The database is the source of truth for geometry validity and
server-side area calculations. Latitude and longitude columns in weather tables are
validated independently because those records represent provider observations at a
point rather than farm boundaries.

## Constraints and Indexes

- UUID primary keys are generated with `pgcrypto` for new entities.
- Foreign keys use cascade, restrict, or set-null behavior according to ownership and
  historical-record requirements.
- Monetary, area, percentage, coordinate, humidity, rainfall, and score values have
  range checks.
- Crop parameters are unique per crop and season.
- Market and weather records are indexed by crop/location and time.
- Notifications are indexed for unread-feed queries.
- All mutable entities have `created_at` and `updated_at`; update triggers maintain
  `updated_at`.

## Deliberate Scope

The schema does not add payments, produce sales, logistics, satellite data, IoT, or
ML model artifacts. Those are outside the MVP entities requested here.