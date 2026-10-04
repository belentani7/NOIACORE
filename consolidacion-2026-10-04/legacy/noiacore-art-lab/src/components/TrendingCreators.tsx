"use client";

import { TrendingUp, Award, Flame, UserPlus, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNoiaStore } from "@/lib/store";

interface Creator {
  rank: number;
  handle: string;
  name: string;
  obras: number;
  likes: number;
  shader: string;
  tone: string;
}

const CREATORS: Creator[] = [
  {
    rank: 1,
    handle: "iris",
    name: "Iris Solano",
    obras: 47,
    likes: 18420,
    shader: "vortex",
    tone: "oklch(0.50 0.045 255)",
  },
  {
    rank: 2,
    handle: "sven",
    name: "Sven Aalto",
    obras: 39,
    likes: 15603,
    shader: "aurora",
    tone: "oklch(0.92 0.02 250)",
  },
  {
    rank: 3,
    handle: "lumen",
    name: "Lumen Vera",
    obras: 52,
    likes: 14210,
    shader: "silk",
    tone: "oklch(0.78 0.025 250)",
  },
  {
    rank: 4,
    handle: "nox",
    name: "Nox Drift",
    obras: 31,
    likes: 11887,
    shader: "plasma",
    tone: "oklch(0.50 0.045 255)",
  },
  {
    rank: 5,
    handle: "kael",
    name: "Kael Brun",
    obras: 28,
    likes: 9654,
    shader: "noiseflow",
    tone: "oklch(0.92 0.02 250)",
  },
];

function formatNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function TrendingCreators() {
  const following = useNoiaStore((s) => s.following);
  const toggleFollow = useNoiaStore((s) => s.toggleFollow);
  const user = useNoiaStore((s) => s.user);
  const setAuthOpen = useNoiaStore((s) => s.setAuthOpen);
  const pushNotification = useNoiaStore((s) => s.pushNotification);

  const handleFollow = (handle: string, name: string) => {
    if (!user) {
      setAuthOpen(true);
      pushNotification({
        title: "Entra para seguir",
        body: "Necesitas una identidad para seguir creadores.",
        tone: "red",
      });
      return;
    }
    const wasFollowing = following.includes(handle);
    toggleFollow(handle);
    pushNotification({
      title: wasFollowing ? "Dejaste de seguir" : "Ahora sigues",
      body: wasFollowing ? `@${handle} dejó de aparecer en tu feed.` : `@${handle} (${name}) añadido a tu feed.`,
      tone: wasFollowing ? "amber" : "teal",
    });
  };

  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(0.78_0.025_250)]">
              <Award className="h-3 w-3" />
              top creadores
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
              Quienes mueven el laboratorio
            </h2>
          </div>
          <div className="hidden items-center gap-2 font-mono text-[11px] text-muted-foreground sm:flex">
            <TrendingUp className="h-3.5 w-3.5 text-[oklch(0.92_0.02_250)]" />
            actualizado hace 1h
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-5">
          {CREATORS.map((c) => (
            <div
              key={c.handle}
              className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/50 p-5 transition-all duration-300 hover:border-[color:var(--tone)]/50 card-lift gradient-border glow-hover"
              style={{ ["--tone" as string]: c.tone }}
            >
              {/* glow blob */}
              <div
                className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-15 blur-2xl transition-opacity group-hover:opacity-35"
                style={{ background: c.tone }}
              />
              {/* rank */}
              <div className="flex items-center justify-between">
                <span
                  className="font-[family-name:var(--font-display)] text-2xl font-extrabold"
                  style={{ color: c.rank <= 3 ? c.tone : "oklch(0.5 0 0)" }}
                >
                  #{c.rank}
                </span>
                {c.rank === 1 && (
                  <Flame className="h-4 w-4 text-[oklch(0.78_0.025_250)]" />
                )}
              </div>
              {/* avatar */}
              <div className="mt-3 flex items-center gap-3">
                <span
                  className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-background"
                  style={{ background: c.tone }}
                >
                  {c.name.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{c.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    @{c.handle}
                  </div>
                </div>
              </div>
              {/* stats */}
              <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[10px]">
                <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5">
                  <div className="text-muted-foreground">obras</div>
                  <div className="text-sm text-foreground">{c.obras}</div>
                </div>
                <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5">
                  <div className="text-muted-foreground">likes</div>
                  <div className="text-sm text-foreground">{formatNum(c.likes)}</div>
                </div>
              </div>
              {/* shader favorito */}
              <div className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.tone }} />
                shader: <span className="text-foreground/80">{c.shader}</span>
              </div>
              {/* follow button */}
              <button
                onClick={() => handleFollow(c.handle, c.name)}
                className={cn(
                  "mt-4 flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                  following.includes(c.handle)
                    ? "border-[oklch(0.92_0.02_250)]/40 bg-[oklch(0.92_0.02_250)]/10 text-[oklch(0.92_0.02_250)]"
                    : "border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-[oklch(0.92_0.02_250)]/50"
                )}
              >
                {following.includes(c.handle) ? (
                  <>
                    <UserCheck className="h-3.5 w-3.5" />
                    Siguiendo
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    Seguir
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
