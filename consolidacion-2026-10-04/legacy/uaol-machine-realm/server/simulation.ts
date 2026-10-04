import { and, desc, eq, inArray } from "drizzle-orm";
import {
  agentTasks,
  protocolMessages,
  realmMachines,
  simulationPermissions,
  simulatedAlerts,
  simulatorConfigurations,
  taskEvents,
  telemetrySnapshots,
  validationLedger,
} from "../drizzle/schema";
import type { MachineState, OperationMode, ProtocolName, RiskLevel, TaskStatus } from "@shared/simulator";
import { getDb } from "./db";
import {
  advanceTaskStatus,
  assessSimulationPermission,
  buildLedgerPolicyTrace,
  buildTaskPlan,
  canTransitionMachine,
  riskForMachineTransition,
  selectPersistedPolicy,
  simulatedTelemetry,
  syntheticEvidence,
} from "./simulationRules";

const defaultMachines = [
  {
    machineKey: "RM-CELL-01",
    name: "Celda de mezcla A",
    area: "Proceso húmedo",
    sensorsJson: { temperature: "24.2 °C", pressure: "1.8 bar", vibration: "0.4 mm/s" },
    actuatorsJson: { pump: "ready", valve: "closed", conveyor: "standby" },
    setpointsJson: { temperature: "61.0 °C", pressure: "4.7 bar" },
  },
  {
    machineKey: "RM-LINE-04",
    name: "Línea de envasado 04",
    area: "Envasado",
    sensorsJson: { temperature: "26.1 °C", pressure: "1.3 bar", vibration: "0.2 mm/s" },
    actuatorsJson: { conveyor: "ready", labeler: "ready", gate: "closed" },
    setpointsJson: { throughput: "128 u/h", quality: "96 %" },
  },
  {
    machineKey: "RM-ENERGY-02",
    name: "Nodo energético 02",
    area: "Utilidades",
    sensorsJson: { temperature: "21.0 °C", pressure: "0.4 bar", vibration: "0.1 mm/s" },
    actuatorsJson: { breaker: "closed", cooling: "standby", relay: "armed" },
    setpointsJson: { load: "76 %", reserve: "24 %" },
  },
];

const defaultPermissionPolicies = [
  {
    actionPattern: "task.",
    scope: "Ciclo de agente",
    riskLevel: "low" as const,
    decision: "allowed" as const,
    description: "Permite crear y avanzar tareas que no salen del entorno estrictamente simulado.",
  },
  {
    actionPattern: "browser.simulated",
    scope: "Consola de agente",
    riskLevel: "low" as const,
    decision: "allowed" as const,
    description: "Permite únicamente acciones predefinidas de navegador y ordenador simulados; no controla un navegador real.",
  },
  {
    actionPattern: "machine.transition.",
    scope: "Máquina Realm simulada",
    riskLevel: "medium" as const,
    decision: "allowed" as const,
    description: "Permite transiciones válidas en la máquina de estados sintética; las guardas de estado siguen siendo obligatorias.",
  },
  {
    actionPattern: "machine.transition.operating.simulated",
    scope: "Máquina Realm simulada",
    riskLevel: "medium" as const,
    decision: "allowed" as const,
    description: "Permite iniciar un estado de operación únicamente dentro de la planta sintética.",
  },
  {
    actionPattern: "machine.mode.autonomous.simulated",
    scope: "Máquina Realm simulada",
    riskLevel: "high" as const,
    decision: "confirmation_required" as const,
    description: "Exige confirmación visible antes de habilitar el modo autónomo de una máquina sintética.",
  },
  {
    actionPattern: "protocol.command.simulated",
    scope: "Emulación de protocolos",
    riskLevel: "high" as const,
    decision: "confirmation_required" as const,
    description: "Exige confirmación antes de registrar un comando MQTT, OPC UA o Modbus sintético.",
  },
  {
    actionPattern: "protocol.",
    scope: "Emulación de protocolos",
    riskLevel: "low" as const,
    decision: "allowed" as const,
    description: "Permite mensajes de telemetría, eventos y respuestas exclusivamente sintéticos.",
  },
  {
    actionPattern: "real.",
    scope: "Frontera de seguridad",
    riskLevel: "critical" as const,
    decision: "blocked" as const,
    description: "Bloquea cualquier intento de acceder a equipo, navegador, herramienta personal, red industrial o hardware real.",
  },
];

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("La base de datos no está disponible.");
  return db;
}

export async function ensureSimulationWorkspace(ownerId: number) {
  const db = requireDb(await getDb());
  const machines = await db.select().from(realmMachines).where(eq(realmMachines.ownerId, ownerId));
  if (machines.length === 0) {
    await db.insert(realmMachines).values(defaultMachines.map(machine => ({ ownerId, ...machine })));
  }

  const configurations = await db
    .select()
    .from(simulatorConfigurations)
    .where(eq(simulatorConfigurations.ownerId, ownerId));
  if (configurations.length === 0) {
    await db.insert(simulatorConfigurations).values({
      ownerId,
      scenarioName: "Planta sintética — operación segura",
      scenarioJson: {
        simulationOnly: true,
        description: "Escenario local persistente sin conexiones a dispositivos, navegador ni servicios externos.",
        telemetryCadenceSeconds: 8,
      },
      isActive: true,
    });
  }

  const permissions = await db
    .select()
    .from(simulationPermissions)
    .where(eq(simulationPermissions.ownerId, ownerId));
  const existingPatterns = new Set(permissions.map(permission => permission.actionPattern));
  const missingPolicies = defaultPermissionPolicies.filter(policy => !existingPatterns.has(policy.actionPattern));
  if (missingPolicies.length > 0) {
    await db.insert(simulationPermissions).values(missingPolicies.map(policy => ({ ownerId, ...policy })));
  }
}

export async function evaluateSimulationPermission(input: { ownerId: number; action: string; riskLevel: RiskLevel; confirmed?: boolean }) {
  const db = requireDb(await getDb());
  const policies = await db
    .select()
    .from(simulationPermissions)
    .where(eq(simulationPermissions.ownerId, input.ownerId));
  const matchingPolicy = selectPersistedPolicy(policies, input.action);
  const fallback = assessSimulationPermission(input);
  const trace = buildLedgerPolicyTrace(matchingPolicy, fallback.decision);
  const base = matchingPolicy
    ? { decision: matchingPolicy.decision, reason: matchingPolicy.description, ...trace }
    : { ...fallback, ...trace };
  if (base.decision === "allowed" && (input.riskLevel === "high" || input.riskLevel === "critical") && !input.confirmed) {
    return {
      ...base,
      decision: "confirmation_required" as const,
      reason: `${base.reason} El nivel de riesgo exige confirmación visible aunque la política permita la simulación.`,
    };
  }
  if (base.decision === "confirmation_required" && input.confirmed) {
    return { ...base, decision: "allowed" as const, reason: `${base.reason} Confirmación registrada para la operación simulada.` };
  }
  return base;
}

export async function getSimulationOverview(ownerId: number) {
  await ensureSimulationWorkspace(ownerId);
  const db = requireDb(await getDb());
  const [tasks, machines, alerts, protocols, ledger, telemetry, permissions] = await Promise.all([
    db.select().from(agentTasks).where(eq(agentTasks.ownerId, ownerId)).orderBy(desc(agentTasks.updatedAt)).limit(20),
    db.select().from(realmMachines).where(eq(realmMachines.ownerId, ownerId)),
    db.select().from(simulatedAlerts).where(eq(simulatedAlerts.ownerId, ownerId)).orderBy(desc(simulatedAlerts.createdAt)).limit(20),
    db.select().from(protocolMessages).where(eq(protocolMessages.ownerId, ownerId)).orderBy(desc(protocolMessages.createdAt)).limit(30),
    db.select().from(validationLedger).where(eq(validationLedger.ownerId, ownerId)).orderBy(desc(validationLedger.createdAt)).limit(40),
    db.select().from(telemetrySnapshots).orderBy(desc(telemetrySnapshots.createdAt)).limit(120),
    db.select().from(simulationPermissions).where(eq(simulationPermissions.ownerId, ownerId)),
  ]);

  const ownerMachineIds = new Set(machines.map(machine => machine.id));
  const telemetryByMachine = new Map<number, (typeof telemetry)[number]>();
  const telemetryHistory = new Map<number, (typeof telemetry)[number][]>();
  for (const sample of telemetry) {
    if (!ownerMachineIds.has(sample.machineId)) continue;
    if (!telemetryByMachine.has(sample.machineId)) telemetryByMachine.set(sample.machineId, sample);
    const history = telemetryHistory.get(sample.machineId) ?? [];
    if (history.length < 12) history.push(sample);
    telemetryHistory.set(sample.machineId, history);
  }

  const taskIds = tasks.map(task => task.id);
  const events = taskIds.length > 0
    ? await db.select().from(taskEvents).where(inArray(taskEvents.taskId, taskIds)).orderBy(desc(taskEvents.createdAt)).limit(80)
    : [];

  return {
    simulationBoundary: {
      mode: "SIMULATION_ONLY",
      connectedToRealHardware: false,
      connectedToPersonalTools: false,
      connectedToRealBrowser: false,
    },
    tasks,
    machines: machines.map(machine => ({
      ...machine,
      telemetry: telemetryByMachine.get(machine.id) ?? null,
      history: (telemetryHistory.get(machine.id) ?? []).reverse(),
    })),
    alerts,
    protocols,
    ledger,
    permissions,
    events,
  };
}

export async function createSimulatedTask(input: {
  ownerId: number;
  title: string;
  intent: string;
  riskLevel: RiskLevel;
  executionMode: OperationMode;
}) {
  await ensureSimulationWorkspace(input.ownerId);
  const db = requireDb(await getDb());
  const permission = await evaluateSimulationPermission({ ownerId: input.ownerId, action: "task.create.simulated", riskLevel: input.riskLevel });
  if (permission.decision !== "allowed") throw new Error(permission.reason);
  const plan = buildTaskPlan(input.intent);
  const inserted = await db
    .insert(agentTasks)
    .values({
      ownerId: input.ownerId,
      title: input.title,
      intent: input.intent,
      riskLevel: input.riskLevel,
      executionMode: input.executionMode,
      simulationOnly: true,
      planJson: plan,
      summary: "Tarea creada dentro del perímetro exclusivamente simulado.",
    })
    .$returningId();
  const taskId = inserted[0]!.id;
  const evidence = syntheticEvidence("La intención fue registrada sin acceso a un navegador, equipo ni herramienta personal.");
  await Promise.all([
    db.insert(taskEvents).values({
      taskId,
      stage: "intent",
      outcome: "success",
      message: "Intención registrada en la consola simulada.",
      evidenceJson: evidence,
    }),
    db.insert(validationLedger).values({
      ownerId: input.ownerId,
      taskId,
      category: "agent",
      action: "task.create.simulated",
      riskLevel: input.riskLevel,
      permissionId: permission.permissionId,
      permissionDecision: permission.decision,
      verificationStatus: "passed",
      reason: "La tarea se creó como registro persistente; no se invocó ninguna herramienta real.",
      permissionSnapshotJson: permission.permissionSnapshot,
      evidenceJson: evidence,
    }),
  ]);
  return { taskId };
}

export async function advanceSimulatedTask(ownerId: number, taskId: number) {
  const db = requireDb(await getDb());
  const task = await db
    .select()
    .from(agentTasks)
    .where(and(eq(agentTasks.id, taskId), eq(agentTasks.ownerId, ownerId)))
    .limit(1);
  if (!task[0]) throw new Error("La tarea no existe o no pertenece a la sesión actual.");

  const transition = advanceTaskStatus(task[0].status as TaskStatus);
  const permission = await evaluateSimulationPermission({ ownerId, action: `task.advance.${transition.next}.simulated`, riskLevel: task[0].riskLevel });
  if (permission.decision !== "allowed") return { status: task[0].status, message: permission.reason };
  const evidence = syntheticEvidence(transition.message);
  await db
    .update(agentTasks)
    .set({
      status: transition.next,
      summary: transition.message,
      closedAt: transition.next === "closed" ? new Date() : null,
    })
    .where(eq(agentTasks.id, taskId));
  await Promise.all([
    db.insert(taskEvents).values({
      taskId,
      stage: transition.stage,
      outcome: transition.next === "closed" ? "success" : "info",
      message: transition.message,
      evidenceJson: evidence,
    }),
    db.insert(validationLedger).values({
      ownerId,
      taskId,
      category: "agent",
      action: `task.advance.${transition.next}`,
      riskLevel: task[0].riskLevel,
      permissionId: permission.permissionId,
      permissionDecision: permission.decision,
      verificationStatus: transition.next === "closed" ? "passed" : "pending",
      reason: "Transición de ciclo registrada como operación sintética y auditable.",
      permissionSnapshotJson: permission.permissionSnapshot,
      evidenceJson: evidence,
    }),
  ]);
  return { status: transition.next, message: transition.message };
}

export async function simulateComputerAction(input: {
  ownerId: number;
  taskId: number;
  action: "open_console" | "inspect_page" | "complete_form" | "capture_evidence";
}) {
  const db = requireDb(await getDb());
  const task = await db
    .select()
    .from(agentTasks)
    .where(and(eq(agentTasks.id, input.taskId), eq(agentTasks.ownerId, input.ownerId)))
    .limit(1);
  if (!task[0]) throw new Error("La tarea no existe o no pertenece a la sesión actual.");
  const messages = {
    open_console: "Navegador sintético abierto en la consola de operaciones; no se controló un navegador real.",
    inspect_page: "Árbol DOM sintético inspeccionado; se hallaron 12 elementos semánticos simulados.",
    complete_form: "Formulario sintético completado con datos de prueba no personales.",
    capture_evidence: "Captura de evidencia sintética añadida al historial de la tarea.",
  };
  const permission = await evaluateSimulationPermission({
    ownerId: input.ownerId,
    action: `browser.simulated.${input.action}`,
    riskLevel: "low",
  });
  const evidence = syntheticEvidence(messages[input.action]);
  await db.insert(validationLedger).values({
    ownerId: input.ownerId,
    taskId: input.taskId,
    permissionId: permission.permissionId,
    category: "agent",
    action: `browser.${input.action}.simulated`,
    riskLevel: "low",
    permissionDecision: permission.decision,
    verificationStatus: permission.decision === "allowed" ? "passed" : permission.decision === "blocked" ? "failed" : "pending",
    reason: permission.reason,
    permissionSnapshotJson: permission.permissionSnapshot,
    evidenceJson: evidence,
  });
  if (permission.decision !== "allowed") {
    return { executed: false, reason: permission.reason };
  }
  await db.insert(taskEvents).values({
    taskId: input.taskId,
    stage: "execution",
    outcome: "success",
    message: messages[input.action],
    evidenceJson: evidence,
  });
  return { executed: true, reason: messages[input.action], evidence };
}

export async function transitionSimulatedMachine(input: {
  ownerId: number;
  machineId: number;
  targetState: MachineState;
  confirmed?: boolean;
}) {
  const db = requireDb(await getDb());
  const machine = await db
    .select()
    .from(realmMachines)
    .where(and(eq(realmMachines.id, input.machineId), eq(realmMachines.ownerId, input.ownerId)))
    .limit(1);
  if (!machine[0]) throw new Error("La máquina simulada no existe o no pertenece a la sesión actual.");

  const current = machine[0];
  const riskLevel = riskForMachineTransition(input.targetState, current.operationMode as OperationMode);
  const permittedTransition = canTransitionMachine(current.state as MachineState, input.targetState);
  const permission = permittedTransition
    ? await evaluateSimulationPermission({ ownerId: input.ownerId, action: `machine.transition.${input.targetState}.simulated`, riskLevel, confirmed: input.confirmed })
    : {
        decision: "blocked" as const,
        reason: `La transición ${current.state} → ${input.targetState} no está permitida por la máquina de estados.`,
        permissionId: null,
        permissionSnapshot: { source: "state-guard", actionPattern: "machine-state", configuredDecision: "blocked" },
      };
  const evidence = syntheticEvidence(permission.reason);

  await db.insert(validationLedger).values({
    ownerId: input.ownerId,
    machineId: input.machineId,
    permissionId: permission.permissionId,
    category: "machine",
    action: `machine.transition.${current.state}.${input.targetState}`,
    riskLevel,
    permissionDecision: permission.decision,
    verificationStatus: permission.decision === "allowed" ? "passed" : permission.decision === "blocked" ? "failed" : "pending",
    reason: permission.reason,
    permissionSnapshotJson: permission.permissionSnapshot,
    evidenceJson: evidence,
  });

  if (permission.decision !== "allowed") {
    return { changed: false, requiresConfirmation: permission.decision === "confirmation_required", reason: permission.reason };
  }

  await db.update(realmMachines).set({ state: input.targetState }).where(eq(realmMachines.id, input.machineId));
  if (input.targetState === "emergency") {
    await db.insert(simulatedAlerts).values({
      ownerId: input.ownerId,
      machineId: input.machineId,
      severity: "critical",
      status: "active",
      title: `Parada de emergencia simulada — ${current.name}`,
      description: "La máquina se trasladó al estado de emergencia dentro del simulador. No se realizó ninguna acción sobre hardware real.",
    });
  }
  return { changed: true, requiresConfirmation: false, reason: "Estado de máquina actualizado dentro de la simulación." };
}

export async function setSimulatedMachineMode(input: { ownerId: number; machineId: number; mode: OperationMode; confirmed?: boolean }) {
  const db = requireDb(await getDb());
  const machine = await db
    .select()
    .from(realmMachines)
    .where(and(eq(realmMachines.id, input.machineId), eq(realmMachines.ownerId, input.ownerId)))
    .limit(1);
  if (!machine[0]) throw new Error("La máquina simulada no existe o no pertenece a la sesión actual.");
  const riskLevel: RiskLevel = input.mode === "autonomous" ? "high" : "low";
  const permission = await evaluateSimulationPermission({ ownerId: input.ownerId, action: `machine.mode.${input.mode}.simulated`, riskLevel, confirmed: input.confirmed });
  const evidence = syntheticEvidence(permission.reason);
  await db.insert(validationLedger).values({
    ownerId: input.ownerId,
    machineId: input.machineId,
    permissionId: permission.permissionId,
    category: "machine",
    action: `machine.mode.${input.mode}`,
    riskLevel,
    permissionDecision: permission.decision,
    verificationStatus: permission.decision === "allowed" ? "passed" : permission.decision === "blocked" ? "failed" : "pending",
    reason: permission.reason,
    permissionSnapshotJson: permission.permissionSnapshot,
    evidenceJson: evidence,
  });
  if (permission.decision !== "allowed") return { changed: false, requiresConfirmation: permission.decision === "confirmation_required", reason: permission.reason };
  await db.update(realmMachines).set({ operationMode: input.mode }).where(eq(realmMachines.id, input.machineId));
  return { changed: true, requiresConfirmation: false, reason: "Modo de operación actualizado únicamente en la simulación." };
}

export async function tickSimulation(ownerId: number) {
  await ensureSimulationWorkspace(ownerId);
  const db = requireDb(await getDb());
  const machines = await db.select().from(realmMachines).where(eq(realmMachines.ownerId, ownerId));
  const now = Date.now();
  await Promise.all(
    machines.map(async machine => {
      const sample = simulatedTelemetry(machine.state as MachineState, now + machine.id * 1000);
      await db.insert(telemetrySnapshots).values({ machineId: machine.id, ...sample });
      await db.insert(protocolMessages).values({
        ownerId,
        machineId: machine.id,
        protocol: "mqtt",
        direction: "publish",
        channel: `sim/realm/${machine.machineKey}/telemetry`,
        payloadJson: { simulationOnly: true, state: machine.state, ...sample },
        status: "simulated",
      });
    }),
  );
  return { samples: machines.length, simulationOnly: true };
}

export async function emulateProtocol(input: {
  ownerId: number;
  machineId: number;
  protocol: ProtocolName;
  direction: "publish" | "subscribe" | "command" | "response" | "event";
  confirmed?: boolean;
}) {
  const db = requireDb(await getDb());
  const machine = await db
    .select()
    .from(realmMachines)
    .where(and(eq(realmMachines.id, input.machineId), eq(realmMachines.ownerId, input.ownerId)))
    .limit(1);
  if (!machine[0]) throw new Error("La máquina simulada no existe o no pertenece a la sesión actual.");
  const riskLevel: RiskLevel = input.direction === "command" ? "high" : "low";
  const policyAction = input.direction === "command" ? "protocol.command.simulated" : `protocol.${input.protocol}.${input.direction}.simulated`;
  const permission = await evaluateSimulationPermission({ ownerId: input.ownerId, action: policyAction, riskLevel, confirmed: input.confirmed });
  const evidence = syntheticEvidence(permission.reason);
  await db.insert(validationLedger).values({
    ownerId: input.ownerId,
    machineId: input.machineId,
    permissionId: permission.permissionId,
    category: "protocol",
    action: `${input.protocol}.${input.direction}.emulate`,
    riskLevel,
    permissionDecision: permission.decision,
    verificationStatus: permission.decision === "allowed" ? "passed" : permission.decision === "blocked" ? "failed" : "pending",
    reason: permission.reason,
    permissionSnapshotJson: permission.permissionSnapshot,
    evidenceJson: evidence,
  });
  if (permission.decision !== "allowed") return { emitted: false, requiresConfirmation: permission.decision === "confirmation_required", reason: permission.reason };
  const channel = input.protocol === "mqtt"
    ? `sim/realm/${machine[0].machineKey}/command`
    : input.protocol === "opcua"
      ? `ns=2;s=Simulation/${machine[0].machineKey}/State`
      : `${machine[0].machineKey}:40001`;
  await db.insert(protocolMessages).values({
    ownerId: input.ownerId,
    machineId: input.machineId,
    protocol: input.protocol,
    direction: input.direction,
    channel,
    payloadJson: {
      simulationOnly: true,
      machine: machine[0].machineKey,
      requestedDirection: input.direction,
      observedState: machine[0].state,
    },
    status: "verified",
  });
  return { emitted: true, requiresConfirmation: false, reason: "Mensaje protocolario generado y verificado dentro de la simulación." };
}
