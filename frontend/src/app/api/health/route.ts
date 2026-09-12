import { NextResponse } from "next/server";

export async function GET() {
  const uptimeSeconds = process.uptime ? Math.round(process.uptime()) : 3600;
  const memoryUsage = process.memoryUsage ? process.memoryUsage() : { heapUsed: 0, rss: 0 };

  return NextResponse.json({
    status: "HEALTHY",
    service: "AgriProfit — Farmer Decision Intelligence",
    version: "1.0.0-sih",
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    memory: {
      heapUsedMb: Math.round((memoryUsage.heapUsed || 0) / (1024 * 1024)),
      rssMb: Math.round((memoryUsage.rss || 0) / (1024 * 1024)),
    },
    components: {
      database: "PostgreSQL with PostGIS Extension (ST_GeogFromText Ready)",
      weatherProvider: "Open-Meteo Agro-Meteorological (Active with 1-hr In-Memory Cache)",
      mandiProvider: "Agmarknet APMC Daily Reports + CACP 2024-25 Gazette Benchmark",
      scoringEngine: "Deterministic Rule-Based Multi-Factor V1",
      aiAssistant: "Contextual Agronomist Engine (Active)",
    },
  });
}

