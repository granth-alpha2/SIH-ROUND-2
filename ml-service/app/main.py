"""
AgriProfit ML — Production FastAPI Service
===========================================
Serves trained machine learning models for:
1. Crop Yield Estimation (Random Forest v2.0)
2. APMC Mandi Price Forecasting (Ridge + GBR Ensemble v2.0)
3. Model Telemetry & Accuracy Monitoring
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import health, yield_routes, price_routes
from .utils.config import PORT, HOST

app = FastAPI(
    title="AgriProfit ML Inference Microservice",
    description="Production-grade AI/ML service for Indian agricultural yield prediction and price forecasting.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for Next.js frontend and local services
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health.router)
app.include_router(yield_routes.router)
app.include_router(price_routes.router)


@app.get("/")
def root():
    return {
        "service": "AgriProfit ML Microservice",
        "status": "ONLINE",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)

