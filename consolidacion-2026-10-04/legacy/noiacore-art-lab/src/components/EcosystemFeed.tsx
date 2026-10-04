"use client";

import { SEED_OBRAS, SEED_EVENTS, type EcosystemEvent } from "@/lib/obras";
import { useNoiaStore } from "@/lib/store";
import { Heart, Bookmark, MessageSquare, GitFork, UserPlus, Upload, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ICON: Record<EcosystemEvent["kind"], typeof Heart> = {
  publish: Upload,
  like: Heart,
  collect: Bookmark,
  comment: MessageSquare,
  fork: GitFork,
  join: UserPlus,
};

const TONE: Record<EcosystemEvent["kind"], string> = {
  publish: "text-[oklch(0.92_0.02_250)]",
  like: "text-[oklch(0.50_0.045_255)]",
  collect: "text-[oklch(0.78_0.025_250)]",
  comment: "text-[oklch(0.85_0.035_250)]",
  fork: "text-[oklch(0.92_0.02_250)]",
  join: "text-muted-foreground",
};

const LABEL: Record<EcosystemEvent["kind"], string> = {
  publish: "publicó",
  like: "dio like a",
  collect: "guardó",
  comment: "comentó en",
  fork: "remixó",
  join: "se unió",
};

export function EcosystemFeed() {
  const [events, setEvents] = useState<EcosystemEvent[]>(SEED_EVENTS);
  const liked = useNoiaStore((s) => s.liked);
  const collected = useNoiaStore((s) => s.collected);

  // Simula actividad en vivo: cada ~5s añade un evento al principio
  useEffect(() => {
    const users = ["lumen", "n0va", "drift.7", "ostinato", "mira.luz", "k4el", "iris", "sven"];
    const verbs: EcosystemEvent["kind"][] = ["like", "collect", "comment", "fork", "publish"];
    const targets = SEED_OBRAS.map((o) => o.title);
    const id = setInterval(() => {
      const u = users[Math.floor(Math.random() * users.length)];
      const v = verbs[Math.floor(Math.random() * verbs.length)];
      const t = targets[Math.floor(Math.random() * targets.length)];
      const ev: EcosystemEvent = {
        id: "live-" + Date.now(),
        kind: v,
        user: u,
        target: t,
        ago: "ahora",
      };
      setEvents((prev) => [ev, ...prev].slice(0, 10));
    }, 5200);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="ecosistema" className="relative scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          {/* Feed */}
          <div className="rounded-2xl border border-border/70 bg-card/50">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-[oklch(0.92_0.02_250)] noia-pulse" />
                <h3 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider">
                  Ecosistema en vivo
                </h3>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                · streaming ·
              </span>
            </div>
            <div className="max-h-[420px] divide-y divide-border/40 overflow-y-auto">
              {events.map((e, i) => {
                const Icon = ICON[e.kind];
                return (
                  <div
                    key={e.id}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/30",
                      i === 0 && e.ago === "ahora" && "bg-[oklch(0.92_0.02_250_/_0.06)]"
                    )}
                  >
                    <Icon aria-hidden="true" className={cn("h-4 w-4 shrink-0", TONE[e.kind])} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        <span className="font-semibold text-foreground">{e.user}</span>{" "}
                        <span className="text-muted-foreground">{LABEL[e.kind]}</span>{" "}
                        <span className="font-medium text-foreground/90">{e.target}</span>
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {e.ago}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats panel */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
              <h3 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider">
                Tu actividad
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <Heart className="h-4 w-4 text-[oklch(0.50_0.045_255)]" />
                  <div className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
                    {liked.length}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    likes dados
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <Bookmark className="h-4 w-4 text-[oklch(0.78_0.025_250)]" />
                  <div className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
                    {collected.length}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    obras guardadas
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-[oklch(0.20_0.04_195_/_0.5)] to-card/50 p-5">
              <h3 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider">
                Pulso del laboratorio
              </h3>
              <div className="mt-4 space-y-3">
                {[
                  { label: "shaders compilados hoy", value: 1284, max: 2000, tone: "oklch(0.92 0.02 250)" },
                  { label: "obras publicadas (24h)", value: 47, max: 80, tone: "oklch(0.50 0.045 255)" },
                  { label: "colecciones creadas", value: 312, max: 500, tone: "oklch(0.78 0.025 250)" },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                      <span>{m.label}</span>
                      <span className="text-foreground">{m.value}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(m.value / m.max) * 100}%`,
                          background: m.tone,
                          boxShadow: `0 0 12px ${m.tone}`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
