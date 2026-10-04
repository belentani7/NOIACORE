import { config } from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import { SimulatorMachineAdapter } from "../../server/machineAdapter.ts";
import type { MachineState, OperationCommandType } from "../../shared/simulator.ts";

config({ path: process.env.GATEWAY_ENV_FILE ?? "gateway-local/.env" });

const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:3000").replace(/\/$/, "");
const gatewayId = process.env.GATEWAY_ID ?? "";
const gatewayToken = process.env.GATEWAY_TOKEN ?? "";
const machineMode = process.env.MACHINE_MODE ?? "simulator";
const intervalMs = Number(process.env.GATEWAY_HEARTBEAT_MS ?? 8000);
const outboxPath = process.env.GATEWAY_OUTBOX_PATH ?? "gateway-local/.gateway-outbox.json";
const oneShot = process.env.GATEWAY_ONESHOT === "true";

if (!gatewayId || !gatewayToken) {
  throw new Error("GATEWAY_ID y GATEWAY_TOKEN son obligatorios. Copia .env.gateway.example y configura un gateway autorizado.");
}

if (machineMode !== "simulator") {
  throw new Error("Este gateway local se distribuye únicamente con SimulatorMachineAdapter. HARDWARE MODE permanece bloqueado hasta que exista un adaptador autorizado.");
}

async function post(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${backendUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Id": gatewayId,
      "Authorization": `Bearer ${gatewayToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Gateway request failed: ${response.status} ${await response.text()}`);
  return response.json() as Promise<Record<string, unknown>>;
}

async function heartbeat() {
  const startedAt = Date.now();
  const result = await post("/api/gateway/heartbeat", {
    status: "online",
    latencyMs: Date.now() - startedAt,
    adapterKind: "simulator",
    machineMode: "simulator",
    simulationOnly: true,
    version: "gateway-local/1.0",
  });
  console.log(JSON.stringify({ event: "GATEWAY_HEARTBEAT", at: new Date().toISOString(), ...result }));
}

type PendingResult = { commandId: string; accepted: boolean; nextState?: MachineState; message: string; telemetry?: Record<string, number> };

async function readOutbox(): Promise<PendingResult[]> { try { return JSON.parse(await readFile(outboxPath, "utf8")); } catch { return []; } }
async function writeOutbox(entries: PendingResult[]) { await writeFile(outboxPath, JSON.stringify(entries, null, 2)); }
async function flushOutbox() {
  const pending = await readOutbox();
  const remaining: PendingResult[] = [];
  for (const result of pending) {
    try { await post("/api/gateway/commands/result", result); }
    catch { remaining.push(result); }
  }
  await writeOutbox(remaining);
}

async function processOneCommand() {
  const leased = await post("/api/gateway/commands/pull", {});
  const command = leased.command as undefined | { commandId: string; commandType: OperationCommandType; machine: { machineKey: string; state: MachineState; connectionStatus: "connected" | "disconnected" | "fault" } };
  if (!command) return;
  const adapter = new SimulatorMachineAdapter(command.machine);
  const result = await adapter.sendCommand(command.commandType);
  const telemetry = await adapter.getTelemetry();
  const payload: PendingResult = { commandId: command.commandId, accepted: result.accepted, nextState: result.nextState, message: result.message, telemetry };
  try { await post("/api/gateway/commands/result", payload); }
  catch { const pending = await readOutbox(); pending.push(payload); await writeOutbox(pending); }
}

async function run() {
  const cycle = async () => {
    try { await heartbeat(); await flushOutbox(); await processOneCommand(); }
    catch (error) { console.error(JSON.stringify({ event: "GATEWAY_CYCLE_FAILED", message: String(error), at: new Date().toISOString() })); }
  };
  await cycle();
  if (oneShot) return;
  setInterval(cycle, intervalMs);
}

run().catch(error => { console.error(String(error)); process.exitCode = 1; });
