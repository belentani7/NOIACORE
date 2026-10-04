"use client";

import { useState } from "react";
import { useNoiaStore } from "@/lib/store";
import { SHADERS } from "@/lib/shaders";
import { ShaderCanvas } from "./ShaderCanvas";
import { Terminal } from "./Terminal";
import { useToast } from "@/hooks/use-toast";
import { Upload, Tag, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Studio() {
  const draft = useNoiaStore((s) => s.draft);
  const setDraft = useNoiaStore((s) => s.setDraft);
  const user = useNoiaStore((s) => s.user);
  const setAuthOpen = useNoiaStore((s) => s.setAuthOpen);
  const markPublished = useNoiaStore((s) => s.markPublished);
  const pushNotification = useNoiaStore((s) => s.pushNotification);
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 16);
    if (!t) return;
    if (draft.tags.includes(t)) {
      setTagInput("");
      return;
    }
    if (draft.tags.length >= 5) {
      toast({ title: "Máximo 5 etiquetas", variant: "destructive" });
      return;
    }
    setDraft({ tags: [...draft.tags, t] });
    setTagInput("");
  };
  const removeTag = (t: string) =>
    setDraft({ tags: draft.tags.filter((x) => x !== t) });

  const publish = async () => {
    if (!user) {
      setAuthOpen(true);
      toast({ title: "Necesitas entrar para publicar", variant: "destructive" });
      return;
    }
    if (!draft.title.trim()) {
      toast({ title: "Ponle un título a tu obra", variant: "destructive" });
      return;
    }
    setPublishing(true);
    // Simula POST a /api/obras
    try {
      const res = await fetch("/api/obras?XTransformPort=3000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          shader: draft.shader,
          hue: draft.hue,
          complexity: draft.complexity,
          intensity: draft.intensity,
          excerpt: draft.excerpt || "Obra generada en el estudio Noiacore.",
          tags: draft.tags,
          author: user.handle,
        }),
      });
      const data = await res.json().catch(() => ({ ok: true, id: "draft-" + Date.now() }));
      markPublished(data.id ?? "draft-" + Date.now());
      setPublishing(false);
      setPublished(true);
      pushNotification({
        title: "¡Obra publicada!",
        body: `'${draft.title}' ya respira en la galería pública.`,
        tone: "magenta",
      });
      toast({
        title: "Obra publicada",
        description: `'${draft.title}' está ahora en la galería.`,
      });
      setTimeout(() => setPublished(false), 2400);
    } catch {
      setPublishing(false);
      toast({ title: "No se pudo publicar (modo local)", variant: "destructive" });
    }
  };

  return (
    <section id="estudio" className="relative scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(0.78_0.025_250)]">
              el estudio
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-5xl">
              Compón, ajusta, publica
            </h2>
            <p className="mt-3 text-muted-foreground">
              Elige un shader, mueve sus parámetros en tiempo real y publica tu
              obra al ecosistema. Todo ocurre en tu navegador.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Preview + terminal */}
          <div className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/50">
              <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  lienzo en vivo · {draft.shader}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-[oklch(0.92_0.02_250)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.92_0.02_250)] noia-pulse" />
                  renderizando
                </span>
              </div>
              <ShaderCanvas
                shader={draft.shader}
                hue={draft.hue}
                complexity={draft.complexity}
                intensity={draft.intensity}
                className="aspect-[16/10]"
                showFps
              />
            </div>
            <Terminal />
          </div>

          {/* Controls */}
          <div className="rounded-2xl border border-border/70 bg-card/50 p-6">
            <h3 className="font-[family-name:var(--font-display)] text-base font-bold">
              Parámetros de la obra
            </h3>

            {/* title */}
            <div className="mt-4 space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                título
              </label>
              <input
                value={draft.title}
                onChange={(e) => setDraft({ title: e.target.value.slice(0, 60) })}
                placeholder="Sin título aún…"
                className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-[oklch(0.92_0.02_250)]/60"
              />
            </div>

            {/* shader selector */}
            <div className="mt-5">
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                fragment shader
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {SHADERS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setDraft({ shader: s.id })}
                    className={cn(
                      "rounded-md border px-2 py-1.5 font-mono text-[10px] transition-colors",
                      draft.shader === s.id
                        ? "border-[oklch(0.92_0.02_250)]/60 bg-[oklch(0.92_0.02_250)]/15 text-[oklch(0.92_0.02_250)]"
                        : "border-border/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* sliders */}
            <div className="mt-5 space-y-4">
              <Slider
                label="matiz"
                value={Math.round(draft.hue * 360)}
                min={0}
                max={360}
                onChange={(v) => setDraft({ hue: v / 360 })}
              />
              <Slider
                label="complejidad"
                value={Math.round(draft.complexity * 100)}
                min={0}
                max={100}
                onChange={(v) => setDraft({ complexity: v / 100 })}
              />
              <Slider
                label="intensidad"
                value={Math.round(draft.intensity * 100)}
                min={0}
                max={100}
                onChange={(v) => setDraft({ intensity: v / 100 })}
              />
            </div>

            {/* excerpt */}
            <div className="mt-5 space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                descripción
              </label>
              <textarea
                value={draft.excerpt}
                onChange={(e) => setDraft({ excerpt: e.target.value.slice(0, 160) })}
                placeholder="Una frase sobre tu obra…"
                rows={2}
                className="w-full resize-none rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-[oklch(0.92_0.02_250)]/60"
              />
              <div className="text-right font-mono text-[9px] text-muted-foreground">
                {draft.excerpt.length}/160
              </div>
            </div>

            {/* tags */}
            <div className="mt-4">
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                etiquetas (máx 5)
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {draft.tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => removeTag(t)}
                    className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-secondary/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-[oklch(0.50_0.03_255)]"
                  >
                    #{t} <span className="text-[11px]">×</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-1.5">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="añadir etiqueta…"
                    className="w-full rounded-md border border-border/60 bg-background/60 py-1.5 pl-7 pr-2 font-mono text-[11px] outline-none focus:border-[oklch(0.92_0.02_250)]/60"
                  />
                </div>
                <button
                  onClick={addTag}
                  className="rounded-md border border-border/60 px-2.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                >
                  +
                </button>
              </div>
            </div>

            {/* publish */}
            <button
              onClick={publish}
              disabled={publishing || published}
              className={cn(
                "mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all",
                published
                  ? "bg-[oklch(0.92_0.02_250)] text-background"
                  : "bg-[oklch(0.50_0.045_255)] text-background hover:bg-[oklch(0.66_0.24_345)] hover:shadow-[0_0_28px_oklch(0.50_0.045_255_/_0.45)]",
                (publishing) && "opacity-70"
              )}
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  publicando…
                </>
              ) : published ? (
                <>
                  <Check className="h-4 w-4" />
                  obra publicada
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {user ? "Publicar obra" : "Entrar y publicar"}
                </>
              )}
            </button>
            {!user && (
              <p className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
                necesitas una identidad para publicar
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-[oklch(0.92_0.02_250)]"
        aria-label={label}
      />
    </div>
  );
}
