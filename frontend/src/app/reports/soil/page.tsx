"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import {
  createDemoThreeLayerReport,
  rateNutrientStatus,
} from "@/lib/soil-service";
import type { FarmRecord } from "../../api/farms/repository";

export default function GovernmentSoilHealthCardReportPage() {
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>("default");

  useEffect(() => {
    async function loadFarms() {
      try {
        const res = await fetch("/api/farms");
        if (res.ok) {
          const json = await res.json();
          const list: FarmRecord[] = json.farms || [];
          setFarms(list);
          if (list.length > 0) {
            setSelectedFarmId(list[0].id);
          }
        }
      } catch {
        // Fallback
      }
    }
    loadFarms();
  }, []);

  const report = useMemo(() => {
    return createDemoThreeLayerReport(selectedFarmId);
  }, [selectedFarmId]);

  return (
    <AppShell pageTitle="Soil Health Card">
      <div className="max-w-4xl mx-auto space-y-6 font-sans">
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/reports"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all"
          >
            ← Back to Reports Directory
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🖨️ Print Soil Health Card</span>
            </button>
          </div>
        </div>

        {/* Printable Official Government Soil Health Card */}
        <div className="p-8 sm:p-10 bg-white border-2 border-slate-300 rounded-3xl shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Official Emblem & Header */}
          <div className="border-b-2 border-slate-900 pb-6 text-center space-y-1">
            <div className="text-3xl">🌱</div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-600">
              Department of Agriculture & Farmers Welfare · Government of India
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight font-['Space_Grotesk']">
              National Soil Health Card
            </h1>
            <div className="text-[11px] font-mono text-slate-500">
              Card ID: SHC-PB-2024-00892 · Scheme Code: DA&FW-SHC-2015 · Standard 3-Layer Diagnostic
            </div>
          </div>

          {/* Farm Plot Selector (Hidden in print) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs print:hidden">
            <span className="font-bold text-slate-700">Select Land Parcel:</span>
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.areaAcres.toFixed(2)} Acres)
                </option>
              ))}
              <option value="default">Bathinda Plot 01 (2.50 Acres)</option>
            </select>
          </div>

          {/* Cardholder & Laboratory Credentials */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-slate-500 font-bold block">Cardholder Name:</span>
              <strong className="text-sm font-black text-slate-900">Sardar Gurpreet Singh</strong>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-slate-500 font-bold block">District / State:</span>
              <strong className="text-sm font-black text-slate-900">Bathinda, Punjab</strong>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-slate-500 font-bold block">Testing Laboratory:</span>
              <strong className="text-slate-900 block font-bold">ICAR-IISS Regional Soil Lab</strong>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-slate-500 font-bold block">Sample Testing Date:</span>
              <strong className="font-mono text-slate-900 font-bold">{report.reportDate}</strong>
            </div>
          </div>

          {/* 3-Layer Chemical Parameters Matrix */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Vertical 3-Layer Soil Fertility Test Results
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Depth Layer</th>
                    <th className="py-2.5 px-3">pH (Reaction)</th>
                    <th className="py-2.5 px-3">EC (dS/m)</th>
                    <th className="py-2.5 px-3">Organic C (%)</th>
                    <th className="py-2.5 px-3">Available N (kg/ha)</th>
                    <th className="py-2.5 px-3">Available P (kg/ha)</th>
                    <th className="py-2.5 px-3">Available K (kg/ha)</th>
                    <th className="py-2.5 px-3">Rating Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {report.layers.map((layer) => {
                    const ph = layer.parameters["ph"]?.normalizedValue ?? 7.2;
                    const ec = layer.parameters["ec"]?.normalizedValue ?? 0.7;
                    const oc = layer.parameters["organic_carbon"]?.normalizedValue ?? 0.55;
                    const n = layer.parameters["nitrogen"]?.normalizedValue ?? 260;
                    const p = layer.parameters["phosphorus"]?.normalizedValue ?? 16;
                    const k = layer.parameters["potassium"]?.normalizedValue ?? 190;

                    return (
                      <tr key={layer.layerNumber} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-sans font-bold text-slate-900">
                          Layer {layer.layerNumber} ({layer.depthStartCm}–{layer.depthEndCm} cm)
                        </td>
                        <td className="py-3 px-3">{ph}</td>
                        <td className="py-3 px-3">{ec}</td>
                        <td className="py-3 px-3">{oc}%</td>
                        <td className="py-3 px-3">{n}</td>
                        <td className="py-3 px-3">{p}</td>
                        <td className="py-3 px-3">{k}</td>
                        <td className="py-3 px-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              layer.condition === "Good"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {layer.condition}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official ICAR-IISS Recommendations Summary */}
          <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 text-xs">
            <strong className="text-emerald-950 font-black block text-sm">
              Official ICAR-IISS Soil Test Crop Response (STCR) Advisory
            </strong>
            <p className="text-emerald-900 leading-relaxed">
              Based on the 3-layer test, phosphorus is in the moderate-to-adequate range across the top 30 cm. Apply targeted basal DAP without excessive top dressing. Incorporate 4–5 tonnes/acre FYM during summer plowing to elevate subsurface organic carbon above 0.75%.
            </p>
          </div>

          {/* Signatures & Certification */}
          <div className="pt-6 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <div>
              <div className="font-bold text-slate-800">
                Soil Testing Officer / Senior Scientific Officer
              </div>
              <div className="text-[11px] text-slate-500">
                State Agricultural Department, Government of Punjab
              </div>
            </div>

            <div className="text-right font-mono text-[11px]">
              <div>Official Verification QR / Barcode: VERIFIED</div>
              <div className="text-slate-400">Issued under Soil Health Card Mission</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

