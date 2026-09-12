"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "../../../components/AppShell";
import FarmMapPicker from "../../../components/FarmMapPicker";
import type { FarmRecord } from "../../../api/farms/repository";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

export default function EditFarmPage({ params }: EditPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [farm, setFarm] = useState<FarmRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/farms/${id}`);
        if (!res.ok) {
          setError("Farm record not found.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.success && data.farm) {
          setFarm(data.farm);
        } else {
          setError("Could not load farm details.");
        }
      } catch {
        setError("Network error while loading farm.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this farm boundary? This action cannot be undone.")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/farms/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/farms");
        router.refresh();
      } else {
        alert("Failed to delete farm.");
      }
    } catch {
      alert("Network error while deleting farm.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell pageTitle="Edit Farm Boundary">
      <div className="page-container space-y-6">
        {/* Header Row */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="agri-badge agri-badge-emerald">PostGIS Polygon Editor</span>
              <span className="text-xs text-[var(--text-muted)] font-['Space_Grotesk']">
                ID: {id.slice(0, 8)}...
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              {farm ? `Edit ${farm.name}` : "Edit Farm Boundary"}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Adjust boundary vertices, update crop subdivisions, or remove this plot from your profile.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link className="agri-btn-secondary" href="/farms">
              ← Back to My Farms
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 font-bold text-xs transition cursor-pointer"
            >
              {deleting ? "Deleting..." : "Delete Farm"}
            </button>
          </div>
        </header>

        {loading && (
          <div className="agri-card p-12 text-center text-[var(--text-muted)] space-y-2">
            <div className="inline-block w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading farm boundary from spatial database...</p>
          </div>
        )}

        {error && (
          <div className="agri-card p-12 text-center text-rose-500 space-y-3">
            <p className="text-sm font-bold">{error}</p>
            <Link className="agri-btn-secondary inline-flex text-xs" href="/farms">
              Return to My Farms
            </Link>
          </div>
        )}

        {!loading && farm && (
          <div className="agri-card p-6">
            <FarmMapPicker
              initialFarm={farm}
              onAreaChange={() => {}}
              onSaved={() => {
                router.push("/farms");
                router.refresh();
              }}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
