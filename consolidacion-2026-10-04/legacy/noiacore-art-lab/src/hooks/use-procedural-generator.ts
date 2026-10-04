"use client";

import { useEffect, useState, useCallback } from "react";
import { generateProceduralObra, type GeneratedObra } from "@/lib/procedural-generator";
import { useNoiaStore } from "@/lib/store";

/**
 * Flujo procedural infinito con ventana visual acotada.
 * La secuencia no termina: el contador sigue creciendo y solo se reciclan
 * las obras antiguas del DOM para mantener el rendimiento estable.
 */
export function useProceduralGenerator() {
  const [generated, setGenerated] = useState<GeneratedObra[]>([]);
  const [generatedCount, setGeneratedCount] = useState(0);
  const pushNotification = useNoiaStore((s) => s.pushNotification);
  const logActivity = useNoiaStore((s) => s.logActivity);

  const addOne = useCallback(() => {
    const obra = generateProceduralObra();
    setGeneratedCount((count) => count + 1);
    setGenerated((prev) => [obra, ...prev].slice(0, 24));
    // Notificación sutil (solo cada 3 obras para no ser alarmante)
    if (Math.random() < 0.33) {
      pushNotification({
        title: "Nueva obra generada",
        body: `'${obra.title}' por ${obra.author} · shader ${obra.shader}`,
        tone: "teal",
      });
    }
    logActivity({ kind: "publish", target: obra.title });
  }, [pushNotification, logActivity]);

  useEffect(() => {
    // Generar 3 obras al iniciar (vía microtask para evitar setState síncrono)
    const initId = setTimeout(() => {
      const initial = Array.from({ length: 3 }, () => generateProceduralObra());
      setGenerated(initial);
      setGeneratedCount(initial.length);
    }, 0);

    // Generación continua: cada 45-90s (aleatorio para parecer orgánico)
    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const delay = 45000 + Math.random() * 45000;
      timeoutId = setTimeout(() => {
        addOne();
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    return () => {
      clearTimeout(initId);
      clearTimeout(timeoutId);
    };
  }, [addOne]);

  return { generated, generatedCount, addOne };
}
