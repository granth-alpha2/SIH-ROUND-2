"use client";

import React, { useState, useEffect } from "react";
import AppShell from "../../components/AppShell";
import MarketplaceNavHeader from "../components/MarketplaceNavHeader";
import GovernmentProcurementTerminal from "../components/GovernmentProcurementTerminal";
import ProcurementReceiptModal from "../components/ProcurementReceiptModal";
import BilateralStationClearance from "../components/BilateralStationClearance";
import { MarketplaceUserRole, ProcurementReceipt } from "@/lib/marketplace-types";

export default function GovernmentProcurementPage() {
  const [currentRole, setCurrentRole] = useState<MarketplaceUserRole>("government_buyer");
  const [viewingReceipt, setViewingReceipt] = useState<ProcurementReceipt | null>(null);
  const [isAuthorizedGovt, setIsAuthorizedGovt] = useState(false);
  const [officerName, setOfficerName] = useState("Officer S. Sharma");
  const [checkingAuth, setCheckingAuth] = useState(true);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          if (json.user.role === "government_buyer") {
            setIsAuthorizedGovt(true);
            setOfficerName(json.user.name || "Officer S. Sharma");
          } else {
            setIsAuthorizedGovt(false);
          }
        } else {
          setIsAuthorizedGovt(false);
        }
      } else {
        setIsAuthorizedGovt(false);
      }
    } catch {
      setIsAuthorizedGovt(false);
    } finally {
      setCheckingAuth(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setIsAuthorizedGovt(false);
  }

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AppShell pageTitle="Government Procurement Officer Station">
      <div className="space-y-6">
        <MarketplaceNavHeader
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
        />

        {checkingAuth ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="text-3xl">⏳</div>
            <p className="text-sm font-bold text-slate-700">Verifying Mandi Station Security Clearance...</p>
            <p className="text-xs text-slate-400">Authenticating FCI procurement officer terminal credentials</p>
          </div>
        ) : !isAuthorizedGovt ? (
          <BilateralStationClearance
            stationType="government"
            onAuthorized={() => {
              setIsAuthorizedGovt(true);
              checkAuth();
            }}
          />
        ) : (
          <>
            <div className="bg-[#0b4d75] text-white rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded font-black text-[10px] uppercase">
                    🔒 RESTRICTED GOVERNMENT TERMINAL
                  </span>
                  <span className="text-xs text-amber-200 font-mono font-bold">Station ID: PB-LDH-01</span>
                </div>
                <h1 className="text-xl font-black">Food Corporation of India (FCI) Procurement Console</h1>
                <p className="text-xs text-slate-200">
                  Logged in as <strong>{officerName}</strong> · Authorized for MSP Gate Verification, UIDAI Iris Scanning & Weighbridge Intake.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm">
                  ● Mandi Gate Online
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>🔒</span>
                  <span>Lock & Sign Out</span>
                </button>
              </div>
            </div>

            <GovernmentProcurementTerminal
              onViewReceipt={(receipt) => setViewingReceipt(receipt)}
            />
          </>
        )}

        <ProcurementReceiptModal
          receipt={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      </div>
    </AppShell>
  );
}
