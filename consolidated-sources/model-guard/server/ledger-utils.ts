import type { LedgerEntry } from "../drizzle/schema";

export function ledgerToCsv(rows: LedgerEntry[]) {
  const header = "eventId,policyId,policyVersion,result,riskLevel,entryHash,createdAt";
  const lines = rows.map((r) => [r.eventId, r.policyId, r.policyVersion, r.result, r.riskLevel, r.entryHash, r.createdAt.toISOString()].join(","));
  return [header, ...lines].join("\n");
}

export function findLedgerAnomalies(rows: Pick<LedgerEntry, "previousHash" | "entryHash">[]) {
  const anomalies: number[] = [];
  for (let i = 1; i < rows.length; i += 1) if (rows[i].previousHash && rows[i].previousHash !== rows[i - 1].entryHash) anomalies.push(i);
  return anomalies;
}
