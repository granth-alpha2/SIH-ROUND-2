import { Pool } from "pg";

export type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  level?: string;
  read: boolean;
  createdAt: string;
};

type DbNotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  level: string | null;
  read: boolean;
  created_at: Date;
};

const globalStore = globalThis as typeof globalThis & { agriprofitNotifications?: NotificationRecord[]; agriprofitPool?: Pool };
const memoryNotifications = globalStore.agriprofitNotifications ?? (globalStore.agriprofitNotifications = []);

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  return globalStore.agriprofitPool ?? (globalStore.agriprofitPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }));
}

export async function saveNotification(n: NotificationRecord) {
  const pool = getPool();
  if (!pool) {
    memoryNotifications.unshift(n);
    if (memoryNotifications.length > 500) memoryNotifications.length = 500;
    return n;
  }
  await pool.query(
    `INSERT INTO notifications (id, type, title, body, data, level, read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [n.id, n.type, n.title, n.body, JSON.stringify(n.data ?? {}), n.level ?? null, n.read, n.createdAt],
  );
  return n;
}

export async function listNotifications(): Promise<NotificationRecord[]> {
  const pool = getPool();
  if (!pool) return memoryNotifications;
  const result = await pool.query<DbNotificationRow>(`SELECT id, type, title, body, data, level, read, created_at FROM notifications ORDER BY created_at DESC LIMIT 200`);
  return result.rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    data: r.data,
    level: r.level ?? undefined,
    read: !!r.read,
    createdAt: r.created_at.toISOString(),
  }));
}

export async function markNotificationRead(id: string, read: boolean) {
  const pool = getPool();
  if (!pool) {
    const rec = memoryNotifications.find((m) => m.id === id);
    if (rec) rec.read = read;
    return rec;
  }
  await pool.query(`UPDATE notifications SET read=$1 WHERE id=$2`, [read, id]);
  return { id, read };
}
