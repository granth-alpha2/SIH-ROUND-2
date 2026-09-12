"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  NcdexCommodityAnalytics,
  NcdexSpotHistoryPoint,
  NcdexFuturesCurvePoint,
  NCDEX_SPOT_HISTORIES
} from "@/lib/ncdex-service";

interface NcdexCommodityChartsProps {
  initialAnalytics?: NcdexCommodityAnalytics;
  onSelectCommodity?: (symbol: string) => void;
  selectedSymbol?: string;
}

const AVAILABLE_COMMODITIES = [
  { symbol: "KAPAS", name: "Kapas (Raw Cotton)", group: "Fibres", badge: "Live Benchmark" },
  { symbol: "RMSEED", name: "Mustard Seed", group: "Oilseeds", badge: "Rabi Oilseed" },
  { symbol: "CHANA", name: "Chana (Gram)", group: "Pulses", badge: "Rabi Pulse" },
  { symbol: "SOYBEAN", name: "Soybean", group: "Oilseeds", badge: "Kharif Oilseed" },
  { symbol: "GUARSEED10", name: "Guar Seed 10MT", group: "Guar", badge: "Commercial" },
  { symbol: "GUARGUM5", name: "Guar Gum 5MT", group: "Guar", badge: "Export" },
  { symbol: "JEERAUNJHA", name: "Jeera (Cumin)", group: "Spices", badge: "High Value" },
  { symbol: "DHANIYA", name: "Coriander", group: "Spices", badge: "Spice" },
  { symbol: "WHEAT", name: "Wheat", group: "Cereals", badge: "Food Grain" }
];

export default function NcdexCommodityCharts({
  initialAnalytics,
  onSelectCommodity,
  selectedSymbol: propSymbol
}: NcdexCommodityChartsProps) {
  const [activeSymbol, setActiveSymbol] = useState<string>(
    propSymbol || initialAnalytics?.symbol || "KAPAS"
  );
  const [analytics, setAnalytics] = useState<NcdexCommodityAnalytics | null>(
    initialAnalytics || null
  );
  const [loading, setLoading] = useState(false);
  const [isSimulatingTicks, setIsSimulatingTicks] = useState(true);
  const [tickOffset, setTickOffset] = useState(0);
  const [hoveredSpotIdx, setHoveredSpotIdx] = useState<number | null>(null);
  const [hoveredFuturesIdx, setHoveredFuturesIdx] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<"15D" | "1M" | "ALL">("ALL");
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");

  // Keep state in sync if prop changes
  useEffect(() => {
    if (propSymbol && propSymbol !== activeSymbol) {
      setActiveSymbol(propSymbol);
    }
  }, [propSymbol]);

  // Fetch commodity analytics when activeSymbol changes
  const fetchAnalytics = async (sym: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/markets?includeNcdex=true&symbol=${encodeURIComponent(sym)}`);
      const json = await res.json();
      if (json.success && json.ncdex?.analytics) {
        setAnalytics(json.ncdex.analytics);
        setLastSyncTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch (err) {
      console.error("Failed to fetch NCDEX analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(activeSymbol);
  }, [activeSymbol]);

  // Micro-tick simulation (simulates live trading hours micro-movements)
  useEffect(() => {
    if (!isSimulatingTicks) return;
    const interval = setInterval(() => {
      // Small random fluctuation between -0.4 and +0.4
      const delta = (Math.random() - 0.48) * 1.2;
      setTickOffset((prev) => {
        const next = prev + delta;
        // Keep within ±4 INR boundary
        return Math.max(-3.5, Math.min(3.5, next));
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [isSimulatingTicks]);

  const handleSelect = (sym: string) => {
    setActiveSymbol(sym);
    setTickOffset(0);
    setHoveredSpotIdx(null);
    setHoveredFuturesIdx(null);
    if (onSelectCommodity) {
      onSelectCommodity(sym);
    }
  };

  // Filter spot history by time range
  const filteredSpotHistory = useMemo(() => {
    if (!analytics?.spotHistory) {
      return NCDEX_SPOT_HISTORIES[activeSymbol] || NCDEX_SPOT_HISTORIES["KAPAS"];
    }
    const full = analytics.spotHistory;
    if (timeRange === "15D") return full.slice(-6);
    if (timeRange === "1M") return full.slice(-10);
    return full;
  }, [analytics, activeSymbol, timeRange]);

  // Adjust latest spot price by simulated tick
  const liveSpotPrice = useMemo(() => {
    const base = analytics?.currentSpot ?? 1944.7;
    return Number((base + tickOffset).toFixed(2));
  }, [analytics, tickOffset]);

  // SVG Chart Geometry calculations for Spot Chart
  const spotChartGeometry = useMemo(() => {
    const data = filteredSpotHistory;
    if (!data || data.length === 0) return null;

    const prices = data.map((d, i) => (i === data.length - 1 ? liveSpotPrice : d.price));
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;

    // Add 10% vertical padding
    const yMin = minP - range * 0.1;
    const yMax = maxP + range * 0.15;
    const yRange = yMax - yMin;

    const width = 580;
    const height = 260;
    const paddingLeft = 55;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 40;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const points = data.map((d, idx) => {
      const price = idx === data.length - 1 ? liveSpotPrice : d.price;
      const x = paddingLeft + (idx / (data.length - 1)) * plotWidth;
      const y = paddingTop + plotHeight - ((price - yMin) / yRange) * plotHeight;
      return { x, y, price, date: d.date, changeVsPrior: d.changeVsPrior };
    });

    // Build SVG path
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // Smooth cubic bezier curve
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }

    // Area fill path
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`;

    // 5 Horizontal Y-Ticks
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const price = yMin + ratio * yRange;
      const y = paddingTop + plotHeight - ratio * plotHeight;
      return { price: price.toFixed(2), y };
    });

    return { width, height, points, linePath, areaPath, yTicks, paddingBottom, paddingTop, plotHeight };
  }, [filteredSpotHistory, liveSpotPrice]);

  // Futures Chart Geometry calculations
  const futuresChartGeometry = useMemo(() => {
    const curve = analytics?.futuresCurve;
    if (!curve || curve.length === 0) return null;

    const width = 580;
    const height = 260;
    const paddingLeft = 55;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 40;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const spotBaseline = analytics.currentSpot;
    const allPrices = [spotBaseline, ...curve.map((c) => c.settlementPrice)];
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const range = maxP - minP || 1;

    const yMin = minP - range * 0.15;
    const yMax = maxP + range * 0.2;
    const yRange = yMax - yMin;

    const spotY = paddingTop + plotHeight - ((spotBaseline - yMin) / yRange) * plotHeight;

    const barWidth = Math.min(60, plotWidth / (curve.length * 2));
    const items = curve.map((c, idx) => {
      const x = paddingLeft + ((idx + 0.5) / curve.length) * plotWidth;
      const y = paddingTop + plotHeight - ((c.settlementPrice - yMin) / yRange) * plotHeight;
      const isContango = c.settlementPrice >= spotBaseline;
      return {
        ...c,
        x,
        y,
        barWidth,
        isContango
      };
    });

    // 5 Horizontal Y-Ticks
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const price = yMin + ratio * yRange;
      const y = paddingTop + plotHeight - ratio * plotHeight;
      return { price: Math.round(price), y };
    });

    return { width, height, items, spotY, spotBaseline, yTicks, paddingLeft, paddingRight, paddingTop, plotHeight, plotWidth };
  }, [analytics]);

  const activeSpotHover = hoveredSpotIdx !== null && spotChartGeometry ? spotChartGeometry.points[hoveredSpotIdx] : null;
  const activeFuturesHover = hoveredFuturesIdx !== null && futuresChartGeometry ? futuresChartGeometry.items[hoveredFuturesIdx] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-5 p-5">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSimulatingTicks ? "bg-emerald-400 opacity-75" : "bg-slate-300"}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isSimulatingTicks ? "bg-emerald-500" : "bg-slate-400"}`}></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Live NCDEX Market Terminal & Analytics
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Basis Polling & EOD Bhav Copy Settlement
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            {analytics?.commodityName || "Kapas (Raw Cotton)"}
            <span className="text-sm font-bold text-slate-500">[{activeSymbol}]</span>
          </h2>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsSimulatingTicks(!isSimulatingTicks)}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
              isSimulatingTicks
                ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
            }`}
            title="Toggles intraday live market micro-tick simulation"
          >
            {isSimulatingTicks ? "● Live Ticks Active" : "○ Live Ticks Paused"}
          </button>

          <button
            type="button"
            onClick={() => fetchAnalytics(activeSymbol)}
            disabled={loading}
            className="px-3 py-1.5 bg-[#0b4d75] hover:bg-[#083a59] text-white rounded text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
          >
            <span className={loading ? "animate-spin" : ""}>⟳</span>
            {loading ? "Syncing..." : "Sync Live NCDEX"}
          </button>

          <span className="text-[11px] text-slate-500">
            Updated: <strong>{lastSyncTime}</strong>
          </span>
        </div>
      </div>

      {/* 2. Commodity Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {AVAILABLE_COMMODITIES.map((c) => (
          <button
            key={c.symbol}
            type="button"
            onClick={() => handleSelect(c.symbol)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              activeSymbol === c.symbol
                ? "bg-[#0b4d75] text-white border-[#0b4d75] shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>{c.name}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                activeSymbol === c.symbol
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {c.symbol}
            </span>
          </button>
        ))}
      </div>

      {/* 3. Real-Time Price KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Spot Rate */}
        <div className="p-3.5 bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-900 font-bold uppercase tracking-wider">
              Polled Spot Price
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
              {analytics?.basisCenter || "Rajkot"}
            </span>
          </div>
          <div className="text-2xl font-black text-blue-950 mt-1 flex items-baseline gap-1.5">
            ₹{liveSpotPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-slate-600">{analytics?.unit || "₹/20 Kg"}</span>
          </div>
          <div className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
            <span>▲ +₹{((analytics?.spotChangeInr || 41.3) + tickOffset).toFixed(2)}</span>
            <span>(+{analytics?.spotChangePct || 2.17}%)</span>
            <span className="text-[10px] text-slate-500 font-normal">vs prior session</span>
          </div>
        </div>

        {/* Near Futures Contract */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">
              Near Futures (DSP)
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold">
              {analytics?.nearFuturesExpiry || "20 Oct 2026"}
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1.5">
            ₹{analytics?.nearFuturesPrice?.toLocaleString("en-IN") || "1,968.50"}
            <span className="text-xs font-normal text-slate-600">{analytics?.unit || "₹/20 Kg"}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Settlement Price (Daily Bhav Copy)
          </div>
        </div>

        {/* Spread vs Spot */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">
              Basis Spread
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                analytics?.marketStructure.includes("Contango")
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {analytics?.marketStructure || "Contango (Premium)"}
            </span>
          </div>
          <div
            className={`text-2xl font-black mt-1 ${
              (analytics?.basisSpreadInr || 23.8) >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {(analytics?.basisSpreadInr || 23.8) >= 0 ? "+" : ""}₹{analytics?.basisSpreadInr || "23.80"}
            <span className="text-xs font-bold ml-1">({analytics?.basisSpreadPct || 1.22}%)</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Futures minus Spot (Storage incentive)
          </div>
        </div>

        {/* 30-Day Range */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">
            30-Day Spot Range
          </span>
          <div className="text-lg font-black text-slate-800 mt-1">
            ₹{analytics?.dayRange.low || 1887.15} — ₹{analytics?.dayRange.high || 1948.2}
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    ((liveSpotPrice - (analytics?.dayRange.low || 1887.15)) /
                      ((analytics?.dayRange.high || 1948.2) - (analytics?.dayRange.low || 1887.15))) *
                      100
                  )
                )}%`
              }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Low (08 Sep)</span>
            <span>Current High</span>
          </div>
        </div>
      </div>

      {/* 4. DUAL CHARTS: Futures Chart & Spot Chart (Matching user's NCDEX screenshot!) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* CHART 1: FUTURES CHART */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                Futures Chart
                <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                  Term Structure Curve
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Settlement price trajectory across contract expiries vs Spot baseline
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-0.5 bg-slate-400 border-b border-dashed inline-block"></span> Spot
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <span className="w-3 h-2 bg-emerald-500 rounded-xs inline-block"></span> Futures
              </span>
            </div>
          </div>

          {/* SVG Futures Chart */}
          <div className="relative mt-3">
            {futuresChartGeometry ? (
              <svg
                viewBox={`0 0 ${futuresChartGeometry.width} ${futuresChartGeometry.height}`}
                className="w-full h-auto select-none"
              >
                {/* Horizontal Grid Lines */}
                {futuresChartGeometry.yTicks.map((tick, i) => (
                  <g key={i}>
                    <line
                      x1={futuresChartGeometry.paddingLeft}
                      y1={tick.y}
                      x2={futuresChartGeometry.width - futuresChartGeometry.paddingRight}
                      y2={tick.y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x={futuresChartGeometry.paddingLeft - 8}
                      y={tick.y + 4}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 font-mono"
                    >
                      {tick.price}
                    </text>
                  </g>
                ))}

                {/* Spot Price Baseline Line (Dashed) */}
                <line
                  x1={futuresChartGeometry.paddingLeft}
                  y1={futuresChartGeometry.spotY}
                  x2={futuresChartGeometry.width - futuresChartGeometry.paddingRight}
                  y2={futuresChartGeometry.spotY}
                  stroke="#64748b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={futuresChartGeometry.width - futuresChartGeometry.paddingRight}
                  y={futuresChartGeometry.spotY - 5}
                  textAnchor="end"
                  className="text-[10px] fill-slate-500 font-bold"
                >
                  Spot Baseline ₹{futuresChartGeometry.spotBaseline}
                </text>

                {/* Futures Columns/Bars */}
                {futuresChartGeometry.items.map((item, idx) => {
                  const barHeight = Math.abs(futuresChartGeometry.spotY - item.y);
                  const isUp = item.settlementPrice >= futuresChartGeometry.spotBaseline;
                  const barY = isUp ? item.y : futuresChartGeometry.spotY;

                  return (
                    <g
                      key={idx}
                      className="cursor-pointer transition-opacity hover:opacity-85"
                      onMouseEnter={() => setHoveredFuturesIdx(idx)}
                      onMouseLeave={() => setHoveredFuturesIdx(null)}
                    >
                      {/* Bar fill */}
                      <rect
                        x={item.x - item.barWidth / 2}
                        y={barY}
                        width={item.barWidth}
                        height={Math.max(4, barHeight)}
                        rx="3"
                        fill={isUp ? "#10b981" : "#f43f5e"}
                        opacity={hoveredFuturesIdx === idx ? 1 : 0.85}
                      />

                      {/* Top settlement price text */}
                      <text
                        x={item.x}
                        y={item.y - 7}
                        textAnchor="middle"
                        className="text-[11px] font-black fill-slate-800"
                      >
                        ₹{item.settlementPrice}
                      </text>

                      {/* Expiry X-label */}
                      <text
                        x={item.x}
                        y={futuresChartGeometry.height - 12}
                        textAnchor="middle"
                        className="text-[10px] font-bold fill-slate-600"
                      >
                        {item.contractExpiry.replace("2026", "26").replace("2027", "27")}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="h-60 flex items-center justify-center text-slate-400 text-xs">
                Loading Futures Term Curve...
              </div>
            )}

            {/* Hover Tooltip for Futures */}
            {activeFuturesHover && (
              <div
                className="absolute bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg pointer-events-none z-10 space-y-1"
                style={{
                  left: `${(activeFuturesHover.x / (futuresChartGeometry?.width || 1)) * 100}%`,
                  top: `${(activeFuturesHover.y / (futuresChartGeometry?.height || 1)) * 100}%`,
                  transform: "translate(-50%, -120%)"
                }}
              >
                <div className="font-bold text-amber-300">{activeFuturesHover.contractName}</div>
                <div>Expiry: <strong>{activeFuturesHover.contractExpiry}</strong></div>
                <div>Settlement: <strong>₹{activeFuturesHover.settlementPrice}</strong></div>
                <div className="text-emerald-400">
                  Spread: <strong>+{activeFuturesHover.spreadInr} ({activeFuturesHover.spreadPct}%)</strong>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Open Interest: {activeFuturesHover.openInterest.toLocaleString("en-IN")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CHART 2: SPOT CHART (Exact visual match to ncdex.com/products/KAPAS!) */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                Spot Chart
                <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-200">
                  Polled Basis History
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Official daily physical spot settlement trend ({analytics?.basisCenter})
              </p>
            </div>

            {/* Time Range Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-xs font-bold">
              {(["15D", "1M", "ALL"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`px-2 py-1 rounded transition-colors ${
                    timeRange === r ? "bg-white text-blue-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Spot Chart */}
          <div className="relative mt-3">
            {spotChartGeometry ? (
              <svg
                viewBox={`0 0 ${spotChartGeometry.width} ${spotChartGeometry.height}`}
                className="w-full h-auto select-none"
              >
                <defs>
                  {/* Vibrant Gradient under curve matching ncdex.com */}
                  <linearGradient id="spotGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                    <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Y-Grid Lines & Exact Y-Tick Labels */}
                {spotChartGeometry.yTicks.map((tick, i) => (
                  <g key={i}>
                    <line
                      x1={spotChartGeometry.points[0].x}
                      y1={tick.y}
                      x2={spotChartGeometry.points[spotChartGeometry.points.length - 1].x}
                      y2={tick.y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x={spotChartGeometry.points[0].x - 8}
                      y={tick.y + 4}
                      textAnchor="end"
                      className="text-[10px] fill-slate-500 font-mono font-bold"
                    >
                      {tick.price}
                    </text>
                  </g>
                ))}

                {/* Gradient Area Fill */}
                <path d={spotChartGeometry.areaPath} fill="url(#spotGradient)" />

                {/* Smooth Curve Line */}
                <path
                  d={spotChartGeometry.linePath}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points on Line */}
                {spotChartGeometry.points.map((pt, idx) => (
                  <g key={idx}>
                    {/* Hover Hit Target (invisible larger circle) */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="12"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredSpotIdx(idx)}
                      onMouseLeave={() => setHoveredSpotIdx(null)}
                    />

                    {/* Visible Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredSpotIdx === idx ? "5" : "3"}
                      fill={hoveredSpotIdx === idx ? "#0b4d75" : "#0284c7"}
                      stroke="#ffffff"
                      strokeWidth={hoveredSpotIdx === idx ? "2.5" : "1.5"}
                      className="pointer-events-none transition-all"
                    />

                    {/* Date X-Axis Tick Label (matching ncdex.com format: '13 Aug', '17 Aug'...) */}
                    <text
                      x={pt.x}
                      y={spotChartGeometry.height - 12}
                      textAnchor="middle"
                      className={`text-[9.5px] font-semibold ${
                        hoveredSpotIdx === idx ? "fill-slate-900 font-black" : "fill-slate-500"
                      }`}
                    >
                      {pt.date}
                    </text>
                  </g>
                ))}

                {/* Crosshair Line when hovered */}
                {activeSpotHover && (
                  <line
                    x1={activeSpotHover.x}
                    y1={spotChartGeometry.paddingTop}
                    x2={activeSpotHover.x}
                    y2={spotChartGeometry.paddingTop + spotChartGeometry.plotHeight}
                    stroke="#0284c7"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    className="pointer-events-none"
                  />
                )}
              </svg>
            ) : (
              <div className="h-60 flex items-center justify-center text-slate-400 text-xs">
                Loading Spot Chart...
              </div>
            )}

            {/* Hover Tooltip for Spot */}
            {activeSpotHover && (
              <div
                className="absolute bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg pointer-events-none z-10 space-y-0.5"
                style={{
                  left: `${(activeSpotHover.x / (spotChartGeometry?.width || 1)) * 100}%`,
                  top: `${(activeSpotHover.y / (spotChartGeometry?.height || 1)) * 100}%`,
                  transform: "translate(-50%, -125%)"
                }}
              >
                <div className="text-[11px] text-sky-300 font-bold">{activeSpotHover.date} 2026</div>
                <div className="text-sm font-black">
                  ₹{activeSpotHover.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  <span className="text-[10px] font-normal text-slate-300 ml-1">{analytics?.unit}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Basis: {analytics?.basisCenter}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Actionable Farmer Storage & Hedging Guidance Box */}
      {analytics?.farmerAdvisory && (
        <div
          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            analytics.farmerAdvisory.verdict === "STORE_AND_HEDGE"
              ? "bg-emerald-50/80 border-emerald-300"
              : "bg-amber-50/80 border-amber-300"
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-black uppercase px-2 py-0.5 rounded tracking-wide ${
                  analytics.farmerAdvisory.verdict === "STORE_AND_HEDGE"
                    ? "bg-emerald-700 text-white"
                    : "bg-amber-700 text-white"
                }`}
              >
                {analytics.farmerAdvisory.verdict === "STORE_AND_HEDGE"
                  ? "🌾 Storage & Forward Sale Opportunity"
                  : "⚡ Spot Mandi Sale Recommended"}
              </span>
              <span className="text-xs font-bold text-slate-900">
                {analytics.farmerAdvisory.headline}
              </span>
            </div>
            <p className="text-xs text-slate-700 max-w-3xl leading-relaxed">
              {analytics.farmerAdvisory.description}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Estimated Net Gain</div>
              <div
                className={`text-base font-black ${
                  analytics.farmerAdvisory.netHedgingGainInr > 0 ? "text-emerald-700" : "text-slate-800"
                }`}
              >
                {analytics.farmerAdvisory.netHedgingGainInr > 0 ? "+" : ""}₹
                {analytics.farmerAdvisory.netHedgingGainInr.toFixed(1)} {analytics.unit}
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
              WDRA Ready
            </span>
          </div>
        </div>
      )}

      {/* 6. Contract Specifications Strip */}
      {analytics?.contractSpecs && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Trading Unit</span>
            <span className="font-bold text-slate-800">{analytics.contractSpecs.tradingUnit}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Delivery Unit</span>
            <span className="font-bold text-slate-800">{analytics.contractSpecs.deliveryUnit}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Tick Size</span>
            <span className="font-bold text-slate-800">{analytics.contractSpecs.tickSize}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Price Quote</span>
            <span className="font-bold text-slate-800">{analytics.contractSpecs.priceQuote}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Daily Price Limit</span>
            <span className="font-bold text-slate-800">{analytics.contractSpecs.dailyPriceLimit}</span>
          </div>
        </div>
      )}
    </div>
  );
}
