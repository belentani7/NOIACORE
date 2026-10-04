import type { MachineState, RiskLevel, SimulatedEvidence, TaskStatus } from "@shared/simulator";

export type PermissionDecision = "allowed" | "confirmation_required" | "blocked";

export type PersistedPermissionPolicy = {
  id: number;
  actionPattern: string;
  scope: string;
  decision: PermissionDecision;
  description: string;
};

export function selectPersistedPolicy(policies: PersistedPermissionPolicy[], action: string) {
  return [...policies]
    .sort((a, b) => b.actionPattern.length - a.actionPattern.length)
    .find(policy => action.includes(policy.actionPattern));
}

export function buildLedgerPolicyTrace(policy: PersistedPermissionPolicy | undefined, fallbackDecision: PermissionDecision) {
  if (policy) {
    return {
      permissionId: policy.id,
      permissionSnapshot: {
        source: "simulation_permissions",
        permissionId: policy.id,
        actionPattern: policy.actionPattern,
        scope: policy.scope,
        configuredDecision: policy.decision,
      },
    };
  }
  return {
    permissionId: null,
    permissionSnapshot: { source: "simulation_rules", actionPattern: "fallback", configuredDecision: fallbackDecision },
  };
}

export function buildTaskPlan(intent: string) {
  return [
    { order: 1, stage: "intent", label: "Intención registrada", detail: intent },
    { order: 2, stage: "planning", label: "Plan simulado preparado", detail: "Se definieron pasos y límites sin invocar herramientas reales." },
    { order: 3, stage: "execution", label: "Ejecución simulada", detail: "Se ejecutarán únicamente acciones sintéticas predefinidas." },
    { order: 4, stage: "observation", label: "Evidencia observada", detail: "La consola generará evidencia sintética con marca de tiempo." },
    { order: 5, stage: "verification", label: "Verificación simulada", detail: "El resultado se comparará con el criterio definido por la tarea." },
    { order: 6, stage: "closure", label: "Cierre auditable", detail: "La tarea conservará resultado, evidencia y registro de validación." },
  ];
}

export function advanceTaskStatus(status: TaskStatus): { next: TaskStatus; stage: "planning" | "execution" | "observation" | "verification" | "closure"; message: string } {
  const transitions: Record<TaskStatus, { next: TaskStatus; stage: "planning" | "execution" | "observation" | "verification" | "closure"; message: string }> = {
    draft: { next: "planning", stage: "planning", message: "Plan de simulación elaborado sin acceso a recursos externos." },
    planning: { next: "simulating", stage: "execution", message: "Acción de navegador/ordenador simulada y registrada." },
    simulating: { next: "observing", stage: "observation", message: "Evidencia sintética observada para la tarea." },
    observing: { next: "verifying", stage: "verification", message: "Resultado simulado comparado con el criterio de éxito." },
    verifying: { next: "closed", stage: "closure", message: "Tarea cerrada con trazabilidad completa." },
    closed: { next: "closed", stage: "closure", message: "La tarea ya está cerrada; no se ejecutaron cambios." },
    blocked: { next: "blocked", stage: "closure", message: "La tarea permanece bloqueada por la política de seguridad." },
  };
  return transitions[status];
}

export function assessSimulationPermission(input: { action: string; riskLevel: RiskLevel; confirmed?: boolean }) {
  const normalizedAction = input.action.toLowerCase();
  const requestsRealAccess = ["real", "hardware", "browser-control", "personal-tool", "network-connect"].some(token =>
    normalizedAction.includes(token),
  );

  if (requestsRealAccess) {
    return {
      decision: "blocked" as const,
      reason: "El perímetro de esta consola prohíbe acceso a equipo, herramientas personales, redes industriales y hardware real.",
    };
  }

  if ((input.riskLevel === "high" || input.riskLevel === "critical") && !input.confirmed) {
    return {
      decision: "confirmation_required" as const,
      reason: "La acción simulada es sensible y requiere confirmación visible antes de registrarse como ejecutada.",
    };
  }

  return {
    decision: "allowed" as const,
    reason: "La acción se limita a estados y evidencia sintéticos dentro de la simulación.",
  };
}

const machineTransitions: Record<MachineState, MachineState[]> = {
  offline: ["standby"],
  standby: ["idle", "starting", "maintenance", "stopped", "emergency"],
  idle: ["calibrating", "starting", "maintenance", "stopped", "emergency"],
  calibrating: ["starting", "operating", "stopped", "error", "emergency"],
  starting: ["operating", "paused", "stopped", "error", "emergency"],
  operating: ["paused", "maintenance", "stopped", "error", "emergency"],
  paused: ["operating", "maintenance", "stopped", "emergency"],
  maintenance: ["standby", "idle", "stopped", "emergency"],
  stopped: ["standby", "idle", "calibrating", "emergency"],
  error: ["maintenance", "stopped", "emergency"],
  emergency: ["stopped"],
};

export function canTransitionMachine(current: MachineState, target: MachineState) {
  return current === target || machineTransitions[current].includes(target);
}

export function riskForMachineTransition(target: MachineState, mode: "manual" | "autonomous"): RiskLevel {
  if (target === "emergency") return "critical";
  if (mode === "autonomous" && target === "operating") return "high";
  if (target === "operating" || target === "starting" || target === "maintenance" || target === "error") return "medium";
  return "low";
}

export function syntheticEvidence(summary: string): SimulatedEvidence {
  return {
    type: "synthetic",
    source: "uaol-simulator",
    observedAt: new Date().toISOString(),
    summary,
    simulationOnly: true,
  };
}

export function simulatedTelemetry(state: MachineState, timestamp = Date.now()) {
  const phase = Math.floor(timestamp / 5000) % 7;
  const baseline = {
    offline: { temperature: 190, pressure: 0, vibration: 0, energy: 0, quality: 100, load: 0, speed: 0 },
    standby: { temperature: 218, pressure: 4, vibration: 1, energy: 5, quality: 100, load: 3, speed: 0 },
    idle: { temperature: 242, pressure: 18, vibration: 4, energy: 19, quality: 100, load: 11, speed: 0 },
    calibrating: { temperature: 268, pressure: 23, vibration: 9, energy: 38, quality: 98, load: 22, speed: 40 },
    starting: { temperature: 374, pressure: 31, vibration: 14, energy: 54, quality: 96, load: 48, speed: 75 },
    operating: { temperature: 614, pressure: 47, vibration: 21, energy: 76, quality: 96, load: 79, speed: 118 },
    paused: { temperature: 352, pressure: 21, vibration: 5, energy: 31, quality: 99, load: 18, speed: 0 },
    maintenance: { temperature: 321, pressure: 12, vibration: 7, energy: 27, quality: 99, load: 15, speed: 0 },
    stopped: { temperature: 210, pressure: 4, vibration: 2, energy: 5, quality: 100, load: 1, speed: 0 },
    error: { temperature: 698, pressure: 66, vibration: 38, energy: 47, quality: 68, load: 44, speed: 26 },
    emergency: { temperature: 710, pressure: 71, vibration: 42, energy: 9, quality: 74, load: 0, speed: 0 },
  }[state];

  return {
    temperature: baseline.temperature + phase * 2,
    pressure: baseline.pressure + (phase % 3),
    vibration: baseline.vibration + (phase % 4),
    energy: baseline.energy + (phase % 5),
    quality: Math.max(0, baseline.quality - (phase % 3)),
    load: Math.max(0, baseline.load + (phase % 4)),
    speed: Math.max(0, baseline.speed + (phase % 5)),
  };
}
