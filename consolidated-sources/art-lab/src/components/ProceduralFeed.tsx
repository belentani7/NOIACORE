"use client";

import { useProceduralGenerator } from "@/hooks/use-procedural-generator";
import { ShaderCanvas } from "./ShaderCanvas";
import { useNoiaStore } from "@/lib/store";
import { Sparkles, Eye, Heart, Bookmark, Expand, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

function formatNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export function ProceduralFeed() {
  const { generated, generatedCount } = useProceduralGenerator();
  const liked = useNoiaStore((s) => s.liked);
  const collected = useNoiaStore((s) => s.collected);
  const toggleLike = useNoiaStore((s) => s.toggleLike);
  const toggleCollect = useNoiaStore((s) => s.toggleCollect);
  const setViewerObraId = useNoiaStore((s) => s.setViewerObraId);
  const setActiveShader = useNoiaStore((s) => s.setActiveShader);

  if (generated.length === 0) return null;

  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mb-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(0.92_0.02_250)]">
                <Bot className="h-3 w-3" />
                generación automática · núcleo activo
              </div>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
                El laboratorio{" "}
                <span className="text-grad-tri">se crea a sí mismo</span>
              </h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Obras generadas proceduralmente por el núcleo en un flujo infinito. Cada 45-90 segundos
                emerge una nueva variación: paleta armónica, shader y parámetros
                deterministas pero coherentes.
              </p>
            </div>
            <div className="hidden items-center gap-2 font-mono text-[11px] text-muted-foreground sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[oklch(0.92_0.02_250)] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[oklch(0.92_0.02_250)]" />
              </span>
              {generatedCount} obras generadas · ventana {generated.length}
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {generated.slice(0, 8).map((o, i) => {
            const isLiked = liked.includes(o.id);
            const isCollected = collected.includes(o.id);
            return (
              <article
                key={o.id}
                className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/50 transition-all duration-300 hover:border-[oklch(0.92_0.02_250)]/40 elevation-1 hover:elevation-3 card-lift"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="relative aspect-square">
                  <ShaderCanvas
                    shader={o.shader}
                    hue={o.hue}
                    complexity={o.complexity}
                    intensity={o.intensity}
                    className="h-full w-full"
                    rounded="rounded-none"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  {/* badge procedural */}
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-background/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[oklch(0.92_0.02_250)] backdrop-blur">
                    <Bot className="h-2.5 w-2.5" />
                    auto
                  </div>
                  {/* expand */}
                  <button
                    onClick={() => {
                      setActiveShader(o.shader);
                      setViewerObraId(o.id);
                    }}
                    title="Abrir en visor"
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-background/70 text-muted-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:text-foreground"
                  >
                    <Expand className="h-3 w-3" />
                  </button>
                  {/* title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="truncate font-[family-name:var(--font-display)] text-sm font-bold">
                      {o.title}
                    </h3>
                    <div className="font-mono text-[9px] text-muted-foreground">
                      {o.author} · {timeAgo(o.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2.5">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-2.5 w-2.5" /> {formatNum(o.views)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-2.5 w-2.5" /> {formatNum(o.likes + (isLiked ? 1 : 0))}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleLike(o.id)}
                      className={cn(
                        "grid h-6 w-6 place-items-center rounded border transition-colors",
                        isLiked
                          ? "border-[oklch(0.50_0.045_255)]/50 bg-[oklch(0.50_0.045_255)]/10 text-[oklch(0.50_0.045_255)]"
                          : "border-border/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Heart className={cn("h-3 w-3", isLiked && "fill-current")} />
                    </button>
                    <button
                      onClick={() => toggleCollect(o.id)}
                      className={cn(
                        "grid h-6 w-6 place-items-center rounded border transition-colors",
                        isCollected
                          ? "border-[oklch(0.78_0.025_250)]/50 bg-[oklch(0.78_0.025_250)]/10 text-[oklch(0.78_0.025_250)]"
                          : "border-border/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Bookmark className={cn("h-3 w-3", isCollected && "fill-current")} />
                    </button>
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
