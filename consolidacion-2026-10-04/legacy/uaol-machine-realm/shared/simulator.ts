export const TASK_STAGES = ["intent", "planning", "execution", "observation", "verification", "closure"] as const;
export const TASK_STATUSES = ["draft", "planning", "simulating", "observing", "verifying", "closed", "blocked"] as const;
export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export const MACHINE_STATES = ["offline", "standby", "idle", "calibrating", "starting", "operating", "paused", "maintenance", "stopped", "error", "emergency"] as const;
export const OPERATION_COMMANDS = ["start", "stop", "pause", "resume", "reset", "maintenance", "acknowledge_alarm", "test", "emergency_stop_simulation"] as const;
export const OPERATION_MODES = ["manual", "autonomous"] as const;
export const PROTOCOLS = ["mqtt", "opcua", "modbus"] as const;

export type TaskStage = (typeof TASK_STAGES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];
export type MachineState = (typeof MACHINE_STATES)[number];
export type OperationMode = (typeof OPERATION_MODES)[number];
export type ProtocolName = (typeof PROTOCOLS)[number];
export type OperationCommandType = (typeof OPERATION_COMMANDS)[number];

export type SimulatedEvidence = {
  type: "synthetic";
  source: "uaol-simulator";
  observedAt: string;
  summary: string;
  simulationOnly: true;
};

export const SIMULATION_BOUNDARY = {
  mode: "SIMULATION_ONLY",
  allowsRealDeviceAccess: false,
  allowsPersonalToolAccess: false,
  allowsNetworkHardwareAccess: false,
  allowsBrowserControl: false,
  description:
    "Todos los comandos, evidencias, telemetría y mensajes representan estados sintéticos guardados en la plataforma.",
} as const;
