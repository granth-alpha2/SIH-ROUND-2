"use client";

import { useEffect, useState } from "react";

export type BaseMode = "day" | "night";

export default function ThemeToggle() {
  const [mode, setMode] = useState<BaseMode>("day");
  const [eyeCare, setEyeCare] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedMode = (localStorage.getItem("agriprofit_mode") as BaseMode) || "day";
      const savedEyeCare = localStorage.getItem("agriprofit_eyecare") === "true";

      const validMode = savedMode === "night" ? "night" : "day";
      setMode(validMode);
      setEyeCare(savedEyeCare);
      applyTheme(validMode, savedEyeCare);
    } catch {
      applyTheme("day", false);
    }
  }, []);

  function applyTheme(m: BaseMode, ec: boolean) {
    const themeKey = ec ? `${m}-eyecare` : m;
    document.documentElement.setAttribute("data-theme", themeKey);
    document.documentElement.setAttribute("data-mode", m);
    document.documentElement.setAttribute("data-eyecare", ec ? "true" : "false");
  }

  function handleModeChange(newMode: BaseMode) {
    setMode(newMode);
    try {
      localStorage.setItem("agriprofit_mode", newMode);
      applyTheme(newMode, eyeCare);
    } catch {
      // Ignore
    }
  }

  function toggleEyeCare() {
    const nextEyeCare = !eyeCare;
    setEyeCare(nextEyeCare);
    try {
      localStorage.setItem("agriprofit_eyecare", nextEyeCare ? "true" : "false");
      applyTheme(mode, nextEyeCare);
    } catch {
      // Ignore
    }
  }

  if (!mounted) {
    return (
      <div className="h-9 w-44 rounded-xl bg-black/5 dark:bg-white/5 animate-pulse" />
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme Display Controls"
      className="inline-flex items-center gap-1.5 p-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] shadow-2xs backdrop-blur-md transition-all select-none"
    >
      {/* 1. Day / Night Segment Switch */}
      <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => handleModeChange("day")}
          title="Switch to Day Mode (Crisp High-Contrast Daylight)"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold font-['Space_Grotesk'] transition-all cursor-pointer ${
            mode === "day"
              ? "bg-[var(--bg-surface)] text-[var(--color-primary-text)] shadow-xs font-bold ring-1 ring-[var(--border-default)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-80 hover:opacity-100"
          }`}
        >
          <span>☀️</span>
          <span className="hidden sm:inline">Day</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("night")}
          title="Switch to Night Mode (Deep OLED Dark Theme)"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold font-['Space_Grotesk'] transition-all cursor-pointer ${
            mode === "night"
              ? "bg-[var(--bg-surface)] text-[var(--color-primary-text)] shadow-xs font-bold ring-1 ring-[var(--border-accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-80 hover:opacity-100"
          }`}
        >
          <span>🌙</span>
          <span className="hidden sm:inline">Night</span>
        </button>
      </div>

      {/* 2. Eye Care Warm Blue-Light Filter Button */}
      <button
        type="button"
        onClick={toggleEyeCare}
        title={`Eye Care Filter is ${eyeCare ? "Active" : "Disabled"}. Reduces blue light for reduced eye strain.`}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold font-['Space_Grotesk'] transition-all cursor-pointer border ${
          eyeCare
            ? "bg-[var(--color-amber-bg)] text-[var(--color-amber-text)] border-[var(--color-amber-border)] shadow-2xs font-bold"
            : "bg-transparent text-[var(--text-muted)] border-transparent hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
        }`}
      >
        <span>🌅</span>
        <span className="hidden md:inline">Eye Care</span>
        <span
          className={`text-[9px] font-black uppercase px-1 py-0.2 rounded ${
            eyeCare
              ? "bg-[var(--color-amber)] text-white"
              : "bg-black/10 dark:bg-white/10 text-[var(--text-muted)]"
          }`}
        >
          {eyeCare ? "ON" : "OFF"}
        </span>
      </button>
    </div>
  );
}
