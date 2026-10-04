import { connect, type Server } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createLocalProtocolServer, type LocalProtocolResponse } from "../local-protocol/src/core.ts";

let server: Server | undefined;

async function startProtocolServer() {
  server = createLocalProtocolServer();
  await new Promise<void>((resolve, reject) => {
    server!.once("error", reject);
    server!.listen({ host: "127.0.0.1", port: 0 }, resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No se pudo determinar el puerto del protocolo local.");
  return address.port;
}

async function sendFrame(port: number, frame: string): Promise<LocalProtocolResponse> {
  return new Promise((resolve, reject) => {
    const socket = connect({ host: "127.0.0.1", port });
    let buffered = "";
    socket.setEncoding("utf8");
    socket.once("connect", () => socket.write(`${frame}\n`));
    socket.on("data", chunk => {
      buffered += chunk;
      const newline = buffered.indexOf("\n");
      if (newline < 0) return;
      try {
        resolve(JSON.parse(buffered.slice(0, newline)) as LocalProtocolResponse);
      } catch (error) {
        reject(error);
      } finally {
        socket.end();
      }
    });
    socket.once("error", reject);
  });
}

afterEach(async () => {
  if (server?.listening) await new Promise<void>(resolve => server!.close(() => resolve()));
  server = undefined;
});

describe("ULSP/1 local simulation protocol", () => {
  it("intercambia saludo, snapshot y transición simulada por TCP de loopback", async () => {
    const port = await startProtocolServer();
    const hello = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "hello-1", type: "hello", payload: { clientName: "vitest" } }));
    const initial = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "snapshot-1", type: "snapshot", payload: {} }));
    const started = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "command-1", type: "command", payload: { command: "start" } }));
    const final = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "snapshot-2", type: "snapshot", payload: {} }));

    expect(hello).toMatchObject({ ok: true, simulationOnly: true, payload: { transport: "tcp-loopback", state: "idle" } });
    expect(initial).toMatchObject({ ok: true, simulationOnly: true, payload: { state: "idle", cycleCount: 0 } });
    expect(started).toMatchObject({ ok: true, simulationOnly: true, payload: { state: "running", cycleCount: 1, event: { previousState: "idle", newState: "running" } } });
    expect(final).toMatchObject({ ok: true, simulationOnly: true, payload: { state: "running", cycleCount: 1 } });
  });

  it("rechaza tramas y transiciones inválidas sin abandonar la frontera de simulación", async () => {
    const port = await startProtocolServer();
    const malformed = await sendFrame(port, "no-es-json");
    const wrongVersion = await sendFrame(port, JSON.stringify({ protocol: "ULSP/0", requestId: "old", type: "snapshot", payload: {} }));
    const start = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "start", type: "command", payload: { command: "start" } }));
    const repeatedStart = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "repeat", type: "command", payload: { command: "start" } }));
    const snapshot = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "snapshot", type: "snapshot", payload: {} }));

    expect(malformed).toMatchObject({ ok: false, simulationOnly: true, error: { code: "INVALID_FRAME" } });
    expect(wrongVersion).toMatchObject({ ok: false, simulationOnly: true, error: { code: "UNSUPPORTED_PROTOCOL" } });
    expect(start).toMatchObject({ ok: true, simulationOnly: true });
    expect(repeatedStart).toMatchObject({ ok: false, simulationOnly: true, error: { code: "INVALID_TRANSITION" } });
    expect(snapshot).toMatchObject({ ok: true, simulationOnly: true, payload: { state: "running", cycleCount: 1 } });
  });

  it("aplica enclavamientos virtuales antes de permitir la salida de marcha", async () => {
    const port = await startProtocolServer();
    const start = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "start", type: "command", payload: { command: "start" } }));
    const guardOpen = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "guard-open", type: "input", payload: { signal: "guardClosed", value: false } }));
    const blockedStart = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "blocked-start", type: "command", payload: { command: "start" } }));
    const guardClose = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "guard-close", type: "input", payload: { signal: "guardClosed", value: true } }));
    const restarted = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "restart", type: "command", payload: { command: "start" } }));
    const thermalTrip = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "thermal-trip", type: "input", payload: { signal: "thermalTrip", value: true } }));
    const blockedReset = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "blocked-reset", type: "command", payload: { command: "reset" } }));
    const thermalClear = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "thermal-clear", type: "input", payload: { signal: "thermalTrip", value: false } }));
    const reset = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "reset", type: "command", payload: { command: "reset" } }));
    const emergencyStop = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "emergency", type: "command", payload: { command: "emergency_stop" } }));
    const acknowledged = await sendFrame(port, JSON.stringify({ protocol: "ULSP/1", requestId: "acknowledge", type: "command", payload: { command: "acknowledge" } }));

    expect(start).toMatchObject({ ok: true, simulationOnly: true, payload: { state: "running", circuit: { outputs: { motorContactor: true, runLamp: true } } } });
    expect(guardOpen).toMatchObject({ ok: true, simulationOnly: true, payload: { state: "stopped", circuit: { inputs: { guardClosed: false }, interlockHealthy: false, outputs: { motorContactor: false, faultLamp: true } } } });
    expect(blockedStart).toMatchObject({ ok: false, simulationOnly: true, error: { code: "INVALID_TRANSITION" } });
    expect(guardClose).toMatchObject({ ok: true, simulationOnly: true, payload: { circuit: { interlockHealthy: true } } });
    expect(restarted).toMatchObject({ ok: true, simulationOnly: true, payload: { state: "running", circuit: { outputs: { motorContactor: true } } } });
    expect(thermalTrip).toMatchObject({ ok: true, simulationOnly: true, payload: { state: "stopped", circuit: { inputs: { thermalTrip: true }, outputs: { motorContactor: false, faultLamp: true, alarmSiren: true } } } });
    expect(blockedReset).toMatchObject({ ok: false, simulationOnly: true, error: { code: "INVALID_TRANSITION" } });
    expect(thermalClear).toMatchObject({ ok: true, simulationOnly: true, payload: { circuit: { interlockHealthy: true } } });
    expect(reset).toMatchObject({ ok: true, simulationOnly: true, payload: { state: "idle", circuit: { outputs: { faultLamp: false } } } });
    expect(emergencyStop).toMatchObject({ ok: true, simulationOnly: true, payload: { state: "emergency_stop", circuit: { inputs: { emergencyLatched: true }, outputs: { motorContactor: false, alarmSiren: true } } } });
    expect(acknowledged).toMatchObject({ ok: true, simulationOnly: true, payload: { state: "stopped", circuit: { inputs: { emergencyLatched: false }, outputs: { motorContactor: false } } } });
  });
});
