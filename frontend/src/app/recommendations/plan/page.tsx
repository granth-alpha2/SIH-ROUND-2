"use client";

import { useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import { generateCropLifecyclePlan, type CropLifecyclePlan } from "@/lib/lifecycle-planner";
import { DISTRICT_MASTER } from "@/lib/geo-service";

type Allocation = {
  name: string;
  percent: number;
  score: number;
  expectedRevenue: number;
  estimatedCost: number;
  explanation: string;
};

type AcceptedPlan = {
  overall: {
    title: string;
    explanation: string;
  };
  allocations: Allocation[];
  sowingDate?: string;
  region?: string;
  farmName?: string;
  totalAcres?: number;
};

const defaultPlan: AcceptedPlan = {
  overall: {
    title: "Balanced Multi-Crop Allocation",
    explanation: "Multi-crop allocation balancing high-MSP crops with low-water oilseeds and nitrogen-fixing pulses.",
  },
  allocations: [
    { name: "Wheat", percent: 50, score: 94, expectedRevenue: 82000, estimatedCost: 31000, explanation: "Guaranteed MSP floor protection." },
    { name: "Mustard", percent: 25, score: 88, expectedRevenue: 44000, estimatedCost: 17500, explanation: "High mandi demand and water efficiency." },
    { name: "Onion", percent: 15, score: 90, expectedRevenue: 95000, estimatedCost: 20800, explanation: "High cash upside." },
    { name: "Chickpea", percent: 10, score: 82, expectedRevenue: 16000, estimatedCost: 10000, explanation: "Improves soil health and nitrogen levels." },
  ],
  sowingDate: new Date().toISOString(),
  region: "Punjab - Bathinda (Trans-Gangetic Plains)",
};

export default function CropPlannerPage() {
  const [sowingDate, setSowingDate] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("acceptedRecommendation");
        if (raw) {
          const parsed = JSON.parse(raw) as AcceptedPlan;
          return parsed.sowingDate || new Date().toISOString();
        }
      } catch {
        // Fallback
      }
    }
    return new Date().toISOString();
  });

  const [region, setRegion] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("acceptedRecommendation");
        if (raw) {
          const parsed = JSON.parse(raw) as AcceptedPlan;
          if (parsed.region) return parsed.region;
        }
      } catch {
        // Fallback
      }
    }
    return `${DISTRICT_MASTER[0].state} - ${DISTRICT_MASTER[0].district} (${DISTRICT_MASTER[0].zone})`;
  });

  const [selectedCropIndex, setSelectedCropIndex] = useState<number>(0);

  const accepted = useMemo<AcceptedPlan>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("acceptedRecommendation");
        if (raw) {
          return JSON.parse(raw) as AcceptedPlan;
        }
      } catch {
        // Fallback
      }
    }
    return defaultPlan;
  }, []);

  const activeCropAlloc = accepted.allocations[selectedCropIndex] || accepted.allocations[0];

  const plan: CropLifecyclePlan = useMemo(() => {
    return generateCropLifecyclePlan(activeCropAlloc.name, sowingDate, region);
  }, [activeCropAlloc.name, sowingDate, region]);

  return (
    <AppShell pageTitle="Crop Lifecycle Plan">
      <div className="page-container space-y-6">
        {/* Header Row */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="agri-badge agri-badge-emerald">ICAR Package of Practices</span>
              <span className="text-xs text-[var(--text-muted)] font-['Space_Grotesk']">
                {plan.totalDurationDays} Day Lifecycle
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Agronomic Lifecycle Operations Roadmap
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Stage-by-stage operations schedule calibrated to your sowing date, regional moisture, and soil conditions.
            </p>
          </div>
        </header>

        {/* Date & Region Controls */}
        <section className="agri-card p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="sowing-date" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-['Space_Grotesk']">
                Sowing Date:
              </label>
              <input
                id="sowing-date"
                type="date"
                value={sowingDate ? new Date(sowingDate).toISOString().slice(0, 10) : ""}
                onChange={(e) => setSowingDate(new Date(e.target.value).toISOString())}
                className="agri-input font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="zone-select" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-['Space_Grotesk']">
                Agro-Climatic Zone:
              </label>
              <select
                id="zone-select"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="agri-select"
              >
                {DISTRICT_MASTER.map((d) => (
                  <option key={d.districtId} value={`${d.state} - ${d.district} (${d.zone})`}>
                    {d.state} - {d.district} ({d.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Multi-Crop Navigation Tabs */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex gap-2 flex-wrap items-center">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mr-1">
              Select Crop Plan:
            </span>
            {accepted.allocations.map((alloc, idx) => (
              <button
                key={alloc.name}
                type="button"
                onClick={() => setSelectedCropIndex(idx)}
                className={`text-xs px-3.5 py-2 rounded-xl border font-bold transition-all cursor-pointer ${
                  selectedCropIndex === idx
                    ? "agri-btn-primary shadow-xs"
                    : "agri-btn-secondary"
                }`}
              >
                {alloc.name} ({alloc.percent}% of farm)
              </button>
            ))}
          </div>
        </section>

        {/* Plan Header Summary Card */}
        <section className="p-6 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[#064e3b] text-white border border-[var(--border-accent)] shadow-card space-y-3">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-200 font-bold font-['Space_Grotesk']">
                Active Crop Advisory Roadmap
              </span>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-3xl font-bold font-['Space_Grotesk'] text-white">
                  {plan.cropName}
                </h2>
                <span className="text-sm text-emerald-200">({plan.hindiName})</span>
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                Agro-Climatic Zone: {plan.region} · Season: {plan.season}
              </p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold font-['Space_Grotesk'] text-white">
                {plan.totalDurationDays} Days
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Sowing: {plan.sowingDate} → Harvest: {plan.expectedHarvestDate}
              </p>
            </div>
          </div>
        </section>

        {/* Visual Phase Progression Icons (Sowing → Vegetative → Flowering → Maturity → Harvest) */}
        <section className="agri-card p-6 sm:p-8 rounded-3xl border-2 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
            Lifecycle Progress: {plan.cropName} ({plan.hindiName})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {[
              { num: 1, label: "Sowing", hindi: "बुवाई", icon: "🌱" },
              { num: 2, label: "Vegetative", hindi: "विकास", icon: "🌿" },
              { num: 3, label: "Flowering", hindi: "फूल", icon: "🌸" },
              { num: 4, label: "Maturity", hindi: "पकना", icon: "🌾" },
              { num: 5, label: "Harvest", hindi: "कटाई", icon: "🚜" },
            ].map((st) => {
              const matchedStage = plan.stages.find((s) => s.stageNumber === st.num);
              const isActive = matchedStage?.status === "active";
              const isDone = matchedStage?.status === "completed";
              return (
                <div
                  key={st.num}
                  className={`p-4 rounded-2xl border-2 text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                    isActive
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] ring-2 ring-[var(--color-primary)] shadow-md"
                      : isDone
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-[var(--border-default)] bg-[var(--bg-surface-subtle)] opacity-75"
                  }`}
                >
                  <span className="text-3xl">{st.icon}</span>
                  <strong className="text-base font-bold text-[var(--text-primary)] block">
                    {st.label}
                  </strong>
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">
                    {st.hindi}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${
                      isActive
                        ? "bg-[var(--color-primary)] text-white"
                        : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-[var(--bg-canvas)] text-[var(--text-muted)]"
                    }`}
                  >
                    {isActive ? "● Active Now" : isDone ? "✓ Done" : "Upcoming"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* PROMINENT "TODAY'S TASK" BANNER */}
        {(() => {
          const activeOrFirstStage = plan.stages.find((s) => s.status === "active") || plan.stages[0];
          return (
            <section className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border-2 border-emerald-500/50 shadow-lg space-y-4">
              <div className="flex items-center gap-2">
                <span className="agri-badge agri-badge-emerald text-base font-bold">
                  ★ Today&apos;s Priority Field Action
                </span>
                <span className="text-base font-bold text-[var(--text-secondary)]">
                  Stage: {activeOrFirstStage.stageName} ({activeOrFirstStage.hindiName})
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="today-task-check"
                    className="w-7 h-7 rounded-lg text-[var(--color-primary)] border-2 border-[var(--border-strong)] mt-1 cursor-pointer"
                  />
                  <label htmlFor="today-task-check" className="cursor-pointer space-y-1">
                    <strong className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] font-['Space_Grotesk'] block">
                      {activeOrFirstStage.irrigationGuidance}
                    </strong>
                    <p className="text-base text-[var(--text-secondary)] font-medium">
                      Fertilizer Action: {activeOrFirstStage.fertilizerGuidance}
                    </p>
                  </label>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Timeline Milestones Progression */}
        <section className="space-y-5">
          <h2 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
            Complete Operations Schedule ({plan.stages.length} Milestones)
          </h2>

          <div className="space-y-5">
            {plan.stages.map((stage) => (
              <article
                key={stage.stageNumber}
                className={`agri-card p-6 sm:p-8 rounded-3xl space-y-5 border-2 ${
                  stage.status === "active"
                    ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary-light)]"
                    : ""
                }`}
              >
                {/* Stage Header */}
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div className="flex items-start gap-4">
                    <span className="w-12 h-12 rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary-text)] text-lg font-extrabold flex items-center justify-center shrink-0 border-2 border-[var(--border-accent)]">
                      #{stage.stageNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-xl sm:text-2xl font-extrabold font-['Space_Grotesk'] text-[var(--text-primary)]">
                          {stage.stageName}
                        </strong>
                        <span className="text-base font-bold text-[var(--text-secondary)]">({stage.hindiName})</span>
                      </div>
                      <p className="text-base text-[var(--text-secondary)] font-medium mt-1">
                        {stage.startDate} — {stage.endDate} ({stage.durationDays} days · {stage.startDayOffset}–{stage.endDayOffset} Days After Sowing)
                      </p>
                    </div>
                  </div>

                  <span
                    className={`agri-badge text-sm font-bold px-4 py-1.5 ${
                      stage.status === "active"
                        ? "agri-badge-emerald"
                        : stage.status === "completed"
                        ? "agri-badge-sky"
                        : "agri-badge-amber"
                    }`}
                  >
                    {stage.status === "active" ? "● Active Stage" : stage.status === "completed" ? "✓ Completed" : "Upcoming"}
                  </span>
                </div>

                {/* Operations Guidance Grid with Large Readable Text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t-2 border-[var(--border-subtle)] text-base">
                  <div className="p-5 rounded-2xl bg-[var(--color-sky-bg)] border-2 border-[var(--color-sky-border)] space-y-1.5">
                    <strong className="text-[var(--color-sky-text)] block text-sm uppercase font-bold tracking-wider">
                      🚿 Irrigation Operations
                    </strong>
                    <p className="text-[var(--color-sky-text)] leading-relaxed text-base font-medium">{stage.irrigationGuidance}</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[var(--color-emerald-bg)] border-2 border-[var(--color-emerald-border)] space-y-1.5">
                    <strong className="text-[var(--color-emerald-text)] block text-sm uppercase font-bold tracking-wider">
                      🌾 Nutrient & Fertilizer Splits
                    </strong>
                    <p className="text-[var(--color-emerald-text)] leading-relaxed text-base font-medium">{stage.fertilizerGuidance}</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[var(--color-amber-bg)] border-2 border-[var(--color-amber-border)] space-y-1.5">
                    <strong className="text-[var(--color-amber-text)] block text-sm uppercase font-bold tracking-wider">
                      🌿 Weed Management
                    </strong>
                    <p className="text-[var(--color-amber-text)] leading-relaxed text-base font-medium">{stage.weedManagement}</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[var(--color-rose-bg)] border-2 border-[var(--color-rose-border)] space-y-1.5">
                    <strong className="text-[var(--color-rose-text)] block text-sm uppercase font-bold tracking-wider">
                      🐛 Pest & Disease Surveillance
                    </strong>
                    <p className="text-[var(--color-rose-text)] leading-relaxed text-base font-medium">
                      {stage.pestMonitoring} {stage.diseaseMonitoring}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Advisory Disclaimer Notice */}
        <section className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)]">Advisory Disclaimer:</strong> {plan.advisoryDisclaimer}
        </section>
      </div>
    </AppShell>
  );
}
