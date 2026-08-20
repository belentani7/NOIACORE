"use client";

import { useEffect, useCallback } from "react";
import { SonicSwarm } from "@/lib/audio-engine";
import { useNoiaStore } from "@/lib/store";

let swarmSingleton: SonicSwarm | null = null;

/**
 * Hook para controlar el Enjambre Sónico.
 * Expone start/stop y sincroniza las bandas de audio con el store.
 */
export function useSonicSwarm() {
  const audioEnabled = useNoiaStore((s) => s.audioEnabled);
  const setAudioEnabled = useNoiaStore((s) => s.setAudioEnabled);
  const setAudioBands = useNoiaStore((s) => s.setAudioBands);
  const pushNotification = useNoiaStore((s) => s.pushNotification);

  const getSwarm = useCallback(() => {
    if (!swarmSingleton) {
      swarmSingleton = new SonicSwarm((bands) => {
        setAudioBands(bands);
      });
    }
    return swarmSingleton;
  }, [setAudioBands]);

  const start = useCallback(async () => {
    const ok = await getSwarm().start();
    if (ok) {
      setAudioEnabled(true);
      pushNotification({
        title: "Enjambre sónico activo",
        body: "El audio reacciona a los shaders. Activa 'reactivo' en el visor.",
        tone: "teal",
      });
    } else {
      pushNotification({
        title: "Audio no disponible",
        body: "El navegador bloqueó el contexto de audio.",
        tone: "red",
      });
    }
  }, [getSwarm, setAudioEnabled, pushNotification]);

  const stop = useCallback(async () => {
    await getSwarm().stop();
    setAudioEnabled(false);
    setAudioBands({ bass: 0, mid: 0, high: 0, level: 0 });
  }, [getSwarm, setAudioEnabled, setAudioBands]);

  const toggle = useCallback(() => {
    if (audioEnabled) void stop();
    else void start();
  }, [audioEnabled, start, stop]);

  useEffect(() => {
    return () => {
      // El singleton vive mientras la app exista; se detiene con stop().
    };
  }, []);

  return { start, stop, toggle, audioEnabled };
}
