import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  auditLog,
  commandValidations,
  machineAlarms,
  machineCommands,
  machineEvents,
  machineTelemetry,
  simulatedMachines,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import type { CommandInput, CommandStatus, CommandType, MachineState, OperationalRole, SimulationTelemetry } from "@shared/machine";
import { SimulationGateway } from "./gateway";
import { calculateAuditHash } from "./audit";
import { expectedSimulatedAlarm } from "./alarms";
import { effectiveRole, evaluateHumanApproval, evaluatePolicy, type ProtocolActor } from "./protocol";
import { publishOperationsUpdate } from "./stream";
import { commandRiskSummary } from "./simulator";

const POLICY_VERSION = "SIM-1.0";
const APPROVAL_WINDOW_MS = 5 * 60 * 1000;
const simulationGateway = new SimulationGateway();

type Actor = ProtocolActor;

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  return db;
}

async function appendAudit(input: {
  actor?: Actor;
  commandId?: string;
  node: "policy" | "risk" | "human" | "system";
  decision: string;
  reason: string;
  metadata: Record<string, unknown>;
}) {
  const db = await requireDb();
  const [previous] = await db.select().from(auditLog).orderBy(desc(auditLog.sequence)).limit(1);
  const actorRole = input.actor ? effectiveRole(input.actor) : "system";
  const content = {
    previousHash: previous?.eventHash ?? null,
    actorUserId: input.actor?.id ?? null,
    actorRole,
    commandId: input.commandId ?? null,
    node: input.node,
    decision: input.decision,
    reason: input.reason,
    metadata: input.metadata,
  };
  const eventHash = calculateAuditHash(previous?.eventHash ?? null, content);
  await db.insert(auditLog).values({
    eventHash,
    previousHash: previous?.eventHash ?? null,
    actorUserId: input.actor?.id ?? null,
    actorRole,
    commandId: input.commandId ?? null,
    node: input.node,
    decision: input.decision,
    reason: input.reason,
    metadata: input.metadata,
  });
  publishOperationsUpdate(`${input.node}:${input.decision}`);
}

async function appendEvent(machineId: number, eventType: string, payload: Record<string, unknown>, commandId?: string) {
  const db = await requireDb();
  await db.insert(machineEvents).values({ machineId, commandId: commandId ?? null, eventType, payload });
}

async function latestTelemetry(machineId: number) {
  const db = await requireDb();
  const [telemetry] = await db
    .select()
    .from(machineTelemetry)
    .where(eq(machineTelemetry.machineId, machineId))
    .orderBy(desc(machineTelemetry.capturedAt))
    .limit(1);
  return telemetry;
}

async function getMachine(machineId: number) {
  const db = await requireDb();
  const [machine] = await db.select().from(simulatedMachines).where(eq(simulatedMachines.id, machineId)).limit(1);
  if (!machine) throw new Error("La máquina simulada no existe.");
  return machine;
}

export async function ensureSimulator() {
  const db = await requireDb();
  const [existing] = await db.select().from(simulatedMachines).where(eq(simulatedMachines.machineKey, "NEXUS-SIM-01")).limit(1);
  if (existing) return existing;

  await db.insert(simulatedMachines).values({ machineKey: "NEXUS-SIM-01", name: "Nexus Process Simulator 01" });
  const [created] = await db.select().from(simulatedMachines).where(eq(simulatedMachines.machineKey, "NEXUS-SIM-01")).limit(1);
  if (!created) throw new Error("No se pudo inicializar el simulador.");
  await appendEvent(created.id, "SIMULATOR_INITIALIZED", { mode: "simulation", state: "stopped" });
  await appendAudit({ node: "system", decision: "initialized", reason: "Simulador determinista inicializado.", metadata: { machineId: created.id } });
  return created;
}

async function persistTelemetry(machine: Awaited<ReturnType<typeof getMachine>>) {
  const db = await requireDb();
  const now = Date.now();
  const uptimeSeconds = machine.operationStartedAt ? Math.max(0, Math.floor((now - machine.operationStartedAt.getTime()) / 1000)) : 0;
  const nextCycles = machine.state === "operating" ? machine.cycleCount + 1 : machine.cycleCount;
  const telemetry = await simulationGateway.readTelemetry({
    state: machine.state as MachineState,
    cycleCount: nextCycles,
    operationStartedAt: machine.operationStartedAt,
  });
  if (nextCycles !== machine.cycleCount) {
    await db.update(simulatedMachines).set({ cycleCount: nextCycles, lastHeartbeatAt: new Date(now) }).where(eq(simulatedMachines.id, machine.id));
  } else {
    await db.update(simulatedMachines).set({ lastHeartbeatAt: new Date(now) }).where(eq(simulatedMachines.id, machine.id));
  }
  await db.insert(machineTelemetry).values({
    machineId: machine.id,
    state: machine.state,
    temperature: telemetry.temperature.toString(),
    pressure: telemetry.pressure.toString(),
    load: telemetry.load.toString(),
    speed: telemetry.speed.toString(),
    power: telemetry.power.toString(),
    latencyMs: telemetry.latencyMs,
  });
  return telemetry;
}

async function reconcileSimulatedAlarms(machineId: number, state: MachineState, telemetry: SimulationTelemetry) {
  const db = await requireDb();
  const activeAlarms = await db
    .select()
    .from(machineAlarms)
    .where(and(eq(machineAlarms.machineId, machineId), eq(machineAlarms.status, "active")));
  const desired = expectedSimulatedAlarm(state, telemetry.temperature);
  const matching = desired ? activeAlarms.find(alarm => alarm.code === desired.code) : null;
  if (desired && !matching) {
    await db.insert(machineAlarms).values({ machineId, ...desired });
    await appendEvent(machineId, "ALARM_TRIGGERED", { ...desired, mode: "simulation" });
    await appendAudit({
      node: "system",
      decision: "alarm_raised",
      reason: desired.message,
      metadata: { machineId, code: desired.code, state, telemetry: { temperature: telemetry.temperature } },
    });
  }
  for (const alarm of activeAlarms.filter(item => !desired || item.code !== desired.code)) {
    await db.update(machineAlarms).set({ status: "cleared", clearedAt: new Date() }).where(eq(machineAlarms.id, alarm.id));
    await appendEvent(machineId, "ALARM_CLEARED", { code: alarm.code, mode: "simulation" });
    await appendAudit({
      node: "system",
      decision: "alarm_cleared",
      reason: `La alarma ${alarm.code} fue recuperada por el simulador.`,
      metadata: { machineId, code: alarm.code, state },
    });
  }
}

async function evaluateRisk(machineId: number, type: CommandType) {
  const db = await requireDb();
  const machine = await getMachine(machineId);
  const telemetry = await latestTelemetry(machineId);
  const [criticalAlarm] = await db
    .select()
    .from(machineAlarms)
    .where(and(eq(machineAlarms.machineId, machineId), eq(machineAlarms.severity, "critical"), eq(machineAlarms.status, "active")))
    .limit(1);
  const temperature = Number(telemetry?.temperature ?? 28);
  const summary = commandRiskSummary(machine.state as MachineState, type, temperature);
  const heartbeatExpired = Date.now() - machine.lastHeartbeatAt.getTime() > 15_000;
  const safe = summary.safe && (!criticalAlarm || type === "reset") && !heartbeatExpired;
  const reason = criticalAlarm && type !== "reset"
    ? `Alarma crítica activa: ${criticalAlarm.code}.`
    : heartbeatExpired
      ? "El heartbeat del simulador está vencido."
      : summary.reason;
  return {
    safe,
    reason,
    snapshot: {
      machineState: machine.state,
      temperature,
      heartbeatAt: machine.lastHeartbeatAt.toISOString(),
      criticalAlarm: criticalAlarm?.code ?? null,
      telemetryAt: telemetry?.capturedAt?.toISOString() ?? null,
    },
  };
}

async function recordValidation(input: {
  commandId: string;
  node: "policy" | "risk" | "human";
  decision: "allow" | "block" | "approved" | "rejected" | "expired";
  reason: string;
  evidence: Record<string, unknown>;
  actor?: Actor;
}) {
  const db = await requireDb();
  await db.insert(commandValidations).values({
    commandId: input.commandId,
    node: input.node,
    decision: input.decision,
    reason: input.reason,
    evidence: input.evidence,
    validatedByUserId: input.actor?.id ?? null,
  });
  await appendAudit({
    actor: input.actor,
    commandId: input.commandId,
    node: input.node,
    decision: input.decision,
    reason: input.reason,
    metadata: input.evidence,
  });
}

async function setCommandStatus(commandId: string, status: CommandStatus) {
  const db = await requireDb();
  await db.update(machineCommands).set({ status }).where(eq(machineCommands.commandId, commandId));
}

export async function requestCommand(actor: Actor, input: CommandInput) {
  const db = await requireDb();
  const machine = await getMachine(input.machineId);
  const [duplicate] = await db.select().from(machineCommands).where(eq(machineCommands.idempotencyKey, input.idempotencyKey)).limit(1);
  if (duplicate) return duplicate;

  const commandId = randomUUID();
  const policy = evaluatePolicy(actor, input.type, "simulation", Boolean(input.testMode ?? true));
  const policyAllowed = policy.allowed;
  const policyReason = policy.reason;
  const risk = await evaluateRisk(machine.id, input.type);
  const initialStatus: CommandStatus = !policyAllowed ? "policy_rejected" : !risk.safe ? "risk_rejected" : "awaiting_human";
  const expiresAt = new Date(Date.now() + APPROVAL_WINDOW_MS);

  await db.insert(machineCommands).values({
    commandId,
    machineId: machine.id,
    requestedByUserId: actor.id,
    type: input.type,
    status: initialStatus,
    idempotencyKey: input.idempotencyKey,
    isTestMode: 1,
    policyVersion: POLICY_VERSION,
    riskSnapshot: risk.snapshot,
    expiresAt,
  });
  await appendEvent(machine.id, "COMMAND_REQUESTED", { type: input.type, status: initialStatus }, commandId);
  await appendAudit({ actor, commandId, node: "system", decision: "requested", reason: "Comando preparado en modo simulación.", metadata: { machineId: machine.id, type: input.type } });
  await recordValidation({
    commandId,
    node: "policy",
    decision: policyAllowed ? "allow" : "block",
    reason: policyReason,
    evidence: { role: policy.role, mode: machine.mode, policyVersion: POLICY_VERSION, testMode: true },
    actor,
  });
  await recordValidation({
    commandId,
    node: "risk",
    decision: risk.safe ? "allow" : "block",
    reason: risk.reason,
    evidence: risk.snapshot,
  });
  if (!policyAllowed || !risk.safe) {
    await appendEvent(machine.id, "COMMAND_REJECTED", { status: initialStatus, reason: !policyAllowed ? policyReason : risk.reason }, commandId);
  }
  const [command] = await db.select().from(machineCommands).where(eq(machineCommands.commandId, commandId)).limit(1);
  if (!command) throw new Error("No se pudo recuperar el comando creado.");
  return command;
}

export async function approveCommand(actor: Actor, commandId: string) {
  const db = await requireDb();
  const [command] = await db.select().from(machineCommands).where(eq(machineCommands.commandId, commandId)).limit(1);
  if (!command) throw new Error("El comando no existe.");
  if (command.status !== "awaiting_human") return command;
  const [requester] = await db.select().from(users).where(eq(users.id, command.requestedByUserId)).limit(1);
  if (!requester) throw new Error("No se encontró el solicitante original para revalidar la política.");
  const currentPolicy = evaluatePolicy(
    { id: requester.id, role: requester.role, operationRole: requester.operationRole },
    command.type as CommandType,
    "simulation",
    true
  );
  await recordValidation({
    commandId,
    node: "policy",
    decision: currentPolicy.allowed ? "allow" : "block",
    reason: currentPolicy.reason,
    evidence: { role: currentPolicy.role, policyVersion: POLICY_VERSION, revalidatedAt: new Date().toISOString() },
  });
  if (!currentPolicy.allowed) {
    await setCommandStatus(commandId, "policy_rejected");
    await appendEvent(command.machineId, "COMMAND_REJECTED", { status: "policy_rejected", reason: currentPolicy.reason }, commandId);
    return { ...command, status: "policy_rejected" as const };
  }
  const human = evaluateHumanApproval({ requesterId: command.requestedByUserId, approver: actor, expiresAt: command.expiresAt });
  if (!human.approved) {
    await recordValidation({ commandId, node: "human", decision: human.decision, reason: human.reason, evidence: { requestedByUserId: command.requestedByUserId, approverUserId: actor.id, expiresAt: command.expiresAt.toISOString() }, actor });
    await setCommandStatus(commandId, human.decision === "expired" ? "expired" : "human_rejected");
    await appendEvent(command.machineId, "COMMAND_REJECTED", { status: human.decision === "expired" ? "expired" : "human_rejected", reason: human.reason }, commandId);
    return { ...command, status: human.decision === "expired" ? "expired" as const : "human_rejected" as const };
  }

  const risk = await evaluateRisk(command.machineId, command.type as CommandType);
  await recordValidation({ commandId, node: "risk", decision: risk.safe ? "allow" : "block", reason: risk.reason, evidence: risk.snapshot });
  if (!risk.safe) {
    await setCommandStatus(commandId, "risk_rejected");
    await appendEvent(command.machineId, "COMMAND_REJECTED", { status: "risk_rejected", reason: risk.reason }, commandId);
    return { ...command, status: "risk_rejected" as const };
  }

  await recordValidation({
    commandId,
    node: "human",
    decision: "approved",
    reason: human.reason,
    evidence: { role: effectiveRole(actor), approvedAt: new Date().toISOString(), simulationOnly: true },
    actor,
  });
  await setCommandStatus(commandId, "authorized");
  await appendEvent(command.machineId, "COMMAND_APPROVED", { approvedBy: actor.id }, commandId);
  return executeSimulationCommand(commandId);
}

export async function rejectCommand(actor: Actor, commandId: string, reason: string) {
  const db = await requireDb();
  const [command] = await db.select().from(machineCommands).where(eq(machineCommands.commandId, commandId)).limit(1);
  if (!command) throw new Error("El comando no existe.");
  if (command.status !== "awaiting_human") return command;
  await recordValidation({ commandId, node: "human", decision: "rejected", reason, evidence: { rejectedAt: new Date().toISOString() }, actor });
  await setCommandStatus(commandId, "human_rejected");
  await appendEvent(command.machineId, "COMMAND_REJECTED", { status: "human_rejected", reason }, commandId);
  return { ...command, status: "human_rejected" as const };
}

async function executeSimulationCommand(commandId: string) {
  const db = await requireDb();
  const [command] = await db.select().from(machineCommands).where(eq(machineCommands.commandId, commandId)).limit(1);
  if (!command) throw new Error("El comando no existe.");
  const machine = await getMachine(command.machineId);
  await setCommandStatus(commandId, "executing");
  try {
    const dispatch = await simulationGateway.dispatch(
      { state: machine.state as MachineState, cycleCount: machine.cycleCount, operationStartedAt: machine.operationStartedAt },
      command.type as CommandType
    );
    const targetState = dispatch.targetState;
    const startedAt = targetState === "operating" && !machine.operationStartedAt ? new Date() : targetState === "stopped" ? null : machine.operationStartedAt;
    await db
      .update(simulatedMachines)
      .set({ state: targetState, operationStartedAt: startedAt, lastHeartbeatAt: new Date() })
      .where(eq(simulatedMachines.id, machine.id));
    await appendEvent(machine.id, "COMMAND_EXECUTED", { type: command.type, previousState: machine.state, targetState, adapter: dispatch.adapter, gatewayMode: dispatch.gatewayMode }, commandId);
    await appendAudit({
      commandId,
      node: "system",
      decision: "executed",
      reason: "Gateway de simulación ejecutó una transición permitida.",
      metadata: { adapter: dispatch.adapter, gatewayMode: dispatch.gatewayMode, previousState: machine.state, targetState },
    });
    await setCommandStatus(commandId, "executed");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Fallo no identificado en el simulador.";
    await setCommandStatus(commandId, "failed");
    await appendEvent(machine.id, "COMMAND_FAILED", { reason }, commandId);
    await appendAudit({ commandId, node: "system", decision: "failed", reason, metadata: { adapter: "simulator" } });
  }
  const [updated] = await db.select().from(machineCommands).where(eq(machineCommands.commandId, commandId)).limit(1);
  if (!updated) throw new Error("No se pudo recuperar el resultado del comando.");
  return updated;
}

export async function getOperationsSnapshot() {
  const db = await requireDb();
  const machine = await ensureSimulator();
  const refreshedMachine = await getMachine(machine.id);
  const telemetry = await persistTelemetry(refreshedMachine);
  await reconcileSimulatedAlarms(refreshedMachine.id, refreshedMachine.state as MachineState, telemetry);
  const [events, alarms, commands, audit] = await Promise.all([
    db.select().from(machineEvents).where(eq(machineEvents.machineId, machine.id)).orderBy(desc(machineEvents.createdAt)).limit(12),
    db.select().from(machineAlarms).where(eq(machineAlarms.machineId, machine.id)).orderBy(desc(machineAlarms.raisedAt)).limit(8),
    db.select().from(machineCommands).where(eq(machineCommands.machineId, machine.id)).orderBy(desc(machineCommands.createdAt)).limit(10),
    db.select().from(auditLog).orderBy(desc(auditLog.sequence)).limit(20),
  ]);
  const commandIds = commands.map(command => command.commandId);
  const validations = commandIds.length
    ? await db.select().from(commandValidations).where(inArray(commandValidations.commandId, commandIds)).orderBy(desc(commandValidations.createdAt))
    : [];
  return { machine: refreshedMachine, telemetry, events, alarms, commands, validations, audit };
}

export async function getOperationalUser(userId: number) {
  const db = await requireDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("No se encontró el usuario de operación.");
  return user;
}
