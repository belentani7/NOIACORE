import type { MachineState, OperationCommandType } from "./simulator";

export const ADAPTER_KINDS = ["simulator", "unconfigured", "opcua", "modbus", "mqtt", "rest", "serial", "tcp"] as const;
export type AdapterKind = (typeof ADAPTER_KINDS)[number];

export type AdapterMachineStatus = {
  machineKey: string;
  state: MachineState;
  connected: boolean;
  simulationOnly: boolean;
};

export type AdapterTelemetry = {
  temperature: number;
  pressure: number;
  vibration: number;
  energy: number;
  quality: number;
  load: number;
  speed: number;
};

export type AdapterCommandResult = {
  accepted: boolean;
  nextState?: MachineState;
  message: string;
  simulationOnly: boolean;
};

/**
 * Boundary for a future physical connector. Implementations must not bypass the gateway.
 * The default application implementation is the deterministic simulator adapter.
 */
export interface MachineAdapter {
  readonly kind: AdapterKind;
  readonly simulationOnly: boolean;
  connect(): Promise<AdapterMachineStatus>;
  disconnect(): Promise<AdapterMachineStatus>;
  getStatus(): Promise<AdapterMachineStatus>;
  getTelemetry(): Promise<AdapterTelemetry>;
  sendCommand(command: OperationCommandType): Promise<AdapterCommandResult>;
  acknowledge(): Promise<AdapterCommandResult>;
  emergencyStop(): Promise<AdapterCommandResult>;
  reset(): Promise<AdapterCommandResult>;
  healthCheck(): Promise<{ healthy: boolean; detail: string; simulationOnly: boolean }>;
}
