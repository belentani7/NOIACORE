import {
  boolean,
  decimal,
  float,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table backing the Manus authentication flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  enterpriseRole: mysqlEnum("enterpriseRole", ["junior_dev", "senior_dev", "ciso", "admin"]).default("junior_dev").notNull(),
  organizationId: int("organizationId").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  plan: mysqlEnum("plan", ["FREE", "TEAM", "ENTERPRISE", "FEDRAMP"]).default("ENTERPRISE").notNull(),
  e2eePublicKey: varchar("e2eePublicKey", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ slugIdx: index("organizations_slug_idx").on(table.slug) }));

export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  repoName: varchar("repoName", { length: 200 }).notNull(),
  syncStatus: mysqlEnum("syncStatus", ["SYNCED", "SYNCING", "DEGRADED", "OFFLINE"]).default("SYNCED").notNull(),
  e2eeStatus: mysqlEnum("e2eeStatus", ["ACTIVE", "ROTATING", "DEGRADED", "DISABLED"]).default("ACTIVE").notNull(),
  vectorClock: json("vectorClock").notNull(),
  crdtPeers: int("crdtPeers").default(0).notNull(),
  lastSyncAt: timestamp("lastSyncAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ orgIdx: index("workspaces_org_idx").on(table.orgId) }));

export const workspaceMembers = mysqlTable("workspace_members", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  userId: int("userId").notNull(),
  inviteEmail: varchar("inviteEmail", { length: 320 }),
  role: mysqlEnum("role", ["junior_dev", "senior_dev", "ciso", "admin"]).notNull(),
  status: mysqlEnum("status", ["ACTIVE", "INVITED", "SUSPENDED"]).default("ACTIVE").notNull(),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
}, (table) => ({ workspaceIdx: index("workspace_members_workspace_idx").on(table.workspaceId) }));

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  actorId: varchar("actorId", { length: 120 }).notNull(),
  actorType: mysqlEnum("actorType", ["HUMAN", "AI_AGENT"]).notNull(),
  action: mysqlEnum("action", ["PLAN_GENERATED", "TOOL_EXECUTED", "WAL_COMMITTED", "ROLLBACK_TRIGGERED", "SANDBOX_TRAPPED"]).notNull(),
  targetFiles: json("targetFiles").notNull(),
  walHash: varchar("walHash", { length: 128 }).notNull(),
  prevHash: varchar("prevHash", { length: 128 }),
  signature: varchar("signature", { length: 256 }).notNull(),
  signatureStatus: mysqlEnum("signatureStatus", ["VERIFIED", "PENDING", "INVALID"]).default("VERIFIED").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ orgTimeIdx: index("audit_logs_org_time_idx").on(table.orgId, table.createdAt), hashIdx: index("audit_logs_hash_idx").on(table.walHash) }));

export const rbacPolicies = mysqlTable("rbac_policies", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  role: mysqlEnum("role", ["junior_dev", "senior_dev", "ciso", "admin"]).notNull(),
  resource: varchar("resource", { length: 160 }).notNull(),
  effect: mysqlEnum("effect", ["ALLOW", "REQUIRE_HUMAN_APPROVAL", "DENY"]).notNull(),
  conditions: json("conditions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ policyIdx: index("rbac_policies_org_role_idx").on(table.orgId, table.role) }));

export const plugins = mysqlTable("plugins", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  version: varchar("version", { length: 40 }).notNull(),
  wasmDigest: varchar("wasmDigest", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["VERIFIED", "QUARANTINED", "REVOKED"]).default("VERIFIED").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  capabilities: json("capabilities").notNull(),
  sigstoreBundle: text("sigstoreBundle").notNull(),
  signer: varchar("signer", { length: 160 }).notNull(),
  verifiedAt: timestamp("verifiedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ pluginOrgIdx: index("plugins_org_idx").on(table.orgId) }));

export const refactorJobs = mysqlTable("refactor_jobs", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  sourceLanguage: varchar("sourceLanguage", { length: 30 }).notNull(),
  targetLanguage: varchar("targetLanguage", { length: 30 }).notNull(),
  totalFiles: int("totalFiles").notNull(),
  processedFiles: int("processedFiles").default(0).notNull(),
  status: mysqlEnum("status", ["PENDING", "RUNNING", "COMMITTED", "ROLLED_BACK"]).default("PENDING").notNull(),
  progress: int("progress").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  finishedAt: timestamp("finishedAt"),
}, (table) => ({ orgWorkspaceStatusIdx: index("refactor_jobs_org_workspace_status_idx").on(table.orgId, table.workspaceId, table.status) }));

export const walEntries = mysqlTable("wal_entries", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  operationType: mysqlEnum("operationType", ["CREATE", "UPDATE", "DELETE", "RENAME"]).notNull(),
  filePath: varchar("filePath", { length: 500 }).notNull(),
  beforeHash: varchar("beforeHash", { length: 128 }),
  afterHash: varchar("afterHash", { length: 128 }),
  status: mysqlEnum("status", ["PENDING", "APPLIED", "ROLLED_BACK"]).default("PENDING").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ jobIdx: index("wal_entries_job_idx").on(table.jobId) }));

export const securityEvents = mysqlTable("security_events", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  eventType: mysqlEnum("eventType", ["PROMPT_INJECTION", "SANDBOX_VIOLATION", "SECRET_DETECTED"]).notNull(),
  severity: mysqlEnum("severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).notNull(),
  source: varchar("source", { length: 240 }).notNull(),
  actionTaken: varchar("actionTaken", { length: 240 }).notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ securityOrgTimeIdx: index("security_events_org_time_idx").on(table.orgId, table.createdAt) }));

export const graphNodes = mysqlTable("graph_nodes", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  label: varchar("label", { length: 180 }).notNull(),
  language: varchar("language", { length: 40 }).notNull(),
  symbolType: varchar("symbolType", { length: 60 }).notNull(),
  x: float("x").notNull(),
  y: float("y").notNull(),
  embeddingState: mysqlEnum("embeddingState", ["ENCRYPTED", "SYNCING", "LOCAL_ONLY"]).default("ENCRYPTED").notNull(),
}, (table) => ({ workspaceIdx: index("graph_nodes_workspace_idx").on(table.workspaceId) }));

export const graphEdges = mysqlTable("graph_edges", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  fromNodeId: int("fromNodeId").notNull(),
  toNodeId: int("toNodeId").notNull(),
  relationType: varchar("relationType", { length: 70 }).notNull(),
  weight: float("weight").default(1).notNull(),
}, (table) => ({ workspaceFromIdx: index("graph_edges_workspace_from_idx").on(table.workspaceId, table.fromNodeId), workspaceToIdx: index("graph_edges_workspace_to_idx").on(table.workspaceId, table.toNodeId) }));

export const trustedKeys = mysqlTable("trusted_keys", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  keyName: varchar("keyName", { length: 160 }).notNull(),
  fingerprint: varchar("fingerprint", { length: 128 }).notNull(),
  issuer: varchar("issuer", { length: 160 }).notNull(),
  publicKey: text("publicKey").notNull(),
  status: mysqlEnum("status", ["ACTIVE", "REVOKED"]).default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
}, (table) => ({ trustedOrgIdx: index("trusted_keys_org_idx").on(table.orgId) }));

export const tokenUsage = mysqlTable("token_usage", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  promptTokens: int("promptTokens").default(0).notNull(),
  completionTokens: int("completionTokens").default(0).notNull(),
  totalTokens: int("totalTokens").default(0).notNull(),
  costUsd: decimal("costUsd", { precision: 10, scale: 4 }).default("0").notNull(),
  durationMs: int("durationMs").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ orgTimeIdx: index("token_usage_org_time_idx").on(table.orgId, table.createdAt) }));

export const toolMetrics = mysqlTable("tool_metrics", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  toolName: varchar("toolName", { length: 160 }).notNull(),
  calls: int("calls").default(0).notNull(),
  avgLatencyMs: int("avgLatencyMs").default(0).notNull(),
  rollbackRate: float("rollbackRate").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ orgToolIdx: index("tool_metrics_org_tool_idx").on(table.orgId, table.toolName) }));

export type Organization = typeof organizations.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type RbacPolicy = typeof rbacPolicies.$inferSelect;
export type Plugin = typeof plugins.$inferSelect;
export type RefactorJob = typeof refactorJobs.$inferSelect;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type TrustedKey = typeof trustedKeys.$inferSelect;
