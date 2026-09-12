/**
 * AgriProfit — Notification System Architecture (Prompt 16)
 * =========================================================
 * Manages farmer notifications for:
 * - Irrigation reminders (e.g. CRI stage critical irrigation)
 * - Weather alerts (e.g. Heavy rain / heatwave warnings)
 * - Disease & Pest risk alerts (e.g. Yellow Rust humidity alert)
 * - Market price alerts (e.g. Mustard mandi surge / MSP updates)
 * - Crop lifecycle stage reminders (e.g. Tillering & Top-dressing window)
 */

export type NotificationType =
  | "irrigation"
  | "weather_alert"
  | "disease_risk"
  | "market_price"
  | "crop_stage";

export type NotificationSeverity = "info" | "warning" | "critical";

export type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  severity: NotificationSeverity;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, unknown>;
  createdAt: string;
};

// In-Memory Storage with Initial Contextual Notifications
const notificationsStore: Map<string, NotificationItem[]> = new Map();

function generateDefaultFarmerNotifications(userId: string): NotificationItem[] {
  const now = new Date();
  const makeTime = (minutesAgo: number) =>
    new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString();

  return [
    {
      id: `notif_irr_${userId}_1`,
      userId,
      type: "irrigation",
      title: "Crown Root Irrigation (CRI) Due Tomorrow",
      body: "Wheat crop in your registered plot is at 21 DAS. First critical CRI irrigation must be applied within the next 48 hours to secure root crown anchorage.",
      severity: "critical",
      read: false,
      actionUrl: "/crop-plan",
      actionLabel: "View Irrigation Schedule",
      data: { crop: "Wheat", stage: "CRI", daysAfterSowing: 21 },
      createdAt: makeTime(25),
    },
    {
      id: `notif_wea_${userId}_2`,
      userId,
      type: "weather_alert",
      title: "Precipitation Warning: 18.5 mm Rain Forecast",
      body: "Open-Meteo & IMD predict heavy rain showers on Day 3. Suspend nitrogen top-dressing and chemical sprays for 48 hours to avoid fertilizer leaching.",
      severity: "warning",
      read: false,
      actionUrl: "/weather",
      actionLabel: "Check 7-Day Weather",
      data: { expectedRainMm: 18.5, rainProbability: 85 },
      createdAt: makeTime(120),
    },
    {
      id: `notif_dis_${userId}_3`,
      userId,
      type: "disease_risk",
      title: "Yellow Rust (Stripe Rust) Vulnerability Alert",
      body: "Morning fog (RH > 80%) with daytime temps of 18–22°C creates ideal conditions for Puccinia striiformis in agro-climatic zone. Scout wheat field corners for yellow powdery stripes.",
      severity: "warning",
      read: false,
      actionUrl: "/assistant",
      actionLabel: "Ask Agronomist AI",
      data: { pathogen: "Yellow Rust", crop: "Wheat", riskLevel: "Elevated" },
      createdAt: makeTime(360),
    },
    {
      id: `notif_mkt_${userId}_4`,
      userId,
      type: "market_price",
      title: "Mustard Mandi Price Reached ₹5,650/q",
      body: "Local APMC modal price matched the official MSP floor at ₹5,650/quintal (+2.1% 30-day upward trend).",
      severity: "info",
      read: true,
      actionUrl: "/markets",
      actionLabel: "View Mandi Prices",
      data: { crop: "Mustard", modalPrice: 5650, mandi: "Local APMC" },
      createdAt: makeTime(1440),
    },

    {
      id: `notif_stg_${userId}_5`,
      userId,
      type: "crop_stage",
      title: "Wheat Vegetative Tillering Transition",
      body: "Wheat crop transitioning into active tillering. Prepare second split Urea application (@ 30–35 kg/acre) ahead of jointing.",
      severity: "info",
      read: true,
      actionUrl: "/crop-plan",
      actionLabel: "View Crop Plan",
      data: { crop: "Wheat", stage: "Tillering" },
      createdAt: makeTime(2880),
    },
  ];
}

export async function getFarmerNotifications(
  userId = "default-farmer",
  filterType?: string
): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
  if (!notificationsStore.has(userId)) {
    notificationsStore.set(userId, generateDefaultFarmerNotifications(userId));
  }

  let list = notificationsStore.get(userId) || [];
  if (filterType && filterType !== "all") {
    list = list.filter((n) => n.type === filterType);
  }

  // Sort descending by creation date
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const allItems = notificationsStore.get(userId) || [];
  const unreadCount = allItems.filter((n) => !n.read).length;

  return { notifications: list, unreadCount };
}

export async function markNotificationAsRead(
  notificationId: string,
  userId = "default-farmer"
): Promise<boolean> {
  const list = notificationsStore.get(userId) || [];
  const item = list.find((n) => n.id === notificationId);
  if (item) {
    item.read = true;
    return true;
  }
  return false;
}

export async function markAllNotificationsAsRead(userId = "default-farmer"): Promise<number> {
  const list = notificationsStore.get(userId) || [];
  let count = 0;
  list.forEach((n) => {
    if (!n.read) {
      n.read = true;
      count++;
    }
  });
  return count;
}

export async function createFarmerNotification(
  item: Omit<NotificationItem, "id" | "createdAt" | "read">,
  userId = "default-farmer"
): Promise<NotificationItem> {
  if (!notificationsStore.has(userId)) {
    notificationsStore.set(userId, generateDefaultFarmerNotifications(userId));
  }

  const newItem: NotificationItem = {
    ...item,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    read: false,
    createdAt: new Date().toISOString(),
  };

  const list = notificationsStore.get(userId) || [];
  list.unshift(newItem);
  notificationsStore.set(userId, list);

  return newItem;
}

