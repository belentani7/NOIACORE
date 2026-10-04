import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { getEnterpriseSnapshot } from "./enterpriseData";
import type { TrpcContext } from "./_core/context";

const authenticatedContext = {
  user: { id: 1, openId: "contract-admin", name: "Contract Admin", email: "contract@example.com", loginMethod: "test", role: "admin", enterpriseRole: "admin", organizationId: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} },
  res: {},
} as TrpcContext;

const anonymousContext = { user: undefined, req: { protocol: "https", headers: {} }, res: {} } as TrpcContext;

describe("enterprise production contracts", () => {
  it("rejects anonymous access and malformed inputs at the protected router boundary", async () => {
    const anonymousCaller = appRouter.createCaller(anonymousContext);
    await expect(anonymousCaller.enterprise.snapshot()).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    const caller = appRouter.createCaller(authenticatedContext);
    await expect(caller.enterprise.auditLogs({ page: 0, pageSize: 100, actorType: "ALL", action: "ALL" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.enterprise.createPlugin({ name: "x", version: "", wasmDigest: "short", signer: "", sigstoreBundle: "", capabilities: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.enterprise.inviteMember({ workspaceId: 1, email: "not-an-email", role: "junior_dev" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("exposes terminal WAL states without advancing them implicitly", async () => {
    const snapshot = await getEnterpriseSnapshot(1);
    const terminalJobs = snapshot.jobs.filter((job) => job.status === "COMMITTED" || job.status === "ROLLED_BACK");
    if (snapshot.dataSource === "PREVIEW") {
      expect(terminalJobs.length).toBeGreaterThan(0);
      expect(terminalJobs.every((job) => job.progress === 100)).toBe(true);
    } else {
      expect(terminalJobs.every((job) => job.progress >= 0 && job.progress <= 100)).toBe(true);
    }
    expect(snapshot.walEntries.every((entry) => entry.jobId > 0 && ["PENDING", "APPLIED", "ROLLED_BACK"].includes(entry.status))).toBe(true);
  });

  it("keeps empty analytics honest instead of inventing an operational sample", async () => {
    const snapshot = await getEnterpriseSnapshot(999999);
    expect(snapshot.organizations).toEqual([]);
    expect(snapshot.workspaces).toEqual([]);
    expect(snapshot.analytics.timeline).toHaveLength(7);
    expect(snapshot.analytics.models).toEqual([]);
    expect(snapshot.analytics.tools).toEqual([]);
  });
});

  it("preserves persisted E2EE status while keeping graph nodes and edges workspace-scoped", async () => {
    const caller = appRouter.createCaller(authenticatedContext);
    const graph = await caller.enterprise.graph();
    const workspaceIds = new Set(graph.workspaces.map((workspace) => workspace.id));
    const nodeIds = new Set(graph.nodes.map((node) => node.id));
    expect(graph.workspaces.every((workspace) => workspace.orgId === 1)).toBe(true);
    expect(graph.workspaces.every((workspace) => ["ENABLED", "DEGRADED", "DISABLED"].includes(workspace.e2eeStatus))).toBe(true);
    expect(graph.nodes.every((node) => !node.workspaceId || workspaceIds.has(node.workspaceId))).toBe(true);
    expect(graph.edges.every((edge) => !edge.workspaceId || workspaceIds.has(edge.workspaceId))).toBe(true);
    expect(graph.edges.every((edge) => nodeIds.has(edge.fromNodeId) && nodeIds.has(edge.toNodeId))).toBe(true);
  });
