import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  canonicalLedgerPayload,
  computeLedgerHash,
  createRepositoryAudit,
  createTraceId,
  enforceAgentReview,
  evaluateRules,
  validateAgentInput,
  verifyLedgerSignature,
} from "./index.js";

describe("@belentani7/belentani-core", () => {
  it("verifies signed ledger entries", () => {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const payload = { workspaceId: 1, actorId: "agent", actorType: "AI_AGENT", action: "PLAN_GENERATED", targetFiles: ["src/a.ts"], prevHash: null, createdAt: "2026-08-20T00:00:00.000Z" };
    const signature = sign(null, Buffer.from(canonicalLedgerPayload(payload)), privateKey).toString("base64");
    const walHash = computeLedgerHash(payload);
    const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
    expect(verifyLedgerSignature({ ...payload, walHash, signature }, publicKeyPem).signatureStatus).toBe("VERIFIED");
  });

  it("evaluates policies, traces and metadata-only repository audits", () => {
    expect(evaluateRules({ text: "ok" }, {}, [{ id: "x", name: "required", type: "required", field: "input.text" }]).result).toBe("pass");
    expect(validateAgentInput("legal review").valid).toBe(true);
    expect(enforceAgentReview("Necesito asesoría legal", "general", false)).toBe(true);
    expect(createTraceId("trace-1234")).toBe("trace-1234");
    expect(createRepositoryAudit("https://github.com/belentani7/forja-enterprise").execution).toBe("blocked");
  });
});
