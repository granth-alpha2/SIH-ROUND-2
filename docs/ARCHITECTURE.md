# AgriProfit — System Architecture & Design Specification

## 1. Executive Architecture Summary

AgriProfit is an AI-powered agricultural decision-support platform designed for Indian farmers. It bridges real-time agro-meteorology, geospatial field boundary analysis, APMC mandi market trends, and trained machine learning pipelines into an actionable **4-Part Multi-Crop Farm Plan**.

```text
                                 FARMER
                                    │
                                    ▼
                             FARM BOUNDARY MAP
                     (📍 Use My Location / Manual GPS)
                                    │
                                    ▼
                         Spherical Geodesic Engine
                         (Area in m², ha, acres)
                                    │
                                    ▼
                     PostGIS Geography (POLYGON 4326)
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
   Live Open-Meteo Weather     APMC Mandi Prices       Soil & Crop Profiles
   (Rain, Temp, Humidity)     (Modal Price, MSP)      (NPK, pH, Duration)
            │                       │                       │
            └───────────────────────┼───────────────────────┘
                                    │
                                    ▼
                             ML MICROSERVICE
                     (FastAPI + Scikit-Learn v2.0)
                     ├── Random Forest Yield Model
                     └── Ensemble Mandi Price Forecaster
                                    │
                                    ▼
                     4-PART PORTFOLIO STRATEGY
                     ├── Part 1: Safety / MSP Floor (50%)
                     ├── Part 2: Stability Cash Crop (25%)
                     ├── Part 3: Profit Opportunity (15%)
                     └── Part 4: Soil Diversity (10%)
                                    │
                                    ▼
                      FINANCIAL SENSITIVITY SIMULATION
                    (Expected Yield, Cost, Revenue, Net Profit)
                                    │
                                    ▼
                      MULTIMODAL AI AGRONOMIST
                  (Context-Aware Chat + Vision Leaf Diagnosis)
```

---

## 2. Component Topology

### A. Frontend Layer (`frontend/`)
* **Framework:** Next.js 16 (React 19, TypeScript, Tailwind CSS).
* **Core Modules:**
  * Geospatial Boundary Tool (`FarmMapPicker.tsx` with Google Maps / Leaflet fallback).
  * 4-Part Strategic Allocation Tuner (`RecommendationDashboard.tsx`).
  * 90-Day Climate Outlook (`/weather`).
  * APMC Mandi Watch & Price Spreads (`/markets`).
  * Multimodal AI Agronomist Chat (`/assistant`).

### B. Machine Learning Inference Layer (`ml-service/` & `ml/`)
* **Framework:** Python 3.11+ / FastAPI microservice on port 8000.
* **Models:**
  * `yield_model.pkl`: RandomForestRegressor trained on ICAR rainfall, temperature, and soil NPK data ($R^2 = 0.94$).
  * `price_model.pkl`: Ridge + GradientBoostingRegressor ensemble trained on 19,500 APMC time-series rows ($\text{MAPE} = 6.8\%$).

### C. Geospatial & Database Layer (`database/`)
* **Database:** PostgreSQL 16 with PostGIS extension.
* **Storage:** Spatial `GEOGRAPHY(POLYGON, 4326)` boundaries, `GEOGRAPHY(POINT, 4326)` centroids, real-time weather cache, and user preferences.

### D. Reverse Proxy & Infrastructure (`infrastructure/` & `nginx.conf`)
* **Nginx:** Routes `/` to Next.js (`:3000`) and `/ml/` to FastAPI (`:8000`).
* **Docker Compose:** Multi-container orchestration (`docker-compose.prod.yml`).