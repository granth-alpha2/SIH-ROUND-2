"use client";

import React, { useState } from "react";
import { MarketplaceUserRole } from "@/lib/marketplace-types";

type BilateralStationClearanceProps = {
  stationType: "government" | "exporter";
  onAuthorized: () => void;
};

const DEMO_OFFICERS = [
  {
    name: "Officer S. Sharma",
    phone: "9876500001",
    designation: "Food Corporation of India (FCI) · Mandi In-Charge",
    badge: "FCI-PB-994",
    center: "Khanna Grain Hub / Doraha Silo (#PB-LDH-01)",
    role: "government_buyer" as MarketplaceUserRole,
  },
  {
    name: "Inspector R. K. Verma",
    phone: "9876500002",
    designation: "State Civil Supplies (PUNGRAIN) · Chief Weighbridge Inspector",
    badge: "PUNG-LDH-042",
    center: "Ludhiana Central Mandi Yard (#PB-LDH-02)",
    role: "government_buyer" as MarketplaceUserRole,
  },
];

const DEMO_EXPORTERS = [
  {
    name: "Sun Agri Exports Pvt Ltd",
    phone: "9876500005",
    designation: "APEDA Verified Agricultural Exporter (Category-A)",
    badge: "APEDA/2023/DEL/9981",
    center: "Middle East & EU Trade Desk",
    role: "exporter" as MarketplaceUserRole,
  },
  {
    name: "Bharat Global Trade Hub",
    phone: "9876500006",
    designation: "Directorate General of Foreign Trade (DGFT) Licensed",
    badge: "IEC: 0519928341",
    center: "Nhava Sheva Port Export Terminal",
    role: "exporter" as MarketplaceUserRole,
  },
];

export default function BilateralStationClearance({
  stationType,
  onAuthorized,
}: BilateralStationClearanceProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual login states
  const [customPhone, setCustomPhone] = useState(stationType === "government" ? "9876500001" : "9876500005");
  const [customOtp, setCustomOtp] = useState("123456");
  const [customName, setCustomName] = useState(stationType === "government" ? "Officer S. Sharma" : "Sun Agri Exports");

  const profiles = stationType === "government" ? DEMO_OFFICERS : DEMO_EXPORTERS;
  const isGovt = stationType === "government";

  async function executeAuthorize(phone: string, otp: string, name: string, role: MarketplaceUserRole) {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Dispatch send-otp to seed cache
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      }).catch(() => null);

      // 2. Direct bilateral authorization via OTP verification endpoint
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          otp,
          name,
          role,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Station clearance verified for ${name}. Opening workstation...`);
        onAuthorized();
        setTimeout(() => {
          window.location.reload();
        }, 400);
      } else {
        setError(data?.error?.message || "Failed to establish bilateral station session.");
      }
    } catch {
      setError("Network error while connecting to bilateral authorization gateway.");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickAuthorize(profile: (typeof profiles)[0]) {
    executeAuthorize(profile.phone, "123456", profile.name, profile.role);
  }

  function handleManualLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!customPhone || customPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!customOtp || customOtp.length < 4) {
      setError("Please enter a valid OTP code (or default demo key 123456).");
      return;
    }
    const role: MarketplaceUserRole = isGovt ? "government_buyer" : "exporter";
    executeAuthorize(customPhone, customOtp, customName, role);
  }

  return (
    <div className="max-w-2xl mx-auto my-6 p-6 sm:p-8 bg-white border-2 border-slate-300 rounded-3xl shadow-xl space-y-6 font-sans">
      {/* Official National Emblem & Security Header */}
      <div className="text-center space-y-2 border-b border-slate-200 pb-5">
        <div className="text-4xl">{isGovt ? "🏛️" : "🚢"}</div>
        <div className="space-y-1">
          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
            isGovt
              ? "bg-sky-100 text-sky-900 border-sky-300"
              : "bg-indigo-100 text-indigo-900 border-indigo-300"
          }`}>
            🔒 Bilateral Secure Workstation Clearance
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isGovt
              ? "Government Procurement Officer Terminal"
              : "APEDA Exporter Trade Terminal"}
          </h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
            {isGovt
              ? "This window is isolated from public farmer listings to ensure tamper-proof Mandi gate verification, UIDAI iris biometric authentication, and PFMS DBT fund disbursements."
              : "Restricted international trade portal for APEDA-registered export houses, containerized aggregate buying, and foreign trade realization settlements."}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1-Tap Bilateral Authorization Profiles for SIH Demo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            Method 1: Instant 1-Click Station Clearance
          </span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            SIH Demo Master Key Pre-Configured
          </span>
        </div>

        <div className="space-y-3">
          {profiles.map((p) => (
            <div
              key={p.phone}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-wrap items-center justify-between gap-3 ${
                isGovt
                  ? "bg-slate-50 hover:bg-sky-50/50 border-slate-200 hover:border-sky-500"
                  : "bg-slate-50 hover:bg-indigo-50/50 border-slate-200 hover:border-indigo-500"
              }`}
            >
              <div className="space-y-1 max-w-sm">
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-black text-slate-900">{p.name}</strong>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-700">
                    {p.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">{p.designation}</p>
                <p className="text-[11px] text-slate-400 font-medium">Station: {p.center}</p>
              </div>

              <button
                type="button"
                onClick={() => handleQuickAuthorize(p)}
                disabled={loading}
                className={`px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50 ${
                  isGovt
                    ? "bg-[#0b4d75] hover:bg-[#083754] text-white"
                    : "bg-indigo-700 hover:bg-indigo-800 text-white"
                }`}
              >
                <span>🔑</span>
                <span>{loading ? "Verifying..." : `Authorize as ${p.name.split(" ")[0]}`}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Method 2: Manual Phone & OTP Authentication */}
      <div className="border-t border-slate-200 pt-5 space-y-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-700">
          Method 2: Custom Station Login (Phone & OTP)
        </span>
        <form onSubmit={handleManualLogin} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                Officer / Organization Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Officer S. Sharma"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                Registered Mobile Number
              </label>
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="space-y-1 flex-1 min-w-[150px]">
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                Security OTP Code (Demo Key: 123456)
              </label>
              <input
                type="text"
                value={customOtp}
                onChange={(e) => setCustomOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 font-mono tracking-widest"
              />
            </div>

            <div className="self-end">
              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                  isGovt ? "bg-emerald-700 hover:bg-emerald-800" : "bg-indigo-700 hover:bg-indigo-800"
                }`}
              >
                {loading ? "Authenticating..." : "Login to Terminal ➔"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">
          💻 Dual-Laptop Showcase Setup:
        </p>
        <p className="text-[11px] text-slate-500">
          <strong>Laptop 1 (Farmer):</strong> Open <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/marketplace/msp</code> to view layered application milestones & 12-digit gate pass.
          <br />
          <strong>Laptop 2 (Govt Officer):</strong> Open <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/marketplace/government</code>, authorize as Officer Sharma, and execute gate verification.
        </p>
      </div>
    </div>
  );
}
