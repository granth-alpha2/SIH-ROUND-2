"use client";

import React from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";

export default function SoilServicesDirectoryPage() {
  const services = [
    {
      title: "Upload & OCR Soil Test Report",
      subtitle: "Laboratory Extraction Engine",
      description: "Upload Soil Health Card PDF or laboratory scan. The AI OCR extracts 3-layer parameters (0-15cm, 15-30cm, 30-60cm) automatically.",
      href: "/farm/soil/upload",
      icon: "📄",
      badge: "Layer 4 · Input & Scan",
      primaryAction: "Upload Lab Report",
    },
    {
      title: "3-Layer Chemical Profile & Analysis",
      subtitle: "Vertical Profile & Subsoil Constraints",
      description: "Inspect surface vs subsurface stratification. Identify subsoil salinity (EC), hardpan compaction, organic carbon deficits, and pH barriers.",
      href: "/farm/soil/analysis",
      icon: "🔬",
      badge: "Layer 5 · Analysis",
      primaryAction: "View Soil Profile",
    },
    {
      title: "STCR Targeted Fertilizer Calculator",
      subtitle: "ICAR Precision Nutrition Engine",
      description: "Generate customized split fertilizer doses (Urea, DAP, SSP, MOP, Zinc) tailored to crop rootzone depth. Enforces strict zero-overfertilization.",
      href: "/farm/soil/fertilizer",
      icon: "🧪",
      badge: "Layer 6 · Recommendation",
      primaryAction: "Calculate Fertilizer Plan",
    },
    {
      title: "Soil Health Standards & Agronomic Guide",
      subtitle: "ICAR-IISS Benchmark Catalog",
      description: "Understand optimal thresholds for pH, electrical conductivity (EC), organic carbon (OC), macronutrients (NPK), and micronutrients.",
      href: "/farm/soil/health",
      icon: "📚",
      badge: "Knowledge Hub",
      primaryAction: "Read Soil Standards",
    },
  ];

  return (
    <AppShell pageTitle="Soil Services Directory">
      <div className="max-w-5xl mx-auto space-y-8 font-sans">
        {/* Directory Header Banner */}
        <header className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🧪</span>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-xs uppercase tracking-wider border border-emerald-200">
                Layer 2 · Soil Services Directory
              </span>
            </div>
            <Link
              href="/farm"
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all"
            >
              ← Back to Farm Services
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
            3-Layer Soil Fertility & Fertilizer Advisory Services
          </h1>

          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            AgriProfit integrates three-layer vertical soil profiling (0-15cm topsoil, 15-30cm subsoil, 30-60cm deep rootzone) following ICAR-IISS and National Soil Health Card guidelines. Select a service below to evaluate your land’s chemical and physical characteristics.
          </p>
        </header>

        {/* Services 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((item) => (
            <div
              key={item.title}
              className="p-6 sm:p-7 bg-white border-2 border-slate-200 hover:border-emerald-600 rounded-3xl shadow-sm transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl shadow-2xs">
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    {item.subtitle}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 font-['Space_Grotesk'] mt-0.5">
                    {item.title}
                  </h2>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <Link
                href={item.href}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-2xl text-center shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{item.primaryAction}</span>
                <span>→</span>
              </Link>
            </div>
          ))}
        </div>

        {/* Informational Callout */}
        <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-3xl flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <strong className="text-emerald-950 font-black text-sm block">
              Official ICAR-IISS STCR Methodology
            </strong>
            <p className="text-emerald-900">
              Recommendations comply with the Department of Agriculture & Farmers Welfare Soil Health Card scheme standards.
            </p>
          </div>
          <Link
            href="/farm/soil/health"
            className="px-4 py-2 bg-white text-emerald-800 border border-emerald-300 rounded-xl font-bold hover:bg-emerald-100 transition-all text-xs"
          >
            Review Benchmark Thresholds
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

