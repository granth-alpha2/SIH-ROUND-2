"use client";

import React from "react";
import { ProcurementReceipt } from "@/lib/marketplace-types";

type ReceiptModalProps = {
  receipt: ProcurementReceipt | null;
  onClose: () => void;
};

export default function ProcurementReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-300 max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 font-sans">
        {/* National Emblem & Receipt Header */}
        <div className="text-center border-b pb-4 space-y-1">
          <div className="text-2xl">🏛️</div>
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
            Government of India — Ministry of Agriculture & Farmers Welfare
          </h2>
          <p className="text-xs text-slate-600 font-bold">
            National Agricultural Minimum Support Price (MSP) Procurement Receipt
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
            <span>Receipt No: <strong>{receipt.receiptNumber}</strong></span>
            <span>•</span>
            <span>Tx: <strong>{receipt.transactionId}</strong></span>
          </div>
        </div>

        {/* Receipt Key Metrics */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold">Farmer Name:</span>
              <strong className="text-slate-900 text-sm font-black">{receipt.farmerName}</strong>
              <span className="text-slate-500 block text-[10px]">ID: {receipt.farmerId}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold">Procurement Agency & Center:</span>
              <strong className="text-slate-900 font-bold">{receipt.procurementCenter}</strong>
              <span className="text-slate-500 block text-[10px]">Officer: {receipt.officerName}</span>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3 grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold">Commodity & Grade:</span>
              <strong className="text-emerald-800 font-black">{receipt.cropName}</strong>
              <span className="text-slate-600 block text-[11px]">Grade: {receipt.grade}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold">12-Digit Authorization Used:</span>
              <strong className="text-indigo-800 font-mono font-black">{receipt.authorizationCodeUsed}</strong>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3 grid grid-cols-3 gap-2">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Requested:</span>
              <strong className="text-slate-700">{receipt.requestedQuantityQuintals} q</strong>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-emerald-800 font-semibold block">Actual Weighed:</span>
              <strong className="text-emerald-900 font-black">{receipt.actualWeighedQuantityQuintals} q</strong>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">MSP Rate:</span>
              <strong className="text-slate-900">₹{receipt.mspRatePerQuintal}/q</strong>
            </div>
          </div>

          {/* Gross Payout */}
          <div className="p-3 bg-emerald-700 text-white rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">
                Total Net Realization (DBT / PFMS)
              </span>
              <div className="text-2xl font-black tracking-tight">
                ₹{receipt.grossAmountInr.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="px-2 py-0.5 bg-emerald-800 text-emerald-200 rounded font-black text-[10px] uppercase">
                {receipt.paymentStatus}
              </span>
              <div className="text-[10px] text-emerald-100 mt-1 font-mono">{receipt.paymentId}</div>
            </div>
          </div>
        </div>

        {/* Verification Provenance & Cryptographic Signature */}
        <div className="text-[10px] text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span>Biometric Status: <strong>{receipt.biometricVerificationStatus}</strong></span>
            <span>Date: {new Date(receipt.timestamp).toLocaleString("en-IN")}</span>
          </div>
          <div className="truncate font-mono text-[9px] text-slate-400">
            Hash: {receipt.cryptographicSignature}
          </div>
          <div className="text-amber-800 bg-amber-50 p-1.5 rounded text-[10px] font-semibold">
            Notice: Generated under Smart India Hackathon (SIH2026) Demonstration Architecture. Direct Benefit Transfer is simulated in demo mode.
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

