"use client";

import React from "react";
import Link from "next/link";

export type CropCardData = {
  name: string;
  slug: string;
  hindi: string;
  category: string;
  mspPricePerQuintal: number | null;
  mandiModalPricePerQuintal: number;
  mlExpectedPricePerQuintal: number;
  mspAdvantage: number;
  demand: string;
  availableBuyersCount: number;
  exportReferencePricePerQuintal: number | null;
  exportDestination: string | null;
};

type CropDiscoveryCardsProps = {
  crops: CropCardData[];
  onSelectCropForMsp?: (crop: CropCardData) => void;
  onSelectCropForDirect?: (crop: CropCardData) => void;
};

const CROP_ICONS: Record<string, string> = {
  wheat: "🌾",
  mustard: "🌼",
  chickpea: "🧆",
  rice: "🍚",
  tomato: "🍅",
  potato: "🥔",
  cotton: "🧶",
  maize: "🌽",
};

export default function CropDiscoveryCards({
  crops,
  onSelectCropForMsp,
  onSelectCropForDirect,
}: CropDiscoveryCardsProps) {
  return (
    <section aria-labelledby="crop-discovery-heading" className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 id="crop-discovery-heading" className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🌱</span>
            <span>Crop Discovery & Direct Selling Channels</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Choose a crop to view MSP safety floor, local APMC mandi price, and active buyer demand
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            Assured MSP
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-800 rounded border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Direct Market
          </span>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {crops.map((crop) => {
          const icon = CROP_ICONS[crop.slug] || "🌱";
          const hasMsp = crop.mspPricePerQuintal !== null && crop.mspPricePerQuintal > 0;

          return (
            <div
              key={crop.slug}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between group hover:border-emerald-600"
            >
              {/* Header */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl p-2 bg-slate-50 rounded-xl border border-slate-100 group-hover:scale-105 transition-transform">
                      {icon}
                    </span>
                    <div>
                      <h3 className="text-base font-black text-slate-900 leading-tight">
                        {crop.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold">
                        {crop.hindi} · {crop.category}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      crop.demand === "High Demand"
                        ? "bg-rose-100 text-rose-800"
                        : crop.demand === "Expanding"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {crop.demand}
                  </span>
                </div>

                {/* Price Matrix */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  {/* Govt MSP */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <span>🏛️</span> Govt MSP:
                    </span>
                    {hasMsp ? (
                      <span className="font-extrabold text-emerald-700">
                        ₹{crop.mspPricePerQuintal} <span className="text-[10px] font-normal text-slate-500">/q</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-semibold italic">Open Market</span>
                    )}
                  </div>

                  {/* APMC Mandi Modal */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <span>🏬</span> Mandi Modal:
                    </span>
                    <span className="font-bold text-slate-800">
                      ₹{crop.mandiModalPricePerQuintal} <span className="text-[10px] font-normal text-slate-500">/q</span>
                    </span>
                  </div>

                  {/* ML Expected Price */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <span>🤖</span> ML Forecast:
                    </span>
                    <span className="font-bold text-purple-700">
                      ₹{crop.mlExpectedPricePerQuintal} <span className="text-[10px] font-normal text-slate-500">/q</span>
                    </span>
                  </div>

                  {/* Export Reference if available */}
                  {crop.exportReferencePricePerQuintal && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-dashed border-slate-200">
                      <span className="text-indigo-600 font-medium flex items-center gap-1">
                        <span>🌍</span> {crop.exportDestination} Ref:
                      </span>
                      <span className="font-bold text-indigo-700">
                        ₹{crop.exportReferencePricePerQuintal}/q
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {hasMsp ? (
                    <button
                      type="button"
                      onClick={() => onSelectCropForMsp && onSelectCropForMsp(crop)}
                      className="px-2.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <span>🌾</span>
                      <span>Sell at MSP</span>
                    </button>
                  ) : (
                    <Link
                      href={`/marketplace/direct?crop=${encodeURIComponent(crop.name)}`}
                      className="px-2.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1"
                    >
                      <span>🛒</span>
                      <span>Direct Sell</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectCropForDirect && onSelectCropForDirect(crop)}
                    className="px-2.5 py-2 bg-[#0b4d75] hover:bg-[#083754] text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    <span>🛒</span>
                    <span>List Produce</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 px-1">
                  <span>{crop.availableBuyersCount} buyers active</span>
                  <Link
                    href={`/marketplace/groups?crop=${encodeURIComponent(crop.name)}`}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Group Sell →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

