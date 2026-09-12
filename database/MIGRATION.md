# AgriProfit — Database Migration & PostGIS Setup Guide

AgriProfit uses PostgreSQL with the PostGIS spatial extension for boundary polygon calculation and GIS indexing.

---

## 1. Prerequisites
- PostgreSQL 15 or 16
- PostGIS 3.3+ extension
- Node.js 18+

---

## 2. Setting Up PostGIS in PostgreSQL

### Step 1: Connect to your PostgreSQL instance
```bash
psql -U postgres
```

### Step 2: Create Database and Enable PostGIS Extension
```sql
CREATE DATABASE agriprofit;
\c agriprofit

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Step 3: Run Database Schema Script
```bash
psql -U postgres -d agriprofit -f database/init.sql
```

---

## 3. PostGIS Geometry Functions Used
- `ST_GeogFromText('POLYGON((lng lat, ...))')`: Converts GeoJSON polygon vertices into a spatial geography object.
- `ST_Area(geom)`: Computes exact surface area on the WGS-84 ellipsoid in square meters ($1\text{ acre} = 4046.856\text{ m}^2$).
- `ST_Centroid(geom)`: Determines the centroid latitude and longitude for regional weather queries.
- `GIST(boundary_geom)`: Spatial index for bounding-box search queries.

---

## 4. Development Fallback
If PostgreSQL is not running locally, AgriProfit automatically falls back to an in-memory repository without throwing unhandled exceptions.

