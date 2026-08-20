import { describe, expect, it } from "vitest";
import { evaluateRules, hashLedgerEntry } from "./validation";

describe("PVC validation engine", () => {
  it("passes an output that satisfies required and length rules", () => {
    const result = evaluateRules({ prompt: "hi" }, { answer: "ok" }, [
      { id: "required", name: "answer", type: "required", field: "output.answer", severity: "high" },
      { id: "length", name: "short", type: "max_length", field: "output.answer", value: 10, severity: "low" },
    ]);
    expect(result.result).toBe("pass");
    expect(result.triggeredRules).toHaveLength(0);
  });

  it("fails and escalates risk when a critical forbidden rule fires", () => {
    const result = evaluateRules({ prompt: "secret" }, { answer: "contains secret" }, [
      { id: "forbidden", name: "secret", type: "forbidden", field: "output.answer", value: "secret", severity: "critical" },
    ]);
    expect(result.result).toBe("fail");
    expect(result.riskLevel).toBe("critical");
    expect(result.triggeredRules[0]?.reason).toContain("prohibido");
  });
});

describe("immutable ledger hash", () => {
  it("is deterministic and changes when chained content changes", () => {
    const one = hashLedgerEntry({ eventId: "a", inputJson: "{}", outputJson: "{}", result: "pass", previousHash: null });
    const same = hashLedgerEntry({ eventId: "a", inputJson: "{}", outputJson: "{}", result: "pass", previousHash: null });
    const changed = hashLedgerEntry({ eventId: "a", inputJson: "{}", outputJson: "{\"x\":1}", result: "pass", previousHash: null });
    expect(one).toBe(same);
    expect(one).not.toBe(changed);
    expect(one).toHaveLength(64);
  });
});
