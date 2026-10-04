import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn(async () => null) }));

const enterprise = await import("./enterpriseData");

describe("enterprise mutation success paths", () => {
  it("creates, updates and deletes an RBAC policy in the durable fallback", async () => {
    const created = await enterprise.createPolicy({ orgId: 1, role: "senior_dev", resource: "tool:test-success", effect: "ALLOW", actorRole: "admin" });
    expect(created.resource).toBe("tool:test-success");
    const updated = await enterprise.updatePolicy({ id: created.id, role: "senior_dev", resource: "tool:test-success-updated", effect: "REQUIRE_HUMAN_APPROVAL", actorRole: "admin" });
    expect(updated?.effect).toBe("REQUIRE_HUMAN_APPROVAL");
    await enterprise.deletePolicy({ id: created.id, actorRole: "admin" });
    const snapshot = await enterprise.getEnterpriseSnapshot();
    expect(snapshot.policies.some((policy) => policy.id === created.id)).toBe(false);
  });

  it("registers and toggles a Wasm plugin without external storage", async () => {
    const created = await enterprise.createPlugin({ orgId: 1, name: "success-plugin", version: "1.0.0", wasmDigest: "sha256:success-plugin", signer: "CI", sigstoreBundle: "rekor:success", capabilities: ["filesystem:read"], actorRole: "admin" });
    const toggled = await enterprise.togglePlugin({ id: created.id, actorRole: "admin" });
    expect(toggled?.enabled).toBe(false);
  });

  it("advances a refactor job and appends a WAL batch entry", async () => {
    const before = (await enterprise.getEnterpriseSnapshot()).walEntries.length;
    const job = await enterprise.createRefactorJob({ name: "success-job", workspaceId: 1, sourceLanguage: "JS", targetLanguage: "TS", totalFiles: 10, actorRole: "admin" });
    const advanced = await enterprise.advanceRefactorJob({ id: job.id, actorRole: "admin" });
    const after = await enterprise.getEnterpriseSnapshot();
    expect(advanced?.status).toBe("RUNNING");
    expect(after.walEntries.length).toBeGreaterThan(before);
    expect(after.walEntries.some((entry) => entry.jobId === job.id && entry.operationType === "UPDATE")).toBe(true);
  });

  it("persists invitation role changes, security resolution and trusted-key revocation in fallback memory", async () => {
    const invitation = await enterprise.inviteWorkspaceMember({ workspaceId: 1, email: "success@example.com", role: "junior_dev", actorRole: "admin" });
    const members = await enterprise.listWorkspaceMembers(1);
    const member = members.find((item) => item.inviteEmail === "success@example.com");
    expect(invitation.success).toBe(true);
    expect(member).toBeDefined();
    const updatedMember = await enterprise.updateWorkspaceMemberRole({ id: member!.id, role: "senior_dev", actorRole: "admin" });
    expect(updatedMember?.role).toBe("senior_dev");

    const resolved = await enterprise.resolveSecurityEvent({ id: 7401, actorRole: "admin" });
    expect(resolved?.resolved).toBe(true);

    const key = await enterprise.createTrustedKey({ orgId: 1, keyName: "success-key", fingerprint: "SHA256:success", issuer: "CI", publicKey: "ed25519:success", actorRole: "admin" });
    const revoked = await enterprise.revokeTrustedKey({ id: key.id, actorRole: "admin" });
    expect(revoked?.status).toBe("REVOKED");
  });
});
