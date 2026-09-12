# AgriProfit — Local Development Guide

## 1. Prerequisites
* **Node.js:** v20.x or v22.x LTS
* **Python:** 3.10+ or 3.11+
* **Docker & Docker Compose:** Optional for local PostGIS and Redis container

---

## 2. Quick Setup (Single Command Launch)

```bash
# 1. Install dependencies
npm install
npm --prefix frontend install
pip install -r ml-service/requirements.txt

# 2. Run the ENTIRE application with ONE command:
npm run dev
# OR on Windows: Double-click start.bat
```

The unified runner automatically spawns both services with colored log prefixes:
* **Next.js Web Application:** `http://localhost:3000`
* **Python FastAPI ML Microservice:** `http://localhost:8000`
* **Interactive ML Swagger Docs:** `http://localhost:8000/docs`


---

## 3. Development Commands

```bash
# TypeScript Typecheck
npx --prefix frontend tsc --noEmit

# Run all integration test suites
npx --prefix frontend tsx tests/integration/test_farms.ts
npx --prefix frontend tsx tests/integration/test_portfolio.ts
npx --prefix frontend tsx tests/integration/test_markets.ts
npx --prefix frontend tsx tests/integration/test_weather.ts
npx --prefix frontend tsx tests/integration/test_auth.ts

# Production Build
npm --prefix frontend run build
```

