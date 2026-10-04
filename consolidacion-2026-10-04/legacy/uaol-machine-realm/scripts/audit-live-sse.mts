import { writeFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema.ts";
import { getDb } from "../server/db.ts";
import { provisionGatewayCredentials } from "../server/operations.ts";
import { sdk } from "../server/_core/sdk.ts";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL es necesario para esta comprobación.");
  const admin = (await db.select().from(users).where(eq(users.role, "admin")).limit(1))[0];
  if (!admin) throw new Error("No hay administrador para autenticar la comprobación SSE.");
  const session = await sdk.createSessionToken(admin.openId, { name: admin.name ?? "audit" });
  const credential = await provisionGatewayCredentials(admin.id);
  const stream = await fetch("http://localhost:3000/api/stream/operational", { headers: { Cookie: `app_session_id=${session}` } });
  if (!stream.ok || !stream.body) throw new Error(`SSE no disponible: HTTP ${stream.status}`);
  const reader = stream.body.getReader();
  const decoder = new TextDecoder();
  const eventPromise = new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("No llegó evento SSE dentro de 5 segundos.")), 5_000);
    const pull = async () => {
      try {
        const { value, done } = await reader.read();
        if (done) return reject(new Error("El stream SSE se cerró antes de recibir un evento."));
        const chunk = decoder.decode(value, { stream: true });
        if (chunk.includes("GATEWAY_HEARTBEAT")) { clearTimeout(timeout); resolve(chunk); return; }
        void pull();
      } catch (error) { clearTimeout(timeout); reject(error); }
    };
    void pull();
  });
  const heartbeatResponse = await fetch("http://localhost:3000/api/gateway/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Gateway-Id": credential.gatewayKey, Authorization: `Bearer ${credential.token}` },
    body: JSON.stringify({ status: "online", latencyMs: 1, adapterKind: "simulator", machineMode: "simulator", simulationOnly: true, version: "audit-sse" }),
  });
  const heartbeat = await heartbeatResponse.json();
  const received = await eventPromise;
  await reader.cancel();
  const evidence = { completedAt: new Date().toISOString(), mode: "SIMULATION_ONLY", sseHttpStatus: stream.status, sseContentType: stream.headers.get("content-type"), heartbeatHttpStatus: heartbeatResponse.status, heartbeatAccepted: heartbeat.accepted === true, receivedGatewayEvent: received.includes("GATEWAY_HEARTBEAT"), sample: received.trim() };
  await writeFile("docs/audit-live-sse-result.json", `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  if (!evidence.heartbeatAccepted || !evidence.receivedGatewayEvent) throw new Error("La evidencia SSE es incompleta.");
}

main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
