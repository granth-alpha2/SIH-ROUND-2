# AgriProfit Implementation Order and Status

This document records the required implementation order for the profitability and marketplace work. Existing domain entities and services are reused wherever possible.

| Phase | Deliverable | Status | Primary implementation |
|---:|---|---|---|
| 1 | Repository and ML audit | Complete | `database/SCHEMA.md`, ML service tests, model artifacts |
| 2 | Existing ML models and pipelines identified | Complete | `frontend/src/lib/ml-client.ts`, `ml-service/app/models/`, `docs/DATA_AND_ML.md` |
| 3 | Reusable APIs identified | Complete | Existing `/api/markets`, `/api/weather`, `/api/farms`, `/api/recommendations` routes |
| 4 | Profitability data model | Complete | `database/migrations/006_profitability_and_model_audit.sql` |
| 5 | Cost engine | Complete | `frontend/src/lib/profitability-service.ts`, `simulation-engine.ts` |
| 6 | Break-even engine | Complete | Profitability service and simulation engine break-even calculations |
| 7 | Existing yield model integration | Complete | FastAPI `/predict/yield`, typed ML client, model tests |
| 8 | Existing price forecast integration | Complete | FastAPI `/predict/price`, typed ML client, model tests |
| 9 | Market/MSP/mandi integration | Complete | `market-service.ts`, markets page, provenance/freshness handling |
| 10 | Scenario engine | Complete | MSP, direct market, group selling, and export comparison |
| 11 | Group economics | Complete | `simulateGroupSellingComparison`, second group demo |
| 12 | Export economics | Complete | `simulateExportScenario`, UAE onion export demo |
| 13 | Sensitivity analysis | Complete | Price, yield, and cost sensitivity builders |
| 14 | Model metadata/transparency | Complete | ML metadata routes, provenance labels, model registry documentation |
| 15 | Data collection pipeline | Complete | `data-collection.ts`, data collection API, validation and provenance |
| 16 | Safe CSV export/storage | Complete | Pseudonymous CSV references, sensitive-field removal, admin-only export |
| 17 | Profitability dashboard | Complete | `RecommendationDashboard.tsx`, break-even graph, what-if simulator |
| 18 | Marketplace integration | Complete | Market listing profitability dialog and recommendations handoff |
| 19 | Completed transaction to actual outcome | Complete | Protected profitability outcome route and `actual_outcomes` persistence |
| 20 | Admin ML/data telemetry | Complete | Admin model, prediction, observation, freshness, export, and health panels |
| 21 | Testing | Complete | Profitability, ML-client, Python ML, auth, market, weather, and integration suites |
| 22 | UI polish | Complete | Existing AgriProfit cards, dialogs, responsive layouts, accessibility labels |
| 23 | End-to-end verification | Complete with environment caveats | Contract suites pass; PostgreSQL-dependent admin counters require configured DB |

## Verification commands

```bash
npx --prefix frontend tsx tests/integration/test_profitability_contracts.ts
npx --prefix frontend tsx tests/integration/test_ml_client.ts
python -m pytest ml-service/tests/
```

The application distinguishes ML model output, rule-based scoring, deterministic
financial calculations, and external/API data. Collection does not automatically
retrain models. Controlled retraining requires data validation, LIVE/DEMO filtering,
time-based evaluation, registry approval, and versioned deployment.

## Known environment caveat

The admin telemetry regression requires database-backed farmer/farm records and
healthy monitored endpoints. Without PostgreSQL and the expected services, those
counters report unavailable/zero values rather than fabricated telemetry.
