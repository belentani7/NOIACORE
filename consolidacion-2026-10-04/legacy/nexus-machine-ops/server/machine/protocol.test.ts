import { describe, expect, it } from "vitest";
import { calculateAuditHash } from "./audit";
import { evaluateHumanApproval, evaluatePolicy, tripleConfirmationComplete } from "./protocol";

describe("triple confirmation protocol", () => {
  const operator = { id: 7, role: "user" as const, operationRole: "operator" as const };
  const approver = { id: 9, role: "user" as const, operationRole: "approver" as const };

  it("blocks a policy request from an observer", () => {
    const result = evaluatePolicy({ id: 3, role: "user", operationRole: "observer" }, "start", "simulation", true);
    expect(result.allowed).toBe(false);
  });

  it("allows an operator to prepare a simulation command", () => {
    expect(evaluatePolicy(operator, "start", "simulation", true).allowed).toBe(true);
  });

  it("blocks self approval to preserve the independent human node", () => {
    const result = evaluateHumanApproval({ requesterId: operator.id, approver: operator, expiresAt: new Date(Date.now() + 60_000) });
    expect(result).toMatchObject({ approved: false, decision: "rejected" });
  });

  it("expires incomplete approvals", () => {
    const result = evaluateHumanApproval({ requesterId: operator.id, approver, expiresAt: new Date(Date.now() - 1) });
    expect(result).toMatchObject({ approved: false, decision: "expired" });
  });

  it("requires all three nodes before a command can proceed", () => {
    expect(tripleConfirmationComplete({ policy: true, risk: true, human: false })).toBe(false);
    expect(tripleConfirmationComplete({ policy: true, risk: true, human: true })).toBe(true);
  });

  it("creates a tamper-evident hash chain for audit entries", () => {
    const first = calculateAuditHash(null, { decision: "requested", commandId: "a" });
    const second = calculateAuditHash(first, { decision: "approved", commandId: "a" });
    expect(first).toHaveLength(64);
    expect(second).toHaveLength(64);
    expect(second).not.toBe(first);
  });
});
