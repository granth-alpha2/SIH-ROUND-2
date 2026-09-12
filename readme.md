# AgriProfit — AI-Powered Smart Crop & Farm Profit Optimization Platform

> A production-grade decision-support platform that helps Indian farmers decide **what to grow, where to grow it, when to grow it, and how to manage it** by combining spatial PostGIS land mapping, live Open-Meteo agro-meteorology, APMC mandi market trends, Government MSP floor benchmarks, deterministic multi-factor recommendation scoring, interactive profit simulations, Python FastAPI ML yield & price models, and a context-aware multimodal AI agronomist.

---

## 1. Vision & Mission

Most Indian farmers plan their crop cycles using incomplete, delayed, or informal information — last season's price, a neighbor's choice, or a trader's advice. This leads to severe price crashes from over-planting popular crops, missed high-value alternatives, and avoidable financial vulnerability.

**AgriProfit's vision** is to give every farmer, on their own land, an AI-generated, explainable, and risk-aware farm plan that maximizes **expected profit, return on investment (ROI), and financial stability** — not just raw yield or a single unhedged metric.

---

## 2. Problem Statement

Farmers currently lack a single unified platform that combines:

- **Farm-specific spatial boundaries and land area** (pinpoint GPS & polygon mapping).
- **Localized agro-meteorological forecasting** (temperature, rainfall, soil moisture, and 90-day climate baselines).
- **Real-time APMC mandi market price trends and volatility**.
- **Government Minimum Support Price (MSP) floor protection**.
- **International trade signals and macroeconomic export demand** (FAOSTAT/UN Comtrade).
- **Realistic, itemized input cost estimates** (seeds, fertilizers, irrigation, labor, machinery).
- **Multi-dimensional risk scoring** (climate risks, pest/disease susceptibility, market price crashes, procurement safety).

As a result, crop selection today remains intuition-driven rather than data-driven, exposing farming households to extreme financial volatility.

---

## 3. The AgriProfit Solution

AgriProfit provides an intuitive, mobile-first 8-step decision system:

1. **Spatial Farm Marking:** Pinpoint farm location or draw precise multi-hectare land polygons on interactive Google Maps with real-time geodesic area calculation.
2. **Land Sectioning:** Split land into distinct zones for multi-crop risk diversification.
3. **Preference Calibration:** Configure risk appetite, irrigation access (borewell, canal, drip, rainfed), investment budgets, and crops to avoid.
4. **AI-Optimized Multi-Crop Allocation:** Generate a 4-part portfolio (Primary High-Profit, Low-Risk Hedged, Fast-Cash Crop, and Climate-Resilient) complete with profit rankings, weather suitability, and risk metrics.
5. **Interactive Financial Simulation:** Full financial breakdown displaying expected revenue, costs, net profit, ROI percentage, and break-even yield.
6. **Milestone Lifecycle Calendar:** Stage-by-stage crop management roadmap from land preparation to harvest.
7. **Advisory Notification Inbox:** Timely automated alerts for irrigation intervals, pest outbreaks, weather anomalies, and market price spikes.
8. **Context-Aware Multimodal AI Agronomist:** Chat with a dedicated agronomist assistant capable of diagnosing plant diseases from uploaded leaf photos and answering location-specific farming questions.

---

## 4. Target Users

- **Primary:** Smallholder and commercial farmers (via responsive mobile-first web app).
- **Secondary:** Farmer Producer Organizations (FPOs), agricultural extension officers, and cooperative societies managing clusters of farms.
- **Tertiary:** State agricultural departments and credit institutions (aggregated regional analytics and crop planning telemetry).

---

## 5. Core Features Matrix

| Feature | Description | Technical Implementation |
|---|---|---|
| **Spatial Farm Mapping** | Pin & polygon drawing, GPS geolocation, geodesic area | Google Maps JavaScript API, PostGIS `ST_GeomFromGeoJSON` |
| **Agro-Meteorology** | 7-day live weather forecast + 90-day seasonal climate norms | Open-Meteo API, IMD regional baselines |
| **Mandi Price Intelligence** | Daily APMC mandi rates, historical volatility, price trends | Agmarknet time-series ingestion, ML price models |
| **MSP Floor Protection** | Procurement status, CACP benchmarks, fallback pricing | Official data.gov.in / DA&FW datasets |
| **Trade Demand Signals** | Global import/export volume trends and international demand | FAOSTAT / UN Comtrade benchmark scoring |
| **Portfolio Optimizer** | Multi-crop land allocation engine maximizing net return | Deterministic multi-factor scoring & constraint solver |
| **Profit & ROI Simulator** | Interactive cost-benefit calculator per acre and per farm | Real-time mathematical simulation engine |
| **Crop Lifecycle Calendar** | Stage-by-stage agronomic milestone timeline | Curated ICAR lifecycle calendar database |
| **Advisory Notifications** | Irrigation, weather, disease risk, and market alerts | 5-category smart notification dispatch repository |
| **AI Vision Agronomist** | Multimodal crop diagnostics & contextual agronomy chat | Next.js API route + OpenRouter / Gemini / OpenAI LLM APIs |
| **Admin & Telemetry Center** | Data quality health, system metrics, and audit logs | Protected admin dashboard with real-time telemetry |

---

## 6. End-to-End Farmer Workflow

```text
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  1. Login & Auth       │ ──►  │  2. Map Farm Boundary  │ ──►  │  3. Set Preferences    │
│  (OTP / SIH Demo)      │      │  (Google Maps/GPS)     │      │  (Water, Risk, Budget) │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                                                                             │
                                                                             ▼
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  6. Lifecycle Timeline │ ◄──  │  5. Accept / Edit Plan │ ◄──  │  4. AI Recommendation  │
│  (Stage-by-Stage Plan) │      │  (Simulation & ROI)    │      │  (4-Part Portfolio)    │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
            │
            ▼
┌────────────────────────┐      ┌────────────────────────┐
│  7. Smart Alerts       │ ──►  │  8. AI Agronomist Chat │
│  (Weather, Pest, Mandi)│      │  (Multimodal Diagnosis)│
└────────────────────────┘      └────────────────────────┘
```

---

## 7. Monorepo Project Structure

```text
AgriProfit/
├── frontend/                         # Next.js 16 + React 19 + TypeScript Application
│   ├── src/
│   │   ├── app/                      # App Router routes (33 endpoints & pages)
│   │   │   ├── (auth)/login/         # OTP authentication & One-Click Demo
│   │   │   ├── farms/                # Spatial farm mapping & land management
│   │   │   ├── recommendations/      # Portfolio optimizer & profit simulations
│   │   │   ├── weather/              # Agro-meteorology & climate telemetry
│   │   │   ├── markets/              # APMC mandi pricing & MSP safety watch
│   │   │   ├── crops/                # Curated crop catalog & agronomic metrics
│   │   │   ├── assistant/            # AI agronomist & plant pathology vision
│   │   │   ├── notifications/        # 5-category advisory alerts inbox
│   │   │   ├── preferences/          # Water, soil, and risk configuration
│   │   │   └── admin/                # Platform monitoring & telemetry
│   │   ├── components/               # AppShell, FarmMapPicker, RecommendationDashboard
│   │   └── lib/                      # Auth, crop-data, market, simulation engines
│   └── package.json                  # Frontend dependencies
│
├── ml-service/                       # Python 3.11+ / FastAPI ML Microservice
│   ├── app/                          # FastAPI app (routes, models, pipelines, schemas)
│   │   ├── api/routes/               # REST endpoints (/predict/yield, /forecast/price)
│   │   ├── models/                   # Yield (RF) & Mandi Price (Ridge+GBR) models
│   │   └── utils/                    # Config, paths, and pickle artifact loaders
│   ├── models_artifacts/             # Serialized model weights & evaluation reports
│   ├── tests/                        # Pytest unit tests for ML models
│   ├── requirements.txt              # Python dependencies
│   └── Dockerfile                    # Container definition
│
├── data/                             # Curated Agricultural Datasets
│   ├── raw/                          # Raw ICAR, Agmarknet, and IMD datasets
│   ├── processed/                    # Feature-engineered training & validation splits
│   ├── reference/                    # States, districts, and crop master records
│   └── external/                     # CACP MSP and international trade benchmarks
│
├── database/                         # PostgreSQL + PostGIS Storage Layer
│   ├── init.sql                      # Database schema and spatial table initialization
│   └── seeds/                        # Seed data (crops, mandis, MSP benchmarks)
│
├── packages/                         # Shared Monorepo Packages
│   ├── shared/                       # Shared TypeScript definitions and types
│   ├── ui/                           # Reusable UI component library
│   └── api-client/                   # Typed API client for frontend/services
│
├── scripts/                          # Automation & Testing Tools
│   ├── dev_runner.js                 # Unified single-command launcher (FastAPI + Next.js)
│   └── test_*.ts / test_*.py         # Automated API, ML, and integration verification
│
├── docs/                             # Architecture & SRS Documentation
│   ├── ARCHITECTURE.md               # Detailed architectural design
│   ├── API.md                        # Complete REST API reference
│   ├── DATA_AND_ML.md                # Data dictionary & model training benchmarks
│   ├── DATABASE.md                   # Relational & spatial schema documentation
│   └── DEPLOYMENT.md                 # Docker Compose & production deployment guide
│
├── .github/workflows/                # GitHub Actions CI/CD (Typecheck, tests, ML validation)
├── docker-compose.yml                # Multi-service local dev compose stack
├── docker-compose.prod.yml           # Production container orchestration
└── nginx.conf                        # Root reverse proxy configuration
```

---

## 8. AI / Machine Learning Architecture

AgriProfit uses a layered, explainable AI architecture combining deterministic agronomic models with machine learning models and multimodal LLMs:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           AgriProfit AI Layer                           │
├──────────────────────────────────┬──────────────────────────────────────┤
│ 1. Deterministic Scoring Engine  │ 4-Factor Weighted Algorithm (0–100)  │
│    (Weather, Market, MSP, Cost)  │ Explainable, transparent scoring    │
├──────────────────────────────────┼──────────────────────────────────────┤
│ 2. Crop Yield Predictor          │ RandomForestRegressor (v2.0)         │
│    (Trained on 7,000 ICAR rows)  │ Test R²: 0.9601 | MAE: 683 kg/ha     │
├──────────────────────────────────┼──────────────────────────────────────┤
│ 3. Mandi Price Forecaster        │ Ensemble Ridge + GradientBoosting    │
│    (19,500 APMC time-series)     │ Test R²: 0.9733 | MAPE: 3.79%        │
├──────────────────────────────────┼──────────────────────────────────────┤
│ 4. AI Agronomist & Leaf Vision   │ Context-Aware Multimodal LLM Client  │
│    (Farm Telemetry + Vision)     │ OpenRouter / Gemini / OpenAI         │
└──────────────────────────────────┴──────────────────────────────────────┘
```

---

## 9. Agricultural Data Sources

| Domain | Source | Ingestion Method | Refresh Frequency |
|---|---|---|---|
| **Geospatial & Maps** | Google Maps Platform | Direct API / Geocoding | Real-time |
| **Agro-Meteorology** | Open-Meteo & IMD | REST API / Historical Baselines | Hourly / Seasonal |
| **APMC Mandi Prices** | Agmarknet / e-NAM | Scraped & Processed CSV / API | Daily |
| **Minimum Support Price** | DA&FW / CACP (data.gov.in) | Official Gazette Releases | Seasonal (Kharif/Rabi) |
| **International Trade** | FAOSTAT & UN Comtrade | Processed Historical Indices | Monthly / Annual |
| **Soil & Agronomy** | Soil Health Card & ICAR | Curated Reference Datasets | Static / Curated |

---

## 10. Installation & Quick Start

### Prerequisites
- **Node.js:** `v20.x` or `v24.x`
- **Python:** `3.10+` or `3.11+`
- **Package Manager:** `npm`
- **Docker & Docker Compose** (Optional for containerized run)

### 1. Clone & Configure Environment

```bash
git clone https://github.com/granth-alpha2/SIH2026.git
cd SIH2026

# Copy environment template
cp .env.example .env
cp .env.example frontend/.env.local
```

Edit `.env` and `frontend/.env.local` to add your keys:
- `OPENROUTER_API_KEY` (or `GEMINI_API_KEY` / `OPENAI_API_KEY`)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `JWT_SECRET`

---

### 2. Single-Command Launch (FastAPI ML + Next.js)

Run both the Python FastAPI ML microservice (port `8000`) and the Next.js frontend (port `3000`) simultaneously with one unified command:

```bash
npm run dev
```

* **Frontend Application:** **[http://localhost:3000](http://localhost:3000)**
* **FastAPI ML Microservice & Docs:** **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

### 3. Step-by-Step Manual Launch

```bash
# Terminal 1: Python ML Microservice
pip install -r ml-service/requirements.txt
python ml-service/app/main.py

# Terminal 2: Next.js Frontend
npm --prefix frontend install
npm --prefix frontend run dev
```

---

## 11. Environment Variables Reference

| Variable | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client & Server | Google Maps JavaScript API key for spatial farm mapping |
| `OPENROUTER_API_KEY` | Server-side only | LLM API key for AI agronomist chat & image pathology |
| `OPENROUTER_MODEL` | Server-side only | Primary LLM model (e.g. `openai/gpt-4o-mini`, `google/gemini-2.0-flash`) |
| `JWT_SECRET` | Server-side only | HMAC secret key for signing session tokens |
| `SESSION_COOKIE_NAME` | Server-side only | Session cookie name (`agriprofit_session`) |
| `ML_SERVICE_URL` | Server-side only | Python ML microservice URL (default: `http://127.0.0.1:8000`) |
| `TWOFACTOR_API_KEY` | Server-side only | Optional 2Factor SMS gateway API key |
| `FAST2SMS_API_KEY` | Server-side only | Optional Fast2SMS OTP gateway API key |

> [!NOTE]
> All sensitive API keys are kept strictly server-side. No API keys or tokens are ever exposed to the client bundle.

---

## 12. REST API Overview

Core API endpoint groups in the Next.js backend and FastAPI ML service:

| Path | Method | Description |
|---|---|---|
| `/api/auth/send-otp` | `POST` | Dispatches 6-digit OTP to farmer's mobile |
| `/api/auth/verify-otp` | `POST` | Verifies OTP and sets secure HTTP-only JWT cookie |
| `/api/auth/me` | `GET` | Returns authenticated farmer profile |
| `/api/farms` | `GET`, `POST` | List and create spatial farm records with GeoJSON |
| `/api/farms/[id]` | `GET`, `PUT`, `DELETE` | Manage specific farm boundaries and soil properties |
| `/api/preferences` | `GET`, `POST` | Retrieve and update farmer risk/irrigation preferences |
| `/api/recommendations` | `POST` | Generate ranked 4-part portfolio crop recommendation |
| `/api/weather` | `GET` | Fetch live 7-day weather and seasonal agro-climatic norms |
| `/api/markets` | `GET` | Retrieve live APMC mandi prices and historical trends |
| `/api/msp` | `GET` | Official Minimum Support Price benchmarks catalog |
| `/api/crops` | `GET` | Full agricultural crop discovery database |
| `/api/notifications` | `GET` | Advisory alert notification inbox |
| `/api/notifications/mark-read` | `POST` | Marks notifications as read |
| `/api/assistant` | `POST` | Multimodal AI agronomist chat & leaf image diagnosis |
| `/api/admin/metrics` | `GET` | Real-time platform data quality telemetry |
| `http://127.0.0.1:8000/predict/yield` | `POST` | ML Random Forest crop yield prediction |
| `http://127.0.0.1:8000/forecast/price` | `POST` | ML Ensemble mandi price forecasting |

---

## 13. Database Schema & Spatial PostGIS

The platform uses a PostgreSQL schema enhanced with PostGIS for spatial operations:
- `farmers`: User profile, mobile number, verification status, and timestamp records.
- `farms`: Geocoded boundaries (`geometry(Polygon, 4326)`), center points, and total acreage.
- `land_sections`: Subdivided plots within a farm with specific soil and irrigation types.
- `farmer_preferences`: Risk appetite, water access, budget caps, and excluded crops.
- `crops_master`: Curated agronomic database (season, water need, duration, cost/acre).
- `mandi_prices`: APMC time-series price records with min/max/modal prices.
- `msp_records`: Government MSP benchmarks per quintal by marketing season.
- `farm_plans`: Generated multi-crop allocation plans with financial simulation snapshots.
- `notifications`: 5-category smart advisory alerts with priority flags.

---

## 14. Docker Production Deployment

Launch the complete containerized stack (Next.js + FastAPI ML + Nginx + PostgreSQL + Redis):

```bash
# Production deployment
docker compose -f docker-compose.prod.yml up --build -d

# Check running services
docker compose -f docker-compose.prod.yml ps
```

---

## 15. Automated Testing & Verification

Comprehensive automated test suites cover unit, integration, and ML validation:

```bash
# 1. Integration Tests
npx --prefix frontend tsx tests/integration/test_farms.ts
npx --prefix frontend tsx tests/integration/test_portfolio.ts
npx --prefix frontend tsx tests/integration/test_markets.ts
npx --prefix frontend tsx tests/integration/test_weather.ts
npx --prefix frontend tsx tests/integration/test_auth.ts

# 2. ML Model Tests
python ml-service/tests/test_prediction.py

# 3. TypeScript Compilation
npx --prefix frontend tsc --noEmit

# 4. Production Next.js Build
npm --prefix frontend run build
```

---

## 16. Security & Privacy

- **Server-Side Key Isolation:** Third-party credentials (OpenRouter, Google Maps server keys, DB URLs) are stored strictly in environment variables and never bundled in client code.
- **Secure Authentication:** OTP verification paired with HTTP-only, `SameSite=Lax`, signed JWT cookies.
- **Input Validation & Sanitization:** All incoming payloads are validated using strict TypeScript contracts and FastAPI Pydantic models.
- **Git Secret Cleanliness:** Clean commit history with zero hardcoded API keys or sensitive `.env` files tracked in git.

---

## 17. Future Roadmap

- 🛰️ **Satellite Vegetation Monitoring:** High-resolution Sentinel-2 NDVI imagery for real-time field crop vigor tracking.
- 📡 **IoT Soil Probe Telemetry:** Live NPK, moisture, and electrical conductivity ingestion from field sensors.
- 🌾 **Direct e-NAM / FPO Trade Connect:** Seamless digital mandi trading linkages and procurement contracts.
- 🎙️ **Multilingual Voice Interface:** Speech-to-speech vernacular interaction in Hindi, Punjabi, Marathi, Gujarati, and Telugu.
- 🛡️ **Crop Insurance & Micro-Credit Advisor:** Tailored recommendations for PMFBY insurance schemes and Kisan Credit Cards (KCC).

---

## 18. Limitations & Disclaimer

- **Estimates, Not Guarantees:** AgriProfit is a **decision-support tool**, not a financial or agronomic guarantee. Crop yields, mandi prices, weather conditions, and MSP procurement depend on real-world factors beyond software control.
- **Data Freshness:** Government mandi and MSP data rely on official reporting cadences from Agmarknet and data.gov.in.
- **Agronomic Judgment:** Farmers should use AgriProfit's analytical output alongside advice from local Krishi Vigyan Kendras (KVKs), state extension officers, and personal judgment.

---

## 19. License

This project is developed for the **Smart India Hackathon (SIH 2026)**.  
Licensed under the [MIT License](LICENSE).
