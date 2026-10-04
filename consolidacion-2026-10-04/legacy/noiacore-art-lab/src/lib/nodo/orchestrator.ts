// NODO — Sistema maestro de orquestación de agentes
// CAPA 1: Cerebro / Orquestación
// Convierte un objetivo en un MISSION_SPEC estructurado.

export interface MissionSpec {
  id: string;
  objective: string;
  context: string;
  constraints: string[];
  resources: string[];
  subtasks: SubTask[];
  dependencies: Record<string, string[]>;
  tools: string[];
  agents: string[];
  priority: "low" | "medium" | "high" | "critical";
  successCriteria: string[];
  finalOutput: string;
  createdAt: string;
  status: "planning" | "executing" | "verifying" | "done" | "failed";
}

export interface SubTask {
  id: string;
  label: string;
  agent: AgentRole;
  status: "pending" | "executing" | "done" | "failed";
  result?: string;
}

export type AgentRole =
  | "architect"
  | "researcher"
  | "builder"
  | "coder"
  | "designer"
  | "analyst"
  | "tester"
  | "auditor"
  | "optimizer"
  | "master";

export interface MissionInput {
  objective: string;
  context?: string;
  constraints?: string[];
  resources?: string[];
  expectedOutput?: string;
}

/**
 * CAPA 1 — NodoOrchestrator
 * Entiende, clasifica y decide. Convierte un objetivo en un plan ejecutable.
 */
export class NodoOrchestrator {
  /**
   * Motor de decisión: detecta objetivo, divide en subproblemas,
   * elige agentes y define criterios de éxito.
   */
  plan(input: MissionInput): MissionSpec {
    const id = "mission-" + Date.now().toString(36);
    const subtasks = this.decompose(input.objective);
    const agents = this.selectAgents(subtasks);
    const tools = this.selectTools(input.objective);
    const criteria = this.defineSuccessCriteria(input);

    return {
      id,
      objective: input.objective,
      context: input.context ?? "",
      constraints: input.constraints ?? [],
      resources: input.resources ?? [],
      subtasks,
      dependencies: this.mapDependencies(subtasks),
      tools,
      agents,
      priority: this.assessPriority(input),
      successCriteria: criteria,
      finalOutput: input.expectedOutput ?? "Resultado validado y certificado",
      createdAt: new Date().toISOString(),
      status: "planning",
    };
  }

  /**
   * DECOMPOSE: divide el objetivo en subproblemas.
   * Heurística simple basada en palabras clave del objetivo.
   */
  private decompose(objective: string): SubTask[] {
    const lower = objective.toLowerCase();
    const tasks: SubTask[] = [];

    if (lower.includes("diseñ") || lower.includes("design") || lower.includes("arquitect")) {
      tasks.push({ id: "st-" + (tasks.length + 1), label: "Diseñar la arquitectura de la solución", agent: "architect", status: "pending" });
    }
    if (lower.includes("investig") || lower.includes("research") || lower.includes("busca")) {
      tasks.push({ id: "st-" + (tasks.length + 1), label: "Investigar y contrastar información", agent: "researcher", status: "pending" });
    }
    if (lower.includes("construy") || lower.includes("build") || lower.includes("crea")) {
      tasks.push({ id: "st-" + (tasks.length + 1), label: "Construir la solución", agent: "builder", status: "pending" });
    }
    if (lower.includes("código") || lower.includes("code") || lower.includes("program")) {
      tasks.push({ id: "st-" + (tasks.length + 1), label: "Escribir el código", agent: "coder", status: "pending" });
    }
    if (lower.includes("ui") || lower.includes("ux") || lower.includes("diseño visual")) {
      tasks.push({ id: "st-" + (tasks.length + 1), label: "Diseñar la experiencia visual", agent: "designer", status: "pending" });
    }
    if (lower.includes("analiz") || lower.includes("metric") || lower.includes("dato")) {
      tasks.push({ id: "st-" + (tasks.length + 1), label: "Analizar resultados y métricas", agent: "analyst", status: "pending" });
    }
    if (lower.includes("test") || lower.includes("prueba") || lower.includes("verific")) {
      tasks.push({ id: "st-" + (tasks.length + 1), label: "Probar y romper el sistema deliberadamente", agent: "tester", status: "pending" });
    }
    if (lower.includes("optimiz") || lower.includes("rendimiento") || lower.includes("coste")) {
      tasks.push({ id: "st-" + (tasks.length + 1), label: "Optimizar coste, tiempo y complejidad", agent: "optimizer", status: "pending" });
    }

    // Siempre auditar al final
    tasks.push({ id: "st-" + (tasks.length + 1), label: "Auditar calidad y certificar el resultado", agent: "auditor", status: "pending" });

    // Si no se detectó nada, tarea genérica del master
    if (tasks.length <= 1) {
      tasks.unshift({ id: "st-0", label: "Analizar objetivo y planificar enfoque", agent: "master", status: "pending" });
    }

    return tasks;
  }

  private selectAgents(subtasks: SubTask[]): string[] {
    return [...new Set(subtasks.map((s) => s.agent))];
  }

  private selectTools(objective: string): string[] {
    const tools: string[] = ["nodo-core"];
    const lower = objective.toLowerCase();
    if (lower.includes("web") || lower.includes("ui")) tools.push("tailwind", "shadcn");
    if (lower.includes("shader") || lower.includes("webgl")) tools.push("glsl", "webgl-engine");
    if (lower.includes("api") || lower.includes("backend")) tools.push("next-api", "prisma");
    if (lower.includes("test")) tools.push("agent-tester");
    return tools;
  }

  private defineSuccessCriteria(input: MissionInput): string[] {
    const criteria = [
      "Cumple el objetivo declarado",
      "Sin errores de runtime",
      "Lint pasa sin warnings",
      "Verificación del auditor: PASS",
    ];
    if (input.expectedOutput) {
      criteria.unshift(`Produce: ${input.expectedOutput}`);
    }
    return criteria;
  }

  private assessPriority(input: MissionInput): MissionSpec["priority"] {
    const lower = (input.objective + " " + (input.context ?? "")).toLowerCase();
    if (lower.includes("crític") || lower.includes("critical")) return "critical";
    if (lower.includes("urgente") || lower.includes("high")) return "high";
    if (lower.includes("media") || lower.includes("medium")) return "medium";
    return "low";
  }

  private mapDependencies(subtasks: SubTask[]): Record<string, string[]> {
    const deps: Record<string, string[]> = {};
    for (let i = 1; i < subtasks.length; i++) {
      deps[subtasks[i].id] = [subtasks[i - 1].id];
    }
    return deps;
  }
}
