import { describe, expect, it } from "vitest";
import { getEnterpriseSnapshot } from "./enterpriseData";

describe("enterprise.snapshot", () => {
  it("returns a stable control-plane contract", async () => {
    const snapshot = await getEnterpriseSnapshot();

    expect(["DATABASE", "PREVIEW"]).toContain(snapshot.dataSource);
    expect(snapshot).toEqual(expect.objectContaining({
      metrics: expect.objectContaining({
        activeTransactions: expect.any(Number),
        auditEventsPerSecond: expect.any(Number),
        sandboxedPlugins: expect.any(Number),
        fsmState: expect.any(String),
      }),
      organizations: expect.any(Array),
      workspaces: expect.any(Array),
      auditLogs: expect.any(Array),
      policies: expect.any(Array),
      plugins: expect.any(Array),
      jobs: expect.any(Array),
      securityEvents: expect.any(Array),
      graphNodes: expect.any(Array),
      graphEdges: expect.any(Array),
      trustedKeys: expect.any(Array),
    }));
  });

  it("preserves the exact role, effect, actor and security identifiers", async () => {
    const snapshot = await getEnterpriseSnapshot();
    const allowedRoles = ["junior_dev", "senior_dev", "ciso", "admin"];
    const allowedEffects = ["ALLOW", "REQUIRE_HUMAN_APPROVAL", "DENY"];
    const allowedActors = ["HUMAN", "AI_AGENT"];
    const allowedSecurityEvents = ["PROMPT_INJECTION", "SANDBOX_VIOLATION", "SECRET_DETECTED"];

    expect(snapshot.policies.every((policy) => allowedRoles.includes(policy.role))).toBe(true);
    expect(snapshot.policies.every((policy) => allowedEffects.includes(policy.effect))).toBe(true);
    expect(snapshot.auditLogs.every((log) => allowedActors.includes(log.actorType))).toBe(true);
    expect(snapshot.securityEvents.every((event) => allowedSecurityEvents.includes(event.eventType))).toBe(true);
  });
});
