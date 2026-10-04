import { accessAuditLogs } from "../drizzle/schema";
import { getDb } from "./db";

export async function recordAccessAudit(input: { userId: number; role: string; action: string; origin?: string | null; metadata?: Record<string, unknown> }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(accessAuditLogs).values({
    userId: input.userId,
    role: input.role,
    action: input.action,
    origin: input.origin ?? null,
    metadataJson: input.metadata ?? null,
  });
}
