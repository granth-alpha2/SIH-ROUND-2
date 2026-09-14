"use client";

import React, { useState, useEffect } from "react";
import { DirectMarketListing, QuantityUnit } from "@/lib/marketplace-types";

type DirectMarketCatalogProps = {
  initialCropFilter?: string;
  onAddToBasket?: (listing: DirectMarketListing) => void;
};

export default function DirectMarketCatalog({
  initialCropFilter,
  onAddToBasket,
}: DirectMarketCatalogProps) {
  const [listings, setListings] = useState<DirectMarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [cropFilter, setCropFilter] = useState(initialCropFilter || "ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");

  // Create Listing Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCropName, setNewCropName] = useState("Tomato");
  const [newQuantity, setNewQuantity] = useState<number>(500);
  const [newUnit, setNewUnit] = useState<QuantityUnit>("kg");
  const [newAskingPrice, setNewAskingPrice] = useState<number>(1950); // per quintal
  const [newQualityGrade, setNewQualityGrade] = useState("Grade-A Firm Red");
  const [newVariety, setNewVariety] = useState("Himsona Hybrid");
  const [creatingListing, setCreatingListing] = useState(false);

  // Make Offer Modal State
  const [offerListing, setOfferListing] = useState<DirectMarketListing | null>(null);
  const [offerQty, setOfferQty] = useState<number>(10);
  const [offerPrice, setOfferPrice] = useState<number>(2400);
  const [offerMessage, setOfferMessage] = useState("Request delivery to local sorting warehouse.");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  async function loadListings() {
    try {
      let url = "/api/marketplace/listings";
      const params = new URLSearchParams();
      if (cropFilter !== "ALL") params.append("crop", cropFilter);
      if (districtFilter !== "ALL") params.append("district", districtFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setListings(json.listings || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
  }, [cropFilter, districtFilter]);

  // Handle Create Listing
  async function handleCreateListing(e: React.FormEvent) {
    e.preventDefault();
    setCreatingListing(true);
    setActionSuccessMsg(null);

    try {
      const res = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName: newCropName,
          cropSlug: newCropName.toLowerCase().split(" ")[0],
          cropId: "CROP011",
          variety: newVariety,
          quantity: newQuantity,
          unit: newUnit,
          askingPriceInrPerQuintal: newAskingPrice,
          qualityGrade: newQualityGrade,
          district: "Ludhiana",
          state: "Punjab",
          deliveryTerms: "FARM_PICKUP",
          description: "Freshly harvested directly from grower plot. High quality sort.",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg("✓ Produce listed successfully on Direct Farm-to-Market board!");
        setShowCreateModal(false);
        await loadListings();
      }
    } catch {} finally {
      setCreatingListing(false);
    }
  }

  // Handle Submit Offer
  async function handleSubmitOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!offerListing) return;
    setSubmittingOffer(true);

    try {
      const res = await fetch("/api/marketplace/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: offerListing.id,
          buyerName: "M/s Kisan Agro Traders (Direct Buyer)",
          buyerPhone: "9814122334",
          buyerCompany: "Kisan Direct Logistics Ltd.",
          offeredQuantityQuintals: offerQty,
          offeredPriceInrPerQuintal: offerPrice,
          message: offerMessage,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg(`✓ Offer submitted for ${offerListing.cropName}! Farmer will be notified.`);
        setOfferListing(null);
        await loadListings();
      }
    } catch {} finally {
      setSubmittingOffer(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Header & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Crop Filter</label>
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="ALL">All Crops</option>
              <option value="Wheat">Wheat</option>
              <option value="Mustard">Mustard</option>
              <option value="Tomato">Tomato</option>
              <option value="Gram">Chickpea / Gram</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">District</label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="ALL">All Districts</option>
              <option value="Ludhiana">Ludhiana (Punjab)</option>
              <option value="Karnal">Karnal (Haryana)</option>
              <option value="Kota">Kota (Rajasthan)</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer ml-auto"
        >
          <span>➕</span>
          <span>List Crop Produce for Direct Sale</span>
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold">
          {actionSuccessMsg}
        </div>
      )}

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((l) => {
          // Price position calculation vs ML expected price
          const priceDiffPct = l.mlExpectedPriceInr > 0
            ? (((l.askingPriceInrPerQuintal - l.mlExpectedPriceInr) / l.mlExpectedPriceInr) * 100).toFixed(1)
            : "0.0";
          const isAbove = Number(priceDiffPct) >= 0;

          return (
            <div
              key={l.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">{l.id}</span>
                    <h3 className="text-base font-black text-slate-900">{l.cropName}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{l.variety} · {l.qualityGrade}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-black uppercase">
                    {l.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{l.description}</p>

                {/* Farmer & Location Info */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>Farmer: <strong>{l.farmerName}</strong></span>
                  <span>📍 {l.district}, {l.state}</span>
                </div>

                {/* Price Intelligence Section (Prompt 20) */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-bold">Farmer Asking Price:</span>
                    <span className="text-base font-black text-slate-900">
                      ₹{l.askingPriceInrPerQuintal} <span className="text-[10px] font-normal text-slate-500">/q</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    <div>
                      <span>MSP Floor:</span>
                      <strong className="block text-slate-800">
                        {l.mspReferenceInr > 0 ? `₹${l.mspReferenceInr}` : "None"}
                      </strong>
                    </div>
                    <div>
                      <span>Mandi Modal:</span>
                      <strong className="block text-slate-800">₹{l.mandiModalReferenceInr}</strong>
                    </div>
                    <div>
                      <span>ML Forecast:</span>
                      <strong className="block text-purple-700">₹{l.mlExpectedPriceInr}</strong>
                    </div>
                  </div>

                  <div className="text-[10px] font-bold pt-1 text-slate-600">
                    Price Position:{" "}
                    <span className={isAbove ? "text-amber-700" : "text-emerald-700"}>
                      {isAbove ? `+${priceDiffPct}% above` : `${priceDiffPct}% below`} expected ML market price
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 flex items-center justify-between">
                  <span>Available Quantity: <strong>{l.availableQuantityQuintals} q</strong></span>
                  <span className="text-[11px] text-slate-500">Terms: {l.deliveryTerms.replace("_", " ")}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOfferListing(l);
                    setOfferQty(Math.min(l.availableQuantityQuintals, 10));
                    setOfferPrice(l.askingPriceInrPerQuintal);
                  }}
                  className="flex-1 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-sm"
                >
                  Make Offer
                </button>

                {onAddToBasket && (
                  <button
                    type="button"
                    onClick={() => onAddToBasket(l)}
                    className="px-3 py-2 bg-[#0b4d75] hover:bg-[#083754] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Add to wholesale request basket"
                  >
                    🧺
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">List Produce on Direct Market</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Crop Name</label>
                <input
                  type="text"
                  value={newCropName}
                  onChange={(e) => setNewCropName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as QuantityUnit)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="kg">kg</option>
                    <option value="quintal">quintal</option>
                    <option value="tonne">tonne</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asking Price (₹ / quintal)</label>
                  <input
                    type="number"
                    value={newAskingPrice}
                    onChange={(e) => setNewAskingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quality Grade</label>
                  <input
                    type="text"
                    value={newQualityGrade}
                    onChange={(e) => setNewQualityGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingListing}
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl font-bold"
                >
                  {creatingListing ? "Publishing..." : "Publish Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Make Offer Modal */}
      {offerListing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Make Private Buyer Offer</h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Crop: {offerListing.cropName} · Farmer Asking: ₹{offerListing.askingPriceInrPerQuintal}/q
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOfferListing(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Offered Quantity (Quintals)</label>
                  <input
                    type="number"
                    max={offerListing.availableQuantityQuintals}
                    value={offerQty}
                    onChange={(e) => setOfferQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Offered Price (₹ / quintal)</label>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery / Logistics Note</label>
                <textarea
                  rows={2}
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-emerald-950">Total Offer Value:</span>
                <span className="text-base font-black text-emerald-800">
                  ₹{(offerQty * offerPrice).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setOfferListing(null)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold"
                >
                  {submittingOffer ? "Sending..." : "Submit Offer to Farmer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

