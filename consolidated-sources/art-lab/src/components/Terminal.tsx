"use client";

import { useEffect, useRef, useState } from "react";
import { SHADERS } from "@/lib/shaders";
import { useNoiaStore } from "@/lib/store";
import { TerminalSquare, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Line {
  text: string;
  tone?: "out" | "ok" | "warn" | "err" | "accent" | "dim";
}

const BOOT: Line[] = [
  { text: "noiacore // núcleo generativo v3.0", tone: "accent" },
  { text: "inicializando contexto WebGL................ OK", tone: "out" },
  { text: "compilando 9 fragment shaders............... OK", tone: "ok" },
  { text: "cargando paleta del laboratorio............. OK", tone: "ok" },
  { text: "hidratando ecosistema (12 nodos)............ OK", tone: "ok" },
  { text: "enjambre sónico: standby", tone: "warn" },
  { text: "6 shaders reactivos al audio preparados..... OK", tone: "ok" },
  { text: "escribe 'ayuda' para ver los comandos.", tone: "dim" },
];

const HELP: Line[] = [
  { text: "comandos disponibles:", tone: "accent" },
  { text: "  ayuda              muestra esta ayuda", tone: "out" },
  { text: "  shaders            lista los 9 fragment shaders", tone: "out" },
  { text: "  usar <id>          activa un shader (silk, plasma...)", tone: "out" },
  { text: "  random             abre un shader al azar en el visor", tone: "out" },
  { text: "  paleta             genera una paleta aleatoria", tone: "out" },
  { text: "  obras              cuenta las obras publicadas", tone: "out" },
  { text: "  stats              métricas del laboratorio", tone: "out" },
  { text: "  fullscreen         abre el visor en modo inmersivo", tone: "out" },
  { text: "  quien              ¿quién está conectado?", tone: "out" },
  { text: "  seguir <handle>    sigue a un creador (ej: seguir iris)", tone: "out" },
  { text: "  siguiendo          lista los creadores que sigues", tone: "out" },
  { text: "  colapso            secuencia de testing visual", tone: "out" },
  { text: "  limpiar            limpia la terminal", tone: "out" },
];

export function Terminal() {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [booting, setBooting] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const setActiveShader = useNoiaStore((s) => s.setActiveShader);
  const setViewerObraId = useNoiaStore((s) => s.setViewerObraId);
  const user = useNoiaStore((s) => s.user);
  const setAuthOpen = useNoiaStore((s) => s.setAuthOpen);
  const pushNotification = useNoiaStore((s) => s.pushNotification);
  const toggleFollow = useNoiaStore((s) => s.toggleFollow);

  // Secuencia de arranque tipada
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i >= BOOT.length) {
        clearInterval(id);
        setBooting(false);
        return;
      }
      setLines((prev) => [...prev, BOOT[i]]);
      i++;
    }, 360);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const push = (l: Line | Line[]) =>
    setLines((prev) => {
      const items = (Array.isArray(l) ? l : [l]).filter(
        (x): x is Line => x != null && typeof x.text === "string"
      );
      return [...prev, ...items];
    });

  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    push({ text: `$ ${raw}`, tone: "dim" });
    if (!cmd) return;
    const [head, ...rest] = cmd.split(/\s+/);
    switch (head) {
      case "ayuda":
      case "help":
        push(HELP);
        break;
      case "shaders":
        push([{ text: "9 fragment shaders disponibles:", tone: "accent" }]);
        SHADERS.forEach((s) =>
          push({
            text: `  ${s.id.padEnd(14)} ${s.name.padEnd(14)} ${s.tag}`,
            tone: "out",
          })
        );
        break;
      case "usar":
      case "use": {
        const id = rest[0];
        const found = SHADERS.find((s) => s.id === id);
        if (found) {
          setActiveShader(found.id);
          push({ text: `shader activo → ${found.name} (${found.nameEs})`, tone: "ok" });
          push({ text: `abriendo visor...`, tone: "dim" });
          setTimeout(() => setViewerObraId("shader-" + found.id), 400);
        } else {
          push({ text: `shader no encontrado: '${id ?? ""}'`, tone: "err" });
        }
        break;
      }
      case "paleta":
        push({ text: "generando paleta...", tone: "dim" });
        setTimeout(() => {
          const h = Math.floor(Math.random() * 360);
          push({ text: `paleta base hue=${h}° → ve la sección Paletas`, tone: "ok" });
          pushNotification({
            title: "Paleta generada",
            body: `Matiz base ${h}° · harmonía tríada`,
            tone: "teal",
          });
          const el = document.getElementById("paletas");
          el?.scrollIntoView({ behavior: "smooth" });
        }, 300);
        break;
      case "obras":
        push({ text: "11 obras en la galería pública.", tone: "ok" });
        push({ text: "destacada: 'Polvo de nebulosa' — 3.5k likes", tone: "dim" });
        break;
      case "random":
      case "azar": {
        const pick = SHADERS[Math.floor(Math.random() * SHADERS.length)];
        push({ text: `shader aleatorio → ${pick.name} (${pick.nameEs})`, tone: "ok" });
        setActiveShader(pick.id);
        setTimeout(() => setViewerObraId("shader-" + pick.id), 350);
        break;
      }
      case "stats": {
        push({ text: "métricas del laboratorio:", tone: "accent" });
        push({ text: "  shaders GLSL.......... 9", tone: "out" });
        push({ text: "  reactivos al audio.... 6/9", tone: "out" });
        push({ text: "  obras publicadas...... 11", tone: "out" });
        push({ text: "  shaders compilados.... 184.3k", tone: "out" });
        push({ text: "  creadores activos..... 412", tone: "out" });
        push({ text: "  armonías de paleta..... 6", tone: "out" });
        break;
      }
      case "fullscreen":
      case "inmersivo": {
        const any = SHADERS[0];
        setActiveShader(any.id);
        setViewerObraId("shader-" + any.id);
        push({ text: "abriendo visor... pulsa F para inmersivo", tone: "dim" });
        break;
      }
      case "quien":
        if (user) {
          push({ text: `conectado como @${user.handle} (${user.name})`, tone: "ok" });
        } else {
          push({ text: "nadie conectado. usa 'entrar' para identificarte.", tone: "warn" });
        }
        break;
      case "entrar":
      case "login":
        setAuthOpen(true);
        push({ text: "abriendo modal de acceso...", tone: "dim" });
        break;
      case "seguir":
      case "follow": {
        const target = rest[0]?.replace(/^@/, "");
        if (!target) {
          push({ text: "uso: seguir <handle>  (ej: seguir iris)", tone: "err" });
          break;
        }
        if (!user) {
          push({ text: "necesitas entrar primero. usa 'entrar'.", tone: "warn" });
          break;
        }
        toggleFollow(target);
        const nowFollowing = useNoiaStore.getState().following.includes(target);
        push({
          text: nowFollowing ? `→ ahora sigues a @${target}` : `→ dejaste de seguir a @${target}`,
          tone: nowFollowing ? "ok" : "warn",
        });
        break;
      }
      case "siguiendo":
      case "following": {
        const f = useNoiaStore.getState().following;
        if (f.length === 0) {
          push({ text: "no sigues a nadie todavía. usa 'seguir <handle>'.", tone: "dim" });
        } else {
          push({ text: `sigues a ${f.length} creador(es):`, tone: "accent" });
          f.forEach((h) => push({ text: `  @${h}`, tone: "out" }));
        }
        break;
      }
      case "colapso":
        push({ text: "iniciando secuencia de colapso visual...", tone: "warn" });
        setTimeout(() => push({ text: "█▓▒░ distorsionando shaders ░▒▓█", tone: "err" }), 400);
        setTimeout(() => push({ text: "█▓▒░ hue shift +50% ░▒▓█", tone: "err" }), 900);
        setTimeout(() => push({ text: "█▓▒░ complejidad → 1.0 ░▒▓█", tone: "err" }), 1400);
        setTimeout(() => push({ text: "secuencia completada. sistema estable.", tone: "ok" }), 2000);
        break;
      case "limpiar":
      case "clear":
        setLines([]);
        break;
      default:
        push({ text: `comando desconocido: '${head}'. escribe 'ayuda'.`, tone: "err" });
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(input);
    setInput("");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-[oklch(0.13_0.02_230)] shadow-[0_0_40px_-12px_oklch(0.92_0.02_250_/_0.3)]">
      {/* title bar */}
      <div className="flex items-center gap-2 border-b border-border/70 bg-[oklch(0.16_0.02_230)] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[oklch(0.50_0.03_255)]" />
          <span className="h-3 w-3 rounded-full bg-[oklch(0.78_0.025_250)]" />
          <span className="h-3 w-3 rounded-full bg-[oklch(0.92_0.02_250)]" />
        </div>
        <div className="ml-2 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <TerminalSquare className="h-3.5 w-3.5" />
          noiacore://core/terminal
        </div>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {booting ? "arrancando..." : "listo"}
        </span>
      </div>

      {/* body */}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="scanlines relative h-[340px] cursor-text overflow-y-auto p-4 font-mono text-[12.5px] leading-relaxed sm:text-[13px]"
      >
        {lines.filter(Boolean).map((l, i) => (
          <p
            key={i}
            className={cn(
              "whitespace-pre-wrap break-words",
              l.tone === "out" && "text-foreground/90",
              l.tone === "ok" && "text-[oklch(0.92_0.02_250)]",
              l.tone === "warn" && "text-[oklch(0.78_0.025_250)]",
              l.tone === "err" && "text-[oklch(0.50_0.03_255)]",
              l.tone === "accent" && "text-[oklch(0.50_0.045_255)] neon-magenta",
              l.tone === "dim" && "text-muted-foreground"
            )}
          >
            {l.text}
          </p>
        ))}
        {!booting && (
          <form onSubmit={onSubmit} className="mt-1 flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[oklch(0.92_0.02_250)]" />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 256))}
              maxLength={256}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              aria-label="entrada de terminal"
              className="flex-1 bg-transparent text-foreground caret-[oklch(0.92_0.02_250)] outline-none placeholder:text-muted-foreground/50"
              placeholder="escribe 'ayuda' y pulsa enter…"
            />
          </form>
        )}
      </div>
    </div>
  );
}
