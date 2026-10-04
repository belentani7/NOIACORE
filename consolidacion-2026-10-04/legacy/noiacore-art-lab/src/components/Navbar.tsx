"use client";

import { useEffect, useState } from "react";
import { useNoiaStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Menu, X, Sparkles, User2, LogOut, Play, Square, Command } from "lucide-react";
import { SonicSwarmControl } from "./SonicSwarmControl";

function PresentationToggle() {
  const presentationMode = useNoiaStore((s) => s.presentationMode);
  const togglePresentationMode = useNoiaStore((s) => s.togglePresentationMode);
  return (
    <button
      onClick={togglePresentationMode}
      title={presentationMode ? "Detener presentación" : "Modo presentación"}
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors",
        presentationMode
          ? "border-[oklch(0.78_0.025_250)]/60 bg-[oklch(0.78_0.025_250)]/15 text-[oklch(0.78_0.025_250)]"
          : "border-border/60 text-muted-foreground hover:text-foreground"
      )}
    >
      {presentationMode ? (
        <>
          <Square className="h-3 w-3 fill-current" />
          <span className="hidden sm:inline">presentando</span>
        </>
      ) : (
        <>
          <Play className="h-3 w-3" />
          <span className="hidden sm:inline">presentación</span>
        </>
      )}
    </button>
  );
}

const LINKS = [
  { href: "#shaders", label: "Shaders" },
  { href: "#galeria", label: "Galería" },
  { href: "#manifiesto", label: "Manifiesto" },
  { href: "#estudio", label: "Estudio" },
  { href: "#paletas", label: "Paletas" },
  { href: "#ecosistema", label: "Ecosistema" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const user = useNoiaStore((s) => s.user);
  const setAuthOpen = useNoiaStore((s) => s.setAuthOpen);
  const signOut = useNoiaStore((s) => s.signOut);
  const collected = useNoiaStore((s) => s.collected);
  const paletteOpen = useNoiaStore((s) => s.paletteOpen);
  const setPaletteOpen = useNoiaStore((s) => s.setPaletteOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      role="banner"
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "glass-strong border-b border-border/70"
          : "border-b border-transparent"
      )}
    >
      <nav aria-label="Navegación principal" className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <a href="#top" className="group flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center">
            <span className="absolute inset-0 rotate-45 rounded-[6px] bg-gradient-to-br from-[oklch(0.92_0.02_250)] to-[oklch(0.50_0.045_255)] opacity-90 transition-transform duration-500 group-hover:rotate-[135deg]" />
            <span className="absolute inset-[5px] rotate-45 rounded-[3px] bg-background" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-[oklch(0.92_0.02_250)] noia-pulse" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-[15px] font-extrabold tracking-tight">
            noia<span className="text-[oklch(0.92_0.02_250)]">core</span>
          </span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:inline">
            art lab
          </span>
        </a>

        {/* Links desktop */}
        <div className="ml-4 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right */}
        <div className="ml-auto flex items-center gap-2">
          <SonicSwarmControl compact />
          <PresentationToggle />
          <button
            onClick={() => setPaletteOpen(!paletteOpen)}
            title="Paleta de comandos (Cmd+K)"
            className="hidden items-center gap-2 rounded-md border border-border/80 bg-secondary/40 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-[oklch(0.92_0.02_250)]/60 hover:text-foreground md:flex"
          >
            <Command className="h-3.5 w-3.5" />
            <kbd className="text-[10px]">⌘K</kbd>
          </button>
          <a
            href="#estudio"
            className="hidden items-center gap-1.5 rounded-md border border-border/80 bg-secondary/40 px-3 py-1.5 text-[13px] font-medium text-foreground/90 transition-colors hover:border-[oklch(0.92_0.02_250)]/60 hover:text-foreground sm:flex"
          >
            <Sparkles className="h-3.5 w-3.5 text-[oklch(0.78_0.025_250)]" />
            Crear obra
          </a>
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => signOut()}
                title="Cerrar sesión"
                className="flex items-center gap-2 rounded-md border border-border/80 bg-secondary/40 px-2.5 py-1.5 text-[13px] transition-colors hover:border-[oklch(0.50_0.03_255)]/60"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.92_0.02_250)] to-[oklch(0.50_0.045_255)] text-[11px] font-bold text-background">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden font-mono text-[12px] text-foreground/90 sm:inline">
                  @{user.handle}
                </span>
                <span className="hidden items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:flex">
                  {collected.length} guardadas
                </span>
                <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-[oklch(0.92_0.02_250)] px-3 py-1.5 text-[13px] font-semibold text-background transition-all hover:bg-[oklch(0.78_0.14_195)] hover:shadow-[0_0_20px_oklch(0.92_0.02_250_/_0.45)]"
            >
              <User2 className="h-3.5 w-3.5" />
              Entrar
            </button>
          )}
          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-md border border-border/80 bg-secondary/40 md:hidden"
            aria-label="Menú"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="glass-strong border-t border-border/70 md:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
