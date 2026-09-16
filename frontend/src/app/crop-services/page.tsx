"use client";

import React from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";

export default function CropServicesDirectoryPage() {
  const services = [
    {
      id: "planning",
      title: "Crop Planning & Suitability Wizard",
      tag: "Multi-Criteria Optimization",
      icon: "🌾",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description: "Progressively select your farm plot, configure water availability, risk appetite, and soil parameters to receive an optimized 4-part multi-crop portfolio.",
      link: "/crop-services/planning",
      actionText: "Start Crop Planning",
      stats: "Dynamic 4-Part Land Division",
    },
    {
      id: "compare",
      title: "Crop Compare Studio",
      tag: "Head-to-Head Analysis",
      icon: "⚖️",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
      description: "Evaluate 2 or 3 candidate crops side-by-side across gross revenue, production costs, water intensity, and MSP safety net protection.",
      link: "/crop-services/compare",
      actionText: "Compare Crops",
      stats: "Radar Metric Visualization",
    },
    {
      id: "seasonal",
      title: "Seasonal & Short-Duration Crop Planner",
      tag: "ICAR 30–75 Day Windows",
      icon: "⏱️",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      description: "Discover rapid maturity catch-crops (Moong, Urad, Radish, Spinach) designed to fit tightly between primary Rabi and Kharif cropping seasons with festival demand spikes.",
      link: "/crop-services/seasonal",
      actionText: "Explore Catch Crops",
      stats: "Festival Demand Multipliers",
    },
    {
      id: "database",
      title: "Crop Agronomy & Economics Database",
      tag: "22 Indexed Commodities",
      icon: "📖",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
      description: "Comprehensive agricultural encyclopedia with ICAR packages of practices, benchmark seed rates, duration curves, and historical CACP MSP floors.",
      link: "/crops",
      actionText: "Browse Agronomy Catalog",
      stats: "Official ICAR & CACP Catalog",
    },
    {
      id: "diagnostics",
      title: "Crop Care & Vision Diagnostics (उन्नति AI)",
      tag: "Computer Vision & Multi-Persona AI",
      icon: "🤖",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      description: "Instant multimodal crop advisory. Upload leaf disease photos for computer-vision diagnosis or speak with उन्नति AI in 11 Indian languages across farmer, govt, and buyer roles.",
      link: "/assistant",
      actionText: "Open उन्नति AI",
      stats: "11 Languages + Leaf Disease Scan",
    },
    {
      id: "lifecycle",
      title: "Seasonal Advisory & Action Schedule",
      tag: "120-Day Timeline",
      icon: "📅",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
      description: "Chronological 5-stage agronomic roadmap covering basal fertilization, first nodal irrigation, flowering protection, and market harvest dispatch.",
      link: "/recommendations/plan",
      actionText: "View Action Schedule",
      stats: "Phase-by-Phase Roadmap",
    },
  ];

  return (
    <AppShell pageTitle="Crop Services Directory">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Service Header */}
        <header className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌱</span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-black text-xs uppercase tracking-wider">
              Service Directory · Layer 1
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
              Crop Planning, Agronomy & Decision Support Services
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              Progressive digital services to help farmers select the most profitable, water-efficient, and climate-resilient crops for their specific land parcel.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 font-bold">
              Current Season: <strong className="text-slate-900">Rabi 2024–25</strong>
            </span>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-bold">
              Optimization Engine: 4-Part Risk-Diversified Allocation
            </span>
          </div>
        </header>

        {/* 6 Progressive Service Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

