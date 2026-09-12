# AgriProfit — Production Deployment Guide

## 1. Containerized Multi-Service Architecture

AgriProfit deploys as a multi-container Docker Compose stack:

```text
┌────────────────────────────────────────────────────────┐
│                        Nginx                           │
│                      (Port 80)                         │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
     ┌──────▼──────┐                  ┌──────▼──────┐
     │   Next.js   │                  │  FastAPI    │
     │  Frontend   │                  │ ML Service  │
     │  (:3000)    │                  │  (:8000)    │
     └──────┬──────┘                  └─────────────┘
            │
     ┌──────▼────────────────────────────────┐
     │          PostgreSQL 16 + PostGIS      │
     │                 (:5432)               │
     └───────────────────────────────────────┘
```

---

## 2. Quickstart with Docker Compose

```bash
# 1. Clone & enter repository
git clone https://github.com/your-org/agriprofit.git
cd AgriProfit

# 2. Configure environment
cp .env.example .env

# 3. Build & launch services
docker compose -f docker-compose.prod.yml up --build -d

# 4. Access application
# Frontend: http://localhost:3000
# ML API Docs: http://localhost:8000/docs
```

---

## 3. Environment Variables Reference

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript & Geometry API Key |
| `OPENROUTER_API_KEY` | OpenRouter Key for AI Agronomist LLM Agent |
| `TWOFACTOR_API_KEY` | 2Factor.in SMS Gateway Key |
| `FAST2SMS_API_KEY` | Fast2SMS Gateway Key |
| `DATABASE_URL` | PostgreSQL connection string |
| `ML_PORT` | Python ML Microservice port (default: 8000) |

