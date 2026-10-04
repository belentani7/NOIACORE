"use client";

import { useState } from "react";
import { TrendingUp, Users, Layers, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Datos simulados de actividad de los últimos 14 días
function generateActivity(): number[] {
  const seed = [12, 18, 15, 24, 31, 28, 35, 42, 38, 47, 52, 45, 58, 64];
  return seed;
}

const STAT_CARDS = [
  {
    label: "obras publicadas",
    value: 2847,
    delta: "+12%",
    icon: Layers,
    tone: "oklch(0.92 0.02 250)",
  },
  {
    label: "creadores activos",
    value: 412,
    delta: "+8%",
    icon: Users,
    tone: "oklch(0.50 0.045 255)",
  },
  {
    label: "shaders compilados",
    value: 184320,
    delta: "+23%",
    icon: Zap,
    tone: "oklch(0.78 0.025 250)",
  },
];

function formatNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toLocaleString("es-ES");
}

export function LabStats() {
  const [activity] = useState<number[]>(() => generateActivity());
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const max = Math.max(...activity, 1);
  const days = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(0.92_0.02_250)]">
              <TrendingUp className="h-3 w-3" />
              pulso del laboratorio
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
              14 días de creación colectiva
            </h2>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* Gráfico de actividad */}
          <div className="rounded-2xl border border-border/70 bg-card/50 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider">
                Obras por día
              </h3>
              <span className="font-mono text-[10px] text-muted-foreground">
                últimos 14 días
              </span>
            </div>
            {/* bars */}
            <div className="mt-6 flex h-40 items-end gap-1.5">
              {activity.map((v, i) => {
                const h = (v / max) * 100;
                const isHover = hoverIdx === i;
                return (
                  <div
                    key={i}
                    className="group relative flex-1"
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                  >
                    <div
                      className={cn(
                        "w-full rounded-t-md transition-all duration-200",
                        isHover ? "opacity-100" : "opacity-70"
                      )}
                      style={{
                        height: `${Math.max(4, h)}%`,
                        background: `linear-gradient(to top, oklch(0.92 0.02 250 / 0.5), oklch(0.50 0.045 255 / 0.8))`,
                        boxShadow: isHover
                          ? "0 0 16px oklch(0.50 0.045 255 / 0.6)"
                          : "none",
                      }}
                    />
                    {/* tooltip */}
                    {isHover && (
                      <div className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 rounded-md border border-border/70 bg-background px-2 py-1 font-mono text-[10px] whitespace-nowrap">
                        día {i + 1}: <span className="text-[oklch(0.92_0.02_250)]">{v}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* x-axis */}
            <div className="mt-2 flex justify-between font-mono text-[9px] text-muted-foreground">
              {days.map((d, i) => (
                <span key={i} className="flex-1 text-center">
                  {d}
                </span>
              ))}
              <span className="flex-1 text-center">…</span>
              <span className="flex-1 text-center">hoy</span>
            </div>
          </div>

          {/* Stat cards */}
          <div className="flex flex-col gap-3">
            {STAT_CARDS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 p-4"
              >
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg"
                  style={{
                    background: `${s.tone}15`,
                    border: `1px solid ${s.tone}40`,
                  }}
                >
                  <s.icon className="h-5 w-5" style={{ color: s.tone }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="font-[family-name:var(--font-display)] text-xl font-bold">
                    {formatNum(s.value)}
                  </div>
                </div>
                <span
                  className="rounded-md px-2 py-1 font-mono text-[10px] font-bold"
                  style={{ background: `${s.tone}20`, color: s.tone }}
                >
                  {s.delta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
