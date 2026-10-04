import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const context = {
  user: { id: 2, openId: "test-junior", name: "Test Junior", email: "junior@example.com", loginMethod: "test", role: "user", enterpriseRole: "junior_dev", organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} },
  res: {},
} as TrpcContext;

async function expectForbidden(action: Promise<unknown>) {
  await expect(action).rejects.toMatchObject({ code: "FORBIDDEN" });
}

describe("enterprise mutation enforcement", () => {
  it("blocks sensitive governance mutations for junior_dev without an explicit ALLOW", async () => {
    const caller = appRouter.createCaller(context);
    await expectForbidden(caller.enterprise.createPolicy({ orgId: 1, role: "junior_dev", resource: "tool:test", effect: "ALLOW", actorRole: "junior_dev" }));
    await expectForbidden(caller.enterprise.updatePolicy({ id: 1, role: "junior_dev", resource: "tool:test", effect: "ALLOW", actorRole: "junior_dev" }));
    await expectForbidden(caller.enterprise.deletePolicy({ id: 1, actorRole: "junior_dev" }));
    await expectForbidden(caller.enterprise.createPlugin({ name: "blocked-plugin", version: "1.0.0", wasmDigest: "sha256:blocked-digest", signer: "CI", sigstoreBundle: "rekor:blocked", capabilities: ["filesystem:read"], actorRole: "junior_dev" }));
    await expectForbidden(caller.enterprise.createRefactorJob({ name: "blocked-job", workspaceId: 1, sourceLanguage: "JS", targetLanguage: "TS", totalFiles: 3, actorRole: "junior_dev" }));
  });

  it("blocks member, security and trusted-key mutations for junior_dev", async () => {
    const caller = appRouter.createCaller(context);
    await expectForbidden(caller.enterprise.inviteMember({ workspaceId: 1, email: "blocked@example.com", role: "junior_dev", actorRole: "junior_dev" }));
    await expectForbidden(caller.enterprise.updateMemberRole({ id: 1, role: "junior_dev", actorRole: "junior_dev" }));
    await expectForbidden(caller.enterprise.resolveSecurityEvent({ id: 1, actorRole: "junior_dev" }));
    await expectForbidden(caller.enterprise.createTrustedKey({ keyName: "blocked", fingerprint: "SHA256:blocked", issuer: "CI", publicKey: "ed25519:blocked", actorRole: "junior_dev" }));
    await expectForbidden(caller.enterprise.revokeTrustedKey({ id: 1, actorRole: "junior_dev" }));
  });

  it("rejects known resource ids from another organization", async () => {
    const orgTwoContext = {
      ...context,
      user: { ...context.user, id: 3, openId: "test-org-two", enterpriseRole: "admin" as const, role: "admin" as const, organizationId: 2 },
    } as TrpcContext;
    const caller = appRouter.createCaller(orgTwoContext);

    await expect(caller.enterprise.updatePolicy({ id: 1, role: "admin", resource: "tool:cross-tenant", effect: "ALLOW" })).resolves.toBeNull();
    await expect(caller.enterprise.deletePolicy({ id: 1 })).resolves.toMatchObject({ success: false });
    await expect(caller.enterprise.togglePlugin({ id: 1 })).resolves.toBeNull();
    await expect(caller.enterprise.advanceRefactorJob({ id: 81 })).resolves.toBeNull();
    await expect(caller.enterprise.resolveSecurityEvent({ id: 7401 })).resolves.toBeNull();
    await expect(caller.enterprise.revokeTrustedKey({ id: 1 })).resolves.toBeNull();
    await expect(caller.enterprise.updateMemberRole({ id: 1, role: "admin" })).resolves.toBeNull();
    await expectForbidden(caller.enterprise.createRefactorJob({ name: "cross-tenant", workspaceId: 1, sourceLanguage: "JS", targetLanguage: "TS", totalFiles: 1 }));
  });
});
