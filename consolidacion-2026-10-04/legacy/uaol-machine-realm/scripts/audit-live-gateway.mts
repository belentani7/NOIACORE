import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { desc, eq } from "drizzle-orm";
import { gatewayHeartbeats, gateways, users } from "../drizzle/schema.ts";
import { getDb } from "../server/db.ts";
import { provisionGatewayCredentials } from "../server/operations.ts";

function runGateway(environment: NodeJS.ProcessEnv) {
  return new Promise<{ code: number | null; output: string }>((resolve) => {
    const child = spawn("pnpm", ["tsx", "gateway-local/src/index.mts"], { cwd: process.cwd(), env: environment, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk) => { output += chunk.toString(); });
    child.on("close", (code) => resolve({ code, output }));
  });
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("La auditoría necesita DATABASE_URL disponible.");
  const admin = (await db.select().from(users).where(eq(users.role, "admin")).limit(1))[0];
  if (!admin) throw new Error("No existe un administrador para provisionar el gateway de auditoría.");
  const credential = await provisionGatewayCredentials(admin.id);
  const gateway = (await db.select().from(gateways).where(eq(gateways.gatewayKey, credential.gatewayKey)).limit(1))[0];
  if (!gateway) throw new Error("El gateway aprovisionado no pudo recuperarse de la base de datos.");
  const before = await db.select().from(gatewayHeartbeats).where(eq(gatewayHeartbeats.gatewayId, gateway.id)).orderBy(desc(gatewayHeartbeats.createdAt)).limit(1);
  const run = await runGateway({ ...process.env, BACKEND_URL: "http://localhost:3000", GATEWAY_ID: credential.gatewayKey, GATEWAY_TOKEN: credential.token, MACHINE_MODE: "simulator", GATEWAY_ONESHOT: "true", GATEWAY_OUTBOX_PATH: "/tmp/uaol-audit-gateway-outbox.json" });
  const after = await db.select().from(gatewayHeartbeats).where(eq(gatewayHeartbeats.gatewayId, gateway.id)).orderBy(desc(gatewayHeartbeats.createdAt)).limit(1);
  const evidence = {
    completedAt: new Date().toISOString(),
    mode: "SIMULATION_ONLY",
    gatewayKey: credential.gatewayKey,
    processExitCode: run.code,
    heartbeatBefore: before[0]?.id ?? null,
    heartbeatAfter: after[0]?.id ?? null,
    heartbeatPersisted: Boolean(after[0] && after[0].id !== before[0]?.id),
    output: run.output.trim(),
  };
  await writeFile("docs/audit-live-gateway-result.json", `${JSON.stringify(evidence, null, 2)}\n`);
  if (run.code !== 0 || !evidence.heartbeatPersisted) throw new Error(`La comprobación gateway-local falló: ${JSON.stringify(evidence)}`);
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
