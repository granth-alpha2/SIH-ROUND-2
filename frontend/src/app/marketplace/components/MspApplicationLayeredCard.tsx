"use client";

import React, { useState } from "react";
import { MspProcurementRequest, ProcurementReceipt } from "@/lib/marketplace-types";

type MspApplicationLayeredCardProps = {
  request: MspProcurementRequest;
  onViewReceipt?: (receipt: ProcurementReceipt) => void;
};

export default function MspApplicationLayeredCard({
  request: r,
  onViewReceipt,
}: MspApplicationLayeredCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopyCode() {
    if (!r.authorizationCode) return;
    navigator.clipboard.writeText(r.authorizationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // Calculate step progress percentage
  const isPending = r.status === "PENDING" || r.status === "UNDER_REVIEW";
  const isApproved = r.status === "APPROVED" || r.status === "CODE_GENERATED";
  const isBioVerified = r.status === "BIOMETRIC_VERIFIED";
  const isWeighed = r.status === "WEIGHED";
  const isCompleted = r.status === "COMPLETED";

  const stepNumber = isCompleted ? 5 : isWeighed ? 4 : isBioVerified ? 3 : isApproved ? 2 : 1;
  const progressPct = (stepNumber / 5) * 100;

  return (
    <div className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl shadow-sm overflow-hidden transition-all space-y-0 font-sans">
      {/* ========================================================================= */}
      {/* LAYER 1: Header Identity & Geospatial Parcel Allocation                   */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-emerald-50/40 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-base font-bold shadow-xs">
              🌾
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {r.cropName} <span className="text-xs font-semibold text-slate-500">({r.cropGrade || "FAQ Grade-A"})</span>
            </h3>
            <span className="px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded-md font-mono text-[11px] font-bold">
              ID: {r.id}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
            <span className="flex items-center gap-1 font-semibold text-emerald-800">
              <span>🏛️ Mandi Center:</span> {r.procurementCenterName || "FCI Central Grain Silo & Mandi Yard"}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 font-semibold text-slate-600">
              <span>📍 PostGIS Parcel:</span> {r.farmName || "Parcel PB-LUD-2024-001 (4.2 Ha)"}
            </span>
          </div>
        </div>

        {/* State Pill & Submitted Time */}
        <div className="text-right space-y-1 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase border ${
              isCompleted
                ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                : isBioVerified
                ? "bg-purple-100 text-purple-900 border-purple-300"
                : isApproved
                ? "bg-sky-100 text-sky-900 border-sky-300 ring-2 ring-sky-300"
                : "bg-amber-100 text-amber-900 border-amber-300 animate-pulse"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            {isCompleted
              ? "✓ Disbursed & Settled"
              : isBioVerified
              ? "👁️ Biometric Verified"
              : isApproved
              ? "● Approved · Security Code Ready"
              : "⏳ Awaiting Officer Review"}
          </span>
          <p className="text-[11px] text-slate-400 font-medium">
            Submitted: {new Date(r.createdAt).toLocaleDateString("en-IN")} at {new Date(r.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAYER 2: 5-Stage Step-by-Step Visual Timeline (Milestone Progress Bar)    */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 bg-white border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black uppercase tracking-wider text-slate-500 text-[10px]">
            Statutory Procurement Journey · Milestone Progress ({stepNumber} of 5 Complete)
          </span>
          <span className="font-black text-emerald-700 text-xs">{progressPct}% Settled</span>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 via-sky-600 to-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* 5 Distinct Milestone Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
          {/* Milestone 1 */}
          <div className="p-2.5 rounded-xl border bg-emerald-50 border-emerald-200 space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-[11px]">
              <span>✓</span>
              <span>1. Application</span>
            </div>
            <p className="text-[10px] text-emerald-700 font-medium leading-tight">
              Crop declared & GIS parcel bound
            </p>
          </div>

          {/* Milestone 2 */}
          <div
            className={`p-2.5 rounded-xl border space-y-0.5 ${
              isApproved || isBioVerified || isWeighed || isCompleted
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-amber-50 border-amber-300 text-amber-900 animate-pulse"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-[11px]">
              <span>{isApproved || isBioVerified || isWeighed || isCompleted ? "✓" : "⏳"}</span>
              <span>2. Officer Review</span>
            </div>
            <p className="text-[10px] text-slate-600 font-medium leading-tight">
              {isApproved || isBioVerified || isWeighed || isCompleted
                ? "Approved by Mandi In-Charge"
                : "In Officer Queue (Laptop 2)"}
            </p>
          </div>

          {/* Milestone 3 */}
          <div
            className={`p-2.5 rounded-xl border space-y-0.5 ${
              r.authorizationCode
                ? "bg-sky-50 border-sky-300 text-sky-950 font-bold"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-[11px]">
              <span>{r.authorizationCode ? "🔑" : "⏳"}</span>
              <span>3. 12-Digit Pass</span>
            </div>
            <p className="text-[10px] text-slate-600 font-medium leading-tight">
              {r.authorizationCode ? "Generated & Active" : "Pending Officer Approval"}
            </p>
          </div>

          {/* Milestone 4 */}
          <div
            className={`p-2.5 rounded-xl border space-y-0.5 ${
              isBioVerified || isWeighed || isCompleted
                ? "bg-purple-50 border-purple-200 text-purple-900 font-bold"
                : isApproved
                ? "bg-amber-50/70 border-amber-200 text-amber-900"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-[11px]">
              <span>{isBioVerified || isWeighed || isCompleted ? "✓" : "👁️"}</span>
              <span>4. UIDAI Iris Scan</span>
            </div>
            <p className="text-[10px] text-slate-600 font-medium leading-tight">
              {isBioVerified || isWeighed || isCompleted
                ? "Biometric Matched 99.4%"
                : "Present pass at Mandi Gate"}
            </p>
          </div>

          {/* Milestone 5 */}
          <div
            className={`p-2.5 rounded-xl border space-y-0.5 ${
              isCompleted
                ? "bg-emerald-600 text-white font-black"
                : isBioVerified || isWeighed
                ? "bg-sky-50 border-sky-300 text-sky-900"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-[11px]">
              <span>{isCompleted ? "✓" : "⚖️"}</span>
              <span>5. Weigh & DBT</span>
            </div>
            <p className={`text-[10px] font-medium leading-tight ${isCompleted ? "text-emerald-100" : "text-slate-500"}`}>
              {isCompleted ? "₹" + (r.finalPayoutInr?.toLocaleString("en-IN") || "") + " Disbursed" : "Weighbridge Tare/Gross"}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAYER 3: Official 12-Digit Security Pass (Displayed Once Approved)        */}
      {/* ========================================================================= */}
      {r.authorizationCode && (
        <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-900 to-[#0b4d75] text-white border-b border-indigo-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                  Official Mandi Entry Pass · Ministry of Agriculture
                </span>
                <h4 className="text-sm font-black text-white">
                  12-Digit One-Time Transaction Authorization Code
                </h4>
              </div>
            </div>
            <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black rounded-full text-[10px] uppercase">
              Single-Use Security Lock Active
            </span>
          </div>

          <div className="bg-slate-950/70 border-2 border-indigo-400/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
                Your Official Verification Code (Show to Officer on Laptop 2):
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-black text-amber-300 tracking-[0.25em]">
                {r.authorizationCode.slice(0, 4)} {r.authorizationCode.slice(4, 8)} {r.authorizationCode.slice(8, 12)}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>{copied ? "✓" : "📋"}</span>
              <span>{copied ? "Code Copied!" : "Copy 12-Digit Code"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-indigo-200">
            <span>🛡️</span>
            <p className="text-[11px] leading-relaxed">
              <strong>Mandi Gate Instructions:</strong> Present this code at <strong>{r.procurementCenterName}</strong>. The procurement officer on <strong>Laptop 2</strong> will validate this code and perform your UIDAI eye iris scan before weighbridge tare/gross calculation.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LAYER 4: Financial Valuation & Settlement Metrics Matrix                  */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 bg-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b border-slate-200">
        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Declared Quantity:</span>
          <div className="text-lg font-black text-slate-900 font-mono">
            {r.requestedQuantityQuintals} <span className="text-xs font-bold text-slate-500">Quintals</span>
          </div>
          <span className="text-[10px] text-slate-400 block">{r.requestedQuantityQuintals * 100} kg net produce</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Statutory CACP MSP:</span>
          <div className="text-lg font-black text-emerald-700 font-mono">
            ₹{r.officialMspRateInr} <span className="text-xs font-bold text-slate-500">/quintal</span>
          </div>
          <span className="text-[10px] text-emerald-600 block">✓ Floor Price Protected</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Guaranteed Gross Value:</span>
          <div className="text-lg font-black text-slate-900 font-mono">
            ₹{r.estimatedGrossPayoutInr.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-400 block">Based on declared volume</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Final Disbursed Payout:</span>
          <div className="text-lg font-black font-mono text-emerald-800">
            {isCompleted && r.finalPayoutInr ? (
              `₹${r.finalPayoutInr.toLocaleString("en-IN")}`
            ) : (
              <span className="text-xs text-amber-700 font-bold">Pending Weighment</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block">
            {isCompleted ? "Paid via PFMS DBT" : "Calculated on scale"}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAYER 5: Contextual Action Strip & Receipt Modal CTA                      */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="text-base">{isCompleted ? "🎉" : isBioVerified ? "👁️" : isApproved ? "🚚" : "🕒"}</span>
          <p className="text-xs text-slate-700 font-medium leading-tight">
            {isCompleted ? (
              <span>
                <strong>Procurement complete!</strong> Payment has been credited to your bank account under PFMS DBT.
              </span>
            ) : isBioVerified ? (
              <span>
                <strong>Biometric verified at Mandi Gate!</strong> Truck is currently entering the electronic weighbridge.
              </span>
            ) : isApproved ? (
              <span>
                <strong>Ready for dispatch!</strong> Take your grain to <strong>{r.procurementCenterName}</strong> with code <strong>{r.authorizationCode}</strong>.
              </span>
            ) : (
              <span>
                <strong>Awaiting clearance:</strong> Request is in the Mandi Officer queue on <strong>Laptop 2</strong> for PostGIS parcel & document review.
              </span>
            )}
          </p>
        </div>

        {isCompleted && onViewReceipt && (
          <button
            type="button"
            onClick={() => {
              onViewReceipt({
                receiptNumber: `REC-${r.id.slice(-8).toUpperCase()}`,
                transactionId: r.paymentId || `TX-${r.id.slice(-8).toUpperCase()}`,
                farmerName: r.farmerName,
                farmerId: r.farmerId,
                procurementCenter: r.procurementCenterName,
                officerName: r.reviewedByOfficerName || "S. Sharma (FCI)",
                cropName: r.cropName,
                grade: r.cropGrade || "Fair Average Quality (FAQ)",
                requestedQuantityQuintals: r.requestedQuantityQuintals,
                actualWeighedQuantityQuintals: r.actualWeighedQuantityQuintals || r.requestedQuantityQuintals,
                mspRatePerQuintal: r.officialMspRateInr,
                grossAmountInr: r.finalPayoutInr || r.estimatedGrossPayoutInr,
                authorizationCodeUsed: r.authorizationCode || "MSP-VERIFIED",
                biometricVerificationStatus: "VERIFIED_DEMO_UIDAI_IRIS",
                paymentStatus: "PAID",
                paymentId: r.paymentId || "PFMS-DBT-DISBURSED",
                timestamp: r.updatedAt || new Date().toISOString(),
                cryptographicSignature: `SHA256:4f9b2d...${r.id.slice(-6)}...govt-seal`,
              });
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>📄</span>
            <span>View Official Cryptographic Receipt</span>
          </button>
        )}
      </div>
    </div>
  );
}

