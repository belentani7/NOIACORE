// NODO — Algoritmo único de confirmación de tres nodos.
// Cada capa evalúa la misma evidencia desde una perspectiva distinta.

import type { MissionSpec } from "./orchestrator";
import type { SubTaskResult } from "./executor";

export type NodoLayer = "orchestration" | "formation" | "execution";
export type ConfirmationStatus = "confirmed" | "rejected";

export interface NodeConfirmation {
  nodeId: "N1" | "N2" | "N3";
  layer: NodoLayer;
  label: string;
  score: number;
  accepted: boolean;
  reason: string;
}

export interface ThreeNodeConfirmation {
  status: ConfirmationStatus;
  quorum: number;
  required: 2;
  averageScore: number;
  fingerprint: string;
  nodes: NodeConfirmation[];
}

const NODE_DEFINITIONS: ReadonlyArray<Pick<NodeConfirmation, "nodeId" | "layer" | "label">> = [
  { nodeId: "N1", layer: "orchestration", label: "Orquestación" },
  { nodeId: "N2", layer: "formation", label: "Formación" },
  { nodeId: "N3", layer: "execution", label: "Ejecución" },
];

/**
 * Único punto de decisión: nunca usa azar ni estado global.
 * El resultado es reproducible para una misma misión y sus evidencias.
 */
export function confirmThreeNodes(
  mission: MissionSpec,
  results: readonly SubTaskResult[],
  auditScore: number,
): ThreeNodeConfirmation {
  const completed = results.filter((result) => result.status === "done").length;
  const completionRatio = results.length === 0 ? 0 : completed / results.length;
  const quality = results.length === 0
    ? 0
    : results.reduce((sum, result) => sum + result.qualityScore, 0) / results.length;
  const errorCount = results.reduce((sum, result) => sum + result.errorsFound, 0);
  const evidence = `${mission.id}|${mission.objective}|${completed}|${quality.toFixed(3)}|${errorCount}|${auditScore}`;

  const nodes: NodeConfirmation[] = NODE_DEFINITIONS.map((definition) => {
    const score = clampScore(
      definition.layer === "orchestration"
        ? mission.subtasks.length > 0 && mission.successCriteria.length > 0 ? 100 : 35
        : definition.layer === "formation"
          ? quality * 0.7 + completionRatio * 30
          : auditScore * 0.75 + completionRatio * 25,
    );
    const accepted = score >= 75 && (definition.layer === "orchestration" || errorCount === 0);
    return {
      ...definition,
      score: Math.round(score),
      accepted,
      reason: accepted ? "Evidencia suficiente para esta capa" : "La evidencia no alcanza el umbral de confirmación",
    };
  });

  const quorum = nodes.filter((node) => node.accepted).length;
  const averageScore = Math.round(nodes.reduce((sum, node) => sum + node.score, 0) / nodes.length);
  return {
    status: quorum >= 2 && averageScore >= 75 ? "confirmed" : "rejected",
    quorum,
    required: 2,
    averageScore,
    fingerprint: createFingerprint(evidence),
    nodes,
  };
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function createFingerprint(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `n3-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
