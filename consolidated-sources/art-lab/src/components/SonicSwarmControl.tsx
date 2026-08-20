"use client";

import { useSonicSwarm } from "@/hooks/use-sonic-swarm";
import { useNoiaStore } from "@/lib/store";
import { Volume2, VolumeX, Activity, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Panel de control del Enjambre Sónico.
 * Botón start/stop + visualizador de bandas + toggle reactivo.
 */
export function SonicSwarmControl({ compact = false }: { compact?: boolean }) {
  const { toggle, audioEnabled } = useSonicSwarm();
  const audioBands = useNoiaStore((s) => s.audioBands);
  const audioReactive = useNoiaStore((s) => s.audioReactive);
  const toggleAudioReactive = useNoiaStore((s) => s.toggleAudioReactive);

  const bands = [
    { label: "bass", value: audioBands.bass, tone: "oklch(0.92 0.02 250)" },
    { label: "mid", value: audioBands.mid, tone: "oklch(0.50 0.045 255)" },
    { label: "high", value: audioBands.high, tone: "oklch(0.78 0.025 250)" },
  ];

  if (compact) {
    return (
      <button
        onClick={toggle}
        title={audioEnabled ? "Detener enjambre sónico" : "Iniciar enjambre sónico"}
        className={cn(
          "flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors",
          audioEnabled
            ? "border-[oklch(0.92_0.02_250)]/60 bg-[oklch(0.92_0.02_250)]/15 text-[oklch(0.92_0.02_250)]"
            : "border-border/60 text-muted-foreground hover:text-foreground"
        )}
      >
        {audioEnabled ? (
          <>
            <Volume2 className="h-3.5 w-3.5" />
            <span className="flex items-center gap-[3px]">
              {[8, 14, 6, 11].map((h, i) => (
                <span
                  key={i}
                  className="w-[2px] bg-current noia-pulse"
                  style={{ height: h, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </span>
          </>
        ) : (
          <>
            <VolumeX className="h-3.5 w-3.5" />
            enjambre
          </>
        )}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="h-4 w-4 text-[oklch(0.92_0.02_250)]" />
          <h4 className="font-[family-name:var(--font-display)] text-sm font-bold">
            Enjambre sónico
          </h4>
        </div>
        <button
          onClick={toggle}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            audioEnabled
              ? "bg-[oklch(0.50_0.03_255)]/20 text-[oklch(0.50_0.03_255)] hover:bg-[oklch(0.50_0.03_255)]/30"
              : "bg-[oklch(0.92_0.02_250)] text-background hover:bg-[oklch(0.78_0.14_195)]"
          )}
        >
          {audioEnabled ? (
            <>
              <Volume2 className="h-3.5 w-3.5" />
              detener
            </>
          ) : (
            <>
              <VolumeX className="h-3.5 w-3.5" />
              iniciar
            </>
          )}
        </button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Sintetizador generativo con drones + arpegio pentatónico. Las bandas de
        audio pueden modular los shaders en tiempo real.
      </p>

      {/* Visualizador de bandas */}
      <div className="mt-4 space-y-2.5">
        {bands.map((b) => (
          <div key={b.label} className="flex items-center gap-2.5">
            <span className="w-8 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {b.label}
            </span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-[width] duration-75"
                style={{
                  width: `${Math.min(100, b.value * 140)}%`,
                  background: b.tone,
                  boxShadow: audioEnabled ? `0 0 10px ${b.tone}` : "none",
                }}
              />
            </div>
            <span className="w-8 text-right font-mono text-[10px] text-muted-foreground">
              {Math.round(b.value * 100)}
            </span>
          </div>
        ))}
      </div>

      {/* Toggle reactivo */}
      <button
        onClick={toggleAudioReactive}
        disabled={!audioEnabled}
        className={cn(
          "mt-4 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors disabled:opacity-40",
          audioReactive
            ? "border-[oklch(0.92_0.02_250)]/50 bg-[oklch(0.92_0.02_250)]/10"
            : "border-border/60 bg-background/40"
        )}
      >
        <span className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-[oklch(0.92_0.02_250)]" />
          <span className="font-medium">Shaders reactivos al audio</span>
        </span>
        <span
          className={cn(
            "relative h-4 w-7 rounded-full transition-colors",
            audioReactive ? "bg-[oklch(0.92_0.02_250)]" : "bg-muted-foreground/40"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-3 w-3 rounded-full bg-background transition-transform",
              audioReactive ? "translate-x-3.5" : "translate-x-0.5"
            )}
          />
        </span>
      </button>
    </div>
  );
}
