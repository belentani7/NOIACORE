import { createHash } from "node:crypto";

export function calculateAuditHash(previousHash: string | null, content: Record<string, unknown>) {
  return createHash("sha256").update(`${previousHash ?? "GENESIS"}:${JSON.stringify(content)}`).digest("hex");
}
