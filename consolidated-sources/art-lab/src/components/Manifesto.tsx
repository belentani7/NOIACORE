"use client";

import { ShaderCanvas } from "./ShaderCanvas";
import { BookOpen, GitBranch, Sparkles, Radio, Cpu, Feather } from "lucide-react";

const PILLARS = [
  {
    icon: Cpu,
    title: "Código como materia",
    body: "Cada obra nace de un fragment shader GLSL escrito a mano. Sin imágenes, sin assets: solo matemática y luz.",
    tone: "oklch(0.92 0.02 250)",
  },
  {
    icon: Sparkles,
    title: "Tiempo como pincel",
    body: "El tiempo es la variable que pinta. Un shader quieto es un cuadro; un shader en movimiento es un organismo.",
    tone: "oklch(0.50 0.045 255)",
  },
  {
    icon: Feather,
    title: "Noia como tono",
    body: "La noia —esa introspección inquieta— es el bajo continuo del laboratorio. Cada paleta la lleva consigo.",
    tone: "oklch(0.78 0.025 250)",
  },
];

const ROADMAP = [
  {
    phase: "Fase 01",
    status: "completado",
    title: "Núcleo generativo",
    items: ["9 fragment shaders GLSL", "Motor WebGL con loop compartido", "Visor con parámetros en vivo"],
  },
  {
    phase: "Fase 02",
    status: "completado",
    title: "Estudio y publicación",
    items: ["Editor de obras en tiempo real", "Galería pública con remix", "Paletas HSL armónicas"],
  },
  {
    phase: "Fase 03",
    status: "en curso",
    title: "Ecosistema vivo",
    items: ["Feed de actividad en tiempo real", "Export PNG de cualquier obra", "Colecciones persistentes"],
  },
  {
    phase: "Fase 04",
    status: "próximo",
    title: "Enjambre sónico",
    items: ["Audio reactivo Web Audio API", "Sintetizador generativo", "Sincronización shader ↔ sonido"],
  },
];

export function Manifesto() {
  return (
    <section id="manifiesto" className="relative scroll-mt-20 overflow-hidden py-20 sm:py-28">
      {/* Fondo: shader cosmos sutil */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
        <ShaderCanvas
          shader="cosmos"
          hue={0.7}
          complexity={0.6}
          intensity={0.25}
          interactive={false}
          rounded="rounded-none"
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Manifiesto */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(0.78_0.025_250)]">
            <BookOpen className="h-3 w-3" />
            manifiesto
          </div>
          <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
            El laboratorio no produce imágenes.{" "}
            <span className="bg-gradient-to-r from-[oklch(0.92_0.02_250)] via-[oklch(0.50_0.045_255)] to-[oklch(0.78_0.025_250)] bg-clip-text text-transparent">
              Produce tiempo.
            </span>
          </h2>
          <p className="mt-6 text-base text-muted-foreground sm:text-lg text-balance">
            Noiacore es un estudio donde el código GLSL deja de ser herramienta y
            se convierte en materia expresiva. Cada obra es un fragmento de
            tiempo que respira en el navegador de quien la contempla.
          </p>
        </div>

        {/* Pilares */}
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/50 p-6 transition-all duration-300 hover:border-[color:var(--tone)]/50"
              style={{ ["--tone" as string]: p.tone }}
            >
              <div
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
                style={{ background: p.tone }}
              />
              <div
                className="relative grid h-10 w-10 place-items-center rounded-lg border"
                style={{ borderColor: `${p.tone}55`, background: `${p.tone}15`, color: p.tone }}
              >
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="relative mt-4 font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
                {p.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                {p.body}
              </p>
              <div className="relative mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                0{i + 1} / 03
              </div>
            </div>
          ))}
        </div>

        {/* Hoja de ruta */}
        <div className="mt-20">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-[oklch(0.92_0.02_250)]" />
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight sm:text-2xl">
              Hoja de ruta
            </h3>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROADMAP.map((r, i) => (
              <div
                key={r.phase}
                className="relative rounded-2xl border border-border/70 bg-card/40 p-5"
              >
                {/* conector */}
                {i < ROADMAP.length - 1 && (
                  <div className="absolute right-0 top-1/2 hidden h-px w-4 -translate-y-1/2 translate-x-full bg-border lg:block" />
                )}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {r.phase}
                  </span>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider " +
                      (r.status === "completado"
                        ? "bg-[oklch(0.92_0.02_250)]/15 text-[oklch(0.92_0.02_250)]"
                        : r.status === "en curso"
                          ? "bg-[oklch(0.78_0.025_250)]/15 text-[oklch(0.78_0.025_250)]"
                          : "bg-secondary text-muted-foreground")
                    }
                  >
                    {r.status}
                  </span>
                </div>
                <h4 className="mt-3 font-[family-name:var(--font-display)] text-base font-bold">
                  {r.title}
                </h4>
                <ul className="mt-3 space-y-1.5">
                  {r.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[oklch(0.92_0.02_250)]" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Cita final — con figura contemplativa atmosférica */}
        <div className="relative mx-auto mt-20 max-w-2xl text-center">
          {/* Figura contemplativa — atmospheric HD image */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-96 w-64 -translate-x-1/2 -translate-y-8 bg-contain bg-top bg-no-repeat opacity-20"
            style={{ backgroundImage: "url(/noiacore/figure-void.png)" }}
          />
          <Radio className="mx-auto h-5 w-5 text-[oklch(0.92_0.02_250)] noia-pulse" />
          <blockquote className="mt-4 font-[family-name:var(--font-display)] text-xl font-medium italic leading-relaxed text-foreground/90 sm:text-2xl">
            “Un shader no se mira. Se escucha respirar.”
          </blockquote>
          <div className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            — anónimo del laboratorio
          </div>
        </div>
      </div>
    </section>
  );
}
