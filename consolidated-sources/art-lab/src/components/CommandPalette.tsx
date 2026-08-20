"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useNoiaStore } from "@/lib/store";
import { SHADERS } from "@/lib/shaders";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Palette,
  Terminal as TerminalIcon,
  Play,
  Sparkles,
  Maximize2,
  Hash,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  shortcut?: string;
  action: () => void;
  group: "navegación" | "shaders" | "acciones";
}

export function CommandPalette() {
  const open = useNoiaStore((s) => s.paletteOpen);
  const setPaletteOpen = useNoiaStore((s) => s.setPaletteOpen);
  const setViewerObraId = useNoiaStore((s) => s.setViewerObraId);
  const setActiveShader = useNoiaStore((s) => s.setActiveShader);
  const setDraft = useNoiaStore((s) => s.setDraft);
  const startTour = useNoiaStore((s) => s.startTour);
  const togglePresentationMode = useNoiaStore((s) => s.togglePresentationMode);
  const presentationMode = useNoiaStore((s) => s.presentationMode);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = [
      { id: "nav-shaders", label: "Ir a Shaders", icon: Hash, group: "navegación", action: () => scrollTo("#shaders") },
      { id: "nav-galeria", label: "Ir a Galería", icon: Hash, group: "navegación", action: () => scrollTo("#galeria") },
      { id: "nav-estudio", label: "Ir al Estudio", icon: Hash, group: "navegación", action: () => scrollTo("#estudio") },
      { id: "nav-paletas", label: "Ir a Paletas", icon: Hash, group: "navegación", action: () => scrollTo("#paletas") },
      { id: "nav-ecosistema", label: "Ir a Ecosistema", icon: Hash, group: "navegación", action: () => scrollTo("#ecosistema") },
      { id: "nav-faq", label: "Ir a FAQ", icon: Hash, group: "navegación", action: () => scrollTo("#faq") },
    ];
    const shaderCmds: Command[] = SHADERS.map((s) => ({
      id: "shader-" + s.id,
      label: `Abrir ${s.name}`,
      hint: s.nameEs,
      icon: Sparkles,
      group: "shaders",
      action: () => {
        setActiveShader(s.id);
        setDraft({ shader: s.id });
        setViewerObraId("shader-" + s.id);
      },
    }));
    const actions: Command[] = [
      {
        id: "act-tour",
        label: "Iniciar tour guiado",
        icon: Play,
        group: "acciones",
        action: () => startTour(),
      },
      {
        id: "act-present",
        label: presentationMode ? "Detener presentación" : "Modo presentación",
        icon: Maximize2,
        group: "acciones",
        action: () => togglePresentationMode(),
      },
      {
        id: "act-palette",
        label: "Generar paleta aleatoria",
        icon: Palette,
        group: "acciones",
        action: () => {
          const h = Math.floor(Math.random() * 360);
          setDraft({ hue: h / 360 });
          scrollTo("#paletas");
        },
      },
      {
        id: "act-terminal",
        label: "Abrir terminal",
        icon: TerminalIcon,
        group: "acciones",
        action: () => scrollTo("#estudio"),
      },
    ];
    return [...nav, ...shaderCmds, ...actions];
  }, [setActiveShader, setDraft, setViewerObraId, startTour, togglePresentationMode, presentationMode]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.hint?.toLowerCase().includes(q) ||
        c.group.includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  // Reset selected when filtered changes
  useEffect(() => {
    if (selected >= filtered.length) setSelected(0);
  }, [filtered, selected]);

  const run = (cmd?: Command) => {
    const c = cmd ?? filtered[selected];
    if (!c) return;
    c.action();
    setPaletteOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(filtered.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run();
    }
  };

  // Group commands for display
  const grouped = useMemo(() => {
    const g: Record<string, Command[]> = {};
    filtered.forEach((c) => {
      if (!g[c.group]) g[c.group] = [];
      g[c.group].push(c);
    });
    return g;
  }, [filtered]);

  let flatIdx = -1;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setPaletteOpen(false)}>
      <DialogContent className="glass-strong max-w-xl overflow-hidden rounded-2xl border-border/70 p-0">
        <DialogTitle className="sr-only">Paleta de comandos</DialogTitle>
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 60))}
            onKeyDown={onKey}
            placeholder="Busca un comando, shader o sección…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="rounded border border-border/60 bg-secondary/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Sin resultados para "{query}"
            </div>
          ) : (
            Object.entries(grouped).map(([group, cmds]) => (
              <div key={group} className="mb-2">
                <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {group}
                </div>
                {cmds.map((c) => {
                  flatIdx++;
                  const idx = flatIdx;
                  const isSel = idx === selected;
                  return (
                    <button
                      key={c.id}
                      onMouseEnter={() => setSelected(idx)}
                      onClick={() => run(c)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                        isSel
                          ? "bg-[oklch(0.92_0.02_250)]/15 text-foreground"
                          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      )}
                    >
                      <c.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSel ? "text-[oklch(0.92_0.02_250)]" : ""
                        )}
                      />
                      <span className="flex-1 truncate">{c.label}</span>
                      {c.hint && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {c.hint}
                        </span>
                      )}
                      {isSel && (
                        <CornerDownLeft className="h-3 w-3 text-[oklch(0.92_0.02_250)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/70 px-4 py-2 font-mono text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <ArrowDown className="h-3 w-3" />
              navegar
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              ejecutar
            </span>
          </div>
          <span>{filtered.length} comandos</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function scrollTo(selector: string) {
  document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });
}
