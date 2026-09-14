"use client";

import React, { useState, useEffect } from "react";
import { QuantityUnit, ProcurementCenter } from "@/lib/marketplace-types";

type MspRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  preselectedCropName?: string;
  onSuccess?: () => void;
};

type FarmOption = {
  id: string;
  name: string;
  areaAcres: number;
};

export default function MspRequestModal({
  isOpen,
  onClose,
  preselectedCropName = "Wheat",
  onSuccess,
}: MspRequestModalProps) {
  const [cropName, setCropName] = useState(preselectedCropName);
  const [quantity, setQuantity] = useState<number>(35);
  const [unit, setUnit] = useState<QuantityUnit>("quintal");
  const [cropGrade, setCropGrade] = useState("Fair Average Quality (FAQ) Grade-A");
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [centers, setCenters] = useState<ProcurementCenter[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // MSP Benchmark catalog lookup
  const [mspRate, setMspRate] = useState<number>(2275);
  const [mandiPrice, setMandiPrice] = useState<number>(2380);

  useEffect(() => {
    if (preselectedCropName) {
      setCropName(preselectedCropName);
    }
  }, [preselectedCropName]);

  useEffect(() => {
    // Load farms and procurement centers
    async function loadData() {
      try {
        const [farmRes, centerRes] = await Promise.all([
          fetch("/api/farms"),
          fetch("/api/marketplace/msp/centers"),
        ]);
        if (farmRes.ok) {
          const fj = await farmRes.json();
          if (fj.farms && fj.farms.length > 0) {
            setFarms(fj.farms);
            setSelectedFarmId(fj.farms[0].id);
          }
        }
        if (centerRes.ok) {
          const cj = await centerRes.json();
          if (cj.centers && cj.centers.length > 0) {
            setCenters(cj.centers);
            setSelectedCenterId(cj.centers[0].id);
          }
        }
      } catch {}
    }
    if (isOpen) {
      loadData();
      // Set harvest date to 7 days ahead default
      const d = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
      setHarvestDate(d);
    }
  }, [isOpen]);

  // Update MSP rate automatically based on selected crop
  useEffect(() => {
    if (cropName.toLowerCase().includes("wheat")) {
      setMspRate(2275);
      setMandiPrice(2380);
    } else if (cropName.toLowerCase().includes("mustard")) {
      setMspRate(5650);
      setMandiPrice(5620);
    } else if (cropName.toLowerCase().includes("gram") || cropName.toLowerCase().includes("chickpea")) {
      setMspRate(5440);
      setMandiPrice(5380);
    } else if (cropName.toLowerCase().includes("rice") || cropName.toLowerCase().includes("paddy")) {
      setMspRate(2300);
      setMandiPrice(2250);
    } else if (cropName.toLowerCase().includes("barley")) {
      setMspRate(1850);
      setMandiPrice(1950);
    } else if (cropName.toLowerCase().includes("lentil")) {
      setMspRate(6425);
      setMandiPrice(6500);
    } else {
      setMspRate(2275);
      setMandiPrice(2300);
    }
  }, [cropName]);

  if (!isOpen) return null;

  // Convert input quantity to quintals for payout calculation
  const quantityInQuintals = unit === "kg" ? quantity / 100 : unit === "tonne" ? quantity * 10 : quantity;
  const estimatedGrossValue = Math.round(quantityInQuintals * mspRate);
  const estimatedMandiValue = Math.round(quantityInQuintals * mandiPrice);
  const mspAdvantage = mspRate > mandiPrice ? (mspRate - mandiPrice) * quantityInQuintals : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (quantity <= 0) {
      setErrorMsg("Quantity must be greater than zero.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const farm = farms.find((f) => f.id === selectedFarmId);

    try {
      const res = await fetch("/api/marketplace/msp/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName,
          cropSlug: cropName.toLowerCase().split(" ")[0],
          cropId: "CROP002",
          quantity,
          unit,
          cropGrade,
          farmId: farm?.id,
          farmName: farm?.name || "Registered Farm Plot",
          expectedHarvestDate: harvestDate,
          procurementCenterId: selectedCenterId || "PC-PB-LDH-01",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("✓ Request submitted! Awaiting Government Officer review and 12-digit code issuance.");
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.error?.message || "Failed to submit request.");
      }
    } catch {
      setErrorMsg("Network error while submitting MSP request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-300 max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-3">
          <div>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px] uppercase tracking-wider">
              Mode A: Farmer → Government MSP Procurement
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <span>🌾</span>
              <span>Sell at Minimum Support Price (MSP)</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-black text-lg p-1"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Crop Selection & Registered Farm Plot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Crop <span className="text-rose-500">*</span>
              </label>
              <select
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Wheat">Wheat (गेहूं) — CACP Cereal</option>
                <option value="Rapeseed & Mustard">Rapeseed & Mustard (सरसों) — Oilseed</option>
                <option value="Gram (Chickpea)">Gram / Chickpea (चना) — Pulse</option>
                <option value="Paddy (Common)">Paddy / Rice (धान) — Kharif</option>
                <option value="Barley (Jau)">Barley (जौ) — Rabi</option>
                <option value="Lentil / Masoor">Lentil / Masoor (मसूर) — Pulse</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registered Farm / Land Plot
              </label>
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800"
              >
                {farms.length > 0 ? (
                  farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.areaAcres} Acres)
                    </option>
                  ))
                ) : (
                  <option value="default">Demonstration Plot (2.5 Acres, Doraha)</option>
                )}
              </select>
            </div>
          </div>

          {/* Row 2: Quantity & Unit Normalization */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantity to Sell <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900"
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as QuantityUnit)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800"
              >
                <option value="quintal">Quintal (100 kg)</option>
                <option value="tonne">Tonne (1,000 kg)</option>
                <option value="kg">Kilogram (kg)</option>
              </select>
            </div>
          </div>

          {/* Automatic Price Intelligence Banner (Prompt 6 & 7) */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs border-b border-emerald-200 pb-2">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <span>🏛️</span>
                <span>Verified Official Government MSP:</span>
              </span>
              <span className="text-base font-black text-emerald-800">
                ₹{mspRate} / quintal
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div>
                <span className="text-slate-500 font-semibold block text-[10px]">Standard Weight:</span>
                <span className="font-bold text-slate-900">{quantityInQuintals} Quintals</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[10px]">Nearby Mandi:</span>
                <span className="font-bold text-slate-900">₹{mandiPrice} /q</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[10px]">MSP Advantage:</span>
                <span className="font-bold text-emerald-700">
                  {mspAdvantage > 0 ? `+₹${mspAdvantage.toLocaleString("en-IN")}` : "Fair Market"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[10px]">Estimated Gross Value:</span>
                <span className="font-black text-emerald-900 text-sm">
                  ₹{estimatedGrossValue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-medium italic pt-1">
              Source: CACP Official Price Policy 2024-25 • MSP floor rate is locked automatically by the platform.
            </p>
          </div>

          {/* Row 3: Quality Grade & Procurement Center */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Crop Grade Standard
              </label>
              <select
                value={cropGrade}
                onChange={(e) => setCropGrade(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="Fair Average Quality (FAQ) Grade-A">FAQ Grade-A (Standard MSP Qualified)</option>
                <option value="Certified Organic FAQ">Certified Organic Grade</option>
                <option value="High Test Weight Grade">High Test Weight Grade</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preferred Procurement Center <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCenterId}
                onChange={(e) => setSelectedCenterId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.agency}, {c.district})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Processing Application...</span>
                </>
              ) : (
                <>
                  <span>📝</span>
                  <span>Submit MSP Procurement Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

