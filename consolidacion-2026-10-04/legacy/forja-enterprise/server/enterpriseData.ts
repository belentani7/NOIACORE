import { createHash, randomUUID } from "node:crypto";
import { canonicalLedgerPayload as canonicalAuditPayload, computeLedgerHash as computeAuditHash, verifyLedgerSignature as verifyAuditSignature } from "../packages/belentani-core/src/ledger";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  auditLogs,
  graphEdges,
  graphNodes,
  organizations,
  plugins,
  rbacPolicies,
  refactorJobs,
  securityEvents,
  tokenUsage,
  toolMetrics,
  trustedKeys,
  walEntries,
  workspaceMembers,
  workspaces,
} from "../drizzle/schema";

export type ActorType = "HUMAN" | "AI_AGENT";
export type AuditAction = "PLAN_GENERATED" | "TOOL_EXECUTED" | "WAL_COMMITTED" | "ROLLBACK_TRIGGERED" | "SANDBOX_TRAPPED";
export type PolicyRole = "junior_dev" | "senior_dev" | "ciso" | "admin";
export type PolicyEffect = "ALLOW" | "REQUIRE_HUMAN_APPROVAL" | "DENY";
export type SecurityEventType = "PROMPT_INJECTION" | "SANDBOX_VIOLATION" | "SECRET_DETECTED";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type JobStatus = "PENDING" | "RUNNING" | "COMMITTED" | "ROLLED_BACK";

export interface EnterpriseOrganization {
  id: number;
  name: string;
  slug: string;
  plan: "FREE" | "TEAM" | "ENTERPRISE" | "FEDRAMP";
  members: number;
  workspaces: number;
  e2eePublicKey: string;
}

export interface EnterpriseWorkspace {
  id: number;
  orgId: number;
  name: string;
  repoName: string;
  syncStatus: "SYNCED" | "SYNCING" | "DEGRADED" | "OFFLINE";
  e2eeStatus: "ACTIVE" | "ROTATING" | "DEGRADED" | "DISABLED";
  crdtPeers: number;
  vectorClock: Record<string, number>;
  lastSyncAt: string;
}

export interface EnterpriseAuditLog {
  id: number;
  workspaceId: number;
  actorId: string;
  actorType: ActorType;
  action: AuditAction;
  targetFiles: string[];
  walHash: string;
  prevHash: string | null;
  signature: string;
  signatureStatus: "VERIFIED" | "PENDING" | "INVALID";
  chainStatus?: "VALID" | "INVALID" | "UNVERIFIED";
  createdAt: string;
}

export interface EnterprisePolicy {
  id: number;
  orgId?: number;
  role: PolicyRole;
  resource: string;
  effect: PolicyEffect;
  conditions: Record<string, unknown>;
  updatedAt: string;
}

export interface EnterprisePlugin {
  id: number;
  orgId?: number;
  name: string;
  version: string;
  wasmDigest: string;
  status: "VERIFIED" | "QUARANTINED" | "REVOKED";
  enabled: boolean;
  capabilities: string[];
  signer: string;
  sigstoreBundle: string;
  verifiedAt: string;
}

export interface EnterpriseJob {
  id: number;
  name: string;
  workspaceId: number;
  sourceLanguage: string;
  targetLanguage: string;
  totalFiles: number;
  processedFiles: number;
  progress: number;
  status: JobStatus;
  createdAt: string;
}

export interface EnterpriseWalEntry {
  id: number;
  jobId: number;
  operationType: "CREATE" | "UPDATE" | "DELETE" | "RENAME";
  filePath: string;
  beforeHash: string | null;
  afterHash: string | null;
  status: "PENDING" | "APPLIED" | "ROLLED_BACK";
  createdAt: string;
}

export interface EnterpriseSecurityEvent {
  id: number;
  orgId?: number;
  eventType: SecurityEventType;
  severity: Severity;
  source: string;
  actionTaken: string;
  resolved: boolean;
  createdAt: string;
}

export interface EnterpriseGraphNode {
  id: number;
  workspaceId?: number;
  label: string;
  language: string;
  symbolType: string;
  x: number;
  y: number;
  embeddingState: "ENCRYPTED" | "SYNCING" | "LOCAL_ONLY";
}

export interface EnterpriseGraphEdge {
  id: number;
  workspaceId?: number;
  fromNodeId: number;
  toNodeId: number;
  relationType: string;
  weight: number;
}

export interface EnterpriseTrustedKey {
  id: number;
  orgId?: number;
  keyName: string;
  fingerprint: string;
  issuer: string;
  status: "ACTIVE" | "REVOKED";
  createdAt: string;
}

export interface EnterpriseSnapshot {
  metrics: {
    activeTransactions: number;
    auditEventsPerSecond: number;
    sandboxedPlugins: number;
    fsmState: "IDLE" | "PLANNING" | "AWAITING_APPROVAL" | "EXECUTING_TOOL" | "WAITING_FOR_IO" | "VALIDATING" | "ROLLING_BACK" | "HALTED";
    merkleIntegrity: number;
    protectedFiles: number;
  };
  organizations: EnterpriseOrganization[];
  workspaces: EnterpriseWorkspace[];
  auditLogs: EnterpriseAuditLog[];
  policies: EnterprisePolicy[];
  plugins: EnterprisePlugin[];
  jobs: EnterpriseJob[];
  walEntries: EnterpriseWalEntry[];
  securityEvents: EnterpriseSecurityEvent[];
  graphNodes: EnterpriseGraphNode[];
  graphEdges: EnterpriseGraphEdge[];
  trustedKeys: EnterpriseTrustedKey[];
  analytics: {
    timeline: { label: string; events: number; tokens: number; cost: number }[];
    models: { model: string; tokens: number; cost: number }[];
    tools: { tool: string; latency: number; calls: number; rollbackRate: number }[];
  };
  generatedAt: string;
  dataSource: "DATABASE" | "PREVIEW" | "UNAVAILABLE";
}

const iso = (value: unknown) => value instanceof Date ? value.toISOString() : String(value ?? new Date().toISOString());
const jsonObject = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const stringArray = (value: unknown): string[] => Array.isArray(value) ? value.map(String) : [];

type AuditVerificationInput = Parameters<typeof canonicalAuditPayload>[0];
export { canonicalAuditPayload, computeAuditHash, verifyAuditSignature };

const previewSeed = {
  organizations: [
    { id: 1, name: "Aurelia Financial Systems", slug: "aurelia-financial", plan: "ENTERPRISE" as const, members: 128, workspaces: 6, e2eePublicKey: "ed25519:7f:9a:enterprise" },
    { id: 2, name: "Northstar Defense Labs", slug: "northstar-defense", plan: "FEDRAMP" as const, members: 74, workspaces: 3, e2eePublicKey: "ed25519:2d:44:fedramp" },
    { id: 3, name: "Kiteworks Platform", slug: "kiteworks-platform", plan: "TEAM" as const, members: 42, workspaces: 2, e2eePublicKey: "ed25519:9c:11:team" },
  ] as EnterpriseOrganization[],
  workspaces: [
    { id: 1, orgId: 1, name: "Core Banking Monorepo", repoName: "aurelia/core-banking", syncStatus: "SYNCED" as const, e2eeStatus: "ACTIVE" as const, crdtPeers: 24, vectorClock: { "dev-lina": 182, "agent-forja": 176, "dev-marco": 169 }, lastSyncAt: "2026-08-12T10:31:14.000Z" },
    { id: 2, orgId: 1, name: "Risk Intelligence", repoName: "aurelia/risk-intelligence", syncStatus: "SYNCING" as const, e2eeStatus: "ROTATING" as const, crdtPeers: 12, vectorClock: { "dev-lina": 92, "agent-forja": 89, "dev-maya": 84 }, lastSyncAt: "2026-08-12T10:30:41.000Z" },
    { id: 3, orgId: 2, name: "Mission Systems", repoName: "northstar/mission-systems", syncStatus: "SYNCED" as const, e2eeStatus: "ACTIVE" as const, crdtPeers: 18, vectorClock: { "ops-04": 211, "agent-forja": 205 }, lastSyncAt: "2026-08-12T10:29:52.000Z" },
  ] as EnterpriseWorkspace[],
  auditLogs: [
    { id: 10421, workspaceId: 1, actorId: "agent-forja", actorType: "AI_AGENT" as const, action: "WAL_COMMITTED" as const, targetFiles: ["src/ledger/settlement.ts", "src/ledger/ledger-types.ts"], walHash: "9f7a3d1c…e12b", prevHash: "c4a91e88…7d3a", signature: "ed25519:verified:8a4d", signatureStatus: "VERIFIED" as const, createdAt: "2026-08-12T10:31:11.000Z" },
    { id: 10420, workspaceId: 1, actorId: "lina.chen", actorType: "HUMAN" as const, action: "TOOL_EXECUTED" as const, targetFiles: ["infra/terraform/prod.tf"], walHash: "c4a91e88…7d3a", prevHash: "b2d04411…112a", signature: "ed25519:verified:7c3e", signatureStatus: "VERIFIED" as const, createdAt: "2026-08-12T10:30:56.000Z" },
    { id: 10419, workspaceId: 2, actorId: "agent-forja", actorType: "AI_AGENT" as const, action: "PLAN_GENERATED" as const, targetFiles: ["src/policy/evaluator.ts"], walHash: "b2d04411…112a", prevHash: "68aa190d…be11", signature: "ed25519:verified:2f8b", signatureStatus: "VERIFIED" as const, createdAt: "2026-08-12T10:30:40.000Z" },
    { id: 10418, workspaceId: 1, actorId: "marco.silva", actorType: "HUMAN" as const, action: "ROLLBACK_TRIGGERED" as const, targetFiles: ["src/payments/settlement.ts"], walHash: "68aa190d…be11", prevHash: "ad91cc42…6f01", signature: "ed25519:verified:1a4c", signatureStatus: "VERIFIED" as const, createdAt: "2026-08-12T10:30:18.000Z" },
    { id: 10417, workspaceId: 3, actorId: "agent-forja", actorType: "AI_AGENT" as const, action: "SANDBOX_TRAPPED" as const, targetFiles: ["plugins/sonar-wasm/main.wasm"], walHash: "ad91cc42…6f01", prevHash: "5ea20f71…a62d", signature: "ed25519:verified:0d91", signatureStatus: "VERIFIED" as const, createdAt: "2026-08-12T10:29:44.000Z" },
    { id: 10416, workspaceId: 1, actorId: "lina.chen", actorType: "HUMAN" as const, action: "TOOL_EXECUTED" as const, targetFiles: ["src/auth/permissions.ts", "src/auth/roles.ts"], walHash: "5ea20f71…a62d", prevHash: null, signature: "ed25519:verified:8f02", signatureStatus: "VERIFIED" as const, createdAt: "2026-08-12T10:29:31.000Z" },
  ],
  policies: [
    { id: 1, orgId: 1, role: "junior_dev" as const, resource: "state:EXECUTING_TOOL", effect: "REQUIRE_HUMAN_APPROVAL" as const, conditions: { env: "production", fileImpact: ">10" }, updatedAt: "2026-08-11T18:22:00.000Z" },
    { id: 2, orgId: 1, role: "senior_dev" as const, resource: "tool:aws_deploy", effect: "ALLOW" as const, conditions: { env: "staging" }, updatedAt: "2026-08-11T18:20:00.000Z" },
    { id: 3, orgId: 1, role: "junior_dev" as const, resource: "tool:filesystem_write", effect: "REQUIRE_HUMAN_APPROVAL" as const, conditions: { maxFileImpact: 25 }, updatedAt: "2026-08-11T17:54:00.000Z" },
    { id: 4, orgId: 1, role: "ciso" as const, resource: "tool:aws_deploy", effect: "ALLOW" as const, conditions: { env: "production", mfa: true }, updatedAt: "2026-08-10T16:02:00.000Z" },
    { id: 5, orgId: 1, role: "admin" as const, resource: "tool:plugin_install", effect: "DENY" as const, conditions: { status: "QUARANTINED" }, updatedAt: "2026-08-10T12:44:00.000Z" },
  ] as EnterprisePolicy[],
  plugins: [
    { id: 1, orgId: 1, name: "forja-sonar-scanner", version: "2.4.1", wasmDigest: "sha256:9fa1…b881", status: "VERIFIED" as const, enabled: true, capabilities: ["fs_read", "fs_write"], signer: "security-ci@aurelia", sigstoreBundle: "rekor://entry/8c2d7a…", verifiedAt: "2026-08-12T08:20:00.000Z" },
    { id: 2, orgId: 1, name: "forja-secret-redactor", version: "1.8.0", wasmDigest: "sha256:41dc…9e10", status: "VERIFIED" as const, enabled: true, capabilities: ["fs_read"], signer: "platform-ci@aurelia", sigstoreBundle: "rekor://entry/39d1aa…", verifiedAt: "2026-08-12T07:44:00.000Z" },
    { id: 3, orgId: 2, name: "forja-terraform-guard", version: "0.9.4", wasmDigest: "sha256:8a20…4f12", status: "VERIFIED" as const, enabled: false, capabilities: ["fs_read", "net_http"], signer: "infra-ci@northstar", sigstoreBundle: "rekor://entry/0bc920…", verifiedAt: "2026-08-11T22:11:00.000Z" },
    { id: 4, orgId: 1, name: "legacy-native-bridge", version: "0.3.2", wasmDigest: "sha256:77e1…aa20", status: "QUARANTINED" as const, enabled: false, capabilities: ["env_vars"], signer: "unknown", sigstoreBundle: "rekor://pending/rejected", verifiedAt: "2026-08-11T20:04:00.000Z" },
  ] as EnterprisePlugin[],
  jobs: [
    { id: 81, name: "JS → TS / core-ledger", workspaceId: 1, sourceLanguage: "JS", targetLanguage: "TS", totalFiles: 500, processedFiles: 436, progress: 87, status: "RUNNING" as const, createdAt: "2026-08-12T10:02:00.000Z" },
    { id: 80, name: "Normalize policy imports", workspaceId: 2, sourceLanguage: "TS", targetLanguage: "TS", totalFiles: 84, processedFiles: 84, progress: 100, status: "COMMITTED" as const, createdAt: "2026-08-12T08:12:00.000Z" },
    { id: 79, name: "Rollback unsafe plugin migration", workspaceId: 3, sourceLanguage: "WASM", targetLanguage: "WASM", totalFiles: 12, processedFiles: 12, progress: 100, status: "ROLLED_BACK" as const, createdAt: "2026-08-11T23:14:00.000Z" },
  ] as EnterpriseJob[],
  walEntries: [
    { id: 9901, jobId: 81, operationType: "UPDATE" as const, filePath: "src/ledger/settlement.js", beforeHash: "a10e…2b0f", afterHash: "98ad…f03a", status: "APPLIED" as const, createdAt: "2026-08-12T10:30:58.000Z" },
    { id: 9900, jobId: 81, operationType: "RENAME" as const, filePath: "src/ledger/ledger-types.ts", beforeHash: "1c02…7ad1", afterHash: "f91d…11e0", status: "APPLIED" as const, createdAt: "2026-08-12T10:30:54.000Z" },
    { id: 9899, jobId: 81, operationType: "UPDATE" as const, filePath: "src/ledger/fee-engine.js", beforeHash: "5a99…12af", afterHash: "2dd2…8f11", status: "APPLIED" as const, createdAt: "2026-08-12T10:30:49.000Z" },
    { id: 9888, jobId: 79, operationType: "UPDATE" as const, filePath: "plugins/legacy/main.wasm", beforeHash: "33cd…a1e8", afterHash: null, status: "ROLLED_BACK" as const, createdAt: "2026-08-11T23:18:09.000Z" },
  ] as EnterpriseWalEntry[],
  securityEvents: [
    { id: 7401, eventType: "SANDBOX_VIOLATION" as const, severity: "CRITICAL" as const, source: "legacy-native-bridge / main.wasm", actionTaken: "Plugin trapped and quarantined", resolved: false, createdAt: "2026-08-12T10:29:42.000Z" },
    { id: 7400, eventType: "SECRET_DETECTED" as const, severity: "HIGH" as const, source: "src/config/deploy.ts:88", actionTaken: "Token redacted before inference", resolved: true, createdAt: "2026-08-12T10:27:21.000Z" },
    { id: 7399, eventType: "PROMPT_INJECTION" as const, severity: "HIGH" as const, source: "README.md:214", actionTaken: "Instruction blocked by toxic-context filter", resolved: false, createdAt: "2026-08-12T10:24:07.000Z" },
    { id: 7398, eventType: "SECRET_DETECTED" as const, severity: "MEDIUM" as const, source: "tests/fixtures/aws.txt:12", actionTaken: "Fixture excluded from Graph-RAG", resolved: true, createdAt: "2026-08-12T10:18:14.000Z" },
    { id: 7397, eventType: "SANDBOX_VIOLATION" as const, severity: "MEDIUM" as const, source: "forja-sonar-scanner / fs_open", actionTaken: "Capability denied", resolved: true, createdAt: "2026-08-12T10:16:30.000Z" },
  ] as EnterpriseSecurityEvent[],
  graphNodes: [
    { id: 1, label: "SettlementEngine", language: "TypeScript", symbolType: "class", x: 20, y: 46, embeddingState: "ENCRYPTED" as const },
    { id: 2, label: "RiskPolicy", language: "Rust", symbolType: "struct", x: 46, y: 20, embeddingState: "ENCRYPTED" as const },
    { id: 3, label: "AuditLedger", language: "TypeScript", symbolType: "module", x: 74, y: 42, embeddingState: "SYNCING" as const },
    { id: 4, label: "ApprovalGate", language: "TypeScript", symbolType: "function", x: 48, y: 68, embeddingState: "ENCRYPTED" as const },
    { id: 5, label: "WasmHost", language: "Rust", symbolType: "module", x: 82, y: 76, embeddingState: "LOCAL_ONLY" as const },
    { id: 6, label: "GraphIndex", language: "Python", symbolType: "service", x: 12, y: 78, embeddingState: "ENCRYPTED" as const },
  ] as EnterpriseGraphNode[],
  graphEdges: [
    { id: 1, fromNodeId: 1, toNodeId: 2, relationType: "USES", weight: 0.91 },
    { id: 2, fromNodeId: 1, toNodeId: 3, relationType: "WRITES", weight: 0.86 },
    { id: 3, fromNodeId: 2, toNodeId: 4, relationType: "GUARDS", weight: 0.78 },
    { id: 4, fromNodeId: 4, toNodeId: 3, relationType: "APPROVES", weight: 0.67 },
    { id: 5, fromNodeId: 3, toNodeId: 5, relationType: "EMITS", weight: 0.72 },
    { id: 6, fromNodeId: 6, toNodeId: 1, relationType: "INDEXES", weight: 0.84 },
  ] as EnterpriseGraphEdge[],
  trustedKeys: [
    { id: 1, orgId: 1, keyName: "aurelia-security-ci", fingerprint: "SHA256:9f7a3d1c…e12b", issuer: "Internal CI/CD", status: "ACTIVE" as const, createdAt: "2026-07-10T12:00:00.000Z" },
    { id: 2, orgId: 1, keyName: "sigstore-root-2026", fingerprint: "SHA256:c4a91e88…7d3a", issuer: "Sigstore Root", status: "ACTIVE" as const, createdAt: "2026-06-22T09:18:00.000Z" },
    { id: 3, orgId: 2, keyName: "northstar-infra-ci", fingerprint: "SHA256:68aa190d…be11", issuer: "Internal CI/CD", status: "ACTIVE" as const, createdAt: "2026-05-18T15:41:00.000Z" },
    { id: 4, orgId: 1, keyName: "legacy-signer-2024", fingerprint: "SHA256:ad91cc42…6f01", issuer: "External Vendor", status: "REVOKED" as const, createdAt: "2024-11-09T10:10:00.000Z" },
  ] as EnterpriseTrustedKey[],
  members: [] as Array<{ id: number; workspaceId: number; userId: number; inviteEmail: string; role: PolicyRole; status: "INVITED" | "ACTIVE"; invitedAt: string }>,
};

const timeline = [
  ["09:00", 82, 248000, 6.12], ["09:30", 96, 271000, 6.58], ["10:00", 120, 302000, 7.42], ["10:30", 136, 338000, 8.10], ["11:00", 112, 291000, 7.03], ["11:30", 148, 362000, 8.91], ["12:00", 162, 391000, 9.44],
] as const;

function updateRunningJobs() {
  const now = Date.now();
  for (const job of previewSeed.jobs) {
    if (job.status !== "RUNNING") continue;
    const elapsedMinutes = Math.max(0, Math.floor((now - new Date(job.createdAt).getTime()) / 60000));
    const nextProgress = Math.min(96, Math.max(job.progress, 87 + elapsedMinutes * 2));
    job.progress = nextProgress;
    job.processedFiles = Math.min(job.totalFiles, Math.floor(job.totalFiles * nextProgress / 100));
    if (job.progress >= 96) {
      job.status = "COMMITTED";
      job.progress = 100;
      job.processedFiles = job.totalFiles;
    }
  }
}

export async function getEnterpriseSnapshot(orgId?: number): Promise<EnterpriseSnapshot> {
  const db = await getDb();
  if (!db) updateRunningJobs();
  if (db) {
    try {
      const [dbOrgs, dbWorkspaces, dbMembers, dbAudit, dbPolicies, dbPlugins, dbJobs, dbWal, dbSecurity, dbNodes, dbEdges, dbKeys, dbTokenUsage, dbToolMetrics] = await Promise.all([
        orgId ? db.select().from(organizations).where(eq(organizations.id, orgId)) : db.select().from(organizations),
        orgId ? db.select().from(workspaces).where(eq(workspaces.orgId, orgId)) : db.select().from(workspaces),
        db.select().from(workspaceMembers),
        orgId ? db.select().from(auditLogs).where(eq(auditLogs.orgId, orgId)) : db.select().from(auditLogs),
        orgId ? db.select().from(rbacPolicies).where(eq(rbacPolicies.orgId, orgId)) : db.select().from(rbacPolicies),
        orgId ? db.select().from(plugins).where(eq(plugins.orgId, orgId)) : db.select().from(plugins),
        orgId ? db.select().from(refactorJobs).where(eq(refactorJobs.orgId, orgId)) : db.select().from(refactorJobs),
        db.select().from(walEntries),
        orgId ? db.select().from(securityEvents).where(eq(securityEvents.orgId, orgId)) : db.select().from(securityEvents),
        db.select().from(graphNodes),
        db.select().from(graphEdges),
        orgId ? db.select().from(trustedKeys).where(eq(trustedKeys.orgId, orgId)) : db.select().from(trustedKeys),
        orgId ? db.select().from(tokenUsage).where(eq(tokenUsage.orgId, orgId)) : db.select().from(tokenUsage),
        orgId ? db.select().from(toolMetrics).where(eq(toolMetrics.orgId, orgId)) : db.select().from(toolMetrics),
      ]);
      const workspaceIds = new Set(dbWorkspaces.map((row) => row.id));
      const jobIds = new Set(dbJobs.map((row) => row.id));
      const orgs = dbOrgs.map((row) => {
        const orgWorkspaceIds = new Set(dbWorkspaces.filter((item) => item.orgId === row.id).map((item) => item.id));
        const memberCount = dbMembers.filter((item) => orgWorkspaceIds.has(item.workspaceId)).length;
        return { id: row.id, name: row.name, slug: row.slug, plan: row.plan, members: memberCount, workspaces: orgWorkspaceIds.size, e2eePublicKey: row.e2eePublicKey };
      });
      const ws = dbWorkspaces.map((row) => ({ id: row.id, orgId: row.orgId, name: row.name, repoName: row.repoName, syncStatus: row.syncStatus, e2eeStatus: row.e2eeStatus, crdtPeers: row.crdtPeers, vectorClock: jsonObject(row.vectorClock) as Record<string, number>, lastSyncAt: iso(row.lastSyncAt) }));
      const publicKeyByOrg = new Map(dbKeys.map((key) => [key.orgId, key.publicKey]));
      const orderedAuditRows = [...dbAudit].sort((left, right) => left.id - right.id);
      const previousHashByWorkspace = new Map<number, string | null>();
      const logs = orderedAuditRows.map((row) => {
        const createdAt = iso(row.createdAt);
        const prevHash = row.prevHash ?? null;
        const expectedPreviousHash = previousHashByWorkspace.get(row.workspaceId) ?? null;
        const verification = verifyAuditSignature({ workspaceId: row.workspaceId, actorId: row.actorId, actorType: row.actorType, action: row.action, targetFiles: stringArray(row.targetFiles), prevHash, createdAt, walHash: row.walHash, signature: row.signature }, publicKeyByOrg.get(row.orgId));
        const chainValid = prevHash === expectedPreviousHash && verification.hashValid;
        previousHashByWorkspace.set(row.workspaceId, row.walHash);
        return { id: row.id, workspaceId: row.workspaceId, actorId: row.actorId, actorType: row.actorType, action: row.action, targetFiles: stringArray(row.targetFiles), walHash: row.walHash, prevHash, signature: row.signature, signatureStatus: chainValid ? verification.signatureStatus : "INVALID" as const, chainStatus: chainValid ? "VALID" as const : "INVALID" as const, createdAt };
      });
      const policies = dbPolicies.map((row) => ({ id: row.id, orgId: row.orgId, role: row.role, resource: row.resource, effect: row.effect, conditions: jsonObject(row.conditions), updatedAt: iso(row.updatedAt) }));
      const pluginRows = dbPlugins.map((row) => ({ id: row.id, orgId: row.orgId, name: row.name, version: row.version, wasmDigest: row.wasmDigest, status: row.status, enabled: row.enabled, capabilities: stringArray(row.capabilities), signer: row.signer, sigstoreBundle: row.sigstoreBundle, verifiedAt: iso(row.verifiedAt) }));
      const jobs = dbJobs.map((row) => ({ id: row.id, name: row.name, workspaceId: row.workspaceId, sourceLanguage: row.sourceLanguage, targetLanguage: row.targetLanguage, totalFiles: row.totalFiles, processedFiles: row.processedFiles, progress: row.progress, status: row.status, createdAt: iso(row.createdAt) }));
      const wal = dbWal.filter((row) => jobIds.has(row.jobId)).map((row) => ({ id: row.id, jobId: row.jobId, operationType: row.operationType, filePath: row.filePath, beforeHash: row.beforeHash ?? null, afterHash: row.afterHash ?? null, status: row.status, createdAt: iso(row.createdAt) }));
      const security = dbSecurity.map((row) => ({ id: row.id, orgId: row.orgId, eventType: row.eventType, severity: row.severity, source: row.source, actionTaken: row.actionTaken, resolved: row.resolved, createdAt: iso(row.createdAt) }));
      const nodes = dbNodes.filter((row) => workspaceIds.has(row.workspaceId)).map((row) => ({ id: row.id, workspaceId: row.workspaceId, label: row.label, language: row.language, symbolType: row.symbolType, x: row.x, y: row.y, embeddingState: row.embeddingState }));
      const edges = dbEdges.filter((row) => workspaceIds.has(row.workspaceId)).map((row) => ({ id: row.id, workspaceId: row.workspaceId, fromNodeId: row.fromNodeId, toNodeId: row.toNodeId, relationType: row.relationType, weight: row.weight }));
      const keys = dbKeys.map((row) => ({ id: row.id, orgId: row.orgId, keyName: row.keyName, fingerprint: row.fingerprint, issuer: row.issuer, status: row.status, createdAt: iso(row.createdAt) }));
      return buildSnapshot(orgs, ws, logs, policies, pluginRows, jobs, wal, security, nodes, edges, keys, "DATABASE", summarizeAnalytics(dbTokenUsage, dbToolMetrics, dbAudit));
    } catch (error) {
      console.warn("[Enterprise] Database snapshot failed; preview mode is active:", error);
    }
  }
  if (process.env.NODE_ENV === "production" && process.env.FORJA_PREVIEW_MODE !== "true") {
    return buildSnapshot([], [], [], [], [], [], [], [], [], [], [], "UNAVAILABLE", { timeline: [], models: [], tools: [] });
  }
  const scopedPreviewSeed = orgId
    ? {
        organizations: previewSeed.organizations.filter((item) => item.id === orgId),
        workspaces: previewSeed.workspaces.filter((item) => item.orgId === orgId),
        policies: previewSeed.policies.filter((item) => item.orgId === orgId),
      }
    : { organizations: previewSeed.organizations, workspaces: previewSeed.workspaces, policies: previewSeed.policies };
  const workspaceIds = new Set(scopedPreviewSeed.workspaces.map((workspace) => workspace.id));
  const scopedJobs = previewSeed.jobs.filter((job) => workspaceIds.has(job.workspaceId));
  const jobIds = new Set(scopedJobs.map((job) => job.id));
  const scopedPlugins = orgId ? previewSeed.plugins.filter((item) => item.orgId === orgId) : previewSeed.plugins;
  const scopedSecurityEvents = orgId ? previewSeed.securityEvents.filter((item) => (item.orgId ?? 1) === orgId) : previewSeed.securityEvents;
  const scopedTrustedKeys = orgId ? previewSeed.trustedKeys.filter((item) => item.orgId === orgId) : previewSeed.trustedKeys;
  return buildSnapshot(scopedPreviewSeed.organizations, scopedPreviewSeed.workspaces, previewSeed.auditLogs.filter((log) => workspaceIds.has(log.workspaceId)), scopedPreviewSeed.policies, scopedPlugins, scopedJobs, previewSeed.walEntries.filter((entry) => jobIds.has(entry.jobId)), scopedSecurityEvents, previewSeed.graphNodes.filter((node) => !node.workspaceId || workspaceIds.has(node.workspaceId)), previewSeed.graphEdges.filter((edge) => !edge.workspaceId || workspaceIds.has(edge.workspaceId)), scopedTrustedKeys, "PREVIEW");
}

function summarizeAnalytics(tokens: Array<typeof tokenUsage.$inferSelect>, tools: Array<typeof toolMetrics.$inferSelect>, audits: Array<typeof auditLogs.$inferSelect>) {
  const modelMap = new Map<string, { tokens: number; cost: number }>();
  for (const row of tokens) {
    const current = modelMap.get(row.model) ?? { tokens: 0, cost: 0 };
    modelMap.set(row.model, { tokens: current.tokens + row.totalTokens, cost: current.cost + Number(row.costUsd) });
  }
  const toolMap = new Map<string, { latency: number; calls: number; rollbackRate: number }>();
  for (const row of tools) toolMap.set(row.toolName, { latency: row.avgLatencyMs, calls: row.calls, rollbackRate: row.rollbackRate });
  const now = Date.now();
  const buckets = Array.from({ length: 7 }, (_, index) => ({ label: new Date(now - (6 - index) * 30 * 60 * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), events: 0, tokens: 0, cost: 0 }));
  const bucketIndex = (value: Date | string) => Math.max(0, Math.min(6, 6 - Math.floor((now - new Date(value).getTime()) / (30 * 60 * 1000))));
  for (const row of audits) buckets[bucketIndex(row.createdAt)].events += 1;
  for (const row of tokens) { const index = bucketIndex(row.createdAt); buckets[index].tokens += row.totalTokens; buckets[index].cost += Number(row.costUsd); }
  return {
    timeline: buckets,
    models: Array.from(modelMap.entries()).map(([model, value]) => ({ model, ...value })),
    tools: Array.from(toolMap.entries()).map(([tool, value]) => ({ tool, ...value })),
  };
}

function buildSnapshot(organizationsValue: EnterpriseOrganization[], workspacesValue: EnterpriseWorkspace[], auditLogsValue: EnterpriseAuditLog[], policiesValue: EnterprisePolicy[], pluginsValue: EnterprisePlugin[], jobsValue: EnterpriseJob[], walEntriesValue: EnterpriseWalEntry[], securityEventsValue: EnterpriseSecurityEvent[], graphNodesValue: EnterpriseGraphNode[], graphEdgesValue: EnterpriseGraphEdge[], trustedKeysValue: EnterpriseTrustedKey[], dataSource: EnterpriseSnapshot["dataSource"], analyticsOverride?: EnterpriseSnapshot["analytics"]): EnterpriseSnapshot {
  const activeJobs = jobsValue.filter((job) => job.status === "RUNNING" || job.status === "PENDING").length;
  const protectedFiles = new Set(auditLogsValue.flatMap((log) => log.targetFiles)).size;
  const validAuditLogs = auditLogsValue.filter((log) => log.signatureStatus === "VERIFIED" && log.chainStatus !== "INVALID").length;
  const recentAuditLogs = auditLogsValue.filter((log) => Date.now() - new Date(log.createdAt).getTime() <= 60_000).length;
  const previewAnalytics = {
    timeline: timeline.map(([label, events, tokens, cost]) => ({ label, events, tokens, cost })),
    models: [{ model: "claude-sonnet-4", tokens: 912000, cost: 18.44 }, { model: "gpt-5-codex", tokens: 641000, cost: 14.12 }, { model: "forja-local-32b", tokens: 318000, cost: 0.82 }, { model: "gemini-2.5-pro", tokens: 183000, cost: 4.20 }],
    tools: [{ tool: "filesystem_write", latency: 182, calls: 1821, rollbackRate: 1.4 }, { tool: "aws_deploy", latency: 426, calls: 436, rollbackRate: 0.9 }, { tool: "semantic_search", latency: 74, calls: 4201, rollbackRate: 0.1 }, { tool: "plugin_execute", latency: 219, calls: 992, rollbackRate: 2.2 }],
  };
  return {
    metrics: {
      activeTransactions: activeJobs,
      auditEventsPerSecond: recentAuditLogs / 60,
      sandboxedPlugins: pluginsValue.filter((plugin) => plugin.enabled && plugin.status === "VERIFIED").length,
      fsmState: jobsValue.some((job) => job.status === "RUNNING") ? "EXECUTING_TOOL" : jobsValue.some((job) => job.status === "PENDING") ? "AWAITING_APPROVAL" : "IDLE",
      merkleIntegrity: auditLogsValue.length ? Math.round((validAuditLogs / auditLogsValue.length) * 100) : 0,
      protectedFiles,
    },
    organizations: organizationsValue,
    workspaces: workspacesValue,
    auditLogs: auditLogsValue,
    policies: policiesValue,
    plugins: pluginsValue,
    jobs: jobsValue,
    walEntries: walEntriesValue,
    securityEvents: securityEventsValue,
    graphNodes: graphNodesValue,
    graphEdges: graphEdgesValue,
    trustedKeys: trustedKeysValue,
    analytics: analyticsOverride ?? previewAnalytics,
    generatedAt: new Date().toISOString(),
    dataSource,
  };
}

export function evaluatePolicy(policies: EnterprisePolicy[], input: { orgId?: number; role: PolicyRole; resource: string; conditions?: Record<string, unknown> }) {
  const matches = policies.filter((policy) => (!input.orgId || !policy.orgId || policy.orgId === input.orgId) && policy.role === input.role && (policy.resource === input.resource || (policy.resource.endsWith("*") && input.resource.startsWith(policy.resource.slice(0, -1))))).sort((left, right) => right.resource.length - left.resource.length);
  const selected = matches[0];
  if (!selected) return { effect: "DENY" as const, matchedPolicyId: null, reason: "No matching policy" };
  const conditionsMatch = Object.entries(selected.conditions ?? {}).every(([key, value]) => input.conditions?.[key] === value);
  if (!conditionsMatch) return { effect: "DENY" as const, matchedPolicyId: selected.id, reason: "Policy conditions not satisfied" };
  return { effect: selected.effect, matchedPolicyId: selected.id, reason: `Matched ${selected.resource}` };
}

export function enforcePolicy(policies: EnterprisePolicy[], input: { orgId?: number; role: PolicyRole; resource: string; humanApproved?: boolean; conditions?: Record<string, unknown> }) {
  const decision = evaluatePolicy(policies, input);
  const adminBreakGlass = input.role === "admin" && decision.effect === "DENY" && decision.matchedPolicyId === null;
  if (decision.effect === "DENY" && !adminBreakGlass) throw new TRPCError({ code: "FORBIDDEN", message: `RBAC DENY for ${input.resource}: ${decision.reason}` });
  if (decision.effect === "REQUIRE_HUMAN_APPROVAL" && !input.humanApproved) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `REQUIRE_HUMAN_APPROVAL for ${input.resource}` });
  return { ...decision, effect: adminBreakGlass ? "ALLOW" as const : decision.effect, reason: adminBreakGlass ? "Admin break-glass: no explicit policy" : decision.reason };
}

async function enforceDatabaseMutation(input: { orgId: number; role: PolicyRole; resource: string; humanApproved?: boolean }) {
  const snapshot = await getEnterpriseSnapshot(input.orgId);
  return enforcePolicy(snapshot.policies, input);
}

async function assertWorkspaceBelongsToOrg(workspaceId: number, orgId: number) {
  const db = await getDb();
  if (db) {
    const row = (await db.select({ id: workspaces.id }).from(workspaces).where(and(eq(workspaces.id, workspaceId), eq(workspaces.orgId, orgId))).limit(1))[0];
    if (!row) throw new TRPCError({ code: "FORBIDDEN", message: "Workspace is outside the authenticated organization" });
    return;
  }
  if (!previewSeed.workspaces.some((workspace) => workspace.id === workspaceId && workspace.orgId === orgId)) throw new TRPCError({ code: "FORBIDDEN", message: "Workspace is outside the authenticated organization" });
}

export async function createPolicy(input: { orgId: number; role: PolicyRole; resource: string; effect: PolicyEffect; conditions?: Record<string, unknown>; actorRole?: PolicyRole; humanApproved?: boolean }) {
  await enforceDatabaseMutation({ orgId: input.orgId, role: input.actorRole ?? "admin", resource: "policy:manage", humanApproved: input.humanApproved });
  const policy: EnterprisePolicy = { id: Math.max(0, ...previewSeed.policies.map((item) => item.id)) + 1, orgId: input.orgId, role: input.role, resource: input.resource, effect: input.effect, conditions: input.conditions ?? {}, updatedAt: new Date().toISOString() };
  previewSeed.policies.unshift(policy);
  const db = await getDb();
  if (db) {
    try { await db.insert(rbacPolicies).values({ orgId: input.orgId, role: input.role, resource: input.resource, effect: input.effect, conditions: input.conditions ?? {} }); } catch (error) { console.warn("[Enterprise] Policy persistence failed:", error); }
  }
  return policy;
}

export async function updatePolicy(input: { id: number; orgId?: number; role: PolicyRole; resource: string; effect: PolicyEffect; conditions?: Record<string, unknown>; actorRole?: PolicyRole; humanApproved?: boolean }) {
  const orgId = input.orgId ?? 1;
  await enforceDatabaseMutation({ orgId, role: input.actorRole ?? "admin", resource: "policy:manage", humanApproved: input.humanApproved });
  const updatedAt = new Date().toISOString();
  const previewPolicy = previewSeed.policies.find((item) => item.id === input.id && item.orgId === orgId);
  if (previewPolicy) Object.assign(previewPolicy, { role: input.role, resource: input.resource, effect: input.effect, conditions: input.conditions ?? {}, updatedAt });
  const db = await getDb();
  if (db) {
    const existing = (await db.select({ id: rbacPolicies.id }).from(rbacPolicies).where(and(eq(rbacPolicies.id, input.id), eq(rbacPolicies.orgId, orgId))).limit(1))[0];
    if (!existing && !previewPolicy) return null;
    try { await db.update(rbacPolicies).set({ role: input.role, resource: input.resource, effect: input.effect, conditions: input.conditions ?? {} }).where(and(eq(rbacPolicies.id, input.id), eq(rbacPolicies.orgId, orgId))); } catch (error) { console.warn("[Enterprise] Policy update failed:", error); }
  }
  return previewPolicy ?? null;
}

export async function deletePolicy(input: { id: number; orgId?: number; actorRole?: PolicyRole; humanApproved?: boolean }) {
  const orgId = input.orgId ?? 1;
  await enforceDatabaseMutation({ orgId, role: input.actorRole ?? "admin", resource: "policy:manage", humanApproved: input.humanApproved });
  const owned = previewSeed.policies.some((item) => item.id === input.id && item.orgId === orgId);
  previewSeed.policies = previewSeed.policies.filter((item) => item.id !== input.id || item.orgId !== orgId);
  const db = await getDb();
  if (db) {
    const existing = (await db.select({ id: rbacPolicies.id }).from(rbacPolicies).where(and(eq(rbacPolicies.id, input.id), eq(rbacPolicies.orgId, orgId))).limit(1))[0];
    if (!existing && !owned) return { success: false };
    try { await db.delete(rbacPolicies).where(and(eq(rbacPolicies.id, input.id), eq(rbacPolicies.orgId, orgId))); } catch (error) { console.warn("[Enterprise] Policy delete fallback:", error); }
  }
  return { success: owned || Boolean(db) };
}

export async function createPlugin(input: { orgId: number; name: string; version: string; wasmDigest: string; signer: string; sigstoreBundle: string; capabilities: string[]; actorRole?: PolicyRole; humanApproved?: boolean }) {
  await enforceDatabaseMutation({ orgId: input.orgId, role: input.actorRole ?? "admin", resource: "plugin:register", humanApproved: input.humanApproved });
  const now = new Date().toISOString();
  const memoryPlugin: EnterprisePlugin = { id: Math.max(0, ...previewSeed.plugins.map((item) => item.id)) + 1, orgId: input.orgId, name: input.name, version: input.version, wasmDigest: input.wasmDigest, status: "VERIFIED", enabled: true, capabilities: input.capabilities, signer: input.signer, sigstoreBundle: input.sigstoreBundle, verifiedAt: now };
  const db = await getDb();
  if (db) {
    try {
      const result = await db.insert(plugins).values({ orgId: input.orgId, name: input.name, version: input.version, wasmDigest: input.wasmDigest, status: "VERIFIED", enabled: true, capabilities: input.capabilities, signer: input.signer, sigstoreBundle: input.sigstoreBundle });
      return { ...memoryPlugin, id: Number((result as any).insertId ?? memoryPlugin.id) };
    } catch (error) { console.warn("[Enterprise] Plugin registration failed; preview only:", error); }
  }
  previewSeed.plugins.unshift(memoryPlugin);
  return memoryPlugin;
}

export async function togglePlugin(input: { id: number; orgId?: number; actorRole?: PolicyRole; humanApproved?: boolean }) {
  const orgId = input.orgId ?? 1;
  await enforceDatabaseMutation({ orgId, role: input.actorRole ?? "admin", resource: "plugin:toggle", humanApproved: input.humanApproved });
  const db = await getDb();
  if (db) {
    const current = (await db.select().from(plugins).where(and(eq(plugins.id, input.id), eq(plugins.orgId, orgId))).limit(1))[0];
    if (!current) return null;
    const enabled = !current.enabled;
    try { await db.update(plugins).set({ enabled }).where(and(eq(plugins.id, input.id), eq(plugins.orgId, orgId))); } catch (error) { console.warn("[Enterprise] Plugin toggle persistence failed:", error); }
    return { id: current.id, orgId, name: current.name, version: current.version, wasmDigest: current.wasmDigest, status: current.status, enabled, capabilities: stringArray(current.capabilities), signer: current.signer, sigstoreBundle: current.sigstoreBundle, verifiedAt: iso(current.verifiedAt) };
  }
  const plugin = previewSeed.plugins.find((item) => item.id === input.id && item.orgId === orgId);
  if (!plugin) return null;
  plugin.enabled = !plugin.enabled;
  return plugin;
}

export async function createOrganization(input: { name: string; plan: EnterpriseOrganization["plan"]; actorRole?: PolicyRole; humanApproved?: boolean }) {
  await enforceDatabaseMutation({ orgId: 1, role: input.actorRole ?? "admin", resource: "organization:create", humanApproved: input.humanApproved });
  const id = Math.max(0, ...previewSeed.organizations.map((item) => item.id)) + 1;
  const org = { id, name: input.name, slug: `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id}`, plan: input.plan, members: 1, workspaces: 0, e2eePublicKey: `ed25519:pending:${randomUUID().slice(0, 8)}` } satisfies EnterpriseOrganization;
  previewSeed.organizations.unshift(org);
  const db = await getDb();
  if (db) { try { await db.insert(organizations).values({ name: org.name, slug: org.slug, plan: org.plan, e2eePublicKey: org.e2eePublicKey }); } catch (error) { console.warn("[Enterprise] Organization persisted only in preview memory:", error); } }
  return org;
}

export async function createRefactorJob(input: { orgId?: number; name: string; workspaceId: number; sourceLanguage: string; targetLanguage: string; totalFiles: number; actorRole?: PolicyRole; humanApproved?: boolean }) {
  const orgId = input.orgId ?? 1;
  await enforceDatabaseMutation({ orgId, role: input.actorRole ?? "admin", resource: "job:refactor", humanApproved: input.humanApproved });
  await assertWorkspaceBelongsToOrg(input.workspaceId, orgId);
  const now = new Date().toISOString();
  const memoryId = Math.max(0, ...previewSeed.jobs.map((item) => item.id)) + 1;
  const memoryJob: EnterpriseJob = { id: memoryId, name: input.name, workspaceId: input.workspaceId, sourceLanguage: input.sourceLanguage, targetLanguage: input.targetLanguage, totalFiles: input.totalFiles, processedFiles: 0, progress: 0, status: "PENDING", createdAt: now };
  const memoryWal: EnterpriseWalEntry = { id: Math.max(0, ...previewSeed.walEntries.map((item) => item.id)) + 1, jobId: memoryId, operationType: "UPDATE", filePath: `workspace-${input.workspaceId}/.forja/wal/manifest.json`, beforeHash: null, afterHash: null, status: "PENDING", createdAt: now };
  const db = await getDb();
  if (db) {
    try {
      const result = await db.insert(refactorJobs).values({ orgId: input.orgId ?? 1, workspaceId: input.workspaceId, name: input.name, sourceLanguage: input.sourceLanguage, targetLanguage: input.targetLanguage, totalFiles: input.totalFiles });
      const dbJobId = Number((result as any).insertId ?? memoryId);
      await db.insert(walEntries).values({ jobId: dbJobId, operationType: "UPDATE", filePath: `workspace-${input.workspaceId}/.forja/wal/manifest.json`, beforeHash: null, afterHash: null, status: "PENDING" });
      return { ...memoryJob, id: dbJobId };
    } catch (error) {
      console.warn("[Enterprise] Durable refactor job creation failed; returning preview status:", error);
    }
  }
  previewSeed.jobs.unshift(memoryJob);
  previewSeed.walEntries.unshift(memoryWal);
  return memoryJob;
}

export async function advanceRefactorJob(input: { id: number; orgId?: number; actorRole?: PolicyRole; humanApproved?: boolean }) {
  const orgId = input.orgId ?? 1;
  await enforceDatabaseMutation({ orgId, role: input.actorRole ?? "admin", resource: "job:refactor", humanApproved: input.humanApproved });
  const id = input.id;
  const db = await getDb();
  if (db) {
    const current = (await db.select().from(refactorJobs).where(and(eq(refactorJobs.id, id), eq(refactorJobs.orgId, orgId))).limit(1))[0];
    if (!current) return null;
    const nextProgress = current.status === "PENDING" ? 10 : Math.min(100, current.progress + 10);
    const nextStatus = nextProgress >= 100 ? "COMMITTED" as const : "RUNNING" as const;
    const processedFiles = Math.min(current.totalFiles, Math.floor(current.totalFiles * nextProgress / 100));
    const afterHash = createHash("sha256").update(`${id}:${processedFiles}`).digest("hex");
    await db.update(refactorJobs).set({ status: nextStatus, progress: nextProgress, processedFiles, startedAt: current.startedAt ?? new Date(), finishedAt: nextStatus === "COMMITTED" ? new Date() : null }).where(eq(refactorJobs.id, id));
    await db.insert(walEntries).values({ jobId: id, operationType: "UPDATE", filePath: `.forja/wal/job-${id}/batch-${nextProgress}.json`, beforeHash: null, afterHash, status: nextStatus === "COMMITTED" ? "APPLIED" : "PENDING" });
    return { id, progress: nextProgress, processedFiles, status: nextStatus, walHash: afterHash };
  }
  const job = previewSeed.jobs.find((item) => item.id === id && previewSeed.workspaces.some((workspace) => workspace.id === item.workspaceId && workspace.orgId === orgId));
  if (!job) return null;
  job.progress = Math.min(100, job.progress + 10);
  job.processedFiles = Math.min(job.totalFiles, Math.floor(job.totalFiles * job.progress / 100));
  job.status = job.progress >= 100 ? "COMMITTED" : "RUNNING";
  const wal = previewSeed.walEntries.find((item) => item.jobId === id);
  if (wal) wal.status = job.status === "COMMITTED" ? "APPLIED" : "PENDING";
  previewSeed.walEntries.unshift({ id: Math.max(0, ...previewSeed.walEntries.map((item) => item.id)) + 1, jobId: id, operationType: "UPDATE", filePath: `.forja/wal/job-${id}/batch-${job.progress}.json`, beforeHash: null, afterHash: createHash("sha256").update(`${id}:${job.processedFiles}`).digest("hex"), status: job.status === "COMMITTED" ? "APPLIED" : "PENDING", createdAt: new Date().toISOString() });
  return { id, progress: job.progress, processedFiles: job.processedFiles, status: job.status };
}

export async function resolveSecurityEvent(input: { id: number; orgId?: number; actorRole?: PolicyRole; humanApproved?: boolean }) {
  const orgId = input.orgId ?? 1;
  await enforceDatabaseMutation({ orgId, role: input.actorRole ?? "admin", resource: "security:event_resolve", humanApproved: input.humanApproved });
  const event = orgId === 1 ? previewSeed.securityEvents.find((item) => item.id === input.id) : undefined;
  if (event) event.resolved = true;
  const db = await getDb();
  if (db) { try { await db.update(securityEvents).set({ resolved: true }).where(and(eq(securityEvents.id, input.id), eq(securityEvents.orgId, orgId))); } catch (error) { console.warn("[Enterprise] Security event resolution fallback:", error); } }
  return event ?? null;
}

export async function createTrustedKey(input: { orgId: number; keyName: string; fingerprint: string; issuer: string; publicKey: string; actorRole?: PolicyRole; humanApproved?: boolean }) {
  await enforceDatabaseMutation({ orgId: input.orgId, role: input.actorRole ?? "admin", resource: "trusted_key:manage", humanApproved: input.humanApproved });
  const id = Math.max(0, ...previewSeed.trustedKeys.map((item) => item.id)) + 1;
  const key: EnterpriseTrustedKey = { id, orgId: input.orgId, keyName: input.keyName, fingerprint: input.fingerprint, issuer: input.issuer, status: "ACTIVE", createdAt: new Date().toISOString() };
  previewSeed.trustedKeys.unshift(key);
  const db = await getDb();
  if (db) { try { await db.insert(trustedKeys).values({ orgId: input.orgId, keyName: input.keyName, fingerprint: input.fingerprint, issuer: input.issuer, publicKey: input.publicKey }); } catch (error) { console.warn("[Enterprise] Trusted key persisted only in preview memory:", error); } }
  return key;
}

export async function revokeTrustedKey(input: { id: number; orgId?: number; actorRole?: PolicyRole; humanApproved?: boolean }) {
  const orgId = input.orgId ?? 1;
  await enforceDatabaseMutation({ orgId, role: input.actorRole ?? "admin", resource: "trusted_key:manage", humanApproved: input.humanApproved });
  const key = orgId === 1 ? previewSeed.trustedKeys.find((item) => item.id === input.id) : undefined;
  if (key) key.status = "REVOKED";
  const db = await getDb();
  if (db) { try { await db.update(trustedKeys).set({ status: "REVOKED", revokedAt: new Date() }).where(and(eq(trustedKeys.id, input.id), eq(trustedKeys.orgId, orgId))); } catch (error) { console.warn("[Enterprise] Trusted key revocation fallback:", error); } }
  return key ?? null;
}

export async function listWorkspaceMembers(workspaceId: number, orgId?: number) {
  const db = await getDb();
  if (!db) {
    const workspaceAllowed = !orgId || previewSeed.workspaces.some((workspace) => workspace.id === workspaceId && workspace.orgId === orgId);
    return workspaceAllowed ? previewSeed.members.filter((member) => member.workspaceId === workspaceId) : [];
  }
  const workspace = (await db.select({ id: workspaces.id }).from(workspaces).where(orgId ? and(eq(workspaces.id, workspaceId), eq(workspaces.orgId, orgId)) : eq(workspaces.id, workspaceId)).limit(1))[0];
  if (!workspace) return [];
  return db.select({ id: workspaceMembers.id, workspaceId: workspaceMembers.workspaceId, userId: workspaceMembers.userId, inviteEmail: workspaceMembers.inviteEmail, role: workspaceMembers.role, status: workspaceMembers.status, invitedAt: workspaceMembers.invitedAt }).from(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId));
}

export async function updateWorkspaceMemberRole(input: { id: number; role: PolicyRole; orgId?: number; actorRole?: PolicyRole; humanApproved?: boolean }) {
  const orgId = input.orgId ?? 1;
  await enforceDatabaseMutation({ orgId, role: input.actorRole ?? "admin", resource: "workspace:member_role", humanApproved: input.humanApproved });
  const db = await getDb();
  if (db) {
    const current = (await db.select({ workspaceId: workspaceMembers.workspaceId }).from(workspaceMembers).where(eq(workspaceMembers.id, input.id)).limit(1))[0];
    if (!current) return null;
    await assertWorkspaceBelongsToOrg(current.workspaceId, orgId);
    await db.update(workspaceMembers).set({ role: input.role }).where(eq(workspaceMembers.id, input.id));
    const updated = (await db.select().from(workspaceMembers).where(eq(workspaceMembers.id, input.id)).limit(1))[0];
    return updated ?? null;
  }
  const member = previewSeed.members.find((item) => item.id === input.id && previewSeed.workspaces.some((workspace) => workspace.id === item.workspaceId && workspace.orgId === orgId));
  if (member) member.role = input.role;
  return member ?? null;
}

export async function inviteWorkspaceMember(input: { workspaceId: number; email: string; role: PolicyRole; orgId?: number; actorRole?: PolicyRole; humanApproved?: boolean }) {
  const orgId = input.orgId ?? 1;
  await enforceDatabaseMutation({ orgId, role: input.actorRole ?? "admin", resource: "workspace:member_invite", humanApproved: input.humanApproved });
  await assertWorkspaceBelongsToOrg(input.workspaceId, orgId);
  const db = await getDb();
  if (db) {
    try { await db.insert(workspaceMembers).values({ workspaceId: input.workspaceId, userId: 0, inviteEmail: input.email, role: input.role, status: "INVITED" }); }
    catch (error) { console.warn("[Enterprise] Invitation persistence failed:", error); return { success: false, email: input.email, role: input.role, workspaceId: input.workspaceId }; }
    return { success: true, email: input.email, role: input.role, workspaceId: input.workspaceId };
  }
  const member = { id: Math.max(0, ...previewSeed.members.map((item) => item.id)) + 1, workspaceId: input.workspaceId, userId: 0, inviteEmail: input.email, role: input.role, status: "INVITED" as const, invitedAt: new Date().toISOString() };
  previewSeed.members = [member, ...previewSeed.members];
  return { success: true, email: input.email, role: input.role, workspaceId: input.workspaceId };
}
