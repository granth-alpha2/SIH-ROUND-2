"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import MarketplaceNavHeader from "./components/MarketplaceNavHeader";
import MarketSnapshotCards from "./components/MarketSnapshotCards";
import CropDiscoveryCards, { CropCardData } from "./components/CropDiscoveryCards";
import MspRequestModal from "./components/MspRequestModal";
import DirectMarketCatalog from "./components/DirectMarketCatalog";
import GroupSellingBoard from "./components/GroupSellingBoard";
import MarketplacePillarCards from "./components/MarketplacePillarCards";
import RequestBasketDrawer from "./components/RequestBasketDrawer";
import ProcurementReceiptModal from "./components/ProcurementReceiptModal";
import { MarketplaceUserRole, RequestBasketItem, ProcurementReceipt, DirectMarketListing } from "@/lib/marketplace-types";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { usePageAudioContent } from "@/lib/i18n/PageAudioRegistry";
import MarketplaceChatModal from "./components/MarketplaceChatModal";

export default function MarketplacePage() {
  const { t } = useTranslation();
  const [currentRole, setCurrentRole] = useState<MarketplaceUserRole>("farmer");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<any>({});
  const [cropCards, setCropCards] = useState<CropCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [mspModalOpen, setMspModalOpen] = useState(false);
  const [selectedCropForMsp, setSelectedCropForMsp] = useState("Wheat");
  const [basketOpen, setBasketOpen] = useState(false);
  const [basketItems, setBasketItems] = useState<RequestBasketItem[]>([]);
  const [viewingReceipt, setViewingReceipt] = useState<ProcurementReceipt | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Register clean readable audio summary for screen reader / TTS
  usePageAudioContent({
    title: t("marketplace.title", "Secondary Marketplace & Direct Farm-to-Market"),
    summary: "Today's Mandi Snapshot: Official Government MSP Wheat ₹2,425 per quintal. Nearby Mandi modal rate: ₹2,380 per quintal. Direct buyer offers and APEDA export matches available.",
    sections: [
      { heading: "Government MSP", text: "₹2,425 per quintal with biometric gate clearance." },
      { heading: "Direct Farm Market", text: "Connect directly with certified private millers and processors." },
      { heading: "Multilingual Trade Chat", text: "Negotiate crop prices in Hindi, Punjabi, Haryanvi, Tamil, and English with live translation." },
    ],
    dependencies: [cropCards.length],
  });

  async function loadOverview() {
    try {
      const res = await fetch("/api/marketplace/overview");
      if (res.ok) {
        const json = await res.json();
        setStats(json.stats || {});
        setCropCards(json.cropCards || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();

    async function syncAuthRole() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user?.role) {
            const r = data.user.role;
            if (r === "government_buyer" || r === "private_buyer" || r === "exporter" || r === "farmer") {
              setCurrentRole(r);
            }
          }
        }
      } catch {}
    }

    syncAuthRole();
  }, []);

  function handleOpenMspForCrop(crop: CropCardData) {
    setSelectedCropForMsp(crop.name);
    setMspModalOpen(true);
  }

  function handleAddToBasket(listing: DirectMarketListing) {
    setBasketItems((prev) => {
      const existing = prev.find((i) => i.listingId === listing.id);
      if (existing) return prev;
      return [
        ...prev,
        {
          listingId: listing.id,
          cropName: listing.cropName,
          farmerName: listing.farmerName,
          availableQuantityQuintals: listing.availableQuantityQuintals,
          requestQuantityQuintals: Math.min(listing.availableQuantityQuintals, 10),
          pricePerQuintal: listing.askingPriceInrPerQuintal,
          location: `${listing.district}, ${listing.state}`,
        },
      ];
    });
    setBasketOpen(true);
  }

  // Filter crop cards based on search query
  const filteredCrops = cropCards.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.hindi.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.exportDestination && c.exportDestination.toLowerCase().includes(q))
    );
  });

  return (
    <AppShell pageTitle="Secondary Marketplace & Direct Farm-to-Market">
      <div className="space-y-6">
        {/* Marketplace Nav Header & Persona Switcher */}
        <MarketplaceNavHeader
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          basketCount={basketItems.length}
          onOpenBasket={() => setBasketOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* 1. Layered Marketplace Pillar Cards (4 Dashboard-style Role Cards) */}
        <MarketplacePillarCards />

        {/* 2. Today's Farmer Market Snapshot Cards */}
        <MarketSnapshotCards stats={stats} />

        {/* 3. Quick Selling Channel Cards */}
        <section id="farmer-selling-section" className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-md scroll-mt-6">
          <div className="max-w-3xl space-y-2">
            <span className="px-2.5 py-1 bg-emerald-700 text-emerald-100 rounded-full font-bold text-xs uppercase tracking-wider">
              Farmer Produce Selling Channels
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Choose Your Agricultural Selling Channel
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Sell assured volume to the Government at statutory Minimum Support Prices (MSP), or list independent harvest directly for private wholesale buyers and cooperative farmer producer groups.
            </p>
            <div className="flex flex-wrap gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCropForMsp("Wheat");
                  setMspModalOpen(true);
                }}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>🌾</span>
                <span>Mode A: Sell at Govt MSP</span>
              </button>
              <a
                href="#direct-market-section"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2"
              >
                <span>🛒</span>
                <span>Mode B: Direct Market & Group Selling</span>
              </a>

              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                <span className="text-sm">💬</span>
                <span>Multilingual Trade Chat & Negotiation</span>
              </button>
            </div>
          </div>
        </section>

        {/* 4. Crop Discovery Cards Section */}
        <CropDiscoveryCards
          crops={filteredCrops}
          onSelectCropForMsp={handleOpenMspForCrop}
          onSelectCropForDirect={(c) => {
            const el = document.getElementById("direct-market-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* 5. Direct Market & Group Selling Anchor Section */}
        <div id="direct-market-section" className="pt-4 space-y-6">
          <div className="border-t border-slate-200 pt-6">
            <DirectMarketCatalog onAddToBasket={handleAddToBasket} />
          </div>

          <div className="border-t border-slate-200 pt-6">
            <GroupSellingBoard />
          </div>

          {/* Institutional Cross-Border Gateway Referral */}
          <div className="border-t border-slate-200 pt-6">
            <div className="p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-[10px] uppercase tracking-wider">
                    APEDA Trade Gateway
                  </span>
                  <span className="text-xs text-indigo-300 font-mono font-bold">Layer 2 · Official Clearance</span>
                </div>
                <h3 className="text-lg font-black tracking-tight">Looking for Cross-Border &amp; International Export Corridors?</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  APEDA-licensed export houses, container aggregator firms, and international buyers operate in the dedicated Trade Terminal. Authenticate with official DGFT / APEDA credentials to access international benchmarks.
                </p>
              </div>
              <Link
                href="/marketplace/export"
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
              >
                <span>🚢</span>
                <span>Open APEDA Exporter Gateway 🔒</span>
                <span>➔</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Modals & Drawers */}
        <MspRequestModal
          isOpen={mspModalOpen}
          onClose={() => setMspModalOpen(false)}
          preselectedCropName={selectedCropForMsp}
          onSuccess={loadOverview}
        />

        <RequestBasketDrawer
          isOpen={basketOpen}
          onClose={() => setBasketOpen(false)}
          items={basketItems}
          onRemoveItem={(id) => setBasketItems((prev) => prev.filter((i) => i.listingId !== id))}
          onClearBasket={() => setBasketItems([])}
        />

        <ProcurementReceiptModal
          receipt={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />

        {/* Multilingual Trade Chat Modal */}
        <MarketplaceChatModal
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      </div>
    </AppShell>
  );
}

