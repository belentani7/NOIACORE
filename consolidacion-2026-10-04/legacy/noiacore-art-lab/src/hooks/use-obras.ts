"use client";

import { useEffect, useState, useCallback } from "react";
import type { Obra } from "@/lib/obras";
import { SEED_OBRAS } from "@/lib/obras";

interface UseObrasResult {
  obras: Obra[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para cargar obras desde /api/obras (seed + DB).
 * Devuelve el seed inmediatamente y luego fusiona las obras de DB.
 */
export function useObras(): UseObrasResult {
  const [obras, setObras] = useState<Obra[]>(SEED_OBRAS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    // Marcamos loading dentro del callback asíncrono, no sincrónicamente.
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    fetch("/api/obras?XTransformPort=3000")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data: { obras?: Obra[] }) => {
        if (cancelled) return;
        if (data.obras && data.obras.length > 0) {
          setObras(data.obras);
        }
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error al cargar obras");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return { obras, loading, error, refetch };
}
