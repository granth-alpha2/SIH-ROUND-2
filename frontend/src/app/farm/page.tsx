"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import type { FarmRecord } from "../api/farms/repository";

export default function FarmServicesDirectoryPage() {
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFarms() {
      try {
        const res = await fetch("/api/farms");
        if (res.ok) {
          const json = await res.json();
          setFarms(json.farms || []);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadFarms();
  }, []);

  const totalAcres = farms.reduce((sum, f) => sum + f.areaAcres, 0);

  const services = [
    {
      id: "plots",
      title: "My Farm Plots",
      tag: "PostGIS Registered",
      icon: "📋",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description: "Inspect registered field plots, view geodesic acreage, geographic coordinates, and soil baseline information.",
      link: "/farms",
      actionText: "View Farm Plots",
      stats: `${farms.length} Plot(s) Registered`,
    },
    {
      id: "boundary",
      title: "Map New Field Boundary",
      tag: "Satellite Studio",
      icon: "📐",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
      description: "Draw or adjust your field boundaries on high-resolution satellite imagery using polygon drawing tools. Computes exact geodesic acres automatically.",
      link: "/farms/new",
      actionText: "Draw Field Boundary",
      stats: "WGS-84 Georeferenced",
    },
    {
      id: "soil",
      title: "Soil Testing & Health Services",
      tag: "3-Layer Diagnostic",
      icon: "🧪",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      description: "Upload government soil lab test reports, examine surface to rootzone N-P-K & pH layers, and generate custom fertilizer schedules.",
      link: "/farm/soil",
      actionText: "Open Soil Services",
      stats: "0–60cm Multi-Layer Analysis",
    },
    {
      id: "weather",
      title: "Agro-Weather Advisory",
      tag: "7-Day Meteo Forecast",
      icon: "☁️",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
      description: "Access hyper-local meteorological forecasts, precipitation alerts, temperature extremes, and spray suitability windows.",
      link: "/weather",
      actionText: "Check Weather Advisory",
      stats: "Live Meteo Synced",
    },
  ];

  return (
    <AppShell pageTitle="Farm Services Directory">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Service Header */}
        <header className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌾</span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-black text-xs uppercase tracking-wider">
              Service Directory · Layer 1
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
              Farm Land, Soil & Climate Services
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              Official services for cadastral land boundary mapping, multi-layer soil chemical analysis, targeted fertilizer split recommendations, and hyper-local agro-weather forecasting.
            </p>
          </div>

          {/* Farm State Summary Pill */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 font-bold">
              Total Plots: <strong className="text-slate-900">{loading ? "..." : farms.length}</strong>
            </span>
            <span className="px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 font-bold">
              Total Cultivable Area: <strong className="text-slate-900">{loading ? "..." : `${totalAcres.toFixed(2)} Acres`}</strong>
            </span>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-bold">
              Active Zone: Trans-Gangetic & Indo-Gangetic Plains
            </span>
          </div>
        </header>

        {/* 4 Progressive Service Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="p-6 bg-white border-2 border-slate-200 hover:border-emerald-600 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    {svc.icon}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${svc.badgeColor}`}>
                    {svc.tag}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {svc.title}
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {svc.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-500">
                  {svc.stats}
                </span>

                <Link
                  href={svc.link}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{svc.actionText}</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

