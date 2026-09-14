"use client";

import React, { useState } from "react";
import AppShell from "../../components/AppShell";
import MarketplaceNavHeader from "../components/MarketplaceNavHeader";
import DirectMarketCatalog from "../components/DirectMarketCatalog";
import RequestBasketDrawer from "../components/RequestBasketDrawer";
import { MarketplaceUserRole, RequestBasketItem, DirectMarketListing } from "@/lib/marketplace-types";

export default function DirectMarketPage() {
  const [currentRole, setCurrentRole] = useState<MarketplaceUserRole>("private_buyer");
  const [basketOpen, setBasketOpen] = useState(false);
  const [basketItems, setBasketItems] = useState<RequestBasketItem[]>([]);

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

  return (
    <AppShell pageTitle="Direct Farm-to-Market Produce Trading">
      <div className="space-y-6">
        <MarketplaceNavHeader
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          basketCount={basketItems.length}
          onOpenBasket={() => setBasketOpen(true)}
        />

        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm space-y-2">
          <span className="px-2.5 py-1 bg-blue-600 text-white rounded-full font-bold text-xs uppercase tracking-wider">
            Mode B: Direct Private Marketplace
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Direct Farm-to-Market Produce Exchange
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            Empowering growers to set independent asking prices and trade directly with registered wholesale traders, processors, and institutional aggregators without middleman commissions.
          </p>
        </div>

        <DirectMarketCatalog onAddToBasket={handleAddToBasket} />

        <RequestBasketDrawer
          isOpen={basketOpen}
          onClose={() => setBasketOpen(false)}
          items={basketItems}
          onRemoveItem={(id) => setBasketItems((prev) => prev.filter((i) => i.listingId !== id))}
          onClearBasket={() => setBasketItems([])}
        />
      </div>
    </AppShell>
  );
}

