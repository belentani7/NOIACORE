"use client";

import { useNoiaStore } from "@/lib/store";
import { Github, Twitter, Rss, Shield, Cpu } from "lucide-react";

const COLS = [
  {
    title: "Laboratorio",
    links: [
      { label: "Shaders", href: "#shaders", external: false },
      { label: "Galería", href: "#galeria", external: false },
      { label: "Estudio", href: "#estudio", external: false },
      { label: "Paletas", href: "#paletas", external: false },
      { label: "Ecosistema", href: "#ecosistema", external: false },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "Documentación GLSL", href: "#", external: true },
      { label: "Guía de fragment shaders", href: "#", external: true },
      { label: "Referencia de paletas", href: "#paletas", external: false },
      { label: "Manifiesto Noiacore", href: "#manifiesto", external: false },
      { label: "Hoja de ruta", href: "#manifiesto", external: false },
    ],
  },
  {
    title: "Comunidad",
    links: [
      { label: "Discord del lab", href: "#", external: true },
      { label: "Obras destacadas", href: "#galeria", external: false },
      { label: "Colaboradores", href: "#", external: true },
      { label: "Newsletter semanal", href: "#", external: true },
      { label: "Código de conducta", href: "#", external: true },
    ],
  },
];

export function Footer() {
  const animationsEnabled = useNoiaStore((s) => s.animationsEnabled);
  const toggleAnimations = useNoiaStore((s) => s.toggleAnimations);

  return (
    <footer role="contentinfo" className="mt-auto border-t border-border/70 bg-[oklch(0.13_0.02_230)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative grid h-8 w-8 place-items-center">
                <span className="absolute inset-0 rotate-45 rounded-[6px] bg-gradient-to-br from-[oklch(0.92_0.02_250)] to-[oklch(0.50_0.045_255)]" />
                <span className="absolute inset-[5px] rotate-45 rounded-[3px] bg-background" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-[oklch(0.92_0.02_250)] noia-pulse" />
              </span>
              <span className="font-[family-name:var(--font-display)] text-base font-extrabold">
                noia<span className="text-[oklch(0.92_0.02_250)]">core</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Un laboratorio de arte generativo donde los shaders GLSL se
              convierten en obras que respiran en el navegador.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[Github, Twitter, Rss].map((Icon, i) => {
                const labels = ["GitHub de Noiacore", "X (Twitter) de Noiacore", "RSS de Noiacore"];
                return (
                  <a
                    key={i}
                    href="#"
                    rel="noopener noreferrer"
                    className="grid h-9 w-9 place-items-center rounded-md border border-border/60 bg-secondary/40 text-muted-foreground transition-colors hover:border-[oklch(0.92_0.02_250)]/50 hover:text-foreground focus-ring"
                    aria-label={labels[i]}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      rel={l.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-foreground/75 transition-colors hover:text-[oklch(0.92_0.02_250)] focus-ring rounded"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* bottom bar */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] text-muted-foreground">
            <span>© {new Date().getFullYear()} noiacore art lab</span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" /> identidad local
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3" /> WebGL 1.0+
            </span>
          </div>
          <button
            onClick={toggleAnimations}
            className="flex items-center gap-2 rounded-md border border-border/60 bg-secondary/40 px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                animationsEnabled ? "bg-[oklch(0.92_0.02_250)] noia-pulse" : "bg-muted-foreground/40"
              }`}
            />
            animaciones: {animationsEnabled ? "on" : "off"}
          </button>
        </div>
      </div>
    </footer>
  );
}
