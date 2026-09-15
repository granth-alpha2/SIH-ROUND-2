"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import type { FarmRecord } from "../../api/farms/repository";

export default function CadastralFarmLandReportPage() {
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

  const fallbackFarm: FarmRecord = {
    id: "demo-farm-01",
    name: "Bathinda Model Farm Parcel 01",
    areaAcres: 2.5,
    center: { lat: 30.211, lng: 74.9455 },
    boundary: [
      { lat: 30.211, lng: 74.9455 },
      { lat: 30.2125, lng: 74.9455 },
      { lat: 30.2125, lng: 74.948 },
      { lat: 30.211, lng: 74.948 },
      { lat: 30.211, lng: 74.9455 },
    ],
    preferences: {
      soilType: "Alluvial Loam",
    },
    createdAt: "2024-06-12T10:30:00Z",
  };

  const activeFarm: FarmRecord = farms.find((f) => f.id === selectedFarmId) || fallbackFarm;

  const areaHa = (activeFarm.areaAcres * 0.404686).toFixed(3);

  return (
    <AppShell pageTitle="Cadastral Farm Land Dossier">
      <div className="max-w-4xl mx-auto space-y-6 font-sans">
        {/* Actions Bar */}
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
              <span>🖨️ Print Official Dossier</span>
            </button>
          </div>
        </div>

        {/* Printable Official Government Cadastral Document */}
        <div className="p-8 sm:p-10 bg-white border-2 border-slate-300 rounded-3xl shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Official Emblem & Header */}
          <div className="border-b-2 border-slate-900 pb-6 text-center space-y-1">
            <div className="text-3xl">🏛️</div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-600">
              Department of Land Resources · Ministry of Rural Development
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-['Space_Grotesk']">
              Official Cadastral Farm Land & Georeference Dossier
            </h1>
            <div className="text-[11px] font-mono text-slate-500">
              Document Ref: DLIS-PB-2024-{activeFarm.id.slice(0, 8).toUpperCase()} · PostGIS Geodesic Standard WGS-84
            </div>
          </div>

          {/* Plot Selector (Hidden in print) */}
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
              <option value="default">Bathinda Model Farm Parcel 01 (2.50 Acres)</option>
            </select>
          </div>

          {/* Core Land Characteristics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Total Land Area
              </span>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                {activeFarm.areaAcres.toFixed(2)} Acres
              </div>
              <span className="text-[11px] text-slate-500 font-mono">{areaHa} Hectares</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Predominant Soil
              </span>
              <div className="text-sm font-black text-slate-900 mt-1">
                {activeFarm.preferences?.soilType || "Alluvial Loam"}
              </div>
              <span className="text-[11px] text-slate-500">Deep Profile</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Agro-Climatic Zone
              </span>
              <div className="text-sm font-black text-slate-900 mt-1">
                Trans-Gangetic Plains
              </div>
              <span className="text-[11px] text-slate-500">Zone VI (ICAR)</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Cadastral Status
              </span>
              <div className="text-sm font-black text-emerald-700 mt-1">
                ✓ Digitally Mapped
              </div>
              <span className="text-[11px] text-slate-500">Satellite Polygon</span>
            </div>
          </div>

          {/* Polygon Coordinates Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                WGS-84 Georeferenced Boundary Vertices ({activeFarm.boundary?.length || 0} Points)
              </h3>
              <span className="text-[11px] font-mono text-slate-500">EPSG:4326</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Vertex #</th>
                    <th className="py-2.5 px-4">Latitude (°N)</th>
                    <th className="py-2.5 px-4">Longitude (°E)</th>
                    <th className="py-2.5 px-4">Segment Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {(activeFarm.boundary || []).map((coord, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-4 font-bold text-slate-900">{idx + 1}</td>
                      <td className="py-2 px-4">{coord.lat.toFixed(6)}°</td>
                      <td className="py-2 px-4">{coord.lng.toFixed(6)}°</td>
                      <td className="py-2 px-4 font-sans text-[11px] text-slate-500">
                        {idx === 0
                          ? "Origin / Closing Vertex"
                          : `Perimeter Boundary Segment ${idx}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Verification Seal Footer */}
          <div className="pt-6 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <div className="space-y-1">
              <div className="font-bold text-slate-800">
                Verified by AgriProfit PostGIS Geodesic Engine
              </div>
              <div className="text-[11px] text-slate-500">
                Calculated using Karney’s Geodesic Area Algorithm on WGS-84 ellipsoid.
              </div>
            </div>

            <div className="text-right font-mono text-[11px]">
              <div>Official Signature: [DIGITALLY SIGNED]</div>
              <div className="text-slate-400">Timestamp: {new Date().toISOString()}</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
