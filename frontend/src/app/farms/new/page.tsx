"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import FarmMapPicker from "../../components/FarmMapPicker";

export default function NewFarmPage() {
  const router = useRouter();

  return (
    <AppShell pageTitle="Farm Boundary Studio">
      <div className="page-container space-y-6">
        {/* Header Title Row */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="agri-badge agri-badge-emerald">Satellite Polygon Engine</span>
              <span className="text-xs text-[var(--text-muted)] font-['Space_Grotesk']">
                Geodesic WGS-84 (SRID 4326)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Map Your Farm Field Boundary
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Use GPS or search your district, then click corners to draw your field polygon. Exact area and 4-part strategic recommendations calculate automatically.
            </p>
          </div>

          <Link className="agri-btn-secondary shrink-0" href="/farms">
            ← View Saved Farms
          </Link>
        </header>

        {/* 4-Step Interactive Guide Stepper */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xs space-y-1">
            <div className="text-xs font-bold text-[var(--color-primary)] font-['Space_Grotesk']">
              Step 1: Locate
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Click 📍 Use My Location or search district</p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xs space-y-1">
            <div className="text-xs font-bold text-[var(--color-primary)] font-['Space_Grotesk']">
              Step 2: Draw
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Click boundary corners to outline field</p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xs space-y-1">
            <div className="text-xs font-bold text-[var(--color-primary)] font-['Space_Grotesk']">
              Step 3: Calculate
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Instant geodesic Acres & Hectares</p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xs space-y-1">
            <div className="text-xs font-bold text-[var(--color-primary)] font-['Space_Grotesk']">
              Step 4: Optimize
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Generate 4-Part Multi-Crop Profit Plan</p>
          </div>
        </div>

        {/* Interactive Farm Map Picker Container */}
        <div className="agri-card p-6">
          <FarmMapPicker
            onAreaChange={() => {}}
            onSaved={(savedFarm) => {
              const risk = savedFarm.preferences?.risk || "Balanced";
              const water = savedFarm.preferences?.water || "Medium";
              router.push(
                `/recommendations?farmId=${savedFarm.id}&acres=${savedFarm.areaAcres}&lat=${savedFarm.center.lat}&lng=${savedFarm.center.lng}&name=${encodeURIComponent(savedFarm.name)}&risk=${encodeURIComponent(risk)}&water=${encodeURIComponent(water)}`
              );
              router.refresh();
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}