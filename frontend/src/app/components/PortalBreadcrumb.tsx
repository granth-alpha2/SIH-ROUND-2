"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PortalBreadcrumbProps {
  customItems?: BreadcrumbItem[];
  showBack?: boolean;
}

// Human-friendly titles for route segments in the government portal
const ROUTE_LABELS: Record<string, string> = {
  farm: "Farm Services",
  plots: "My Farm Plots",
  boundary: "Boundary Studio",
  soil: "Soil Services",
  upload: "Upload Soil Test",
  analysis: "Soil Analysis",
  fertilizer: "Fertilizer Advisory",
  health: "Soil Health Guide",
  weather: "Agro-Weather Advisory",
  farms: "My Farm Plots",
  new: "Map New Field Boundary",
  edit: "Edit Plot",
  "crop-services": "Crop Services",
  planning: "Crop Planning Wizard",
  configure: "Configure Constraints",
  results: "Recommended Results",
  crop: "Crop Details",
  compare: "Crop Compare Studio",
  seasonal: "Seasonal Catch Crops",
  database: "Crop Database",
  crops: "Crop Agronomy Catalog",
  diagnostics: "Crop Vision Diagnostics",
  assistant: "उन्नति AI (Unnati AI)",
  "market-services": "Market Services",
  prices: "APMC Daily Prices",
  markets: "APMC Mandi Prices",
  msp: "National MSP Catalog",
  ncdex: "NCDEX Commodity Derivatives",
  marketplace: "Secondary Produce Market",
  direct: "Direct Buyer Market",
  groups: "Cooperative Group Selling",
  export: "APEDA Export Desk",
  government: "FCI Mandi Procurement Console",
  transactions: "Transactions & Receipts",
  reports: "Reports & Records",
  schemes: "Government Schemes",
  knowledge: "ICAR Crop Knowledge Base",
  admin: "Platform Telemetry",
};

export default function PortalBreadcrumb({
  customItems,
  showBack = true,
}: PortalBreadcrumbProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Generate breadcrumb items from pathname if customItems not provided
  const items: BreadcrumbItem[] = React.useMemo(() => {
    if (customItems && customItems.length > 0) {
      return [{ label: "Home", href: "/" }, ...customItems];
    }

    if (!pathname || pathname === "/") {
      return [];
    }

    const segments = pathname.split("/").filter(Boolean);
    const crumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    let accumulatedPath = "";
    segments.forEach((seg, idx) => {
      accumulatedPath += `/${seg}`;
      const isLast = idx === segments.length - 1;
      const cleanLabel =
        ROUTE_LABELS[seg.toLowerCase()] ||
        decodeURIComponent(seg)
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

      crumbs.push({
        label: cleanLabel,
        href: isLast ? undefined : accumulatedPath,
      });
    });

    return crumbs;
  }, [pathname, customItems]);

  if (items.length <= 1 && pathname === "/") {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300 font-sans shadow-2xs"
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-slate-400 dark:text-slate-500 font-semibold mr-1">📍 You are here:</span>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-400 dark:text-slate-600 font-bold mx-1">›</span>}
              {isLast || !item.href ? (
                <span className="font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="font-medium text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {showBack && items.length > 1 && (
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 rounded-md border border-slate-300 dark:border-slate-700 font-semibold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
        >
          <span>←</span>
          <span>Back</span>
        </button>
      )}
    </nav>
  );
}

