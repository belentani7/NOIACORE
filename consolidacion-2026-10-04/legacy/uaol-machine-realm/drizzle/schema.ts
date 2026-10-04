import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Identity record supplied by the platform authentication flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "client", "operator", "supervisor", "auditor", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const agentTasks = mysqlTable("agent_tasks", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  intent: text("intent").notNull(),
  status: mysqlEnum("status", ["draft", "planning", "simulating", "observing", "verifying", "closed", "blocked"])
    .default("draft")
    .notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("low").notNull(),
  executionMode: mysqlEnum("executionMode", ["manual", "autonomous"]).default("manual").notNull(),
  simulationOnly: boolean("simulationOnly").default(true).notNull(),
  planJson: json("planJson"),
  summary: text("summary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export const taskEvents = mysqlTable("task_events", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  stage: mysqlEnum("stage", ["intent", "planning", "execution", "observation", "verification", "closure"])
    .notNull(),
  outcome: mysqlEnum("outcome", ["info", "success", "warning", "failure", "blocked"]).default("info").notNull(),
  message: text("message").notNull(),
  evidenceJson: json("evidenceJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const realmMachines = mysqlTable("realm_machines", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  machineKey: varchar("machineKey", { length: 64 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  area: varchar("area", { length: 120 }).notNull(),
  state: mysqlEnum("state", ["offline", "standby", "idle", "calibrating", "starting", "operating", "paused", "maintenance", "stopped", "error", "emergency"])
    .default("standby")
    .notNull(),
  operationMode: mysqlEnum("operationMode", ["manual", "autonomous"]).default("manual").notNull(),
  sensorsJson: json("sensorsJson"),
  actuatorsJson: json("actuatorsJson"),
  setpointsJson: json("setpointsJson"),
  connectionStatus: mysqlEnum("connectionStatus", ["connected", "disconnected", "fault"]).default("connected").notNull(),
  runtimeSeconds: int("runtimeSeconds").default(0).notNull(),
  cycleCount: int("cycleCount").default(0).notNull(),
  currentLoad: int("currentLoad").default(0).notNull(),
  currentSpeed: int("currentSpeed").default(0).notNull(),
  simulatedLatencyMs: int("simulatedLatencyMs").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const telemetrySnapshots = mysqlTable("telemetry_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  machineId: int("machineId").notNull(),
  temperature: int("temperature").notNull(),
  pressure: int("pressure").notNull(),
  vibration: int("vibration").notNull(),
  energy: int("energy").notNull(),
  quality: int("quality").notNull(),
  load: int("load").default(0).notNull(),
  speed: int("speed").default(0).notNull(),
  cycleCount: int("cycleCount").default(0).notNull(),
  runtimeSeconds: int("runtimeSeconds").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const gateways = mysqlTable("gateways", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  gatewayKey: varchar("gatewayKey", { length: 96 }).notNull().unique(),
  gatewayTokenHash: varchar("gatewayTokenHash", { length: 128 }),
  tokenLastRotatedAt: timestamp("tokenLastRotatedAt"),
  name: varchar("name", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["provisioning", "online", "offline", "degraded", "blocked"]).default("provisioning").notNull(),
  operatingMode: mysqlEnum("operatingMode", ["simulator", "hardware_unconfigured", "hardware_authorized"]).default("simulator").notNull(),
  version: varchar("version", { length: 64 }).default("local-simulator/1.0").notNull(),
  lastHeartbeatAt: timestamp("lastHeartbeatAt"),
  metadataJson: json("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const machineAdapterConfigurations = mysqlTable("machine_adapter_configurations", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  machineId: int("machineId").notNull(),
  gatewayId: int("gatewayId"),
  adapterKind: mysqlEnum("adapterKind", ["simulator", "unconfigured", "opcua", "modbus", "mqtt", "rest", "serial", "tcp"])
    .default("simulator")
    .notNull(),
  lifecycleStatus: mysqlEnum("lifecycleStatus", ["active", "disabled", "awaiting_hardware_approval"]).default("active").notNull(),
  configurationJson: json("configurationJson").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const operationCommands = mysqlTable("operation_commands", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  machineId: int("machineId").notNull(),
  gatewayId: int("gatewayId"),
  commandId: varchar("commandId", { length: 64 }).notNull().unique(),
  idempotencyKey: varchar("idempotencyKey", { length: 96 }).notNull(),
  correlationId: varchar("correlationId", { length: 96 }).notNull(),
  commandType: mysqlEnum("commandType", ["start", "stop", "pause", "resume", "reset", "maintenance", "acknowledge_alarm", "test", "emergency_stop_simulation"])
    .notNull(),
  status: mysqlEnum("status", ["requested", "validating", "approved", "queued", "executing", "succeeded", "failed", "cancelled", "timeout", "rejected"])
    .default("requested")
    .notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  requiresConfirmation: boolean("requiresConfirmation").default(false).notNull(),
  confirmedAt: timestamp("confirmedAt"),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  payloadJson: json("payloadJson").notNull(),
  resultJson: json("resultJson"),
  errorMessage: text("errorMessage"),
}, table => ({
  ownerIdempotencyUnique: uniqueIndex("operation_commands_owner_idempotency_unique").on(table.ownerId, table.idempotencyKey),
}));

export const commandExecutions = mysqlTable("command_executions", {
  id: int("id").autoincrement().primaryKey(),
  commandId: int("commandId").notNull(),
  gatewayId: int("gatewayId"),
  attempt: int("attempt").default(1).notNull(),
  status: mysqlEnum("status", ["queued", "executing", "succeeded", "failed", "timeout", "cancelled"]).default("queued").notNull(),
  startedAt: timestamp("startedAt"),
  finishedAt: timestamp("finishedAt"),
  errorMessage: text("errorMessage"),
  resultJson: json("resultJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const operationalEvents = mysqlTable("operational_events", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  machineId: int("machineId"),
  gatewayId: int("gatewayId"),
  commandId: int("commandId"),
  eventType: varchar("eventType", { length: 96 }).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  correlationId: varchar("correlationId", { length: 96 }),
  payloadJson: json("payloadJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const gatewayHeartbeats = mysqlTable("gateway_heartbeats", {
  id: int("id").autoincrement().primaryKey(),
  gatewayId: int("gatewayId").notNull(),
  status: mysqlEnum("status", ["online", "offline", "degraded"]).notNull(),
  latencyMs: int("latencyMs").default(0).notNull(),
  metadataJson: json("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const healthChecks = mysqlTable("health_checks", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  component: mysqlEnum("component", ["backend", "database", "gateway", "machine", "simulator", "realtime"]).notNull(),
  componentKey: varchar("componentKey", { length: 96 }),
  status: mysqlEnum("status", ["healthy", "degraded", "unhealthy"]).notNull(),
  latencyMs: int("latencyMs").default(0).notNull(),
  detailJson: json("detailJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const maintenanceRecords = mysqlTable("maintenance_records", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  machineId: int("machineId").notNull(),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  notes: text("notes"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  kind: mysqlEnum("kind", ["alert", "command", "gateway", "system"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  metadataJson: json("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const operationalReports = mysqlTable("operational_reports", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  reportKey: varchar("reportKey", { length: 96 }).notNull().unique(),
  reportType: mysqlEnum("reportType", ["operational", "maintenance", "security"]).default("operational").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  contentJson: json("contentJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  settingKey: varchar("settingKey", { length: 120 }).notNull(),
  valueJson: json("valueJson").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const simulatorConfigurations = mysqlTable("simulator_configurations", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  scenarioName: varchar("scenarioName", { length: 160 }).notNull(),
  scenarioJson: json("scenarioJson").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const simulatedAlerts = mysqlTable("simulated_alerts", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  machineId: int("machineId"),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  status: mysqlEnum("status", ["active", "acknowledged", "resolved"]).default("active").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export const protocolMessages = mysqlTable("protocol_messages", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  machineId: int("machineId"),
  taskId: int("taskId"),
  protocol: mysqlEnum("protocol", ["mqtt", "opcua", "modbus"]).notNull(),
  direction: mysqlEnum("direction", ["publish", "subscribe", "command", "response", "event"])
    .notNull(),
  channel: varchar("channel", { length: 255 }).notNull(),
  payloadJson: json("payloadJson").notNull(),
  status: mysqlEnum("status", ["simulated", "blocked", "verified"]).default("simulated").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const simulationPermissions = mysqlTable("simulation_permissions", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  actionPattern: varchar("actionPattern", { length: 180 }).notNull(),
  scope: varchar("scope", { length: 180 }).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).notNull(),
  decision: mysqlEnum("decision", ["allowed", "confirmation_required", "blocked"]).notNull(),
  description: text("description").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const validationLedger = mysqlTable("validation_ledger", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  taskId: int("taskId"),
  machineId: int("machineId"),
  permissionId: int("permissionId"),
  category: mysqlEnum("category", ["agent", "machine", "protocol", "security"]).notNull(),
  action: varchar("action", { length: 180 }).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).notNull(),
  permissionDecision: mysqlEnum("permissionDecision", ["allowed", "confirmation_required", "blocked"])
    .notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "passed", "failed", "not_applicable"])
    .notNull(),
  reason: text("reason").notNull(),
  permissionSnapshotJson: json("permissionSnapshotJson"),
  evidenceJson: json("evidenceJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const accessAuditLogs = mysqlTable("access_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: varchar("role", { length: 32 }).notNull(),
  action: varchar("action", { length: 180 }).notNull(),
  origin: varchar("origin", { length: 180 }),
  metadataJson: json("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type AgentTask = typeof agentTasks.$inferSelect;
export type RealmMachine = typeof realmMachines.$inferSelect;
export type ValidationLedgerEntry = typeof validationLedger.$inferSelect;
