"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "../components/AppShell";
import type { AgriWeatherReport } from "@/lib/weather-service";
import { DISTRICT_MASTER, resolveDistrictFromCoords } from "@/lib/geo-service";

export default function WeatherPage() {
  const [selectedRegion, setSelectedRegion] = useState({
    name: `${DISTRICT_MASTER[0].district}, ${DISTRICT_MASTER[0].state} (${DISTRICT_MASTER[0].zone})`,
    lat: DISTRICT_MASTER[0].lat,
    lng: DISTRICT_MASTER[0].lng,
  });

  const [weather, setWeather] = useState<AgriWeatherReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [detectingGps, setDetectingGps] = useState(false);

  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem("agriprofit_active_farm");
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed.center?.lat && parsed.center?.lng) {
          const dInfo = resolveDistrictFromCoords(parsed.center.lat, parsed.center.lng);
          setSelectedRegion({
            name: `${parsed.name || dInfo.district} (${dInfo.district}, ${dInfo.state})`,
            lat: parsed.center.lat,
            lng: parsed.center.lng,
          });
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleUseMyLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetectingGps(false);
        const { latitude, longitude } = position.coords;
        const dInfo = resolveDistrictFromCoords(latitude, longitude);
        setSelectedRegion({
          name: `${dInfo.district}, ${dInfo.state} (${dInfo.agroClimaticZone})`,
          lat: latitude,
          lng: longitude,
        });
      },
      (err) => {
        setDetectingGps(false);
        console.warn("[Weather Geolocation Warning]", err);
        alert("Could not access GPS. Please select your region from the dropdown.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadWeather() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/weather?lat=${selectedRegion.lat}&lng=${selectedRegion.lng}&locationName=${encodeURIComponent(
            selectedRegion.name
          )}`
        );
        if (res.ok && isMounted) {
          const json = await res.json();
          if (json.success && json.weather) {
            setWeather(json.weather);
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [selectedRegion]);

  return (
    <AppShell pageTitle="Weather & Climate">
      <div className="page-container space-y-6">
        {/* Header Row */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="agri-badge agri-badge-emerald">Open-Meteo & IMD Live Feeds</span>
              <span className="text-xs text-[var(--text-muted)] font-['Space_Grotesk']">
                90-Day Seasonal Baseline
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Agro-Meteorological Forecast & Risk Center
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Hourly precipitation probability, thermal anomaly hazards, and 7-day field operation alerts.
            </p>
          </div>

          {/* Location Controls & "Use My Location" */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={detectingGps}
              className="agri-btn-primary"
              title="Detect GPS coordinates and fetch live weather"
            >
              <span>📍</span>
              <span>{detectingGps ? "Locating..." : "Use My Location"}</span>
            </button>

            <select
              value={`${selectedRegion.lat},${selectedRegion.lng}`}
              onChange={(e) => {
                const [lat, lng] = e.target.value.split(",").map(Number);
                const found = DISTRICT_MASTER.find((r) => r.lat === lat && r.lng === lng);
                if (found) {
                  setSelectedRegion({
                    name: `${found.district}, ${found.state} (${found.zone})`,
                    lat: found.lat,
                    lng: found.lng,
                  });
                }
              }}
              className="agri-select max-w-[280px]"
            >
              {DISTRICT_MASTER.map((r) => (
                <option key={r.districtId} value={`${r.lat},${r.lng}`}>
                  {r.district}, {r.state} ({r.zone})
                </option>
              ))}
            </select>
          </div>
        </header>

        {loading && (
          <div className="agri-card p-12 text-center text-[var(--text-muted)] space-y-2">
            <div className="inline-block w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Fetching live satellite weather feeds for {selectedRegion.name}...</p>
          </div>
        )}

        {!loading && weather && (
          <>
            {/* Current Conditions Card */}
            <section className="p-6 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[#064e3b] text-white border border-[var(--border-accent)] shadow-card">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-emerald-200 font-bold font-['Space_Grotesk']">
                    📍 {weather.location?.name || selectedRegion.name}
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <div className="text-4xl font-black font-['Space_Grotesk'] text-white">
                      {weather.current.tempC.toFixed(1)}°C
                    </div>
                    <span className="text-base text-emerald-200 font-semibold">{weather.current.condition}</span>
                  </div>
                  <p className="text-xs text-emerald-100 mt-1">
                    Coordinates: {weather.location?.lat.toFixed(4)}°N, {weather.location?.lng.toFixed(4)}°E
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-black/20 p-3.5 rounded-xl backdrop-blur-md border border-white/10">
                  <div>
                    <span className="text-emerald-200 block text-[10px] uppercase font-bold">Relative Humidity</span>
                    <strong className="text-white text-sm">{weather.current.humidityPct}%</strong>
                  </div>
                  <div>
                    <span className="text-emerald-200 block text-[10px] uppercase font-bold">Wind Velocity</span>
                    <strong className="text-white text-sm">{weather.current.windSpeedKmh} km/h</strong>
                  </div>
                  <div>
                    <span className="text-emerald-200 block text-[10px] uppercase font-bold">Precipitation</span>
                    <strong className="text-white text-sm">{weather.current.rainfallMm} mm</strong>
                  </div>
                  <div>
                    <span className="text-emerald-200 block text-[10px] uppercase font-bold">Thermal Index</span>
                    <strong className="text-white text-sm">{weather.current.feelsLikeC}°C</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* 7-Day Forecast Grid */}
            <section className="agri-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  📅 7-Day Agro-Meteorological Forecast
                </h2>
                <span className="agri-badge agri-badge-sky">Probability Weighted</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {weather.dailyForecast.map((day, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-center text-xs space-y-1.5 transition-all ${
                      day.rainfallMm > 5
                        ? "bg-[var(--color-sky-bg)] border-[var(--color-sky-border)]"
                        : "bg-[var(--bg-surface-subtle)] border-[var(--border-default)]"
                    }`}
                  >
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block font-['Space_Grotesk']">
                      {day.dayName}
                    </span>
                    <span className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                      {day.tempMaxC.toFixed(0)}° / {day.tempMinC.toFixed(0)}°
                    </span>
                    <span className="text-[11px] block truncate font-medium text-[var(--text-secondary)]">
                      {day.condition}
                    </span>
                    <div className="pt-1.5 border-t border-[var(--border-subtle)] flex justify-between text-[10px] text-[var(--text-muted)]">
                      <span>💧 {day.rainfallMm}mm</span>
                      <span>{day.rainProbabilityPct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 90-Day Seasonal Climate Summary */}
            <section className="agri-card p-6 space-y-4">
              <h2 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                🌦️ 90-Day Seasonal Agro-Climate Intelligence
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-1">
                  <span className="text-xs uppercase font-bold text-[var(--text-muted)] tracking-wider block font-['Space_Grotesk']">
                    Cumulative 90-Day Rain
                  </span>
                  <strong className="text-xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                    {weather.seasonalOutlook.cumulativeRain90DaysMm} mm
                  </strong>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Rainy days in season: {weather.seasonalOutlook.rainyDaysSeason}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-emerald-bg)] border border-[var(--color-emerald-border)] space-y-1">
                  <span className="text-xs uppercase font-bold text-[var(--color-emerald-text)] tracking-wider block font-['Space_Grotesk']">
                    Weather Suitability Score
                  </span>
                  <strong className="text-xl font-bold font-['Space_Grotesk'] text-[var(--color-emerald-text)] block">
                    {weather.seasonalOutlook.weatherSuitabilityScore} / 100
                  </strong>
                  <span className="text-xs text-[var(--color-emerald-text)]">
                    IMD Agro-climatic suitability index
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-1">
                  <span className="text-xs uppercase font-bold text-[var(--text-muted)] tracking-wider block font-['Space_Grotesk']">
                    Seasonal Climate Risk
                  </span>
                  <strong
                    className={`text-xl font-bold font-['Space_Grotesk'] block ${
                      weather.seasonalOutlook.riskLevel === "High"
                        ? "text-rose-500"
                        : weather.seasonalOutlook.riskLevel === "Moderate"
                        ? "text-amber-500"
                        : "text-[var(--color-emerald-text)]"
                    }`}
                  >
                    {weather.seasonalOutlook.riskLevel}
                  </strong>
                  <span className="text-xs text-[var(--text-secondary)]">Calculated hazard score</span>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}