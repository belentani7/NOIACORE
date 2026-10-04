"use client";

import { SHADERS } from "@/lib/shaders";
import { ShaderCanvas } from "./ShaderCanvas";
import { Reveal } from "./Reveal";
import { useNoiaStore } from "@/lib/store";
import { Eye, Heart, Bookmark, Expand, Cpu, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Layout asimétrico: el primer shader es destacado (col-span 2, row-span 2)
const SPANS = [
  "sm:col-span-2 sm:row-span-2",
  "",
  "",
  "sm:col-span-2",
  "",
  "",
  "",
  "sm:col-span-2",
  "",
];

export function ShaderGallery() {
  const [hovered, setHovered] = useState<string | null>(null);
  const toggleLike = useNoiaStore((s) => s.toggleLike);
  const toggleCollect = useNoiaStore((s) => s.toggleCollect);
  const isLiked = useNoiaStore((s) => s.isLiked);
  const isCollected = useNoiaStore((s) => s.isCollected);
  const setActiveShader = useNoiaStore((s) => s.setActiveShader);
  const setViewerObraId = useNoiaStore((s) => s.setViewerObraId);

  return (
    <section id="shaders" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(0.92_0.02_250)]">
              <Cpu className="h-3 w-3" />
              colección · {SHADERS.length} fragmentos
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-5xl">
              La paleta viva del{" "}
              <span className="bg-gradient-to-r from-[oklch(0.92_0.02_250)] to-[oklch(0.50_0.045_255)] bg-clip-text text-transparent">
                laboratorio
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Nueve fragment shaders escritos a mano, compilados directamente en tu
              navegador. Pasa el cursor por encima para acelerar el tiempo y mover
              el campo. Cada obra es un universo autónomo de luz y movimiento.
            </p>
          </Reveal>
          <div className="flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-[oklch(0.92_0.02_250)]" />
              render activo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.78_0.025_250)] noia-pulse" />
              hover = acelera
            </span>
          </div>
        </div>

        {/* Bento grid */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {SHADERS.map((s, i) => {
            const liked = isLiked("shader-" + s.id);
            const collected = isCollected("shader-" + s.id);
            const span = SPANS[i] ?? "";
            const big = span.includes("row-span-2");
            return (
              <article
                key={s.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 transition-all duration-300 hover:border-[oklch(0.92_0.02_250)]/50 hover:shadow-[0_0_40px_-12px_oklch(0.92_0.02_250_/_0.4)]",
                  span
                )}
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Canvas */}
                <div className={cn("relative", big ? "aspect-square sm:h-full" : "aspect-[4/3]")}>
                  <ShaderCanvas
                    shader={s.id}
                    hue={0.5}
                    complexity={0.55}
                    intensity={0.4}
                    className="h-full w-full"
                    rounded="rounded-none"
                    showFps={hovered === s.id}
                  />
                  {/* overlay gradient */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent opacity-90" />
                  {/* top tag */}
                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <span className="rounded-md bg-background/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[oklch(0.92_0.02_250)] backdrop-blur">
                      {s.tag}
                    </span>
                    <span className="rounded-md bg-background/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
                      #{String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  {/* hover actions */}
                  <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      onClick={() => toggleLike("shader-" + s.id)}
                      title={liked ? "Quitar like" : "Me gusta"}
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-md backdrop-blur transition-colors",
                        liked
                          ? "bg-[oklch(0.50_0.045_255)]/90 text-background"
                          : "bg-background/70 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
                    </button>
                    <button
                      onClick={() => toggleCollect("shader-" + s.id)}
                      title={collected ? "Quitar de colección" : "Guardar"}
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-md backdrop-blur transition-colors",
                        collected
                          ? "bg-[oklch(0.78_0.025_250)]/90 text-background"
                          : "bg-background/70 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Bookmark className={cn("h-3.5 w-3.5", collected && "fill-current")} />
                    </button>
                    <button
                      onClick={() => {
                        setActiveShader(s.id);
                        setViewerObraId("shader-" + s.id);
                      }}
                      aria-label="Ver en grande" title="Ver en grande"
                      className="grid h-8 w-8 place-items-center rounded-md bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
                    >
                      <Expand className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Footer info */}
                <div className="relative z-10 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
                      {s.name}
                    </h3>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {s.nameEs}
                    </span>
                  </div>
                  <p className={cn("mt-1.5 text-muted-foreground", big ? "text-sm" : "text-xs line-clamp-2")}>
                    {s.description}
                  </p>
                  {/* tech footer */}
                  <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-muted-foreground/80">
                    <span className="flex items-center gap-1">
                      <Cpu className="h-3 w-3" /> {s.precision}
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" /> {s.fps}fps
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {s.compat}
                    </span>
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
