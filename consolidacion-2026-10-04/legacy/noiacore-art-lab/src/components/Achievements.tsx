"use client";

import { useNoiaStore } from "@/lib/store";
import { Award, Heart, Bookmark, Upload, UserCheck, Sparkles, Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: typeof Award;
  tone: string;
  check: (s: {
    liked: string[];
    collected: string[];
    publishedIds: string[];
    following: string[];
  }) => boolean;
  progress?: (s: {
    liked: string[];
    collected: string[];
    publishedIds: string[];
    following: string[];
  }) => { current: number; target: number };
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-like",
    label: "Primer like",
    description: "Dale like a tu primera obra",
    icon: Heart,
    tone: "oklch(0.50 0.045 255)",
    check: (s) => s.liked.length >= 1,
    progress: (s) => ({ current: Math.min(s.liked.length, 1), target: 1 }),
  },
  {
    id: "collector",
    label: "Coleccionista",
    description: "Guarda 5 obras en tu colección",
    icon: Bookmark,
    tone: "oklch(0.78 0.025 250)",
    check: (s) => s.collected.length >= 5,
    progress: (s) => ({ current: Math.min(s.collected.length, 5), target: 5 }),
  },
  {
    id: "creator",
    label: "Creador",
    description: "Publica tu primera obra",
    icon: Upload,
    tone: "oklch(0.92 0.02 250)",
    check: (s) => s.publishedIds.length >= 1,
    progress: (s) => ({ current: Math.min(s.publishedIds.length, 1), target: 1 }),
  },
  {
    id: "social",
    label: "Social",
    description: "Sigue a 3 creadores",
    icon: UserCheck,
    tone: "oklch(0.92 0.02 250)",
    check: (s) => s.following.length >= 3,
    progress: (s) => ({ current: Math.min(s.following.length, 3), target: 3 }),
  },
  {
    id: "enthusiast",
    label: "Entusiasta",
    description: "Dale like a 10 obras",
    icon: Flame,
    tone: "oklch(0.50 0.03 255)",
    check: (s) => s.liked.length >= 10,
    progress: (s) => ({ current: Math.min(s.liked.length, 10), target: 10 }),
  },
  {
    id: "veteran",
    label: "Veterano",
    description: "Publica 5 obras",
    icon: Trophy,
    tone: "oklch(0.78 0.025 250)",
    check: (s) => s.publishedIds.length >= 5,
    progress: (s) => ({ current: Math.min(s.publishedIds.length, 5), target: 5 }),
  },
];

export function Achievements() {
  const liked = useNoiaStore((s) => s.liked);
  const collected = useNoiaStore((s) => s.collected);
  const publishedIds = useNoiaStore((s) => s.publishedIds);
  const following = useNoiaStore((s) => s.following);

  const state = { liked, collected, publishedIds, following };
  const unlocked = ACHIEVEMENTS.filter((a) => a.check(state)).length;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold">
          <Award className="h-4 w-4 text-[oklch(0.78_0.025_250)]" />
          Logros
        </h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          {unlocked}/{ACHIEVEMENTS.length} desbloqueados
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const isUnlocked = a.check(state);
          const prog = a.progress?.(state);
          return (
            <div
              key={a.id}
              className={cn(
                "relative overflow-hidden rounded-xl border p-3 transition-all",
                isUnlocked
                  ? "border-[color:var(--tone)]/40 bg-[color:var(--tone)]/8"
                  : "border-border/50 bg-card/30 opacity-60"
              )}
              style={{ ["--tone" as string]: a.tone }}
            >
              {/* glow for unlocked */}
              {isUnlocked && (
                <div
                  className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-2xl"
                  style={{ background: a.tone }}
                />
              )}
              <div className="relative flex items-center gap-2.5">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                  style={{
                    background: isUnlocked ? `${a.tone}20` : "oklch(0.24 0.02 230)",
                    border: `1px solid ${isUnlocked ? a.tone + "40" : "transparent"}`,
                  }}
                >
                  <a.icon
                    className="h-4 w-4"
                    style={{ color: isUnlocked ? a.tone : "oklch(0.5 0 0)" }}
                  />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold">{a.label}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {a.description}
                  </div>
                </div>
              </div>
              {/* progress bar */}
              {prog && !isUnlocked && (
                <div className="mt-2">
                  <div className="h-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(prog.current / prog.target) * 100}%`,
                        background: a.tone,
                      }}
                    />
                  </div>
                  <div className="mt-1 text-right font-mono text-[9px] text-muted-foreground">
                    {prog.current}/{prog.target}
                  </div>
                </div>
              )}
              {isUnlocked && (
                <div className="mt-2 flex items-center gap-1 font-mono text-[9px]" style={{ color: a.tone }}>
                  <Sparkles className="h-2.5 w-2.5" />
                  desbloqueado
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
