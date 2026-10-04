"use client";

import { useState } from "react";
import {
  generatePalette,
  HARMONIES,
  type Harmony,
  type Palette,
} from "@/lib/palette";
import { ShaderCanvas } from "./ShaderCanvas";
import { useNoiaStore } from "@/lib/store";
import { Check, Copy, Dices, Palette as PaletteIcon, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PaletteGenerator() {
  const [palette, setPalette] = useState<Palette>(() => generatePalette(190, "tríada"));
  const [harmony, setHarmony] = useState<Harmony>("tríada");
  const [copied, setCopied] = useState<string | null>(null);
  const draft = useNoiaStore((s) => s.draft);
  const setDraft = useNoiaStore((s) => s.setDraft);
  const pushNotification = useNoiaStore((s) => s.pushNotification);

  const reroll = (h?: number, harm?: Harmony) => {
    const nh = h ?? Math.floor(Math.random() * 360);
    const nharm = harm ?? harmony;
    setPalette(generatePalette(nh, nharm));
    setHarmony(nharm);
  };

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  };

  const applyToDraft = () => {
    setDraft({ hue: palette.base.h / 360 });
    pushNotification({
      title: "Paleta aplicada al estudio",
      body: `Matiz base ${palette.base.h}° (${palette.harmony})`,
      tone: "teal",
    });
    document.getElementById("estudio")?.scrollIntoView({ behavior: "smooth" });
  };

  const hueFromHex = palette.base.h;

  return (
    <section id="paletas" className="relative scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Left: controls + swatches */}
          <div className="rounded-2xl border border-border/70 bg-card/50 p-6">
            <div className="flex items-center gap-2">
              <PaletteIcon className="h-4 w-4 text-[oklch(0.78_0.025_250)]" />
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
                Generador de paletas
              </h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Selecciona un matiz base y una armonía. Cada swatch copia su hex al
              instante. Aplica la paleta al estudio y verás el shader reaccionar.
            </p>

            {/* harmony selector */}
            <div className="mt-5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                armonía
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {HARMONIES.map((h) => (
                  <button
                    key={h}
                    onClick={() => reroll(undefined, h)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 font-mono text-[11px] capitalize transition-colors",
                      harmony === h
                        ? "border-[oklch(0.92_0.02_250)]/60 bg-[oklch(0.92_0.02_250)]/15 text-[oklch(0.92_0.02_250)]"
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* hue slider */}
            <div className="mt-5">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>matiz base</span>
                <span className="text-foreground">{palette.base.h}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={palette.base.h}
                onChange={(e) => reroll(Number(e.target.value))}
                className="mt-2 w-full accent-[oklch(0.92_0.02_250)]"
                aria-label="Matiz base"
              />
            </div>

            {/* swatches */}
            <div className="mt-6 grid grid-cols-5 gap-2.5">
              {palette.swatches.map((s, i) => (
                <button
                  key={i}
                  onClick={() => copy(s.hex)}
                  className="group/sw text-left"
                  title={`Copiar ${s.hex}`}
                >
                  <div
                    className="relative h-20 w-full rounded-lg border border-border/40 transition-transform group-hover/sw:scale-[1.04]"
                    style={{ background: s.hex }}
                  >
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded bg-background/70 opacity-0 transition-opacity group-hover/sw:opacity-100">
                      {copied === s.hex ? (
                        <Check className="h-3 w-3 text-[oklch(0.92_0.02_250)]" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 font-mono text-[10px] uppercase text-muted-foreground">
                    {s.hex}
                  </div>
                  <div className="font-mono text-[9px] text-muted-foreground/70">
                    h{s.h} s{s.s} l{s.l}
                  </div>
                </button>
              ))}
            </div>

            {/* actions */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                onClick={() => reroll()}
                className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.92_0.02_250)] px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-[oklch(0.78_0.14_195)]"
              >
                <Dices className="h-4 w-4" />
                Generar aleatoria
              </button>
              <button
                onClick={applyToDraft}
                className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-secondary/40 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-[oklch(0.50_0.045_255)]/60"
              >
                <Wand2 className="h-4 w-4 text-[oklch(0.50_0.045_255)]" />
                Aplicar al estudio
              </button>
            </div>
          </div>

          {/* Right: live preview */}
          <div className="rounded-2xl border border-border/70 bg-card/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[oklch(0.92_0.02_250)] noia-pulse" />
                <h3 className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight">
                  Vista previa en vivo
                </h3>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                shader: {draft.shader}
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
              <ShaderCanvas
                shader={draft.shader}
                hue={hueFromHex / 360}
                complexity={draft.complexity}
                intensity={draft.intensity}
                className="aspect-[16/10]"
                showFps
              />
            </div>
            {/* gradient strip */}
            <div className="mt-4 h-3 overflow-hidden rounded-full">
              <div
                className="flex h-full"
                style={{
                  background: `linear-gradient(90deg, ${palette.swatches
                    .map((s) => s.hex)
                    .join(", ")})`,
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-[10px] text-muted-foreground">
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <div className="text-[9px] uppercase tracking-wider">matiz</div>
                <div className="mt-1 text-sm text-foreground">{palette.base.h}°</div>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <div className="text-[9px] uppercase tracking-wider">armonía</div>
                <div className="mt-1 text-sm capitalize text-foreground">{palette.harmony}</div>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <div className="text-[9px] uppercase tracking-wider">swatches</div>
                <div className="mt-1 text-sm text-foreground">{palette.swatches.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
