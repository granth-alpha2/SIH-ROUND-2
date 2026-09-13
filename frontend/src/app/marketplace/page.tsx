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
import ExportOpportunitiesBoard from "./components/ExportOpportunitiesBoard";
import RequestBasketDrawer from "./components/RequestBasketDrawer";
import ProcurementReceiptModal from "./components/ProcurementReceiptModal";
import { MarketplaceUserRole, RequestBasketItem, ProcurementReceipt, DirectMarketListing } from "@/lib/marketplace-types";

export default function MarketplacePage() {
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

        {/* Institutional Workstation Banners when logged in under official personas */}
        {currentRole === "government_buyer" && (
          <div className="p-4 bg-[#0b4d75] text-white rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md border-l-4 border-amber-400">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-[10px] uppercase tracking-wider">
                  🔒 INSTITUTIONAL SESSION ACTIVE
                </span>
                <span className="text-xs text-amber-200 font-mono font-bold">FCI Station #PB-LDH-01</span>
              </div>
              <h2 className="text-base font-black">Official Mandi Procurement Station Desk Available</h2>
              <p className="text-xs text-slate-200 leading-relaxed">
                You are currently authenticated with Government Procurement Officer credentials. Review pending farmer MSP applications, verify 12-digit gate passes, execute UIDAI iris biometrics, and record weighbridge intake in your dedicated institutional terminal.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/marketplace/government"
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>🏛️</span>
                <span>Open Govt Procurement Console</span>
                <span>➔</span>
              </Link>
            </div>
          </div>
        )}

        {currentRole === "exporter" && (
          <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md border-l-4 border-indigo-400">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-[10px] uppercase tracking-wider">
                  🚢 APEDA EXPORTER DESK ACTIVE
                </span>
                <span className="text-xs text-indigo-200 font-mono font-bold">Category-A Export Hub</span>
              </div>
              <h2 className="text-base font-black">International Export Opportunities Gateway Available</h2>
              <p className="text-xs text-slate-200 leading-relaxed">
                Connect directly with farmer producer groups, inspect international FOB parity benchmarks across 10 destinations, and match export consignments in the dedicated trade terminal.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/marketplace/export"
                className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>🚢</span>
                <span>Open APEDA Export Gateway</span>
                <span>➔</span>
              </Link>
            </div>
          </div>
        )}

        {/* Today's Market Snapshot Cards */}
        <MarketSnapshotCards stats={stats} />

        {/* Quick Selling Channel Cards */}
        <section className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-md">
          <div className="max-w-3xl space-y-2">
            <span className="px-2.5 py-1 bg-emerald-700 text-emerald-100 rounded-full font-bold text-xs uppercase tracking-wider">
              Two Primary Selling Modes
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Choose Your Agricultural Selling Channel
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Sell assured volume to the Government at statutory Minimum Support Prices (MSP), or list independent harvest directly for private wholesale buyers, cooperative groups, and Indian export houses.
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
            </div>
          </div>
        </section>

        {/* Crop Discovery Cards Section */}
        <CropDiscoveryCards
          crops={filteredCrops}
          onSelectCropForMsp={handleOpenMspForCrop}
          onSelectCropForDirect={(c) => {
            const el = document.getElementById("direct-market-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* Direct Market & Group Selling Anchor Section */}
        <div id="direct-market-section" className="pt-4 space-y-6">
          <div className="border-t border-slate-200 pt-6">
            <DirectMarketCatalog onAddToBasket={handleAddToBasket} />
          </div>

          <div className="border-t border-slate-200 pt-6">
            <GroupSellingBoard />
          </div>

          <div className="border-t border-slate-200 pt-6">
            <ExportOpportunitiesBoard />
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
      </div>
    </AppShell>
  );
}

