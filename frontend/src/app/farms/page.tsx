"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import type { FarmRecord } from "../api/farms/repository";

export default function FarmsPage() {
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadFarms() {
      try {
        const res = await fetch("/api/farms");
        if (res.ok && isMounted) {
          const json = await res.json();
          setFarms(json.farms || []);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadFarms();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDeleteFarm(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/farms/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFarms((prev) => prev.filter((f) => f.id !== id));
      } else {
        alert("Failed to delete farm.");
      }
    } catch {
      alert("Network error while deleting farm.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell pageTitle="My Farms">
      <div className="page-container space-y-6">
        {/* Header Title Row */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="agri-badge agri-badge-emerald">PostGIS Georeferenced</span>
              <span className="text-xs text-[var(--text-muted)] font-['Space_Grotesk']">
                {farms.length} Plot(s) Mapped
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Registered Farm Parcels
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Manage field boundaries, compute geodesic acreage, and trigger tailored crop strategies.
            </p>
          </div>

          <Link className="agri-btn-primary shrink-0" href="/farms/new">
            <span>+</span>
            <span>Map New Field Boundary</span>
          </Link>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="agri-card p-12 text-center text-[var(--text-muted)] space-y-2">
            <div className="inline-block w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading your field boundaries from PostGIS...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && farms.length === 0 && (
          <div className="agri-card p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] text-3xl flex items-center justify-center mx-auto border border-[var(--border-accent)]">
              🗺️
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                No Farm Boundaries Mapped Yet
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Use your GPS or search your district on our satellite map to draw your field boundary. Your exact polygon area will instantly drive ML yield predictions and 4-part portfolio optimization.
              </p>
            </div>
            <Link className="agri-btn-primary inline-flex" href="/farms/new">
              <span>📍</span>
              <span>Open Farm Boundary Tool</span>
            </Link>
          </div>
        )}

        {/* Farm Cards Grid */}
        {!loading && farms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {farms.map((farm) => {
              const hectares = (farm.areaAcres / 2.47105).toFixed(2);
              const isDeleting = deletingId === farm.id;

              return (
                <article
                  key={farm.id}
                  className="agri-card p-6 flex flex-col justify-between hover:border-[var(--border-strong)] transition-all space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                          {farm.name}
                        </h2>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          Centroid: {farm.center.lat.toFixed(4)}°N, {farm.center.lng.toFixed(4)}°E
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black px-3 py-1 rounded-lg bg-[var(--color-emerald-bg)] text-[var(--color-emerald-text)] border border-[var(--color-emerald-border)] block">
                          {farm.areaAcres.toFixed(2)} Acres
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                          ({hectares} Hectares)
                        </span>
                      </div>
                    </div>

                    {/* Preferences / Tags */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-subtle)]">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        💧 Water: {farm.preferences?.water || "Medium (Tubewell)"}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        🛡️ Risk: {farm.preferences?.risk || "Balanced Growth"}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        🌱 Active Season: Rabi
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteFarm(farm.id, farm.name)}
                      disabled={isDeleting}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold p-1.5 transition-colors cursor-pointer"
                    >
                      {isDeleting ? "Deleting..." : "Delete Plot"}
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        className="agri-btn-secondary text-xs px-3 py-1.5"
                        href={`/farms/${farm.id}/edit`}
                      >
                        Edit Boundary
                      </Link>
                      <Link
                        className="agri-btn-primary text-xs px-3 py-1.5"
                        href={`/recommendations?farmId=${farm.id}&acres=${farm.areaAcres}&lat=${farm.center.lat}&lng=${farm.center.lng}&name=${encodeURIComponent(farm.name)}&risk=${encodeURIComponent(farm.preferences?.risk || "Balanced")}&water=${encodeURIComponent(farm.preferences?.water || "Medium")}`}
                      >
                        Generate Plan →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}