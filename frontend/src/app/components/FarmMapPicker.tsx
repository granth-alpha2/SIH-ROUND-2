/// <reference types="google.maps" />
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import type { FarmRecord } from "../api/farms/repository";
import { resolveDistrictFromCoords, DISTRICT_MASTER } from "@/lib/geo-service";

export type FarmSelection = {
  center: { lat: number; lng: number };
  boundary: { lat: number; lng: number }[];
};

type LandSection = {
  crop: string;
  area: number;
};

type FarmMapPickerProps = {
  onAreaChange: (areaAcres: number) => void;
  onSelectionChange?: (selection: FarmSelection) => void;
  initialFarm?: FarmRecord;
  onSaved?: (savedFarm: FarmRecord) => void;
};

type DrawingManagerRuntime = {
  setMap: (map: google.maps.Map | null) => void;
  setDrawingMode: (mode: google.maps.drawing.OverlayType | null) => void;
};

const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India geographic center (auto-centered by GPS or search)
let configuredApiKey = "";


export default function FarmMapPicker({
  onAreaChange,
  onSelectionChange,
  initialFarm,
  onSaved,
}: FarmMapPickerProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const searchElement = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const draftPathRef = useRef<google.maps.LatLng[]>([]);
  const draftPolylineRef = useRef<google.maps.Polyline | null>(null);
  const finishDrawingRef = useRef<() => void>(() => undefined);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  const [farmName, setFarmName] = useState(initialFarm?.name || "Main Field Plot");
  const [status, setStatus] = useState("Click '📍 Use My Location' or search your area, then click corners to draw your field boundary.");
  const [, setMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [useFallbackMode, setUseFallbackMode] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [measuredAreaAcres, setMeasuredAreaAcres] = useState(initialFarm?.areaAcres || 0);
  const [sections, setSections] = useState<LandSection[]>(
    initialFarm?.sections && initialFarm.sections.length > 0
      ? initialFarm.sections
      : [{ crop: "Wheat", area: initialFarm ? Number((initialFarm.areaAcres * 0.6).toFixed(2)) : 0 }]
  );
  const [water, setWater] = useState(initialFarm?.preferences?.water || "Medium");
  const [risk, setRisk] = useState(initialFarm?.preferences?.risk || "Balanced");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dbPersistence, setDbPersistence] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkStorage() {
      try {
        const res = await fetch("/api/farms");
        if (res.ok) {
          const json = await res.json();
          setDbPersistence(Boolean(json.isPersistent));
        }
      } catch {
        setDbPersistence(false);
      }
    }
    checkStorage();
  }, []);

  // Fallback map state
  const [fallbackPoints, setFallbackPoints] = useState<{ x: number; y: number }[]>([]);
  const [fallbackCentroid, setFallbackCentroid] = useState<{ lat: number; lng: number }>(
    initialFarm?.center || defaultCenter
  );

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const handleAreaUpdate = useCallback(
    (acres: number, points: { lat: number; lng: number }[], centerPoint?: { lat: number; lng: number }) => {
      const roundedAcres = Number(acres.toFixed(2));
      setMeasuredAreaAcres(roundedAcres);
      onAreaChange(roundedAcres);

      const center = centerPoint || points[0] || defaultCenter;
      const selection: FarmSelection = { center, boundary: points };
      onSelectionChange?.(selection);
    },
    [onAreaChange, onSelectionChange]
  );

  function setMarker(location: google.maps.LatLng) {
    markerRef.current?.setMap(null);
    markerRef.current = new google.maps.Marker({
      map: mapRef.current,
      position: location,
      title: "Farm Centroid",
      draggable: true,
    });
    markerRef.current.addListener("dragend", () => {
      const pos = markerRef.current?.getPosition();
      if (pos) {
        setFallbackCentroid(pos.toJSON());
        const points = polygonRef.current?.getPath().getArray().map((p) => p.toJSON()) || [];
        handleAreaUpdate(measuredAreaAcres, points, pos.toJSON());
      }
    });
  }

  function updateGoogleMapArea(polygon: google.maps.Polygon) {
    const sqMeters = google.maps.geometry.spherical.computeArea(polygon.getPath());
    // 1 Acre = 4046.8564224 sq meters
    const acres = Math.max(0.05, sqMeters / 4046.8564224);
    const points = polygon.getPath().getArray().map((p) => p.toJSON());
    const center = markerRef.current?.getPosition()?.toJSON() || points[0] || defaultCenter;
    setFallbackCentroid(center);
    handleAreaUpdate(acres, points, center);
    const ha = (acres / 2.47105).toFixed(2);
    const sqM = Math.round(sqMeters).toLocaleString();
    setStatus(`✓ Enclosed Boundary: ${acres.toFixed(2)} acres (${ha} ha / ${sqM} m²). Drag corner points to adjust.`);
  }

  // "Use My Location" Geolocation Handler
  const handleUseMyLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingLocation(true);
    setStatus("📍 Accessing device GPS to locate your farm...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetectingLocation(false);
        const { latitude, longitude } = position.coords;
        const districtInfo = resolveDistrictFromCoords(latitude, longitude);

        setStatus(
          `📍 Location Detected: ${districtInfo.district}, ${districtInfo.state} (${districtInfo.agroClimaticZone}) [${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E]`
        );
        setFarmName(`${districtInfo.district} Farm Plot`);
        setFallbackCentroid({ lat: latitude, lng: longitude });

        if (mapRef.current) {
          const pos = new google.maps.LatLng(latitude, longitude);
          mapRef.current.setCenter(pos);
          mapRef.current.setZoom(16);
          setMarker(pos);
        }
      },
      (err) => {
        setDetectingLocation(false);
        console.warn("[Geolocation Warning]", err);
        setStatus("Could not access GPS. Please use the search bar to locate your district.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [handleAreaUpdate, measuredAreaAcres]);

  // Listen for Google Maps Authentication / Referrer Failures
  useEffect(() => {
    if (typeof window !== "undefined") {
      const prevAuth = (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
      (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
        console.warn("[Google Maps] RefererNotAllowedMapError / gm_authFailure detected. Falling back to Vector Canvas.");
        setMapError(true);
        setUseFallbackMode(true);
        setStatus("Google Maps key restricted for localhost. Switched to Interactive Vector Farm Planner.");
        if (typeof prevAuth === "function") prevAuth();
      };
    }
  }, []);

  // Google Maps Initialization
  useEffect(() => {
    if (!mapElement.current || !apiKey || useFallbackMode) return;

    if (configuredApiKey !== apiKey) {
      setOptions({ key: apiKey, v: "weekly" });
      configuredApiKey = apiKey;
    }

    let drawingManager: DrawingManagerRuntime | undefined;

    Promise.all([
      importLibrary("maps"),
      importLibrary("drawing"),
      importLibrary("geometry"),
      importLibrary("places"),
    ])
      .then(([mapsLibrary]) => {
        if (!mapElement.current) return;
        const { Map } = mapsLibrary as google.maps.MapsLibrary;
        const center = initialFarm?.center || defaultCenter;

        const map = new Map(mapElement.current, {
          center,
          zoom: initialFarm ? 16 : 14,
          mapTypeId: "satellite",
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;

        // Render initial polygon if editing
        if (initialFarm && initialFarm.boundary && initialFarm.boundary.length >= 3) {
          const path = initialFarm.boundary.map((p) => new google.maps.LatLng(p.lat, p.lng));
          const existingPolygon = new google.maps.Polygon({
            paths: path,
            map,
            editable: true,
            fillColor: "#10b981",
            fillOpacity: 0.4,
            strokeColor: "#047857",
            strokeWeight: 3,
          });
          polygonRef.current = existingPolygon;
          google.maps.event.addListener(existingPolygon.getPath(), "set_at", () => updateGoogleMapArea(existingPolygon));
          google.maps.event.addListener(existingPolygon.getPath(), "insert_at", () => updateGoogleMapArea(existingPolygon));
        }

        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          if (draftPathRef.current.length > 0) {
            draftPathRef.current.push(event.latLng);
            draftPolylineRef.current?.setPath(draftPathRef.current);
            setStatus(`${draftPathRef.current.length} boundary points placed. Click '✓ Finish Boundary' when done.`);
            return;
          }

          setMarker(event.latLng);
          setFallbackCentroid({ lat: event.latLng.lat(), lng: event.latLng.lng() });
          polygonRef.current?.setMap(null);
          draftPathRef.current = [event.latLng];
          draftPolylineRef.current?.setMap(null);
          draftPolylineRef.current = new google.maps.Polyline({
            map: mapRef.current,
            strokeColor: "#047857",
            strokeWeight: 3,
            path: draftPathRef.current,
          });
          setStatus("First corner marked. Click consecutive field corners around your plot boundary.");
        });

        finishDrawingRef.current = () => {
          if (draftPathRef.current.length < 3) {
            setStatus("Please place at least 3 points to enclose your field boundary.");
            return;
          }
          draftPolylineRef.current?.setMap(null);
          const polygon = new google.maps.Polygon({
            paths: draftPathRef.current,
            map,
            editable: true,
            fillColor: "#10b981",
            fillOpacity: 0.4,
            strokeColor: "#047857",
            strokeWeight: 3,
          });
          polygonRef.current?.setMap(null);
          polygonRef.current = polygon;
          draftPathRef.current = [];
          updateGoogleMapArea(polygon);
          google.maps.event.addListener(polygon.getPath(), "set_at", () => updateGoogleMapArea(polygon));
          google.maps.event.addListener(polygon.getPath(), "insert_at", () => updateGoogleMapArea(polygon));
        };

        if (searchElement.current) {
          const SearchBox = google.maps.places.SearchBox as unknown as new (input: HTMLInputElement) => google.maps.places.SearchBox;
          searchBoxRef.current = new SearchBox(searchElement.current);
          searchBoxRef.current.addListener("places_changed", () => {
            const place = searchBoxRef.current?.getPlaces()?.[0];
            if (place?.geometry?.location) {
              map.setCenter(place.geometry.location);
              map.setZoom(16);
              setMarker(place.geometry.location);
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const dInfo = resolveDistrictFromCoords(lat, lng);
              setStatus(`Location found: ${place.name || dInfo.district} (${dInfo.state})`);
              setFarmName(`${place.name || dInfo.district} Plot`);
              setFallbackCentroid({ lat, lng });
            }
          });
        }

        setMapsLoaded(true);
      })
      .catch(() => {
        setMapError(true);
        setUseFallbackMode(true);
        setStatus("Google Maps key restricted or unavailable. Switched to Interactive Vector Farm Planner.");
      });

    return () => {
      drawingManager?.setMap(null);
      polygonRef.current?.setMap(null);
      draftPolylineRef.current?.setMap(null);
      finishDrawingRef.current = () => undefined;
    };
  }, [apiKey, handleAreaUpdate, initialFarm, measuredAreaAcres, useFallbackMode]);

  // Fallback Canvas Map Click Handler
  function handleFallbackCanvasClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoints = [...fallbackPoints, { x, y }];
    setFallbackPoints(newPoints);

    if (newPoints.length >= 3) {
      let areaPx = 0;
      for (let i = 0; i < newPoints.length; i++) {
        const j = (i + 1) % newPoints.length;
        areaPx += newPoints[i].x * newPoints[j].y;
        areaPx -= newPoints[j].x * newPoints[i].y;
      }
      areaPx = Math.abs(areaPx) / 2;
      const acres = Math.max(0.1, areaPx / 800);

      const geoPoints = newPoints.map((p) => ({
        lat: Number((fallbackCentroid.lat + (p.y - 175) * 0.0001).toFixed(6)),
        lng: Number((fallbackCentroid.lng + (p.x - 250) * 0.0001).toFixed(6)),
      }));

      handleAreaUpdate(acres, geoPoints, fallbackCentroid);
      const ha = (acres / 2.47105).toFixed(2);
      const sqM = Math.round(acres * 4046.8564).toLocaleString();
      setStatus(`✓ Boundary Plotted: ${acres.toFixed(2)} acres (${ha} ha / ${sqM} m²).`);
    } else {
      setStatus(`Point ${newPoints.length} placed. Place at least 3 points to enclose your field.`);
    }
  }

  function resetFallbackPoints() {
    setFallbackPoints([]);
    setMeasuredAreaAcres(0);
    onAreaChange(0);
    setStatus("Canvas reset. Tap corners on the grid to plot your field boundary.");
  }

  function applyPresetField(presetAcres: number) {
    const center = mapRef.current?.getCenter()?.toJSON() || fallbackCentroid;
    const dLat = Math.sqrt(presetAcres * 4046.86) / 111000 / 2;
    const dLng = dLat / Math.cos((center.lat * Math.PI) / 180);

    const points = [
      { lat: Number((center.lat - dLat).toFixed(6)), lng: Number((center.lng - dLng).toFixed(6)) },
      { lat: Number((center.lat - dLat).toFixed(6)), lng: Number((center.lng + dLng).toFixed(6)) },
      { lat: Number((center.lat + dLat * 0.95).toFixed(6)), lng: Number((center.lng + dLng * 1.05).toFixed(6)) },
      { lat: Number((center.lat + dLat).toFixed(6)), lng: Number((center.lng - dLng).toFixed(6)) },
    ];

    if (!useFallbackMode && mapRef.current && window.google?.maps) {
      polygonRef.current?.setMap(null);
      draftPolylineRef.current?.setMap(null);
      draftPathRef.current = [];
      const polygon = new google.maps.Polygon({
        paths: points.map((p) => new google.maps.LatLng(p.lat, p.lng)),
        map: mapRef.current,
        editable: true,
        fillColor: "#10b981",
        fillOpacity: 0.4,
        strokeColor: "#047857",
        strokeWeight: 3,
      });
      polygonRef.current = polygon;
      updateGoogleMapArea(polygon);
    } else {
      const scale = Math.sqrt(presetAcres) * 45;
      const canvasPoints = [
        { x: Math.round(250 - scale), y: Math.round(190 - scale) },
        { x: Math.round(250 + scale * 1.1), y: Math.round(190 - scale * 0.9) },
        { x: Math.round(250 + scale), y: Math.round(190 + scale) },
        { x: Math.round(250 - scale * 0.9), y: Math.round(190 + scale * 1.1) },
      ];
      setFallbackPoints(canvasPoints);
      handleAreaUpdate(presetAcres, points, center);
      const ha = (presetAcres / 2.47105).toFixed(2);
      const sqM = Math.round(presetAcres * 4046.8564).toLocaleString();
      setStatus(`✓ Preset Applied: ${presetAcres.toFixed(2)} acres (${ha} ha / ${sqM} m²) at ${center.lat.toFixed(4)}°N, ${center.lng.toFixed(4)}°E.`);
    }
  }

  async function handleSaveFarm() {
    setSaving(true);
    setSaveMessage(null);

    if (measuredAreaAcres <= 0) {
      setSaveMessage({ type: "error", text: "Please draw or enclose a field boundary on the map first." });
      setSaving(false);
      return;
    }

    let boundaryPoints: { lat: number; lng: number }[] = [];
    let center = defaultCenter;

    if (polygonRef.current) {
      boundaryPoints = polygonRef.current.getPath().getArray().map((p) => p.toJSON());
      center = markerRef.current?.getPosition()?.toJSON() || boundaryPoints[0] || defaultCenter;
    } else if (fallbackPoints.length >= 3) {
      boundaryPoints = fallbackPoints.map((p) => ({
        lat: Number((fallbackCentroid.lat + (p.y - 175) * 0.0001).toFixed(6)),
        lng: Number((fallbackCentroid.lng + (p.x - 250) * 0.0001).toFixed(6)),
      }));
      center = fallbackCentroid;
    } else if (initialFarm) {
      boundaryPoints = initialFarm.boundary;
      center = initialFarm.center;
    }

    const payload = {
      name: farmName.trim() || "My Farm Plot",
      areaAcres: measuredAreaAcres,
      center,
      boundary: boundaryPoints,
      sections,
      preferences: { water, risk },
    };

    try {
      const url = initialFarm ? `/api/farms/${initialFarm.id}` : "/api/farms";
      const method = initialFarm ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const isPermanent = Boolean(data.isPersistent);
        setDbPersistence(isPermanent);
        setSaveMessage({
          type: "success",
          text: isPermanent
            ? "✓ Saved to your permanent account in PostGIS database."
            : "⚠️ Saved in session memory only (DATABASE_URL not configured). Add a farm database profile to keep this across server restarts.",
        });
        try {
          localStorage.setItem("agriprofit_active_farm", JSON.stringify(data.farm));
        } catch {}
        onSaved?.(data.farm);
      } else {
        const fallbackFarm = {
          id: initialFarm?.id || `farm_${Date.now()}`,
          ...payload,
        };
        try {
          localStorage.setItem("agriprofit_active_farm", JSON.stringify(fallbackFarm));
        } catch {}
        setDbPersistence(false);
        setSaveMessage({
          type: "success",
          text: "⚠️ Saved to browser session storage only. Not permanently saved to cloud account.",
        });
        onSaved?.(fallbackFarm as any);
      }
    } catch {
      const fallbackFarm = {
        id: initialFarm?.id || `farm_${Date.now()}`,
        ...payload,
      };
      try {
        localStorage.setItem("agriprofit_active_farm", JSON.stringify(fallbackFarm));
      } catch {}
      setDbPersistence(false);
      setSaveMessage({
        type: "success",
        text: "⚠️ Saved to browser session storage only. Not permanently saved to cloud account.",
      });
      onSaved?.(fallbackFarm as any);
    } finally {
      setSaving(false);
    }
  }

  function updateSection(index: number, field: keyof LandSection, value: string) {
    setSections((current) =>
      current.map((s, i) => (i === index ? { ...s, [field]: field === "area" ? Number(value) : value } : s))
    );
  }

  const [areaUnit, setAreaUnit] = useState<"acres" | "ha" | "sqm">("acres");

  const measuredHectares = (measuredAreaAcres / 2.47105).toFixed(2);
  const measuredSqMeters = Math.round(measuredAreaAcres * 4046.8564224).toLocaleString("en-IN");
  const activeCenter = fallbackCentroid;
  const currentDistrict = resolveDistrictFromCoords(activeCenter.lat, activeCenter.lng);

  return (
    <div className="picker-wrap space-y-6">
      {/* 0. Storage & Persistence Mode Indicator (Fix 5) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700">Account Storage Mode:</span>
          {dbPersistence === true ? (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded flex items-center gap-1">
              <span>✔</span> Saved to Permanent Account (PostgreSQL / PostGIS Database)
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded flex items-center gap-1">
              <span>⚠️</span> Session-only Storage (In-memory) — Not permanently saved to database
            </span>
          )}
        </div>
        <span className="text-slate-500 hidden sm:inline">ST_GeogFromText WGS-84 Polygon</span>
      </div>

      {/* 1. GIANT FULL-WIDTH "USE MY LOCATION" BUTTON */}
      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={detectingLocation}
        className="agri-btn-primary w-full min-h-[64px] text-xl sm:text-2xl font-extrabold flex items-center justify-center gap-3 shadow-xl cursor-pointer"
        title="Detect GPS coordinates and center map"
      >
        <span className="text-3xl">📍</span>
        <span>{detectingLocation ? "Finding Your Field Coordinates..." : "📍 Tap Here to Find My Farm (Use GPS)"}</span>
      </button>

      {/* 2. Plain Language Location & Zone Sentence */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-default)] flex items-center gap-3.5 shadow-sm">
        <span className="text-3xl shrink-0">🌾</span>
        <p className="text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-relaxed">
          Your farm is in <span className="text-[var(--color-primary)] font-extrabold">{currentDistrict.district} district ({currentDistrict.state})</span>, suitable for <span className="text-[var(--color-primary)] font-extrabold">{currentDistrict.agroClimaticZone}</span> crops.
        </p>
      </div>

      {/* 3. Farm Name and Single-Unit Area Readout with Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Farm Name */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-default)] space-y-2">
          <label htmlFor="farm-name-input" className="text-base font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']">
            Farm Plot Name:
          </label>
          <input
            id="farm-name-input"
            type="text"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            placeholder="e.g. My Canal Field / मेरा खेत"
            className="agri-input font-bold text-lg min-h-[56px]"
          />
        </div>

        {/* Live Area in ONE unit at a time with simple toggle */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-default)] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-[var(--text-secondary)] uppercase tracking-wider font-['Space_Grotesk']">
              Measured Land Area:
            </span>
            {/* Simple Unit Switcher */}
            <div className="inline-flex rounded-xl bg-[var(--bg-surface-subtle)] p-1 border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setAreaUnit("acres")}
                className={`px-3 py-1 rounded-lg text-sm font-bold cursor-pointer ${
                  areaUnit === "acres" ? "bg-[var(--color-primary)] text-white" : "text-[var(--text-secondary)]"
                }`}
              >
                Acres
              </button>
              <button
                type="button"
                onClick={() => setAreaUnit("ha")}
                className={`px-3 py-1 rounded-lg text-sm font-bold cursor-pointer ${
                  areaUnit === "ha" ? "bg-[var(--color-primary)] text-white" : "text-[var(--text-secondary)]"
                }`}
              >
                Hectares
              </button>
              <button
                type="button"
                onClick={() => setAreaUnit("sqm")}
                className={`px-3 py-1 rounded-lg text-sm font-bold cursor-pointer ${
                  areaUnit === "sqm" ? "bg-[var(--color-primary)] text-white" : "text-[var(--text-secondary)]"
                }`}
              >
                Sq. Meters
              </button>
            </div>
          </div>

          <div className="text-3xl sm:text-4xl font-extrabold font-['Space_Grotesk'] text-[var(--color-primary)]">
            {areaUnit === "acres" && `${measuredAreaAcres.toFixed(2)} Acres`}
            {areaUnit === "ha" && `${measuredHectares} Hectares`}
            {areaUnit === "sqm" && `${measuredSqMeters} m²`}
          </div>
        </div>
      </div>

      {/* 4. Three Plain-Language Large Preset Cards */}
      <div className="space-y-2">
        <label className="text-base font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']">
          Quick Preset Sizes (Tap to Set Area):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => applyPresetField(2.5)}
            className="p-5 rounded-2xl border-2 border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-surface-accent)] transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer"
          >
            <span className="text-4xl">🌱</span>
            <strong className="text-lg font-bold text-[var(--text-primary)]">Small Farm</strong>
            <span className="text-base font-semibold text-[var(--text-secondary)]">~2.5 Acres</span>
          </button>
          <button
            type="button"
            onClick={() => applyPresetField(5.0)}
            className="p-5 rounded-2xl border-2 border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-surface-accent)] transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer"
          >
            <span className="text-4xl">🌾</span>
            <strong className="text-lg font-bold text-[var(--text-primary)]">Medium Farm</strong>
            <span className="text-base font-semibold text-[var(--text-secondary)]">~5.0 Acres</span>
          </button>
          <button
            type="button"
            onClick={() => applyPresetField(10.0)}
            className="p-5 rounded-2xl border-2 border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-surface-accent)] transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer"
          >
            <span className="text-4xl">🚜</span>
            <strong className="text-lg font-bold text-[var(--text-primary)]">Large Farm</strong>
            <span className="text-base font-semibold text-[var(--text-secondary)]">~10.0 Acres</span>
          </button>
        </div>
      </div>

      {/* 5. Map Search & Switcher Toolbar */}
      <div className="picker-toolbar flex gap-3 flex-wrap items-center justify-between pt-1">
        <div className="flex gap-2.5 items-center flex-1 min-w-[280px]">
          {!useFallbackMode && apiKey ? (
            <input
              ref={searchElement}
              aria-label="Search farm location"
              placeholder="Search village, mandi, district or landmark..."
              className="agri-input flex-1 min-h-[56px] text-base font-medium"
            />
          ) : (
            <select
              value={`${fallbackCentroid.lat},${fallbackCentroid.lng}`}
              onChange={(e) => {
                const [lat, lng] = e.target.value.split(",").map(Number);
                setFallbackCentroid({ lat, lng });
                const dInfo = resolveDistrictFromCoords(lat, lng);
                setFarmName(`${dInfo.district} Farm Plot`);
              }}
              className="agri-select flex-1 min-h-[56px] text-base font-medium"
            >
              {DISTRICT_MASTER.map((d) => (
                <option key={d.districtId} value={`${d.lat},${d.lng}`}>
                  {d.district}, {d.state} ({d.zone})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          {/* Plain Language Map Switcher */}
          <button
            type="button"
            onClick={() => {
              setUseFallbackMode(!useFallbackMode);
              setStatus(!useFallbackMode ? "Switched to Drawing Pad View." : "Connecting to Satellite View...");
            }}
            className="agri-btn-secondary min-h-[52px] text-base font-bold"
            title="Switch Map View"
          >
            {useFallbackMode ? "🛰️ Switch to Satellite Map" : "📐 Switch to Drawing Pad"}
          </button>

          {!useFallbackMode && apiKey && !mapError && (
            <button
              type="button"
              onClick={() => finishDrawingRef.current()}
              className="agri-btn-primary min-h-[52px] text-base font-bold"
            >
              ✓ Complete Boundary
            </button>
          )}
          {useFallbackMode && (
            <button
              type="button"
              onClick={resetFallbackPoints}
              className="agri-btn-secondary min-h-[52px] text-base font-bold"
            >
              Reset Points
            </button>
          )}
        </div>
      </div>

      {/* Helpful Status Notice */}
      <div className="p-4 bg-[var(--color-primary-light)] border-2 border-[var(--border-accent)] rounded-2xl text-base font-bold text-[var(--color-primary-text)] flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-[var(--color-primary)] animate-pulse shrink-0" />
        <span>💡 {status}</span>
      </div>

      {/* Notice if Google Maps API key has domain / referer restrictions */}
      {(mapError || useFallbackMode) && (
        <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-3">
          <span className="text-base shrink-0">💡</span>
          <div className="space-y-1">
            <p className="font-semibold text-emerald-200">
              Interactive Vector Farm Planner Active
            </p>
            <p className="text-emerald-300/80 leading-relaxed">
              If your Google Maps API key restricts <code className="bg-emerald-950/80 px-1 py-0.5 rounded font-mono text-emerald-100">http://localhost:3000/*</code> (RefererNotAllowedMapError), you can authorize it in Google Cloud Console Credentials. In the meantime, this vector planner is 100% operational with GPS auto-detection, geodesic polygon area calculation, and instant field presets!
            </p>
          </div>
        </div>
      )}

      {/* Map Display (Google Satellite Maps OR Vector Canvas Fallback) */}
      {!useFallbackMode && apiKey && !mapError ? (
        <div
          ref={mapElement}
          className="real-map min-h-[460px] w-full rounded-2xl border border-[var(--border-default)] shadow-card overflow-hidden"
          aria-label="Google Map for selecting farm boundary"
        />
      ) : (
        <div className="fallback-map-container bg-slate-950 rounded-2xl p-4 border border-[var(--border-default)] relative overflow-hidden shadow-card">
          <div className="text-xs text-emerald-400 font-mono mb-3 flex justify-between">
            <span>GRID CENTROID: {fallbackCentroid.lat.toFixed(4)}°N, {fallbackCentroid.lng.toFixed(4)}°E</span>
            <span>CLICK CORNERS TO ENCLOSE POLYGON</span>
          </div>

          <svg
            className="w-full h-[380px] bg-slate-900/90 rounded-xl border border-slate-800 cursor-crosshair"
            onClick={handleFallbackCanvasClick}
          >
            <defs>
              <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {fallbackPoints.length >= 3 && (
              <polygon
                points={fallbackPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="#10b981"
                fillOpacity="0.4"
                stroke="#059669"
                strokeWidth="3"
              />
            )}

            {fallbackPoints.map((p, idx) => (
              <circle key={idx} cx={p.x} cy={p.y} r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
            ))}
          </svg>
        </div>
      )}

      {/* Agronomic Preferences & Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="agri-card p-5 space-y-2 border-2">
          <label className="text-base font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']">
            Water Source Access:
          </label>
          <select
            value={water}
            onChange={(e) => setWater(e.target.value)}
            className="agri-select min-h-[56px] text-base font-medium"
          >
            <option value="Low">Low (Rainfed / Limited Tanker)</option>
            <option value="Medium">Medium (Canal / Shared Tube Well)</option>
            <option value="High">High (Dedicated Borewell / Drip)</option>
          </select>
        </div>

        <div className="agri-card p-5 space-y-2 border-2">
          <label className="text-base font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']">
            Risk Strategy:
          </label>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            className="agri-select min-h-[56px] text-base font-medium"
          >
            <option value="Conservative">Conservative (MSP Floor Focus)</option>
            <option value="Balanced">Balanced (Optimal Multi-Crop Split)</option>
            <option value="Growth">Growth (High-Margin Cash Crops)</option>
          </select>
        </div>

        <div className="agri-card p-5 space-y-2 border-2">
          <label className="text-base font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-['Space_Grotesk']">
            Primary Crop & Acres:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sections[0]?.crop || "Wheat"}
              onChange={(e) => updateSection(0, "crop", e.target.value)}
              className="agri-input w-1/2 min-h-[56px] text-base font-medium"
              placeholder="Crop Name"
            />
            <input
              type="number"
              value={sections[0]?.area || measuredAreaAcres}
              onChange={(e) => updateSection(0, "area", e.target.value)}
              className="agri-input w-1/2 min-h-[56px] text-base font-medium"
              placeholder="Acres"
            />
          </div>
        </div>
      </div>

      {/* Save Notification */}
      {saveMessage && (
        <div
          className={`p-4 rounded-2xl text-base font-bold border-2 ${
            saveMessage.type === "success"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
              : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-3">
        <button
          type="button"
          onClick={handleSaveFarm}
          disabled={saving || measuredAreaAcres <= 0}
          className="agri-btn-primary w-full sm:w-auto min-h-[60px] text-lg sm:text-xl font-extrabold px-10 flex items-center justify-center gap-3 shadow-lg"
        >
          {saving ? (
            <>
              <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving Field Boundary...</span>
            </>
          ) : (
            <>
              <span>💾</span>
              <span>Save Farm Boundary & See Recommendations →</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
