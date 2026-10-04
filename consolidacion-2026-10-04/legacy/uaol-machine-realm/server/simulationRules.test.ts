import { describe, expect, it } from "vitest";
import {
  assessSimulationPermission,
  buildLedgerPolicyTrace,
  canTransitionMachine,
  selectPersistedPolicy,
  simulatedTelemetry,
} from "./simulationRules";

describe("reglas de seguridad del simulador", () => {
  it("prioriza la política persistente más específica y conserva su identidad", () => {
    const policy = selectPersistedPolicy(
      [
        { id: 7, actionPattern: "protocol.", scope: "emulación", decision: "allowed", description: "Eventos sintéticos" },
        { id: 11, actionPattern: "protocol.command.simulated", scope: "emulación", decision: "confirmation_required", description: "Confirmar comando" },
      ],
      "protocol.command.simulated",
    );

    expect(policy).toMatchObject({ id: 11, decision: "confirmation_required", scope: "emulación" });
  });

  it("conserva el identificador y la instantánea de la política aplicada para el Validation Ledger", () => {
    const trace = buildLedgerPolicyTrace(
      { id: 44, actionPattern: "machine.mode.autonomous.simulated", scope: "Máquina Realm simulada", decision: "confirmation_required", description: "Confirmar" },
      "allowed",
    );

    expect(trace).toEqual({
      permissionId: 44,
      permissionSnapshot: {
        source: "simulation_permissions",
        permissionId: 44,
        actionPattern: "machine.mode.autonomous.simulated",
        scope: "Máquina Realm simulada",
        configuredDecision: "confirmation_required",
      },
    });
  });

  it("bloquea solicitudes que intentan salir del perímetro de simulación", () => {
    const result = assessSimulationPermission({ action: "real.hardware.start", riskLevel: "critical" });
    expect(result.decision).toBe("blocked");
  });

  it("exige confirmación para una operación sintética de riesgo crítico", () => {
    const result = assessSimulationPermission({ action: "machine.transition.emergency.simulated", riskLevel: "critical" });
    expect(result.decision).toBe("confirmation_required");
  });

  it("impide transiciones de estado no declaradas", () => {
    expect(canTransitionMachine("idle", "operating")).toBe(false);
    expect(canTransitionMachine("idle", "calibrating")).toBe(true);
  });

  it("genera telemetría sintética determinista dentro de rangos no negativos", () => {
    const sample = simulatedTelemetry("operating", 10_000);
    expect(sample.temperature).toBeGreaterThan(0);
    expect(sample.quality).toBeGreaterThanOrEqual(0);
    expect(sample.energy).toBeGreaterThan(0);
  });
});
