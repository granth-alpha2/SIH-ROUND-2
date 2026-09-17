"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DISTRICT_MASTER } from "@/lib/geo-service";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import LanguageSelector from "./LanguageSelector";
import PageAudioTranslator from "./PageAudioTranslator";
import PortalBreadcrumb from "./PortalBreadcrumb";
import UnnatiAIPopup from "./UnnatiAIPopup";

// Top-level Navigation strictly structured as Government Service Pillars
const TOP_NAV_ITEMS = [
  { label: "Home", href: "/", key: "nav.home" },
  { label: "Farm Services", href: "/farm", key: "nav.farm" },
  { label: "Crop Services", href: "/crop-services", key: "nav.cropServices" },
  { label: "Market Services", href: "/market-services", key: "nav.marketServices" },
  { label: "Reports & Records", href: "/reports", key: "nav.reports" },
  { label: "Schemes", href: "/schemes", key: "nav.schemes" },
  { label: "Knowledge Base", href: "/knowledge", key: "nav.knowledge" },
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिन्दी (Hindi)" },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "gu", name: "ગુજરાતી (Gujarati)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
  { code: "or", name: "ଓଡ଼ିଆ (Odia)" },
];

type AppShellProps = {
  children: React.ReactNode;
  pageTitle: string;
};

type UserInfo = {
  id: string;
  phone: string;
  name: string;
  role: string;
  state?: string;
  district?: string;
  village?: string;
  preferredLanguage?: string;
};

export default function AppShell({ children, pageTitle }: AppShellProps) {
  const { t, language, setLanguage } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  // Accessibility & Theme States
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg" | "xl">("md");
  const [highContrast, setHighContrast] = useState(false);
  const [themeMode, setThemeMode] = useState<"day" | "night">("day");
  const [eyeCare, setEyeCare] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");

  // Profile modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editVillage, setEditVillage] = useState("");
  const [editDistrict, setEditDistrict] = useState("Ludhiana");
  const [editState, setEditState] = useState("Punjab");
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    // 1. Load accessibility and theme preferences
    try {
      const savedFs = localStorage.getItem("agriprofit_font_size") as "sm" | "md" | "lg" | "xl";
      if (savedFs) {
        setFontSize(savedFs);
        document.documentElement.setAttribute("data-font-size", savedFs);
      }
      const savedHc = localStorage.getItem("agriprofit_high_contrast") === "true";
      if (savedHc) {
        setHighContrast(true);
        document.documentElement.setAttribute("data-contrast", "high");
      }
      const savedMode = (localStorage.getItem("agriprofit_mode") as "day" | "night") ||
                        (localStorage.getItem("agriprofit_theme") === "night" ? "night" : "day");
      setThemeMode(savedMode);
      document.documentElement.setAttribute("data-mode", savedMode);
      if (savedMode === "night") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      const savedEc = localStorage.getItem("agriprofit_eyecare") === "true";
      setEyeCare(savedEc);
      document.documentElement.setAttribute("data-eyecare", String(savedEc));

      const savedLang = localStorage.getItem("agriprofit_lang") || "en";
      setSelectedLang(savedLang);
    } catch {}

    // 2. Load authenticated user details
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.user) {
            setUser(json.user);
            const currentName = json.user.name || "";
            const isDefault =
              !currentName ||
              currentName.includes("(+91") ||
              currentName.startsWith("Farmer (");

            setEditName(!isDefault ? currentName : "");
            if (json.user.village) setEditVillage(json.user.village);
            if (json.user.district) setEditDistrict(json.user.district);
            if (json.user.state) setEditState(json.user.state);
            if (json.user.preferredLanguage) setSelectedLang(json.user.preferredLanguage);
          }
        }
      } catch {}
    }
    loadUser();

    // 3. Load notifications count
    async function loadNotifCount() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const json = await res.json();
          if (json.success && typeof json.unreadCount === "number") {
            setUnreadCount(json.unreadCount);
          }
        }
      } catch {}
    }
    loadNotifCount();
  }, []);

  function handleFontSizeChange(size: "sm" | "md" | "lg" | "xl") {
    setFontSize(size);
    try {
      localStorage.setItem("agriprofit_font_size", size);
      document.documentElement.setAttribute("data-font-size", size);
    } catch {}
  }

  function handleToggleHighContrast() {
    const nextVal = !highContrast;
    setHighContrast(nextVal);
    try {
      localStorage.setItem("agriprofit_high_contrast", String(nextVal));
      document.documentElement.setAttribute("data-contrast", nextVal ? "high" : "normal");
      document.documentElement.setAttribute("data-theme", nextVal ? "high-contrast" : (eyeCare ? `${themeMode}-eyecare` : themeMode));
    } catch {}
  }

  function handleToggleThemeMode() {
    const nextMode = themeMode === "day" ? "night" : "day";
    setThemeMode(nextMode);
    try {
      localStorage.setItem("agriprofit_mode", nextMode);
      localStorage.setItem("agriprofit_theme", nextMode);
      document.documentElement.setAttribute("data-mode", nextMode);
      if (nextMode === "night") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      if (!highContrast) {
        document.documentElement.setAttribute("data-theme", eyeCare ? `${nextMode}-eyecare` : nextMode);
      }
    } catch {}
  }

  function handleToggleEyeCare() {
    const nextEc = !eyeCare;
    setEyeCare(nextEc);
    try {
      localStorage.setItem("agriprofit_eyecare", String(nextEc));
      document.documentElement.setAttribute("data-eyecare", String(nextEc));
      if (!highContrast) {
        document.documentElement.setAttribute("data-theme", nextEc ? `${themeMode}-eyecare` : themeMode);
      }
    } catch {}
  }

  function handleLanguageChange(langCode: string) {
    setSelectedLang(langCode);
    try {
      localStorage.setItem("agriprofit_lang", langCode);
    } catch {}
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    window.location.href = "/login";
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) {
      setSaveStatus("Please enter your name.");
      return;
    }

    setSavingProfile(true);
    setSaveStatus(null);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          village: editVillage.trim(),
          district: editDistrict,
          state: editState,
          preferredLanguage: selectedLang,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        setSaveStatus("✓ Details saved to database successfully!");
        setTimeout(() => {
          setShowEditModal(false);
          setSaveStatus(null);
        }, 1000);
      } else {
        setSaveStatus(data.error?.message || "Failed to update profile.");
      }
    } catch {
      setSaveStatus("Network error while updating profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  const isGovt = user?.role === "government_buyer";
  const isBuyer = user?.role === "private_buyer";
  const isExporter = user?.role === "exporter";

  let displayName = "";
  if (isGovt) {
    displayName = user?.name || "Officer S. Sharma (FCI)";
  } else if (isBuyer) {
    displayName = user?.name || "AgroCorp Buyer";
  } else if (isExporter) {
    displayName = user?.name || "APEDA Exporter";
  } else if (user) {
    const isDefaultName = !user.name || user.name.startsWith("Farmer (") || user.name.includes("(+91");
    displayName = isDefaultName
      ? user.phone
        ? `Farmer (+91 ${user.phone.slice(-4)})`
        : "Farmer Account"
      : user.name;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* 1. Skip Navigation Link for Accessibility */}
      <a href="#MainContent" className="skip-nav-link">
        {t("nav.skipToContent", "Skip to main content (मुख्य सामग्री पर जाएं)")}
      </a>

      {/* 2. Tricolor Government Identity Line */}
      <div className="gov-tricolor-bar" aria-hidden="true" />

      {/* 3. Top Government Identity & Accessibility Bar (PM-KISAN / e-NAM inspired) */}
      <header className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Mission Tagline */}
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold tracking-wide flex items-center gap-1.5 text-xs sm:text-sm">
              <span>🌱</span>
              <span className="text-white font-bold">{t("topbar.tagline", "Empowering Farmers and Reducing Losses")}</span>
            </span>
          </div>

          {/* Accessibility, Theme & Multilingual Controls */}
          <div className="flex items-center gap-2.5 ml-auto flex-wrap">
            {/* Audio Listen / Read-Aloud Button */}
            <PageAudioTranslator compact />

            {/* Day / Night Mode Toggle */}
            <button
              type="button"
              onClick={handleToggleThemeMode}
              className={`px-2.5 py-0.5 rounded border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                themeMode === "night"
                  ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                  : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
              }`}
              title={themeMode === "night" ? "Switch to Day Mode" : "Switch to Night Mode"}
              aria-label="Toggle Day / Night Mode"
            >
              <span>{themeMode === "night" ? "🌙 Night" : "☀️ Day"}</span>
            </button>

            {/* Eye Care Mode Toggle */}
            <button
              type="button"
              onClick={handleToggleEyeCare}
              className={`px-2.5 py-0.5 rounded border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                eyeCare
                  ? "bg-amber-500/25 text-amber-300 border-amber-400 ring-1 ring-amber-400/40 shadow-sm"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
              title="Toggle Eye Care Warm Light Filter (Reduces blue light & eye strain)"
              aria-label="Toggle Eye Care Mode"
            >
              <span>👁️ Eye Care {eyeCare ? "ON" : "OFF"}</span>
            </button>

            {/* Font Size Adjusters */}
            <div className="flex items-center bg-slate-800 rounded px-1.5 py-0.5 border border-slate-700" title="Adjust Text Size">
              <button
                type="button"
                onClick={() => handleFontSizeChange("sm")}
                className={`px-1.5 py-0.5 font-bold cursor-pointer ${fontSize === "sm" ? "text-amber-400" : "text-slate-300 hover:text-white"}`}
                aria-label="Decrease Font Size"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange("md")}
                className={`px-1.5 py-0.5 font-bold cursor-pointer ${fontSize === "md" ? "text-amber-400" : "text-slate-300 hover:text-white"}`}
                aria-label="Normal Font Size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange("lg")}
                className={`px-1.5 py-0.5 font-bold cursor-pointer ${fontSize === "lg" ? "text-amber-400" : "text-slate-300 hover:text-white"}`}
                aria-label="Increase Font Size"
              >
                A+
              </button>
            </div>

            {/* High Contrast Toggle */}
            <button
              type="button"
              onClick={handleToggleHighContrast}
              className={`px-2 py-0.5 rounded border text-[11px] font-bold transition-colors cursor-pointer ${
                highContrast ? "bg-amber-400 text-black border-amber-500" : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
              }`}
              title="Toggle High Contrast Mode"
            >
              {highContrast ? "Normal Contrast" : "🌓 Contrast"}
            </button>

            {/* Global Multilingual Selector */}
            <LanguageSelector compact />
          </div>
        </div>
      </header>

      {/* 4. Mid Header: National Agricultural Identity + Search + User Quick Controls */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Main Logo & Title */}
          <Link href="/" className="flex items-center gap-3 group text-decoration-none">
            <div className="w-11 h-11 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-xl shadow-sm">
              🌾
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-800 transition-colors">
                AgriProfit <span className="text-base font-normal text-slate-600">| एग्रीप्रॉफ़िट</span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5 leading-tight">
                National Crop Planning, APMC Market Watch & Agro-Climatic Intelligence Portal
              </p>
            </div>
          </Link>

          {/* Right Action Icons: Notifications & User Session */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Center */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
              title="Alerts & Advisories"
              aria-label="View Alerts"
            >
              <span className="text-base">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            {user ? (
              <>
                {/* Farmer / User Account Button */}
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800"
                  title="Edit account profile"
                >
                  <span className={`w-7 h-7 rounded-full font-black flex items-center justify-center text-xs ${
                    isGovt
                      ? "bg-sky-100 text-sky-900"
                      : isBuyer
                      ? "bg-amber-100 text-amber-900"
                      : isExporter
                      ? "bg-indigo-100 text-indigo-900"
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {isGovt ? "🏛️" : isBuyer ? "🏢" : isExporter ? "🚢" : "👤"}
                  </span>
                  <span className="hidden sm:inline-block max-w-[150px] truncate">{displayName}</span>
                </button>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold cursor-pointer transition-colors"
                  title="Sign Out"
                >
                  <span className="hidden sm:inline">Sign out</span>
                  <span className="sm:hidden">⇦</span>
                </button>
              </>
            ) : (
              /* Sign In Button for Guests / Unauthenticated Visitors */
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all"
                title="Sign in to your account"
              >
                <span>🔐</span>
                <span className="font-extrabold">Sign in</span>
              </Link>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-bold"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Role-Specific Workstation Banner for Government Officers */}
      {isGovt && (
        <div className="bg-[#0b4d75] text-white py-2 px-4 sm:px-6 border-b border-[#083754]">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-[10px] uppercase tracking-wider">
                🏛️ Official Mandi Workstation
              </span>
              <span className="font-semibold text-slate-100">
                FCI / Civil Supplies Gate Terminal Active · Logged in as <strong>{displayName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/marketplace/government"
                className="px-3 py-1 bg-white hover:bg-amber-300 text-slate-950 rounded-lg font-black text-xs transition-colors shadow-sm"
              >
                Open Verification Queue & Weighbridge →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 5. Main Desktop Navigation Bar (Strict Government Specification - NEVER hidden on desktop) */}
      <nav className="bg-[#0b4d75] text-white border-b border-[#083754] hidden lg:block sticky top-0 z-40 shadow-sm" aria-label="Main Navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ul className="flex items-center flex-wrap m-0 p-0 list-none">
            {TOP_NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block px-4 py-3 text-xs font-black tracking-wider uppercase transition-colors border-b-4 ${
                      isActive
                        ? "!bg-[#083754] !text-amber-300 border-amber-400"
                        : "!text-white hover:!bg-[#094163] hover:!text-amber-200 border-transparent"
                    }`}
                  >
                    {t(item.key, item.label)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* 6. Deep Government Portal Breadcrumbs Trail & Context Bar */}
      <div className="bg-slate-100 border-b border-slate-200 py-2 px-4 sm:px-6 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <PortalBreadcrumb />
          </div>

          <div className="text-slate-500 hidden sm:flex items-center gap-3 shrink-0">
            <span>📅 As on: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">● Portal Operational</span>
          </div>
        </div>
      </div>

      {/* 7. Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-50 flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 bg-white h-full shadow-2xl flex flex-col p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-slate-900 text-lg">🌾 AgriProfit Portal</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded text-slate-600 hover:text-slate-900 font-bold"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-1">
              {TOP_NAV_ITEMS.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded font-bold text-sm ${
                      isActive ? "bg-[#0b4d75] text-white" : "text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {t(item.key, item.label)}
                  </Link>
                );
              })}

              <div className="pt-4 border-t border-slate-200 space-y-1">
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ⚙️ Admin Telemetry & Health
                </Link>
                <Link
                  href="/preferences"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ⚙️ Farmer Preferences
                </Link>

                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 flex items-center justify-between"
                  >
                    <span>🚪 Sign Out ({displayName})</span>
                    <span>⇦</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded text-xs font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 text-center"
                  >
                    🔐 Sign In to Portal
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* 8. Main Content Body */}
      <main id="MainContent" tabIndex={-1} className="flex-1 pb-16 lg:pb-10 pt-4 sm:pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">{children}</div>
      </main>

      {/* 9. Mobile Bottom Navigation (Strict Requirement 12: Home · Farm · Market · Alerts · More) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-300 py-1.5 px-2 z-40 shadow-lg flex items-center justify-around text-center"
        aria-label="Mobile Bottom Navigation"
      >
        <Link
          href="/"
          className={`flex flex-col items-center text-[11px] font-bold ${pathname === "/" ? "text-emerald-700" : "text-slate-600"}`}
        >
          <span className="text-base">🏠</span>
          <span>Home</span>
        </Link>
        <Link
          href="/farms"
          className={`flex flex-col items-center text-[11px] font-bold ${pathname.startsWith("/farms") ? "text-emerald-700" : "text-slate-600"}`}
        >
          <span className="text-base">🗺️</span>
          <span>Farm</span>
        </Link>
        <Link
          href="/marketplace"
          className={`flex flex-col items-center text-[11px] font-bold ${pathname.startsWith("/marketplace") ? "text-emerald-700" : "text-slate-600"}`}
        >
          <span className="text-base">🏬</span>
          <span>Market</span>
        </Link>
        <Link
          href="/notifications"
          className={`flex flex-col items-center text-[11px] font-bold relative ${pathname.startsWith("/notifications") ? "text-emerald-700" : "text-slate-600"}`}
        >
          <span className="text-base">🔔</span>
          <span>Alerts</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 right-2 bg-rose-600 text-white font-bold text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center text-[11px] font-bold text-slate-600"
        >
          <span className="text-base">☰</span>
          <span>More</span>
        </button>
      </nav>

      {/* 10. Official Government Portal Footer (pmkisan.gov.in / agriculture.gov.in standard) */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs mt-auto pt-8 pb-16 lg:pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-800">
            {/* Col 1: Platform Identity */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <span>🌱</span>
                <span>AgriProfit</span>
              </div>
              <p className="text-emerald-400 text-[12px] font-medium leading-relaxed">
                Empowering Farmers and Reducing Losses
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Data-driven crop planning, APMC mandi intelligence, and agro-climatic decision support.
              </p>
            </div>

            {/* Col 2: Farmer Services */}
            <div className="space-y-2">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Farmer Services</h4>
              <ul className="space-y-1 text-slate-400">
                <li><Link href="/farms/new" className="hover:text-white">Map New Farm Plot</Link></li>
                <li><Link href="/recommendations" className="hover:text-white">Crop Suitability Scoring</Link></li>
                <li><Link href="/markets" className="hover:text-white">APMC Mandi Modal Prices</Link></li>
                <li><Link href="/weather" className="hover:text-white">7-Day Meteorological Forecast</Link></li>
              </ul>
            </div>

            {/* Col 3: Knowledge & Schemes */}
            <div className="space-y-2">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Schemes & Knowledge</h4>
              <ul className="space-y-1 text-slate-400">
                <li><Link href="/schemes" className="hover:text-white">PM-KISAN & PMFBY Guidelines</Link></li>
                <li><Link href="/knowledge" className="hover:text-white">ICAR Crop Protection Practices</Link></li>
                <li><Link href="/crops" className="hover:text-white">CACP 2024-25 MSP Floor Benchmarks</Link></li>
                <li><Link href="/assistant" className="hover:text-white">उन्नति AI (Unnati AI) Advisory</Link></li>
              </ul>
            </div>

            {/* Col 4: Platform Compliance */}
            <div className="space-y-2">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Governance & Provenance</h4>
              <ul className="space-y-1 text-slate-400">
                <li><Link href="/admin" className="hover:text-white">System Data Health & Telemetry</Link></li>
                <li><a href="https://agmarknet.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white">Agmarknet 2.0 Benchmark Portal ↗</a></li>
                <li><a href="https://www.icar.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white">Indian Council of Agricultural Research ↗</a></li>
                <li><a href="https://data.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white">Open Government Data (OGD) ↗</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              © 2026 AgriProfit National Agricultural Portal • Designed for Smart India Hackathon (SIH2026)
            </div>
            <div className="flex items-center gap-3">
              <span>Last Reviewed: 12-Sep-2026</span>
              <span>•</span>
              <span>Screen Reader Accessible (GIGW Compliant)</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 11. Profile Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Farmer Account Information</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Farmer Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Gurpreet Singh"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#0b4d75]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State</label>
                  <select
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-300 rounded text-xs"
                  >
                    <option value="Punjab">Punjab</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Bihar">Bihar</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">District</label>
                  <select
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-300 rounded text-xs"
                  >
                    {DISTRICT_MASTER.filter((d) => d.state === editState).map((d) => (
                      <option key={d.districtId} value={d.district}>
                        {d.district}
                      </option>
                    ))}
                    <option value="Ludhiana">Ludhiana</option>
                    <option value="Bathinda">Bathinda</option>
                    <option value="Karnal">Karnal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Village / Ward</label>
                <input
                  type="text"
                  value={editVillage}
                  onChange={(e) => setEditVillage(e.target.value)}
                  placeholder="e.g. Rampura Phul"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>

              {saveStatus && (
                <div
                  className={`p-2 rounded text-xs font-semibold ${
                    saveStatus.startsWith("✓") ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                  }`}
                >
                  {saveStatus}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 bg-[#0b4d75] text-white rounded text-xs font-bold hover:bg-[#083754] disabled:opacity-50"
                >
                  {savingProfile ? "Saving to Database..." : "Save Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Persistent Unnati AI Platform Assistant Pop-up Window */}
      <UnnatiAIPopup />
    </div>
  );
}