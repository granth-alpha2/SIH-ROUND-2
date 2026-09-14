"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import type { SystemMetrics } from "@/lib/admin-service";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadMetrics() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/metrics");
        if (res.ok && isMounted) {
          const json = await res.json();
          if (json.success && json.metrics) {
            setMetrics(json.metrics);
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppShell pageTitle="System Administration & Data Health">
      <div className="space-y-6">
        {/* Source & Freshness Metadata Bar (Fix 3 & 10) */}
        <section className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900">Telemetry Source:</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
              PostgreSQL Database Counters
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
              Live FastAPI /health Probe
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-slate-500">Generated: {metrics?.generatedAt ? new Date(metrics.generatedAt).toLocaleTimeString("en-IN") : "Real-time"}</span>
          </div>
        </section>

        {/* Header Row */}
        <header className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-[#0b4d75] text-white text-xs font-bold rounded">
              System Audit & Service Telemetry
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Dynamic Runtime Aggregates
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Admin Monitoring & Data Quality Center
          </h1>
          <p className="text-sm text-slate-600 max-w-4xl">
            Real-time aggregate platform statistics, data feed freshness indicators, microservice API latencies, and authoritative source provenance tracking.
          </p>
        </header>

        {loading && (
          <div className="agri-card p-12 text-center text-[var(--text-muted)] space-y-2">
            <div className="inline-block w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Gathering system health telemetry...</p>
          </div>
        )}

        {!loading && metrics && (
          <>
            {/* Top 6 KPI Counter Cards */}
            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="agri-card text-center p-4 space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block font-['Space_Grotesk']">
                  Registered Farmers
                </span>
                <strong className="text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                  {metrics.totalRegisteredFarmers}
                </strong>
                <span className="text-[11px] text-[var(--color-primary)] font-semibold">Active Accounts</span>
              </div>

              <div className="agri-card text-center p-4 space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block font-['Space_Grotesk']">
                  Mapped Plots
                </span>
                <strong className="text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                  {metrics.totalFarmsMapped}
                </strong>
                <span className="text-[11px] text-[var(--color-primary)] font-semibold">{metrics.totalMappedAcres} Acres</span>
              </div>

              <div className="agri-card text-center p-4 space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block font-['Space_Grotesk']">
                  Crop Catalog
                </span>
                <strong className="text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                  {metrics.totalCropsCataloged}
                </strong>
                <span className="text-[11px] text-[var(--text-muted)]">ICAR Benchmarks</span>
              </div>

              <div className="agri-card text-center p-4 space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block font-['Space_Grotesk']">
                  Recommendations
                </span>
                <strong className="text-2xl font-bold font-['Space_Grotesk'] text-[var(--color-emerald-text)] block">
                  {metrics.recommendationsGenerated}
                </strong>
                <span className="text-[11px] text-[var(--color-primary)] font-semibold">V1 Deterministic</span>
              </div>

              <div className="agri-card text-center p-4 space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block font-['Space_Grotesk']">
                  Alerts Dispatched
                </span>
                <strong className="text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                  {metrics.activeNotificationsSent}
                </strong>
                <span className="text-[11px] text-[var(--text-muted)]">5 Categories</span>
              </div>

              <div className="agri-card text-center p-4 space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block font-['Space_Grotesk']">
                  AI Queries
                </span>
                <strong className="text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                  {metrics.aiAssistantQueriesProcessed}
                </strong>
                <span className="text-[11px] text-[var(--color-primary)] font-semibold">Hinglish / Hindi</span>
              </div>
            </section>

            <section className="agri-card p-6 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">DATA ACCUMULATION DEMO</p>
                  <h2 className="mt-1 text-xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">Marketplace Data Collected</h2>
                </div>
                <span className="agri-badge agri-badge-sky">Aggregated telemetry only</span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Marketplace Data Collected</p><p className="mt-2 text-2xl font-black text-slate-900">{metrics.accumulation.marketplaceDataCollected}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Observations</p><p className="mt-2 text-2xl font-black text-slate-900">{metrics.accumulation.observations}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Actual Transactions</p><p className="mt-2 text-2xl font-black text-emerald-700">{metrics.accumulation.actualTransactions}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Predictions</p><p className="mt-2 text-2xl font-black text-slate-900">{metrics.accumulation.predictions}</p></div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p><strong>Dataset last updated:</strong> {metrics.accumulation.datasetLastUpdated ? new Date(metrics.accumulation.datasetLastUpdated).toLocaleString("en-IN") : "No persisted records yet"}</p>
                <p className="mt-1"><strong>Model governance:</strong> {metrics.accumulation.retrainingStatus}</p>
                <p className="mt-1 text-xs">Farmer 1 and Farmer 2 records accumulate as observations and outcomes; collection alone does not change a deployed model.</p>
              </div>
            </section>

            <section className="agri-card p-6 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">ADMIN ML / DATA TELEMETRY</p>
                  <h2 className="mt-1 text-xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">Models, datasets &amp; evaluation</h2>
                </div>
                <span className="agri-badge agri-badge-sky">Aggregated, no farmer-level records</span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Prediction count</p><p className="mt-2 text-2xl font-black text-slate-900">{metrics.mlData.predictionCount}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Actual observations</p><p className="mt-2 text-2xl font-black text-emerald-700">{metrics.mlData.actualObservationCount}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Dataset size</p><p className="mt-2 text-2xl font-black text-slate-900">{metrics.mlData.datasetSize}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Model health</p><p className="mt-2 text-lg font-black text-slate-900">{metrics.mlData.modelHealth}</p></div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-sm text-slate-700">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p><strong>LIVE records:</strong> {metrics.mlData.liveRecords}</p><p className="mt-1"><strong>DEMO records:</strong> {metrics.mlData.demoRecords}</p></div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p><strong>Data freshness:</strong> {metrics.mlData.dataFreshness ? new Date(metrics.mlData.dataFreshness).toLocaleString("en-IN") : "No persisted timestamp"}</p><p className="mt-1"><strong>Last dataset export:</strong> {metrics.mlData.lastDatasetExport ? new Date(metrics.mlData.lastDatasetExport).toLocaleString("en-IN") : "No completed export"}</p></div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950"><strong>Governance:</strong> data collection does not automatically improve deployed models. Retraining requires controlled dataset review, evaluation, approval, and versioned deployment.</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold"><tr><th className="p-3">Model</th><th className="p-3">Version</th><th className="p-3">Type</th><th className="p-3">Last evaluation</th><th className="p-3">Valid metrics</th></tr></thead>
                  <tbody className="divide-y divide-slate-200">{metrics.mlData.models.map((model) => <tr key={`${model.name}-${model.version}`}><td className="p-3 font-bold">{model.name}</td><td className="p-3">{model.version}</td><td className="p-3">{model.modelType}</td><td className="p-3">{model.lastEvaluation ? new Date(model.lastEvaluation).toLocaleString("en-IN") : "Not available"}</td><td className="p-3">{Object.entries(model.metrics).length ? Object.entries(model.metrics).map(([key, value]) => `${key}: ${value}`).join(" · ") : "Not available"}</td></tr>)}</tbody>
                </table>
              </div>
            </section>

            {/* Data Quality & Source Provenance Matrix */}
            <section className="agri-card p-6 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <h2 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                    Data Quality & Provenance Matrix
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Transparent verification of live external feeds, official government gazettes, and spatial databases.
                  </p>
                </div>
                <span className="agri-badge agri-badge-sky">
                  Zero Mocked Data Falsification
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] font-bold border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="p-3">Data Feed Name</th>
                      <th className="p-3">Source Type</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Latency</th>
                      <th className="p-3">Update Frequency</th>
                      <th className="p-3">Coverage & Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {metrics.dataQualityMatrix.map((feed, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-surface-subtle)] transition-colors">
                        <td className="p-3 font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                          {feed.feedName}
                        </td>
                        <td className="p-3 text-[var(--text-secondary)] font-medium">
                          {feed.sourceType}
                        </td>
                        <td className="p-3">
                          <span
                            className={`agri-badge ${
                              feed.status.includes("LIVE")
                                ? "agri-badge-emerald"
                                : feed.status.includes("OFFICIAL")
                                ? "agri-badge-sky"
                                : "agri-badge-amber"
                            }`}
                          >
                            ✓ {feed.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-[var(--text-primary)]">
                          {feed.latencyMs} ms
                        </td>
                        <td className="p-3 text-[var(--text-muted)]">
                          {feed.updateFrequency} ({feed.cacheTtl})
                        </td>
                        <td className="p-3 text-[var(--text-secondary)]">
                          {feed.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* API Health & Latency Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* API Endpoints Table */}
              <section className="agri-card p-6 space-y-3">
                <h2 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  Core REST Endpoints Telemetry
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                      <tr>
                        <th className="p-2.5">Endpoint</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Latency</th>
                        <th className="p-2.5">Uptime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {metrics.apiHealthChecks.map((api, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-mono text-[var(--text-primary)] font-medium">
                            <span className="text-[10px] text-[var(--text-muted)] font-bold mr-1.5">{api.method}</span>
                            {api.endpoint}
                          </td>
                          <td className="p-2.5 font-bold text-[var(--color-emerald-text)]">{api.status}</td>
                          <td className="p-2.5 font-mono text-[var(--text-muted)]">{api.latencyMs}ms</td>
                          <td className="p-2.5 font-bold text-[var(--text-primary)]">{api.uptimePct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Recent System Events Log */}
              <section className="agri-card p-6 space-y-3">
                <h2 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                  Audit Events & Execution Log
                </h2>
                <div className="space-y-2.5 text-xs">
                  {metrics.recentSystemEvents.map((evt, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-start gap-2.5">
                      <span
                        className={`agri-badge ${
                          evt.level === "SUCCESS" ? "agri-badge-emerald" : "agri-badge-sky"
                        }`}
                      >
                        {evt.level}
                      </span>
                      <div className="flex-1">
                        <p className="text-[var(--text-primary)]">{evt.message}</p>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {new Date(evt.timestamp).toLocaleTimeString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
