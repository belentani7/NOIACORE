"use client";

import { useState, useEffect, useCallback } from "react";

export interface Comment {
  id: string;
  obraId: string;
  user: string;
  body: string;
  at: string;
  likes: number;
}

// Comentarios seed para respuesta inmediata antes del fetch
const SEED_COMMENTS: Comment[] = [
  {
    id: "c1",
    obraId: "obra-005",
    user: "n0va",
    body: "El núcleo me hipnotiza. Cada vez que el bass golpea, siento que respira.",
    at: "hace 2h",
    likes: 24,
  },
  {
    id: "c2",
    obraId: "obra-005",
    user: "drift.7",
    body: "Increíble cómo el hue rota con el ángulo. Geometría pura.",
    at: "hace 5h",
    likes: 12,
  },
  {
    id: "c3",
    obraId: "obra-006",
    user: "ostinato",
    body: "La pieza más silenciosa del lab. La uso para meditar.",
    at: "hace 1d",
    likes: 41,
  },
  {
    id: "c4",
    obraId: "obra-011",
    user: "mira.luz",
    body: "Las estrellas a multi-resolución son magia. ¿Cómo lograste ese brillo?",
    at: "hace 3h",
    likes: 18,
  },
];

interface UseCommentsResult {
  comments: Comment[];
  loading: boolean;
  posting: boolean;
  post: (body: string) => Promise<boolean>;
  refetch: () => void;
}

/**
 * Hook para cargar y publicar comentarios de una obra.
 * Mezcla seed (inmediato) + DB (fetch) + posts locales.
 */
export function useComments(
  obraId: string | null,
  userHandle?: string | null
): UseCommentsResult {
  const [dbComments, setDbComments] = useState<Comment[]>([]);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!obraId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/comments?obraId=${encodeURIComponent(obraId)}&XTransformPort=3000`)
      .then((r) => r.json())
      .then((data: { comments?: Comment[] }) => {
        if (cancelled) return;
        if (data.comments && data.comments.length > 0) {
          setDbComments(
            data.comments.map((c) => ({
              ...c,
              at: timeAgo(c.at),
            }))
          );
        }
      })
      .catch(() => {
        /* noop — usamos seed */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [obraId, nonce]);

  const post = useCallback(
    async (body: string): Promise<boolean> => {
      if (!obraId || !body.trim()) return false;
      setPosting(true);
      try {
        const res = await fetch("/api/comments?XTransformPort=3000", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            obraId,
            handle: userHandle ?? "anon",
            body: body.trim().slice(0, 240),
          }),
        });
        const data = await res.json();
        if (data.ok && data.comment) {
          setLocalComments((prev) => [
            { ...data.comment, at: "ahora" },
            ...prev,
          ]);
          return true;
        }
        // fallback: añadir localmente aunque la DB falle
        setLocalComments((prev) => [
          {
            id: "local_" + Date.now(),
            obraId,
            user: userHandle ?? "anon",
            body: body.trim().slice(0, 240),
            at: "ahora",
            likes: 0,
          },
          ...prev,
        ]);
        return true;
      } catch {
        setLocalComments((prev) => [
          {
            id: "local_" + Date.now(),
            obraId,
            user: userHandle ?? "anon",
            body: body.trim().slice(0, 240),
            at: "ahora",
            likes: 0,
          },
          ...prev,
        ]);
        return true;
      } finally {
        setPosting(false);
      }
    },
    [obraId, userHandle]
  );

  const seed = obraId ? SEED_COMMENTS.filter((c) => c.obraId === obraId) : [];
  const all = [...localComments, ...dbComments, ...seed];

  return { comments: all, loading, posting, post, refetch };
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  return `hace ${Math.floor(days / 30)} meses`;
}
