"use client";

import React from "react";
import Link from "next/link";

export default function MarketplacePillarCards() {
  const pillars = [
    {
      id: "farmer",
      title: "Farmer Produce Trading Desk",
      hindiTitle: "किसान ई-बाजार और एमएसपी",
      layer: "Layer 1 · Open Access",
      securityBadge: "🟢 Public Access · Aadhaar / Mobile OTP",
      icon: "🌾",
      borderHover: "hover:border-emerald-600",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description:
        "Sell assured harvest volumes at statutory Minimum Support Prices (MSP) with biometric gate passes, list directly for verified millers, or aggregate with local FPOs.",
      actionText: "Enter Farmer Marketplace",
      actionLink: "#farmer-selling-section",
      isAnchor: true,
      buttonStyle: "bg-emerald-700 hover:bg-emerald-800 text-white",
      features: [
        { label: "Sell at Govt MSP (12-Digit Pass)", href: "/marketplace/msp" },
        { label: "Direct Wholesale Listings", href: "/marketplace/direct" },
        { label: "FPO Group Pooling", href: "/marketplace/groups" },
        { label: "My Trade Transactions", href: "/marketplace/transactions" },
      ],
    },
    {
      id: "government",
      title: "Govt Procurement Officer Console",
      hindiTitle: "सरकारी खरीद अधिकारी पोर्टल",
      layer: "Layer 2 · Restricted Mandi Desk",
      securityBadge: "🔒 Official Govt ID & Password Required",
      icon: "🏛️",
      borderHover: "hover:border-sky-600",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
      description:
        "Dedicated terminal for Food Corporation of India (FCI) & State Civil Supplies officers. Review farmer applications, verify 12-digit gate passes, record weighbridge intake & trigger DBT treasury disbursements.",
      actionText: "Authenticate as Govt Officer 🔒",
      actionLink: "/marketplace/government",
      isAnchor: false,
      buttonStyle: "bg-[#0b4d75] hover:bg-[#083754] text-white",
      features: [
        { label: "12-Digit Gate Pass Verification", href: "/marketplace/government" },
        { label: "UIDAI Iris Biometric Clearance", href: "/marketplace/government" },
        { label: "Electronic Weighbridge Sync", href: "/marketplace/government" },
        { label: "PFMS / DBT Payment Clearance", href: "/marketplace/government" },
      ],
    },
    {
      id: "exporter",
      title: "APEDA Licensed Exporter Gateway",
      hindiTitle: "निर्यात एवं विदेशी व्यापार डेस्क",
      layer: "Layer 2 · International Trade Desk",
      securityBadge: "🔒 DGFT IEC & APEDA Credentials Required",
      icon: "🚢",
      borderHover: "hover:border-indigo-600",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
      description:
        "Restricted gateway for APEDA-registered export houses. Match export consignments against 10-country international FOB parity benchmarks, aggregate container volumes, and execute cross-border contracts.",
      actionText: "Authenticate as Exporter 🔒",
      actionLink: "/marketplace/export",
      isAnchor: false,
      buttonStyle: "bg-indigo-700 hover:bg-indigo-800 text-white",
      features: [
        { label: "10-Country Global FOB Parity", href: "/marketplace/export" },
        { label: "FPO Container Aggregation", href: "/marketplace/export" },
        { label: "Customs & Port Logistics Engine", href: "/marketplace/export" },
        { label: "APEDA Bilateral Term Sheets", href: "/marketplace/export" },
      ],
    },
    {
      id: "buyer",
      title: "Certified Private Buyer Sourcing Desk",
      hindiTitle: "निजी खरीदार एवं मिलर पोर्टल",
      layer: "Layer 1 · Commercial Trade",
      securityBadge: "🏢 Corporate Buyer Verification",
      icon: "🛒",
      borderHover: "hover:border-amber-600",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      description:
        "Sourcing platform for verified grain millers, food processing units, and retail aggregators to pre-book harvest lots, inspect electronic assaying certificates, and execute digital contracts.",
      actionText: "Access Buyer Sourcing Desk",
      actionLink: "/marketplace/direct",
      isAnchor: false,
      buttonStyle: "bg-amber-600 hover:bg-amber-700 text-white",
      features: [
        { label: "Browse Farmer Harvest Listings", href: "/marketplace/direct" },
        { label: "Batch Bidding & Counter-Offers", href: "/marketplace/direct" },
        { label: "Electronic Quality Assaying", href: "/marketplace/direct" },
        { label: "Digital Escrow Agreements", href: "/marketplace/transactions" },
      ],
    },
  ];

  return (
    <section aria-labelledby="marketplace-pillars-heading" className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏛️</span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded font-black text-xs uppercase tracking-wider">
              Layered Marketplace Information Architecture
            </span>
          </div>
          <h2 id="marketplace-pillars-heading" className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Choose Your Marketplace Portal Layer
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
            Select your agricultural operational role below. Farmers access open trade tools, while Government Mandi Officers and Licensed Exporters enter authenticated institutional workstations.
          </p>
        </div>
      </div>

      {/* 4 Multi-Layer Service Category Cards (Matching Dashboard Card Design) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {pillars.map((pillar) => (
          <div
            key={pillar.id}
            className={`p-6 bg-white border-2 border-slate-200 ${pillar.borderHover} rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group`}
          >
            <div className="space-y-3">
              {/* Header row with Icon, Layer Tag & Security Badge */}
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  {pillar.icon}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${pillar.badgeColor}`}>
                    {pillar.layer}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 font-mono">
                    {pillar.securityBadge}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-[11px] font-bold text-slate-500">
                  {pillar.hindiTitle}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {pillar.description}
                </p>
              </div>

              {/* Features / Quick sub-links */}
              <div className="pt-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Available Desk Features:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {pillar.features.map((feat) => (
                    <Link
                      key={feat.label}
                      href={feat.href}
                      className="text-[11px] font-semibold text-slate-700 hover:text-emerald-800 hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="text-emerald-600 text-xs">✓</span>
                      <span className="truncate">{feat.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Action Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {pillar.id === "farmer" ? "Open Access Desk" : "Clearance Protocol"}
              </span>

              {pillar.isAnchor ? (
                <a
                  href={pillar.actionLink}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${pillar.buttonStyle}`}
                >
                  <span>{pillar.actionText}</span>
                  <span>➔</span>
                </a>
              ) : (
                <Link
                  href={pillar.actionLink}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${pillar.buttonStyle}`}
                >
                  <span>{pillar.actionText}</span>
                  <span>➔</span>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

