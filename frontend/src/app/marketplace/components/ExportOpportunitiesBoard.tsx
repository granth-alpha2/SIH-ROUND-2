"use client";

import React, { useState, useEffect } from "react";
import { ExportOpportunity, IndianExporter } from "@/lib/marketplace-types";

export default function ExportOpportunitiesBoard() {
  const [opportunities, setOpportunities] = useState<ExportOpportunity[]>([]);
  const [exporters, setExporters] = useState<IndianExporter[]>([]);
  const [loading, setLoading] = useState(true);

  // Send Offer Modal
  const [selectedOpp, setSelectedOpp] = useState<ExportOpportunity | null>(null);
  const [selectedExporterId, setSelectedExporterId] = useState("");
  const [offerQty, setOfferQty] = useState<number>(50);
  const [offeredPrice, setOfferedPrice] = useState<number>(2550);
  const [sendingOffer, setSendingOffer] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [oppRes, expRes] = await Promise.all([
          fetch("/api/marketplace/export/opportunities"),
          fetch("/api/marketplace/export/exporters"),
        ]);
        if (oppRes.ok) {
          const oj = await oppRes.json();
          setOpportunities(oj.opportunities || []);
        }
        if (expRes.ok) {
          const ej = await expRes.json();
          setExporters(ej.exporters || []);
          if (ej.exporters && ej.exporters.length > 0) {
            setSelectedExporterId(ej.exporters[0].id);
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleSendExportOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOpp || !selectedExporterId) return;
    setSendingOffer(true);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/marketplace/export/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exporterId: selectedExporterId,
          cropName: selectedOpp.cropName,
          destinationCountry: selectedOpp.destinationCountry,
          totalQuantityQuintals: offerQty,
          offeredPriceInrPerQuintal: offeredPrice,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(
          `✓ Export group trade proposal forwarded to ${data.match.exporterName}! Target destination: ${selectedOpp.destinationCountry}.`
        );
        setSelectedOpp(null);
      }
    } catch {} finally {
      setSendingOffer(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Essential Architecture Disclaimer (Prompt 24 & 27) */}
      <div className="bg-indigo-950 text-indigo-100 rounded-2xl p-5 shadow-lg border border-indigo-900 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌍</span>
          <h2 className="text-base font-black tracking-tight text-white">
            International Trade Intelligence & Verified Indian Exporter Gateway
          </h2>
        </div>
        <p className="text-xs text-indigo-200 leading-relaxed max-w-4xl">
          <strong>Institutional Flow:</strong> Farmers / Groups ➔ AgriProfit Platform ➔ Verified Registered Indian Exporters ➔ Overseas Markets.
          Individual farmers do not export directly; our platform matches aggregated farmer groups with licensed Indian exporters holding active APEDA and IEC certifications.
        </p>
        <div className="text-[11px] text-indigo-300 flex items-center gap-2 pt-1">
          <span>Sources: FAOSTAT Trade Series · UN Comtrade 2024</span>
          <span>•</span>
          <span className="font-semibold text-emerald-400">All prices reflect verified historical trade benchmarks</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold">
          {successMsg}
        </div>
      )}

      {/* 2. Destination Opportunities (10 Countries) */}
      <section className="space-y-3">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <span>🚢</span>
          <span>Global Destination Trade Reference & Farmer Net Realization</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((opp) => (
            <div
              key={`${opp.cropName}-${opp.destinationCountry}`}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-indigo-600 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{opp.countryCode} · {opp.period}</span>
                    <h4 className="text-lg font-black text-slate-900">{opp.cropName}</h4>
                    <p className="text-xs font-bold text-indigo-700">Destination: {opp.destinationCountry}</p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      opp.demandIndicator === "High Demand"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {opp.demandIndicator}
                  </span>
                </div>

                {/* Price Breakdown Calculation (Prompt 30) */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Intl Reference Price:</span>
                    <strong className="text-slate-900">₹{opp.internationalReferencePriceInrPerQuintal}/q</strong>
                  </div>
                  <div className="flex justify-between items-center text-rose-700 text-[11px]">
                    <span>(-) Est. Logistics & Port Freight:</span>
                    <span>-₹{opp.indicativeLogisticsCostInrPerQuintal}/q</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-700 text-[11px]">
                    <span>(-) Exporter Margin / Inspection:</span>
                    <span>-₹{opp.exporterMarginInrPerQuintal}/q</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center">
                    <span className="font-extrabold text-emerald-950">Indicative Net Realization:</span>
                    <span className="text-base font-black text-emerald-700">
                      ₹{opp.indicativeFarmerRealizationInrPerQuintal} <span className="text-xs font-normal">/q</span>
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <div>Annual Trade Volume: <strong>{(opp.tradeVolumeTonnes / 1000).toFixed(0)}k Tonnes</strong></div>
                  <div>Data Source: {opp.source}</div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOpp(opp);
                    setOfferedPrice(opp.indicativeFarmerRealizationInrPerQuintal);
                  }}
                  className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-sm"
                >
                  Send Proposal to Indian Exporter
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Verified Indian Exporter Directory (Prompt 28) */}
      <section className="space-y-3 pt-4">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <span>🏢</span>
          <span>Verified Indian Agricultural Exporter Directory (APEDA / IEC Registered)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {exporters.map((exp) => (
            <div
              key={exp.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2 text-xs"
            >
              <div className="flex items-start justify-between">
                <h4 className="font-black text-slate-900 text-sm">{exp.companyName}</h4>
                <span className="text-emerald-700 font-bold">✓ Verified</span>
              </div>
              <p className="text-[11px] text-slate-500">Contact: {exp.contactPerson} · {exp.locationCity}, {exp.locationState}</p>
              <div className="text-[11px] text-slate-700 space-y-0.5 pt-1 border-t border-slate-100">
                <div>Crops: <strong>{exp.cropsHandled.join(", ")}</strong></div>
                <div>Countries: <strong>{exp.destinationCountries.join(", ")}</strong></div>
                <div>APEDA: <span className="font-mono">{exp.apedaRegistration}</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Send Proposal Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Forward Export Group Proposal</h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Crop: {selectedOpp.cropName} · Destination: {selectedOpp.destinationCountry}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOpp(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendExportOffer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Registered Indian Exporter</label>
                <select
                  value={selectedExporterId}
                  onChange={(e) => setSelectedExporterId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  {exporters.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.companyName} ({e.locationCity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proposed Quantity (q)</label>
                  <input
                    type="number"
                    value={offerQty}
                    onChange={(e) => setOfferQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asking Realization (₹/q)</label>
                  <input
                    type="number"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                <span className="text-[11px] text-indigo-950 block">
                  Proposal links your crop pool to the registered exporter for foreign trade fulfillment. All export documentation is executed by the verified exporter.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedOpp(null)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingOffer}
                  className="px-5 py-2 bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  {sendingOffer ? "Sending..." : "Submit Export Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

