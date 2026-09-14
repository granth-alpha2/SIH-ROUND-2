"use client";

import React, { useState, useEffect } from "react";
import AppShell from "../../components/AppShell";
import MarketplaceNavHeader from "../components/MarketplaceNavHeader";
import ExportOpportunitiesBoard from "../components/ExportOpportunitiesBoard";
import BilateralStationClearance from "../components/BilateralStationClearance";
import { MarketplaceUserRole } from "@/lib/marketplace-types";

export default function ExportPage() {
  const [currentRole, setCurrentRole] = useState<MarketplaceUserRole>("exporter");
  const [isAuthorizedExporter, setIsAuthorizedExporter] = useState(false);
  const [exporterName, setExporterName] = useState("Sun Agri Exports (APEDA)");
  const [checkingAuth, setCheckingAuth] = useState(true);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          if (json.user.role === "exporter") {
            setIsAuthorizedExporter(true);
            setExporterName(json.user.name || "Sun Agri Exports (APEDA)");
          } else {
            setIsAuthorizedExporter(false);
          }
        }
      }
    } catch {
    } finally {
      setCheckingAuth(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AppShell pageTitle="Export Opportunities & Exporter Directory">
      <div className="space-y-6">
        <MarketplaceNavHeader
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
        />

        {checkingAuth ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="text-3xl">⏳</div>
            <p className="text-sm font-bold text-slate-700">Verifying APEDA Trade Gateway Clearance...</p>
            <p className="text-xs text-slate-400">Authenticating licensed agricultural export desk</p>
          </div>
        ) : !isAuthorizedExporter ? (
          <BilateralStationClearance
            stationType="exporter"
            onAuthorized={() => {
              setIsAuthorizedExporter(true);
              checkAuth();
            }}
          />
        ) : (
          <>
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded font-black text-[10px] uppercase">
                    🚢 APEDA LICENSED EXPORT DESK
                  </span>
                  <span className="text-xs text-indigo-200 font-mono font-bold">Category-A Exporter</span>
                </div>
                <h1 className="text-xl font-black">International Agri-Export & Farmer Aggregation Terminal</h1>
                <p className="text-xs text-slate-300">
                  Operating as <strong>{exporterName}</strong> · Direct container matching against 10-country international trade benchmarks.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm">
                  ● Global Signals Connected
                </span>
                <button
                  type="button"
                  onClick={() => setIsAuthorizedExporter(false)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all cursor-pointer"
                >
                  Switch Exporter
                </button>
              </div>
            </div>

            <ExportOpportunitiesBoard />
          </>
        )}
      </div>
    </AppShell>
  );
}
