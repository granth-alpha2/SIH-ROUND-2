# AgriProfit — REST API Specification

## 1. Next.js API Layer (`frontend/app/api/`)

### Authentication & Sessions
* `POST /api/auth/otp/send`: Initiates mobile OTP via 2Factor/Fast2SMS SMS gateway.
* `POST /api/auth/otp/verify`: Validates 6-digit OTP and issues encrypted JWT session cookie.
* `POST /api/auth/demo`: Issues instant one-click evaluator session for SIH evaluation.
* `POST /api/auth/logout`: Clears session cookie and invalidates token.

### Farm Geospatial Management
* `GET /api/farms`: Lists all registered georeferenced land plots for the active farmer.
* `POST /api/farms`: Creates a new farm polygon with geodesic area calculation.
  * **Payload:** `{ name: string, areaAcres: number, center: { lat, lng }, boundary: [{ lat, lng }] }`
* `GET /api/farms/:farmId`: Retrieves single farm polygon and centroid coordinates.
* `PUT /api/farms/:farmId`: Updates farm boundary and custom subsection allocations.
* `DELETE /api/farms/:farmId`: Deletes farm polygon and associated plans.

### Agro-Meteorology & Market Intelligence
* `GET /api/weather?lat=...&lng=...&locationName=...`: Fetches 7-day forecast and 90-day seasonal outlook from Open-Meteo with caching.
* `GET /api/markets?crop=...&state=...`: Retrieves daily APMC modal prices, 30-day trends, and MSP floors.
* `GET /api/crops`: Fetches curated crop catalog with temperature, water, and agronomic constraints.

### Strategic Recommendations & Decision Support
* `POST /api/recommendations`: Generates dynamic 4-part multi-crop portfolio based on farm boundary.
* `GET /api/assistant`: Fetches authorized farmer context telemetry (active field, crop stage, weather, mandi rate).
* `POST /api/assistant`: Conversational query endpoint with Hinglish parsing and visual leaf pathology.

---

## 2. Python FastAPI ML Layer (`ml-service/app/api/`)

* `GET /health`: Health status and model metadata ($R^2$ and MAPE).
* `POST /predict/yield`: Runs Random Forest model for expected yield per acre and hectare.
* `POST /predict/price`: Runs Ridge + GBR ensemble for forward mandi price forecasting.

