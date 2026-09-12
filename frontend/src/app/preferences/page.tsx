"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import type {
  FarmerPreferenceRecord,
  RiskAppetite,
  ResourceLevel,
  SoilType,
} from "../api/preferences/repository";
import { DISTRICT_MASTER } from "@/lib/geo-service";

const candidateCrops = [
  "Wheat",
  "Mustard",
  "Chickpea (Gram)",
  "Maize",
  "Cotton",
  "Soybean",
  "Onion",
  "Potato",
  "Tomato",
  "Sugarcane",
  "Paddy (Rice)",
  "Groundnut",
];

const soilOptions: SoilType[] = ["Alluvial", "Black", "Red", "Sandy", "Clay", "Loam"];

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<FarmerPreferenceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showSoilDetails, setShowSoilDetails] = useState(false);

  // Farmer account details
  const [farmerName, setFarmerName] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");
  const [farmerVillage, setFarmerVillage] = useState("");
  const [farmerDistrict, setFarmerDistrict] = useState("Ludhiana");
  const [farmerState, setFarmerState] = useState("Punjab");
  const [farmerLang, setFarmerLang] = useState("en");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [prefRes, authRes] = await Promise.all([
          fetch("/api/preferences"),
          fetch("/api/auth/me"),
        ]);

        if (prefRes.ok && isMounted) {
          const json = await prefRes.json();
          if (json.success && json.preferences) {
            setPrefs(json.preferences);
          }
        }

        if (authRes.ok && isMounted) {
          const authJson = await authRes.json();
          if (authJson.success && authJson.user) {
            setFarmerName(
              authJson.user.name && !authJson.user.name.includes("(+91") && !authJson.user.name.startsWith("Farmer (")
                ? authJson.user.name
                : ""
            );
            setFarmerPhone(authJson.user.phone || "");
            if (authJson.user.village) setFarmerVillage(authJson.user.village);
            if (authJson.user.district) setFarmerDistrict(authJson.user.district);
            if (authJson.user.state) setFarmerState(authJson.user.state);
            if (authJson.user.preferredLanguage) setFarmerLang(authJson.user.preferredLanguage);
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  function toggleCrop(listName: "preferredCrops" | "cropsToAvoid", crop: string) {
    if (!prefs) return;
    const current = prefs[listName] || [];
    const updated = current.includes(crop) ? current.filter((c) => c !== crop) : [...current, crop];

    const otherListName = listName === "preferredCrops" ? "cropsToAvoid" : "preferredCrops";
    const otherUpdated = (prefs[otherListName] || []).filter((c) => c !== crop);

    setPrefs({
      ...prefs,
      [listName]: updated,
      [otherListName]: otherUpdated,
    });
  }

  async function handleSave() {
    if (!prefs) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      const [prefRes, authRes] = await Promise.all([
        fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prefs),
        }),
        fetch("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: farmerName.trim(),
            village: farmerVillage.trim(),
            district: farmerDistrict,
            state: farmerState,
            preferredLanguage: farmerLang,
          }),
        }),
      ]);

      const prefData = await prefRes.json();
      const authData = await authRes.json();

      if (prefRes.ok && prefData.success) {
        setStatusMessage({
          type: "success",
          text: `✓ Farmer profile for ${farmerName || "Farmer"} and optimization preferences saved to database!`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: prefData?.error?.message || authData?.error?.message || "Could not save preferences.",
        });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network error while saving preferences." });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !prefs) {
    return (
      <AppShell pageTitle="Preferences">
        <div className="page-container">
          <div className="agri-card p-12 text-center text-[var(--text-muted)] space-y-2">
            <div className="inline-block w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading farmer preferences...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Farmer Preferences">
      <div className="page-container max-w-4xl mx-auto space-y-8">
        {/* Header Row */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border-2 border-[var(--border-default)] shadow-card">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="agri-badge agri-badge-emerald text-sm font-bold">Optimization Constraints</span>
              <span className="text-sm font-bold text-[var(--text-secondary)] font-['Space_Grotesk']">
                Active Farm Profile
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] font-['Space_Grotesk']">
              Farmer Preferences & Strategy
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
              Tailor crop advice to your risk tolerance, irrigation capacity, working capital, and preferred crops.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="agri-btn-primary min-h-[60px] text-lg sm:text-xl font-extrabold px-8 shrink-0 shadow-lg cursor-pointer"
          >
            {saving ? "Saving Preferences..." : "💾 Save Preferences →"}
          </button>
        </header>

        {statusMessage && (
          <div
            className={`p-4 rounded-2xl text-base font-bold border-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* 0. Farmer Identification & Account Details */}
        <section className="agri-card p-6 sm:p-8 rounded-3xl space-y-5 border-2 border-l-8 border-l-[var(--color-primary)]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <strong className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                Farmer Identification & Account Details
              </strong>
              <span className="text-base text-[var(--text-secondary)] mt-1 block">
                Personal details are stored in the database and linked to your farm recommendations.
              </span>
            </div>
            <span className="agri-badge agri-badge-emerald text-sm font-bold">
              Database Sync Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div>
              <label htmlFor="pref-farmer-name" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Farmer Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="pref-farmer-name"
                type="text"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                placeholder="e.g. Ramesh Patel / Gurpreet Singh"
                className="agri-input w-full font-medium"
              />
            </div>

            <div>
              <label htmlFor="pref-farmer-phone" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Registered Mobile Number
              </label>
              <input
                id="pref-farmer-phone"
                type="text"
                value={farmerPhone ? `+91 ${farmerPhone}` : "+91-9648153123"}
                disabled
                className="agri-input w-full bg-[var(--bg-surface-subtle)] opacity-75 cursor-not-allowed font-mono text-xs"
              />
            </div>

            <div>
              <label htmlFor="pref-farmer-village" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Village / Gram Panchayat
              </label>
              <input
                id="pref-farmer-village"
                type="text"
                value={farmerVillage}
                onChange={(e) => setFarmerVillage(e.target.value)}
                placeholder="e.g. Samrala / Rampur"
                className="agri-input w-full text-xs"
              />
            </div>

            <div>
              <label htmlFor="pref-farmer-district" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                District & Agro-Climatic Zone
              </label>
              <select
                id="pref-farmer-district"
                value={farmerDistrict}
                onChange={(e) => {
                  const sel = DISTRICT_MASTER.find((d) => d.district === e.target.value);
                  setFarmerDistrict(e.target.value);
                  if (sel) setFarmerState(sel.state);
                }}
                className="agri-select w-full text-xs"
              >
                {DISTRICT_MASTER.map((d) => (
                  <option key={d.districtId} value={d.district}>
                    {d.district} ({d.state}) — {d.zone}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 1. Risk Appetite */}
        <section className="agri-card p-6 space-y-3">
          <div>
            <strong className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
              1. Risk Tolerance Strategy
            </strong>
            <span className="text-xs text-[var(--text-muted)]">
              How would you like to balance price safety vs profit upside?
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {(
              [
                ["Conservative", "MSP Floor Priority", "Shield against price drop; guaranteed govt floor"],
                ["Balanced", "Optimal Mix", "Blend staples with high-margin cash crops"],
                ["Growth", "High-Return Focus", "Maximize profit potential in volatile markets"],
              ] as [RiskAppetite, string, string][]
            ).map(([value, label, desc]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPrefs({ ...prefs, riskAppetite: value })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                  prefs.riskAppetite === value
                    ? "border-[var(--color-primary)] bg-[var(--bg-surface-accent)] ring-1 ring-[var(--border-accent)]"
                    : "border-[var(--border-default)] bg-[var(--bg-surface-subtle)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div className="flex justify-between items-center">
                  <strong className="text-sm font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">{value}</strong>
                  {prefs.riskAppetite === value && (
                    <span className="text-xs font-bold text-[var(--color-primary)]">✓ Active</span>
                  )}
                </div>
                <div className="text-xs font-bold text-[var(--color-primary-text)]">{label}</div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 2. Water Availability */}
        <section className="agri-card p-6 space-y-3">
          <div>
            <strong className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
              2. Water & Irrigation Access
            </strong>
            <span className="text-xs text-[var(--text-muted)]">
              Select the assured water source for this upcoming season.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {(
              [
                ["Low", "Rainfed / Limited", "Prefer low-water drought-hardy crops (Mustard, Gram, Bajra)"],
                ["Medium", "Borewell / Tube-well", "Moderate irrigation (Wheat, Maize, Soybean)"],
                ["High", "Canal / Assured Water", "High-water crops (Paddy, Sugarcane, Vegetables)"],
              ] as [ResourceLevel, string, string][]
            ).map(([value, label, desc]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPrefs({ ...prefs, waterAvailability: value })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                  prefs.waterAvailability === value
                    ? "border-[var(--color-primary)] bg-[var(--bg-surface-accent)] ring-1 ring-[var(--border-accent)]"
                    : "border-[var(--border-default)] bg-[var(--bg-surface-subtle)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div className="flex justify-between items-center">
                  <strong className="text-sm font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">{value}</strong>
                  {prefs.waterAvailability === value && (
                    <span className="text-xs font-bold text-[var(--color-primary)]">✓ Active</span>
                  )}
                </div>
                <div className="text-xs font-bold text-[var(--color-primary-text)]">{label}</div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 3. Working Capital Investment Capacity */}
        <section className="agri-card p-6 space-y-3">
          <div>
            <strong className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
              3. Working Capital Budget
            </strong>
            <span className="text-xs text-[var(--text-muted)]">
              Seed, fertilizer, diesel, and labor budget per acre.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {(
              [
                ["Low", "< ₹25,000 / acre", "Low input pulses and oilseeds"],
                ["Medium", "₹25,000 - ₹50,000 / acre", "Standard grain and commercial crops"],
                ["High", "> ₹50,000 / acre", "High-input horticultural and cash crops"],
              ] as [ResourceLevel, string, string][]
            ).map(([value, label, desc]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPrefs({ ...prefs, investmentCapacity: value })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                  prefs.investmentCapacity === value
                    ? "border-[var(--color-primary)] bg-[var(--bg-surface-accent)] ring-1 ring-[var(--border-accent)]"
                    : "border-[var(--border-default)] bg-[var(--bg-surface-subtle)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div className="flex justify-between items-center">
                  <strong className="text-sm font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">{value}</strong>
                  {prefs.investmentCapacity === value && (
                    <span className="text-xs font-bold text-[var(--color-primary)]">✓ Active</span>
                  )}
                </div>
                <div className="text-xs font-bold text-[var(--color-primary-text)]">{label}</div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 4. Preferred Crops & Crops to Avoid */}
        <section className="agri-card p-6 space-y-4">
          <div>
            <strong className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
              4. Preferred Crops
            </strong>
            <span className="text-xs text-[var(--text-muted)]">
              Click crops you prefer or have machinery/market access for:
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {candidateCrops.map((crop) => {
              const isPreferred = (prefs.preferredCrops || []).includes(crop);
              return (
                <button
                  key={crop}
                  type="button"
                  onClick={() => toggleCrop("preferredCrops", crop)}
                  className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    isPreferred
                      ? "agri-badge-emerald border shadow-xs"
                      : "bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]"
                  }`}
                >
                  {isPreferred ? `✓ ${crop}` : `+ ${crop}`}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)]">
            <strong className="text-sm font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block mb-1">
              Crops to Exclude / Avoid:
            </strong>
            <div className="flex gap-2 flex-wrap">
              {candidateCrops.map((crop) => {
                const isAvoided = (prefs.cropsToAvoid || []).includes(crop);
                return (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => toggleCrop("cropsToAvoid", crop)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                      isAvoided
                        ? "agri-badge-rose border shadow-xs"
                        : "bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] hover:text-rose-500 border border-[var(--border-subtle)]"
                    }`}
                  >
                    {isAvoided ? `✕ Exclude ${crop}` : crop}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Soil Profile */}
        <section className="agri-card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <strong className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)] block">
                5. Soil Classification
              </strong>
              <span className="text-xs text-[var(--text-muted)]">
                Active soil profile: {prefs.soilType || "Alluvial"} (pH {prefs.soilPh || 7.2})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowSoilDetails(!showSoilDetails)}
              className="text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
            >
              {showSoilDetails ? "Hide Soil Details ▲" : "Configure Soil Details ▼"}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {soilOptions.map((soil) => (
              <button
                key={soil}
                type="button"
                onClick={() =>
                  setPrefs({
                    ...prefs,
                    soilType: soil,
                  })
                }
                className={`p-3 rounded-xl border text-center text-xs font-bold font-['Space_Grotesk'] transition-all cursor-pointer ${
                  prefs.soilType === soil
                    ? "agri-badge-emerald border shadow-xs"
                    : "bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]"
                }`}
              >
                {soil}
              </button>
            ))}
          </div>

          {showSoilDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
              <div className="space-y-1">
                <label htmlFor="soil-ph" className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Soil pH</label>
                <input
                  id="soil-ph"
                  type="number"
                  step="0.1"
                  value={prefs.soilPh || 7.2}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      soilPh: Number(e.target.value) || 7.2,
                    })
                  }
                  className="agri-input font-bold"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="soil-carbon" className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Organic Carbon Level</label>
                <select
                  id="soil-carbon"
                  value={prefs.soilOrganicCarbon || "Medium"}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      soilOrganicCarbon: e.target.value as ResourceLevel,
                    })
                  }
                  className="agri-select font-bold"
                >
                  <option value="Low">Low (&lt; 0.5%)</option>
                  <option value="Medium">Medium (0.5% - 0.75%)</option>
                  <option value="High">High (&gt; 0.75%)</option>
                </select>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
