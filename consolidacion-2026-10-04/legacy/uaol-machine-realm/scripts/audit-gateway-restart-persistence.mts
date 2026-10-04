import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { gatewayHeartbeats, gateways, users } from "../drizzle/schema.ts";
import { getDb } from "../server/db.ts";
import { provisionGatewayCredentials } from "../server/operations.ts";

function gatewayOnce(environment: NodeJS.ProcessEnv) {
  return new Promise<{ code: number | null; output: string }>((resolve) => {
    const child = spawn("pnpm", ["tsx", "gateway-local/src/index.mts"], {
      cwd: process.cwd(),
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", value => { output += value.toString(); });
    child.stderr.on("data", value => { output += value.toString(); });
    child.on("close", code => resolve({ code, output }));
  });
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL es obligatorio para la auditoría de reinicio del gateway.");
  const admin = (await db.select().from(users).where(eq(users.role, "admin")).limit(1))[0];
  if (!admin) throw new Error("No existe un administrador para emitir la credencial de auditoría.");

  const credential = await provisionGatewayCredentials(admin.id);
  const gateway = (await db.select().from(gateways).where(eq(gateways.gatewayKey, credential.gatewayKey)).limit(1))[0];
  if (!gateway) throw new Error("No se encontró el gateway recién aprovisionado.");
  const sharedEnvironment = {
    ...process.env,
    BACKEND_URL: "http://localhost:3000",
    GATEWAY_ID: credential.gatewayKey,
    GATEWAY_TOKEN: credential.token,
    MACHINE_MODE: "simulator",
    GATEWAY_ONESHOT: "true",
    GATEWAY_OUTBOX_PATH: `/tmp/uaol-audit-gateway-restart-${credential.gatewayKey}.json`,
  };

  const before = await db.select().from(gatewayHeartbeats).where(eq(gatewayHeartbeats.gatewayId, gateway.id));
  const firstRun = await gatewayOnce(sharedEnvironment);
  const afterFirstRun = await db.select().from(gatewayHeartbeats).where(eq(gatewayHeartbeats.gatewayId, gateway.id));
  const secondRun = await gatewayOnce(sharedEnvironment);
  const afterRestart = await db.select().from(gatewayHeartbeats).where(eq(gatewayHeartbeats.gatewayId, gateway.id));

  const evidence = {
    completedAt: new Date().toISOString(),
    mode: "SIMULATION_ONLY",
    gatewayId: gateway.id,
    persistentHeartbeats: {
      before: before.length,
      afterFirstProcess: afterFirstRun.length,
      afterSecondProcess: afterRestart.length,
      statuses: afterRestart.map(item => item.status),
    },
    processRuns: {
      firstExitCode: firstRun.code,
      secondExitCode: secondRun.code,
      firstOutputLines: firstRun.output.trim().split("\n").filter(Boolean),
      secondOutputLines: secondRun.output.trim().split("\n").filter(Boolean),
    },
    persistedAcrossRestart: firstRun.code === 0 && secondRun.code === 0 && afterFirstRun.length > before.length && afterRestart.length > afterFirstRun.length,
  };

  await writeFile("docs/audit-gateway-restart-persistence.json", `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  if (!evidence.persistedAcrossRestart) throw new Error("El reinicio del gateway no dejó evidencia persistida en ambos procesos.");
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
