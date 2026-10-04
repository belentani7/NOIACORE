import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  agentTasks,
  protocolMessages,
  realmMachines,
  simulatedAlerts,
  simulationPermissions,
  simulatorConfigurations,
  taskEvents,
  telemetrySnapshots,
  validationLedger,
} from "../drizzle/schema";
import { getDb } from "./db";
import {
  advanceSimulatedTask,
  createSimulatedTask,
  emulateProtocol,
  getSimulationOverview,
  setSimulatedMachineMode,
  tickSimulation,
  transitionSimulatedMachine,
} from "./simulation";

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;
const integrationOwnerId = 990000000 + Math.floor(Math.random() * 9_000_000);

async function cleanupIntegrationWorkspace() {
  const db = await getDb();
  if (!db) return;
  const [tasks, machines] = await Promise.all([
    db.select({ id: agentTasks.id }).from(agentTasks).where(eq(agentTasks.ownerId, integrationOwnerId)),
    db.select({ id: realmMachines.id }).from(realmMachines).where(eq(realmMachines.ownerId, integrationOwnerId)),
  ]);
  const taskIds = tasks.map(task => task.id);
  const machineIds = machines.map(machine => machine.id);
  if (taskIds.length) await db.delete(taskEvents).where(inArray(taskEvents.taskId, taskIds));
  if (machineIds.length) await db.delete(telemetrySnapshots).where(inArray(telemetrySnapshots.machineId, machineIds));
  await Promise.all([
    db.delete(validationLedger).where(eq(validationLedger.ownerId, integrationOwnerId)),
    db.delete(protocolMessages).where(eq(protocolMessages.ownerId, integrationOwnerId)),
    db.delete(simulatedAlerts).where(eq(simulatedAlerts.ownerId, integrationOwnerId)),
    db.delete(agentTasks).where(eq(agentTasks.ownerId, integrationOwnerId)),
    db.delete(simulationPermissions).where(eq(simulationPermissions.ownerId, integrationOwnerId)),
    db.delete(simulatorConfigurations).where(eq(simulatorConfigurations.ownerId, integrationOwnerId)),
    db.delete(realmMachines).where(eq(realmMachines.ownerId, integrationOwnerId)),
  ]);
}

describeWithDb("integración persistente de UAOL–Máquina Realm", () => {
  beforeAll(async () => {
    await cleanupIntegrationWorkspace();
  });

  afterAll(async () => {
    await cleanupIntegrationWorkspace();
  });

  it("persiste tareas, políticas, evidencias, protocolos, señales y ledger sin abandonar la simulación", async () => {
    const created = await createSimulatedTask({
      ownerId: integrationOwnerId,
      title: "Validación de ciclo sintético",
      intent: "Inspeccionar una orden simulada y conservar evidencia de cada fase.",
      riskLevel: "medium",
      executionMode: "manual",
    });
    const initial = await getSimulationOverview(integrationOwnerId);
    const task = initial.tasks.find(item => item.id === created.taskId);
    const machine = initial.machines[0];

    expect(task).toMatchObject({ simulationOnly: true, status: "draft" });
    expect(machine).toBeDefined();
    expect(initial.permissions.length).toBeGreaterThanOrEqual(5);
    expect(initial.ledger.some(entry => entry.taskId === created.taskId && entry.permissionId !== null)).toBe(true);

    const advanced = await advanceSimulatedTask(integrationOwnerId, created.taskId);
    expect(advanced.status).toBe("planning");

    const tick = await tickSimulation(integrationOwnerId);
    expect(tick).toMatchObject({ simulationOnly: true, samples: initial.machines.length });

    const modeDecision = await setSimulatedMachineMode({ ownerId: integrationOwnerId, machineId: machine!.id, mode: "autonomous" });
    expect(modeDecision).toMatchObject({ changed: false, requiresConfirmation: true });
    const modeConfirmed = await setSimulatedMachineMode({ ownerId: integrationOwnerId, machineId: machine!.id, mode: "autonomous", confirmed: true });
    expect(modeConfirmed.changed).toBe(true);

    const commandDecision = await emulateProtocol({ ownerId: integrationOwnerId, machineId: machine!.id, protocol: "mqtt", direction: "command" });
    expect(commandDecision).toMatchObject({ emitted: false, requiresConfirmation: true });
    const commandConfirmed = await emulateProtocol({ ownerId: integrationOwnerId, machineId: machine!.id, protocol: "mqtt", direction: "command", confirmed: true });
    expect(commandConfirmed.emitted).toBe(true);

    const idle = await transitionSimulatedMachine({ ownerId: integrationOwnerId, machineId: machine!.id, targetState: "idle" });
    expect(idle.changed).toBe(true);
    const calibration = await transitionSimulatedMachine({ ownerId: integrationOwnerId, machineId: machine!.id, targetState: "calibrating" });
    expect(calibration.changed).toBe(true);
    const emergencyDecision = await transitionSimulatedMachine({ ownerId: integrationOwnerId, machineId: machine!.id, targetState: "emergency" });
    expect(emergencyDecision).toMatchObject({ changed: false, requiresConfirmation: true });
    const emergencyConfirmed = await transitionSimulatedMachine({ ownerId: integrationOwnerId, machineId: machine!.id, targetState: "emergency", confirmed: true });
    expect(emergencyConfirmed.changed).toBe(true);

    const persisted = await getSimulationOverview(integrationOwnerId);
    expect(persisted.events.some(event => event.taskId === created.taskId && event.stage === "planning")).toBe(true);
    expect(persisted.protocols.some(message => message.protocol === "mqtt" && message.direction === "command" && message.status === "verified")).toBe(true);
    expect(persisted.machines.find(item => item.id === machine!.id)?.state).toBe("emergency");
    expect(persisted.alerts.some(alert => alert.machineId === machine!.id && alert.severity === "critical")).toBe(true);
    expect(persisted.ledger.some(entry => entry.permissionSnapshotJson && entry.permissionId !== null)).toBe(true);
  });
});
