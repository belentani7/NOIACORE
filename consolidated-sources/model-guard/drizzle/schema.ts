import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const policies = mysqlTable("policies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  critical: boolean("critical").default(false).notNull(),
  currentVersion: int("currentVersion").default(1).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ statusIdx: index("policies_status_idx").on(table.status) }));

export const policyVersions = mysqlTable("policy_versions", {
  id: int("id").autoincrement().primaryKey(),
  policyId: int("policyId").notNull(),
  version: int("version").notNull(),
  rulesJson: text("rulesJson").notNull(),
  changeNote: text("changeNote"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ policyIdx: index("policy_versions_policy_idx").on(table.policyId) }));

export const ledgerEntries = mysqlTable("ledger_entries", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 64 }).notNull().unique(),
  policyId: int("policyId").notNull(),
  policyVersion: int("policyVersion").notNull(),
  userId: int("userId"),
  inputJson: text("inputJson").notNull(),
  outputJson: text("outputJson").notNull(),
  result: mysqlEnum("result", ["pass", "fail"]).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("low").notNull(),
  triggeredRulesJson: text("triggeredRulesJson").notNull(),
  aiAnalysisJson: text("aiAnalysisJson"),
  previousHash: varchar("previousHash", { length: 128 }),
  entryHash: varchar("entryHash", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  createdIdx: index("ledger_created_idx").on(table.createdAt),
  policyIdx: index("ledger_policy_idx").on(table.policyId),
  resultIdx: index("ledger_result_idx").on(table.result),
}));

export const evidenceFiles = mysqlTable("evidence_files", {
  id: int("id").autoincrement().primaryKey(),
  ledgerEntryId: int("ledgerEntryId").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  storageUrl: text("storageUrl").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ ledgerIdx: index("evidence_ledger_idx").on(table.ledgerEntryId) }));

export const alertSettings = mysqlTable("alert_settings", {
  id: int("id").autoincrement().primaryKey(),
  rejectionThreshold: int("rejectionThreshold").default(25).notNull(),
  ownerEmail: varchar("ownerEmail", { length: 320 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  updatedBy: int("updatedBy").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["critical_policy", "rejection_rate", "ledger_anomaly", "system_health"]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  message: text("message").notNull(),
  ledgerEntryId: int("ledgerEntryId"),
  acknowledgedAt: timestamp("acknowledgedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ createdIdx: index("alerts_created_idx").on(table.createdAt) }));

export const scheduledJobs = mysqlTable("scheduled_jobs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  scheduleCronTaskUid: varchar("schedule_cron_task_uid", { length: 65 }),
  lastRunAt: timestamp("lastRunAt"),
  lastStatus: varchar("lastStatus", { length: 40 }),
  lastSummary: text("lastSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Policy = typeof policies.$inferSelect;
export type PolicyVersion = typeof policyVersions.$inferSelect;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;


export const modelGuardModels = mysqlTable("model_guard_models", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  provider: varchar("provider", { length: 120 }).notNull(),
  version: varchar("version", { length: 120 }).notNull(),
  lifecycle: mysqlEnum("lifecycle", ["draft", "approved", "deprecated", "blocked"]).default("draft").notNull(),
  source: varchar("source", { length: 240 }).notNull(),
  secretRef: varchar("secretRef", { length: 240 }),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ lifecycleIdx: index("model_guard_models_lifecycle_idx").on(table.lifecycle) }));

export const modelGuardContracts = mysqlTable("model_guard_contracts", {
  id: int("id").autoincrement().primaryKey(),
  modelId: int("modelId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  inputSchemaJson: text("inputSchemaJson").notNull(),
  outputSchemaJson: text("outputSchemaJson").notNull(),
  requiredChecksJson: text("requiredChecksJson").notNull(),
  status: mysqlEnum("status", ["draft", "active", "retired"]).default("draft").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ modelIdx: index("model_guard_contracts_model_idx").on(table.modelId) }));

export const modelGuardEvaluations = mysqlTable("model_guard_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  modelId: int("modelId").notNull(),
  contractId: int("contractId").notNull(),
  inputSummary: text("inputSummary").notNull(),
  outputSummary: text("outputSummary").notNull(),
  result: mysqlEnum("result", ["pass", "fail", "blocked"]).notNull(),
  risk: mysqlEnum("risk", ["low", "medium", "high", "critical"]).notNull(),
  triggeredChecksJson: text("triggeredChecksJson").notNull(),
  costMicros: int("costMicros").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ createdIdx: index("model_guard_evaluations_created_idx").on(table.createdAt) }));

export const modelGuardDriftSignals = mysqlTable("model_guard_drift_signals", {
  id: int("id").autoincrement().primaryKey(),
  modelId: int("modelId").notNull(),
  metric: varchar("metric", { length: 120 }).notNull(),
  baseline: varchar("baseline", { length: 80 }).notNull(),
  observed: varchar("observed", { length: 80 }).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).notNull(),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved"]).default("open").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const modelGuardEnvelopes = mysqlTable("model_guard_envelopes", {
  id: int("id").autoincrement().primaryKey(),
  modelId: int("modelId").notNull(),
  contractId: int("contractId").notNull(),
  evaluationCount: int("evaluationCount").default(0).notNull(),
  passRate: varchar("passRate", { length: 40 }).notNull(),
  driftStatus: mysqlEnum("driftStatus", ["clear", "watch", "blocked"]).notNull(),
  lineageJson: text("lineageJson").notNull(),
  readiness: mysqlEnum("readiness", ["not_ready", "review", "ready"]).default("not_ready").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
