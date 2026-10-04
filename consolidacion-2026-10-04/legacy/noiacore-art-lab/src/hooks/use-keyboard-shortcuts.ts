"use client";

import { useEffect } from "react";
import { useNoiaStore } from "@/lib/store";

/**
 * Hook global para atajos de teclado de la app.
 * - Cmd/Ctrl + K: abre/cierra la paleta de comandos.
 * - Shift + ?: inicia el tour guiado.
 */
export function useKeyboardShortcuts() {
  const setPaletteOpen = useNoiaStore((s) => s.setPaletteOpen);
  const paletteOpen = useNoiaStore((s) => s.paletteOpen);
  const startTour = useNoiaStore((s) => s.startTour);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!useNoiaStore.getState().paletteOpen);
      }
      // Shift + ? (Shift + /)
      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        startTour();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen, paletteOpen, startTour]);
}
