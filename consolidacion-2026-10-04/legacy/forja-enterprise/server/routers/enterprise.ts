import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { logControlPlaneRpc } from "../observability";
import { createTraceId } from "../../packages/belentani-core/src/trace";
import {
  createOrganization,
  createPlugin,
  createPolicy,
  evaluatePolicy,
  updatePolicy,
  createRefactorJob,
  advanceRefactorJob,
  createTrustedKey,
  deletePolicy,
  getEnterpriseSnapshot,
  inviteWorkspaceMember,
  updateWorkspaceMemberRole,
  listWorkspaceMembers,
  resolveSecurityEvent,
  revokeTrustedKey,
  togglePlugin,
} from "../enterpriseData";

const pageInput = z.object({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(5).max(100).default(8) });

const actorContext = (ctx: { user: { role: "user" | "admin"; enterpriseRole: "junior_dev" | "senior_dev" | "ciso" | "admin"; organizationId: number } }) => ({
  orgId: ctx.user.organizationId,
  actorRole: ctx.user.enterpriseRole,
  humanApproved: ctx.user.enterpriseRole === "admin" || ctx.user.enterpriseRole === "ciso",
});

const enterpriseProcedure = protectedProcedure.use(async ({ path, type, next, ctx }) => {
  const startedAt = Date.now();
  const traceId = createTraceId();
  const result = await next();
  logControlPlaneRpc({
    traceId,
    path,
    type,
    organizationId: ctx.user.organizationId,
    enterpriseRole: ctx.user.enterpriseRole,
    durationMs: Date.now() - startedAt,
    outcome: result.ok ? "ok" : "error",
    errorCode: result.ok ? undefined : result.error.code,
  });
  return result;
});

export const enterpriseRouter = router({
  snapshot: enterpriseProcedure.query(({ ctx }) => getEnterpriseSnapshot(ctx.user.organizationId)),

  auditLogs: enterpriseProcedure.input(pageInput.extend({ actorType: z.enum(["ALL", "HUMAN", "AI_AGENT"]).default("ALL"), action: z.string().default("ALL") })).query(async ({ input, ctx }) => {
    const snapshot = await getEnterpriseSnapshot(ctx.user.organizationId);
    const filtered = snapshot.auditLogs.filter((log) => (input.actorType === "ALL" || log.actorType === input.actorType) && (input.action === "ALL" || log.action === input.action));
    const start = (input.page - 1) * input.pageSize;
    return { items: filtered.slice(start, start + input.pageSize), total: filtered.length, page: input.page, pageSize: input.pageSize, chainTip: filtered[0]?.walHash ?? "—" };
  }),

  policies: enterpriseProcedure.query(async ({ ctx }) => (await getEnterpriseSnapshot(ctx.user.organizationId)).policies),
  createPolicy: enterpriseProcedure.input(z.object({ role: z.enum(["junior_dev", "senior_dev", "ciso", "admin"]), resource: z.string().min(3), effect: z.enum(["ALLOW", "REQUIRE_HUMAN_APPROVAL", "DENY"]), conditions: z.record(z.string(), z.unknown()).optional() })).mutation(({ input, ctx }) => createPolicy({ ...input, ...actorContext(ctx) })),
  updatePolicy: enterpriseProcedure.input(z.object({ id: z.number().int().positive(), role: z.enum(["junior_dev", "senior_dev", "ciso", "admin"]), resource: z.string().min(3), effect: z.enum(["ALLOW", "REQUIRE_HUMAN_APPROVAL", "DENY"]), conditions: z.record(z.string(), z.unknown()).optional() })).mutation(({ input, ctx }) => updatePolicy({ ...input, ...actorContext(ctx) })),
  evaluatePolicy: enterpriseProcedure.input(z.object({ role: z.enum(["junior_dev", "senior_dev", "ciso", "admin"]), resource: z.string().min(3), conditions: z.record(z.string(), z.unknown()).optional() })).query(async ({ input, ctx }) => evaluatePolicy((await getEnterpriseSnapshot(ctx.user.organizationId)).policies, { ...input, orgId: ctx.user.organizationId })),
  deletePolicy: enterpriseProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => deletePolicy({ ...input, ...actorContext(ctx) })),

  organizations: enterpriseProcedure.query(async ({ ctx }) => (await getEnterpriseSnapshot(ctx.user.organizationId)).organizations),
  createOrganization: enterpriseProcedure.input(z.object({ name: z.string().min(2), plan: z.enum(["FREE", "TEAM", "ENTERPRISE", "FEDRAMP"]) })).mutation(({ input, ctx }) => createOrganization({ ...input, ...actorContext(ctx) })),
  inviteMember: enterpriseProcedure.input(z.object({ workspaceId: z.number().int().positive(), email: z.string().email(), role: z.enum(["junior_dev", "senior_dev", "ciso", "admin"]) })).mutation(({ input, ctx }) => inviteWorkspaceMember({ ...input, ...actorContext(ctx) })),
  workspaceMembers: enterpriseProcedure.input(z.object({ workspaceId: z.number().int().positive() })).query(({ input, ctx }) => listWorkspaceMembers(input.workspaceId, ctx.user.organizationId)),
  updateMemberRole: enterpriseProcedure.input(z.object({ id: z.number().int().positive(), role: z.enum(["junior_dev", "senior_dev", "ciso", "admin"]) })).mutation(({ input, ctx }) => updateWorkspaceMemberRole({ ...input, ...actorContext(ctx) })),

  workspaces: enterpriseProcedure.query(async ({ ctx }) => (await getEnterpriseSnapshot(ctx.user.organizationId)).workspaces),
  plugins: enterpriseProcedure.query(async ({ ctx }) => (await getEnterpriseSnapshot(ctx.user.organizationId)).plugins),
  createPlugin: enterpriseProcedure.input(z.object({ name: z.string().min(2), version: z.string().min(1), wasmDigest: z.string().min(16), signer: z.string().min(2), sigstoreBundle: z.string().min(2), capabilities: z.array(z.string().min(1)).min(1) })).mutation(({ input, ctx }) => createPlugin({ ...input, ...actorContext(ctx) })),
  togglePlugin: enterpriseProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => togglePlugin({ ...input, ...actorContext(ctx) })),

  jobs: enterpriseProcedure.query(async ({ ctx }) => (await getEnterpriseSnapshot(ctx.user.organizationId)).jobs),
  walEntries: enterpriseProcedure.input(z.object({ jobId: z.number().int().positive().optional() }).optional()).query(async ({ input, ctx }) => {
    const items = (await getEnterpriseSnapshot(ctx.user.organizationId)).walEntries;
    return input?.jobId ? items.filter((entry) => entry.jobId === input.jobId) : items;
  }),
  createRefactorJob: enterpriseProcedure.input(z.object({ name: z.string().min(3), workspaceId: z.number().int().positive(), sourceLanguage: z.string().min(1), targetLanguage: z.string().min(1), totalFiles: z.number().int().min(1).max(1000000) })).mutation(({ input, ctx }) => createRefactorJob({ ...input, ...actorContext(ctx) })),
  advanceRefactorJob: enterpriseProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => advanceRefactorJob({ ...input, ...actorContext(ctx) })),

  securityEvents: enterpriseProcedure.query(async ({ ctx }) => (await getEnterpriseSnapshot(ctx.user.organizationId)).securityEvents),
  resolveSecurityEvent: enterpriseProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => resolveSecurityEvent({ ...input, ...actorContext(ctx) })),

  graph: enterpriseProcedure.query(async ({ ctx }) => {
    const snapshot = await getEnterpriseSnapshot(ctx.user.organizationId);
    return { nodes: snapshot.graphNodes, edges: snapshot.graphEdges, workspaces: snapshot.workspaces };
  }),

  trustedKeys: enterpriseProcedure.query(async ({ ctx }) => (await getEnterpriseSnapshot(ctx.user.organizationId)).trustedKeys),
  createTrustedKey: enterpriseProcedure.input(z.object({ keyName: z.string().min(3), fingerprint: z.string().min(8), issuer: z.string().min(2), publicKey: z.string().min(8) })).mutation(({ input, ctx }) => createTrustedKey({ ...input, ...actorContext(ctx) })),
  revokeTrustedKey: enterpriseProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => revokeTrustedKey({ ...input, ...actorContext(ctx) })),

  analytics: enterpriseProcedure.query(async ({ ctx }) => (await getEnterpriseSnapshot(ctx.user.organizationId)).analytics),
});
