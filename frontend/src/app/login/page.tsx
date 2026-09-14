"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";

export type LoginRole = "farmer" | "government_buyer" | "private_buyer" | "exporter";

type DemoProfile = {
  name: string;
  role: LoginRole;
  badge: string;
  badgeColor: string;
  state: string;
  detail: string;
  phone: string;
  targetMandi?: string;
};

const DEMO_PROFILES: Record<LoginRole, DemoProfile[]> = {
  farmer: [
    {
      name: "Ramesh Kumar",
      role: "farmer",
      badge: "🌾 Kisan Producer",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      state: "Haryana",
      detail: "Basmati Paddy & Wheat · 4.2 Hectares · PostGIS Linked",
      phone: "9876543210",
    },
    {
      name: "Gurpreet Singh",
      role: "farmer",
      badge: "🌾 Kisan Producer",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      state: "Punjab",
      detail: "Sharbati Wheat & Mustard · 6.5 Hectares · FPO Member",
      phone: "9876543211",
    },
    {
      name: "Anand Patil",
      role: "farmer",
      badge: "🌾 Kisan Producer",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      state: "Maharashtra",
      detail: "Cotton & Soybean · 3.8 Hectares",
      phone: "9765432109",
    },
  ],
  government_buyer: [
    {
      name: "S. Sharma",
      role: "government_buyer",
      badge: "🏛️ FCI Procurement Officer",
      badgeColor: "bg-sky-100 text-sky-900 border-sky-300",
      state: "Punjab",
      detail: "Food Corporation of India (FCI) · Khanna Grain Hub Mandi",
      phone: "9876500001",
      targetMandi: "Khanna Grain Hub (PC-PB-LDH-01)",
    },
    {
      name: "R. K. Verma",
      role: "government_buyer",
      badge: "🏛️ PUNGRAIN Chief Inspector",
      badgeColor: "bg-sky-100 text-sky-900 border-sky-300",
      state: "Punjab",
      detail: "PUNGRAIN Weighbridge & DBT Terminal · Ludhiana Central Mandi",
      phone: "9876500002",
      targetMandi: "Ludhiana Central Mandi (PC-PB-LDH-02)",
    },
  ],
  private_buyer: [
    {
      name: "AgroCorp Sourcing Desk",
      role: "private_buyer",
      badge: "🏢 Wholesale Buyer",
      badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
      state: "Delhi NCR",
      detail: "Milling Wheat, Mustard & Maize Bulk Aggregation",
      phone: "9876500003",
    },
    {
      name: "ITC e-Choupal Desk",
      role: "private_buyer",
      badge: "🏢 Agribusiness Aggregator",
      badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
      state: "Haryana",
      detail: "Karnal Farm-Gate Sourcing Hub & Quality Grading",
      phone: "9876500004",
    },
  ],
  exporter: [
    {
      name: "Sun Agri Exports",
      role: "exporter",
      badge: "🚢 APEDA Exporter",
      badgeColor: "bg-indigo-100 text-indigo-900 border-indigo-300",
      state: "New Delhi",
      detail: "Reg: APEDA/2023/DEL/9981 · UAE, Saudi Arabia & EU Trade",
      phone: "9876500005",
    },
    {
      name: "Bharat Global Trade Hub",
      role: "exporter",
      badge: "🚢 Global Commodity House",
      badgeColor: "bg-indigo-100 text-indigo-900 border-indigo-300",
      state: "Mumbai",
      detail: "IEC: 0519928341 · ASEAN & Middle East Containerized Trade",
      phone: "9876500006",
    },
  ],
};

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<LoginRole>("farmer");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  async function handleSendOtp(customPhone?: string, customName?: string, customRole?: LoginRole) {
    const targetPhone = (customPhone || phone).replace(/\D/g, "");
    if (targetPhone.length !== 10 || !/^[6-9]/.test(targetPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    if (customName) setName(customName);
    if (customRole) setSelectedRole(customRole);

    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: targetPhone }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.error?.message || "Failed to dispatch OTP. Please check your number.");
        setLoading(false);
        return;
      }

      setPhone(targetPhone);
      setStep("otp");
      // Pre-fill demo master key for seamless judge presentation
      setOtpDigits(["1", "2", "3", "4", "5", "6"]);
      setResendCountdown(30);
      setSuccessMsg(data.message || `Verification code sent to +91 ${targetPhone}`);

      setTimeout(() => {
        digitInputRefs.current[5]?.focus();
      }, 100);
    } catch {
      setError("Network error while connecting to authentication service.");
    } finally {
      setLoading(false);
    }
  }

  function handleDigitChange(index: number, val: string) {
    const sanitized = val.replace(/\D/g, "");
    if (!sanitized) {
      const next = [...otpDigits];
      next[index] = "";
      setOtpDigits(next);
      return;
    }

    const next = [...otpDigits];
    next[index] = sanitized.slice(-1);
    setOtpDigits(next);

    if (index < 5 && sanitized) {
      digitInputRefs.current[index + 1]?.focus();
    }

    const fullOtp = next.join("");
    if (fullOtp.length === 6 && !next.includes("")) {
      handleVerifyOtp(fullOtp);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtpDigits(next);

    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    } else {
      digitInputRefs.current[Math.min(5, pasted.length)]?.focus();
    }
  }

  async function handleVerifyOtp(explicitCode?: string) {
    const code = explicitCode || otpDigits.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit OTP code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          otp: code,
          name: name.trim() || undefined,
          role: selectedRole,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.error?.message || "Invalid or expired OTP code.");
        setLoading(false);
        return;
      }

      // Determine redirect URL from response or role destination
      const redirectPath =
        data.redirectUrl ||
        (selectedRole === "government_buyer"
          ? "/marketplace/government"
          : selectedRole === "private_buyer"
          ? "/marketplace/direct"
          : selectedRole === "exporter"
          ? "/marketplace/export"
          : "/marketplace");

      router.push(redirectPath);
      router.refresh();
    } catch {
      setError("Network error during verification.");
      setLoading(false);
    }
  }

  const roleMeta = {
    farmer: {
      title: "Farmer / Kisan Workspace Login",
      subtitle: "Access AI crop planning, direct produce selling, cooperative groups & official MSP procurement.",
      accentClass: "border-emerald-600 text-emerald-700",
      themeBadge: "🌾 Kisan Producer Portal",
    },
    government_buyer: {
      title: "Government Procurement Officer Terminal",
      subtitle: "FCI, NAFED & State Mandi Terminal: Review MSP requests, validate 12-digit codes, biometric verification & weighbridge disbursal.",
      accentClass: "border-sky-700 text-sky-800",
      themeBadge: "🏛️ Government Procurement Terminal",
    },
    private_buyer: {
      title: "Private Agribusiness Buyer Login",
      subtitle: "Direct Farm produce catalog, price-positioning insights vs MSP, counter-offers, and wholesale basket.",
      accentClass: "border-amber-600 text-amber-700",
      themeBadge: "🏢 Private Commodity Desk",
    },
    exporter: {
      title: "International Agri-Export Gateway",
      subtitle: "APEDA & IEC registered export portal: 10-country international demand signals, cost waterfalls & farmer pool matching.",
      accentClass: "border-indigo-700 text-indigo-800",
      themeBadge: "🚢 Export Trade Gateway",
    },
  }[selectedRole];

  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Header Row */}
      <header className="flex justify-between items-center w-full max-w-5xl mx-auto py-2">
        <Link className="brand mb-0" href="/">
          <span className="brand-mark">✳</span>
          <span className="tracking-tight">agriprofit</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Authentication Card */}
      <div className="w-full max-w-2xl mx-auto my-auto py-6">
        {/* Dual Laptop SIH Showcase Banner */}
        <div className="mb-4 p-4 rounded-2xl bg-[#0b4d75] text-white shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xl shrink-0">
            💻💻
          </div>
          <div className="text-xs sm:text-sm">
            <span className="font-extrabold uppercase tracking-wider text-amber-300 block text-[11px]">
              Smart India Hackathon · Dual-Laptop Live Demonstration
            </span>
            <p className="text-slate-100">
              <strong>Laptop 1:</strong> Select <span className="underline font-bold">🌾 Farmer</span> to submit produce & receive 12-digit codes. ·{" "}
              <strong>Laptop 2:</strong> Select <span className="underline font-bold">🏛️ Govt Officer</span> to review, scan biometric & disburse DBT payment.
            </p>
          </div>
        </div>

        <div className="agri-card p-6 sm:p-8 space-y-6 shadow-elevated">
          {/* 1. Structured Role Selector Segmented Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
              Step 1: Select Your Role / Workstation Persona
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("farmer");
                  setName("");
                  setPhone("");
                  setStep("phone");
                }}
                className={`p-3 rounded-xl border-2 text-left font-bold transition-all cursor-pointer ${
                  selectedRole === "farmer"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-xl block mb-1">🌾</span>
                <div className="text-xs font-black">Farmer / Kisan</div>
                <div className="text-[10px] text-slate-500 font-normal leading-tight">Sell MSP & Direct</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole("government_buyer");
                  setName("S. Sharma");
                  setPhone("9876500001");
                  setStep("phone");
                }}
                className={`p-3 rounded-xl border-2 text-left font-bold transition-all cursor-pointer ${
                  selectedRole === "government_buyer"
                    ? "bg-sky-50 border-sky-700 text-sky-950 shadow-sm ring-2 ring-sky-300"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-xl block mb-1">🏛️</span>
                <div className="text-xs font-black">Govt Officer</div>
                <div className="text-[10px] text-slate-500 font-normal leading-tight">FCI / Mandi Gate</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole("private_buyer");
                  setName("AgroCorp Sourcing Desk");
                  setPhone("9876500003");
                  setStep("phone");
                }}
                className={`p-3 rounded-xl border-2 text-left font-bold transition-all cursor-pointer ${
                  selectedRole === "private_buyer"
                    ? "bg-amber-50 border-amber-600 text-amber-950 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-xl block mb-1">🛒</span>
                <div className="text-xs font-black">Private Buyer</div>
                <div className="text-[10px] text-slate-500 font-normal leading-tight">Wholesale Offers</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole("exporter");
                  setName("Sun Agri Exports");
                  setPhone("9876500005");
                  setStep("phone");
                }}
                className={`p-3 rounded-xl border-2 text-left font-bold transition-all cursor-pointer ${
                  selectedRole === "exporter"
                    ? "bg-indigo-50 border-indigo-700 text-indigo-950 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-xl block mb-1">🚢</span>
                <div className="text-xs font-black">APEDA Exporter</div>
                <div className="text-[10px] text-slate-500 font-normal leading-tight">Global Trade</div>
              </button>
            </div>
          </div>

          {/* Card Title & Description */}
          <div className="text-center space-y-1.5 pt-2 border-t border-slate-200">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase ${
              selectedRole === "government_buyer"
                ? "bg-sky-100 text-sky-800"
                : selectedRole === "farmer"
                ? "bg-emerald-100 text-emerald-800"
                : selectedRole === "private_buyer"
                ? "bg-amber-100 text-amber-800"
                : "bg-indigo-100 text-indigo-800"
            }`}>
              {roleMeta.themeBadge}
            </span>
            <h1 className="text-2xl font-black font-['Space_Grotesk'] text-[var(--text-primary)]">
              {step === "phone" ? roleMeta.title : "Verify Phone OTP"}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {step === "phone"
                ? roleMeta.subtitle
                : `Enter the 6-digit verification code sent to +91 ${phone}`}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-4 rounded-2xl text-sm font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border-2 border-rose-500/30">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl text-sm font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500/30">
              {successMsg}
            </div>
          )}

          {/* STEP 1: Phone & Persona Selection */}
          {step === "phone" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp();
              }}
              className="space-y-5"
            >
              {/* Name input */}
              <div className="space-y-2">
                <label
                  htmlFor="farmer-name-input"
                  className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']"
                >
                  {selectedRole === "government_buyer"
                    ? "Official Name & Designation:"
                    : selectedRole === "farmer"
                    ? "Farmer Name (Optional):"
                    : "Entity / Representative Name:"}
                </label>
                <input
                  id="farmer-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    selectedRole === "government_buyer"
                      ? "e.g. S. Sharma (FCI Procurement Officer)"
                      : selectedRole === "farmer"
                      ? "e.g. Ramesh Kumar / Gurpreet Singh"
                      : "e.g. AgroCorp Sourcing Desk"
                  }
                  className="agri-input w-full font-bold text-base min-h-[50px]"
                />
              </div>

              {/* Mobile Number input */}
              <div className="space-y-2">
                <label
                  htmlFor="phone-input"
                  className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']"
                >
                  Registered Mobile Number:
                </label>
                <div className="flex gap-3">
                  <span className="inline-flex items-center px-4 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-default)] text-base font-bold text-[var(--text-primary)] min-h-[50px]">
                    🇮🇳 +91
                  </span>
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="98765 00001"
                    className="agri-input flex-1 font-extrabold text-xl tracking-wider min-h-[50px]"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="agri-btn-primary w-full min-h-[54px] text-lg font-extrabold shadow-lg cursor-pointer"
              >
                {loading ? "Preparing Authorization..." : `Continue as ${roleMeta.themeBadge} →`}
              </button>

              {/* 1-Tap Quick Demo Profiles Tailored for Active Role */}
              <div className="pt-4 border-t-2 border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] font-['Space_Grotesk']">
                    ⚡ 1-Tap Instant Demo Logins ({selectedRole.replace("_", " ").toUpperCase()})
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Pre-fills Demo Master Key 123456
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(DEMO_PROFILES[selectedRole] || []).map((profile) => (
                    <button
                      key={profile.phone}
                      type="button"
                      onClick={() => {
                        setPhone(profile.phone);
                        setName(profile.name);
                        handleSendOtp(profile.phone, profile.name, profile.role);
                      }}
                      className="w-full p-3.5 rounded-2xl bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface-accent)] border-2 border-[var(--border-subtle)] hover:border-[var(--color-primary)] text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] font-['Space_Grotesk']">
                            {profile.name}
                          </span>
                          <span className={`px-2 py-0.2 text-[10px] font-black rounded border ${profile.badgeColor}`}>
                            {profile.badge}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] font-medium">
                          {profile.state} · {profile.detail}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-mono text-[var(--color-primary)] font-extrabold block">
                          +91 {profile.phone}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700">
                          Tap to Login →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* STEP 2: 6-Digit OTP Verification */
            <div className="space-y-5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Logging in as:</span>
                  <div className="text-sm font-black text-slate-900">
                    {name || "User"} · <span className="text-emerald-700">{selectedRole}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="text-xs text-sky-700 hover:underline font-bold"
                >
                  Change Persona / Phone
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-secondary)] font-['Space_Grotesk']">
                    Enter 6-Digit SMS Verification Code:
                  </label>
                  <span className="text-xs text-slate-500">Sent to +91 {phone}</span>
                </div>

                {/* 6 Digit Input Boxes */}
                <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handlePaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        digitInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="agri-input h-14 text-center text-2xl font-black p-0 border-2 rounded-xl"
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={loading || otpDigits.includes("")}
                className="agri-btn-primary w-full min-h-[54px] text-lg font-extrabold shadow-lg cursor-pointer"
              >
                {loading
                  ? "Authenticating Session..."
                  : `Verify & Enter ${roleMeta.themeBadge} →`}
              </button>

              {/* Master Key Demo Info Box */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <p className="text-xs text-emerald-900 font-bold">
                  🔒 Live OTP Gateway Active · Presentation Master Key:{" "}
                  <code className="bg-white px-2 py-0.5 rounded border border-emerald-300 font-black text-emerald-700 text-sm">
                    123456
                  </code>
                </p>
              </div>

              {/* Resend Countdown */}
              <div className="text-center pt-1">
                {resendCountdown > 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    Resend code in <span className="font-bold text-[var(--color-primary)]">{resendCountdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="text-xs text-[var(--color-primary)] font-bold cursor-pointer underline"
                  >
                    Didn&apos;t receive SMS? Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <footer className="text-center text-xs text-[var(--text-muted)] py-3">
        <p>AgriProfit Decision Support Platform · Smart India Hackathon 2024</p>
      </footer>
    </main>
  );
}