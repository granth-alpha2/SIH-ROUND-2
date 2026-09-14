# Controlled ML Retraining Pipeline

AgriProfit collects real farm data into the database, but it does not automatically retrain production models on every farmer submission.

## Safe architecture

REAL FARM DATA
↓
VALIDATION
↓
DATABASE
↓
DATASET EXPORT
↓
DATA QUALITY CHECK
↓
TRAINING DATASET
↓
MODEL TRAINING
↓
MODEL EVALUATION
↓
MODEL VERSION
↓
MODEL REGISTRY
↓
DEPLOYMENT
↓
INFERENCE

## Guardrails

- Only rows with `data_origin = 'LIVE'` are eligible for the training pipeline.
- `DEMO` rows are excluded by default.
- New records are persisted to the database first.
- CSV export is derived from the database, not the other way around.
- Data quality checks run before training begins.
- Model retraining is triggered only by a manual approval or a scheduled batch job.
- Production models are not retrained on every farmer submission.

## Operational flow

1. Real farm submissions are validated and written to the database.
2. A controlled export job rebuilds a versioned dataset from database records.
3. Data quality checks validate schema, ranges, nulls, duplicates, and provenance.
4. A training dataset is built from verified live rows only.
5. A training run creates a new candidate model version.
6. Model evaluation checks performance and regressions before promotion.
7. Approved models are registered with a version and metadata.
8. Deployment only occurs after registry update and operational approval.
9. Inference continues using the deployed model version until the next approved release.

## Provenance and transparency contract

Every prediction carries its model version and model type. Yield and price
predictions are never overwritten by actual observations. Actual outcomes are
recorded separately after a completed marketplace transaction so error analysis
can compare prediction versus reality.

The model registry records model name/key, version, purpose, artifact/source
metadata, evaluation metrics, and active status. Admin telemetry exposes only
aggregate counts, model health, versions, valid metrics, dataset freshness, and
last export time; it does not expose farmer-level private data.

CSV exports are generated from persisted records, use pseudonymous farmer/farm
references, and remove phone numbers, credentials, tokens, OTPs, biometric data,
and government identifiers. `LIVE` and `DEMO` records remain distinguishable.

## Demo limitation

The SIH demo uses synthetic, benchmark, and indicative market/export values in
some flows. These values demonstrate the calculation and governance path only;
they are not guaranteed procurement prices, buyer commitments, live international
quotes, or evidence that a model improves merely because records accumulated.
