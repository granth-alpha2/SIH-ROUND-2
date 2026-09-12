"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import type { NotificationItem, NotificationType } from "@/lib/notification-service";

const filterTabs: { label: string; value: string }[] = [
  { label: "All Alerts", value: "all" },
  { label: "Irrigation", value: "irrigation" },
  { label: "Weather Alerts", value: "weather_alert" },
  { label: "Disease & Pests", value: "disease_risk" },
  { label: "Market Prices", value: "market_price" },
  { label: "Crop Stages", value: "crop_stage" },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [webPushEnabled, setWebPushEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const url = activeTab === "all" ? "/api/notifications" : `/api/notifications?type=${activeTab}`;
        const res = await fetch(url);
        if (res.ok && isMounted) {
          const json = await res.json();
          setItems(json.notifications || []);
          setUnreadCount(json.unreadCount || 0);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) {
          setLoading(false);
          if (typeof window !== "undefined" && "Notification" in window) {
            setWebPushEnabled(Notification.permission === "granted");
          }
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  async function handleMarkSingleRead(id: string) {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Fallback
    }
  }

  async function handleMarkAllRead() {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {
      // Fallback
    }
  }

  async function requestWebPushPermission() {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setWebPushEnabled(perm === "granted");
      if (perm === "granted") {
        new Notification("AgriProfit Alerts Enabled", {
          body: "You will receive critical irrigation, weather, and disease advisories directly.",
        });
      }
    }
  }

  function getTypeBadge(type: NotificationType) {
    switch (type) {
      case "irrigation":
        return <span className="agri-badge agri-badge-sky">🚿 Irrigation</span>;
      case "weather_alert":
        return <span className="agri-badge agri-badge-amber">⛈ Weather Alert</span>;
      case "disease_risk":
        return <span className="agri-badge agri-badge-rose">🔬 Disease Risk</span>;
      case "market_price":
        return <span className="agri-badge agri-badge-emerald">📈 Market Price</span>;
      case "crop_stage":
        return <span className="agri-badge agri-badge-emerald">🌾 Crop Milestone</span>;
      default:
        return <span className="agri-badge agri-badge-sky">🔔 Notice</span>;
    }
  }

  return (
    <AppShell pageTitle="Alerts & Notifications">
      <div className="page-container space-y-6">
        {/* Header Row */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="agri-badge agri-badge-rose">
                {unreadCount} Unread Alert(s)
              </span>
              <span className="text-xs text-[var(--text-muted)] font-['Space_Grotesk']">
                Multimodal SMS & Push Feeds
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Agro-Intelligence Notifications Hub
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Real-time actionable alerts for irrigation windows, rainfall forecasts, fungal risk indices, and APMC price movements.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="agri-btn-secondary text-xs"
              >
                ✓ Mark All as Read
              </button>
            )}

            {!webPushEnabled && (
              <button
                type="button"
                onClick={requestWebPushPermission}
                className="agri-btn-primary text-xs"
              >
                <span>🔔</span>
                <span>Enable Browser Alerts</span>
              </button>
            )}
          </div>
        </header>

        {/* Filter Navigation Tabs */}
        <section className="agri-card p-2 flex gap-1.5 flex-wrap overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.value
                  ? "agri-btn-primary shadow-xs"
                  : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </section>

        {/* Loading State */}
        {loading && (
          <div className="agri-card p-12 text-center text-[var(--text-muted)] space-y-2">
            <div className="inline-block w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Fetching active agronomic notification feed...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="agri-card p-12 text-center text-[var(--text-muted)] space-y-2">
            <p className="text-sm font-semibold">No alerts found in this category.</p>
          </div>
        )}

        {/* Alerts List */}
        {!loading && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className={`agri-card p-5 transition-all space-y-3 ${
                  !item.read
                    ? "border-[var(--color-primary)] bg-[var(--bg-surface-accent)] ring-1 ring-[var(--border-accent)]"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {getTypeBadge(item.type)}
                    <h2 className="text-base font-bold font-['Space_Grotesk'] text-[var(--text-primary)]">
                      {item.title}
                    </h2>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 animate-ping" />
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(item.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {item.body}
                </p>

                {/* Footer Action Links */}
                <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-between items-center text-xs">
                  {item.actionUrl ? (
                    <Link
                      href={item.actionUrl}
                      className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                    >
                      <span>Take Action</span>
                      <span>→</span>
                    </Link>
                  ) : (
                    <span className="text-[var(--text-muted)]">Informational update</span>
                  )}

                  {!item.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkSingleRead(item.id)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-semibold cursor-pointer"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}