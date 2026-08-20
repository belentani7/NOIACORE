"use client";

import { useNoiaStore } from "@/lib/store";
import { useObras } from "@/hooks/use-obras";
import { ShaderCanvas } from "./ShaderCanvas";
import { Achievements } from "./Achievements";
import { Heart, Bookmark, Upload, LogOut, User2, Sparkles, UserCheck, Activity } from "lucide-react";

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function UserProfile() {
  const user = useNoiaStore((s) => s.user);
  const liked = useNoiaStore((s) => s.liked);
  const collected = useNoiaStore((s) => s.collected);
  const publishedIds = useNoiaStore((s) => s.publishedIds);
  const signOut = useNoiaStore((s) => s.signOut);
  const setAuthOpen = useNoiaStore((s) => s.setAuthOpen);
  const setViewerObraId = useNoiaStore((s) => s.setViewerObraId);
  const following = useNoiaStore((s) => s.following);
  const activity = useNoiaStore((s) => s.activity);
  const clearActivity = useNoiaStore((s) => s.clearActivity);
  const { obras } = useObras();

  if (!user) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary/60">
              <User2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold">
              Tu estudio está esperando
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Entra al laboratorio para guardar obras, publicar las tuyas y
              construir tu colección personal.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[oklch(0.92_0.02_250)] px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-[oklch(0.78_0.14_195)]"
            >
              <Sparkles className="h-4 w-4" />
              Entrar al laboratorio
            </button>
          </div>
        </div>
      </section>
    );
  }

  const likedObras = obras.filter((o) => liked.includes(o.id));
  const collectedObras = obras.filter((o) => collected.includes(o.id));

  const stats = [
    { label: "likes dados", value: liked.length, icon: Heart, tone: "oklch(0.50 0.045 255)" },
    { label: "obras guardadas", value: collected.length, icon: Bookmark, tone: "oklch(0.78 0.025 250)" },
    { label: "obras publicadas", value: publishedIds.length, icon: Upload, tone: "oklch(0.92 0.02 250)" },
    { label: "creadores seguidos", value: following.length, icon: UserCheck, tone: "oklch(0.92 0.02 250)" },
  ];

  const joinedDate = new Date(user.joinedAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/50 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.92_0.02_250)] to-[oklch(0.50_0.045_255)] text-2xl font-bold text-background">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                {user.name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <span className="text-[oklch(0.92_0.02_250)]">@{user.handle}</span>
                <span>·</span>
                <span>desde {joinedDate}</span>
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="ml-auto flex items-center gap-2 rounded-md border border-border/60 bg-secondary/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-[oklch(0.50_0.03_255)]/60 hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border/60 bg-card/50 p-4 text-center"
            >
              <s.icon className="mx-auto h-4 w-4" style={{ color: s.tone }} />
              <div className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
                {s.value}
              </div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Colección guardada */}
        <div className="mt-8">
          <h3 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold">
            <Bookmark className="h-4 w-4 text-[oklch(0.78_0.025_250)]" />
            Tu colección
          </h3>
          {collectedObras.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-border/50 bg-card/20 p-6 text-center text-sm text-muted-foreground">
              Aún no has guardado obras. Explora la galería y pulsa el icono de
              guardado para coleccionarlas aquí.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {collectedObras.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setViewerObraId(o.id)}
                  className="group overflow-hidden rounded-lg border border-border/60 text-left transition-all hover:border-[oklch(0.78_0.025_250)]/50"
                >
                  <ShaderCanvas
                    shader={o.shader}
                    hue={o.hue}
                    complexity={o.complexity}
                    intensity={o.intensity}
                    className="aspect-square"
                    rounded="rounded-none"
                  />
                  <div className="p-2">
                    <div className="truncate text-xs font-medium">{o.title}</div>
                    <div className="truncate font-mono text-[9px] text-muted-foreground">
                      {o.author}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Likes */}
        {likedObras.length > 0 && (
          <div className="mt-8">
            <h3 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold">
              <Heart className="h-4 w-4 text-[oklch(0.50_0.045_255)]" />
              Obras que te gustan
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {likedObras.slice(0, 10).map((o) => (
                <button
                  key={o.id}
                  onClick={() => setViewerObraId(o.id)}
                  className="group overflow-hidden rounded-lg border border-border/60 text-left transition-all hover:border-[oklch(0.50_0.045_255)]/50"
                >
                  <ShaderCanvas
                    shader={o.shader}
                    hue={o.hue}
                    complexity={o.complexity}
                    intensity={o.intensity}
                    className="aspect-square"
                    rounded="rounded-none"
                  />
                  <div className="p-2">
                    <div className="truncate text-xs font-medium">{o.title}</div>
                    <div className="font-mono text-[9px] text-muted-foreground">
                      {formatNumber(o.likes + 1)} likes
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Following */}
        {following.length > 0 && (
          <div className="mt-8">
            <h3 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold">
              <UserCheck className="h-4 w-4 text-[oklch(0.92_0.02_250)]" />
              Creadores que sigues
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {following.map((handle) => (
                <span
                  key={handle}
                  className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 py-1.5 pl-1.5 pr-3"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.92_0.02_250)] to-[oklch(0.50_0.045_255)] text-[10px] font-bold text-background">
                    {handle.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="font-mono text-[12px] text-foreground/90">@{handle}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Activity timeline */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold">
              <Activity className="h-4 w-4 text-[oklch(0.78_0.025_250)]" />
              Tu actividad reciente
            </h3>
            {activity.length > 0 && (
              <button
                onClick={clearActivity}
                className="font-mono text-[10px] text-muted-foreground transition-colors hover:text-[oklch(0.50_0.03_255)]"
              >
                limpiar
              </button>
            )}
          </div>
          {activity.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-border/50 bg-card/20 p-4 text-center text-sm text-muted-foreground">
              Sin actividad todavía. Dale like, guarda obras o sigue creadores para ver tu historial aquí.
            </p>
          ) : (
            <div className="mt-3 space-y-1.5">
              {activity.slice(0, 12).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 px-3 py-2"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full" style={{ background: `${ACTIVITY_TONE[a.kind]}15` }}>
                    {(() => {
                      const Icon = ACTIVITY_ICON[a.kind];
                      return <Icon className="h-3.5 w-3.5" style={{ color: ACTIVITY_TONE[a.kind] }} />;
                    })()}
                  </span>
                  <div className="flex-1 text-sm">
                    <span className="text-muted-foreground">{ACTIVITY_LABEL[a.kind]}</span>{" "}
                    <span className="font-medium text-foreground/90">{a.target}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {timeAgoShort(a.at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}
        <Achievements />
      </div>
    </section>
  );
}

const ACTIVITY_ICON = {
  like: Heart,
  collect: Bookmark,
  publish: Upload,
  follow: UserCheck,
  comment: Heart,
  remix: Upload,
} as const;

const ACTIVITY_TONE: Record<string, string> = {
  like: "oklch(0.50 0.045 255)",
  collect: "oklch(0.78 0.025 250)",
  publish: "oklch(0.92 0.02 250)",
  follow: "oklch(0.92 0.02 250)",
  comment: "oklch(0.85 0.035 250)",
  remix: "oklch(0.78 0.025 250)",
};

const ACTIVITY_LABEL: Record<string, string> = {
  like: "dio like a",
  collect: "guardó",
  publish: "publicó",
  follow: "empezó a seguir a",
  comment: "comentó en",
  remix: "remezcló",
};

function timeAgoShort(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
