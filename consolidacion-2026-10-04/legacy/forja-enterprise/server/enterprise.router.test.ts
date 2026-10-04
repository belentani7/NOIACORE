import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const readOnlyContext = {
  user: { id: 1, openId: "test-admin", name: "Test Admin", email: "admin@example.com", loginMethod: "test", role: "admin", enterpriseRole: "admin", organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} },
  res: {},
} as TrpcContext;

describe("enterprise router contracts", () => {
  it("exposes a typed policy decision endpoint with exact governance effects", async () => {
    const caller = appRouter.createCaller(readOnlyContext);
    const result = await caller.enterprise.evaluatePolicy({ role: "junior_dev", resource: "tool:filesystem_write" });
    expect(["ALLOW", "REQUIRE_HUMAN_APPROVAL", "DENY"]).toContain(result.effect);
    expect(typeof result.reason).toBe("string");
    expect(result.matchedPolicyId === null || typeof result.matchedPolicyId === "number").toBe(true);
  });

  it("keeps the member and WAL control paths read-safe for unknown records", async () => {
    const caller = appRouter.createCaller(readOnlyContext);
    const members = await caller.enterprise.workspaceMembers({ workspaceId: 1 });
    const advanced = await caller.enterprise.advanceRefactorJob({ id: 999999999 });
    expect(Array.isArray(members)).toBe(true);
    expect(advanced).toBeNull();
  });
});
