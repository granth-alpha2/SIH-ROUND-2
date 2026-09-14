# Internal Audit Before Profitability Changes

This audit records the existing platform capabilities and the reuse plan for the profitability feature. It is intentionally completed before introducing any additional domain implementation.

| # | Existing capability | Existing implementation | Reuse for profitability |
|---:|---|---|---|
| 1 | Yield model | `ml-service/app/models/yield_model.py`; FastAPI `POST /predict/yield`; `frontend/src/lib/ml-client.ts` | Use predicted yield as an ML input; preserve observed yield separately; do not create another yield model |
| 2 | Price model | `ml-service/app/models/price_model.py`; FastAPI `POST /predict/price`; `frontend/src/lib/ml-client.ts` | Use forecast price as a scenario input with model version and freshness metadata |
| 3 | Crop recommendation model | `frontend/src/lib/recommendation-engine.ts`; `portfolio-optimizer.ts` | Reuse explainable weighted scoring and portfolio context; profitability ranks calculated selling strategies separately |
| 4 | Soil model/data | `frontend/src/lib/crop-data.ts`, soil preferences, `soil_health`/`crop_parameters` tables | Reuse soil fit, pH, NPK, crop suitability, and farm preferences as yield/cost context |
| 5 | Weather integration | `frontend/src/lib/weather-service.ts`; `GET /api/weather`; `weather_observations` and forecast tables | Reuse weather features for yield context, risk, freshness, and model inputs |
| 6 | Profit engine | `frontend/src/lib/profitability-service.ts`, `simulation-engine.ts` | Reuse cost, revenue, break-even, ROI, sensitivity, group, and export calculations |
| 7 | MSP API/data | `frontend/src/lib/market-service.ts`; `GET /api/msp`; `msp_records`/`msp_data` | Use MSP only as an eligible government procurement reference/floor, never as universal market price |
| 8 | Mandi API/data | `frontend/src/lib/market-service.ts`; `GET /api/markets`; `market_prices`/`mandi_prices` | Reuse modal/min/max price, arrivals, trend, volatility, provenance, and freshness |
| 9 | International market infrastructure | `simulation-engine.ts` export scenario; trade data; export metadata/source fields | Reuse international reference, exporter offer, trade period, FX, logistics, and indicative-risk assumptions |
| 10 | Database tables | Existing `users`, `farms`, `crops`, `market_prices`, `msp_records`, weather, recommendations, allocations | Reuse existing entities; add only profitability/model/outcome/audit tables in migrations 006 and 007 |
| 11 | Dataset structure | `data/`, `datasets/`, raw/processed/reference/ML tiers, `data_collection_events` | Reuse provenance, units, source, timestamp, LIVE/DEMO, and validated collection pipeline |
| 12 | ML endpoints | `/health`, `/models/info`, `/predict/yield`, `/predict/price` | Use typed endpoint contracts; reject malformed/failing responses instead of fabricating predictions |
| 13 | Model files | `ml-service/models_artifacts/yield_model.pkl`, `price_model.pkl`, model registry metadata | Reuse registered artifact/version metadata; do not invent a profitability model name |
| 14 | Training pipeline | ML training artifacts, reports, `docs/ML_RETRAINING_PIPELINE.md` | Keep accumulation separate from retraining; require validation, evaluation, approval, and versioned deployment |
| 15 | Frontend dashboard | `/recommendations`, `RecommendationDashboard.tsx` | Extend existing dashboard with profitability, break-even graph, scenarios, what-if, history, and transparency |
| 16 | Marketplace implementation | `/markets`, market cards, profitability dialog, market service | Open the existing profitability flow from each listing; do not create a parallel marketplace UI |
| 17 | Authentication | `frontend/src/lib/auth.ts`, middleware, `request-auth.ts`, JWT session/Bearer support | Require authentication on private APIs and validate farm ownership/RBAC |
| 18 | Notification system | `notification-service.ts`, notifications API/repository, notifications UI | Reuse for future transaction/outcome alerts; do not duplicate notification storage |

## Capability-to-feature map

```text
Farm + soil + weather + yield model
    -> expected production quantity and uncertainty context

Mandi + MSP + price model + provenance
    -> market scenarios, reference/floor distinction, forecast, freshness

Profitability service + simulation engine
    -> cost, break-even, revenue, profit, margin, ROI, sensitivity

Group simulation
    -> pooled quantity, buyer requirement, transport savings, realization

Export simulation + trade infrastructure
    -> international reference, offer, FX, logistics, realization, risk

Authenticated marketplace transaction
    -> actual outcome, prediction-versus-actual feedback, audit event

Data collection + CSV export + model registry
    -> governed dataset accumulation and future controlled retraining

Admin telemetry
    -> aggregate model health, counts, freshness, evaluation, export status
```

## Duplication decisions

Do not add another yield model, price model, crop scoring engine, weather client,
MSP table, mandi table, generic transaction table, notification system, or
marketplace route family. The profitability feature is a composition layer over
existing capability owners plus the minimal persistence entities documented in
`database/migrations/006_profitability_and_model_audit.sql` and
`database/migrations/007_audit_events.sql`.

## Audit boundaries

Some repository data is synthetic or benchmark data. Every UI/API flow must show
source type and freshness/period, keep predicted and actual values separate, avoid
unverified LIVE claims, and avoid exposing farmer-level private data in admin
telemetry or dataset exports.
