"use client";

import { useFactory } from "@/hooks/use-factory";
import { ShaderCanvas } from "./ShaderCanvas";
import { PRODUCERS, type ProducedAsset } from "@/lib/factory/orchestrator";
import {
  Bot,
  Infinity as InfinityIcon,
  Archive,
  Palette,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  skin: "Skin",
  set: "Set 3D",
  skill_vfx: "Skill VFX",
  animation: "Animación",
  concept: "Concept",
  moodboard: "Moodboard",
};

const TYPE_TONES: Record<string, string> = {
  skin: "oklch(0.92 0.02 250)",
  set: "oklch(0.85 0.035 250)",
  skill_vfx: "oklch(0.78 0.025 250)",
  animation: "oklch(0.65 0.04 255)",
  concept: "oklch(0.50 0.045 255)",
  moodboard: "oklch(0.78 0.025 250)",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}min`;
  return `hace ${Math.floor(m / 60)}h`;
}

export function FactoryPanel() {
  const { assets, stats, lastTick, running, tick, toggle } = useFactory(30000);

  return (
    <section id="fabrica" className="relative scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(0.85_0.035_250)]">
            <InfinityIcon className="h-3 w-3" />
            fábrica creativa eterna · {running ? "produciendo" : "pausada"}
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-5xl">
            Producción visual{" "}
            <span className="text-grad-light">infinita y autónoma</span>
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            20 productores virtuales especializados coordinados por un orquestador
            autónomo. Lee tendencias, recuerda su historia, produce en paralelo,
            nunca olvida, mantiene coherencia narrativa.
          </p>
        </div>

        {/* Stats globales */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard icon={Sparkles} label="total producido" value={stats.totalProduced} tone="oklch(0.92 0.02 250)" />
          <StatCard icon={Palette} label="activos" value={stats.activeAssets} tone="oklch(0.85 0.035 250)" />
          <StatCard icon={Archive} label="archivo" value={stats.archivedAssets} tone="oklch(0.78 0.025 250)" />
          <StatCard icon={TrendingUp} label="temporadas" value={stats.seasons} tone="oklch(0.65 0.04 255)" />
          <StatCard icon={Bot} label="productores" value={stats.producersActive} tone="oklch(0.50 0.045 255)" />
        </div>

        {/* Control + último tick */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
                running
                  ? "border-[oklch(0.78_0.025_250)]/40 bg-[oklch(0.78_0.025_250)]/10 text-[oklch(0.78_0.025_250)]"
                  : "border-border/60 bg-secondary/40 text-foreground hover:border-[oklch(0.85_0.035_250)]/50"
              )}
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? "Pausar" : "Reanudar"}
            </button>
            <button
              onClick={tick}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-[oklch(0.85_0.035_250)]/50"
            >
              <Sparkles className="h-4 w-4" />
              Generar ahora
            </button>
          </div>
          {lastTick && (
            <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-[oklch(0.85_0.035_250)]" />
                {lastTick.qcPassed} aprobadas
              </span>
              {lastTick.qcFailed > 0 && (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-[oklch(0.50_0.03_255)]" />
                  {lastTick.qcFailed} rechazadas
                </span>
              )}
              <span>· {lastTick.brief.season}</span>
            </div>
          )}
        </div>

        {/* Último brief */}
        {lastTick && (
          <div className="mb-6 rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                brief autogenerado · {lastTick.brief.trend}
              </span>
            </div>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-bold">
              {lastTick.brief.concept}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{lastTick.brief.narrative}</p>
          </div>
        )}

        {/* Galería infinita */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.slice(0, 16).map((asset, i) => (
            <FactoryCard key={asset.id} asset={asset} index={i} />
          ))}
        </div>

        {/* Productores activos */}
        <div className="mt-10">
          <h3 className="mb-4 flex items-center gap-2 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider">
            <Bot className="h-4 w-4 text-[oklch(0.85_0.035_250)]" />
            20 productores virtuales
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {PRODUCERS.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-border/40 bg-card/30 p-2.5 transition-colors hover:border-[oklch(0.85_0.035_250)]/30"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                    style={{ background: TYPE_TONES[p.specialty] + "20", color: TYPE_TONES[p.specialty] }}
                  >
                    {p.id}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold">{p.name}</div>
                    <div className="truncate text-[9px] text-muted-foreground">{p.role}</div>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-1">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.skill}%`, background: TYPE_TONES[p.specialty] }}
                    />
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground">{p.skill}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Bot;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-3 text-center elevation-1">
      <Icon aria-hidden="true" className="mx-auto h-4 w-4" style={{ color: tone }} />
      <div className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-bold">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function FactoryCard({ asset, index }: { asset: ProducedAsset; index: number }) {
  const tone = TYPE_TONES[asset.type] ?? "oklch(0.85 0.035 250)";
  return (
    <article
      className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/50 card-lift elevation-1 hover:elevation-3"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="relative aspect-square">
        <ShaderCanvas
          shader={asset.shader}
          hue={asset.hue}
          complexity={asset.complexity}
          intensity={asset.intensity}
          className="h-full w-full"
          rounded="rounded-none"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        {/* Badge tipo */}
        <div
          className="absolute left-2 top-2 rounded-md bg-background/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider backdrop-blur"
          style={{ color: tone }}
        >
          {TYPE_LABELS[asset.type] ?? asset.type}
        </div>
        {/* Quality */}
        <div className="absolute right-2 top-2 rounded-md bg-background/70 px-1.5 py-0.5 font-mono text-[9px] backdrop-blur">
          Q{asset.qualityScore}
        </div>
      </div>
      <div className="p-3">
        <h3 className="truncate font-[family-name:var(--font-display)] text-sm font-bold">{asset.title}</h3>
        <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">
          {asset.producerName} · {timeAgo(asset.createdAt)}
        </div>
        <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground/80">
          {asset.narrative}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className="rounded px-1.5 py-0.5 font-mono text-[8px]"
            style={{ background: tone + "15", color: tone }}
          >
            {asset.loreNode}
          </span>
          {asset.relations.length > 0 && (
            <span className="font-mono text-[8px] text-muted-foreground">
              ↗ {asset.relations.length} rel.
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
