# Data Collection Pipeline

AgriProfit collects user and recommendation data through a controlled backend pipeline.

## Source of truth

- The database is the authoritative store for structured farm, recommendation, and telemetry records.
- CSV output is a derived export used for analytics and dataset-building only.
- Raw frontend objects are never appended directly to CSV files.

## Flow

User Action
↓
Backend API
↓
Validation
↓
Database (authoritative store)
↓
Queued export job (serialized, single-writer)
↓
CSV rebuild from database records

CSV is never the transactional database and is never written directly from concurrent user requests. It is rebuilt from the database in a serialized export step so multi-user ingestion remains safe.

## API contract

POST /api/data-collection

Required fields:
- eventType (recommendation | market | farm | yield | export)
- farmerId

Optional fields:
- farmId
- crop
- state
- district
- season
- quantityQuintals
- sellingChannel
- destination
- payload

## Validation rules

- Only a fixed set of event types is accepted.
- farmerId must be present.
- Unknown or arbitrary frontend payloads are sanitized and reduced to a controlled schema.
- Only approved fields are persisted.

## Export rule

- CSV is created from the database, not from ad hoc in-memory frontend objects.
- The CSV export is a derived analytical artifact, never the system source of truth.
