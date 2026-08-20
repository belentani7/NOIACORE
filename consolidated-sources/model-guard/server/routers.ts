import crypto from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { alertSettings, alerts, evidenceFiles, getDb, getLatestLedgerEntry, getPolicy, getPolicyVersion, dashboardMetrics, ledgerEntries, listLedger, listPolicies, policies, policyVersions, users } from "./db";
import { evaluateRules, hashLedgerEntry, ValidationRule } from "./validation";
import { ledgerToCsv } from "./ledger-utils";
import { modelGuardModels, modelGuardContracts, modelGuardEvaluations, modelGuardDriftSignals, modelGuardEnvelopes } from "../drizzle/schema";
import { evaluateModelGuard, driftSeverity, envelopeReadiness, scrubModelText } from "./model-guard-utils";

const rulesSchema = z.array(z.object({ id: z.string(), name: z.string(), type: z.enum(["required", "max_length", "contains", "regex", "forbidden"]), field: z.string(), value: z.union([z.string(), z.number()]).optional(), severity: z.enum(["low", "medium", "high", "critical"]).optional(), enabled: z.boolean().optional() }));
const jsonObject = z.record(z.string(), z.any());

async function aiAnalysis(input: unknown, output: unknown, result: ReturnType<typeof evaluateRules>) {
  try {
    const response = await invokeLLM({ messages: [{ role: "system", content: "You are NoiaCore risk analyst. Return concise JSON with riskSummary, suggestedPolicyFixes and executiveSummary." }, { role: "user", content: JSON.stringify({ input, output, result }) }], response_format: { type: "json_schema", json_schema: { name: "noiacore_analysis", strict: true, schema: { type: "object", properties: { riskSummary: { type: "string" }, suggestedPolicyFixes: { type: "array", items: { type: "string" } }, executiveSummary: { type: "string" } }, required: ["riskSummary", "suggestedPolicyFixes", "executiveSummary"], additionalProperties: false } } } });
    const content = response.choices?.[0]?.message?.content;
    return typeof content === "string" ? JSON.parse(content) : null;
  } catch { return null; }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  dashboard: router({
    metrics: protectedProcedure.query(() => dashboardMetrics()),
    alerts: protectedProcedure.query(async () => { const db = await getDb(); return db ? db.select().from(alerts).orderBy(alerts.createdAt).limit(20) : []; }),
  }),
  policies: router({
    list: protectedProcedure.query(() => listPolicies()),
    create: protectedProcedure.input(z.object({ name: z.string().min(2), description: z.string().optional(), critical: z.boolean().default(false), rules: rulesSchema })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${crypto.randomUUID().slice(0, 8)}`; const created = await db.insert(policies).values({ name: input.name, slug, description: input.description, critical: input.critical, createdBy: ctx.user.id }).$returningId(); const id = Number(created[0].id); await db.insert(policyVersions).values({ policyId: id, version: 1, rulesJson: JSON.stringify(input.rules), createdBy: ctx.user.id }); return getPolicy(id); }),
    update: adminProcedure.input(z.object({ id: z.number(), name: z.string().min(2), description: z.string().optional(), critical: z.boolean(), status: z.enum(["active", "inactive"]), rules: rulesSchema, changeNote: z.string().optional() })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const policy = await getPolicy(input.id); if (!policy) throw new Error("Policy not found"); const version = policy.currentVersion + 1; await db.update(policies).set({ name: input.name, description: input.description, critical: input.critical, status: input.status, currentVersion: version }).where((await import("drizzle-orm")).eq(policies.id, input.id)); await db.insert(policyVersions).values({ policyId: input.id, version, rulesJson: JSON.stringify(input.rules), changeNote: input.changeNote, createdBy: ctx.user.id }); return getPolicy(input.id); }),
    version: protectedProcedure.input(z.object({ policyId: z.number(), version: z.number() })).query(({ input }) => getPolicyVersion(input.policyId, input.version)),
  }),
  validation: router({
    run: protectedProcedure.input(z.object({ policyId: z.number(), input: jsonObject, output: jsonObject })).mutation(async ({ ctx, input }) => {
      const policy = await getPolicy(input.policyId); if (!policy || policy.status !== "active") throw new Error("Active policy not found");
      const version = await getPolicyVersion(policy.id, policy.currentVersion); if (!version) throw new Error("Policy version not found");
      const result = evaluateRules(input.input, input.output, JSON.parse(version.rulesJson) as ValidationRule[]); const previous = await getLatestLedgerEntry(); const eventId = crypto.randomUUID(); const base = { eventId, inputJson: JSON.stringify(input.input), outputJson: JSON.stringify(input.output), result: result.result, previousHash: previous?.entryHash ?? null }; const entryHash = hashLedgerEntry(base); const analysis = await aiAnalysis(input.input, input.output, result); const db = await getDb(); if (!db) throw new Error("Database unavailable"); const inserted = await db.insert(ledgerEntries).values({ eventId, policyId: policy.id, policyVersion: policy.currentVersion, userId: ctx.user.id, inputJson: base.inputJson, outputJson: base.outputJson, result: result.result, riskLevel: result.riskLevel, triggeredRulesJson: JSON.stringify(result.triggeredRules), aiAnalysisJson: analysis ? JSON.stringify(analysis) : null, previousHash: previous?.entryHash, entryHash }).$returningId();
      if (result.result === "fail" && (policy.critical || result.riskLevel === "critical")) { await db.insert(alerts).values({ type: "critical_policy", severity: "critical", title: `Violación crítica: ${policy.name}`, message: `${result.triggeredRules.length} regla(s) disparada(s) en ${eventId}`, ledgerEntryId: Number(inserted[0].id) }); await notifyOwner({ title: "NoiaCore: violación crítica", content: `La política ${policy.name} ha rechazado una validación crítica. Evento: ${eventId}` }); }
      return { eventId, entryHash, ...result, analysis };
    }),
  }),
  ledger: router({
    list: protectedProcedure.input(z.object({ page: z.number().default(1), pageSize: z.number().default(20), result: z.enum(["pass", "fail"]).optional(), policyId: z.number().optional() })).query(({ input }) => listLedger({ limit: input.pageSize, offset: (input.page - 1) * input.pageSize, result: input.result, policyId: input.policyId })),
    export: protectedProcedure.input(z.object({ format: z.enum(["csv", "json"]), result: z.enum(["pass", "fail"]).optional(), policyId: z.number().optional() })).query(async ({ input }) => { const data = await listLedger({ limit: 10000, offset: 0, result: input.result, policyId: input.policyId }); if (input.format === "json") return { filename: "noiacore-ledger.json", contentType: "application/json", content: JSON.stringify(data.rows) }; return { filename: "noiacore-ledger.csv", contentType: "text/csv", content: ledgerToCsv(data.rows) }; }),
  }),
  evidence: router({
    list: protectedProcedure.input(z.object({ ledgerEntryId: z.number() })).query(async ({ input }) => { const db = await getDb(); return db ? db.select().from(evidenceFiles).where((await import("drizzle-orm")).eq(evidenceFiles.ledgerEntryId, input.ledgerEntryId)) : []; }),
    upload: protectedProcedure.input(z.object({ ledgerEntryId: z.number(), filename: z.string().min(1).max(255), mimeType: z.string().min(1).max(120), base64: z.string().max(10_000_000) })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const buffer = Buffer.from(input.base64, "base64"); const { key, url } = await storagePut(`ledger/${input.ledgerEntryId}/${crypto.randomUUID()}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`, buffer, input.mimeType); await db.insert(evidenceFiles).values({ ledgerEntryId: input.ledgerEntryId, filename: input.filename, mimeType: input.mimeType, sizeBytes: buffer.length, storageKey: key, storageUrl: url, uploadedBy: ctx.user.id }); return { key, url }; }),
  }),
  settings: router({
    get: protectedProcedure.query(async () => { const db = await getDb(); return db ? (await db.select().from(alertSettings).limit(1))[0] ?? null : null; }),
    update: adminProcedure.input(z.object({ rejectionThreshold: z.number().min(1).max(100), ownerEmail: z.string().email(), enabled: z.boolean() })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const existing = (await db.select().from(alertSettings).limit(1))[0]; if (existing) { await db.update(alertSettings).set({ ...input, updatedBy: ctx.user.id }).where((await import("drizzle-orm")).eq(alertSettings.id, existing.id)); } else await db.insert(alertSettings).values({ ...input, updatedBy: ctx.user.id }); return input; }),
  }),
  users: router({ list: adminProcedure.query(async () => { const db = await getDb(); return db ? db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn }).from(users).orderBy(users.name) : []; }), updateRole: adminProcedure.input(z.object({ id: z.number(), role: z.enum(["admin", "user"]) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(users).set({ role: input.role }).where((await import("drizzle-orm")).eq(users.id, input.id)); return { success: true }; }),
  }),
  modelGuard: router({
    models: protectedProcedure.input(z.object({search:z.string().optional()}).default({})).query(async({ctx,input})=>{const db=await getDb();const rows=db?await db.select().from(modelGuardModels).where((await import("drizzle-orm")).eq(modelGuardModels.createdBy,ctx.user.id)):[];return rows.filter(r=>!input.search||`${r.name} ${r.provider} ${r.version}`.toLowerCase().includes(input.search.toLowerCase()));}),
    createModel: protectedProcedure.input(z.object({name:z.string().min(2),provider:z.string().min(2),version:z.string().min(1),source:z.string().min(2),secretRef:z.string().max(240).optional()})).mutation(async({ctx,input})=>{const db=await getDb();if(!db)throw new Error("Database unavailable");const ins=await db.insert(modelGuardModels).values({...input,lifecycle:"draft",createdBy:ctx.user.id}).$returningId();return{id:Number(ins[0].id),lifecycle:"draft" as const};}),
    createContract: protectedProcedure.input(z.object({modelId:z.number(),name:z.string().min(2),inputSchema:z.record(z.string(),z.any()).default({}),outputSchema:z.record(z.string(),z.any()).default({}),requiredChecks:z.array(z.string()).default([])})).mutation(async({ctx,input})=>{const db=await getDb();if(!db)throw new Error("Database unavailable");const ins=await db.insert(modelGuardContracts).values({modelId:input.modelId,name:input.name,inputSchemaJson:JSON.stringify(input.inputSchema),outputSchemaJson:JSON.stringify(input.outputSchema),requiredChecksJson:JSON.stringify(input.requiredChecks),createdBy:ctx.user.id});return{created:true,modelId:input.modelId,contractId:Number((ins as any)[0]?.id??0)};}),
    evaluate: protectedProcedure.input(z.object({modelId:z.number(),contractId:z.number(),input:z.record(z.string(),z.any()),output:z.any(),checks:z.array(z.string()).default([]),costMicros:z.number().int().min(0).default(0)})).mutation(async({ctx,input})=>{const db=await getDb();if(!db)throw new Error("Database unavailable");const result=evaluateModelGuard(input.input,input.output,input.checks);const ins=await db.insert(modelGuardEvaluations).values({modelId:input.modelId,contractId:input.contractId,inputSummary:scrubModelText(input.input),outputSummary:scrubModelText(input.output),result:result.result,risk:result.risk,triggeredChecksJson:JSON.stringify(result.triggeredChecks),costMicros:input.costMicros,createdBy:ctx.user.id}).$returningId();return{evaluationId:Number(ins[0].id),...result};}),
    drift: protectedProcedure.input(z.object({modelId:z.number(),metric:z.string().min(2),baseline:z.number(),observed:z.number(),threshold:z.number().positive().default(.1)})).mutation(async({ctx,input})=>{const db=await getDb();if(!db)throw new Error("Database unavailable");const severity=driftSeverity(input.baseline,input.observed,input.threshold);const ins=await db.insert(modelGuardDriftSignals).values({modelId:input.modelId,metric:input.metric,baseline:String(input.baseline),observed:String(input.observed),severity,status:"open",createdBy:ctx.user.id}).$returningId();return{signalId:Number(ins[0].id),severity};}),
    envelope: protectedProcedure.input(z.object({modelId:z.number(),contractId:z.number(),evaluationCount:z.number().int().min(0),passRate:z.number().min(0).max(1),drift:z.enum(["clear","watch","blocked"]),lifecycle:z.enum(["draft","approved","deprecated","blocked"]),lineage:z.record(z.string(),z.any()).default({})})).mutation(async({ctx,input})=>{const db=await getDb();if(!db)throw new Error("Database unavailable");const readiness=envelopeReadiness(input.passRate,input.drift,input.lifecycle);const ins=await db.insert(modelGuardEnvelopes).values({modelId:input.modelId,contractId:input.contractId,evaluationCount:input.evaluationCount,passRate:String(input.passRate),driftStatus:input.drift,lineageJson:JSON.stringify(input.lineage),readiness,createdBy:ctx.user.id}).$returningId();return{envelopeId:Number(ins[0].id),readiness};})
  }),
});

export type AppRouter = typeof appRouter;
