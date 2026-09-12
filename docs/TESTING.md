# AgriProfit — Automated Testing & Quality Assurance Guide

## 1. Test Architecture

The AgriProfit test suite covers the complete application stack:

```text
tests/
├── integration/
│   ├── test_auth.ts              # Session & JWT verification
│   ├── test_farms.ts             # Geospatial area, GPS & district resolution
│   ├── test_weather.ts           # Open-Meteo telemetry & 90-day climate baseline
│   ├── test_markets.ts           # APMC mandi pricing & MSP safety catalog
│   ├── test_portfolio.ts         # 4-Part strategic optimizer & sensitivity simulator
│   └── test_assistant.ts         # Multimodal AI agronomist & disease cards
│
└── ml-service/tests/
    └── test_prediction.py       # Python unit tests for Yield & Price models
```

---

## 2. Running Automated Tests

```bash
# Run all Next.js & domain integration tests
npx --prefix frontend tsx tests/integration/test_farms.ts
npx --prefix frontend tsx tests/integration/test_portfolio.ts
npx --prefix frontend tsx tests/integration/test_markets.ts
npx --prefix frontend tsx tests/integration/test_weather.ts
npx --prefix frontend tsx tests/integration/test_assistant.ts
npx --prefix frontend tsx tests/integration/test_auth.ts

# Run Python ML test suite
pytest ml-service/tests/
```

