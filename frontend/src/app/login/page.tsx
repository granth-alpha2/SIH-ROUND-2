"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";

const DEMO_FARMERS = [
  { name: "Gurpreet Singh", state: "Punjab", crop: "Wheat & Mustard", phone: "9876543210" },
  { name: "Ramesh Yadav", state: "Uttar Pradesh", crop: "Potato & Rice", phone: "9812345678" },
  { name: "Anand Patil", state: "Maharashtra", crop: "Cotton & Sugarcane", phone: "9765432109" },
];

export default function LoginPage() {
  const router = useRouter();
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

  async function handleSendOtp(customPhone?: string, customName?: string) {
    const targetPhone = (customPhone || phone).replace(/\D/g, "");
    if (targetPhone.length !== 10 || !/^[6-9]/.test(targetPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    if (customName) {
      setName(customName);
    }

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
      setOtpDigits(["", "", "", "", "", ""]);
      setResendCountdown(30);
      setSuccessMsg(data.message || `Verification code sent to +91 ${targetPhone}`);

      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
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
        body: JSON.stringify({ phone, otp: code, name: name.trim() || undefined }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.error?.message || "Invalid or expired OTP code.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error during verification.");
      setLoading(false);
    }
  }

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
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="agri-card p-6 sm:p-8 space-y-6 shadow-elevated">
          {/* Card Title */}
          <div className="text-center space-y-1.5">
            <span className="agri-badge agri-badge-emerald">
              AI Agricultural Decision Support
            </span>
            <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
              {step === "phone" ? "Farmer Workspace Login" : "Verify Phone OTP"}
            </h1>
            <p className="text-base text-[var(--text-secondary)] leading-relaxed">
              {step === "phone"
                ? "Enter your mobile number to receive a one-time SMS verification code."
                : `Enter the 6-digit code sent via SMS to +91 ${phone}`}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-4 rounded-2xl text-base font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border-2 border-rose-500/30">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl text-base font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500/30">
              {successMsg}
            </div>
          )}

          {/* STEP 1: Phone Entry */}
          {step === "phone" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp();
              }}
              className="space-y-5"
            >
              {/* Optional Farmer Name input */}
              <div className="space-y-2">
                <label
                  htmlFor="farmer-name-input"
                  className="text-base font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']"
                >
                  Farmer Name <span className="text-[var(--text-muted)] text-sm font-normal lowercase">(optional)</span>:
                </label>
                <input
                  id="farmer-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Patel / Gurpreet Singh"
                  className="agri-input w-full font-bold text-lg min-h-[56px]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="phone-input"
                  className="text-base font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']"
                >
                  Mobile Number:
                </label>
                <div className="flex gap-3">
                  <span className="inline-flex items-center px-4 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-default)] text-base font-bold text-[var(--text-primary)] min-h-[56px]">
                    🇮🇳 +91
                  </span>
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="98765 43210"
                    className="agri-input flex-1 font-extrabold text-xl tracking-wider min-h-[56px]"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="agri-btn-primary w-full min-h-[60px] text-xl font-extrabold shadow-lg"
              >
                {loading ? "Sending SMS OTP..." : "Send OTP via SMS →"}
              </button>

              {/* Quick Demo Profiles */}
              <div className="pt-5 border-t-2 border-[var(--border-subtle)] space-y-3">
                <p className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] text-center font-['Space_Grotesk']">
                  ⚡ 1-Tap Demo Profiles (Tap Any to Login)
                </p>
                <div className="space-y-3">
                  {DEMO_FARMERS.map((farmer) => (
                    <button
                      key={farmer.phone}
                      type="button"
                      onClick={() => {
                        setPhone(farmer.phone);
                        setName(farmer.name);
                        handleSendOtp(farmer.phone, farmer.name);
                      }}
                      className="w-full p-4 rounded-2xl bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface-accent)] border-2 border-[var(--border-subtle)] hover:border-[var(--color-primary)] text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <div className="text-base sm:text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] font-['Space_Grotesk']">
                          {farmer.name}
                        </div>
                        <div className="text-sm font-semibold text-[var(--text-secondary)]">
                          {farmer.state} · {farmer.crop}
                        </div>
                      </div>
                      <span className="text-base font-mono text-[var(--color-primary)] font-extrabold">
                        +91 {farmer.phone}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* STEP 2: 6-Digit OTP Matrix */
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-base font-bold text-[var(--text-secondary)] font-['Space_Grotesk']">
                    Enter 6-Digit SMS Code:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="text-base text-[var(--color-primary)] hover:underline font-bold cursor-pointer"
                  >
                    Change Number
                  </button>
                </div>

                {/* 6 Individual Large Digit Boxes */}
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
                      className="agri-input h-16 text-center text-2xl font-extrabold p-0 border-2 rounded-2xl"
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={loading || otpDigits.includes("")}
                className="agri-btn-primary w-full min-h-[60px] text-xl font-extrabold shadow-lg"
              >
                {loading ? "Verifying Code..." : "Verify & Enter Farm Workspace →"}
              </button>

              {/* Resend Countdown */}
              <div className="text-center pt-2">
                {resendCountdown > 0 ? (
                  <p className="text-base text-[var(--text-muted)]">
                    Resend SMS in <span className="font-extrabold text-[var(--color-primary)]">{resendCountdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="text-base text-[var(--color-primary)] font-bold cursor-pointer underline"
                  >
                    Didn&apos;t receive SMS? Resend OTP
                  </button>
                )}
              </div>

              {/* Dev Info */}
              <div className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)] text-center">
                <p className="text-base text-[var(--text-secondary)] font-medium">
                  🔒 Live SMS Gateway Active · Master Demo Key: <code className="text-[var(--color-primary)] font-extrabold text-lg">123456</code>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <footer className="text-center text-xs text-[var(--text-muted)] py-3">
        <p>AgriProfit Decision Support Platform · Smart India Hackathon</p>
      </footer>
    </main>
  );
}