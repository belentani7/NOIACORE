"use client";

import { ShaderCanvas } from "./ShaderCanvas";
import { useNoiaStore } from "@/lib/store";
import { ArrowRight, Cpu, Gauge, Layers, Zap, Compass } from "lucide-react";

const STATS = [
  { value: "9", label: "shaders GLSL", icon: Layers },
  { value: "2.4k", label: "obras publicadas", icon: Cpu },
  { value: "60fps", label: "render WebGL", icon: Gauge },
  { value: "∞", label: "variaciones cromáticas", icon: Zap },
];

export function Hero() {
  const setActiveShader = useNoiaStore((s) => s.setActiveShader);
  const setViewerObraId = useNoiaStore((s) => s.setViewerObraId);
  const startTour = useNoiaStore((s) => s.startTour);

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Fondo atmosférico — cosmic void + shader */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Imagen atmosférica HD — cosmic void */}
        <div
          className="absolute inset-0 opacity-25 bg-cover bg-center"
          style={{ backgroundImage: "url(/noiacore/cosmic-void.png)" }}
        />
        <ShaderCanvas
          shader="aurora"
          hue={0.6}
          complexity={0.55}
          intensity={0.28}
          interactive={false}
          rounded="rounded-none"
          className="h-full w-full opacity-50"
        />
        {/* Gradient overlay para profundidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/75 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,transparent,background)]" />
        {/* Mesh de gradientes fríos */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[oklch(0.92_0.02_250_/_0.10)] blur-[80px]" />
          <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-[oklch(0.50_0.045_255_/_0.12)] blur-[90px]" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[oklch(0.78_0.025_250_/_0.10)] blur-[70px]" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        {/* Badge */}
        <div className="noia-rise flex justify-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-secondary/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[oklch(0.92_0.02_250)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[oklch(0.92_0.02_250)]" />
            </span>
            <span>v3.0 · núcleo generativo activo</span>
            <span className="h-3 w-px bg-border/60" />
            <span className="text-[oklch(0.78_0.025_250)]">9 shaders · 9 audio-reactivos</span>
          </div>
        </div>

        {/* Title */}
        <h1
          className="noia-rise mx-auto mt-6 max-w-4xl text-center font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          Un laboratorio donde el{" "}
          <span className="relative inline-block">
            <span className="text-grad-tri">
              código se vuelve obra
            </span>
            <svg
              className="absolute -bottom-2 left-0 w-full"
              height="10"
              viewBox="0 0 300 10"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M2 6 Q 75 1 150 5 T 298 4"
                stroke="oklch(0.50 0.045 255 / 0.5)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        <p
          className="noia-rise mx-auto mt-8 max-w-2xl text-center text-base text-muted-foreground sm:text-lg text-balance"
          style={{ animationDelay: "160ms" }}
        >
          Noiacore es un estudio vivo para arte generativo con shaders GLSL.
          Escribe un fragment, ajústalo en tiempo real y publícalo como una obra
          que respira en el navegador de quien la colecciona.
        </p>

        {/* CTA */}
        <div
          className="noia-rise mt-9 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <a
            href="#shaders"
            className="group inline-flex items-center gap-2 rounded-lg bg-[oklch(0.92_0.02_250)] px-5 py-3 text-sm font-semibold text-background transition-all hover:bg-[oklch(0.78_0.14_195)] hover:shadow-[0_0_28px_oklch(0.92_0.02_250_/_0.5)]"
          >
            Explorar shaders
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#estudio"
            onClick={() => setActiveShader("silk")}
            className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-secondary/40 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-[oklch(0.50_0.045_255)]/60"
          >
            Abrir el estudio
          </a>
          <button
            onClick={() => startTour()}
            className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-secondary/40 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-[oklch(0.78_0.025_250)]/60 hover:text-[oklch(0.78_0.025_250)]"
          >
            <Compass className="h-4 w-4" />
            Tour guiado
          </button>
          <button
            onClick={() => setViewerObraId("obra-005")}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver obra destacada →
          </button>
        </div>

        {/* Stats */}
        <div
          className="noia-rise mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
          style={{ animationDelay: "320ms" }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="glass noise-overlay card-lift elevation-1 hover:elevation-3 ripple rounded-xl border border-border/60 p-4 text-center transition-all hover:border-[oklch(0.92_0.02_250)]/40 focus-ring"
            >
              <s.icon aria-hidden="true" className="mx-auto h-4 w-4 text-[oklch(0.78_0.025_250)]" />
              <div className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-on-surface">
                {s.value}
              </div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Mini bento collage — 2 canvas vivos + 3 gradientes estáticos */}
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="col-span-2 row-span-2 overflow-hidden rounded-xl border border-border/60">
            <ShaderCanvas
              shader="vortex"
              hue={0.06}
              complexity={0.6}
              intensity={0.5}
              className="aspect-square sm:h-full"
            />
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60">
            <ShaderCanvas shader="plasma" hue={0.82} complexity={0.7} intensity={0.5} className="aspect-square" />
          </div>
          {/* gradiente estático — silk teal */}
          <div
            className="relative overflow-hidden rounded-xl border border-border/60 aspect-square"
            style={{ background: "linear-gradient(135deg, oklch(0.4 0.14 195), oklch(0.5 0.18 345))" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,oklch(0.8_0.12_200_/_0.4),transparent_60%)]" />
            <div className="absolute bottom-2 left-2 font-mono text-[9px] uppercase tracking-wider text-background/70">silk</div>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
            {/* gradiente estático — noiseflow */}
            <div
              className="relative overflow-hidden rounded-xl border border-border/60 aspect-square"
              style={{ background: "linear-gradient(45deg, oklch(0.35 0.12 160), oklch(0.45 0.16 75))" }}
            >
              <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,oklch(0.6_0.14_195_/_0.3),oklch(0.6_0.2_345_/_0.3),oklch(0.7_0.15_75_/_0.3),oklch(0.6_0.14_195_/_0.3))]" />
              <div className="absolute bottom-2 left-2 font-mono text-[9px] uppercase tracking-wider text-background/70">noiseflow</div>
            </div>
            {/* gradiente estático — gridwarp */}
            <div
              className="relative overflow-hidden rounded-xl border border-border/60 aspect-square bg-[oklch(0.2_0.03_230)]"
            >
              <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,oklch(0.92_0.02_250_/_0.15)_0_1px,transparent_1px_12px),repeating-linear-gradient(90deg,oklch(0.92_0.02_250_/_0.15)_0_1px,transparent_1px_12px)]" />
              <div className="absolute bottom-2 left-2 font-mono text-[9px] uppercase tracking-wider text-foreground/50">gridwarp</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
