"use client";

import { useState, useMemo } from "react";
import { useNoiaStore } from "@/lib/store";
import { SEED_OBRAS, type Obra } from "@/lib/obras";
import { useComments } from "@/hooks/use-comments";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Send, X, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommentsPanel() {
  const open = useNoiaStore((s) => s.commentsOpen);
  const obraId = useNoiaStore((s) => s.commentsObraId);
  const setCommentsOpen = useNoiaStore((s) => s.setCommentsOpen);
  const user = useNoiaStore((s) => s.user);
  const setAuthOpen = useNoiaStore((s) => s.setAuthOpen);
  const pushNotification = useNoiaStore((s) => s.pushNotification);
  const [text, setText] = useState("");

  const obra: Obra | undefined = useMemo(
    () => SEED_OBRAS.find((o) => o.id === obraId),
    [obraId]
  );

  const { comments, loading, posting, post } = useComments(obraId, user?.handle);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const toggleCommentLike = (commentId: string) => {
    if (!user) {
      setAuthOpen(true);
      pushNotification({
        title: "Entra para dar like",
        body: "Necesitas una identidad para reaccionar.",
        tone: "red",
      });
      return;
    }
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim().slice(0, 240);
    if (!body) return;
    if (!user) {
      setAuthOpen(true);
      pushNotification({
        title: "Entra para comentar",
        body: "Necesitas una identidad para dejar un comentario.",
        tone: "red",
      });
      return;
    }
    const ok = await post(body);
    if (ok) {
      setText("");
      pushNotification({
        title: "Comentario publicado",
        body: `En '${obra?.title ?? "obra"}'`,
        tone: "teal",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setCommentsOpen(false)}>
      <DialogContent className="glass-strong max-w-lg overflow-hidden rounded-2xl border-border/70 p-0">
        <DialogTitle className="sr-only">
          Comentarios · {obra?.title ?? "Obra"}
        </DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 bg-[oklch(0.16_0.02_230)] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[oklch(0.92_0.02_250)]" />
            <div>
              <div className="font-[family-name:var(--font-display)] text-sm font-bold">
                Comentarios
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                {obra?.title ?? "—"} · {comments.length}
                {loading && <Loader2 className="ml-1 inline h-2.5 w-2.5 animate-spin" />}
              </div>
            </div>
          </div>
          <button
            onClick={() => setCommentsOpen(false)}
            className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Lista */}
        <div className="max-h-[340px] min-h-[200px] overflow-y-auto p-4">
          {comments.length === 0 && !loading ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Aún no hay comentarios.
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Sé el primero en dejar tu impresión.
                </p>
              </div>
            </div>
          ) : loading && comments.length === 0 ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-lg border border-border/50 bg-background/40 p-3">
                  <div className="flex items-center gap-2">
                    <div className="shimmer h-7 w-7 rounded-full" />
                    <div className="shimmer h-3 w-24 rounded" />
                  </div>
                  <div className="shimmer mt-2 h-3 w-full rounded" />
                  <div className="shimmer mt-1.5 h-3 w-2/3 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-border/50 bg-background/40 p-3 noia-rise"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.92_0.02_250)] to-[oklch(0.50_0.045_255)] text-[11px] font-bold text-background">
                      {c.user.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[12px] font-semibold text-foreground">
                          @{c.user}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {c.at}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleCommentLike(c.id)}
                      className={cn(
                        "flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] transition-colors",
                        likedComments.has(c.id)
                          ? "text-[oklch(0.50_0.045_255)]"
                          : "text-muted-foreground hover:text-[oklch(0.50_0.045_255)]"
                      )}
                      title={likedComments.has(c.id) ? "Quitar like" : "Me gusta"}
                    >
                      <Heart
                        className={cn("h-3 w-3", likedComments.has(c.id) && "fill-current")}
                      />
                      {c.likes + (likedComments.has(c.id) ? 1 : 0)}
                    </button>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={submit}
          className="flex items-center gap-2 border-t border-border/70 bg-[oklch(0.16_0.02_230)] p-3"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 240))}
            placeholder={
              user ? "Escribe un comentario…" : "Entra para comentar…"
            }
            maxLength={240}
            disabled={posting}
            className="flex-1 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-[oklch(0.92_0.02_250)]/60 disabled:opacity-50"
          />
          <span className="font-mono text-[10px] text-muted-foreground">
            {text.length}/240
          </span>
          <button
            type="submit"
            disabled={!text.trim() || posting}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-lg transition-colors",
              text.trim() && !posting
                ? "bg-[oklch(0.92_0.02_250)] text-background hover:bg-[oklch(0.78_0.14_195)]"
                : "cursor-not-allowed bg-secondary text-muted-foreground"
            )}
            aria-label="Enviar comentario"
          >
            {posting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
