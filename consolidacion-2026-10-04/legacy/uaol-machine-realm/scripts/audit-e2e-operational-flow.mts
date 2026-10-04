import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { and, desc, eq } from "drizzle-orm";
import { commandExecutions, operationCommands, operationalEvents, realmMachines, telemetrySnapshots, users, validationLedger } from "../drizzle/schema.ts";
import { getDb } from "../server/db.ts";
import { getOperationalOverview, provisionGatewayCredentials, requestOperation } from "../server/operations.ts";

function gatewayOnce(environment: NodeJS.ProcessEnv) {
  return new Promise<{ code: number | null; output: string }>((resolve) => {
    const child = spawn("pnpm", ["tsx", "gateway-local/src/index.mts"], { cwd: process.cwd(), env: environment, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", value => { output += value.toString(); });
    child.stderr.on("data", value => { output += value.toString(); });
    child.on("close", code => resolve({ code, output }));
  });
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL es obligatorio para la auditoría end-to-end.");
  const admin = (await db.select().from(users).where(eq(users.role, "admin")).limit(1))[0];
  if (!admin) throw new Error("No hay administrador disponible para la auditoría.");
  const before = await getOperationalOverview(admin.id);
  const machine = before.machines.find(item => item.state === "idle" || item.state === "stopped") ?? before.machines[0];
  if (!machine) throw new Error("No existe máquina simulada para la auditoría.");
  const commandType = machine.state === "idle" || machine.state === "stopped" ? "start" : "pause";
  const idempotencyKey = `audit-e2e-${Date.now()}-${machine.id}`;
  const first = await requestOperation({ ownerId: admin.id, machineId: machine.id, commandType, idempotencyKey, confirmed: true });
  const replay = await requestOperation({ ownerId: admin.id, machineId: machine.id, commandType, idempotencyKey, confirmed: true });
  const credential = await provisionGatewayCredentials(admin.id);
  const gatewayRun = await gatewayOnce({ ...process.env, BACKEND_URL: "http://localhost:3000", GATEWAY_ID: credential.gatewayKey, GATEWAY_TOKEN: credential.token, MACHINE_MODE: "simulator", GATEWAY_ONESHOT: "true", GATEWAY_OUTBOX_PATH: "/tmp/uaol-audit-e2e-outbox.json" });
  const command = (await db.select().from(operationCommands).where(eq(operationCommands.commandId, first.commandId)).limit(1))[0];
  if (!command) throw new Error("El comando solicitado no existe en base de datos.");
  const [machineAfter] = await db.select().from(realmMachines).where(eq(realmMachines.id, machine.id)).limit(1);
  const [ledger] = await db.select().from(validationLedger).where(and(eq(validationLedger.ownerId, admin.id), eq(validationLedger.machineId, machine.id))).orderBy(desc(validationLedger.createdAt)).limit(1);
  const [execution] = await db.select().from(commandExecutions).where(eq(commandExecutions.commandId, command.id)).orderBy(desc(commandExecutions.startedAt)).limit(1);
  const telemetry = await db.select().from(telemetrySnapshots).where(eq(telemetrySnapshots.machineId, machine.id)).orderBy(desc(telemetrySnapshots.createdAt)).limit(3);
  const events = await db.select().from(operationalEvents).where(eq(operationalEvents.commandId, command.id)).orderBy(operationalEvents.createdAt);
  const duplicateCount = (await db.select().from(operationCommands).where(and(eq(operationCommands.ownerId, admin.id), eq(operationCommands.idempotencyKey, idempotencyKey)))).length;
  const evidence = {
    completedAt: new Date().toISOString(),
    mode: "SIMULATION_ONLY",
    command: { commandId: first.commandId, type: commandType, initialStatus: first.status, finalStatus: command.status, idempotencyKey, replayed: replay.replayed, duplicateCount },
    authorization: { validationDecision: ledger?.permissionDecision ?? null, validationStatus: ledger?.verificationStatus ?? null, requiresConfirmation: command.requiresConfirmation },
    gateway: { exitCode: gatewayRun.code, heartbeatAndResultOutput: gatewayRun.output.trim().split("\n").filter(Boolean) },
    machine: { beforeState: machine.state, afterState: machineAfter?.state ?? null, connection: machineAfter?.connectionStatus ?? null },
    persistence: { commandExecution: execution?.status ?? null, telemetryRows: telemetry.length, eventTypes: events.map(item => item.eventType), auditLedgerId: ledger?.id ?? null },
    complete: gatewayRun.code === 0 && command.status === "succeeded" && duplicateCount === 1 && telemetry.length > 0 && events.length > 0 && Boolean(ledger),
  };
  await writeFile("docs/audit-e2e-operational-flow.json", `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  if (!evidence.complete) throw new Error("El flujo end-to-end no produjo toda la evidencia esperada.");
}

main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
