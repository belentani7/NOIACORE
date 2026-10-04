"use client";

import { useState, useMemo } from "react";
import type { Obra } from "@/lib/obras";
import { SHADERS } from "@/lib/shaders";
import { useObras } from "@/hooks/use-obras";
import { ShaderCanvas } from "./ShaderCanvas";
import { useNoiaStore } from "@/lib/store";
import { Heart, Bookmark, Eye, Expand, GitFork, Flame, Clock, RefreshCw, Loader2, Search, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type SortKey = "trending" | "recientes" | "likes";

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
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
  const months = Math.floor(days / 30);
  return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
}

export function ObrasGallery() {
  const { obras, loading, refetch } = useObras();
  const [sort, setSort] = useState<SortKey>("trending");
  const [query, setQuery] = useState("");
  const [shaderFilter, setShaderFilter] = useState<string>("all");

  const liked = useNoiaStore((s) => s.liked);
  const collected = useNoiaStore((s) => s.collected);
  const toggleLike = useNoiaStore((s) => s.toggleLike);
  const toggleCollect = useNoiaStore((s) => s.toggleCollect);
  const setViewerObraId = useNoiaStore((s) => s.setViewerObraId);
  const setActiveShader = useNoiaStore((s) => s.setActiveShader);
  const setDraft = useNoiaStore((s) => s.setDraft);
  const user = useNoiaStore((s) => s.user);
  const setAuthOpen = useNoiaStore((s) => s.setAuthOpen);
  const pushNotification = useNoiaStore((s) => s.pushNotification);
  const openComments = useNoiaStore((s) => s.openComments);
  const logActivity = useNoiaStore((s) => s.logActivity);

  const sorted = useMemo(() => {
    let arr = [...obras];
    // filtro por shader
    if (shaderFilter !== "all") {
      arr = arr.filter((o) => o.shader === shaderFilter);
    }
    // filtro por búsqueda (título, autor, tags)
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.author.toLowerCase().includes(q) ||
          o.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sort === "trending") {
      arr.sort((a, b) => b.likes + b.views * 0.1 - (a.likes + a.views * 0.1));
    } else if (sort === "likes") {
      arr.sort((a, b) => b.likes - a.likes);
    } else {
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return arr;
  }, [obras, sort, shaderFilter, query]);

  const handleLike = (o: Obra) => {
    const wasLiked = liked.includes(o.id);
    toggleLike(o.id);
    if (!wasLiked) {
      pushNotification({
        title: "Like registrado",
        body: `'${o.title}' · ${formatNumber(o.likes + 1)} likes`,
        tone: "magenta",
      });
      logActivity({ kind: "like", target: o.title });
    }
  };
  const handleCollect = (o: Obra) => {
    const wasCollected = collected.includes(o.id);
    toggleCollect(o.id);
    if (!wasCollected) {
      pushNotification({
        title: user ? `Obra guardada en tu colección` : "Obra guardada (local)",
        body: `'${o.title}' por ${o.author}`,
        tone: "amber",
      });
      logActivity({ kind: "collect", target: o.title });
    }
  };
  const handleRemix = (o: Obra) => {
    if (!user) {
      setAuthOpen(true);
      pushNotification({
        title: "Entra para remezclar",
        body: "Necesitas una identidad para crear un remix.",
        tone: "red",
      });
      return;
    }
    setDraft({
      shader: o.shader,
      hue: o.hue,
      complexity: o.complexity,
      intensity: o.intensity,
      title: `${o.title} (remix)`,
      excerpt: `Remix de '${o.title}' por ${o.author}.`,
      tags: [...o.tags, "remix"],
    });
    pushNotification({
      title: "Obra cargada en el estudio",
      body: `Edita los parámetros de '${o.title}' y publica tu remix.`,
      tone: "teal",
    });
    document.getElementById("estudio")?.scrollIntoView({ behavior: "smooth" });
  };

  const SORTS: { key: SortKey; label: string; icon: typeof Flame }[] = [
    { key: "trending", label: "Tendencia", icon: Flame },
    { key: "recientes", label: "Recientes", icon: Clock },
    { key: "likes", label: "Más likes", icon: Heart },
  ];

  return (
    <section id="galeria" className="relative scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(0.50_0.045_255)]">
              galería pública · {obras.length} obras
              {loading && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-5xl">
              Obras que ya respiran
            </h2>
            <p className="mt-3 text-muted-foreground">
              Cada tarjeta ejecuta su shader en tiempo real. Dale like, guárdala,
              remezcla sus parámetros o ábrela en el visor.
            </p>
          </div>

          {/* sort + refrescar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/30 p-1">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
                    sort === s.key
                      ? "bg-[oklch(0.50_0.045_255)]/20 text-[oklch(0.50_0.045_255)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <s.icon aria-hidden="true" className="h-3 w-3" />
                  {s.label}
                </button>
              ))}
            </div>
            <button
              onClick={refetch}
              aria-label="Refrescar galería" title="Refrescar galería"
              className="grid h-8 w-8 place-items-center rounded-md border border-border/70 bg-secondary/30 text-muted-foreground transition-colors hover:text-foreground"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Búsqueda + filtros por shader */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 60))}
              placeholder="Buscar por título, autor o tag…"
              className="w-full rounded-lg border border-border/70 bg-background/60 py-2 pl-9 pr-8 text-sm outline-none transition-colors focus:border-[oklch(0.92_0.02_250)]/60"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setShaderFilter("all")}
              className={cn(
                "rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
                shaderFilter === "all"
                  ? "border-[oklch(0.92_0.02_250)]/60 bg-[oklch(0.92_0.02_250)]/15 text-[oklch(0.92_0.02_250)]"
                  : "border-border/50 text-muted-foreground hover:text-foreground"
              )}
            >
              todos
            </button>
            {SHADERS.map((s) => (
              <button
                key={s.id}
                onClick={() => setShaderFilter(s.id)}
                className={cn(
                  "rounded-md border px-2.5 py-1 font-mono text-[10px] transition-colors",
                  shaderFilter === s.id
                    ? "border-[oklch(0.92_0.02_250)]/60 bg-[oklch(0.92_0.02_250)]/15 text-[oklch(0.92_0.02_250)]"
                    : "border-border/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* count resultados */}
        {(query || shaderFilter !== "all") && (
          <div className="mt-3 font-mono text-[11px] text-muted-foreground">
            {sorted.length} resultado{sorted.length !== 1 ? "s" : ""} ·{" "}
            <button
              onClick={() => {
                setQuery("");
                setShaderFilter("all");
              }}
              className="text-[oklch(0.92_0.02_250)] hover:underline"
            >
              limpiar filtros
            </button>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading && sorted.length === 0 && (
            <>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={"sk" + i}
                  className="overflow-hidden rounded-2xl border border-border/70 bg-card/50"
                >
                  <div className="shimmer aspect-[4/3] w-full" />
                  <div className="p-4">
                    <div className="shimmer h-5 w-2/3 rounded" />
                    <div className="shimmer mt-2 h-3 w-full rounded" />
                    <div className="shimmer mt-1.5 h-3 w-4/5 rounded" />
                    <div className="mt-4 flex items-center justify-between">
                      <div className="shimmer h-3 w-24 rounded" />
                      <div className="flex gap-1.5">
                        <div className="shimmer h-8 w-8 rounded-md" />
                        <div className="shimmer h-8 w-8 rounded-md" />
                        <div className="shimmer h-8 w-8 rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          {sorted.length === 0 && !loading && (
            <div className="col-span-full rounded-2xl border border-dashed border-border/60 bg-card/30 py-16 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                sin resultados
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ninguna obra coincide con tu búsqueda. Prueba otros filtros.
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setShaderFilter("all");
                }}
                className="mt-4 rounded-md bg-[oklch(0.92_0.02_250)] px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-[oklch(0.78_0.14_195)]"
              >
                Limpiar filtros
              </button>
            </div>
          )}
          {sorted.map((o) => {
            const isLiked = liked.includes(o.id);
            const isCollected = collected.includes(o.id);
            return (
              <article
                key={o.id}
                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/50 transition-all duration-300 hover:border-[oklch(0.50_0.045_255)]/40 hover:shadow-[0_0_36px_-14px_oklch(0.50_0.045_255_/_0.4)]"
              >
                {/* preview */}
                <div className="relative aspect-[4/3]">
                  <ShaderCanvas
                    shader={o.shader}
                    hue={o.hue}
                    complexity={o.complexity}
                    intensity={o.intensity}
                    className="h-full w-full"
                    rounded="rounded-none"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  {/* expand + remix */}
                  <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      onClick={() => handleRemix(o)}
                      aria-label="Remezclar obra" title="Remezclar obra"
                      className="grid h-8 w-8 place-items-center rounded-md bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-[oklch(0.92_0.02_250)]"
                    >
                      <GitFork className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveShader(o.shader);
                        setViewerObraId(o.id);
                      }}
                      aria-label="Abrir en visor" title="Abrir en visor"
                      className="grid h-8 w-8 place-items-center rounded-md bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
                    >
                      <Expand className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {/* tags */}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {o.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-background/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground backdrop-blur"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  {/* author */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.92_0.02_250)] to-[oklch(0.50_0.045_255)] text-[11px] font-bold text-background">
                      {o.author.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="leading-tight">
                      <div className="font-mono text-[11px] text-foreground/90">{o.author}</div>
                      <div className="font-mono text-[9px] text-muted-foreground">{timeAgo(o.createdAt)}</div>
                    </div>
                  </div>
                </div>

                {/* body */}
                <div className="p-4">
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
                    {o.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                    {o.excerpt}
                  </p>

                  {/* stats + actions */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {formatNumber(o.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {formatNumber(o.likes + (isLiked ? 1 : 0))}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="h-3 w-3" /> {formatNumber(o.collected + (isCollected ? 1 : 0))}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleLike(o)}
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-md border transition-colors",
                          isLiked
                            ? "border-[oklch(0.50_0.045_255)]/60 bg-[oklch(0.50_0.045_255)]/15 text-[oklch(0.50_0.045_255)]"
                            : "border-border/60 text-muted-foreground hover:text-foreground"
                        )}
                        title={isLiked ? "Quitar like" : "Me gusta"}
                      >
                        <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
                      </button>
                      <button
                        onClick={() => handleCollect(o)}
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-md border transition-colors",
                          isCollected
                            ? "border-[oklch(0.78_0.025_250)]/60 bg-[oklch(0.78_0.025_250)]/15 text-[oklch(0.78_0.025_250)]"
                            : "border-border/60 text-muted-foreground hover:text-foreground"
                        )}
                        title={isCollected ? "Quitar de colección" : "Guardar"}
                      >
                        <Bookmark className={cn("h-3.5 w-3.5", isCollected && "fill-current")} />
                      </button>
                      <button
                        onClick={() => handleRemix(o)}
                        className="grid h-8 w-8 place-items-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-[oklch(0.92_0.02_250)]/60 hover:text-[oklch(0.92_0.02_250)]"
                        aria-label="Remezclar" title="Remezclar"
                      >
                        <GitFork className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openComments(o.id)}
                        className="grid h-8 w-8 place-items-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-[oklch(0.85_0.035_250)]/60 hover:text-[oklch(0.85_0.035_250)]"
                        aria-label="Comentarios" title="Comentarios"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
