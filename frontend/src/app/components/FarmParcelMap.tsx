"use client";

import React, { useMemo, useState } from "react";

export type FarmParcelAllocation = {
  cropId: string;
  cropName: string;
  hindiName?: string;
  allocatedAcres: number;
  allocatedProfit: number;
  percentage: number;
  strategyRole?: string;
};

export type FarmParcelMapProps = {
  boundary?: { lat: number; lng: number }[];
  allocations: FarmParcelAllocation[];
  totalAcres: number;
  farmName?: string;
  selectedCropId?: string | null;
  onSelectCrop?: (cropId: string) => void;
};

// Crop color schemes for clear distinction in outdoor bright sunlight
const CROP_THEMES: Record<
  string,
  { fill: string; stroke: string; badgeBorder: string; icon: string; shortName: string }
> = {
  wheat: {
    fill: "#f59e0b", // Vibrant Amber
    stroke: "#b45309",
    badgeBorder: "#fde68a",
    icon: "🌾",
    shortName: "Wheat",
  },
  mustard: {
    fill: "#eab308", // Bright Yellow
    stroke: "#a16207",
    badgeBorder: "#fef08a",
    icon: "🌻",
    shortName: "Mustard",
  },
  onion: {
    fill: "#f43f5e", // Vivid Crimson Rose
    stroke: "#be123c",
    badgeBorder: "#fecdd3",
    icon: "🧅",
    shortName: "Onion",
  },
  chickpea: {
    fill: "#10b981", // Rich Emerald Green
    stroke: "#047857",
    badgeBorder: "#bbf7d0",
    icon: "🌱",
    shortName: "Gram",
  },
  gram: {
    fill: "#10b981",
    stroke: "#047857",
    badgeBorder: "#bbf7d0",
    icon: "🌱",
    shortName: "Gram",
  },
  potato: {
    fill: "#f97316", // Warm Bronze
    stroke: "#c2410c",
    badgeBorder: "#fed7aa",
    icon: "🥔",
    shortName: "Potato",
  },
  maize: {
    fill: "#facc15",
    stroke: "#854d0e",
    badgeBorder: "#fef08a",
    icon: "🌽",
    shortName: "Maize",
  },
  soybean: {
    fill: "#84cc16",
    stroke: "#4d7c0f",
    badgeBorder: "#d9f99d",
    icon: "🫘",
    shortName: "Soybean",
  },
  cotton: {
    fill: "#6366f1",
    stroke: "#4338ca",
    badgeBorder: "#c7d2fe",
    icon: "☁️",
    shortName: "Cotton",
  },
  tomato: {
    fill: "#ef4444",
    stroke: "#b91c1c",
    badgeBorder: "#fecaca",
    icon: "🍅",
    shortName: "Tomato",
  },
  rice: {
    fill: "#06b6d4", // Cyan/Aqua
    stroke: "#0e7490",
    badgeBorder: "#a5f3fc",
    icon: "🌾",
    shortName: "Rice",
  },
  paddy: {
    fill: "#06b6d4",
    stroke: "#0e7490",
    badgeBorder: "#a5f3fc",
    icon: "🌾",
    shortName: "Rice",
  },
  sorghum: {
    fill: "#d97706",
    stroke: "#92400e",
    badgeBorder: "#fde68a",
    icon: "🌾",
    shortName: "Jowar",
  },
  jowar: {
    fill: "#d97706",
    stroke: "#92400e",
    badgeBorder: "#fde68a",
    icon: "🌾",
    shortName: "Jowar",
  },
  bajra: {
    fill: "#ca8a04",
    stroke: "#854d0e",
    badgeBorder: "#fef08a",
    icon: "🌾",
    shortName: "Bajra",
  },
  barley: {
    fill: "#b45309",
    stroke: "#78350f",
    badgeBorder: "#fde68a",
    icon: "🌾",
    shortName: "Barley",
  },
  tur: {
    fill: "#15803d",
    stroke: "#166534",
    badgeBorder: "#bbf7d0",
    icon: "🫛",
    shortName: "Arhar",
  },
  arhar: {
    fill: "#15803d",
    stroke: "#166534",
    badgeBorder: "#bbf7d0",
    icon: "🫛",
    shortName: "Arhar",
  },
  moong: {
    fill: "#059669",
    stroke: "#065f46",
    badgeBorder: "#a7f3d0",
    icon: "🌱",
    shortName: "Moong",
  },
  urad: {
    fill: "#475569",
    stroke: "#1e293b",
    badgeBorder: "#cbd5e1",
    icon: "🫘",
    shortName: "Urad",
  },
  groundnut: {
    fill: "#ea580c",
    stroke: "#9a3412",
    badgeBorder: "#ffedd5",
    icon: "🥜",
    shortName: "Groundnut",
  },
  sunflower: {
    fill: "#eab308",
    stroke: "#a16207",
    badgeBorder: "#fef08a",
    icon: "🌻",
    shortName: "Sunflower",
  },
  sesame: {
    fill: "#78716c",
    stroke: "#44403c",
    badgeBorder: "#e7e5e4",
    icon: "🌱",
    shortName: "Til",
  },
  sugarcane: {
    fill: "#16a34a",
    stroke: "#15803d",
    badgeBorder: "#bbf7d0",
    icon: "🎋",
    shortName: "Sugarcane",
  },
  jute: {
    fill: "#65a30d",
    stroke: "#3f6212",
    badgeBorder: "#d9f99d",
    icon: "🌿",
    shortName: "Jute",
  },
  chili: {
    fill: "#dc2626",
    stroke: "#991b1b",
    badgeBorder: "#fecaca",
    icon: "🌶️",
    shortName: "Chili",
  },
  turmeric: {
    fill: "#f59e0b",
    stroke: "#b45309",
    badgeBorder: "#fde68a",
    icon: "🫚",
    shortName: "Turmeric",
  },
  banana: {
    fill: "#a3e635",
    stroke: "#65a30d",
    badgeBorder: "#d9f99d",
    icon: "🍌",
    shortName: "Banana",
  },
  mango: {
    fill: "#fb923c",
    stroke: "#ea580c",
    badgeBorder: "#ffedd5",
    icon: "🥭",
    shortName: "Mango",
  },
  lentil: {
    fill: "#fb7185",
    stroke: "#e11d48",
    badgeBorder: "#ffe4e6",
    icon: "🫘",
    shortName: "Masur",
  },
};

function getCropTheme(name: string) {
  const lower = name.toLowerCase();
  for (const [key, theme] of Object.entries(CROP_THEMES)) {
    if (lower.includes(key)) return theme;
  }
  return {
    fill: "#38bdf8",
    stroke: "#0284c7",
    badgeBorder: "#bae6fd",
    icon: "🌱",
    shortName: name.split("(")[0].trim().split(" ")[0],
  };
}

function getCleanShortName(name: string): string {
  if (name.includes("(")) return name.split("(")[0].trim();
  if (name.includes("/")) return name.split("/")[0].trim();
  return name.trim();
}

// Sutherland-Hodgman Polygon Clipping along vertical line
function clipPolygonVertical(
  polygon: [number, number][],
  xLine: number,
  keepGreater: boolean
): [number, number][] {
  const output: [number, number][] = [];
  if (!polygon || polygon.length === 0) return output;

  for (let i = 0; i < polygon.length; i++) {
    const curr = polygon[i];
    const prev = polygon[(i + polygon.length - 1) % polygon.length];

    const currInside = keepGreater ? curr[0] >= xLine : curr[0] <= xLine;
    const prevInside = keepGreater ? prev[0] >= xLine : prev[0] <= xLine;

    if (currInside) {
      if (!prevInside) {
        const dx = curr[0] - prev[0];
        const t = dx === 0 ? 0 : (xLine - prev[0]) / dx;
        const y = prev[1] + t * (curr[1] - prev[1]);
        output.push([xLine, y]);
      }
      output.push(curr);
    } else if (prevInside) {
      const dx = curr[0] - prev[0];
      const t = dx === 0 ? 0 : (xLine - prev[0]) / dx;
      const y = prev[1] + t * (curr[1] - prev[1]);
      output.push([xLine, y]);
    }
  }
  return output;
}

// Sutherland-Hodgman Polygon Clipping along horizontal line
function clipPolygonHorizontal(
  polygon: [number, number][],
  yLine: number,
  keepGreater: boolean
): [number, number][] {
  const output: [number, number][] = [];
  if (!polygon || polygon.length === 0) return output;

  for (let i = 0; i < polygon.length; i++) {
    const curr = polygon[i];
    const prev = polygon[(i + polygon.length - 1) % polygon.length];

    const currInside = keepGreater ? curr[1] >= yLine : curr[1] <= yLine;
    const prevInside = keepGreater ? prev[1] >= yLine : prev[1] <= yLine;

    if (currInside) {
      if (!prevInside) {
        const dy = curr[1] - prev[1];
        const t = dy === 0 ? 0 : (yLine - prev[1]) / dy;
        const x = prev[0] + t * (curr[0] - prev[0]);
        output.push([x, yLine]);
      }
      output.push(curr);
    } else if (prevInside) {
      const dy = curr[1] - prev[1];
      const t = dy === 0 ? 0 : (yLine - prev[1]) / dy;
      const x = prev[0] + t * (curr[0] - prev[0]);
      output.push([x, yLine]);
    }
  }
  return output;
}

// Polygon Centroid Calculation
function getPolygonCentroid(pts: [number, number][]): [number, number] {
  if (pts.length === 0) return [250, 160];
  let signedArea = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    const a = x0 * y1 - x1 * y0;
    signedArea += a;
    cx += (x0 + x1) * a;
    cy += (y0 + y1) * a;
  }

  signedArea *= 0.5;
  if (Math.abs(signedArea) < 1e-4) {
    const avgX = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
    const avgY = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
    return [avgX, avgY];
  }

  cx /= 6 * signedArea;
  cy /= 6 * signedArea;
  return [cx, cy];
}

export default function FarmParcelMap({
  boundary,
  allocations,
  totalAcres,
  farmName = "My Farm Plot",
  selectedCropId,
  onSelectCrop,
}: FarmParcelMapProps) {
  const [mapMode, setMapMode] = useState<"tactical" | "satellite">("tactical");
  const [hoveredCropId, setHoveredCropId] = useState<string | null>(null);

  // 1. Dynamically compute physical aspect ratio, canvas dimensions & normalize Boundary
  const { canvasW, canvasH, basePolygon } = useMemo(() => {
    const padding = 18;

    if (boundary && boundary.length >= 3) {
      // Find bounding box in Lat/Lng space
      let minLat = Infinity,
        maxLat = -Infinity,
        minLng = Infinity,
        maxLng = -Infinity;

      boundary.forEach((p) => {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
      });

      const dLat = Math.max(0.00001, maxLat - minLat);
      const dLng = Math.max(0.00001, maxLng - minLng);

      // Latitude cosine correction for proper geographical aspect ratio
      const midLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
      const aspectCorrection = Math.cos(midLatRad);
      const scaledDLng = Math.max(0.00001, dLng * aspectCorrection);

      // Real physical aspect ratio (width / height)
      const rawAspect = scaledDLng / dLat;
      // Clamp between 0.5 (tall portrait) and 2.5 (wide landscape) to guarantee beautiful framing
      const clampedAspect = Math.max(0.5, Math.min(2.5, rawAspect));

      let cW: number;
      let cH: number;
      let availW: number;
      let availH: number;

      if (clampedAspect >= 1.0) {
        cW = 500;
        availW = cW - padding * 2;
        availH = availW / clampedAspect;
        cH = Math.max(220, Math.round(availH + padding * 2));
      } else {
        cH = 460;
        availH = cH - padding * 2;
        availW = availH * clampedAspect;
        cW = Math.max(240, Math.round(availW + padding * 2));
      }

      // Compute scale so polygon expands to fill the entire available canvas
      const scale = Math.min(availW / scaledDLng, availH / dLat);

      const projected = boundary.map((p) => {
        const x = cW / 2 + (p.lng - (minLng + maxLng) / 2) * aspectCorrection * scale;
        // In SVG, Y is inverted (higher latitude = smaller Y)
        const y = cH / 2 - (p.lat - (minLat + maxLat) / 2) * scale;
        return [Number(x.toFixed(2)), Number(y.toFixed(2))] as [number, number];
      });

      return { canvasW: cW, canvasH: cH, basePolygon: projected };
    }

    // Default authentic agricultural plot shape (trapezoidal field parcel)
    return {
      canvasW: 500,
      canvasH: 320,
      basePolygon: [
        [24, 30],
        [476, 22],
        [482, 298],
        [18, 292],
      ] as [number, number][],
    };
  }, [boundary]);

  // 2. Compute Partition Slices for each Crop based on its Percentage
  const { parcels, sliceAxis } = useMemo(() => {
    if (basePolygon.length < 3 || allocations.length === 0) {
      return { parcels: [], sliceAxis: "horizontal" };
    }

    // Determine bounding box of normalized polygon
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    basePolygon.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    const width = maxX - minX;
    const height = maxY - minY;
    // Slice along the wider axis for wider, more readable crop parcels
    const axis = width >= height ? "vertical" : "horizontal";

    const totalAllocAcres = allocations.reduce((sum, a) => sum + (a.allocatedAcres || 0), 0) || totalAcres || 1;

    let cumulativeRatio = 0;
    const computedParcels: {
      crop: FarmParcelAllocation;
      points: [number, number][];
      centroid: [number, number];
      theme: ReturnType<typeof getCropTheme>;
    }[] = [];

    allocations.forEach((alloc, idx) => {
      const frac = (alloc.allocatedAcres || 0) / totalAllocAcres;
      const startRatio = cumulativeRatio;
      const endRatio = idx === allocations.length - 1 ? 1.0 : cumulativeRatio + frac;
      cumulativeRatio = endRatio;

      let subPoly: [number, number][] = [];

      if (axis === "vertical") {
        const x1 = minX + startRatio * width;
        const x2 = minX + endRatio * width;

        // Clip: keep x >= x1, then keep x <= x2
        const step1 = clipPolygonVertical(basePolygon, x1, true);
        subPoly = clipPolygonVertical(step1, x2, false);
      } else {
        const y1 = minY + startRatio * height;
        const y2 = minY + endRatio * height;

        // Clip: keep y >= y1, then keep y <= y2
        const step1 = clipPolygonHorizontal(basePolygon, y1, true);
        subPoly = clipPolygonHorizontal(step1, y2, false);
      }

      if (subPoly.length >= 3) {
        const centroid = getPolygonCentroid(subPoly);
        computedParcels.push({
          crop: alloc,
          points: subPoly,
          centroid,
          theme: getCropTheme(alloc.cropName),
        });
      }
    });

    return { parcels: computedParcels, sliceAxis: axis };
  }, [basePolygon, allocations, totalAcres]);

  return (
    <div className="farm-parcel-card rounded-3xl border-2 border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-7 shadow-lg space-y-4">
      {/* Top Header Row with Map View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="agri-badge agri-badge-emerald text-sm font-bold">
              🗺️ Farm Plot Partition Map
            </span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] font-['Space_Grotesk']">
              {allocations.length} Crop Zones · {totalAcres.toFixed(2)} Acres Divided
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] font-['Space_Grotesk'] mt-1">
            {farmName} — Crop Land Division
          </h3>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Exact field boundary partitioned into high-profit parcels as prescribed by the ML model.
          </p>
        </div>

        {/* View Mode Toggle: Tactical (High-Contrast Sunlight) vs Satellite Aerial */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)] shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMapMode("tactical")}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              mapMode === "tactical"
                ? "bg-[var(--color-primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            ☀️ Tactical Map
          </button>
          <button
            type="button"
            onClick={() => setMapMode("satellite")}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              mapMode === "satellite"
                ? "bg-[var(--color-primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            🛰️ Aerial Satellite
          </button>
        </div>
      </div>

      {/* Interactive SVG Farm Plot Graphic */}
      <div
        className="relative w-full mx-auto rounded-3xl overflow-hidden border-2 border-[var(--border-strong)] bg-[#eef2e6] dark:bg-[#121913] shadow-inner select-none transition-all duration-300"
        style={{
          aspectRatio: `${canvasW} / ${canvasH}`,
          maxWidth: `min(100%, calc(480px * ${canvasW} / ${canvasH}))`,
          maxHeight: "480px",
        }}
      >
        {/* Satellite Background Layer (when satellite mode is active) */}
        {mapMode === "satellite" && (
          <div
            className="absolute inset-0 opacity-40 mix-blend-multiply dark:mix-blend-screen pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, #78716c 1px, transparent 1px), radial-gradient(circle at 20% 30%, #57534e 2px, transparent 2px)`,
              backgroundSize: "24px 24px, 48px 48px",
            }}
          />
        )}

        <svg viewBox={`0 0 ${canvasW} ${canvasH}`} className="w-full h-full block">
          <defs>
            {/* Furrow / Field Plow Line Patterns */}
            <pattern id="plow-pattern-wheat" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="12" stroke="#b45309" strokeWidth="0.75" strokeOpacity="0.35" />
            </pattern>
            <pattern id="plow-pattern-mustard" width="10" height="10" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#a16207" strokeWidth="0.75" strokeOpacity="0.35" />
            </pattern>
            <pattern id="plow-pattern-onion" width="14" height="14" patternTransform="rotate(30 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="14" stroke="#be123c" strokeWidth="0.75" strokeOpacity="0.35" />
            </pattern>
            <pattern id="plow-pattern-chickpea" width="12" height="12" patternTransform="rotate(60 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="12" stroke="#047857" strokeWidth="0.75" strokeOpacity="0.35" />
            </pattern>

            {/* Drop Shadow Filter for Badges */}
            <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Exterior Buffer Field (Surrounding Context) */}
          <rect width={canvasW} height={canvasH} fill="transparent" />

          {/* Outer Boundary Shadow / Halo */}
          <polygon
            points={basePolygon.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke="#000000"
            strokeWidth="8"
            strokeOpacity="0.08"
          />

          {/* Individual Crop Parcel Polygons */}
          {parcels.map((parcel, idx) => {
            const isSelected = selectedCropId === parcel.crop.cropId;
            const isHovered = hoveredCropId === parcel.crop.cropId;
            const ptsStr = parcel.points.map((p) => p.join(",")).join(" ");

            return (
              <g
                key={parcel.crop.cropId || idx}
                onClick={() => onSelectCrop?.(parcel.crop.cropId)}
                onMouseEnter={() => setHoveredCropId(parcel.crop.cropId)}
                onMouseLeave={() => setHoveredCropId(null)}
                className="cursor-pointer transition-all duration-150"
              >
                {/* Colored Parcel Base */}
                <polygon
                  points={ptsStr}
                  fill={parcel.theme.fill}
                  fillOpacity={mapMode === "tactical" ? 0.78 : 0.65}
                  stroke={parcel.theme.stroke}
                  strokeWidth={isSelected || isHovered ? "4" : "2.5"}
                  className="transition-all duration-150"
                  style={{
                    filter: isHovered ? "brightness(1.1)" : "none",
                  }}
                />

                {/* Inner Border Glow when Hovered or Selected */}
                {(isSelected || isHovered) && (
                  <polygon
                    points={ptsStr}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}

          {/* Outer Boundary Hard Fence Line */}
          <polygon
            points={basePolygon.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke="#1c1917"
            strokeWidth="3.5"
            pointerEvents="none"
          />

          {/* Boundary Corner Markers (GPS Pegs) */}
          {basePolygon.map(([x, y], pIdx) => (
            <g key={pIdx} pointerEvents="none">
              <circle cx={x} cy={y} r="5" fill="#ffffff" stroke="#15803d" strokeWidth="2.5" />
              <circle cx={x} cy={y} r="1.5" fill="#15803d" />
            </g>
          ))}

          {/* Parcel Centroid Text Badges (Crop Name, Acres, Expected Profit) */}
          {parcels.map((parcel, idx) => {
            const [rawCx, rawCy] = parcel.centroid;
            const isSelected = selectedCropId === parcel.crop.cropId;
            const isHovered = hoveredCropId === parcel.crop.cropId;

            const badgeW = 98;
            const badgeH = 28;
            const halfW = badgeW / 2;
            const halfH = badgeH / 2;

            let cx = rawCx;
            let cy = rawCy;
            if (parcels.length > 1) {
              if (sliceAxis === "horizontal") {
                const offset = idx % 2 === 0 ? -28 : 28;
                cx = Math.max(halfW + 8, Math.min(canvasW - halfW - 8, rawCx + offset));
                cy = Math.max(halfH + 8, Math.min(canvasH - halfH - 8, rawCy));
              } else {
                const offset = idx % 2 === 0 ? -18 : 18;
                cx = Math.max(halfW + 8, Math.min(canvasW - halfW - 8, rawCx));
                cy = Math.max(halfH + 8, Math.min(canvasH - halfH - 8, rawCy + offset));
              }
            } else {
              cx = Math.max(halfW + 8, Math.min(canvasW - halfW - 8, rawCx));
              cy = Math.max(halfH + 8, Math.min(canvasH - halfH - 8, rawCy));
            }

            const badgeX = cx - halfW;
            const badgeY = cy - halfH;
            const shortName = getCleanShortName(parcel.crop.cropName);

            return (
              <g
                key={`badge-${parcel.crop.cropId || idx}`}
                onClick={() => onSelectCrop?.(parcel.crop.cropId)}
                onMouseEnter={() => setHoveredCropId(parcel.crop.cropId)}
                onMouseLeave={() => setHoveredCropId(null)}
                className="cursor-pointer"
                filter="url(#badge-shadow)"
              >
                {/* Sleek Compact Pill Container */}
                <rect
                  x={badgeX}
                  y={badgeY}
                  width={badgeW}
                  height={badgeH}
                  rx="14"
                  fill="rgba(15, 23, 42, 0.92)"
                  stroke={isSelected || isHovered ? "#ffffff" : parcel.theme.badgeBorder}
                  strokeWidth={isSelected || isHovered ? "2.5" : "1.2"}
                  className="transition-all duration-150"
                />

                {/* Line 1: Icon + Short Crop Name + Percentage */}
                <text
                  x={cx}
                  y={badgeY + 12}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10.5"
                  fontWeight="800"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {parcel.theme.icon} {shortName} ({parcel.crop.percentage}%)
                </text>

                {/* Line 2: Allocated Acres & Profit */}
                <text
                  x={cx}
                  y={badgeY + 23}
                  textAnchor="middle"
                  fill="#4ade80"
                  fontSize="9.5"
                  fontWeight="800"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {parcel.crop.allocatedAcres.toFixed(2)} ac · +₹{Math.round(parcel.crop.allocatedProfit).toLocaleString("en-IN")}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Sleek Floating Compass Pill (Ultra-compact so it never covers parcel corners) */}
        <div className="absolute top-2.5 left-2.5 bg-black/70 dark:bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/15 shadow-sm flex items-center gap-1.5 pointer-events-none text-white text-[11px] font-bold">
          <span>🧭 N</span>
          <span className="text-white/30">•</span>
          <span>{allocations.length} Crop Zones</span>
        </div>

        {/* Live Interactive Tip */}
        <div className="absolute bottom-2.5 right-2.5 bg-black/70 dark:bg-black/85 text-white/90 text-[10.5px] px-2.5 py-1 rounded-xl font-semibold backdrop-blur-sm pointer-events-none hidden sm:block border border-white/15 shadow-sm">
          💡 Tap parcel to view ICAR practices
        </div>
      </div>

      {/* Parcel Summary Cards Pill Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {parcels.map((parcel) => {
          const isSelected = selectedCropId === parcel.crop.cropId;
          return (
            <div
              key={`legend-${parcel.crop.cropId}`}
              onClick={() => onSelectCrop?.(parcel.crop.cropId)}
              className={`p-3 rounded-2xl border-2 transition-all cursor-pointer space-y-1 ${
                isSelected
                  ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary-light)]"
                  : "border-[var(--border-default)] bg-[var(--bg-surface-subtle)] hover:border-[var(--color-primary)]"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-extrabold text-[var(--text-primary)] truncate font-['Space_Grotesk']">
                  {parcel.theme.icon} {parcel.crop.cropName}
                </span>
                <span className="text-xs font-bold text-[var(--color-primary)] shrink-0">
                  {parcel.crop.percentage}%
                </span>
              </div>
              <div className="text-base font-extrabold text-[var(--text-primary)]">
                {parcel.crop.allocatedAcres.toFixed(2)} ac
              </div>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                +₹{Math.round(parcel.crop.allocatedProfit).toLocaleString("en-IN")} net
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

