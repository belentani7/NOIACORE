"use client";

import { useState, useCallback } from "react";
import { getNodoCore, type NodoRunResult } from "@/lib/nodo/core";
import type { MissionInput } from "@/lib/nodo/orchestrator";

/**
 * Hook para interactuar con el sistema NODO desde la UI.
 */
export function useNodo() {
  const [result, setResult] = useState<NodoRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<NodoRunResult[]>([]);

  const run = useCallback(async (input: MissionInput) => {
    setRunning(true);
    try {
      const core = getNodoCore();
      const res = await core.run(input);
      setResult(res);
      setHistory(core.getHistory());
    } finally {
      setRunning(false);
    }
  }, []);

  const agents = result ? getNodoCore().getAgents() : [];
  const memoryStats = getNodoCore().memory.stats();
  const logs = getNodoCore().governance.getLogs();

  return { result, running, history, agents, memoryStats, logs, run };
}
