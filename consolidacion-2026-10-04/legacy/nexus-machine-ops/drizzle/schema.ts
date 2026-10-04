import {
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  operationRole: mysqlEnum("operationRole", ["observer", "operator", "approver", "policy_admin"])
    .default("observer")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const simulatedMachines = mysqlTable(
  "simulatedMachines",
  {
    id: int("id").autoincrement().primaryKey(),
    machineKey: varchar("machineKey", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 128 }).notNull(),
    mode: mysqlEnum("mode", ["simulation"]).default("simulation").notNull(),
    state: mysqlEnum("state", ["stopped", "calibrating", "operating", "paused", "maintenance", "emergency"])
      .default("stopped")
      .notNull(),
    cycleCount: int("cycleCount").default(0).notNull(),
    operationStartedAt: timestamp("operationStartedAt"),
    lastHeartbeatAt: timestamp("lastHeartbeatAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => []
);

export const machineTelemetry = mysqlTable(
  "machineTelemetry",
  {
    id: int("id").autoincrement().primaryKey(),
    machineId: int("machineId").notNull(),
    state: mysqlEnum("state", ["stopped", "calibrating", "operating", "paused", "maintenance", "emergency"]).notNull(),
    temperature: decimal("temperature", { precision: 7, scale: 2 }).notNull(),
    pressure: decimal("pressure", { precision: 7, scale: 2 }).notNull(),
    load: decimal("load", { precision: 6, scale: 2 }).notNull(),
    speed: decimal("speed", { precision: 7, scale: 2 }).notNull(),
    power: decimal("power", { precision: 7, scale: 2 }).notNull(),
    latencyMs: int("latencyMs").notNull(),
    capturedAt: timestamp("capturedAt").defaultNow().notNull(),
  },
  table => [index("machine_telemetry_machine_captured_idx").on(table.machineId, table.capturedAt)]
);

export const machineCommands = mysqlTable(
  "machineCommands",
  {
    id: int("id").autoincrement().primaryKey(),
    commandId: varchar("commandId", { length: 64 }).notNull().unique(),
    machineId: int("machineId").notNull(),
    requestedByUserId: int("requestedByUserId").notNull(),
    type: mysqlEnum("type", [
      "start",
      "stop",
      "pause",
      "resume",
      "reset",
      "enter_maintenance",
      "exit_maintenance",
      "acknowledge_alarm",
      "emergency_stop_simulation",
    ]).notNull(),
    status: mysqlEnum("status", [
      "requested",
      "policy_rejected",
      "risk_rejected",
      "awaiting_human",
      "human_rejected",
      "expired",
      "authorized",
      "executing",
      "executed",
      "failed",
    ]).default("requested").notNull(),
    idempotencyKey: varchar("idempotencyKey", { length: 128 }).notNull(),
    isTestMode: int("isTestMode").default(1).notNull(),
    policyVersion: varchar("policyVersion", { length: 32 }).notNull(),
    riskSnapshot: json("riskSnapshot").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    unique("machine_commands_idempotency_unique").on(table.idempotencyKey),
    index("machine_commands_machine_status_idx").on(table.machineId, table.status),
  ]
);

export const commandValidations = mysqlTable(
  "commandValidations",
  {
    id: int("id").autoincrement().primaryKey(),
    commandId: varchar("commandId", { length: 64 }).notNull(),
    node: mysqlEnum("node", ["policy", "risk", "human"]).notNull(),
    decision: mysqlEnum("decision", ["allow", "block", "approved", "rejected", "expired"]).notNull(),
    reason: text("reason").notNull(),
    evidence: json("evidence").notNull(),
    validatedByUserId: int("validatedByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("command_validations_command_idx").on(table.commandId)]
);

export const machineEvents = mysqlTable(
  "machineEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    machineId: int("machineId").notNull(),
    commandId: varchar("commandId", { length: 64 }),
    eventType: varchar("eventType", { length: 96 }).notNull(),
    payload: json("payload").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("machine_events_machine_created_idx").on(table.machineId, table.createdAt)]
);

export const machineAlarms = mysqlTable(
  "machineAlarms",
  {
    id: int("id").autoincrement().primaryKey(),
    machineId: int("machineId").notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    severity: mysqlEnum("severity", ["info", "warning", "critical"]).notNull(),
    status: mysqlEnum("status", ["active", "acknowledged", "cleared"]).default("active").notNull(),
    message: text("message").notNull(),
    raisedAt: timestamp("raisedAt").defaultNow().notNull(),
    clearedAt: timestamp("clearedAt"),
  },
  table => [index("machine_alarms_machine_status_idx").on(table.machineId, table.status)]
);

export const auditLog = mysqlTable(
  "auditLog",
  {
    sequence: int("sequence").autoincrement().primaryKey(),
    eventHash: varchar("eventHash", { length: 64 }).notNull().unique(),
    previousHash: varchar("previousHash", { length: 64 }),
    actorUserId: int("actorUserId"),
    actorRole: varchar("actorRole", { length: 32 }).notNull(),
    commandId: varchar("commandId", { length: 64 }),
    node: mysqlEnum("node", ["policy", "risk", "human", "system"]).notNull(),
    decision: varchar("decision", { length: 32 }).notNull(),
    reason: text("reason").notNull(),
    metadata: json("metadata").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("audit_log_command_created_idx").on(table.commandId, table.createdAt)]
);
