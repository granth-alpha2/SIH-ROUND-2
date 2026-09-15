"use client";

import React, { useState } from "react";
import {
  REGISTERED_GOVERNMENT_OFFICERS,
  REGISTERED_EXPORTERS,
  OfficialOfficerRecord,
  OfficialExporterRecord,
} from "@/lib/official-credentials";

type BilateralStationClearanceProps = {
  stationType: "government" | "exporter";
  onAuthorized: () => void;
};

export default function BilateralStationClearance({
  stationType,
  onAuthorized,
}: BilateralStationClearanceProps) {
  const isGovt = stationType === "government";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(true);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) {
      setError(
        isGovt
          ? "Please enter your Official Government Officer ID / Employee Code."
          : "Please enter your APEDA / DGFT IEC Registration Code."
      );
      return;
    }
    if (!password.trim()) {
      setError("Please enter your Official Security Password.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/portal-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalType: stationType,
          identifier: identifier.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const userName = data.user?.name || (isGovt ? "Officer" : "Exporter");
        setSuccessMsg(`Official Security Clearance Verified. Welcome, ${userName}. Launching console...`);
        setTimeout(() => {
          onAuthorized();
        }, 600);
      } else {
        setError(data?.error?.message || "Authentication failed. Invalid ID or Password.");
      }
    } catch {
      setError("Network error while communicating with the official authentication authority.");
    } finally {
      setLoading(false);
    }
  }

  function handleAutoFillOfficer(officer: OfficialOfficerRecord) {
    setIdentifier(officer.id);
    setPassword(officer.password);
    setError(null);
    setSuccessMsg(null);
  }

  function handleAutoFillExporter(exporter: OfficialExporterRecord) {
    setIdentifier(exporter.id);
    setPassword(exporter.password);
    setError(null);
    setSuccessMsg(null);
  }

  return (
    <div className="max-w-2xl mx-auto my-8 space-y-6 font-sans">
      {/* Official Government / Trade Authority Box */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl shadow-xl overflow-hidden">
        {/* National Header Banner */}
        <div className={`p-6 sm:p-8 text-white ${
          isGovt
            ? "bg-gradient-to-r from-[#0b3b59] via-[#0b4d75] to-[#082a40]"
            : "bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900"
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{isGovt ? "🏛️" : "🚢"}</span>
                <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-md">
                  {isGovt ? "Official Government Terminal" : "APEDA Exporter Gateway"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {isGovt
                  ? "Food Corporation of India (FCI) Procurement Console"
                  : "APEDA & DGFT International Trade Gateway"}
              </h2>
              <p className="text-xs text-slate-200 leading-relaxed max-w-lg">
                {isGovt
                  ? "Ministry of Consumer Affairs, Food & Public Distribution · Official Mandi Procurement, Weighbridge Intake & DBT Disbursement Gateway."
                  : "Directorate General of Foreign Trade · Agricultural & Processed Food Products Export Development Authority Trade Terminal."}
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono text-amber-200 block">
                {isGovt ? "FCI-SECURE-V4" : "DGFT-APEDA-GATEWAY"}
              </span>
              <span className="text-[10px] text-slate-300">256-Bit Encrypted</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-50 border-y border-amber-200 px-6 py-3 flex items-start gap-2.5 text-xs text-amber-900">
          <span className="text-sm shrink-0">⚠️</span>
          <p className="leading-snug">
            <strong>Restricted Access Notice:</strong> Access is permitted solely to authorized{" "}
            {isGovt ? "FCI Mandi Officers & State Civil Supplies Inspectors" : "APEDA-licensed Trade Desks"}
            . Authentication with official registered ID and security password is required.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 text-xs font-bold flex items-start gap-3 animate-in fade-in">
              <span className="text-base shrink-0">🚫</span>
              <div className="space-y-0.5">
                <p className="font-black text-rose-950">AUTHENTICATION REJECTED</p>
                <p className="font-normal text-rose-800">{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 text-xs font-bold flex items-start gap-3 animate-in fade-in">
              <span className="text-base shrink-0">✅</span>
              <div>
                <p className="font-black text-emerald-950">IDENTITY VERIFIED</p>
                <p className="font-normal text-emerald-800">{successMsg}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* ID Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                {isGovt ? "1. Official Officer ID / Employee Code" : "1. APEDA / DGFT IEC Registration Code"}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                  {isGovt ? "🪪" : "📄"}
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={isGovt ? "e.g. FCI-PB-994 or PUNG-LDH-042" : "e.g. IEC-0519928341 or APEDA/2023/DEL/9981"}
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0b4d75] transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {isGovt
                  ? "Enter your gazetted FCI officer identification code or Mandi station ID."
                  : "Enter your 10-digit DGFT Import Export Code (IEC) or APEDA License."}
              </p>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                {isGovt ? "2. Official Security Password / Mandi Key" : "2. Trade Desk Security Password"}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                  🔑
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isGovt ? "Enter Official FCI Security Password" : "Enter Corporate Trade Password"}
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0b4d75] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Encrypted with SHA-256 session tokens. Never share government passwords.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-5 rounded-2xl font-black text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
              isGovt
                ? "bg-[#0b4d75] hover:bg-[#083754] active:scale-[0.99]"
                : "bg-indigo-700 hover:bg-indigo-800 active:scale-[0.99]"
            }`}
          >
            <span>{loading ? "⏳" : "🔒"}</span>
            <span>
              {loading
                ? "Verifying Official Credentials..."
                : isGovt
                ? "Authenticate & Unlock FCI Mandi Terminal"
                : "Verify IEC License & Unlock Trade Desk"}
            </span>
          </button>
        </form>
      </div>

      {/* Official Demo Credentials Reference (For SIH Evaluator & Demonstration Convenience) */}
      <div className="bg-slate-50 border border-slate-300 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Official Registered Directory & Test Credentials
              </h3>
              <p className="text-[11px] text-slate-500">
                Authorized credentials for evaluation and demonstration. Click "Auto-Fill" to test the ID & Password authentication.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowReference(!showReference)}
            className="text-xs font-bold text-[#0b4d75] hover:underline cursor-pointer"
          >
            {showReference ? "Hide Reference" : "Show Reference"}
          </button>
        </div>

        {showReference && (
          <div className="grid gap-3 pt-2">
            {isGovt ? (
              REGISTERED_GOVERNMENT_OFFICERS.map((officer) => (
                <div
                  key={officer.id}
                  className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 hover:border-sky-400 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-black text-slate-900">{officer.name}</strong>
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded text-[10px] font-mono font-bold">
                        ID: {officer.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {officer.designation} · {officer.stationName}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      Password: <span className="text-emerald-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{officer.password}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAutoFillOfficer(officer)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-sky-100 text-[#0b4d75] hover:text-[#083754] rounded-lg text-xs font-bold border border-slate-300 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>Auto-Fill Credentials</span>
                  </button>
                </div>
              ))
            ) : (
              REGISTERED_EXPORTERS.map((exporter) => (
                <div
                  key={exporter.id}
                  className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 hover:border-indigo-400 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-black text-slate-900">{exporter.name}</strong>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded text-[10px] font-mono font-bold">
                        IEC: {exporter.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {exporter.designation} · {exporter.tradeDesk}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      Password: <span className="text-indigo-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{exporter.password}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAutoFillExporter(exporter)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 text-indigo-800 hover:text-indigo-950 rounded-lg text-xs font-bold border border-slate-300 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>Auto-Fill Credentials</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
