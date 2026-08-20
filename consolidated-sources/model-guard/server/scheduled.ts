import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { sdk } from "./_core/sdk";
import { alertSettings, alerts, dashboardMetrics, getDb, listLedger, scheduledJobs } from "./db";
import { findLedgerAnomalies } from "./ledger-utils";

async function authenticateCron(req: Request, res: Response) {
  const user = await sdk.authenticateRequest(req);
  if (!user.isCron || !user.taskUid) { res.status(403).json({ error: "cron-only" }); return null; }
  return user;
}

async function markJob(taskUid: string, status: string, summary: string) {
  const db = await getDb(); if (!db) return;
  await db.update(scheduledJobs).set({ lastRunAt: new Date(), lastStatus: status, lastSummary: summary }).where(eq(scheduledJobs.scheduleCronTaskUid, taskUid));
}

export async function healthCheckHandler(req: Request, res: Response) {
  try {
    const user = await authenticateCron(req, res); if (!user) return;
    const metrics = await dashboardMetrics(); const summary = JSON.stringify({ status: "ok", metrics, checkedAt: new Date().toISOString() });
    await markJob(user.taskUid!, "ok", summary); res.json({ ok: true, metrics });
  } catch (error) { res.status(500).json({ error: String(error), timestamp: new Date().toISOString(), context: { path: req.path } }); }
}

export async function dailySummaryHandler(req: Request, res: Response) {
  try {
    const user = await authenticateCron(req, res); if (!user) return;
    const metrics = await dashboardMetrics(); const recentLedger = await listLedger({ limit: 100, offset: 0 }); const anomalies = findLedgerAnomalies(recentLedger.rows); const db = await getDb();
    if (anomalies.length && db) { await db.insert(alerts).values({ type: "ledger_anomaly", severity: "critical", title: "Anomalía en la cadena del ledger", message: `Se detectaron ${anomalies.length} enlace(s) roto(s) en las últimas entradas.` }); await notifyOwner({ title: "NoiaCore: anomalía del ledger", content: `Se detectaron ${anomalies.length} enlaces hash inconsistentes.` }); }
    const settings = db ? (await db.select().from(alertSettings).limit(1))[0] : null;
    const summary = `Validaciones: ${metrics.total}. Aprobadas: ${metrics.passed}. Rechazadas: ${metrics.failed}. Tasa de rechazo: ${metrics.rejectionRate}%. Alertas activas: ${metrics.activeAlerts}.`;
    if (settings?.enabled && metrics.rejectionRate >= settings.rejectionThreshold) { if (db) await db.insert(alerts).values({ type: "rejection_rate", severity: "warning", title: "Tasa de rechazo por encima del umbral", message: summary }); await notifyOwner({ title: "NoiaCore: tasa de rechazo elevada", content: summary }); }
    await markJob(user.taskUid!, "ok", summary); res.json({ ok: true, summary });
  } catch (error) { res.status(500).json({ error: String(error), timestamp: new Date().toISOString(), context: { path: req.path } }); }
}
