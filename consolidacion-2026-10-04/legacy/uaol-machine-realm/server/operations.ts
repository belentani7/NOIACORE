import { and, asc, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  commandExecutions,
  gateways,
  gatewayHeartbeats,
  healthChecks,
  machineAdapterConfigurations,
  maintenanceRecords,
  notifications,
  operationalReports,
  operationCommands,
  operationalEvents,
  realmMachines,
  simulatedAlerts,
  systemSettings,
  telemetrySnapshots,
  validationLedger,
} from "../drizzle/schema";
import type { MachineState, OperationCommandType, RiskLevel } from "@shared/simulator";
import { getDb } from "./db";
import { SimulatorMachineAdapter } from "./machineAdapter";
import { publishOperationalEvent } from "./realtime";
import { ensureSimulationWorkspace, evaluateSimulationPermission } from "./simulation";
import { canTransitionMachine, riskForMachineTransition, simulatedTelemetry, syntheticEvidence } from "./simulationRules";

type CommandStatus = "requested" | "validating" | "approved" | "queued" | "executing" | "succeeded" | "failed" | "cancelled" | "timeout" | "rejected";

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("La base de datos no está disponible.");
  return db;
}

function commandRisk(commandType: OperationCommandType): RiskLevel {
  if (commandType === "emergency_stop_simulation") return "critical";
  if (["start", "resume", "reset", "maintenance"].includes(commandType)) return "high";
  return "medium";
}

function eventForCommand(commandType: OperationCommandType, status: CommandStatus) {
  const normalized = commandType.toUpperCase();
  if (status === "succeeded") return commandType === "start" ? "MACHINE_STARTED" : commandType === "stop" ? "MACHINE_STOPPED" : `COMMAND_${normalized}_SUCCEEDED`;
  return `COMMAND_${status.toUpperCase()}`;
}

async function appendEvent(input: { ownerId: number; machineId?: number | null; gatewayId?: number | null; commandId?: number | null; eventType: string; severity?: "info" | "warning" | "critical"; correlationId?: string; payload: Record<string, unknown> }) {
  const db = requireDb(await getDb());
  await db.insert(operationalEvents).values({
    ownerId: input.ownerId,
    machineId: input.machineId ?? null,
    gatewayId: input.gatewayId ?? null,
    commandId: input.commandId ?? null,
    eventType: input.eventType,
    severity: input.severity ?? "info",
    correlationId: input.correlationId ?? null,
    payloadJson: input.payload,
  });
  publishOperationalEvent(input.ownerId, "event", { eventType: input.eventType, machineId: input.machineId ?? null, commandId: input.commandId ?? null, ...input.payload });
}

export async function ensureOperationalWorkspace(ownerId: number) {
  await ensureSimulationWorkspace(ownerId);
  const db = requireDb(await getDb());
  let gateway = (await db.select().from(gateways).where(eq(gateways.ownerId, ownerId)).limit(1))[0];
  if (!gateway) {
    const created = await db.insert(gateways).values({
      ownerId,
      gatewayKey: `gw-sim-${nanoid(12)}`,
      name: "Gateway local — simulador determinista",
      status: "online",
      operatingMode: "simulator",
      lastHeartbeatAt: new Date(),
      metadataJson: { simulationOnly: true, hardwareAdapterConfigured: false, purpose: "Puente local preparado para un adaptador autorizado." },
    }).$returningId();
    gateway = (await db.select().from(gateways).where(eq(gateways.id, created[0]!.id)).limit(1))[0]!;
    await appendEvent({ ownerId, gatewayId: gateway.id, eventType: "GATEWAY_CONNECTED", payload: { gatewayKey: gateway.gatewayKey, simulationOnly: true } });
  }
  const machines = await db.select().from(realmMachines).where(eq(realmMachines.ownerId, ownerId));
  for (const machine of machines) {
    const existing = await db.select().from(machineAdapterConfigurations).where(and(eq(machineAdapterConfigurations.ownerId, ownerId), eq(machineAdapterConfigurations.machineId, machine.id))).limit(1);
    if (!existing[0]) await db.insert(machineAdapterConfigurations).values({ ownerId, machineId: machine.id, gatewayId: gateway.id, adapterKind: "simulator", lifecycleStatus: "active", configurationJson: { simulationOnly: true, contract: "MachineAdapter", physicalProtocol: null } });
  }
  return gateway;
}

export async function getOperationalOverview(ownerId: number) {
  const gateway = await ensureOperationalWorkspace(ownerId);
  const db = requireDb(await getDb());
  const [machines, commands, events, heartbeats, health, adapters, maintenance, recentNotifications, telemetry, alerts, reports] = await Promise.all([
    db.select().from(realmMachines).where(eq(realmMachines.ownerId, ownerId)),
    db.select().from(operationCommands).where(eq(operationCommands.ownerId, ownerId)).orderBy(desc(operationCommands.requestedAt)).limit(40),
    db.select().from(operationalEvents).where(eq(operationalEvents.ownerId, ownerId)).orderBy(desc(operationalEvents.createdAt)).limit(80),
    db.select().from(gatewayHeartbeats).where(eq(gatewayHeartbeats.gatewayId, gateway.id)).orderBy(desc(gatewayHeartbeats.createdAt)).limit(20),
    db.select().from(healthChecks).where(eq(healthChecks.ownerId, ownerId)).orderBy(desc(healthChecks.createdAt)).limit(30),
    db.select().from(machineAdapterConfigurations).where(eq(machineAdapterConfigurations.ownerId, ownerId)),
    db.select().from(maintenanceRecords).where(eq(maintenanceRecords.ownerId, ownerId)).orderBy(desc(maintenanceRecords.createdAt)).limit(20),
    db.select().from(notifications).where(eq(notifications.ownerId, ownerId)).orderBy(desc(notifications.createdAt)).limit(20),
    db.select().from(telemetrySnapshots).orderBy(desc(telemetrySnapshots.createdAt)).limit(160),
    db.select().from(simulatedAlerts).where(eq(simulatedAlerts.ownerId, ownerId)).orderBy(desc(simulatedAlerts.createdAt)).limit(30),
    db.select().from(operationalReports).where(eq(operationalReports.ownerId, ownerId)).orderBy(desc(operationalReports.createdAt)).limit(20),
  ]);
  const ownerMachineIds = new Set(machines.map(machine => machine.id));
  return { gateway, machines, commands, events, heartbeats, health, adapters, maintenance, notifications: recentNotifications, telemetry: telemetry.filter(sample => ownerMachineIds.has(sample.machineId)).reverse(), alerts, reports, simulationMode: true, hardwareMode: "HARDWARE_NOT_CONFIGURED" as const };
}

export async function getClientOperationalOverview(ownerId: number) {
  const overview = await getOperationalOverview(ownerId);
  return {
    gateway: { name: overview.gateway.name, status: overview.gateway.status, operatingMode: overview.gateway.operatingMode },
    machines: overview.machines.map(machine => ({ id: machine.id, machineKey: machine.machineKey, name: machine.name, area: machine.area, state: machine.state, connectionStatus: machine.connectionStatus, cycleCount: machine.cycleCount, runtimeSeconds: machine.runtimeSeconds })),
    alerts: overview.alerts.map(alert => ({ id: alert.id, severity: alert.severity, title: alert.title, description: alert.description, status: alert.status, createdAt: alert.createdAt })),
    events: overview.events.slice(0, 20).map(event => ({ id: event.id, eventType: event.eventType, createdAt: event.createdAt })),
    reports: overview.reports.map(report => ({ id: report.id, reportKey: report.reportKey, reportType: report.reportType, title: report.title, createdAt: report.createdAt })),
    simulationMode: true as const,
  };
}

export async function generateOperationalReport(ownerId: number) {
  const snapshot = await getOperationalOverview(ownerId);
  const db = requireDb(await getDb());
  const reportKey = `rpt-${nanoid(16)}`;
  const activeAlerts = snapshot.alerts.filter(alert => alert.status === "active").length;
  const content = {
    generatedAt: new Date().toISOString(),
    simulationOnly: true,
    gateway: { key: snapshot.gateway.gatewayKey, status: snapshot.gateway.status, operatingMode: snapshot.gateway.operatingMode },
    fleet: snapshot.machines.map(machine => ({ machineKey: machine.machineKey, state: machine.state, connectionStatus: machine.connectionStatus, cycleCount: machine.cycleCount, runtimeSeconds: machine.runtimeSeconds })),
    metrics: { machines: snapshot.machines.length, activeAlerts, queuedCommands: snapshot.commands.filter(command => ["requested", "validating", "approved", "queued", "executing"].includes(command.status)).length, healthChecks: snapshot.health.length },
    boundary: "SIMULATION_ONLY",
  };
  const inserted = await db.insert(operationalReports).values({ ownerId, reportKey, reportType: "operational", title: `Informe operacional — ${new Date().toLocaleDateString("es-ES")}`, contentJson: content }).$returningId();
  const report = (await db.select().from(operationalReports).where(eq(operationalReports.id, inserted[0]!.id)).limit(1))[0]!;
  await appendEvent({ ownerId, gatewayId: snapshot.gateway.id, eventType: "OPERATIONAL_REPORT_GENERATED", payload: { reportKey, reportId: report.id, simulationOnly: true } });
  return report;
}

const DEFAULT_OPERATIONAL_SETTINGS = {
  telemetryCadenceSeconds: 8,
  defaultLatencyMs: 0,
  maxQueuedCommands: 50,
  requireConfirmationForHighRisk: true,
  simulationOnly: true,
};

export async function getOperationalSettings(ownerId: number) {
  await ensureOperationalWorkspace(ownerId);
  const db = requireDb(await getDb());
  let setting = (await db.select().from(systemSettings).where(and(eq(systemSettings.ownerId, ownerId), eq(systemSettings.settingKey, "operational_defaults"))).limit(1))[0];
  if (!setting) {
    const inserted = await db.insert(systemSettings).values({ ownerId, settingKey: "operational_defaults", valueJson: DEFAULT_OPERATIONAL_SETTINGS }).$returningId();
    setting = (await db.select().from(systemSettings).where(eq(systemSettings.id, inserted[0]!.id)).limit(1))[0]!;
  }
  return setting;
}

export async function updateOperationalSettings(input: { ownerId: number; telemetryCadenceSeconds: number; defaultLatencyMs: number; maxQueuedCommands: number; requireConfirmationForHighRisk: boolean }) {
  const db = requireDb(await getDb());
  const setting = await getOperationalSettings(input.ownerId);
  const valueJson = { ...DEFAULT_OPERATIONAL_SETTINGS, ...input, ownerId: undefined, simulationOnly: true };
  delete (valueJson as { ownerId?: number }).ownerId;
  await db.update(systemSettings).set({ valueJson }).where(eq(systemSettings.id, setting.id));
  await appendEvent({ ownerId: input.ownerId, eventType: "OPERATIONAL_SETTINGS_UPDATED", payload: { settingKey: "operational_defaults", valueJson } });
  return { ...setting, valueJson };
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function provisionGatewayCredentials(ownerId: number) {
  const gateway = await ensureOperationalWorkspace(ownerId);
  const db = requireDb(await getDb());
  const token = `gwt_${nanoid(48)}`;
  await db.update(gateways).set({ gatewayTokenHash: tokenHash(token), tokenLastRotatedAt: new Date(), status: "provisioning" }).where(eq(gateways.id, gateway.id));
  await appendEvent({ ownerId, gatewayId: gateway.id, eventType: "GATEWAY_CREDENTIALS_ROTATED", severity: "warning", payload: { gatewayKey: gateway.gatewayKey, simulationOnly: true } });
  return { gatewayKey: gateway.gatewayKey, token, operatingMode: "simulator" as const, hardwareMode: "HARDWARE_NOT_CONFIGURED" as const };
}

export async function receiveGatewayHeartbeat(input: { gatewayKey: string; token: string; status: "online" | "offline" | "degraded"; latencyMs: number; metadata: Record<string, unknown> }) {
  const db = requireDb(await getDb());
  const gateway = (await db.select().from(gateways).where(eq(gateways.gatewayKey, input.gatewayKey)).limit(1))[0];
  if (!gateway?.gatewayTokenHash) throw new Error("Gateway no aprovisionado.");
  const expected = Buffer.from(gateway.gatewayTokenHash, "hex");
  const received = Buffer.from(tokenHash(input.token), "hex");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new Error("Credencial de gateway no válida.");
  const latencyMs = Math.max(0, Math.round(input.latencyMs));
  await db.update(gateways).set({ status: input.status, lastHeartbeatAt: new Date(), metadataJson: { ...((gateway.metadataJson as Record<string, unknown>) ?? {}), ...input.metadata, simulationOnly: true } }).where(eq(gateways.id, gateway.id));
  await db.insert(gatewayHeartbeats).values({ gatewayId: gateway.id, status: input.status, latencyMs, metadataJson: { ...input.metadata, simulationOnly: true } });
  await db.insert(healthChecks).values({ ownerId: gateway.ownerId, component: "gateway", componentKey: gateway.gatewayKey, status: input.status === "online" ? "healthy" : input.status === "degraded" ? "degraded" : "unhealthy", latencyMs, detailJson: { source: "gateway-local", simulationOnly: true } });
  await appendEvent({ ownerId: gateway.ownerId, gatewayId: gateway.id, eventType: "GATEWAY_HEARTBEAT", payload: { status: input.status, latencyMs, simulationOnly: true } });
  publishOperationalEvent(gateway.ownerId, "gateway", { gatewayId: gateway.id, status: input.status, heartbeat: true, simulationOnly: true });
  return { accepted: true, gatewayId: gateway.id, simulationOnly: true };
}

async function authenticateGateway(gatewayKey: string, token: string) {
  const db = requireDb(await getDb());
  const gateway = (await db.select().from(gateways).where(eq(gateways.gatewayKey, gatewayKey)).limit(1))[0];
  if (!gateway?.gatewayTokenHash) throw new Error("Gateway no aprovisionado.");
  const expected = Buffer.from(gateway.gatewayTokenHash, "hex");
  const received = Buffer.from(tokenHash(token), "hex");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new Error("Credencial de gateway no válida.");
  return { db, gateway };
}

export async function leaseGatewayCommand(input: { gatewayKey: string; token: string }) {
  const { db, gateway } = await authenticateGateway(input.gatewayKey, input.token);
  if (gateway.operatingMode !== "simulator") return { command: null, reason: "hardware_mode_not_available" as const };
  const command = (await db.select().from(operationCommands).where(and(eq(operationCommands.gatewayId, gateway.id), eq(operationCommands.status, "queued"))).orderBy(asc(operationCommands.requestedAt)).limit(1))[0];
  if (!command) return { command: null, reason: "queue_empty" as const };
  const machine = (await db.select().from(realmMachines).where(and(eq(realmMachines.id, command.machineId), eq(realmMachines.ownerId, gateway.ownerId))).limit(1))[0];
  if (!machine) throw new Error("Máquina del comando no encontrada.");
  await db.update(operationCommands).set({ status: "executing" }).where(eq(operationCommands.id, command.id));
  await db.insert(commandExecutions).values({ commandId: command.id, gatewayId: gateway.id, status: "executing", startedAt: new Date() });
  await updateCommandStatus(gateway.ownerId, command, "executing", { source: "gateway-local" });
  return { command: { commandId: command.commandId, commandType: command.commandType, correlationId: command.correlationId, machine: { id: machine.id, machineKey: machine.machineKey, state: machine.state, connectionStatus: machine.connectionStatus }, simulationOnly: true }, reason: null };
}

export async function reportGatewayCommandResult(input: { gatewayKey: string; token: string; commandId: string; accepted: boolean; nextState?: MachineState; message: string; telemetry?: { temperature: number; pressure: number; vibration: number; energy: number; quality: number; load: number; speed: number } }) {
  const { db, gateway } = await authenticateGateway(input.gatewayKey, input.token);
  const command = (await db.select().from(operationCommands).where(and(eq(operationCommands.commandId, input.commandId), eq(operationCommands.gatewayId, gateway.id))).limit(1))[0];
  if (!command) throw new Error("Comando no encontrado para este gateway.");
  const machine = (await db.select().from(realmMachines).where(eq(realmMachines.id, command.machineId)).limit(1))[0];
  if (!machine) throw new Error("Máquina del comando no encontrada.");
  const nextState = input.nextState ?? (machine.state as MachineState);
  const transitionAllowed = canTransitionMachine(machine.state as MachineState, nextState);
  if (!input.accepted || !transitionAllowed) {
    const error = !input.accepted ? input.message : `La transición ${machine.state} → ${nextState} fue bloqueada por la máquina de estados.`;
    await db.update(operationCommands).set({ status: "failed", errorMessage: error, completedAt: new Date() }).where(eq(operationCommands.id, command.id));
    await db.update(commandExecutions).set({ status: "failed", finishedAt: new Date(), errorMessage: error }).where(eq(commandExecutions.commandId, command.id));
    await db.insert(simulatedAlerts).values({ ownerId: gateway.ownerId, machineId: machine.id, severity: "warning", status: "active", title: "Resultado de gateway rechazado", description: error });
    await updateCommandStatus(gateway.ownerId, command, "failed", { error, source: "gateway-local" });
    return { accepted: false, status: "failed" as const, simulationOnly: true };
  }
  const telemetry = input.telemetry ?? simulatedTelemetry(nextState);
  const cycleIncrement = nextState === "operating" && machine.state !== "operating" ? 1 : 0;
  const runtimeSeconds = machine.runtimeSeconds + (nextState === "operating" ? 8 : 0);
  await db.update(realmMachines).set({ state: nextState, connectionStatus: "connected", runtimeSeconds, cycleCount: machine.cycleCount + cycleIncrement, currentLoad: telemetry.load, currentSpeed: telemetry.speed }).where(eq(realmMachines.id, machine.id));
  await db.insert(telemetrySnapshots).values({ machineId: machine.id, ...telemetry, cycleCount: machine.cycleCount + cycleIncrement, runtimeSeconds });
  if (command.commandType === "acknowledge_alarm") await db.update(simulatedAlerts).set({ status: "acknowledged" }).where(and(eq(simulatedAlerts.ownerId, gateway.ownerId), eq(simulatedAlerts.machineId, machine.id), eq(simulatedAlerts.status, "active")));
  if (nextState === "emergency") await db.insert(simulatedAlerts).values({ ownerId: gateway.ownerId, machineId: machine.id, severity: "critical", status: "active", title: `Emergencia simulada — ${machine.name}`, description: "Flujo lógico procesado por gateway-local contra el simulador. No representa una parada física." });
  await db.update(operationCommands).set({ status: "succeeded", completedAt: new Date(), resultJson: { message: input.message, nextState, telemetry, simulationOnly: true } }).where(eq(operationCommands.id, command.id));
  await db.update(commandExecutions).set({ status: "succeeded", finishedAt: new Date(), resultJson: { message: input.message, nextState, simulationOnly: true } }).where(eq(commandExecutions.commandId, command.id));
  await updateCommandStatus(gateway.ownerId, command, "succeeded", { result: input.message, state: nextState, source: "gateway-local" });
  publishOperationalEvent(gateway.ownerId, "machine", { machineId: machine.id, state: nextState, commandId: command.commandId, source: "gateway-local", simulationOnly: true });
  return { accepted: true, status: "succeeded" as const, simulationOnly: true };
}

export async function simulateMachineCondition(input: { ownerId: number; machineId: number; condition: "disconnect" | "reconnect" | "fault" | "recover" | "latency"; latencyMs?: number; confirmed?: boolean }) {
  await ensureOperationalWorkspace(input.ownerId);
  const db = requireDb(await getDb());
  const machine = (await db.select().from(realmMachines).where(and(eq(realmMachines.id, input.machineId), eq(realmMachines.ownerId, input.ownerId))).limit(1))[0];
  if (!machine) throw new Error("La máquina no existe o no pertenece a la sesión actual.");
  const riskLevel: RiskLevel = input.condition === "fault" ? "high" : "medium";
  const permission = await evaluateSimulationPermission({ ownerId: input.ownerId, action: `diagnostic.${input.condition}.simulated`, riskLevel, confirmed: input.confirmed });
  if (permission.decision !== "allowed") return { changed: false, requiresConfirmation: permission.decision === "confirmation_required", reason: permission.reason };
  const changes: Partial<typeof realmMachines.$inferInsert> = {};
  let eventType = "MACHINE_DIAGNOSTIC_UPDATED";
  let severity: "info" | "warning" | "critical" = "info";
  if (input.condition === "disconnect") { changes.connectionStatus = "disconnected"; changes.state = "offline"; eventType = "MACHINE_DISCONNECTED"; severity = "warning"; }
  if (input.condition === "reconnect") { changes.connectionStatus = "connected"; changes.state = "standby"; eventType = "MACHINE_CONNECTED"; }
  if (input.condition === "fault") { changes.connectionStatus = "fault"; changes.state = "error"; eventType = "MACHINE_ERROR"; severity = "critical"; }
  if (input.condition === "recover") { changes.connectionStatus = "connected"; changes.state = "maintenance"; eventType = "MACHINE_RECOVERED"; severity = "warning"; }
  if (input.condition === "latency") { changes.simulatedLatencyMs = Math.min(5_000, Math.max(0, Math.round(input.latencyMs ?? 0))); eventType = "MACHINE_LATENCY_CONFIGURED"; }
  await db.update(realmMachines).set(changes).where(eq(realmMachines.id, machine.id));
  if (["disconnect", "fault"].includes(input.condition)) await db.insert(simulatedAlerts).values({ ownerId: input.ownerId, machineId: machine.id, severity, status: "active", title: input.condition === "fault" ? `Fallo simulado — ${machine.name}` : `Desconexión simulada — ${machine.name}`, description: "Evento generado únicamente por el gemelo digital para pruebas operacionales." });
  if (["reconnect", "recover"].includes(input.condition)) await db.update(simulatedAlerts).set({ status: "resolved", resolvedAt: new Date() }).where(and(eq(simulatedAlerts.ownerId, input.ownerId), eq(simulatedAlerts.machineId, machine.id), eq(simulatedAlerts.status, "active")));
  await appendEvent({ ownerId: input.ownerId, machineId: machine.id, eventType, severity, payload: { condition: input.condition, simulatedLatencyMs: changes.simulatedLatencyMs ?? machine.simulatedLatencyMs, simulationOnly: true } });
  publishOperationalEvent(input.ownerId, "machine", { machineId: machine.id, eventType, simulationOnly: true, ...changes });
  return { changed: true, requiresConfirmation: false, eventType, simulationOnly: true };
}

async function updateCommandStatus(ownerId: number, command: typeof operationCommands.$inferSelect, status: CommandStatus, detail: Record<string, unknown> = {}) {
  const db = requireDb(await getDb());
  await db.update(operationCommands).set({ status }).where(eq(operationCommands.id, command.id));
  await appendEvent({ ownerId, machineId: command.machineId, gatewayId: command.gatewayId, commandId: command.id, eventType: eventForCommand(command.commandType, status), correlationId: command.correlationId, severity: status === "failed" || status === "rejected" ? "warning" : "info", payload: { commandId: command.commandId, status, simulationOnly: true, ...detail } });
  publishOperationalEvent(ownerId, "command", { commandId: command.commandId, status, machineId: command.machineId, ...detail });
}

export async function requestOperation(input: { ownerId: number; machineId: number; commandType: OperationCommandType; idempotencyKey: string; confirmed?: boolean }) {
  const gateway = await ensureOperationalWorkspace(input.ownerId);
  const db = requireDb(await getDb());
  const machine = (await db.select().from(realmMachines).where(and(eq(realmMachines.id, input.machineId), eq(realmMachines.ownerId, input.ownerId))).limit(1))[0];
  if (!machine) throw new Error("La máquina no existe o no pertenece a la sesión actual.");
  const existing = (await db.select().from(operationCommands).where(and(eq(operationCommands.ownerId, input.ownerId), eq(operationCommands.idempotencyKey, input.idempotencyKey))).orderBy(desc(operationCommands.requestedAt)).limit(1))[0];
  const correlationId = existing?.correlationId ?? `corr-${nanoid(14)}`;
  let command = existing;
  if (!command) {
    const inserted = await db.insert(operationCommands).values({
      ownerId: input.ownerId,
      machineId: input.machineId,
      gatewayId: gateway.id,
      commandId: `cmd-${nanoid(16)}`,
      idempotencyKey: input.idempotencyKey,
      correlationId,
      commandType: input.commandType,
      riskLevel: commandRisk(input.commandType),
      requiresConfirmation: commandRisk(input.commandType) === "high" || commandRisk(input.commandType) === "critical",
      payloadJson: { simulationOnly: true, requestedFrom: "operations-center" },
    }).$returningId();
    command = (await db.select().from(operationCommands).where(eq(operationCommands.id, inserted[0]!.id)).limit(1))[0]!;
    await appendEvent({ ownerId: input.ownerId, machineId: input.machineId, gatewayId: gateway.id, commandId: command.id, eventType: "COMMAND_REQUESTED", correlationId, payload: { commandId: command.commandId, commandType: input.commandType, simulationOnly: true } });
  }
  if (["queued", "executing", "succeeded"].includes(command.status) && !input.confirmed) return { commandId: command.commandId, status: command.status, replayed: true, requiresConfirmation: false };
  await updateCommandStatus(input.ownerId, command, "validating");
  const permission = await evaluateSimulationPermission({ ownerId: input.ownerId, action: `command.${input.commandType}.simulated`, riskLevel: command.riskLevel, confirmed: input.confirmed });
  const evidence = syntheticEvidence(permission.reason);
  await db.insert(validationLedger).values({ ownerId: input.ownerId, machineId: input.machineId, category: "machine", action: `command.${input.commandType}.simulated`, riskLevel: command.riskLevel, permissionId: permission.permissionId, permissionDecision: permission.decision, verificationStatus: permission.decision === "allowed" ? "passed" : permission.decision === "blocked" ? "failed" : "pending", reason: permission.reason, permissionSnapshotJson: permission.permissionSnapshot, evidenceJson: evidence });
  if (permission.decision === "confirmation_required") {
    await db.update(operationCommands).set({ status: "requested", requiresConfirmation: true }).where(eq(operationCommands.id, command.id));
    await appendEvent({ ownerId: input.ownerId, machineId: input.machineId, gatewayId: gateway.id, commandId: command.id, eventType: "COMMAND_REQUIRES_CONFIRMATION", severity: "warning", correlationId, payload: { commandId: command.commandId, commandType: input.commandType, simulationOnly: true } });
    return { commandId: command.commandId, status: "requested" as const, requiresConfirmation: true, replayed: false };
  }
  if (permission.decision === "blocked") {
    await db.update(operationCommands).set({ status: "rejected", errorMessage: permission.reason, completedAt: new Date() }).where(eq(operationCommands.id, command.id));
    await updateCommandStatus(input.ownerId, command, "rejected", { reason: permission.reason });
    return { commandId: command.commandId, status: "rejected" as const, requiresConfirmation: false, replayed: false };
  }
  await db.update(operationCommands).set({ status: "approved", confirmedAt: input.confirmed ? new Date() : null }).where(eq(operationCommands.id, command.id));
  await updateCommandStatus(input.ownerId, command, "approved");
  await db.update(operationCommands).set({ status: "queued" }).where(eq(operationCommands.id, command.id));
  await updateCommandStatus(input.ownerId, command, "queued");
  return { commandId: command.commandId, status: "queued" as const, requiresConfirmation: false, replayed: false };
}

export async function runGatewayCycle(ownerId: number) {
  const gateway = await ensureOperationalWorkspace(ownerId);
  const db = requireDb(await getDb());
  const startedAt = Date.now();
  await db.update(gateways).set({ status: "online", lastHeartbeatAt: new Date() }).where(eq(gateways.id, gateway.id));
  await db.insert(gatewayHeartbeats).values({ gatewayId: gateway.id, status: "online", latencyMs: Date.now() - startedAt, metadataJson: { simulationOnly: true, queueWorker: "deterministic" } });
  await db.insert(healthChecks).values({ ownerId, component: "gateway", componentKey: gateway.gatewayKey, status: "healthy", latencyMs: Date.now() - startedAt, detailJson: { simulationOnly: true, hardwareMode: gateway.operatingMode } });
  const queued = (await db.select().from(operationCommands).where(and(eq(operationCommands.ownerId, ownerId), eq(operationCommands.status, "queued"))).orderBy(asc(operationCommands.requestedAt)).limit(1))[0];
  let processedCommandId: string | null = null;
  if (queued) {
    processedCommandId = queued.commandId;
    await db.update(operationCommands).set({ status: "executing" }).where(eq(operationCommands.id, queued.id));
    await db.insert(commandExecutions).values({ commandId: queued.id, gatewayId: gateway.id, status: "executing", startedAt: new Date() });
    await updateCommandStatus(ownerId, queued, "executing");
    const machine = (await db.select().from(realmMachines).where(eq(realmMachines.id, queued.machineId)).limit(1))[0];
    if (!machine) throw new Error("La máquina asociada al comando no existe.");
    const adapter = new SimulatorMachineAdapter({ machineKey: machine.machineKey, state: machine.state as MachineState, connectionStatus: machine.connectionStatus });
    const result = await adapter.sendCommand(queued.commandType as OperationCommandType);
    const nextState = result.nextState;
    if (!result.accepted || (nextState && !canTransitionMachine(machine.state as MachineState, nextState))) {
      const error = result.accepted ? `La transición ${machine.state} → ${nextState} fue rechazada por la máquina de estados.` : result.message;
      await db.update(operationCommands).set({ status: "failed", errorMessage: error, completedAt: new Date() }).where(eq(operationCommands.id, queued.id));
      await db.update(commandExecutions).set({ status: "failed", finishedAt: new Date(), errorMessage: error }).where(eq(commandExecutions.commandId, queued.id));
      await db.insert(simulatedAlerts).values({ ownerId, machineId: machine.id, severity: "warning", status: "active", title: "Comando simulado rechazado", description: error });
      await updateCommandStatus(ownerId, queued, "failed", { error });
    } else {
      const state = nextState ?? (machine.state as MachineState);
      const telemetry = await adapter.getTelemetry();
      const cycleIncrement = state === "operating" && machine.state !== "operating" ? 1 : 0;
      await db.update(realmMachines).set({ state, connectionStatus: "connected", runtimeSeconds: machine.runtimeSeconds + (state === "operating" ? 8 : 0), cycleCount: machine.cycleCount + cycleIncrement, currentLoad: telemetry.load, currentSpeed: telemetry.speed }).where(eq(realmMachines.id, machine.id));
      await db.insert(telemetrySnapshots).values({ machineId: machine.id, ...telemetry, cycleCount: machine.cycleCount + cycleIncrement, runtimeSeconds: machine.runtimeSeconds + (state === "operating" ? 8 : 0) });
      if (queued.commandType === "acknowledge_alarm") await db.update(simulatedAlerts).set({ status: "acknowledged" }).where(and(eq(simulatedAlerts.ownerId, ownerId), eq(simulatedAlerts.machineId, machine.id), eq(simulatedAlerts.status, "active")));
      if (state === "emergency") await db.insert(simulatedAlerts).values({ ownerId, machineId: machine.id, severity: "critical", status: "active", title: `Emergencia simulada — ${machine.name}`, description: "El flujo lógico de parada se ejecutó contra el adaptador de simulación. No representa una parada física." });
      await db.update(operationCommands).set({ status: "succeeded", completedAt: new Date(), resultJson: { ...result, state, telemetry } }).where(eq(operationCommands.id, queued.id));
      await db.update(commandExecutions).set({ status: "succeeded", finishedAt: new Date(), resultJson: { ...result, state } }).where(eq(commandExecutions.commandId, queued.id));
      await updateCommandStatus(ownerId, queued, "succeeded", { result: result.message, state });
      publishOperationalEvent(ownerId, "machine", { machineId: machine.id, state, commandId: queued.commandId, simulationOnly: true });
    }
  }
  const machines = await db.select().from(realmMachines).where(eq(realmMachines.ownerId, ownerId));
  await Promise.all(machines.map(async machine => {
    const telemetry = simulatedTelemetry(machine.state as MachineState, Date.now() + machine.id * 1000);
    await db.update(realmMachines).set({ currentLoad: telemetry.load, currentSpeed: telemetry.speed, runtimeSeconds: machine.runtimeSeconds + (machine.state === "operating" ? 8 : 0) }).where(eq(realmMachines.id, machine.id));
    await db.insert(telemetrySnapshots).values({ machineId: machine.id, ...telemetry, cycleCount: machine.cycleCount, runtimeSeconds: machine.runtimeSeconds + (machine.state === "operating" ? 8 : 0) });
  }));
  publishOperationalEvent(ownerId, "gateway", { gatewayId: gateway.id, status: "online", processedCommandId, simulationOnly: true });
  publishOperationalEvent(ownerId, "telemetry", { samples: machines.length, simulationOnly: true });
  return { gatewayId: gateway.id, processedCommandId, samples: machines.length, simulationOnly: true };
}
