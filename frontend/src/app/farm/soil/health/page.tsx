"use client";

import React from "react";
import Link from "next/link";
import AppShell from "../../../components/AppShell";

export default function SoilHealthGuidePage() {
  const standards = [
    {
      param: "Soil pH (Reaction)",
      optimal: "6.5 – 7.8",
      low: "< 6.0 (Acidic)",
      high: "> 8.2 (Alkaline)",
      impact: "Governs nutrient solubility. Phosphorus fixes with iron/aluminum at low pH, and with calcium at high pH.",
      remedy: "Apply Agricultural Lime for pH < 6.0; Apply Gypsum or Pyrite for alkaline sodic soils with pH > 8.5.",
    },
    {
      param: "Electrical Conductivity (EC)",
      optimal: "< 1.0 dS/m",
      low: "Non-saline",
      high: "> 2.0 dS/m (Saline)",
      impact: "High soluble salt concentration creates osmotic pressure, preventing crop root water uptake.",
      remedy: "Provide leaching drainage with good quality canal water. Incorporate green manure (dhaincha).",
    },
    {
      param: "Organic Carbon (OC)",
      optimal: "> 0.75 %",
      low: "< 0.50 % (Deficient)",
      high: "> 1.0 % (Rich)",
      impact: "Biological soil foundation. Determines cation exchange capacity (CEC) and moisture retention.",
      remedy: "Apply 5–10 tonnes/acre Farm Yard Manure (FYM), press mud, or compost. Practice crop residue mulching.",
    },
    {
      param: "Available Nitrogen (N)",
      optimal: "280 – 560 kg/ha",
      low: "< 280 kg/ha (Low)",
      high: "> 560 kg/ha (High)",
      impact: "Drives vegetative tillering, chlorophyll synthesis, and vegetative biomass growth.",
      remedy: "If low, apply split Neem Coated Urea. If high, reduce chemical urea dose to prevent stem lodging.",
    },
    {
      param: "Available Phosphorus (P)",
      optimal: "10 – 25 kg/ha",
      low: "< 10 kg/ha (Low)",
      high: "> 25 kg/ha (High)",
      impact: "Crucial for early root elongation, tillering, seed formation, and energy transfer (ATP).",
      remedy: "Drill DAP or SSP directly 3-5 cm below seed depth. If soil test is >25 kg/ha, reduce or eliminate phosphate dose.",
    },
    {
      param: "Available Potassium (K)",
      optimal: "110 – 280 kg/ha",
      low: "< 110 kg/ha (Low)",
      high: "> 280 kg/ha (High)",
      impact: "Regulates stomatal opening, disease resistance, drought tolerance, and grain test weight.",
      remedy: "Apply Muriate of Potash (MOP 60% K2O). For chloride-sensitive crops (potato, grapes), use SOP.",
    },
    {
      param: "Available Zinc (Zn)",
      optimal: "> 0.60 ppm",
      low: "< 0.60 ppm (Deficient)",
      high: "> 1.50 ppm",
      impact: "Essential for plant auxin hormone production and enzymatic protein synthesis. Prevents Khaira disease in paddy.",
      remedy: "Soil application of 10–25 kg/ha Zinc Sulphate (21% Zn). Never mix directly with DAP.",
    },
  ];

  return (
    <AppShell pageTitle="Soil Health Standards & Guide">
      <div className="max-w-5xl mx-auto space-y-8 font-sans">
        {/* Header */}
        <header className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">📚</span>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-xs uppercase tracking-wider border border-emerald-200">
                Agronomic Knowledge Base
              </span>
            </div>
            <Link
              href="/farm/soil"
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all"
            >
              ← Back to Soil Services
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
            National Soil Health Card Benchmark Standards & Guide
          </h1>
          <p className="text-sm text-slate-600">
            Official ICAR-IISS diagnostic criteria for interpreting soil chemical test results and identifying fertility constraints.
          </p>
        </header>

        {/* Diagnostic Standards Table */}
        <section className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
            Parameter Thresholds & Remediation Strategies
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Soil Parameter</th>
                  <th className="py-2.5 px-3">Optimal Band</th>
                  <th className="py-2.5 px-3">Deficient</th>
                  <th className="py-2.5 px-3">Excessive</th>
                  <th className="py-2.5 px-3">Remediation Practice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {standards.map((st) => (
                  <tr key={st.param} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <strong className="text-slate-900 block">{st.param}</strong>
                      <span className="text-[11px] text-slate-500">{st.impact}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      {st.optimal}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-700">
                      {st.low}
                    </td>
                    <td className="py-3 px-3 font-mono text-rose-700">
                      {st.high}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {st.remedy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 10 Core Questions on Soil Health */}
        <section className="p-6 sm:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm space-y-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
            Frequently Asked Agronomic Questions on Soil Health
          </h2>

          <div className="space-y-3 text-xs">
            <details className="p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
              <summary className="font-black text-slate-900">
                Why does AgriProfit analyze 3 distinct soil depths instead of just 0-15cm?
              </summary>
              <p className="mt-2 text-slate-600 leading-relaxed">
                Standard topsoil tests only measure the top 15 cm. However, deep-rooted crops like cotton, pigeon pea, and wheat extend root systems down to 40–90 cm. If a subsoil hardpan or saline layer exists at 25 cm, testing only the topsoil will lead to crop failure. AgriProfit tests 0-15cm, 15-30cm, and 30-60cm to capture vertical barriers.
              </p>
            </details>

            <details className="p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
              <summary className="font-black text-slate-900">
                Why does the system recommend ZERO phosphate fertilizer on soils with high P?
              </summary>
              <p className="mt-2 text-slate-600 leading-relaxed">
                Applying DAP or SSP to soils already high in available phosphorus (&gt;25 kg/ha) does not increase crop yields. Instead, excess phosphorus chemically locks up soil zinc and iron, inducing micronutrient chlorosis and wasting thousands of rupees per acre.
              </p>
            </details>

            <details className="p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
              <summary className="font-black text-slate-900">
                Can DAP and Zinc Sulphate be mixed together during application?
              </summary>
              <p className="mt-2 text-slate-600 leading-relaxed">
                No. Mixing DAP (di-ammonium phosphate) with zinc sulphate causes a rapid chemical reaction producing zinc phosphate, which is water-insoluble. Both the zinc and phosphorus become unavailable to plant roots. Always apply zinc sulphate separately or as a foliar spray.
              </p>
            </details>
          </div>
        </section>

        {/* Action Row */}
        <div className="flex justify-between items-center pt-2">
          <Link
            href="/farm/soil"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            ← Back to Soil Services
          </Link>

          <Link
            href="/farm/soil/fertilizer"
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2"
          >
            <span>Run Targeted Fertilizer Calculator</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
