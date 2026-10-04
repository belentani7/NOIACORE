import { createServer } from "node:http";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

type RequestLog = { path: string; body: Record<string, unknown> };
const cleanup: string[] = [];

async function runGateway(env: Record<string, string>) {
  return new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn("pnpm", ["tsx", "gateway-local/src/index.mts"], { cwd: process.cwd(), env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", chunk => { output += String(chunk); });
    child.stderr.on("data", chunk => { output += String(chunk); });
    child.on("error", reject);
    child.on("close", code => resolve({ code, output }));
  });
}

describe("gateway-local executable", () => {
  afterEach(async () => { await Promise.all(cleanup.splice(0).map(path => rm(path, { recursive: true, force: true }))); });

  it("hace heartbeat, toma un comando, simula su ejecución y devuelve el resultado por HTTP", async () => {
    const logs: RequestLog[] = [];
    const server = createServer(async (req, res) => {
      const body = await new Promise<string>(resolve => { let value = ""; req.on("data", chunk => { value += String(chunk); }); req.on("end", () => resolve(value)); });
      logs.push({ path: req.url ?? "", body: body ? JSON.parse(body) : {} });
      res.setHeader("Content-Type", "application/json");
      if (req.url === "/api/gateway/heartbeat") return void res.end(JSON.stringify({ accepted: true }));
      if (req.url === "/api/gateway/commands/pull") return void res.end(JSON.stringify({ command: { commandId: "cmd-gateway-test", commandType: "start", machine: { machineKey: "RM-TEST", state: "idle", connectionStatus: "connected" } } }));
      if (req.url === "/api/gateway/commands/result") return void res.end(JSON.stringify({ accepted: true, status: "succeeded" }));
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "not_found" }));
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    const workspace = await mkdtemp(join(tmpdir(), "uaol-gateway-"));
    cleanup.push(workspace);
    const result = await runGateway({ BACKEND_URL: `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`, GATEWAY_ID: "gw-test", GATEWAY_TOKEN: "test-token", MACHINE_MODE: "simulator", GATEWAY_ONESHOT: "true", GATEWAY_OUTBOX_PATH: join(workspace, "outbox.json") });
    await new Promise<void>(resolve => server.close(() => resolve()));
    expect(result.code).toBe(0);
    expect(logs.map(entry => entry.path)).toEqual(["/api/gateway/heartbeat", "/api/gateway/commands/pull", "/api/gateway/commands/result"]);
    expect(logs[2]?.body).toMatchObject({ commandId: "cmd-gateway-test", accepted: true, nextState: "starting" });
  }, 15_000);

  it("persiste un resultado en el outbox cuando falla y lo vacía en el siguiente ciclo recuperado", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "uaol-gateway-outbox-"));
    cleanup.push(workspace);
    const outbox = join(workspace, "outbox.json");
    let failResult = true;
    const server = createServer(async (req, res) => {
      const body = await new Promise<string>(resolve => { let value = ""; req.on("data", chunk => { value += String(chunk); }); req.on("end", () => resolve(value)); });
      res.setHeader("Content-Type", "application/json");
      if (req.url === "/api/gateway/heartbeat") return void res.end(JSON.stringify({ accepted: true }));
      if (req.url === "/api/gateway/commands/pull") return void res.end(JSON.stringify({ command: failResult ? { commandId: "cmd-outbox-test", commandType: "start", machine: { machineKey: "RM-TEST", state: "idle", connectionStatus: "connected" } } : null }));
      if (req.url === "/api/gateway/commands/result" && failResult) { res.statusCode = 503; return void res.end(JSON.stringify({ error: "offline" })); }
      if (req.url === "/api/gateway/commands/result") return void res.end(JSON.stringify({ accepted: true }));
      res.statusCode = 404;
      res.end();
      void body;
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    const env = { BACKEND_URL: `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`, GATEWAY_ID: "gw-test", GATEWAY_TOKEN: "test-token", MACHINE_MODE: "simulator", GATEWAY_ONESHOT: "true", GATEWAY_OUTBOX_PATH: outbox };
    expect((await runGateway(env)).code).toBe(0);
    expect(JSON.parse(await readFile(outbox, "utf8"))).toHaveLength(1);
    failResult = false;
    expect((await runGateway(env)).code).toBe(0);
    expect(JSON.parse(await readFile(outbox, "utf8"))).toHaveLength(0);
    await new Promise<void>(resolve => server.close(() => resolve()));
  }, 15_000);
});
