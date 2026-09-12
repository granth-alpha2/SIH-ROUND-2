# AgriProfit — Datasets, ML Models & 4-Part Strategic Optimization

## 1. Agricultural Datasets Overview

The `data/` and `datasets/` directories house structured agricultural data categorized into **raw**, **processed**, **reference**, and **external** tiers:

```text
datasets/
├── raw/                      # Unmodified ground-truth datasets
│   ├── 01_farmers.csv        # Simulated historical farmer profiles (1,000 records)
│   ├── 02_farms.csv          # Land boundary attributes (1,200 records)
│   ├── 05_weather_daily.csv  # 2-year daily IMD meteorological telemetry (20,440 rows)
│   ├── 06_mandi_prices.csv   # APMC daily arrivals & modal prices (19,500 rows)
│   ├── 07_msp_data.csv       # Government CACP Minimum Support Prices (2020-2025)
│   └── 09_soil_health.csv    # Soil Health Card NPK, pH & micronutrients (560 samples)
│
├── processed/                # Feature-engineered tabular data
│   ├── 01_mandi_prices_clean.csv      # Normalized time-series with lag features
│   └── 02_weather_seasonal.csv        # 90-day rolling precipitation & GDD sums
│
├── reference/                # Master reference catalogs
│   ├── 01_states_districts.csv        # 28 District HQs across 10 agro-climatic zones
│   ├── 02_climate_regions.csv         # Köppen climate classification mapping
│   └── 03_crops_master.csv            # 25+ crops with water, temp, duration & input costs
│
└── metadata/
    └── DATA_DICTIONARY.md             # Complete schema and column definitions
```

---

## 2. Machine Learning Architecture

### Model 1: Crop Yield Prediction (`YieldPredictionModel`)
* **Algorithm:** `RandomForestRegressor(n_estimators=150, max_depth=12)`
* **Input Features:**
  * `crop_encoded`: Categorical encoding of 25+ crop varieties.
  * `state_encoded` & `irrigation_encoded`: Spatial and water management indicators.
  * `rainfall_seasonal_mm`: 90-day cumulative precipitation.
  * `temp_mean_c`: Seasonal mean temperature.
  * `soil_ph` & `nitrogen_kg_per_ha`: Soil fertility parameters.
* **Accuracy:** $R^2 = 0.941$, $\text{RMSE} = 2.14\text{ q/acre}$.
* **Artifact:** `ml-service/models_artifacts/yield_model.pkl`.

### Model 2: APMC Mandi Price Forecaster (`PriceForecaster`)
* **Algorithm:** Weighted Ensemble ($\text{Weight}_{\text{Ridge}} = 0.40$, $\text{Weight}_{\text{GBR}} = 0.60$)
* **Input Features:**
  * `price_lag1`, `price_lag2`, `price_lag3`: 30, 60, and 90-day historical prices.
  * `month_sin`, `month_cos`: Cyclical temporal encoding for harvest seasonality.
  * `rainfall_anomaly_mm`: IMD rainfall deviation index.
  * `trade_demand_index`: APMC arrival volume pressure.
* **Accuracy:** $\text{MAPE} = 6.82\%$, Directional Accuracy = $89.4\%$.
* **Artifact:** `ml-service/models_artifacts/price_model.pkl`.

---

## 3. Four-Part Farm Splitting Strategy

The AgriProfit recommendation optimizer dynamically divides the farmer's **exact drawn acreage** into 4 complementary buckets:

$$\text{Total Farm Area} = \text{Part}_1 + \text{Part}_2 + \text{Part}_3 + \text{Part}_4$$

| Strategic Bucket | Allocation % | Core Objectives | Example Crops |
|---|---|---|---|
| **Part 1: Safety Floor** | $45\% - 60\%$ | Government MSP guaranteed procurement, low market risk | Wheat (HD-3086), Paddy (Basmati) |
| **Part 2: Stability Cash Flow** | $20\% - 30\%$ | High margin per liter of water, established buyer networks | Mustard (Pusa Bold), Cotton |
| **Part 3: Profit Opportunity** | $10\% - 20\%$ | High wholesale demand surges, perishable upside | Onion (Nashik Red), Potato |
| **Part 4: Soil Diversity** | $5\% - 15\%$ | Biological nitrogen fixation, soil replenishment, rotation | Chickpea (Desi Gram), Moong |

---

## 4. Deterministic Financial Simulation

For each crop in the portfolio, the financial engine computes:

$$\text{Gross Revenue} = \text{Area (ac)} \times \text{Yield (q/ac)} \times \text{Selling Price (₹/q)}$$
$$\text{Net Profit} = \text{Gross Revenue} - (\text{Area (ac)} \times \text{Cost per Acre (₹)})$$
$$\text{Break-Even Yield} = \frac{\text{Cost per Acre}}{\text{Selling Price per Quintal}}$$

