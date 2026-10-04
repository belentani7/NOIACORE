"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getFactory, type ProducedAsset, type CreativeBrief, type AutonomousFactory } from "@/lib/factory/orchestrator";

interface FactoryState {
  assets: ProducedAsset[];
  stats: ReturnType<AutonomousFactory["getStats"]>;
  lastTick: { brief: CreativeBrief; assets: ProducedAsset[]; qcPassed: number; qcFailed: number } | null;
  running: boolean;
}

/**
 * Hook que ejecuta el loop infinito de la fábrica creativa eterna.
 * Produce de forma continua cada 30-60s (sutil, no alarmante).
 * Nunca detiene la acumulación.
 */
export function useFactory(intervalMs = 30000): FactoryState & { tick: () => void; toggle: () => void } {
  const factoryRef = useRef<AutonomousFactory | null>(null);
  const [state, setState] = useState<FactoryState>({
    assets: [],
    stats: { totalProduced: 0, activeAssets: 0, archivedAssets: 0, seasons: 0, producersActive: 20 },
    lastTick: null,
    running: false,
  });

  const getFactoryInstance = useCallback((): AutonomousFactory => {
    if (!factoryRef.current) factoryRef.current = getFactory();
    return factoryRef.current;
  }, []);

  const tick = useCallback(() => {
    const factory = getFactoryInstance();
    const result = factory.tick();
    const qcPassed = result.qcResults.filter((q) => q.passed).length;
    const qcFailed = result.qcResults.length - qcPassed;
    setState((prev) => ({
      assets: factory.getAssets(),
      stats: factory.getStats(),
      lastTick: { brief: result.brief, assets: result.assets, qcPassed, qcFailed },
      running: prev.running,
    }));
  }, [getFactoryInstance]);

  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, running: !prev.running }));
  }, []);

  // Auto-tick al montar + generación inicial
  useEffect(() => {
    const factory = getFactoryInstance();
    // Generar 5 piezas iniciales
    for (let i = 0; i < 5; i++) {
      factory.tick();
    }
    setState({
      assets: factory.getAssets(),
      stats: factory.getStats(),
      lastTick: null,
      running: true,
    });
  }, [getFactoryInstance]);

  // Loop infinito
  useEffect(() => {
    if (!state.running) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const delay = intervalMs + Math.random() * 15000;
      timeoutId = setTimeout(() => {
        tick();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, [state.running, intervalMs, tick]);

  return { ...state, tick, toggle };
}
