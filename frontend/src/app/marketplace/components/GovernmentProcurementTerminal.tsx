"use client";

import React, { useState, useEffect } from "react";
import { MspProcurementRequest, ProcurementReceipt } from "@/lib/marketplace-types";

type GovernmentTerminalProps = {
  onRequestUpdated?: () => void;
  onViewReceipt?: (receipt: ProcurementReceipt) => void;
};

export default function GovernmentProcurementTerminal({
  onRequestUpdated,
  onViewReceipt,
}: GovernmentTerminalProps) {
  const [requests, setRequests] = useState<MspProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Procurement Terminal Station States
  const [authCodeInput, setAuthCodeInput] = useState("");
  const [verifiedRequest, setVerifiedRequest] = useState<MspProcurementRequest | null>(null);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [verifyingBio, setVerifyingBio] = useState(false);
  const [bioResultMsg, setBioResultMsg] = useState<string | null>(null);

  const [actualWeighedQuantity, setActualWeighedQuantity] = useState<number>(33.7);
  const [completingProcurement, setCompletingProcurement] = useState(false);
  const [terminalMsg, setTerminalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active review modal state
  const [selectedReq, setSelectedReq] = useState<MspProcurementRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadRequests() {
    try {
      const res = await fetch("/api/marketplace/msp/requests");
      if (res.ok) {
        const json = await res.json();
        setRequests(json.requests || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
    const interval = setInterval(() => {
      loadRequests();
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // 1. Approve MSP Request
  async function handleApprove(requestId: string) {
    setActionLoading(true);
    setTerminalMsg(null);
    try {
      const res = await fetch("/api/marketplace/msp/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTerminalMsg({
          type: "success",
          text: `✓ Approved! 12-Digit Authorization Code generated: ${data.codeRecord?.code}`,
        });
        await loadRequests();
        if (onRequestUpdated) onRequestUpdated();
        setSelectedReq(null);
      } else {
        setTerminalMsg({ type: "error", text: data.error?.message || "Failed to approve." });
      }
    } catch {
      setTerminalMsg({ type: "error", text: "Network error during approval." });
    } finally {
      setActionLoading(false);
    }
  }

  // 2. Reject MSP Request
  async function handleReject(requestId: string) {
    const reason = prompt("Enter official rejection reason:", "Grain moisture exceeds permissible limits (14%)");
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/marketplace/msp/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, reason }),
      });
      if (res.ok) {
        await loadRequests();
        if (onRequestUpdated) onRequestUpdated();
        setSelectedReq(null);
      }
    } catch {} finally {
      setActionLoading(false);
    }
  }

  // 3. Verify 12-Digit Code at Procurement Terminal
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setTerminalMsg(null);
    setVerifiedRequest(null);
    setBiometricVerified(false);
    setBioResultMsg(null);

    const clean = authCodeInput.trim();
    if (clean.length !== 12) {
      setTerminalMsg({ type: "error", text: "Enter the complete 12-digit numeric authorization code." });
      return;
    }

    try {
      const res = await fetch("/api/marketplace/msp/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVerifiedRequest(data.request);
        setActualWeighedQuantity(data.request.requestedQuantityQuintals);
        setTerminalMsg({
          type: "success",
          text: `✓ Authorization Code Validated. Farmer: ${data.request.farmerName} · Crop: ${data.request.cropName}`,
        });
      } else {
        setTerminalMsg({ type: "error", text: data.error?.message || "Code verification failed." });
      }
    } catch {
      setTerminalMsg({ type: "error", text: "Network error checking authorization code." });
    }
  }

  // 4. Perform Biometric Verification (Demo Adapter)
  async function handleBiometricVerification() {
    if (!verifiedRequest) return;
    setVerifyingBio(true);
    setBioResultMsg(null);

    try {
      const res = await fetch("/api/marketplace/msp/biometric/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: verifiedRequest.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBiometricVerified(true);
        setBioResultMsg("✓ Eye biometric verified successfully (Demo Provider: UIDAI Iris Adapter v1.2)");
      } else {
        setBioResultMsg("❌ Biometric verification could not be completed.");
      }
    } catch {
      setBioResultMsg("Network error during biometric scan.");
    } finally {
      setVerifyingBio(false);
    }
  }

  // 5. Complete Procurement with Weighed Quantity
  async function handleCompleteProcurement() {
    if (!verifiedRequest || !biometricVerified) return;
    if (actualWeighedQuantity <= 0) {
      alert("Actual weighed quantity must be positive.");
      return;
    }

    setCompletingProcurement(true);
    try {
      const res = await fetch("/api/marketplace/msp/procure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: authCodeInput.trim(),
          actualWeighedQuantityQuintals: actualWeighedQuantity,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTerminalMsg({
          type: "success",
          text: `✓ Procurement finalized! Gross Payout: ₹${data.receipt.grossAmountInr.toLocaleString("en-IN")} · Payment ID: ${data.receipt.paymentId}`,
        });
        if (onViewReceipt && data.receipt) {
          onViewReceipt(data.receipt);
        }
        // Reset terminal state
        setAuthCodeInput("");
        setVerifiedRequest(null);
        setBiometricVerified(false);
        await loadRequests();
        if (onRequestUpdated) onRequestUpdated();
      } else {
        setTerminalMsg({ type: "error", text: data.error?.message || "Procurement failed." });
      }
    } catch {
      setTerminalMsg({ type: "error", text: "Network error during procurement completion." });
    } finally {
      setCompletingProcurement(false);
    }
  }

  const pendingList = requests.filter((r) => r.status === "PENDING" || r.status === "UNDER_REVIEW");
  const approvedList = requests.filter((r) => r.status === "APPROVED" || r.status === "CODE_GENERATED");
  const completedList = requests.filter((r) => r.status === "COMPLETED");

  const totalPayoutCompleted = completedList.reduce((sum, r) => sum + (r.finalPayoutInr || 0), 0);
  const totalQuintalsProcured = completedList.reduce((sum, r) => sum + (r.actualWeighedQuantityQuintals || 0), 0);

  return (
    <div className="space-y-6">
      {/* Live Mandi Sync Bar */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm border border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
            🟢 Mandi Real-Time Queue Synchronizer Active
          </span>
          <span className="hidden md:inline text-xs text-slate-400">
            Syncs MSP applications submitted across laptops every 3.5s
          </span>
        </div>
        <button
          type="button"
          onClick={() => loadRequests()}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>🔄</span>
          <span>Refresh Queue Now</span>
        </button>
      </div>

      {/* 1. Procurement Officer Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Pending Applications</span>
          <div className="text-2xl font-black text-amber-700">{pendingList.length}</div>
          <p className="text-[10px] text-slate-500 font-semibold">Requires verification & approval</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Approved Codes Active</span>
          <div className="text-2xl font-black text-[#0b4d75]">{approvedList.length}</div>
          <p className="text-[10px] text-slate-500 font-semibold">12-Digit codes awaiting arrival</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Procured Quantity</span>
          <div className="text-2xl font-black text-emerald-700">{totalQuintalsProcured.toFixed(1)} q</div>
          <p className="text-[10px] text-slate-500 font-semibold">Weighed grain accepted at center</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Govt Payout Generated</span>
          <div className="text-2xl font-black text-slate-900">₹{totalPayoutCompleted.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-slate-500 font-semibold">Demo PFMS / DBT Disbursed</p>
        </div>
      </div>

      {terminalMsg && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold ${
            terminalMsg.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          {terminalMsg.text}
        </div>
      )}

      {/* 2. Procurement Center Weighing & Verification Terminal Station (Prompts 14, 15, 16) */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-5 border border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-lg">
              📟
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Govt Center On-Site Procurement & Weighing Terminal
              </h2>
              <p className="text-xs text-slate-400">
                FCI Silo Doraha Center #PB-LDH-01 • 12-Digit Code Check · Biometric Scan · Weighbridge Entry
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-900/60 text-emerald-300 border border-emerald-600/40 rounded-full text-[10px] font-bold">
            ● Weighbridge Scale Connected
          </span>
        </div>

        {/* Step A: Enter 12-Digit Code */}
        <form onSubmit={handleVerifyCode} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Enter Farmer's 12-Digit One-Time Transaction Code
            </label>
            <input
              type="text"
              maxLength={12}
              value={authCodeInput}
              onChange={(e) => setAuthCodeInput(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 849201938472 (12 numeric digits)"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-base font-mono font-black text-amber-300 tracking-widest placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
            >
              Verify Code
            </button>
          </div>
        </form>

        {/* Step B: Code Verified Panel */}
        {verifiedRequest && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Farmer Name:</span>
                <strong className="text-white font-black text-sm">{verifiedRequest.farmerName}</strong>
                <span className="text-slate-400 block text-[11px]">Phone: {verifiedRequest.farmerPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Crop & Grade:</span>
                <strong className="text-emerald-400 font-bold">{verifiedRequest.cropName}</strong>
                <span className="text-slate-400 block text-[11px]">{verifiedRequest.cropGrade}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Requested Quantity:</span>
                <strong className="text-white font-bold">{verifiedRequest.requestedQuantityQuintals} q</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Official Locked MSP:</span>
                <strong className="text-emerald-400 font-black text-sm">₹{verifiedRequest.officialMspRateInr} /q</strong>
              </div>
            </div>

            {/* Step C: Biometric Verification Adapter Step (Prompt 10) */}
            <div className="p-3.5 bg-slate-900 border border-slate-700 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">👁️</span>
                  <span className="font-bold text-xs text-slate-200">
                    Mandatory Identity Verification (Biometric Verification — Demo)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Secure Eye Biometric UIDAI Iris Emulation. Safe architectural adapter (No raw biometrics stored).
                </p>
                {bioResultMsg && (
                  <p className={`text-xs font-bold mt-1 ${biometricVerified ? "text-emerald-400" : "text-rose-400"}`}>
                    {bioResultMsg}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleBiometricVerification}
                disabled={verifyingBio || biometricVerified}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  biometricVerified
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-[#0b4d75] hover:bg-[#083754] text-white shadow-md"
                }`}
              >
                {verifyingBio ? (
                  <span>Scanning Iris...</span>
                ) : biometricVerified ? (
                  <span>✓ Biometric Verified</span>
                ) : (
                  <span>Verify Biometric (Eye Iris)</span>
                )}
              </button>
            </div>

            {/* Step D: Actual Weighed Quantity Entry (Prompt 15) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-700 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Actual Weighed Quantity (Quintals) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={actualWeighedQuantity}
                  onChange={(e) => setActualWeighedQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-lg font-mono font-black text-emerald-400 focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Requested: {verifiedRequest.requestedQuantityQuintals} q (Weighbridge electronic reading)
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">
                  Re-calculated Final Gross Payout:
                </span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  ₹{Math.round(actualWeighedQuantity * verifiedRequest.officialMspRateInr).toLocaleString("en-IN")}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {actualWeighedQuantity} q × ₹{verifiedRequest.officialMspRateInr}/q
                </span>
              </div>

              <div>
                <button
                  type="button"
                  disabled={!biometricVerified || completingProcurement}
                  onClick={handleCompleteProcurement}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {completingProcurement ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <>
                      <span>⚖️</span>
                      <span>Complete Procurement & Issue Payout</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Government Procurement Queue Table (Prompt 12) */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Procurement Center Application Queue
            </h3>
            <p className="text-xs text-slate-500">
              Review and approve farmer crop declarations for official government MSP purchase
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {requests.length} Total Requests
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Request ID</th>
                <th className="p-3">Farmer Details</th>
                <th className="p-3">Crop & Grade</th>
                <th className="p-3">Requested Qty</th>
                <th className="p-3">Locked MSP</th>
                <th className="p-3">Est. Value</th>
                <th className="p-3">Status</th>
                <th className="p-3">Auth Code</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900">{r.id}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{r.farmerName}</div>
                    <div className="text-[10px] text-slate-500">{r.farmerPhone}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-emerald-800">{r.cropName}</div>
                    <div className="text-[10px] text-slate-500">{r.cropGrade}</div>
                  </td>
                  <td className="p-3 font-bold text-slate-900">
                    {r.requestedQuantityQuintals} q
                  </td>
                  <td className="p-3 font-bold text-emerald-700">
                    ₹{r.officialMspRateInr}/q
                  </td>
                  <td className="p-3 font-black text-slate-900">
                    ₹{r.estimatedGrossPayoutInr.toLocaleString("en-IN")}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        r.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.status === "APPROVED"
                          ? "bg-blue-100 text-blue-800"
                          : r.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-black text-indigo-700">
                    {r.authorizationCode || "—"}
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    {r.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(r.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-[11px] cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(r.id)}
                          disabled={actionLoading}
                          className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-bold text-[11px] cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {(r.status === "APPROVED" || r.status === "CODE_GENERATED") && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthCodeInput(r.authorizationCode || "");
                          setVerifiedRequest(r);
                          setBiometricVerified(false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded font-bold text-[11px] cursor-pointer shadow-sm"
                      >
                        Gate Check-In
                      </button>
                    )}
                    {r.status === "BIOMETRIC_VERIFIED" && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthCodeInput(r.authorizationCode || "");
                          setVerifiedRequest(r);
                          setBiometricVerified(true);
                          setActualWeighedQuantity(r.requestedQuantityQuintals);
                          setBioResultMsg("✓ Biometric iris verification already authenticated on gate pass.");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] cursor-pointer shadow-sm flex items-center gap-1"
                      >
                        <span>⚖️</span>
                        <span>Weighbridge Entry</span>
                      </button>
                    )}
                    {r.status === "WEIGHED" && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthCodeInput(r.authorizationCode || "");
                          setVerifiedRequest(r);
                          setBiometricVerified(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold text-[11px] cursor-pointer shadow-sm"
                      >
                        Disburse DBT
                      </button>
                    )}
                    {r.status === "COMPLETED" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onViewReceipt) {
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
                          }
                        }}
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded font-bold text-[11px] cursor-pointer"
                      >
                        ✓ View Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

