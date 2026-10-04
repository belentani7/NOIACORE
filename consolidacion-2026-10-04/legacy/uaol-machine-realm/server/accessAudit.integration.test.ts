import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { accessAuditLogs } from "../drizzle/schema";
import { recordAccessAudit } from "./accessAudit";
import { getDb } from "./db";

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;
const userId = 970000000 + Math.floor(Math.random() * 9_000_000);

describeWithDb("auditoría de accesos", () => {
  afterEach(async () => {
    const db = await getDb();
    if (db) await db.delete(accessAuditLogs).where(eq(accessAuditLogs.userId, userId));
  });

  it("persiste usuario, rol, acción, origen y metadatos de una solicitud protegida", async () => {
    await recordAccessAudit({ userId, role: "operator", action: "trpc.operations.commands.request", origin: "https://console.example", metadata: { method: "POST" } });
    const db = await getDb();
    const rows = await db!.select().from(accessAuditLogs).where(eq(accessAuditLogs.userId, userId));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ role: "operator", action: "trpc.operations.commands.request", origin: "https://console.example" });
  });
});
