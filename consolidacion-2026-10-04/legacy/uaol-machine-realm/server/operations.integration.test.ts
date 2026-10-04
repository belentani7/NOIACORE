import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  commandExecutions,
  gatewayHeartbeats,
  gateways,
  healthChecks,
  machineAdapterConfigurations,
  notifications,
  operationCommands,
  operationalEvents,
  realmMachines,
  simulatedAlerts,
  telemetrySnapshots,
  validationLedger,
} from "../drizzle/schema";
import { getDb } from "./db";
import { generateOperationalReport, getOperationalOverview, getOperationalSettings, leaseGatewayCommand, provisionGatewayCredentials, receiveGatewayHeartbeat, reportGatewayCommandResult, requestOperation, runGatewayCycle, simulateMachineCondition, updateOperationalSettings } from "./operations";

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;
const ownerId = 980000000 + Math.floor(Math.random() * 9_000_000);

async function cleanup() {
  const db = await getDb();
  if (!db) return;
  const [machines, gatewayRows, commands] = await Promise.all([
    db.select({ id: realmMachines.id }).from(realmMachines).where(eq(realmMachines.ownerId, ownerId)),
    db.select({ id: gateways.id }).from(gateways).where(eq(gateways.ownerId, ownerId)),
    db.select({ id: operationCommands.id }).from(operationCommands).where(eq(operationCommands.ownerId, ownerId)),
  ]);
  const machineIds = machines.map(row => row.id);
  const gatewayIds = gatewayRows.map(row => row.id);
  const commandIds = commands.map(row => row.id);
  if (machineIds.length) await db.delete(telemetrySnapshots).where(inArray(telemetrySnapshots.machineId, machineIds));
  if (gatewayIds.length) await db.delete(gatewayHeartbeats).where(inArray(gatewayHeartbeats.gatewayId, gatewayIds));
  if (commandIds.length) await db.delete(commandExecutions).where(inArray(commandExecutions.commandId, commandIds));
  await Promise.all([
    db.delete(healthChecks).where(eq(healthChecks.ownerId, ownerId)),
    db.delete(operationalEvents).where(eq(operationalEvents.ownerId, ownerId)),
    db.delete(notifications).where(eq(notifications.ownerId, ownerId)),
    db.delete(validationLedger).where(eq(validationLedger.ownerId, ownerId)),
    db.delete(simulatedAlerts).where(eq(simulatedAlerts.ownerId, ownerId)),
    db.delete(machineAdapterConfigurations).where(eq(machineAdapterConfigurations.ownerId, ownerId)),
    db.delete(operationCommands).where(eq(operationCommands.ownerId, ownerId)),
    db.delete(gateways).where(eq(gateways.ownerId, ownerId)),
    db.delete(realmMachines).where(eq(realmMachines.ownerId, ownerId)),
  ]);
}

describeWithDb("flujo operacional persistente", () => {
  beforeAll(cleanup);
  afterAll(cleanup);

  it("mueve un comando confirmado por la cola, el gateway y el gemelo digital sin tocar hardware", async () => {
    const initialized = await getOperationalOverview(ownerId);
    const machine = initialized.machines[0]!;
    expect(initialized.gateway.operatingMode).toBe("simulator");
    expect(initialized.adapters.every(adapter => adapter.adapterKind === "simulator")).toBe(true);

    const start = await requestOperation({ ownerId, machineId: machine.id, commandType: "start", idempotencyKey: "operations-test-start-0001", confirmed: true });
    expect(start).toMatchObject({ status: "queued", requiresConfirmation: false });
    const cycle = await runGatewayCycle(ownerId);
    expect(cycle.processedCommandId).toBe(start.commandId);

    const afterStart = await getOperationalOverview(ownerId);
    expect(afterStart.commands.find(command => command.commandId === start.commandId)?.status).toBe("succeeded");
    expect(afterStart.machines.find(item => item.id === machine.id)?.state).toBe("starting");
    expect(afterStart.events.some(event => event.eventType === "MACHINE_STARTED")).toBe(true);
    expect(afterStart.heartbeats.length).toBeGreaterThan(0);
    expect(afterStart.health.some(check => check.component === "gateway" && check.status === "healthy")).toBe(true);

    const emergencyPending = await requestOperation({ ownerId, machineId: machine.id, commandType: "emergency_stop_simulation", idempotencyKey: "operations-test-emergency-0001" });
    expect(emergencyPending).toMatchObject({ status: "requested", requiresConfirmation: true });
    const emergencyApproved = await requestOperation({ ownerId, machineId: machine.id, commandType: "emergency_stop_simulation", idempotencyKey: "operations-test-emergency-0001", confirmed: true });
    expect(emergencyApproved.status).toBe("queued");
    await runGatewayCycle(ownerId);

    const afterEmergency = await getOperationalOverview(ownerId);
    expect(afterEmergency.machines.find(item => item.id === machine.id)?.state).toBe("emergency");
    expect(afterEmergency.commands.find(command => command.commandId === emergencyApproved.commandId)?.status).toBe("succeeded");
    expect(afterEmergency.events.some(event => event.eventType === "COMMAND_EMERGENCY_STOP_SIMULATION_SUCCEEDED")).toBe(true);
  }, 15_000);

  it("emite credenciales rotables y acepta únicamente heartbeats autenticados del gateway local", async () => {
    const credentials = await provisionGatewayCredentials(ownerId);
    await expect(receiveGatewayHeartbeat({ gatewayKey: credentials.gatewayKey, token: "invalid-token", status: "online", latencyMs: 4, metadata: { adapterKind: "simulator" } })).rejects.toThrow(/Credencial/);
    const heartbeat = await receiveGatewayHeartbeat({ gatewayKey: credentials.gatewayKey, token: credentials.token, status: "online", latencyMs: 4, metadata: { adapterKind: "simulator", version: "gateway-local/1.0" } });
    expect(heartbeat).toMatchObject({ accepted: true, simulationOnly: true });
  });

  it("entrega un comando autorizado al gateway y persiste el resultado devuelto por el simulador", async () => {
    const overview = await getOperationalOverview(ownerId);
    const credentials = await provisionGatewayCredentials(ownerId);
    const requested = await requestOperation({ ownerId, machineId: overview.machines[0]!.id, commandType: "stop", idempotencyKey: "operations-test-gateway-lease-0001", confirmed: true });
    const leased = await leaseGatewayCommand({ gatewayKey: credentials.gatewayKey, token: credentials.token });
    expect(leased.command).toMatchObject({ commandId: requested.commandId, commandType: "stop", simulationOnly: true });
    const reported = await reportGatewayCommandResult({ gatewayKey: credentials.gatewayKey, token: credentials.token, commandId: requested.commandId, accepted: true, nextState: "stopped", message: "Resultado de simulador local", telemetry: { temperature: 220, pressure: 5, vibration: 2, energy: 7, quality: 100, load: 2, speed: 0 } });
    expect(reported).toMatchObject({ accepted: true, status: "succeeded", simulationOnly: true });
    const after = await getOperationalOverview(ownerId);
    expect(after.commands.find(command => command.commandId === requested.commandId)?.status).toBe("succeeded");
    expect(after.machines.find(machine => machine.id === overview.machines[0]!.id)?.state).toBe("stopped");
  }, 15_000);

  it("registra latencia, desconexión, fallo y recuperación del gemelo digital", async () => {
    const overview = await getOperationalOverview(ownerId);
    const machineId = overview.machines[0]!.id;
    expect((await simulateMachineCondition({ ownerId, machineId, condition: "latency", latencyMs: 320 })).changed).toBe(true);
    expect((await simulateMachineCondition({ ownerId, machineId, condition: "disconnect" })).changed).toBe(true);
    expect((await simulateMachineCondition({ ownerId, machineId, condition: "reconnect" })).changed).toBe(true);
    const faultPending = await simulateMachineCondition({ ownerId, machineId, condition: "fault" });
    expect(faultPending).toMatchObject({ changed: false, requiresConfirmation: true });
    expect((await simulateMachineCondition({ ownerId, machineId, condition: "fault", confirmed: true })).changed).toBe(true);
    expect((await simulateMachineCondition({ ownerId, machineId, condition: "recover" })).changed).toBe(true);
    const after = await getOperationalOverview(ownerId);
    const machine = after.machines.find(item => item.id === machineId)!;
    expect(machine).toMatchObject({ connectionStatus: "connected", state: "maintenance", simulatedLatencyMs: 320 });
    expect(after.events.some(event => event.eventType === "MACHINE_DISCONNECTED")).toBe(true);
    expect(after.events.some(event => event.eventType === "MACHINE_RECOVERED")).toBe(true);
  }, 15_000);

  it("genera un informe operacional persistente con frontera de simulación", async () => {
    const report = await generateOperationalReport(ownerId);
    expect(report.reportType).toBe("operational");
    expect((report.contentJson as { boundary?: string }).boundary).toBe("SIMULATION_ONLY");
    const after = await getOperationalOverview(ownerId);
    expect(after.reports.some(item => item.id === report.id)).toBe(true);
    expect(after.events.some(event => event.eventType === "OPERATIONAL_REPORT_GENERATED")).toBe(true);
  }, 15_000);

  it("persiste configuraciones operacionales validadas", async () => {
    const initial = await getOperationalSettings(ownerId);
    expect(initial.settingKey).toBe("operational_defaults");
    await updateOperationalSettings({ ownerId, telemetryCadenceSeconds: 12, defaultLatencyMs: 180, maxQueuedCommands: 40, requireConfirmationForHighRisk: true });
    const after = await getOperationalSettings(ownerId);
    expect(after.valueJson).toMatchObject({ telemetryCadenceSeconds: 12, defaultLatencyMs: 180, maxQueuedCommands: 40, requireConfirmationForHighRisk: true, simulationOnly: true });
  }, 15_000);
});
