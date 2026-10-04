import type { AdapterCommandResult, AdapterMachineStatus, AdapterTelemetry, MachineAdapter } from "@shared/machineAdapter";
import type { MachineState, OperationCommandType } from "@shared/simulator";
import { simulatedTelemetry } from "./simulationRules";

export class SimulatorMachineAdapter implements MachineAdapter {
  readonly kind = "simulator" as const;
  readonly simulationOnly = true;

  constructor(private readonly machine: { machineKey: string; state: MachineState; connectionStatus: "connected" | "disconnected" | "fault" }) {}

  private status(state = this.machine.state, connected = this.machine.connectionStatus === "connected"): AdapterMachineStatus {
    return { machineKey: this.machine.machineKey, state, connected, simulationOnly: true };
  }

  async connect() { return this.status(this.machine.state, true); }
  async disconnect() { return this.status("offline", false); }
  async getStatus() { return this.status(); }
  async getTelemetry(): Promise<AdapterTelemetry> { return simulatedTelemetry(this.machine.state); }
  async healthCheck() { return { healthy: this.machine.connectionStatus === "connected", detail: "Adaptador determinista disponible; no se abrió ninguna conexión física.", simulationOnly: true }; }
  async acknowledge(): Promise<AdapterCommandResult> { return { accepted: true, message: "Alarma sintética reconocida.", simulationOnly: true }; }
  async emergencyStop(): Promise<AdapterCommandResult> { return { accepted: true, nextState: "emergency", message: "Parada de emergencia lógica registrada exclusivamente en el simulador.", simulationOnly: true }; }
  async reset(): Promise<AdapterCommandResult> { return { accepted: true, nextState: "standby", message: "Restablecimiento sintético preparado en estado de espera.", simulationOnly: true }; }

  async sendCommand(command: OperationCommandType): Promise<AdapterCommandResult> {
    const nextState: Partial<Record<OperationCommandType, MachineState>> = {
      start: this.machine.state === "starting" ? "operating" : "starting",
      stop: "stopped",
      pause: "paused",
      resume: "operating",
      reset: "standby",
      maintenance: "maintenance",
      emergency_stop_simulation: "emergency",
    };
    if (command === "acknowledge_alarm") return this.acknowledge();
    if (command === "emergency_stop_simulation") return this.emergencyStop();
    if (command === "reset") return this.reset();
    return { accepted: true, nextState: nextState[command], message: `Comando ${command} ejecutado por el adaptador determinista.`, simulationOnly: true };
  }
}
