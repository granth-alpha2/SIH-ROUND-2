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

---

## 3. Secondary Marketplace Endpoints (`frontend/src/app/api/marketplace/`)

### Overview & Discovery
* `GET /api/marketplace/overview`: Aggregated market snapshot, CACP MSP floors, mandi prices, and crop cards.

### Mode A: Government MSP Procurement
* `GET /api/marketplace/msp/centers`: Lists registered procurement centers (FCI, PUNGRAIN, HAFED, NAFED).
* `GET /api/marketplace/msp/requests`: Lists MSP procurement requests filtered by farmer, status, or center.
* `POST /api/marketplace/msp/requests`: Farmer submits MSP application linked to farm polygon and yield.
* `GET /api/marketplace/msp/requests/[id]`: Fetches single MSP request detail.
* `POST /api/marketplace/msp/approve`: Government officer approves request and issues cryptographically secure 12-digit code.
* `POST /api/marketplace/msp/reject`: Rejects application with official remarks.
* `POST /api/marketplace/msp/verify-code`: Validates 12-digit code at procurement center terminal.
* `POST /api/marketplace/msp/biometric/verify`: Executes demo eye biometric identity verification.
* `POST /api/marketplace/msp/procure`: Finalizes intake with actual weighbridge quantity, prints receipt, and initiates demo payment.

### Mode B: Direct Farm-to-Market & Group Selling
* `GET /api/marketplace/listings`: Search & filter direct listings by crop, district, max price, and min quantity.
* `POST /api/marketplace/listings`: Farmer creates direct crop listing with asking price and quality grade.
* `POST /api/marketplace/offers`: Private buyer makes offer on listing or adds to Request Basket.
* `PATCH /api/marketplace/offers`: Farmer accepts or counters buyer offer, creating direct sale transaction.
* `GET /api/marketplace/groups`: Lists active farmer pooling groups with compatibility scores.
* `POST /api/marketplace/groups`: Creates new selling group or joins existing pool.

### Export Gateway & Administration
* `GET /api/marketplace/export/opportunities`: 10-country international trade reference prices from FAOSTAT / UN Comtrade.
* `GET /api/marketplace/export/exporters`: Directory of licensed Indian agricultural exporting companies.
* `POST /api/marketplace/export/match`: Submits aggregated group export proposal to verified Indian exporter.
* `GET /api/marketplace/transactions`: Unified ledger of completed transactions, receipts, and payout statuses.
* `GET /api/marketplace/admin/telemetry`: Administrative governance, fraud prevention, and volume metrics.

