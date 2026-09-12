/**
 * @agriprofit/api-client — Typed REST Client SDK
 * ===============================================
 */

import type {
  FarmRecord,
  AgriWeatherReport,
  MandiPriceRecord,
  MspRecord,
  CropRecord,
  OptimizedPortfolio,
  NotificationItem,
} from "@agriprofit/shared/types";

export class AgriProfitApiClient {
  private baseUrl: string;

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl;
  }

  async getHealth() {
    const res = await fetch(`${this.baseUrl}/api/health`);
    return res.json();
  }

  async getFarms(): Promise<FarmRecord[]> {
    const res = await fetch(`${this.baseUrl}/api/farms`);
    const json = await res.json();
    return json.farms || [];
  }

  async getWeather(lat: number, lng: number): Promise<AgriWeatherReport> {
    const res = await fetch(`${this.baseUrl}/api/weather?lat=${lat}&lng=${lng}`);
    const json = await res.json();
    return json.weather;
  }

  async getMarkets(crop?: string, state?: string): Promise<MandiPriceRecord[]> {
    const params = new URLSearchParams();
    if (crop) params.set("crop", crop);
    if (state) params.set("state", state);
    const res = await fetch(`${this.baseUrl}/api/markets?${params.toString()}`);
    const json = await res.json();
    return json.markets || [];
  }

  async getMsp(): Promise<MspRecord[]> {
    const res = await fetch(`${this.baseUrl}/api/msp`);
    const json = await res.json();
    return json.mspRecords || [];
  }

  async getCrops(): Promise<CropRecord[]> {
    const res = await fetch(`${this.baseUrl}/api/crops`);
    const json = await res.json();
    return json.crops || [];
  }

  async getRecommendations(body: Record<string, unknown>): Promise<OptimizedPortfolio> {
    const res = await fetch(`${this.baseUrl}/api/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return json.recommendation;
  }

  async getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    const res = await fetch(`${this.baseUrl}/api/notifications`);
    return res.json();
  }

  async askAssistant(message: string) {
    const res = await fetch(`${this.baseUrl}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    return res.json();
  }

  // 9. Real-Time ML Microservice Client
  async getMlHealth(mlBaseUrl = "http://localhost:8000") {
    const res = await fetch(`${mlBaseUrl}/health`);
    return res.json();
  }

  async getMlModelsInfo(mlBaseUrl = "http://localhost:8000") {
    const res = await fetch(`${mlBaseUrl}/models/info`);
    return res.json();
  }

  async predictYield(
    payload: { crop: string; rainfall_mm?: number; soil_ph?: number; nitrogen_kg_per_ha?: number; state?: string; irrigation_type?: string },
    mlBaseUrl = "http://localhost:8000"
  ) {
    const res = await fetch(`${mlBaseUrl}/predict/yield`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async forecastPrice(
    payload: { crop: string; months_ahead?: number; current_price_inr?: number; state?: string; trade_demand_index?: number },
    mlBaseUrl = "http://localhost:8000"
  ) {
    const res = await fetch(`${mlBaseUrl}/predict/price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }
}


export const apiClient = new AgriProfitApiClient();

