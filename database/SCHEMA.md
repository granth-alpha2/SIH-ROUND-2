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
```

## Data Provenance

Provider-backed tables use `source_type` values such as `official`, `cached`,
`estimated`, or `demo`. Application responses should expose this value and the
relevant fetch/effective timestamp. Demo or estimated values must not be presented as
live data.

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