import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const orgTwoContext = {
  user: { id: 3, openId: "tenant-audit-org-two", name: "Org Two Admin", email: "org-two@example.com", loginMethod: "test", role: "admin", enterpriseRole: "admin", organizationId: 2, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} },
  res: {},
} as TrpcContext;

describe("enterprise tenant ownership matrix", () => {
  it("keeps every read procedure inside the authenticated organization boundary", async () => {
    const caller = appRouter.createCaller(orgTwoContext);
    const snapshot = await caller.enterprise.snapshot();
    const workspaceIds = new Set(snapshot.workspaces.map((workspace) => workspace.id));
    const jobIds = new Set(snapshot.jobs.map((job) => job.id));
    const nodeIds = new Set(snapshot.graphNodes.map((node) => node.id));

    expect(snapshot.organizations.every((organization) => organization.id === 2)).toBe(true);
    expect(snapshot.workspaces.every((workspace) => workspace.orgId === 2)).toBe(true);
    expect(snapshot.auditLogs.every((log) => workspaceIds.has(log.workspaceId))).toBe(true);
    expect(snapshot.policies.every((policy) => policy.orgId === 2)).toBe(true);
    expect(snapshot.plugins.every((plugin) => plugin.orgId === 2)).toBe(true);
    expect(snapshot.jobs.every((job) => workspaceIds.has(job.workspaceId))).toBe(true);
    expect(snapshot.walEntries.every((entry) => jobIds.has(entry.jobId))).toBe(true);
    expect(snapshot.securityEvents.every((event) => event.orgId === 2)).toBe(true);
    expect(snapshot.graphNodes.every((node) => !node.workspaceId || workspaceIds.has(node.workspaceId))).toBe(true);
    expect(snapshot.graphEdges.every((edge) => !edge.workspaceId || workspaceIds.has(edge.workspaceId))).toBe(true);
    expect(snapshot.graphEdges.every((edge) => nodeIds.has(edge.fromNodeId) && nodeIds.has(edge.toNodeId))).toBe(true);
    expect(snapshot.trustedKeys.every((key) => key.orgId === 2)).toBe(true);

    const [audit, policies, organizations, members, workspaces, plugins, jobs, wal, security, graph, keys, analytics] = await Promise.all([
      caller.enterprise.auditLogs({ page: 1, pageSize: 100, actorType: "ALL", action: "ALL" }),
      caller.enterprise.policies(),
      caller.enterprise.organizations(),
      caller.enterprise.workspaceMembers({ workspaceId: 1 }),
      caller.enterprise.workspaces(),
      caller.enterprise.plugins(),
      caller.enterprise.jobs(),
      caller.enterprise.walEntries({ jobId: 81 }),
      caller.enterprise.securityEvents(),
      caller.enterprise.graph(),
      caller.enterprise.trustedKeys(),
      caller.enterprise.analytics(),
    ]);

    expect(audit.items.every((log) => workspaceIds.has(log.workspaceId))).toBe(true);
    expect(policies.every((policy) => policy.orgId === 2)).toBe(true);
    expect(organizations.every((organization) => organization.id === 2)).toBe(true);
    expect(members).toEqual([]);
    expect(workspaces.every((workspace) => workspace.orgId === 2)).toBe(true);
    expect(plugins.every((plugin) => plugin.orgId === 2)).toBe(true);
    expect(jobs.every((job) => workspaceIds.has(job.workspaceId))).toBe(true);
    expect(wal.every((entry) => jobIds.has(entry.jobId))).toBe(true);
    expect(security.every((event) => event.orgId === 2)).toBe(true);
    expect(graph.nodes.every((node) => !node.workspaceId || workspaceIds.has(node.workspaceId))).toBe(true);
    expect(graph.edges.every((edge) => !edge.workspaceId || workspaceIds.has(edge.workspaceId))).toBe(true);
    expect(keys.every((key) => key.orgId === 2)).toBe(true);
    expect(analytics).toHaveProperty("timeline");
  });
});
