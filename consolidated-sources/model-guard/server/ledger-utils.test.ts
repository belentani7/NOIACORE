import { describe, expect, it } from "vitest";
import { findLedgerAnomalies, ledgerToCsv } from "./ledger-utils";

describe("ledger utilities", () => {
  it("exports a stable CSV header and row", () => {
    const createdAt = new Date("2026-08-15T00:00:00.000Z");
    const csv = ledgerToCsv([{ eventId: "evt-1", policyId: 2, policyVersion: 1, result: "pass", riskLevel: "low", entryHash: "abc", previousHash: null, inputJson: "{}", outputJson: "{}", userId: 1, aiAnalysisJson: null, id: 1, createdAt } as any]);
    expect(csv).toContain("eventId,policyId,policyVersion,result,riskLevel,entryHash,createdAt");
    expect(csv).toContain("evt-1,2,1,pass,low,abc,2026-08-15T00:00:00.000Z");
  });

  it("identifies broken chain links", () => {
    expect(findLedgerAnomalies([{ previousHash: null, entryHash: "a" }, { previousHash: "a", entryHash: "b" }, { previousHash: "wrong", entryHash: "c" }])).toEqual([2]);
  });
});
