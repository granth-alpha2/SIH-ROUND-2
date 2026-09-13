"use client";

import React, { useState, useEffect } from "react";
import AppShell from "../../components/AppShell";
import MarketplaceNavHeader from "../components/MarketplaceNavHeader";
import MspRequestModal from "../components/MspRequestModal";
import ProcurementReceiptModal from "../components/ProcurementReceiptModal";
import MspApplicationLayeredCard from "../components/MspApplicationLayeredCard";
import { MspProcurementRequest, MarketplaceUserRole, ProcurementReceipt } from "@/lib/marketplace-types";

export default function MspSellingPage() {
  const [currentRole, setCurrentRole] = useState<MarketplaceUserRole>("farmer");
  const [requests, setRequests] = useState<MspProcurementRequest[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewingReceipt, setViewingReceipt] = useState<ProcurementReceipt | null>(null);

  async function loadMyRequests() {
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
    loadMyRequests();
    const interval = setInterval(() => {
      loadMyRequests();
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppShell pageTitle="Government MSP Procurement Portal">
      <div className="space-y-6">
        <MarketplaceNavHeader
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
        />

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <span className="px-2.5 py-1 bg-emerald-700 text-emerald-100 rounded-full font-bold text-xs uppercase tracking-wider">
              Statutory Floor Protection
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Sell Grain at Government Minimum Support Price (MSP)
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Assured procurement by Food Corporation of India (FCI), NAFED, and State Civil Supplies Corporations. Rates are set automatically from official CACP Rabi 2024-25 benchmarks.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>🌾</span>
            <span>Submit New MSP Selling Request</span>
          </button>
        </div>

        {/* Farmer's Active MSP Applications */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-base font-black text-slate-900">Your MSP Procurement Applications</h2>
              </div>
              <p className="text-xs text-slate-500">Live application status auto-syncs across mandi officer workstations every 3.5s</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadMyRequests()}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>🔄</span>
                <span>Refresh Status</span>
              </button>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {requests.length} Applications
              </span>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <span className="text-3xl block mb-2">📋</span>
              No MSP procurement requests submitted yet. Click "Submit New MSP Selling Request" above.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((r) => (
                <MspApplicationLayeredCard
                  key={r.id}
                  request={r}
                  onViewReceipt={(receipt) => setViewingReceipt(receipt)}
                />
              ))}
            </div>
          )}
        </div>

        <MspRequestModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={loadMyRequests}
        />

        <ProcurementReceiptModal
          receipt={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      </div>
    </AppShell>
  );
}

