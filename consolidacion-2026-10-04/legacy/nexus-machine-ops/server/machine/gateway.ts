import type { CommandType, MachineState, SimulationTelemetry } from "@shared/machine";
import { generateTelemetry, nextState } from "./simulator";

export type GatewayHealth = {
  connected: true;
  mode: "simulation";
  adapter: "simulation";
  checkedAt: string;
};

export type AdapterMachineSnapshot = {
  state: MachineState;
  cycleCount: number;
  operationStartedAt: Date | null;
};

export interface MachineAdapter {
  readonly mode: "simulation";
  connect(): Promise<GatewayHealth>;
  healthCheck(): Promise<GatewayHealth>;
  getStatus(machine: AdapterMachineSnapshot): Promise<MachineState>;
  getTelemetry(machine: AdapterMachineSnapshot, now?: number): Promise<SimulationTelemetry>;
  sendCommand(machine: AdapterMachineSnapshot, command: CommandType): Promise<{ targetState: MachineState }>;
  acknowledge(): Promise<{ acknowledged: true }>;
  emergencyStop(machine: AdapterMachineSnapshot): Promise<{ targetState: MachineState }>;
}

export class SimulationMachineAdapter implements MachineAdapter {
  readonly mode = "simulation" as const;

  async connect(): Promise<GatewayHealth> {
    return { connected: true, mode: this.mode, adapter: "simulation", checkedAt: new Date().toISOString() };
  }

  async healthCheck(): Promise<GatewayHealth> {
    return this.connect();
  }

  async getStatus(machine: AdapterMachineSnapshot) {
    return machine.state;
  }

  async getTelemetry(machine: AdapterMachineSnapshot, now = Date.now()) {
    const uptimeSeconds = machine.operationStartedAt ? Math.max(0, Math.floor((now - machine.operationStartedAt.getTime()) / 1000)) : 0;
    return generateTelemetry(machine.state, machine.cycleCount, uptimeSeconds, now);
  }

  async sendCommand(machine: AdapterMachineSnapshot, command: CommandType) {
    if (command === "emergency_stop_simulation") return this.emergencyStop(machine);
    return { targetState: nextState(machine.state, command) };
  }

  async acknowledge() {
    return { acknowledged: true as const };
  }

  async emergencyStop(machine: AdapterMachineSnapshot) {
    return { targetState: nextState(machine.state, "emergency_stop_simulation") };
  }
}

export class SimulationGateway {
  private readonly adapter: MachineAdapter;

  constructor(adapter: MachineAdapter = new SimulationMachineAdapter()) {
    if (adapter.mode !== "simulation") throw new Error("El gateway de esta fase solo admite el adaptador de simulación.");
    this.adapter = adapter;
  }

  async readTelemetry(machine: AdapterMachineSnapshot) {
    await this.adapter.healthCheck();
    return this.adapter.getTelemetry(machine);
  }

  async dispatch(machine: AdapterMachineSnapshot, command: CommandType) {
    await this.adapter.healthCheck();
    const status = await this.adapter.getStatus(machine);
    if (status !== machine.state) throw new Error("El gateway detectó una incoherencia de estado en el simulador.");
    const result = await this.adapter.sendCommand(machine, command);
    return { ...result, gatewayMode: "simulation" as const, adapter: "simulation" as const };
  }
}
