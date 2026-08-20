"use client";

import { useEffect, useRef } from "react";
import { useNoiaStore } from "@/lib/store";
import { SHADERS } from "@/lib/shaders";

/**
 * Modo presentación: cuando está activo y el visor está abierto,
 * cicla automáticamente entre shaders cada N segundos.
 * No renderiza UI visible — solo controla el estado del draft.
 */
export function PresentationMode() {
  const presentationMode = useNoiaStore((s) => s.presentationMode);
  const viewerObraId = useNoiaStore((s) => s.viewerObraId);
  const setDraft = useNoiaStore((s) => s.setDraft);
  const setActiveShader = useNoiaStore((s) => s.setActiveShader);
  const setViewerObraId = useNoiaStore((s) => s.setViewerObraId);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!presentationMode) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    // Si no hay viewer abierto, abrirlo con el primer shader
    if (!viewerObraId) {
      const first = SHADERS[0];
      setActiveShader(first.id);
      setViewerObraId("shader-" + first.id);
    }
    // Ciclar cada 5 segundos
    intervalRef.current = setInterval(() => {
      const draft = useNoiaStore.getState().draft;
      const currentIndex = SHADERS.findIndex((s) => s.id === draft.shader);
      const nextIndex = (currentIndex + 1) % SHADERS.length;
      const next = SHADERS[nextIndex];
      setDraft({
        shader: next.id,
        hue: Math.random(),
        complexity: 0.4 + Math.random() * 0.4,
        intensity: 0.3 + Math.random() * 0.4,
      });
      setActiveShader(next.id);
      // Asegurar que el viewer esté abierto en modo shader
      const currentViewer = useNoiaStore.getState().viewerObraId;
      if (!currentViewer || !currentViewer.startsWith("shader-")) {
        setViewerObraId("shader-" + next.id);
      }
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [presentationMode, viewerObraId, setDraft, setActiveShader, setViewerObraId]);

  return null;
}
