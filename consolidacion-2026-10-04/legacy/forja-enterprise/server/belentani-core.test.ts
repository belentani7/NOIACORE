import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  canonicalLedgerPayload,
  computeLedgerHash,
  createRepositoryAudit,
  createTraceId,
  enforceAgentReview,
  evaluateRules,
  scrubModelText,
  validateAgentInput,
  verifyLedgerSignature,
} from "../packages/belentani-core/src";

describe("Belentani Core", () => {
  it("verifies a signed ledger entry and rejects tampering", () => {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const payload = {
      workspaceId: 11,
      actorId: "agent-forja",
      actorType: "AI_AGENT",
      action: "WAL_COMMITTED",
      targetFiles: ["src/index.ts"],
      prevHash: null,
      createdAt: "2026-08-20T00:00:00.000Z",
    };
    const signature = sign(null, Buffer.from(canonicalLedgerPayload(payload)), privateKey).toString("base64");
    const walHash = computeLedgerHash(payload);
    expect(verifyLedgerSignature({ ...payload, walHash, signature }, publicKey.export({ type: "spki", format: "pem" }).toString()).signatureStatus).toBe("VERIFIED");
    expect(verifyLedgerSignature({ ...payload, walHash: "0".repeat(64), signature }, publicKey.export({ type: "spki", format: "pem" }).toString()).signatureStatus).toBe("INVALID");
  });

  it("evaluates nested model rules and scrubs credential-like text", () => {
    const result = evaluateRules({ user: { name: "Ada" } }, { answer: "Bearer secret" }, [
      { id: "r1", name: "required", type: "required", field: "input.user.name", severity: "low" },
      { id: "r2", name: "forbidden", type: "forbidden", field: "output.answer", value: "Bearer", severity: "critical" },
    ]);
    expect(result.result).toBe("fail");
    expect(result.riskLevel).toBe("critical");
    expect(scrubModelText("Bearer abcdefghijklmnop")).toBe("[REDACTED]");
  });

  it("enforces agent limits and human review for sensitive actions", () => {
    expect(validateAgentInput("  ", 0).reason).toBe("empty-message");
    expect(validateAgentInput("valid", 13).reason).toBe("history-too-long");
    expect(enforceAgentReview("Necesito consejo legal", "general", false)).toBe(true);
    expect(enforceAgentReview("Explora ideas de interfaz", "branding", false)).toBe(false);
  });

  it("creates safe trace and metadata-only repository audit contracts", () => {
    const candidate = "trace-1234";
    expect(createTraceId(candidate)).toBe(candidate);
    expect(createTraceId("not valid trace")).toMatch(/^[0-9a-f-]{36}$/);
    const audit = createRepositoryAudit("https://github.com/belentani7/forja-enterprise", 12, ["package.json"]);
    expect(audit.mode).toBe("metadata-only");
    expect(audit.execution).toBe("blocked");
    expect(audit.manualApprovalRequired).toBe(true);
    expect(audit.digest).toHaveLength(64);
    expect(() => createRepositoryAudit("file:///tmp/repo")).toThrow("repository-url-protocol-not-allowed");
  });
});
