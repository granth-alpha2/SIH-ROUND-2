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
