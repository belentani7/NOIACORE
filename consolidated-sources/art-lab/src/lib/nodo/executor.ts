// NODO — CAPA 3: Ejecución / Control
// Pipeline: PLAN → EXECUTE → OBSERVE → TEST → VERIFY → FIX → RETEST → APPROVE → DEPLOY
// Regla: ningún resultado pasa a producción sin verificación independiente.

import type { MissionSpec, SubTask, AgentRole } from "./orchestrator";
import { createAgent, evaluateAgent, type AgentIdentity } from "./agents";
import { confirmThreeNodes, type ThreeNodeConfirmation } from "./consensus";

export type AuditVerdict = "pass" | "fail" | "rework" | "escalate";

export interface ExecutionResult {
  missionId: string;
  subtaskResults: SubTaskResult[];
  auditVerdict: AuditVerdict;
  auditNotes: string;
  iterations: number;
  totalTimeMs: number;
  memory: ExecutionMemory;
  confirmation: ThreeNodeConfirmation;
}

export interface SubTaskResult {
  subtaskId: string;
  label: string;
  agent: AgentRole;
  status: "done" | "failed";
  output: string;
  errorsFound: number;
  timeMs: number;
  qualityScore: number;
}

export interface ExecutionMemory {
  whatWasTried: string[];
  whatWorked: string[];
  whatFailed: string[];
  whyItFailed: string[];
  toolsUsed: string[];
  cost: number;
  duration: string;
  howSolved: string[];
  reusablePatterns: string[];
}

/**
 * CAPA 3 — NodoExecutor
 * Ejecuta la misión siguiendo el pipeline de verificación independiente.
 */
export class NodoExecutor {
  private agents: Map<AgentRole, AgentIdentity> = new Map();
  private maxIterations = 3;

  /**
   * Ejecuta una misión completa con pipeline builder→critic→fixer→auditor.
   */
  async execute(mission: MissionSpec): Promise<ExecutionResult> {
    const startTime = Date.now();
    let iterations = 0;
    let verdict: AuditVerdict = "rework";
    let auditNotes = "";
    const memory: ExecutionMemory = {
      whatWasTried: [],
      whatWorked: [],
      whatFailed: [],
      whyItFailed: [],
      toolsUsed: mission.tools,
      cost: 0,
      duration: "",
      howSolved: [],
      reusablePatterns: [],
    };

    const subtaskResults: SubTaskResult[] = [];

    while (iterations < this.maxIterations && verdict !== "pass") {
      iterations++;
      memory.whatWasTried.push(`Iteración ${iterations}`);

      // 1. EXECUTE — cada subtarea con su agente
      for (const st of mission.subtasks) {
        if (st.status === "done") continue;
        const agent = this.getOrCreateAgent(st.agent);
        const result = await this.executeSubTask(st, agent);
        subtaskResults.push(result);
        st.status = result.status;
        st.result = result.output;

        // Actualizar agente
        const updated = evaluateAgent(agent, {
          success: result.status === "done",
          errorsFound: result.errorsFound,
          timeMs: result.timeMs,
          qualityScore: result.qualityScore,
        });
        this.agents.set(st.agent, updated);

        if (result.status === "done") {
          memory.whatWorked.push(`${st.label}: ${result.output}`);
        } else {
          memory.whatFailed.push(st.label);
          memory.whyItFailed.push(result.output);
        }
      }

      // 2. CRITIC — el tester intenta romperlo
      const criticResult = await this.runCritic(mission, subtaskResults);
      if (criticResult.errorsFound > 0) {
        memory.whatFailed.push("Critic encontró errores");
        memory.whyItFailed.push(criticResult.notes);
        verdict = "rework";
        // Reset subtareas para re-ejecución
        mission.subtasks.forEach((st) => {
          if (st.status === "failed") st.status = "pending";
        });
        continue;
      }

      // 3. AUDIT — el auditor decide
      const audit = await this.runAudit(mission, subtaskResults);
      verdict = audit.verdict;
      auditNotes = audit.notes;

      if (verdict === "pass") {
        memory.howSolved.push("Todas las subtareas completadas y auditadas");
        memory.reusablePatterns.push("Pipeline builder→critic→auditor exitoso");
      }
    }

    const totalTimeMs = Date.now() - startTime;
    memory.duration = `${(totalTimeMs / 1000).toFixed(1)}s`;
    memory.cost = iterations * 10 + subtaskResults.length * 2;
    const auditScore = subtaskResults.length > 0
      ? subtaskResults.reduce((sum, result) => sum + result.qualityScore, 0) / subtaskResults.length
      : 0;
    const confirmation = confirmThreeNodes(mission, subtaskResults, auditScore);
    if (confirmation.status !== "confirmed" && verdict === "pass") {
      verdict = "rework";
      auditNotes = `${auditNotes} Consenso de tres nodos no confirmado (${confirmation.quorum}/3; media ${confirmation.averageScore}/100).`;
    }

    return {
      missionId: mission.id,
      subtaskResults,
      auditVerdict: verdict,
      auditNotes,
      iterations,
      totalTimeMs,
      memory,
      confirmation,
    };
  }

  private getOrCreateAgent(role: AgentRole): AgentIdentity {
    if (!this.agents.has(role)) {
      this.agents.set(role, createAgent(role));
    }
    return this.agents.get(role)!;
  }

  private async executeSubTask(
    st: SubTask,
    agent: AgentIdentity
  ): Promise<SubTaskResult> {
    const start = Date.now();
    // Simulación de ejecución (en un sistema real, aquí se llamaría al LLM/herramienta)
    await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));
    const timeMs = Date.now() - start;
    const success = Math.random() > 0.25; // 75% de éxito inicial
    const errors = success ? 0 : Math.floor(Math.random() * 3) + 1;
    const quality = success ? 70 + Math.floor(Math.random() * 30) : 30 + Math.floor(Math.random() * 30);

    return {
      subtaskId: st.id,
      label: st.label,
      agent: st.agent,
      status: success ? "done" : "failed",
      output: success
        ? `Completado por ${agent.name} (quality: ${quality})`
        : `Falló: ${errors} errores detectados`,
      errorsFound: errors,
      timeMs,
      qualityScore: quality,
    };
  }

  private async runCritic(
    mission: MissionSpec,
    results: SubTaskResult[]
  ): Promise<{ errorsFound: number; notes: string }> {
    await new Promise((r) => setTimeout(r, 80));
    const failed = results.filter((r) => r.status === "failed");
    const lowQuality = results.filter((r) => r.qualityScore < 60);
    const errors = failed.length + lowQuality.length;
    return {
      errorsFound: errors,
      notes: errors > 0
        ? `${failed.length} subtareas fallidas, ${lowQuality.length} con calidad baja`
        : "Sin errores críticos encontrados",
    };
  }

  private async runAudit(
    mission: MissionSpec,
    results: SubTaskResult[]
  ): Promise<{ verdict: AuditVerdict; notes: string }> {
    await new Promise((r) => setTimeout(r, 100));
    const allDone = results.every((r) => r.status === "done");
    const avgQuality = results.length > 0
      ? results.reduce((s, r) => s + r.qualityScore, 0) / results.length
      : 0;

    if (allDone && avgQuality >= 75) {
      return { verdict: "pass", notes: `Calidad media: ${avgQuality.toFixed(0)}/100. Todos los criterios cumplidos.` };
    }
    if (allDone && avgQuality >= 50) {
      return { verdict: "rework", notes: `Calidad media: ${avgQuality.toFixed(0)}/100. Requiere mejoras.` };
    }
    return { verdict: "fail", notes: `Subtareas fallidas o calidad insuficiente (${avgQuality.toFixed(0)}/100).` };
  }

  getAgents(): AgentIdentity[] {
    return Array.from(this.agents.values());
  }
}
