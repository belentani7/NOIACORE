// NODO — CAPA 2: Formación / Inteligencia de Agentes
// 10 tipos de agentes con ciclo OBSERVAR→APRENDER→PRACTICAR→EVALUAR→CORREGIR→CERTIFICAR
// Cada agente tiene identidad, skills, memoria, procedimientos y scoring.

import type { AgentRole } from "./orchestrator";

export interface AgentIdentity {
  id: string;
  role: AgentRole;
  name: string;
  description: string;
  skills: string[];
  procedures: string[];
  examples: string[];
  failures: string[];
  tests: string[];
  memory: AgentMemory;
  score: AgentScore;
  certification: "none" | "provisional" | "certified" | "master";
}

export interface AgentMemory {
  knowledge: KnowledgeEntry[];
  lessons: string[];
  patterns: string[];
}

export interface KnowledgeEntry {
  id: string;
  topic: string;
  body: string;
  confidence: number; // 0..1
  createdAt: string;
}

export interface AgentScore {
  accuracy: number;      // 0..100
  reliability: number;   // 0..100
  speed: number;         // 0..100
  cost: number;          // 0..100 (lower = cheaper)
  reasoning: number;     // 0..100
  codeQuality: number;   // 0..100
  errorRate: number;     // 0..100 (lower = better)
  selfCorrection: number;// 0..100
}

export const AGENT_DEFS: Record<AgentRole, { name: string; description: string; skills: string[]; procedures: string[] }> = {
  architect: {
    name: "Architect",
    description: "Diseña la arquitectura de la solución",
    skills: ["system-design", "patterns", "scalability", "tradeoffs"],
    procedures: ["analizar-requisitos", "seleccionar-patron", "definir-interfaces", "documentar-arquitectura"],
  },
  researcher: {
    name: "Researcher",
    description: "Busca y contrasta información",
    skills: ["search", "synthesis", "fact-checking", "sources"],
    procedures: ["formular-query", "recolectar", "contrastar", "sintetizar"],
  },
  builder: {
    name: "Builder",
    description: "Construye la solución",
    skills: ["scaffolding", "integration", "assembly", "tooling"],
    procedures: ["preparar-entorno", "construir-modulos", "integrar", "ensamblar"],
  },
  coder: {
    name: "Coder",
    description: "Programa",
    skills: ["typescript", "algorithms", "refactoring", "debugging"],
    procedures: ["leer-spec", "escribir-codigo", "test-unitario", "refactorizar"],
  },
  designer: {
    name: "Designer",
    description: "Diseña experiencia/UI/UX",
    skills: ["ui-design", "ux-research", "typography", "color-theory"],
    procedures: ["investigar-usuario", "wireframe", "visual-design", "prototipar"],
  },
  analyst: {
    name: "Analyst",
    description: "Analiza resultados",
    skills: ["metrics", "statistics", "reporting", "insights"],
    procedures: ["recolectar-datos", "procesar", "comparar", "reportar"],
  },
  tester: {
    name: "Tester",
    description: "Rompe deliberadamente el sistema",
    skills: ["edge-cases", "fuzzing", "regression", "stress"],
    procedures: ["identificar-superficies", "generar-casos", "ejecutar", "reportar-fallos"],
  },
  auditor: {
    name: "Auditor",
    description: "Comprueba calidad",
    skills: ["code-review", "security", "compliance", "standards"],
    procedures: ["revisar-codigo", "verificar-estandares", "auditar-seguridad", "certificar"],
  },
  optimizer: {
    name: "Optimizer",
    description: "Reduce coste, tiempo y complejidad",
    skills: ["profiling", "caching", "minification", "lazy-loading"],
    procedures: ["medir-baseline", "identificar-cuellos", "optimizar", "re-medir"],
  },
  master: {
    name: "Master",
    description: "Integra todo y decide",
    skills: ["coordination", "decision-making", "synthesis", "governance"],
    procedures: ["integrar-resultados", "resolver-conflictos", "decidir", "delegar"],
  },
};

/**
 * Crea un agente nuevo con scores iniciales y sin certificación.
 */
export function createAgent(role: AgentRole): AgentIdentity {
  const def = AGENT_DEFS[role];
  return {
    id: "agent-" + role + "-" + Math.random().toString(36).slice(2, 8),
    role,
    name: def.name,
    description: def.description,
    skills: def.skills,
    procedures: def.procedures,
    examples: [],
    failures: [],
    tests: [],
    memory: { knowledge: [], lessons: [], patterns: [] },
    score: {
      accuracy: 50,
      reliability: 50,
      speed: 50,
      cost: 50,
      reasoning: 50,
      codeQuality: 50,
      errorRate: 50,
      selfCorrection: 50,
    },
    certification: "none",
  };
}

/**
 * Evalúa a un agente tras una ejecución y actualiza su score.
 * El agente no se considera competente porque diga que lo es.
 * Debe demostrarlo mediante pruebas.
 */
export function evaluateAgent(
  agent: AgentIdentity,
  result: {
    success: boolean;
    errorsFound: number;
    timeMs: number;
    qualityScore: number; // 0..100
  }
): AgentIdentity {
  const s = agent.score;
  // Actualizar scores con media móvil
  const k = 0.3; // peso de la nueva observación
  const newAccuracy = s.accuracy * (1 - k) + (result.success ? 100 : 30) * k;
  const newReliability = s.reliability * (1 - k) + (result.success ? 100 : 40) * k;
  const newSpeed = s.speed * (1 - k) + Math.max(0, 100 - result.timeMs / 100) * k;
  const newErrorRate = s.errorRate * (1 - k) + Math.min(100, result.errorsFound * 20) * k;
  const newCodeQuality = s.codeQuality * (1 - k) + result.qualityScore * k;
  const newSelfCorrection = s.selfCorrection * (1 - k) + (result.errorsFound > 0 && result.success ? 80 : 40) * k;

  const updatedScore: AgentScore = {
    ...s,
    accuracy: Math.round(newAccuracy),
    reliability: Math.round(newReliability),
    speed: Math.round(newSpeed),
    errorRate: Math.round(newErrorRate),
    codeQuality: Math.round(newCodeQuality),
    selfCorrection: Math.round(newSelfCorrection),
  };

  // Certificación automática basada en scores
  const avgScore =
    (updatedScore.accuracy + updatedScore.reliability + updatedScore.codeQuality) / 3;
  let certification: AgentIdentity["certification"] = "none";
  if (avgScore >= 90) certification = "master";
  else if (avgScore >= 75) certification = "certified";
  else if (avgScore >= 60) certification = "provisional";

  return {
    ...agent,
    score: updatedScore,
    certification,
  };
}

/**
 * Devuelve un score agregado (0..100) para ranking.
 */
export function agentScoreValue(agent: AgentIdentity): number {
  const s = agent.score;
  return Math.round(
    (s.accuracy + s.reliability + s.speed + (100 - s.cost) + s.reasoning + s.codeQuality + (100 - s.errorRate) + s.selfCorrection) / 8
  );
}
