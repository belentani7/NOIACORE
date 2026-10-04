import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { canonicalAuditPayload, computeAuditHash, evaluatePolicy, verifyAuditSignature, type EnterprisePolicy } from "./enterpriseData";

describe("enterprise cryptography and policy engine", () => {
  it("recomputes the SHA-256 WAL hash and verifies an Ed25519 signature", () => {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const payload = {
      workspaceId: 7,
      actorId: "agent-forja",
      actorType: "AI_AGENT" as const,
      action: "TOOL_EXECUTED" as const,
      targetFiles: ["src/ledger.ts"],
      prevHash: null,
      createdAt: "2026-08-12T00:00:00.000Z",
    };
    const signature = sign(null, Buffer.from(canonicalAuditPayload(payload)), privateKey).toString("base64");
    const walHash = computeAuditHash(payload);
    const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();

    expect(verifyAuditSignature({ ...payload, walHash, signature }, publicKeyPem)).toEqual({
      hashValid: true,
      signatureValid: true,
      signatureStatus: "VERIFIED",
    });
    expect(verifyAuditSignature({ ...payload, walHash: "0".repeat(64), signature }, publicKeyPem).signatureStatus).toBe("INVALID");
  });

  it("uses exact-resource precedence and denies missing or unsatisfied policies", () => {
    const policies: EnterprisePolicy[] = [
      { id: 1, orgId: 1, role: "senior_dev", resource: "tool:*", effect: "ALLOW", conditions: {}, updatedAt: "2026-08-12T00:00:00.000Z" },
      { id: 2, orgId: 1, role: "senior_dev", resource: "tool:aws_deploy", effect: "REQUIRE_HUMAN_APPROVAL", conditions: { env: "production" }, updatedAt: "2026-08-12T00:00:00.000Z" },
    ];

    expect(evaluatePolicy(policies, { orgId: 1, role: "senior_dev", resource: "tool:aws_deploy", conditions: { env: "production" } })).toMatchObject({ effect: "REQUIRE_HUMAN_APPROVAL", matchedPolicyId: 2 });
    expect(evaluatePolicy(policies, { orgId: 1, role: "senior_dev", resource: "tool:aws_deploy", conditions: { env: "staging" } }).effect).toBe("DENY");
    expect(evaluatePolicy(policies, { orgId: 1, role: "junior_dev", resource: "tool:unknown" }).effect).toBe("DENY");
  });
});
