"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import type { CropRecord } from "@/lib/crop-data";

export default function CropsPage() {
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCrop, setActiveCrop] = useState<CropRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCrops() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSeason !== "All") params.set("season", selectedSeason);
        if (selectedCategory !== "All") params.set("category", selectedCategory);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());

        const res = await fetch(`/api/crops?${params.toString()}`);
        if (res.ok && isMounted) {
          const json = await res.json();
          setCrops(json.crops || []);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCrops();
    return () => {
      isMounted = false;
    };
  }, [selectedSeason, selectedCategory, searchQuery]);

  return (
    <AppShell pageTitle="Crop Database">
      <div className="page-container space-y-6">
        {/* Header Row */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="agri-badge agri-badge-emerald">ICAR & CACP Knowledge Base</span>
              <span className="text-xs text-[var(--text-muted)] font-['Space_Grotesk']">
                {crops.length} Commodities Indexed
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Crop Agronomy & Economics Database
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Curated agronomic guidelines, climate suitability, water requirements, and ICAR cost-yield benchmarks.
            </p>
          </div>
        </header>

        {/* Filters Toolbar */}
        <section className="agri-card p-5 space-y-3">
          <div className="flex gap-3 flex-wrap items-center">
            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crop name (e.g. Wheat, Mustard, Chickpea, Onion)..."
              className="agri-input flex-1 min-w-[240px]"
            />

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="agri-select max-w-[180px]"
            >
              <option value="All">All Categories</option>
              <option value="Cereal">Cereal</option>
              <option value="Pulse">Pulse</option>
              <option value="Oilseed">Oilseed</option>
              <option value="Cash Crop">Cash Crop</option>
              <option value="Vegetable">Vegetable</option>
            </select>
          </div>

          {/* Season Pills */}
          <div className="flex gap-2 flex-wrap items-center pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mr-1">
              Season:
            </span>
            {["All", "Rabi", "Kharif", "Perennial"].map((season) => (
              <button
                key={season}
                type="button"
                onClick={() => setSelectedSeason(season)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                  selectedSeason === season
                    ? "agri-badge-emerald border shadow-xs"
                    : "bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                }`}
              >
                {season}
              </button>
            ))}
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="agri-card p-12 text-center text-[var(--text-muted)] space-y-2">
            <div className="inline-block w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading ICAR crop knowledge base...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && crops.length === 0 && (
          <div className="agri-card p-12 text-center text-[var(--text-muted)] space-y-2">
            <p className="text-sm font-semibold">No crops found matching your filters.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedSeason("All");
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="text-xs text-[var(--color-primary)] font-bold underline"
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* Crops Grid */}
        {!loading && crops.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crops.map((crop) => (
              <article
                key={crop.id || crop.slug}
                onClick={() => setActiveCrop(crop)}
                className="agri-card p-5 hover:border-[var(--border-strong)] transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                          {crop.name}
                        </strong>
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">
                        {crop.hindiName} · {crop.category}
                      </span>
                    </div>
                    <span className="agri-badge agri-badge-emerald">
                      {crop.season}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">Duration</span>
                      <strong className="text-xs font-bold text-[var(--text-primary)]">{crop.durationDays} days</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">Water</span>
                      <strong className="text-xs font-bold text-[var(--text-primary)]">{crop.waterLevel}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">Yield/Ac</span>
                      <strong className="text-xs font-bold text-[var(--text-primary)]">{crop.yield.quintalsPerAcre} q</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">ICAR Input Cost:</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        ₹{crop.costs.totalPerAcre.toLocaleString("en-IN")}/ac
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Est. Net Profit:</span>
                      <strong className="text-[var(--color-emerald-text)] font-bold">
                        ₹{crop.economics.expectedNetProfitPerAcre.toLocaleString("en-IN")}/ac
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-between items-center text-xs">
                  <span className={crop.economics.mspEligible ? "agri-badge agri-badge-sky" : "text-[var(--text-muted)]"}>
                    {crop.economics.mspEligible ? `✓ MSP: ₹${crop.economics.mspPricePerQuintal}/q` : "Free Market"}
                  </span>
                  <span className="text-xs font-bold text-[var(--color-primary)] hover:underline">
                    View Agronomy →
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Detailed Modal Dialog */}
        {activeCrop && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setActiveCrop(null)}
          >
            <div
              className="agri-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-elevated"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                      {activeCrop.name}
                    </h2>
                    <span className="agri-badge agri-badge-emerald">
                      {activeCrop.season} Season
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {activeCrop.hindiName} · Category: {activeCrop.category}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveCrop(null)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Agronomic Details */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">Growing Cycle</span>
                    <strong className="text-sm font-bold text-[var(--text-primary)]">{activeCrop.durationDays} Days</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">Water Need</span>
                    <strong className="text-sm font-bold text-[var(--text-primary)]">{activeCrop.waterLevel}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">Expected Yield</span>
                    <strong className="text-sm font-bold text-[var(--text-primary)]">{activeCrop.yield.quintalsPerAcre} q/ac</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--color-emerald-bg)] border border-[var(--color-emerald-border)]">
                    <span className="text-[10px] text-[var(--color-emerald-text)] uppercase font-semibold block">Net Profit</span>
                    <strong className="text-sm font-bold text-[var(--color-emerald-text)]">
                      ₹{activeCrop.economics.expectedNetProfitPerAcre.toLocaleString("en-IN")}/ac
                    </strong>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-sm font-['Space_Grotesk'] text-[var(--text-primary)]">
                    Package of Practices (ICAR Recommended):
                  </h3>
                  <div className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-xs text-[var(--text-secondary)]">
                    <p>• <strong>Suitable Soils:</strong> {activeCrop.suitableSoils.join(", ")}</p>
                    <p>• <strong>Cost of Cultivation:</strong> ₹{activeCrop.costs.totalPerAcre.toLocaleString("en-IN")}/acre (Seed: ₹{activeCrop.costs.seed}, Fertilizer: ₹{activeCrop.costs.fertilizer}, Labor: ₹{activeCrop.costs.labor})</p>
                    <p>• <strong>Pests & Hazards:</strong> {activeCrop.pestsAndDiseases.join("; ")}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setActiveCrop(null)}
                  className="agri-btn-secondary text-xs"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
