export const machineStates = ["stopped", "calibrating", "operating", "paused", "maintenance", "emergency"] as const;
export type MachineState = (typeof machineStates)[number];

export const commandTypes = [
  "start",
  "stop",
  "pause",
  "resume",
  "reset",
  "enter_maintenance",
  "exit_maintenance",
  "acknowledge_alarm",
  "emergency_stop_simulation",
] as const;
export type CommandType = (typeof commandTypes)[number];

export const commandStatuses = [
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
] as const;
export type CommandStatus = (typeof commandStatuses)[number];

export const operationalRoles = ["observer", "operator", "approver", "policy_admin"] as const;
export type OperationalRole = (typeof operationalRoles)[number];

export const validationNodes = ["policy", "risk", "human"] as const;
export type ValidationNode = (typeof validationNodes)[number];

export type SimulationTelemetry = {
  temperature: number;
  pressure: number;
  load: number;
  speed: number;
  power: number;
  cycleCount: number;
  uptimeSeconds: number;
  latencyMs: number;
  capturedAt: string;
};

export type CommandInput = {
  machineId: number;
  type: CommandType;
  idempotencyKey: string;
  testMode?: boolean;
};
