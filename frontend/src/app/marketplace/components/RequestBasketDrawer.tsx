"use client";

import React, { useState } from "react";
import { RequestBasketItem } from "@/lib/marketplace-types";

type RequestBasketProps = {
  isOpen: boolean;
  onClose: () => void;
  items: RequestBasketItem[];
  onRemoveItem: (listingId: string) => void;
  onClearBasket: () => void;
};

export default function RequestBasketDrawer({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearBasket,
}: RequestBasketProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const totalQuantity = items.reduce((sum, item) => sum + item.requestQuantityQuintals, 0);
  const totalValue = items.reduce(
    (sum, item) => sum + item.requestQuantityQuintals * item.pricePerQuintal,
    0
  );

  async function handleCheckout() {
    setSubmitting(true);
    try {
      // Create offers sequentially for all basket items
      for (const item of items) {
        await fetch("/api/marketplace/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: item.listingId,
            buyerName: "Wholesale Basket Purchaser",
            buyerPhone: "9814122334",
            offeredQuantityQuintals: item.requestQuantityQuintals,
            offeredPriceInrPerQuintal: item.pricePerQuintal,
            message: "Submitted via AgriProfit Wholesale Request Basket.",
          }),
        });
      }
      setSuccess(true);
      setTimeout(() => {
        onClearBasket();
        setSuccess(false);
        onClose();
      }, 2000);
    } catch {
      alert("Failed to submit purchase request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6 space-y-4">
        <div className="space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧺</span>
              <h3 className="font-black text-slate-900 text-base">Wholesale Request Basket</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 font-bold p-1"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Agricultural wholesale order consolidation. Multiple farm listings are converted into individual direct purchase requests.
          </p>

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold">
              ✓ Purchase requests dispatched to respective farmers!
            </div>
          )}

          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <span className="text-3xl block mb-2">🧺</span>
              Your wholesale basket is empty. Browse Direct Market listings and add crops.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.listingId}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-black text-slate-900">{item.cropName}</h4>
                    <p className="text-[11px] text-slate-500">
                      Grower: {item.farmerName} · {item.location}
                    </p>
                    <p className="text-xs font-bold text-emerald-800 mt-0.5">
                      {item.requestQuantityQuintals} q @ ₹{item.pricePerQuintal}/q
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.listingId)}
                    className="text-rose-600 hover:text-rose-800 font-bold text-xs p-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Quantity:</span>
                <strong className="text-slate-900">{totalQuantity} Quintals</strong>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900">
                <span>Consolidated Est. Value:</span>
                <span className="text-emerald-700">₹{totalValue.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting || success}
              onClick={handleCheckout}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              {submitting ? "Sending Requests..." : "Create Wholesale Purchase Requests"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

