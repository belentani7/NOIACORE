import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, alertSettings, alerts, evidenceFiles, ledgerEntries, policies, policyVersions, scheduledJobs, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = values[field]; }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date(); updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) { values.role = user.role ?? "admin"; updateSet.role = values.role; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function listPolicies() { const db = await getDb(); return db ? db.select().from(policies).orderBy(desc(policies.updatedAt)) : []; }
export async function getPolicy(id: number) { const db = await getDb(); return db ? (await db.select().from(policies).where(eq(policies.id, id)).limit(1))[0] : undefined; }
export async function getPolicyVersion(policyId: number, version: number) { const db = await getDb(); return db ? (await db.select().from(policyVersions).where(and(eq(policyVersions.policyId, policyId), eq(policyVersions.version, version))).limit(1))[0] : undefined; }
export async function getLatestLedgerEntry() { const db = await getDb(); return db ? (await db.select().from(ledgerEntries).orderBy(desc(ledgerEntries.id)).limit(1))[0] : undefined; }

export async function dashboardMetrics() {
  const db = await getDb(); if (!db) return { total: 0, passed: 0, failed: 0, rejectionRate: 0, activeAlerts: 0, activePolicies: 0 };
  const [totals] = await db.select({ total: sql<number>`count(*)`, passed: sql<number>`sum(case when ${ledgerEntries.result} = 'pass' then 1 else 0 end)`, failed: sql<number>`sum(case when ${ledgerEntries.result} = 'fail' then 1 else 0 end)` }).from(ledgerEntries);
  const [alertCount] = await db.select({ count: sql<number>`count(*)` }).from(alerts).where(sql`${alerts.acknowledgedAt} is null`);
  const [policyCount] = await db.select({ count: sql<number>`count(*)` }).from(policies).where(eq(policies.status, "active"));
  const total = Number(totals?.total ?? 0), failed = Number(totals?.failed ?? 0);
  return { total, passed: Number(totals?.passed ?? 0), failed, rejectionRate: total ? Math.round((failed / total) * 100) : 0, activeAlerts: Number(alertCount?.count ?? 0), activePolicies: Number(policyCount?.count ?? 0) };
}

export async function listLedger(input: { limit: number; offset: number; result?: "pass" | "fail"; policyId?: number }) {
  const db = await getDb(); if (!db) return { rows: [], total: 0 };
  const conditions = [input.result ? eq(ledgerEntries.result, input.result) : undefined, input.policyId ? eq(ledgerEntries.policyId, input.policyId) : undefined].filter(Boolean) as any[];
  const where = conditions.length ? and(...conditions) : undefined;
  const rows = await db.select().from(ledgerEntries).where(where).orderBy(desc(ledgerEntries.createdAt)).limit(input.limit).offset(input.offset);
  const [count] = await db.select({ count: sql<number>`count(*)` }).from(ledgerEntries).where(where);
  return { rows, total: Number(count?.count ?? 0) };
}

export { alertSettings, alerts, evidenceFiles, ledgerEntries, policies, policyVersions, scheduledJobs, users };
export type { User };
