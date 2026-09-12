"use client";

import { usePathname, useRouter } from "next/navigation";

const demoSteps = [
  { step: 1, label: "Demo Login", path: "/login", description: "Authenticate as verified farmer" },
  { step: 2, label: "Overview", path: "/", description: "Farmer command center" },
  { step: 3, label: "My Farms", path: "/farms", description: "Spatial land parcels" },
  { step: 4, label: "Preferences", path: "/preferences", description: "Risk, water & soil settings" },
  { step: 5, label: "Weather Outlook", path: "/weather", description: "7-day agro-meteorology" },
  { step: 6, label: "Market & MSP Watch", path: "/markets", description: "Mandi prices & MSP safety" },
  { step: 7, label: "Crop Discovery", path: "/crops", description: "Curated agronomic catalog" },
  { step: 8, label: "Recommendations", path: "/recommendations", description: "4-part portfolio strategy" },
  { step: 9, label: "Crop Plan Roadmap", path: "/crop-plan", description: "ICAR milestone schedule" },
  { step: 10, label: "Advisory Inbox", path: "/notifications", description: "5-category farm alerts" },
  { step: 11, label: "AI Agronomist", path: "/assistant", description: "Contextual Hinglish advisor" },
  { step: 12, label: "Admin Telemetry", path: "/admin", description: "Data quality & API health" },
];

export default function DemoTourBanner() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  const currentIdx = demoSteps.findIndex(
    (s) => s.path === pathname || (s.path !== "/" && pathname.startsWith(s.path))
  );

  const activeStep = currentIdx >= 0 ? demoSteps[currentIdx] : demoSteps[1];
  const nextStep = demoSteps[(currentIdx + 1) % demoSteps.length];

  return (
    <div className="bg-[var(--bg-surface-accent)] text-[var(--text-primary)] px-6 py-2 text-xs flex justify-between items-center flex-wrap gap-2 border-b border-[var(--border-accent)] transition-colors select-none">
      <div className="flex items-center gap-2">
        <span className="agri-badge agri-badge-emerald text-[9px] px-1.5 py-0.2">
          SIH EVALUATION TOUR
        </span>
        <span className="font-semibold text-[var(--color-primary-text)] font-['Space_Grotesk']">
          Step {activeStep.step} of {demoSteps.length}:
        </span>
        <span className="font-bold text-[var(--text-primary)] font-['Space_Grotesk']">{activeStep.label}</span>
        <span className="hidden md:inline text-[var(--text-muted)]">({activeStep.description})</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push(nextStep.path)}
          className="agri-btn-primary text-[11px] py-1 px-3 shadow-2xs"
        >
          Next: {nextStep.label} →
        </button>
      </div>
    </div>
  );
}
