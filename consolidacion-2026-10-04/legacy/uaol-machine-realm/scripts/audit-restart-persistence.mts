import { writeFile } from "node:fs/promises";
import { desc, eq } from "drizzle-orm";
import {
  accessAuditLogs,
  gatewayHeartbeats,
  gateways,
  operationCommands,
  operationalEvents,
  operationalReports,
  realmMachines,
  telemetrySnapshots,
  users,
} from "../drizzle/schema.ts";
import { getDb } from "../server/db.ts";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL es obligatorio para verificar la persistencia.");

  const admin = (await db.select().from(users).where(eq(users.role, "admin")).limit(1))[0];
  if (!admin) throw new Error("No existe un usuario administrador para la auditoría.");

  const [machines, commands, telemetry, events, reports, registeredGateways, heartbeats, audits, latestCommand, latestAudit] = await Promise.all([
    db.select().from(realmMachines).where(eq(realmMachines.ownerId, admin.id)),
    db.select().from(operationCommands).where(eq(operationCommands.ownerId, admin.id)),
    db.select().from(telemetrySnapshots),
    db.select().from(operationalEvents).where(eq(operationalEvents.ownerId, admin.id)),
    db.select().from(operationalReports).where(eq(operationalReports.ownerId, admin.id)),
    db.select().from(gateways).where(eq(gateways.ownerId, admin.id)),
    db.select().from(gatewayHeartbeats),
    db.select().from(accessAuditLogs).where(eq(accessAuditLogs.userId, admin.id)),
    db.select().from(operationCommands).where(eq(operationCommands.ownerId, admin.id)).orderBy(desc(operationCommands.requestedAt)).limit(1),
    db.select().from(accessAuditLogs).where(eq(accessAuditLogs.userId, admin.id)).orderBy(desc(accessAuditLogs.createdAt)).limit(1),
  ]);

  const evidence = {
    checkedAt: new Date().toISOString(),
    label: process.env.AUDIT_LABEL ?? "unnamed",
    mode: "SIMULATION_ONLY",
    owner: { id: admin.id, role: admin.role },
    persistentRows: {
      machines: machines.length,
      operationCommands: commands.length,
      telemetrySnapshots: telemetry.length,
      operationalEvents: events.length,
      operationalReports: reports.length,
      gateways: registeredGateways.length,
      gatewayHeartbeats: heartbeats.length,
      accessAuditLogs: audits.length,
    },
    latestRecords: {
      command: latestCommand[0]
        ? { id: latestCommand[0].id, commandId: latestCommand[0].commandId, status: latestCommand[0].status, requestedAt: latestCommand[0].requestedAt }
        : null,
      accessAudit: latestAudit[0]
        ? { id: latestAudit[0].id, action: latestAudit[0].action, createdAt: latestAudit[0].createdAt }
        : null,
    },
    persistencePresent: machines.length > 0 && commands.length > 0 && telemetry.length > 0 && events.length > 0 && registeredGateways.length > 0 && heartbeats.length > 0 && audits.length > 0,
  };

  const output = process.env.AUDIT_OUTPUT ?? "docs/audit-restart-persistence.json";
  await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  if (!evidence.persistencePresent) throw new Error("No se encontraron todos los indicadores de persistencia esperados.");
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
