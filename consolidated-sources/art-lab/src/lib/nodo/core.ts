// NODO — NodoCore: orquestador maestro que une las 3 capas + governance
// NODO = ORQUESTACIÓN + FORMACIÓN + EJECUCIÓN + GOBERNANZA TRANSVERSAL

import { NodoOrchestrator, type MissionInput, type MissionSpec } from "./orchestrator";
import { NodoExecutor, type ExecutionResult } from "./executor";
import { Governance } from "./governance";
import { NodoMemory } from "./memory";

export interface NodoRunResult {
  mission: MissionSpec;
  execution: ExecutionResult;
  memoryStats: { totalEntries: number };
  versionId: string;
}

/**
 * NodoCore — el sistema completo.
 * Ciclo maestro: MISSION → PLAN → AGENT ASSIGNMENT → EXECUTION → RESULT →
 * CRITIQUE → ERROR ANALYSIS → CORRECTION → VALIDATION → MEMORY → NEXT MISSION
 */
export class NodoCore {
  private orchestrator = new NodoOrchestrator();
  private executor = new NodoExecutor();
  public governance = new Governance();
  public memory = new NodoMemory();
  private runHistory: NodoRunResult[] = [];

  /**
   * Ejecuta una misión completa de principio a fin.
   */
  async run(input: MissionInput): Promise<NodoRunResult> {
    // 1. GOVERNANCE: log de inicio
    this.governance.log({
      level: "info",
      layer: "orchestration",
      message: `Nueva misión: ${input.objective}`,
    });

    // 2. CAPA 1: PLAN
    const mission = this.orchestrator.plan(input);
    this.governance.log({
      level: "info",
      layer: "orchestration",
      message: `Plan creado: ${mission.subtasks.length} subtareas, agentes: ${mission.agents.join(", ")}`,
      missionId: mission.id,
    });

    // 3. Crear versión inicial
    const v1 = this.governance.createVersion(mission.id, "planning", mission);

    // 4. CAPA 2+3: FORMACIÓN + EJECUCIÓN
    mission.status = "executing";
    const execution = await this.executor.execute(mission);

    // 5. GOVERNANCE: cost control
    this.governance.addCost(mission.id, execution.memory.cost);

    // 6. MEMORY: almacenar conocimiento
    this.memory.add("projects", {
      title: input.objective,
      body: `Misión ${mission.id}: ${execution.auditVerdict.toUpperCase()} tras ${execution.iterations} iteraciones. ${execution.auditNotes}`,
      tags: [mission.priority, execution.auditVerdict],
      missionId: mission.id,
    });

    if (execution.auditVerdict === "pass") {
      this.memory.add("solutions", {
        title: `Solución: ${input.objective}`,
        body: execution.memory.howSolved.join("; "),
        tags: execution.memory.reusablePatterns,
        missionId: mission.id,
      });
      this.memory.add("lessons", {
        title: "Patrón reutilizable",
        body: execution.memory.reusablePatterns.join("; "),
        tags: ["pattern", "reusable"],
        missionId: mission.id,
      });
      mission.status = "done";
    } else {
      this.memory.add("failures", {
        title: `Fallo: ${input.objective}`,
        body: execution.memory.whyItFailed.join("; "),
        tags: ["failure", mission.priority],
        missionId: mission.id,
      });
      mission.status = "failed";
    }

    // 7. Versión final
    const v2 = this.governance.createVersion(mission.id, `result-${execution.auditVerdict}`, {
      mission,
      execution,
    });

    // 8. GOVERNANCE: log de fin
    this.governance.log({
      level: execution.auditVerdict === "pass" ? "audit" : "error",
      layer: "governance",
      message: `Misión ${mission.id}: ${execution.auditVerdict.toUpperCase()}`,
      missionId: mission.id,
    });
    this.governance.log({
      level: execution.confirmation.status === "confirmed" ? "audit" : "warn",
      layer: "governance",
      message: `Confirmación N3: ${execution.confirmation.status.toUpperCase()} · ${execution.confirmation.quorum}/3 · ${execution.confirmation.fingerprint}`,
      missionId: mission.id,
    });

    const result: NodoRunResult = {
      mission,
      execution,
      memoryStats: this.memory.stats(),
      versionId: v2.id,
    };
    this.runHistory.unshift(result);
    return result;
  }

  getHistory(): NodoRunResult[] {
    return this.runHistory;
  }

  getAgents() {
    return this.executor.getAgents();
  }
}

// Singleton
let nodoCore: NodoCore | null = null;
export function getNodoCore(): NodoCore {
  if (!nodoCore) nodoCore = new NodoCore();
  return nodoCore;
}
