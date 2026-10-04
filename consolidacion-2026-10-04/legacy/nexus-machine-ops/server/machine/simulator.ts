import type { CommandType, MachineState, SimulationTelemetry } from "@shared/machine";

const transitions: Record<CommandType, MachineState[]> = {
  start: ["stopped"],
  stop: ["calibrating", "operating", "paused", "maintenance"],
  pause: ["operating"],
  resume: ["paused"],
  reset: ["emergency"],
  enter_maintenance: ["stopped"],
  exit_maintenance: ["maintenance"],
  acknowledge_alarm: ["stopped", "calibrating", "operating", "paused", "maintenance", "emergency"],
  emergency_stop_simulation: ["stopped", "calibrating", "operating", "paused", "maintenance"],
};

export function canTransition(state: MachineState, command: CommandType) {
  return transitions[command].includes(state);
}

export function nextState(state: MachineState, command: CommandType): MachineState {
  if (!canTransition(state, command)) {
    throw new Error(`La orden ${command} no es válida desde el estado ${state}.`);
  }

  switch (command) {
    case "start":
    case "resume":
      return "operating";
    case "pause":
      return "paused";
    case "enter_maintenance":
      return "maintenance";
    case "emergency_stop_simulation":
      return "emergency";
    case "stop":
    case "reset":
    case "exit_maintenance":
      return "stopped";
    case "acknowledge_alarm":
      return state;
  }
}

export function generateTelemetry(
  state: MachineState,
  cycleCount: number,
  uptimeSeconds: number,
  now = Date.now()
): SimulationTelemetry {
  const phase = Math.floor(now / 1000) % 60;
  const oscillation = Math.sin(phase / 5);
  const operating = state === "operating";
  const paused = state === "paused";
  const maintenance = state === "maintenance";
  const emergency = state === "emergency";

  const temperature = emergency ? 29 : maintenance ? 31 : operating ? 62 + oscillation * 4 : paused ? 41 : 28;
  const pressure = emergency ? 0 : operating ? 4.6 + oscillation * 0.2 : paused ? 1.3 : 0.2;
  const load = emergency ? 0 : operating ? 72 + oscillation * 8 : paused ? 6 : maintenance ? 4 : 0;
  const speed = emergency ? 0 : operating ? 1440 + oscillation * 35 : 0;
  const power = emergency ? 0.2 : operating ? 18.4 + oscillation * 1.2 : paused ? 1.1 : maintenance ? 0.8 : 0.4;

  return {
    temperature: Number(temperature.toFixed(2)),
    pressure: Number(pressure.toFixed(2)),
    load: Number(load.toFixed(2)),
    speed: Number(speed.toFixed(2)),
    power: Number(power.toFixed(2)),
    cycleCount,
    uptimeSeconds,
    latencyMs: 18 + (phase % 7),
    capturedAt: new Date(now).toISOString(),
  };
}

export function commandRiskSummary(state: MachineState, command: CommandType, temperature: number) {
  if (!canTransition(state, command)) {
    return { safe: false, reason: `La transición ${state} → ${command} está protegida por el simulador.` };
  }

  if (temperature >= 85 && command !== "emergency_stop_simulation") {
    return { safe: false, reason: "Temperatura simulada fuera del umbral de operación segura." };
  }

  return { safe: true, reason: "Transición permitida dentro de los límites del simulador." };
}
