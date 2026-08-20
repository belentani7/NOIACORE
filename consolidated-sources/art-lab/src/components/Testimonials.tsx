"use client";

import { TESTIMONIALS } from "@/lib/obras";
import { Quote } from "lucide-react";

export function Testimonials() {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            voces del laboratorio
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-4xl">
            Lo que dicen quienes crean aquí
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.id}
              className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/50 p-6"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Quote className="h-6 w-6 text-[oklch(0.50_0.045_255)]/40" />
              <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.92_0.02_250)] to-[oklch(0.50_0.045_255)] text-sm font-bold text-background">
                  {t.author.slice(0, 1)}
                </span>
                <div>
                  <div className="text-sm font-semibold">{t.author}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t.role}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
