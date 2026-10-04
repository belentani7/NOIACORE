import type { MachineState } from "@shared/machine";

export type SimulatedAlarm = { code: string; severity: "critical"; message: string };

export function expectedSimulatedAlarm(state: MachineState, temperature: number): SimulatedAlarm | null {
  if (state === "emergency") return { code: "SIM_ESTOP_ACTIVE", severity: "critical", message: "La parada de emergencia está activa en el simulador." };
  if (temperature >= 80) return { code: "SIM_OVER_TEMPERATURE", severity: "critical", message: "Temperatura simulada fuera del umbral seguro." };
  return null;
}
